import os
import re
import difflib
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image, ImageOps, ImageFilter
from database import get_db_connection

ocr_bp = Blueprint("ocr", __name__)


# =========================================================
# IMAGE PREPROCESSING
# =========================================================
def preprocess_receipt_image(image_path):
    """
    Improve receipt image before OCR.
    """
    img = Image.open(image_path)

    # Convert to grayscale
    img = ImageOps.grayscale(img)

    # Resize image for better OCR accuracy
    w, h = img.size
    img = img.resize((w * 2, h * 2))

    # Improve contrast
    img = ImageOps.autocontrast(img)

    # Sharpen text
    img = img.filter(ImageFilter.SHARPEN)

    return img


# =========================================================
# BASIC TEXT HELPERS
# =========================================================
def normalize_text(text):
    """
    Normalize common OCR symbols.
    """
    if not text:
        return ""

    text = text.replace("|", "I")
    text = text.replace("—", "-")
    text = text.replace("–", "-")
    text = text.replace("‘", "'")
    text = text.replace("’", "'")
    text = text.replace(":", " ")

    return text.strip()


def clean_product_name(name):
    """
    Clean product name but keep useful product characters.
    """
    name = normalize_text(name)

    # Remove leading OCR garbage like ")" "*" "." etc.
    name = re.sub(r"^[^A-Za-z0-9]+", "", name)

    # Keep letters, numbers, spaces, brackets, slash, dot, dash, ampersand
    name = re.sub(r"[^A-Za-z0-9\s\(\)\-/\.&]", " ", name)

    # Remove extra spaces
    name = re.sub(r"\s+", " ", name).strip()

    return name


def title_product_name(name):
    """
    Format product name nicely.
    Example:
    sprite bottle 1.5 ltr -> Sprite Bottle 1.5 LTR
    milky cake rusk 450gm -> Milky Cake Rusk 450GM
    """
    name = clean_product_name(name)
    words = name.split()

    fixed_words = []

    for word in words:
        upper = word.upper()

        if upper in [
            "ML", "LTR", "L", "KG", "GM", "G",
            "PC", "PCS", "AAA", "AA", "MM"
        ]:
            fixed_words.append(upper)

        elif any(char.isdigit() for char in word):
            fixed_words.append(upper)

        else:
            fixed_words.append(word.capitalize())

    return " ".join(fixed_words)


# =========================================================
# NUMERIC LINE HELPERS
# =========================================================
def is_numeric_line(line):
    """
    Detect lines that contain only quantity/price numbers.

    Examples:
    1
    1 155 155
    1 2,498.00 2,522.98
    1.010 2498.00 2522.98
    """
    if not line:
        return False

    cleaned = line.replace(",", "").replace(".", "").replace(" ", "")
    return cleaned.isdigit()


def extract_numbers(line):
    """
    Extract all numbers from a line.
    """
    line = line.replace(",", "")
    return re.findall(r"\d+(?:\.\d+)?", line)


def extract_quantity(line):
    """
    Usually first number is quantity.
    """
    nums = extract_numbers(line)

    if not nums:
        return 1

    try:
        qty = int(float(nums[0]))

        if qty <= 0:
            return 1

        return qty
    except:
        return 1


def extract_price(line):
    """
    Usually last number is total price.
    """
    nums = extract_numbers(line)

    if not nums:
        return 0

    try:
        return float(nums[-1])
    except:
        return 0


# =========================================================
# RECEIPT SECTION RULES
# =========================================================
START_HEADER_WORDS = [
    "item",
    "qty",
    "quantity",
    "rate",
    "price",
    "gross",
    "total",
]


STOP_SECTION_KEYWORDS = [
    "total quantity",
    "sub total",
    "subtotal",
    "fbr charges",
    "discount",
    "tax details",
    "tax detail",
    "sale tax",
    "total tax",
    "payment method",
    "paid amount",
    "change due",
    "cashier",
    "invoice",
    "fbr invoice",
    "gst included",
    "gst",
]


JUNK_KEYWORDS = [
    # Tax / discount lines
    "tax",
    "disc",
    "discount",
    "18%",
    "18 %",
    "17%",
    "17 %",

    # Summary lines
    "total quantity",
    "sub total",
    "subtotal",
    "fbr charges",
    "sale tax",
    "total tax",
    "tax details",
    "tax detail",
    "payment method",
    "paid amount",
    "change due",
    "total",

    # Receipt header/footer
    "uan",
    "strn",
    "transaction",
    "receipt",
    "receipt no",
    "terminal",
    "employee",
    "customer",
    "cust",
    "cust name",
    "date",
    "time",
    "cashier",
    "invoice",
    "fbr",
    "pos",
    "gst",
    "jalal sons",
    "information",

    # Store policy footer
    "open",
    "days/week",
    "friday",
    "break",
    "refund",
    "exchange",
    "please",
    "bring",
    "terms",
    "condition",
    "prices are inclusive",

    # Service charges
    "fbr pos",
    "pos service",
    "service charges",
    "service charge",
]


