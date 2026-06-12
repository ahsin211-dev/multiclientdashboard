"use client";

import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle?: string;
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
  showSyncButton?: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
  children?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  dateRange = "last30",
  onDateRangeChange,
  showSyncButton = false,
  onSync,
  isSyncing,
  children,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {children}

        {onDateRangeChange && (
          <Select value={dateRange} onValueChange={(v) => v && onDateRangeChange(v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="last14">Last 14 days</SelectItem>
              <SelectItem value="last30">Last 30 days</SelectItem>
              <SelectItem value="last60">Last 60 days</SelectItem>
              <SelectItem value="last90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        )}

        {showSyncButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-xs">
            3
          </Badge>
        </Button>
      </div>
    </div>
  );
}
