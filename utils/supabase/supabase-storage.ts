import { ensureSession, supabase } from "./supabase";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { decode } from "base64-arraybuffer";

/**
 * 从本地URI上传图片到Supabase Storage
 *
 * 这个函数的主要作用是:
 * 1. 接收设备上的图片URI (例如用户从相册选择的图片地址)
 * 2. 读取图片内容并转换为合适的格式
 * 3. 上传到Supabase云存储
 * 4. 返回一个可公开访问的URL
 *
 * @param localImageUri 本地图片URI (例如: file:///var/mobile/...)
 * @returns 上传后的公共URL (例如: https://...supabase.co/storage/v1/object/public/...)
 */
export async function uploadImageToSupabase(
  localImageUri: string,
): Promise<string> {
  try {
    await ensureSession();
    // 步骤1: 生成唯一文件名，防止在云存储中覆盖其他文件
    // 使用时间戳确保文件名唯一性
    const timestamp = new Date().getTime();
    // 获取原始文件扩展名，如果无法获取则默认为jpg
    const fileExt = localImageUri.split(".").pop() || "jpg";
    // 生成6位随机数字串
    const randomDigits = Math.floor(Math.random() * 100);
    // 构建文件名
    const fileName = `chat_image_${timestamp}_${randomDigits}.${fileExt}`;
    // 构建完整的存储路径，将所有聊天图片存储在chat-images文件夹下
    const filePath = `chat-images/${fileName}`;

    // 步骤2: 处理文件内容 - 根据平台不同采用不同方法读取图片
    let fileData;

    if (Platform.OS === "web") {
      // 网页平台处理 - 从URI创建Blob对象
      // 在Web环境中，图片URI通常是一个BLOB链接
      const response = await fetch(localImageUri);
      const blob = await response.blob();
      fileData = blob;
    } else {
      // 移动端处理（iOS和Android）
      // 使用Expo的文件系统API读取图片文件，并转换为Base64格式
      const base64 = await FileSystem.readAsStringAsync(localImageUri, {
        encoding: FileSystem.EncodingType.Base64, // 指定编码格式为Base64
      });

      // 将Base64转换为Blob对象，这是Supabase API所需的格式
      fileData = decode(base64);
    }

    // 步骤3: 上传到Supabase Storage
    // from('chat')表示上传到名为chat的存储桶中
    // 注意: 需要先在Supabase管理后台创建这个存储桶
    const { data, error } = await supabase.storage
      .from("chat-analysis") // 存储桶名称
      .upload(filePath, fileData, {
        contentType: `image/${fileExt}`, // 指定文件的MIME类型
        upsert: true, // 如果存在同名文件则覆盖
      });

    // 检查是否上传成功
    if (error) {
      console.error("上传图片到Supabase时出错:", error);
      throw error; // 抛出错误以便调用者处理
    }

    // 步骤4: 获取公共URL - 这是可以直接在互联网上访问的地址
    // 这个URL可以被发送给OpenAI进行分析
    const { data: publicUrlData } = supabase.storage
      .from("chat-analysis")
      .getPublicUrl(filePath);

    // 返回公共URL
    return publicUrlData.publicUrl;
  } catch (error) {
    // 错误处理 - 记录错误并向上抛出
    console.error("上传图片到Supabase时出错:", error);
    throw error;
  }
}

/**
 * 上传多张图片到Supabase Storage
 *
 * 这个函数的作用是批量上传多张图片，例如用户一次选择了多张聊天截图
 * 它会并行处理所有上传请求，提高效率
 *
 * @param localImageUris 本地图片URI数组
 * @returns 上传后的所有图片公共URL数组，顺序与输入数组保持一致
 */
export async function uploadImagesToSupabase(
  localImageUris: string[],
): Promise<string[]> {
  // 为每个图片URI创建一个上传任务
  const uploadPromises = localImageUris.map((uri) =>
    uploadImageToSupabase(uri)
  );
  // 并行执行所有上传任务，等待所有任务完成
  return Promise.all(uploadPromises);
}
