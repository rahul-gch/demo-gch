import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getOrgShippingDefault } from "@/lib/orgs.functions";
import { MapPin, Truck, Undo2 } from "lucide-react";

/** Loads the saved profile address of an organization (members only). */
export function useOrgShippingDefault(orgId: string | null | undefined) {
  const fetchDefault = useServerFn(getOrgShippingDefault);
  return useQuery({
    queryKey: ["org-shipping-default", orgId],
    queryFn: () => fetchDefault({ data: { orgId: orgId as string } }),
    enabled: Boolean(orgId),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

interface ShippingAddressFieldProps {
  orgId: string | null;
  /** The address that will be submitted. */
  value: string;
  onChange: (value: string) => void;
  useCustom: boolean;
  onUseCustomChange: (useCustom: boolean) => void;
  id?: string;
  rows?: number;
}

export function ShippingAddressField({
  orgId,
  value,
  onChange,
  useCustom,
  onUseCustomChange,
  id = "shipping-address",
  rows = 3,
}: ShippingAddressFieldProps) {
  const { data, isLoading } = useOrgShippingDefault(orgId);
  const defaultAddress = data?.formatted ?? "";
  const hasDefault = defaultAddress.trim().length > 0;

  // Keep the submitted value in sync with the default address while not customising.
  const lastAppliedOrg = useRef<string | null>(null);
  useEffect(() => {
    if (useCustom) return;
    if (!hasDefault) {
      if (lastAppliedOrg.current !== orgId) {
        lastAppliedOrg.current = orgId ?? null;
        onChange("");
      }
      return;
    }
    if (value !== defaultAddress) onChange(defaultAddress);
    lastAppliedOrg.current = orgId ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultAddress, hasDefault, useCustom, orgId]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id} className="flex items-center gap-2 text-xs font-medium">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Delivery address{" "}
          <span className="text-rose-500">*</span>
        </Label>
        {hasDefault &&
          (useCustom ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-[11px]"
              onClick={() => onUseCustomChange(false)}
            >
              <Undo2 className="h-3.5 w-3.5" /> Use default address
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2 text-[11px]"
              onClick={() => {
                onUseCustomChange(true);
                onChange("");
              }}
            >
              <Truck className="h-3.5 w-3.5" /> Ship to a different address
            </Button>
          ))}
      </div>

      {!useCustom && hasDefault ? (
        <div className="rounded-md border bg-muted/40 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Default address
          </div>
          <p className="mt-1 whitespace-pre-line text-sm leading-5">{defaultAddress}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Taken from your organization profile.
          </p>
        </div>
      ) : (
        <>
          <Textarea
            id={id}
            rows={rows}
            placeholder="Company, attention to, street, city, postal code, country, phone"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
          />
          <p className="text-[11px] text-muted-foreground">
            {useCustom
              ? "Used for this sample delivery only — your saved organization address stays unchanged."
              : isLoading
                ? "Loading your saved address…"
                : "No saved address yet. You can save one once in organization settings."}
          </p>
        </>
      )}
    </div>
  );
}
