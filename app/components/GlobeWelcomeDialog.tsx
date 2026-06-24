"use client";

import { useState } from "react";
import { Globe, Heart, Shield, Sparkles } from "lucide-react";
import PulseMark from "@/app/components/EntryGate/PulseMark";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TIPS = [
  {
    icon: Heart,
    title: "Be kind",
    text: "Everyone here is a real person. A little warmth goes a long way.",
  },
  {
    icon: Globe,
    title: "Explore freely",
    text: "Tap a green dot to view a profile, then connect when you're ready.",
  },
  {
    icon: Shield,
    title: "Stay safe",
    text: "Don't share personal details. Report anyone who makes you uncomfortable.",
  },
] as const;

export default function GlobeWelcomeDialog({
  open,
  nickname,
  onContinue,
}: {
  open: boolean;
  nickname?: string;
  onContinue: (dontShowAgain: boolean) => void;
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  function handleClose() {
    onContinue(dontShowAgain);
    setDontShowAgain(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent
        showCloseButton
        className={cn(
          "gap-0 overflow-hidden border-border p-0 sm:max-w-md pb-6",
          "bg-card/95 shadow-2xl backdrop-blur-xl"
        )}
      >
        <div className="relative overflow-hidden border-b border-border/60 bg-linear-to-br from-primary/15 via-card to-card px-6 pt-6 pb-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-8 size-32 rounded-full bg-emerald-500/10 blur-2xl"
          />
          <DialogHeader className="relative gap-2.5 text-center sm:text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-[0_0_24px_rgba(52,211,153,0.15)]">
              <PulseMark />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wider text-primary uppercase">
                You&apos;re live on the globe
              </p>
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                {nickname ? `Welcome, ${nickname}` : "Welcome to Pulse"}
              </DialogTitle>
              <DialogDescription className="text-sm leading-snug text-muted-foreground">
                You&apos;ve joined a living map of strangers from around the
                world. Say hello, share a moment, and remember — kindness
                matters here.
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-2 px-6 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Before you explore
          </div>
          <ul className="space-y-2">
            {TIPS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex gap-2.5 rounded-xl border border-border/50 bg-muted/30 p-2.5"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/20 px-6 py-3 sm:flex-col sm:justify-stretch">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1">
            <Checkbox
              id="welcome-dismiss"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label
              htmlFor="welcome-dismiss"
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              Don&apos;t show this again
            </Label>
          </label>
          <Button
            type="button"
            size="lg"
            className="w-full rounded-full font-semibold shadow-[0_0_20px_rgba(52,211,153,0.25)]"
            onClick={handleClose}
          >
            Explore the globe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
