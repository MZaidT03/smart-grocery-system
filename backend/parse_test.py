import re

text = """SPRITE BOTTLE 1.5 LTR
        1       155             155
Tax     18%*            Disc:           0
COCA COLA BOTTLE 1.5 LTR
        1       155             155
Tax     18%*            Disc:           0
GLINT GLASS & HOUSEHOLD CLEANER
        1       565             565
Tax     18%             Disc:           0
GLINT ALL PURPOSE CLEANER 500 ML
        1       650             650
Tax     18%             Disc:           25
AQUAFINA PURE DRINKING WATER 500
        1       45              45
Tax     18%*            Disc:           0
W CUT WHITE BAG PRINTING 22X22
        1       25              25
Tax     18%             Disc:           0
TOSHIBA CELL AAA 2PC
        1       70              70"""

lines = text.split('\n')
detected_items = []
current_item_name = None

for i in range(len(lines)):
    line = lines[i].strip()
    if not line:
        continue
    
    # Ignore Tax/Disc lines
    if line.lower().startswith('tax') or 'disc:' in line.lower():
        continue
        
    # Check if the line is just numbers (Quantity, Price, Total)
    # Often it looks like "1   155   155"
    if re.match(r'^[\d\s\.,]+$', line):
        # It's a quantity/price line. 
        # If we have a current_item_name, we can extract quantity.
        if current_item_name:
            parts = line.split()
            if parts:
                try:
                    qty = int(parts[0])
                    detected_items[-1]['quantity'] = qty
                except:
                    pass
        continue
        
    # Otherwise, it's likely an item name!
    # Filter out very short strings or obvious garbage
    if len(line) > 3 and not re.match(r'^[\W_]+$', line):
        # We found an item name
        current_item_name = line
        detected_items.append({
            "id": f"scanned-{len(detected_items)}",
            "name": current_item_name.title(), # Title Case looks nicer
            "quantity": 1, # Default
            "unit": "Pcs",
            "raw_line": line
        })

print(detected_items)
