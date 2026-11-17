// Eventos de Google Analytics para la carta pública.
// Si Analytics no cargó (bloqueador, sin conexión), no hace nada.
type GtagFn = (command: "event", name: string, params: Record<string, string>) => void;

export function trackEvent(name: string, params: Record<string, string>) {
  try {
    const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
    if (typeof gtag === "function") gtag("event", name, params);
  } catch {
    // nunca rompe la carta
  }
}
