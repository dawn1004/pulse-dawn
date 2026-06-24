"use client";

import { Check, Filter, Tags } from "lucide-react";
import { AVATARS } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PeerMapFilters } from "@/lib/filterPeers";
import { isPeerMapFilterActive } from "@/lib/filterPeers";
import { cn } from "@/lib/utils";

export default function MapPeerFilters({
  filters,
  onFiltersChange,
  hasTags,
}: {
  filters: PeerMapFilters;
  onFiltersChange: (filters: PeerMapFilters) => void;
  hasTags: boolean;
}) {
  const filtersActive = isPeerMapFilterActive(filters);

  return (
    <TooltipProvider delayDuration={200}>
      <Card
        size="sm"
        className={cn(
          "absolute bottom-4 left-1/2 z-10 max-w-[calc(100%-2rem)] -translate-x-1/2 border-border/60 bg-card/90 py-0 shadow-lg backdrop-blur supports-backdrop-filter:bg-card/80",
          filtersActive && "border-primary/30 ring-1 ring-primary/20"
        )}
        aria-label="Filter people on the map"
      >
        <CardContent className="space-y-2 px-3 py-2">
          <div className="flex  items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-primary" aria-hidden />
              <span className="text-xs font-semibold text-foreground max-md:hidden">
                Filter people
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col gap-1">
                  <Toggle
                    variant="outline"
                    size="sm"
                    pressed={filters.sharedTagsOnly}
                    disabled={!hasTags}
                    onPressedChange={(pressed) =>
                      onFiltersChange({
                        ...filters,
                        sharedTagsOnly: pressed,
                      })
                    }
                    className={cn(
                      "h-8 min-w-0 gap-1.5 px-2.5 text-xs font-medium transition-all",
                      filters.sharedTagsOnly
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.25)] hover:bg-emerald-500/25 hover:text-emerald-200 data-[state=on]:bg-emerald-500/20"
                        : "border-border/60 bg-background/50 text-muted-foreground hover:bg-muted/50"
                    )}
                    aria-label={
                      filters.sharedTagsOnly
                        ? "Shared interests filter is on"
                        : "Turn on shared interests filter"
                    }
                  >
                    {filters.sharedTagsOnly ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Tags className="size-3.5" />
                    )}
                    Shared interests
                    {filters.sharedTagsOnly && (
                      <span className="rounded-full bg-emerald-400 px-1.5 py-px text-[10px] font-bold text-zinc-950">
                        On
                      </span>
                    )}
                  </Toggle>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={10}
                className="max-w-[220px] text-center leading-snug"
              >
                {hasTags
                  ? "Show only people who share at least one of your interest tags."
                  : "Add interest tags to your profile to use this filter."}
              </TooltipContent>
            </Tooltip>

            <div className="flex min-w-28 flex-col gap-1">
              <Select
                value={filters.moodId ?? "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    moodId: value === "all" ? null : value,
                  })
                }
              >
                <SelectTrigger
                  id="mood-filter"
                  size="sm"
                  className={cn(
                    "h-8 w-full border-border/60 bg-background/50 text-xs",
                    filters.moodId &&
                      "border-primary/40 bg-primary/10 text-foreground"
                  )}
                >
                  <SelectValue placeholder="All moods" />
                </SelectTrigger>
                <SelectContent align="end" className="max-h-64">
                  <SelectItem value="all">All moods</SelectItem>
                  {AVATARS.map((mood) => (
                    <SelectItem key={mood.id} value={mood.id}>
                      {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
