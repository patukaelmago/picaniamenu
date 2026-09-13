import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Download, QrCode, RefreshCw, Smartphone } from "lucide-react";
import { jsonLd, SITE_URL } from "@/lib/seo";

const title = "Carta con código QR para restaurantes";
const description =
  "Creá una carta con código QR para tu restaurante. Usá siempre el mismo QR y actualizá productos, precios e imágenes desde un panel simple.";

const faqItems = [
  {
    question: "¿Cómo funciona una carta con código QR?",
    answer:
      "El cliente escanea el código con la cámara del celular y accede directamente al menú online, sin instalar aplicaciones.",
  },
  {
    question: "¿Tengo que imprimir un QR nuevo cuando cambio la carta?",
    answer:
      "No. El código QR y el enlace permanecen iguales aunque actualices productos, precios, categorías o imágenes.",
  },
  {
    question: "¿Puedo descargar el código QR?",
    answer:
      "Sí. Desde el panel podés descargar el QR para imprimirlo en mesas, vidrieras, cartelería o piezas gráficas.",
  },
  {
    question: "¿Cuánto cuesta la carta con QR?",
    answer:
      "El precio lanzamiento de Carta Online es de $28.000 ARS por mes e incluye la configuración inicial.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "Carta con código QR para restaurantes",
      provider: { "@id": `${SITE_URL}/#organization` },
      url: `${SITE_URL}/carta-con-codigo-qr`,
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
    "carta con código QR",
    "menú QR para restaurantes",
    "carta QR",
    "código QR restaurante",
    "menú digital QR",
  ],
  alternates: { canonical: "/carta-con-codigo-qr" },
  openGraph: {
    title: `${title} | Carta Online`,
    description,
    url: `${SITE_URL}/carta-con-codigo-qr`,
    type: "website",
  },
};

const whatsappUrl =
  "https://wa.me/543412172916?text=Hola%2C%20quiero%20una%20carta%20con%20c%C3%B3digo%20QR%20para%20mi%20restaurante.";

export default function CartaConCodigoQrPage() {
  return (
    <main className="min-h-screen bg-white text-[#151A24]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <header className="border-b border-[#DED9CF] bg-[#F3F1EC]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="Volver a Carta Online">
            <img src="/carta-online-logo-orange.svg" alt="Carta Online" className="h-14 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/menu/maido" className="hidden font-bold transition hover:text-[#2563EB] sm:inline">
              Ver demo
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white transition hover:bg-[#174BC1]">
              Quiero mi QR
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#E5E7EB] py-24 sm:py-32">
        <div className="absolute -left-28 top-20 h-96 w-96 rounded-full bg-[#FF6B00]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2563EB]">
              Carta con código QR
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              Un solo QR. Una carta siempre actualizada.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5E6573]">
              Tus clientes escanean el código y ven el menú desde su celular. Vos cambiás platos, precios e imágenes sin imprimir un QR nuevo.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 font-black text-white transition hover:bg-[#174BC1]">
                Quiero mi carta con QR
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link href="/menu/maido" className="inline-flex items-center rounded-xl border-2 border-[#151A24] px-6 py-4 font-black transition hover:bg-[#151A24] hover:text-white">
                Ver una carta real
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#1D2E58] p-9 text-white shadow-[0_28px_80px_rgba(29,46,88,0.25)]">
            <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-3xl bg-white p-6">
              <img src="/qr-maido.svg" alt="Ejemplo de código QR de Carta Online" className="h-full w-full object-contain" />
            </div>
            <p className="mt-7 text-center text-xl font-black">Escaneá. Abrí. Elegí.</p>
            <p className="mt-2 text-center leading-7 text-white/70">
              Sin aplicaciones, registros ni pasos intermedios.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F1EC] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              El QR que acompaña todos los cambios de tu menú.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: RefreshCw,
                title: "Siempre vigente",
                text: "El código QR no cambia cuando modificás el contenido de la carta.",
              },
              {
                icon: Download,
                title: "Listo para imprimir",
                text: "Descargalo y usalo en mesas, vidrieras, carteles y publicaciones.",
              },
              {
                icon: Smartphone,
                title: "Acceso inmediato",
                text: "Tus clientes abren la carta desde la cámara del celular, sin instalar nada.",
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
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.15em] text-[#FF6B00]">Incluido</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Mucho más que generar un código QR.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#5E6573]">
              Configuramos una carta completa con la identidad de tu restaurante y te damos acceso para administrarla.
            </p>
          </div>
          <div className="rounded-3xl border border-[#DDE0E5] bg-[#F8F6F1] p-8">
            {[
              "Configuración inicial incluida",
              "Diseño personalizado",
              "Productos y categorías sin límite",
              "Actualizaciones en tiempo real",
              "Soporte directo por WhatsApp",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 border-b border-[#DED9CF] py-4 last:border-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B00] text-white">
                  <Check className="h-4 w-4" />
                </span>
                <span className="font-bold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F3F1EC] py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-4xl font-black tracking-[-0.035em] sm:text-5xl">Preguntas frecuentes</h2>
          <div className="mt-12 space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-[#DDE0E5] bg-white px-6 py-5">
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
          <QrCode className="mx-auto h-12 w-12 text-[#FF6B00]" />
          <h2 className="mt-6 text-4xl font-black tracking-[-0.035em]">
            Recibí tu carta y tu QR listos para usar.
          </h2>
          <p className="mt-5 text-lg text-white/85">$28.000 por mes — configuración inicial incluida.</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-7 py-4 font-black text-white transition hover:bg-white hover:text-[#151A24]">
            Consultar por WhatsApp
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>
    </main>
  );
}
