// 引入 React Native 基础组件：视图容器、文本、按钮和屏幕尺寸工具
import { View, Text, Button, Dimensions } from "react-native";
// 引入 React 核心库和 useRef 钩子（用于引用组件）
import React, { useRef } from "react";
// 引入获取顶部导航栏高度的工具，用于适配不同设备
import { useHeaderHeight } from "@react-navigation/elements";
// 引入导航相关工具，Stack 用于页面配置，useNavigation 用于页面跳转
import { Stack, useNavigation } from "expo-router";
// 引入 iOS 风格的符号图标组件（如关闭按钮）
import { SymbolView } from "expo-symbols";
// 引入 Expo 的图片组件，比原生 React Native 的性能更好
import { Image, ImageBackground } from "expo-image";
// 引入轮播图组件和其类型定义
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
// 引入动画相关工具
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
// 引入自定义按钮组件
import AppButton from "@/components/AppButton";
// 引入确保用户会话有效的工具函数
import { ensureSession } from "@/utils/supabase/supabase";
// 引入 RevenueCat 内购库
import Purchases from "react-native-purchases";
// 引入自定义倒计时组件
import CountDown from "@/components/ui/CountDown";

// 定义轮播图要展示的图片数组（两张图片轮流展示）
const banners = [require("@/assets/images/pay-wall/crush.svg"), require("@/assets/images/pay-wall/redflag.png")];

