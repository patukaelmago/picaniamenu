// Avisos por mail al dueño de Carta Online (registros y pagos).
import nodemailer from "nodemailer";

const GMAIL_USER = "patriciouskaer@gmail.com";
const DESTINO = "patriciouskaer@gmail.com";

let transport: nodemailer.Transporter | null = null;

function getTransport() {
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return null;
  transport ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: pass.replace(/\s+/g, "") },
  });
  return transport;
}

// Nunca hace fallar la operación que lo llama: si el mail no sale, solo queda en el log.
export async function avisar(asunto: string, lineas: string[]) {
  try {
    const t = getTransport();
    if (!t) return;
    await t.sendMail({
      from: `Carta Online <${GMAIL_USER}>`,
      to: DESTINO,
      subject: `Carta Online: ${asunto}`,
      text: lineas.join("\n"),
    });
  } catch (e) {
    console.error("Aviso por mail:", e);
  }
}
