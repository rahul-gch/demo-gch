import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-base font-medium">Coming soon</div>
          <p className="max-w-md text-sm text-muted-foreground">
            This section is part of the roadmap and will be built out next. Navigation and layout are
            already in place so it stays consistent across every organization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
