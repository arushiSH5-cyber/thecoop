/* App state and the local command engine.
   Ported from the prototype. It stays as the offline fallback once Vapi is wired in,
   so the demo still works if the voice connection drops. */
import { CIRCLES, HELD, HELP, LEARN, NEWS, POSTS, type Post, type Room } from "./data";
import { svg } from "./doodles";

const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem("coop_" + k);
      return v ? (JSON.parse(v) as T) : d;
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem("coop_" + k, JSON.stringify(v));
    } catch {
      /* private mode */
    }
  },
};

export interface Settings {
  rate: number;
  voice: string;
  hc: boolean;
  calm: boolean;
  fs: number;
  sr: boolean;
  expert: boolean;
  everyone: boolean;
}
export interface LiveStory {
  story: { title: string; outlet: string; url: string; date: string; text: string };
  pos: number;
  total: number;
  sample: boolean;
}
export interface LiveItem {
  t: string;
  b: string;
  src?: string;
  by?: string;
  url: string;
}
export interface ServerState {
  liked: string[];
  replies: Record<string, string[]>;
  mine: Post[];
  circles: { t: string; n: string; posts: string[] }[];
  held: { where: string; why: string; by: string }[];
}
export interface Task {
  t: string;
  done?: boolean;
}
export interface AppState {
  room: Room;
  idx: number;
  helpKey: string | null;
  task: Task[] | null;
  liked: string[];
  myPosts: Post[];
  posts: Post[];
  cooSays: string;
  youSaid: string;
  reading: string | null;
  live: boolean;
  talking: boolean;
  ticker: { sp: string; msg: string; used: string[]; pulse: number };
  toast: string | null;
  typeOpen: boolean;
  sheet: "about" | "settings" | null;
  call: { status: string; text: string; sample?: boolean } | null;
  settings: Settings;
  voices: string[];
  liveStory: LiveStory | null;
  liveHelp: LiveItem | null;
  liveLesson: LiveItem | null;
  circles: ServerState["circles"] | null;
  held: ServerState["held"];
  videos: Record<string, string>;
  phoneNumber: string;
  recording: boolean;
}

let st: AppState = {
  room: "lobby",
  idx: 0,
  helpKey: null,
  task: null,
  liked: store.get<string[]>("liked", []),
  myPosts: store.get<Post[]>("mine", []),
  posts: POSTS,
  cooSays: "Hi, I'm Coo. Tap the mic, or press space, and say “what's new?”",
  youSaid: "…",
  reading: null,
  live: false,
  talking: false,
  ticker: { sp: "Vapi", msg: "ready when you are", used: [], pulse: 0 },
  toast: null,
  typeOpen: false,
  sheet: null,
  call: null,
  settings: Object.assign(
    { rate: 1, voice: "", hc: false, calm: false, fs: 1, sr: false, expert: false, everyone: false },
    store.get<Partial<Settings>>("set", {}),
  ),
  voices: [],
  liveStory: null,
  liveHelp: null,
  liveLesson: null,
  circles: null,
  held: [],
  videos: {},
  phoneNumber: "",
  recording: false,
};

const subs = new Set<() => void>();
export const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};
export const getState = () => st;
function set(p: Partial<AppState> = {}) {
  st = { ...st, ...p };
  subs.forEach((f) => f());
}

export const patch = set;

export interface LiveHooks {
  available(): boolean;
  active(): boolean;
  toggle(): void;
  send(text: string): void;
  stop(): void;
}
let hooks: LiveHooks | null = null;
export function setLiveHooks(h: LiveHooks) {
  hooks = h;
}
export const isLive = () => !!hooks?.active();
export function stopAll() {
  if (hooks?.active()) hooks.stop();
  else stopTalk();
}
export function showPost(id: string) {
  const i = allPosts().findIndex((p) => p.id === id);
  if (i >= 0) set({ room: "feed", idx: i, helpKey: null, task: null });
}

