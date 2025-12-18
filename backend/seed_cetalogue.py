import sqlite3

DB_NAME = "grocery.db"

# ------------------ HELPER: FREQUENCY CALCULATOR ------------------
def usage(qty, days=1):
    """
    Converts 'Quantity per X Days' into 'Daily Consumption'.
    Example: 
      - usage(1, 7)  -> 1 packet every 7 days (Weekly)
      - usage(1, 30) -> 1 bottle every 30 days (Monthly)
    """
    return round(qty / days, 4)

# ------------------ Main Food Dataset ------------------
dataset = [
    # --- STAPLES (Daily Use) ---
    (1001, "Wheat Flour (Atta)", 0.3, "Staples", "Vegan"),
    (1002, "Super Basmati Rice", 0.15, "Staples", "Vegan"),
    (1003, "Sugar (Cheeni)", 0.05, "Staples", "Vegan"),
    
    # --- PULSES (Weekly Use) ---
    # Logic: You cook this specific daal maybe once a week?
    (1007, "Daal Chana", usage(0.25, 7), "Pulses", "Vegan"), # 250g once a week
    (1008, "Daal Masoor", usage(0.25, 7), "Pulses", "Vegan"),
    (1009, "Daal Moong", usage(0.25, 7), "Pulses", "Vegan"),
    (1010, "Daal Mash", usage(0.25, 7), "Pulses", "Vegan"),
    (1011, "White Chana (Chickpeas)", usage(0.5, 7), "Pulses", "Vegan"), # 500g once a week (heavy dish)
    
    # --- DAIRY & BREAKFAST ---
    (1015, "Fresh Milk", 0.5, "Dairy", "Non-Vegan"), # Daily
    (1016, "Yogurt (Dahi)", 0.2, "Dairy", "Non-Vegan"), # Daily
    (1017, "Eggs (Desi/Farm)", 1.5, "Dairy", "Non-Vegan"), # Daily
    (1018, "Bread (Large)", usage(1, 4), "Bakery", "Vegan"), # 1 Packet every 4 days
    (1021, "Rusks", usage(1, 7), "Bakery", "Vegan"), # 1 Packet lasts a week
    (1019, "Butter", usage(1, 14), "Dairy", "Non-Vegan"), # 1 Block lasts 2 weeks
    (1022, "Cheese Slices", usage(1, 10), "Dairy", "Non-Vegan"), # 1 Pack lasts 10 days

    # --- CONDIMENTS (Monthly/Long-term Use) ---
    (1075, "Jam", usage(1, 20), "Bakery", "Vegan"), # 1 Jar lasts 20 days
    (1076, "Honey", usage(1, 30), "Bakery", "Non-Vegan"), # 1 Jar lasts a month
    (1080, "Pickles (Achar)", usage(1, 45), "Condiments", "Vegan"), # 1 Jar lasts 1.5 months

    # --- VEGETABLES (Daily/Bi-Daily) ---
    (1026, "Potato (Aloo)", 0.2, "Vegetables", "Vegan"),
    (1027, "Onion (Pyaz)", 0.15, "Vegetables", "Vegan"),
    (1028, "Tomato", 0.15, "Vegetables", "Vegan"),
    
    # --- OCCASIONAL VEGETABLES (Weekly) ---
    (1033, "Okra (Bhindi)", usage(0.5, 7), "Vegetables", "Vegan"), # Cooked once a week
    (1034, "Eggplant (Baingan)", usage(0.5, 7), "Vegetables", "Vegan"),
    (1031, "Cabbage (Patta Gobhi)", usage(0.5, 7), "Vegetables", "Vegan"),
    (1032, "Cauliflower (Phool Gobhi)", usage(0.5, 7), "Vegetables", "Vegan"),
    
    # --- GARNISHES (Small daily amounts) ---
    (1036, "Ginger (Adrak)", 0.01, "Vegetables", "Vegan"),
    (1037, "Garlic (Lehsan)", 0.01, "Vegetables", "Vegan"),
    (1038, "Green Chilies", 0.01, "Vegetables", "Vegan"),
    (1039, "Coriander Leaves", usage(1, 3), "Vegetables", "Vegan"), # 1 Bunch every 3 days
    (1040, "Lemon", usage(1, 2), "Vegetables", "Vegan"), # 1 Lemon every 2 days

    # --- FRUITS ---
    (1041, "Banana", 1.5, "Fruits", "Vegan"), # Daily
    (1042, "Apple", 0.2, "Fruits", "Vegan"), # Daily

    # --- MEAT (Frequency based) ---
    (1048, "Chicken (Meat)", usage(1, 3), "Meat", "Non-Vegan"), # 1kg every 3 days
    (1049, "Beef (Boneless)", usage(1, 7), "Meat", "Non-Vegan"), # 1kg once a week
    (1050, "Mutton", usage(1, 14), "Meat", "Non-Vegan"), # 1kg every 2 weeks (expensive/heavy)
    (1051, "Fish", usage(1, 10), "Meat", "Non-Vegan"),

    # --- BEVERAGES ---
    (1053, "Tea Leaves (Tapal/Lipton)", usage(1, 15), "Beverages", "Vegan"), # 1 Pack lasts 15 days
    (1054, "Green Tea", usage(1, 20), "Beverages", "Vegan"), 
    (1055, "Rooh Afza", usage(1, 30), "Beverages", "Vegan"), # Monthly
    (1056, "Coffee", usage(1, 30), "Beverages", "Vegan"), # Monthly

    # --- SPICES (Long Term Use) ---
    (1058, "Red Chili Powder", usage(1, 30), "Spices", "Vegan"), # 1 Pack/Month
    (1059, "Turmeric (Haldi)", usage(1, 45), "Spices", "Vegan"), # 1 Pack/1.5 Months
    (1062, "Salt", usage(1, 40), "Spices", "Vegan"),
    (1064, "Biryani Masala", usage(1, 14), "Spices", "Vegan"), # Used once every 2 weeks
    (1065, "Chaat Masala", usage(1, 60), "Spices", "Vegan"), # Lasts 2 months

    # --- SNACKS ---
    (1069, "Biscuits", usage(1, 3), "Snacks", "Vegan"), # 1 Pack every 3 days
    (1070, "Chips", usage(1, 5), "Snacks", "Vegan"),
    (1078, "Frozen Paratha", usage(1, 7), "Bakery", "Vegan"), # 1 Pack (of 5) lasts a week
]

