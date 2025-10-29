import { Utensils, Twitter, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-8 md:flex-row md:px-6">
        <div className="flex items-center gap-2">
          <Utensils className="h-6 w-6 text-accent" />
          <span className="font-headline text-lg font-bold">Picaña</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Picaña Restaurante. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4">
          <Link href="#" aria-label="Twitter">
            <Twitter className="h-5 w-5 hover:text-accent transition-colors" />
          </Link>
          <Link href="#" aria-label="Instagram">
            <Instagram className="h-5 w-5 hover:text-accent transition-colors" />
          </Link>
          <Link href="#" aria-label="Facebook">
            <Facebook className="h-5 w-5 hover:text-accent transition-colors" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
