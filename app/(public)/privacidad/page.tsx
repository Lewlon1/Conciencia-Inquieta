import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Aviso legal y privacidad — Conciencia Inquieta",
  description: "Aviso legal y política de privacidad de Conciencia Inquieta.",
  path: "/privacidad",
});

export default function PrivacidadPage() {
  return (
    <>
      <div className="wrap page-intro">
        <div className="kicker">Legal</div>
        <h1>Aviso legal y privacidad</h1>
        <p>Última actualización: pendiente de fecha de publicación.</p>
      </div>
      <div className="wrap section">
        <div className="note" style={{ marginBottom: 28 }}>
          <span>⚠️</span>
          <div>
            <b>Plantilla, no asesoría legal.</b> Este texto describe honestamente
            qué datos trata Conciencia Inquieta y con qué herramientas, pero no ha
            sido revisado por una persona abogada. Antes de publicar el sitio en
            producción, debe revisarse — en particular, los datos identificativos
            del responsable (marcados como TODO) y cualquier obligación específica
            de tu jurisdicción.
          </div>
        </div>

        <div className="prose">
          <h2>1. Responsable del tratamiento</h2>
          <p>
            <b>TODO:</b> nombre o razón social, NIF/CIF, domicilio y email de
            contacto de quien opera Conciencia Inquieta. Estos datos deben
            completarse antes del lanzamiento.
          </p>

          <h2>2. Qué datos tratamos y para qué</h2>
          <p>
            <b>Boletín por email.</b> Si te suscribes en{" "}
            <Link href="/unete">Únete</Link> o en cualquier formulario del sitio,
            tu email se envía a MailerLite (proveedor de email marketing) para
            gestionar el envío del boletín, con doble confirmación (double
            opt-in): no recibirás nada hasta que confirmes desde tu propia bandeja
            de entrada.
          </p>
          <p>
            <b>Formulario de contacto.</b> Si escribes desde{" "}
            <Link href="/contacto">Contacto</Link>, tu nombre, email y mensaje se
            guardan en nuestra base de datos (Supabase) para poder responderte. No
            se usan con ningún otro fin.
          </p>
          <p>
            <b>Analítica.</b> Medimos el uso del sitio con un sistema de analítica
            propio, sin cookies, alojado en nuestra base de datos (Supabase). No
            usa cookies, no almacena direcciones IP ni identifica a personas
            concretas: para contar visitantes únicos generamos un identificador
            diario, anónimo e irreversible. Por eso no requiere consentimiento
            bajo el RGPD.
          </p>
          <p>
            <b>Píxel de Meta.</b> Si lo aceptas en el aviso de cookies, activamos
            el Píxel de Meta para medir el rendimiento de campañas en redes
            sociales. No se activa hasta que das tu consentimiento explícito.
          </p>

          <h2>3. Legitimación</h2>
          <p>
            El tratamiento se basa en tu consentimiento explícito (suscripción al
            boletín, aceptación del Píxel) o en la ejecución de una solicitud tuya
            (formulario de contacto).
          </p>

          <h2>4. Encargados y destinatarios</h2>
          <p>
            Usamos los siguientes proveedores para operar el sitio, cada uno como
            encargado de tratamiento de los datos que le corresponden:
          </p>
          <ul>
            <li>
              <b>MailerLite</b> — gestión del boletín de email
            </li>
            <li>
              <b>Supabase</b> — base de datos del sitio: contenido editorial,
              mensajes de contacto y la analítica propia sin cookies
            </li>
            <li>
              <b>Vercel</b> — alojamiento (hosting) del sitio
            </li>
            <li>
              <b>Meta</b> — Píxel de Meta, solo tras consentimiento
            </li>
          </ul>
          <p>
            Algunos de estos proveedores pueden procesar datos fuera del Espacio
            Económico Europeo; en ese caso, se apoyan en las garantías legales
            correspondientes (cláusulas contractuales tipo u otras).
          </p>

          <h2>5. Conservación</h2>
          <p>
            Los datos del boletín se conservan mientras sigas suscrito/a. Los
            mensajes de contacto se conservan el tiempo necesario para atenderlos
            y con fines de registro interno.
          </p>

          <h2>6. Tus derechos</h2>
          <p>
            Puedes ejercer tus derechos de acceso, rectificación, supresión,
            oposición, limitación y portabilidad escribiendo a{" "}
            <b>TODO: email de contacto para privacidad</b>. También puedes darte
            de baja del boletín en cualquier momento desde el enlace incluido en
            cada email.
          </p>

          <h2>7. Contacto</h2>
          <p>
            Para cualquier duda sobre esta política, escríbenos desde{" "}
            <Link href="/contacto">Contacto</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
