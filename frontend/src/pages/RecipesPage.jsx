import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/dashboard/NavBar";
import RecipeMatcher from "../components/RecipeMatcher";

const RecipesPage = () => {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) navigate("/login");
  }, [userId, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-zinc-400 hover:text-white mb-6 transition group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* The Recipe Matcher Component */}
        <RecipeMatcher userId={userId} />
      </div>
    </div>
  );
};

export default RecipesPage;
