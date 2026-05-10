import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme"; 

type Recipe = {
  id: number | string;
  name: string;
  cuisine: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  score: number;
  ingredients?: string[];
  missing?: string[];
};

export default function RecipesScreen() {
  // Pull the pure black/white/green minimal colors directly from the context
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/recommend-recipes?userId=${userId}`,
        );
        const data = await res.json();
        if (data?.success && Array.isArray(data.recommendations)) {
          setRecipes(data.recommendations);
        } else {
          setRecipes([]);
        }
      } catch (err) {
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const uniqueCuisines = useMemo(() => {
    const cuisines = new Set(
      recipes.map((recipe) => recipe.cuisine).filter(Boolean),
    );
    return ["All", ...Array.from(cuisines)];
  }, [recipes]);

  const uniqueDifficulties = ["All", "Easy", "Medium", "Hard"];

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCuisine =
      selectedCuisine === "All" || recipe.cuisine === selectedCuisine;
    const matchesDifficulty =
      selectedDifficulty === "All" || recipe.difficulty === selectedDifficulty;
    return matchesSearch && matchesCuisine && matchesDifficulty;
  });

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Session expired</Text>
          <Text style={styles.emptyBody}>Please log in again.</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.primaryButtonText}>Go to login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Recipes</Text>
          <Text style={styles.subtitle}>Matches from your inventory</Text>
        </View>
        <Text style={styles.count}>{filteredRecipes.length}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent1} />
          <Text style={styles.loadingText}>Finding recipes...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filterCard}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search recipes"
              placeholderTextColor={colors.text3}
              style={styles.searchInput}
            />

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Cuisine</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {uniqueCuisines.map((cuisine) => (
                  <Pressable
                    key={cuisine}
                    style={[
                      styles.chip,
                      selectedCuisine === cuisine && styles.chipActive,
                    ]}
                    onPress={() => setSelectedCuisine(cuisine)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedCuisine === cuisine && styles.chipTextActive,
                      ]}
                    >
                      {cuisine}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Difficulty</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {uniqueDifficulties.map((difficulty) => (
                  <Pressable
                    key={difficulty}
                    style={[
                      styles.chip,
                      selectedDifficulty === difficulty && styles.chipActive,
                    ]}
                    onPress={() => setSelectedDifficulty(difficulty)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedDifficulty === difficulty &&
                          styles.chipTextActive,
                      ]}
                    >
                      {difficulty}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyTitle}>No recipes found</Text>
              <Text style={styles.emptyBody}>
                Try clearing filters or searching again.
              </Text>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setSearchQuery("");
                  setSelectedCuisine("All");
                  setSelectedDifficulty("All");
                }}
              >
                <Text style={styles.secondaryButtonText}>Clear filters</Text>
              </Pressable>
            </View>
          ) : (
            filteredRecipes.map((recipe) => {
              // Map scores to your minimal theme colors
              const scoreColor =
                recipe.score === 100
                  ? colors.success
                  : recipe.score > 70
                    ? colors.warning
                    : colors.text3;
              const barColor =
                recipe.score === 100 ? colors.success : colors.warning;

              return (
                <Pressable
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => setSelectedRecipe(recipe)}
                >
                  <View style={styles.recipeHeader}>
                    <View>
                      <Text style={styles.recipeTitle}>{recipe.name}</Text>
                      <View style={styles.recipeMetaRow}>
                        <Text style={styles.recipeMeta}>{recipe.cuisine}</Text>
                        <Text style={styles.recipeMetaDot}>•</Text>
                        <Text style={styles.recipeMeta}>
                          {recipe.difficulty}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.recipeScore, { color: scoreColor }]}>
                      {recipe.score}%
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, Math.max(0, recipe.score))}%`,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.recipeHint}>Tap to view ingredients</Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={!!selectedRecipe} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedRecipe?.name}</Text>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMeta}>
                    {selectedRecipe?.cuisine}
                  </Text>
                  <Text style={styles.modalMeta}>
                    {selectedRecipe?.difficulty}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.modalClose}
                onPress={() => setSelectedRecipe(null)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>
                Ingredients checklist
              </Text>
              {selectedRecipe?.ingredients?.map((ingredient, index) => {
                const isMissing = selectedRecipe?.missing?.includes(ingredient);
                return (
                  <View
                    key={`${ingredient}-${index}`}
                    style={[
                      styles.ingredientRow,
                      isMissing
                        ? styles.ingredientMissing
                        : styles.ingredientAvailable,
                    ]}
                  >
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                    <Text
                      style={[
                        styles.ingredientBadge,
                        isMissing
                          ? styles.ingredientBadgeMissing
                          : styles.ingredientBadgeAvailable,
                      ]}
                    >
                      {isMissing ? "Missing" : "In stock"}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Map everything to the new dynamic colors context
const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerRow: {
      padding: 20,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: colors.surface1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backButtonText: {
      color: colors.text1,
      fontWeight: "600",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text1,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 12,
      color: colors.text2,
      marginTop: 2,
    },
    count: {
      minWidth: 28,
      textAlign: "center",
      fontWeight: "700",
      color: colors.accent1,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
    },
    loadingText: {
      color: colors.text2,
      fontWeight: "500",
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 14,
    },
    filterCard: {
      backgroundColor: colors.surface1,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.surface1,
      color: colors.text1,
    },
    filterGroup: {
      gap: 10,
    },
    filterLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.text3,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    chipRow: {
      gap: 8,
      paddingVertical: 2,
    },
    chip: {
      backgroundColor: colors.surface2,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.text1, // High contrast active state
      borderColor: colors.text1,
    },
    chipText: {
      color: colors.text1,
      fontSize: 13,
      fontWeight: "600",
    },
    chipTextActive: {
      color: colors.bg, // Text matches background (black text in dark mode, white in light mode)
    },
    recipeCard: {
      backgroundColor: colors.surface1,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },
    recipeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    recipeTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text1,
    },
    recipeMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    recipeMeta: {
      fontSize: 13,
      color: colors.text2,
    },
    recipeMetaDot: {
      color: colors.text3,
    },
    recipeScore: {
      fontSize: 18,
      fontWeight: "800",
    },
    progressTrack: {
      height: 6, // Thinner, more elegant bar
      backgroundColor: colors.surface3,
      borderRadius: 999,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
    },
    recipeHint: {
      fontSize: 12,
      textAlign: "center",
      color: colors.text2,
      backgroundColor: colors.surface2,
      paddingVertical: 8,
      borderRadius: 10,
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      paddingTop: 60,
      paddingHorizontal: 24,
      gap: 8,
    },
    emptyStateCard: {
      backgroundColor: colors.surface1,
      borderRadius: 18,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text1,
    },
    emptyBody: {
      color: colors.text2,
      textAlign: "center",
      fontSize: 14,
    },
    primaryButton: {
      backgroundColor: colors.accent1,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg,
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryButton: {
      backgroundColor: colors.surface1,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text1,
      fontSize: 14,
      fontWeight: "600",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)", // Darker backdrop for better contrast
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: "80%",
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text1,
      marginBottom: 4,
    },
    modalMetaRow: {
      flexDirection: "row",
      gap: 8,
    },
    modalMeta: {
      fontSize: 12,
      color: colors.text2,
      backgroundColor: colors.surface2,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      fontWeight: "500",
    },
    modalClose: {
      backgroundColor: colors.surface2,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    modalCloseText: {
      color: colors.text1,
      fontWeight: "600",
      fontSize: 13,
    },
    modalBody: {
      padding: 20,
      gap: 12,
    },
    modalSectionTitle: {
      textTransform: "uppercase",
      fontSize: 11,
      fontWeight: "700",
      color: colors.text3,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    ingredientRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      backgroundColor: colors.surface1,
      borderColor: colors.border,
    },
    ingredientAvailable: {
      backgroundColor: colors.surface1,
    },
    ingredientMissing: {
      backgroundColor: colors.surface1, // Keep clean
    },
    ingredientText: {
      color: colors.text1,
      fontWeight: "600",
      fontSize: 14,
    },
    ingredientBadge: {
      fontSize: 11,
      fontWeight: "800",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    ingredientBadgeAvailable: {
      backgroundColor: colors.surface2,
      color: colors.success,
    },
    ingredientBadgeMissing: {
      backgroundColor: colors.surface2,
      color: colors.danger,
    },
  });
