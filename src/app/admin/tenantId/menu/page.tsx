import MenuManager from "@/components/admin/MenuManager";

export default function TenantMenuPage({
  params,
}: {
  params: { tenantId: string };
}) {
  return <MenuManager tenantId={params.tenantId} />;
}