import QrGenerator from '@/components/qr-generator';

export default function QrPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col items-center text-center">
      <div className="space-y-4 mb-8 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">Accedé a Nuestro Menú</h1>
        <p className="text-lg text-muted-foreground">
          Escaneá el código QR con tu celular para ver nuestro menú digital actualizado al instante.
        </p>
      </div>
      <QrGenerator />
    </div>
  );
}
