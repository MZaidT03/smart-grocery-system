import pandas as pd
from datetime import datetime, timedelta
import logging

try:
    from prophet import Prophet
    # Mute Prophet's annoying logs
    logging.getLogger("prophet").setLevel(logging.ERROR)
    logging.getLogger("cmdstanpy").disabled = True
except ImportError:
    Prophet = None

print("Prophet loaded?", Prophet is not None)

logs = []
for i in range(20):
    logs.append({"date": (datetime.now() - timedelta(days=20-i)).strftime("%Y-%m-%d"), "quantity": 1.0 + (i % 7)*0.1})

if Prophet:
    df = pd.DataFrame(logs)
    df['date'] = pd.to_datetime(df['date'])
    daily_series = df.groupby('date')['quantity'].sum()
    full_idx = pd.date_range(start=daily_series.index.min(), end=daily_series.index.max(), freq='D')
    daily_series = daily_series.reindex(full_idx, fill_value=0).reset_index()
    daily_series.columns = ['ds', 'y']

    m = Prophet(yearly_seasonality=False, daily_seasonality=False, weekly_seasonality=True)
    m.fit(daily_series)
    future = m.make_future_dataframe(periods=7)
    forecast = m.predict(future)
    print("Forecast success!")
    print(forecast[['ds', 'yhat']].tail())

