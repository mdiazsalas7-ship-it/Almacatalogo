"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import FotoProducto from "./FotoProducto";
import { MARCA, LEMA, PIE, CATEGORIAS, TALLAS, fmtPrecio } from "@/lib/config";

export default function Catalogo({ productos }) {
  const [cat, setCat] = useState("todo");
  const [talla, setTalla] = useState(null);

  const visibles = useMemo(
    () =>
      productos
        .filter((p) => cat === "todo" || p.categoria === cat)
        .filter(
          (p) => !talla || p.variants.some((v) => v.talla === talla && v.stock > 0)
        ),
    [productos, cat, talla]
  );

  return (
    <div className="contenedor ancho">
      <header style={{ padding: "30px 20px 8px", textAlign: "center" }}>
        <img
          src="/logo.jpg"
          alt={MARCA}
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            objectFit: "cover",
            margin: "0 auto 12px",
            border: "1px solid var(--linea-fuerte)",
          }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <h1 className="serif" style={{ fontSize: 26, letterSpacing: "0.14em" }}>
          {MARCA.toUpperCase()}
        </h1>
        <p style={{ fontSize: 12.5, color: "var(--piedra)", letterSpacing: "0.14em", marginTop: 6 }}>
          {LEMA}
        </p>
      </header>

      <nav
        className="sin-scrollbar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--hueso)",
          padding: "14px 20px 12px",
          borderBottom: "1px solid var(--linea)",
          display: "flex",
          gap: 8,
          overflowX: "auto",
        }}
      >
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            className={`chip ${cat === c.id ? "activo" : ""}`}
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </button>
        ))}
        <span style={{ width: 1, background: "var(--linea-fuerte)", margin: "4px 4px", flexShrink: 0 }} />
        {TALLAS.map((t) => (
          <button
            key={t}
            className={`chip ${talla === t ? "activo" : ""}`}
            onClick={() => setTalla(talla === t ? null : t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <main
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "20px 14px",
          padding: "20px 20px 48px",
        }}
      >
        {visibles.map((p) => {
          const agotado = p.variants.every((v) => v.stock === 0);
          const colores = [...new Set(p.variants.map((v) => v.color).filter(Boolean))];
          const disponibles = colores.length
            ? [colores.length + (colores.length === 1 ? " color" : " colores")]
            : [...new Set(p.variants.filter((v) => v.stock > 0).map((v) => v.talla))];
          return (
            <Link key={p.id} href={`/producto/${p.slug}`}>
              <div style={{ position: "relative", borderRadius: 3, overflow: "hidden" }}>
                <FotoProducto
                  imagen={p.imagenes?.[0]}
                  alt={p.nombre}
                  sizes="(max-width: 900px) 50vw, 240px"
                />
                {agotado && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "var(--hueso)",
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      padding: "4px 9px",
                      borderRadius: 999,
                    }}
                  >
                    AGOTADO
                  </span>
                )}
              </div>
              <p className="serif" style={{ fontSize: 15.5, margin: "10px 0 2px", lineHeight: 1.25 }}>
                {p.nombre}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 14.5, fontWeight: 500 }}>{fmtPrecio(p.precio)}</span>
                <span style={{ fontSize: 11.5, color: "var(--piedra)", letterSpacing: "0.06em" }}>
                  {agotado ? "" : disponibles.join(" · ")}
                </span>
              </div>
            </Link>
          );
        })}
      </main>

      {visibles.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--piedra)", padding: "20px 20px 60px", fontSize: 14 }}>
          Nada por aquí con ese filtro. Prueba otra talla o categoría.
        </p>
      )}

      <footer
        style={{
          textAlign: "center",
          padding: "0 20px 40px",
          fontSize: 12,
          color: "var(--piedra)",
          letterSpacing: "0.08em",
        }}
      >
        {PIE}
      </footer>
    </div>
  );
}
