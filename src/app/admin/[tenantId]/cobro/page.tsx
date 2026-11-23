import { redirect } from "next/navigation";

// El cobro de cada local ahora se maneja desde la pantalla Cobros.
export default async function CobroRedirect({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  redirect(`/dashboard/cobros?local=${encodeURIComponent(tenantId)}`);
}
