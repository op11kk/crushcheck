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
} from "https://deno.land/x/openai@v4.24.0/resources/chat/completions.ts";

Deno.serve(async (req) => {
  if (!req.headers.get("Authorization")) {
    return new Response("Authorization header is required", { status: 401 });
  }
  const supabaseClient = createClient(
    // Supabase API URL - env var exported by default.
    Deno.env.get("SUPABASE_URL") ?? "",
    // Supabase API ANON KEY - env var exported by default.
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    // Create client with Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    },
  );
  // Get the session or user object
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const user = await supabaseClient.auth.getUser(token);
  if (!user?.data?.user) {
    return new Response("Authentication failed", { status: 401 });
  }
  const messages: Array<ChatCompletionMessageParam> = await req.json();

  // Process any image URLs in the messages to create signed URLs
  const processedMessages = await Promise.all(
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
  );
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const openai = new OpenAI({
    apiKey: apiKey,
  });
  // Documentation here: https://github.com/openai/openai-node
  const chatCompletion = await openai.chat.completions.create({
    messages: processedMessages as ChatCompletionMessageParam[],
    // Choose model from here: https://platform.openai.com/docs/models
    model: "gpt-4o-mini",
    max_tokens: 16000,
    stream: false,
  });
  const reply = chatCompletion.choices[0].message.content;
  return new Response(reply, {
    headers: { "Content-Type": "text/plain" },
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/redflaggy' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
