// ── Cambia estos valores por los de tu marca ──
export const MARCA = "A&E Boutique";
export const LEMA = "MODA FEMENINA"; // cambia el lema por el tuyo
export const PIE = "PEDIDOS POR WHATSAPP · ENVÍOS A TODO EL PAÍS";

// Tu número con código de país, sin + ni espacios. Ej. México: 52155...
export const WHATSAPP = "584124771213";

export const CATEGORIAS = [
  { id: "todo", label: "Todo" },
  { id: "blusas", label: "Blusas" },
  { id: "vestidos", label: "Vestidos" },
  { id: "pantalones", label: "Pantalones" },
];

export const TALLAS = ["S", "M", "L"];

export const fmtPrecio = (n) => "$" + Number(n).toLocaleString("es-MX");

// ── Diccionario de colores: nombre escrito en el admin → color visual ──
// Si escribes un color que no está aquí, sale como punto neutro.
// Agrega los tuyos siguiendo el patrón.
export const COLORES_VISUALES = {
  rojo: "#9B1B30",
  vino: "#6B1524",
  rosa: "#F2B8C6",
  fucsia: "#C4356F",
  beige: "#C9B79C",
  crema: "#EDE8DC",
  blanco: "#FFFFFF",
  negro: "#1F1F1F",
  gris: "#9A9A96",
  azul: "#8FB8DE",
  marino: "#1F2436",
  celeste: "#BBD7EE",
  verde: "#5E7C5A",
  oliva: "#77794F",
  menta: "#BFDCC8",
  pistacho: "#C6D3A0",
  amarillo: "#E8C95A",
  mostaza: "#C79A2E",
  naranja: "#D97941",
  terracota: "#B05A3C",
  morado: "#6E5A8E",
  lila: "#C9B8DC",
  cafe: "#6E4F3A",
  marron: "#6E4F3A",
  camel: "#B08D57",
  dorado: "#C9A227",
  plateado: "#C4C4C8",
};

export const colorVisual = (nombre) => {
  if (!nombre) return null;
  const clave = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return COLORES_VISUALES[clave] ?? "#D8D3C6";
};
