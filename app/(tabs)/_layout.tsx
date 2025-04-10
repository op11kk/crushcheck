import { Link, Stack, Tabs } from "expo-router";
import React from "react";
import { Button, Platform, View } from "react-native";
import { Image } from "expo-image";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/utils/Colors";
import { useColorScheme } from "nativewind";
import { AntDesign } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerTransparent: true,
          headerBlurEffect: "none",
          headerTitleAlign: "center",
          headerTitle: "",
          headerLeft: () => <Image source={require("@/assets/images/home/explore.svg")} className="w-[65] h-[22]" />,
          headerRight: () => (
            <Link href="/settings">
              <View className="justify-center items-center w-12 h-12 bg-white rounded-full">
                <Image source={require("@/assets/images/home/settings.svg")} className="w-[20] h-[20]" />
              </View>
            </Link>
          ),
          headerStyle: {
            backgroundColor: "transparent"
          }
        }}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme.colorScheme ?? "light"].tint,
          headerShown: true,
          tabBarButton: HapticTab,
          // tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute",
              borderTopWidth: 0,
              backgroundColor: "transparent"
            },
            default: {}
          }),
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "transparent"
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerTitleAlign: "left",
            tabBarIcon: ({ color }) => <Image source={require("@/assets/images/home/tab_home.svg")} className="w-[20] h-[20]" tintColor={color} />,
            // headerLeft: () => <Image source={require("@/assets/images/home/explore.svg")} className="w-[65] h-[22] ml-4" />,
            headerRight: () => (
              <Link href="/settings" className=" mr-4">
                <View className="justify-center items-center w-12 h-12 bg-white rounded-full">
                  <Image source={require("@/assets/images/home/settings.svg")} className="w-[20] h-[20]" />
                </View>
              </Link>
            )
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "",
            tabBarIcon: ({ color }) => <Image source={require("@/assets/images/home/tab_explore.svg")} className="w-[20] h-[19]" tintColor={color} />,
            headerLeft: () => <Image source={require("@/assets/images/home/explore.svg")} className="w-[65] h-[22] ml-4" />,
            headerRight: () => (
              <Link href="/settings" className=" mr-4">
                <View className="justify-center items-center w-12 h-12 bg-white rounded-full">
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
