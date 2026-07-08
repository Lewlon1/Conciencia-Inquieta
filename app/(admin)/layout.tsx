import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./admin.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Admin root layout. This is the ONLY place noindex lives — the public group
// has its own root layout and is indexable. Two root layouts (no shared
// app/layout.tsx) keep Tailwind Preflight confined to this admin.css chunk and
// force a full page reload on any admin<->public navigation, so the two design
// systems can never bleed into each other.
export const metadata: Metadata = {
  title: "Conciencia Inquieta — Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        {/* Fraunces + Newsreader load here (Inter still comes from next/font
            above) so the article editor's live preview can render the real
            published-article fonts. Weights mirror app/(public)/layout.tsx. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,900;1,9..144,400;1,9..144,600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
