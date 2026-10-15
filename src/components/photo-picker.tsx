"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { upload } from "@vercel/blob/client";
import { CameraIcon, StarIcon, XIcon } from "@phosphor-icons/react/ssr";
import { MAX_PHOTOS, MAX_SIDE, MAX_SOURCE_BYTES, PHOTO_FOLDER, PHOTO_TYPE } from "@/lib/photos";
import { discardPhoto } from "@/lib/product-actions";
import { cx } from "./ui";

// Une photo envoyée a son url. Les autres attendent leur tour ou sont en route, avec un aperçu local.
type Photo = { key: string; url?: string; preview?: string; progress: number };
type PhotoError = "type" | "size" | "count" | "failed";

const tile = "relative aspect-square w-[88px] flex-none overflow-hidden rounded-lg lg:w-24";
const corner = "absolute flex size-7 items-center justify-center rounded-full bg-surface/90 text-text shadow-sm";
// Le voile de la maquette reste sombre en mode clair comme en mode sombre, le texte dessus reste blanc.
const veil = "absolute inset-0 bg-[rgb(15_18_20/0.68)] text-white";

/** Un nom de fichier sans espaces ni accents. Vercel Blob y ajoute un suffixe aléatoire. */
const fileName = (name: string) => `${name.toLowerCase().normalize("NFD").replace(/\.[^.]*$/, "").replace(/[^a-z0-9]+/g, "-").slice(-50)}.jpg`;

/**
 * Réduit la photo à 1600 px de côté en JPEG, sur un fond blanc pour les images transparentes.
 * Une photo de téléphone de 6 Mo part en quelques centaines de Ko. Lève une erreur si l'image est illisible.
 */
async function shrink(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, PHOTO_TYPE, 0.85));
  if (!blob) throw new Error("toBlob");
  return blob;
}

/**
 * Les photos d'un produit. Elles partent une par une, directement du navigateur vers Vercel Blob,
 * puis leurs adresses sont envoyées avec le formulaire (champs cachés « photos », dans l'ordre).
 */
