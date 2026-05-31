import json
import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from scipy.sparse.linalg import svds
import random

class HybridRecommender:
    def __init__(self, recipes_path):
        self.recipes_path = recipes_path
        self.recipes = self._load_recipes()
        self.num_recipes = len(self.recipes)
        
        if self.num_recipes > 0:
            self._init_semantic_embeddings()
            self._init_collaborative_filtering()
            self._init_knowledge_graph()

    def _load_recipes(self):
        try:
            with open(self.recipes_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []

    def _normalize_text(self, text):
        if not text: return ""
        if '(' in text: text = text.split('(')[0]
        text = text.strip().lower()
        if text.endswith('es') and len(text) > 4: 
            text = text[:-2]
        elif text.endswith('s') and len(text) > 3: 
            text = text[:-1]
        return text

    def _init_semantic_embeddings(self):
        """
        Builds Word2Vec-style semantic embeddings using LSA (Latent Semantic Analysis).
        Ingredients are vectorized via TF-IDF, then dimensionality is reduced via SVD.
        This allows the system to understand that 'butter' and 'ghee' or 'chicken' and 'mutton'
        share semantic similarities based on their co-occurrence in similar recipes.
        """
        # Create a document string for each recipe's ingredients
        docs = [" ".join([self._normalize_text(i).replace(" ", "_") for i in r['ingredients']]) for r in self.recipes]
        
        self.vectorizer = TfidfVectorizer()
        tfidf_matrix = self.vectorizer.fit_transform(docs)
        
        # Use SVD to create dense embeddings (LSA). 
        # If we have very few recipes, we bound the components.
        n_components = min(15, self.num_recipes - 1) 
        if n_components > 0:
            self.lsa = TruncatedSVD(n_components=n_components, random_state=42)
            self.recipe_embeddings = self.lsa.fit_transform(tfidf_matrix)
        else:
            self.recipe_embeddings = tfidf_matrix.toarray()

    def _init_collaborative_filtering(self):
        """
        Simulates an interaction matrix for ALS/SVD Matrix Factorization.
        In a production environment, this would pull from SQL (user ratings, cooking frequency).
        Here we generate a synthetic sparse matrix for demonstration.
        """
        NUM_USERS = 50
        self.user_item_matrix = np.zeros((NUM_USERS, self.num_recipes))
        
        # Seed the matrix with random realistic interactions
        np.random.seed(42)
        for u in range(NUM_USERS):
            # Each user likes 5 to 15 random recipes
            liked_indices = np.random.choice(self.num_recipes, np.random.randint(5, 15), replace=False)
            for idx in liked_indices:
                # Ratings from 3 to 5
                self.user_item_matrix[u, idx] = np.random.randint(3, 6)

        # Apply SVD to factorize the matrix
        matrix_mean = np.mean(self.user_item_matrix, axis=1)
        matrix_demeaned = self.user_item_matrix - matrix_mean.reshape(-1, 1)
        
        k = min(10, self.num_recipes - 1)
        if k > 0:
            U, sigma, Vt = svds(matrix_demeaned, k=k)
            sigma = np.diag(sigma)
            # Reconstruct the predicted matrix
            self.predicted_ratings = np.dot(np.dot(U, sigma), Vt) + matrix_mean.reshape(-1, 1)
        else:
            self.predicted_ratings = self.user_item_matrix

    def _init_knowledge_graph(self):
        """
        A static Knowledge Graph mapping ingredients to their nutritional and categorical properties.
        This provides contextual reasoning.
        """
        self.kg = {
            "chicken": {"type": "protein", "diet": "non-veg"},
            "beef mince": {"type": "protein", "diet": "non-veg"},
            "mutton": {"type": "protein", "diet": "non-veg"},
            "fish": {"type": "protein", "diet": "non-veg"},
            "eggs": {"type": "protein", "diet": "non-veg"},
            "paneer": {"type": "protein", "diet": "veg", "dairy": True},
            "daal mash": {"type": "protein", "diet": "veg"},
            "daal moong": {"type": "protein", "diet": "veg"},
            "chickpeas": {"type": "protein", "diet": "veg"},
            "potato": {"type": "carb", "diet": "veg"},
            "super basmati rice": {"type": "carb", "diet": "veg"},
            "bread": {"type": "carb", "diet": "veg"},
            "wheat flour": {"type": "carb", "diet": "veg"},
            "ghee": {"type": "fat", "diet": "veg", "dairy": True},
            "butter": {"type": "fat", "diet": "veg", "dairy": True},
            "fresh milk": {"type": "liquid", "diet": "veg", "dairy": True},
            "yogurt": {"type": "liquid", "diet": "veg", "dairy": True},
            "spinach": {"type": "vitamin", "diet": "veg"},
            "carrot": {"type": "vitamin", "diet": "veg"}
        }

    def _get_semantic_score(self, user_inventory):
        """Calculates Content-Based score using Cosine Similarity on LSA Embeddings"""
        if self.num_recipes == 0 or len(user_inventory) == 0:
            return np.zeros(self.num_recipes)

        inv_doc = " ".join([self._normalize_text(i).replace(" ", "_") for i in user_inventory])
        inv_vec = self.vectorizer.transform([inv_doc])
        
        if hasattr(self, 'lsa'):
            inv_embedding = self.lsa.transform(inv_vec)
            # Cosine similarity
            dot_product = np.dot(self.recipe_embeddings, inv_embedding.T).flatten()
            norms_recipe = np.linalg.norm(self.recipe_embeddings, axis=1)
            norm_inv = np.linalg.norm(inv_embedding)
            
            # Avoid division by zero
            denom = norms_recipe * norm_inv
            denom[denom == 0] = 1e-10
            
            sim_scores = dot_product / denom
        else:
            sim_scores = np.zeros(self.num_recipes)

        # Normalize to 0-1
        min_s = np.min(sim_scores)
        max_s = np.max(sim_scores)
        if max_s > min_s:
            sim_scores = (sim_scores - min_s) / (max_s - min_s)
            
        return sim_scores

    def _get_collaborative_score(self, target_user_id):
        """Returns the predicted SVD rating for a user, normalized to 0-1"""
        # Map DB user_id to our synthetic matrix index (0 to 49)
        # In a real system, you'd map the actual user_id to the matrix index
        matrix_idx = int(target_user_id) % 50 
        user_predictions = self.predicted_ratings[matrix_idx]
        
        # Normalize to 0-1
        min_p = np.min(user_predictions)
        max_p = np.max(user_predictions)
        if max_p > min_p:
            return (user_predictions - min_p) / (max_p - min_p)
        return user_predictions

    def _get_kg_score(self, user_inventory, recipe_ingredients):
        """Scores recipes based on Knowledge Graph contextual completeness"""
        score = 0
        inv_set = set([self._normalize_text(i) for i in user_inventory])
        rec_set = set([self._normalize_text(i) for i in recipe_ingredients])

        has_protein = False
        has_carb = False
        has_vitamin = False

        for item in inv_set:
            if item in self.kg:
                cat = self.kg[item].get("type")
                if cat == "protein": has_protein = True
                if cat == "carb": has_carb = True
                if cat == "vitamin": has_vitamin = True

        # If user has a balanced pantry, boost balanced recipes
        for item in rec_set:
            if item in self.kg:
                cat = self.kg[item].get("type")
                if cat == "protein" and has_protein: score += 0.2
                if cat == "carb" and has_carb: score += 0.1
                if cat == "vitamin" and has_vitamin: score += 0.1
                
                # Semantic bridging: if recipe needs butter, but user has ghee, give a boost
                if item == "butter" and "ghee" in inv_set: score += 0.5
                if item == "ghee" and "butter" in inv_set: score += 0.5
                
        return min(1.0, score)

    def _get_heuristic_match_score(self, user_inventory, recipe_ingredients):
        """Original exact-match logic to ensure high accuracy for core ingredients"""
        inv_set = set([self._normalize_text(i) for i in user_inventory])
        if len(recipe_ingredients) == 0: return 0
        
        match_count = 0
        for ing in recipe_ingredients:
            norm_ing = self._normalize_text(ing)
            match_found = False
            if norm_ing in inv_set:
                match_found = True
            else:
                for inv_item in inv_set:
                    if norm_ing in inv_item or inv_item in norm_ing:
                        match_found = True
                        break
                # Handle KG substitutions
                if not match_found:
                    if norm_ing == "butter" and "ghee" in inv_set: match_found = True
                    if norm_ing == "ghee" and "butter" in inv_set: match_found = True
                    
            if match_found:
                match_count += 1
                
        return match_count / len(recipe_ingredients)

    def get_recommendations(self, user_id, user_inventory):
        """
        The main Hybrid Engine router. 
        Combines Semantic, Collaborative, KG, and Heuristic scores.
        """
        if self.num_recipes == 0:
            return []

        semantic_scores = self._get_semantic_score(user_inventory)
        collab_scores = self._get_collaborative_score(user_id)

        recommendations = []
        for idx, recipe in enumerate(self.recipes):
            heuristic_score = self._get_heuristic_match_score(user_inventory, recipe['ingredients'])
            kg_score = self._get_kg_score(user_inventory, recipe['ingredients'])
            
            # Weighted Hybrid Blend
            # 50% Exact Match, 25% Semantic LSA, 15% Collaborative SVD, 10% Knowledge Graph
            final_score = (heuristic_score * 0.50) + (semantic_scores[idx] * 0.25) + (collab_scores[idx] * 0.15) + (kg_score * 0.10)
            
            # Convert to percentage
            final_score_pct = round(final_score * 100)
            
            # Only recommend if the final blended score is above 40 (we lowered the threshold because semantic embeddings bridge gaps)
            if final_score_pct >= 40:
                missing = []
                substitutions = {}
                inv_set = set([self._normalize_text(i) for i in user_inventory])
                for ing in recipe['ingredients']:
                    norm_ing = self._normalize_text(ing)
                    if not any(norm_ing in inv_item or inv_item in norm_ing for inv_item in inv_set):
                        # Use KG synonym bridge
                        if norm_ing == "butter" and "ghee" in inv_set:
                            substitutions[ing] = "Ghee"
                            continue
                        if norm_ing == "ghee" and "butter" in inv_set:
                            substitutions[ing] = "Butter"
                            continue
                        missing.append(ing)

                match_count = len(recipe['ingredients']) - len(missing)
                # Ensure at least ONE ingredient matches to avoid noise recommendations
                if match_count > 0:
                    recommendations.append({
                        "id": recipe['id'],
                        "name": recipe['name'],
                        "score": final_score_pct,
                        "matchCount": match_count,
                        "totalCount": len(recipe['ingredients']),
                        "missing": missing,
                        "substitutions": substitutions,
                        "ingredients": recipe['ingredients'],
                        "difficulty": recipe['difficulty'],
                        "cuisine": recipe['cuisine'],
                        "ml_insights": {
                            "semantic": round(semantic_scores[idx] * 100),
                            "collaborative": round(collab_scores[idx] * 100)
                        }
                    })

        # Sort by highest blended score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations
