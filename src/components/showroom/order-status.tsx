import { Badge } from "@/components/ui/badge";
import type { SampleOrderStatus } from "@/lib/showroom.functions";
import {
  Clock,
  MessageSquareQuote,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Ban,
} from "lucide-react";

export const STATUS_META: Record<
  SampleOrderStatus,
  { label: string; className: string; Icon: typeof Clock; description: string }
> = {
  requested: {
    label: "Requested",
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    Icon: Clock,
    description: "Waiting for the supplier to send a quote.",
  },
  quoted: {
    label: "Quoted",
    className: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-300",
    Icon: MessageSquareQuote,
    description: "Supplier sent a quote. Waiting for the buyer to confirm.",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300",
    Icon: CheckCircle2,
    description: "Buyer confirmed the quote. Supplier prepares the samples.",
  },
  shipped: {
    label: "Shipped",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300",
    Icon: Truck,
    description: "Samples are on their way.",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
    Icon: PackageCheck,
    description: "Samples delivered. Order complete.",
  },
  declined: {
    label: "Declined",
    className: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300",
    Icon: XCircle,
    description: "The supplier declined this request.",
  },
  withdrawn: {
    label: "Withdrawn",
    className: "text-slate-500 border-slate-300",
    Icon: Ban,
    description: "The buyer withdrew this request.",
  },
};

export function OrderStatusBadge({ status }: { status: SampleOrderStatus }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    className: "",
    Icon: Clock,
  };
  const Icon = meta.Icon;
  return (
    <Badge variant="outline" className={`gap-1 ${meta.className}`}>
      <Icon className="h-3 w-3" /> {meta.label}
    </Badge>
  );
}

export function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function quoteTotal(price: number | null, shipping: number | null) {
  if (price === null) return null;
  return price + (shipping ?? 0);
}
