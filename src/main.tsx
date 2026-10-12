import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installSessionInterceptor } from "./lib/session";

installSessionInterceptor();

createRoot(document.getElementById("root")!).render(<App />);
