# The Coop

Social media you can hear. Built first for blind, low-vision and older people, and great for anyone who wants their feed hands-free.

Built for the voice agent hackathon at Vapi HQ. This project stays local.

## Run it

```bash
npm install
cp .env.example .env   # then fill in your keys
npm run dev            # web on :5173, server on :8787
```

In a second terminal, start the tunnel so Vapi can reach the tools:

```bash
cloudflared tunnel --url http://localhost:8787
```

Put the printed link in `.env` as `PUBLIC_URL`, then:

```bash
npm run setup   # creates or updates Coo on Vapi
npm run check   # shows what's live, in a few seconds
```

`npm run setup` saves Coo's id in `.env.local`, which also holds the tunnel link and password so editing `.env` can't wipe them. A value in `.env` wins over `.env.local`.

Restart `npm run dev` after changing `.env`. The tunnel link changes each time it restarts, so run `npm run setup` again when that happens.

Use Chrome for the microphone. `TOOLS_SECRET` is any long random string; only requests carrying it can use `/tools/*` through the tunnel, and everything else except a health check is local-only.

## Live site

The web app is deployed on Vercel from `web/`. Its `/api/*` calls are forwarded to the laptop server through the tunnel (see `web/vercel.json`), so the live site works while `npm run dev` and the tunnel are running. When the tunnel link changes, update `web/vercel.json` and `.env.local`, run `npm run setup`, and redeploy.

## Environment

| Variable | What it's for |
|---|---|
| `VAPI_PRIVATE_KEY`, `VAPI_PUBLIC_KEY` | Vapi server and browser keys |
| `VAPI_ASSISTANT_ID` | Written by `npm run setup` |
| `VAPI_PHONE_NUMBER_ID` | Phone in and out. Outbound needs a number imported from Twilio, Vonage or Telnyx; free Vapi numbers can't call out |
| `DEMO_PHONE` | The phone Coo rings, in `+1XXXXXXXXXX` format, belonging to someone who has agreed |
| `DEEPGRAM_API_KEY` | Friend voices and voice-post transcripts |
| `EXA_API_KEY` | News, help, lessons |
| `TYPESAFE_API_KEY` | Jev moderation, safety gate, router |
| `MANUS_API_KEY` | Web tasks |
| `ANTHROPIC_API_KEY` | Photo descriptions |
| `PUBLIC_URL`, `TOOLS_SECRET` | The tunnel link and its password |

## Sponsors

| Sponsor | What it does here | Without a key or on failure |
|---|---|---|
| **Vapi** | The whole voice experience: assistant, tools, web mic, phone in and out | Browser speech and a local command engine |
| **Deepgram** | Flux speech-to-text, Aura-2 voices for Coo and each friend, voice-post transcripts | Browser voices |
| **Exa** | News from the last 48 hours, official help sources, lessons, more like this | Sample stories, labeled |
| **TypeSafe Jev** | Moderation, confirmation gate, intent router | Keyword rules, labeled sample |
| **Manus** | Web tasks, always stopping for a yes before the final step | Scripted run, labeled sample |
| **AdaL** | We found no public video API, so share videos are a browser clip | Canvas and MediaRecorder, labeled sample |
| **Anthropic** (vision, not a sponsor) | Describes the real image and answers follow-ups, never guessing names | Sample descriptions |

## Why voice

- **Photos finally talk.** Most photos online have no description, so screen reader users just hear "image."
- **No endless scrolling by ear.** Say "next," "like it," "reply," and you're done in two minutes.
- **Works on any phone.** Call in with no smartphone or app.
- **Made for people who lost their sight later in life.** Many older adults never learned a screen reader. Everyone already knows how to talk.
- **A safe room.** Circles are small support groups, and scams are held before anyone hears them.
- **Sighted friends can join.** Big live captions, and any post can become a captioned video.

The real product would be designed and tested with blind and low-vision users. It's built to work alongside VoiceOver and TalkBack, not to replace them.

Sample photo credits are in `web/public/photos/CREDITS.md`. The names in the app are made up and are not the people shown.
