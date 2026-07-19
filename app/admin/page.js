"use client";
import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from "firebase/auth";
import {
  collection, doc, getDocs, setDoc, runTransaction, serverTimestamp,
  query, orderBy, limit,
} from "firebase/firestore";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { fmtPrecio } from "@/lib/config";

// ─────────────────────────────────────────────────────────────
//  Panel de administración
//  · Login con tu usuario de Firebase Auth
//  · Alta de productos con fotos (comprimidas antes de subir)
//  · Venta: descuenta 1 con transacción + registro en movimientos
//  · Ajuste: fija el stock con motivo obligatorio
//  · Publicar cambios: fuerza la regeneración del sitio público
// ─────────────────────────────────────────────────────────────

const S = {
  input: {
    width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: "inherit",
    border: "1px solid var(--linea-fuerte)", borderRadius: 4,
    background: "#fff", marginBottom: 10,
  },
  btn: {
    padding: "9px 16px", fontSize: 13, borderRadius: 4, border: "1px solid var(--tinta)",
    background: "var(--tinta)", color: "var(--hueso)", letterSpacing: "0.03em",
  },
  btnSec: {
    padding: "9px 16px", fontSize: 13, borderRadius: 4,
    border: "1px solid var(--linea-fuerte)", background: "transparent", color: "var(--tinta)",
  },
  card: {
    background: "#fff", border: "1px solid var(--linea)", borderRadius: 6,
    padding: 16, marginBottom: 14,
  },
};

async function registrarMovimiento(tx, { productId, sku, tipo, cantidad, motivo }) {
  tx.set(doc(collection(db, "movimientos")), {
    productId, sku, tipo, cantidad,
    motivo: motivo ?? null,
    fecha: serverTimestamp(),
    usuario: auth.currentUser?.email ?? "desconocido",
  });
}

