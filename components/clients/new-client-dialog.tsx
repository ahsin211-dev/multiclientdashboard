"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MARKETPLACES = ["US", "CA", "MX", "UK", "DE", "FR", "IT", "ES", "JP", "AU"];

export function NewClientDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [brandName, setBrandName] = React.useState("");
  const [marketplace, setMarketplace] = React.useState("US");
  const [loading, setLoading] = React.useState(false);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, marketplace }),
      });
      if (res.ok) {
        const json = await res.json();
        setOpen(false);
        setBrandName("");
        router.push(`/clients/${json.id}/settings`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new client</DialogTitle>
          <DialogDescription>
            Create a client brand. You can connect Amazon accounts and run a sync
            from the client settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand name</Label>
            <Input
              id="brand"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Acme Supplements"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Marketplace</Label>
            <Select value={marketplace} onValueChange={setMarketplace}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose ref={closeRef} asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !brandName.trim()}>
              {loading ? "Creating…" : "Create client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
