import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfileAnswers, ProfileField } from "@/lib/entity-profiles";

type Value = string | number | string[] | null | undefined;

/** Renders one questionnaire field; multi-selects use toggleable chips. */
export function ProfileFieldInput({
  field,
  value,
  onChange,
}: {
  field: ProfileField;
  value: Value;
  onChange: (value: Value) => void;
}) {
  const id = `pf-${field.id}`;

  if (field.kind === "multi") {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (option: string) =>
      onChange(
        selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option],
      );
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => {
            const on = selected.includes(option);
            return (
              <button key={option} type="button" onClick={() => toggle(option)}>
                <Badge
                  variant={on ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 text-xs font-medium"
                >
                  {option}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.kind === "single") {
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <Select
          value={typeof value === "string" && value ? value : undefined}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {(field.options ?? [])
              .filter((o) => o && o.trim().length > 0)
              .map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea
          id={id}
          rows={3}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.kind === "number") {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type="number"
            min={0}
            className="max-w-40"
            value={typeof value === "number" ? String(value) : (value as string) || ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          />
          {field.suffix && <span className="text-sm text-muted-foreground">{field.suffix}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{field.label}</Label>
      <Input
        id={id}
        value={typeof value === "string" ? value : ""}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ProfileFieldGroup({
  fields,
  answers,
  onChange,
}: {
  fields: ProfileField[];
  answers: ProfileAnswers;
  onChange: (id: string, value: Value) => void;
}) {
  return (
    <div className="space-y-6">
      {fields.map((f) => (
        <ProfileFieldInput
          key={f.id}
          field={f}
          value={answers[f.id]}
          onChange={(v) => onChange(f.id, v)}
        />
      ))}
    </div>
  );
}
