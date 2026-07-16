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
    <main className="min-h-screen bg-white text-[#515367]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[#515367]/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F0FE]">
              <Menu className="h-7 w-7 text-[#515367]" />
            </div>

            <span className="text-xl font-bold">
              Carta <span className="text-[#4B75FF]">Online</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#funciones" className="hover:text-[#4B75FF]">
              Funcionalidades
            </a>

            <a href="#panel" className="hover:text-[#4B75FF]">
              Panel
            </a>

            <Link href="/menu/picania" className="hover:text-[#4B75FF]">
              Demo
            </Link>
          </nav>

          <Link
            href="/login"
            className="rounded-xl bg-[#4B75FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#515367]"
          >
            Ingresar
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute right-[-160px] top-10 h-[500px] w-[500px] rounded-full bg-[#FF7A00]/20 blur-3xl" />
        <div className="absolute left-[-150px] top-40 h-[400px] w-[400px] rounded-full bg-[#E5F0FE] blur-3xl" />

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-[#E5F0FE] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#4B75FF]">
              Menú digital para restaurantes
            </span>

            <h1 className="mt-7 max-w-xl text-5xl font-bold leading-tight tracking-tight text-[#515367] md:text-6xl">
              Tu carta, siempre{" "}
              <span className="text-[#4B75FF]">actualizada</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#515367]/75">
              Creá tu menú digital, compartilo mediante un código QR y
              actualizá productos y precios desde cualquier dispositivo.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-[#4B75FF] px-6 py-4 font-semibold text-white transition hover:bg-[#515367]"
              >
                Comenzar ahora
                <ExternalLink className="h-4 w-4" />
              </Link>

              <Link
                href="/menu/picana"
                className="rounded-xl border-2 border-[#FF7A00] px-6 py-4 font-semibold text-[#515367] transition hover:bg-[#FF7A00]/15"
              >
                Ver demostración
              </Link>
            </div>

            <div className="mt-12 grid max-w-xl gap-5 sm:grid-cols-3">
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

          {/* VISTA DE CELULAR */}
          <div className="relative flex justify-center">
            <div className="absolute h-[430px] w-[430px] rounded-full bg-[#E5F0FE]" />

            <div className="relative w-[310px] rounded-[42px] border-[10px] border-[#515367] bg-white p-4 shadow-2xl">
              <div className="mx-auto mb-5 h-5 w-24 rounded-full bg-[#515367]" />

              <div className="rounded-3xl bg-[#E5F0FE]/60 p-5">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#515367]">
                    <Menu className="h-8 w-8 text-white" />
                  </div>

                  <h2 className="mt-3 text-2xl font-bold text-[#515367]">
                    Picaña
                  </h2>

                  <p className="text-xs uppercase tracking-[0.25em]">
                    Parrilla
                  </p>
                </div>

                <div className="mt-6 rounded-2xl bg-[#FF7A00] p-5 text-white">
                  <p className="text-sm font-bold uppercase">Nuestra carta</p>
                  <p className="mt-2 text-2xl font-bold">
                    Sabores que se comparten
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <MenuItem name="Provoleta al horno" price="$8.500" />
                  <MenuItem name="Chorizo parrillero" price="$7.200" />
                  <MenuItem name="Mollejas caramelizadas" price="$11.800" />
                  <MenuItem name="Ojo de bife" price="$19.900" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 right-0 hidden rotate-3 rounded-3xl bg-white p-6 shadow-xl lg:block">
              <p className="text-center text-xs font-bold uppercase">
                Escaneá nuestra carta
              </p>

              <QrCode className="mx-auto mt-4 h-28 w-28 text-[#515367]" />

              <p className="mt-3 text-center font-bold text-[#4B75FF]">
                Carta Online
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="bg-[#E5F0FE]/55 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-bold uppercase tracking-wider text-[#FF7A00]">
              Todo en un solo lugar
            </p>

            <h2 className="mt-3 text-4xl font-bold text-[#515367]">
              Todo lo que necesitás para digitalizar tu carta
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-3xl border border-[#515367]/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF7A00]/20">
                  <Icon className="h-6 w-6 text-[#FF7A00]" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#515367]">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-[#515367]/70">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PANEL */}
      <section id="panel" className="py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#515367]/10 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 border-b pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#515367]">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="font-bold">Panel de administración</p>
                <p className="text-xs text-[#515367]/60">
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

            <div className="mt-5 rounded-2xl bg-[#E5F0FE] p-6">
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

            <h2 className="mt-5 text-4xl font-bold leading-tight text-[#515367] md:text-5xl">
              Gestioná todo desde un mismo lugar
            </h2>

            <p className="mt-6 text-lg leading-8 text-[#515367]/70">
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
              className="mt-9 inline-flex rounded-xl bg-[#515367] px-6 py-4 font-semibold text-white transition hover:bg-[#4B75FF]"
            >
              Ingresar al panel
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#515367] py-16 text-white">
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
            className="rounded-xl bg-[#FF7A00] px-7 py-4 font-bold text-[#515367] transition hover:bg-white"
          >
            Comenzar ahora
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center md:flex-row">
          <div className="font-bold">
            Carta <span className="text-[#4B75FF]">Online</span>
          </div>

          <p className="text-sm text-[#515367]/60">
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
      <p className="mt-1 text-xs text-[#515367]/60">{text}</p>
    </div>
  );
}

function MenuItem({ name, price }: { name: string; price: string }) {
  return (
    <div className="flex items-end gap-2 text-xs">
      <span className="font-semibold">{name}</span>
      <span className="mb-1 flex-1 border-b border-dotted border-[#515367]/35" />
      <span className="font-bold">{price}</span>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#515367]/10 p-5">
      <p className="text-3xl font-bold text-[#4B75FF]">{number}</p>
      <p className="mt-1 text-sm text-[#515367]/60">{label}</p>
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