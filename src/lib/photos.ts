// Les règles des photos produits, lues à la fois par le navigateur, la route d'envoi et l'action d'enregistrement.

export const MAX_PHOTOS = 8;
/** Une photo plus lourde n'est même pas ouverte par le téléphone. */
export const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
/** Le téléphone réduit chaque photo à 1600 px de côté, en JPEG, avant de l'envoyer. */
export const MAX_SIDE = 1600;
/** Ce que Vercel Blob accepte après la réduction. Une photo réduite pèse quelques centaines de Ko. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_TYPE = "image/jpeg";
/** Le dossier des photos produits dans Vercel Blob. */
export const PHOTO_FOLDER = "produits/";

/**
 * L'adresse de notre espace Vercel Blob, lue dans la clé (vercel_blob_rw_<espace>_<secret>).
 * L'identifiant de l'espace est public, il figure dans l'adresse de chaque photo. Seul le secret ne sort jamais.
 */
export function blobHost() {
  const store = process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
  return store ? `${store.toLowerCase()}.public.blob.vercel-storage.com` : null;
}

/** Une photo rangée par nous dans notre espace, et pas une image prise ailleurs sur le web. */
export function isPhotoUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === blobHost() && url.pathname.startsWith(`/${PHOTO_FOLDER}`);
  } catch {
    return false;
  }
}