export function applyServerState(s: ServerState) {
  for (const p of [...st.posts, ...s.mine]) p.replies = s.replies[p.id];
  set({ liked: s.liked, myPosts: s.mine, circles: s.circles, held: s.held });
}
export function playIndex(i: number) {
  if (hooks?.active()) {
    hooks.send(`play post number ${i + 1}`);
    return;
  }
  set({ idx: i });
  tone("next");
  announce();
}
export function setEveryone(on: boolean) {
  updateSettings({ everyone: on });
  if (!on) return;
  if (hooks?.available() && !hooks.active()) hooks.toggle();
  else handle("play my feed");
}

export function showDescription(id: string, text: string) {
  const p = allPosts().find((x) => x.id === id);
  if (!p) return;
  p.desc = text;
  set({ reading: "v-desc" });
}

function applySet() {
  const r = document.documentElement;
  const S = st.settings;
  r.classList.toggle("hc", S.hc);
  r.classList.toggle("calm", S.calm);
  r.style.setProperty("--fs", String(S.fs));
  store.set("set", S);
}
applySet();
export function updateSettings(p: Partial<Settings>) {
  set({ settings: { ...st.settings, ...p } });
  applySet();
}

/* ---------- sound + speech ---------- */
let AC: AudioContext | null = null;
export function tone(kind: string) {
  try {
    AC = AC || new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = AC;
    const t = ctx.currentTime;
    const seqs: Record<string, [number, number][]> = {
      like: [[880, 0], [1320, 0.08]],
      next: [[520, 0], [700, 0.05]],
      back: [[700, 0], [520, 0.05]],
      listen: [[660, 0]],
      err: [[220, 0], [180, 0.1]],
      post: [[660, 0], [880, 0.08], [1100, 0.16]],
      held: [[320, 0], [240, 0.14]],
    };
    (seqs[kind] || [[600, 0]]).forEach(([f, d]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.18, t + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start(t + d);
      o.stop(t + d + 0.2);
    });
  } catch {
    /* no audio */
  }
}

const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
let voices: SpeechSynthesisVoice[] = [];
function loadV() {
  if (!synth) return;
  voices = synth.getVoices().filter((v) => /^en/i.test(v.lang));
  set({ voices: voices.map((v) => v.name) });
}
if (synth) {
  loadV();
  synth.onvoiceschanged = loadV;
}

interface SayOpt {
  rate?: number;
  pitch?: number;
  el?: string;
}
let speakTok = 0;
export function say(text: string, opt: SayOpt = {}): Promise<void> {
  const tok = ++speakTok;
  set({ cooSays: text });
  const S = st.settings;
  if (S.sr || !synth) return Promise.resolve();
  const engine = synth;
  engine.cancel();
  return new Promise<void>((res) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = S.rate * (opt.rate || 1) * (S.expert ? 1.15 : 1);
    u.pitch = opt.pitch || 1;
    const v = voices.find((x) => x.name === S.voice);
    if (v) u.voice = v;
    set({ talking: true });
    const done = () => {
      if (tok !== speakTok) return;
      set({ talking: false });
      res();
    };
    u.onend = done;
    u.onerror = done;
    engine.speak(u);
  });
}
type Part = string | [string, SayOpt?];
async function sayAll(parts: Part[]) {
  for (const p of parts) {
    const [txt, opt = {}] = Array.isArray(p) ? p : [p, {}];
    if (opt.el) set({ reading: opt.el });
    await say(txt, opt);
    if (opt.el) set({ reading: null });
  }
}
export function stopTalk() {
  speakTok++;
  if (synth) synth.cancel();
  set({ reading: null, talking: false });
}

/* ---------- listening ---------- */
const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let rec: any = null;

export function openType() {
  set({ typeOpen: true });
}
export function toggleType() {
  set({ typeOpen: !st.typeOpen });
}
export function listen() {
  if (!SR) {
    openType();
    toast("voice input isn't available here, so type or tap instead");
    return;
  }
  stopTalk();
  try {
    rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
  } catch {
    openType();
    return;
  }
  tick("Vapi", "listening");
  set({ live: true });
  tone("listen");
  rec.onresult = (e: any) => {
    const r = e.results[e.results.length - 1];
    set({ youSaid: r[0].transcript });
    if (r.isFinal) handle(r[0].transcript);
  };
  rec.onerror = (e: any) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      openType();
      toast("microphone blocked here, so type or tap instead");
    }
  };
  rec.onend = () => set({ live: false });
  try {
    rec.start();
  } catch {
    /* already started */
  }
}
export function toggleMic() {
  if (hooks?.available()) hooks.toggle();
  else if (st.live && rec) rec.stop();
  else listen();
}

