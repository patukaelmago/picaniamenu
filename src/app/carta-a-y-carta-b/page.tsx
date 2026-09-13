import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Eye, QrCode, Repeat2 } from "lucide-react";
import { jsonLd, SITE_URL } from "@/lib/seo";

const title = "Carta A y Carta B para restaurantes";
const description =
  "Prepará dos versiones de tu menú, asigná productos a Carta A o Carta B y elegí cuál publicar. El enlace y el código QR siempre son los mismos.";

const faqItems = [
  {
    question: "¿Qué son Carta A y Carta B?",
    answer:
      "Son dos versiones del menú dentro del mismo restaurante. Podés preparar ambas y decidir cuál ven tus clientes.",
  },
  {
    question: "¿Se pueden publicar las dos cartas al mismo tiempo?",
    answer:
      "No. Se publica una versión a la vez para que todos los clientes vean la misma carta activa.",
  },
  {
    question: "¿Puedo asignar un producto a las dos cartas?",
    answer:
      "Sí. Cada producto y categoría puede pertenecer a Carta A, Carta B o a ambas versiones.",
  },
  {
    question: "¿Tengo que cambiar el código QR?",
    answer:
      "No. El mismo enlace y el mismo QR muestran automáticamente la carta que hayas seleccionado.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "Carta A y Carta B para restaurantes",
      provider: { "@id": `${SITE_URL}/#organization` },
      url: `${SITE_URL}/carta-a-y-carta-b`,
      description,
      areaServed: { "@type": "Country", name: "Argentina" },
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
    "carta A y carta B",
    "dos cartas un mismo QR",
    "menú alternativo restaurante",
    "cambiar menú QR",
    "carta digital restaurante",
  ],
  alternates: { canonical: "/carta-a-y-carta-b" },
  openGraph: {
    title: `${title} | Carta Online`,
    description,
    url: `${SITE_URL}/carta-a-y-carta-b`,
    type: "website",
  },
};

const whatsappUrl =
  "https://wa.me/543412172916?text=Hola%2C%20quiero%20usar%20Carta%20A%20y%20Carta%20B%20en%20mi%20restaurante.";

export default function CartaAYCartaBPage() {
  return (
    <main className="min-h-screen bg-white text-[#151A24]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <header className="border-b border-[#DED9CF] bg-[#F3F1EC]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="Volver a Carta Online">
            <img src="/carta-online-logo-orange.svg" alt="Carta Online" className="h-14 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/menu/pulpo" className="hidden font-bold transition hover:text-[#2563EB] sm:inline">
              Ver demo
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white transition hover:bg-[#174BC1]">
              Quiero mi carta
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#E5E7EB] py-24 sm:py-32">
        <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-[#2563EB]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2563EB]">Carta A / Carta B</p>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              Dos cartas preparadas. Un solo QR.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5E6573]">
              Organizá dos versiones de tu menú y elegí cuál publicar en cada momento. Tus clientes siempre entran desde el mismo enlace.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 font-black text-white transition hover:bg-[#174BC1]">
                Quiero usar Carta A y B
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link href="/menu/pulpo" className="inline-flex items-center rounded-xl border-2 border-[#151A24] px-6 py-4 font-black transition hover:bg-[#151A24] hover:text-white">
                Ver carta real
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#1D2E58] p-8 text-white shadow-[0_28px_80px_rgba(29,46,88,0.25)]">
            <div className="flex rounded-2xl bg-white/10 p-2">
              <div className="flex-1 rounded-xl bg-[#FF6B00] px-4 py-4 text-center font-black">Carta A</div>
              <div className="flex-1 px-4 py-4 text-center font-black text-white/65">Carta B</div>
            </div>
            <div className="mt-6 space-y-3">
              {["Entradas", "Platos principales", "Bebidas", "Postres"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-xl bg-white/10 px-5 py-4">
                  <span className="font-bold">{item}</span>
                  <Eye className="h-5 w-5 text-[#FF6B00]" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3 text-sm font-bold text-white/70">
              <QrCode className="h-5 w-5" />
              El QR siempre permanece igual
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F1EC] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Cambiá de menú sin cambiar el acceso.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#5E6573]">
              Ideal para restaurantes que trabajan con propuestas diferentes según el día, la temporada o el servicio.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Almuerzo y cena",
                text: "Prepará una carta para cada servicio y publicá la indicada.",
              },
              {
                title: "Temporadas diferentes",
                text: "Dejá lista la próxima propuesta sin modificar la carta actual.",
              },
              {
                title: "Eventos o fechas especiales",
                text: "Activá un menú especial y después volvé al habitual en segundos.",
              },
            ].map((useCase, index) => (
              <article key={useCase.title} className="rounded-3xl bg-white p-8 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] font-black text-white">
                  {index + 1}
                </span>
                <h2 className="mt-6 text-2xl font-black">{useCase.title}</h2>
                <p className="mt-3 leading-7 text-[#5E6573]">{useCase.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.15em] text-[#FF6B00]">Control simple</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Elegí qué aparece en cada versión.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#5E6573]">
              Administrá productos y categorías por separado. Cuando una carta está lista, la publicás sin modificar el QR.
            </p>
          </div>
          <div className="rounded-3xl border border-[#DDE0E5] bg-[#F8F6F1] p-8">
            {[
              "Asigná productos a A, B o ambas",
              "Controlá categorías en cada carta",
              "Publicá una sola versión a la vez",
              "Cambiá la carta activa al instante",
              "Mantené siempre el mismo QR",
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
          <Repeat2 className="mx-auto h-12 w-12 text-[#FF6B00]" />
          <h2 className="mt-6 text-4xl font-black tracking-[-0.035em]">
            Prepará dos cartas y publicá la que necesitás.
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
