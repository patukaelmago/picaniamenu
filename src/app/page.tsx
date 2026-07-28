import Link from "next/link";
import {
  BarChart3,
  Check,
  ExternalLink,
  Heart,
  LayoutDashboard,
  Menu,
  Pencil,
  QrCode,
  Smartphone,
  Store,
} from "lucide-react";

const features = [
  {
    icon: Menu,
    title: "Menú ilimitado",
    text: "Agregá categorías, productos, precios y fotos sin límites.",
  },
  {
    icon: Pencil,
    title: "Fácil de actualizar",
    text: "Modificá tu carta en segundos desde un panel simple.",
  },
  {
    icon: Store,
    title: "Multi-restaurante",
    text: "Gestioná distintos locales desde una misma cuenta.",
  },
  {
    icon: Smartphone,
    title: "Diseño adaptable",
    text: "Tu carta se ve perfecta en celulares, tablets y computadoras.",
  },
  {
    icon: QrCode,
    title: "Acceso por QR",
    text: "Tus clientes ingresan sin descargar aplicaciones.",
  },
  {
    icon: Heart,
    title: "Soporte incluido",
    text: "Estamos para ayudarte cuando lo necesites.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#171717] text-[#F5EEDC]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[#3A3A3A] bg-[#171717]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2B2B2B]">
              <Menu className="h-7 w-7 text-[#F5EEDC]" />
            </div>

            <span className="text-xl font-bold">
              Carta <span className="text-[#4B75FF]">Online</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#funciones" className="relative py-2 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#FF7A00] after:transition-transform hover:after:scale-x-100">
              Funcionalidades
            </a>

            <a href="#panel" className="relative py-2 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#FF7A00] after:transition-transform hover:after:scale-x-100">
              Panel
            </a>

            <Link href="/menu/picana" className="relative py-2 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#FF7A00] after:transition-transform hover:after:scale-x-100">
              Demo
            </Link>
          </nav>

          <Link
            href="/login"
            className="rounded-xl bg-[#4B75FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#FF7A00]"
          >
            Ingresar
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute right-[-160px] top-10 h-[500px] w-[500px] rounded-full bg-[#FF7A00]/20 blur-3xl" />
        <div className="absolute left-[-150px] top-40 h-[400px] w-[400px] rounded-full bg-[#4B75FF]/15 blur-3xl" />

        <div className="relative mx-auto grid min-h-[calc(100svh-64px)] max-w-7xl items-center gap-8 px-6 py-8 lg:grid-cols-2 lg:py-6">
          <div>
            <span className="inline-flex rounded-full bg-[#4B75FF]/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#4B75FF]">
              Menú digital para restaurantes
            </span>

            <h1 className="mt-5 max-w-xl text-5xl font-bold leading-tight tracking-tight text-[#F5EEDC] md:text-6xl">
              Tu carta, siempre{" "}
              <span className="text-[#4B75FF]">actualizada</span>
            </h1>

            <p className="mt-4 max-w-xl text-lg leading-8 text-[#B8B2A7]">
              Creá tu menú digital, compartilo mediante un código QR y
              actualizá productos y precios desde cualquier dispositivo.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-[#4B75FF] px-6 py-4 font-semibold text-white transition hover:bg-[#FF7A00]"
              >
                Comenzar ahora
                <ExternalLink className="h-4 w-4" />
              </Link>

              <Link
                href="/menu/picana"
                className="rounded-xl border-2 border-[#FF7A00] px-6 py-4 font-semibold text-[#F5EEDC] transition hover:bg-[#FF7A00]/15"
              >
                Ver demostración
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl gap-5 sm:grid-cols-3">
              <MiniBenefit
                icon={Pencil}
                title="Actualización rápida"
                text="Cambios al instante"
              />

              <MiniBenefit
                icon={QrCode}
                title="Acceso por QR"
                text="Sin instalaciones"
              />

              <MiniBenefit
                icon={BarChart3}
                title="Todo organizado"
                text="Desde tu panel"
              />
            </div>
          </div>

          {/* VISTA REAL DEL MENÚ EN CELULAR */}
          <div className="relative flex justify-center">
            <div className="absolute inset-12 rounded-full bg-[#4B75FF]/15 blur-3xl" />
            <div className="absolute bottom-10 right-14 h-40 w-40 rounded-full bg-[#FF7A00]/15 blur-3xl" />

            <div className="relative rounded-[32px] border border-[#3A3A3A] bg-[#202020] p-3 shadow-2xl">
              <img
                src="/hero-picana-phone.webp"
                alt="Menú digital de Picaña mostrado en un celular"
                className="h-auto max-h-[500px] w-auto max-w-full rounded-[22px] object-contain lg:max-h-[520px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="bg-[#202020] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-bold uppercase tracking-wider text-[#FF7A00]">
              Todo en un solo lugar
            </p>

            <h2 className="mt-3 text-4xl font-bold text-[#F5EEDC]">
              Todo lo que necesitás para digitalizar tu carta
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-3xl border border-[#3A3A3A] bg-[#202020] p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF7A00]/20">
                  <Icon className="h-6 w-6 text-[#FF7A00]" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#F5EEDC]">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-[#B8B2A7]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PANEL */}
      <section id="panel" className="bg-[#171717] py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#3A3A3A] bg-[#202020] p-6 shadow-xl">
            <div className="flex items-center gap-3 border-b pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#343434]">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="font-bold">Panel de administración</p>
                <p className="text-xs text-[#B8B2A7]">
                  Gestioná tu restaurante
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Stat number="128" label="Productos" />
              <Stat number="12" label="Categorías" />
              <Stat number="246" label="Visitas" />
              <Stat number="89" label="Actualizaciones" />
            </div>

            <div className="mt-5 rounded-2xl bg-[#2B2B2B] p-6">
              <div className="flex h-40 items-end gap-3">
                {[35, 55, 42, 75, 62, 90, 72, 100].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-lg bg-[#4B75FF]"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <span className="inline-flex rounded-full bg-[#FF7A00]/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FF7A00]">
              Panel intuitivo
            </span>

            <h2 className="mt-5 text-4xl font-bold leading-tight text-[#F5EEDC] md:text-5xl">
              Gestioná todo desde un mismo lugar
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#B8B2A7]">
              Actualizá precios, agregá productos, cambiá imágenes y organizá
              categorías desde cualquier dispositivo.
            </p>

            <div className="mt-7 space-y-4">
              <CheckItem text="Cambios visibles inmediatamente" />
              <CheckItem text="Panel sencillo y fácil de usar" />
              <CheckItem text="Acceso protegido con Google" />
            </div>

            <Link
              href="/login"
              className="mt-9 inline-flex rounded-xl bg-[#343434] px-6 py-4 font-semibold text-white transition hover:bg-[#4B75FF]"
            >
              Ingresar al panel
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-[#3A3A3A] bg-[#202020] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-3xl font-bold">
              ¿Listo para digitalizar tu carta?
            </h2>

            <p className="mt-2 text-white/70">
              Empezá a gestionar tu menú de una forma más simple.
            </p>
          </div>

          <Link
            href="/login"
            className="rounded-xl bg-[#FF7A00] px-7 py-4 font-bold text-[#F5EEDC] transition hover:bg-[#F5EEDC] hover:text-[#171717]"
          >
            Comenzar ahora
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#3A3A3A] bg-[#171717] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center md:flex-row">
          <div className="font-bold">
            Carta <span className="text-[#4B75FF]">Online</span>
          </div>

          <p className="text-sm text-[#B8B2A7]">
            © {new Date().getFullYear()} Carta Online. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}

function MiniBenefit({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Pencil;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF7A00]/20">
        <Icon className="h-5 w-5 text-[#FF7A00]" />
      </div>

      <p className="mt-3 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-[#B8B2A7]">{text}</p>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#3A3A3A] p-5">
      <p className="text-3xl font-bold text-[#4B75FF]">{number}</p>
      <p className="mt-1 text-sm text-[#B8B2A7]">{label}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF7A00]/20">
        <Check className="h-4 w-4 text-[#FF7A00]" />
      </div>

      <span className="font-medium">{text}</span>
    </div>
  );
}