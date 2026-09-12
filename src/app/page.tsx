import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  GripVertical,
  ImageIcon,
  LogIn,
  Menu,
  Palette,
  Pencil,
  Plus,
  QrCode,
  Search,
  Settings,
  Smartphone,
  Store,
  UtensilsCrossed,
} from "lucide-react";

const features = [
  {
    icon: Pencil,
    title: "Actualizá en segundos",
    text: "Cambiá platos, precios, descripciones e imágenes desde cualquier dispositivo.",
    accent: "bg-[#2563EB]",
  },
  {
    icon: QrCode,
    title: "Un QR, siempre vigente",
    text: "El código no cambia aunque actualices todo el contenido de tu carta.",
    accent: "bg-[#FF6B00]",
  },
  {
    icon: Palette,
    title: "Tu propia identidad",
    text: "Personalizá colores, logo, portada y estilo para cada restaurante.",
    accent: "bg-[#151A24]",
  },
  {
    icon: Smartphone,
    title: "Perfecta en cada pantalla",
    text: "Diseño rápido y adaptable para celulares, tablets y computadoras.",
    accent: "bg-[#2563EB]",
  },
  {
    icon: Store,
    title: "Todos tus locales",
    text: "Gestioná distintas cartas y restaurantes desde una sola cuenta.",
    accent: "bg-[#FF6B00]",
  },
  {
    icon: Menu,
    title: "Todo bien organizado",
    text: "Categorías, subcategorías, sugerencias y disponibilidad en un mismo lugar.",
    accent: "bg-[#151A24]",
  },
];

