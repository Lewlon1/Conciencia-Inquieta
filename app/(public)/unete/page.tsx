import { Suspense } from "react";
import type { Metadata } from "next";
import { Info } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import SubscribeForm from "@/components/public/SubscribeForm";
import SecondaryChannelButton from "@/components/public/SecondaryChannelButton";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Únete — Conciencia Inquieta",
  description:
    "Suscríbete al boletín de Conciencia Inquieta: lo nuevo directamente en tu correo, sin algoritmos de por medio.",
  path: "/unete",
});

export default function UnetePage() {
  return (
    <>
      <PageHero
        kicker="Comunidad"
        title={
          <>
            Ú<span className="text-ci-orange">nete</span>
          </>
        }
        lead="Las redes son terreno prestado. Esto es lo que de verdad es tuyo: un email a la semana, directo a tu bandeja, sin depender de ningún algoritmo."
      />

      <section className="mx-auto max-w-2xl px-6 py-20 md:px-8">
        <Suspense fallback={null}>
          <SubscribeForm source="unete" />
        </Suspense>

        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-ci-purple/30 px-5 py-4 text-sm text-ci-ink/75">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong className="font-bold text-ci-ink">Sin spam:</strong> dejando
            tu email te sumas a la lista de Conciencia Inquieta. Un correo a la
            semana como mucho, y puedes darte de baja cuando quieras
            escribiéndonos.
          </p>
        </div>

        <div className="mt-10">
          <SecondaryChannelButton />
        </div>
      </section>
    </>
  );
}
