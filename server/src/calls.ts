/* call_someone: Coo phones a family member about a post. The number only ever comes from .env, never from the conversation. */
import { publish, tick } from "./bus.ts";
import { addPost } from "./store.ts";

const env = (k: string) => (process.env[k] || "").trim();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const callStatus = (status: string, text = "", done = false, sample = false) =>
  publish({ type: "call", status, text, done, sample });

export function phoneReply(text: string) {
  const post = addPost("Grandma Rosa", "R", text);
  tick("Deepgram", "transcribed Rosa's reply");
  publish({ type: "earcon", kind: "post" });
  callStatus("rosa replied", `“${text}”`);
  return post;
}

async function sampleCall(description: string) {
  callStatus("ringing her phone… (sample)", "", false, true);
  await wait(2500);
  callStatus("connected (sample)", description, false, true);
  await wait(4000);
  phoneReply("Tell him I'm proud of him. (sample)");
  await wait(2500);
  callStatus("posted to the feed", "", true, true);
}

function phoneAssistant(description: string) {
  const base = env("PUBLIC_URL").replace(/\/$/, "");
  const server = { url: `${base}/tools/phone_reply`, headers: { "x-coop-secret": env("TOOLS_SECRET") } };
  return {
    name: "Coo calling Grandma",
    firstMessage: "Hi Rosa, it's Coo from The Coop. Alex just shared a photo with you. Would you like to hear about it?",
    maxDurationSeconds: 240,
    transcriber: { provider: "deepgram", model: "flux-general-en", language: "en" },
    voice: { provider: "deepgram", model: "aura-2", voiceId: "helena" },
    model: {
      provider: "anthropic",
      model: "claude-haiku-5-5",
      maxTokens: 200,
      messages: [
        {
          role: "system",
          content: `You are Coo, a friendly pigeon from The Coop, calling Rosa, Alex's grandmother. Use short, warm sentences.
The photo shows: ${description}
Describe it when she says yes. Then ask if she wants to say something back to Alex. When she gives a message, call phone_reply with her exact words, tell her you posted it, say goodbye, and end the call. If she doesn't want to, say a kind goodbye and end the call.`,
        },
      ],
      tools: [
        { type: "endCall" },
        {
          type: "function",
          messages: [],
          server,
          function: {
            name: "phone_reply",
            description: "Post Rosa's spoken message back to Alex's feed.",
            parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
          },
        },
      ],
    },
    server: { url: `${base}/tools/call_event`, headers: server.headers },
    serverMessages: ["status-update", "end-of-call-report"],
  };
}

export async function placeCall(description: string): Promise<"live" | "sample"> {
  const key = env("VAPI_PRIVATE_KEY");
  const phoneNumberId = env("VAPI_PHONE_NUMBER_ID");
  const number = env("DEMO_PHONE");
  if (key && phoneNumberId && number && env("PUBLIC_URL")) {
    try {
      const r = await fetch("https://api.vapi.ai/call", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId, customer: { number }, assistant: phoneAssistant(description) }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        tick("Vapi", "calling Grandma Rosa's phone");
        callStatus("ringing her phone…");
        return "live";
      }
      console.error(`Vapi outbound call: HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    } catch {
      console.error("Vapi outbound call: network error");
    }
  }
  tick("Vapi", "sample call: no phone number set up");
  void sampleCall(description);
  return "sample";
}

export function onCallEvent(message: any) {
  if (message?.type === "end-of-call-report") {
    callStatus("call ended", "", true);
  } else if (message?.type === "status-update") {
    if (message.status === "in-progress") callStatus("connected");
    if (message.status === "ended") callStatus("call ended", "", true);
  }
}
