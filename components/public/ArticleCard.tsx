import Link from "next/link";
import { formatDate } from "@/lib/content";
import { gradFor, glyphFor } from "@/lib/categoryStyle";
import type { ArticleWithRelations } from "@/types";

interface Props {
  article: ArticleWithRelations;
  variant?: "card" | "mini" | "lead";
}

export default function ArticleCard({ article, variant = "card" }: Props) {
  const href = `/articulos/${article.slug}`;
  const catName = article.category?.name ?? "";
  const authorName = article.author?.name ?? "Redacción";

  const placeholder = article.featured_image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={article.featured_image_url} alt={article.featured_image_alt || ""} />
  ) : (
    <span className="glyph">{glyphFor(catName)}</span>
  );

  if (variant === "lead") {
    return (
      <Link className="lead" href={href}>
        <div className="ph" data-cat={catName} style={{ background: gradFor(catName) }}>
          {placeholder}
        </div>
        <div className="cat">{catName}</div>
        <h3>{article.title}</h3>
        {article.subtitle && <p>{article.subtitle}</p>}
        <div
          className="meta"
          style={{ marginTop: 14, fontSize: ".8rem", color: "var(--muted)" }}
        >
          {authorName} · {formatDate(article.published_at)} ·{" "}
          {article.reading_time_min} min de lectura
        </div>
      </Link>
    );
  }

  if (variant === "mini") {
    return (
      <Link className="mini" href={href}>
        <div className="ph" data-cat={catName} style={{ background: gradFor(catName) }}>
          {placeholder}
        </div>
        <div>
          <div className="cat" style={{ marginBottom: 7 }}>
            {catName}
          </div>
          <h4>{article.title}</h4>
          <div className="meta">
            {authorName} · {article.reading_time_min} min
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link className="card" href={href}>
      <div className="ph" data-cat={catName} style={{ background: gradFor(catName) }}>
        {placeholder}
      </div>
      <div className="body">
        <div>
          <span className="cat">{catName}</span>
        </div>
        <h3>{article.title}</h3>
        {article.subtitle && <p>{article.subtitle}</p>}
        <div className="meta">
          <span>{authorName}</span>·<span>{article.reading_time_min} min</span>
        </div>
      </div>
    </Link>
  );
}
