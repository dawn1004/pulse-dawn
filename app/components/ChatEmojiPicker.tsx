"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { Theme, EmojiStyle, type EmojiClickData } from "emoji-picker-react";
import { Button } from "@/components/ui/button";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] w-full items-center justify-center rounded-xl bg-zinc-900 text-sm text-zinc-500">
      Loading emojis…
    </div>
  ),
});

const PICKER_HEIGHT = 380;

export default function ChatEmojiPicker({
  disabled,
  onPick,
}: {
  disabled?: boolean;
  onPick: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [pickerWidth, setPickerWidth] = useState(320);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    const el = panelRef.current;
    const updateWidth = () => setPickerWidth(el.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function handleEmojiClick(emojiData: EmojiClickData) {
    onPick(emojiData.emoji);
    setOpen(true);
  }

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 bottom-full left-0 z-30 w-full"
        >
          <div
            className="overflow-hidden rounded-t-xl border border-b-0 border-zinc-700 bg-zinc-900 shadow-2xl"
            onMouseDown={(e) => e.preventDefault()}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              emojiStyle={EmojiStyle.NATIVE}
              width={pickerWidth}
              height={PICKER_HEIGHT}
              lazyLoadEmojis
              searchPlaceholder="Search emoji"
              previewConfig={{ showPreview: true }}
            />
          </div>
        </div>
      )}

      <span ref={triggerRef} className="shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => setOpen((value) => !value)}
          className="rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 data-[state=open]:bg-zinc-800 data-[state=open]:text-zinc-100"
          aria-label={open ? "Close emoji picker" : "Open emoji picker"}
          aria-expanded={open}
          data-state={open ? "open" : "closed"}
        >
          <Smile className="size-5" />
        </Button>
      </span>
    </>
  );
}
