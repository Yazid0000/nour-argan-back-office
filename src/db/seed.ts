// Vide la base et la remplit avec les données de démo. Lancer avec npm run db:seed
import "./network";
import { resetDemo } from "./reset";

resetDemo()
  .then((r) => {
    console.log(`Base remplie : ${r.accounts} comptes démo, ${r.products} produits, ${r.customers} clients, ${r.orders} commandes.`);
    console.log(`Photos : ${r.photosDeleted} ajoutées pendant la démo effacées, ${r.demoPhotos} photos de démo en place.`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
