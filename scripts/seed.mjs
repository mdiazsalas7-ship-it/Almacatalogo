// ─────────────────────────────────────────────────────────────
//  Carga masiva de productos a Firestore
//
//  Uso:
//    1. npm install firebase
//    2. Llena productos.json con tus prendas
//    3. node seed.mjs
//
//  Usa tu cuenta de Authentication (correo/contraseña) para escribir,
//  así que respeta las mismas reglas de seguridad que el panel de admin.
//  No necesitas service account key.
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore, doc, setDoc, writeBatch, collection, getDocs,
} from "firebase/firestore";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";

const firebaseConfig = {
  apiKey: "AIzaSyD4zPd81suVxNsFMdZygMPpGbPUGF8EB2I",
  authDomain: "catalogo-virtual-68d56.firebaseapp.com",
  projectId: "catalogo-virtual-68d56",
  storageBucket: "catalogo-virtual-68d56.firebasestorage.app",
  messagingSenderId: "292748351565",
  appId: "1:292748351565:web:8c5037ddb49953c045e404",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── Validación: atrapa los errores de tipo antes de escribir ──
function validar(productos) {
  const errores = [];
  const slugs = new Set();
  const ids = new Set();

  productos.forEach((p, i) => {
    const donde = `Producto ${i + 1} (${p.id ?? "sin id"})`;

    if (!p.id) errores.push(`${donde}: falta id`);
    if (!p.nombre) errores.push(`${donde}: falta nombre`);
    if (!p.slug) errores.push(`${donde}: falta slug`);
    if (typeof p.precio !== "number") errores.push(`${donde}: precio debe ser número, llegó ${typeof p.precio}`);
    if (typeof p.activo !== "boolean") errores.push(`${donde}: activo debe ser true/false sin comillas`);
    if (!p.categoria) errores.push(`${donde}: falta categoria`);

    if (ids.has(p.id)) errores.push(`${donde}: id repetido`);
    ids.add(p.id);
    if (slugs.has(p.slug)) errores.push(`${donde}: slug repetido "${p.slug}"`);
    slugs.add(p.slug);

    if (p.slug && !/^[a-z0-9-]+$/.test(p.slug))
      errores.push(`${donde}: slug solo acepta minúsculas, números y guiones`);

    if (!Array.isArray(p.variants) || p.variants.length === 0) {
      errores.push(`${donde}: necesita al menos una variante`);
    } else {
      p.variants.forEach((v) => {
        if (!v.sku) errores.push(`${donde}: variante sin sku`);
        if (!v.talla) errores.push(`${donde}: variante ${v.sku} sin talla`);
        if (typeof v.stock !== "number") errores.push(`${donde}: stock de ${v.sku} debe ser número`);
        if (v.stock < 0) errores.push(`${donde}: stock de ${v.sku} es negativo`);
      });
    }
  });

  return errores;
}

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // 1. Leer y validar el archivo
  let productos;
  try {
    productos = JSON.parse(await readFile("./productos.json", "utf8"));
  } catch (e) {
    console.error("\n✗ No se pudo leer productos.json:", e.message);
    console.error("  Revisa que exista y que el JSON esté bien formado (comas, comillas).\n");
    process.exit(1);
  }

  console.log(`\nLeí ${productos.length} productos de productos.json`);

  const errores = validar(productos);
  if (errores.length) {
    console.error(`\n✗ ${errores.length} problema(s) antes de escribir nada:\n`);
    errores.forEach((e) => console.error("  · " + e));
    console.error("\nCorrige productos.json y vuelve a correr.\n");
    process.exit(1);
  }

  const totalVariantes = productos.reduce((n, p) => n + p.variants.length, 0);
  console.log(`✓ Validación limpia — ${productos.length} productos, ${totalVariantes} variantes\n`);

  // 2. Login
  const email = await rl.question("Correo de tu usuario de Firebase: ");
  const pass = await rl.question("Contraseña: ");

  try {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
    console.log("✓ Sesión iniciada\n");
  } catch (e) {
    console.error("\n✗ No se pudo iniciar sesión:", e.code);
    console.error("  Verifica que creaste el usuario en Authentication → Users.\n");
    process.exit(1);
  }

  // 3. Avisar si ya hay datos
  const existentes = await getDocs(collection(db, "products"));
  if (!existentes.empty) {
    console.log(`⚠ Ya hay ${existentes.size} productos en Firestore.`);
    console.log("  Los que compartan id serán sobrescritos; el resto se queda.\n");
    const ok = await rl.question("¿Continuar? (s/n): ");
    if (ok.trim().toLowerCase() !== "s") {
      console.log("Cancelado.\n");
      process.exit(0);
    }
    console.log("");
  }

  // 4. Escribir
  let n = 0;
  for (const p of productos) {
    const { variants, ...campos } = p;

    await setDoc(doc(db, "products", p.id), {
      ...campos,
      imagenes: campos.imagenes ?? [],
      creado: new Date(),
    });

    const batch = writeBatch(db);
    for (const v of variants) {
      batch.set(doc(db, "products", p.id, "variants", v.sku), {
        talla: v.talla,
        color: v.color ?? null,
        stock: v.stock,
      });
    }
    await batch.commit();

    n++;
    console.log(`  ${String(n).padStart(3)}/${productos.length}  ${p.id.padEnd(10)} ${p.nombre}`);
  }

  console.log(`\n✓ Listo — ${n} productos con ${totalVariantes} variantes en Firestore.`);
  console.log("  Revísalos en la consola: Firestore → Datos → products\n");

  rl.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("\n✗ Error inesperado:", e.message, "\n");
  process.exit(1);
});
