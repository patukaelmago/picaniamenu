import Link from "next/link";
import {
  Check,
  ExternalLink,
  Eye,
  GripVertical,
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

const palette = {
  ink: "#17204A",
  blue: "#315BFF",
  orange: "#FF6B00",
  pink: "#FF2BA6",
  green: "#B9FF25",
};

const features = [
  { icon: Menu, title: "Menú ilimitado", text: "Categorías, productos, precios y fotos sin límites.", color: palette.blue },
  { icon: Pencil, title: "Fácil de actualizar", text: "Hacé cambios en segundos desde tu panel.", color: palette.pink },
  { icon: Store, title: "Multi-restaurante", text: "Gestioná distintos locales con una sola cuenta.", color: palette.orange },
  { icon: Smartphone, title: "Siempre adaptable", text: "Perfecto en celulares, tablets y computadoras.", color: palette.green },
  { icon: QrCode, title: "Acceso por QR", text: "Tus clientes ingresan sin instalar aplicaciones.", color: palette.blue },
  { icon: Palette, title: "Tu propia identidad", text: "Colores, logo e imágenes de cada restaurante.", color: palette.pink },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FFFDF7] text-[#17204A]">
      <header className="sticky top-0 z-50 border-b-2 border-[#17204A] bg-[#FFFDF7]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" aria-label="Carta Online">
            <img src="/carta-online-logo.png" alt="Carta Online" className="h-11 w-auto object-contain" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold md:flex">
            <a href="#funciones" className="transition hover:text-[#FF2BA6]">Funcionalidades</a>
            <a href="#panel" className="transition hover:text-[#FF6B00]">Panel real</a>
            <Link href="/menu/maido" className="transition hover:text-[#315BFF]">Demo Maido</Link>
          </nav>

          <Link href="/login" className="rounded-full border-2 border-[#17204A] bg-[#315BFF] px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#17204A] transition hover:-translate-y-0.5 hover:bg-[#FF2BA6]">
            Ingresar
          </Link>
        </div>
      </header>

      <section className="relative">
        <div className="absolute -left-24 top-28 h-52 w-52 rounded-full bg-[#B9FF25]/55 blur-3xl" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#FF2BA6]/20 blur-3xl" />
        <div className="relative mx-auto grid min-h-[calc(100svh-64px)] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-10">
          <div className="relative z-10">
            <span className="inline-flex -rotate-1 rounded-full border-2 border-[#17204A] bg-[#B9FF25] px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0_#17204A]">
              Tu restaurante, siempre online
            </span>

            <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Una carta que se ve <span className="relative inline-block text-[#FF2BA6]">increíble<span className="absolute -bottom-1 left-0 -z-10 h-2 w-full -rotate-1 bg-[#B9FF25]" /></span>
              <br />y se actualiza fácil.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#41496B]">
              Creá tu menú digital, compartilo con un QR y cambiá productos,
              imágenes o precios desde cualquier dispositivo.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/login" className="flex items-center gap-2 rounded-full border-2 border-[#17204A] bg-[#FF6B00] px-6 py-4 font-black text-white shadow-[4px_4px_0_#17204A] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#17204A]">
                Comenzar ahora <ExternalLink className="h-4 w-4" />
              </Link>
              <Link href="/menu/maido" className="rounded-full border-2 border-[#17204A] bg-white px-6 py-4 font-black shadow-[4px_4px_0_#FF2BA6] transition hover:-translate-y-1">
                Ver demo de Maido
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold">
              <QuickCheck text="Sin instalar apps" />
              <QuickCheck text="Cambios al instante" />
              <QuickCheck text="Diseño personalizado" />
            </div>
          </div>

          <div className="relative flex min-h-[580px] items-center justify-center lg:justify-end">
            <div className="absolute left-2 top-16 h-28 w-28 rotate-12 rounded-[28px] border-2 border-[#17204A] bg-[#B9FF25]" />
            <div className="absolute bottom-12 right-0 h-36 w-36 -rotate-6 rounded-full border-2 border-[#17204A] bg-[#FF2BA6]" />
            <div className="absolute right-8 top-5 rounded-full border-2 border-[#17204A] bg-[#315BFF] px-5 py-2 text-sm font-black text-white shadow-[3px_3px_0_#17204A]">
              Demo real · Maido
            </div>

            <div className="relative h-[560px] w-[292px] rotate-[2deg] overflow-hidden rounded-[42px] border-[9px] border-[#17204A] bg-white shadow-[14px_16px_0_#FF6B00]">
              <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-[#17204A]" />
              <iframe src="/menu/maido" title="Menú digital Maido" className="h-full w-full border-0" loading="eager" />
            </div>
          </div>
        </div>
      </section>

      <section id="funciones" className="border-y-2 border-[#17204A] bg-[#315BFF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-black uppercase tracking-[.18em] text-[#B9FF25]">Todo en un solo lugar</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black leading-tight text-white md:text-5xl">
                Todo lo que necesitás para manejar tu carta.
              </h2>
            </div>
            <div className="h-16 w-16 rotate-12 rounded-2xl border-2 border-[#17204A] bg-[#FF2BA6] shadow-[5px_5px_0_#B9FF25]" />
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text, color }) => (
              <article key={title} className="rounded-[26px] border-2 border-[#17204A] bg-[#FFFDF7] p-7 shadow-[6px_6px_0_#17204A] transition hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#17204A]" style={{ backgroundColor: color }}>
                  <Icon className={color === palette.green ? "h-6 w-6 text-[#17204A]" : "h-6 w-6 text-white"} />
                </div>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
                <p className="mt-2 leading-7 text-[#596080]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="panel" className="relative bg-[#F3F0E8] py-24">
        <div className="absolute right-10 top-12 h-28 w-28 rounded-full bg-[#B9FF25] opacity-70 blur-xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.2fr_.8fr]">
          <AdminPreview />
          <div>
            <span className="inline-flex rounded-full border-2 border-[#17204A] bg-[#FF2BA6] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[3px_3px_0_#17204A]">
              Este sí es el panel
            </span>
            <h2 className="mt-6 text-4xl font-black leading-tight md:text-5xl">Lo que ves es lo que vas a usar.</h2>
            <p className="mt-6 text-lg leading-8 text-[#596080]">
              Administrá los platos y bebidas de Maido desde una interfaz clara.
              Buscá, ordená, ocultá o agregá productos y categorías.
            </p>
            <div className="mt-7 space-y-4">
              <CheckItem text="Cambios visibles inmediatamente" color={palette.green} />
              <CheckItem text="Imágenes, precios y disponibilidad" color={palette.pink} />
              <CheckItem text="Acceso protegido para cada restaurante" color={palette.orange} />
            </div>
            <Link href="/login" className="mt-9 inline-flex rounded-full border-2 border-[#17204A] bg-[#17204A] px-6 py-4 font-black text-white shadow-[5px_5px_0_#B9FF25] transition hover:-translate-y-1">
              Ingresar al panel
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-[#17204A] bg-[#FF2BA6] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-3xl font-black md:text-4xl">Tu carta puede estar online hoy.</h2>
            <p className="mt-2 text-white/85">Simple de usar, fácil de mantener y con tu propia identidad.</p>
          </div>
          <Link href="/login" className="rounded-full border-2 border-[#17204A] bg-[#B9FF25] px-7 py-4 font-black text-[#17204A] shadow-[5px_5px_0_#17204A] transition hover:-translate-y-1">
            Comenzar ahora
          </Link>
        </div>
      </section>

      <footer className="bg-[#FFFDF7] py-9">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center md:flex-row">
          <img src="/carta-online-logo.png" alt="Carta Online" className="h-12 w-auto object-contain" />
          <p className="text-sm text-[#596080]">© {new Date().getFullYear()} Carta Online. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}

function AdminPreview() {
  const items = [
    ["Tiradito amazónico", "Tiraditos", "$ 18.900"],
    ["Nigiri de salmón", "Nigiris", "$ 8.500"],
    ["Pesca misoyaki", "Principales", "$ 26.000"],
    ["Mochi de maracuyá", "Postres", "$ 9.800"],
  ];

  return (
    <div className="overflow-hidden rounded-[28px] border-2 border-[#17204A] bg-white shadow-[10px_12px_0_#FF6B00]">
      <div className="flex min-h-[540px]">
        <aside className="hidden w-36 shrink-0 bg-[#971B1E] p-4 text-white sm:block">
          <div className="border-b border-white/20 pb-5 text-center text-xl font-black tracking-[.12em]">MAIDO</div>
          <div className="mt-5 space-y-2 text-xs font-bold">
            <AdminNav icon={UtensilsCrossed} text="Menú" active />
            <AdminNav icon={QrCode} text="QR" />
            <AdminNav icon={Palette} text="Colores" />
            <AdminNav icon={Settings} text="Ajustes" />
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-[#F6F1E8] p-4 sm:p-5">
          <div className="rounded-xl border-l-4 border-[#E43D30] bg-[#971B1E] p-4 text-white shadow-sm">
            <p className="text-lg font-black">Gestionar Menú</p>
            <p className="text-xs text-white/70">Maido</p>
          </div>
          <div className="mt-4 flex gap-2 text-xs font-bold">
            <span className="rounded-md bg-[#971B1E] px-4 py-2 text-white">Items del Menú</span>
            <span className="rounded-md border bg-white px-4 py-2">Categorías</span>
          </div>
          <div className="mt-3 rounded-xl border bg-white shadow-sm">
            <div className="border-b p-4">
              <p className="font-black">Platos y Bebidas</p>
              <p className="text-xs text-[#69708B]">Administrá todos los items de tu menú.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="flex min-w-[150px] flex-1 items-center gap-2 rounded-md border px-3 py-2 text-xs text-[#777D91]">
                  <Search className="h-3.5 w-3.5" /> Nombre o categoría...
                </div>
                <span className="flex items-center gap-1.5 rounded-md bg-[#971B1E] px-3 py-2 text-xs font-bold text-white">
                  <Plus className="h-3.5 w-3.5" /> Agregar Item
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[440px]">
                <div className="grid grid-cols-[22px_1fr_1fr_80px_36px] gap-2 bg-[#F4EFE7] px-3 py-2 text-[10px] font-black uppercase text-[#69708B]">
                  <span /><span>Producto</span><span>Categoría</span><span>Precio</span><span />
                </div>
                {items.map(([name, category, price]) => (
                  <div key={name} className="grid grid-cols-[22px_1fr_1fr_80px_36px] items-center gap-2 border-t px-3 py-3 text-[11px]">
                    <GripVertical className="h-4 w-4 text-[#A3A6B1]" />
                    <span className="truncate font-bold">{name}</span>
                    <span className="truncate text-[#69708B]">{category}</span>
                    <span className="font-bold">{price}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FFE5E2] text-[#E43D30]"><Eye className="h-3.5 w-3.5" /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminNav({ icon: Icon, text, active = false }: { icon: typeof Menu; text: string; active?: boolean }) {
  return (
    <div className={active ? "flex items-center gap-2 rounded-lg bg-[#E43D30] px-3 py-2.5" : "flex items-center gap-2 rounded-lg px-3 py-2.5 text-white/80"}>
      <Icon className="h-4 w-4" /> {text}
    </div>
  );
}

function QuickCheck({ text }: { text: string }) {
  return <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#B9FF25]"><Check className="h-3.5 w-3.5" /></span>{text}</span>;
}

function CheckItem({ text, color }: { text: string; color: string }) {
  return (
    <div className="flex items-center gap-3 font-bold">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#17204A]" style={{ backgroundColor: color }}>
        <Check className={color === palette.green ? "h-4 w-4 text-[#17204A]" : "h-4 w-4 text-white"} />
      </div>
      <span>{text}</span>
    </div>
  );
}
