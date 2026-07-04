// Analytics globals. ciTrack is installed by components/public/Analytics.tsx
// and called from client components (SubscribeForm, ArticleTracker) and
// delegated data-event clicks. plausible/umami/fbq are injected by their
// respective third-party scripts. Ambient (no import/export) so these augment
// the global Window.
interface Window {
  ciTrack?: (event: string, props?: Record<string, string>) => void;
  plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  umami?: { track: (event: string, props?: Record<string, string>) => void };
  fbq?: (...args: unknown[]) => void;
}
