import { TAGS } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { MAX_TAGS } from "./steps";

type Step3Props = {
  tags: string[];
  onTagsChange: (values: string[]) => void;
};

export default function Step3({ tags, onTagsChange }: Step3Props) {
  function handleTagsChange(values: string[]) {
    if (values.length <= MAX_TAGS) onTagsChange(values);
  }

  return (
    <FieldSet className="flex h-full flex-col gap-4">
      <Field className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <FieldDescription className="!mt-0">
            Tap to select — max {MAX_TAGS} tags.
          </FieldDescription>
          <Badge
            variant={tags.length >= MAX_TAGS ? "default" : "secondary"}
            className="tabular-nums"
          >
            {tags.length}/{MAX_TAGS}
          </Badge>
        </div>

        <ScrollArea className="mt-2 min-h-0 flex-1 rounded-xl border border-border bg-muted/20 pr-3">
          <ToggleGroup
            type="multiple"
            value={tags}
            onValueChange={handleTagsChange}
            variant="outline"
            spacing={2}
            className="flex flex-wrap gap-2 p-3"
          >
            {TAGS.map((tag) => {
              const selected = tags.includes(tag);
              const disabled = !selected && tags.length >= MAX_TAGS;
              return (
                <ToggleGroupItem
                  key={tag}
                  value={tag}
                  disabled={disabled}
                  aria-label={tag}
                  aria-pressed={selected}
                  className={cn(
                    "h-8 rounded-full border px-3 capitalize shadow-sm",
                    "border-border bg-muted/40 text-foreground",
                    "hover:border-primary/50 hover:bg-muted/60",
                    "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-none",
                    disabled && "opacity-40"
                  )}
                >
                  {tag}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </ScrollArea>
      </Field>

      <Field className="shrink-0">
        <FieldLabel>Selected</FieldLabel>
        <div className="flex min-h-12 flex-wrap gap-1.5 rounded-xl border border-border bg-muted/20 p-3">
          {tags.length > 0 ? (
            tags.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="capitalize border-primary/50 bg-primary/15 text-primary"
              >
                #{t}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              Pick tags above — they&apos;ll show here.
            </span>
          )}
        </div>
      </Field>
    </FieldSet>
  );
}
