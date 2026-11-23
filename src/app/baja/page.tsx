import type { Metadata } from "next";
import PaginaLegal from "@/components/legal/PaginaLegal";
import FormBaja from "./FormBaja";

export const metadata: Metadata = { title: "Botón de baja", robots: { index: false } };

export default function BajaPage() {
  return (
    <PaginaLegal titulo="Botón de baja">
      <p>
        Podés dar de baja tu carta y el abono mensual cuando quieras, sin iniciar sesión. Se cancela el débito automático
        y no se te vuelve a cobrar.
      </p>
      <FormBaja tipoInicial="baja" />
    </PaginaLegal>
  );
}
