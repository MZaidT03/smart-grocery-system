import sys
from services.ml_engine import HybridRecommender

recommender = HybridRecommender('data/recipes.json')
inv = ['Apples', 'Ghee', 'Spinach', 'Onions', 'Tomatoes', 'Ginger', 'Garlic']
recs = recommender.get_recommendations(20, inv)
for r in recs:
    if r['name'] == 'Saag':
        print(r)
