import { Link } from "@tanstack/react-router";
import type { PriorityItem } from "@/lib/ops-derive";
import { ArrowUpRight } from "lucide-react";

const dot: Record<PriorityItem["tone"], string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  success: "bg-emerald-500",
};

export function PriorityList({ items, loading }: { items: PriorityItem[]; loading?: boolean }) {
  const visible = items.filter((it) => it.count > 0);
  return (
    <aside className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
        Today's queue
      </div>
      <ul className="mt-3 space-y-2">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-9 animate-pulse rounded-md border border-white/10 bg-white/5" />
          ))}
        {!loading && visible.length === 0 && (
          <li className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            Nothing pending — all clear.
          </li>
        )}
        {!loading &&
          visible.map((it) => (
            <li key={it.id}>
              <Link
                to={it.to}
                search={it.search as never}
                className="group flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot[it.tone]}`} />
                  <span className="tabular-nums font-semibold text-white">{it.count}</span>
                  <span className="truncate text-slate-300">{it.label}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
              </Link>
            </li>
          ))}
      </ul>
    </aside>
  );
}
