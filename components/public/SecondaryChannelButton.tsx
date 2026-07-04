// Channel-agnostic secondary CTA — WhatsApp Channel vs Telegram is an open
// decision (MVP Build plan). Renders nothing until both env vars are set, so
// it's safe to place on every page ahead of that decision.
interface Props {
  dark?: boolean;
}

const labels: Record<string, string> = {
  whatsapp: "Síguenos en WhatsApp →",
  telegram: "Síguenos en Telegram →",
};

export default function SecondaryChannelButton({ dark = false }: Props) {
  const type = process.env.NEXT_PUBLIC_SECONDARY_CHANNEL_TYPE;
  const url = process.env.NEXT_PUBLIC_SECONDARY_CHANNEL_URL;
  const label = type ? labels[type] : null;

  if (!url || !label) return null;

  return (
    <a
      className={`btn-line ${dark ? "on-dark" : ""}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-event="channel_click"
      data-channel={type}
    >
      {label}
    </a>
  );
}
