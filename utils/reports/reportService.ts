import { supabase } from '../supabase/supabase';

/**
 * 生成暗恋分析报告
 * 
 * 这个函数调用 Supabase Edge Function 来分析聊天记录并生成暗恋分析报告
 * 
 * @param chatMessages 聊天消息数组，每条消息包含角色和内容
 * @returns 包含成功状态和数据或错误信息的对象
 */
export async function generateCrushReport(chatMessages: any[]) {
  try {
    // 准备请求数据
    const payload = {
      type: "report", // 指定为报告类型
      messages: chatMessages // 传入聊天消息数组
    };
    
    // 调用 Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-chat', {
      body: JSON.stringify(payload)
    });
    
    if (error) {
      console.error('生成报告时出错:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('错误:', error);
    return { success: false, error: '生成报告时发生未知错误' };
  }
}

/**
 * 获取用户的所有报告
 * 
 * 从数据库中获取当前登录用户的所有报告，按创建时间降序排列
 * 
 * @returns 包含成功状态和报告数组或错误信息的对象
 */
export async function getUserReports() {
  try {
    const { data, error } = await supabase
      .from('Report')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('获取报告时出错:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, reports: data };
  } catch (error) {
    console.error('错误:', error);
    return { success: false, error: '获取报告时发生未知错误' };
  }
}

/**
 * 获取单个报告详情
 * 
 * 根据报告ID获取详细信息
 * 
 * @param reportId 报告ID
 * @returns 包含成功状态和报告数据或错误信息的对象
 */
export async function getReportById(reportId: string) {
  try {
    const { data, error } = await supabase
      .from('Report')
      .select('*')
      .eq('id', reportId)
      .single();
      
    if (error) {
      console.error('获取报告详情时出错:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, report: data };
  } catch (error) {
    console.error('错误:', error);
    return { success: false, error: '获取报告详情时发生未知错误' };
  }
}
