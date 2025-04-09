import { StyleSheet, Platform, View, Button, Text } from "react-native";

import { ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, Stack } from "expo-router";
import { Image, ImageBackground } from "expo-image";
import AppButton from "@/components/AppButton";
import { Header, useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  console.log(headerHeight, tabBarHeight);
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={["rgba(254, 247, 243, 1)", "rgba(255, 255, 255, 1)"]} className="flex-1" style={{ flex: 1 }}>
      <Stack.Screen
        options={
          {
            // headerTitle: "Red Flag AI",
            // headerRight: () => <Button onPress={() => {}} title="Update count" />
          }
        }
      />
      {/* <Header title="Crush.ai" headerStyle={{ height: headerHeight, marginTop: insets.top }} /> */}
      <ScrollView>
        <View className="flex-row items-center justify-between mb-3" style={{ height: headerHeight }} />

        <View className="self-center flex-row items-center justify-between w-96 h-24 pl-4 pr-4 bg-white rounded-3xl shadow-[2px_4px_12px_0px_rgba(207,207,207,0.25)]">
          <Text className="text-zinc-800 text-xs font-normal font-['Poppins'] w-auto">Mar 20,2025</Text>
          <View className="flex-row items-center">
            <Text className="text-neutral-600 text-xs font-medium font-['Poppins'] w-auto">View report </Text>
            <Image source={require("@/assets/images/home/right.svg")} className="w-4 h-[6]" />
          </View>
        </View>
        <View style={{ height: tabBarHeight }} className="w-full" />
      </ScrollView>
      <Link href="/upload-chat" className="absolute self-center rounded-full w-[363] h-[72] mb-4 overflow-hidden" style={{ bottom: tabBarHeight }}>
        <ImageBackground
          source={require("@/assets/images/button.png")}
          className="justify-center items-center w-[363] h-[72] rounded-full self-center mb-10">
          <Text className="text-white text-lg font-bold font-['Poppins'] w-auto">Upload chat</Text>
        </ImageBackground>
      </Link>
    </LinearGradient>
  );
}
