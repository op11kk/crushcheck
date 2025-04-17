// 引入 React Native 基础组件：视图、文本、可点击区域和屏幕尺寸工具
import { View, Text, Pressable, TouchableOpacity, Dimensions } from "react-native";
// 引入 Expo 的图片组件，用于显示图片和背景图片
import { Image, ImageBackground } from "expo-image";
// 引入自定义按钮组件
import AppButton from "@/components/AppButton";
// 引入 React 核心库
import React from "react";
// 引入获取顶部导航栏高度的工具，用于适配不同设备
import { useHeaderHeight } from "@react-navigation/elements";
// 引入高性能列表组件和视图令牌类型（用于列表滚动监听）
import { FlashList, ViewToken } from "@shopify/flash-list";

// 定义各聊天平台的数据，包括图标、名称和教程截图
const pageDataList = [
  {
    source: require("@/assets/images/upload-chat/whatsapp.svg"), // WhatsApp 图标
    name: "WhatsApp", // 平台名称
    images: [ // WhatsApp 教程截图（5张）
      require("@/assets/images/upload-chat/whatsapp/1.png"),
      require("@/assets/images/upload-chat/whatsapp/2.png"),
      require("@/assets/images/upload-chat/whatsapp/3.png"),
      require("@/assets/images/upload-chat/whatsapp/4.png"),
      require("@/assets/images/upload-chat/whatsapp/5.png")
    ]
  },
  // { source: require("@/assets/images/upload-chat/telegram.svg"), name: "Telegram" }, // Telegram 暂时被注释掉
  {
    source: require("@/assets/images/upload-chat/messenger.svg"), // Messenger 图标
    name: "Messenger", // 平台名称
    images: [ // Messenger 教程截图（14张）
      require("@/assets/images/upload-chat/messenger/1.png"),
      require("@/assets/images/upload-chat/messenger/2.png"),
      require("@/assets/images/upload-chat/messenger/3.png"),
      require("@/assets/images/upload-chat/messenger/4.png"),
      require("@/assets/images/upload-chat/messenger/5.png"),
      require("@/assets/images/upload-chat/messenger/6.png"),
      require("@/assets/images/upload-chat/messenger/7.png"),
      require("@/assets/images/upload-chat/messenger/8.png"),
      require("@/assets/images/upload-chat/messenger/9.png"),
      require("@/assets/images/upload-chat/messenger/10.png"),
      require("@/assets/images/upload-chat/messenger/11.png"),
      require("@/assets/images/upload-chat/messenger/12.png"),
      require("@/assets/images/upload-chat/messenger/13.png"),
      require("@/assets/images/upload-chat/messenger/14.png")
    ]
  },
  {
    source: require("@/assets/images/upload-chat/instagram.svg"), // Instagram 图标
    name: "Instagram", // 平台名称
    images: [ // Instagram 教程截图（13张）
      require("@/assets/images/upload-chat/instagram/1.png"),
      require("@/assets/images/upload-chat/instagram/2.png"),
      require("@/assets/images/upload-chat/instagram/3.png"),
      require("@/assets/images/upload-chat/instagram/4.png"),
      require("@/assets/images/upload-chat/instagram/5.png"),
      require("@/assets/images/upload-chat/instagram/6.png"),
      require("@/assets/images/upload-chat/instagram/7.png"),
      require("@/assets/images/upload-chat/instagram/8.png"),
      require("@/assets/images/upload-chat/instagram/9.png"),
      require("@/assets/images/upload-chat/instagram/10.png"),
      require("@/assets/images/upload-chat/instagram/11.png"),
      require("@/assets/images/upload-chat/instagram/12.png"),
      require("@/assets/images/upload-chat/instagram/13.png")
    ]
  }
];

