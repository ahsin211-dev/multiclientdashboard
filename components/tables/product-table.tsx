import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductPerformance } from "@/lib/analytics/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export function ProductTable({ products }: { products: ProductPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product performance</CardTitle>
        <CardDescription>Total revenue, ad contribution, and conversion health.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Ad sales</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>TACOS</TableHead>
              <TableHead>CVR</TableHead>
              <TableHead>Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="font-medium text-slate-950">{product.title}</div>
                  <div className="text-xs text-slate-500">{product.asin}</div>
                </TableCell>
                <TableCell>{formatCurrency(product.revenue)}</TableCell>
                <TableCell>{formatCurrency(product.adSales)}</TableCell>
                <TableCell>{formatCurrency(product.spend)}</TableCell>
                <TableCell>{formatPercent(product.tacos)}</TableCell>
                <TableCell>{formatPercent(product.cvr)}</TableCell>
                <TableCell>{formatNumber(product.orders)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
