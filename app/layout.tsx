import type { Metadata } from "next";

import "@/app/globals.css";

import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  title: "Amazon Ads Intelligence MVP",
  description: "Multi-client Amazon Ads and sales intelligence platform for agencies and brands.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
