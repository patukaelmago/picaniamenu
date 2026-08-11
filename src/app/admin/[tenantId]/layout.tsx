import type { Metadata } from "next";

const tenantDisplayName = (tenantId: string) =>
  tenantId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}): Promise<Metadata> {
  const { tenantId } = await params;
  return { title: tenantDisplayName(tenantId) };
}

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
