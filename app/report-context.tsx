import React, { useState } from 'react';
import { View, Text, TextInput, Dimensions, ActivityIndicator } from "react-native";
import { Image, ImageBackground } from "expo-image";
import AppButton from "@/components/AppButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import { generateCrushReport } from '../utils/reports/reportService';

export default function ReportContextScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 从URL参数中获取图片URL（如果有）
  const imageUrls = params.imageUrls ? JSON.parse(params.imageUrls as string) : [];
  
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 处理提交
  const handleSubmit = async () => {
    if (!context.trim()) {
      setError('请输入一些上下文信息');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 准备消息数据
      const messages = [
        // 添加系统消息，包含用户提供的上下文
        {
          role: "user",
          content: `以下是我与暗恋对象的聊天记录截图，请分析我们的关系。\n\n额外上下文信息：${context}`
        }
      ];

      // 如果有图片，添加到消息中
      if (imageUrls.length > 0) {
        // 将图片URL添加到第一条消息的内容中
        const imageContent = imageUrls.map((url: string) => ({
          type: "image_url",
          image_url: { url }
        }));
        
        // 创建包含文本和图片的消息内容
        messages[0].content = [
          { type: "text", text: messages[0].content as string },
          ...imageContent
        ] as any;
      }

      // 调用报告生成服务
      const result = await generateCrushReport(messages);

      if (!result.success) {
        throw new Error(result.error || '生成报告失败');
      }

      // 导航到结果页面，传递报告数据
      router.push({
        pathname: '/report-result' as any,
        params: { 
          reportId: result.data.id 
        }
      });
    } catch (error) {
      console.error('生成报告时出错:', error);
      setError('生成报告时出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-2 text-center">添加上下文信息</Text>
        <Text className="text-base text-gray-600 mb-6 text-center">
          请提供一些额外信息，帮助AI更好地理解您的关系
        </Text>
        
        <TextInput
          className="border border-gray-300 rounded-xl p-4 min-h-[160] mb-4 text-base"
          multiline
          placeholder="例如：我们认识多久了，平时如何互动，我对Ta的感觉，我认为Ta对我的感觉..."
          placeholderTextColor="#9CA3AF"
          value={context}
          onChangeText={setContext}
        />
        
        {/* 错误信息 */}
        {error ? <Text className="text-red-500 mb-4">{error}</Text> : null}
        
        {/* 已上传的图片数量提示 */}
        <Text className="text-gray-500 italic mb-4">
          已上传 {imageUrls.length} 张聊天记录截图
        </Text>
      </View>
      
      {/* 底部"生成报告"按钮 */}
      <View className="flex-1 justify-end">
        <AppButton onPress={handleSubmit} disabled={loading}>
          {/* 使用背景图片作为按钮 */}
          <ImageBackground
            source={require("@/assets/images/button.png")}
            className="w-96 h-20 bg-gradient-to-br from-red-500/0 to-red-500/20 rounded-full self-center mb-10 overflow-hidden justify-center items-center">
            {/* 按钮文字 */}
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold font-['Poppins'] w-auto">生成暗恋分析报告</Text>
            )}
          </ImageBackground>
        </AppButton>
      </View>
    </View>
  );
}
