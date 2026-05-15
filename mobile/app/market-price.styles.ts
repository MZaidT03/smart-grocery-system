import { StyleSheet } from "react-native";

export const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
      zIndex: 10,
    },
    iconButton: {
      padding: 8,
      marginLeft: -8,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text1,
      letterSpacing: -0.5,
    },
    headerSpacer: {
      width: 40,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    // FlatList container
    flatListContent: {
      padding: 20,
      paddingBottom: 40,
    },
    dashboardHeader: {
      gap: 20,
      paddingBottom: 8,
    },
    // Hero Section
    heroCard: {
      backgroundColor: colors.surface1,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroLabel: {
      color: colors.text2,
      fontSize: 14,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    heroValue: {
      color: colors.text1,
      fontSize: 42,
      fontWeight: "800",
      letterSpacing: -1,
      marginBottom: 24,
    },
    scrapeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent1,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 100,
      width: "100%",
      gap: 8,
    },
    scrapeButtonText: {
      color: colors.bg,
      fontSize: 16,
      fontWeight: "700",
    },
    spinningIcon: {
      opacity: 0.8,
    },
    disabledButton: {
      opacity: 0.6,
    },
    // KPI Row
    kpiRow: {
      flexDirection: "row",
      gap: 16,
    },
    kpiBox: {
      flex: 1,
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kpiIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    kpiLabel: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 4,
    },
    kpiValue: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "700",
    },
    kpiSubText: {
      color: colors.accent1,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    // Section Cards
    sectionCard: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      color: colors.text1,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    // Column Chart (Vertical Bars)
    columnChartContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 180,
      marginTop: 10,
      paddingHorizontal: 10,
    },
    columnWrap: {
      alignItems: "center",
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
      gap: 8,
    },
    columnValue: {
      color: colors.text2,
      fontSize: 12,
      fontWeight: "700",
    },
    columnTrack: {
      width: 36,
      flex: 1,
      backgroundColor: colors.surface2,
      borderRadius: 8,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    columnFill: {
      width: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 8,
    },
    columnLabel: {
      color: colors.text2,
      fontSize: 11,
      fontWeight: "600",
    },
    // Bar Chart (Horizontal Bars)
    barChartContainer: {
      gap: 16,
      marginTop: 4,
    },
    barChartRow: {
      gap: 8,
    },
    barChartLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    barCategoryLabel: {
      color: colors.text1,
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
    },
    barPriceLabel: {
      color: colors.text2,
      fontSize: 13,
      fontWeight: "600",
    },
    barTrack: {
      height: 10,
      backgroundColor: colors.surface2,
      borderRadius: 999,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      backgroundColor: colors.accent1,
      borderRadius: 999,
    },
    // List Header & Search
    listHeaderWrap: {
      marginTop: 8,
      gap: 12,
      marginBottom: 8,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      height: 52,
      color: colors.text1,
      fontSize: 15,
      fontWeight: "500",
    },
    // Individual Card Items
    itemCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
    },
    itemCardSelected: {
      borderColor: colors.accent1,
      backgroundColor: "rgba(16, 185, 129, 0.05)",
    },
    selectionIconWrap: {
      marginRight: 14,
    },
    itemInfo: {
      flex: 1,
      paddingRight: 16,
    },
    itemName: {
      color: colors.text1,
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 4,
    },
    itemCategory: {
      color: colors.text3,
      fontSize: 12,
      fontWeight: "500",
    },
    itemPriceWrap: {
      alignItems: "flex-end",
    },
    itemPriceLabel: {
      color: colors.text3,
      fontSize: 10,
      textTransform: "uppercase",
      fontWeight: "700",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    itemPrice: {
      color: colors.accent1,
      fontSize: 16,
      fontWeight: "800",
    },
    // Empty States
    emptyStateCard: {
      backgroundColor: colors.surface1,
      borderRadius: 20,
      padding: 32,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    emptyListWrap: {
      paddingVertical: 32,
      alignItems: "center",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      color: colors.text1,
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 8,
    },
    emptyBody: {
      color: colors.text2,
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: colors.accent1,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 24,
      width: "100%",
      alignItems: "center",
    },
    primaryButtonText: {
      color: colors.bg,
      fontWeight: "700",
      fontSize: 16,
    },
  });
