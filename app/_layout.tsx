// 引入全局样式文件（全局 CSS，影响整个 App 的样式）
import "../global.css";

// 引入各种三方库和自定义组件
import FontAwesome from "@expo/vector-icons/FontAwesome"; // 字体图标库
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"; // 导航主题相关
import { useFonts } from "expo-font"; // 用于加载自定义字体
import { Stack } from "expo-router"; // 导航栈（页面路由）
import * as SplashScreen from "expo-splash-screen"; // 启动页控制
import { useEffect } from "react";
import { Image, ImageBackground } from "expo-image"; // 用于图片显示
import "react-native-reanimated"; // 动画库，必须全局引入

// NativeWind 用于 Tailwind 风格的样式支持
import { cssInterop, useColorScheme } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { Appearance, Platform } from "react-native"; // Appearance 控制系统亮/暗色，Platform 判断平台
import Purchases from "react-native-purchases"; // RevenueCat 内购库
import { ensureSession } from "@/utils/supabase/supabase"; // 保证 Supabase 用户会话有效

// 让 NativeWind 能识别 className 用于图片和渐变组件
cssInterop(Image, { className: "style" });
cssInterop(LinearGradient, { className: "style" });
cssInterop(ImageBackground, { className: "style" });

// 导出错误边界组件（页面出错时兜底用）
export {
  ErrorBoundary
} from "expo-router";

// expo-router 的特殊设置，初始路由为 (tabs)
export const unstable_settings = {
  initialRouteName: "(tabs)"
};

// 防止启动页过早消失，等资源加载完再隐藏
SplashScreen.preventAutoHideAsync();

// 强制 App 使用浅色模式（不跟随系统）
Appearance.setColorScheme("light");

// 应用的根组件
export default function RootLayout() {
  // 加载自定义字体文件，loaded 为 true 时加载完成
  const [loaded, errors] = useFonts({
    PoppinsSemiBold: require("@/assets/fonts/Poppins-SemiBold.ttf"),
    PoppinsMedium: require("@/assets/fonts/Poppins-Medium.otf"),
    PoppinsBold: require("@/assets/fonts/Poppins-Bold.ttf"),
    LindenHillItalic: require("@/assets/fonts/LindenHill-Italic.ttf"),
    LindenHillRegular: require("@/assets/fonts/LindenHill-Regular.ttf")
  });

  // 字体加载完成后，隐藏启动页
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 初始化用户会话和内购库
  useEffect(() => {
    ensureSession(); // 保证 Supabase 用户登录状态有效

    // 设置 RevenueCat 内购日志级别
    Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.ERROR);

    // 只在 iOS 上配置 RevenueCat
    if (Platform.OS === "ios") {
      Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_API_KEY! });
    }

    // 检查用户的内购信息
    (async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (typeof customerInfo.entitlements.active["Pro"] !== "undefined") {
          // 已购买 Pro 权限，可以在这里做权限控制
        }
        // 监听用户内购信息变化
        Purchases.addCustomerInfoUpdateListener(info => {
          // 这里可以处理内购权限变化
        });
      } catch (e) {
        console.log("getCustomerInfo", e);
        // 获取内购信息失败
      }
    })();
  }, []);

  // 字体没加载好时，不渲染任何内容
  if (!loaded) {
    return null;
  }

  // 字体加载好后，渲染主导航
  return <RootLayoutNav />;
}

// 负责管理页面导航和主题
function RootLayoutNav() {
  const colorScheme = useColorScheme(); // 检查当前主题（浅色/深色）

  return (
    <ThemeProvider value={colorScheme.colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: true, // 显示顶部导航栏
          headerShadowVisible: false, // 不显示阴影
          headerTransparent: true, // 顶部导航栏透明
          headerBlurEffect: "none",
          headerStyle: {
            backgroundColor: "transparent" // 顶部导航栏背景透明
          }
        }}>
        {/* 这里可以自定义每个页面的导航栏设置，比如标题、是否显示等 */}
        {/* <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
            headerTransparent: false,
            headerTitle: "Red Flag AI"
          }}
        /> */}
      </Stack>
    </ThemeProvider>
  );
}