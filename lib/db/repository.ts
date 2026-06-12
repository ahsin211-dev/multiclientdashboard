import { demoWorkspace, getDemoClientById, getDemoClients, type DemoClient, type DemoWorkspace } from "@/lib/data/demo";
import { prisma } from "@/lib/db/prisma";

const databaseConfigured = Boolean(process.env.DATABASE_URL);

function mergeClientShells(databaseClients: Array<{ id: string; brandName: string; marketplace: string; lastSyncAt: Date | null; syncStatus: string }>) {
  return databaseClients.map((client) => {
    const fallback = getDemoClients().find(
      (item) => item.brandName === client.brandName || item.id === client.id,
    );

    if (!fallback) {
      return null;
    }

    return {
      ...fallback,
      id: client.id,
      marketplace: client.marketplace as DemoClient["marketplace"],
      lastSyncAt: client.lastSyncAt?.toISOString() ?? fallback.lastSyncAt,
      syncStatus:
        client.syncStatus === "FAILED"
          ? "Failed"
          : client.syncStatus === "RUNNING"
            ? "Syncing"
            : "Connected",
    } satisfies DemoClient;
  }).filter(Boolean) as DemoClient[];
}

export async function getWorkspace(): Promise<DemoWorkspace> {
  if (!databaseConfigured || !prisma) {
    return demoWorkspace;
  }

  try {
    const workspace = await prisma.workspace.findFirst({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        clients: true,
      },
    });

    if (!workspace) {
      return demoWorkspace;
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      members: workspace.members.map((member) => ({
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role.charAt(0) + member.role.slice(1).toLowerCase() as DemoWorkspace["members"][number]["role"],
      })),
      clients: mergeClientShells(
        workspace.clients.map((client) => ({
          id: client.id,
          brandName: client.brandName,
          marketplace: client.marketplace,
          lastSyncAt: client.lastSyncAt,
          syncStatus: client.syncStatus,
        })),
      ),
    };
  } catch {
    return demoWorkspace;
  }
}

export async function getClients() {
  const workspace = await getWorkspace();
  return workspace.clients;
}

export async function getClient(clientId: string) {
  const clients = await getClients();
  return clients.find((client) => client.id === clientId) ?? getDemoClientById(clientId);
}
