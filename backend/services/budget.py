import sqlite3
from datetime import datetime
import calendar

DB_NAME = "grocery.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# --- 1. SETUP TABLES (Run once) ---
def init_budget_tables():
    conn = get_db_connection()
    try:
        # Table for the monthly limit
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_budgets (
                user_id INTEGER PRIMARY KEY,
                budget_limit REAL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table for every transaction
        conn.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                amount REAL,
                category TEXT,
                description TEXT,
                expense_date DATE DEFAULT (date('now'))
            )
        """)
        conn.commit()
    finally:
        conn.close()

# --- 2. LOGGING MONEY ---
def log_expense(user_id, amount, category, description, conn=None):
    """
    Helper to save an expense. Can accept an existing DB connection or make a new one.
    """
    should_close = False
    if not conn:
        conn = get_db_connection()
        should_close = True
        
    try:
        if amount > 0:
            conn.execute("""
                INSERT INTO expenses (user_id, amount, category, description)
                VALUES (?, ?, ?, ?)
            """, (user_id, amount, category, description))
            if should_close: conn.commit()
    except Exception as e:
        print(f"Expense Log Error: {e}")
    finally:
        if should_close: conn.close()

# --- 3. ANALYSIS ENGINE ---
def get_budget_status(user_id):
    conn = get_db_connection()
    try:
        # A. Get Limit
        row = conn.execute("SELECT budget_limit FROM user_budgets WHERE user_id = ?", (user_id,)).fetchone()
        limit = row['budget_limit'] if row else 0
        
        if limit == 0:
            return {"status": "not_set"}

        # B. Get Total Spent This Month
        start_of_month = datetime.now().strftime('%Y-%m-01')
        spent_row = conn.execute("""
            SELECT SUM(amount) as total 
            FROM expenses 
            WHERE user_id = ? AND expense_date >= ?
        """, (user_id, start_of_month)).fetchone()
        
        spent = spent_row['total'] if spent_row['total'] else 0
        
        # C. Calculate Burn Rate
        today = datetime.now().day
        last_day = calendar.monthrange(datetime.now().year, datetime.now().month)[1]
        
        percent_spent = (spent / limit) * 100
        percent_time_passed = (today / last_day) * 100
        
        remaining = limit - spent
        
        # D. AI Advice
        status = "Good"
        msg = "You are on track."
        color = "emerald"

        if percent_spent > 100:
            status = "Critical"
            msg = f"Budget exceeded by Rs {abs(remaining):,.0f}!"
            color = "red"
        elif percent_spent > percent_time_passed + 15:
            # e.g., Spent 50% of money but only 10% of month passed
            status = "Warning"
            msg = f"High Burn Rate! It's only day {today}, slow down."
            color = "orange"
        elif percent_spent < percent_time_passed - 10:
             msg = "Great savings! You are well under budget."

        return {
            "status": "active",
            "limit": limit,
            "spent": spent,
            "remaining": remaining,
            "percent": round(percent_spent, 1),
            "advice": msg,
            "color": color
        }
    finally:
        conn.close()

# Run setup immediately
if __name__ == "__main__":
    init_budget_tables()
    print("✅ Budget Tables Created")