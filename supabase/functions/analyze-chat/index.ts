// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";
import type {
  ChatCompletionContentPart,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
} from "https://deno.land/x/openai@v4.24.0/resources/chat/completions.ts";

// Define expected structure for RevenueCat subscriber response (simplified)
interface RevenueCatSubscriber {
  subscriber: {
    entitlements: {
      [key: string]: {
        expires_date: string | null;
        product_identifier: string;
        purchase_date: string;
      };
    };
    // other fields...
  };
}

// --- Configuration ---
const PRO_ENTITLEMENT_ID = "Pro"; // <-- Adjust if your RevenueCat entitlement ID is different

Deno.serve(async (req) => {
  // 1. Authorization Check
  if (!req.headers.get("Authorization")) {
    return new Response(
      JSON.stringify({ message: "Authorization header is required" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. Supabase Client & User Authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    },
  );

  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabaseClient.auth
    .getUser(token);

  if (userError || !user) {
    console.error("Authentication failed:", userError?.message);
    return new Response(
      JSON.stringify({ message: "Authentication failed" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  const appUserId = user.id; // Use Supabase user ID as RevenueCat app_user_id

  // 3. RevenueCat Pro Plan Check
  const revenueCatApiKey = Deno.env.get("REVENUECAT_PUBLIC_API_KEY");
  if (!revenueCatApiKey) {
    console.error("RevenueCat API key is not configured.");
    // Decide if this is a fatal error for the function
    // return new Response("Server configuration error", { status: 500 });
    // Or allow non-pro users for now? For this example, we'll block.
    return new Response(
      JSON.stringify({ message: "Subscription check unavailable." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const rcResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${appUserId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${revenueCatApiKey}`,
          "Content-Type": "application/json",
          "X-Platform": "ios", // Or 'ios', 'android' - specify if relevant, might not be needed for just checking
        },
      },
    );

    if (!rcResponse.ok) {
      // Handle non-2xx responses from RevenueCat
      if (rcResponse.status === 404) {
        console.log(`User ${appUserId} not found in RevenueCat.`);
        // Treat as not having the entitlement
      } else {
        const errorBody = await rcResponse.text();
        console.error(
          `RevenueCat API Error (${rcResponse.status}): ${errorBody}`,
        );
        return new Response(
          JSON.stringify({ message: "Failed to verify subscription status." }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      // If user not found (404) or other error, assume no pro access for this example
      return new Response(
        JSON.stringify({
          code: "PRO_PLAN_REQUIRED",
          message: "Pro plan required for this feature.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const rcData: RevenueCatSubscriber = await rcResponse.json();

    const proEntitlement = rcData.subscriber?.entitlements
      ?.[PRO_ENTITLEMENT_ID];
    const hasActiveProPlan = proEntitlement &&
      (!proEntitlement.expires_date ||
        new Date(proEntitlement.expires_date) > new Date());

    if (!hasActiveProPlan) {
      console.log(
        `User ${appUserId} does not have active '${PRO_ENTITLEMENT_ID}' entitlement.`,
      );
      return new Response(
        JSON.stringify({
          code: "PRO_PLAN_REQUIRED",
          message: "Pro plan required for this feature.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(
      `User ${appUserId} has active '${PRO_ENTITLEMENT_ID}' entitlement. Proceeding...`,
    );
  } catch (error) {
    console.error("Error checking RevenueCat status:", error);
    return new Response(
      JSON.stringify({ message: "Error verifying subscription status." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // --- If Pro Plan Check Passed, Continue ---

  // 4. Get Messages from Request Body
  const { type, messages }: {
    type: "chat" | "expert" | "report"; // chatbot, text expert, crush report
    messages: Array<
      ChatCompletionMessageParam | ChatCompletionSystemMessageParam
    >;
  } = await req.json();
  if (type === "chat") {
    return new Response(
      JSON.stringify({ message: "todo" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  if (type === "expert") {
    return new Response(
      JSON.stringify({ message: "todo" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // create crush report
  // Process any image URLs in the messages to create signed URLs
  const processedMessages = (await Promise.all(
    messages.map(async (message) => {
      if (message.role !== "user" && message.role !== "assistant") {
        throw new Error("Invalid message role");
      }
      if (
        typeof message.content !== "string" && Array.isArray(message.content)
      ) {
        return {
          ...message,
          content: await Promise.all(message.content.map(async (part) => {
            if (part.type === "image_url" && part.image_url) {
              // Only process URLs that are from our storage
              if (part.image_url.url.includes("/storage/v1/object/public/")) {
                const image = await supabaseClient.storage
                  .from("chat-analysis")
                  .createSignedUrl(
                    part.image_url.url.split("/object/public/").pop()!,
                    3600,
                  );
                if (image.data?.signedUrl) {
                  part.image_url.url = image.data.signedUrl;
                }
              }
            }
            return part;
          })),
        };
      }

      return message;
    }),
  )) as Array<
    ChatCompletionMessageParam | ChatCompletionSystemMessageParam
  >;
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
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const openai = new OpenAI({
    apiKey: apiKey,
  });
  // Documentation here: https://github.com/openai/openai-node
  const chatCompletion = await openai.chat.completions.create({
    messages: processedMessages,
    // Choose model from here: https://platform.openai.com/docs/models
    model: "gpt-4o-mini",
    max_tokens: 16000,
    stream: false,
  });
  const reply = chatCompletion.choices[0].message.content;
  console.log("reply", reply); // Keep this for debugging

  // parse reply and save to supabase
  let reportData;
  try {
    if (!reply) {
      throw new Error("Received empty reply from AI");
    }

    // Extract JSON string from ```json ... ``` block
    let jsonString = reply;
    const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/); // Match ```json ... ```
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1].trim(); // Use the captured group
    } else {
      // Optional: Handle cases where the wrapping might be missing or different
      // For now, we'll try parsing the raw reply if the specific block isn't found
      console.warn(
        "Could not find ```json block, attempting to parse raw reply.",
      );
    }

    reportData = JSON.parse(jsonString); // Parse the extracted string

    // Basic validation (add more checks as needed based on your expected structure)
    if (
      !reportData || typeof reportData !== "object" || !reportData.crushLevel
    ) {
      throw new Error(
        "Parsed report data is invalid or missing required fields.",
      );
    }

    const insertData = {
      user_id: user.id, // Use the authenticated user's ID
      crush_level_current_score: reportData.crushLevel.currentScore,
      crush_level_label: reportData.crushLevel.label,
      crush_level_potential_score: reportData.crushLevel.potentialScore,
      crush_level_score_delta: reportData.crushLevel.scoreDelta,
      crush_level_positive_tags: reportData.crushLevel.positiveTags, // Supabase JS client handles array to PG array conversion
      crush_level_negative_tags: reportData.crushLevel.negativeTags, // Supabase JS client handles array to PG array conversion
      crush_mind: reportData.crushMind,
      green_flags: reportData.greenFlags, // Store as JSONB
      attachment_style_crush: reportData.attachmentStyle?.crush, // Use optional chaining if structure might vary
      attachment_style_user: reportData.attachmentStyle?.user,
      attachment_description: reportData.attachmentStyle?.description,
      reciprocity_score_score: reportData.reciprocityScore.score,
      reciprocity_score_comment: reportData.reciprocityScore.comment,
      compatibility_score_score: reportData.compatibilityScore.score,
      compatibility_score_comment: reportData.compatibilityScore.comment,
      red_flags: reportData.redFlags, // Store as JSONB
      raw_report: reportData, // Store the parsed JSON object directly
    };

    const { data: insertedReport, error: insertError } = await supabaseClient
      .from("reports")
      .insert(insertData)
      .select("id") // Select the ID of the newly created report
      .single(); // Expecting a single row back

    if (insertError) {
      console.error("Error inserting report into Supabase:", insertError);
      throw new Error(`Failed to save report: ${insertError.message}`);
    }

    console.log(
      `Report saved successfully for user ${user.id}, report ID: ${insertedReport.id}`,
    );

    // Return the created report ID or a success message
    return new Response(
      JSON.stringify({
        reportId: insertedReport.id,
        message: "Report generated successfully",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing AI reply or saving report:", error);
    // Also store the raw reply if parsing/saving failed, maybe in a separate 'failed_reports' table or log?
    let errorMessage = "An unknown error occurred while processing the report.";
    if (error instanceof Error) {
      errorMessage = `Failed to process report: ${error.message}`;
    }
    // For now, return a generic error
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/redflaggy' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
