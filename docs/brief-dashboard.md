# Brief : Back-office boutique « Nour Argan » (dashboard, projet démo n°3)

> Projet démo n°3 pour le portfolio de Yazid. La boutique est **fictive** : nom, produits, commandes et clients sont inventés. Le pied de page l'indique (« Projet démo, boutique fictive »).
> Flux : ce brief → maquette dans Claude Design → code avec Claude Code → Vercel (repo dédié).

---

## 1. Le client (fictif)

- **Nour Argan**, petite marque de cosmétiques naturels à **Essaouira** : huile d'argan, savon noir, ghassoul, eau de rose, coffrets cadeaux.
- Tenue par **Salma** (la gérante) et **Youssef** (il prépare et expédie les colis). Une coopérative de femmes fournit l'huile.
- Vend en ligne au Maroc (livraison partout, **paiement à la livraison** surtout) et un peu en Europe (paiement par carte).
- ~25 produits, certains avec variantes (50 ml / 100 ml / 250 ml), 15 à 40 commandes par jour.

Ici on ne fait **pas la boutique**, on fait **son back-office** : l'outil où Salma et Youssef gèrent commandes, produits et stock.

Pourquoi ce sujet : c'est exactement ce que demanderont les futurs clients e-commerce de Yazid (« et moi, comment j'ajoute mes produits ? comment je vois mes commandes ? »). Le portfolio montre ainsi la vitrine (riad, landing) **et** l'outil de gestion.

## 2. Objectif

1. Le matin, sur son téléphone, Salma voit en 10 secondes **ce qu'il y a à faire** : commandes à confirmer, colis à préparer, produits bientôt épuisés.
2. Elle ajoute ou modifie un produit en moins d'une minute, photo comprise, **depuis son téléphone**.
3. Youssef voit uniquement ce dont il a besoin pour préparer les colis.

**Objectif portfolio** : prouver que Yazid sait faire une **vraie application** (connexion, rôles, base de données, données protégées, formulaires validés côté serveur, envoi de photos), pas seulement des sites vitrines. Un visiteur doit pouvoir l'essayer **en un clic, sans créer de compte**.

## 3. Cibles

| Qui | Ce qu'il cherche |
|---|---|
| Visiteur du portfolio (commerçant, artisan, marque, recruteur) | Entrer en un clic, voir des données crédibles, tout essayer sans rien casser |
| Salma, gérante (dans l'histoire) | Chiffres du jour, confirmer les commandes, gérer produits et stock, souvent sur téléphone |
| Youssef, préparateur (dans l'histoire) | Liste des colis à préparer, cocher « expédiée », rien d'autre |

**Mobile-first pour de vrai** : un back-office de petit commerce s'utilise surtout sur téléphone. Desktop soigné aussi (tableaux plus larges, plus de colonnes).

## 4. Ton et contenu

- **Ton** : simple, chaleureux, efficace. Libellés courts, pas de jargon (« Commandes à confirmer », pas « Pipeline de fulfillment »). Une phrase sympathique seulement dans les états vides et les confirmations (« Tout est expédié. Thé à la menthe mérité. »).
- **Vouvoiement ou tutoiement** : **tutoiement** (c'est l'outil de Salma, pas une page commerciale). À changer si tu préfères.
- **Langues** : FR (par défaut) et EN, comme les autres projets. Montants en **MAD** (dirham) et en EUR pour les commandes Europe.
- Boutons d'entrée sur la page de connexion : **« Entrer comme gérante »** et **« Entrer comme préparateur »** (les deux comptes démo, pour montrer les rôles).

### Données de démo (inventées)
- 25 produits avec photos libres de droits, prix de 45 à 420 MAD, 3 produits avec variantes, 2 en rupture, 3 sous le seuil d'alerte.
- ~400 commandes sur 3 mois (villes : Casablanca, Rabat, Marrakech, Tanger, Agadir, quelques-unes Paris, Lyon, Bruxelles), ~250 clients.
- Statuts réalistes : la plupart livrées, une dizaine à confirmer, une dizaine à préparer, quelques retours et annulations.

## 5. Écrans

### Public
1. **Connexion `/connexion`** : e-mail + mot de passe, et les deux boutons de compte démo. Une phrase pour dire ce que c'est (« Le back-office d'une boutique en ligne, projet démo »).

### Dans l'app (connecté)
2. **Aujourd'hui `/app`** (tableau de bord)
   - 3 ou 4 chiffres du jour : **ventes du jour**, **commandes à confirmer**, **colis à préparer**, **panier moyen** (avec comparaison à la semaine dernière).
   - Graphique des **ventes des 30 derniers jours**.
   - **« À faire »** : liste d'actions courtes (8 commandes à confirmer par téléphone, 3 produits bientôt épuisés, 2 retours à traiter).
   - **Meilleures ventes** de la semaine (top 5).
3. **Commandes `/app/commandes`** : onglets par statut (**À confirmer, À préparer, Expédiées, Livrées, Retours/Annulées**), recherche (n°, nom, téléphone, ville), filtre par mode de paiement. Sur mobile : cartes compactes avec le montant, la ville et un bouton d'action direct.
4. **Détail d'une commande `/app/commandes/[id]`** : client (nom, téléphone avec **bouton d'appel et WhatsApp**, adresse), articles, total, mode de paiement, **rail de statut** (Reçue → Confirmée → Préparée → Expédiée → Livrée), historique (qui a fait quoi et quand), note interne. Bouton principal = la prochaine étape (« Confirmer », « Marquer préparée »…). Annuler ou enregistrer un retour remet le stock à jour.
5. **Produits `/app/produits`** : grille (mobile) ou tableau (desktop) avec photo, nom, prix, stock et **jauge de stock**, filtre « en rupture / stock faible », recherche.
6. **Fiche produit `/app/produits/[id]` et `/app/produits/nouveau`** : nom FR/EN, description, prix, prix barré (promo), catégorie, variantes (taille, prix, stock), seuil d'alerte, **photos (prises directement avec le téléphone, redimensionnées automatiquement)**, en ligne / masqué. **Stock à 0 = « épuisé » automatiquement.**
7. **Clients `/app/clients`** et **fiche client** : liste (nom, ville, nombre de commandes, total dépensé), fiche avec historique et un indicateur « commandes refusées à la livraison » (utile avec le paiement à la livraison).
8. **Statistiques `/app/statistiques`** : ventes par période, par produit, par ville, taux de confirmation et taux de retour. Sélecteur de période (7 j, 30 j, 3 mois).
9. **Paramètres `/app/parametres`** : profil, langue, mode sombre, frais de livraison par zone, gestion de l'équipe (gérante seulement), « Réinitialiser les données de démo », déconnexion.

