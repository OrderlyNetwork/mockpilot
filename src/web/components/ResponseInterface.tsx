import { Textarea } from "./ui/textarea";
import { FC } from "react";
import { Label } from "./ui/label";

export const ResponseInterface: FC<{
  onChange: (value: string) => void;
  responseType: string;
}> = (props) => {
  const { responseType, onChange } = props;
  return (
    <div className="grid gap-2">
      <div className="text-muted-foreground">
        <Label className="text-muted-foreground">
          Response Type (Interface)
        </Label>
      </div>
      <Textarea
        value={responseType}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[150px] bg-secondary font-mono text-sm"
        placeholder="interface ResponseType {&#10;  // Define your response structure here&#10;}"
      />
    </div>
  );
};
