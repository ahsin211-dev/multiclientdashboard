import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SQPRow {
  id: string;
  query: string;
  impressionShare: number;
  clickShare: number;
  purchaseShare: number;
  ppcSpend: number;
  ppcSales: number;
  acos: number;
  recommendedAction: string;
  reason: string;
}

function actionVariant(action: string): "success" | "warning" | "danger" | "default" {
  if (action === "SCALE") return "success";
  if (action === "CUT") return "danger";
  if (action === "TEST") return "warning";
  return "default";
}

export function SQPTable({ rows }: { rows: SQPRow[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">SQP Analyzer</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Query</TableHead>
            <TableHead>Impr Share</TableHead>
            <TableHead>Click Share</TableHead>
            <TableHead>Purchase Share</TableHead>
            <TableHead>PPC Spend</TableHead>
            <TableHead>PPC Sales</TableHead>
            <TableHead>ACOS</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.query}</TableCell>
              <TableCell>{(row.impressionShare * 100).toFixed(2)}%</TableCell>
              <TableCell>{(row.clickShare * 100).toFixed(2)}%</TableCell>
              <TableCell>{(row.purchaseShare * 100).toFixed(2)}%</TableCell>
              <TableCell>${row.ppcSpend.toFixed(2)}</TableCell>
              <TableCell>${row.ppcSales.toFixed(2)}</TableCell>
              <TableCell>{(row.acos * 100).toFixed(2)}%</TableCell>
              <TableCell>
                <Badge variant={actionVariant(row.recommendedAction)}>{row.recommendedAction}</Badge>
              </TableCell>
              <TableCell className="text-slate-600">{row.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