### Rôles
- **Gérante** : tout.
- **Préparateur** : voit seulement les commandes « À préparer » et « Expédiées », peut les faire avancer ; pas d'accès aux chiffres, aux produits, aux clients ni aux paramètres. Les menus interdits n'apparaissent pas, **et** le serveur refuse si on tape l'adresse à la main.

### Navigation
- Mobile : **barre d'onglets en bas** (Aujourd'hui, Commandes, Produits, Plus) + bouton « + » pour un produit.
- Desktop : **barre latérale** à gauche.

### États à dessiner
Chargement (squelettes), liste vide, recherche sans résultat, erreur de formulaire, envoi de photo en cours, confirmation (« Commande confirmée. Elle passe dans À préparer. »), accès refusé pour le préparateur.

## 6. Direction visuelle (à passer avec design-taste-frontend)

**Lecture du design** : back-office mobile-first pour un petit commerce, clair, rapide, rassurant pour quelqu'un qui n'est pas « tech ». Tailwind v4 + Motion, sans design system officiel.
**Réglages** : originalité de mise en page 5/10, animation 3/10, densité 6/10.

**Ambiance** : l'arrière-boutique bien rangée. Les photos de produits apportent la chaleur, l'interface reste neutre autour. On évite les clichés « dashboard généré par IA » : **dégradés, cartes à halo coloré, fond noir avec néons, verre dépoli, graphiques décoratifs, icônes dans des ronds de couleur partout, emoji**. Et côté Maroc : pas de motifs zellige ni d'arches (c'était le riad), pas de beige + doré.

- **Palette** (nouvelle, différente du riad et de Soldé) avec **un seul accent** :
  - Fond `#F5F5F2`, surfaces `#FFFFFF` avec bordure `#E4E3DE`
  - Texte `#16181D`, texte secondaire `#5D6270`
  - Accent **bleu pétrole** `#0F5E63` (bouton principal, liens, onglet actif)
  - **États** en petites pastilles avec un mot (lisibles sans la couleur) : vert pour livrée, ambre pour à confirmer / stock faible, rouge `#B3261E` pour rupture / retour, gris pour annulée. Teintes exactes à fixer en maquette, contraste AA obligatoire.
  - Mode sombre : fond `#0F1214`, surfaces `#171B1E`, texte `#ECEBE7`, accent `#5CC4C0`.
