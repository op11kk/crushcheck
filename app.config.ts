import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Redflag",
  slug: "redflag",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "redflag",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "harmone.CrushAI",
    "config": {
      "usesNonExemptEncryption": false,
    },
    infoPlist: {
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: "Images",
          LSHandlerRank: "Alternate",
          LSItemContentTypes: [
            "public.image",
            "public.jpeg",
            "public.png",
          ],
        },
        {
          CFBundleTypeName: "Documents",
          LSHandlerRank: "Alternate",
          LSItemContentTypes: [
            "public.content",
            "public.data",
            "public.text",
            "public.pdf",
          ],
        },
      ],
      // 添加 URL Scheme，使其他应用可以打开我们的应用
      CFBundleURLTypes: [
        {
          CFBundleURLName: "harmone.CrushAI",
          CFBundleURLSchemes: ["crushcheck"]
        }
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
    ],
    [
      "expo-secure-store",
      {
        "configureAndroidBackup": true,
      },
    ],
    [
      "expo-image-picker",
      {
        "photosPermission":
          "The app accesses your photos to let you upload screenshots.",
      },
    ],
  ],
});