export default function Admin() {
  const [user, setUser] = useState(undefined);
  const [productos, setProductos] = useState([]);
  const [movs, setMovs] = useState([]);
  const [vista, setVista] = useState("inventario");
  const [aviso, setAviso] = useState("");
  const [hayCambios, setHayCambios] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => { if (user) cargar(); }, [user]);

  async function cargar() {
    const snap = await getDocs(query(collection(db, "products"), orderBy("nombre")));
    const lista = await Promise.all(
      snap.docs.map(async (d) => {
        const vs = await getDocs(collection(db, "products", d.id, "variants"));
        return { id: d.id, ...d.data(), variants: vs.docs.map((v) => ({ sku: v.id, ...v.data() })) };
      })
    );
    setProductos(lista);

    const m = await getDocs(query(collection(db, "movimientos"), orderBy("fecha", "desc"), limit(30)));
    setMovs(m.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  function avisar(txt) {
    setAviso(txt);
    setTimeout(() => setAviso(""), 3500);
  }

  // ── Venta: -1 atómico con validación de stock ──
  async function vender(productId, sku) {
    try {
      await runTransaction(db, async (tx) => {
        const vRef = doc(db, "products", productId, "variants", sku);
        const vSnap = await tx.get(vRef);
        const actual = vSnap.data()?.stock ?? 0;
        if (actual < 1) throw new Error("Sin stock en esa talla");
        tx.update(vRef, { stock: actual - 1 });
        await registrarMovimiento(tx, { productId, sku, tipo: "venta", cantidad: 1 });
      });
      setHayCambios(true);
      avisar(`Venta registrada — ${sku}`);
      cargar();
    } catch (e) {
      avisar("✗ " + e.message);
    }
  }

  // ── Ajuste: fija el valor con motivo obligatorio ──
  async function ajustar(productId, sku, stockActual) {
    const nuevoTxt = prompt(`Nuevo stock para ${sku} (actual: ${stockActual}):`);
    if (nuevoTxt === null) return;
    const nuevo = parseInt(nuevoTxt, 10);
    if (isNaN(nuevo) || nuevo < 0) return avisar("✗ Debe ser un número de 0 en adelante");

    const motivo = prompt("Motivo del ajuste (obligatorio):");
    if (!motivo?.trim()) return avisar("✗ El ajuste necesita motivo — es tu historial");

    try {
      await runTransaction(db, async (tx) => {
        const vRef = doc(db, "products", productId, "variants", sku);
        tx.update(vRef, { stock: nuevo });
        await registrarMovimiento(tx, {
          productId, sku, tipo: "ajuste",
          cantidad: nuevo - stockActual, motivo: motivo.trim(),
        });
      });
      setHayCambios(true);
      avisar(`Ajuste guardado — ${sku}: ${stockActual} → ${nuevo}`);
      cargar();
    } catch (e) {
      avisar("✗ " + e.message);
    }
  }

  // ── Publicar: regenera el sitio público ──
  async function publicar() {
    const secreto = process.env.NEXT_PUBLIC_REVALIDATE_SECRET;
    const r = await fetch("/api/revalidar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secreto }),
    });
    if (r.ok) {
      setHayCambios(false);
      avisar("✓ Catálogo público actualizado");
    } else {
      avisar("✗ No se pudo publicar — revisa REVALIDATE_SECRET en Vercel");
    }
  }

  if (user === undefined) return <Cargando />;
  if (!user) return <Login />;

  return (
    <div className="contenedor ancho" style={{ padding: "24px 20px 60px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="serif" style={{ fontSize: 22, letterSpacing: "0.06em" }}>Admin</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {hayCambios && (
            <button style={{ ...S.btn, background: "var(--oliva)", borderColor: "var(--oliva)" }} onClick={publicar}>
              Publicar cambios
            </button>
          )}
          <button style={S.btnSec} onClick={() => signOut(auth)}>Salir</button>
        </div>
      </header>

      {aviso && (
        <p style={{
          background: aviso.startsWith("✗") ? "#F7E8E0" : "#EBEFE4",
          color: aviso.startsWith("✗") ? "#8C3A1E" : "var(--oliva)",
          padding: "10px 14px", borderRadius: 4, fontSize: 13, marginBottom: 14,
        }}>{aviso}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["inventario", "Inventario"], ["nuevo", "Nueva prenda"], ["historial", "Historial"]].map(([id, label]) => (
          <button key={id} className={`chip ${vista === id ? "activo" : ""}`} onClick={() => setVista(id)}>
            {label}
          </button>
        ))}
      </div>

      {vista === "inventario" && (
        <Inventario productos={productos} onVender={vender} onAjustar={ajustar} />
      )}
      {vista === "nuevo" && (
        <NuevaPrenda onGuardado={() => { setHayCambios(true); cargar(); setVista("inventario"); avisar("✓ Prenda guardada"); }} />
      )}
      {vista === "historial" && <Historial movs={movs} />}
    </div>
  );
}

function Cargando() {
  return <div className="contenedor" style={{ padding: 40, textAlign: "center", color: "var(--piedra)" }}>Cargando…</div>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  async function entrar(e) {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch {
      setError("Correo o contraseña incorrectos");
    }
  }

  return (
    <div className="contenedor" style={{ padding: "80px 24px" }}>
      <h1 className="serif" style={{ fontSize: 24, textAlign: "center", marginBottom: 24, letterSpacing: "0.08em" }}>
        Panel de admin
      </h1>
      <form onSubmit={entrar}>
        <input style={S.input} type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={S.input} type="password" placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} />
        {error && <p style={{ color: "#8C3A1E", fontSize: 13, marginBottom: 10 }}>{error}</p>}
        <button style={{ ...S.btn, width: "100%", padding: 12 }} type="submit">Entrar</button>
      </form>
    </div>
  );
}