- **Typographies** : **Schibsted Grotesk** pour les titres et chiffres clés, **Geist** pour l'interface, **Geist Mono** à chiffres tabulaires pour les prix, quantités, numéros de commande et téléphones (alignés à droite dans les tableaux).
- **Signature** : la **jauge de stock**, une barre fine sous chaque produit qui passe de l'accent à l'ambre puis au rouge. C'est le seul élément graphique « maison ».
- **Formes** : arrondi 8 px, bordures plutôt qu'ombres. **Zones tactiles de 44 px minimum** partout (utilisé au pouce).
- **Photos** : produits uniquement, carrées, fond clair, via `next/image`.
- **Animations** (Motion, discrètes) : chiffres du jour qui montent au chargement, carte de commande qui glisse vers l'onglet suivant quand on la fait avancer, changement d'onglet fluide. Tout se coupe avec `prefers-reduced-motion`.

### Règles de mise en page à respecter
- Les chiffres du jour ne sont **pas des cartes identiques avec icône** : une bande de chiffres séparés par des filets.
- Un seul bouton principal par écran, et c'est toujours **la prochaine action logique**.
- Sur mobile, l'action principale est à portée de pouce (en bas de l'écran).
- Pas de tiret long (—) dans les textes.

## 7. Fonctionnalités

- **Authentification** e-mail + mot de passe, **deux comptes démo en un clic**, déconnexion, `/app/*` inaccessible sans session.
- **Rôles** gérante / préparateur, vérifiés côté serveur dans chaque action.
- **CRUD** produits, variantes, commandes, clients via Server Actions, validation **Zod** côté serveur.
- **Stock** : décrémenté à la confirmation, recrédité à l'annulation ou au retour, « épuisé » automatique à 0, alerte sous le seuil. Opérations faites en **transaction** (pas de stock négatif si deux personnes cliquent en même temps).
- **Totaux et prix toujours calculés côté serveur**.
- **Envoi de photos** depuis le téléphone (stockage Vercel Blob, redimensionnement automatique, taille et type de fichier vérifiés).
- **Historique** : chaque changement de statut garde qui et quand.
- **Compte démo réinitialisé chaque nuit** (Vercel Cron) pour que les visiteurs puissent tout modifier sans le casser durablement.
- Bilingue FR/EN avec next-intl (même config que les autres projets), `Intl.NumberFormat` pour MAD et EUR, `Intl.DateTimeFormat` pour les dates.
- Mode sombre.
- `noindex` sur tout `/app` ; seule la page de connexion est indexable.

## 8. Stack technique

