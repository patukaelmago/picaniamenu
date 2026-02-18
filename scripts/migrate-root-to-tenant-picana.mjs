import admin from "firebase-admin";

const TENANT_ID = "picana";
const PROJECT_ID = "studio-4948282065-ea24d"; // 👈 tu projectId

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();

async function copyCollectionPreserveIds(fromCol, toCol) {
  const snap = await db.collection(fromCol).get();
  console.log(`📦 ${fromCol}: ${snap.size} docs`);

  let batch = db.batch();
  let count = 0;

  for (const d of snap.docs) {
    const targetRef = db
      .collection("tenants")
      .doc(TENANT_ID)
      .collection(toCol)
      .doc(d.id);

    batch.set(targetRef, d.data(), { merge: true });
    count++;

    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`→ copiados ${count}`);
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log(`✅ ${fromCol} copiados: ${count}`);
}

async function main() {
  // asegura el tenant
  await db.collection("tenants").doc(TENANT_ID).set(
    {
      name: "Picaña",
      active: true,
    },
    { merge: true }
  );

  // 🔴 según TUS capturas:
  // root -> categorias
  // root -> menuItems
  await copyCollectionPreserveIds("categorias", "categories");
  await copyCollectionPreserveIds("menuItems", "menuItems");

  console.log("🎉 Migración terminada");
}

main().catch((err) => {
    console.error("❌ Error:", err?.message || err);
    console.error(err?.stack || err);
    process.exit(1);
  });
  