function Inventario({ productos, onVender, onAjustar }) {
  if (!productos.length)
    return <p style={{ color: "var(--piedra)", fontSize: 14 }}>Sin productos todavía. Crea la primera prenda en la pestaña de arriba.</p>;

  return productos.map((p) => (
    <div key={p.id} style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div>
          <span className="serif" style={{ fontSize: 16 }}>{p.nombre}</span>
          <span style={{ fontSize: 12, color: "var(--piedra)", marginLeft: 8 }}>{p.id.toUpperCase()}</span>
          {!p.activo && <span style={{ fontSize: 11, color: "#8C3A1E", marginLeft: 8 }}>OCULTO</span>}
        </div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{fmtPrecio(p.precio)}</span>
      </div>
      {p.variants.map((v) => (
        <div key={v.sku} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 0", borderTop: "1px solid var(--linea)", fontSize: 13.5,
        }}>
          <span style={{ width: 30 }}>{v.talla}</span>
          <span style={{
            width: 34, textAlign: "center", fontWeight: 500,
            color: v.stock === 0 ? "#8C3A1E" : "inherit",
          }}>{v.stock}</span>
          <button style={S.btnSec} disabled={v.stock === 0} onClick={() => onVender(p.id, v.sku)}>
            Vender −1
          </button>
          <button style={{ ...S.btnSec, marginLeft: "auto" }} onClick={() => onAjustar(p.id, v.sku, v.stock)}>
            Ajustar
          </button>
        </div>
      ))}
    </div>
  ));
}

