/* npm run setup: creates or updates the Coo assistant on Vapi, and saves its id to .env. */
import fs from "node:fs/promises";
import { LOCAL_ENV } from "../server/src/env.ts";
import { buildAssistant } from "../server/src/assistant.ts";

const env = (k: string) => (process.env[k] || "").trim();

function need(k: string, hint: string) {
  const v = env(k);
  if (!v) {
    console.error(`❌ ${k} is missing. ${hint}`);
    process.exit(1);
  }
  return v;
}

const key = need("VAPI_PRIVATE_KEY", "Add it to .env.");
const url = need("PUBLIC_URL", "Start the tunnel and put its https URL in .env.");
const secret = need("TOOLS_SECRET", "Add any long random string to .env.");
const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const body = JSON.stringify(buildAssistant(url, secret));

async function send(method: string, target: string) {
  return fetch(`https://api.vapi.ai/${target}`, { method, headers, body, signal: AbortSignal.timeout(20000) });
}

const existing = env("VAPI_ASSISTANT_ID");
let res = existing ? await send("PATCH", `assistant/${existing}`) : await send("POST", "assistant");
if (existing && res.status === 404) res = await send("POST", "assistant");

if (!res.ok) {
  console.error(`❌ Vapi said HTTP ${res.status}:`);
  console.error(await res.text());
  process.exit(1);
}

const { id } = (await res.json()) as { id: string };
const text = await fs.readFile(LOCAL_ENV, "utf8").catch(() => "");
const kept = text.split("\n").filter((l) => l && !l.startsWith("VAPI_ASSISTANT_ID="));
await fs.writeFile(LOCAL_ENV, [...kept, `VAPI_ASSISTANT_ID=${id}`, ""].join("\n"), { mode: 0o600 });
console.log(`✅ Coo is ${existing ? "updated" : "created"} on Vapi: ${id}`);

const phoneId = env("VAPI_PHONE_NUMBER_ID");
if (phoneId) {
  const r = await fetch(`https://api.vapi.ai/phone-number/${phoneId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ assistantId: id }),
    signal: AbortSignal.timeout(20000),
  });
  console.log(r.ok ? "✅ Phone number now answers as Coo" : `❌ Couldn't attach the phone number: HTTP ${r.status}`);
}
console.log(`   Tools point at ${url.replace(/\/$/, "")}/tools/*`);
console.log("   Restart npm run dev if the assistant id is new.");
