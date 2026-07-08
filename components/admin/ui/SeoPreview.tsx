interface SeoPreviewProps {
  title: string; // meta title (fallback to article title upstream — just render what's passed)
  description: string; // meta description
  slug: string; // article slug
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default function SeoPreview({
  title,
  description,
  slug,
}: SeoPreviewProps) {
  const hasTitle = title.trim().length > 0;
  const hasDescription = description.trim().length > 0;

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-[#6b6560]">
        Vista previa en Google
      </p>
      <div className="rounded-lg border border-[#e8e5df] bg-white p-3">
        <p className="truncate text-xs text-[#5f6368]">
          conciencia-inquieta.vercel.app › articulos › {slug || "…"}
        </p>
        <p
          className={`mt-0.5 truncate text-base ${
            hasTitle ? "text-[#1a0dab]" : "italic text-[#b8b0a4]"
          }`}
        >
          {hasTitle ? truncate(title, 60) : "Sin meta título"}
        </p>
        <p
          className={`mt-0.5 text-sm ${
            hasDescription ? "text-[#4d5156]" : "italic text-[#b8b0a4]"
          }`}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {hasDescription
            ? truncate(description, 160)
            : "Sin meta descripción"}
        </p>
      </div>
    </div>
  );
}
