import { notFound } from "next/navigation";
import FichaProducto from "@/components/FichaProducto";
import { getProductos, getProductoPorSlug } from "@/lib/queries";
import { MARCA } from "@/lib/config";

export const revalidate = 3600;

export async function generateStaticParams() {
  const productos = await getProductos();
  return productos.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const p = await getProductoPorSlug(params.slug);
  if (!p) return {};
  return {
    title: `${p.nombre} — ${MARCA}`,
    description: p.descripcion ?? `${p.nombre} disponible en ${MARCA}.`,
    openGraph: p.imagenes?.[0]?.url
      ? { images: [{ url: p.imagenes[0].url }] }
      : undefined,
  };
}

export default async function Producto({ params }) {
  const p = await getProductoPorSlug(params.slug);
  if (!p) notFound();
  return <FichaProducto producto={p} />;
}
