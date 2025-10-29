import { Utensils } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export default function Header() {
  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Utensils className="h-8 w-8 text-accent" />
          <span className="text-2xl font-headline font-bold text-foreground">
            Picaña
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/menu">Menú</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/qr">Código QR</Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
             <Link href="/admin">Admin</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
