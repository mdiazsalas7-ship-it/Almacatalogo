import Catalogo from "@/components/Catalogo";
import { getProductos } from "@/lib/queries";

// El catálogo se genera estático y se refresca solo cada hora.
// Para verlo actualizado al instante después de un cambio,
// usa el botón "Publicar cambios" del panel de admin.
export const revalidate = 3600;

export default async function Home() {
  const productos = await getProductos();
  return <Catalogo productos={productos} />;
}