# ------------------ Additional Household (Non-Daily) ------------------
additional_items = [
    # PERSONAL CARE
    (2001, "Bath Soap", usage(1, 10), "Personal Care", "Non-Food"), # 1 Bar lasts 10 days
    (2002, "Shampoo", usage(1, 30), "Personal Care", "Non-Food"), # Monthly
    (2003, "Conditioner", usage(1, 45), "Personal Care", "Non-Food"),
    (2004, "Toothpaste", usage(1, 25), "Personal Care", "Non-Food"),
    (2006, "Shaving Razor", usage(1, 15), "Personal Care", "Non-Food"),
    
    # CLEANING (The real non-daily stuff)
    (2011, "Laundry Detergent Powder", usage(1, 20), "Cleaning", "Non-Food"), # 1 Bag lasts 20 days
    (2013, "Dishwashing Liquid", usage(1, 15), "Cleaning", "Non-Food"), # 1 Bottle lasts 15 days
    (2015, "Toilet Cleaner", usage(1, 30), "Cleaning", "Non-Food"), # Monthly
    (2016, "Floor Cleaner (Phenyl)", usage(1, 30), "Cleaning", "Non-Food"), # Monthly
    (2019, "Bleach", usage(1, 60), "Cleaning", "Non-Food"), # 2 Months

    # HOUSEHOLD
    (2020, "Tissues (Box)", usage(1, 10), "Household", "Non-Food"),
    (2021, "Toilet Paper Roll", usage(1, 7), "Household", "Non-Food"),
    (2027, "Mosquito Repellent (Liquid)", usage(1, 30), "Household", "Non-Food"),
]

# Combine all datasets
catalog_items = dataset + additional_items

# ------------------ INFER UNIT FUNCTION (Kept same) ------------------
def infer_unit(name: str) -> str:
    lower = name.lower()
    if any(x in lower for x in ["jam", "honey", "pickle", "rooh afza", "sauce", "ketchup", "mayonnaise", "coffee", "shampoo", "lotion", "wash", "cleaner", "liquid", "repellent"]):
        return "bottle"
    if any(x in lower for x in ["bread", "rusk", "biscuit", "cookie", "tea", "masala", "powder", "salt", "surf", "tissue", "foil", "wrap", "box", "cotton", "matchbox"]):
        return "packet"
    if any(x in lower for x in ["egg", "banana", "paratha", "chapati", "toothbrush", "razor", "coil", "soap", "bar", "lemon", "apple", "orange", "kinnow", "mango"]):
        return "pieces"
    if any(x in lower for x in ["milk", "oil", "juice", "drink"]):
        return "liters"
    if "dozen" in lower:
        return "dozen"
    return "kg"

def seed_catalog():
    print(f"🔌 Connecting to database: {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    print("🧹 Clearing existing catalog...")
    c.execute("DELETE FROM product_catalog")

    print(f"📦 Seeding {len(catalog_items)} items...")

    count = 0
    for _, name, consumption, category, diet_type in catalog_items:
        unit = infer_unit(name)
        
        # NOTE: We insert the CALCULATED daily average here
        c.execute("""
            INSERT INTO product_catalog 
            (item_name, daily_consumption_per_person, consumption_unit, category, diet_type)
            VALUES (?, ?, ?, ?, ?)
        """, (name, consumption, unit, category, diet_type))
        count += 1

    conn.commit()
    conn.close()
    print(f"✅ Success! Seeded {count} items with Frequency Logic.")

if __name__ == "__main__":
    seed_catalog()