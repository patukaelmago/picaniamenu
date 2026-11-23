"use client";

import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

// Sesión del dueño dentro del panel y un fetch que ya manda su token.
export const DuenoContext = createContext<{ user: User | null }>({ user: null });

export function useDueno() {
  const { user } = useContext(DuenoContext);
  async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await user?.getIdToken();
    const res = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json() as Promise<T>;
  }
  return { user, api };
}
