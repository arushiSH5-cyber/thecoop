/* Exa: live, sourced information. Returns null when there's no key or a request fails, so tools can use labeled samples. */

export interface Source {
  title: string;
  outlet: string;
  url: string;
  date: string;
  text: string;
}

const key = () => (process.env.EXA_API_KEY || "").trim();

const OFFICIAL = ["*.gov", "loc.gov", "adata.org"];

function outletOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the web";
  }
}

function normalize(r: any): Source {
  const highlights = Array.isArray(r.highlights) ? r.highlights.join(" ") : "";
  return {
    title: String(r.title || "Untitled"),
    outlet: outletOf(r.url),
    url: String(r.url),
    date: r.publishedDate ? String(r.publishedDate).slice(0, 10) : "",
    text: String(highlights || r.text || "").slice(0, 700),
  };
}

async function post(path: string, body: unknown): Promise<Source[] | null> {
  if (!key()) return null;
  try {
    const r = await fetch(`https://api.exa.ai/${path}`, {
      method: "POST",
      headers: { "x-api-key": key(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) {
      console.error(`Exa ${path}: HTTP ${r.status}`);
      return null;
    }
    const { results } = (await r.json()) as { results: unknown[] };
    return results.map(normalize);
  } catch {
    console.error(`Exa ${path}: network error`);
    return null;
  }
}

const contents = { highlights: { maxCharacters: 700 }, text: { maxCharacters: 700 } };

export function searchNews(topic?: string) {
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  return post("search", {
    query: topic ? `latest news about ${topic}` : "good news about accessibility, disability and community today",
    category: "news",
    numResults: 5,
    startPublishedDate: since,
    contents,
  });
}

export function searchHelp(need: string, city?: string) {
  return post("search", {
    query: `${need} services and programs for people with disabilities${city ? ` in ${city}` : ""}`,
    includeDomains: OFFICIAL,
    numResults: 3,
    contents,
  });
}

export function searchLesson(topic: string) {
  return post("search", {
    query: `beginner friendly lesson: ${topic}, for people who are blind or have low vision`,
    numResults: 3,
    contents,
  });
}

export async function similarTo(url: string, title: string) {
  const similar = await post("findSimilar", { url, numResults: 4, contents });
  const found = similar ?? (await post("search", { query: title, numResults: 4, contents }));
  return found ? found.filter((s) => s.url !== url) : null;
}
