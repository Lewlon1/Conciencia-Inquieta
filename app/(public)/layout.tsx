import type { Metadata } from "next";
import "./public.css";
import Sidebar from "@/components/public/Sidebar";
import Topbar from "@/components/public/Topbar";
import Footer from "@/components/public/Footer";
import NavOverlay from "@/components/public/NavOverlay";
import Analytics from "@/components/public/Analytics";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

// Public root layout — its OWN <html>/<body>, indexable, imports only
// public.css. There is no shared app/layout.tsx: this keeps the hand-written
// reset out of the admin (Tailwind) chunk. Fonts load via <link> to Google
// Fonts (as the Astro site did) — public.css references the families by name.
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
  logo: new URL("/favicon.svg", SITE_URL).toString(),
  description:
    "Diario digital autogestionado: verdad con contexto, memoria y humanidad.",
};

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,900;1,9..144,400;1,9..144,600&family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap"
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
        <div className="app">
          <Sidebar />
          <div className="main">
            <Topbar />
            <main id="main">{children}</main>
            <Footer />
          </div>
        </div>
        <NavOverlay />
        <Analytics />
      </body>
    </html>
  );
}
