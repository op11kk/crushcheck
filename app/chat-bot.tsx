import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Send } from 'lucide-react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-chat', {
        body: { query: inputText },
      });
      
      if (error) throw error;
      
      // Add bot response to the chat
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data || 'Sorry, I couldn\'t process your request.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling Edge Function:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error processing your request. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-100 dark:bg-gray-900"
    >
      <View className="flex-1 p-4">
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                Start a conversation with the AI assistant
              </Text>
            </View>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                className={`mb-4 p-3 rounded-lg max-w-[80%] ${message.isUser ? 'bg-blue-500 self-end ml-auto' : 'bg-gray-200 dark:bg-gray-800 self-start'}`}
              >
                <Text className={`${message.isUser ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                  {message.content}
                </Text>
                <Text className={`text-xs mt-1 ${message.isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <TouchableOpacity
            onPress={sendMessage}
            disabled={isLoading || !inputText.trim()}
            className={`ml-2 p-2 rounded-full ${(!inputText.trim() || isLoading) ? 'opacity-50' : 'opacity-100'} ${isLoading ? 'bg-gray-300 dark:bg-gray-700' : 'bg-blue-500'}`}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
