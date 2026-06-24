import { cn } from "@/lib/utils";

function TypingDots({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const dotSize = size === "sm" ? "size-1" : "size-1.5";

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full bg-current animate-typing-dot",
            dotSize
          )}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

export function TypingIndicatorHeader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-emerald-400",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span>Typing</span>
      <TypingDots size="sm" />
    </span>
  );
}

export function TypingIndicatorBubble({
  nickname,
  className,
}: {
  nickname?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex justify-start", className)}
      role="status"
      aria-live="polite"
      aria-label={nickname ? `${nickname} is typing` : "Stranger is typing"}
    >
      <div className="inline-flex max-w-[80%] items-center gap-2.5 rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-3 text-zinc-400 shadow-sm ring-1 ring-white/5">
        <TypingDots size="md" className="text-zinc-400" />
        {nickname && (
          <span className="sr-only">{nickname} is typing</span>
        )}
      </div>
    </div>
  );
}
