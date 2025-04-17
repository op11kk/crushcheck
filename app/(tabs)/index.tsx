// 1. 引入各种第三方和自定义组件、工具
import { StyleSheet, Platform, View, Button, Text } from "react-native"; // React Native 的基础组件：布局、按钮、文本等
import { ScrollView } from "react-native"; // 可滚动的内容区域
import { LinearGradient } from "expo-linear-gradient"; // 用于设置页面背景的渐变色效果
import { Link, Stack } from "expo-router"; // Link 用于跳转页面，Stack 用于设置导航栏
import { Image, ImageBackground } from "expo-image"; // 用于展示图片和带背景的图片区域
import AppButton from "@/components/AppButton"; // 项目自定义的按钮组件，样式和交互更符合品牌
import { useHeaderHeight } from "@react-navigation/elements"; // 获取顶部导航栏的高度（适配不同设备）
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"; // 获取底部 TabBar 的高度（适配不同设备）
import { useSafeAreaInsets } from "react-native-safe-area-context"; // 获取设备的安全区域（如 iPhone 刘海、底部横条等）
import { useState } from "react"; // React 的状态管理钩子，用于让页面有交互
import { chooseFiles } from "@/utils/files"; // 自定义的文件选择工具（比如让用户选择图片）
import TestPurchase from "@/components/ui/TestPurchase"; // 购买测试功能的组件（比如内购测试）

// 2. 这是首页的主函数组件
export default function HomeScreen() {
  // 3. 获取顶部导航栏高度、底部 TabBar 高度和安全区边距
  const headerHeight = useHeaderHeight(); // 用于顶部留白，避免内容被导航栏挡住
  const tabBarHeight = useBottomTabBarHeight(); // 用于底部留白，避免内容被底部菜单挡住
  const insets = useSafeAreaInsets(); // 获取设备边缘的安全距离（如 iPhone 刘海/底部横条）

  // 4. 控制底部上传操作栏是否显示的状态（默认不显示）
  const [bottomActionsShown, setBottomActionsShown] = useState(false);

  // 5. 页面实际渲染部分
  return (
    // 用渐变色做整个页面的背景，视觉更美观
    <LinearGradient
      colors={["rgba(254, 247, 243, 1)", "rgba(255, 255, 255, 1)"]}
      className="flex-1"
      style={{ flex: 1 }}
    >
      {/* 设置页面导航栏（顶部标题栏），这里注释掉了标题和右上角按钮 */}
      <Stack.Screen
        options={{
          // headerTitle: "Red Flag AI", // 可以自定义导航栏标题
          // headerRight: () => <Button onPress={() => {}} title="Update count" /> // 可以加右上角按钮（目前没用）
        }}
      />

      {/* 可滚动的页面内容区域 */}
      <ScrollView>
        {/* 占位，让内容不会被顶部导航栏挡住 */}
        <View
          className="flex-row items-center justify-between mb-3"
          style={{ height: headerHeight }}
        />

        {/* 首页顶部的卡片：显示日期和“View report” */}
        <View
          className="self-center flex-row items-center justify-between w-96 h-24 pl-4 pr-4 bg-white rounded-3xl shadow-[2px_4px_12px_0px_rgba(207,207,207,0.25)]"
        >
          {/* 显示当前日期（这里写死了，可以改成动态） */}
          <Text className="text-zinc-800 text-xs font-normal font-['Poppins'] w-auto">
            Mar 20,2025
          </Text>
          {/* 右侧“View report”按钮和箭头图标 */}
          <View className="flex-row items-center">
            <Text className="text-neutral-600 text-xs font-medium font-['Poppins'] w-auto">
              View report{" "}
            </Text>
            <Image
              source={require("@/assets/images/home/right.svg")}
              className="w-4 h-[6]"
            />
          </View>
        </View>

        {/* 购买测试功能的区域，比如用于内购测试 */}
        <TestPurchase />

        {/* 底部占位，避免内容被底部菜单挡住 */}
        <View style={{ height: tabBarHeight }} className="w-full" />
      </ScrollView>

      {/* 如果 bottomActionsShown 为 true，显示一个半透明黑色遮罩，点击遮罩可以关闭底部操作栏 */}
      {bottomActionsShown && (
        <View
          onTouchStart={() => setBottomActionsShown(false)}
          className="absolute flex-1 bg-black/50 top-0 left-0 right-0 bottom-0"
        />
      )}

      {/* 固定在页面底部的操作栏 */}
      <View className="absolute bottom-0 self-center">
        {/* 如果 bottomActionsShown 为 true，显示上传相关的两个按钮 */}
        {bottomActionsShown && (
          <>
            {/* 上传截图按钮，点击后会弹出文件选择器 */}
            <AppButton
              onPress={() => {
                chooseFiles(); // 触发选择文件或图片
              }}
              className="self-center rounded-full w-[363] h-[72] mb-2 overflow-hidden"
              style={{ bottom: tabBarHeight }}
            >
              <View className="justify-center items-center w-[363] h-[72] rounded-full self-center mb-10 bg-white">
                <Text className="justify-center text-zinc-800 text-base font-normal font-['Poppins'] leading-tight [text-shadow:_0px_1px_3px_rgb(0_0_0_/_0.20)]">
                  Upload screenshot
                </Text>
              </View>
            </AppButton>
            {/* 跳转到上传整个聊天记录页面的按钮 */}
            <Link
              href="/upload-chat"
              className="self-center rounded-full w-[363] h-[72] mb-4 overflow-hidden"
              style={{ bottom: tabBarHeight }}
            >
              <View className="justify-center items-center w-[363] h-[72] rounded-full self-center mb-10 bg-white">
                <Text className="justify-center text-zinc-800 text-base font-normal font-['Poppins'] leading-tight [text-shadow:_0px_1px_3px_rgb(0_0_0_/_0.20)]">
                  Upload whole chat
                </Text>
              </View>
            </Link>
          </>
        )}

        {/* 固定显示的主上传按钮（橙色渐变），点击后才显示上面的两个具体上传按钮 */}
        <AppButton
          onPress={() => {
            setBottomActionsShown((o) => !o); // 切换 bottomActionsShown 状态
          }}
          className="self-center rounded-full w-[363] h-[72] mb-4 overflow-hidden"
          style={{ bottom: tabBarHeight }}
        >
          <ImageBackground
            source={require("@/assets/images/button.png")}
            className="justify-center items-center w-[363] h-[72] rounded-full self-center mb-10"
          >
            <Text className="text-white text-lg font-bold font-['Poppins'] w-auto">
              Upload chat
            </Text>
          </ImageBackground>
        </AppButton>
      </View>
    </LinearGradient>
  );
}