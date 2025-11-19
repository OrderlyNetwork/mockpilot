import React, { useState, useEffect } from "react";
import { MockApiExplorer } from "../components/MockApiExplorer";
import { MockApiPanel } from "../components/mock-api-panel";
import { MockEditor } from "../components/MockEditor";
import { ServerStatus } from "../components/ServerStatus";
import { MockApi } from "../types/mockApi";
import { MockApiConfig } from "../types";
import { postMessageToExtension } from "../utils/vscode";
import "./styles.css";

interface AppProps {}

export const App: React.FC<AppProps> = () => {
  const [selectedApi, setSelectedApi] = useState<MockApi | null>(null);
  const [serverRunning, setServerRunning] = useState(false);
  const [mockApis, setMockApis] = useState<MockApi[]>([]);
  const [mockEditorConfig, setMockEditorConfig] =
    useState<MockApiConfig | null>(null);
  const [mockEditorFilePath, setMockEditorFilePath] = useState<string>("");
  const [isMockEditorMode, setIsMockEditorMode] = useState(false);

  // 监听来自扩展的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "mockApisUpdated":
          setMockApis(message.apis);
          break;
        case "serverStatusChanged":
          setServerRunning(message.running);
          break;
        case "selectApi":
          setSelectedApi(message.api);
          break;
        case "loadConfig":
          // Mock editor mode
          setMockEditorConfig(message.config);
          setMockEditorFilePath(message.filePath);
          setIsMockEditorMode(true);
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // 通知扩展WebView已准备就绪
    postMessageToExtension({ type: "ready" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleApiSelect = (api: MockApi) => {
    setSelectedApi(api);
    postMessageToExtension({
      type: "apiSelected",
      api: api,
    });
  };

  const handleApiUpdate = (api: MockApi) => {
    postMessageToExtension({
      type: "apiUpdated",
      api: api,
    });
  };

  const handleServerToggle = () => {
    postMessageToExtension({
      type: "toggleServer",
    });
  };

  const handleMockEditorSave = (config: MockApiConfig, filePath: string) => {
    postMessageToExtension({
      type: "saveConfig",
      config: config,
      filePath: filePath,
    });
  };

  // If in mock editor mode, render the MockEditor component
  if (isMockEditorMode && mockEditorConfig) {
    return (
      <MockApiPanel
        initialConfig={mockEditorConfig}
        initialFilePath={mockEditorFilePath}
      />
    );
  }

  // Otherwise, render the regular app interface
  return (
    <div className="flex h-screen">
      <MockApiPanel />
    </div>
  );
};
