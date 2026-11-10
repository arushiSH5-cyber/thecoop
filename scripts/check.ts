/* npm run check: one tiny request per sponsor, so we know in 10 seconds what's live.
   Prints status only, never key values or raw response bodies. */
import "../server/src/env.ts";
import Anthropic from "@anthropic-ai/sdk";

const TIMEOUT = 8000;
const env = (k: string) => (process.env[k] || "").trim();

interface Row {
  name: string;
  ok: boolean;
  detail: string;
}
type Check = () => Promise<Row>;

const get = (url: string, headers: Record<string, string> = {}) =>
  fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT) });
const post = (url: string, headers: Record<string, string>, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT),
  });

function withKey(name: string, key: string, fallback: string, run: (k: string) => Promise<Row>): Check {
  return async () => {
    const k = env(key);
    if (!k) return { name, ok: false, detail: `no ${key} yet. Fallback: ${fallback}` };
    try {
      return await run(k);
    } catch (e) {
      const why = e instanceof Error && e.name === "TimeoutError" ? "timed out" : "network error";
      return { name, ok: false, detail: `${why}. Fallback: ${fallback}` };
    }
  };
}
const status = (name: string, r: Response, good: string, fallback: string): Row =>
  r.ok ? { name, ok: true, detail: good } : { name, ok: false, detail: `HTTP ${r.status}. Fallback: ${fallback}` };

const present = (name: string, key: string, why: string): Check => async () =>
  env(key) ? { name, ok: true, detail: "set" } : { name, ok: false, detail: `not set: ${why}` };

const checks: Check[] = [
  withKey("Vapi", "VAPI_PRIVATE_KEY", "browser speech (local engine)", async (k) =>
    status("Vapi", await get("https://api.vapi.ai/assistant?limit=1", { Authorization: `Bearer ${k}` }), "private key works", "browser speech (local engine)"),
  ),
  withKey("Deepgram", "DEEPGRAM_API_KEY", "browser voices", async (k) =>
    status(
      "Deepgram",
      await post("https://api.deepgram.com/v1/speak?model=aura-2-thalia-en", { Authorization: `Token ${k}` }, { text: "Coo." }),
      "Aura-2 spoke",
      "browser voices",
    ),
  ),
  withKey("Exa", "EXA_API_KEY", "sample news, labeled", async (k) =>
    status(
      "Exa",
      await post("https://api.exa.ai/search", { "x-api-key": k }, { query: "accessibility news", numResults: 1 }),
      "search works",
      "sample news, labeled",
    ),
  ),
  withKey("Exa find-similar", "EXA_API_KEY", "plain search on the story title", async (k) => {
    const r = await post("https://api.exa.ai/findSimilar", { "x-api-key": k }, { url: "https://www.loc.gov/nls/", numResults: 1 });
    return status("Exa find-similar", r, "endpoint works", "plain search on the story title");
  }),
  withKey("Jev", "TYPESAFE_API_KEY", "keyword rules, labeled sample", async (k) =>
    status(
      "Jev",
      await post(
        "https://api.typesafe.ai/v1/systemone",
        { Authorization: `Bearer ${k}` },
        { model: "jev-latest", state: "Coo!", questions: { ok: { type: "noul", instructions: "Is this text friendly?" } } },
      ),
      "decision returned",
      "keyword rules, labeled sample",
    ),
  ),
  withKey("Manus", "MANUS_API_KEY", "scripted sample, labeled", async (k) => {
    // A made-up task id costs nothing: a good key gets "not found", a bad key gets 401.
    const r = await get("https://api.manus.ai/v2/task.listMessages?task_id=coop-check&limit=1", { "x-manus-api-key": k });
    const bad = r.status === 401 || r.status === 403;
    return { name: "Manus", ok: !bad, detail: bad ? `HTTP ${r.status}. Fallback: scripted sample, labeled` : "key accepted" };
  }),
  async () => ({ name: "AdaL", ok: false, detail: "no public video API found. Using the browser clip, labeled sample" }),
  async () => {
    const name = "Anthropic vision";
    try {
      await new Anthropic({ timeout: TIMEOUT, maxRetries: 0 }).models.retrieve("claude-opus-5-5");
      return { name, ok: true, detail: "claude-opus-5-5 available" };
    } catch (e) {
      const detail =
        e instanceof Anthropic.AuthenticationError
          ? "key rejected"
          : e instanceof Anthropic.NotFoundError
            ? "model not available on this key"
            : e instanceof Anthropic.APIError && e.status
              ? `HTTP ${e.status}`
              : "no key or network error";
      return { name, ok: false, detail: `${detail}. Fallback: the sample descriptions` };
    }
  },
  present("VAPI_PUBLIC_KEY", "VAPI_PUBLIC_KEY", "the web mic needs it"),
  present("VAPI_ASSISTANT_ID", "VAPI_ASSISTANT_ID", "npm run setup creates the assistant"),
  present("VAPI_PHONE_NUMBER_ID", "VAPI_PHONE_NUMBER_ID", "needed for phone in and out"),
  present("DEMO_PHONE", "DEMO_PHONE", "needed for the outbound call"),
  present("TOOLS_SECRET", "TOOLS_SECRET", "protects /tools/* on the tunnel"),
  async () => {
    const name = "Tunnel";
    const url = env("PUBLIC_URL");
    if (!url) return { name, ok: false, detail: "no PUBLIC_URL yet. Vapi can't reach our tools" };
    try {
      const r = await get(`${url.replace(/\/$/, "")}/api/health`);
      return { name, ok: r.ok, detail: r.ok ? "server reachable from the internet" : `HTTP ${r.status}` };
    } catch {
      return { name, ok: false, detail: "can't reach it. Is the tunnel and npm run dev running?" };
    }
  },
];

const rows = await Promise.all(checks.map((c) => c()));
const width = Math.max(...rows.map((r) => r.name.length));
for (const r of rows) console.log(`${r.ok ? "✅" : "❌"} ${r.name.padEnd(width)}  ${r.detail}`);
console.log(`\n${rows.filter((r) => r.ok).length} of ${rows.length} live`);
