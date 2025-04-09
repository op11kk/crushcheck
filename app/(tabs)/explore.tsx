import { StyleSheet, Platform, ScrollView, View } from "react-native";
import { Image, ImageBackground } from "expo-image";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Button } from "react-native";
import { Link } from "expo-router";
import { Text } from "react-native";

export default function TabTwoScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button onPress={() => {}} title="Update count" />
    });
  }, [navigation]);
  return (
    <View className="flex-1">
      <View className="" style={{ height: headerHeight }} />
      <View className="flex-1">
        <ImageBackground source={require("@/assets/images/home/card.svg")} className="w-[318] h-[385] self-center" />
      </View>
      <View className="flex-row items-center self-center">
        <Link href="/chat-bot?type=chat">
          <ImageBackground source={require("@/assets/images/home/chat.svg")} className="w-[176] h-[176] justify-end">
            <Text className=" text-lg font-bold mb-8 ml-4">Chat with</Text>
          </ImageBackground>
        </Link>
        <Link href="/chat-bot?type=expert">
          <ImageBackground source={require("@/assets/images/home/text.svg")} className="w-[176] h-[176] ml-4 justify-end">
            <Text className=" text-lg font-bold mb-8 ml-4">Text Expert</Text>
          </ImageBackground>
        </Link>
      </View>
      <View style={{ height: tabBarHeight }} className="w-full mb-4" />
    </View>
  );
}

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
