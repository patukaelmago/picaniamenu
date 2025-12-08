'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';

export default function QrGenerator() {
  const [menuUrl, setMenuUrl] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMenuUrl(`${window.location.origin}/menu`);
    }
  }, []);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector<HTMLCanvasElement>('canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'picana-menu-qr.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
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
      <Card className="p-6 shadow-xl">
        <CardContent className="p-0">
          <div ref={qrRef}>
             <QRCode 
                value={menuUrl} 
                size={256} 
                ecLevel="H"
                qrStyle="dots"
                eyeRadius={8}
                logoImage="/logo.svg"
                logoWidth={80}
                logoHeight={80}
                logoPadding={5}
                logoPaddingStyle="circle"
                removeQrCodeBehindLogo={true}
             />
          </div>
        </CardContent>
      </Card>
      <Button onClick={downloadQR} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
        <Download className="mr-2 h-5 w-5" />
        Descargar PNG
      </Button>
    </div>
  );
}
