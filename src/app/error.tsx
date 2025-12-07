"use client";

export default function ErrorPage({ error }: { error: Error }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Ocurrió un error</h1>
      <pre>{error.message}</pre>
    </div>
  );
}
