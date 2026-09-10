import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seleccionar restaurante",
  robots: { index: false, follow: false },
};

export default function SelectTenantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
