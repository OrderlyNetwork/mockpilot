import React from 'react';
import { MockApi } from '../types/mockApi';

interface MockApiExplorerProps {
  apis: MockApi[];
  selectedApi: MockApi | null;
  onApiSelect: (api: MockApi) => void;
}

export const MockApiExplorer: React.FC<MockApiExplorerProps> = ({
  apis,
  selectedApi,
  onApiSelect
}) => {
  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'var(--vscode-testing-iconPassed)',
      POST: 'var(--vscode-charts-blue)',
      PUT: 'var(--vscode-charts-orange)',
      DELETE: 'var(--vscode-testing-iconFailed)',
      PATCH: 'var(--vscode-charts-purple)',
      HEAD: 'var(--vscode-charts-green)',
      OPTIONS: 'var(--vscode-charts-yellow)'
    };
    return colors[method] || 'var(--vscode-editor-foreground)';
  };

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-[var(--vscode-sideBarTitle-foreground)]">Mock APIs</h3>
        <span className="bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] px-1.5 py-0.5 rounded-full text-[11px] font-medium">
          {apis.length}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {apis.length === 0 ? (
          <div className="text-center py-6 px-3 text-[var(--vscode-descriptionForeground)]">
            <p className="mb-1 text-sm">No mock APIs found</p>
            <small className="text-xs">Create .mock directory and add YAML files</small>
          </div>
        ) : (
          apis.map((api) => (
            <div
              key={api.id}
              className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                selectedApi?.id === api.id
                  ? 'bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]'
                  : 'hover:bg-[var(--vscode-list-hoverBackground)]'
              } ${!api.enabled ? 'opacity-60' : ''}`}
              onClick={() => onApiSelect(api)}
            >
              <div
                className="font-mono text-[11px] font-semibold min-w-[50px] text-center"
                style={{ color: getMethodColor(api.method) }}
              >
                {api.method}
              </div>
              <div className="flex-1 ml-3 overflow-hidden">
                <div className="font-mono text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {api.endpoint}
                </div>
                <div className="text-xs text-[var(--vscode-descriptionForeground)] whitespace-nowrap overflow-hidden text-ellipsis">
                  {api.name}
                </div>
              </div>
              <div className="ml-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  api.enabled ? 'bg-[var(--vscode-testing-iconPassed)]' : 'bg-[var(--vscode-testing-iconFailed)]'
                }`}></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};