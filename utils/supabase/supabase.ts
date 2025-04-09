import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

// 创建Supabase客户端
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: AsyncStorage,
    },
  },
);

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
