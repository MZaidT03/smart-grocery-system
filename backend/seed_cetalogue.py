import sqlite3

DB_NAME = "grocery.db"

# ------------------ Main Food Dataset ------------------
dataset = [
    (1001, "Wheat Flour (Atta)", 0.5, "Staples", "Vegan"),
    (1002, "Super Basmati Rice", 0.4, "Staples", "Vegan"),
    (1003, "Sugar (Cheeni)", 0.15, "Staples", "Vegan"),
    (1004, "Besan (Gram Flour)", 0.05, "Staples", "Vegan"),
    (1005, "Suji (Semolina)", 0.02, "Staples", "Vegan"),
    (1006, "Maida (Refined Flour)", 0.05, "Staples", "Vegan"),
    (1007, "Daal Chana", 0.08, "Pulses", "Vegan"),
    (1008, "Daal Masoor", 0.06, "Pulses", "Vegan"),
    (1009, "Daal Moong", 0.06, "Pulses", "Vegan"),
    (1010, "Daal Mash", 0.05, "Pulses", "Vegan"),
    (1011, "White Chana (Chickpeas)", 0.07, "Pulses", "Vegan"),
    (1012, "Black Chana", 0.04, "Pulses", "Vegan"),
    (1013, "Red Kidney Beans (Rajma)", 0.03, "Pulses", "Vegan"),
    (1014, "Lentil Yellow (Moong Split)", 0.05, "Pulses", "Vegan"),
    (1015, "Fresh Milk", 1.5, "Dairy", "Non-Vegan"),
    (1016, "Yogurt (Dahi)", 0.5, "Dairy", "Non-Vegan"),
    (1017, "Eggs (Desi/Farm)", 4.0, "Dairy", "Non-Vegan"),
    (1018, "Bread (Large)", 0.5, "Bakery", "Vegan"),
    (1019, "Butter", 0.05, "Dairy", "Non-Vegan"),
    (1020, "Desi Ghee", 0.05, "Dairy", "Non-Vegan"),
    (1021, "Rusks", 4.0, "Bakery", "Vegan"),
    (1022, "Cheese Slices", 0.02, "Dairy", "Non-Vegan"),
    (1023, "Cooking Oil", 0.15, "Oil & Ghee", "Vegan"),
    (1024, "Banaspati Ghee", 0.1, "Oil & Ghee", "Vegan"),
    (1025, "Olive Oil", 0.01, "Oil & Ghee", "Vegan"),
    (1026, "Potato (Aloo)", 0.5, "Vegetables", "Vegan"),
    (1027, "Onion (Pyaz)", 0.4, "Vegetables", "Vegan"),
    (1028, "Tomato", 0.3, "Vegetables", "Vegan"),
    (1029, "Spinach (Palak)", 0.15, "Vegetables", "Vegan"),
    (1030, "Carrot (Gajar)", 0.2, "Vegetables", "Vegan"),
    (1031, "Cabbage (Patta Gobhi)", 0.25, "Vegetables", "Vegan"),
    (1032, "Cauliflower (Phool Gobhi)", 0.2, "Vegetables", "Vegan"),
    (1033, "Okra (Bhindi)", 0.2, "Vegetables", "Vegan"),
    (1034, "Eggplant (Baingan)", 0.2, "Vegetables", "Vegan"),
    (1035, "Capsicum", 0.15, "Vegetables", "Vegan"),
    (1036, "Ginger (Adrak)", 0.02, "Vegetables", "Vegan"),
    (1037, "Garlic (Lehsan)", 0.02, "Vegetables", "Vegan"),
    (1038, "Green Chilies", 0.02, "Vegetables", "Vegan"),
    (1039, "Coriander Leaves", 0.05, "Vegetables", "Vegan"),
    (1040, "Lemon", 0.05, "Vegetables", "Vegan"),
    (1041, "Banana", 6.0, "Fruits", "Vegan"),
    (1042, "Apple", 0.3, "Fruits", "Vegan"),
    (1043, "Mango (Chaunsa)", 0.5, "Fruits", "Vegan"),
    (1044, "Citrus (Kinnow)", 0.4, "Fruits", "Vegan"),
    (1045, "Papaya", 0.2, "Fruits", "Vegan"),
    (1046, "Grapes", 0.25, "Fruits", "Vegan"),
    (1047, "Pomegranate (Anar)", 0.15, "Fruits", "Vegan"),
    (1048, "Chicken (Meat)", 0.4, "Meat", "Non-Vegan"),
    (1049, "Beef (Boneless)", 0.15, "Meat", "Non-Vegan"),
    (1050, "Mutton", 0.05, "Meat", "Non-Vegan"),
    (1051, "Fish", 0.1, "Meat", "Non-Vegan"),
    (1052, "Prawns", 0.05, "Meat", "Non-Vegan"),
    (1053, "Tea Leaves (Tapal/Lipton)", 0.03, "Beverages", "Vegan"),
    (1054, "Green Tea", 0.01, "Beverages", "Vegan"),
    (1055, "Rooh Afza", 0.05, "Beverages", "Vegan"),
    (1056, "Coffee", 0.01, "Beverages", "Vegan"),
    (1057, "Fruit Juice (Packaged)", 0.1, "Beverages", "Vegan"),
    (1058, "Red Chili Powder", 0.02, "Spices", "Vegan"),
    (1059, "Turmeric (Haldi)", 0.01, "Spices", "Vegan"),
    (1060, "Coriander Powder", 0.01, "Spices", "Vegan"),
    (1061, "Cumin Seeds (Zeera)", 0.01, "Spices", "Vegan"),
    (1062, "Salt", 0.03, "Spices", "Vegan"),
    (1063, "Garam Masala", 0.005, "Spices", "Vegan"),
    (1064, "Biryani Masala", 0.05, "Spices", "Vegan"),
    (1065, "Chaat Masala", 0.005, "Spices", "Vegan"),
    (1066, "Black Pepper", 0.005, "Spices", "Vegan"),
    (1067, "Cloves", 0.002, "Spices", "Vegan"),
    (1068, "Cardamom", 0.002, "Spices", "Vegan"),
    (1069, "Biscuits", 4.0, "Snacks", "Vegan"),
    (1070, "Chips", 0.05, "Snacks", "Vegan"),
    (1071, "Nuts (Almonds / Cashews)", 0.02, "Snacks", "Vegan"),
    (1072, "Chocolate / Candy", 0.02, "Snacks", "Non-Vegan"),
    (1073, "Ice Cream", 0.1, "Dairy", "Non-Vegan"),
    (1074, "Paneer", 0.05, "Dairy", "Non-Vegan"),
    (1075, "Jam", 0.02, "Bakery", "Vegan"),
    (1076, "Honey", 0.01, "Bakery", "Non-Vegan"),
    (1077, "Yogurt Drink", 0.1, "Dairy", "Non-Vegan"),
    (1078, "Frozen Paratha", 0.3, "Bakery", "Vegan"),
    (1079, "Ready-to-cook Chapati", 0.5, "Bakery", "Vegan"),
    (1080, "Pickles (Achar)", 0.02, "Condiments", "Vegan")
]

