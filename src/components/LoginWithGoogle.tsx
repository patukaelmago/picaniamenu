"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function LoginWithGoogle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const redirectAuthorizedUser = async (email: string) => {
    const normalizedEmail = email.toLowerCase();

    const superSnap = await getDoc(doc(db, "superadmins", normalizedEmail));
    if (superSnap.exists() && superSnap.data()?.enabled === true) {
      router.replace("/select-tenant");
      return;
    }

    const supervisorSnap = await getDoc(doc(db, "supervisors", normalizedEmail));
    if (supervisorSnap.exists() && supervisorSnap.data()?.enabled === true) {
      const tenants: string[] = supervisorSnap.data()?.tenants ?? [];

      router.replace(
        tenants.length === 1
          ? `/admin/${tenants[0]}/menu`
          : "/select-tenant"
      );
      return;
    }

    const tenantsSnap = await getDocs(collection(db, "tenants"));

    for (const tenant of tenantsSnap.docs) {
      const adminSnap = await getDoc(
        doc(db, "tenants", tenant.id, "admins", normalizedEmail)
      );

      if (adminSnap.exists() && adminSnap.data()?.enabled === true) {
        router.replace(`/admin/${tenant.id}/menu`);
        return;
      }
    }

    router.replace("/no-access");
  };

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

      if (!result.user.email) {
        throw new Error("No se pudo leer el email del usuario.");
      }

      await redirectAuthorizedUser(result.user.email);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
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

      if (!result.user.email) {
        throw new Error("No se pudo leer el email del usuario.");
      }

      await redirectAuthorizedUser(result.user.email);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setErrorMessage("No se pudo iniciar sesión con Google.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCredentialsLogin} className="space-y-3">
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Usuario o email"
          aria-label="Usuario o email"
          autoComplete="username"
          required
          className="w-full rounded-xl border border-[#3A3A3A] bg-[#171717] px-4 py-3.5 text-sm text-[#F5EEDC] outline-none transition focus:border-[#4B75FF]"
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          aria-label="Contraseña"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-[#3A3A3A] bg-[#171717] px-4 py-3.5 text-sm text-[#F5EEDC] outline-none transition focus:border-[#4B75FF]"
        />

        {errorMessage && (
          <p className="text-center text-sm text-red-400">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#4B75FF] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#3d65e8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-[#8F8A82]">
        <span className="h-px flex-1 bg-[#3A3A3A]" />
        o
        <span className="h-px flex-1 bg-[#3A3A3A]" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#3A3A3A] bg-[#2B2B2B] px-4 py-3.5 text-sm font-semibold text-[#F5EEDC] shadow-sm transition-all hover:border-[#4B75FF] hover:bg-[#303030] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="h-5 w-5"
        />
        Continuar con Google
      </button>
    </div>
  );
}
