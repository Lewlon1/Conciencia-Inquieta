import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Política de cookies — Conciencia Inquieta",
  description: "Política de cookies de Conciencia Inquieta.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <>
      <PageHero
        kicker="Legal"
        title="Cookies"
        lead="Última actualización: pendiente de fecha de publicación."
      />
      <div className="mx-auto max-w-[var(--maxread)] px-6 py-16 md:px-8">
        <div className="mb-10 flex items-start gap-3 rounded-2xl bg-ci-orange/20 px-5 py-4 text-sm text-ci-ink/80">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <b className="font-bold text-ci-ink">
              Plantilla, no asesoría legal.
            </b>{" "}
            Revisar antes de publicar en producción — ver la nota en{" "}
            <Link href="/privacidad" className="underline">
              Aviso legal y privacidad
            </Link>
            .
          </p>
        </div>

        <div className="prose">
          <h2>¿Qué usamos exactamente?</h2>
          <p>
            Conciencia Inquieta está pensada para usar el mínimo posible de
            cookies:
          </p>
          <ul>
            <li>
              <b>Analítica propia sin cookies.</b> Medimos las visitas con un
              sistema propio, alojado en nuestra base de datos, que no usa cookies
              ni almacena tu dirección IP. Para contar visitantes únicos sin
              identificarte, generamos un identificador temporal que cambia cada
              día y no permite reconstruir quién eres — no requiere tu
              consentimiento.
            </li>
            <li>
              <b>Preferencia de cookies.</b> Cuando aceptas o rechazas el aviso de
              cookies, guardamos esa elección en tu navegador (usando{" "}
              <code>localStorage</code>, no una cookie) para no volver a
              preguntarte en cada visita.
            </li>
            <li>
              <b>Píxel de Meta (opcional, con tu permiso).</b> Si aceptas el aviso
              de cookies, activamos el Píxel de Meta, que sí usa cookies de
              terceros de Meta para medir el rendimiento de nuestras campañas en
              redes sociales. No se activa hasta que aceptas, y puedes rechazarlo
              o desactivarlo borrando tu elección del navegador.
            </li>
          </ul>

          <h2>¿Cómo cambio mi elección?</h2>
          <p>
            Borra los datos de sitio almacenados para
            conciencia-inquieta.vercel.app desde la configuración de tu navegador,
            o vacía el almacenamiento local del sitio — el aviso de cookies
            volverá a aparecer en tu próxima visita.
          </p>

          <h2>Más información</h2>
          <p>
            Consulta nuestra <Link href="/privacidad">política de privacidad</Link>{" "}
            para saber qué se hace con los datos que sí tratamos (boletín,
            formulario de contacto).
          </p>
        </div>
      </div>
    </>
  );
}
