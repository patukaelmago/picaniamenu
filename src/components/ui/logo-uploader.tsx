"use client";
import { useState, useEffect } from "react";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function LogoUploader() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "settings", "restaurant"));
      const data = snap.data() as any;
      if (data?.logoUrl) setCurrentUrl(data.logoUrl);
    })();
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setError(null);
    setProgress(0);
  };

  const upload = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const path = `logos/restaurant-${Date.now()}-${file.name}`;
      const sref = ref(storage, path);
      const task = uploadBytesResumable(sref, file);

      await new Promise<string>((resolve, reject) => {
        task.on(
          "state_changed",
          s => setProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
          err => reject(err),
          async () => resolve(await getDownloadURL(task.snapshot.ref))
        );
      }).then(async (url) => {
        await setDoc(
          doc(db, "settings", "restaurant"),
          { logoUrl: url, updatedAt: serverTimestamp() },
          { merge: true }
        );
        setCurrentUrl(url);
      });
    } catch (e: any) {
      setError(e?.message ?? "Error subiendo el logo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {currentUrl ? (
          <img src={currentUrl} alt="Logo" className="h-20 w-20 object-contain border rounded-lg" />
        ) : (
          <div className="h-20 w-20 border rounded-lg flex items-center justify-center text-sm opacity-70">Sin logo</div>
        )}
        <div className="space-y-2">
          <input type="file" accept="image/*" onChange={onFile} />
          <button onClick={upload} disabled={!file || saving} className="px-3 py-1.5 border rounded-lg">
            {saving ? `Subiendo… ${progress}%` : "Subir y guardar"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
