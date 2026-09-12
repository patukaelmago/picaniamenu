"use client";

import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

const PAYMENT_METHODS = [
  { id: "visa", name: "Visa", image: "/visa.png", className: "h-7 lg:h-12" },
  { id: "mastercard", name: "Mastercard", image: "/mastercard.png", className: "h-7 lg:h-10" },
  { id: "amex", name: "American Express", image: "/amex.png", className: "h-7 lg:h-9" },
  { id: "mercado-pago", name: "Mercado Pago", image: "/mp.png", className: "h-7 lg:h-8" },
] as const;

export default function Footer() {
  const settings = useRestaurantSettings();
  const restaurantName = settings?.name || "Picaña";
  const selectedPaymentMethods = settings?.paymentMethods ?? [];
  const visiblePaymentMethods = PAYMENT_METHODS.filter((method) =>
    selectedPaymentMethods.includes(method.id)
  );

  return (
    <footer className="border-t bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6">
        <div className="flex flex-col items-center gap-2">
          {visiblePaymentMethods.length > 0 && (
            <div
              className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2"
              aria-label="Medios de pago aceptados"
            >
              {visiblePaymentMethods.map((method) => (
                <img
                  key={method.id}
                  src={method.image}
                  alt={method.name}
                  className={`${method.className} w-auto opacity-80 grayscale-[40%] transition-all hover:scale-105 hover:grayscale-0 hover:opacity-100`}
                />
              ))}
            </div>
          )}

          <p className="text-center text-xs text-[hsl(var(--nav-text))]/70">
            © {new Date().getFullYear()} {restaurantName} — Todos los derechos reservados.
          </p>

          <a
            href="https://carta-online.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ir a Carta Online"
            className="mt-1 inline-flex bg-transparent p-0 transition hover:-translate-y-0.5 hover:opacity-80"
          >
            <img
              src="/carta-online-logo.png"
              alt="Carta Online"
              className="h-9 w-auto object-contain"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
