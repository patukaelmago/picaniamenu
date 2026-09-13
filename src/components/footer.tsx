"use client";

import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { PAYMENT_METHODS } from "@/lib/payment-methods";

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
                  className={`${method.footerClassName} w-auto max-w-24 object-contain opacity-90 transition-transform hover:scale-105`}
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
