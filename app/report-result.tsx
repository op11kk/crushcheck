import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Image, ImageBackground } from "expo-image";
import AppButton from "@/components/AppButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getReportById } from '../utils/reports/reportService';
import { Share } from 'react-native';

export default function ReportResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 从URL参数中获取报告ID
  const reportId = params.reportId as string;
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 加载报告数据
  useEffect(() => {
    async function loadReport() {
      if (!reportId) {
        setError('未找到报告ID');
        setLoading(false);
        return;
      }

      try {
        const result = await getReportById(reportId);
        
        if (!result.success) {
          throw new Error(result.error || '获取报告失败');
        }
        
        setReport(result.report);
      } catch (error) {
        console.error('加载报告时出错:', error);
        setError('加载报告时出错，请重试');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [reportId]);

  // 分享报告
  const shareReport = async () => {
    if (!report) return;
    
    try {
      await Share.share({
        message: `我的暗恋分析报告：暗恋程度 ${report.crush_level_current_score}/10，查看更多详情下载CrushCheck应用！`,
        title: 'CrushCheck 暗恋分析报告'
      });
    } catch (error) {
      console.error('分享报告时出错:', error);
    }
  };

  // 渲染加载状态
  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-4 text-gray-600">正在加载您的暗恋分析报告...</Text>
      </View>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <AppButton onPress={() => router.back()}>
          <ImageBackground
            source={require("@/assets/images/button.png")}
            className="w-96 h-20 bg-gradient-to-br from-red-500/0 to-red-500/20 rounded-full self-center mb-10 overflow-hidden justify-center items-center">
            <Text className="text-white text-lg font-bold font-['Poppins'] w-auto">返回</Text>
          </ImageBackground>
        </AppButton>
      </View>
    );
  }

  // 渲染报告内容
  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-4 text-center">暗恋分析报告</Text>
        
        {/* 暗恋程度评分 */}
        <View className="bg-orange-50 rounded-xl p-4 mb-6">
          <Text className="text-xl font-bold mb-2 text-orange-600">暗恋程度</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-4xl font-bold text-orange-600">{report.crush_level_current_score}/10</Text>
            <Text className="text-lg font-medium text-gray-700">{report.crush_level_label}</Text>
          </View>
          
          {/* 潜在分数 */}
          {report.crush_level_potential_score && (
            <Text className="text-gray-600 mt-2">
              潜在发展空间: {report.crush_level_potential_score}/10 
              {report.crush_level_score_delta > 0 && (
                <Text className="text-green-600"> (+{report.crush_level_score_delta})</Text>
              )}
            </Text>
          )}
        </View>
        
        {/* 积极行为标签 */}
        {report?.crush_level_positive_tags && report.crush_level_positive_tags.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2">积极信号</Text>
            <View className="flex-row flex-wrap">
              {report.crush_level_positive_tags.map((tag: string, index: number) => (
                <View key={index} className="bg-green-100 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-green-800">{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* 消极行为标签 */}
        {report?.crush_level_negative_tags && report.crush_level_negative_tags.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2">需要注意的信号</Text>
            <View className="flex-row flex-wrap">
              {report.crush_level_negative_tags.map((tag: string, index: number) => (
                <View key={index} className="bg-red-100 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-red-800">{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* 暗恋对象的心理状态 */}
        {report?.crush_mind && (
          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <Text className="text-lg font-bold mb-2 text-blue-800">Ta的心理状态</Text>
            <Text className="text-gray-700">{report.crush_mind}</Text>
          </View>
        )}
        
        {/* 绿色信号 */}
        {report?.green_flags && report.green_flags.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2 text-green-700">绿色信号</Text>
            {report.green_flags.map((flag: any, index: number) => (
              <View key={index} className="bg-green-50 rounded-xl p-3 mb-2">
                <Text className="font-bold text-green-800">{flag.title}</Text>
                <Text className="text-gray-700 mt-1">{flag.description}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* 红色信号 */}
        {report?.red_flags && report.red_flags.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2 text-red-700">红色信号</Text>
            {report.red_flags.map((flag: any, index: number) => (
              <View key={index} className="bg-red-50 rounded-xl p-3 mb-2">
                <Text className="font-bold text-red-800">{flag.title}</Text>
                <Text className="text-gray-700 mt-1">{flag.description}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* 依恋风格 */}
        {report?.attachment_style_crush && report?.attachment_style_user && (
          <View className="bg-purple-50 rounded-xl p-4 mb-6">
            <Text className="text-lg font-bold mb-2 text-purple-800">依恋风格分析</Text>
            <Text className="font-medium text-purple-700 mb-1">您的风格: {report.attachment_style_user}</Text>
            <Text className="font-medium text-purple-700 mb-2">Ta的风格: {report.attachment_style_crush}</Text>
            {report.attachment_description && (
              <Text className="text-gray-700">{report.attachment_description}</Text>
            )}
          </View>
        )}
        
        {/* 互情分数 */}
        {report?.reciprocity_score_score !== undefined && (
          <View className="bg-yellow-50 rounded-xl p-4 mb-6">
            <Text className="text-lg font-bold mb-2 text-yellow-800">互动平衡度</Text>
            <View className="flex-row items-center mb-2">
              <View className="flex-1 h-3 bg-gray-200 rounded-full">
                <View 
                  className="h-3 bg-yellow-500 rounded-full" 
                  style={{ width: `${report.reciprocity_score_score}%` }} 
                />
              </View>
              <Text className="ml-2 font-bold">{report.reciprocity_score_score}%</Text>
            </View>
            {report.reciprocity_score_comment && (
              <Text className="text-gray-700">{report.reciprocity_score_comment}</Text>
            )}
          </View>
        )}
        
        {/* 兼容性分数 */}
        {report?.compatibility_score_score !== undefined && (
          <View className="bg-indigo-50 rounded-xl p-4 mb-6">
            <Text className="text-lg font-bold mb-2 text-indigo-800">兼容性评分</Text>
            <View className="flex-row items-center mb-2">
              <View className="flex-1 h-3 bg-gray-200 rounded-full">
                <View 
                  className="h-3 bg-indigo-500 rounded-full" 
                  style={{ width: `${report.compatibility_score_score}%` }} 
                />
              </View>
              <Text className="ml-2 font-bold">{report.compatibility_score_score}%</Text>
            </View>
            {report.compatibility_score_comment && (
              <Text className="text-gray-700">{report.compatibility_score_comment}</Text>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* 底部按钮 */}
      <View className="flex-row justify-around p-4">
        <AppButton onPress={() => router.back()}>
          <View className="w-40 h-14 bg-gray-200 rounded-full justify-center items-center">
            <Text className="text-gray-800 font-medium">返回</Text>
          </View>
        </AppButton>
        
        <AppButton onPress={shareReport}>
          <View className="w-40 h-14 bg-orange-500 rounded-full justify-center items-center">
            <Text className="text-white font-medium">分享报告</Text>
          </View>
        </AppButton>
      </View>
    </View>
  );
}
