import "./env.ts";
import crypto from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import { POSTS } from "../../web/src/data.ts";
import { addClient, publish, tick } from "./bus.ts";
import { onCallEvent } from "./calls.ts";
import { moderate } from "./jev.ts";
import { addPost, holdPost, moderateCircles, publicState } from "./store.ts";
import { prerenderDescriptions } from "./vision.ts";
import { HANDLERS } from "./tools.ts";
import { clipPath, ensureClip, prerenderClips } from "./voices.ts";

const app = express();
app.use(express.json({ limit: "20mb" }));

function sameSecret(given: unknown) {
  const want = process.env.TOOLS_SECRET || "";
  if (!want || typeof given !== "string") return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

function requireSecret(req: Request, res: Response, next: NextFunction) {
  if (sameSecret(req.headers["x-coop-secret"])) return next();
  res.status(401).json({ error: "unauthorized" });
}

/* The tunnel makes this server public. /tools/* needs the secret. /api/* is open so the Vercel site can reach it;
   it only exposes the feed, the Vapi public key, and voice posting. */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

let phoneNumber = "";
async function loadPhoneNumber() {
  const id = (process.env.VAPI_PHONE_NUMBER_ID || "").trim();
  const key = (process.env.VAPI_PRIVATE_KEY || "").trim();
  if (!id || !key) return;
  const r = await fetch(`https://api.vapi.ai/phone-number/${id}`, { headers: { Authorization: `Bearer ${key}` } }).catch(() => null);
  if (r?.ok) phoneNumber = ((await r.json()) as { number?: string }).number || "";
}

app.get("/api/config", (_req, res) => {
  const publicKey = process.env.VAPI_PUBLIC_KEY || "";
  const assistantId = process.env.VAPI_ASSISTANT_ID || "";
  res.json({ ...(publicKey && assistantId ? { publicKey, assistantId } : {}), phoneNumber });
});

app.get("/api/events", (_req, res) => addClient(res));

app.get("/api/voice/:id", async (req, res) => {
  const id = req.params.id;
  if (!(await ensureClip(id))) {
    res.status(404).end();
    return;
  }
  res.type("audio/mpeg").sendFile(clipPath(id));
});

app.get("/api/state", (_req, res) => res.json(publicState()));

/* Voice posts from the web app: Deepgram writes the transcript, Jev checks it, then it joins the feed. */
app.post("/api/voice-post", express.raw({ type: "audio/*", limit: "20mb" }), async (req, res) => {
  const key = (process.env.DEEPGRAM_API_KEY || "").trim();
  if (!key || !Buffer.isBuffer(req.body)) {
    res.status(503).json({ error: "transcription unavailable" });
    return;
  }
  const r = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true", {
    method: "POST",
    headers: { Authorization: `Token ${key}`, "Content-Type": req.headers["content-type"] || "audio/webm" },
    body: new Uint8Array(req.body),
  });
  if (!r.ok) {
    res.status(502).json({ error: "transcription failed" });
    return;
  }
  const out = (await r.json()) as any;
  const text = String(out.results?.channels?.[0]?.alternatives?.[0]?.transcript || "").trim();
  if (!text) {
    res.json({ status: "empty" });
    return;
  }
  tick("Deepgram", "transcribed your voice post");
  const m = await moderate(text);
  if (m.decision === "hold") {
    holdPost({ where: "your post", why: m.reason, by: m.by });
    publish({ type: "earcon", kind: "held" });
    tick("Jev", `held your post: ${m.reason}`);
    res.json({ status: "held", why: m.reason });
    return;
  }
  const post = addPost("You", "Y", text);
  publish({ type: "show_post", id: post.id });
  publish({ type: "earcon", kind: "post" });
  res.json({ status: "posted", text });
});

app.post("/tools/call_event", requireSecret, (req, res) => {
  onCallEvent(req.body?.message);
  res.json({});
});

app.post("/tools/:name", requireSecret, async (req, res) => {
  const message = req.body?.message;
  if (message?.type !== "tool-calls" || !Array.isArray(message.toolCallList)) {
    res.json({ results: [] });
    return;
  }
  const results = await Promise.all(
    message.toolCallList.map(async (tc: any) => {
      const name = String(tc.function?.name);
      const toolCallId = tc.id;
      try {
        const raw = tc.function?.arguments;
        const args = typeof raw === "string" ? JSON.parse(raw || "{}") : raw || {};
        const handler = HANDLERS[name];
        if (!handler) throw new Error("unknown tool");
        return { name, toolCallId, result: JSON.stringify(await handler(args, message.call || {})) };
      } catch (e) {
        console.error(`tool ${name} failed:`, e instanceof Error ? e.message : e);
        return { name, toolCallId, result: JSON.stringify({ error: "That didn't work. Say sorry and offer to try again." }) };
      }
    }),
  );
  res.json({ results });
});

const port = 8787;
app.listen(port, () => {
  console.log(`The Coop server on http://localhost:${port}`);
  void loadPhoneNumber();
  moderateCircles().then((n) => console.log(`Circles checked: ${n} held`));
  prerenderClips().then((r) => console.log(`Friend voices ready: ${r.filter(Boolean).length} of ${r.length}`));
  prerenderDescriptions(POSTS).then((r) => console.log(`Photos described live: ${r.filter((x) => x.source === "vision").length} of ${r.length}`));
});
