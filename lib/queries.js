import { db } from "./firebase";
import {
  collection, getDocs, query, where,
} from "firebase/firestore";

// Trae todos los productos activos con sus variantes.
// Se ejecuta en el servidor durante el build / revalidación,
// no en cada visita — por eso las lecturas de Firestore son mínimas.
// Nota: ordenamos en JS y no en la consulta, porque combinar
// where + orderBy en Firestore exige un índice compuesto.
export async function getProductos() {
  const q = query(collection(db, "products"), where("activo", "==", true));
  const snap = await getDocs(q);

  const productos = await Promise.all(
    snap.docs.map(async (d) => {
      const vSnap = await getDocs(collection(db, "products", d.id, "variants"));
      return {
        id: d.id,
        ...d.data(),
        creado: null, // los Timestamps no se serializan; no lo necesitamos en la web
        variants: vSnap.docs
          .map((v) => ({ sku: v.id, ...v.data() }))
          .sort((a, b) => {
            const c = (a.color ?? "").localeCompare(b.color ?? "", "es");
            if (c !== 0) return c;
            const orden = ["S", "M", "L", "XL"];
            return orden.indexOf(a.talla) - orden.indexOf(b.talla);
          }),
      };
    })
  );

  return productos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function getProductoPorSlug(slug) {
  const productos = await getProductos();
  return productos.find((p) => p.slug === slug) ?? null;
}
