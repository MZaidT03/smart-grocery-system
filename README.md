# Smart Grocery System

The **Smart Grocery System** is a full-stack web application designed to manage grocery operations efficiently.
The project consists of a **backend** (API & logic) and a **frontend** (user interface), running separately.

---

## ✨ Features

### 👤 User Management
- User registration and login with password hashing
- User profile management (name, email, household size, diet preference)
- Diet preference selection (Vegan / Non-Vegan)

### 📦 Inventory Management
- Add, update, and delete grocery products
- Track product quantities with batch management (FIFO consumption logic)
- Track expiry dates and receive warnings before products expire
- Product categorization (e.g. dairy, vegetables, meat)
- Consumption frequency tracking
- Minimum and maximum stock threshold alerts
- Auto-consumption based on recorded usage patterns
- Restock product functionality

### 🛒 Shopping List Generation
- Generate shopping lists based on current inventory levels
- Multi-day meal planning with customizable planning horizon
- Household size-aware quantity calculations
- Market basket analysis to suggest items frequently bought together
- Shopping list confirmation and history tracking
- Item notes and annotations
- Auto-learns new catalog items as they are added

### 🍽️ Recipes & Meal Planning
- Built-in recipe database
- Recipe recommendations based on available inventory
- Recipe matching with currently stocked ingredients
- Diet-type filtering (vegan / non-vegan)
- Ingredient normalization for accurate matching

### 📊 Analytics & Forecasting
- Consumption history tracking per product
- Demand forecasting using Weighted Moving Average (WMA) and Holt-Winters models
- Seasonal trend analysis
- Diet type inference from consumption data
- Inventory reports with detailed analytics
- Consumption summary statistics per product

### 💰 Budget Management
- Per-user budget setting
- Expense logging linked to shopping lists
- Budget tracking with visual indicators
- Budget-exceeded notifications and alerts
- Price-based shopping recommendations

### 💹 Market Prices
- Live market price fetching via web scraping
- Price history tracking per product
- Market-based price updates for inventory items
- Price comparison across products

### 🔔 Notifications
- Low-stock inventory alerts
- Expiry date warning notifications
- Budget-exceeded notifications
- Custom notification system with read/unread tracking

### 🛡️ Admin Dashboard
- Platform-wide analytics overview for administrators
- Usage statistics and user activity monitoring
- Database management utilities
- System health checks

### 📈 User Dashboard
- Real-time inventory overview
- Consumption metrics and trends
- Budget status summary
- Recent notification feed
- Quick actions: add item, record consumption, restock

---

## 🗂️ Project Structure

```
Smart-Grocery-System/
│
├── backend/        # Backend (API, database, business logic)
└── frontend/       # Frontend (UI)
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Flask (Python) |
| Database | SQLite3 |
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Forecasting | pandas + NumPy |

---

## 🔧 Prerequisites

Make sure you have the following installed on your system:

* **Python 3.x**
* **pip**
* **Node.js** (v16+ recommended)
* **npm**
* **Git**

## 🖥️ Backend Setup

1. Open a terminal and navigate to the backend folder:

   ```
   cd backend
   ```

2. Activate the virtual environment:

   ```
   source venv/bin/activate
   ```

3. Run the backend server:

   ```
   python app.py
   ```

Backend will start running (usually on `http://127.0.0.1:5000`).

## 🌐 Frontend Setup

1. Open a **new terminal** window.

2. Navigate to the frontend folder:

   ```
   cd frontend
   ```

3. Install dependencies:

   ```
   npm install
   ```

4. Start the development server:

   ```
   npm run dev
   ```

Frontend will start running (usually on `http://localhost:5173`).
