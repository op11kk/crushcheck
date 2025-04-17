// 导入Supabase客户端创建函数，用于与Supabase后端服务通信
import { createClient } from "@supabase/supabase-js";
// 导入AsyncStorage，用于在React Native中持久化存储数据
import AsyncStorage from "@react-native-async-storage/async-storage";
// 导入AppState，用于监听应用状态变化（前台/后台）
import { AppState } from "react-native";
// 导入SecureStore，用于安全存储敏感数据（如密钥）
import * as SecureStore from "expo-secure-store";
// 导入Application，用于获取设备特定信息，如iOS设备的IDFV
import * as Application from "expo-application";
// 导入Crypto，用于加密操作，如计算MD5哈希
import * as Crypto from "expo-crypto";
// 导入Purchases，用于处理应用内购买功能
import Purchases from "react-native-purchases";

// 创建Supabase客户端实例
export const supabase = createClient(
  // 使用环境变量中的Supabase URL
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  // 使用环境变量中的Supabase匿名密钥
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // 启用令牌自动刷新，确保用户会话不会过期
      autoRefreshToken: true,
      // 启用会话持久化，使用户在应用重启后仍保持登录状态
      persistSession: true,
      // 使用AsyncStorage作为存储引擎，保存会话信息
      storage: AsyncStorage,
    },
  },
);

// 定义用于在安全存储中保存用户本地ID的键名
const authLocalKey = "localId";
// 定义回调函数数组，用于在登录完成后通知等待的调用者
const signInCallbacks: ((session: any) => void)[] = [];
// 标记登录过程是否正在进行中，防止多次并发登录
let isSignInInProgress = false;
// 导出确保用户会话存在的函数，如果用户未登录则自动登录
export async function ensureSession() {
  // 返回一个Promise，以便异步处理登录流程
  return new Promise(async (resolve) => {
    // 如果已经有登录过程在进行中，将当前resolve添加到回调队列
    if (isSignInInProgress) {
      signInCallbacks.push(resolve);
      return;
    }
    // 标记登录过程开始
    isSignInInProgress = true;

    // 尝试获取当前用户会话
    let session = await supabase.auth.getUser();
    // 如果用户未登录，执行自动登录流程
    if (!session?.data?.user) {
      // 尝试从安全存储中获取之前保存的设备ID哈希值
      let idfvMD5 = await SecureStore.getItemAsync(authLocalKey);
      // 如果没有保存的设备ID哈希值，则需要获取并计算
      if (!idfvMD5) {
        // 定义一个确保获取iOS设备IDFV的函数，带有重试机制
        async function ensureIDFV() {
          // 获取iOS设备的唯一标识符（IDFV）
          const idfv = await Application.getIosIdForVendorAsync();
          // 如果获取失败，等待1秒后重试
          if (!idfv) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return await ensureIDFV();
          }
          return idfv;
        }
        // 获取设备IDFV
        const idfv = await ensureIDFV();
        // 计算IDFV的MD5哈希值，用于生成唯一的用户标识
        idfvMD5 = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.MD5,
          idfv,
        );
      }
      // 使用设备ID哈希值构造唯一的邮箱地址（本地用户）
      const email = `${idfvMD5}@harmone.local`;
      // 使用设备ID哈希值作为密码
      const password = idfvMD5;
      // 尝试使用生成的邮箱和密码登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      // 如果登录失败（用户可能不存在），尝试注册新用户
      if (!data.session?.user) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        // 如果注册也失败，抛出错误
        if (!data.session?.user) {
          throw new Error(error?.message || "Failed to sign up");
        }
      }
      // 将设备ID哈希值保存到iOS的钥匙串中，用于后续自动登录
      await SecureStore.setItemAsync(authLocalKey, idfvMD5);
      // 重新获取用户会话信息
      session = await supabase.auth.getUser();
    }
    // 使用用户ID登录到Purchases系统（处理应用内购买）
    await Purchases.logIn(session.data!.user!.id!);
    // 执行所有等待的回调函数，通知登录已完成
    signInCallbacks.forEach((callback) => callback(session));
    // 重置登录进行中的标志
    isSignInInProgress = false;
    // 解析Promise，返回用户会话
    resolve(session);
  });
}

// 监听应用状态变化
AppState.addEventListener("change", (state) => {
  // 当应用进入前台（活跃状态）时
  if (state === "active") {
    // 启动Supabase的自动令牌刷新，保持用户会话有效
    supabase.auth.startAutoRefresh();
  } else {
    // 当应用进入后台时，停止自动刷新以节省资源
    supabase.auth.stopAutoRefresh();
  }
});
