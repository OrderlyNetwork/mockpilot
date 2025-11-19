import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { Rule } from "./RuleItem";

interface RuleEditorProps {
  rule: Rule;
  isEditing: boolean;
  onUpdate: (updates: Partial<Rule>) => void;
}

export function RuleEditor({ rule, isEditing, onUpdate }: RuleEditorProps) {
  const updateHeader = (oldKey: string, newKey: string, newValue: string) => {
    const newHeaders = { ...rule.headers };
    if (oldKey !== newKey) {
      delete newHeaders[oldKey];
    }
    newHeaders[newKey] = newValue;
    onUpdate({ headers: newHeaders });
  };

  const addHeader = () => {
    onUpdate({
      headers: { ...rule.headers, "": "" },
    });
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...rule.headers };
    delete newHeaders[key];
    onUpdate({ headers: newHeaders });
  };

  if (isEditing) {
    return (
      <div className="space-y-6 p-3 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-200 dark:border-yellow-800">
        {/* Headers Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Headers</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={addHeader}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Header
            </Button>
          </div>
          <div className="space-y-2">
            {Object.entries(rule.headers).map(([key, value], idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={key}
                  onChange={(e) => updateHeader(key, e.target.value, value)}
                  placeholder="Header name"
                  className="flex-1 bg-background font-mono text-sm border-yellow-500 focus:ring-yellow-500"
                />
                <Input
                  value={value}
                  onChange={(e) => updateHeader(key, key, e.target.value)}
                  placeholder="Header value"
                  className="flex-1 bg-background font-mono text-sm border-yellow-500 focus:ring-yellow-500"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeHeader(key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Body Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Response Body</h4>
          <Textarea
            value={rule.body}
            onChange={(e) => onUpdate({ body: e.target.value })}
            className="min-h-[200px] bg-background font-mono text-sm border-yellow-500 focus:ring-yellow-500"
            placeholder="Response body (JSON, XML, etc.)"
          />
        </div>
      </div>
    );
  }

  // Preview mode
  return (
    <div className="space-y-4">
      {/* Headers Preview */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
          Headers
        </h4>
        <div className="space-y-1">
          {Object.entries(rule.headers).map(([key, value]) => (
            <div
              key={key}
              className="flex gap-2 text-xs font-mono text-muted-foreground"
            >
              <span className="text-foreground">{key}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body Preview */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
          Response Body
        </h4>
        <pre className="max-h-40 overflow-auto rounded border border-border bg-secondary p-2 text-xs font-mono text-foreground">
          {rule.body}
        </pre>
      </div>
    </div>
  );
}