// 付费墙页面的主组件
export default function PayWall() {
  // 获取顶部导航栏高度，用于布局时避免内容被遮挡
  const headerHeight = useHeaderHeight();
  // 获取导航对象，用于控制页面跳转、返回等
  const navigation = useNavigation();
  // 获取设备屏幕尺寸信息
  const window = Dimensions.get("window");
  // 创建文字轮播的引用，用于控制轮播行为
  const textCarouselRef = useRef<ICarouselInstance>(null);

  // 页面加载时设置导航栏的样式和内容
  React.useEffect(() => {
    navigation.setOptions({
      // 右上角设置关闭按钮
      headerRight: () => (
        // 自定义圆形白色按钮
        <AppButton className="w-11 h-11 justify-center items-center bg-white rounded-full" onPress={() => navigation.goBack()}>
          {/* iOS 风格的 X 符号 */}
          <SymbolView
            weight="regular" // 符号粗细
            tintColor="black" // 符号颜色
            resizeMode="scaleAspectFit" // 缩放模式
            name="xmark" // 符号名称（X）
            style={[
              {
                width: 16, // 符号宽度
                height: 16 // 符号高度
              }
            ]}
          />
        </AppButton>
      ),
      // 左上角设置标题文本
      headerLeft: () => (
        // 标题文本样式设置
        <Text className="justify-center text-black/80 text-2xl font-medium font-['Poppins']" style={{}}>
          One time offer
        </Text>
      )
    });
  }, []); // 空数组表示只在组件挂载时执行一次

  // 创建动画值，用于轮播图指示器的动画效果
  const progress = useSharedValue<number>(0);
  // 创建轮播图的引用
  const ref = React.useRef<ICarouselInstance>(null);
  // 计算轮播图高度（根据屏幕宽度按比例计算）
  const bannerHeight = (204 * window.width) / 350;
  // 轮播图宽度等于屏幕宽度
  const bannerWidth = window.width;

  // 轮播图底部指示点的大小
  const indicatorDotSize = 8;

  // 渲染页面内容
  return (
    // 最外层容器，flex-1 让它填满整个屏幕
    <View className="flex-1">
      {/* 设置页面标题为空字符串 */}
      <Stack.Screen options={{ title: "" }} />
      {/* 顶部留白，避免内容被导航栏遮挡 */}
      <View className=" w-full" style={{ height: headerHeight }} />
      
      {/* 顶部文字区域：固定文字 + 轮播文字 */}
      <View className="w-full flex-row items-center justify-center mt-6 h-[36]">
        {/* 固定文字部分 */}
        <Text className="text-zinc-800 text-2xl font-normal font-['Poppins'] h-[36] self-center">Uncover his/her</Text>
        {/* 文字轮播组件，垂直滚动显示两种不同文本 */}
        <Carousel
          ref={textCarouselRef} // 设置引用，用于外部控制
          data={[" crush level", " 🚩Redflag"]} // 轮播的文本内容
          height={36} // 高度
          loop={true} // 循环播放
          pagingEnabled={true} // 分页效果
          snapEnabled={true} // 滑动时自动对齐
          width={120} // 宽度
          style={{
            width: 120
          }}
          vertical={true} // 垂直方向轮播
          modeConfig={{
            parallaxScrollingScale: 0.9, // 视差滚动缩放比例
            parallaxScrollingOffset: 50 // 视差滚动偏移量
          }}
          // 渲染每个轮播项
          renderItem={({ item }) => {
            // 每个轮播项是一个文本
            return <Text className="text-zinc-800 text-2xl font-normal font-['Poppins']">{item}</Text>;
          }}
        />
      </View>

      {/* 图片轮播和付费内容区域 */}
      <View id="carousel-component">
        {/* 图片轮播组件 */}
        <Carousel
          autoPlayInterval={3000} // 自动播放间隔 3 秒
          data={banners} // 轮播的图片数组
          height={bannerHeight} // 高度（前面计算的）
          loop={true} // 循环播放
          pagingEnabled={true} // 分页效果
          snapEnabled={true} // 滑动时自动对齐
          width={window.width} // 宽度等于屏幕宽度
          style={{
            width: window.width
          }}
          mode="parallax" // 视差效果模式
          modeConfig={{
            parallaxScrollingScale: 0.9, // 视差滚动缩放比例
            parallaxScrollingOffset: 50 // 视差滚动偏移量
          }}
          autoPlay={true} // 自动播放
          // 当轮播到某一项时触发
          onSnapToItem={index => {
            // 根据图片轮播索引同步文字轮播
            const textIndex = index % 2;
            // 控制文字轮播滚动到对应位置
            textCarouselRef.current?.scrollTo({ index: textIndex, animated: true });
          }}
          // 渲染每个轮播项
          renderItem={({ item }) => {
            // 每个轮播项是一个带有图片的视图
            return (
              <View
                className={`w-[${bannerWidth}] h-[${bannerHeight}] bg-white/80 rounded-[20px] overflow-hidden shadow-[inset_1px_-2px_2px_0px_rgba(0,0,0,0.08)] shadow-[inset_0px_1px_2px_0px_rgba(0,0,0,0.15)] self-center`}>
                {/* 轮播图片 */}
                <Image source={item} style={{ width: bannerWidth, height: bannerHeight }} />
              </View>
            );
          }}
        />
        
        {/* 轮播图底部指示点 */}
        <View className="self-center">
          {/* 静态指示点（灰色背景） */}
          <View className="flex-row items-center justify-center">
            {/* 遍历图片数组生成指示点 */}
            {banners.map((item, index) => (
              <View
                key={item} // 使用图片作为 key
                className="bg-zinc-400 rounded-3xl" // 灰色圆点
                style={{ width: indicatorDotSize, height: indicatorDotSize, marginLeft: index === 0 ? 0 : indicatorDotSize }} // 设置大小和间距
              />
            ))}
          </View>
          {/* 动态指示点（白色，会移动到当前轮播项位置） */}
          <Animated.View
            className="bg-white rounded-3xl absolute left-0" // 白色圆点，绝对定位
            style={[
              { width: indicatorDotSize, height: indicatorDotSize }, // 大小与静态点一致
              // 添加动画样式，根据 progress 值移动位置
              useAnimatedStyle(() => ({
                transform: [
                  {
                    translateX: progress.value * (2 * indicatorDotSize) // 水平移动距离
                  }
                ]
              }))
            ]}
          />
        </View>
        
        {/* 付费内容卡片（带背景图） */}
        <ImageBackground source={require("@/assets/images/pay-wall/bg.svg")} className="w-[368] h-[296] self-center mt-10">
          {/* 折扣标签：80% off */}
          <View className="w-20 h-8 bg-rose-100 rounded-xl overflow-hidden absolute -top-4 self-center">
            {/* 折扣文字 */}
            <Text className="left-[15px] top-[5px] absolute justify-center text-black text-base font-medium font-['Poppins']">80%off</Text>
          </View>
          
          {/* 价格展示区域 */}
          <View className="flex-row items-center justify-center mt-10">
            <Text className="text-zinc-800 text-xl font-medium font-['Poppins']">Only </Text>
            <Text className="text-red-400 text-3xl font-medium font-['Poppins']">$</Text>
            <Text className="text-red-400 text-3xl font-normal font-['Impact']">3.99</Text>
            <Text className="text-zinc-800 text-xl font-medium font-['Poppins']">/week </Text>
          </View>
          
          {/* 倒计时区域 */}
          <View className="flex-row self-center flex-1 justify-center items-center">
            <View>
              {/* 倒计时组件 */}
              <View className="flex-row items-center justify-center">
                <CountDown />
              </View>
              {/* 闹钟表情图标 */}
              <Text className="text-center justify-center text-black text-xl font-medium font-['Poppins'] absolute -top-3 -left-3">⏰</Text>
            </View>
          </View>
          
          {/* 购买按钮 */}
          <AppButton
            onPress={async () => {
              try {
                // 确保用户已登录
                await ensureSession();
                // 获取内购商品信息（周付费 $3.99）
                const products = await Purchases.getProducts(["crushsign_weekly_399"]);
                console.log(products);
                // 发起购买流程
                const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
                // 检查是否购买成功并获得 Pro 权限
                if (typeof customerInfo.entitlements.active["Pro"] !== "undefined") {
                  // 这里可以添加购买成功后的逻辑
                }
              } catch (e) {
                // 处理购买失败的情况（用户取消除外）
                if (!e.userCancelled) {
                  console.log("Error purchasing product:", e);
                }
              }
            }}
            className="w-[329] h-[97] self-center mb-8"> {/* 按钮样式 */}
            {/* 使用图片作为按钮背景 */}
            <Image source={require("@/assets/images/pay-wall/button.png")} className="w-[329] h-[97]" />
          </AppButton>
        </ImageBackground>
      </View>
    </View>
  );
}
