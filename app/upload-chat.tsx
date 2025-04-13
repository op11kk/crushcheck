import { View, Text, Pressable, TouchableOpacity, Dimensions } from "react-native";
import { Image, ImageBackground } from "expo-image";
import AppButton from "@/components/AppButton";
import React from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList, ViewToken } from "@shopify/flash-list";

const pageDataList = [
  {
    source: require("@/assets/images/upload-chat/whatsapp.svg"),
    name: "WhatsApp",
    images: [
      require("@/assets/images/upload-chat/whatsapp/1.png"),
      require("@/assets/images/upload-chat/whatsapp/2.png"),
      require("@/assets/images/upload-chat/whatsapp/3.png"),
      require("@/assets/images/upload-chat/whatsapp/4.png"),
      require("@/assets/images/upload-chat/whatsapp/5.png")
    ]
  },
  // { source: require("@/assets/images/upload-chat/telegram.svg"), name: "Telegram" },
  {
    source: require("@/assets/images/upload-chat/messenger.svg"),
    name: "Messenger",
    images: [
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
    source: require("@/assets/images/upload-chat/instagram.svg"),
    name: "Instagram",
    images: [
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
export default function UploadChat() {
  const [selected, setSelected] = React.useState(0);
  const [selectedImage, setSelectedImage] = React.useState(0);
  const headerHeight = useHeaderHeight();

  const widths = pageDataList[selected].images.map(_ => 359);

  const getOffsetStarts = () => widths.map((v, i) => widths.slice(0, i).reduce((x, acc) => x + acc, 0));

  const onScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offset = event.nativeEvent?.contentOffset?.x;

    if (offset !== undefined) {
      const distancesFromTop = getOffsetStarts().map(v => Math.abs(v - offset));
      const newIndex = distancesFromTop.indexOf(Math.min.apply(null, distancesFromTop));
      if (selectedImage !== newIndex) {
        setSelectedImage(newIndex);
      }
    }
  };
  return (
    <View className="flex-1 bg-white" style={{ paddingTop: headerHeight }}>
      <View className="flex-row items-center justify-center self-center gap-2 p-2">
        {pageDataList.map((item, index) => (
          <Pressable
            key={item.name}
            onPress={() => {
              setSelected(index);
            }}
            className={`w-[84] h-[78] rounded-xl ${
              selected === index ? "bg-white" : "bg-transparent"
            } flex-col justify-center items-center gap-2 shadow`}>
            <Image source={item.source} className="w-8 h-8" />
            <Text className="h-5 text-center justify-center text-neutral-400 text-[10px] font-medium font-['Poppins'] leading-tight">
              {item.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="m-4 self-center w-56 text-center justify-center text-zinc-800 text-xl font-medium font-['Poppins'] leading-normal">
        Choose a platform to analyze your chat
      </Text>
      <View className="flex-1">
        <View className="items-center justify-center self-center w-[362] h-[395] bg-zinc-500 rounded-2xl overflow-hidden">
          <FlashList
            data={pageDataList[selected].images}
            pagingEnabled={true}
            horizontal={true}
            estimatedItemSize={362}
            estimatedListSize={{ height: 395, width: 362 }}
            renderItem={({ item }) => (
              <Image
                contentFit="contain"
                contentPosition="top"
                source={item}
                className="w-[362] h-[395] rounded-2xl self-center border border-gray-200"
              />
            )}
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
          />
        </View>
        <View className="h-2 flex-row items-center justify-center mt-3">
          {pageDataList[selected].images.map((_, index) => (
            <View key={index} className={`w-2 h-2 rounded-full self-center ml-2 ${index === selectedImage ? "bg-orange-500" : "bg-zinc-300"}`} />
          ))}
        </View>
      </View>
      <AppButton onPress={() => {}}>
        <ImageBackground
          source={require("@/assets/images/button.png")}
          className="w-96 h-20 bg-gradient-to-br from-red-500/0 to-red-500/20 rounded-full self-center mb-10 overflow-hidden justify-center items-center">
          <Text className="text-white text-lg font-bold font-['Poppins'] w-auto">Continue</Text>
        </ImageBackground>
      </AppButton>
    </View>
  );
}
