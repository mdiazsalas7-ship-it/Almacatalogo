"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import FotoProducto from "./FotoProducto";
import { MARCA, WHATSAPP, fmtPrecio, colorVisual } from "@/lib/config";

export default function FichaProducto({ producto: p }) {
  const [talla, setTalla] = useState(null);

  // Colores presentes en las variantes (null si la prenda es de un solo color)
  const colores = useMemo(() => {
    const set = [...new Set(p.variants.map((v) => v.color).filter(Boolean))];
    return set.length ? set : null;
  }, [p.variants]);

  const [color, setColor] = useState(colores?.[0] ?? null);

  // Variantes visibles según el color elegido
  const variantesActivas = useMemo(
    () => (color ? p.variants.filter((v) => v.color === color) : p.variants),
    [p.variants, color]
  );

  // Al cambiar de color, la talla elegida puede no existir o estar agotada
  function elegirColor(c) {
    setColor(c);
    if (talla) {
      const sigue = p.variants.some(
        (v) => v.color === c && v.talla === talla && v.stock > 0
      );
      if (!sigue) setTalla(null);
    }
  }

  const v = talla ? variantesActivas.find((x) => x.talla === talla) : null;
  const agotadoTotal = variantesActivas.every((x) => x.stock === 0);

  // Fotos del color elegido; si no hay etiquetadas para ese color,
  // caemos a las fotos generales (sin color), y si tampoco hay, a todas.
  const fotos = useMemo(() => {
    const todas = p.imagenes?.length ? p.imagenes : [null];
    if (!color) return todas;
    const delColor = todas.filter((img) => img?.color === color);
    if (delColor.length) return delColor;
    const generales = todas.filter((img) => !img?.color);
    return generales.length ? generales : todas;
  }, [p.imagenes, color]);

  const sku = v ? v.sku : p.id.toUpperCase();
  const msg = encodeURIComponent(
    `Hola, me interesa ${p.nombre} (${sku})` +
      (color ? `, color ${color}` : "") +
      (talla ? `, talla ${talla}` : "")
  );

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
        key={color ?? "unico"}
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

        {colores && (
          <>
            <p style={{ fontSize: 13, color: "#6E6A5E", marginBottom: 8, letterSpacing: "0.04em" }}>
              Color
            </p>
            <div className="sin-scrollbar" style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
              {colores.map((c) => {
                const sinStock = !p.variants.some((v) => v.color === c && v.stock > 0);
                return (
                  <button
                    key={c}
                    className={`chip ${color === c ? "activo" : ""}`}
                    disabled={sinStock}
                    onClick={() => elegirColor(c)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: colorVisual(c),
                      border: "0.5px solid " + (color === c ? "var(--hueso)" : "var(--linea-fuerte)"),
                      flexShrink: 0,
                    }} />
                    {c}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <p style={{ fontSize: 13, color: "#6E6A5E", marginBottom: 8, letterSpacing: "0.04em" }}>
          Talla
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {variantesActivas.map((x) => (
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
            {v.stock === 1 ? "Última pieza" : `Quedan ${v.stock}`}
            {color ? ` en ${color} talla ${talla}` : " en esta talla"}
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
            ? color ? `Agotado en ${color}` : "Agotado"
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
