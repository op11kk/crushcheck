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
          headerShown: true,
          headerTitleAlign: "center",
          headerTitle: "",
          headerLeft: () => <Image source={require("@/assets/images/home/explore.svg")} className="w-[65] h-[22]" />,
          headerRight: () => (
            <Link href="/settings">
              <View className="justify-center items-center w-12 h-12 bg-white rounded-full">
                <Image source={require("@/assets/images/home/settings.svg")} className="w-[20] h-[20]" />
              </View>
            </Link>
          )
        }}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme.colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute"
            },
            default: {}
          })
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <AntDesign size={28} name="home" color={color} />
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="play.fill" color={color} />
          }}
        />
      </Tabs>
    </>
  );
}
