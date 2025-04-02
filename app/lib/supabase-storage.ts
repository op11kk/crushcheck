import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

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
export async function uploadImageToSupabase(localImageUri: string): Promise<string> {
  try {
    // 步骤1: 生成唯一文件名，防止在云存储中覆盖其他文件
    // 使用时间戳确保文件名唯一性
    const timestamp = new Date().getTime();
    // 获取原始文件扩展名，如果无法获取则默认为jpg
    const fileExt = localImageUri.split('.').pop() || 'jpg';
    // 构建文件名
    const fileName = `chat_image_${timestamp}.${fileExt}`;
    // 构建完整的存储路径，将所有聊天图片存储在chat-images文件夹下
    const filePath = `chat-images/${fileName}`;
    
    // 步骤2: 处理文件内容 - 根据平台不同采用不同方法读取图片
    let fileData;
    
    if (Platform.OS === 'web') {
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
      fileData = _base64ToBlob(base64, `image/${fileExt}`);
    }
    
    // 步骤3: 上传到Supabase Storage
    // from('chat-analysis')表示上传到名为chat-analysis的存储桶中
    // 注意: 需要先在Supabase管理后台创建这个存储桶
    const { data, error } = await supabase.storage
      .from('chat-analysis') // 存储桶名称
      .upload(filePath, fileData, {
        contentType: `image/${fileExt}`, // 指定文件的MIME类型
        upsert: true, // 如果存在同名文件则覆盖
      });
    
    // 检查是否上传成功
    if (error) {
      console.error('上传图片到Supabase时出错:', error);
      throw error; // 抛出错误以便调用者处理
    }
    
    // 步骤4: 获取公共URL - 这是可以直接在互联网上访问的地址
    // 这个URL可以被发送给OpenAI进行分析
    const { data: publicUrlData } = supabase.storage
      .from('chat-analysis')
      .getPublicUrl(filePath);
    
    // 返回公共URL
    return publicUrlData.publicUrl;
  } catch (error) {
    // 错误处理 - 记录错误并向上抛出
    console.error('上传图片到Supabase时出错:', error);
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
export async function uploadImagesToSupabase(localImageUris: string[]): Promise<string[]> {
  // 为每个图片URI创建一个上传任务
  const uploadPromises = localImageUris.map(uri => uploadImageToSupabase(uri));
  // 并行执行所有上传任务，等待所有任务完成
  return Promise.all(uploadPromises);
}

/**
 * 将Base64转换为Blob对象
 * 
 * 这是一个辅助函数，用于将Base64格式的图片数据转换为Blob对象
 * Blob对象是Web API中表示二进制数据的标准格式，Supabase API接受这种格式
 * 
 * @param base64 Base64编码的字符串
 * @param contentType 内容MIME类型，例如"image/jpeg"
 * @returns Blob对象，可以直接上传到Supabase
 */
function _base64ToBlob(base64: string, contentType: string = ''): Blob {
  // 步骤1: 处理可能带有data URL前缀的base64字符串
  // 例如: "data:image/jpeg;base64,/9j/4AAQSkZ..."
  const base64WithoutPrefix = base64.includes('base64,')
    ? base64.split('base64,')[1] // 如果有前缀，只取逗号后面的部分
    : base64;
  
  // 步骤2: 使用atob函数解码base64字符串为二进制字符串
  // atob是JavaScript内置函数，用于解码Base64
  const byteCharacters = atob(base64WithoutPrefix);
  const byteArrays = [];
  
  // 步骤3: 将二进制字符串分块处理，每512字节一块
  // 这样做是为了避免处理大图片时可能发生的内存溢出
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    // 将每个字符转换为对应的字节值
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    // 创建Uint8Array（8位无符号整数数组）
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  // 步骤4: 使用所有的字节数组创建一个Blob对象
  // Blob代表一个不可变的、原始数据的类文件对象
  return new Blob(byteArrays, { type: contentType });
} 