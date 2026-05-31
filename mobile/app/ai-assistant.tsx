import React, { useState, useRef, useMemo, useEffect } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Send, Sparkles, Bot } from "lucide-react-native";
import { useTheme } from "@/context/theme";
import { useLocalSearchParams } from "expo-router";
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
  "Recipe with milk and cocoa powder",
];
let globalMessages: Message[] = [
  {
    id: "1",
    text: "Hi! I'm your Smart Grocer Assistant. Ask me about products, budget, or cheaper alternatives!",
    isUser: false,
  },
];

const renderMessageText = (text: string, baseStyle: any) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={{ fontWeight: 'bold' }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

export default function AiAssistantScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  
  const [messages, setMessages] = useState<Message[]>(globalMessages);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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
      const historyPayload = messages.map(m => ({
        role: m.isUser ? "user" : "model",
        text: m.text
      }));

      const res = await fetch(`${API_BASE_URL}/api/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          question: text, 
          userId,
          history: historyPayload
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

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.text1} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Smart Grocer Assistant</Text>
            <Text style={styles.headerSubtitle}>Ask about products, budget & ideas</Text>
          </View>
          <View style={{ width: 44 }} /> {/* Spacer for balance */}
        </View>

        {/* Suggestion Chips */}
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
                <Sparkles size={12} color={colors.accent1} style={{ marginRight: 4 }} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Chat List */}
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View 
              key={msg.id} 
              style={[
                styles.messageRow, 
                msg.isUser ? styles.messageRowUser : styles.messageRowAssistant
              ]}
            >
              {!msg.isUser && (
                <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
                  <Bot size={18} color={colors.accent1} />
                </View>
              )}
              <View style={styles.messageBubbleWrapper}>
                <View 
                  style={[
                    styles.messageBubble, 
                    msg.isUser ? styles.userBubble : styles.assistantBubble
                  ]}
                >
                  {renderMessageText(
                    msg.text,
                    [styles.messageText, msg.isUser ? styles.userText : styles.assistantText]
                  )}
                </View>
                {!msg.isUser && msg.mode && (
                  <Text style={styles.modelFooterText}>
                    ✨ Powered by {msg.mode}
                  </Text>
                )}
              </View>
            </View>
          ))}
          {loading && (
            <View style={[styles.messageRow, styles.messageRowAssistant]}>
              <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
                <Bot size={18} color={colors.accent1} />
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <ActivityIndicator size="small" color={colors.accent1} />
                <Text style={styles.assistantText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me: snacks under Rs. 500..."
            placeholderTextColor={colors.text3}
            style={styles.textInput}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
            editable={!loading}
          />
          <Pressable 
            style={[styles.sendButton, loading || !inputText.trim() ? styles.sendButtonDisabled : {}]} 
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
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 15,
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
      fontSize: 18,
      fontWeight: "800",
      color: colors.text1,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.text3,
      marginTop: 2,
    },
    suggestionsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 8,
    },
    suggestionChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
    },
    suggestionText: {
      fontSize: 13,
      color: colors.text1,
      fontWeight: "600",
    },
    chatContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 16,
    },
    messageRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 4,
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
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
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
      backgroundColor: colors.text1, // Pure dark for high contrast minimal
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
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
      fontSize: 10,
      color: colors.text3,
      marginTop: 4,
      marginLeft: 4,
      fontStyle: 'italic',
    },
    inputContainer: {
      flexDirection: "row",
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
      alignItems: "center",
      gap: 12,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.surface1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text1,
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
      opacity: 0.5,
    },
  });
