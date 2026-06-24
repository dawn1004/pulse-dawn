"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export type TurnstileHandle = {
  execute: () => boolean;
  reset: () => void;
};

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError?: () => void;
};

const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, onExpire, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });
    const [scriptReady, setScriptReady] = useState(false);

    useEffect(() => {
      callbacksRef.current = { onVerify, onExpire, onError };
    }, [onVerify, onExpire, onError]);

    useImperativeHandle(ref, () => ({
      execute: () => {
        if (!widgetIdRef.current) return false;
        window.turnstile.execute(widgetIdRef.current);
        return true;
      },
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
        size: "invisible",
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
    }, [scriptReady]);

    if (!SITE_KEY) return null;

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
        {/* Off-screen mount — invisible widgets must stay in the DOM. */}
        <div
          ref={containerRef}
          className="pointer-events-none absolute size-0 overflow-hidden"
          aria-hidden
        />
      </>
    );
  }
);

export default TurnstileWidget;