function Historial({ movs }) {
  if (!movs.length) return <p style={{ color: "var(--piedra)", fontSize: 14 }}>Sin movimientos todavía.</p>;
  return (
    <div style={S.card}>
      {movs.map((m) => (
        <div key={m.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--linea)", fontSize: 13 }}>
          <span style={{
            fontWeight: 500,
            color: m.tipo === "venta" ? "var(--oliva)" : "var(--alerta)",
          }}>
            {m.tipo === "venta" ? "Venta" : "Ajuste"}
          </span>
          {" · "}{m.sku}
          {" · "}{m.tipo === "venta" ? "−1" : (m.cantidad > 0 ? "+" : "") + m.cantidad}
          {m.motivo && <span style={{ color: "var(--piedra)" }}> · {m.motivo}</span>}
          <span style={{ float: "right", color: "var(--piedra)", fontSize: 12 }}>
            {m.fecha?.toDate?.().toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function NuevaPrenda({ onGuardado }) {
  const [f, setF] = useState({
    id: "", nombre: "", precio: "", categoria: "blusas",
    descripcion: "", tela: "", modelo: "", cuidado: "",
  });
  const [tallas, setTallas] = useState({ S: "", M: "", L: "" });
  const [archivos, setArchivos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const slug = f.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

  async function guardar(e) {
    e.preventDefault();
    setError("");

    const id = f.id.trim().toLowerCase();
    if (!/^[a-z]{2}-\d{3}$/.test(id))
      return setError("El código debe ser tipo bl-004 (dos letras, guion, tres números)");
    if (!f.nombre.trim()) return setError("Falta el nombre");
    const precio = Number(f.precio);
    if (!precio || precio <= 0) return setError("El precio debe ser un número mayor a 0");
    const conStock = Object.entries(tallas).filter(([, v]) => v !== "");
    if (!conStock.length) return setError("Pon el stock de al menos una talla");

    setSubiendo(true);
    try {
      // 1. Fotos: comprimir y subir a Storage
      const imagenes = [];
      for (let i = 0; i < archivos.length; i++) {
        const comprimida = await imageCompression(archivos[i], {
          maxSizeMB: 0.4, maxWidthOrHeight: 1600, useWebWorker: true,
        });
        const ruta = `products/${id}/${Date.now()}-${i}.jpg`;
        const r = sRef(storage, ruta);
        await uploadBytes(r, comprimida);
        const url = await getDownloadURL(r);
        // La miniatura la genera la extensión Resize Images de forma
        // asíncrona; guardamos su ruta por convención (_600x600) y el
        // componente FotoProducto cae al original mientras no exista.
        const thumb = url.replace(/(\.[a-z]+)\?/, "_600x600$1?");
        imagenes.push({ url, thumb, orden: i });
      }

      // 2. Documento del producto
      await setDoc(doc(db, "products", id), {
        nombre: f.nombre.trim(),
        slug,
        precio,
        categoria: f.categoria,
        activo: true,
        descripcion: f.descripcion.trim() || null,
        tela: f.tela.trim() || null,
        modelo: f.modelo.trim() || null,
        cuidado: f.cuidado.trim() || null,
        imagenes,
        creado: serverTimestamp(),
      });

      // 3. Variantes con stock inicial + movimiento de entrada
      for (const [talla, stockTxt] of conStock) {
        const stock = parseInt(stockTxt, 10) || 0;
        const sku = `${id.toUpperCase().replace("-", "")}-${talla}`;
        await runTransaction(db, async (tx) => {
          tx.set(doc(db, "products", id, "variants", sku), { talla, stock });
          await registrarMovimiento(tx, {
            productId: id, sku, tipo: "entrada", cantidad: stock, motivo: "Alta de prenda",
          });
        });
      }

      onGuardado();
    } catch (err) {
      setError("No se pudo guardar: " + err.message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <form onSubmit={guardar} style={S.card}>
      <input style={S.input} placeholder="Código (ej. bl-004)" value={f.id} onChange={set("id")} />
      <input style={S.input} placeholder="Nombre (ej. Blusa lino crudo)" value={f.nombre} onChange={set("nombre")} />
      {slug && <p style={{ fontSize: 12, color: "var(--piedra)", margin: "-4px 0 10px" }}>URL: /producto/{slug}</p>}
      <input style={S.input} type="number" placeholder="Precio" value={f.precio} onChange={set("precio")} />
      <select style={S.input} value={f.categoria} onChange={set("categoria")}>
        <option value="blusas">Blusas</option>
        <option value="vestidos">Vestidos</option>
        <option value="pantalones">Pantalones</option>
      </select>
      <textarea style={{ ...S.input, minHeight: 60 }} placeholder="Descripción" value={f.descripcion} onChange={set("descripcion")} />
      <input style={S.input} placeholder="Tela (ej. 100% lino)" value={f.tela} onChange={set("tela")} />
      <input style={S.input} placeholder="Modelo (ej. Mide 1.68 m, usa talla M)" value={f.modelo} onChange={set("modelo")} />
      <input style={S.input} placeholder="Cuidado (ej. Lavado a mano)" value={f.cuidado} onChange={set("cuidado")} />

      <p style={{ fontSize: 13, color: "#6E6A5E", margin: "4px 0 8px" }}>Stock por talla (deja vacía la que no manejes)</p>
      <div style={{ display: "flex", gap: 8 }}>
        {["S", "M", "L"].map((t) => (
          <input key={t} style={{ ...S.input, width: 80 }} type="number" min="0" placeholder={t}
            value={tallas[t]} onChange={(e) => setTallas({ ...tallas, [t]: e.target.value })} />
        ))}
      </div>

      <p style={{ fontSize: 13, color: "#6E6A5E", margin: "4px 0 8px" }}>
        Fotos (la primera es la de portada — se comprimen solas antes de subir)
      </p>
      <input style={S.input} type="file" accept="image/*" multiple
        onChange={(e) => setArchivos([...e.target.files])} />

      {error && <p style={{ color: "#8C3A1E", fontSize: 13, marginBottom: 10 }}>{error}</p>}
      <button style={{ ...S.btn, width: "100%", padding: 12 }} disabled={subiendo}>
        {subiendo ? "Subiendo…" : "Guardar prenda"}
      </button>
    </form>
  );
}
