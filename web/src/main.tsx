import { createRoot } from "react-dom/client";
import App from "./App";
import { initLive } from "./live";
import "./styles.css";

initLive();

createRoot(document.getElementById("root")!).render(<App />);
