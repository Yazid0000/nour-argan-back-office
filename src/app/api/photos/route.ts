import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { MAX_PHOTO_BYTES, PHOTO_FOLDER, PHOTO_TYPE } from "@/lib/photos";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/session";

// La démo est ouverte à tous. 40 photos par heure et par adresse IP suffisent largement à Salma,
// et empêchent un script de remplir l'espace Vercel Blob.
const uploads = rateLimit(40, 60 * 60 * 1000);

/**
 * Le navigateur envoie la photo directement à Vercel Blob. Avant, il demande ici une autorisation
 * à usage unique. On ne la donne qu'à la gérante, pour un JPEG de 10 Mo au plus (le téléphone l'a déjà réduit).
 */
export async function POST(request: Request) {
  // Pas de session, ou pas le bon rôle. requireRole lève une erreur ou redirige, on refuse dans les deux cas.
  try {
    await requireRole("manager");
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const ip = clientIp(request.headers);
  if (uploads.reached(ip)) return NextResponse.json({ error: "tooMany" }, { status: 429 });

  try {
    uploads.record(ip);
    const result = await handleUpload({
      request,
      body: (await request.json()) as HandleUploadBody,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(PHOTO_FOLDER) || pathname.length > 120) throw new Error("bad pathname");
        // Le suffixe aléatoire rend l'adresse impossible à deviner, et deux photos du même nom ne s'écrasent pas.
        return { allowedContentTypes: [PHOTO_TYPE], maximumSizeInBytes: MAX_PHOTO_BYTES, addRandomSuffix: true };
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
}
