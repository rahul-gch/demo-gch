import { useMyOrgs } from "@/lib/use-comms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Lets a user who belongs to several organizations choose which one they are
 * acting as. Hidden when there is nothing to switch between.
 */
export function ActingOrgSwitcher({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  const orgs = useMyOrgs();
  if (orgs.length < 2) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Acting as</span>
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[220px] text-sm">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {orgs.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
