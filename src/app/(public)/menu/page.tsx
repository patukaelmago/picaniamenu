import { CATEGORIES, MENU_ITEMS } from '@/lib/data';
import MenuClient from './menu-client';

export default async function MenuPage() {
  // In a real app, you would fetch this data from Firestore
  const categories = CATEGORIES.filter(c => c.isVisible).sort((a, b) => a.order - b.order);
  const menuItems = MENU_ITEMS.filter(i => i.isVisible);

  return <MenuClient categories={categories} menuItems={menuItems} />;
}
