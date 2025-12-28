import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sqlite3

# --- 1. ADD THIS IMPORT ---
# We need to import the database connection helper to use it in this file
from database import get_db_connection 

def get_consumption_forecast(consumption_logs):
    """
    Returns TWO forecasts:
    1. Robust Trend (WMA) - Safe, flat line.
    2. Seasonal (Holt-Winters Lite) - Wavy line detecting weekly patterns.
    """
    # 0. Handle Empty Data
    if not consumption_logs or len(consumption_logs) < 5:
        return None

    try:
        # 1. Prepare Dataframe
        df = pd.DataFrame(consumption_logs)
        df['date'] = pd.to_datetime(df['date'])
        
        # Aggregate by day
        daily_series = df.groupby('date')['quantity'].sum()
        
        # Reindex to ensure every day is present (fill missing with 0)
        full_idx = pd.date_range(start=daily_series.index.min(), end=daily_series.index.max(), freq='D')
        daily_series = daily_series.reindex(full_idx, fill_value=0)
        
        values = daily_series.values
        
        # --- MODEL 1: Weighted Moving Average (The "Safe" Trend) ---
        recent_window = daily_series.tail(30)
        if len(recent_window) == 0: return None

        weights = np.arange(1, len(recent_window) + 1)
        wma_val = np.average(recent_window, weights=weights)

        # --- MODEL 2: Simplified Seasonal Forecast (Holt-Winters Lite) ---
        # We need at least 14 days (2 weeks) to detect a "weekly" pattern
        seasonal_forecast = []
        
        if len(values) >= 14:
            season_len = 7 # Weekly pattern
            
            # Calculate "Average Day of Week" indices
            seasonal_indices = []
            mean_val = np.mean(values) + 1e-6 # Avoid div by zero
            
            for i in range(season_len):
                # Get all Mondays, all Tuesdays, etc.
                day_vals = values[i::season_len]
                # Compare day average to global average
                idx = np.mean(day_vals) / mean_val
                seasonal_indices.append(idx)
            
            # Project forward 7 days
            current_day_idx = len(values) % season_len
            
            for i in range(7):
                season_idx = (current_day_idx + i) % season_len
                # Apply seasonality to the WMA trend
                val = wma_val * seasonal_indices[season_idx]
                seasonal_forecast.append(round(val, 2))
        else:
            # Not enough data for seasonality, fallback to flat WMA
            seasonal_forecast = [round(wma_val, 2)] * 7

        return {
            "wma_daily_usage": round(wma_val, 2),
            "seasonal_prediction": seasonal_forecast, 
            "method": "Hybrid (WMA + Seasonal)"
        }

    except Exception as e:
        print(f"Forecast Error: {e}")
        return None

def detect_anomaly(recent_qty, consumption_logs):
    """
    Checks if a specific usage amount is an 'Anomaly' (outlier).
    Uses standard NumPy math (Z-Score).
    """
    if not consumption_logs or len(consumption_logs) < 10:
        return False 

    try:
        df = pd.DataFrame(consumption_logs)
        df['date'] = pd.to_datetime(df['date'])
        daily_series = df.groupby('date')['quantity'].sum()
        
        # Calculate Stats using NumPy (Stable)
        mean = np.mean(daily_series)
        std_dev = np.std(daily_series)
        
        if std_dev == 0: return False

        # Threshold: 3 Standard Deviations
        threshold = 3 
        z_score = (recent_qty - mean) / std_dev

        if z_score > threshold:
            return True 
        return False
    except:
        return False

def get_ai_learning_status(user_id):
    """
    Calculates:
    1. Total 'Learning Events' (Total logs analyzed)
    2. Total 'Learned Patterns' (Pairs of items bought together > 2 times)
    """
    conn = get_db_connection() # <--- NOW THIS WILL WORK
    try:
        # 1. Count Total Transactions (The "Experience")
        total_txns = conn.execute(
            "SELECT COUNT(*) FROM consumption_logs WHERE user_id = ?", 
            (user_id,)
        ).fetchone()[0]

        # 2. Count "Strong Patterns" (The "Intelligence")
        # Logic: Find pairs of items (A, B) that appear on the same date > 2 times
        pattern_query = """
            SELECT COUNT(*) 
            FROM (
                SELECT t1.product_id, t2.product_id
                FROM consumption_logs t1
                JOIN consumption_logs t2 
                  ON t1.user_id = t2.user_id 
                  AND date(t1.consumption_date) = date(t2.consumption_date)
                  AND t1.product_id < t2.product_id -- Avoid duplicates (A,B) vs (B,A)
                WHERE t1.user_id = ?
                GROUP BY t1.product_id, t2.product_id
                HAVING COUNT(*) >= 2 -- Threshold: Must happen at least twice to be a "Pattern"
            )
        """
        patterns = conn.execute(pattern_query, (user_id,)).fetchone()[0]

        return {
            "total_txns": total_txns,
            "patterns_found": patterns
        }
    except Exception as e:
        print(f"AI Stats Error: {e}")
        return {"total_txns": 0, "patterns_found": 0}
    finally:
        conn.close()