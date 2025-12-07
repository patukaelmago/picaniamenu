export default function NoAccessPage() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff7e3]">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-[#1b3059] mb-3">
            Acceso restringido
          </h1>
          <p className="text-sm text-slate-600">
            Esta sección del panel es solo para administradores autorizados.
          </p>
        </div>
      </div>
    );
  }
  