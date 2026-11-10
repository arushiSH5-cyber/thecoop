/* Posts, likes, replies and held posts, saved in server/data.json. No login. */
import fs from "node:fs";
import path from "node:path";
import { CIRCLES, HELD, POSTS, type Post } from "../../web/src/data.ts";
import { publish } from "./bus.ts";
import { ROOT } from "./env.ts";
import { moderate } from "./jev.ts";

const FILE = path.join(ROOT, "server/data.json");

export interface HeldPost {
  where: string;
  why: string;
  by: "Jev" | "sample";
}
export interface CircleView {
  t: string;
  n: string;
  posts: string[];
}
interface Data {
  mine: Post[];
  liked: string[];
  replies: Record<string, string[]>;
  held: HeldPost[];
}

function load(): Data {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Data;
  } catch {
    return { mine: [], liked: [], replies: {}, held: [] };
  }
}
const data = load();
let circles: CircleView[] = CIRCLES.map((c) => ({ ...c, posts: [...c.posts] }));
let circleHeld: HeldPost[] = [];

function save() {
  fs.writeFileSync(FILE + ".tmp", JSON.stringify(data, null, 2));
  fs.renameSync(FILE + ".tmp", FILE);
}

export const feed = (): Post[] => [...data.mine, ...POSTS];
export const allHeld = () => [...circleHeld, ...data.held];
export const getCircles = () => circles;

export const publicState = () => ({
  liked: data.liked,
  replies: data.replies,
  mine: data.mine,
  circles,
  held: allHeld(),
});
export const pushState = () => publish({ type: "state", state: publicState() });

export function likePost(id: string) {
  if (!data.liked.includes(id)) data.liked.push(id);
  save();
  pushState();
}

export function addReply(id: string, line: string) {
  (data.replies[id] ||= []).push(line);
  save();
  pushState();
}

export function holdPost(entry: HeldPost) {
  data.held.push(entry);
  save();
  pushState();
}

export function addPost(who: string, init: string, text: string): Post {
  const post: Post = {
    id: "m" + Date.now(),
    who,
    init,
    col: "var(--p1)",
    ago: "just now",
    pitch: 1,
    rate: 1,
    voice: text,
    scene: null,
  };
  data.mine.unshift(post);
  save();
  pushState();
  return post;
}

/** Runs every Circles post through moderation at startup, so held posts are decided before anyone can hear them. */
export async function moderateCircles() {
  const held: HeldPost[] = [];
  const checked: CircleView[] = [];
  for (const [i, c] of CIRCLES.entries()) {
    const incoming = i === 0 ? [...c.posts, HELD.t] : c.posts;
    const kept: string[] = [];
    for (const text of incoming) {
      const m = await moderate(text);
      if (m.decision === "allow") kept.push(text);
      else held.push({ where: c.t, why: m.reason, by: m.by });
    }
    checked.push({ t: c.t, n: c.n, posts: kept });
  }
  circles = checked;
  circleHeld = held;
  pushState();
  return held.length;
}
