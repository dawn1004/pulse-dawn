import Image from "next/image";
import { AVATARS } from "@/app/constants";
import {
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type Step2Props = {
  avatar: string;
  onAvatarChange: (value: string) => void;
};

export default function Step2({ avatar, onAvatarChange }: Step2Props) {
  return (
    <FieldSet>
      <FieldLegend className="sr-only">Choose your mood avatar</FieldLegend>
      <RadioGroup
        value={avatar}
        onValueChange={onAvatarChange}
        className="grid grid-cols-3 gap-3 sm:grid-cols-4"
      >
        {AVATARS.map((item) => {
          const selected = avatar === item.id;
          return (
            <FieldLabel
              key={item.id}
              htmlFor={`avatar-${item.id}`}
              className={cn(
                "!w-auto cursor-pointer flex-col items-center gap-2 rounded-xl border border-border bg-input/40 p-3 transition hover:bg-input/70",
                selected &&
                  "border-primary bg-accent ring-1 ring-primary/40",
              )}
            >
              <RadioGroupItem
                value={item.id}
                id={`avatar-${item.id}`}
                className="sr-only"
              />
              <div className="relative size-14 overflow-hidden rounded-full bg-muted ring-2 ring-background">
                <Image
                  src={item.src}
                  alt={item.label}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  selected ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </FieldLabel>
          );
        })}
      </RadioGroup>
    </FieldSet>
  );
}
