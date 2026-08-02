import { db } from "../src/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import fs from "fs";
import path from "path";

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
  ).docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const menuItems = (
    await getDocs(collection(db, `tenants/${tenantId}/menuItems`))
  ).docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const output = `export const maidoDemo = ${JSON.stringify(
    {
      restaurant,
      ui,
      categories,
      menuItems,
    },
    null,
    2
  )};`;

  fs.writeFileSync(
    path.join(process.cwd(), "src/demo-data/maido.ts"),
    output,
    "utf8"
  );

  console.log("✅ Demo exportado correctamente.");
}

exportMaido().catch(console.error);