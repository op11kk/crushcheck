import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// 从Constants中获取配置值
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey;

// 确保配置值存在
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL或Key未设置。请检查app.config.js和.env文件。');
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl || '', supabaseKey || ''); 