# ------------------ Additional Household & Personal Care ------------------
additional_items = [
    (2001, "Bath Soap", 0.02, "Personal Care", "Non-Food"),
    (2002, "Shampoo", 0.015, "Personal Care", "Non-Food"),
    (2003, "Conditioner", 0.01, "Personal Care", "Non-Food"),
    (2004, "Toothpaste", 0.01, "Personal Care", "Non-Food"),
    (2005, "Toothbrush", 0.002, "Personal Care", "Non-Food"),
    (2006, "Shaving Razor", 0.001, "Personal Care", "Non-Food"),
    (2007, "Shaving Foam", 0.005, "Personal Care", "Non-Food"),
    (2008, "Body Lotion", 0.01, "Personal Care", "Non-Food"),
    (2009, "Face Wash", 0.008, "Personal Care", "Non-Food"),
    (2010, "Hand Wash", 0.01, "Personal Care", "Non-Food"),

    (2011, "Laundry Detergent Powder", 0.05, "Cleaning", "Non-Food"),
    (2012, "Laundry Liquid Detergent", 0.03, "Cleaning", "Non-Food"),
    (2013, "Dishwashing Liquid", 0.02, "Cleaning", "Non-Food"),
    (2014, "Dishwashing Bar", 0.015, "Cleaning", "Non-Food"),
    (2015, "Toilet Cleaner", 0.01, "Cleaning", "Non-Food"),
    (2016, "Floor Surface Cleaner (Phenyl)", 0.02, "Cleaning", "Non-Food"),
    (2017, "Glass Cleaner", 0.01, "Cleaning", "Non-Food"),
    (2018, "Fabric Softener", 0.01, "Cleaning", "Non-Food"),
    (2019, "Bleach", 0.01, "Cleaning", "Non-Food"),

    (2020, "Tissues (Box)", 0.05, "Household", "Non-Food"),
    (2021, "Toilet Paper Roll", 0.03, "Household", "Non-Food"),
    (2022, "Garbage Bags", 0.01, "Household", "Non-Food"),
    (2023, "Aluminum Foil", 0.005, "Household", "Non-Food"),
    (2024, "Plastic Wrap", 0.005, "Household", "Non-Food"),
    (2025, "Matchbox", 0.002, "Household", "Non-Food"),
    (2026, "Lighter", 0.001, "Household", "Non-Food"),
    (2027, "Mosquito Repellent (Liquid)", 0.01, "Household", "Non-Food"),
    (2028, "Mosquito Coils", 0.02, "Household", "Non-Food"),
    (2029, "Air Freshener", 0.005, "Household", "Non-Food"),
]

# Combine all datasets
catalog_items = dataset + additional_items


# ------------------ Updated Seeding Function ------------------
def infer_unit(name: str) -> str:
    """Auto-detect unit based on item name."""
    lower = name.lower()

    # Liquids
    if any(x in lower for x in ["milk", "oil", "juice", "drink", "detergent", "cleaner", "wash", "liquid"]):
        return "liters"

    # Pieces / countable items
    if any(x in lower for x in ["egg", "banana", "paratha", "chapati", "toothbrush", "razor", "coil"]):
        return "pieces"

    # Packets
    if any(x in lower for x in ["bread", "rusks", "biscuits", "cookies", "soap", "tissues", "foil", "wrap", "packet"]):
        return "packet"

    # Rolls
    if "roll" in lower:
        return "roll"

    # Boxes
    if "box" in lower:
        return "box"

    # Default
    return "kg"


def seed_catalog():
    print(f"🔌 Connecting to database: {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    print("🧹 Clearing existing catalog to prevent duplicates...")
    c.execute("DELETE FROM product_catalog")

    print(f"📦 Seeding {len(catalog_items)} items into Product Catalog...")

    count = 0
    for _, name, consumption, category, diet_type in catalog_items:
        unit = infer_unit(name)

        c.execute("""
            INSERT INTO product_catalog 
            (item_name, daily_consumption_per_person, consumption_unit, category, diet_type)
            VALUES (?, ?, ?, ?, ?)
        """, (name, consumption, unit, category, diet_type))
        count += 1

    conn.commit()
    conn.close()
    print(f"✅ Success! Seeded {count} catalog items.")


if __name__ == "__main__":
    seed_catalog()
