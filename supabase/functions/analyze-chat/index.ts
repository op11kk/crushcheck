// 按照此设置指南将Deno语言服务器与您的编辑器集成：
// https://deno.land/manual/getting_started/setup_your_environment
// 这将启用自动完成、定义跳转等功能

// 设置内置Supabase运行时API的类型定义
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// 导入Supabase客户端创建函数
import { createClient } from "jsr:@supabase/supabase-js@2";
// 导入OpenAI API客户端
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";
// 导入OpenAI聊天完成相关的类型定义
import type {
  ChatCompletionContentPart,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
} from "https://deno.land/x/openai@v4.24.0/resources/chat/completions.ts";

// 定义RevenueCat订阅者响应的预期结构（简化版）
interface RevenueCatSubscriber {
  subscriber: {
    // 用户的权益信息
    entitlements: {
      // 键为权益ID，值为权益详情
      [key: string]: {
        // 权益过期日期，可能为null（永不过期）
        expires_date: string | null;
        // 产品标识符
        product_identifier: string;
        // 购买日期
        purchase_date: string;
      };
    };
    // 其他字段...
  };
}

// --- 配置部分 ---
// 定义Pro会员权益ID，如果RevenueCat中的权益ID不同，请调整此值
const PRO_ENTITLEMENT_ID = "Pro"; 

