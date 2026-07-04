import Link from "next/link";

// In-group 404: rendered inside the (public) root layout (sidebar, fonts,
// footer) for notFound() calls from public pages — e.g. an unknown article or
// category slug.
export default function PublicNotFound() {
  return (
    <div className="wrap page-intro">
      <div className="kicker">404</div>
      <h1>No hemos encontrado esta página</h1>
      <p>
        Puede que el enlace esté roto o que el artículo ya no exista.{" "}
        <Link
          href="/"
          style={{ color: "var(--berenjena)", textDecoration: "underline" }}
        >
          Vuelve a la portada
        </Link>
        .
      </p>
    </div>
  );
}
