import sqlite3
import pandas as pd
from prophet import Prophet
import logging

logging.getLogger("prophet").setLevel(logging.ERROR)
logging.getLogger("cmdstanpy").disabled = True

conn = sqlite3.connect('grocery.db')
# Get product id for Apples for user 16
pid = conn.execute("SELECT product_id FROM products WHERE user_id=16 AND item_name='Apples'").fetchone()[0]

logs = conn.execute("SELECT date(consumption_date) as date, SUM(consumed_quantity) as quantity FROM consumption_logs WHERE product_id = ? GROUP BY date(consumption_date) ORDER BY date(consumption_date) ASC", (pid,)).fetchall()
log_data = [{'date': row[0], 'quantity': row[1]} for row in logs]

df = pd.DataFrame(log_data)
df['date'] = pd.to_datetime(df['date'])
daily_series = df.groupby('date')['quantity'].sum()
full_idx = pd.date_range(start=daily_series.index.min(), end=daily_series.index.max(), freq='D')
daily_series = daily_series.reindex(full_idx, fill_value=0).reset_index()
daily_series.columns = ['ds', 'y']

try:
    m = Prophet(yearly_seasonality=False, daily_seasonality=False, weekly_seasonality=True)
    m.fit(daily_series)
    future = m.make_future_dataframe(periods=7)
    forecast = m.predict(future)
    print("Prophet Success")
    print(forecast[['ds', 'yhat']].tail(7))
except Exception as e:
    print(f"Prophet Error: {e}")

