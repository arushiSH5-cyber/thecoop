# The Coop — Claude Code build prompt (all sponsors)

Paste everything below the line into Claude Code. Run it from the unzipped `thecoop/` folder (it contains `thecoop.html`).

---

We're at a voice agent hackathon at Vapi HQ tonight with about 90 minutes of build time. Sponsors: **Vapi, Deepgram, Exa, TypeSafe (Jev), Manus, AdaL**. We're building **The Coop: social media you can hear.** It's built first for blind, low-vision and older people, and it's great for everyone who wants their social feed hands-free: while cooking, walking, driving, or with tired eyes.

Speed beats polish. Work in small steps, run the app after each one, and tell me what to test. Never let the demo break: every sponsor call has a fallback.

## 0. Read first, then plan
- `thecoop.html` is the working prototype. Match its look (Gaegu + Atkinson Hyperlegible fonts, sky-to-peach background, Coo the pigeon, paper cards, big mic, live captions, high-contrast mode), its rooms (lobby, feed, news, learn, help, circles), its commands and its wording.
- `design/` (if present) has UI I like and wins over the prototype.
- For every sponsor, **read their current docs before writing code. Don't guess endpoints, model names or SDK methods.** If a sponsor has no public API for what we need, tell me and use the fallback listed below.
- Give me a 10-line plan and wait for my OK.

