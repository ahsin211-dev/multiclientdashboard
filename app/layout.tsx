import type { Metadata } from "next";

import "@/app/globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Amazon Ads Intelligence MVP",
  description: "Multi-client Amazon Ads + SP-API intelligence dashboard"
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clients = await prisma.client.findMany({
    orderBy: { brandName: "asc" },
    select: {
      id: true,
      brandName: true
    }
  });

  return (
    <html lang="en">
      <body>
        <AppShell clients={clients}>{children}</AppShell>
      </body>
    </html>
  );
}
