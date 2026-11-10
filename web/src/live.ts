/* The live voice layer: Vapi for the conversation, server events for what's on screen.
   If Vapi isn't configured or can't connect, the local engine in engine.ts takes over. */
import Vapi from "@vapi-ai/web";
import {
  applyServerState,
  getState,
  go,
  listen,
  patch,
  setLiveHooks,
  showDescription,
  showPost,
  tick,
  toast,
  tone,
  updateSettings,
} from "./engine";
import { makeVideo } from "./video";

interface Clip {
  id: string;
  who: string;
  url: string;
  text: string;
  has_photo: boolean;
  autoplay?: boolean;
  last?: boolean;
}

// The SDK is CommonJS, so in the browser bundle the class can sit on .default.
const VapiClient: typeof Vapi = (Vapi as any).default ?? Vapi;

let vapi: Vapi | null = null;
let connected = false;
let connecting = false;
let assistantId = "";
let publicKey = "";
let coSpeaking = false;
let pending: Clip | null = null;
let waitTimer: ReturnType<typeof setTimeout> | undefined;
let audio: HTMLAudioElement | null = null;
let usingBackup = false;
let introHeard = false;

const addMessage = (role: "user" | "system", content: string, trigger = true) =>
  vapi?.send({ type: "add-message", message: { role, content }, triggerResponseEnabled: trigger } as any);

function fallBack(why: string) {
  usingBackup = true;
  connecting = false;
  connected = false;
  vapi = null;
  patch({ cooSays: "Hi, I'm Coo. I'm using my backup voice right now." });
  toast(why);
  listen();
}

function muteCoo(on: boolean) {
  // In "use my screen reader" mode Coo stays muted for the whole call.
  if (!on && getState().settings.sr) return;
  vapi?.send({ type: "control", control: on ? "mute-assistant" : "unmute-assistant" } as any);
}

/* While a clip plays the mic is off, so this listens just for the words that interrupt it. */
const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let clipListener: any = null;

function stopClipListener() {
  if (!clipListener) return;
  clipListener.onend = null;
  clipListener.onresult = null;
  try {
    clipListener.abort();
  } catch {
    /* already stopped */
  }
  clipListener = null;
}

function startClipListener(clipText: string) {
  if (!SpeechRec) return;
  const words = clipText.toLowerCase();
  const r = new SpeechRec();
  r.continuous = true;
  r.interimResults = true;
  r.lang = "en-US";
  r.onresult = (e: any) => {
    const heard = e.results[e.results.length - 1][0].transcript.toLowerCase();
    // Ignore a word the friend is saying in the clip itself.
    const m = heard.match(/\b(next|skip|stop|back|previous|pause)\b/);
    if (!m || words.includes(m[1])) return;
    const said = m[1] === "skip" ? "next" : m[1] === "pause" ? "stop" : m[1];
    stopClip();
    patch({ youSaid: said });
    if (said !== "stop") addMessage("user", said);
  };
  r.onend = () => {
    if (audio && clipListener === r) {
      try {
        r.start();
      } catch {
        /* already running */
      }
    }
  };
  clipListener = r;
  try {
    r.start();
  } catch {
    clipListener = null;
  }
}

function finishClip(clip: Clip | null) {
  audio = null;
  stopClipListener();
  patch({ reading: null });
  vapi?.setMuted(false);
  muteCoo(false);
  if (!clip || !connected) return;
  if (clip.autoplay) {
    if (clip.last) setTimeout(() => vapi?.say("That's everything from your friends. You're all caught up."), 250);
    else addMessage("user", "next");
  } else if (clip.has_photo) {
    setTimeout(() => vapi?.say("There's a photo. Say describe it to hear what's in it."), 250);
  }
}

function playPending() {
  clearTimeout(waitTimer);
  const clip = pending;
  pending = null;
  if (!clip || !vapi) return;
  // Only one voice at a time: Coo goes silent, and the mic is off so the friend isn't heard as the user.
  muteCoo(true);
  vapi.setMuted(true);
  startClipListener(clip.text);
  patch({ reading: "v-body" });
  tick("Deepgram", "playing this post in the friend's own voice");
  const a = new Audio(clip.url);
  a.playbackRate = getState().settings.rate;
  audio = a;
  a.onended = () => finishClip(clip);
  a.onerror = () => {
    finishClip(null);
    vapi?.say(clip.text);
  };
  a.play().catch(() => a.onerror?.(new Event("error")));
}

function queueClip(clip: Clip) {
  stopClip();
  pending = clip;
  introHeard = false;
  clearTimeout(waitTimer);
  // The clip waits until Coo has said the friend's name. This covers Coo never saying it.
  waitTimer = setTimeout(() => {
    introHeard = true;
    if (!coSpeaking) playPending();
  }, 6000);
}

function stopClip() {
  pending = null;
  clearTimeout(waitTimer);
  if (!audio) return false;
  audio.onended = null;
  audio.onerror = null;
  audio.pause();
  finishClip(null);
  return true;
}

function resetCall() {
  connected = false;
  connecting = false;
  coSpeaking = false;
  stopClip();
  patch({ live: false, talking: false });
}

function start() {
  if (connecting) return;
  connecting = true;
  patch({ cooSays: "Connecting to Coo…" });
  const { rate } = getState().settings;
  const speed = Math.min(1.5, Math.max(0.5, rate));
  const overrides = rate === 1 ? undefined : { voice: { provider: "deepgram", model: "aura-2", voiceId: "helena", speed } };
  try {
    const v = (vapi = vapi || wire(new VapiClient(publicKey)));
    v.start(assistantId, overrides as any).catch(() => fallBack("couldn't reach Coo, so using the backup voice"));
  } catch {
    fallBack("couldn't reach Coo, so using the backup voice");
  }
}

