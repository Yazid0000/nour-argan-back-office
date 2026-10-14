// Exécuté une fois au démarrage du serveur Next.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./db/network");
}
