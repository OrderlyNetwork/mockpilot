import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";

interface ApiInfoSectionProps {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function ApiInfoSection({
  name,
  description,
  onNameChange,
  onDescriptionChange,
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
      </div>
    </div>
  );
}
