import { redirect } from "next/navigation";

export default function TenantAdminPage({
  params,
}: {
  params: { tenantId: string };
}) {
  if (params.tenantId === "picana") {
    redirect(`/admin/${params.tenantId}/almuerzo`);
  }

  redirect(`/admin/${params.tenantId}/menu`);
}