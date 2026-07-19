# Catálogo ALMA

Catálogo de ropa con pedidos por WhatsApp. Next.js + Firebase (Firestore, Storage, Auth), desplegado en Vercel.

## Qué incluye

- `/` — catálogo público con filtros por categoría y talla
- `/producto/[slug]` — ficha con galería, tallas (agotadas tachadas) y botón de WhatsApp con el SKU en el mensaje
- `/admin` — panel privado: alta de prendas con fotos, venta (−1 con transacción), ajuste manual con motivo, historial de movimientos y botón "Publicar cambios"
- `scripts/seed.mjs` — carga masiva de productos desde `scripts/productos.json`

El sitio público es estático: se regenera cada hora o al instante con "Publicar cambios". Las visitas no consumen lecturas de Firestore.

## Puesta en marcha

### 1. Local

```bash
npm install
cp .env.example .env.local
# llena .env.local con la config de Firebase (consola → Configuración → Tus apps)
npm run dev
```

### 2. Personaliza tu marca

Todo está en `lib/config.js`: nombre, lema, **tu número de WhatsApp**, categorías y tallas.

### 3. Carga tus productos

Opción A — desde el admin: entra a `/admin` con tu usuario de Firebase Auth y usa "Nueva prenda".

Opción B — carga masiva: llena `scripts/productos.json` y corre:

```bash
node scripts/seed.mjs
```

### 4. GitHub + Vercel

```bash
git init
git add .
git commit -m "Catálogo inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/catalogo.git
git push -u origin main
```

En [vercel.com](https://vercel.com): **Add New → Project → importa el repo**. Antes de darle Deploy, en **Environment Variables** pega todas las variables de `.env.local` (marca Production, Preview y Development). Deploy.

Cada `git push` a `main` publica solo. Conecta tu dominio en Settings → Domains.

## Notas importantes

- **`.env.local` nunca se sube** — ya está en `.gitignore`. La config de Firebase del cliente es pública por diseño; lo que protege tus datos son las reglas (`firestore.rules`, `storage.rules`), que deben estar publicadas en la consola de Firebase.
- **REVALIDATE_SECRET**: inventa una cadena larga; va idéntica en las dos variables. Su papel es modesto: evitar que cualquiera dispare regeneraciones del sitio. Aunque alguien la obtuviera, lo único que puede hacer es refrescar el catálogo.
- **Miniaturas**: instala la extensión **Resize Images** en Firebase (tamaño 600x600, formato mismo que el original) apuntando a la carpeta `products`. Mientras la miniatura no exista, la web muestra el original automáticamente.
- **Después de vender por chat**: entra a `/admin`, "Vender −1" en la talla vendida, y "Publicar cambios". Ese hábito es lo que mantiene el catálogo confiable.
