import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import AppButton from "@/components/AppButton";
import React from "react";
import { useHeaderHeight } from "@react-navigation/elements";

export default function UploadChat() {
  const [selected, setSelected] = React.useState(0);
  const headerHeight = useHeaderHeight();
  return (
    <View className="flex-1 bg-white" style={{ paddingTop: headerHeight }}>
      <View className="flex-row items-center justify-center self-center gap-2 p-2">
        {[
          { source: require("@/assets/images/upload-chat/whatsapp.svg"), name: "WhatsApp" },
          { source: require("@/assets/images/upload-chat/telegram.svg"), name: "Telegram" },
          { source: require("@/assets/images/upload-chat/messenger.svg"), name: "Messenger" },
          { source: require("@/assets/images/upload-chat/instagram.svg"), name: "Instagram" }
        ].map((item, index) => (
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
        <View className="w-96 h-96 bg-zinc-300 rounded-xl self-center"></View>
      </View>
      <AppButton onPress={() => {}}>
        <Image
          source={require("@/assets/images/button.png")}
          className="w-96 h-20 bg-gradient-to-br from-red-500/0 to-red-500/20 rounded-full self-center mb-10"
        />
      </AppButton>
    </View>
  );
}
