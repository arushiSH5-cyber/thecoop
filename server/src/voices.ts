/* Friend voices: each seed post is rendered once with its own Deepgram Aura-2 voice, then cached on disk. */
import fs from "node:fs/promises";
import path from "node:path";
import { POSTS } from "../../web/src/data.ts";
import { ROOT } from "./env.ts";

const CACHE = path.join(ROOT, "server/cache");

export const FRIEND_VOICES: Record<string, string> = {
  p1: "aura-2-thalia-en", // Maya: clear, energetic
  p2: "aura-2-zeus-en", // Grandpa Joe: deep
  p3: "aura-2-andromeda-en", // Priya: casual, expressive
  p4: "aura-2-apollo-en", // Dev: confident, casual
  p5: "aura-2-luna-en", // Lena
  p6: "aura-2-orion-en", // Omar
  p7: "aura-2-athena-en", // Nina: mature, calm
  p8: "aura-2-arcas-en", // Theo: natural, smooth
};

export const clipPath = (id: string) => path.join(CACHE, `${id}.mp3`);

const inFlight = new Map<string, Promise<boolean>>();

async function render(id: string): Promise<boolean> {
  const post = POSTS.find((p) => p.id === id);
  const model = FRIEND_VOICES[id];
  const key = process.env.DEEPGRAM_API_KEY;
  if (!post || !model || !key) return false;
  const r = await fetch(`https://api.deepgram.com/v1/speak?model=${model}`, {
    method: "POST",
    headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: post.voice }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) {
    console.error(`Deepgram clip for ${id}: HTTP ${r.status}`);
    return false;
  }
  await fs.mkdir(CACHE, { recursive: true });
  await fs.writeFile(clipPath(id), Buffer.from(await r.arrayBuffer()));
  return true;
}

/** True once the clip is on disk. Unknown ids are refused, so this never touches other paths. */
export async function ensureClip(id: string): Promise<boolean> {
  if (!FRIEND_VOICES[id]) return false;
  const exists = await fs.access(clipPath(id)).then(() => true, () => false);
  if (exists) return true;
  let job = inFlight.get(id);
  if (!job) {
    job = render(id).catch(() => false).finally(() => inFlight.delete(id));
    inFlight.set(id, job);
  }
  return job;
}

export function prerenderClips() {
  return Promise.all(Object.keys(FRIEND_VOICES).map(ensureClip));
}
