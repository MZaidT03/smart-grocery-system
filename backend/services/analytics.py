import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
from datetime import datetime, timedelta
import sqlite3

# --- 1. ADD THIS IMPORT ---
# We need to import the database connection helper to use it in this file
from database import get_db_connection 

import logging
try:
    # pyrefly: ignore [missing-import]
    from prophet import Prophet
    # Mute Prophet's annoying logs
    logging.getLogger("prophet").setLevel(logging.ERROR)
    logging.getLogger("cmdstanpy").disabled = True
except ImportError:
    Prophet = None

def get_consumption_forecast(consumption_logs):
    """
    Returns TWO forecasts:
    1. Robust Trend (WMA) - Safe, flat line.
    2. Seasonal (Facebook Prophet) - Detects weekly patterns, falls back to WMA if not enough data.
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
        daily_series = daily_series.reindex(full_idx, fill_value=0).reset_index()
        daily_series.columns = ['ds', 'y']
        
        # --- MODEL 1: Weighted Moving Average (The "Safe" Trend) ---
        recent_window = daily_series.tail(30)['y']
        weights = np.arange(1, len(recent_window) + 1)
        wma_val = np.average(recent_window, weights=weights) if len(recent_window) > 0 else 0

        # --- MODEL 2: Advanced Seasonal Forecast (Facebook Prophet) ---
        seasonal_forecast = []
        method = "Weighted Moving Average (Fallback)"

        if Prophet is not None and len(daily_series) >= 14:
            try:
                m = Prophet(yearly_seasonality=False, daily_seasonality=False, weekly_seasonality=True)
                m.fit(daily_series)
                
                # Project forward 7 days
                future = m.make_future_dataframe(periods=7)
                forecast = m.predict(future)
                
                # Get the last 7 days predictions, ensuring no negative predictions
                prophet_preds = forecast['yhat'].tail(7).values
                seasonal_forecast = [round(max(0, val), 2) for val in prophet_preds]
                method = "Facebook Prophet (Weekly Seasonality)"
            except Exception as e:
                print(f"Prophet failed: {e}")
                seasonal_forecast = [round(max(0, wma_val), 2)] * 7
        else:
            # Not enough data for seasonality, fallback to flat WMA
            seasonal_forecast = [round(max(0, wma_val), 2)] * 7

        return {
            "wma_daily_usage": round(wma_val, 2),
            "seasonal_prediction": seasonal_forecast, 
            "method": method
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