"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

const MARKETPLACES = [
  { value: "US", label: "🇺🇸 United States" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "MX", label: "🇲🇽 Mexico" },
  { value: "UK", label: "🇬🇧 United Kingdom" },
  { value: "DE", label: "🇩🇪 Germany" },
  { value: "FR", label: "🇫🇷 France" },
  { value: "IT", label: "🇮🇹 Italy" },
  { value: "ES", label: "🇪🇸 Spain" },
  { value: "JP", label: "🇯🇵 Japan" },
  { value: "AU", label: "🇦🇺 Australia" },
];

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    brandName: "",
    marketplace: "US",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.brandName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      toast.success("Client created!", { description: `${form.brandName} has been added to your workspace.` });
      // In production, POST to /api/clients with workspace ID
      setTimeout(() => {
        router.push("/clients");
      }, 1000);
    } catch {
      toast.error("Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Add New Client" subtitle="Connect a new Amazon brand to your workspace" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Client Name *</Label>
                  <Input
                    id="name"
                    className="mt-1"
                    placeholder="e.g. TechGadgets Pro"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Internal name for this account</p>
                </div>

                <div>
                  <Label htmlFor="brandName">Brand Name *</Label>
                  <Input
                    id="brandName"
                    className="mt-1"
                    placeholder="e.g. TechGadgets"
                    value={form.brandName}
                    onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Amazon brand/seller name</p>
                </div>

                <div>
                  <Label>Marketplace *</Label>
                  <Select
                    value={form.marketplace}
                    onValueChange={(v) => setForm((p) => ({ ...p, marketplace: v ?? "US" }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETPLACES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    className="mt-1"
                    placeholder="e.g. Focus on SP campaigns, heavy Q4 spender..."
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="flex-1 gap-2">
                    {loading ? "Creating..." : "Create Client"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
