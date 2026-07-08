import { footerStatus } from "@/lib/ops-derive";

export function OpsFooter() {
  const s = footerStatus();
  const items = [
    { label: "Platform", value: s.version },
    { label: "AI update", value: s.lastAiUpdate },
    { label: "DB sync", value: s.lastDbSync },
    { label: "Backup", value: s.lastBackup },
    { label: "Uptime", value: s.uptime },
  ];
  return (
    <div className="rounded-lg border bg-slate-50/60 px-4 py-3">
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider">{i.label}</span>
            <span className="font-medium text-slate-700">{i.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
