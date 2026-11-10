/* Pushes live updates from tool calls to the open web app (server-sent events). */
import type { Response } from "express";

const clients = new Set<Response>();

export function addClient(res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(": connected\n\n");
  clients.add(res);
  res.on("close", () => clients.delete(res));
}

/* Recent events for polling. Streams get held back by the tunnel and by Vercel, so the web app polls instead. */
let seq = 0;
const recent: { seq: number; event: unknown }[] = [];

export function publish(event: Record<string, unknown> & { type: string }) {
  seq += 1;
  recent.push({ seq, event });
  if (recent.length > 300) recent.shift();
  const line = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((c) => c.write(line));
}

/** Events after `after`. A negative `after`, or one from before a server restart, returns no backlog, just the current position. */
export function eventsSince(after: number) {
  if (after < 0 || after > seq) return { seq, events: [] };
  return { seq, events: recent.filter((e) => e.seq > after).map((e) => e.event) };
}

export const tick = (sp: string, msg: string) => publish({ type: "tick", sp, msg });
