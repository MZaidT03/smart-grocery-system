from database import get_db_connection
from datetime import datetime, timedelta

def fix_missing_batches():
    conn = get_db_connection()
    try:
        print("--- STARTING DATABASE HEAL ---")
        
        # 1. Get all active products
        products = conn.execute("SELECT product_id, item_name, current_quantity FROM products WHERE is_active = 1").fetchall()
        
        fixed_count = 0
        
        for p in products:
            pid = p['product_id']
            qty = p['current_quantity']
            
            if qty <= 0: continue

            # 2. Check total quantity in batches
            batch_row = conn.execute("SELECT SUM(quantity) as total FROM product_batches WHERE product_id = ?", (pid,)).fetchone()
            batch_total = batch_row['total'] if batch_row['total'] else 0
            
            # 3. If Batches are missing or less than Product total, fix it
            if batch_total < qty:
                diff = qty - batch_total
                
                # Create a "Recovery Batch"
                # We set expiry to 30 days from now as a default
                exp_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
                
                conn.execute("""
                    INSERT INTO product_batches (product_id, quantity, expiry_date) 
                    VALUES (?, ?, ?)
                """, (pid, diff, exp_date))
                
                print(f"✅ Fixed: {p['item_name']} (Added batch of {diff})")
                fixed_count += 1
        
        conn.commit()
        
        if fixed_count == 0:
            print("✨ All data is already healthy! No fixes needed.")
        else:
            print(f"🎉 Successfully fixed {fixed_count} products.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_missing_batches()