import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Picaña | Restaurante",
  description: "El menú de Picaña Restaurante, Rosario, AR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}

          {/* Botón flotante para volver arriba */}
          <ScrollToTopButton />

          {/* Notificaciones */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}


