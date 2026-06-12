import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SearchTermPerformance } from "@/lib/analytics/types";
import { formatCurrency, formatNumber, formatPercent, formatRatio } from "@/lib/utils";

export function SearchTermTable({ searchTerms }: { searchTerms: SearchTermPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search terms</CardTitle>
        <CardDescription>Terms with spend, sales, and efficiency signals.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>ACOS</TableHead>
              <TableHead>ROAS</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Signal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchTerms.map((term) => (
              <TableRow key={term.query}>
                <TableCell className="font-medium text-slate-950">{term.query}</TableCell>
                <TableCell>{formatCurrency(term.spend)}</TableCell>
                <TableCell>{formatCurrency(term.sales)}</TableCell>
                <TableCell>{formatPercent(term.acos)}</TableCell>
                <TableCell>{formatRatio(term.roas)}</TableCell>
                <TableCell>{formatNumber(term.clicks)}</TableCell>
                <TableCell>{formatNumber(term.orders)}</TableCell>
                <TableCell>
                  <Badge variant={term.acos > 45 ? "danger" : term.roas > 4 ? "success" : "neutral"}>
                    {term.acos > 45 ? "Cut" : term.roas > 4 ? "Scale" : "Monitor"}
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
