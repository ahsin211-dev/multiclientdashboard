import { PageHeader } from "@/components/layout/page-header";
import { ConnectFlow } from "@/components/connect/connect-flow";
import { EmptyState } from "@/components/states/states";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db/prisma";
import { isAdsConfigured, isSpApiConfigured } from "@/lib/amazon/config";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ConnectAmazonPage({
  searchParams,
}: {
  searchParams: { clientId?: string };
}) {
  const ws = await getActiveWorkspace();
  const clients = ws
    ? await prisma.client.findMany({
        where: { workspaceId: ws.id },
        include: { connections: true },
        orderBy: { brandName: "asc" },
      })
    : [];

  const options = clients.map((c) => ({
    id: c.id,
    brandName: c.brandName,
    marketplace: c.marketplace,
    adsConnected: c.connections.some((x) => x.type === "ADS" && x.status === "CONNECTED"),
    spConnected: c.connections.some((x) => x.type === "SP_API" && x.status === "CONNECTED"),
  }));

  const liveMode = isAdsConfigured() || isSpApiConfigured();

  return (
    <>
      <PageHeader
        title="Connect Amazon"
        description="Authorize Amazon Advertising and Selling Partner APIs for a client."
        actions={
          <Badge variant={liveMode ? "success" : "warning"}>
            {liveMode ? "Live OAuth configured" : "Demo mode (placeholder OAuth)"}
          </Badge>
        }
      />

      {options.length === 0 ? (
        <EmptyState
          title="Create a client first"
          description="You need a client brand before connecting Amazon accounts."
          action={<NewClientDialog />}
        />
      ) : (
        <ConnectFlow clients={options} initialClientId={searchParams.clientId} />
      )}
    </>
  );
}
