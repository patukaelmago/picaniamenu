"use client";

import { useEffect, useState, useRef } from "react";
import { QRCode } from "react-qrcode-logo";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminQrPage() {
  const [menuUrl, setMenuUrl] = useState("");
  const qrRef = useRef<HTMLDivElement | null>(null);

  // URL que va a abrir el QR (el menú público)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMenuUrl(`${window.location.origin}/menu`);
    }
  }, []);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector<HTMLCanvasElement>("canvas");
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "picana-menu-qr.png";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!menuUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-16 w-16 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Código QR</h1>
      <p className="text-muted-foreground">
        Escaneá este código para abrir el menú en el celular.
        También podés descargar el PNG para imprimirlo y ponerlo en las mesas.
      </p>

      <div className="flex flex-col items-center gap-8">
        <Card className="p-6 shadow-xl">
          <CardContent className="p-0">
            <div ref={qrRef}>
              <QRCode
                value={menuUrl}
                size={256}
                ecLevel="H"
                qrStyle="dots"
                eyeRadius={8}
                // cambiá esto por el logo que quieras dentro del QR
                // por ejemplo "/favicon.ico" o "/logorecortado.png"
                logoImage="/favicon.ico"
                logoWidth={64}
                logoHeight={64}
                logoPadding={4}
                logoPaddingStyle="circle"
                removeQrCodeBehindLogo
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={downloadQR}
          size="lg"
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Download className="mr-2 h-5 w-5" />
          Descargar PNG
        </Button>
      </div>
    </div>
  );
}
