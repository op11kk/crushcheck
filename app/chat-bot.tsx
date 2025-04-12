import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from "react-native";
import { Send, Image as ImageIcon } from "lucide-react-native";
import { supabase } from "@/utils/supabase/supabase";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToSupabase } from "@/utils/supabase/supabase-storage";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Define the types locally since we can't import them directly in React Native
type ChatCompletionContentPartText = {
  type: "text";
  text: string;
};

type ChatCompletionContentPartImage = {
  type: "image_url";
  image_url: {
    url: string;
  };
};

type ChatCompletionContentPart = ChatCompletionContentPartText | ChatCompletionContentPartImage;

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | Array<ChatCompletionContentPart>;
  name?: string;
};

type MessageContent =
  | string
  | Array<{
      type: "text" | "image_url";
      text?: string;
      image_url?: {
        url: string;
      };
    }>
  | {
      type: "text" | "image_url";
      text?: string;
      image_url?: {
        url: string;
      };
    };

type Message = {
  id: string;
  content: MessageContent;
  isUser: boolean;
  timestamp: Date;
};

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.5,
      allowsMultipleSelection: true,
      selectionLimit: 9
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Helper function to convert our Message to OpenAI's content format
  const messageToContent = (message: Message): string | Array<ChatCompletionContentPart> => {
    if (typeof message.content === "string") {
      return message.content;
    } else if (Array.isArray(message.content)) {
      return message.content as Array<ChatCompletionContentPart>;
    } else {
      return [message.content as ChatCompletionContentPart];
    }
  };

  // Helper function to convert our Message to OpenAI's message format
  const messageToOpenAIFormat = (message: Message): ChatCompletionMessageParam => {
    return {
      role: message.isUser ? "user" : "assistant",
      content: messageToContent(message)
    };
  };

  // Helper to create a system message
  const createSystemMessage = (): ChatCompletionMessageParam => ({
    role: "system",
    content: "You are a helpful assistant analyzing chat conversations and images. Provide insightful, respectful responses."
  });

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    let userContent: MessageContent;
    let currentMessageContent: Array<ChatCompletionContentPart> = [];

    // Set loading state and clear input fields
    setIsLoading(true);

    try {
      // Create content based on what's available for the current message
      if (inputText.trim() && selectedImage) {
        // Both text and image
        const imageUrl = await uploadImageToSupabase(selectedImage);

        userContent = [
          { type: "text", text: inputText },
          { type: "image_url", image_url: { url: imageUrl } }
        ];

        currentMessageContent = [
          { type: "text", text: inputText },
          { type: "image_url", image_url: { url: imageUrl } }
        ];
      } else if (selectedImage) {
        // Only image
        const imageUrl = await uploadImageToSupabase(selectedImage);

        userContent = { type: "image_url", image_url: { url: imageUrl } };
        currentMessageContent = [{ type: "image_url", image_url: { url: imageUrl } }];
      } else {
        // Only text
        userContent = { type: "text", text: inputText };
        currentMessageContent = [{ type: "text", text: inputText }];
      }

      // Add user message to the chat UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        content: userContent,
        isUser: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText("");
      setSelectedImage(null);

      // Build complete conversation history in OpenAI's message format
      const openAIMessages: Array<ChatCompletionMessageParam> = [];

      // Add system message to set the context
      // openAIMessages.push(createSystemMessage());

      // Add all previous messages in the conversation
      // Note: This doesn't include the message we just added, so we need to add it manually
      messages.forEach(message => {
        openAIMessages.push(messageToOpenAIFormat(message));
      });

      // Add the current user message
      openAIMessages.push({
        role: "user",
        content: currentMessageContent
      });

      // Call the Supabase Edge Function with the proper OpenAI message format
      const { data, error } = await supabase.functions.invoke("analyze-chat", {
        body: {
          type: "chat",
          messages: openAIMessages
        }
      });

      if (error) throw error;

      // Add bot response to the chat
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: { type: "text", text: data?.message || "Sorry, I couldn't process your request." },
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling Edge Function:", error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: { type: "text", text: "Sorry, there was an error processing your request. Please try again." },
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        <ScrollView ref={scrollViewRef} className="flex-1" contentContainerStyle={{ paddingBottom: 10 }}>
          <View className="w-full" style={{ height: headerHeight }} />

          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-gray-500 dark:text-gray-400 text-center">Start a conversation with the AI assistant</Text>
            </View>
          ) : (
            messages.map(message => (
              <View
                key={message.id}
                className={`mb-4 p-3 rounded-lg max-w-[80%] ${
                  message.isUser ? "bg-blue-500 self-end ml-auto" : "bg-gray-200 dark:bg-gray-800 self-start"
                }`}>
                {/* Render message content based on type */}
                {typeof message.content === "string" ? (
                  <Text className={`${message.isUser ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>{message.content}</Text>
                ) : Array.isArray(message.content) ? (
                  // Handle array of content parts
                  <View>
                    {message.content.map((part, index) => (
                      <View key={index} className="mb-2">
                        {part.type === "text" && part.text && (
                          <Text className={`${message.isUser ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>{part.text}</Text>
                        )}
                        {part.type === "image_url" && part.image_url && (
                          <Image source={{ uri: part.image_url.url }} className="w-full h-40 rounded-md mt-2" resizeMode="cover" />
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  // Handle single content part
                  <View>
                    {message.content.type === "text" && message.content.text && (
                      <Text className={`${message.isUser ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>{message.content.text}</Text>
                    )}
                    {message.content.type === "image_url" && message.content.image_url && (
                      <Image source={{ uri: message.content.image_url.url }} className="w-full h-40 rounded-md mt-2" resizeMode="cover" />
                    )}
                  </View>
                )}
                <Text className={`text-xs mt-1 ${message.isUser ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            ))
          )}
          {isLoading && (
            <View className="items-center justify-center py-4">
              <ActivityIndicator size="small" color="#0000ff" />
              <Text className="text-gray-500 dark:text-gray-400 mt-2">AI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View className="flex-row items-center mt-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2">
          {selectedImage && (
            <View className="mr-2 relative">
              <Image source={{ uri: selectedImage }} className="w-10 h-10 rounded-md" resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs">×</Text>
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            className="flex-1 text-gray-800 dark:text-gray-200"
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity onPress={pickImage} className="ml-2 p-2 rounded-full bg-gray-300 dark:bg-gray-700">
            <ImageIcon size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            className={`ml-2 p-2 rounded-full ${(!inputText.trim() && !selectedImage) || isLoading ? "opacity-50" : "opacity-100"} ${
              isLoading ? "bg-gray-300 dark:bg-gray-700" : "bg-blue-500"
            }`}>
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
