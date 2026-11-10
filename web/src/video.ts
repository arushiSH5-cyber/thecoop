/* Share video: a captioned clip built in the browser (canvas + MediaRecorder), labeled "sample" because AdaL has no public video API we could find. */
import { getState, patch, tick, toast } from "./engine";

export interface VideoJob {
  id: string;
  text: string;
  who: string;
  scene: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function makeVideo(job: VideoJob) {
  const W = 720;
  const H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx || typeof MediaRecorder === "undefined") {
    toast("this browser can't make videos");
    return;
  }
  const img = job.scene ? await loadImage(`/photos/${job.id}.jpg`) : null;
  const stream = canvas.captureStream(30);

  let audio: HTMLAudioElement | null = null;
  if (/^p\d+$/.test(job.id)) {
    audio = new Audio(`/api/voice/${job.id}`);
    audio.crossOrigin = "anonymous";
    await new Promise((r) => {
      audio!.onloadedmetadata = r;
      audio!.onerror = r;
    });
    const ac = new AudioContext();
    const dest = ac.createMediaStreamDestination();
    ac.createMediaElementSource(audio).connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  }
  const words = job.text.split(" ");
  const seconds = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Math.max(3, words.length * 0.4);

  const chunks: Blob[] = [];
  const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = () => {
    const url = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
    patch({ videos: { ...getState().videos, [job.id]: url } });
    tick("AdaL", "sample: your captioned clip is ready");
  };

  const start = performance.now();
  const draw = () => {
    const t = (performance.now() - start) / 1000;
    const shown = words.slice(0, Math.ceil((t / seconds) * words.length)).join(" ");
    ctx.fillStyle = "#262c4a";
    ctx.fillRect(0, 0, W, H);
    if (img) {
      const scale = Math.max(W / img.width, 430 / img.height);
      ctx.drawImage(img, (W - img.width * scale) / 2, (430 - img.height * scale) / 2, img.width * scale, img.height * scale);
    }
    ctx.fillStyle = "#fffefb";
    ctx.font = "700 34px sans-serif";
    ctx.fillText(job.who, 32, 490);
    ctx.font = "700 32px sans-serif";
    wrap(ctx, shown, W - 64).slice(-4).forEach((l, i) => ctx.fillText(l, 32, 540 + i * 42));
    ctx.font = "400 20px sans-serif";
    ctx.fillStyle = "#ffe14d";
    ctx.fillText("the coop · sample clip", 32, H - 16);
    if (t >= seconds) {
      clearInterval(timer);
      audio?.pause();
      rec.stop();
    }
  };
  rec.start();
  audio?.play().catch(() => {});
  // A timer, not requestAnimationFrame, so the clip still finishes if the tab loses focus.
  const timer = setInterval(draw, 33);
}
