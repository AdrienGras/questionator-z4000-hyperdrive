# Backlog & idées

Choses identifiées comme "à faire un jour" mais pas prioritaires. Si tu trouves une
amélioration en passant, note-la ici plutôt que de l'oublier ou de la coder
maintenant.

Une fois faite, déplace-la en `INDEX.md` (livré) ou supprime-la (abandonnée).

Organise les entrées par thème (`## <Thème>`), chaque idée étant une case à cocher
`- [ ] …`.

---

## Outillage

- [ ] Passer `.nvmrc` (et la CI) à Node 26 une fois LTS (prévu le 2026-10-28) ; Node 24 passe en maintenance le 2026-10-20.
- [ ] Évaluer oxfmt en remplacement de Prettier + prettier-plugin-tailwindcss quand il sort en 1.0 (tri Tailwind natif via `sortTailwindcss`).

## Config

- [ ] JSON Schema : descriptions et défauts (`.meta({ description })` depuis le tableau de `PRODUCT.md` §6.2) pour l'aide au survol dans VSCode.
- [ ] Identifiants de catégorie/question avec espaces en bord (`'a-1 '`) ou en formes Unicode différentes (NFC/NFD) : erreur ou avertissement.
- [ ] Test d'alignement entre `INTEGER_FIELDS` (`from-zod.ts`) et les champs `z.int()` du schéma.
- [ ] Vérifier en F06 que le chunk qui charge le validateur n'embarque pas les composants Tabler (seulement `iconsList`, ~20 Ko gzip).

## Notation

- [ ] `formatScore` en `final` : si `finalScale` a plus de décimales que le pas (ex. 20,25 au pas de 0,5, déjà signalé par `final_scale_off_grid`), Intl arrondit l'affichage de la note plafonnée (« 20,3 »). Prendre le max des décimales du pas et de `finalScale`, ou refuser ce cas en F02.
- [ ] Valider en F04/F11 les données persistées (ajustement hors bornes, attempt `scored` sans `score`) : aujourd'hui `computeScores` lève sur donnée corrompue.

## Persistance

- [ ] Relire `navigator.storage.persisted()` sur `visibilitychange` : le navigateur peut accorder la persistance de lui-même (PWA installée), l'indicateur de F05 resterait sinon à `best-effort` jusqu'au rechargement.
- [ ] Première migration de schéma (`version(2)`) : tester l'ouverture d'un ancien onglet sur une base déjà montée de version.

## Écran de passage

- [ ] Raccourcis clavier : chiffres pour les valeurs du barème, touches pour les catégories, raccourci de skip.

## Accueil et backup

- [ ] Ignorer le glisser-déposer pendant qu'un dialogue d'import est ouvert (aujourd'hui un second fichier remplace le conflit en attente) et pendant un import en cours.
- [ ] Surimpression de dépôt : compteur `dragenter`/`dragleave` au lieu du test `relatedTarget` (WebKit envoie `relatedTarget = null`, scintillement possible).
- [ ] Garder le contenu des dialogues d'import pendant l'animation de fermeture (il disparaît dès que l'état revient à `idle`).
- [ ] Dédoublonner les issues identiques avant affichage (clé React `chemin|message`).
- [ ] Tests manquants : erreurs d'écriture (renommer, examinateur, suppression), réinitialisation du champ à la réouverture d'un dialogue, « toutes les issues » avec un décompte exact, `score` sur un attempt `skipped`, date locale vs UTC du nom de fichier (cas à 00:30).
- [ ] Désactiver « Annuler » pendant un enregistrement en cours dans les dialogues de saisie.
- [ ] Ajouter un favicon (404 sur `/favicon.ico` en preview et en prod).
