import { Suspense } from "react";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import SubscribeForm from "@/components/public/SubscribeForm";
import SecondaryChannelButton from "@/components/public/SecondaryChannelButton";
import { getPublishedArticles, getCategories } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

// ISR: the list refreshes ~1 min after a new article is published (option A).
export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Conciencia Inquieta — diario digital autogestionado",
  description:
    "Noticias que importan, conversaciones que faltan, reflexiones que sanan. Diario digital independiente: derechos humanos, feminismo, Latinoamérica, cultura y más.",
  path: "/",
});

const tickerPrompts = [
  "¿Quién cuida a quienes cuidan?",
  "¿De qué no se habla en las noticias?",
  "¿Qué memoria estamos dejando morir?",
  "¿A quién incomoda la verdad?",
  "¿Cómo se sana en colectivo?",
  "¿Qué voces faltan en esta conversación?",
];

export default async function HomePage() {
  const [articles, categories] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
  ]);

  const lead = articles[0];
  const sideMinis = articles.slice(1, 4);
  const latest = articles.slice(0, 6);
  const tickerSet = [...tickerPrompts, ...tickerPrompts];

  return (
    <>
      <div className="wrap">
        <div className="masthead">
          <div className="kicker">Diario digital autogestionado</div>
          <h1 className="wordmark">
            Conciencia <i>Inquieta</i>
          </h1>
          <p className="tagline">
            Noticias que importan, conversaciones que faltan, reflexiones que
            sanan.
          </p>
        </div>
      </div>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-row">
          {tickerSet.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      {lead && (
        <div className="wrap">
          <div className="front">
            <ArticleCard article={lead} variant="lead" />
            <div className="front-side">
              {sideMinis.map((a) => (
                <ArticleCard key={a.id} article={a} variant="mini" />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="wrap section">
        <div className="shead">
          <h2>
            Lo último<span className="dot">.</span>
          </h2>
          <a className="seeall" href="/articulos">
            Ver todos los artículos →
          </a>
        </div>
        {latest.length > 0 ? (
          <div className="grid">
            {latest.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <p
            style={{
              color: "var(--muted)",
              fontFamily: "var(--read)",
              fontStyle: "italic",
            }}
          >
            Todavía no hay artículos publicados.
          </p>
        )}
      </div>

      <div className="wrap section">
        <div className="shead">
          <h2>
            Explora por tema<span className="dot">.</span>
          </h2>
        </div>
        <div className="chips">
          {categories.map((c) => (
            <a key={c.id} className="chip" href={`/categoria/${c.slug}`}>
              {c.name}
            </a>
          ))}
        </div>
      </div>

      <div className="wrap section">
        <div className="subscribe">
          <div>
            <h2>Un periodismo que no se calla necesita a su comunidad</h2>
            <p>
              Sin grandes anunciantes ni dueños. Suscríbete para recibir lo nuevo
              directamente en tu correo, sin algoritmos de por medio.
            </p>
            <div style={{ marginTop: 20 }}>
              <SecondaryChannelButton dark />
            </div>
          </div>
          <Suspense fallback={null}>
            <SubscribeForm source="home" dark />
          </Suspense>
        </div>
      </div>
    </>
  );
}
