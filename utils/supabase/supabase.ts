import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

// 从Constants中获取配置值
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey;
// 确保配置值存在
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL或Key未设置。请检查app.config.js和.env文件。");
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: AsyncStorage,
  },
});

const signInCallbacks: ((session: any) => void)[] = [];
let isSignInInProgress = false;
export async function ensureSession() {
  return new Promise((resolve) => {
    if (isSignInInProgress) {
      signInCallbacks.push(resolve);
      return;
    }
    isSignInInProgress = true;
    (async () => {
      let session = await supabase.auth.getSession();
      if (!session?.data?.session) {
        const data = await supabase.auth.signInAnonymously();
        session = await supabase.auth.getSession();
      }
      signInCallbacks.forEach((callback) => callback(session));
      isSignInInProgress = false;
      resolve(session);
    })();
  });
}

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
