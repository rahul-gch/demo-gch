import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getKpisForEntity, confidenceClasses } from "@/seed/kpi";

export function KpiTable({ entity }: { entity: Entity }) {
  const kpis = getKpisForEntity(entity);
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">KPI library — {entity.name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          18 normalized KPIs from the GCH Benchmark & KPI Intelligence Dataset v0.1. Values are
          derived from operational evidence where available, otherwise marked as not reported.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[88px]">KPI</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.map((k) => (
              <TableRow key={k.kpi.id} className={!k.reported ? "opacity-70" : ""}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {k.kpi.id}
                </TableCell>
                <TableCell className="font-medium">{k.kpi.name}</TableCell>
                <TableCell className="text-muted-foreground">{k.kpi.category}</TableCell>
                <TableCell className="text-right tabular-nums">{k.displayValue}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{k.kpi.unit}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${confidenceClasses(k.band.tone)}`}
                  >
                    {k.reported ? `${k.band.label} · ${k.confidence}%` : "Missing"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">
                    {k.kpi.priority}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
