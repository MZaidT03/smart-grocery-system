import React from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';

interface ListGeneratorCardProps {
  listMode: "stock" | "catalog";
  setListMode: (mode: "stock" | "catalog") => void;
  daysToPlan: string;
  setDaysToPlan: (days: string) => void;
  categories: string[];
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  generating: boolean;
  handleGenerateList: () => void;
  styles: any;
  colors: any;
}

export default function ListGeneratorCard({
  listMode,
  setListMode,
  daysToPlan,
  setDaysToPlan,
  categories,
  selectedCategories,
  setSelectedCategories,
  generating,
  handleGenerateList,
  styles,
  colors
}: ListGeneratorCardProps) {
  return (
    <View style={styles.generatorCard}>
      <Text style={styles.sectionTitle}>Create new list</Text>
      <Text style={styles.sectionBody}>
        Generate a list from your pantry stock or from the catalog.
      </Text>

      <View style={styles.toggleRow}>
        <Pressable
          style={[
            styles.toggleChip,
            listMode === "stock" && styles.toggleChipActive,
          ]}
          onPress={() => setListMode("stock")}
        >
          <Text
            style={[
              styles.toggleChipText,
              listMode === "stock" && styles.toggleChipTextActive,
            ]}
          >
            Use stock
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleChip,
            listMode === "catalog" && styles.toggleChipActive,
          ]}
          onPress={() => setListMode("catalog")}
        >
          <Text
            style={[
              styles.toggleChipText,
              listMode === "catalog" && styles.toggleChipTextActive,
            ]}
          >
            Use catalog
          </Text>
        </Pressable>
      </View>

      <TextInput
        value={daysToPlan}
        onChangeText={setDaysToPlan}
        placeholder="Days to plan"
        placeholderTextColor={colors.text3}
        keyboardType="number-pad"
        style={styles.input}
      />

      {listMode === "catalog" && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionBody}>Filter categories (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipRow, { marginTop: 8 }]}>
            {categories.map((cat) => {
              const isActive = selectedCategories.includes(cat);
              return (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => {
                    if (isActive) setSelectedCategories(prev => prev.filter(c => c !== cat));
                    else setSelectedCategories(prev => [...prev, cat]);
                  }}
                >
                  <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={[styles.subtitle, { textAlign: 'left', marginTop: 4 }]}>Leave empty to include all.</Text>
        </View>
      )}

      <Pressable
        style={[
          styles.primaryButton,
          generating && styles.disabledButton,
        ]}
        onPress={handleGenerateList}
        disabled={generating}
      >
        <Text style={styles.primaryButtonText}>
          {generating ? "Generating..." : "Generate shopping list"}
        </Text>
      </Pressable>
    </View>
  );
}
