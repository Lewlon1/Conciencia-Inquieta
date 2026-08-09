import { Suspense } from "react";
import type { Metadata } from "next";
import ContactForm from "@/components/public/ContactForm";
import PageHero from "@/components/public/PageHero";
import { pageMetadata } from "@/lib/seo";
import { SOCIAL, MAILTO } from "@/config/social";

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
        {/* ContactForm's failure state says "escríbenos directamente" — until
            now there was no address on the page to do that with. */}
        <p className="mt-8 text-center text-ci-ink/60">
          O escríbenos directamente a{" "}
          <a
            href={MAILTO}
            className="font-bold text-ci-ink underline decoration-ci-orange decoration-2 underline-offset-4 transition-colors hover:text-ci-orange"
          >
            {SOCIAL.email}
          </a>
          .
        </p>
      </section>
    </>
  );
}
