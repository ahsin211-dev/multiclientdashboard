import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type InsightRow } from "@/lib/analytics/service";

type InsightListProps = {
  title: string;
  rows: InsightRow[];
};

export function InsightList({ title, rows }: InsightListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div key={row.title} className="rounded-lg border border-slate-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-slate-900">{row.title}</p>
              <p className="text-sm font-medium text-slate-500">{row.metric}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{row.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
