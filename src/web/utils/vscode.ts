/**
 * VS Code API Singleton
 * Ensures that acquireVsCodeApi is only called once globally
 */

interface VSCodeAPI {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VSCodeAPI;
    __vscodeApi?: VSCodeAPI; // Cache the API on window to survive HMR
  }
}

/**
 * Get the VS Code API instance (singleton)
 * This function ensures that acquireVsCodeApi is only called once
 * even across hot module reloads
 */
export function getVSCodeAPI(): VSCodeAPI | null {
  // Return cached instance if it exists
  if (typeof window !== "undefined" && window.__vscodeApi) {
    return window.__vscodeApi;
  }

  // Acquire and cache the API if available
  if (typeof window !== "undefined" && window.acquireVsCodeApi) {
    try {
      window.__vscodeApi = window.acquireVsCodeApi();
      return window.__vscodeApi;
    } catch (error) {
      // If already acquired, it might be cached somewhere
      console.warn("VS Code API already acquired, using cached instance");
      return window.__vscodeApi || null;
    }
  }

  return null;
}

/**
 * Post a message to the VS Code extension
 */
export function postMessageToExtension(message: any) {
  const api = getVSCodeAPI();
  if (api) {
    api.postMessage(message);
  }
}

/**
 * Get the persisted state
 */
export function getState() {
  const api = getVSCodeAPI();
  return api?.getState();
}

/**
 * Set the persisted state
 */
export function setState(state: any) {
  const api = getVSCodeAPI();
  api?.setState(state);
}
