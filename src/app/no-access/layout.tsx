import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso restringido",
  robots: { index: false, follow: false },
};

export default function NoAccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
