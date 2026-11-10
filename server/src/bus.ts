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

export function publish(event: Record<string, unknown> & { type: string }) {
  const line = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((c) => c.write(line));
}

export const tick = (sp: string, msg: string) => publish({ type: "tick", sp, msg });