/* ---------- helpers ---------- */
export const allPosts = (s: AppState = st) => s.myPosts.concat(s.posts);
export const currentPost = (s: AppState = st) => {
  const L = allPosts(s);
  return L[s.idx % L.length];
};
const cur = () => currentPost();

export function tick(sp: string, msg: string) {
  const used = st.ticker.used.includes(sp) ? st.ticker.used : [...st.ticker.used, sp];
  set({ ticker: { sp, msg, used, pulse: st.ticker.pulse + 1 } });
}
let tt: ReturnType<typeof setTimeout>;
export function toast(m: string) {
  set({ toast: m });
  clearTimeout(tt);
  tt = setTimeout(() => set({ toast: null }), 2400);
}
function spawnBurst(left: string, top: string, ic: string) {
  const b = document.createElement("span");
  b.className = "burst";
  b.style.left = left;
  b.style.top = top;
  b.innerHTML = svg(ic);
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 950);
}
function burst(el: Element | null, ic: string) {
  if (st.settings.calm || !el) return;
  const r = el.getBoundingClientRect();
  spawnBurst(r.left + r.width / 2 + "px", r.top + "px", ic);
}
function confettiBurst() {
  if (st.settings.calm) return;
  for (let i = 0; i < 6; i++) {
    setTimeout(
      () => spawnBurst(20 + Math.random() * 60 + "%", 40 + Math.random() * 30 + "%", i % 2 ? "star" : "heart"),
      i * 90,
    );
  }
}
export const openSheet = (sheet: "about" | "settings") => set({ sheet });
export const closeSheet = () => set({ sheet: null });

/* ---------- actions ---------- */
let awaiting: "reply" | "post" | "confirm" | null = null;

