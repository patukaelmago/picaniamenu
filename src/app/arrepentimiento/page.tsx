import type { Metadata } from "next";
import PaginaLegal from "@/components/legal/PaginaLegal";
import FormBaja from "../baja/FormBaja";

export const metadata: Metadata = { title: "Botón de arrepentimiento | Carta Online", robots: { index: false } };

export default function ArrepentimientoPage() {
  return (
    <PaginaLegal titulo="Botón de arrepentimiento">
      <p>
        Si contrataste Carta Online hace 10 días corridos o menos, podés arrepentirte sin dar explicaciones: cortamos el
        servicio, cancelamos el débito y te devolvemos lo que pagaste.
      </p>
      <FormBaja tipoInicial="arrepentimiento" />
    </PaginaLegal>
  );
}
