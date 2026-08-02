import { db } from "../src/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

async function exportMaido() {
  const tenantId = "maido";

  const restaurant = (
    await getDoc(doc(db, `tenants/${tenantId}/settings/restaurant`))
  ).data();

  const ui = (
    await getDoc(doc(db, `tenants/${tenantId}/settings/ui`))
  ).data();

  const categories = (
    await getDocs(collection(db, `tenants/${tenantId}/categories`))
  ).docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));

  const menuItems = (
    await getDocs(collection(db, `tenants/${tenantId}/menuItems`))
  ).docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));

  console.log(
    JSON.stringify(
      {
        restaurant,
        ui,
        categories,
        menuItems,
      },
      null,
      2
    )
  );
}

exportMaido();