Même base que les autres projets, plus ce qu'il faut pour une vraie app :

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, Motion, next-intl
- **Base de données : Postgres chez Neon** (gratuit, branché à Vercel depuis le Marketplace)
- **ORM : Drizzle** (schéma des tables écrit en TypeScript)
- **Authentification : Better Auth** (comptes, sessions, mots de passe hachés et rôles, dans notre propre base)
- **Zod** pour valider les formulaires
- **Vercel Blob** pour les photos
- **Recharts** pour les graphiques (chargé seulement sur Aujourd'hui et Statistiques)
- Déploiement Vercel, repo GitHub séparé (`nour-argan-admin` par exemple)

**Notions nouvelles à prévoir** (expliquées au moment du code, c'est le gros morceau de ce projet) :
- **Base de données relationnelle** : tables (utilisateurs, produits, variantes, commandes, lignes de commande, clients, historique), clés étrangères, index.
- **ORM et migrations** : décrire les tables en TypeScript, faire évoluer le schéma sans tout casser.
- **Sessions et cookies**, mots de passe **hachés** (jamais stockés en clair).
- **Authentification ≠ autorisation** : « qui es-tu ? » (connexion) puis « as-tu le droit ? » (rôle), vérifié dans chaque Server Action, pas seulement en cachant des menus.
- **Protection des routes** avec `proxy.ts` (l'ancien `middleware` de Next.js) pour rediriger les visiteurs non connectés.
- **Transactions** : plusieurs écritures en base qui réussissent ou échouent ensemble (commande + stock).
- **Validation côté serveur avec Zod**.
- **Upload de fichiers** et pourquoi on vérifie le type et la taille.
- **Seed** (script qui remplit la base de données de démo), **variables d'environnement**, **cron**.

## 9. Critères de réussite

- Un visiteur entre en un clic depuis le portfolio et comprend l'écran « Aujourd'hui » en 10 secondes.
- Confirmer une commande ou ajouter un produit avec photo se fait **au téléphone, d'une main**, en moins d'une minute.
- Le préparateur ne peut ni voir ni modifier ce qui ne le concerne pas, même en tapant l'URL (testé à la main et avec le skill **vibe-security**).
- Le stock reste juste après confirmation, annulation et retour.
- Lighthouse ≥ 90 en performance et ≥ 95 en accessibilité sur mobile, navigation au clavier, contrastes AA en clair et en sombre.
- Présenté dans la section Projets du portfolio avec capture et lien « Essayer la démo ».

## 10. Hors périmètre (volontairement)

La boutique côté client, le vrai paiement (CMI, Stripe), les vrais SMS / WhatsApp, l'impression d'étiquettes transporteur, l'arabe (RTL), mot de passe oublié. On peut les citer dans le portfolio comme « évolutions possibles ».

---

## Prompt prêt à coller dans Claude Design

```
Utilise le skill design-taste-frontend.

Crée la maquette d'un back-office (dashboard) mobile-first, avec sa version desktop.

Nour Argan, boutique en ligne fictive de cosmétiques naturels à Essaouira (huile d'argan, savon noir, ghassoul, eau de rose, coffrets). Vente au Maroc surtout en paiement à la livraison, un peu en Europe par carte. Deux utilisateurs : Salma, la gérante, qui gère tout depuis son téléphone, et Youssef, le préparateur, qui ne voit que les colis à préparer. Objectif : le matin, en 10 secondes, savoir ce qu'il y a à faire. Ton simple et chaleureux, tutoiement, une phrase sympathique seulement dans les états vides.

Ambiance « arrière-boutique bien rangée » : interface neutre et claire, les photos de produits apportent la chaleur. Évite absolument : dégradés, cartes à halo coloré, fond noir avec néons, verre dépoli, graphiques décoratifs, icônes dans des ronds de couleur, cartes de chiffres identiques avec icône, emoji, motifs zellige, arches, beige et doré.

Palette avec un seul accent : fond #F5F5F2, surfaces #FFFFFF avec bordure #E4E3DE, texte #16181D, texte secondaire #5D6270, accent bleu pétrole #0F5E63 (bouton principal, liens, onglet actif). États en petites pastilles avec un mot, lisibles sans la couleur : vert livrée, ambre à confirmer ou stock faible, rouge #B3261E rupture ou retour, gris annulée. Version sombre : fond #0F1214, surfaces #171B1E, texte #ECEBE7, accent #5CC4C0.
Typo : Schibsted Grotesk pour les titres et chiffres clés, Geist pour l'interface, Geist Mono à chiffres tabulaires pour prix, quantités, numéros et téléphones. Arrondi 8 px, bordures plutôt qu'ombres, zones tactiles de 44 px minimum.
Signature : une jauge de stock fine sous chaque produit, qui passe du bleu pétrole à l'ambre puis au rouge.

Navigation : sur mobile, barre d'onglets en bas (Aujourd'hui, Commandes, Produits, Plus) et bouton « + » ; sur desktop, barre latérale à gauche. Un seul bouton principal par écran, toujours la prochaine action logique, à portée de pouce sur mobile.

Écrans :
1. Connexion : e-mail, mot de passe, et deux boutons « Entrer comme gérante » et « Entrer comme préparateur ».
2. Aujourd'hui : bande de chiffres séparés par des filets (ventes du jour en MAD, commandes à confirmer, colis à préparer, panier moyen avec comparaison), graphique des ventes sur 30 jours, liste « À faire » (commandes à confirmer, produits bientôt épuisés, retours), top 5 des ventes de la semaine.
3. Commandes : onglets À confirmer, À préparer, Expédiées, Livrées, Retours/Annulées ; recherche ; sur mobile, cartes compactes (n°, nom, ville, montant, paiement) avec un bouton d'action direct.
4. Détail d'une commande : client avec boutons Appeler et WhatsApp, adresse, articles avec photos, total, mode de paiement, rail de statut Reçue → Confirmée → Préparée → Expédiée → Livrée, historique, note interne, bouton de la prochaine étape.
5. Produits : grille de cartes sur mobile, tableau sur desktop, avec photo, prix, stock et jauge ; filtres rupture / stock faible.
6. Fiche produit (création) : photos prises au téléphone, nom, description, prix, prix barré, catégorie, variantes (50 ml, 100 ml, 250 ml avec prix et stock), seuil d'alerte, interrupteur en ligne / masqué.
7. La vue du préparateur : seulement les colis à préparer, avec la liste des articles à mettre dans chaque colis et un bouton « Marquer préparée ».

Dessine aussi : un état vide (« Tout est expédié. Thé à la menthe mérité. »), un chargement en squelettes, une erreur de formulaire, un envoi de photo en cours.

Règles : aucun tiret long dans les textes. Contrastes WCAG AA en clair et en sombre.
```

Ensuite (étapes suivantes) : Clients, Statistiques et Paramètres en deuxième passe, après l'audit `impeccable` des premiers écrans.
