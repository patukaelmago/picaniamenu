"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_TENANT } from "@/lib/tenants";

export default function LoginWithGoogle() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const findAuthorizedTenantAndRedirect = async (email: string) => {
    try {
      const lowEmail = email.toLowerCase();

      const superSnap = await getDoc(doc(db, "superadmins", lowEmail));
      if (superSnap.exists() && superSnap.data()?.enabled === true) {
        router.replace(`/admin/${DEFAULT_TENANT}/menu`);
        return;
      }

      const tenantsSnap = await getDocs(collection(db, "tenants"));

      for (const t of tenantsSnap.docs) {
        const tenantId = t.id;
        const adminSnap = await getDoc(
          doc(db, "tenants", tenantId, "admins", lowEmail)
        );

        if (adminSnap.exists() && adminSnap.data()?.enabled === true) {
          router.replace(`/admin/${tenantId}/menu`);
          return;
        }
      }

      router.replace("/no-access");
    } catch (error) {
      console.error("Error al buscar tenant autorizado:", error);
      setErrorMessage("No se pudo comprobar el acceso.");
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        findAuthorizedTenantAndRedirect(user.email);
      } else {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  const handleCredentialsLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");
      await setPersistence(auth, browserLocalPersistence);

      const value = identifier.trim().toLowerCase();
      const email = value.includes("@")
        ? value
        : `demo-${value}@carta-online.com`;

      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user.email) {
        await findAuthorizedTenantAndRedirect(result.user.email);
      }
    } catch (error) {
      console.error("Error en login con contraseña:", error);
      setErrorMessage("Usuario o contraseña incorrectos.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);

      if (result.user.email) {
        await findAuthorizedTenantAndRedirect(result.user.email);
      }
    } catch (error) {
      console.error("Error en login con Google:", error);
      setErrorMessage("No se pudo iniciar sesión con Google.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#171717]">
        <p className="animate-pulse text-[#F5EEDC]/70">
          Comprobando sesión...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#171717] p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-[#222222] p-8 text-center shadow-2xl">
        <img
          src="/carta-online-logo.png"
          alt="Carta Online"
          className="mx-auto h-24 w-auto object-contain"
        />

        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold text-[#F5EEDC]">
            Panel de Control
          </h1>
          <p className="text-sm text-[#F5EEDC]/65">
            Iniciá sesión para gestionar tu menú
          </p>
        </div>

        <form onSubmit={handleCredentialsLogin} className="space-y-3 text-left">
          <div>
            <label
              htmlFor="identifier"
              className="mb-1.5 block text-sm text-[#F5EEDC]"
            >
              Usuario o email
            </label>
            <input
              id="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="maido"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-white/15 bg-[#171717] px-4 py-3 text-[#F5EEDC] outline-none transition focus:border-[#4B75FF]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm text-[#F5EEDC]"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-white/15 bg-[#171717] px-4 py-3 text-[#F5EEDC] outline-none transition focus:border-[#4B75FF]"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-400">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#4B75FF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3d65e8] disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-[#F5EEDC]/45">
          <span className="h-px flex-1 bg-white/10" />
          o
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-[#2B2B2B] px-4 py-3 text-sm font-medium text-[#F5EEDC] transition hover:border-[#4B75FF] disabled:opacity-50"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="h-5 w-5"
          />
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
