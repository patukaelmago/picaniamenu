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

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#151A24]">
      <header className="sticky top-0 z-50 border-b border-[#DED9CF] bg-[#F3F1EC]/95 backdrop-blur">
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
              Funcionalidades
            </a>
            <a href="#panel" className="transition hover:text-[#2563EB]">
              Panel
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
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 font-bold text-white transition hover:bg-[#174BC1]"
              >
                Crear mi carta
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/menu/maido"
                className="rounded-xl border-2 border-[#151A24] px-6 py-4 font-bold transition hover:border-[#FF6B00] hover:text-[#FF6B00]"
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
              <iframe
                src="/menu/maido"
                title="Carta digital de Maido"
                className="h-full w-full border-0"
                loading="eager"
              />
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

      <section className="bg-[#2563EB] py-20 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 text-center md:flex-row md:text-left">
          <div>
            <p className="font-black uppercase tracking-[0.15em] text-white/70">
              Empezá hoy
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
              Tu carta puede estar online en minutos.
            </h2>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-7 py-4 font-black text-white transition hover:bg-white hover:text-[#151A24]"
          >
            Crear mi carta
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#DED9CF] bg-[#F3F1EC] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 text-center md:flex-row">
          <img
            src="/carta-online-logo-orange.svg"
            alt="Carta Online"
            className="h-14 w-auto object-contain"
          />
          <p className="text-sm text-[#707784]">
            © {new Date().getFullYear()} Carta Online. Todos los derechos reservados.
          </p>
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
              <div className="min-w-[440px]">
                <div className="grid grid-cols-[22px_42px_1fr_1fr_72px_48px] gap-2 bg-[#1D2E58] px-3 py-2 text-[10px] font-black uppercase text-white">
                  <span />
                  <span>Imagen</span>
                  <span>Producto</span>
                  <span>Categoría</span>
                  <span>Precio</span>
                  <span>Visible</span>
                </div>

                {items.map(([image, name, category, price]) => (
                  <div
                    key={name}
                    className="grid grid-cols-[22px_42px_1fr_1fr_72px_48px] items-center gap-2 border-t px-3 py-2.5 text-[11px]"
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
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#D80E1F] text-white">
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

function AdminFeaturePreview({ section }: { section: "qr" | "colors" | "settings" }) {
  const titles = {
    qr: "Código QR",
    colors: "Colores",
    settings: "Ajustes del Cliente",
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
            <AdminNav icon={UtensilsCrossed} text="Menú" />
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
              <div className="mx-auto mt-5 flex h-48 w-48 items-center justify-center rounded-xl border-8 border-[#1D2E58] bg-white">
                <QrCode className="h-36 w-36 text-[#1D2E58]" />
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
