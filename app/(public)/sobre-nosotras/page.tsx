import { Suspense } from "react";
import type { Metadata } from "next";
import SubscribeForm from "@/components/public/SubscribeForm";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sobre nosotras — Conciencia Inquieta",
  description:
    "Conciencia Inquieta es un diario digital autogestionado que apuesta por la verdad con contexto, memoria y humanidad.",
  path: "/sobre-nosotras",
});

export default function SobreNosotrasPage() {
  return (
    <>
      <div className="wrap about-hero">
        <div className="kicker">Quiénes somos</div>
        <h1 className="wordmark">
          Conciencia <i>Inquieta</i>
        </h1>
        <p className="manifesto">
          Conciencia Inquieta es un diario digital autogestionado que nace desde
          la urgencia de pensar, sentir y actuar en un mundo atravesado por la
          desigualdad, la violencia y la manipulación informativa.
        </p>
        <p className="manifesto">
          No practicamos la neutralidad, sino la{" "}
          <strong>verdad con contexto, memoria y humanidad</strong>. Amplificamos
          voces silenciadas, incomodamos al poder y apostamos por una conciencia
          colectiva que despierte reflexión, empatía y acción.
        </p>
      </div>
      <div className="wrap section">
        <div className="values">
          <div className="value">
            <div className="n">01</div>
            <h4>No neutrales</h4>
            <p>
              Tomamos partido por la dignidad. Contamos de qué lado está el poder
              y de qué lado, la gente.
            </p>
          </div>
          <div className="value">
            <div className="n">02</div>
            <h4>Con memoria</h4>
            <p>
              Nombrar es un acto de justicia. Volvemos sobre lo que otros
              prefieren olvidar.
            </p>
          </div>
          <div className="value">
            <div className="n">03</div>
            <h4>En comunidad</h4>
            <p>
              Sin grandes dueños ni anunciantes. Nos sostienen quienes nos leen y
              nos acompañan.
            </p>
          </div>
        </div>
      </div>
      <div className="wrap section">
        <div className="subscribe">
          <div>
            <h2>Súmate a la conciencia colectiva</h2>
            <p>Cada suscripción hace posible un periodismo libre, sensible y valiente.</p>
          </div>
          <Suspense fallback={null}>
            <SubscribeForm source="about" dark />
          </Suspense>
        </div>
      </div>
    </>
  );
}
