/* TypeSafe Jev: typed decisions. Without a key or on an error, simple keyword rules stand in and say so. */

const key = () => (process.env.TYPESAFE_API_KEY || "").trim();

async function ask(state: unknown, questions: Record<string, unknown>): Promise<Record<string, any> | null> {
  if (!key()) return null;
  try {
    const r = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "jev-latest", state, questions }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) {
      console.error(`Jev: HTTP ${r.status}`);
      return null;
    }
    return ((await r.json()) as { answers: Record<string, any> }).answers;
  } catch {
    console.error("Jev: network error");
    return null;
  }
}

export interface Moderation {
  decision: "allow" | "hold";
  reason: string;
  by: "Jev" | "sample";
}

const REASONS: Record<string, string> = {
  scam: "looked like a scam",
  harassment: "looked like harassment",
  spam: "looked like spam",
};

const SCAM_WORDS = /gift ?card|wire (me|money|transfer)|free (phone|iphone|money)|send \$|bitcoin|crypto giveaway|click (this|the) link|your password|social security number|you('ve| have) won/i;
const MEAN_WORDS = /\b(idiot|stupid|loser|shut up|kill yourself|worthless)\b/i;

export async function moderate(text: string): Promise<Moderation> {
  const answers = await ask(text, {
    verdict: {
      type: "choice",
      instructions: "This message was posted in a small support community for blind and low-vision people. Classify it.",
      criteria: {
        safe: "An ordinary, friendly or supportive message, including sad or difficult feelings.",
        scam: "Asks for money, gift cards, passwords or personal details, or promises prizes.",
        harassment: "Insults, threatens or demeans someone.",
        spam: "Unwanted advertising or repeated promotion.",
      },
    },
  });
  const v = answers?.verdict;
  if (v?.choice) {
    const hold = v.choice !== "safe" && (v.confidence ?? 1) >= 0.5;
    return { decision: hold ? "hold" : "allow", reason: hold ? REASONS[v.choice] : "", by: "Jev" };
  }
  if (SCAM_WORDS.test(text)) return { decision: "hold", reason: REASONS.scam, by: "sample" };
  if (MEAN_WORDS.test(text)) return { decision: "hold", reason: REASONS.harassment, by: "sample" };
  return { decision: "allow", reason: "", by: "sample" };
}

export interface Gate {
  needs_confirmation: boolean;
  by: "Jev" | "sample";
}

export async function safetyGate(action: string, detail: string): Promise<Gate> {
  const answers = await ask(`${action}: ${detail}`, {
    needs_confirmation: {
      type: "noul",
      instructions: "An assistant is about to do this for a user who may be blind. Should it ask the user to confirm first?",
      criteria: {
        true: "It spends money, shares personal or sensitive details, contacts a new person, or would be hard to undo.",
        false: "It's an ordinary friendly message to friends.",
      },
    },
  });
  const n = answers?.needs_confirmation?.noul;
  if (typeof n === "number") return { needs_confirmation: n >= 0.5, by: "Jev" };
  return {
    needs_confirmation: /\$|money|pay|card|address|password|phone number|social security/i.test(detail),
    by: "sample",
  };
}

const INTENTS = [
  "get_feed", "describe_photo", "like_post", "reply", "create_post", "get_news", "more_like_this",
  "find_help", "learn", "get_circle", "do_for_me", "make_share_video", "call_someone", "go_to_room",
];

export async function routeIntent(utterance: string): Promise<{ tool: string | null; by: "Jev" | "sample" }> {
  const criteria = Object.fromEntries([...INTENTS, "unclear"].map((t) => [t, null]));
  const answers = await ask(utterance, {
    tool: { type: "choice", instructions: "Which feature of a voice social app is this person asking for?", criteria },
  });
  const c = answers?.tool;
  if (c?.choice) return { tool: c.choice === "unclear" || (c.confidence ?? 1) < 0.5 ? null : c.choice, by: "Jev" };
  return { tool: null, by: "sample" };
}
