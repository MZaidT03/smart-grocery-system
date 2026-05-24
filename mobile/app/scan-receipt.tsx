import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/theme";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Minus,
  Plus,
  Trash2,
} from "lucide-react-native";
import { ImageEditor } from "expo-dynamic-image-crop";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ScannedItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  price?: string;
  usageQty?: string;
  usageDays?: string;
};

export default function ScanReceiptScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [configuringIndex, setConfiguringIndex] = useState<number | null>(null);

  const [rawImageUri, setRawImageUri] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setRawImageUri(result.assets[0].uri);
      setIsCropping(true);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to scan receipts.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setRawImageUri(result.assets[0].uri);
      setIsCropping(true);
    }
  };

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setLoading(true);
    setScannedItems([]);

    try {
      const formData = new FormData();
      formData.append("receipt", {
        uri,
        name: "receipt.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(`${API_BASE_URL}/ocr/scan-receipt`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const data = await res.json();

      if (data.success) {
        if (data.items.length === 0) {
          Alert.alert("No items found", "We couldn't recognize any standard grocery items from this receipt. Try taking a clearer photo.");
        } else {
          setScannedItems(data.items);
        }
      } else {
        throw new Error(data.error || "Failed to scan receipt");
      }
    } catch (error: any) {
      Alert.alert("Scan failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (id: string, field: keyof ScannedItem, value: any) => {
    setScannedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setScannedItems(prev => prev.filter(item => item.id !== id));
  };

  const startConfiguration = () => {
    if (scannedItems.length === 0) return;
    if (!userId) {
      Alert.alert("Error", "Not logged in");
      return;
    }
    setConfiguringIndex(0);
  };

  const handleNextConfig = () => {
    if (configuringIndex === null) return;
    if (configuringIndex < scannedItems.length - 1) {
      setConfiguringIndex(configuringIndex + 1);
    } else {
      setConfiguringIndex(null);
      confirmAndAdd();
    }
  };

  const confirmAndAdd = async () => {
    setAdding(true);
    try {
      for (const item of scannedItems) {
        if (item.quantity <= 0 || !item.name.trim()) continue;

        const payload = {
          userId,
          name: item.name.trim(),
          category: item.category || "Other",
          unit: item.unit,
          quantity: item.quantity,
          usageQty: parseFloat(item.usageQty || "1"),
          usageDays: parseFloat(item.usageDays || "7"),
          price: parseFloat(item.price || "0"),
          shelfLife: parseFloat(item.usageDays || "7") 
        };

        const res = await fetch(`${API_BASE_URL}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          console.log("Failed to add", item.name);
        }
      }

      Alert.alert("Success", "Items successfully added to your inventory!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text1} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!imageUri ? (
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
              <Camera size={40} color={colors.accent1} />
            </View>
            <Text style={styles.emptyTitle}>Capture your receipt</Text>
            <Text style={styles.emptyBody}>
              Take a photo of your grocery receipt to automatically add items to your inventory using AI.
            </Text>

            <View style={styles.actionRow}>
              <Pressable style={styles.actionBtn} onPress={takePhoto}>
                <Camera size={20} color={colors.bg} />
                <Text style={styles.actionBtnText}>Camera</Text>
              </Pressable>

              <Pressable style={styles.actionBtnSecondary} onPress={pickImage}>
                <ImageIcon size={20} color={colors.accent1} />
                <Text style={styles.actionBtnTextSecondary}>Gallery</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              
              <Pressable style={styles.retakeBtn} onPress={() => setImageUri(null)} disabled={loading || adding}>
                <Text style={styles.retakeText}>Retake</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.accent1} />
                <Text style={styles.loadingText}>Extracting text with AI...</Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                <Text style={styles.listTitle}>
                  Found {scannedItems.length} items
                </Text>

                {scannedItems.length > 0 && (
                  <View style={styles.cardsWrap}>
                    {scannedItems.map((item) => (
                      <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemCardTop}>
                          <TextInput
                            style={styles.nameInput}
                            value={item.name}
                            onChangeText={(val) => updateItem(item.id, "name", val)}
                            placeholderTextColor={colors.text3}
                          />
                          <Pressable onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                            <Trash2 size={16} color={colors.danger} />
                          </Pressable>
                        </View>

                        <View style={styles.itemControls}>
                          <View style={styles.qtyBox}>
                            <Pressable 
                              style={styles.qtyBtn} 
                              onPress={() => updateItem(item.id, "quantity", Math.max(1, item.quantity - 1))}
                            >
                              <Minus size={14} color={colors.text2} />
                            </Pressable>
                            <Text style={styles.qtyVal}>{item.quantity}</Text>
                            <Pressable 
                              style={styles.qtyBtn}
                              onPress={() => updateItem(item.id, "quantity", item.quantity + 1)}
                            >
                              <Plus size={14} color={colors.text2} />
                            </Pressable>
                          </View>

                          <Text style={styles.unitText}>{item.unit}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {scannedItems.length > 0 && (
                  <Pressable 
                    style={[styles.confirmBtn, adding && styles.disabledBtn]} 
                    onPress={startConfiguration}
                    disabled={adding}
                  >
                    {adding ? (
                      <ActivityIndicator size="small" color={colors.bg} />
                    ) : (
                      <CheckCircle2 size={18} color={colors.bg} />
                    )}
                    <Text style={styles.confirmBtnText}>Add {scannedItems.length} items to Inventory</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={configuringIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setConfiguringIndex(null)}
      >
        {configuringIndex !== null && (
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Configure Item</Text>
                <Text style={styles.modalSubtitle}>
                  {configuringIndex + 1} of {scannedItems.length}
                </Text>
              </View>

              <Text style={styles.currentItemName}>
                {scannedItems[configuringIndex].name}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 150"
                  placeholderTextColor={colors.text3}
                  keyboardType="numeric"
                  value={scannedItems[configuringIndex].price || ""}
                  onChangeText={(val) => updateItem(scannedItems[configuringIndex].id, "price", val)}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Usage Qty</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 1"
                    placeholderTextColor={colors.text3}
                    keyboardType="numeric"
                    value={scannedItems[configuringIndex].usageQty || ""}
                    onChangeText={(val) => updateItem(scannedItems[configuringIndex].id, "usageQty", val)}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Per Days</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 7"
                    placeholderTextColor={colors.text3}
                    keyboardType="numeric"
                    value={scannedItems[configuringIndex].usageDays || ""}
                    onChangeText={(val) => updateItem(scannedItems[configuringIndex].id, "usageDays", val)}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable 
                  style={[styles.actionBtnSecondary, { flex: 1, justifyContent: "center" }]} 
                  onPress={() => setConfiguringIndex(null)}
                >
                  <Text style={styles.actionBtnTextSecondary}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[styles.actionBtn, { flex: 1, justifyContent: "center" }]} 
                  onPress={handleNextConfig}
                >
                  <Text style={styles.actionBtnText}>
                    {configuringIndex < scannedItems.length - 1 ? "Next Item" : "Save & Add"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>

      {rawImageUri && (
        <ImageEditor
          isVisible={isCropping}
          imageUri={rawImageUri}
          dynamicCrop={true}
          onEditingComplete={(data) => {
            setIsCropping(false);
            processImage(data.uri);
          }}
          onEditingCancel={() => {
            setIsCropping(false);
            setRawImageUri(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg === "#000000" ? "rgba(74, 222, 128, 0.14)" : "#eaf7ef",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text1,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    color: colors.text2,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnText: {
    color: colors.bg,
    fontWeight: "800",
    fontSize: 16,
  },
  actionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnTextSecondary: {
    color: colors.accent1,
    fontWeight: "800",
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  imagePreviewWrap: {
    width: "100%",
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  retakeBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  retakeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: colors.text2,
    fontSize: 15,
    fontWeight: "700",
  },
  itemsList: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text1,
    marginBottom: 16,
  },
  cardsWrap: {
    gap: 12,
    marginBottom: 24,
  },
  itemCard: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  itemCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: colors.text1,
    padding: 0,
  },
  deleteBtn: {
    padding: 4,
  },
  itemControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyVal: {
    color: colors.text1,
    fontSize: 14,
    fontWeight: "800",
    width: 24,
    textAlign: "center",
  },
  unitText: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: "700",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent1,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: colors.bg,
    fontWeight: "800",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text1,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text3,
  },
  currentItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accent1,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text1,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  }
});