const FAQ_ITEMS = [
  {
    question: "¿Cuánto cuesta Carta Online?",
    answer: "El precio lanzamiento es de $25.000 ARS por mes, con la configuración inicial incluida.",
  },
  {
    question: "¿La configuración inicial está incluida?",
    answer: "Sí. Configuramos la identidad visual, las categorías, los productos y el código QR para dejar tu carta lista.",
  },
  {
    question: "¿El código QR cambia cuando actualizo la carta?",
    answer: "No. El mismo código QR sigue funcionando aunque cambies productos, precios, imágenes o categorías.",
  },
  {
    question: "¿Necesito instalar una aplicación?",
    answer: "No. Carta Online funciona directamente desde el navegador, tanto para tus clientes como para la administración.",
  },
  {
    question: "¿Puedo modificar productos y precios?",
    answer: "Sí. Podés actualizar productos, precios, descripciones, imágenes y disponibilidad desde cualquier dispositivo.",
  },
  {
    question: "¿Hay permanencia mínima?",
    answer: "No. El servicio es mensual y no exige permanencia mínima.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white pt-20 text-[#151A24]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#DED9CF] bg-[#F3F1EC]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="Carta Online">
            <img
              src="/carta-online-logo-orange.svg"
              alt="Carta Online"
              className="h-14 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold md:flex">
            <a href="#funciones" className="transition hover:text-[#2563EB]">
              Funciones
            </a>
            <a href="#clientes" className="transition hover:text-[#2563EB]">
              Clientes
            </a>
            <a href="#panel" className="transition hover:text-[#2563EB]">
              Panel
            </a>
            <a href="#precio" className="transition hover:text-[#2563EB]">
              Precio
            </a>
            <Link href="/menu/maido" className="transition hover:text-[#2563EB]">
              Demo
            </Link>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#174BC1]"
          >
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section className="relative border-b border-[#E5E7EB]">
        <div className="absolute right-[-130px] top-12 h-[430px] w-[430px] rounded-full bg-[#2563EB]/10 blur-3xl" />
        <div className="absolute left-[-180px] top-64 h-[360px] w-[360px] rounded-full bg-[#FF6B00]/10 blur-3xl" />

        <div className="relative mx-auto grid min-h-[calc(100svh-80px)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <span className="inline-flex rounded-full bg-[#EAF0FF] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#2563EB]">
              Menú digital para restaurantes
            </span>

            <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[1.03] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Tu carta online,
              <span className="block text-[#2563EB]">siempre actualizada.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5E6573]">
              Creá una carta que represente a tu restaurante, compartila con un
              QR y gestioná todo desde un panel simple.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="https://wa.me/543412172916?text=Hola%2C%20quiero%20una%20carta%20digital%20para%20mi%20restaurante."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 font-bold text-white transition hover:bg-[#174BC1]"
              >
                Quiero mi carta
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/menu/maido"
                className="rounded-xl border-2 border-[#151A24] px-6 py-4 font-bold transition hover:border-[#FF6B00] hover:text-[#FF6B00]"
                target="_blank" 
                rel="noopener noreferrer"
              >
                Ver demo
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-[#3E4655]">
              <SmallCheck text="Sin instalar aplicaciones" />
              <SmallCheck text="Cambios al instante" />
              <SmallCheck text="Diseño personalizado" />
            </div>
          </div>

          <div className="relative flex min-h-[590px] items-center justify-center lg:justify-end">
            <div className="absolute right-4 top-8 h-[460px] w-[390px] rounded-[64px] bg-[#F3F1EC]" />
            <div className="relative h-[570px] w-[294px] overflow-hidden rounded-[44px] border-[10px] border-[#151A24] bg-white shadow-[0_28px_70px_rgba(243,241,236,.95)]">
              <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-[#151A24]" />
              <div className="h-full bg-[#1D2E58] pt-[14px]">
                <iframe
                  src="/menu/maido"
                  title="Carta digital de Maido"
                  className="block origin-top-left border-0"
                  style={{
                    width: "142.857%",
                    height: "142.857%",
                    transform: "scale(0.7)",
                  }}
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="funciones" className="bg-[#F3F1EC] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[0.16em] text-[#FF6B00]">
              Todo lo que necesitás
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Una carta profesional, sin complicaciones.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#5E6573]">
              Tus clientes ven una carta clara. Vos administrás todo de manera simple.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text, accent }) => (
              <article
                key={title}
                className="rounded-2xl border border-[#E2DED5] bg-white p-5 shadow-[0_8px_24px_rgba(21,26,36,.06)] transition hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(21,26,36,.1)]"
              >
                <div className={"flex h-10 w-10 items-center justify-center rounded-xl text-white " + accent}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#646B78]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="clientes" className="border-b border-[#E5E7EB] bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full bg-[#EAF0FF] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#2563EB]">
              Clientes reales
            </span>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Restaurantes que ya usan Carta Online.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#5E6573]">
              Conocé cartas reales creadas y administradas desde nuestra plataforma.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Picaña",
                href: "/menu/picana",
                logo: "https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fpicana%2Flogos%2Flogo-1781101466505.png?alt=media&token=ef4386f1-42ce-4830-949e-53b8d0301861",
                background: "#FFF7E3",
              },
              {
                name: "La Roti",
                href: "/menu/laroti",
                logo: "https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Flaroti%2Flogos%2Flogo-1782758153400.png?alt=media&token=91029eb0-6ba5-4157-b050-0c05ac3c0958",
                background: "#0C1014",
              },
              {
                name: "Pulpo",
                href: "/menu/pulpo",
                logo: "https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fpulpo%2Flogos%2Flogo-1780243823688.png?alt=media&token=87f5846f-5e18-444f-9ffc-d42a0842a587",
                background: "#1D2E58",
              },
            ].map((client) => (
              <article
                key={client.href}
                className="overflow-hidden rounded-3xl border border-[#DDE0E5] bg-white shadow-[0_18px_55px_rgba(21,26,36,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(21,26,36,0.14)]"
              >
                <div
                  className="flex h-52 items-center justify-center p-10"
                  style={{ backgroundColor: client.background }}
                >
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="max-h-28 max-w-full object-contain"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black">{client.name}</h3>
                  <p className="mt-2 text-[#69708B]">Carta digital activa</p>
                  <Link
                    href={client.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 font-black text-[#2563EB] transition hover:text-[#174BC1]"
                  >
                    Ver carta
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[#F3F1EC] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full bg-[#FFF2DE] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#FF6B00]">
              Cómo funciona
            </span>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Tu carta online en tres pasos.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#5E6573]">
              Nosotros hacemos la configuración inicial. Después, vos mantenés todo actualizado desde tu panel.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Nos contactás",
                text: "Escribinos por WhatsApp y contanos sobre tu restaurante.",
              },
              {
                number: "02",
                title: "Configuramos tu carta",
                text: "Cargamos tu identidad, categorías y productos para dejarla lista.",
              },
              {
                number: "03",
                title: "Recibís tu QR y acceso",
                text: "Compartís la carta y administrás cambios desde tu propio panel.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="rounded-3xl border border-[#DED9CF] bg-white p-8 shadow-[0_16px_50px_rgba(21,26,36,0.06)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-sm font-black text-white">
                  {step.number}
                </span>
                <h3 className="mt-6 text-2xl font-black">{step.title}</h3>
                <p className="mt-3 leading-7 text-[#5E6573]">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonios" className="border-b border-[#E5E7EB] bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full bg-[#EAF0FF] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#2563EB]">
              Experiencias
            </span>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Lo que valoran nuestros clientes.
            </h2>
            <p className="mt-5 text-sm font-bold text-[#FF6B00]">
              Textos provisorios para visualizar la sección.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "Ahora podemos cambiar precios y productos en el momento, sin depender de nadie.",
                detail: "Administración simple",
              },
              {
                quote: "La carta representa la identidad del restaurante y se ve muy bien desde el celular.",
                detail: "Diseño personalizado",
              },
              {
                quote: "El mismo QR nos sirve siempre, aunque actualicemos toda la carta.",
                detail: "Actualización inmediata",
              },
            ].map((testimonial) => (
              <article
                key={testimonial.detail}
                className="flex h-full flex-col rounded-3xl border border-[#DDE0E5] bg-[#F8F6F1] p-8"
              >
                <span className="text-5xl font-black leading-none text-[#FF6B00]">“</span>
                <blockquote className="mt-4 flex-1 text-xl font-bold leading-8 text-[#151A24]">
                  {testimonial.quote}
                </blockquote>
                <div className="mt-8 border-t border-[#DED9CF] pt-5">
                  <p className="font-black text-[#2563EB]">{testimonial.detail}</p>
                  <p className="mt-1 text-sm text-[#69708B]">Testimonio provisorio</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="panel" className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.15fr_.85fr]">
          <AdminPreview />

          <div>
            <span className="inline-flex rounded-full bg-[#FF6B00] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
              Panel de administración
            </span>

            <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
              Así de simple se gestiona tu menú.
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#5E6573]">
              Agregá productos, actualizá precios, ordená categorías y controlá
              qué está disponible. Sin depender de nadie.
            </p>

            <div className="mt-8 space-y-4">
              <Benefit text="Cambios visibles inmediatamente" />
              <Benefit text="Productos, imágenes y categorías" />
              <Benefit text="Acceso privado para cada restaurante" />
            </div>

            <Link
              href="/login"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#151A24] px-6 py-4 font-bold text-white transition hover:bg-[#2563EB]"
            >
              Ingresar al panel
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F1EC] py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <span className="inline-flex rounded-full bg-[#FF6B00] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
              Código QR
            </span>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
              Un QR listo para compartir.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#5E6573]">
              Descargalo, compartilo o imprimilo. El código sigue siendo el mismo aunque cambies productos, precios o imágenes.
            </p>
            <div className="mt-8 space-y-4">
              <Benefit text="Un único QR para tu carta" />
              <Benefit text="Descarga lista para imprimir" />
              <Benefit text="Enlace directo al menú público" />
            </div>
          </div>
          <AdminFeaturePreview section="qr" />
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.15fr_.85fr]">
          <AdminFeaturePreview section="colors" />
          <div>
            <span className="inline-flex rounded-full bg-[#FF6B00] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
              Colores
            </span>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
              Tu identidad en cada detalle.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#5E6573]">
              Personalizá fondos, textos, navegación y destacados para que la carta tenga la identidad visual de tu restaurante.
            </p>
            <div className="mt-8 space-y-4">
              <Benefit text="Paleta propia para cada local" />
              <Benefit text="Vista previa de cada combinación" />
              <Benefit text="Cambios visibles inmediatamente" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F1EC] py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <span className="inline-flex rounded-full bg-[#FF6B00] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
              Ajustes
            </span>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
              Todo tu local, configurado.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#5E6573]">
              Administrá el nombre, el logo y las imágenes principales desde un único lugar, sin depender de soporte técnico.
            </p>
            <div className="mt-8 space-y-4">
              <Benefit text="Logo y nombre comercial" />
              <Benefit text="Carrusel de imágenes ordenable" />
              <Benefit text="Control de lo que ve el cliente" />
            </div>
          </div>
          <AdminFeaturePreview section="settings" />
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.15fr_.85fr]">
          <AdminFeaturePreview section="variants" />
          <div>
            <span className="inline-flex rounded-full bg-[#FF6B00] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
              Carta A / Carta B
            </span>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
              Dos cartas, un mismo QR.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#5E6573]">
              Prepará dos versiones de tu menú y elegí cuál publicar. Tus clientes
              siempre ingresan desde el mismo enlace y el mismo código QR.
            </p>
            <div className="mt-8 space-y-4">
              <Benefit text="Publicá una carta a la vez" />
              <Benefit text="Asigná productos a A, B o ambas" />
              <Benefit text="Cambiá la carta publicada al instante" />
            </div>
          </div>
        </div>
      </section>

      <section id="precio" className="border-t border-[#E5E7EB] bg-[#F8F6F1] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-[#EAF0FF] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#2563EB]">
              Precio lanzamiento
            </span>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Un plan simple, sin sorpresas.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#5E6573]">
              Todo lo necesario para tener tu carta online y mantenerla siempre actualizada.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-[#DDE0E5] bg-white p-8 shadow-[0_24px_70px_rgba(21,26,36,0.10)] sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#FF6B00]">
              Plan Carta Online
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-black tracking-[-0.045em] text-[#151A24]">
                $25.000
              </span>
              <span className="pb-2 font-bold text-[#69708B]">ARS / mes</span>
            </div>
            <p className="mt-3 font-bold text-[#2563EB]">
              Configuración inicial incluida
            </p>

            <div className="mt-8 space-y-4">
              <Benefit text="Carta digital personalizada" />
              <Benefit text="Código QR siempre vigente" />
              <Benefit text="Productos y categorías sin límite" />
              <Benefit text="Actualizaciones en tiempo real" />
              <Benefit text="Soporte directo por WhatsApp" />
              <Benefit text="Sin costo de instalación ni permanencia" />
            </div>

            <Link
              href="https://wa.me/543412172916?text=Hola%2C%20quiero%20contratar%20Carta%20Online%20por%20%2425.000%20mensuales."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 font-black text-white transition hover:bg-[#174BC1]"
            >
              Quiero contratar
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section id="preguntas" className="border-t border-[#E5E7EB] bg-white py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <span className="inline-flex rounded-full bg-[#EAF0FF] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#2563EB]">
              Preguntas frecuentes
            </span>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.035em] sm:text-5xl">
              Todo lo que necesitás saber.
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-[#DDE0E5] bg-[#F8F6F1] px-6 py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left text-lg font-black">
                  {item.question}
                  <span className="text-2xl text-[#2563EB] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-3xl pr-8 leading-7 text-[#5E6573]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#2563EB] py-20 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 px-6 text-center md:flex-row md:text-left">
          <div className="max-w-3xl">
            <p className="font-black uppercase tracking-[0.15em] text-white/70">
              Empezá hoy
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
              Tu carta puede estar online en pocos días.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/85">
              Escribinos por WhatsApp. Configuramos tu carta y te entregamos el acceso junto con el código QR.
            </p>
            <p className="mt-3 font-black text-white">
              $25.000 por mes — configuración inicial incluida.
            </p>
          </div>

          <Link
            href="https://wa.me/543412172916?text=Hola%2C%20quiero%20empezar%20con%20Carta%20Online."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#FF6B00] px-7 py-4 font-black text-white transition hover:bg-white hover:text-[#151A24]"
          >
            Quiero empezar
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <a
        href="https://wa.me/543412172916?text=Hola%2C%20quiero%20una%20carta%20digital%20para%20mi%20restaurante."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar por WhatsApp"
        className="fixed bottom-8 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 hover:bg-[#20BA5A]"
      >
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          className="h-8 w-8 fill-current"
        >
          <path d="M19.11 17.21c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.59.13-.17.26-.67.85-.83 1.02-.15.17-.3.2-.56.07-.26-.13-1.09-.4-2.08-1.29-.77-.68-1.29-1.53-1.44-1.79-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.46-.07-.13-.59-1.41-.8-1.94-.21-.51-.43-.44-.59-.45h-.5c-.17 0-.46.07-.7.33-.24.26-.91.89-.91 2.18s.93 2.53 1.06 2.7c.13.17 1.84 2.8 4.45 3.93.62.27 1.11.43 1.48.55.62.2 1.19.17 1.64.1.5-.07 1.54-.63 1.76-1.24.22-.61.22-1.13.15-1.24-.06-.11-.24-.17-.5-.3m-3.04 7.42h-.01a8.55 8.55 0 0 1-4.36-1.19l-.31-.18-3.24.85.86-3.15-.2-.32a8.52 8.52 0 0 1-1.31-4.56 8.58 8.58 0 1 1 8.57 8.55m7.3-15.87A10.27 10.27 0 0 0 16.08 5.75 10.35 10.35 0 0 0 7.1 21.25L5.64 26.6l5.47-1.43a10.34 10.34 0 0 0 4.96 1.26h.01A10.35 10.35 0 0 0 26.4 16.08a10.28 10.28 0 0 0-3.03-7.32" />
        </svg>
      </a>

      <footer className="border-t border-[#DED9CF] bg-[#F3F1EC] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 text-center md:flex-row md:text-left">
          <img
            src="/carta-online-logo-orange.svg"
            alt="Carta Online"
            className="h-14 w-auto object-contain"
          />

          <div className="flex flex-col items-center gap-3 md:items-end">
            <a
              href="https://wa.me/543412172916?text=Hola%2C%20quiero%20una%20carta%20digital%20para%20mi%20restaurante."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-black text-[#151A24] transition hover:text-[#25A953]"
            >
              <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5 fill-[#25D366]">
                <path d="M19.11 17.21c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.59.13-.17.26-.67.85-.83 1.02-.15.17-.3.2-.56.07-.26-.13-1.09-.4-2.08-1.29-.77-.68-1.29-1.53-1.44-1.79-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.46-.07-.13-.59-1.41-.8-1.94-.21-.51-.43-.44-.59-.45h-.5c-.17 0-.46.07-.7.33-.24.26-.91.89-.91 2.18s.93 2.53 1.06 2.7c.13.17 1.84 2.8 4.45 3.93.62.27 1.11.43 1.48.55.62.2 1.19.17 1.64.1.5-.07 1.54-.63 1.76-1.24.22-.61.22-1.13.15-1.24-.06-.11-.24-.17-.5-.3m-3.04 7.42h-.01a8.55 8.55 0 0 1-4.36-1.19l-.31-.18-3.24.85.86-3.15-.2-.32a8.52 8.52 0 0 1-1.31-4.56 8.58 8.58 0 1 1 8.57 8.55m7.3-15.87A10.27 10.27 0 0 0 16.08 5.75 10.35 10.35 0 0 0 7.1 21.25L5.64 26.6l5.47-1.43a10.34 10.34 0 0 0 4.96 1.26h.01A10.35 10.35 0 0 0 26.4 16.08a10.28 10.28 0 0 0-3.03-7.32" />
              </svg>
              +54 341 217-2916
            </a>
            <p className="text-sm text-[#707784]">
              © {new Date().getFullYear()} Carta Online. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function AdminPreview() {
  const items = [
    ["https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Fmenu-items%2Ftiradito-amazonico-1785693096244.png?alt=media&token=aa733d0f-0ac9-4243-9b72-7b9a473d16f7", "Tiradito amazónico", "Tiraditos", "$ 18.900"],
    ["https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Fmenu-items%2Fnigiri-de-salmon-1785692493140.png?alt=media&token=199f849b-f503-4e7e-b3f2-761098605880", "Nigiri de salmón", "Nigiris", "$ 8.500"],
    ["https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Fmenu-items%2Fpesca-misoyaki-1785694096909.png?alt=media&token=6a0ee7b0-339a-4283-8735-9b4648514918", "Pesca misoyaki", "Principales", "$ 26.000"],
    ["https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Fmenu-items%2Fmochi-de-maracuya-1785694628189.png?alt=media&token=328bca4b-9320-48f7-bfd1-055b0ff3aec7", "Mochi de maracuyá", "Postres", "$ 9.800"],
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-[#DDE0E5] bg-white shadow-[0_24px_70px_rgba(21,26,36,.15)]">
      <div className="flex min-h-[540px]">
        <aside className="hidden w-36 shrink-0 bg-[#1D2E58] p-4 text-[#FFF2DE] sm:block">
          <div className="border-b border-white/20 py-3">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Flogos%2Flogo-1785349762837.png?alt=media&token=664f0516-831d-48cd-b11f-e0c6f645a6f0"
              alt="Maido"
              className="mx-auto h-16 w-full object-contain"
            />
          </div>
          <div className="mt-5 space-y-2 text-xs font-bold">
            <AdminNav icon={UtensilsCrossed} text="Menú" active />
            <AdminNav icon={QrCode} text="QR" />
            <AdminNav icon={Palette} text="Colores" />
            <AdminNav icon={Settings} text="Ajustes" />
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-[#F8F6F1] p-4 sm:p-5">
          <div className="rounded-xl border-l-4 border-[#D80E1F] bg-[#1D2E58] p-4 text-[#FFF2DE] shadow-sm">
            <p className="text-lg font-black">Gestionar Menú</p>
            <p className="text-xs text-white/70">Maido</p>
          </div>

          <div className="mt-4 flex gap-2 text-xs font-bold">
            <span className="rounded-md bg-[#1D2E58] px-4 py-2 text-white">
              Items del Menú
            </span>
            <span className="rounded-md border bg-white px-4 py-2">
              Categorías
            </span>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="border-b p-4">
              <p className="font-black">Platos y Bebidas</p>
              <p className="text-xs text-[#69708B]">
                Administrá todos los items de tu menú.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="flex min-w-[150px] flex-1 items-center gap-2 rounded-md border px-3 py-2 text-xs text-[#777D91]">
                  <Search className="h-3.5 w-3.5" />
                  Nombre o categoría...
                </div>
                <span className="flex items-center gap-1.5 rounded-md bg-[#1D2E58] px-3 py-2 text-xs font-bold text-white">
                  <Plus className="h-3.5 w-3.5" />
                  Agregar Item
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-0 sm:min-w-[440px]">
                <div className="grid grid-cols-[18px_38px_minmax(0,1.2fr)_minmax(0,0.9fr)_62px] gap-1 bg-[#1D2E58] px-2 py-2 text-[10px] font-black uppercase text-white sm:grid-cols-[22px_42px_1fr_1fr_72px_48px] sm:gap-2 sm:px-3">
                  <span />
                  <span>Imagen</span>
                  <span>Producto</span>
                  <span>Categoría</span>
                  <span>Precio</span>
                  <span className="hidden sm:block">Visible</span>
                </div>

                {items.map(([image, name, category, price]) => (
                  <div
                    key={name}
                    className="grid grid-cols-[18px_38px_minmax(0,1.2fr)_minmax(0,0.9fr)_62px] items-center gap-1 border-t px-2 py-2.5 text-[11px] sm:grid-cols-[22px_42px_1fr_1fr_72px_48px] sm:gap-2 sm:px-3"
                  >
                    <GripVertical className="h-4 w-4 text-[#A3A6B1]" />
                    <img
                      src={image}
                      alt=""
                      className="h-9 w-9 rounded-md object-cover"
                    />
                    <span className="truncate font-bold">{name}</span>
                    <span className="truncate text-[#69708B]">{category}</span>
                    <span className="font-bold">{price}</span>
                    <span className="hidden h-7 w-7 items-center justify-center rounded-md bg-[#D80E1F] text-white sm:flex">
                      <Eye className="h-4 w-4" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[#69708B]">
            <ImageIcon className="h-3.5 w-3.5 text-[#D80E1F]" />
            Imágenes, visibilidad y orden en el mismo panel
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminFeaturePreview({ section }: { section: "qr" | "colors" | "settings" | "variants" }) {
  const titles = {
    qr: "Código QR",
    colors: "Colores",
    settings: "Ajustes del Cliente",
    variants: "Carta A / Carta B",
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-[#DDE0E5] bg-white shadow-[0_24px_70px_rgba(21,26,36,.12)]">
      <div className="flex min-h-[500px]">
        <aside className="hidden w-36 shrink-0 bg-[#1D2E58] p-4 text-[#FFF2DE] sm:block">
          <div className="border-b border-white/20 py-3">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Flogos%2Flogo-1785349762837.png?alt=media&token=664f0516-831d-48cd-b11f-e0c6f645a6f0"
              alt="Maido"
              className="mx-auto h-16 w-full object-contain"
            />
          </div>
          <div className="mt-5 space-y-2 text-xs font-bold">
            <AdminNav icon={UtensilsCrossed} text="Menú" active={section === "variants"} />
            <AdminNav icon={QrCode} text="QR" active={section === "qr"} />
            <AdminNav icon={Palette} text="Colores" active={section === "colors"} />
            <AdminNav icon={Settings} text="Ajustes" active={section === "settings"} />
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-[#F8F6F1] p-4 sm:p-5">
          <div className="rounded-xl border-l-4 border-[#D80E1F] bg-[#1D2E58] p-4 text-[#FFF2DE] shadow-sm">
            <p className="text-lg font-black">{titles[section]}</p>
            <p className="text-xs text-white/70">Maido</p>
          </div>

          {section === "qr" && (
            <div className="mt-4 rounded-xl border bg-white p-5 text-center shadow-sm">
              <p className="font-black">QR de tu carta</p>
              <p className="mt-1 text-xs text-[#69708B]">Este código abre directamente el menú de Maido.</p>
              <div className="mx-auto mt-5 h-48 w-48 overflow-hidden rounded-xl border-4 border-[#1D2E58] bg-white p-2">
                <img
                  src="/qr-maido.svg"
                  alt="QR real del menú de Maido"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="rounded-md bg-[#1D2E58] px-4 py-2 text-xs font-bold text-white">Descargar QR</span>
                <span className="rounded-md border border-[#1D2E58] px-4 py-2 text-xs font-bold text-[#1D2E58]">Compartir</span>
              </div>
              <p className="mt-4 text-[10px] font-bold text-[#69708B]">El enlace no cambia cuando actualizás la carta.</p>
            </div>
          )}

          {section === "colors" && (
            <div className="mt-4 rounded-xl border bg-white p-5 shadow-sm">
              <p className="font-black">Personalización de colores</p>
              <p className="mt-1 text-xs text-[#69708B]">Definí la identidad visual de tu carta.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Fondo principal", "#1D2E58"],
                  ["Texto principal", "#FFF2DE"],
                  ["Color destacado", "#D80E1F"],
                  ["Fondo del menú", "#F8F6F1"],
                  ["Navegación", "#1D2E58"],
                  ["Texto navegación", "#FFFFFF"],
                ].map(([label, color]) => (
                  <div key={label} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-9 w-9 shrink-0 rounded-md border" style={{ backgroundColor: color }} />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold">{label}</p>
                        <p className="text-[10px] text-[#69708B]">{color}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md bg-[#D80E1F] px-4 py-2 text-center text-xs font-bold text-white">Guardar colores</div>
            </div>
          )}

          {section === "settings" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="font-black">Identidad Visual</p>
                <p className="mt-1 text-[10px] text-[#69708B]">Nombre y logo del local.</p>
                <p className="mt-4 text-[10px] font-bold">Nombre comercial</p>
                <div className="mt-1 rounded-md border bg-[#F8F6F1] px-3 py-2 text-xs">Maido</div>
                <div className="mt-3 flex items-center justify-between rounded-md border p-3 text-[10px]">
                  <span className="font-bold">Mostrar logo</span>
                  <span className="h-5 w-9 rounded-full bg-[#D80E1F] p-0.5"><span className="ml-auto block h-4 w-4 rounded-full bg-white" /></span>
                </div>
                <div className="mt-3 rounded-lg bg-[#1D2E58] p-3">
                  <img
                    src="https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Flogos%2Flogo-1785349762837.png?alt=media&token=664f0516-831d-48cd-b11f-e0c6f645a6f0"
                    alt="Logo de Maido"
                    className="mx-auto h-14 object-contain"
                  />
                </div>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="font-black">Carrusel</p>
                <p className="mt-1 text-[10px] text-[#69708B]">Imágenes principales de la carta.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    "https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Fmenu-items%2Ftiradito-amazonico-1785693096244.png?alt=media&token=aa733d0f-0ac9-4243-9b72-7b9a473d16f7",
                    "https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Fmenu-items%2Fnigiri-de-salmon-1785692493140.png?alt=media&token=199f849b-f503-4e7e-b3f2-761098605880",
                    "https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Fmenu-items%2Fpesca-misoyaki-1785694096909.png?alt=media&token=6a0ee7b0-339a-4283-8735-9b4648514918",
                    "https://firebasestorage.googleapis.com/v0/b/studio-4948282065-ea24d.firebasestorage.app/o/tenants%2Fmaido%2Fmenu-items%2Fmochi-de-maracuya-1785694628189.png?alt=media&token=328bca4b-9320-48f7-bfd1-055b0ff3aec7",
                  ].map((image, index) => (
                    <div key={image} className="rounded-md border p-1">
                      <span className="block px-1 text-[9px] font-bold text-[#69708B]">{index + 1}</span>
                      <img src={image} alt="" className="mt-1 h-16 w-full rounded object-cover" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-md bg-[#1D2E58] px-3 py-2 text-center text-[10px] font-bold text-white">Elegir imágenes</div>
              </div>
            </div>
          )}

          {section === "variants" && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
                <div>
                  <p className="font-black">Carta publicada</p>
                  <p className="mt-1 text-[10px] text-[#69708B]">
                    El mismo QR muestra la carta seleccionada.
                  </p>
                </div>
                <div className="flex overflow-hidden rounded-md border border-[#1D2E58] text-xs font-bold">
                  <span className="bg-[#D80E1F] px-5 py-2 text-white">Carta A</span>
                  <span className="bg-white px-5 py-2 text-[#1D2E58]">Carta B</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="grid grid-cols-[1fr_66px_66px] bg-[#1D2E58] px-4 py-3 text-[10px] font-black uppercase text-white">
                  <span>Producto</span>
                  <span className="text-center">Carta A</span>
                  <span className="text-center">Carta B</span>
                </div>
                {[
                  ["Tiradito amazónico", true, false],
                  ["Nigiri de salmón", true, true],
                  ["Pesca misoyaki", false, true],
                  ["Mochi de maracuyá", true, false],
                ].map(([name, cardA, cardB]) => (
                  <div
                    key={String(name)}
                    className="grid grid-cols-[1fr_66px_66px] items-center border-t px-4 py-3 text-xs"
                  >
                    <span className="font-bold">{name}</span>
                    <span className="flex justify-center">
                      <span className={`h-5 w-9 rounded-full p-0.5 ${cardA ? "bg-[#D80E1F]" : "bg-[#D5D7DC]"}`}>
                        <span className={`block h-4 w-4 rounded-full bg-white ${cardA ? "ml-auto" : ""}`} />
                      </span>
                    </span>
                    <span className="flex justify-center">
                      <span className={`h-5 w-9 rounded-full p-0.5 ${cardB ? "bg-[#D80E1F]" : "bg-[#D5D7DC]"}`}>
                        <span className={`block h-4 w-4 rounded-full bg-white ${cardB ? "ml-auto" : ""}`} />
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-[#EAF0FF] px-4 py-3 text-xs font-bold text-[#1D2E58]">
                Cambiás de carta sin reemplazar el QR ni el enlace público.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminNav({
  icon: Icon,
  text,
  active = false,
}: {
  icon: typeof Menu;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={
        active
          ? "flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[#1D2E58]"
          : "flex items-center gap-2 rounded-lg px-3 py-2.5 text-white/80"
      }
    >
      <Icon className="h-4 w-4" />
      {text}
    </div>
  );
}

function SmallCheck({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF0FF] text-[#2563EB]">
        <Check className="h-3.5 w-3.5" />
      </span>
      {text}
    </span>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 font-bold">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B00] text-white">
        <Check className="h-4 w-4" />
      </span>
      {text}
    </div>
  );
}
