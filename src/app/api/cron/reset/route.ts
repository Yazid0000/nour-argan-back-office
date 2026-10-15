import { timingSafeEqual } from "node:crypto";
import { resetDemo } from "@/db/reset";

// La remise à zéro prend une dizaine de secondes (base aux États-Unis, photos de démo vérifiées dans Blob).
export const maxDuration = 60;

/** Vrai si l'appel porte le secret partagé avec Vercel. Comparaison à temps constant, pour ne rien laisser deviner. */
function fromVercelCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Appelée chaque nuit par le cron de Vercel (vercel.json). Remet la démo à zéro pour les visiteurs du lendemain. */
export async function GET(request: Request) {
  if (!fromVercelCron(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await resetDemo());
}
