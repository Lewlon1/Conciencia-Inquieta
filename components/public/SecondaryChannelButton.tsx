import { ArrowRight } from "lucide-react";

// Channel-agnostic secondary CTA — WhatsApp Channel vs Telegram is an open
// decision (MVP Build plan). Renders nothing until both env vars are set, so
// it's safe to place on every page ahead of that decision.
interface Props {
  /** Set when the button sits on a black or ink surface. */
  onDark?: boolean;
}

const labels: Record<string, string> = {
  whatsapp: "Síguenos en WhatsApp",
  telegram: "Síguenos en Telegram",
};

export default function SecondaryChannelButton({ onDark = false }: Props) {
  const type = process.env.NEXT_PUBLIC_SECONDARY_CHANNEL_TYPE;
  const url = process.env.NEXT_PUBLIC_SECONDARY_CHANNEL_URL;
  const label = type ? labels[type] : null;

  if (!url || !label) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-event="channel_click"
      data-channel={type}
      className={`inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
        onDark
          ? "border-white/30 text-white hover:border-ci-orange hover:text-ci-orange"
          : "border-ci-ink/20 text-ci-ink hover:border-ci-orange hover:bg-ci-orange"
      }`}
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}
