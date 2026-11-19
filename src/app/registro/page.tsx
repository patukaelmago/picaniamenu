"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { REGISTRO_ABIERTO } from "@/lib/registro";
import LoginWithGoogle from "@/components/LoginWithGoogle";

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

const inputClass =
  "w-full rounded-xl border border-[#3A3A3A] bg-[#171717] px-4 py-3 text-sm text-[#F5EEDC] outline-none transition focus:border-[#2563EB]";

export default function RegistroPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [mpEmail, setMpEmail] = useState("");
  const [soloPagar, setSoloPagar] = useState(false);
  const [modo, setModo] = useState<null | "registro" | "login">(null);

  useEffect(() => {
    const pagar = new URLSearchParams(window.location.search).get("pagar") === "1";
    setSoloPagar(pagar);
    if (pagar) setModo("registro");
  }, []);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (u?.email) setMpEmail((prev) => prev || u.email!.toLowerCase());
        setChecking(false);
      }),
    []
  );

  async function loginWithGoogle() {
    setError("");
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      setError("No se pudo ingresar con Google.");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || sending) return;
    setSending(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, slug, mpEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo completar el registro.");
      if (data.pagoUrl) {
        window.location.href = data.pagoUrl;
        return;
      }
      router.replace(`/admin/${data.tenantId}/inicio`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar el registro.");
      setSending(false);
    }
  }

  const missing =
    !mpEmail.includes("@") || (!soloPagar && (name.trim().length < 2 || slug.length < 3));

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F3F1EC] px-5 py-6 text-[#F5EEDC]">
      <div className="relative w-full max-w-md">
        <Link href="/" className="mx-auto mb-4 block w-fit" aria-label="Carta Online">
          <img src="/carta-online-logo-orange.svg" alt="Carta Online" className="h-16 w-auto object-contain" />
        </Link>

        <section className="overflow-hidden rounded-3xl border border-[#3A3A3A] bg-[#202020] shadow-2xl">
          <div className="h-1 bg-gradient-to-r from-[#2563EB] to-[#FF6B00]" />
          <div className="space-y-5 p-6">
            {modo === null ? (
              <>
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Bienvenido</h1>
                  <p className="mt-2 text-sm leading-5 text-[#B8B2A7]">¿Qué querés hacer?</p>
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setModo("login")}
                    className="w-full rounded-2xl border border-[#3A3A3A] bg-[#2B2B2B] px-5 py-4 text-left transition hover:border-[#2563EB]"
                  >
                    <span className="block text-base font-bold">Ya tengo cuenta</span>
                    <span className="mt-0.5 block text-sm text-[#B8B2A7]">Ingresar a mi panel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModo("registro")}
                    className="w-full rounded-2xl bg-[#FF6B00] px-5 py-4 text-left text-[#171717] transition hover:bg-[#ff8a2e]"
                  >
                    <span className="block text-base font-bold">Registrar mi restaurante</span>
                    <span className="mt-0.5 block text-sm">Carta digital con QR por $25.000 por mes</span>
                  </button>
                </div>
              </>
            ) : modo === "login" ? (
              <>
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Ingresá a tu panel</h1>
                  <p className="mt-2 text-sm leading-5 text-[#B8B2A7]">
                    Iniciá sesión para gestionar tu carta.
                  </p>
                </div>
                <LoginWithGoogle />
                <button
                  type="button"
                  onClick={() => setModo(null)}
                  className="mx-auto block text-xs text-[#8F8A82] underline"
                >
                  Volver
                </button>
              </>
            ) : (
            <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Registrá tu restaurante</h1>
              <p className="mt-2 text-sm leading-5 text-[#B8B2A7]">
                Tu carta digital con código QR por $25.000 por mes. Se paga con Mercado Pago y la
                carta se publica apenas se acredita el pago.
              </p>
            </div>

            {!REGISTRO_ABIERTO ? (
              <p className="text-center text-sm text-[#B8B2A7]">
                El registro todavía no está disponible. Si querés tu carta, escribinos y la armamos con vos.
              </p>
            ) : checking ? (
              <p className="text-center text-sm text-[#B8B2A7]">Cargando...</p>
            ) : !user ? (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#3A3A3A] bg-[#2B2B2B] px-4 py-3 text-sm font-semibold transition hover:border-[#2563EB]"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt=""
                  className="h-4 w-4"
                />
                Continuar con Google
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-center text-xs text-[#B8B2A7]">
                  Vas a registrarte con {user.email}.{" "}
                  <button type="button" onClick={() => signOut(auth)} className="underline">
                    Usar otra cuenta
                  </button>
                </p>

                {!soloPagar && (
                <>
                <div className="space-y-1.5">
                  <label htmlFor="r-name" className="text-sm font-semibold">
                    Nombre del restaurante
                  </label>
                  <input
                    id="r-name"
                    value={name}
                    maxLength={60}
                    placeholder="Ej: La Esquina"
                    className={inputClass}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slugEdited) setSlug(toSlug(e.target.value));
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="r-slug" className="text-sm font-semibold">
                    Dirección de tu carta
                  </label>
                  <input
                    id="r-slug"
                    value={slug}
                    placeholder="la-esquina"
                    className={inputClass}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(toSlug(e.target.value));
                    }}
                  />
                  <p className="text-xs text-[#B8B2A7]">
                    carta-online.com/menu/<span className="text-[#F5EEDC]">{slug || "..."}</span>
                  </p>
                </div>
                </>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="r-mp" className="text-sm font-semibold">
                    Email de tu cuenta de Mercado Pago
                  </label>
                  <input
                    id="r-mp"
                    type="email"
                    value={mpEmail}
                    className={inputClass}
                    onChange={(e) => setMpEmail(e.target.value.trim())}
                  />
                  <p className="text-xs text-[#B8B2A7]">Con esa cuenta vas a pagar el abono mensual.</p>
                </div>

                {error && <p className="text-center text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={missing || sending}
                  className="w-full rounded-xl bg-[#FF6B00] px-4 py-3 text-sm font-semibold text-[#171717] transition hover:bg-[#ff8a2e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Un momento..." : soloPagar ? "Ir a pagar" : "Crear mi carta y pagar"}
                </button>
              </form>
            )}

            {!soloPagar && (
              <button
                type="button"
                onClick={() => setModo(null)}
                className="mx-auto block text-xs text-[#8F8A82] underline"
              >
                Volver
              </button>
            )}
            </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
