import sqlite3

DB_NAME = "grocery.db"

# ------------------ HELPER ------------------
def usage(qty, days=1):
    avg = round(qty / days, 4)
    return (avg, qty, days)

# ------------------ FULL DATASET ------------------
dataset = [
    # --- STAPLES ---
    (1001, "Wheat Flour (Atta)", 0.25, "Staples", "Vegan"),
    (1002, "Super Basmati Rice", 0.15, "Staples", "Vegan"),
    (1003, "Sugar (Cheeni)", 0.04, "Staples", "Vegan"),
    (1004, "Brown Sugar", usage(1, 60), "Staples", "Vegan"),
    (1005, "Cooking Oil", 0.06, "Staples", "Vegan"),
    (1006, "Ghee (Desi)", usage(1, 45), "Staples", "Non-Vegan"),

    # --- PULSES ---
    (1007, "Daal Chana", usage(0.25, 10), "Pulses", "Vegan"), 
    (1008, "Daal Masoor", usage(0.25, 10), "Pulses", "Vegan"),
    (1009, "Daal Moong", usage(0.25, 10), "Pulses", "Vegan"),
    (1010, "Daal Mash", usage(0.25, 10), "Pulses", "Vegan"),
    (1011, "White Chana (Chickpeas)", usage(0.5, 10), "Pulses", "Vegan"),
    (1012, "Lobia (Black Eyed Peas)", usage(0.5, 20), "Pulses", "Vegan"),
    (1013, "Rajma (Kidney Beans)", usage(0.5, 20), "Pulses", "Vegan"),

    # --- DAIRY & BREAKFAST ---
    (1015, "Fresh Milk", 0.5, "Dairy", "Non-Vegan"), 
    (1016, "Yogurt (Dahi)", 0.2, "Dairy", "Non-Vegan"), 
    (1017, "Eggs (Desi/Farm)", usage(1, 1), "Dairy", "Non-Vegan"), # 1 Egg/Day
    (1018, "Bread (Large)", usage(1, 4), "Bakery", "Vegan"), 
    (1019, "Butter", usage(1, 20), "Dairy", "Non-Vegan"), 
    (1020, "Cream", usage(1, 10), "Dairy", "Non-Vegan"),
    (1021, "Rusks", usage(1, 7), "Bakery", "Vegan"), 
    (1022, "Cheese Slices", usage(1, 14), "Dairy", "Non-Vegan"),
    (1023, "Paneer", usage(0.25, 10), "Dairy", "Non-Vegan"),
    (1024, "Khoya/Mawa", usage(0.25, 45), "Dairy", "Non-Vegan"),
    (1025, "Milk Powder", usage(1, 45), "Dairy", "Non-Vegan"),

    # --- CONDIMENTS ---
    (1075, "Jam", usage(1, 30), "Condiments", "Vegan"), 
    (1076, "Honey", usage(1, 45), "Condiments", "Non-Vegan"), 
    (1077, "Peanut Butter", usage(1, 45), "Condiments", "Vegan"),
    (1078, "Nutella", usage(1, 45), "Condiments", "Non-Vegan"),
    (1079, "Ketchup", usage(1, 30), "Condiments", "Vegan"), 
    (1080, "Pickles (Achar)", usage(1, 60), "Condiments", "Vegan"),
    (1081, "Chutney (Imli)", usage(1, 45), "Condiments", "Vegan"),
    (1082, "Mayo", usage(1, 40), "Condiments", "Non-Vegan"),
    (1083, "Soy Sauce", usage(1, 90), "Condiments", "Vegan"),
    (1084, "Vinegar", usage(1, 90), "Condiments", "Vegan"),

    # --- VEGETABLES ---
    (1026, "Potato (Aloo)", 0.15, "Vegetables", "Vegan"),
    (1027, "Onion (Pyaz)", 0.1, "Vegetables", "Vegan"),
    (1028, "Tomato", 0.1, "Vegetables", "Vegan"),
    (1029, "Green Pepper (Shimla Mirch)", 0.03, "Vegetables", "Vegan"),
    (1030, "Carrot (Gajar)", usage(0.25, 5), "Vegetables", "Vegan"),
    (1031, "Cabbage (Patta Gobhi)", usage(0.5, 10), "Vegetables", "Vegan"),
    (1032, "Cauliflower (Phool Gobhi)", usage(0.5, 10), "Vegetables", "Vegan"),
    (1033, "Okra (Bhindi)", usage(0.5, 10), "Vegetables", "Vegan"),
    (1034, "Eggplant (Baingan)", usage(0.5, 10), "Vegetables", "Vegan"),
    (1035, "Pumpkin (Kaddu)", usage(0.5, 15), "Vegetables", "Vegan"),
    (1036, "Bitter Gourd (Karela)", usage(0.5, 20), "Vegetables", "Vegan"),
    (1037, "Bottle Gourd (Lauki)", usage(0.5, 10), "Vegetables", "Vegan"),
    (1038, "Spinach (Palak)", usage(0.25, 7), "Vegetables", "Vegan"),
    (1039, "Turnip (Shalgam)", usage(0.5, 20), "Vegetables", "Vegan"),
    (1040, "Radish (Mooli)", usage(0.5, 15), "Vegetables", "Vegan"),
    (1041, "Peas (Matar)", usage(0.5, 10), "Vegetables", "Vegan"),
    (1042, "Green Beans (Beans)", usage(0.5, 10), "Vegetables", "Vegan"),

    # --- GARNISHES ---
    (1043, "Ginger (Adrak)", 0.005, "Vegetables", "Vegan"),
    (1044, "Garlic (Lehsan)", 0.005, "Vegetables", "Vegan"),
    (1045, "Green Chilies", 0.005, "Vegetables", "Vegan"),
    (1046, "Coriander Leaves", usage(1, 4), "Vegetables", "Vegan"), 
    (1047, "Mint Leaves (Pudina)", usage(1, 10), "Vegetables", "Vegan"),
    (1048, "Curry Leaves", usage(1, 20), "Vegetables", "Vegan"),
    (1049, "Lemon", usage(1, 2), "Vegetables", "Vegan"), 

    # --- FRUITS (UPDATED UNITS: DOZEN/KG) ---
    # Logic: 2 pieces/day = ~1 Dozen every 6 days per person
    (1050, "Banana", usage(1, 6), "Fruits", "Vegan"), 
    (1051, "Apple", usage(1, 6), "Fruits", "Vegan"), 
    (1052, "Orange", usage(1, 6), "Fruits", "Vegan"),
    (1053, "Mango (Seasonal)", usage(0.5, 3), "Fruits", "Vegan"), # KG
    (1054, "Grapes", usage(0.25, 3), "Fruits", "Vegan"), # KG
    (1055, "Watermelon", usage(1, 10), "Fruits", "Vegan"), # Whole Piece
    (1056, "Pomegranate (Anar)", usage(0.5, 3), "Fruits", "Vegan"), # KG
    (1057, "Papaya (Papita)", usage(1, 7), "Fruits", "Vegan"), # Piece
    (1058, "Guava (Amrood)", usage(0.5, 3), "Fruits", "Vegan"), # KG
    (1059, "Kinnow", usage(1, 6), "Fruits", "Vegan"), # Dozen

    # --- MEAT ---
    (1060, "Chicken (Meat)", usage(1, 5), "Meat", "Non-Vegan"),
    (1061, "Beef (Boneless)", usage(1, 10), "Meat", "Non-Vegan"),
    (1062, "Mutton", usage(1, 20), "Meat", "Non-Vegan"),
    (1063, "Fish", usage(0.5, 10), "Meat", "Non-Vegan"),
    (1064, "Prawns/Shrimp", usage(0.5, 20), "Meat", "Non-Vegan"),
    (1065, "Mince (Qeema)", usage(0.5, 7), "Meat", "Non-Vegan"),
    (1066, "Chicken Tikka (Boneless)", usage(0.5, 10), "Meat", "Non-Vegan"),

    # --- BEVERAGES ---
    (1067, "Tea Leaves (Tapal/Lipton)", usage(1, 30), "Beverages", "Vegan"), 
    (1068, "Green Tea", usage(1, 40), "Beverages", "Vegan"), 
    (1069, "Rooh Afza", usage(1, 45), "Beverages", "Vegan"), 
    (1070, "Coffee", usage(1, 45), "Beverages", "Vegan"), 
    (1071, "Juice (Tetra Pack)", usage(1, 7), "Beverages", "Vegan"), 
    (1072, "Cola/Soft Drink", usage(1, 10), "Beverages", "Vegan"),
    (1073, "Energy Drink", usage(1, 14), "Beverages", "Vegan"),
    (1074, "Mineral Water (Bottle)", usage(1, 3), "Beverages", "Vegan"),

    # --- SPICES ---
    (1075, "Red Chili Powder", usage(1, 60), "Spices", "Vegan"), 
    (1076, "Turmeric (Haldi)", usage(1, 90), "Spices", "Vegan"),
    (1077, "Coriander Powder (Dhania)", usage(1, 60), "Spices", "Vegan"),
    (1078, "Cumin Seeds (Zeera)", usage(1, 90), "Spices", "Vegan"),
    (1079, "Cumin Powder", usage(1, 60), "Spices", "Vegan"),
    (1080, "Garam Masala", usage(1, 60), "Spices", "Vegan"),
    (1081, "Salt", usage(1, 80), "Spices", "Vegan"),
    (1082, "Black Pepper", usage(1, 120), "Spices", "Vegan"),
    (1083, "Biryani Masala", usage(1, 30), "Spices", "Vegan"),
    (1084, "Chaat Masala", usage(1, 120), "Spices", "Vegan"),
    (1085, "Bay Leaves (Tez Patta)", usage(1, 120), "Spices", "Vegan"),
    (1086, "Cloves (Loung)", usage(1, 180), "Spices", "Vegan"),
    (1087, "Cardamom (Elaichi)", usage(1, 120), "Spices", "Vegan"),
    (1088, "Cinnamon (Darchini)", usage(1, 120), "Spices", "Vegan"),
    (1089, "Mustard Seeds (Rai)", usage(1, 120), "Spices", "Vegan"),
    (1090, "Fenugreek (Methi Dana)", usage(1, 180), "Spices", "Vegan"),
    (1091, "Dried Fenugreek Leaves (Kasuri Methi)", usage(1, 120), "Spices", "Vegan"),
    (1092, "Fennel Seeds (Saunf)", usage(1, 90), "Spices", "Vegan"),
    (1093, "Carom Seeds (Ajwain)", usage(1, 120), "Spices", "Vegan"),
    (1094, "Paprika", usage(1, 120), "Spices", "Vegan"),
    (1095, "Chili Flakes", usage(1, 90), "Spices", "Vegan"),

    # --- SNACKS ---
    (1096, "Biscuits", usage(1, 5), "Snacks", "Vegan"),
    (1097, "Chips", usage(1, 7), "Snacks", "Vegan"),
    (1098, "Cookies", usage(1, 10), "Snacks", "Vegan"),
    (1099, "Namkeen", usage(1, 10), "Snacks", "Vegan"),
    (1100, "Popcorn", usage(1, 14), "Snacks", "Vegan"),
    (1101, "Nuts Mix", usage(1, 20), "Snacks", "Vegan"),
    (1102, "Dates (Khajoor)", usage(1, 30), "Snacks", "Vegan"),
    (1103, "Almonds (Badam)", usage(1, 45), "Snacks", "Vegan"),
    (1104, "Cashews (Kaju)", usage(1, 45), "Snacks", "Vegan"),
    (1105, "Raisins (Kishmish)", usage(1, 45), "Snacks", "Vegan"),

    # --- BAKERY & PASTA ---
    (1106, "Frozen Paratha", usage(1, 10), "Bakery", "Vegan"),
    (1107, "Naan", usage(2, 7), "Bakery", "Vegan"), 
    (1108, "Roti", usage(4, 7), "Bakery", "Vegan"), 
    (1109, "Bun", usage(2, 7), "Bakery", "Vegan"),
    (1110, "Cake", usage(1, 20), "Bakery", "Non-Vegan"),
    (1111, "Pasta", usage(1, 20), "Staples", "Vegan"), 
    (1112, "Macaroni", usage(1, 20), "Staples", "Vegan"),
    (1113, "Vermicelli (Seviyan)", usage(1, 30), "Staples", "Vegan"),
    (1114, "Instant Noodles", usage(1, 10), "Snacks", "Vegan"),
    (1115, "Spaghetti", usage(1, 20), "Staples", "Vegan"),

    # --- CEREALS ---
    (1116, "Corn Flakes", usage(1, 20), "Breakfast", "Vegan"),
    (1117, "Oats", usage(1, 20), "Breakfast", "Vegan"),
    (1118, "Muesli", usage(1, 30), "Breakfast", "Vegan"),
    (1119, "Suji (Semolina)", usage(1, 30), "Staples", "Vegan"),
    (1120, "Besan (Gram Flour)", usage(1, 30), "Staples", "Vegan"),
    (1121, "Maida (All-purpose Flour)", usage(1, 45), "Staples", "Vegan"),
    (1122, "Corn Flour", usage(1, 45), "Staples", "Vegan"),
]

