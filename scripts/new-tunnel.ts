/* npm run new-tunnel -- https://your-new-link.trycloudflare.com
   Points everything at a new tunnel link: .env.local, Coo on Vapi, and the live Vercel site. */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { LOCAL_ENV, ROOT } from "../server/src/env.ts";

const url = (process.argv[2] || "").trim().replace(/\/$/, "");
if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(url)) {
  console.error("❌ Give the tunnel link, like: npm run new-tunnel -- https://some-words.trycloudflare.com");
  process.exit(1);
}

const text = fs.existsSync(LOCAL_ENV) ? fs.readFileSync(LOCAL_ENV, "utf8") : "";
const kept = text.split("\n").filter((l) => l && !l.startsWith("PUBLIC_URL="));
fs.writeFileSync(LOCAL_ENV, [`PUBLIC_URL=${url}`, ...kept, ""].join("\n"), { mode: 0o600 });

const vercelJson = path.join(ROOT, "web/vercel.json");
fs.writeFileSync(
  vercelJson,
  JSON.stringify({ rewrites: [{ source: "/api/:path*", destination: `${url}/api/:path*` }] }, null, 2) + "\n",
);
console.log(`✅ Saved the new link: ${url}`);

const run = (cmd: string, cwd = ROOT) => execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, PUBLIC_URL: url } });
run("npm run -s setup");
console.log("Deploying the live site…");
run("npx --yes vercel@latest deploy --prod --yes", path.join(ROOT, "web"));
console.log("✅ Done. Restart npm run dev so the server uses the new link.");
