import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { CountrySelect } from "@/components/CountrySelect";
import type { LocationRow, ProfileAnswers, ProfileAnswerValue, ProfileField } from "@/lib/entity-profiles";

type Value = ProfileAnswerValue;

function LocationsInput({ field, value, onChange }: { field: ProfileField; value: Value; onChange: (v: Value) => void }) {
  const rows: LocationRow[] = Array.isArray(value)
    ? (value as unknown[]).filter((r): r is LocationRow => !!r && typeof r === "object")
    : [];
  const list = rows.length ? rows : [{}];
  const update = (i: number, patch: Partial<LocationRow>) =>
    onChange(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-3">
      <Label>{field.label}</Label>
      {list.map((row, i) => (
        <div key={i} className="space-y-2 rounded-md border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Location {i + 1}</span>
            {list.length > 1 && (
              <Button type="button" variant="ghost" size="sm" aria-label={`Remove location ${i + 1}`} onClick={() => onChange(list.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input aria-label="Site name" placeholder="Site name" value={row.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} />
            <Input aria-label="Address" placeholder="Address" value={row.address ?? ""} onChange={(e) => update(i, { address: e.target.value })} />
            <Input aria-label="City" placeholder="City" value={row.city ?? ""} onChange={(e) => update(i, { city: e.target.value })} />
            <CountrySelect value={row.country ?? ""} onChange={(c) => update(i, { country: c })} />
          </div>
        </div>
      ))}
      {list.length < 20 && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...list, {}])}>
          <Plus className="mr-1 h-4 w-4" /> Add location
        </Button>
      )}
    </div>
  );
}

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

  if (field.kind === "locations") return <LocationsInput field={field} value={value} onChange={onChange} />;

  if (field.kind === "multi") {
    const selected = Array.isArray(value) ? (value as unknown[]).filter((v): v is string => typeof v === "string") : [];
    const allOptions = [...(field.options ?? []), ...selected.filter((v) => !(field.options ?? []).includes(v))];
    const toggle = (option: string) =>
      onChange(
        selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option],
      );
    return (
      <div className="space-y-2">
        <Label id={`${id}-label`}>{field.label}</Label>
        <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
          {allOptions.map((option) => {
            const on = selected.includes(option);
            return (
              <Button key={option} type="button" aria-pressed={on} onClick={() => toggle(option)} variant={on ? "default" : "outline"} size="sm" className="h-auto min-h-9 max-w-full whitespace-normal rounded-md px-3 py-2 text-left text-sm leading-snug">
                {option}
              </Button>
            );
          })}
        </div>
        {field.countryPicker && (
          <CountrySelect
            value=""
            placeholder="Add another country..."
            onChange={(c) => c && !selected.includes(c) && onChange([...selected, c])}
          />
        )}
      </div>
    );
  }

  if (field.kind === "single") {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
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