# ADDITIONAL NON-FOOD ITEMS
additional_items = [
    (2001, "Bath Soap", usage(1, 7), "Personal Care", "Non-Food"),
    (2002, "Shampoo", usage(1, 45), "Personal Care", "Non-Food"), 
    (2003, "Conditioner", usage(1, 60), "Personal Care", "Non-Food"),
    (2004, "Toothpaste", usage(1, 45), "Personal Care", "Non-Food"),
    (2005, "Toothbrush", usage(1, 90), "Personal Care", "Non-Food"),
    (2006, "Shaving Razor", usage(1, 20), "Personal Care", "Non-Food"),
    (2007, "Shaving Cream", usage(1, 60), "Personal Care", "Non-Food"),
    (2008, "Face Wash", usage(1, 45), "Personal Care", "Non-Food"),
    (2009, "Body Lotion", usage(1, 45), "Personal Care", "Non-Food"),
    (2010, "Hair Oil", usage(1, 45), "Personal Care", "Non-Food"),
    (2011, "Deodorant", usage(1, 60), "Personal Care", "Non-Food"),
    (2012, "Hand Sanitizer", usage(1, 45), "Personal Care", "Non-Food"),
    (2013, "Hand Wash", usage(1, 30), "Personal Care", "Non-Food"),
    (2014, "Talcum Powder", usage(1, 60), "Personal Care", "Non-Food"),
    (2015, "Cotton Swabs", usage(1, 60), "Personal Care", "Non-Food"),
    
    (2020, "Laundry Detergent Powder", usage(1, 40), "Cleaning", "Non-Food"),
    (2021, "Fabric Softener", usage(1, 60), "Cleaning", "Non-Food"),
    (2022, "Dishwashing Liquid", usage(1, 30), "Cleaning", "Non-Food"),
    (2023, "Dishwashing Bar", usage(1, 30), "Cleaning", "Non-Food"),
    (2024, "Toilet Cleaner", usage(1, 60), "Cleaning", "Non-Food"),
    (2025, "Floor Cleaner (Phenyl)", usage(1, 60), "Cleaning", "Non-Food"),
    (2026, "Glass Cleaner", usage(1, 90), "Cleaning", "Non-Food"),
    (2027, "Bleach", usage(1, 90), "Cleaning", "Non-Food"),
    (2028, "Disinfectant Spray", usage(1, 60), "Cleaning", "Non-Food"),
    (2029, "Air Freshener", usage(1, 60), "Cleaning", "Non-Food"),
    (2030, "Scrub Pad", usage(1, 30), "Cleaning", "Non-Food"),
    (2031, "Cleaning Cloth", usage(1, 60), "Cleaning", "Non-Food"),
    (2035, "Garbage Bags (Small)", usage(1, 20), "Cleaning", "Non-Food"),
    (2036, "Garbage Bags (Large)", usage(1, 30), "Cleaning", "Non-Food"),
    
    (2040, "Tissues (Box)", usage(1, 20), "Household", "Non-Food"),
    (2041, "Toilet Paper Roll", usage(1, 10), "Household", "Non-Food"), 
    (2042, "Kitchen Towel (Roll)", usage(1, 20), "Household", "Non-Food"),
    (2043, "Aluminum Foil", usage(1, 30), "Household", "Non-Food"),
    (2044, "Cling Film", usage(1, 60), "Household", "Non-Food"),
    (2045, "Ziplock Bags", usage(1, 60), "Household", "Non-Food"),
    (2046, "Matchbox", usage(1, 60), "Household", "Non-Food"),
    (2047, "Candles", usage(2, 60), "Household", "Non-Food"),
    (2048, "Lighter", usage(1, 120), "Household", "Non-Food"),
    (2049, "Mosquito Coil", usage(1, 20), "Household", "Non-Food"), 
    (2050, "Mosquito Repellent (Liquid)", usage(1, 60), "Household", "Non-Food"),
    (2051, "Insect Spray", usage(1, 90), "Household", "Non-Food"),
    (2052, "Light Bulbs", usage(1, 365), "Household", "Non-Food"),
    (2053, "Batteries (AA)", usage(4, 120), "Household", "Non-Food"),
    (2054, "Batteries (AAA)", usage(4, 120), "Household", "Non-Food"),
]

