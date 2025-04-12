import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";

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

const authLocalKey = "localId";
const signInCallbacks: ((session: any) => void)[] = [];
let isSignInInProgress = false;
export async function ensureSession() {
  return new Promise(async (resolve) => {
    if (isSignInInProgress) {
      signInCallbacks.push(resolve);
      return;
    }
    isSignInInProgress = true;

    let session = await supabase.auth.getSession();
    if (!session?.data?.session) {
      let idfvMD5 = await SecureStore.getItemAsync(authLocalKey);
      if (!idfvMD5) {
        async function ensureIDFV() {
          const idfv = await Application.getIosIdForVendorAsync();
          if (!idfv) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return await ensureIDFV();
          }
          return idfv;
        }
        const idfv = await ensureIDFV();
        idfvMD5 = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.MD5,
          idfv,
        );
      }
      const email = `${idfvMD5}@harmone.local`;
      const password = idfvMD5;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!data.session?.user) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (!data.session?.user) {
          throw new Error(error?.message || "Failed to sign up");
        }
      }
      // saved in ios keychain
      await SecureStore.setItemAsync(authLocalKey, idfvMD5);
      session = await supabase.auth.getSession();
    }
    signInCallbacks.forEach((callback) => callback(session));
    isSignInInProgress = false;
    resolve(session);
  });
}

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
