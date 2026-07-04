import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Términos y condiciones — Conciencia Inquieta",
  description: "Términos y condiciones de Conciencia Inquieta.",
  path: "/terminos",
});

export default function TerminosPage() {
  return (
    <>
      <div className="wrap page-intro">
        <div className="kicker">Legal</div>
        <h1>Términos y condiciones</h1>
        <p>Última actualización: pendiente de fecha de publicación.</p>
      </div>
      <div className="wrap section">
        <div className="note" style={{ marginBottom: 28 }}>
          <span>⚠️</span>
          <div>
            <b>Plantilla, no asesoría legal.</b> Revisar antes de publicar en
            producción — ver la nota en{" "}
            <Link href="/privacidad">Aviso legal y privacidad</Link>.
          </div>
        </div>

        <div className="prose">
          <h2>1. Objeto</h2>
          <p>
            Estos términos regulan el acceso y uso de Conciencia Inquieta, un
            diario digital autogestionado. El uso del sitio implica la aceptación
            de estos términos.
          </p>

          <h2>2. Contenido editorial</h2>
          <p>
            Los artículos, textos e imágenes publicados son propiedad de
            Conciencia Inquieta o de sus autoras, salvo que se indique lo
            contrario. Puedes compartir enlaces libremente; la reproducción total
            o parcial del contenido requiere autorización previa, citando siempre
            la fuente.
          </p>

          <h2>3. Uso aceptable</h2>
          <p>
            No está permitido usar el sitio para fines ilícitos, ni intentar
            acceder sin autorización a sistemas o datos que no te correspondan.
          </p>

          <h2>4. Enlaces a terceros</h2>
          <p>
            El sitio puede enlazar a redes sociales u otros servicios externos. No
            nos hacemos responsables del contenido o las políticas de privacidad
            de esos servicios de terceros.
          </p>

          <h2>5. Disponibilidad</h2>
          <p>
            Hacemos lo posible por mantener el sitio disponible, pero no
            garantizamos un funcionamiento ininterrumpido ni libre de errores.
          </p>

          <h2>6. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos cuando sea necesario. La fecha de la
            última actualización aparece al inicio de esta página.
          </p>

          <h2>7. Ley aplicable</h2>
          <p>
            <b>TODO:</b> confirmar jurisdicción y ley aplicable según dónde se
            constituya legalmente el proyecto.
          </p>

          <h2>8. Contacto</h2>
          <p>
            Para cualquier duda sobre estos términos, escríbenos desde{" "}
            <Link href="/contacto">Contacto</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