catalog_items = dataset + additional_items

# ------------------ INFER UNIT (UPDATED for Fruit) ------------------
def infer_unit(name: str) -> str:
    lower = name.lower()

    # 1. SPECIAL PACKS
    if "foil" in lower: return "pack"
    if any(x in lower for x in ["film", "wrap", "paper roll", "towel roll"]): return "roll"
    if "batteries" in lower: return "pack"

    # 2. FRUIT UNITS (The New Logic)
    if any(x in lower for x in ["banana", "orange", "kinnow"]): return "dozen"
    if any(x in lower for x in ["grapes", "mango", "pomegranate", "guava", "apple"]): return "kg"
    if any(x in lower for x in ["watermelon", "papaya"]): return "piece"

    # 3. BOTTLES / JARS
    if any(x in lower for x in ["shampoo", "conditioner", "liquid", "cleaner", "wash", "ketchup", 
                                "mayo", "sauce", "lotion", "sanitizer", "spray", "freshener", 
                                "vinegar", "juice", "cola", "drink", "water", "honey", "jam", 
                                "pickle", "repellent", "butter", "nutella", "chutney", "oil", 
                                "syrup", "bottle", "jar"]):
        if "peanut butter" in lower or "nutella" in lower or "jam" in lower or "honey" in lower:
            return "jar"
        if "toothpaste" in lower or "cream" in lower:
            return "tube"
        return "bottle"

    # 4. PACKETS / BOXES
    if any(x in lower for x in ["tea", "coffee", "masala", "powder", "salt", "surf", "detergent", 
                                "spice", "haldi", "chili", "turmeric", "cumin", "coriander", 
                                "flour", "besan", "maida", "corn flour", "suji", "oats", "sugar", 
                                "nuts", "almonds", "cashew", "raisin", "dates", "bread", "rusk", 
                                "biscuit", "cookie", "tissue", "box", "cotton", "matchbox", 
                                "chips", "namkeen", "noodles", "pasta", "macaroni", "frozen", 
                                "coil", "bag"]):
        if "tissue" in lower or "matchbox" in lower or "coil" in lower:
            return "box"
        return "packet"

    # 5. PIECES
    if any(x in lower for x in ["egg", "paratha", "naan", "roti", "toothbrush", "razor", 
                                "soap", "bar", "lemon", "candle", "bulb", "broom", "mop", 
                                "cloth", "pad", "bun", "cake"]):
        return "pieces"

    # 6. BUNCHES
    if any(x in lower for x in ["coriander leaves", "mint", "curry leaves", "spinach"]):
        return "bunch"

    # 7. LITERS
    if "milk" in lower and "powder" not in lower:
        return "liters"

    return "kg"

