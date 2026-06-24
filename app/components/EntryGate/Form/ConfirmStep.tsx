"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AVATARS } from "@/app/constants";
import { cn } from "@/lib/utils";

type ConfirmStepProps = {
  usingSavedProfile: boolean;
  nickname: string;
  aboutMe: string;
  avatar: string;
  tags: string[];
  agreePrivacy: boolean;
  age18Plus: boolean;
  saveInfo: boolean;
  showConfirmError: boolean;
  onAgreePrivacyChange: (checked: boolean) => void;
  onAge18PlusChange: (checked: boolean) => void;
  onSaveInfoChange: (checked: boolean) => void;
  onClearSavedData: () => void;
};

export default function ConfirmStep({
  usingSavedProfile,
  nickname,
  aboutMe,
  avatar,
  tags,
  agreePrivacy,
  age18Plus,
  saveInfo,
  showConfirmError,
  onAgreePrivacyChange,
  onAge18PlusChange,
  onSaveInfoChange,
  onClearSavedData,
}: ConfirmStepProps) {
  const privacyError = showConfirmError && !agreePrivacy;
  const ageError = showConfirmError && !age18Plus;
  const mood = AVATARS.find((a) => a.id === avatar);
  const visibleTags = tags.slice(0, 4);
  const extraTags = tags.length - visibleTags.length;

  return (
    <div className="space-y-4">
      {usingSavedProfile ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            {mood && (
              <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted/40">
                <Image
                  src={mood.src}
                  alt={mood.label}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="truncate font-medium text-foreground">
                  {nickname}
                </p>
                {mood && (
                  <p className="text-xs text-muted-foreground">
                    {mood.label} mood
                  </p>
                )}
              </div>
              {aboutMe.trim() && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {aboutMe.trim()}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {visibleTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-2 py-0 text-[10px] capitalize"
                  >
                    {tag}
                  </Badge>
                ))}
                {extraTags > 0 && (
                  <Badge
                    variant="secondary"
                    className="px-2 py-0 text-[10px] text-muted-foreground"
                  >
                    +{extraTags} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end border-t border-border/60 pt-3">
            <button
              type="button"
              onClick={onClearSavedData}
              className="text-xs text-muted-foreground underline-offset-2 transition hover:text-destructive hover:underline"
            >
              Clear saved data
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          You&apos;re about to enter the{" "}
          <span className="font-medium text-foreground">Pulse globe</span>,
          where you&apos;ll meet and interact with strangers from around the
          world. Please be kind to others — and don&apos;t hesitate to report
          anyone who behaves badly.
        </p>
      )}

      <div className={cn("space-y-2", usingSavedProfile ? "pt-1" : "pt-4")}>
        <Label className="text-muted-foreground">Before you enter</Label>
        <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-muted/40",
              privacyError && "ring-1 ring-destructive/50"
            )}
          >
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => onAgreePrivacyChange(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border border-border accent-primary"
            />
            <span className="text-sm leading-snug text-muted-foreground">
              I agree to the{" "}
              <span className="text-foreground underline underline-offset-2">
                privacy policy
              </span>
            </span>
          </label>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-muted/40",
              ageError && "ring-1 ring-destructive/50"
            )}
          >
            <input
              type="checkbox"
              checked={age18Plus}
              onChange={(e) => onAge18PlusChange(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border border-border accent-primary"
            />
            <span className="text-sm leading-snug text-muted-foreground">
              I confirm that I am 18 years or older
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-muted/40">
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={(e) => onSaveInfoChange(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border border-border accent-primary"
            />
            <span className="text-sm leading-snug text-muted-foreground">
              Save my info on this device so I don&apos;t have to fill the form
              again next time
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
