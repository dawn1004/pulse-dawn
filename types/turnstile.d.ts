export {};

declare global {
  interface TurnstileRenderOptions {
    sitekey: string;
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact" | "invisible";
    callback?: (token: string) => void;
    "expired-callback"?: () => void;
    "error-callback"?: () => void;
  }

  interface TurnstileApi {
    render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
    remove: (widgetId: string) => void;
    reset: (widgetId: string) => void;
    execute: (widgetId: string) => void;
  }

  interface Window {
    turnstile: TurnstileApi;
  }
}
