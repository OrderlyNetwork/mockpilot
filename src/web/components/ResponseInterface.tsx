import { ChevronDown, ChevronRight } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { FC, useState } from "react";
import { Label } from "./ui/label";

export const ResponseInterface: FC<{
  onChange: (value: string) => void;
  responseType: string;
}> = (props) => {
  const { responseType, onChange } = props;
  const [isResponseTypeExpanded, setIsResponseTypeExpanded] = useState(false);
  return (
    <div className="grid gap-2">
      <div
        className="flex cursor-pointer items-center gap-2 text-muted-foreground"
        onClick={() => setIsResponseTypeExpanded(!isResponseTypeExpanded)}
      >
        {isResponseTypeExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Label className="cursor-pointer text-muted-foreground">
          Response Type (Interface)
        </Label>
      </div>
      {isResponseTypeExpanded && (
        <Textarea
          value={responseType}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[150px] bg-secondary font-mono text-sm"
          placeholder="interface ResponseType {&#10;  // Define your response structure here&#10;}"
        />
      )}
    </div>
  );
};
