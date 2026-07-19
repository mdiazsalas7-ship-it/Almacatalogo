import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// El admin llama a esta ruta después de guardar cambios para que
// el catálogo público se regenere de inmediato en vez de esperar la hora.
// Protegida con un secreto simple que solo conoce tu panel.
export async function POST(req) {
  const { secreto } = await req.json().catch(() => ({}));

  if (!process.env.REVALIDATE_SECRET || secreto !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  revalidatePath("/", "layout"); // regenera catálogo y todas las fichas
  return NextResponse.json({ ok: true });
}