// 创建Deno服务器，处理传入的HTTP请求
Deno.serve(async (req) => {
  // 1. 授权检查 - 确保请求包含Authorization头
  if (!req.headers.get("Authorization")) {
    // 如果没有Authorization头，返回401未授权错误
    return new Response(
      JSON.stringify({ message: "Authorization header is required" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. 创建Supabase客户端并进行用户认证
  // 使用环境变量创建Supabase客户端
  const supabaseClient = createClient(
    // 获取Supabase URL环境变量，如果不存在则使用空字符串
    Deno.env.get("SUPABASE_URL") ?? "",
    // 获取Supabase匿名密钥环境变量，如果不存在则使用空字符串
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        // 将请求中的Authorization头传递给Supabase客户端
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    },
  );

  // 获取认证头并提取令牌
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  // 使用令牌获取当前用户信息
  const { data: { user }, error: userError } = await supabaseClient.auth
    .getUser(token);

  // 如果认证失败或用户不存在，返回401未授权错误
  if (userError || !user) {
    console.error("Authentication failed:", userError?.message);
    return new Response(
      JSON.stringify({ message: "Authentication failed" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  // 使用Supabase用户ID作为RevenueCat的应用用户ID
  const appUserId = user.id;

  // 3. 检查RevenueCat Pro会员计划
  // 获取RevenueCat API密钥环境变量
  const revenueCatApiKey = Deno.env.get("REVENUECAT_PUBLIC_API_KEY");
  // 如果API密钥未配置，返回错误
  if (!revenueCatApiKey) {
    console.error("RevenueCat API key is not configured.");
    // 决定这是否是函数的致命错误
    // return new Response("Server configuration error", { status: 500 });
    // 或者暂时允许非Pro用户？对于这个示例，我们将阻止访问
    return new Response(
      JSON.stringify({ message: "Subscription check unavailable." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // 调用RevenueCat API获取用户订阅信息
    const rcResponse = await fetch(
      // 构建API URL，包含用户ID
      `https://api.revenuecat.com/v1/subscribers/${appUserId}`,
      {
        method: "GET",
        headers: {
          // 使用API密钥进行认证
          "Authorization": `Bearer ${revenueCatApiKey}`,
          "Content-Type": "application/json",
          // 指定平台为iOS，对于仅检查可能不需要
          "X-Platform": "ios", 
        },
      },
    );

    // 如果响应不成功（非2xx状态码）
    if (!rcResponse.ok) {
      // 处理来自RevenueCat的非2xx响应
      if (rcResponse.status === 404) {
        // 用户在RevenueCat中不存在
        console.log(`User ${appUserId} not found in RevenueCat.`);
        // 视为没有权益
      } else {
        // 其他错误情况，记录详细错误信息
        const errorBody = await rcResponse.text();
        console.error(
          `RevenueCat API Error (${rcResponse.status}): ${errorBody}`,
        );
        // 返回服务器错误响应
        return new Response(
          JSON.stringify({ message: "Failed to verify subscription status." }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      // 如果用户未找到(404)或其他错误，假定用户没有Pro访问权限
      return new Response(
        JSON.stringify({
          code: "PRO_PLAN_REQUIRED",
          message: "Pro plan required for this feature.",
        }),
        // 返回403禁止访问状态码
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // 解析RevenueCat响应为预定义的接口结构
    const rcData: RevenueCatSubscriber = await rcResponse.json();

    // 获取用户的Pro权益信息
    const proEntitlement = rcData.subscriber?.entitlements
      ?.[PRO_ENTITLEMENT_ID];
    // 判断用户是否有有效的Pro计划
    // 如果expires_date为null（永不过期）或者过期日期大于当前日期，则视为有效
    const hasActiveProPlan = proEntitlement &&
      (!proEntitlement.expires_date ||
        new Date(proEntitlement.expires_date) > new Date());

    // 如果用户没有有效的Pro计划
    if (!hasActiveProPlan) {
      console.log(
        `User ${appUserId} does not have active '${PRO_ENTITLEMENT_ID}' entitlement.`,
      );
      // 返回403禁止访问响应，要求Pro计划
      return new Response(
        JSON.stringify({
          code: "PRO_PLAN_REQUIRED",
          message: "Pro plan required for this feature.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // 记录用户有有效的Pro权益，继续处理
    console.log(
      `User ${appUserId} has active '${PRO_ENTITLEMENT_ID}' entitlement. Proceeding...`,
    );
  } catch (error) {
    // 捕获并记录检查RevenueCat状态时的任何错误
    console.error("Error checking RevenueCat status:", error);
    // 返回500服务器错误响应
    return new Response(
      JSON.stringify({ message: "Error verifying subscription status." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // --- 如果Pro计划检查通过，继续处理 ---

  // 4. 从请求体获取消息数据
  const { type, messages }: {
    // 定义请求类型：聊天、专家分析或报告生成
    type: "chat" | "expert" | "report"; // 聊天机器人、文本专家、暗恋报告
    // 消息数组，包含用户和系统消息
    messages: Array<
      ChatCompletionMessageParam | ChatCompletionSystemMessageParam
    >;
  } = await req.json();
  // 如果是聊天类型请求，返回待办响应（尚未实现）
  if (type === "chat") {
    return new Response(
      JSON.stringify({ message: "todo" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  // 如果是专家分析类型请求，返回待办响应（尚未实现）
  if (type === "expert") {
    return new Response(
      JSON.stringify({ message: "todo" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // 创建暗恋分析报告
  // 处理消息中的任何图片URL，创建签名URL
  const processedMessages = (await Promise.all(
    messages.map(async (message) => {
      // 验证消息角色是否有效（只接受用户或助手角色）
      if (message.role !== "user" && message.role !== "assistant") {
        throw new Error("Invalid message role");
      }
      // 处理消息内容为数组的情况（可能包含文本和图片）
      if (
        typeof message.content !== "string" && Array.isArray(message.content)
      ) {
        return {
          ...message,
          // 处理消息内容的每个部分
          content: await Promise.all(message.content.map(async (part) => {
            // 如果是图片URL类型
            if (part.type === "image_url" && part.image_url) {
              // 只处理来自我们存储的URL
              if (part.image_url.url.includes("/storage/v1/object/public/")) {
                // 为Supabase存储中的图片创建签名URL（有时效性）
                const image = await supabaseClient.storage
                  .from("chat-analysis") // 存储桶名称
                  .createSignedUrl(
                    // 提取文件路径
                    part.image_url.url.split("/object/public/").pop()!,
                    // 签名URL有效期为1小时（3600秒）
                    3600,
                  );
                // 如果成功创建签名URL，替换原始URL
                if (image.data?.signedUrl) {
                  part.image_url.url = image.data.signedUrl;
                }
              }
            }
            return part;
          })),
        };
      }

      // 如果消息内容是字符串，直接返回原始消息
      return message;
    }),
  // 类型断言为OpenAI聊天完成消息参数数组
  )) as Array<
    ChatCompletionMessageParam | ChatCompletionSystemMessageParam
  >;
  // 在消息数组开头添加系统提示消息，指导 AI 生成暗恋分析报告
  processedMessages.splice(0, 0, {
    role: "system",
    content: `**AI Prompt: Generate CrushCheck Report**

**Objective:** Analyze the provided chat history between a user and their crush, and generate a comprehensive "CrushCheck" report in JSON format. The report should evaluate various aspects of the relationship dynamics based on the interaction patterns, language used, and emotional cues present in the chat.

**Output Format:** JSON

**JSON Structure and Field Descriptions:**

\`\`\`json
{
  "crushLevel": {
    "currentScore": "Integer (0-100): Current estimated level of the crush's interest in the user.",
    "label": "String: An evocative label describing the current state of the crush's interest (e.g., 'A Glance Too Long', 'Subtly Interested', 'Warming Up').",
    "potentialScore": "Integer (0-100): Estimated maximum potential interest level the crush might reach.",
    "scoreDelta": "Integer: The difference between potentialScore and currentScore (for UI display like '+15').",
    "positiveTags": "Array of strings: List specific positive behavioral indicators extracted from the chat (e.g., 'fast response', 'frequent humor', 'shares personal content', 'initiates conversation').",
    "negativeTags": "Array of strings: List specific negative behavioral indicators or signs of disinterest extracted from the chat (e.g., 'slow replies', 'doesn't initiate', 'short answers', 'avoids personal topics')."
  },
  "crushMind": "String: A concise summary analyzing the crush's likely mindset, underlying motivations, or emotional state demonstrated during the interactions. Example: 'He often includes details and emotional reactions in his messages, suggesting deep engagement in your conversations. However, there are moments of hesitation...'",
  "greenFlags": [
    {
      "title": "String: Type label for a positive signal (e.g., 'Emotional Engagement', 'Thoughtful Discussion', 'Frequent Fun', 'Consistent Effort').",
      "description": "String: Personalized explanation based on chat history, detailing how this positive signal manifests. Example: 'There's emotional resonance; the chat includes many instances where they proactively express feelings...' or 'He responds thoroughly to your questions and enjoys exploring deeper topics, showing he values your thoughts.' or 'Frequent use of lighthearted expressions like 'heyyyy' shows he's comfortable and relaxed around you.'"
    }
    // Include up to 3 distinct green flags.
  ],
  "attachmentStyle": {
    "crush": "String ('Secure' / 'Anxious' / 'Avoidant'): Inferred attachment style of the crush based on interaction patterns.",
    "user": "String ('Secure' / 'Anxious' / 'Avoidant'): Inferred attachment style of the user based on interaction patterns.",
    "attachmentDescription": "String: Detailed explanation justifying the inferred attachment styles, referencing specific chat behaviors. Example: 'Based on steady responses and clear emotional expression, Jason seems to have a secure attachment style...'"
  },
  "reciprocityScore": {
    "score": "Integer (0-100): Quantifies the balance of interaction and mutual effort.",
    "comment": "String: Brief summary assessing the reciprocity level. Example: 'You guys are well-matched in expressing interest and responding consistently.' or 'Interaction seems slightly one-sided, with the user initiating more often.'"
  },
  "compatibilityScore": {
    "score": "Integer (0-100): Assesses compatibility based on personality, interests, and emotional style evident in the chat.",
    "comment": "String: Summary justifying the score based on observed linguistic styles and interaction dynamics. Example: 'Your chat shows similar interests and shared emotional tone, which suggests strong compatibility.' or 'Differences in communication style might require more effort.'"
  },
  "redFlags": [
    {
      "title": "String: Type label for a potential issue or warning sign (e.g., 'Growth is Stuck', 'Emotional Inconsistency', 'Avoidance of Conflict', 'Lack of Initiative').",
      "description": "String: Explanation of how the crush's behavior might negatively impact the relationship's potential. Example: 'Multiple times Jason has been hesitant to take initiative in deeper conversations.' or 'Jason sometimes pulls away after emotionally warm exchanges, which could signal emotional unavailability.'",
      "solutionLink": "String (Optional): A URL link to resources or chatbot interface for advice on addressing this specific red flag."
    }
    // Include up to 2 distinct red flags.
  ]
}
\`\`\`

**Instructions:**
1.  Carefully analyze the sentiment, frequency, depth, initiation patterns, and specific language used in the provided chat data.
2.  Populate each field in the JSON structure according to the descriptions.
3.  Ensure scores (currentScore, potentialScore, reciprocityScore, compatibilityScore) are within the 0-100 range.
4.  Derive \`scoreDelta\` by subtracting \`currentScore\` from \`potentialScore\`.
5.  Extract relevant behavioral \`positiveTags\` and \`negativeTags\` directly from chat evidence.
6.  Summarize the crush's mindset accurately in \`crushMind\`.
7.  Identify and describe up to 3 \`greenFlags\` and up to 2 \`redFlags\` with specific examples or patterns from the chat.
8.  Infer \`attachmentStyle\` for both crush and user based on communication patterns (consistency, emotional expression, conflict handling, etc.) and provide a justifying \`attachmentDescription\`.
9.  Evaluate the balance of give-and-take for the \`reciprocityScore\`.
10. Assess overall alignment in values, interests, and communication style for the \`compatibilityScore\`.
11. Provide concise and actionable descriptions and comments.
12. If providing a \`solutionLink\` for \`redFlags\`, ensure it's relevant to the identified issue.
`,
  });
  // 从环境变量中获取 OpenAI API 密钥
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  // 创建 OpenAI 客户端实例
  const openai = new OpenAI({
    apiKey: apiKey,
  });
  // 文档参考：https://github.com/openai/openai-node
  // 调用 OpenAI 的聊天完成 API 生成报告
  const chatCompletion = await openai.chat.completions.create({
    // 传入处理过的消息数组
    messages: processedMessages,
    // 使用的模型，可从这里选择：https://platform.openai.com/docs/models
    model: "gpt-4o-mini",
    // 最大输出令牌数
    max_tokens: 16000,
    // 非流式返回模式
    stream: false,
  });
  // 提取 AI 回复的内容
  const reply = chatCompletion.choices[0].message.content;
  // 输出回复内容到日志（用于调试）
  console.log("reply", reply); // 保留此行用于调试

  // 解析 AI 回复并保存到 Supabase
  let reportData;
  try {
    // 检查回复是否为空
    if (!reply) {
      throw new Error("Received empty reply from AI");
    }

    // 从 ```json ... ``` 代码块中提取 JSON 字符串
    let jsonString = reply;
    // 使用正则表达式匹配 ```json ... ``` 格式
    const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/); 
    if (jsonMatch && jsonMatch[1]) {
      // 使用捕获的组并去除空白
      jsonString = jsonMatch[1].trim(); 
    } else {
      // 可选：处理包裹可能缺失或不同的情况
      // 暂时如果找不到特定的代码块，尝试解析原始回复
      console.warn(
        "Could not find ```json block, attempting to parse raw reply.",
      );
    }

    // 解析提取的字符串为 JSON 对象
    reportData = JSON.parse(jsonString); 

    // 基本验证（根据预期结构可添加更多检查）
    if (
      !reportData || typeof reportData !== "object" || !reportData.crushLevel
    ) {
      throw new Error(
        "Parsed report data is invalid or missing required fields.",
      );
    }

    // 准备要插入到 Supabase 的数据对象
    const insertData = {
      user_id: user.id, // 使用已认证用户的 ID
      // 当前暗恋程度分数
      crush_level_current_score: reportData.crushLevel.currentScore,
      // 暗恋程度标签
      crush_level_label: reportData.crushLevel.label,
      // 潜在暗恋程度分数
      crush_level_potential_score: reportData.crushLevel.potentialScore,
      // 当前与潜在分数差值
      crush_level_score_delta: reportData.crushLevel.scoreDelta,
      // 积极行为标签（Supabase JS 客户端会处理数组到 PG 数组的转换）
      crush_level_positive_tags: reportData.crushLevel.positiveTags, 
      // 消极行为标签
      crush_level_negative_tags: reportData.crushLevel.negativeTags, 
      // 暗恋对象的心理状态分析
      crush_mind: reportData.crushMind,
      // 绿色信号（存储为 JSONB 格式）
      green_flags: reportData.greenFlags, 
      // 暗恋对象的依恩风格（使用可选链式访问，因为结构可能会变化）
      attachment_style_crush: reportData.attachmentStyle?.crush, 
      // 用户的依恩风格
      attachment_style_user: reportData.attachmentStyle?.user,
      // 依恩风格描述
      attachment_description: reportData.attachmentStyle?.description,
      // 互情分数
      reciprocity_score_score: reportData.reciprocityScore.score,
      // 互情评论
      reciprocity_score_comment: reportData.reciprocityScore.comment,
      // 兼容性分数
      compatibility_score_score: reportData.compatibilityScore.score,
      // 兼容性评论
      compatibility_score_comment: reportData.compatibilityScore.comment,
      // 红色信号（存储为 JSONB）
      red_flags: reportData.redFlags, 
      // 存储原始 JSON 对象
      raw_report: reportData, 
    };

    // 将报告数据插入到 Supabase 的 reports 表中
    const { data: insertedReport, error: insertError } = await supabaseClient
      .from("reports")
      .insert(insertData)
      .select("id") // 选择新创建的报告 ID
      .single(); // 期望返回单个行

    // 如果插入过程出错
    if (insertError) {
      console.error("Error inserting report into Supabase:", insertError);
      throw new Error(`Failed to save report: ${insertError.message}`);
    }

    // 记录报告保存成功的日志
    console.log(
      `Report saved successfully for user ${user.id}, report ID: ${insertedReport.id}`,
    );

    // 返回创建的报告 ID 或成功消息
    return new Response(
      JSON.stringify(insertedReport),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    // 记录处理 AI 回复或保存报告时的错误
    console.error("Error processing AI reply or saving report:", error);
    // 如果解析/保存失败，可以考虑将原始回复存储到单独的 'failed_reports' 表或日志中
    let errorMessage = "An unknown error occurred while processing the report.";
    // 如果是 Error 实例，使用其错误消息
    if (error instanceof Error) {
      errorMessage = `Failed to process report: ${error.message}`;
    }
    // 返回通用错误响应
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

/* 本地调用方法：

  1. 运行 `supabase start`（参见：https://supabase.com/docs/reference/cli/supabase-start）
  2. 发送HTTP请求：

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/redflaggy' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
