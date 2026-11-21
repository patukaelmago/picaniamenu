import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Devuelve el email si la sesión que manda el pedido es de un superadmin.
export async function superadminDe(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const email = ((await adminAuth.verifyIdToken(token)).email ?? "").toLowerCase();
    const snap = await adminDb.doc(`superadmins/${email}`).get();
    return snap.exists && snap.data()?.enabled === true ? email : null;
  } catch {
    return null;
  }
}
