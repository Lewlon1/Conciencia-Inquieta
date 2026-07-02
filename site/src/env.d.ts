/// <reference path="../.astro/types.d.ts" />

interface Window {
  ciTrack?: (event: string, props?: Record<string, string>) => void;
}
