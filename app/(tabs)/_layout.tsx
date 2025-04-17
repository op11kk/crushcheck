// 导入导航相关的组件：Link(链接到其他页面)、Stack(页面堆栈)、Tabs(底部标签栏)
import { Link, Stack, Tabs } from "expo-router";
// 导入React基础库，这是所有React应用的核心
import React from "react";
// 导入基础UI组件：按钮、平台检测工具、视图容器
import { Button, Platform, View } from "react-native";
// 导入高性能图片组件，用于显示图片
import { Image } from "expo-image";

// 导入自定义的带触觉反馈的标签组件，点击时会有轻微震动
import { HapticTab } from "@/components/HapticTab";
// 导入自定义的图标符号组件
import { IconSymbol } from "@/components/ui/IconSymbol";
// 导入自定义的标签栏背景组件
import TabBarBackground from "@/components/ui/TabBarBackground";
// 导入颜色配置，定义了应用中使用的各种颜色
import { Colors } from "@/utils/Colors";
// 导入颜色方案工具，用于支持深色/浅色模式
import { useColorScheme } from "nativewind";
// 导入Ant Design图标库
import { AntDesign } from "@expo/vector-icons";

// 定义主要的标签页布局组件，这是应用的主要导航结构
export default function TabLayout() {
  // 获取当前设备的颜色方案（深色/浅色模式）
  const colorScheme = useColorScheme();

  // 返回组件的UI结构
  return (
    // 空标签<>...</>是React片段，用于包裹多个元素而不添加额外的DOM节点
    <>
      {/* 配置导航栈的屏幕，这是顶部导航栏的设置 */}
      <Stack.Screen
        options={{
          headerShown: false,           // 隐藏顶部导航栏
          headerTransparent: true,      // 设置导航栏为透明
          headerBlurEffect: "none",     // 不使用模糊效果
          headerTitleAlign: "center",   // 标题居中对齐
          headerTitle: "",              // 标题为空
          // 设置导航栏左侧显示的内容，这里是一个logo图片
          headerLeft: () => <Image source={require("@/assets/images/home/explore.svg")} className="w-[65] h-[22]" />,
          // 设置导航栏右侧显示的内容，这里是一个设置按钮
          headerRight: () => (
            // Link组件用于导航到设置页面
            <Link href="/settings">
              {/* 创建一个白色圆形背景的容器 */}
              <View className="justify-center items-center w-12 h-12 bg-white rounded-full">
                {/* 显示设置图标 */}
                <Image source={require("@/assets/images/home/settings.svg")} className="w-[20] h-[20]" />
              </View>
            </Link>
          ),
          // 设置导航栏样式，背景为透明
          headerStyle: {
            backgroundColor: "transparent"
          }
        }}
      />
      {/* 创建底部标签栏导航 */}
      <Tabs
        screenOptions={{
          // 设置激活状态的标签颜色，根据当前是深色还是浅色模式选择
          tabBarActiveTintColor: Colors[colorScheme.colorScheme ?? "light"].tint,
          headerShown: true,            // 显示顶部导航栏
          tabBarButton: HapticTab,      // 使用自定义的带触觉反馈的标签按钮
          // 下面这行被注释掉了，原本是设置标签栏的背景
          // tabBarBackground: TabBarBackground,
          // 根据不同平台(iOS/Android)设置不同的标签栏样式
          tabBarStyle: Platform.select({
            ios: {
              // iOS平台特有的样式设置
              position: "absolute",     // 绝对定位，使标签栏浮动在内容上
              borderTopWidth: 0,        // 移除顶部边框
              backgroundColor: "transparent" // 背景透明
            },
            default: {}                 // 其他平台使用默认样式
          }),
          headerTransparent: true,      // 导航栏透明
          headerStyle: {
            backgroundColor: "transparent" // 导航栏背景透明
          }
        }}>
        {/* 定义第一个标签页：首页 */}
        <Tabs.Screen
          name="index"                  // 页面路由名称
          options={{
            title: "Home",              // 显示的标签名称
            headerTitleAlign: "left",   // 标题左对齐
            // 设置标签图标，color参数表示当前标签的颜色状态(选中/未选中)
            tabBarIcon: ({ color }) => <Image source={require("@/assets/images/home/tab_home.svg")} className="w-[20] h-[20]" tintColor={color} />,
            // 下面这行被注释掉了，原本是设置导航栏左侧的logo
            // headerLeft: () => <Image source={require("@/assets/images/home/explore.svg")} className="w-[65] h-[22] ml-4" />,
            // 设置导航栏右侧的设置按钮
            headerRight: () => (
              // 链接到设置页面，右边距4个单位
              <Link href="/settings" className=" mr-4">
                {/* 创建一个白色圆形背景的容器 */}
                <View className="justify-center items-center w-12 h-12 bg-white rounded-full">
                  {/* 显示设置图标 */}
                  <Image source={require("@/assets/images/home/settings.svg")} className="w-[20] h-[20]" />
                </View>
              </Link>
            )
          }}
        />
        {/* 定义第二个标签页：探索 */}
        <Tabs.Screen
          name="explore"                // 页面路由名称
          options={{
            title: "Explore",           // 显示的标签名称
            headerTitle: "",            // 导航栏标题为空
            // 设置标签图标
            tabBarIcon: ({ color }) => <Image source={require("@/assets/images/home/tab_explore.svg")} className="w-[20] h-[19]" tintColor={color} />,
            // 设置导航栏左侧的logo，左边距4个单位
            headerLeft: () => <Image source={require("@/assets/images/home/explore.svg")} className="w-[65] h-[22] ml-4" />,
            // 设置导航栏右侧的设置按钮
            headerRight: () => (
              // 链接到设置页面，右边距4个单位
              <Link href="/settings" className=" mr-4">
                {/* 创建一个白色圆形背景的容器 */}
                <View className="justify-center items-center w-12 h-12 bg-white rounded-full">
                  {/* 显示设置图标 */}
                  <Image source={require("@/assets/images/home/settings.svg")} className="w-[20] h-[20]" />
                </View>
              </Link>
            )
          }}
        />
      </Tabs>
    </>
  );
}
