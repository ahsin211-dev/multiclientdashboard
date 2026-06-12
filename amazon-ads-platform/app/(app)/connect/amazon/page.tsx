"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Link2,
  ShoppingCart,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const steps = [
  {
    number: 1,
    title: "Select Client",
    description: "Choose which client account to connect",
    completed: true,
  },
  {
    number: 2,
    title: "Connect Amazon Ads API",
    description: "Authorize access to campaign and keyword data",
    completed: false,
  },
  {
    number: 3,
    title: "Connect SP-API",
    description: "Authorize access to sales and inventory data",
    completed: false,
  },
  {
    number: 4,
    title: "Initial Sync",
    description: "Fetch and normalize your historical data",
    completed: false,
  },
  {
    number: 5,
    title: "Generate Audit",
    description: "AI-powered account audit and recommendations",
    completed: false,
  },
];

export default function ConnectAmazonPage() {
  const [connectingAds, setConnectingAds] = useState(false);
  const [connectingSP, setConnectingSP] = useState(false);

  const connectAds = async () => {
    setConnectingAds(true);
    toast.info("Redirecting to Amazon...", {
      description: "You'll authorize the Advertising API connection",
    });
    await new Promise((r) => setTimeout(r, 1500));
    const adsClientId = process.env.NEXT_PUBLIC_AMAZON_ADS_CLIENT_ID || "";
    if (adsClientId) {
      window.location.href = `/api/amazon/oauth/ads?clientId=client-techgadgets`;
    } else {
      toast.error("Amazon Ads API not configured", {
        description: "Add AMAZON_ADS_CLIENT_ID to your environment variables",
      });
      setConnectingAds(false);
    }
  };

  const connectSP = async () => {
    setConnectingSP(true);
    toast.info("Redirecting to Amazon...", {
      description: "You'll authorize the SP-API connection",
    });
    await new Promise((r) => setTimeout(r, 1500));
    toast.error("SP-API not configured", {
      description: "Add AMAZON_SP_API_CLIENT_ID to environment variables",
    });
    setConnectingSP(false);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Connect Amazon Account" subtitle="Link Amazon APIs to start syncing data" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress Steps */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-0">
                {steps.map((step, i) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          step.completed
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.completed ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                      </div>
                      <p className="text-xs text-center mt-1 max-w-16 text-muted-foreground leading-tight">
                        {step.title}
                      </p>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${step.completed ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Connection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Amazon Ads API */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-orange-100">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Amazon Advertising API</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-0.5">Required</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription>
                  Access campaign data, keyword performance, search term reports, and ad metrics across Sponsored Products, Brands, and Display.
                </CardDescription>
                <ul className="space-y-1">
                  {["Campaign & Ad Group data", "Keyword performance", "Search term reports", "Ad metrics (ACOS, ROAS, CTR)", "Budget & bid management"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={connectAds}
                  disabled={connectingAds}
                  className="w-full gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  {connectingAds ? "Connecting..." : "Connect Amazon Ads"}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>

            {/* SP-API */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-100">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Selling Partner API (SP-API)</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-0.5">Recommended</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription>
                  Access total sales data, inventory, product catalog, and Amazon Brand Analytics including Search Query Performance reports.
                </CardDescription>
                <ul className="space-y-1">
                  {["Total sales & revenue", "Orders & units data", "Product catalog & inventory", "Brand Analytics (SQP)", "Buy box win rate"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={connectSP}
                  disabled={connectingSP}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  {connectingSP ? "Connecting..." : "Connect SP-API"}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Environment Variables Info */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Required Environment Variables</p>
              <div className="font-mono text-xs space-y-1 text-muted-foreground">
                {[
                  "AMAZON_ADS_CLIENT_ID",
                  "AMAZON_ADS_CLIENT_SECRET",
                  "AMAZON_ADS_REDIRECT_URI",
                  "AMAZON_SP_API_CLIENT_ID",
                  "AMAZON_SP_API_CLIENT_SECRET",
                ].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="text-amber-500">$</span>
                    {v}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Add these to your <code className="text-xs bg-background px-1 py-0.5 rounded">.env</code> file or Vercel environment variables.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
