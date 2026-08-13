import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { QUICK_ACTIONS, type QuickAction } from "@/lib/ops-derive";
import { Plus, Building2, Handshake, UserPlus, Megaphone, MessageSquare } from "lucide-react";

const ICONS: Record<QuickAction["icon"], React.ComponentType<{ className?: string }>> = {
  plus: Plus,
  userplus: UserPlus,
  building: Building2,
  handshake: Handshake,
  message: MessageSquare,
  megaphone: Megaphone,
};

export function QuickActions() {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Quick actions
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((a) => {
            const Icon = ICONS[a.icon];
            return (
              <Link
                key={a.id}
                to={a.to}
                search={a.search as never}
                className="group flex h-full flex-col items-start gap-2 rounded-lg border bg-slate-50/50 p-3 transition hover:border-slate-300 hover:bg-white"
              >
                <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-900 text-white transition group-hover:bg-slate-700">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium leading-snug text-slate-700">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
