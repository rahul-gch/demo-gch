import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Global Chain Hub" },
      { name: "description", content: "Confidence, profile, and matchmaking settings." },
    ],
  }),
  component: SettingsPage,
});

const REQUIRED_FIELDS = [
  "Organization type",
  "Actor type",
  "Country",
  "Region",
  "Materials",
  "Capabilities",
  "Certifications",
  "Capacity",
  "Evidence count",
];

const MATCHING_PARAMETERS = [
  "Location",
  "Distance radius",
  "Entity type",
  "Actor type",
  "Material type",
  "Capability",
  "Capacity",
  "MOQ",
  "Lead time",
  "Delivery timeframe",
  "On-time rate",
  "Delay history",
  "Certifications",
  "Confidence score",
  "Risk level",
  "Evidence strength",
  "Profile completeness",
  "Verification status",
  "Sustainability fit",
];

const WEIGHTS = [
  { name: "Actor type fit", weight: 18 },
  { name: "Capability / material fit", weight: 18 },
  { name: "Certification fit", weight: 12 },
  { name: "Location fit", weight: 12 },
  { name: "Capacity fit", weight: 13 },
  { name: "Delivery & reliability", weight: 15 },
  { name: "Confidence score", weight: 7 },
  { name: "Evidence strength", weight: 5 },
];

function SettingsPage() {
  return (
    <AppShell>
      <div className="w-full space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin settings for matchmaking, scoring, and profile requirements.
          </p>
        </header>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Confidence settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Field id="threshold" label="Confidence threshold" defaultValue="70" suffix="%" />
            <Field id="verified-min" label="Verified score (min)" defaultValue="85" suffix="%" />
            <Field
              id="low-warning"
              label="Low confidence warning below"
              defaultValue="60"
              suffix="%"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Delivery & reliability</CardTitle>
            <p className="text-xs text-muted-foreground">
              Tune how delivery timeframes and historical delays influence match scoring.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Field
              id="target-delivery"
              label="Target delivery timeframe"
              defaultValue="30"
              suffix="days"
            />
            <Field id="max-delay" label="Max acceptable delay" defaultValue="5" suffix="days" />
            <Field id="min-ontime" label="Min on-time delivery rate" defaultValue="85" suffix="%" />
            <Field id="delay-penalty" label="Delay penalty weight" defaultValue="10" suffix="%" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Profile requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {REQUIRED_FIELDS.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <Checkbox defaultChecked />
                  <span>{f}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Matching parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {MATCHING_PARAMETERS.map((p) => (
                <Badge key={p} variant="secondary" className="font-normal">
                  {p}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Matching weights</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterion</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {WEIGHTS.map((w) => (
                  <TableRow key={w.name}>
                    <TableCell>{w.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.weight}%</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({
  id,
  label,
  defaultValue,
  suffix,
}: {
  id: string;
  label: string;
  defaultValue: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} defaultValue={defaultValue} />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
