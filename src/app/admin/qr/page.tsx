"use client";

import { useEffect, useState, useRef } from "react";
import { QRCode } from "react-qrcode-logo";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminQrPage() {
    const [menuUrl, setMenuUrl] = useState("");
    const qrRef = useRef<HTMLDivElement | null>(null);

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

    const shareMenu = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Menú Picaña",
                    text: "Accedé al menú actualizado de Picaña",
                    url: menuUrl,
                });
            } catch (err) {
                console.error("Error al compartir", err);
            }
        } else {
            alert("La función Compartir no está soportada en este dispositivo.");
        }
    };

    if (!menuUrl) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-16 w-16 animate-spin text-accent" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center gap-8">

            <h1 className="text-3xl font-bold font-headline text-center">
                Menú Picaña – Código QR
            </h1>

            <p className="text-center text-muted-foreground">
                Escaneá este código o compartí el link del menú.
            </p>

            <Card className="p-6 shadow-xl">
                <CardContent className="p-0">
                    <div ref={qrRef}>
                        <QRCode
                            value={menuUrl}
                            size={256}
                            ecLevel="H"
                            qrStyle="dots"
                            eyeRadius={8}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button
                    onClick={downloadQR}
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                    <Download className="mr-2 h-5 w-5" />
                    Descargar PNG
                </Button>

                <Button
                    onClick={shareMenu}
                    size="lg"
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent/10"
                >
                    <Share2 className="mr-2 h-5 w-5" />
                    Compartir menú
                </Button>
            </div>

        </div>
    );
}
