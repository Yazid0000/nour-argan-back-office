# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Salma, la gérante** (personnage de la démo). Elle tient seule la boutique Nour Argan à Essaouira et gère tout depuis son téléphone, souvent d'une main, le matin et entre deux tâches. Son travail : voir ce qu'il y a à faire, confirmer les commandes par téléphone, gérer produits, photos et stock, suivre les chiffres.
- **Youssef, le préparateur** (personnage de la démo). Il prépare et expédie les colis. Il ne voit que les commandes à préparer et expédiées, et les fait avancer.
- **Le visiteur du portfolio de Yazid** (commerçant, artisan, marque, recruteur). Il entre en un clic sans créer de compte, essaie tout, et doit comprendre l'écran « Aujourd'hui » en 10 secondes.

Quand leurs besoins s'opposent, **l'outil de Salma passe en premier**. La crédibilité auprès du visiteur vient du réalisme du back-office, pas d'effets ajoutés pour impressionner.

## Product Purpose

Le back-office d'une petite boutique en ligne de cosmétiques naturels (fictive) : commandes, produits et stock, clients, statistiques. La boutique côté client n'existe pas, seulement l'outil de gestion.

Réussite :
- Salma sait en 10 secondes ce qu'il y a à faire (commandes à confirmer, colis à préparer, produits bientôt épuisés).
- Confirmer une commande ou ajouter un produit avec photo se fait au téléphone, d'une main, en moins d'une minute.
- Le préparateur ne peut ni voir ni modifier ce qui ne le concerne pas, même en tapant l'adresse.
- Le stock reste juste après confirmation, annulation et retour.
- Pour le portfolio, la démo prouve une vraie application (connexion, rôles, base de données, formulaires validés côté serveur, envoi de photos) et pas seulement un site vitrine.

## Positioning

Un back-office pensé pour un petit commerce marocain qui vend surtout en paiement à la livraison. Les commandes se confirment par téléphone avant l'envoi (boutons Appeler et WhatsApp), les colis refusés à la livraison sont suivis par client, le stock est retiré à la confirmation et remis à l'annulation ou au retour. C'est l'outil que demanderont les futurs clients e-commerce de Yazid, montré à côté de leurs vitrines.

## Operating Context

- Usage surtout mobile (téléphone, au pouce), ordinateur en second avec des tableaux plus larges.
- Ventes au Maroc en dirhams (MAD), quelques commandes en Europe en euros (EUR) payées par carte.
- 15 à 40 commandes par jour, environ 25 produits, certains en plusieurs formats (50 ml, 100 ml, 250 ml).
- Cycle d'une commande : reçue, confirmée, préparée, expédiée, livrée, avec colis refusé, retour après livraison et annulation.
- Démo publique : deux comptes en un clic (« Entrer comme gérante », « Entrer comme préparateur »), données remises à zéro chaque nuit.

## Capabilities and Constraints

- Construit : connexion e-mail et mot de passe avec deux comptes démo, rôles vérifiés côté serveur, commandes avec onglets par statut, recherche et filtre de paiement, détail de commande avec rail de statut, historique et action suivante, produits avec formats, stock, seuil d'alerte et photos, clients avec fiche, statistiques par période, paramètres, préparation des colis pour Youssef.
- Bilingue français (par défaut) et anglais. Mode clair et mode sombre.
- Stock modifié en transaction, jamais négatif, « épuisé » automatiquement à 0.
- Photos envoyées depuis le téléphone, réduites avant l'envoi, stockées dans Vercel Blob.
- Pas encore branchés dans l'interface : l'enregistrement des notes internes (commande et client), le bouton « Enregistrer » des paramètres.
- Hors périmètre, volontairement : la boutique côté client, le vrai paiement, les vrais SMS ou WhatsApp, l'impression d'étiquettes, l'arabe, le mot de passe oublié.

## Brand Commitments

- Nom : **Nour Argan**, marque fictive. Le pied de page le dit (« Projet démo, boutique fictive »).
- Ton : simple, chaleureux, efficace. **Tutoiement.** Libellés courts, sans jargon. Une phrase sympathique seulement dans les états vides et les confirmations (« Tout est expédié. Thé à la menthe mérité. »).
- Jamais de tiret long (—) ni d'emoji dans les textes.
- La direction visuelle validée vit dans `docs/brief-dashboard.md` (section 6) et la maquette `docs/maquette.dc.html`.

## Evidence on Hand

- Brief : `docs/brief-dashboard.md`. Maquette : `docs/maquette.dc.html`.
- Données de démo générées (`src/lib/demo-data.ts`) : 25 produits, 511 clients, 1068 commandes sur 12 mois. Toutes fictives.
- 25 photos produits libres de droits (Pexels) dans `src/db/demo-photos/`, crédits dans `CREDITS.md`. Certaines sont des photos d'ambiance approchantes, pas les vrais produits.
- Aucun vrai client, témoignage, chiffre d'affaires ou logo partenaire. Ne jamais en inventer.

## Product Principles

1. **L'action suivante d'abord.** Chaque écran montre une seule action principale, la prochaine étape logique, à portée de pouce sur mobile.
2. **Le serveur décide.** Rôles, prix, totaux et stock sont toujours vérifiés côté serveur, l'interface ne fait que refléter.
3. **Lisible par quelqu'un qui n'est pas « tech ».** Mots du métier de Salma, états écrits en toutes lettres et pas seulement en couleur.
4. **Réaliste avant spectaculaire.** Ce qu'une vraie gérante utiliserait passe avant ce qui impressionne en démo.
5. **La démo ne se casse pas.** Tout peut être essayé, rien n'est durablement abîmé.

## Accessibility & Inclusion

Exigences fermes avant la mise en ligne : Lighthouse mobile ≥ 90 en performance et ≥ 95 en accessibilité, navigation complète au clavier, contrastes WCAG AA en mode clair et en mode sombre, zones tactiles de 44 px minimum, animations coupées avec `prefers-reduced-motion`.
