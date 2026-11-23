import type { Metadata } from "next";
import PaginaLegal from "@/components/legal/PaginaLegal";
import { PROVEEDOR } from "@/lib/proveedor";

export const metadata: Metadata = { title: "Política de privacidad | Carta Online" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="pt-2 text-lg font-bold text-[#151A24]">{children}</h2>;

export default function PrivacidadPage() {
  return (
    <PaginaLegal titulo="Política de privacidad">
      <p className="text-xs">Última actualización: {PROVEEDOR.actualizacion}</p>

      <H>Qué datos guardamos</H>
      <p>
        De los restaurantes: nombre, email de las personas que administran la carta, el contenido de la carta y los datos
        del abono (vencimientos, pagos y avisos). De quienes ven una carta: estadísticas de visitas anónimas (Google
        Analytics). Los datos de tarjetas los procesa Mercado Pago y no llegan a Carta Online.
      </p>

      <H>Para qué los usamos</H>
      <p>
        Para prestar el servicio, cobrar el abono, mandarte avisos y recibos, darte soporte y mejorar el producto. No
        vendemos ni compartimos tus datos con terceros, salvo con los proveedores que hacen funcionar el servicio
        (Google Firebase para el alojamiento, Mercado Pago para los cobros y Gmail para los mails).
      </p>

      <H>Tus derechos</H>
      <p>
        Podés pedir acceso, corrección o eliminación de tus datos escribiendo a {PROVEEDOR.email}. Te respondemos dentro
        de los plazos de la Ley 25.326 de Protección de Datos Personales. La Agencia de Acceso a la Información Pública
        es el órgano de control de esa ley y recibe denuncias por incumplimientos.
      </p>

      <H>Cuánto tiempo los guardamos</H>
      <p>
        Mientras tengas el servicio activo. Si te das de baja, conservamos los datos de cobro el tiempo que exija la ley
        y el resto lo podés pedir eliminar.
      </p>

      <H>Responsable</H>
      <p>
        {PROVEEDOR.titular} · {PROVEEDOR.ciudad} · {PROVEEDOR.email}
      </p>
    </PaginaLegal>
  );
}
