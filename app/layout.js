import "./globals.css";

export const metadata = {
  title: "Telmo Herramientas · Publicaciones",
  description: "Generador de publicaciones para WhatsApp",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
