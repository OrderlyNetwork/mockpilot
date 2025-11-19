import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { ResponseInterface } from "./ResponseInterface";

interface ApiInfoSectionProps {
  name: string;
  description: string;
  responseType: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onResponseTypeChange: (responseType: string) => void;
}

export function ApiInfoSection({
  name,
  description,
  responseType,
  onNameChange,
  onDescriptionChange,
  onResponseTypeChange,
}: ApiInfoSectionProps) {
  return (
    <div className="border-b border-border bg-card p-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-muted-foreground">
            API Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-secondary"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description" className="text-muted-foreground">
            Description
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="bg-secondary"
          />
        </div>

        <ResponseInterface
          responseType={responseType}
          onChange={onResponseTypeChange}
        />
      </div>
    </div>
  );
}
