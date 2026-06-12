import { ConnectAmazonForm } from "@/components/dashboard/connect-amazon-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export default async function ConnectAmazonPage() {
  const clients = await prisma.client.findMany({
    orderBy: { brandName: "asc" },
    select: {
      id: true,
      brandName: true
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Connect Amazon Ads + SP-API</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          OAuth token exchange is represented by secure placeholders in this MVP. Tokens are encrypted
          before persistence and initial sync is queued after connection.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection Form</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length ? (
            <ConnectAmazonForm clients={clients} />
          ) : (
            <p className="text-sm text-slate-600">
              No clients found. Seed the database first with <code>npm run db:seed</code>.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
