"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DOT_LEGEND = [
  {
    label: "Available",
    swatchClass: "bg-emerald-400",
    description:
      "This stranger is online and free to chat. Tap their dot to view their profile and connect.",
  },
  {
    label: "In conversation",
    swatchClass: "bg-amber-500",
    description:
      "Currently in a conversation with another stranger. You can view their profile, but can't connect yet.",
  },
  {
    label: "Restricted",
    swatchClass: "bg-red-500",
    description:
      "This user has been reported and cannot receive connections. Their dot appears red on the map.",
  },
  {
    label: "Connected",
    swatchClass: "bg-blue-500",
    description:
      "You're actively connected with this person. Their dot stays blue for the duration of your chat.",
  },
] as const;

export default function MapDotLegend() {
  return (
    <TooltipProvider delayDuration={200}>
      <Card
        size="sm"
        className="w-full border-border/60 bg-card/90 py-0 shadow-lg backdrop-blur supports-backdrop-filter:bg-card/80"
        aria-label="Map dot colors"
      >
        <CardContent className="flex flex-col gap-1.5 px-3 py-1.5">
          <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Dot colors
          </span>
          <div className="flex flex-col gap-1">
            {DOT_LEGEND.map(({ label, swatchClass, description }) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full cursor-help items-center gap-2 rounded-sm text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span
                      className={cn(
                        "size-2.5 shrink-0 rounded-full border-2 border-white/90",
                        swatchClass
                      )}
                      aria-hidden
                    />
                    {label}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  sideOffset={10}
                  className="max-w-[240px] bg-background/90 text-center leading-snug text-muted-foreground backdrop-blur supports-backdrop-filter:bg-background/80"
                >
                  {description}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
