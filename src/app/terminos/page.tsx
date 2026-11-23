import type { Metadata } from "next";
import PaginaLegal from "@/components/legal/PaginaLegal";
import { PRECIO_BASE, pesos, DIA_CORTE, DIAS_AVISO } from "@/lib/cobros-shared";
import { PROVEEDOR } from "@/lib/proveedor";

export const metadata: Metadata = { title: "Términos y condiciones | Carta Online" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="pt-2 text-lg font-bold text-[#151A24]">{children}</h2>;

export default function TerminosPage() {
  return (
    <PaginaLegal titulo="Términos y condiciones">
      <p className="text-xs">Última actualización: {PROVEEDOR.actualizacion}</p>

      <H>1. Quién presta el servicio</H>
      <p>
        Carta Online es un servicio de {PROVEEDOR.titular}, con domicilio en {PROVEEDOR.ciudad}. Contacto: {PROVEEDOR.email} ·
        WhatsApp {PROVEEDOR.whatsapp}.{PROVEEDOR.cuit ? ` CUIT ${PROVEEDOR.cuit}.` : ""}
      </p>

      <H>2. Qué incluye</H>
      <p>
        Una carta digital para tu restaurante con dirección propia y código QR, un panel para cargar y editar platos,
        precios, fotos y colores, y las funciones que figuran en carta-online.com. Vos sos responsable del contenido que
        cargás (precios, descripciones, imágenes y alérgenos).
      </p>

      <H>3. Precio y forma de pago</H>
      <p>
        El abono es mensual. El precio vigente es de {pesos(PRECIO_BASE)} por mes, salvo que hayas acordado otro por
        escrito. Se paga por adelantado con débito automático de Mercado Pago (tarjeta o dinero en cuenta) o, si así lo
        acordamos, por transferencia o en efectivo. Los datos de tu tarjeta los guarda Mercado Pago; Carta Online no los
        recibe.
      </p>
      <p>
        El abono se renueva solo todos los meses hasta que lo des de baja. Si cambia el precio, te avisamos por mail con
        al menos 30 días de anticipación y podés darte de baja antes de que se aplique.
      </p>

      <H>4. Falta de pago</H>
      <p>
        Si un pago no se acredita, te avisamos por mail los días {DIAS_AVISO.join(", ")} desde el vencimiento. Si al día{" "}
        {DIA_CORTE} sigue pendiente, la carta se pausa y deja de verse por el QR. No se borra nada: vuelve a verse cuando
        se registra el pago.
      </p>

      <H>5. Baja</H>
      <p>
        Podés dar de baja el servicio cuando quieras, sin iniciar sesión, desde el{" "}
        <a href="/baja" className="font-semibold underline">botón de baja</a> o desde “Mi abono” en tu panel. Te damos un
        código de la solicitud, cancelamos el débito y no se te vuelve a cobrar. La carta sigue visible hasta el fin del
        período que ya pagaste; no se devuelven fracciones de mes.
      </p>

      <H>6. Arrepentimiento</H>
      <p>
        Dentro de los 10 días corridos desde que contrataste podés revocar la contratación sin dar explicaciones ni
        pagar nada, desde el <a href="/arrepentimiento" className="font-semibold underline">botón de arrepentimiento</a>.
        Cortamos el servicio y te devolvemos lo que hayas pagado.
      </p>

      <H>7. Disponibilidad</H>
      <p>
        Trabajamos para que la carta esté siempre en línea, pero puede haber interrupciones por mantenimiento o por
        fallas de los proveedores de internet o de hosting. No somos responsables por pérdidas indirectas derivadas de
        esas interrupciones.
      </p>

      <H>8. Datos personales</H>
      <p>
        Tratamos tus datos según la <a href="/privacidad" className="font-semibold underline">política de privacidad</a>.
      </p>

      <H>9. Cambios y ley aplicable</H>
      <p>
        Podemos actualizar estos términos; los cambios importantes te los avisamos por mail. Se aplican las leyes de la
        República Argentina. Ante cualquier reclamo escribinos primero a {PROVEEDOR.email}. Si sos consumidor, también
        podés acudir a la autoridad de Defensa del Consumidor de tu jurisdicción.
      </p>
    </PaginaLegal>
  );
}