def reset_catalog_schema():
    print(f"🔧 Connecting to database: {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    print("⚠️  Dropping old 'product_catalog' table...")
    c.execute("DROP TABLE IF EXISTS product_catalog")

    print("✨ Creating new 'product_catalog' table...")
    c.execute("""
        CREATE TABLE product_catalog (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            daily_consumption_per_person REAL,
            consumption_unit TEXT,
            category TEXT,
            diet_type TEXT,
            default_freq_qty REAL DEFAULT 1,
            default_freq_days REAL DEFAULT 1
        )
    """)

    print(f"📦 Seeding {len(catalog_items)} items...")
    count = 0
    for _, name, consumption, category, diet_type in catalog_items:
        unit = infer_unit(name)
        
        if isinstance(consumption, tuple):
            daily_rate, freq_qty, freq_days = consumption
        else:
            daily_rate = consumption
            freq_qty = consumption
            freq_days = 1.0

        c.execute("""
            INSERT INTO product_catalog 
            (item_name, daily_consumption_per_person, consumption_unit, category, diet_type, 
             default_freq_qty, default_freq_days)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, daily_rate, unit, category, diet_type, freq_qty, freq_days))
        count += 1

    conn.commit()
    conn.close()
    print(f"✅ Success! Fruits now use Dozen/KG. 'Small Packet' text removed.")

if __name__ == "__main__":
    reset_catalog_schema()