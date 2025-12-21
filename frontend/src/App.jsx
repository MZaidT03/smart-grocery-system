import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/LoginPage";
import Register from "./components/RegisterPage";
import LandingPage from "./components/LandingPage";
import Analytics from "./components/Analytics";

import ShoppingList from "./components/ShoppingList";
import ProfilePage from "./pages/ProfilePage";
import Dashboard from "./pages/Dashboard";
import RecipesPage from "./pages/RecipesPage";
import MarketPrices from "./pages/MarketPrice";

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("user");
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route path="/shopping-list/:listId" element={<ShoppingList />} />
        <Route path="/market-prices" element={<MarketPrices />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
