import { Suspense } from "react";
import type { Metadata } from "next";
import ContactForm from "@/components/public/ContactForm";
import PageHero from "@/components/public/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contacto — Conciencia Inquieta",
  description:
    "¿Una idea, una colaboración, una historia que merece ser contada? Escríbenos.",
  path: "/contacto",
});

export default function ContactoPage() {
  return (
    <>
      <PageHero
        kicker="Hablemos"
        title={
          <>
            Cuéntanos tu <span className="text-ci-orange">inquietud</span>
          </>
        }
        lead="¿Una idea, una colaboración, una historia que merece ser contada? Escríbenos."
      />
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-8">
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </section>
    </>
  );
}
