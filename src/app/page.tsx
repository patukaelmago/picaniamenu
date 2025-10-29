import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import Link from "next/link";
import { Utensils } from 'lucide-react';

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === "hero-landing");

  return (
    <main className="relative min-h-screen flex items-center justify-center text-center p-4">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          data-ai-hint={heroImage.imageHint}
          fill
          className="object-cover -z-10 brightness-50"
        />
      )}
      <div className="relative z-10 flex flex-col items-center space-y-6 text-white">
        <Utensils className="w-20 h-20 text-accent" />
        <h1 className="text-6xl md:text-8xl font-headline font-bold text-shadow-lg">
          Picaña
        </h1>
        <p className="text-xl md:text-2xl font-body max-w-2xl">
          Donde Carne y Cerveza se Hermanan.
        </p>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-8 px-10">
          <Link href="/menu">Ver Menú</Link>
        </Button>
      </div>
    </main>
  );
}
