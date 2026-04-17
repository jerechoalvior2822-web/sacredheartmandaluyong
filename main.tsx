
  import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./styles/responsive.css";
import "./i18n/config";

createRoot(document.getElementById("root")!).render(<App />);
   