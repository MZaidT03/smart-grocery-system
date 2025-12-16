# backend/config.py
import os

DB_NAME = "grocery.db"
DEFAULT_CATALOG_CSV = "pakistani_grocery_dataset.csv"
SECRET_KEY = os.environ.get("SECRET_KEY", "dev_secret_key")