import { Suspense } from "react";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import LatestCarousel from "@/components/public/LatestCarousel";
import QuestionTicker from "@/components/public/QuestionTicker";
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

export default async function HomePage() {
  const [articles, categories] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
  ]);

  const lead = articles[0];
  const trio = articles.slice(1, 4);
  const latest = articles.slice(0, 6);

  return (
    <>
      <QuestionTicker />

      {lead ? (
        <div className="hero-question">
          <div className="hero-question-inner">
            <div className="kicker">Una pregunta cada semana</div>
            <h1 className="hq-title">
              ¿Quién cuida a quienes <em>cuidan?</em>
            </h1>
            <p className="hq-sub">
              Cada semana abrimos una conversación que las noticias no hacen.
              Esta es la de ahora.
            </p>
            <div className="hq-actions">
              <a className="btn-dark" href={`/articulos/${lead.slug}`}>
                Leer el reportaje →
              </a>
              <span className="hq-note">
                {lead.category?.name}
                {lead.category?.name && " · "}
                {lead.reading_time_min} min de lectura
              </span>
            </div>
          </div>
        </div>
      ) : (
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
      )}

      {trio.length > 0 && (
        <div className="wrap section">
          <div className="shead">
            <h2>
              Conversaciones abiertas<span className="dot">.</span>
            </h2>
            <a className="seeall" href="#temas">
              Explora por tema →
            </a>
          </div>
          <div className="feature-trio">
            {trio.map((a) => (
              <ArticleCard key={a.id} article={a} variant="feature" />
            ))}
          </div>
        </div>
      )}

      <div className="wrap section">
        <LatestCarousel articles={latest} />
      </div>

      <div className="wrap section" id="temas">
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
