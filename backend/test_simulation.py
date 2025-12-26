from database import get_db_connection
from datetime import datetime, timedelta

def simulate_past_state(days_back=3):
    conn = get_db_connection()
    try:
        # 1. Calculate the "Fake" Last Run Date (e.g., Dec 20 if today is Dec 23)
        fake_last_run = datetime.now() - timedelta(days=days_back)
        fake_date_str = fake_last_run.strftime('%Y-%m-%d 09:00:00')

        print(f"--- SIMULATING STATE FROM: {fake_date_str} ---")

        # 2. CLEAR HISTORY (So the system thinks it hasn't processed today/yesterday)
        # We delete notifications and logs that happened AFTER the fake date
        print("1. Clearing recent notifications and logs...")
        conn.execute("DELETE FROM notifications") 
        conn.execute("DELETE FROM consumption_logs")
        conn.execute("DELETE FROM consumption_summary")
        
        # 3. INSERT "FAKE" LAST RUN MARKER
        # This tells the system: "The last time I checked was 3 days ago"
        print(f"2. Setting last system check to {days_back} days ago...")
        conn.execute("""
            INSERT INTO notifications (user_id, title, message, type, created_at)
            VALUES (?, 'System Check', 'Simulation Reset', 'system', ?)
        """, (1, fake_date_str)) # Assuming User ID 1

        conn.commit()
        print("✅ Simulation Ready! The system now thinks it hasn't run for 3 days.")
        print("👉 Now go to your Frontend Dashboard and refresh the page.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    simulate_past_state(3)