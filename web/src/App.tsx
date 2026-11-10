import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { CIRCLES, CMDS, HELD, HELP, LEARN, NEWS, ROOMS, type Room } from "./data";
import { coo, D, SCENES } from "./doodles";
import {
  allPosts,
  closeSheet,
  currentPost,
  endCall,
  getState,
  go,
  handle,
  helpCmds,
  isLive,
  like,
  next,
  openSheet,
  playIndex,
  say,
  setEveryone,
  stopAll,
  subscribe,
  toggleMic,
  toggleType,
  updateSettings,
  whereAmI,
  type AppState,
} from "./engine";
import { toggleRecord } from "./live";

const SPONSORS = ["Vapi", "Deepgram", "Exa", "Jev", "Manus", "AdaL"];
const RECORD = "record a post";

function Ic({ n }: { n: string }) {
  return <svg className="ic" viewBox="0 0 48 48" aria-hidden="true" dangerouslySetInnerHTML={{ __html: D[n] }} />;
}
/* Static markup from doodles.ts only, never user text. */
function Raw({ html }: { html: string }) {
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* The real photo if we have one, otherwise the prototype's drawing. */
function Photo({ id, scene, alt }: { id: string; scene: string; alt: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return <Raw html={SCENES[scene] || ""} />;
  return <img src={`/photos/${id}.jpg`} alt={alt} onError={() => setMissing(true)} />;
}

const helpSay = (k: string) => (k === "books" ? "free audiobooks" : k === "jobs" ? "job training" : "rides");

/* The whole feed, one card per post. The card being played is marked, and saying "next" scrolls to the next one. */
function FeedList({ s }: { s: AppState }) {
  const L = allPosts(s);
  const cur = s.idx % L.length;
  const curRef = useRef<HTMLElement>(null);
  useEffect(() => {
    curRef.current?.scrollIntoView({ block: "start", behavior: getState().settings.calm ? "auto" : "smooth" });
  }, [cur, L.length]);
  return (
    <div className="feedlist">
      {L.map((p, i) => {
        const on = i === cur;
        const isLiked = s.liked.includes(p.id);
        const rd = (base: string, id: string) => (on ? { id, className: base + (s.reading === id ? " reading" : "") } : { className: base });
        return (
          <article key={p.id} ref={on ? curRef : undefined} className={"np " + (on ? "cur" : "other")} aria-current={on ? "true" : undefined}>
            {on && <span className="tape" />}
            <div className="room"><Ic n="feed" />{on ? "now playing" : `post ${i + 1}`}<span className="pos">{i + 1} of {L.length}</span></div>
            <div className="who">
              <span className="av" style={{ background: p.col }}>{p.init}</span>
              <div><b>{p.who}</b><small>audio journey · {p.ago}</small></div>
            </div>
            <p {...rd("body", "v-body")}>“{p.voice}”</p>
            {p.scene && (
              <>
                <div className="scene"><Photo id={p.id} scene={p.scene} alt={p.desc || ""} /><span className="tag">photo they shared · say “describe it”</span></div>
                <p {...rd("desc", "v-desc")}><b>what's in the photo</b>{p.desc}</p>
              </>
            )}
            {p.video && !s.videos[p.id] && <p className="desc"><b>share video</b>A 20-second captioned video of this post is ready to share (sample).</p>}
            {s.videos[p.id] && <p className="desc"><b>share video (sample)</b><a href={s.videos[p.id]} download={`thecoop-${p.id}.webm`}>Download the captioned clip</a></p>}
            <div className="meta">
              <span className={"pill" + (isLiked ? " on" : "")}><Ic n="heart" />{isLiked ? "you liked this" : "like"}</span>
              {(p.replies || []).map((r, ri) => <span className="pill" key={ri}>{r}</span>)}
            </div>
            {!on && <button className="chip" aria-label={`Play ${p.who}'s post`} onClick={() => playIndex(i)}>play this post</button>}
          </article>
        );
      })}
    </div>
  );
}

function NowPlaying({ s }: { s: AppState }) {
  const rd = (base: string, id: string) => ({ id, className: base + (s.reading === id ? " reading" : "") });
  const { room, idx } = s;
  let body = null;

  if (room === "lobby") {
    body = (
      <>
        <div className="room"><Ic n="lobby" />lobby</div>
        <div className="welcome">
          <Raw html={coo()} />
          <h1>the coop</h1>
          <p>Social media you can hear. Tap the mic and say “what's new?”</p>
        </div>
        <ul className="list">
          <li><Ic n="feed" /><div>{allPosts(s).length} audio journeys from friends<small>say “go to feed”</small></div></li>
          <li><Ic n="news" /><div>{NEWS.length} stories in the news<small>say “go to news”</small></div></li>
          <li><Ic n="circles" /><div>{(s.circles || CIRCLES).length} circles talking today<small>say “go to circles”</small></div></li>
          <li><Ic n="mic" /><div>Everyone mode: hands-free<small>say “play my feed” and cook, walk or rest your eyes</small></div></li>
        </ul>
        <button className="btn" aria-pressed={s.settings.everyone} onClick={() => setEveryone(!s.settings.everyone)}>
          Everyone mode: {s.settings.everyone ? "on" : "off"}
        </button>
        <p className="note" style={{ textAlign: "center" }}>Or call The Coop from any phone: {s.phoneNumber || "(555) 010-COOP (sample)"}</p>
      </>
    );
  }
  if (room === "feed") return <FeedList s={s} />;
  if (room === "news" && s.liveStory) {
    const { story: n, pos, total, sample } = s.liveStory;
    body = (
      <>
        <div className="room"><Ic n="news" />news<span className="pos">{pos} of {total}</span></div>
        <h2 {...rd("", "v-t")}>{n.title}</h2>
        <p {...rd("body", "v-body")}>{n.text}</p>
        <div className="meta">
          via {n.url ? <a className="pill" href={n.url} target="_blank" rel="noreferrer">{n.outlet}</a> : <span className="pill">{n.outlet}</span>}
          {n.date && <span>{n.date}</span>}
          {sample && <span className="pill">sample</span>}
        </div>
      </>
    );
  } else if (room === "news") {
    const n = NEWS[idx % NEWS.length];
    body = (
      <>
        <div className="room"><Ic n="news" />news<span className="pos">{(idx % NEWS.length) + 1} of {NEWS.length}</span></div>
        <h2 {...rd("", "v-t")}>{n.t}</h2>
        <p {...rd("body", "v-body")}>{n.b}</p>
        <div className="meta">via {n.src.map((x) => <span className="pill" key={x}>{x}</span>)}</div>
      </>
    );
  }
  if (room === "learn" && s.liveLesson) {
    const l = s.liveLesson;
    body = (
      <>
        <div className="room"><Ic n="learn" />learn</div>
        <h2 {...rd("", "v-t")}>{l.t}</h2>
        <div className="meta">{l.url ? <a className="pill" href={l.url} target="_blank" rel="noreferrer">{l.by}</a> : l.by}</div>
        <p {...rd("body", "v-body")}>{l.b}</p>
      </>
    );
  } else if (room === "learn") {
    const l = LEARN[idx % LEARN.length];
    body = (
      <>
        <div className="room"><Ic n="learn" />learn<span className="pos">{(idx % LEARN.length) + 1} of {LEARN.length}</span></div>
        <h2 {...rd("", "v-t")}>{l.t}</h2>
        <div className="meta">community tip {l.by}</div>
        <p {...rd("body", "v-body")}>{l.b}</p>
      </>
    );
  }
  if (room === "help") {
    const h = HELP.find((x) => x.k === s.helpKey);
    body = (
      <>
        <div className="room"><Ic n="help" />help</div>
        {s.liveHelp ? (
          <>
            <h2 {...rd("", "v-t")}>{s.liveHelp.t}</h2>
            <p {...rd("body", "v-body")}>{s.liveHelp.b}</p>
            <div className="meta">source {s.liveHelp.url ? <a className="pill" href={s.liveHelp.url} target="_blank" rel="noreferrer">{s.liveHelp.src}</a> : <span className="pill">{s.liveHelp.src}</span>}</div>
          </>
        ) : h ? (
          <>
            <h2 {...rd("", "v-t")}>{h.t}</h2>
            <p {...rd("body", "v-body")}>{h.b}</p>
            <div className="meta">source <span className="pill">{h.src}</span></div>
          </>
        ) : s.task ? (
          <>
            <h2>doing it for you</h2>
            <ul className="list">
              {s.task.map((t, i) => <li key={i}><Ic n={t.done ? "shield" : "bot"} /><div>{t.t}</div></li>)}
            </ul>
          </>
        ) : (
          <>
            <h2>what do you need help with?</h2>
            <ul className="list">
              {HELP.map((x) => <li key={x.k}><Ic n={x.ic} /><div>{x.t}<small>say “{helpSay(x.k)}”</small></div></li>)}
              <li><Ic n="bot" /><div>Do it for me<small>say “do it for me: refill my prescription”</small></div></li>
            </ul>
          </>
        )}
      </>
    );
  }
  if (room === "circles") {
    const list = s.circles || CIRCLES;
    const c = list[idx % list.length];
    const heldWhy = s.held.length ? s.held.map((h) => h.why).join("; ") : `it ${HELD.why}`;
    const heldBy = s.held.length ? s.held.every((h) => h.by === "Jev") ? "" : " (sample check)" : " (sample)";
    body = (
      <>
        <div className="room"><Ic n="circles" />circles<span className="pos">{(idx % list.length) + 1} of {list.length}</span></div>
        <h2 {...rd("", "v-t")}>{c.t}</h2>
        <div className="meta">{c.n} · safe space</div>
        <ul className="list">
          {c.posts.map((p, i) => <li key={i} {...rd("", "v-p" + i)}><Ic n="circles" /><div>{p}</div></li>)}
        </ul>
        <p className="desc"><b>held by coo</b>{s.held.length || 1} post{s.held.length > 1 ? "s" : ""} held before anyone heard: {heldWhy}.{heldBy}</p>
      </>
    );
  }
  return (
    <article className="np" id="np" aria-live="off" key={`${room}:${idx}:${s.helpKey}`}>
      <span className="tape" />
      {body}
    </article>
  );
}

function About() {
  return (
    <>
      <h3>why voice?</h3>
      <p className="note">The Coop is social media you can hear. Here's why voice comes first.</p>
      <div className="why">
        <div><b>photos finally talk</b><p>Most photos posted online have no description, so screen reader users just hear “image.” Here every photo is described, and you can ask follow-up questions.</p></div>
        <div><b>no endless scrolling by ear</b><p>Swiping through a visual feed with a screen reader is slow and tiring. Here you say “next,” “like it,” “reply,” and you're done in two minutes.</p></div>
        <div><b>works on any phone</b><p>The live version has a phone number too, so people without a smartphone, or who find apps hard, can just call in.</p></div>
        <div><b>made for people who lost their sight later in life</b><p>Many older adults never learned a screen reader. Talking is something everyone already knows how to do.</p></div>
        <div><b>a safe room</b><p>Circles are small support groups. Coo holds scams and harassment before anyone hears them.</p></div>
        <div><b>sighted friends can join</b><p>This screen shows big captions of everything, and any post can become a captioned video for Instagram.</p></div>
      </div>
      <p className="note">Built to work alongside screen readers like VoiceOver and TalkBack, not to replace them. The real version would be designed and tested with blind and low-vision users.</p>
      <span className="lbl" style={{ fontFamily: "var(--head)", fontSize: 24 }}>keyboard</span>
      <div className="kbd">
        <kbd>Space</kbd><span>talk to Coo</span>
        <kbd>→ / ←</kbd><span>next / back</span>
        <kbd>D</kbd><span>describe the photo</span>
        <kbd>L</kbd><span>like</span>
        <kbd>R</kbd><span>reply</span>
        <kbd>W</kbd><span>where am I</span>
        <kbd>H</kbd><span>what can I say</span>
        <kbd>Esc</kbd><span>stop</span>
      </div>
    </>
  );
}

function SettingsPanel({ s }: { s: AppState }) {
  const S = s.settings;
  return (
    <>
      <h3>settings</h3>
      <div className="set">
        <label>High contrast<small>Yellow and white on black</small>
          <input type="checkbox" checked={S.hc} onChange={(e) => updateSettings({ hc: e.target.checked })} />
        </label>
        <div className="r">
          <span>Text size<small>{Math.round(S.fs * 100)}%</small></span>
          <input type="range" min="1" max="1.6" step="0.1" value={S.fs} aria-label="Text size" onChange={(e) => updateSettings({ fs: +e.target.value })} />
        </div>
        <div className="r">
          <span>Coo's speed<small>{S.rate}×</small></span>
          <input type="range" min="0.6" max="2.2" step="0.1" value={S.rate} aria-label="Coo's speaking speed" onChange={(e) => updateSettings({ rate: +e.target.value })} />
        </div>
        <div className="r">
          <span>Voice<small>From your device</small></span>
          <select aria-label="Voice" value={S.voice} onChange={(e) => updateSettings({ voice: e.target.value })}>
            <option value="">Default</option>
            {s.voices.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
        <label>Expert mode<small>Shorter, faster replies</small>
          <input type="checkbox" checked={S.expert} onChange={(e) => updateSettings({ expert: e.target.checked })} />
        </label>
        <label>Use my screen reader<small>Coo stays quiet and your screen reader reads the captions</small>
          <input type="checkbox" checked={S.sr} onChange={(e) => updateSettings({ sr: e.target.checked })} />
        </label>
        <label>Calm mode<small>No animations</small>
          <input type="checkbox" checked={S.calm} onChange={(e) => updateSettings({ calm: e.target.checked })} />
        </label>
        <label>Everyone mode<small>Hands-free: plays your whole feed like a podcast</small>
          <input type="checkbox" checked={S.everyone} onChange={(e) => updateSettings({ everyone: e.target.checked })} />
        </label>
      </div>
      <p className="note">Prototype: posts, news and help answers are samples. The live version runs on Vapi, Deepgram and Exa with real sources.</p>
    </>
  );
}

export default function App() {
  const s = useSyncExternalStore(subscribe, getState);
  const sheetRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (s.sheet) {
      const t = setTimeout(() => sheetRef.current?.focus({ preventScroll: true }), 50);
      return () => clearTimeout(t);
    }
  }, [s.sheet]);

  useEffect(() => {
    if (s.typeOpen) typeRef.current?.focus();
  }, [s.typeOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t.closest?.("input,select,textarea")) return;
      if (getState().sheet) {
        if (e.key === "Escape") closeSheet();
        return;
      }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === " ") {
        // A keyboard user activating a focused button should get that button, not the mic.
        if (t.closest?.("button") && t.matches(":focus-visible")) return;
        e.preventDefault();
        toggleMic();
      } else if (k === "ArrowRight" || k === "j") isLive() ? handle("next") : next(1);
      else if (k === "ArrowLeft" || k === "k") isLive() ? handle("back") : next(-1);
      else if (k === "d") handle("describe it");
      else if (k === "l") isLive() ? handle("like it") : like();
      else if (k === "r") handle("reply");
      else if (k === "w") isLive() ? handle("where am I") : whereAmI();
      else if (k === "h") isLive() ? handle("help") : helpCmds();
      else if (k === "Escape") stopAll();
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.(".coo")) say("Coo! I'm here. Tap the mic and talk to me.");
    };
    let raf = 0;
    let last: PointerEvent;
    const onMove = (e: PointerEvent) => {
      last = e;
      if (raf || getState().settings.calm) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = document.documentElement.style;
        r.setProperty("--ex", ((last.clientX / innerWidth) * 2 - 1).toFixed(2));
        r.setProperty("--ey", ((last.clientY / innerHeight) * 2 - 1).toFixed(2));
      });
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    document.addEventListener("pointermove", onMove);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);

  const submitTyped = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = typeRef.current;
    if (!input) return;
    const v = input.value;
    input.value = "";
    handle(v);
  };

  const onCmd = (c: string, el: HTMLElement) => {
    if (c === RECORD) return void toggleRecord();
    return c === "like it" && !isLive() ? like(el) : handle(c);
  };
  const chips = s.room === "feed" ? [...CMDS.feed, RECORD] : CMDS[s.room];
  // In the feed the chips sit above the list, so they don't end up below every post.
  const chipRow = (
    <div className="cmds" aria-label="Things you can say">
      {chips.map((c) => (
        <button className="cmd" key={c} aria-pressed={c === RECORD ? s.recording : undefined} onClick={(e) => onCmd(c, e.currentTarget)}>
          {c === RECORD && s.recording ? "stop recording" : c}
        </button>
      ))}
    </div>
  );
  const onRoom = (k: Room) => (isLive() ? handle(`go to ${k}`) : go(k));

  return (
    <>
      <div id="app">
        <header className="hdr">
          <span className="logo" id="logo"><Raw html={coo(s.talking ? "talk" : "")} />the coop</span>
          <button className="chip" aria-label="Why voice? About The Coop" onClick={() => openSheet("about")}><Ic n="info" />why voice</button>
          <button className="chip" aria-label="Settings" onClick={() => openSheet("settings")}><Ic n="gear" /></button>
        </header>
        <div className={"ticker" + (s.ticker.pulse ? " flash" : "")} key={s.ticker.pulse} aria-live="off">
          <span className="sp">{s.ticker.sp}</span>
          <span className="msg">{s.ticker.msg}</span>
          <span className="dots" aria-hidden="true">
            {SPONSORS.map((x) => <i key={x} className={s.ticker.used.includes(x) ? "on" : ""} />)}
          </span>
        </div>
        <main id="main" aria-label="Now playing">
          {s.room === "feed" && chipRow}
          <NowPlaying s={s} />
          {s.room !== "feed" && chipRow}
          <section className="cap" aria-label="Live captions">
            <div className="row"><span className="lab">coo:</span><span className="coo-says" aria-live="polite">{s.cooSays}</span></div>
            <div className="row"><span className="lab">you:</span><span className="you-said">{s.youSaid}</span></div>
          </section>
        </main>
        <div className="dock">
          <div className="microw">
            <button className="side" aria-label="Stop talking (Escape)" onClick={stopAll}><Ic n="stop" /></button>
            <div style={{ display: "grid", justifyItems: "center", gap: 6 }}>
              <button
                className={"mic" + (s.live ? " live" : "") + (s.talking ? " talking" : "")}
                id="mic"
                aria-label="Talk to Coo (space bar)"
                onClick={toggleMic}
              >
                <Ic n="mic" />
              </button>
              <div className="miclab">{s.live ? "listening…" : "tap or press space, then talk"}</div>
            </div>
            <button className="side" aria-label="Type a command instead" onClick={toggleType}><Ic n="keys" /></button>
          </div>
          <form className="typebox" hidden={!s.typeOpen} onSubmit={submitTyped}>
            <input ref={typeRef} aria-label="Type what you'd say" placeholder="Type what you'd say, like “next”" autoComplete="off" />
            <button>send</button>
          </form>
          <nav className="rooms" aria-label="Rooms">
            {ROOMS.map(([k, l]) => (
              <button key={k} aria-current={s.room === k ? "page" : undefined} onClick={() => onRoom(k)}><Ic n={k} />{l}</button>
            ))}
          </nav>
        </div>
      </div>
      <div className={"scrim" + (s.sheet ? " on" : "")} onClick={closeSheet} />
      <div className={"sheet" + (s.sheet ? " on" : "")} ref={sheetRef} role="dialog" aria-modal="true" aria-label={s.sheet === "about" ? "Why voice" : "Settings"} tabIndex={-1}>
        <button className="chip x" aria-label="Close" onClick={closeSheet}>✕</button>
        {s.sheet === "about" && <About />}
        {s.sheet === "settings" && <SettingsPanel s={s} />}
      </div>
      <div className={"toast" + (s.toast ? " show" : "")} role="status">{s.toast}</div>
      {s.call && (
        <div className="call" role="dialog" aria-label="Outgoing call">
          <div className="ph">R</div>
          <h3>calling grandma rosa</h3>
          <p className="st">{s.call.status}{s.call.sample ? " · sample" : ""}</p>
          <p>{s.call.text}</p>
          <button className="btn" onClick={endCall}>end call</button>
        </div>
      )}
    </>
  );
}
