import Link from "next/link";

// Server component. new Date().getFullYear() resolves at build (static page).
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-top">
          <div>
            <div className="wm2">
              Conciencia <i>Inquieta</i>
            </div>
            <p className="bio">
              Diario digital autogestionado. No practicamos la neutralidad, sino
              la verdad con contexto, memoria y humanidad.
            </p>
          </div>
          <div className="fcol">
            <h5>Secciones</h5>
            <Link href="/articulos">Artículos</Link>
            <Link href="/sobre-nosotras">Sobre nosotras</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href="/unete">Únete</Link>
          </div>
          <div className="fcol">
            <h5>Legal</h5>
            <Link href="/privacidad">Aviso legal &amp; privacidad</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/terminos">Términos</Link>
          </div>
          <div className="fcol">
            <h5>Boletín</h5>
            <p className="bio" style={{ marginTop: 0 }}>
              Las conversaciones que faltan, en tu correo.
            </p>
            <form className="fnews" action="/api/suscribir" method="post">
              <input
                type="email"
                name="email"
                placeholder="Tu email"
                aria-label="Email para el boletín"
                required
              />
              <input type="hidden" name="source" value="footer" />
              <button type="submit">Unirme</button>
            </form>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {year} Conciencia Inquieta · Hecho con conciencia</span>
          <div className="fsoc">
            <a href="#">Instagram</a>
            <a href="#">X</a>
            <a href="#">TikTok</a>
            <a href="#">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
