import { redirect } from "next/navigation";

// La pantalla de cobros ahora está dentro del panel del dueño.
export default async function CobrosRedirect({ searchParams }: { searchParams: Promise<{ local?: string }> }) {
  const { local } = await searchParams;
  redirect(local ? `/dashboard/cobros?local=${encodeURIComponent(local)}` : "/dashboard/cobros");
}
