"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export type TurnstileHandle = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError?: () => void;
  className?: string;
  size?: "normal" | "compact";
};

const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget(
    { onVerify, onExpire, onError, className, size = "normal" },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });
    const [scriptReady, setScriptReady] = useState(false);

    useEffect(() => {
      callbacksRef.current = { onVerify, onExpire, onError };
    }, [onVerify, onExpire, onError]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      if (
        !scriptReady ||
        !SITE_KEY ||
        !containerRef.current ||
        widgetIdRef.current
      ) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        size,
        theme: "dark",
        callback: (token) => callbacksRef.current.onVerify(token),
        "expired-callback": () => {
          callbacksRef.current.onExpire();
        },
        "error-callback": () => {
          callbacksRef.current.onError?.();
        },
      });

      return () => {
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [scriptReady, size]);

    if (!SITE_KEY) return null;

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
        <div
          ref={containerRef}
          className={cn("flex justify-center", className)}
        />
      </>
    );
  }
);

export default TurnstileWidget;
