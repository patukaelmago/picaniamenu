import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES, MENU_ITEMS } from '@/lib/data';
import { Layers, Utensils, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboardPage() {
    const totalCategories = CATEGORIES.length;
    const totalItems = MENU_ITEMS.length;
    const lastPublished = new Date(); // Mock data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tu restaurante.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Categorías Totales
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Categorías en el menú
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Totales</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Platos y bebidas en el menú
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Publicación</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {format(lastPublished, "dd MMM, yyyy", { locale: es })}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(lastPublished, "HH:mm 'hs.'", { locale: es })}
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="mt-8">
            <h2 className="text-2xl font-bold font-headline mb-4">Acciones Rápidas</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Quick actions can be added here */}
            </div>
        </div>

    </div>
  );
}
