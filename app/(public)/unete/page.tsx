import { Suspense } from "react";
import type { Metadata } from "next";
import SubscribeForm from "@/components/public/SubscribeForm";
import SecondaryChannelButton from "@/components/public/SecondaryChannelButton";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Únete — Conciencia Inquieta",
  description:
    "Suscríbete al boletín de Conciencia Inquieta: lo nuevo directamente en tu correo, sin algoritmos de por medio.",
  path: "/unete",
});

export default function UnetePage() {
  return (
    <>
      <div className="wrap page-intro">
        <div className="kicker">Comunidad</div>
        <h1>Únete</h1>
        <p>
          Las redes son terreno prestado. Esto es lo que de verdad es tuyo: un
          email a la semana, directo a tu bandeja, sin depender de ningún
          algoritmo.
        </p>
      </div>
      <div className="wrap section">
        <div className="form">
          <Suspense fallback={null}>
            <SubscribeForm source="unete" />
          </Suspense>
        </div>
        <div className="note" style={{ marginTop: 10 }}>
          <span>ℹ️</span>
          <div>
            <b>Doble confirmación:</b> tras dejar tu email recibirás un mensaje
            para confirmar. Así nos aseguramos de que de verdad quieres estar
            aquí — y de que tu bandeja de entrada no se llena de nada que no hayas
            pedido.
          </div>
        </div>
        <div style={{ marginTop: 28 }}>
          <SecondaryChannelButton />
        </div>
      </div>
    </>
  );
}
