// 引入 React 相关的钩子和组件
import React, { useState, useRef, useEffect } from "react";
// 引入 React Native 的基础组件
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from "react-native";
// 引入发送图标和图片图标
import { Send, Image as ImageIcon } from "lucide-react-native";
// 引入 Supabase（后端服务）
import { supabase } from "@/utils/supabase/supabase";
// 引入 Expo 的图片选择器
import * as ImagePicker from "expo-image-picker";
// 自定义的图片上传到 Supabase 的工具函数
import { uploadImageToSupabase } from "@/utils/supabase/supabase-storage";
// 获取顶部导航栏高度
import { useHeaderHeight } from "@react-navigation/elements";
// 获取安全区边距（如 iPhone 刘海/底部横条）
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 定义和 OpenAI 聊天接口兼容的消息内容类型
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

// 定义消息内容类型（支持文本和图片）
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

// 定义消息结构
type Message = {
  id: string; // 唯一标识
  content: MessageContent; // 消息内容
  isUser: boolean; // 是否用户发送
  timestamp: Date; // 发送时间
};

// 聊天机器人主组件
export default function ChatBot() {
  // 聊天消息列表
  const [messages, setMessages] = useState<Message[]>([]);
  // 输入框内容
  const [inputText, setInputText] = useState("");
  // 是否正在等待 AI 回复
  const [isLoading, setIsLoading] = useState(false);
  // 用于滚动到底部
  const scrollViewRef = useRef<ScrollView>(null);

  // 每次消息变化后自动滚动到底部
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // 已选中的图片（本地路径）
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 选择图片的函数
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // 只允许选图片
      allowsEditing: false,
      quality: 0.5,
      allowsMultipleSelection: true, // 可以多选
      selectionLimit: 9 // 最多选9张
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri); // 只取第一张
    }
  };

  // 辅助函数：把 Message 转成 OpenAI 需要的 content 格式
  const messageToContent = (message: Message): string | Array<ChatCompletionContentPart> => {
    if (typeof message.content === "string") {
      return message.content;
    } else if (Array.isArray(message.content)) {
      return message.content as Array<ChatCompletionContentPart>;
    } else {
      return [message.content as ChatCompletionContentPart];
    }
  };

  // 辅助函数：把 Message 转成 OpenAI 聊天格式
  const messageToOpenAIFormat = (message: Message): ChatCompletionMessageParam => {
    return {
      role: message.isUser ? "user" : "assistant",
      content: messageToContent(message)
    };
  };

  // 创建系统消息（给 AI 设定角色和指令）
  const createSystemMessage = (): ChatCompletionMessageParam => ({
    role: "system",
    content: "You are a helpful assistant analyzing chat conversations and images. Provide insightful, respectful responses."
  });

  // 发送消息的主逻辑
  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return; // 没有内容不发送

    let userContent: MessageContent;
    let currentMessageContent: Array<ChatCompletionContentPart> = [];

    setIsLoading(true); // 进入加载状态

    try {
      // 根据用户输入的内容（文本/图片/两者）生成消息内容
      if (inputText.trim() && selectedImage) {
        // 同时有文本和图片
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
        // 只有图片
        const imageUrl = await uploadImageToSupabase(selectedImage);

        userContent = { type: "image_url", image_url: { url: imageUrl } };
        currentMessageContent = [{ type: "image_url", image_url: { url: imageUrl } }];
      } else {
        // 只有文本
        userContent = { type: "text", text: inputText };
        currentMessageContent = [{ type: "text", text: inputText }];
      }

      // 立即在聊天界面显示用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        content: userContent,
        isUser: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText(""); // 清空输入框
      setSelectedImage(null); // 清空图片选择

      // 构建完整的对话历史（OpenAI 格式）
      const openAIMessages: Array<ChatCompletionMessageParam> = [];

      // 可以加系统消息（设定 AI 角色），目前注释掉
      // openAIMessages.push(createSystemMessage());

      // 添加历史消息
      messages.forEach(message => {
        openAIMessages.push(messageToOpenAIFormat(message));
      });

      // 添加当前用户消息
      openAIMessages.push({
        role: "user",
        content: currentMessageContent
      });

      // 调用 Supabase Edge Function 发送消息给后端（后端再请求 OpenAI）
      const { data, error } = await supabase.functions.invoke("analyze-chat", {
        body: {
          type: "chat",
          messages: openAIMessages
        }
      });

      if (error) throw error;

      // 把 AI 回复加到聊天界面
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: { type: "text", text: data?.message || "Sorry, I couldn't process your request." },
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling Edge Function:", error);

      // 出错时显示错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: { type: "text", text: "Sorry, there was an error processing your request. Please try again." },
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); // 结束加载
    }
  };

  // 获取顶部导航栏和安全区高度
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return (
    // 让输入框不会被键盘遮挡
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        {/* 聊天消息区域 */}
        <ScrollView ref={scrollViewRef} className="flex-1" contentContainerStyle={{ paddingBottom: 10 }}>
          {/* 顶部留白，避免消息被导航栏挡住 */}
          <View className="w-full" style={{ height: headerHeight }} />

          {/* 如果没有消息，显示提示 */}
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-gray-500 dark:text-gray-400 text-center">Start a conversation with the AI assistant</Text>
            </View>
          ) : (
            // 有消息时，渲染每一条消息
            messages.map(message => (
              <View
                key={message.id}
                className={`mb-4 p-3 rounded-lg max-w-[80%] ${
                  message.isUser ? "bg-blue-500 self-end ml-auto" : "bg-gray-200 dark:bg-gray-800 self-start"
                }`}>
                {/* 根据消息类型渲染内容 */}
                {typeof message.content === "string" ? (
                  <Text className={`${message.isUser ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>{message.content}</Text>
                ) : Array.isArray(message.content) ? (
                  // 多内容（如文本+图片）
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
                  // 单内容（文本或图片）
                  <View>
                    {message.content.type === "text" && message.content.text && (
                      <Text className={`${message.isUser ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>{message.content.text}</Text>
                    )}
                    {message.content.type === "image_url" && message.content.image_url && (
                      <Image source={{ uri: message.content.image_url.url }} className="w-full h-40 rounded-md mt-2" resizeMode="cover" />
                    )}
                  </View>
                )}
                {/* 显示消息时间 */}
                <Text className={`text-xs mt-1 ${message.isUser ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            ))
          )}
          {/* AI 回复时显示加载动画 */}
          {isLoading && (
            <View className="items-center justify-center py-4">
              <ActivityIndicator size="small" color="#0000ff" />
              <Text className="text-gray-500 dark:text-gray-400 mt-2">AI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* 底部输入区域 */}
        <View className="flex-row items-center mt-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2">
          {/* 已选图片预览和删除按钮 */}
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
          {/* 聊天输入框 */}
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
          {/* 选择图片按钮 */}
          <TouchableOpacity onPress={pickImage} className="ml-2 p-2 rounded-full bg-gray-300 dark:bg-gray-700">
            <ImageIcon size={20} color="white" />
          </TouchableOpacity>
          {/* 发送按钮 */}
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