def is_header_line(line):
    """
    Detect receipt item-table header.
    Examples:
    Item QTY Rate Total
    ITEM NAME QTY PRICE GROSS TOTAL
    """
    lower = line.lower()

    hits = 0
    for word in START_HEADER_WORDS:
        if word in lower:
            hits += 1

    return hits >= 2


def is_stop_line(line):
    """
    Detect where product section ends.
    """
    lower = line.lower()

    for keyword in STOP_SECTION_KEYWORDS:
        if keyword in lower:
            return True

    return False


def is_separator_line(line):
    """
    Detect ====== or ------ lines.
    """
    lower = line.lower().strip()

    if not lower:
        return True

    return bool(re.match(r"^[=\-\_\.\s]+$", lower))


def is_junk_line(line):
    """
    Remove non-product lines.
    """
    lower = line.lower().strip()

    if not lower:
        return True

    if len(lower) <= 2:
        return True

    if is_separator_line(lower):
        return True

    # Remove known receipt keywords
    for keyword in JUNK_KEYWORDS:
        if keyword in lower:
            return True

    # Remove dates like 5/23/2026
    if re.search(r"\d{1,2}/\d{1,2}/\d{2,4}", lower):
        return True

    # Remove times like 10:22 PM
    if re.search(r"\d{1,2}:\d{2}", lower):
        return True

    # Remove long IDs, phone numbers, tax numbers
    digits = re.sub(r"\D", "", lower)
    if len(digits) >= 9:
        return True

    return False


def is_ocr_garbage_product(line):
    """
    Reject OCR garbage such as:
    Tit Ee Ee Ee See Wee Ss
    Ee Ee Ee
    I I I I
    """
    line = clean_product_name(line)
    words = line.split()

    if not words:
        return True

    # Too many small words usually means OCR garbage
    small_words = [w for w in words if len(w) <= 2]

    if len(words) >= 4:
        small_ratio = len(small_words) / len(words)

        if small_ratio >= 0.55:
            return True

    # Repeated tiny words
    tiny_words = [w.lower() for w in words if len(w) <= 3]

    if len(tiny_words) >= 4:
        unique_tiny = set(tiny_words)

        if len(unique_tiny) <= 3:
            return True

    # Product should have at least one meaningful word
    useful_words = [w for w in words if len(w) >= 4]

    if not useful_words:
        return True

    return False


def looks_like_product_name(line):
    """
    Final check whether line looks like product name.
    """
    line = clean_product_name(line)

    if not line:
        return False

    if is_junk_line(line):
        return False

    if is_numeric_line(line):
        return False

    if is_ocr_garbage_product(line):
        return False

    letters = re.findall(r"[A-Za-z]", line)
    digits = re.findall(r"\d", line)

    # Product must contain letters
    if len(letters) < 3:
        return False

    # Avoid mostly numeric lines
    if len(digits) > len(letters):
        return False

    # Avoid very long OCR garbage
    if len(line) > 85:
        return False

    return True


# =========================================================
# CATALOG MATCHING
# =========================================================
def find_best_catalog_match(scanned_name, catalog_items):
    """
    Match catalog only for category/unit.

    Important:
    We DO NOT use catalog name as final product name unless match is exact/very strong.
    This prevents:
    Prem Butter Cookies -> Cake
    """
    if not scanned_name:
        return None, 0

    scanned_clean = clean_product_name(scanned_name).lower()

    best_item = None
    best_score = 0

    for item in catalog_items:
        catalog_name = item.get("item_name", "")
        catalog_clean = clean_product_name(catalog_name).lower()

        if not catalog_clean:
            continue

        # Exact match
        if catalog_clean == scanned_clean:
            return item, 1.0

        # Strong direct substring match
        if catalog_clean in scanned_clean or scanned_clean in catalog_clean:
            return item, 0.95

        # Fuzzy similarity
        score = difflib.SequenceMatcher(None, scanned_clean, catalog_clean).ratio()

        # Token overlap
        scanned_tokens = set(scanned_clean.split())
        catalog_tokens = set(catalog_clean.split())

        if scanned_tokens and catalog_tokens:
            overlap = len(scanned_tokens.intersection(catalog_tokens)) / max(len(catalog_tokens), 1)
            score = max(score, overlap)

        if score > best_score:
            best_score = score
            best_item = item

    return best_item, best_score


