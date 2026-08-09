import type { Metadata } from "next";
import "./public.css";
import Sidebar from "@/components/public/Sidebar";
import MobileNav from "@/components/public/MobileNav";
import MarqueeFooter from "@/components/public/MarqueeFooter";
import Analytics from "@/components/public/Analytics";
import { getCategories } from "@/lib/content";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { SOCIAL } from "@/config/social";

// Public root layout — its OWN <html>/<body>, indexable, imports only
// public.css. There is no shared app/layout.tsx: each route group keeps its
// own CSS chunk and a public<->admin navigation is a full page load, so the
// two design systems can't bleed into each other.
//
// Fonts load via <link>, all three from Google: Roboto (headlines, 700 for the
// small font-heading uses + 900 for display sizes), Syne, Plus Jakarta Sans.
// Roboto v51 ships as a single variable font, so naming two weights costs one
// file, not two. Now that Fontshare is gone, next/font/google would work here
// and would kill the render-blocking round trip — worth a later session.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Conciencia Inquieta — diario digital autogestionado",
    template: "%s",
  },
  description:
    "Noticias que importan, conversaciones que faltan, reflexiones que sanan.",
  icons: { icon: "/favicon.svg" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "es_ES" },
  twitter: { card: "summary_large_image" },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: new URL("/conciencia-logo.png", SITE_URL).toString(),
  description:
    "Diario digital autogestionado: verdad con contexto, memoria y humanidad.",
  email: SOCIAL.email,
  // sameAs is how search engines tie these profiles to the organisation.
  sameAs: [SOCIAL.instagram, SOCIAL.facebook],
};

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const categories = await getCategories();
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@700;900&family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Saltar al contenido
        </a>
        <Sidebar categories={categories} />
        <div className="md:ml-[72px]">
          <MobileNav categories={categories} />
          <main id="main" className="min-h-screen">
            {children}
          </main>
          <MarqueeFooter />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