export function go(r: Room, silent?: boolean) {
  set({ room: r, idx: 0, helpKey: null, task: null, liveStory: null, liveHelp: null, liveLesson: null });
  tone("next");
  if (!silent) announce();
}
function announce() {
  switch (st.room) {
    case "lobby":
      return lobbyIntro();
    case "feed":
      return playPost();
    case "news":
      return readNews();
    case "learn":
      return readLearn();
    case "help":
      return say("Help. I can find rides, free audiobooks, job training, or do a website task for you. What do you need?");
    case "circles":
      return readCircle();
  }
}
function lobbyIntro() {
  return say(
    `Welcome back. You have ${allPosts().length} posts from friends, ${NEWS.length} stories in the news, and 2 circles talking today. Where do you want to go?`,
  );
}
async function playPost() {
  const p = cur();
  tick("Deepgram", `${p.who}'s voice post, in their own voice`);
  await say(`${p.who}, ${p.ago}.`);
  await sayAll([[p.voice, { pitch: p.pitch, rate: p.rate, el: "v-body" }]]);
  if (p.scene) await say("There's a photo. Say describe it to hear what's in it.");
}
function describe() {
  const p = cur();
  if (!p.scene) return say("This post doesn't have a photo.");
  tick("Vision", "described the photo; poster can edit it");
  return sayAll([
    [p.desc || "", { el: "v-desc" }],
    ["Ask me anything about it, like what she's wearing, or what's in the background."],
  ]);
}
function askPhoto(q: string) {
  const p = cur();
  if (!p.scene || !p.qa) return false;
  const a = p.qa.find(([re]) => re.test(q));
  if (!a) return false;
  tick("Vision", "answered a follow-up about the photo");
  say(a[1]);
  return true;
}
const story = () => NEWS[st.idx % NEWS.length];
const cleanSrc = () => story().src.map((x) => x.replace(" (sample)", "")).join(" and ");
function readNews() {
  const s = story();
  tick("Exa", `found this story · ${s.src.length} sources`);
  return sayAll([[s.t, { el: "v-t" }], [s.b, { el: "v-body" }], [`Sources: ${cleanSrc()}.`]]);
}
function readLearn() {
  const s = LEARN[st.idx % LEARN.length];
  return sayAll([[`${s.t}, ${s.by}.`, { el: "v-t" }], [s.b, { el: "v-body" }]]);
}
async function readCircle() {
  const c = CIRCLES[st.idx % CIRCLES.length];
  await sayAll([[`${c.t} circle, ${c.n}.`, { el: "v-t" }]]);
  for (let i = 0; i < c.posts.length; i++) await sayAll([[c.posts[i], { el: "v-p" + i }]]);
}
export function next(d = 1) {
  const lens: Partial<Record<Room, number>> = {
    feed: allPosts().length,
    news: NEWS.length,
    learn: LEARN.length,
    circles: CIRCLES.length,
  };
  const len = lens[st.room];
  if (!len) {
    say("Nothing to skip here. Try going to the feed.");
    return;
  }
  set({ idx: (st.idx + d + len) % len });
  tone(d > 0 ? "next" : "back");
  announce();
}
export function like(el?: Element | null) {
  if (st.room !== "feed") return say("Go to the feed to like a post.");
  const p = cur();
  const liked = st.liked.includes(p.id) ? st.liked : [...st.liked, p.id];
  store.set("liked", liked);
  set({ liked });
  tone("like");
  burst(el || document.querySelector("#mic"), "heart");
  return say(`Liked ${p.who}'s post.`);
}
function reply(text: string) {
  if (st.room !== "feed") return say("Go to the feed to reply to a post.");
  const p = cur();
  if (!text) {
    awaiting = "reply";
    return say(`What do you want to say to ${p.who}?`).then(() => {
      if (SR && !st.settings.sr) listen();
    });
  }
  tick("Jev", "checked your reply: safe to send");
  p.replies = (p.replies || []).concat(["you: " + text]);
  set();
  tone("post");
  say(`Sent to ${p.who}: ${text}`);
  setTimeout(() => {
    if (st.room === "feed" && cur() === p) {
      p.replies = (p.replies || []).concat([p.who.split(" ")[0] + ": aww, thank you!"]);
      set();
      tone("like");
      say(`${p.who} replied: aww, thank you!`, { pitch: p.pitch });
    }
  }, 4500);
}
function post(text: string) {
  if (!text) {
    awaiting = "post";
    return say("Okay, say your post after the chime.").then(() => {
      if (SR && !st.settings.sr) listen();
    });
  }
  tick("Jev", "checked your post: safe to share");
  const p: Post = {
    id: "m" + Date.now(),
    who: "You",
    init: "Y",
    col: "var(--p1)",
    ago: "just now",
    pitch: 1,
    rate: 1,
    voice: text,
    scene: null,
  };
  saveMine([p, ...st.myPosts]);
  set({ room: "feed", idx: 0 });
  tone("post");
  confettiBurst();
  say("Posted to your friends. Want a captioned video of it to share on Instagram? Say make a video.");
}
function saveMine(myPosts: Post[]) {
  store.set("mine", myPosts);
  set({ myPosts });
}
function makeVideo() {
  if (st.room !== "feed") return say("Go to a post in the feed first.");
  cur().video = true;
  set();
  tick("AdaL", "made a 20-second captioned share video");
  say("Making a 20-second captioned video of this post. In the live version, AdaL makes it. It's ready to share.");
}
async function doForMe(what: string) {
  tick("Manus", "opening the website for you");
  set({
    room: "help",
    helpKey: null,
    task: [
      { t: `Understood: ${what}` },
      { t: "Opening the pharmacy website (sample)" },
      { t: "Found your refill: 1 prescription, ready Thursday" },
    ],
  });
  await say(`On it: ${what}. I'm opening the website for you.`);
  await say("I found one refill, ready Thursday. Should I place it? Say yes or no.");
  awaiting = "confirm";
}
function confirmTask(yes: boolean) {
  awaiting = null;
  if (!st.task) return;
  if (yes) {
    tick("Jev", "you confirmed, so Manus finished the task");
    set({ task: [...st.task, { t: "Refill placed (sample)", done: true }] });
    tone("post");
    say("Done. Your refill is placed. I'll remind you Thursday.");
  } else {
    set({ task: null });
    say("Okay, I didn't place it.");
  }
}
function showHelp(k: string) {
  const h = HELP.find((x) => x.k === k);
  if (!h) return;
  set({ room: "help", helpKey: k, task: null });
  tick("Exa", "found an official source");
  sayAll([[h.t, { el: "v-t" }], [h.b, { el: "v-body" }], [`Source: ${h.src.replace(/ \(.*\)/, "")}.`]]);
}
export function whereAmI() {
  const pos: Partial<Record<Room, string>> = {
    feed: `post ${(st.idx % allPosts().length) + 1} of ${allPosts().length}, from ${cur().who}`,
    news: `story ${(st.idx % NEWS.length) + 1} of ${NEWS.length}`,
    learn: `tip ${(st.idx % LEARN.length) + 1}`,
    circles: `the ${CIRCLES[st.idx % CIRCLES.length].t} circle`,
  };
  const here = pos[st.room];
  say(`You're in ${st.room}${here ? ", on " + here : ""}.`);
}
let feedRun = 0;
async function playFeed() {
  const run = ++feedRun;
  go("feed", true);
  await say(`Playing your feed. ${allPosts().length} posts. Say stop anytime.`);
  for (let i = 0; i < allPosts().length; i++) {
    if (run !== feedRun) return;
    set({ idx: i });
    await playPost();
    if (run !== feedRun) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  if (run === feedRun) say("That's everything from your friends. You're all caught up.");
}
function moreLike() {
  if (st.room !== "news") go("news", true);
  tick("Exa", "found a similar story with find-similar");
  set({ idx: (st.idx + 1) % NEWS.length });
  say("Here's a similar story.").then(readNews);
}
let callAlive = false;
export function endCall() {
  callAlive = false;
  set({ call: null });
  stopTalk();
}
async function callGrandma() {
  callAlive = true;
  const show = (status: string, text = "") => set({ call: { status, text } });
  tick("Vapi", "calling Grandma Rosa's phone");
  show("ringing her landline…");
  await new Promise((r) => setTimeout(r, 1800));
  if (!callAlive) return;
  show("connected");
  await say("Hi Rosa, it's Coo from The Coop. Alex just posted a photo for you from San Francisco.");
  if (!callAlive) return;
  show("coo is describing the photo", "Alex is on a stage, grinning, wearing a black hoodie, with a crowd behind him.");
  await say("He's on a stage, grinning, in a black hoodie, with a crowd behind him. Do you want to say something back?");
  if (!callAlive) return;
  show("rosa replies", "“Tell him I'm proud of him.”");
  await say("Tell him I'm proud of him.", { pitch: 0.8, rate: 0.9 });
  if (!callAlive) return;
  tick("Deepgram", "transcribed Rosa's reply");
  saveMine([
    {
      id: "g" + Date.now(),
      who: "Grandma Rosa",
      init: "R",
      col: "var(--k1)",
      ago: "just now",
      pitch: 0.8,
      rate: 0.9,
      voice: "Tell him I'm proud of him.",
      scene: null,
    },
    ...st.myPosts,
  ]);
  show("posted to the feed", "Rosa's reply is now in Alex's feed.");
  await say("Got it. I posted your message for Alex. Bye, Rosa!");
  setTimeout(() => {
    set({ call: null });
    go("feed", true);
    tone("post");
    say("New voice reply from Grandma Rosa: Tell him I'm proud of him.", { pitch: 0.8 });
  }, 900);
}
export function helpCmds() {
  say("You can say: go to feed, news, learn, help, or circles. Next. Back. Play it. Describe the photo. Like it. Reply. Post something. Faster or slower. Where am I. Or stop.");
}

/* ---------- understanding what was said ---------- */
export function handle(raw: string) {
  const q = raw.toLowerCase().trim().replace(/[.!?]+$/, "");
  set({ youSaid: raw });
  if (!q) return;
  if (hooks?.active()) return hooks.send(raw);
  if (awaiting === "reply") {
    awaiting = null;
    return reply(raw);
  }
  if (awaiting === "post") {
    awaiting = null;
    return post(raw);
  }
  if (awaiting === "confirm") {
    if (/^(yes|yeah|yep|sure|do it|confirm|place it)/.test(q)) return confirmTask(true);
    if (/^(no|nope|cancel|don't)/.test(q)) return confirmTask(false);
  }
  let m: RegExpMatchArray | null;
  const room = st.room;
  if (/^(stop|quiet|shush|pause)/.test(q)) {
    feedRun++;
    return stopTalk();
  }
  if (/play (my )?feed|play everything|read my feed/.test(q)) return playFeed();
  if (/more like (this|that)|similar/.test(q)) return moreLike();
  if (/grandma|call (rosa|her)|send (it|this|a photo) to/.test(q)) return callGrandma();
  if (/faster|speed up/.test(q)) {
    const rate = Math.min(2.2, +(st.settings.rate + 0.25).toFixed(2));
    updateSettings({ rate });
    return say(`Faster. Speed ${rate}.`);
  }
  if (/slower|slow down/.test(q)) {
    const rate = Math.max(0.6, +(st.settings.rate - 0.25).toFixed(2));
    updateSettings({ rate });
    return say(`Slower. Speed ${rate}.`);
  }
  if (/where am i/.test(q)) return whereAmI();
  if (/^(help|what can i say|commands)/.test(q) && room !== "help") return helpCmds();
  if (
    (m = q.match(/(?:go to|open|take me to|show me)\s+(?:the\s+)?(lobby|home|feed|news|learn|learning|help|circles?|groups?)/)) ||
    (m = q.match(/^(lobby|home|feed|news|learn|circles)$/))
  ) {
    const alias: Record<string, Room> = { home: "lobby", learning: "learn", circle: "circles", group: "circles", groups: "circles" };
    return go(alias[m[1]] || (m[1] as Room));
  }
  if (/what'?s new|catch me up|anything new/.test(q)) return go("feed");
  if (
    (m = q.match(/^(?:do it for me|can you)[:,]?\s*(.+)/)) ||
    (m = q.match(/(refill (?:my )?prescription|pay (?:my )?bill|check (?:my )?bill|order groceries)/))
  )
    return doForMe(m[1]);
  if (/^(next|skip|keep going|swipe|scroll( down| up)?)/.test(q)) return next(1);
  if (/^(back|previous|go back|last one)/.test(q)) return next(-1);
  if (/^(play|read|repeat|again|play it|read it)/.test(q)) return announce();
  if (/describe|what'?s in (the )?(photo|picture)|what does it look like/.test(q)) {
    if (room !== "feed") go("feed", true);
    return describe();
  }
  if (/^(like|love|heart)/.test(q)) return like();
  if ((m = q.match(/^(?:reply|say|tell (?:her|him|them))[:,]?\s*(.*)/)))
    return reply(m[1] ? raw.slice(raw.toLowerCase().indexOf(m[1])).trim() : "");
  if ((m = q.match(/^(?:post|share)[:,]?\s*(.*)/))) {
    const t = m[1].replace(/^something\s*/, "");
    return post(t ? raw.trim().replace(/[.!?]+$/, "").slice(-t.length) : "");
  }
  if (/make (a )?video/.test(q)) return makeVideo();
  if (/simpler|explain/.test(q) && room === "news") return say("In short: " + story().b.split(". ")[0] + ".");
  if (/source/.test(q) && room === "news")
    return say(`This story comes from ${cleanSrc()}. In the live version, every source is a real link.`);
  if (/ride|paratransit|transport|bus/.test(q)) return showHelp("rides");
  if (/audiobook|talking book|book/.test(q)) return showHelp("books");
  if (/job|work|training/.test(q)) return showHelp("jobs");
  if (/block|held|scam/.test(q)) {
    tick("Jev", "held a scam post in Circles");
    if (room !== "circles") go("circles", true);
    return say(`I held one post from an ${HELD.from}. It said: win a free phone, send a gift card. It ${HELD.why}, so nobody heard it.`);
  }
  if (room === "feed" && askPhoto(q)) return;
  tone("err");
  say(`I heard “${raw}”. Try saying next, describe it, like it, or go to news. Say help for the full list.`);
}
