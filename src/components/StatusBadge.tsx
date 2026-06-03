import { Badge } from "@/components/ui/badge";
import type { VerificationStatus, RiskLevel } from "@/seed/types";
import { cn } from "@/lib/utils";

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const tone =
    status === "Verified"
      ? "border-slate-300 bg-slate-900 text-white"
      : status === "Pending"
        ? "border-slate-300 bg-slate-100 text-slate-700"
        : status === "Incomplete"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-red-200 bg-red-50 text-red-700";
  return (
    <Badge variant="outline" className={cn("font-medium", tone)}>
      {status}
    </Badge>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const tone =
    level === "Low"
      ? "border-slate-200 bg-slate-50 text-slate-700"
      : level === "Medium"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-700";
  return (
    <Badge variant="outline" className={cn("font-medium", tone)}>
      {level} Risk
    </Badge>
  );
}
