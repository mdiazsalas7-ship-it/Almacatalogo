import "./globals.css";

export const metadata = {
  title: "ALMA — Catálogo",
  description: "Ropa hecha con calma. Pedidos por WhatsApp, envíos a todo el país.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Marcellus&family=Karla:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
