export default function MenuTenantPage({
    params,
  }: {
    params: { tenantId: string };
  }) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Menu de {params.tenantId}</h1>
      </div>
    );
  }
  