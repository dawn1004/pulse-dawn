"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { REPORT_REASONS } from "@/app/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { ReportReason } from "@/lib/moderation";
import { cn } from "@/lib/utils";

export default function ReportUserDialog({
  open,
  nickname,
  submitting,
  error,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  nickname?: string;
  submitting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: ReportReason, details?: string) => void;
}) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");

  function reset() {
    setReason("");
    setDetails("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const canSubmit =
    reason !== "" &&
    (reason !== "other" || details.trim().length > 0) &&
    !submitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "gap-0 overflow-hidden border-border p-0 sm:max-w-md",
          "bg-card/95 shadow-2xl backdrop-blur-xl pb-4"
        )}
      >
        <div className="border-b border-border/60 px-6 pt-6 pb-4">
          <DialogHeader className="gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <ShieldAlert className="size-5" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Report {nickname ?? "user"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Select a reason for your report. Reports are reviewed and may
              result in temporary restrictions for repeat offenders.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-4">
          <RadioGroup
            value={reason}
            onValueChange={(value) => setReason(value as ReportReason)}
            className="space-y-2"
          >
            {REPORT_REASONS.map((item) => (
              <Label
                key={item.id}
                htmlFor={`report-${item.id}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition hover:bg-muted/40",
                  reason === item.id &&
                    "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                )}
              >
                <RadioGroupItem
                  value={item.id}
                  id={`report-${item.id}`}
                  disabled={submitting}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </Label>
            ))}
          </RadioGroup>

          {reason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="report-details" className="text-sm">
                Please describe the issue
              </Label>
              <Textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="What happened?"
                disabled={submitting}
                maxLength={500}
                className="min-h-24 resize-none"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit}
            onClick={() => {
              if (reason === "") return;
              onSubmit(reason, reason === "other" ? details.trim() : undefined);
            }}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
