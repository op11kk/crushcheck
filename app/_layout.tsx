import "../global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Image, ImageBackground } from "expo-image";
import "react-native-reanimated";

import { cssInterop, useColorScheme } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { Appearance, Platform, Alert } from "react-native";
import Purchases from "react-native-purchases";
import { ensureSession } from "@/utils/supabase/supabase";
import * as Linking from "expo-linking";
import { handleReceivedUrl } from "@/utils/fileHandler";

cssInterop(Image, { className: "style" });
cssInterop(LinearGradient, { className: "style" });
cssInterop(ImageBackground, { className: "style" });

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)"
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
Appearance.setColorScheme("light");

export default function RootLayout() {
  const [loaded, errors] = useFonts({
    PoppinsSemiBold: require("@/assets/fonts/Poppins-SemiBold.ttf"),
    PoppinsMedium: require("@/assets/fonts/Poppins-Medium.otf"),
    PoppinsBold: require("@/assets/fonts/Poppins-Bold.ttf"),
    LindenHillItalic: require("@/assets/fonts/LindenHill-Italic.ttf"),
    LindenHillRegular: require("@/assets/fonts/LindenHill-Regular.ttf")
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    ensureSession();

    Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.ERROR);
    if (Platform.OS === "ios") {
      Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_API_KEY! });
    }
    (async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (typeof customerInfo.entitlements.active["Pro"] !== "undefined") {
          // Grant user "pro" access
        }
        Purchases.addCustomerInfoUpdateListener(info => {
          // handle any changes to purchaserInfo
        });
      } catch (e) {
        console.log("getCustomerInfo", e);
        // Error fetching purchaser info
      }
    })();

    setupUrlHandling();
  }, []);

  const setupUrlHandling = async () => {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      const file = await handleReceivedUrl(initialUrl);
      if (file) {
        console.log("File received1:", file);
        router.replace("/shared-files");
      }
    }

    const subscription = Linking.addEventListener("url", async ({ url }) => {
      const file = await handleReceivedUrl(url);
      if (file) {
        console.log("File received2:", file);
        router.replace("/shared-files");
      }
    });

    return () => {
      subscription.remove();
    };
  };

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme.colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
          headerTransparent: true,
          headerBlurEffect: "none",
          headerStyle: {
            backgroundColor: "transparent"
          }
        }}>
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
