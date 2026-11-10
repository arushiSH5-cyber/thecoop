/* describe_photo: sends the real image to Claude. Without an image or a key, it uses the sample text. */
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { Post } from "../../web/src/data.ts";
import { ROOT } from "./env.ts";

const PHOTOS = path.join(ROOT, "web/public/photos");
const client = new Anthropic({ timeout: 15000, maxRetries: 1 });
const baseCache = new Map<string, string>();

export interface PhotoAnswer {
  text: string;
  source: "vision" | "sample";
}

const SYSTEM = `You describe photos for people who are blind or have low vision. Your words will be spoken aloud.
Rules:
- Plain sentences only. No lists, markdown, or preamble like "This image shows".
- Lead with what matters most: who or what, what's happening, the mood.
- A description is two short sentences, under 35 words in total. An answer to a question is one short sentence or two.
- Only say what you can actually see. If you can't tell, say so.
- Never guess the name of anyone in the photo. You may use a name only if it's listed as tagged, and only for the person who is clearly the photo's subject.
- Never mention tags or tagging. If no one is in the photo, just describe what is there.`;

async function loadImage(id: string) {
  try {
    const data = await fs.readFile(path.join(PHOTOS, `${id}.jpg`));
    return data.toString("base64");
  } catch {
    return null;
  }
}

function sample(post: Post, question?: string): PhotoAnswer {
  if (!question) return { text: post.desc || "I can't see this photo right now.", source: "sample" };
  const hit = post.qa?.find(([re]) => re.test(question.toLowerCase()));
  return { text: hit ? hit[1] : "I can't tell that from this photo.", source: "sample" };
}

async function askVision(post: Post, image: string, question?: string): Promise<string | null> {
  const task = question
    ? `Answer this question about the photo: ${question}`
    : "Describe this photo.";
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          { type: "text", text: `Tagged in this photo: ${post.who}.\n${task}` },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(" ").trim();
  return text || null;
}

export async function describePhoto(post: Post, question?: string): Promise<PhotoAnswer> {
  if (!question && baseCache.has(post.id)) return { text: baseCache.get(post.id)!, source: "vision" };
  const image = await loadImage(post.id);
  if (!image) return sample(post, question);
  try {
    const text = await askVision(post, image, question);
    if (!text) return sample(post, question);
    if (!question) baseCache.set(post.id, text);
    return { text, source: "vision" };
  } catch (e) {
    console.error("vision failed:", e instanceof Anthropic.APIError ? `HTTP ${e.status}` : "network");
    return sample(post, question);
  }
}

/** Describe photos at startup so the first "describe it" in the demo is instant. */
export function prerenderDescriptions(posts: Post[]) {
  return Promise.all(posts.filter((p) => p.scene).map((p) => describePhoto(p)));
}
