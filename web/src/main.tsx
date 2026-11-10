import { createRoot } from "react-dom/client";
import App from "./App";
import { initLive } from "./live";
import "./styles.css";

initLive();

// Installable as an app on phones. Only in the built site, so local development never serves stale files.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
