import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Play, Save } from "lucide-react";

interface ApiHeaderProps {
  method: string;
  endpoint: string;
  onMethodChange: (method: string) => void;
  onEndpointChange: (endpoint: string) => void;
  onSave: () => void;
}

export function ApiHeader({
  method,
  endpoint,
  onMethodChange,
  onEndpointChange,
  onSave,
}: ApiHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Select value={method} onValueChange={onMethodChange}>
          <SelectTrigger className="w-24 bg-secondary text-secondary-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          className="w-96 bg-secondary font-mono text-sm"
          placeholder="/api/endpoint"
        />
        <Button size="sm" variant="default" className="gap-2">
          <Play className="h-4 w-4" />
          Test
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" className="gap-2" onClick={onSave}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
