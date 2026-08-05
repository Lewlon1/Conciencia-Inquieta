// Decorative infinite marquee of CI's own editorial questions. Kept from the
// pre-redesign site — this is Marie's copy, not template filler — but restyled
// into the new black/orange language and reusing the same .marquee-track
// utility as the footer wordmark. Duplicated once so the loop wraps seamlessly
// at translateX(-50%).

const TICKER_PROMPTS = [
  "¿Quién cuida a quienes cuidan?",
  "¿De qué no se habla en las noticias?",
  "¿Qué memoria estamos dejando morir?",
  "¿A quién incomoda la verdad?",
  "¿Cómo se sana en colectivo?",
  "¿Qué voces faltan en esta conversación?",
];

function Row() {
  return (
    <span className="inline-flex whitespace-nowrap">
      {TICKER_PROMPTS.map((prompt, i) => (
        <span
          key={i}
          className="font-display text-base font-bold text-white after:px-6 after:text-ci-orange after:content-['•']"
        >
          {prompt}
        </span>
      ))}
    </span>
  );
}

export default function QuestionTicker() {
  return (
    <div
      className="overflow-hidden border-y border-white/10 bg-black py-4"
      aria-hidden="true"
    >
      <div className="marquee-track">
        <Row />
        <Row />
      </div>
    </div>
  );
}
