import net from "node:net";

// Node essaie chaque adresse du serveur (IPv6 puis IPv4) et abandonne au bout de 250 ms.
// Vers la base (us-east-1), une connexion prend jusqu'à 530 ms depuis le Maroc. 4 connexions
// sur 20 échouaient en ETIMEDOUT avec 250 ms, aucune avec 2000 ms (mesuré).
// Importé par Next (instrumentation.ts), le seed et drizzle-kit, qui tournent chacun dans leur processus.
net.setDefaultAutoSelectFamilyAttemptTimeout(2000);
