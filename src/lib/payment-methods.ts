export const PAYMENT_METHODS = [
  { id: "visa", name: "Visa", image: "/visa.png", footerClassName: "h-7 lg:h-12" },
  { id: "mastercard", name: "Mastercard", image: "/mastercard.png", footerClassName: "h-7 lg:h-10" },
  { id: "amex", name: "American Express", image: "/amex.png", footerClassName: "h-7 lg:h-9" },
  { id: "maestro", name: "Maestro", image: "/payment-methods/maestro.svg", footerClassName: "h-8 lg:h-10" },
  { id: "cabal", name: "Cabal", image: "/payment-methods/cabal.png", footerClassName: "h-8 lg:h-10" },
  { id: "naranja-x", name: "Naranja X", image: "/payment-methods/naranja-x.png", footerClassName: "h-8 lg:h-10" },
  { id: "mercado-pago", name: "Mercado Pago", image: "/mp.png", footerClassName: "h-7 lg:h-8" },
  { id: "modo", name: "MODO", image: "/payment-methods/modo.png", footerClassName: "h-8 lg:h-10" },
  { id: "uala", name: "Ualá", image: "/payment-methods/uala.svg", footerClassName: "h-8 lg:h-10" },
] as const;