## 1. Run it locally
- One repo: `web/` (Vite + React + TypeScript; port the prototype's CSS) and `server/` (Node + Express + TypeScript). `npm run dev` at the root starts both.
- Vapi has to reach our tools, so expose the server with `ngrok http 8787` (or `cloudflared`). Read the public URL from `.env` as `PUBLIC_URL`.
- `.env.example`: `VAPI_PRIVATE_KEY`, `VAPI_PUBLIC_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID`, `DEEPGRAM_API_KEY`, `EXA_API_KEY`, `TYPESAFE_API_KEY`, `MANUS_API_KEY`, `ADAL_API_KEY`, `ANTHROPIC_API_KEY` (vision for photo descriptions), `PUBLIC_URL`, `DEMO_PHONE` (a teammate's phone for the outbound call). Never commit `.env`.
- `npm run setup` runs `scripts/create-assistant.ts`, which creates or updates the Vapi assistant from code and prints the IDs.
- `npm run check` pings each sponsor with a tiny request and prints ✅ or ❌, so we know in 10 seconds what's live.

## 2. Every sponsor, and exactly what it does

### Vapi: the whole voice experience
- **Assistant "Coo"**: a friendly pigeon host. Short sentences. Says which room you're in. Says sources out loud. Asks before anything that sends, posts or costs money. Handles "faster", "slower", "repeat", "where am I", "help", "stop". Expert mode = shorter replies. Interruptions on.
- **Tools** (function tools pointing at `PUBLIC_URL/tools/*`): `get_feed`, `describe_photo`, `like_post`, `reply`, `create_post`, `get_news`, `more_like_this`, `find_help`, `moderate`, `do_for_me`, `make_share_video`, `call_someone`.
- **Web**: the Vapi Web SDK powers the big mic button and the space bar.
- **Phone in**: attach a Vapi phone number to the same assistant, so anyone can call The Coop from any phone, even a landline. Show the number in the lobby.
- **Phone out (the wow moment)**: `call_someone` makes an outbound Vapi call. When someone posts a photo for "Grandma", Coo calls her phone: "Hi Rosa, Alex just posted a photo from San Francisco…" and she can reply by voice, which posts back to the feed.
- **Squads (bonus)**: if quick, hand off from Coo to a "Helper" assistant for the help room. If not, one assistant is fine.

### Deepgram: ears and voices
- Vapi's transcriber = Deepgram's fastest English speech-to-text model; Coo's voice = a warm Deepgram Aura voice (pick from their docs).
- **Voice posts**: when a user records a post in the web app, send the audio to Deepgram's pre-recorded transcription so every post has a transcript (searchable, captioned, braille-display friendly).
- **Friend voices**: seed posts get distinct Deepgram Aura voices so the feed sounds like different people.
- **Bonus**: language detection, so a Spanish speaker gets answered in Spanish.

### Exa: live, sourced information
- `get_news(topic?)`: news from the last 48 hours (use Exa's news category and date filters). Return title, outlet, url, date and a short text. Coo reads one story at a time and names the outlet.
- `find_help(need, city)`: Exa search limited to official sources (.gov sites, state agencies, the Library of Congress NLS, the ADA National Network) for rides, audiobooks, job training and benefits. Coo says the source; the screen shows the link.
- `more_like_this(url)`: Exa's find-similar on the current story or lesson, for "more like this".
- `learn(topic)`: finds a beginner-friendly accessible lesson (e.g. "cooking without sight") and Coo summarizes it in three steps.

### TypeSafe / Jev: decisions you can trust
- `moderate(text)`: returns a structured `{ decision: "allow" | "hold", reason }` for every post and reply in Circles. Held posts are never read aloud; the screen shows "held by Coo: looked like a scam."
- **Safety gate**: before `do_for_me`, `create_post`, `reply` or `call_someone`, ask Jev `{ needs_confirmation: boolean, summary }`, and if true, Coo reads the summary and waits for "yes".
- **Router (fallback)**: if the voice model is unsure what the user meant, Jev classifies the intent into one of our tools.
- Fallback if unavailable: simple keyword rules, marked "sample" on screen.

### Manus: hands for the web
- `do_for_me(task)`: Manus does a web task the user can't easily do with a screen reader (check a bill, find store hours, fill a simple form). Coo narrates progress and **always asks before the final submit**.
- **Weekly digest (bonus)**: Manus compiles "your week in The Coop" (replies, top news, upcoming events) into a page that Coo can read.
- Fallback if no API access: run a scripted sample with the same narration, labeled "sample", and say in the demo that it's powered by Manus in production.

### AdaL: bringing sighted friends in
- `make_share_video(post_id)`: a short captioned video of a voice post (with the photo, if any), to share to Instagram or TikTok, so sighted friends join the conversation.
- Also use AdaL to make our **30-second pitch video** for the submission.
- Fallback: render a simple captioned clip in the browser (canvas + MediaRecorder) and label it "sample".

### Anthropic (vision, not a sponsor)
- `describe_photo(post_id, question?)` sends the actual image to a vision model and returns a short description, or an answer to a follow-up ("is she smiling?"). Never guess names of people who aren't tagged. The poster can edit the description before it goes live.

## 3. Stand out, even for someone who can see
- **Live sponsor ticker**: a small strip on screen that lights up as each sponsor works ("Exa found 3 sources", "Jev held a scam post", "Deepgram transcribed your post"). Judges see every sponsor working in real time.
- **"Everyone mode" toggle** on the lobby: same app, hands-free. "Play my feed" reads your whole feed like a podcast, with auto-advance. Pitch line: "Built for blind people first, better for everyone, like curb cuts."
- **Captions mirror everything**: what Coo says and what you say, big and live, so sighted friends follow along.
- **Photos talk, for everyone**: every photo gets an editable description, so the whole internet gets better alt text.
- **Earcons**: small sounds for like, next, back, post, held and error.
- **Any phone works**: the call-in number means no smartphone is needed.

## 4. Web app details
- Listen to Vapi Web SDK events (transcripts, tool calls, speech start/end) and update the screen live: `get_feed` shows that post card, `describe_photo` highlights the description, `get_news` shows the story with source links, and so on.
- Keep every non-voice control from the prototype: command chips, typed commands, keyboard shortcuts (space, arrows, D, L, R, W, H, Esc). They send the same text to the assistant.
- Settings: high contrast, text size, Coo's speed, expert mode, "use my screen reader" (Coo stays quiet; captions go to an aria-live region), calm mode, everyone mode.
- Accessibility: real buttons with labels, visible focus, 44px+ targets, tested with VoiceOver, nothing shown by color alone.

## 5. Data
- Seed the prototype's posts (Maya, Grandpa Joe, Priya, Dev) with real photos in `web/public/photos/` and Deepgram-voiced clips.
- Store posts, likes, replies and held posts in `server/data.json`. No login.
- Two Circles with seeded posts, plus one scam post for Jev to hold.

## 6. Build order (stop and show me after each)
**Must have (first 60 minutes):**
1. Port the UI to React with sample data, and get `npm run check` working.
2. Vapi + Deepgram: the mic works, "what's new?" plays Maya's post in her voice.
3. `describe_photo` with a follow-up question on a real image.
4. `like_post` / `reply` / `create_post`, with the screen updating live and Jev's safety gate.
5. Exa: `get_news` and `find_help` with spoken sources and on-screen links. Add the sponsor ticker.

**Should have (next 20 minutes):**
6. Jev moderation in Circles (scam post held).
7. Outbound `call_someone`: posting a photo "for Grandma" rings `DEMO_PHONE`.

**Bonus (if time):**
8. AdaL share video, Manus `do_for_me`, everyone mode "play my feed", phone-in number on the lobby.

## 7. Demo script (2 minutes)
1. "Everyone close your eyes. You're our user now."
2. "Hey Coo, what's new?" → Maya's voice post → "describe the photo" → "is she wet?" → "like it" → "reply: you're braver than me" (Jev checks it; chime).
3. "Go to news" → one story from Exa, outlet named → "more like this."
4. "Open your eyes." Show the captions and the sponsor ticker.
5. Post a photo "for Grandma" → a teammate's phone rings → Coo describes it → Grandma replies by voice → the reply appears in the feed.
6. Close: "Built for blind people first. Better for everyone. Every photo talks, every story has a source, and any phone works."

## 8. README
Setup, env vars, how to run, the sponsor table above, and the why-voice points from the prototype's "why voice" sheet. Note that the real product would be designed and tested with blind and low-vision users, and that it works alongside VoiceOver and TalkBack.
