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
import type { ProductPerformance } from "@/lib/types";

interface ProductTableProps {
  products: ProductPerformance[];
}

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No product data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ASIN</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">CVR</TableHead>
              <TableHead className="text-right">Ad Spend</TableHead>
              <TableHead className="text-right">TACOS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.asin}>
                <TableCell className="font-mono text-xs">{p.asin}</TableCell>
                <TableCell className="max-w-[200px] truncate">{p.title}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                <TableCell className="text-right">{formatNumber(p.orders)}</TableCell>
                <TableCell className="text-right">{formatPercent(p.conversion, 2)}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.adSpend)}</TableCell>
                <TableCell className="text-right">{formatPercent(p.tacos)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
