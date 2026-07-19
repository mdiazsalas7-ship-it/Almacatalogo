"use client";
import { useState } from "react";

// Muestra la miniatura y, si aún no existe (la extensión Resize Images
// es asíncrona), cae al original sin romper la página.
export default function FotoProducto({ imagen, alt, ratio = "3 / 4", sizes }) {
  const [src, setSrc] = useState(imagen?.thumb || imagen?.url || null);

  if (!src) {
    return (
      <div
        style={{
          aspectRatio: ratio,
          background: "var(--linea)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--piedra)",
          fontSize: 12,
          letterSpacing: "0.1em",
        }}
      >
        SIN FOTO
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      sizes={sizes}
      style={{ aspectRatio: ratio, objectFit: "cover", width: "100%" }}
      onError={() => {
        if (imagen?.url && src !== imagen.url) setSrc(imagen.url);
      }}
    />
  );
}
