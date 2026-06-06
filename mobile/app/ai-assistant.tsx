import React, { useState, useRef, useMemo, memo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send, Sparkles, Bot } from "lucide-react-native";
import { useTheme } from "@/context/theme";
import { API_BASE_URL } from "@/constants/api";

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  mode?: string;
};

const SUGGESTIONS = [
  "Best recipe from my inventory",
  "What can I cook with milk?",
  "Dinner from my pantry",
  "Quick breakfast idea",
  "Recipe with milk and cocoa",
];

// Simple global state for persistence across unmounts
let globalMessages: Message[] = [
  {
    id: "1",
    text: "Hi! I'm your Smart Grocer Assistant. Ask me about products, budget, or cheaper alternatives!",
    isUser: false,
  },
];

/**
 * Handles bolding (**text**) AND line breaks (\n) which are common in AI responses.
 */
const renderMessageText = (text: string, baseStyle: any) => {
  const paragraphs = text.split("\n");

  return paragraphs.map((paragraph, pIndex) => {
    if (!paragraph.trim()) {
      return <View key={pIndex} style={{ height: 8 }} />; // Spacing for empty lines
    }

    const parts = paragraph.split(/(\*\*.*?\*\*)/g);
    return (
      <Text key={pIndex} style={[baseStyle, { marginBottom: 2 }]}>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <Text key={index} style={{ fontWeight: "800" }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  });
};

/**
 * Memoized Message Item to prevent re-rendering the whole list on every keystroke
 */
const MessageItem = memo(({ msg, styles, colors }: any) => {
  const isUser = msg.isUser;

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Bot size={18} color={colors.accent1} />
        </View>
      )}
      <View style={styles.messageBubbleWrapper}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <View>
            {renderMessageText(
              msg.text,
              [styles.messageText, isUser ? styles.userText : styles.assistantText]
            )}
          </View>
        </View>
        {!isUser && msg.mode && (
          <Text style={styles.modelFooterText}>✨ Powered by {msg.mode}</Text>
        )}
      </View>
    </View>
  );
});

export default function AiAssistantScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const [messages, setMessages] = useState<Message[]>(globalMessages);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), text, isUser: true };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    globalMessages = newMessages;

    setInputText("");
    setLoading(true);
    Keyboard.dismiss();

    try {
      const historyPayload = messages.map((m) => ({
        role: m.isUser ? "user" : "model",
        text: m.text,
      }));

      const res = await fetch(`${API_BASE_URL}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          userId,
          history: historyPayload,
        }),
      });
      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.success ? data.answer : "Sorry, I encountered an error trying to answer that.",
        isUser: false,
        mode: data.mode,
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        globalMessages = updated;
        return updated;
      });
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Network error. Please check your connection and try again.",
        isUser: false,
      };
      setMessages((prev) => {
        const updated = [...prev, errorMessage];
        globalMessages = updated;
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.text1} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Assistant</Text>
            <Text style={styles.headerSubtitle}>Ask about products & ideas</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContainer}
          >
            {SUGGESTIONS.map((suggestion, idx) => (
              <Pressable
                key={idx}
                style={styles.suggestionChip}
                onPress={() => sendMessage(suggestion)}
                disabled={loading}
              >
                <Sparkles size={14} color={colors.accent1} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageItem msg={item} styles={styles} colors={colors} />}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListFooterComponent={
            loading ? (
              <View style={[styles.messageRow, styles.messageRowAssistant]}>
                <View style={styles.avatar}>
                  <Bot size={18} color={colors.accent1} />
                </View>
                <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                  <ActivityIndicator size="small" color={colors.accent1} />
                  <Text style={styles.assistantText}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask anything..."
            placeholderTextColor={colors.text3}
            style={styles.textInput}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
            editable={!loading}
          />
          <Pressable
            style={[
              styles.sendButton,
              (loading || !inputText.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={loading || !inputText.trim()}
          >
            <Send size={18} color={colors.bg} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitleContainer: {
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text1,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.text3,
      marginTop: 2,
    },
    suggestionsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 10,
    },
    suggestionChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 6,
    },
    suggestionText: {
      fontSize: 13,
      color: colors.text1,
      fontWeight: "500",
    },
    chatContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 16,
    },
    messageRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 6,
    },
    messageRowUser: {
      justifyContent: "flex-end",
    },
    messageRowAssistant: {
      justifyContent: "flex-start",
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    messageBubbleWrapper: {
      maxWidth: "80%",
    },
    messageBubble: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
    },
    userBubble: {
      backgroundColor: colors.text1,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    loadingBubble: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    userText: {
      color: colors.bg,
    },
    assistantText: {
      color: colors.text1,
    },
    modelFooterText: {
      fontSize: 11,
      color: colors.text3,
      marginTop: 6,
      marginLeft: 4,
      fontStyle: "italic",
    },
    inputContainer: {
      flexDirection: "row",
      padding: 16,
      paddingBottom: Platform.OS === "ios" ? 34 : 16, // Better safe area handling
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface1, // Slightly offset from background
      alignItems: "center",
      gap: 12,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
      fontSize: 15,
      color: colors.text1,
      maxHeight: 100, // Allows for multiline expansion later if needed
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accent1,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
  });