# =========================================================
# PRODUCT SECTION EXTRACTION
# =========================================================
def extract_product_section_lines(raw_text):
    """
    Extract only product table lines.
    Everything before Item/QTY/Rate/Total is ignored.
    Everything after Total Quantity/Subtotal/Tax is ignored.
    """
    lines = [normalize_text(line) for line in raw_text.split("\n")]
    lines = [line for line in lines if line.strip()]

    has_header = any(is_header_line(line) for line in lines)

    product_lines = []
    inside_items = not has_header

    for line in lines:
        lower = line.lower()

        # Start product section
        if not inside_items and is_header_line(line):
            inside_items = True
            continue

        if not inside_items:
            continue

        # Stop product section
        if is_stop_line(line):
            break

        product_lines.append(line)

    return product_lines


# =========================================================
# MAIN RECEIPT PARSER
# =========================================================
def parse_receipt_items(raw_text, catalog_items):
    section_lines = extract_product_section_lines(raw_text)

    detected_items = []
    pending_item = None

    for original_line in section_lines:
        line = clean_product_name(original_line)

        if not line:
            continue

        # Skip tax/discount/service/footer/header junk
        if is_junk_line(line):
            continue

        # Numeric line belongs to previous product
        # Example: product line then next line = 1 998.00 998.00
        if is_numeric_line(line):
            if pending_item:
                pending_item["quantity"] = extract_quantity(line)
                pending_item["price"] = extract_price(line)
                detected_items.append(pending_item)
                pending_item = None

            continue

        # Product name line
        if looks_like_product_name(line):

            # Save previous product if OCR did not provide numeric line
            if pending_item:
                detected_items.append(pending_item)

            best_match, match_score = find_best_catalog_match(line, catalog_items)

            scanned_name = title_product_name(line)

            # Use catalog only for category/unit when confidence is good
            if best_match and match_score >= 0.85:
                category = best_match.get("category", "Other")
                unit = best_match.get("consumption_unit", "Pcs")
                matched_catalog = True
            else:
                category = "Other"
                unit = "Pcs"
                matched_catalog = False

            pending_item = {
                "id": f"scanned-{len(detected_items)}",
                "name": scanned_name,
                "category": category,
                "quantity": 1,
                "unit": unit,
                "price": 0,
                "raw_line": original_line,
                "matched_catalog": matched_catalog,
                "catalog_score": round(match_score, 2) if best_match else 0,
            }

    # Add final pending item
    if pending_item:
        detected_items.append(pending_item)

    # Remove duplicates
    unique_items = []
    seen = set()

    for item in detected_items:
        key = re.sub(r"\s+", " ", item["name"].lower().strip())

        if key in seen:
            continue

        seen.add(key)
        item["id"] = f"scanned-{len(unique_items)}"
        unique_items.append(item)

    return unique_items


# =========================================================
# FLASK ROUTE
# =========================================================
@ocr_bp.route("/scan-receipt", methods=["POST"])
def scan_receipt():
    if "receipt" not in request.files:
        return jsonify({
            "success": False,
            "error": "No image file provided"
        }), 400

    file = request.files["receipt"]

    if file.filename == "":
        return jsonify({
            "success": False,
            "error": "Empty filename"
        }), 400

    temp_path = None

    try:
        # Fetch product catalog from DB
        conn = get_db_connection()

        try:
            catalog_rows = conn.execute("""
                SELECT item_name, category, consumption_unit
                FROM product_catalog
            """).fetchall()

            catalog_items = [dict(row) for row in catalog_rows]

        except Exception as db_error:
            print(f"Catalog DB Error: {db_error}")
            catalog_items = []

        finally:
            conn.close()

        # Save uploaded image temporarily
        filename = secure_filename(file.filename)
        temp_path = f"/tmp/{filename}"
        file.save(temp_path)

        # Preprocess image
        img = preprocess_receipt_image(temp_path)

        # OCR config
        # psm 6 = assume one uniform block of text
        custom_config = r"--oem 3 --psm 6"
        raw_text = pytesseract.image_to_string(img, config=custom_config)

        # Parse receipt items
        detected_items = parse_receipt_items(raw_text, catalog_items)

        return jsonify({
            "success": True,
            "items": detected_items,
            "raw_text": raw_text,
            "debug_product_lines": extract_product_section_lines(raw_text),
        })

    except Exception as e:
        print(f"OCR Error: {e}")

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)