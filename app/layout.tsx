import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdsIQ — Amazon Ads & Sales Intelligence",
  description:
    "Multi-client Amazon Advertising + Selling Partner analytics with an AI co-pilot.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
