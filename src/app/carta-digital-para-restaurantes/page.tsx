import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, QrCode, RefreshCw, Smartphone } from "lucide-react";
import { jsonLd, SITE_URL } from "@/lib/seo";

const title = "Carta digital para restaurantes";
const description =
  "Creá una carta digital para tu restaurante con código QR, diseño personalizado y un panel simple para actualizar productos, precios e imágenes.";

const faqItems = [
  {
    question: "¿Qué es una carta digital para restaurantes?",
    answer:
      "Es un menú online que tus clientes abren desde el celular mediante un enlace o código QR, sin instalar aplicaciones.",
  },
  {
    question: "¿Puedo actualizar precios y productos?",
    answer:
      "Sí. Podés modificar productos, precios, descripciones, imágenes y disponibilidad desde el panel de administración.",
  },
  {
    question: "¿El código QR cambia cuando actualizo la carta?",
    answer:
      "No. El mismo QR sigue funcionando aunque cambies todo el contenido de tu carta.",
  },
  {
    question: "¿Cuánto cuesta Carta Online?",
    answer:
      "El precio lanzamiento es de $28.000 ARS por mes e incluye la configuración inicial.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "Carta digital para restaurantes",
      provider: { "@id": `${SITE_URL}/#organization` },
      url: `${SITE_URL}/carta-digital-para-restaurantes`,
      description,
      areaServed: { "@type": "Country", name: "Argentina" },
      offers: {
        "@type": "Offer",
        price: "28000",
        priceCurrency: "ARS",
        category: "Suscripción mensual",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "carta digital para restaurantes",
    "menú digital para restaurantes",
    "carta online",
    "menú QR",
    "código QR restaurante",
  ],
  alternates: { canonical: "/carta-digital-para-restaurantes" },
  openGraph: {
    title: `${title} | Carta Online`,
    description,
    url: `${SITE_URL}/carta-digital-para-restaurantes`,
    type: "website",
  },
};

const whatsappUrl =
  "https://wa.me/543412172916?text=Hola%2C%20quiero%20una%20carta%20digital%20para%20mi%20restaurante.";

export default function CartaDigitalParaRestaurantesPage() {
  return (
    <main className="min-h-screen bg-white text-[#151A24]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <header className="border-b border-[#DED9CF] bg-[#F3F1EC]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="Volver a Carta Online">
            <img
              src="/carta-online-logo-orange.svg"
              alt="Carta Online"
              className="h-14 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/menu/maido"
              className="hidden font-bold transition hover:text-[#2563EB] sm:inline"
            >
              Ver demo
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white transition hover:bg-[#174BC1]"
            >
              Quiero mi carta
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#E5E7EB] py-24 sm:py-32">
        <div className="absolute -right-32 top-8 h-96 w-96 rounded-full bg-[#2563EB]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2563EB]">
              Carta digital para restaurantes
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              Tu menú online, listo para compartir con un QR.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5E6573]">
              Mostrá platos, precios, imágenes y categorías en una carta pensada para celulares. Actualizá todo desde un panel simple, sin volver a imprimir.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 font-black text-white transition hover:bg-[#174BC1]"
              >
                Quiero mi carta
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                href="/menu/maido"
                className="inline-flex items-center rounded-xl border-2 border-[#151A24] px-6 py-4 font-black transition hover:bg-[#151A24] hover:text-white"
              >
                Ver una carta real
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#1D2E58] p-8 text-white shadow-[0_28px_80px_rgba(29,46,88,0.25)]">
            <p className="text-sm font-black uppercase tracking-[0.15em] text-white/65">
              Precio lanzamiento
            </p>
            <p className="mt-4 text-5xl font-black">$28.000</p>
            <p className="mt-2 font-bold text-white/75">ARS por mes</p>
            <p className="mt-6 rounded-xl bg-white/10 px-4 py-3 font-black">
              Configuración inicial incluida
            </p>
            <div className="mt-7 space-y-4">
              {[
                "Diseño personalizado",
                "Código QR siempre vigente",
                "Productos y categorías sin límite",
                "Soporte directo por WhatsApp",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 font-bold">
                  <Check className="h-5 w-5 text-[#FF6B00]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F1EC] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Una carta clara para tus clientes. Un panel simple para vos.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: "Perfecta en celulares",
                text: "Carga rápido y se adapta a cualquier pantalla, sin descargar aplicaciones.",
              },
              {
                icon: RefreshCw,
                title: "Cambios al instante",
                text: "Actualizá precios, productos, fotos y disponibilidad cuando lo necesites.",
              },
              {
                icon: QrCode,
                title: "Un QR permanente",
                text: "Imprimilo una sola vez. El enlace sigue siendo el mismo después de cada cambio.",
              },
            ].map((benefit) => (
              <article key={benefit.title} className="rounded-3xl bg-white p-8 shadow-sm">
                <benefit.icon className="h-10 w-10 text-[#2563EB]" />
                <h2 className="mt-6 text-2xl font-black">{benefit.title}</h2>
                <p className="mt-3 leading-7 text-[#5E6573]">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-4xl font-black tracking-[-0.035em] sm:text-5xl">
            Preguntas frecuentes
          </h2>
          <div className="mt-12 space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-[#DDE0E5] bg-[#F8F6F1] px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black">
                  {item.question}
                  <span className="text-2xl text-[#2563EB] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 leading-7 text-[#5E6573]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#2563EB] py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-4xl font-black tracking-[-0.035em]">
            Tu restaurante puede tener su carta online.
          </h2>
          <p className="mt-5 text-lg text-white/85">
            Escribinos y dejamos todo configurado para que empieces a compartirla.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-7 py-4 font-black text-white transition hover:bg-white hover:text-[#151A24]"
          >
            Empezar por WhatsApp
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>
    </main>
  );
}
