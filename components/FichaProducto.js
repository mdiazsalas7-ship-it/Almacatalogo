"use client";
import { useState } from "react";
import Link from "next/link";
import FotoProducto from "./FotoProducto";
import { MARCA, WHATSAPP, fmtPrecio } from "@/lib/config";

export default function FichaProducto({ producto: p }) {
  const [talla, setTalla] = useState(null);

  const v = talla ? p.variants.find((x) => x.talla === talla) : null;
  const agotadoTotal = p.variants.every((x) => x.stock === 0);
  const sku = v ? v.sku : p.id.toUpperCase();
  const msg = encodeURIComponent(
    `Hola, me interesa ${p.nombre} (${sku})${talla ? `, talla ${talla}` : ""}`
  );
  const fotos = p.imagenes?.length ? p.imagenes : [null];

  return (
    <div className="contenedor">
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--hueso)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid var(--linea)",
        }}
      >
        <Link href="/" aria-label="Volver al catálogo" style={{ fontSize: 20, lineHeight: 1 }}>
          ←
        </Link>
        <span className="serif" style={{ fontSize: 17, letterSpacing: "0.06em" }}>
          {MARCA}
        </span>
      </div>

      <div
        className="sin-scrollbar"
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory" }}
      >
        {fotos.map((img, i) => (
          <div key={i} style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}>
            <FotoProducto imagen={img} alt={`${p.nombre} — foto ${i + 1}`} sizes="480px" />
          </div>
        ))}
      </div>
      {fotos.length > 1 && (
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--piedra)",
            letterSpacing: "0.1em",
            marginTop: 8,
          }}
        >
          DESLIZA · {fotos.length} FOTOS
        </p>
      )}

      <div style={{ padding: "20px 20px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
          <h1 className="serif" style={{ fontSize: 26, lineHeight: 1.15 }}>{p.nombre}</h1>
          <span style={{ fontSize: 20, fontWeight: 500, whiteSpace: "nowrap" }}>
            {fmtPrecio(p.precio)}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--piedra)", letterSpacing: "0.1em", margin: "6px 0 20px" }}>
          {p.id.toUpperCase()}
        </p>

        <p style={{ fontSize: 13, color: "#6E6A5E", marginBottom: 8, letterSpacing: "0.04em" }}>
          Talla
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {p.variants.map((x) => (
            <button
              key={x.sku}
              className={`chip ${talla === x.talla ? "activo" : ""}`}
              disabled={x.stock === 0}
              onClick={() => setTalla(x.talla)}
            >
              {x.talla}
            </button>
          ))}
        </div>
        {v && v.stock <= 2 && (
          <p style={{ fontSize: 12, color: "var(--alerta)", marginBottom: 4 }}>
            {v.stock === 1 ? "Última pieza en esta talla" : `Quedan ${v.stock} en esta talla`}
          </p>
        )}

        <a
          className={`boton-wa ${agotadoTotal ? "apagado" : ""}`}
          href={agotadoTotal ? undefined : `https://wa.me/${WHATSAPP}?text=${msg}`}
          target="_blank"
          rel="noreferrer"
          style={{ marginTop: 16 }}
        >
          {agotadoTotal
            ? "Agotado"
            : talla
            ? `Pedir talla ${talla} por WhatsApp`
            : "Pedir por WhatsApp"}
        </a>
        {!talla && !agotadoTotal && (
          <p style={{ fontSize: 12, color: "var(--piedra)", textAlign: "center", marginTop: 8 }}>
            Elige tu talla para incluirla en el mensaje
          </p>
        )}

        {p.descripcion && (
          <p style={{ fontSize: 15, lineHeight: 1.65, margin: "28px 0 24px", color: "var(--tinta-suave)" }}>
            {p.descripcion}
          </p>
        )}

        <div style={{ borderTop: "1px solid var(--linea-fuerte)" }}>
          {[
            ["Tela", p.tela],
            ["Modelo", p.modelo],
            ["Cuidado", p.cuidado],
          ]
            .filter(([, val]) => val)
            .map(([k, val]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--linea)",
                  fontSize: 13.5,
                }}
              >
                <span style={{ width: 90, color: "var(--piedra)", letterSpacing: "0.06em", flexShrink: 0 }}>
                  {k}
                </span>
                <span style={{ color: "var(--tinta-suave)" }}>{val}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
