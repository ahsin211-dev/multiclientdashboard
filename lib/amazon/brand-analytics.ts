export async function syncSQPData(clientId: string) {
  return {
    clientId,
    resource: "sqp",
    syncedAt: new Date().toISOString(),
    mode: "placeholder",
  };
}

export function normalizeMetrics<T>(metrics: T[]) {
  return metrics;
}
