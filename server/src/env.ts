import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, parse } from "dotenv";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

config({ path: path.join(ROOT, ".env"), quiet: true });

/* .env holds the keys people paste in. .env.local holds what setup generates (tunnel link, assistant id, password),
   so saving .env from an old editor window can't wipe them. A value set in .env wins. */
export const LOCAL_ENV = path.join(ROOT, ".env.local");
try {
  for (const [k, v] of Object.entries(parse(fs.readFileSync(LOCAL_ENV)))) {
    if (!(process.env[k] || "").trim()) process.env[k] = v;
  }
} catch {
  /* no .env.local yet */
}

// A blank line in .env must not count as a real Anthropic key.
if (process.env.ANTHROPIC_API_KEY === "") delete process.env.ANTHROPIC_API_KEY;
