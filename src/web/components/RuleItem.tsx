import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { RuleEditor } from "./RuleEditor";

export interface Rule {
  id: string;
  name: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  delay: number;
  isActive: boolean;
}

interface RuleItemProps {
  rule: Rule;
  isOnlyRule: boolean;
  isNewlyCreated?: boolean;
  onSetActive: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Rule>) => void;
  onDelete: (id: string) => void;
  onEditComplete?: (id: string) => void;
}

export function RuleItem({
  rule,
  isOnlyRule,
  isNewlyCreated = false,
  onSetActive,
  onUpdate,
  onDelete,
  onEditComplete,
}: RuleItemProps) {
  const [isExpanded, setIsExpanded] = useState(isNewlyCreated);
  const [isEditing, setIsEditing] = useState(isNewlyCreated);
  const [editingRule, setEditingRule] = useState<Rule | null>(
    isNewlyCreated ? { ...rule } : null
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const toggleExpand = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const startEdit = () => {
    setIsEditing(true);
    setEditingRule({ ...rule });
    setIsExpanded(true);
  };

  const saveEdit = () => {
    if (editingRule) {
      // Validate JSON format of body
      try {
        JSON.parse(editingRule.body);
        setJsonError(null);
        onUpdate(rule.id, editingRule);
        setIsEditing(false);
        setEditingRule(null);
        // Notify parent that editing is complete
        onEditComplete?.(rule.id);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Invalid JSON format";
        setJsonError(`JSON Error: ${errorMessage}`);
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingRule(null);
    setJsonError(null);
    // Notify parent that editing is complete (cancelled)
    onEditComplete?.(rule.id);
  };

  const updateEditingRule = (updates: Partial<Rule>) => {
    if (editingRule) {
      setEditingRule({ ...editingRule, ...updates });
      // Clear JSON error when body is updated
      if (updates.body !== undefined) {
        setJsonError(null);
      }
    }
  };

  const displayRule = isEditing ? editingRule! : rule;

  return (
    <div
      className={`border-l-4 transition-all duration-200 ${
        rule.isActive
          ? "border-l-primary bg-primary/5"
          : isEditing
          ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 shadow-lg"
          : "border-l-transparent hover:bg-accent/50"
      }`}
    >
      {/* Rule Header */}
      <div
        className={`flex cursor-pointer items-center justify-between px-4 py-3 ${
          isEditing
            ? "bg-linear-to-r from-yellow-100/50 to-transparent dark:from-yellow-900/20"
            : ""
        }`}
        onClick={toggleExpand}
      >
        <div className="flex flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              if (!isEditing) {
                e.stopPropagation();
                toggleExpand();
              }
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <Input
                value={displayRule.name}
                onChange={(e) => updateEditingRule({ name: e.target.value })}
                className="h-8 w-48 bg-background border-yellow-500 focus:ring-yellow-500"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="font-medium">{rule.name}</span>
            )}

            {isEditing ? (
              <Input
                type="number"
                value={displayRule.status}
                onChange={(e) =>
                  updateEditingRule({
                    status: parseInt(e.target.value) || 200,
                  })
                }
                className="h-8 w-20 bg-background font-mono text-xs border-yellow-500 focus:ring-yellow-500"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Badge variant="outline" className="font-mono text-xs">
                {rule.status}
              </Badge>
            )}
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={displayRule.delay}
                  onChange={(e) =>
                    updateEditingRule({
                      delay: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8 w-20 bg-background text-xs border-yellow-500 focus:ring-yellow-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs text-muted-foreground">ms</span>
              </div>
            ) : (
              rule.delay > 0 && (
                <span className="text-xs text-muted-foreground">
                  {rule.delay}ms delay
                </span>
              )
            )}
          </div>
        </div>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={saveEdit}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEdit}
                className="gap-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {!rule.isActive ? (
                <Button
                  size="sm"
                  variant={rule.isActive ? "default" : "outline"}
                  onClick={() => onSetActive(rule.id)}
                  className={
                    rule.isActive ? "bg-success hover:bg-success/90" : ""
                  }
                >
                  {rule.isActive ? "Active" : "Set Active"}
                </Button>
              ) : null}

              <Button size="sm" variant="ghost" onClick={startEdit}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(rule.id)}
                disabled={isOnlyRule}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rule Details - Collapsible */}
      {isExpanded && (
        <div className="border-t border-border bg-card/50 px-4 py-4">
          {/* JSON Error Alert */}
          {jsonError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Failed to save rule</div>
                <div className="mt-1 text-xs opacity-90">{jsonError}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setJsonError(null)}
                className="h-6 w-6 p-0 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <RuleEditor
            rule={displayRule}
            isEditing={isEditing}
            onUpdate={updateEditingRule}
          />
        </div>
      )}
    </div>
  );
}
