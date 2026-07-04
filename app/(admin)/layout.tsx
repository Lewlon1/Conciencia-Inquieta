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
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
