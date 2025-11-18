import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// Mirror VS Code theme class to Tailwind dark mode class
(() => {
  const body = document.body;
  const root = document.documentElement;
  const sync = () => {
    if (body.classList.contains("vscode-dark")) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(body, { attributes: true, attributeFilter: ["class"] });
})();

// 获取WebView容器
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);
