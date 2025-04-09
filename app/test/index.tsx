// 首页组件，显示用户上传聊天记录的页面。
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Button } from "react-native";
import { Image, FileText } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ImageManipulator } from "expo-image-manipulator";
import { SaveFormat } from "expo-image-manipulator";
import { Link, useRouter } from "expo-router";
import { uploadImagesToSupabase } from "../../utils/supabase/supabase-storage";
// 最大可选图片数量
const MAX_IMAGES = 10;

export default function Index() {
  // 加载状态，用于禁用按钮防止重复操作
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * 从相册选择图片的函数
   * 允许用户从相册中选择一张或多张聊天记录截图（最多10张）
   */
  const pickImage = async () => {
    try {
      // 设置加载状态为true，防止用户重复点击
      setLoading(true);

      // 请求访问相册的权限
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      // 如果用户拒绝了权限请求，显示提示并返回
      if (permissionResult.granted === false) {
        Alert.alert("提示", "需要访问相册权限才能上传图片");
        return;
      }

      // 打开相册选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // 使用新的推荐方式，只选择图片类型
        allowsEditing: false, // 不允许编辑
        quality: 1, // 最高质量
        allowsMultipleSelection: true, // 允许多选图片
        selectionLimit: MAX_IMAGES // 限制最多选择50张图片
      });

      // 如果用户选择了图片（未取消操作）
      if (!result.canceled) {
        // 处理选择的图片
        console.log("选择的图片:", result.assets);

        try {
          // 压缩图片并获取URI
          const compressedImages = await Promise.all(
            result.assets.map(async asset => {
              // 使用expo-image-manipulator压缩图片
              // 质量设为0.5（50%），在保证文字清晰的前提下减小文件体积
              const manipulateContext = ImageManipulator.manipulate(asset.uri);
              const image = await manipulateContext.renderAsync();
              const compressedResult = await image.saveAsync({
                format: SaveFormat.JPEG,
                compress: 0.5
              });
              console.log(`原图大小: ${asset.fileSize} bytes, ` + `压缩后URI: ${compressedResult.uri}`);

              return compressedResult.uri;
            })
          );

          // 上传压缩后的图片到Supabase
          const uploadedUrls = await uploadImagesToSupabase(compressedImages);
          console.log("上传成功，图片URLs:", uploadedUrls);

          // TODO: 之后可以实现跳转到分析结果页面，并传递uploadedUrls
        } catch (error) {
          console.error("处理或上传图片时出错:", error);
        }
      }
    } catch (error) {
      // 错误处理
      console.error("选择图片时出错:", error);
    } finally {
      // 无论成功或失败，都将加载状态设为false
      setLoading(false);
    }
  };

  /**
   * 选择文件的函数
   * 允许用户选择从社交媒体导出的聊天记录文件
   */
  const pickDocument = async () => {
    try {
      // 设置加载状态为true，防止用户重复点击
      setLoading(true);

      // 打开文件选择器
      const result = await DocumentPicker.getDocumentAsync({
        type: ["*/*"], // 允许所有类型的文件
        copyToCacheDirectory: true // 将选择的文件复制到缓存目录，便于访问
      });

      // 如果用户选择了文件（未取消操作）
      if (result.canceled === false) {
        // 处理选择的文件
        console.log("选择的文件:", result.assets[0]);
        // TODO: 这里添加处理文件的逻辑，如上传到服务器或本地分析
        Alert.alert("成功", "文件已选择，正在分析中...");
        // TODO: 之后可以实现跳转到分析结果页面
      }
    } catch (error) {
      // 错误处理
      console.error("选择文件时出错:", error);
      Alert.alert("错误", "选择文件时出错");
    } finally {
      // 无论成功或失败，都将加载状态设为false
      setLoading(false);
    }
  };

  // 渲染组件UI
  return (
    // 主容器，使用Tailwind CSS样式
    <View className="flex-1 items-center justify-center bg-gray-100 p-4">
      {/* 应用标题 */}
      <Text className="text-2xl font-bold text-gray-800 mb-8">Red Flag AI</Text>

      {/* 应用描述 */}
      <Text className="text-base text-gray-600 mb-8 text-center">上传你和Crush的聊天记录，AI将分析他对你的喜欢程度</Text>

      {/* 上传选项区域 */}
      <View className="w-full space-y-4 mt-4">
        {/* 上传聊天截图选项 */}
        <TouchableOpacity
          className="bg-white p-4 rounded-xl flex-row items-center shadow-sm"
          onPress={pickImage} // 点击时调用pickImage函数
          disabled={loading} // 加载中时禁用按钮
        >
          {/* 图标容器 */}
          <View className="bg-red-50 p-3 rounded-lg">
            <Image size={24} color="#ef4444" />
          </View>

          {/* 选项文本区域 */}
          <View className="ml-4">
            <Text className="text-lg font-medium text-gray-800">上传聊天截图</Text>
            <Text className="text-sm text-gray-500">从相册中选择聊天记录截图（最多{MAX_IMAGES}张）</Text>
          </View>
        </TouchableOpacity>

        {/* 导入聊天文件选项 */}
        <TouchableOpacity
          className="bg-white p-4 rounded-xl flex-row items-center shadow-sm"
          onPress={pickDocument} // 点击时调用pickDocument函数
          disabled={loading} // 加载中时禁用按钮
        >
          {/* 图标容器 */}
          <View className="bg-blue-50 p-3 rounded-lg">
            <FileText size={24} color="#3b82f6" />
          </View>

          {/* 选项文本区域 */}
          <View className="ml-4">
            <Text className="text-lg font-medium text-gray-800">导入聊天文件</Text>
            <Text className="text-sm text-gray-500">导入从社交媒体导出的聊天记录</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 查看历史分析按钮 */}
      <TouchableOpacity
        className="mt-6 bg-white p-4 rounded-xl flex-row items-center justify-center shadow-sm"
        onPress={() => router.push("/chat-history")}>
        <Text className="text-gray-800 font-medium">查看历史分析结果</Text>
      </TouchableOpacity>

      {/* 底部隐私提示 */}
      <Text className="text-xs text-gray-400 mt-8 text-center">上传数据将被安全加密并仅用于分析目的</Text>

      {/* 开发导航链接 */}
      <View className="flex-row justify-center mt-4">
        <Link href="/chat-bot" className="text-blue-500 p-2 mx-2">
          ChatBot
        </Link>
        <Link href="/chat-history" className="text-blue-500 p-2 mx-2">
          聊天历史
        </Link>
        <Link href="/upload-chat" className="text-blue-500 p-2 mx-2">
          上传聊天
        </Link>
      </View>
    </View>
  );
}
