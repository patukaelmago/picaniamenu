import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { ThemeProvider } from "@/components/theme-provider";
import { jsonLd, SITE_URL } from "@/lib/seo";

const description =
  "Creá y administrá la carta digital de tu restaurante. Actualizá platos, precios e imágenes al instante y compartila siempre con el mismo código QR.";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Carta Online",
      url: SITE_URL,
      logo: `${SITE_URL}/carta-online-logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Carta Online",
      description:
        "Plataforma para crear y administrar cartas digitales para restaurantes.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "es-AR",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#application`,
      name: "Carta Online",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "Aplicación web para gestionar cartas digitales, productos, precios, imágenes y códigos QR de restaurantes.",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Carta Online | Carta digital para restaurantes",
    template: "%s | Carta Online",
  },
  description,
  applicationName: "Carta Online",
  authors: [{ name: "Carta Online", url: SITE_URL }],
  creator: "Carta Online",
  publisher: "Carta Online",
  keywords: [
    "carta digital",
    "menú digital",
    "código QR para restaurantes",
    "carta online para restaurantes",
    "menú QR",
    "administrar carta digital",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "Carta Online",
    title: "Carta Online | Carta digital para restaurantes",
    description,
    images: [
      {
        url: "/carta-online-logo.png",
        width: 1000,
        height: 564,
        alt: "Carta Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carta Online | Carta digital para restaurantes",
    description,
    images: ["/carta-online-logo.png"],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
        />
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
