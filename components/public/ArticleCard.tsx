import Link from "next/link";
import type { CSSProperties } from "react";
import { gradFor, glyphFor, catClassFor } from "@/lib/categoryStyle";
import FocalImage from "@/components/public/FocalImage";
import type { ArticleWithRelations } from "@/types";

interface Props {
  article: ArticleWithRelations;
  variant?: "card" | "feature";
  style?: CSSProperties;
}

export default function ArticleCard({ article, variant = "card", style }: Props) {
  const href = `/articulos/${article.slug}`;
  const catName = article.category?.name ?? "";
  const authorName = article.author?.name ?? "Redacción";

  const placeholder = article.featured_image_url ? (
    <FocalImage
      src={article.featured_image_url}
      alt={article.featured_image_alt || ""}
      focalX={article.focal_x}
      focalY={article.focal_y}
      focalZoom={article.focal_zoom}
    />
  ) : (
    <span className="glyph">{glyphFor(catName)}</span>
  );

  if (variant === "feature") {
    return (
      <Link className="feature" href={href} style={style}>
        <div className="ph" data-cat={catName} style={{ background: gradFor(catName) }}>
          {placeholder}
        </div>
        <div className={catClassFor(catName)}>{catName}</div>
        <h3>{article.title}</h3>
        {article.subtitle && <p>{article.subtitle}</p>}
        <div className="meta">
          <span>{authorName}</span>·<span>{article.reading_time_min} min</span>
        </div>
      </Link>
    );
  }

  return (
    <Link className="card" href={href} style={style}>
      <div className="ph" data-cat={catName} style={{ background: gradFor(catName) }}>
        {placeholder}
      </div>
      <div className="body">
        <div>
          <span className={catClassFor(catName)}>{catName}</span>
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
