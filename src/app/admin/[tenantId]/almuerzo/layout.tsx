// src/app/admin/[tenantId]/almuerzo/layout.tsx
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function AlmuerzoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}