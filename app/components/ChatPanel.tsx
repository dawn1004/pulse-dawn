"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Flag, MoreVertical, ShieldAlert } from "lucide-react";
import { AVATARS } from "@/app/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TypingIndicatorBubble,
  TypingIndicatorHeader,
} from "./TypingIndicator";
import { cn } from "@/lib/utils";
import ChatEmojiPicker from "./ChatEmojiPicker";

export interface ChatMessage {
  id: number;
  mine: boolean;
  text: string;
}

export default function ChatPanel({
  messages,
  connected,
  peerTyping,
  videoBusy,
  nickname,
  avatar,
  onSend,
  onTypingChange,
  onStartVideo,
  onEnd,
  onReport,
  reportDisabled,
  className,
}: {
  messages: ChatMessage[];
  connected: boolean;
  peerTyping: boolean;
  videoBusy: boolean;
  nickname?: string;
  avatar?: string;
  onSend: (text: string) => void;
  onTypingChange: (active: boolean) => void;
  onStartVideo: () => void;
  onEnd: () => void;
  onReport?: () => void;
  reportDisabled?: boolean;
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const mood = avatar ? AVATARS.find((a) => a.id === avatar) : undefined;

  function pulseTyping() {
    if (!connected) return;
    isTypingRef.current = true;
    onTypingChange(true);
  }

  function stopTyping() {
    if (!connected || !isTypingRef.current) return;
    isTypingRef.current = false;
    onTypingChange(false);
  }

  function clearTypingIdleTimer() {
    if (typingIdleTimer.current) {
      clearTimeout(typingIdleTimer.current);
      typingIdleTimer.current = null;
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!connected) return;

    clearTypingIdleTimer();

    if (value.trim()) {
      pulseTyping();
      typingIdleTimer.current = setTimeout(() => stopTyping(), 2_500);
    } else {
      stopTyping();
    }
  }

  useEffect(() => {
    return () => {
      clearTypingIdleTimer();
      if (isTypingRef.current) onTypingChange(false);
    };
  }, [onTypingChange]);

  useEffect(() => {
    if (!connected) {
      clearTypingIdleTimer();
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingChange(false);
      }
    }
  }, [connected, onTypingChange]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function insertEmoji(emoji: string, refocusInput = true) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    handleDraftChange(next);
    const pos = start + emoji.length;
    requestAnimationFrame(() => {
      if (refocusInput) {
        input?.focus();
      }
      input?.setSelectionRange(pos, pos);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !connected) return;
    clearTypingIdleTimer();
    stopTyping();
    onSend(text);
    setDraft("");
  }

  return (
    <div
      className={cn(
        "absolute inset-y-0 right-0 z-20 flex w-full min-w-0 max-w-md flex-col overflow-hidden border-l border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl",
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {mood && (
            <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
              <Image
                src={mood.src}
                alt={mood.label}
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {nickname ?? "Stranger"}
              {mood && (
                <span className="font-normal text-zinc-400"> · {mood.label}</span>
              )}
            </p>
            <p className="text-xs text-zinc-500">
              {peerTyping ? (
                <TypingIndicatorHeader />
              ) : connected ? (
                "Connected"
              ) : (
                "Connecting…"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onStartVideo}
            disabled={!connected || videoBusy}
            className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm hover:border-zinc-500 disabled:opacity-40"
          >
            Video
          </button>
          <button
            onClick={onEnd}
            className="rounded-full bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-400"
          >
            End
          </button>
          {connected && onReport && (
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="rounded-full border-zinc-700 bg-transparent text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
                  aria-label="More options"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-44 border-zinc-700 bg-zinc-900 p-1 text-zinc-100"
              >
                <button
                  type="button"
                  disabled={reportDisabled}
                  onClick={() => {
                    setMenuOpen(false);
                    onReport();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-amber-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Flag className="size-4 shrink-0" />
                  Report user
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </header>

      {messages.length === 0 && (
        <div className="shrink-0 px-3 pt-3 min-w-0">
          <Alert className="min-w-0 rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-100">
            <ShieldAlert className="shrink-0 text-amber-400" />
            <AlertDescription className="min-w-0 text-xs leading-relaxed wrap-break-word text-amber-100/90">
              For your safety, please avoid sharing personal information with
              strangers. If you encounter inappropriate behavior, feel free to
              report the user.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <div className="space-y-2">
          {messages.length === 0 && (
            <div className="">
              <p className="mt-2 text-center text-sm text-zinc-500">
                Say hello. Messages are peer-to-peer and never stored.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm wrap-break-word ${
                  m.mine
                    ? "bg-emerald-400 text-zinc-950"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>

        {messages.length > 0 && (
          <div
            className="mt-2 flex h-11 shrink-0 items-end justify-start"
            aria-hidden={!peerTyping}
          >
            <div className={cn(!peerTyping && "invisible")}>
              <TypingIndicatorBubble nickname={nickname} />
            </div>
          </div>
        )}

      </div>

      <div className="relative shrink-0 border-t border-zinc-800">
        <form
          onSubmit={submit}
          className="flex items-center gap-1 p-3"
        >
          <ChatEmojiPicker
            disabled={!connected}
            onPick={(emoji) => insertEmoji(emoji, false)}
          />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onBlur={() => {
              clearTypingIdleTimer();
              stopTyping();
            }}
            placeholder={connected ? "Type a message…" : "Connecting…"}
            disabled={!connected}
            className="min-w-0 flex-1 rounded-full bg-zinc-900 px-4 py-2 text-sm outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!connected || !draft.trim()}
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