export function PhotoPicker({ initial, error, onBusyChange }: { initial: string[]; error?: string; onBusyChange: (busy: boolean) => void }) {
  const t = useTranslations("productForm");
  const common = useTranslations("common");
  const [photos, setPhotos] = useState<Photo[]>(() => initial.map((url) => ({ key: url, url, progress: 100 })));
  const [problem, setProblem] = useState<PhotoError | null>(null);
  // Le lot en cours, pour le bandeau « Envoi des photos, 1 sur 2 ».
  const [batch, setBatch] = useState<{ current: number; total: number } | null>(null);
  const abort = useRef<AbortController | null>(null);

  // Le formulaire bloque l'enregistrement tant qu'un lot est en route.
  useEffect(() => onBusyChange(batch !== null), [batch, onBusyChange]);

  const update = (key: string, change: Partial<Photo>) => setPhotos((ps) => ps.map((p) => (p.key === key ? { ...p, ...change } : p)));

  async function add(files: File[]) {
    const room = MAX_PHOTOS - photos.length;
    const readable = files.filter((f) => f.type.startsWith("image/") && f.size <= MAX_SOURCE_BYTES);
    // Un seul message à la fois, le plus utile d'abord.
    setProblem(readable.length > room ? "count" : files.some((f) => !f.type.startsWith("image/")) ? "type" : readable.length < files.length ? "size" : null);

    const queued = readable.slice(0, room).map((file, i) => ({ file, key: `new-${Date.now()}-${i}`, preview: URL.createObjectURL(file) }));
    if (queued.length === 0) return;
    setPhotos((ps) => [...ps, ...queued.map(({ key, preview }) => ({ key, preview, progress: 0 }))]);

    const controller = new AbortController();
    abort.current = controller;
    for (const [i, item] of queued.entries()) {
      if (controller.signal.aborted) break;
      setBatch({ current: i + 1, total: queued.length });
      try {
        const blob = await upload(`${PHOTO_FOLDER}${fileName(item.file.name)}`, await shrink(item.file), {
          access: "public",
          handleUploadUrl: "/api/photos",
          abortSignal: controller.signal,
          onUploadProgress: ({ percentage }) => update(item.key, { progress: percentage }),
        });
        update(item.key, { url: blob.url, preview: undefined, progress: 100 });
      } catch {
        if (!controller.signal.aborted) setProblem("failed");
        setPhotos((ps) => ps.filter((p) => p.key !== item.key));
      }
    }
    // Les aperçus locaux ne servent plus, y compris ceux des photos jamais parties après « Annuler ».
    for (const item of queued) URL.revokeObjectURL(item.preview);
    setBatch(null);
  }

  /** « Annuler » arrête le lot. Les photos déjà envoyées restent, les autres disparaissent. */
  function cancel() {
    abort.current?.abort();
    setPhotos((ps) => ps.filter((p) => p.url));
  }

  function remove(photo: Photo) {
    setPhotos((ps) => ps.filter((p) => p.key !== photo.key));
    // Une photo de ce produit est effacée à l'enregistrement. Une photo toute neuve, tout de suite.
    if (photo.url && !initial.includes(photo.url)) discardPhoto(photo.url);
  }

  const makeMain = (key: string) =>
    setPhotos((ps) => {
      const chosen = ps.find((p) => p.key === key);
      return chosen ? [chosen, ...ps.filter((p) => p.key !== key)] : ps;
    });

  const message = problem ? t(`photoErrors.${problem}`, { max: MAX_PHOTOS }) : error;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">{t("photos")}</h2>
        <span className="font-mono text-xs text-text-2">{photos.length} / {MAX_PHOTOS}</span>
      </div>
      {batch && (
        <div role="status" className="flex items-center justify-between gap-2.5 rounded-lg border border-border bg-surface px-3 text-sm">
          <span>{t("photoBatch", batch)}</span>
          <button type="button" onClick={cancel} className="min-h-11 font-medium text-accent">
            {common("cancel")}
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {photos.length < MAX_PHOTOS && !batch && (
          <label className={cx(tile, "flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-text-2 bg-surface px-2 text-center text-xs font-medium focus-within:outline-2 focus-within:outline-accent")}>
            <CameraIcon aria-hidden size={22} />
            {t("addPhoto")}
            {/* Sans capture, le téléphone propose l'appareil photo ou la galerie. */}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                add([...(e.target.files ?? [])]);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {photos.map((p, i) => {
          const waiting = !p.url && p.progress === 0;
          return (
            <div key={p.key} className={tile}>
              {p.url ? (
                <Image src={p.url} alt="" fill sizes="96px" className="object-cover" />
              ) : (
                // L'aperçu local est une adresse blob: que Next ne sait pas redimensionner.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.preview} alt="" className="size-full object-cover" />
              )}
              {!p.url &&
                (waiting ? (
                  <span className={cx(veil, "flex items-center justify-center text-xs font-medium")}>{t("photoWaiting")}</span>
                ) : (
                  <span className={cx(veil, "flex flex-col justify-end gap-1.5 p-2")}>
                    <span className="font-mono text-xs font-semibold">{Math.round(p.progress)} %</span>
                    <span className="h-1 rounded-full bg-white/35">
                      <span className="block h-full rounded-full bg-white" style={{ width: `${p.progress}%` }} />
                    </span>
                  </span>
                ))}
              {p.url && i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-[#16181D]">{t("main")}</span>
              )}
              {p.url && i > 0 && (
                <button type="button" aria-label={t("photoMakeMain", { n: i + 1 })} onClick={() => makeMain(p.key)} className={cx(corner, "top-1 left-1")}>
                  <StarIcon aria-hidden size={14} />
                </button>
              )}
              {p.url && (
                <button type="button" aria-label={t("photoRemove", { n: i + 1 })} onClick={() => remove(p)} className={cx(corner, "top-1 right-1")}>
                  <XIcon aria-hidden size={14} />
                </button>
              )}
              {p.url && <input type="hidden" name="photos" value={p.url} />}
            </div>
          );
        })}
      </div>
      {message ? <p role="alert" className="text-xs text-err-fg">{message}</p> : <p className="text-xs text-text-2">{t("photosHint")}</p>}
    </section>
  );
}