function wire(v: Vapi) {
  v.on("call-start", () => {
    connecting = false;
    connected = true;
    patch({ live: true });
    tone("listen");
    tick("Vapi", "connected. Coo is listening");
    const S = getState().settings;
    if (S.expert) addMessage("system", "Expert mode is on. Keep every reply very short.", false);
    // "Use my screen reader": Coo goes quiet and the captions region does the talking.
    if (S.sr) v.send({ type: "control", control: "mute-assistant" } as any);
    if (S.everyone) addMessage("user", "play my feed");
  });
  v.on("call-end", resetCall);
  v.on("speech-start", () => {
    coSpeaking = true;
    patch({ talking: true });
  });
  v.on("speech-end", () => {
    coSpeaking = false;
    patch({ talking: false, reading: null });
    // The SDK fires this after one second of quiet, so it can also mean Coo only paused.
    if (pending && introHeard) {
      clearTimeout(waitTimer);
      setTimeout(playPending, 200);
    }
  });
  v.on("message", (m: any) => {
    if (m?.type !== "transcript" || !m.transcript) return;
    if (m.role === "assistant") {
      patch({ cooSays: m.transcript });
      if (pending && m.transcript.toLowerCase().includes(pending.who.split(" ")[0].toLowerCase())) {
        introHeard = true;
        if (!coSpeaking) setTimeout(playPending, 300);
      }
    }
    if (m.role === "user") patch({ youSaid: m.transcript });
  });
  v.on("error", () => {
    if (!connected) fallBack("couldn't reach Coo, so using the backup voice");
  });
  return v;
}

/* ---------- voice posts from the web app ---------- */
let recorder: MediaRecorder | null = null;

export async function toggleRecord() {
  if (recorder) {
    recorder.stop();
    return;
  }
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    toast("microphone blocked, so type your post instead");
    return;
  }
  vapi?.setMuted(true);
  const chunks: Blob[] = [];
  const rec = new MediaRecorder(stream);
  recorder = rec;
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = async () => {
    recorder = null;
    patch({ recording: false });
    stream.getTracks().forEach((t) => t.stop());
    vapi?.setMuted(false);
    const type = (rec.mimeType || "audio/webm").split(";")[0];
    try {
      const r = await fetch("/api/voice-post", { method: "POST", headers: { "Content-Type": type }, body: new Blob(chunks, { type }) });
      const out = await r.json();
      if (out.status === "posted") toast("posted, with a transcript");
      else if (out.status === "held") toast(`held by Coo: ${out.why}`);
      else toast("I didn't catch that, try again");
    } catch {
      toast("couldn't post that, try again");
    }
  };
  rec.start();
  patch({ recording: true });
  tone("listen");
}

/* ---------- events from the server ---------- */
function onServerEvent(ev: any) {
  switch (ev.type) {
    case "tick":
      return tick(ev.sp, ev.msg);
    case "state":
      return applyServerState(ev.state);
    case "show_post":
      return showPost(ev.id);
    case "show_description":
      return showDescription(ev.id, ev.text);
    case "play_clip":
      if (connected) queueClip(ev as Clip);
      return;
    case "earcon":
      return tone(ev.kind);
    case "room":
      return patch({ room: ev.room, idx: ev.idx || 0, helpKey: null, liveStory: null, liveHelp: null, liveLesson: null });
    case "show_story":
      return patch({ room: "news", idx: 0, liveStory: { story: ev.story, pos: ev.pos, total: ev.total, sample: ev.sample } });
    case "show_help":
      return patch({ room: "help", helpKey: null, task: null, liveHelp: ev.item });
    case "show_lesson":
      return patch({ room: "learn", idx: 0, liveLesson: ev.item });
    case "task":
      return patch({ room: "help", helpKey: null, liveHelp: null, task: ev.steps });
    case "coo_system":
      if (connected) addMessage("system", ev.text);
      return;
    case "speed": {
      const { rate } = getState().settings;
      const next = Math.min(2.2, Math.max(0.6, +(rate + (ev.direction === "faster" ? 0.25 : -0.25)).toFixed(2)));
      updateSettings({ rate: next });
      if (audio) audio.playbackRate = next;
      return;
    }
    case "make_video":
      void makeVideo(ev);
      return;
    case "call":
      patch({ call: { status: ev.status, text: ev.text || getState().call?.text || "", sample: ev.sample } });
      if (ev.done) {
        setTimeout(() => {
          patch({ call: null });
          go("feed", true);
        }, 1500);
      }
      return;
  }
}

/* Reconnects after a server restart, so the screen never silently stops updating. */
function connectEvents() {
  const es = new EventSource("/api/events");
  es.onmessage = (e) => onServerEvent(JSON.parse(e.data));
  es.onerror = () => {
    if (es.readyState !== EventSource.CLOSED) return;
    setTimeout(async () => {
      connectEvents();
      applyServerState(await (await fetch("/api/state")).json());
    }, 1500);
  };
}

export async function initLive() {
  connectEvents();
  try {
    applyServerState(await (await fetch("/api/state")).json());
    const cfg = await (await fetch("/api/config")).json();
    if (cfg.phoneNumber) patch({ phoneNumber: cfg.phoneNumber });
    if (!cfg.publicKey || !cfg.assistantId) return;
    publicKey = cfg.publicKey;
    assistantId = cfg.assistantId;
  } catch {
    return; // server down: the local engine still works
  }
  setLiveHooks({
    available: () => !usingBackup,
    active: () => connected,
    toggle() {
      if (connected) {
        if (!stopClip()) vapi?.stop();
      } else start();
    },
    send(text) {
      stopClip();
      patch({ youSaid: text });
      addMessage("user", text);
    },
    stop() {
      if (!stopClip()) addMessage("user", "stop");
    },
  });
}
