const TICKER_PROMPTS = [
  "¿Quién cuida a quienes cuidan?",
  "¿De qué no se habla en las noticias?",
  "¿Qué memoria estamos dejando morir?",
  "¿A quién incomoda la verdad?",
  "¿Cómo se sana en colectivo?",
  "¿Qué voces faltan en esta conversación?",
];

// Decorative infinite marquee — duplicated once so the 34s loop (see
// .ticker-row in public.css) wraps seamlessly at translateX(-50%).
export default function QuestionTicker() {
  const prompts = [...TICKER_PROMPTS, ...TICKER_PROMPTS];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-row">
        {prompts.map((prompt, i) => (
          <span key={i}>{prompt}</span>
        ))}
      </div>
    </div>
  );
}
