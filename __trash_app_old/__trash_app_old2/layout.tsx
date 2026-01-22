import "./globals.css";

export const metadata = {
  title: "Picaña Menu Manager",
  description: "Carta digital con Firebase y Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          backgroundColor: "#000",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
