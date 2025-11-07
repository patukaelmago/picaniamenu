// src/lib/upload-image.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Sube una imagen a Firebase Storage y devuelve la URL pública.
 * @param file Archivo seleccionado desde el input.
 * @returns {Promise<string>} URL de descarga.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!file) throw new Error("No se seleccionó ningún archivo.");

  const filePath = `menu-images/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);

  // Subir el archivo
  await uploadBytes(storageRef, file);

  // Obtener la URL pública
  const url = await getDownloadURL(storageRef);

  return url;
}
