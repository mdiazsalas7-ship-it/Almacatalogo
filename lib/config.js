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
