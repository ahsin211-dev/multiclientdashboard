import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdsIntel — Amazon Ads Intelligence Platform",
  description: "Multi-client Amazon Advertising analytics, AI co-pilot, and performance intelligence for agencies and brands.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
