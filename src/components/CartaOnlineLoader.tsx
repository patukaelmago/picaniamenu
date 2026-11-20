import Image from "next/image";

// Pantalla de carga con la marca de Carta Online (la misma del ingreso al panel).
export default function CartaOnlineLoader({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-[#171717] px-6 text-[#F5EEDC] ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 40%, rgba(75,116,255,0.12), transparent 34%), radial-gradient(circle at 85% 85%, rgba(255,107,26,0.10), transparent 28%)",
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center">
        <Image
          src="/carta-online-logo.png"
          alt="Carta Online"
          width={220}
          height={132}
          priority
          className="h-auto w-[190px] sm:w-[220px]"
        />
        <div className="mt-8 h-9 w-9 animate-spin rounded-full border-[3px] border-[#FF6B1A] border-t-[#4B74FF]" />
        <p className="mt-5 text-sm tracking-wide text-[#F5EEDC]/80">{text}</p>
      </div>
    </div>
  );
}
