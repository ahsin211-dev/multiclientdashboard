export async function syncProducts(clientId: string) {
  return {
    clientId,
    resource: "products",
    syncedAt: new Date().toISOString(),
    mode: "placeholder",
  };
}

export async function syncSalesMetrics(clientId: string) {
  return {
    clientId,
    resource: "salesMetrics",
    syncedAt: new Date().toISOString(),
    mode: "placeholder",
  };
}
