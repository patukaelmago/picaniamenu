import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Eye, ImageIcon, Layers3, RefreshCw, Settings2 } from "lucide-react";
import { jsonLd, SITE_URL } from "@/lib/seo";

const title = "Administración de cartas digitales";
const description =
  "Administrá la carta digital de tu restaurante desde un panel simple. Actualizá productos, precios, imágenes, categorías y visibilidad en tiempo real.";

const faqItems = [
  {
    question: "¿Qué puedo administrar desde el panel?",
    answer:
      "Podés gestionar productos, precios, descripciones, imágenes, categorías, subcategorías, disponibilidad y apariencia de la carta.",
  },
  {
    question: "¿Los cambios se ven inmediatamente?",
    answer:
      "Sí. Cuando guardás una modificación, la carta pública se actualiza sin cambiar el enlace ni el código QR.",
  },
  {
    question: "¿Puedo usar el panel desde el celular?",
    answer:
      "Sí. El administrador funciona desde celulares, tablets y computadoras mediante el navegador.",
  },
  {
    question: "¿Cada restaurante tiene su propio acceso?",
    answer:
      "Sí. Cada restaurante accede de forma privada a su panel y administra únicamente su propia carta.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "Administración de cartas digitales",
      provider: { "@id": `${SITE_URL}/#organization` },
      url: `${SITE_URL}/administracion-de-cartas-digitales`,
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
    "administración de cartas digitales",
    "panel para menú digital",
    "administrar menú QR",
    "actualizar carta restaurante",
    "gestión de menú online",
  ],
  alternates: { canonical: "/administracion-de-cartas-digitales" },
  openGraph: {
    title: `${title} | Carta Online`,
    description,
    url: `${SITE_URL}/administracion-de-cartas-digitales`,
    type: "website",
  },
};

const whatsappUrl =
  "https://wa.me/543417510112?text=Hola%2C%20quiero%20administrar%20la%20carta%20digital%20de%20mi%20restaurante.";

export default function AdministracionDeCartasDigitalesPage() {
  return (
    <main className="min-h-screen bg-white text-[#151A24]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <header className="border-b border-[#DED9CF] bg-[#F3F1EC]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="Volver a Carta Online">
            <img src="/carta-online-logo-orange.svg" alt="Carta Online" className="h-14 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden font-bold transition hover:text-[#2563EB] sm:inline">
              Iniciar sesión
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white transition hover:bg-[#174BC1]">
              Quiero mi carta
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#E5E7EB] py-24 sm:py-32">
        <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-[#FF6B00]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2563EB]">
              Administración de cartas digitales
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              Tu menú bajo control, desde cualquier dispositivo.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5E6573]">
              Administrá productos, precios, imágenes y categorías desde un panel pensado para restaurantes. Cada cambio se refleja en la carta online.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 font-black text-white transition hover:bg-[#174BC1]">
                Quiero administrar mi carta
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link href="/menu/maido" className="inline-flex items-center rounded-xl border-2 border-[#151A24] px-6 py-4 font-black transition hover:bg-[#151A24] hover:text-white">
                Ver carta demo
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#DDE0E5] bg-[#F8F6F1] shadow-[0_28px_80px_rgba(21,26,36,0.16)]">
            <div className="bg-[#1D2E58] px-7 py-5 text-white">
              <p className="text-sm font-bold text-white/65">Panel de administración</p>
              <p className="mt-1 text-xl font-black">Gestionar menú</p>
            </div>
            <div className="space-y-3 p-6">
              {[
                ["Tiradito amazónico", "$18.900", true],
                ["Nigiri de salmón", "$8.500", true],
                ["Pesca misoyaki", "$26.000", false],
              ].map(([name, price, visible]) => (
                <div key={String(name)} className="flex items-center justify-between gap-4 rounded-xl border border-[#DDE0E5] bg-white p-4">
                  <div>
                    <p className="font-black">{String(name)}</p>
                    <p className="mt-1 text-sm text-[#69708B]">{String(price)}</p>
                  </div>
                  <Eye className={visible ? "h-5 w-5 text-[#2563EB]" : "h-5 w-5 text-[#B8B2A7]"} />
                </div>
              ))}
              <button type="button" className="w-full rounded-xl bg-[#2563EB] px-5 py-4 font-black text-white">
                Agregar producto
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F1EC] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Todo lo que necesitás, en un único panel.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Layers3,
                title: "Productos y categorías",
                text: "Creá, editá, ordená y organizá todo el contenido del menú.",
              },
              {
                icon: ImageIcon,
                title: "Imágenes",
                text: "Agregá fotos y decidí cuándo mostrarlas en la carta pública.",
              },
              {
                icon: Eye,
                title: "Visibilidad",
                text: "Ocultá productos o categorías sin tener que eliminarlos.",
              },
              {
                icon: Settings2,
                title: "Identidad visual",
                text: "Configurá nombre, logo, colores y contenido principal.",
              },
            ].map((feature) => (
              <article key={feature.title} className="rounded-3xl bg-white p-7 shadow-sm">
                <feature.icon className="h-9 w-9 text-[#2563EB]" />
                <h2 className="mt-5 text-xl font-black">{feature.title}</h2>
                <p className="mt-3 leading-7 text-[#5E6573]">{feature.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border border-[#DDE0E5] bg-white p-8 sm:p-10">
            <h2 className="text-3xl font-black tracking-[-0.03em]">
              Funciones disponibles
            </h2>
            <div className="mt-8 grid gap-x-10 gap-y-5 md:grid-cols-2">
              {[
                "Crear, editar y eliminar productos",
                "Categorías y subcategorías",
                "Precios, descripciones e imágenes",
                "Ordenar productos y categorías",
                "Mostrar u ocultar productos y categorías",
                "Mostrar u ocultar imágenes individuales",
                "Buscador de productos para el cliente",
                "Etiquetas y opciones SIN TACC",
                "Sugerencias y productos destacados",
                "Carrusel de imágenes configurable",
                "Colores, logo y nombre personalizados",
                "Carta A y Carta B con un mismo QR",
                "Descarga y uso del código QR",
                "Acceso privado para cada restaurante",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF0FF] text-[#2563EB]">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="font-bold leading-7">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.15em] text-[#FF6B00]">Autogestionable</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Actualizá la carta cuando lo necesites.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#5E6573]">
              No necesitás pedir cada cambio ni volver a imprimir. Entrás a tu panel, modificás el contenido y la carta queda actualizada.
            </p>
            <div className="mt-8 flex items-center gap-3 font-black text-[#2563EB]">
              <RefreshCw className="h-6 w-6" />
              Cambios visibles en tiempo real
            </div>
          </div>
          <div className="rounded-3xl border border-[#DDE0E5] bg-[#F8F6F1] p-8">
            {[
              "Acceso privado para cada restaurante",
              "Uso desde celular, tablet o computadora",
              "Productos y categorías sin límite",
              "Código QR que no cambia",
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
          <h2 className="text-4xl font-black tracking-[-0.035em]">
            Empezá a administrar tu carta online.
          </h2>
          <p className="mt-5 text-lg text-white/85">$25.000 por mes — configuración inicial incluida.</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-7 py-4 font-black text-white transition hover:bg-white hover:text-[#151A24]">
            Consultar por WhatsApp
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>
    </main>
  );
}
