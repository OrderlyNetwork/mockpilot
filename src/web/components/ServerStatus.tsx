import React from 'react';

interface ServerStatusProps {
  running: boolean;
  onToggle: () => void;
}

export const ServerStatus: React.FC<ServerStatusProps> = ({ running, onToggle }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-1.5 text-xs ${running ? 'text-[var(--vscode-testing-iconPassed)]' : 'text-[var(--vscode-testing-iconFailed)]'}`}>
        <span className={`w-2 h-2 rounded-full ${running ? 'bg-[var(--vscode-testing-iconPassed)]' : 'bg-[var(--vscode-testing-iconFailed)]'}`}></span>
        <span>
          Server {running ? 'Running' : 'Stopped'}
        </span>
      </div>
      <button
        className={`px-3 py-1 border border-[var(--vscode-button-border)] rounded text-xs cursor-pointer ${
          running
            ? 'bg-[var(--vscode-inputValidation-errorBackground)] text-[var(--vscode-inputValidation-errorForeground)]'
            : 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]'
        }`}
        onClick={onToggle}
      >
        {running ? 'Stop Server' : 'Start Server'}
      </button>
    </div>
  );
};