// 上传聊天页面的主组件
export default function UploadChat() {
  // 当前选中的平台索引（默认为0，即WhatsApp）
  const [selected, setSelected] = React.useState(0);
  // 当前选中的教程图片索引（默认为0，即第一张图）
  const [selectedImage, setSelectedImage] = React.useState(0);
  // 获取顶部导航栏高度
  const headerHeight = useHeaderHeight();

  // 为当前选中平台的所有教程图片设置宽度（都是359）
  const widths = pageDataList[selected].images.map(_ => 359);

  // 计算每张图片的起始偏移量，用于判断当前显示的是哪张图
  const getOffsetStarts = () => widths.map((v, i) => widths.slice(0, i).reduce((x, acc) => x + acc, 0));

  // 监听水平滚动事件，更新当前选中的图片索引
  const onScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offset = event.nativeEvent?.contentOffset?.x; // 获取当前水平滚动位置

    if (offset !== undefined) {
      // 计算每个图片起始位置与当前滚动位置的距离
      const distancesFromTop = getOffsetStarts().map(v => Math.abs(v - offset));
      // 找出距离最小的图片索引，即当前显示的图片
      const newIndex = distancesFromTop.indexOf(Math.min.apply(null, distancesFromTop));
      // 如果索引变化，更新状态
      if (selectedImage !== newIndex) {
        setSelectedImage(newIndex);
      }
    }
  };

  // 渲染页面内容
  return (
    // 最外层容器，白色背景，顶部留出导航栏高度
    <View className="flex-1 bg-white" style={{ paddingTop: headerHeight }}>
      {/* 顶部平台选择区域 */}
      <View className="flex-row items-center justify-center self-center gap-2 p-2">
        {/* 遍历所有平台，生成选择按钮 */}
        {pageDataList.map((item, index) => (
          <Pressable
            key={item.name} // 使用平台名称作为 key
            onPress={() => {
              setSelected(index); // 点击时切换选中的平台
            }}
            // 根据是否选中设置不同样式
            className={`w-[84] h-[78] rounded-xl ${
              selected === index ? "bg-white" : "bg-transparent"
            } flex-col justify-center items-center gap-2 shadow`}>
            {/* 平台图标 */}
            <Image source={item.source} className="w-8 h-8" />
            {/* 平台名称 */}
            <Text className="h-5 text-center justify-center text-neutral-400 text-[10px] font-medium font-['Poppins'] leading-tight">
              {item.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 页面标题提示文字 */}
      <Text className="m-4 self-center w-56 text-center justify-center text-zinc-800 text-xl font-medium font-['Poppins'] leading-normal">
        Choose a platform to analyze your chat
      </Text>

      {/* 教程图片展示区域 */}
      <View className="flex-1">
        {/* 图片容器 */}
        <View className="items-center justify-center self-center w-[362] h-[395] bg-zinc-500 rounded-2xl overflow-hidden">
          {/* 使用 FlashList 高性能列表组件展示教程图片 */}
          <FlashList
            data={pageDataList[selected].images} // 当前选中平台的教程图片
            pagingEnabled={true} // 启用分页效果
            horizontal={true} // 水平滚动
            estimatedItemSize={362} // 估计每项宽度
            estimatedListSize={{ height: 395, width: 362 }} // 估计列表尺寸
            renderItem={({ item }) => (
              // 渲染每张教程图片
              <Image
                contentFit="contain" // 图片适应模式
                contentPosition="top" // 图片位置
                source={item} // 图片源
                className="w-[362] h-[395] rounded-2xl self-center border border-gray-200" // 图片样式
              />
            )}
            showsHorizontalScrollIndicator={false} // 隐藏水平滚动条
            onScroll={onScroll} // 监听滚动事件
          />
        </View>

        {/* 底部分页指示点 */}
        <View className="h-2 flex-row items-center justify-center mt-3">
          {/* 为每张图片生成一个指示点 */}
          {pageDataList[selected].images.map((_, index) => (
            // 根据是否是当前选中的图片设置不同颜色
            <View key={index} className={`w-2 h-2 rounded-full self-center ml-2 ${index === selectedImage ? "bg-orange-500" : "bg-zinc-300"}`} />
          ))}
        </View>
      </View>

      {/* 底部"继续"按钮 */}
      <AppButton onPress={() => {}}>
        {/* 使用背景图片作为按钮 */}
        <ImageBackground
          source={require("@/assets/images/button.png")}
          className="w-96 h-20 bg-gradient-to-br from-red-500/0 to-red-500/20 rounded-full self-center mb-10 overflow-hidden justify-center items-center">
          {/* 按钮文字 */}
          <Text className="text-white text-lg font-bold font-['Poppins'] w-auto">Continue</Text>
        </ImageBackground>
      </AppButton>
    </View>
  );
}