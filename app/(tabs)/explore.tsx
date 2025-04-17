// 引入 React Native 和 Expo 相关的组件和方法
import { StyleSheet, Platform, ScrollView, View } from "react-native"; // 用于布局、样式和平台判断
import { Image, ImageBackground } from "expo-image"; // 用于显示图片和背景图片
import { IconSymbol } from "@/components/ui/IconSymbol"; // 自定义的图标组件（本页面未用到）
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"; // 获取底部导航栏的高度
import { useHeaderHeight } from "@react-navigation/elements"; // 获取顶部导航栏（Header）的高度
import { useNavigation } from "@react-navigation/native"; // 用于页面跳转和设置导航栏选项
import React from "react";
import { Button } from "react-native"; // 按钮组件（本页面未用到）
import { Link } from "expo-router"; // 用于页面跳转的链接组件
import { Text } from "react-native"; // 用于显示文本内容

// 这是页面的主函数组件，代表一个 Tab 页面
export default function TabTwoScreen() {
  // 获取底部 TabBar 和顶部 Header 的高度，用于页面布局时留出空间
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();

  // 页面加载时设置导航栏的选项（比如右上角按钮，这里被注释掉了）
  React.useEffect(() => {
    navigation.setOptions({
      // headerRight: () => <Button onPress={() => {}} title="Update count" />
    });
  }, [navigation]);

  // 页面实际渲染的内容
  return (
    <View className="flex-1">{/* 最外层容器，flex-1 让它填满整个屏幕 */}
      <View className="" style={{ height: headerHeight }} />{/* 占位，顶部留出 header 的高度 */}
      <View className="flex-1 mt-9">{/* 主体内容区域，顶部有 margin */}
        <ImageBackground source={require("@/assets/images/home/card.svg")} className="w-[318] h-[385] self-center" />
        {/* 显示一张卡片背景图片，居中显示 */}
      </View>
      <View className="flex-row items-center self-center">{/* 横向排列的两个按钮，居中 */}
        <Link href="/chat-bot?type=chat">
          {/* 第一个按钮，点击后跳转到聊天机器人页面 */}
          <ImageBackground source={require("@/assets/images/home/chat.svg")} className="w-[176] h-[176] justify-end">
            {/* 按钮的背景图片 */}
            <Text className=" text-lg font-bold mb-8 ml-4">Chat with</Text>
            {/* 按钮上的文字 */}
          </ImageBackground>
        </Link>
        <Link href="/chat-bot?type=expert" className="ml-4">
          {/* 第二个按钮，跳转到专家聊天页面，左侧有间距 */}
          <ImageBackground source={require("@/assets/images/home/text.svg")} className="w-[176] h-[176] ml-4 justify-end">
            <Text className=" text-lg font-bold mb-8 ml-4">Text Expert</Text>
          </ImageBackground>
        </Link>
      </View>
      <View style={{ height: tabBarHeight }} className="w-full mb-4" />
      {/* 底部留出 TabBar 的高度，防止内容被遮挡 */}
    </View>
  );
}

// 定义页面用到的样式（本页面实际上没有用到这些样式）
const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute"
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8
  }
});