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

// Mails a los clientes: salen de la cuenta de Carta Online (con copia oculta al dueño).
const CLIENTES_USER = "cartaonlinerosario@gmail.com";
let transportClientes: nodemailer.Transporter | null = null;

function getTransportClientes() {
  const pass = process.env.CARTA_GMAIL_APP_PASSWORD;
  if (!pass) return null;
  transportClientes ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: CLIENTES_USER, pass: pass.replace(/\s+/g, "") },
  });
  return transportClientes;
}

// Devuelve si salió. Nunca hace fallar la operación que lo llama.
export async function enviarMail(para: string, asunto: string, lineas: string[]) {
  try {
    const t = getTransportClientes();
    if (!t || !para) return false;
    await t.sendMail({
      from: `Carta Online <${CLIENTES_USER}>`,
      to: para,
      bcc: DESTINO,
      replyTo: CLIENTES_USER,
      subject: asunto,
      text: lineas.join("\n"),
    });
    return true;
  } catch (e) {
    console.error("Mail a cliente:", e);
    return false;
  }
}
