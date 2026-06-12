import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { SearchTermPerformance } from "@/lib/types";

interface SearchTermTableProps {
  terms: SearchTermPerformance[];
  title?: string;
}

export function SearchTermTable({ terms, title = "Search Terms" }: SearchTermTableProps) {
  if (terms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No search term data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">ACOS</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.map((t) => (
              <TableRow key={t.query}>
                <TableCell className="font-medium">{t.query}</TableCell>
                <TableCell className="text-right">{formatNumber(t.impressions)}</TableCell>
                <TableCell className="text-right">{formatNumber(t.clicks)}</TableCell>
                <TableCell className="text-right">{formatCurrency(t.spend)}</TableCell>
                <TableCell className="text-right">{formatCurrency(t.sales)}</TableCell>
                <TableCell className="text-right">{formatPercent(t.acos)}</TableCell>
                <TableCell className="text-right">{formatNumber(t.roas, 2)}x</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
