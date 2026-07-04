import { Suspense } from "react";
import type { Metadata } from "next";
import ContactForm from "@/components/public/ContactForm";
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
      <div className="wrap page-intro">
        <div className="kicker">Hablemos</div>
        <h1>Contacto</h1>
        <p>
          ¿Una idea, una colaboración, una historia que merece ser contada?
          Escríbenos.
        </p>
      </div>
      <div className="wrap section">
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </>
  );
}
