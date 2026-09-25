# Décisions produit et techniques

Registre des arbitrages tranchés, du plus ancien au plus récent. Chaque entrée : la
question, la décision, le pourquoi, et où elle est reportée. `PRODUCT.md` reste la
source de vérité ; ce fichier garde la trace de **pourquoi** il dit ce qu'il dit.

Format : `## D<NN> — Sujet (AAAA-MM-JJ)`, puis `**Question**`, `**Décision**`,
`**Pourquoi**`, `**Reporté dans**`.

---

## D01 — Précision numérique des notes : 3 décimales, millièmes, fraction exacte (2026-09-24)

**Question** : `PRODUCT.md` §5 proposait de calculer en millièmes, alors que
`rounding.decimals` acceptait jusqu'à 4 décimales (pas de 0,0001, non représentable en
millièmes). Par ailleurs la conversion `plafonnée × finalScale / maxRawScore` ne tombe
pas forcément sur un nombre entier de millièmes (/20 avec plafond à 7).

**Décision** :
- `rounding.decimals` limité à 0–3.
- Toute valeur numérique de notation (barème, `maxRawScore`, `finalScale`,
  `rounding.step`, `absent.value`, ajustement) a au plus 3 décimales ; erreur de
  validation sinon.
- Notes stockées et additionnées en millièmes entiers.
- Conversion conservée en fraction exacte (numérateur / dénominateur entiers) jusqu'à
  son arrondi au pas demandé (ordre des arrondis : voir D02).

**Pourquoi** : aucune dérive flottante possible, pas de dépendance (pas de lib
décimale), et 3 décimales couvrent largement tout barème d'oral réaliste.

**Reporté dans** : `PRODUCT.md` §5 (précision et représentation), §6.2 (champ
`rounding.decimals`, règle de validation des 3 décimales). Impacte F02 et F03.

## D02 — Arrondi de la convertie avant ajustement, ajustement par pas d'arrondi (2026-09-24)

**Question** : `PRODUCT.md` arrondissait une seule fois, sur la note finale. Avec un pas
de 0,5 et une convertie exacte de 13,3, l'examinateur voyait « 13,5 + 0,2 = 13,5 ».

**Décision** :
- `convertie = arrondi(plafonnée × finalScale / maxRawScore)`.
- `finale = arrondi(clamp(convertie + ajustement, 0, finalScale))`.
- L'ajustement se saisit par multiples du pas d'arrondi. Le second arrondi est un filet
  pour le cas où `finalScale` n'est pas multiple du pas.

**Pourquoi** : le calcul affiché (convertie + ajustement = finale) est toujours exact et
lisible pour l'examinateur. Remplace la mention « un seul arrondi » de D01.

**Reporté dans** : `PRODUCT.md` glossaire (Note finale), §5 étapes 3–4, F11 (popup
d'ajustement), §11 (point retiré). Impacte F03 et F11.

## D03 — Note finale bornée à 0 en bas (2026-09-24)

**Question** : un ajustement négatif peut-il faire passer la note finale sous zéro ?

**Décision** : non, plancher à 0, symétrique du plafond à `finalScale`.

**Pourquoi** : une note négative n'a pas de sens dans un export de notes.

**Reporté dans** : `PRODUCT.md` §5, §11 (point retiré). Impacte F03.

## D04 — Suppression de `categories[].maxPoints`, déduit du barème (2026-09-24)

**Question** : la validation imposait `max(scale) === maxPoints`, le champ était donc
redondant et source d'erreur de saisie.

**Décision** : champ supprimé. La valeur d'une catégorie (« points max ») est
`max(scale)`, partout (tuile, exports, taux de réussite). Nouvelle règle : erreur si
la valeur maximale d'un barème est 0.

**Pourquoi** : `schemaVersion: 1`, aucune config existante à préserver ; un champ
qui doit valoir une autre valeur n'apporte rien.

**Reporté dans** : `PRODUCT.md` exemple de config, tableau des champs §6.2, règles de
validation §6.2, §5 (liste des valeurs à 3 décimales). Impacte F02.

## D05 — Schéma de config strict, `schemaVersion` future bloquante (2026-09-24)

**Question** : la spec prévoyait un avertissement pour une `schemaVersion` supérieure,
sans dire quoi faire des clés inconnues.

**Décision** :
- Schéma Zod strict à tous les niveaux : clé inconnue = erreur avec chemin JSON. Seule
  `$schema` est admise à la racine en plus des champs documentés.
- `schemaVersion` supérieure à la version connue = erreur bloquante, message invitant
  à recharger la page (mise à jour de la PWA).

**Pourquoi** : config écrite à la main, une faute de frappe ignorée retomberait sur le
défaut sans que personne ne le voie. Une version future peut porter une règle de
notation ; l'ignorer produirait de fausses notes. Cohérent avec la liste blanche des
tokens de thème.

**Reporté dans** : `PRODUCT.md` §6.2, règles de validation. Impacte F02.

## D06 — Règle du nombre de questions : globale, plus par catégorie (2026-09-24)

**Question** : exiger `questionsPerStudent + maxPerStudent` questions dans **chaque**
catégorie rendait le grisage d'une catégorie épuisée (F09) inatteignable, et obligeait
à rédiger beaucoup de questions dans les catégories difficiles.

**Décision** :
- Erreur si une catégorie n'a aucune question.
- Erreur si le **total** des questions est inférieur à
  `questionsPerStudent + (skips.enabled ? skips.maxPerStudent : 0)`.
- Une catégorie peut être plus petite que ce seuil ; elle est grisée pour l'étudiant
  qui l'a épuisée.

**Pourquoi** : un enseignant doit pouvoir n'avoir que 2 questions « Cauchemar ». Le
blocage d'un passage reste impossible grâce au seuil global.

**Reporté dans** : `PRODUCT.md` §6.2, règles de validation. Impacte F02 et F09 (le
grisage devient un vrai cas, à tester en parcours).

## D07 — La réinitialisation conserve le commentaire (2026-09-24)

**Question** : « Réinitialiser l'étudiant » effaçait attempts, ajustement et commentaire.

**Décision** : attempts et ajustement supprimés, commentaire conservé.

**Pourquoi** : on réinitialise pour corriger une erreur de manipulation ; le commentaire
porte sur l'étudiant (retard, tiers-temps), pas sur le passage. L'ajustement n'a plus
de sens sans passage.

**Reporté dans** : `PRODUCT.md` F11, §11 (point retiré). Impacte F11.

## D08 — Déclarer absent un passage entamé : confirmation puis réinitialisation (2026-09-24)

**Question** : la spec imposait de réinitialiser manuellement avant de déclarer absent.

**Décision** : bascule directe sans attempt. Avec attempts, une confirmation annonce le
nombre de questions supprimées, puis réinitialise (commentaire conservé, cf. D07) et
marque absent, en une action. Invariant : un étudiant absent n'a jamais d'attempt.

**Pourquoi** : même garantie (pas de note partielle à côté d'un statut absent), sans le
détour en deux actions.

**Reporté dans** : `PRODUCT.md` F12, §11 (point retiré). Impacte F11 et F12.

## D09 — Import de backup conservé dans le périmètre V1 (2026-09-24)

**Question** : seul l'export de backup avait été demandé explicitement.

**Décision** : l'import est gardé (F05).

**Pourquoi** : un backup sans restauration ne couvre ni le cache vidé ni le changement
de machine ; coût faible, la validation Zod de session est partagée avec l'export.

**Reporté dans** : `PRODUCT.md` F05, §11 (point retiré).

## D10 — Statistiques sur un écran dédié, pas dans le side panel (2026-09-24)

**Question** : troisième onglet du side panel, ou écran dédié ?

**Décision** : écran dédié `#/session/:sessionId/stats`, ouvert par un bouton de
l'onglet « Étudiants ». Le side panel garde deux onglets.

**Pourquoi** : histogramme et tableaux ont besoin de place ; les stats se consultent
surtout en fin de session, pas pendant un passage.

**Reporté dans** : `PRODUCT.md` F13, F15, §11 (point retiré). Impacte F13 et F15.

## D11 — Nom de l'examinateur, en colonne dans les exports (2026-09-24)

**Question** : ajouter un champ « examinateur » pour faciliter la fusion des exports
des deux jurys ?

**Décision** : champ facultatif `Session.examiner`, saisi à la création (F06),
modifiable depuis l'accueil (F05). Exporté dans Métadonnées **et en colonne** dans
Synthèse et Détail des questions.

**Pourquoi** : la colonne survit au copier-coller des lignes de deux classeurs dans une
même feuille ; une métadonnée seule non.

**Reporté dans** : `PRODUCT.md` §7 (modèle), F05, F06, F16, §11 (point retiré).

## D12 — Réactivité entre fenêtres vérifiée en F04, plus de spike en F14 (2026-09-24)

**Question** : F14 prévoyait un spike sur la réactivité de `liveQuery` entre fenêtres.

**Décision** : le critère d'acceptation de F04 est ce test (précisé : fenêtre ouverte
par `window.open` comprise). F14 n'ajoute BroadcastChannel que si ce critère échoue.
Correction au passage : ce critère de F04 était annoncé comme prérequis de F13 au lieu
de F14.

**Pourquoi** : Dexie propage nativement `liveQuery` entre contextes de même origine ;
vérifier tôt, dans la feature qui pose la persistance, évite de bloquer F14.

**Reporté dans** : `PRODUCT.md` F04, F14. Impacte F04 et F14.

## D13 — Toolset : TypeScript 7, oxlint type-aware, Prettier, pnpm, Node 24 via nvm (2026-09-24)

**Question** : `PRODUCT.md` prévoyait ESLint + Prettier. Challenge du toolset avant F01.

**Décision** :
- TypeScript 7 (compilateur natif Go), Vite 8, Vitest 5, Tailwind 4.3, shadcn, React 19.
- Lint : oxlint + oxlint-tsgolint (type-aware), plugins natifs `typescript`, `react`
  (hooks et react-refresh inclus), `jsx-a11y`, `import`, `vitest`. Pas d'ESLint.
- Format : Prettier + prettier-plugin-tailwindcss (`tailwindStylesheet` requis en v4).
- pnpm 12 épinglé par `packageManager: "pnpm@<version exacte>"`.
- Node 24 LTS épinglé par `.nvmrc` ; nvm en local, `actions/setup-node` avec
  `node-version-file: .nvmrc` en CI.
- CI : `tsc -b` explicite en plus d'oxlint.

**Pourquoi** : typescript-eslint ne supporte pas TS 7 (peerDep `<6.1.0`, issue #12518
« not planned ») ; oxlint-tsgolint est stable depuis le 22/07/2026 et embarque
typescript-go. oxfmt est prometteur (tri Tailwind natif) mais encore en beta. Versions
vérifiées sur npm et les sources officielles le 2026-09-24.

**Contraintes induites** :
- Pas de `baseUrl` dans les tsconfig (supprimé en TS 7), seulement `paths` — le guide
  shadcn l'ajoute, à retirer.
- Aucune dépendance à l'API JS de TypeScript (typescript-eslint, ts-morph…). Parade
  officielle si inévitable : alias `@typescript/typescript6`.
- pnpm ≥ 11 : scripts d'install autorisés via `allowBuilds` dans `pnpm-workspace.yaml`,
  clé inconnue = erreur.

**Reporté dans** : `PRODUCT.md` F01, §9. Impacte F01.

## D14 — Fichier d'exemple : un vrai oral PHP, catégories de tailles inégales (2026-09-24)

**Décision** : `examples/config.example.json` est un oral PHP réaliste (4 catégories,
blocs `php`, éléments de réponse, tags), avec une catégorie à 2 questions.

**Pourquoi** : c'est la vitrine du format et le jeu de données de test manuel de F08
(coloration) et F09 (grisage d'une catégorie épuisée, cf. D06).

**Reporté dans** : `PRODUCT.md` F02. Impacte F02.

## D15 — Valeurs CSS : forme dans Zod, validité par `CSS.supports` injecté (2026-09-24)

**Question** : `CSS.supports` n'existe que dans le navigateur, or le schéma doit tourner
aussi sous Node (tests, génération du JSON Schema).

**Décision** : Zod ne vérifie que la forme (chaîne non vide, sans `;{}<`). La validité
est vérifiée par une fonction `cssSupports` injectée (`color` pour les couleurs,
`border-radius` pour `radius`) ; échec = erreur bloquante avec chemin. F07 applique les
tokens uniquement via `style.setProperty`.

**Pourquoi** : pas de parseur de couleurs CSS maison ; `setProperty` ignore une valeur
invalide et ne peut pas injecter d'autre déclaration, la forme Zod n'est qu'une défense
en profondeur.

**Reporté dans** : `PRODUCT.md` §6.2, F02, F06, F07. Impacte F02, F06, F07.

## D16 — Icônes Lucide : un chunk unique chargé à la demande (2026-09-24) — révisée par D37 (Tabler)

> **Révisée par D37** : Tabler remplace Lucide et le seuil de repli (~300 Ko, DynamicIcon) est abandonné. Lire D37.

**Question** : accepter les ~1 600 icônes Lucide sans alourdir le bundle ni casser le
hors ligne.

**Décision** : validation par `iconNames` (`lucide-react/dynamic`), avertissement si
inconnu. Rendu par un chunk unique `import * as icons from 'lucide-react'`, chargé à la
demande, pré-caché par F17. JSON Schema : `anyOf: [enum des noms, string]` pour
l'autocomplétion sans refus. Repli sur `DynamicIcon` + préchargement si le chunk
dépasse ~300 Ko gzippé.

**Pourquoi** : un seul fichier à pré-cacher, hors ligne trivial ; `DynamicIcon` seul
imposerait ~1 600 fichiers à pré-cacher.

**Reporté dans** : `PRODUCT.md` §6.2, F07, F17. Impacte F02, F07, F17.

## D17 — JSON Schema généré par un plugin Vite local, URL stable (2026-09-24)

**Décision** : plugin Vite du dépôt qui charge le module de schéma via `runnerImport`,
appelle `z.toJSONSchema()` (draft 2020-12) et émet `config.schema.json` et
`config.example.json` à la racine du site (middleware en dev). Test de cohérence : le
fichier d'exemple est validé par Zod et par le JSON Schema (ajv).

**Pourquoi** : une seule source de vérité, alias `@/` et TS résolus comme l'app, rien
de généré à commiter. L'alternative (script Node à type stripping) imposait des imports
`.ts` et l'absence d'alias dans le module de schéma.

**Limite assumée** : les règles croisées ne sont pas exprimables en JSON Schema ;
l'éditeur ne valide que la structure, à dire dans le README.

**Reporté dans** : `PRODUCT.md` F02. Impacte F02.

## D18 — Issues de validation structurées, noyau i18n posé par F02 (2026-09-24)

**Décision** : le validateur renvoie `{ severity, path, code, params }`, jamais de texte.
Issues Zod converties en codes propres, `json_syntax` pour un JSON mal formé,
`formatPath` pour l'affichage. F02 pose un noyau i18n minimal (`Locale`, dictionnaires
typés, `t()`) ; F07 l'étend à toute l'interface. Les règles croisées ne tournent que si
la structure est valide (comportement de Zod), limite acceptée. Config stockée
normalisée (défauts appliqués, `title` dérivés).

**Pourquoi** : aucune dépendance aux messages ni à la traduction de Zod ; complétude
fr/en garantie par le typage ; la config figée ne dépend plus des défauts de l'app.

**Reporté dans** : `PRODUCT.md` F02, F07. Impacte F02, F06, F07.

## D19 — Mode `nearest` : égalité vers le haut (2026-09-24)

**Décision** : en `nearest`, une valeur à égale distance de deux pas va vers le haut
(pas 0,5 : 13,25 → 13,5). Pas d'arrondi bancaire.

**Pourquoi** : usage courant pour des notes, explicable à un étudiant. Les notes sont
positives après bornage, le sens pour les négatifs ne se pose pas.

**Reporté dans** : `PRODUCT.md` §5. Impacte F03.

## D20 — Arrondir puis borner (corrige D02) (2026-09-24)

**Question** : avec un pas de 0,3 sur /20, la convertie exacte 20 s'arrondit à 20,1,
au-delà de l'échelle : la formule de D02 (borner puis arrondir) la laissait passer.

**Décision** :
- `convertie = clamp(arrondi(exacte), 0, finalScale)`.
- `finale = clamp(arrondi(convertie + ajustement), 0, finalScale)`.
- Avertissement de validation (F02) si `finalScale` n'est pas multiple du pas.

**Pourquoi** : 0 et `finalScale` toujours atteignables et jamais dépassés, même hors
grille.

**Reporté dans** : `PRODUCT.md` §5, §6.2. Impacte F02 et F03. Remplace les formules de D02.

## D21 — Moteur de notation : pas de note finale partielle, types de domaine posés en F03 (2026-09-24)

**Décision** : `computeScores` renvoie `converted` et `final` à `null` tant que
l'étudiant n'est pas terminé. Entiers `Number` en millièmes (pas de BigInt, garde
`Number.isSafeInteger`). Les types `Session`, `Student`, `Attempt` du §7 sont posés en
F03, premier consommateur, puis persistés par F04.

**Pourquoi** : aucune vue ne peut afficher par erreur une note finale sur un passage
incomplet. Les ordres de grandeur (~2·10¹¹ au pire) restent loin de 2⁵³.

**Reporté dans** : `PRODUCT.md` F03. Impacte F03, F04, F11–F13, F16.

## D22 — Stockage : un document par session, mutations transactionnelles (2026-09-24)

**Question** : un document par session (étudiants et attempts imbriqués) ou des tables
normalisées ?

**Décision** : une table `sessions`, un document par session. Toute mutation passe par
`updateSession(id, mutator)`, lecture et écriture dans une seule transaction `rw`.

**Pourquoi** : volume minuscule, backup = le document tel quel, la vue projetée observe
un seul objet. IndexedDB sérialise les transactions sur une table, y compris entre
onglets : deux onglets examinateur ne perdent pas d'écriture.

**Reporté dans** : `PRODUCT.md` F04. Impacte F04, F05, et toutes les features qui
écrivent (F06, F09–F13).

## D23 — Vérification entre fenêtres : manuelle en F04, automatisée en F14 (2026-09-24)

**Décision** : en F04, base exposée en dev sur `window.__questionatorDb`, procédure
manuelle décrite dans la PR ; tests Vitest avec `fake-indexeddb` pour le reste. Test
automatisé entre deux vraies fenêtres en F14, avec Playwright.

**Pourquoi** : F04 n'a pas d'UI à observer ; `fake-indexeddb` ne simule pas la
propagation entre contextes.

**Reporté dans** : `PRODUCT.md` F04. Impacte F04 et F14.

## D24 — Backup : enveloppe versionnée, revalidation complète à l'import (2026-09-24)

**Décision** : enveloppe `{ format, formatVersion, appVersion, exportedAt, session }`.
L'import revalide l'enveloppe, la session (Zod) et sa config figée (validateur F02) ;
versions futures refusées avec invitation à mettre à jour ; rien n'est écrit en cas
d'erreur. Ajouts UX : état vide, indicateur de persistance refusée, « exporter un
backup d'abord » dans la confirmation de suppression.

**Pourquoi** : un backup est un fichier éditable à la main ; une config figée corrompue
ne doit pas entrer sans contrôle. La suppression est la seule action irréversible.

**Reporté dans** : `PRODUCT.md` F05. Impacte F05.

## D25 — Lecture du CSV : en-têtes fr/en, lignes anormales en avertissement (2026-09-24)

**Décision** :
- En-têtes reconnus sans casse, accents, espaces ni tirets : `nom`, `nom de famille`,
  `last name`, `lastname`, `surname`, `family name` / `prenom`, `first name`,
  `firstname`, `given name`. En-tête = première ligne contenant les deux.
- Ligne à un seul champ : ignorée + avertissement avec numéro de ligne. Colonnes en
  trop : ignorées + avertissement unique. Trim, casse conservée. Doublons : avertissement.
- Aucun étudiant valide : erreur bloquante.
- Nom de session prérempli `<exam.title> — <date>`.

**Pourquoi** : interface bilingue ; une ligne mal formée ne doit pas bloquer une
session de 30 étudiants, mais personne ne doit disparaître en silence (aperçu).

**Reporté dans** : `PRODUCT.md` §6.1, F06. Impacte F06.

## D26 — Thème : périmètre session, mode mémorisé par vue, couleur de catégorie en accent (2026-09-24)

**Décision** :
- Le thème de la config ne s'applique qu'aux routes de session ; `<SessionTheme>`
  applique les tokens du mode courant et les retire au démontage.
- Langue : `config.locale` en session, sinon navigateur ; pas de sélecteur.
- Choix clair/sombre manuel mémorisé par session et par vue (examinateur / projetée)
  en `localStorage` ; défaut `presentation.defaultColorMode`.
- Couleur de catégorie en accent (bordure, icône, halo, pastille), jamais en fond sous
  du texte.

**Pourquoi** : la vue projetée peut avoir besoin d'un mode différent (vidéoprojecteur) ;
une couleur de config en fond rendrait le contraste imprévisible.

**Reporté dans** : `PRODUCT.md` F07. Impacte F07, F09, F14.

## D27 — Markdown : Shiki allégé sans WASM, thèmes GitHub, images autorisées (2026-09-24)

**Décision** : `shiki/core` + moteur regex JavaScript, 6 langages importés
explicitement et chargés à la demande, thèmes `github-light` / `github-dark` en double
rendu CSS. Pas de `rehype-raw`. Liens en nouvel onglet. Images autorisées, limite hors
ligne documentée.

**Pourquoi** : pas de WASM à pré-cacher ; thèmes neutres compatibles avec toute config ;
les schémas dans les énoncés sont utiles.

**Reporté dans** : `PRODUCT.md` F08. Impacte F08, F17.

## D28 — Écran de passage : étudiant actif en base, invariants transactionnels, réponse repliée (2026-09-24)

**Décision** :
- Route unique `#/session/$sessionId`, étudiant affiché = `activeStudentId` en base.
- Tirage uniforme par rejet (`crypto.getRandomValues`), aléa injectable.
- Mutations tirer / noter / skipper : invariants revérifiés dans la transaction
  `updateSession` (pas de `pending` existant, pas terminé, pas absent, catégorie non
  épuisée).
- Éléments de réponse repliés par défaut à chaque question.
- Animation de tirage réservée à la vue projetée.
- Pas de confirmation sur les boutons de note (correction via F12).

**Pourquoi** : une seule source de vérité pour l'étudiant actif (F13, F14) ; aucun
double tirage possible ; la réponse ne s'affiche jamais sans action de l'examinateur.

**Reporté dans** : `PRODUCT.md` F09. Impacte F09, F10, F13, F14.

## D29 — Écran final : tout pour l'examinateur, popup une fois, « Étudiant suivant » (2026-09-24)

**Décision** :
- `finalScoreDisplay` ne concerne que la vue projetée ; l'examinateur voit toutes les
  notes.
- Popup d'ajustement ouverte automatiquement une seule fois, à la note qui termine le
  passage ; ensuite bouton « Ajuster ». Ajustement 0 = suppression (justification
  comprise).
- Bouton « Étudiant suivant » : prochain étudiant à passer ou en cours, dans l'ordre,
  avec reprise au début ; ne touche pas à la projection.

**Pourquoi** : `presentation` règle ce que voit l'étudiant ; une popup qui surgit à
chaque consultation gêne ; changer d'étudiant est le geste le plus fréquent. Les
étudiants « en cours » sont inclus pour ne pas oublier un passage interrompu.

**Reporté dans** : `PRODUCT.md` F11. Impacte F11, F14.

## D30 — Vue projetée : étanchéité par `toProjectedView`, fenêtre unique (2026-09-24)

**Décision** : la route `present` ne rend que le type `ProjectedView` produit par une
fonction pure `toProjectedView(session)` (ni `answer`, ni commentaire, ni ajustement,
ni autre étudiant) ; test sur la sérialisation. `window.open(url, 'questionator-present')`
pour une fenêtre unique. Commandes : plein écran et mode, masquées à l'inactivité.

**Pourquoi** : l'étanchéité garantie par un type et un test plutôt que par la vigilance
de chaque composant.

**Reporté dans** : `PRODUCT.md` F14. Impacte F14.

## D31 — Note projetée = note finale, révélée à la fermeture de la popup d'ajustement (2026-09-24)

**Décision** : sur la vue projetée, `converted` = note finale ajustement compris ;
montant et justification jamais affichés. Nouveau champ `Student.finalRevealedAt`,
renseigné à la fermeture de la popup de fin de passage (F11) ; avant, « Passage
terminé » (+ brute si `showCumulativeScore`). `resetStudent` le vide.

**Pourquoi** : la note projetée doit être la vraie note, et l'ajustement ne doit pas se
voir par la variation de la note sous les yeux de l'étudiant. Aucun bouton de plus.

**Reporté dans** : `PRODUCT.md` §7, F11, F14. Impacte F03 (types), F11, F14, backup F05.

## D32 — Animation de tirage neutre (2026-09-24)

**Décision** : cartes retournées aux couleurs de la catégorie, mélange ~1,5 s, puis
révélation de l'énoncé tiré ; fondu si `prefers-reduced-motion`. Jamais d'autre
question affichée.

**Pourquoi** : un défilement de titres dévoilerait les autres questions de la catégorie.

**Reporté dans** : `PRODUCT.md` F14. Impacte F14.

## D33 — Playwright adopté (Chromium, job CI `e2e`) (2026-09-24)

**Décision** : `@playwright/test`, Chromium seul, job CI séparé sur `vite preview`.
Premier scénario en F14 (deux fenêtres, synchronisation, étanchéité) ; réutilisé par F17
(hors ligne).

**Pourquoi** : seul moyen de tester automatiquement la synchro entre fenêtres (D23) et
le hors ligne.

**Reporté dans** : `PRODUCT.md` §9, F14. Impacte F14, F17.

## D34 — Définitions des statistiques (2026-09-24)

**Décision** : `computeStats(session)` pur, partagé par l'écran et l'export. Notes,
histogramme, stratégies sur les terminés seulement ; écart-type de population ;
histogramme à 1 point si `finalScale` ≤ 20 (sinon `finalScale / 20`) ; stratégies =
combinaison sans ordre ; taux de réussite sur les attempts notés ; top 10 des questions
tirées. Graphique shadcn / Recharts chargé seulement sur la route des stats.

**Pourquoi** : usage descriptif d'un groupe ; lecture naturelle sur /20 ; l'ordre des
choix éparpillerait des données déjà maigres.

**Reporté dans** : `PRODUCT.md` F15, F17. Impacte F15, F16, F17.

## D35 — Export Excel : write-excel-file à la place d'ExcelJS, valeurs sans formules (2026-09-24)

**Question** : ExcelJS (4.4.0, dernière publication fin 2023) reste-t-il le bon choix ?

**Décision** : write-excel-file (`write-excel-file/browser`, Web Worker), chargé à la
demande. Valeurs uniquement, aucune formule ; onglets et en-têtes dans la langue de la
session ; dates en cellules date ; notes en nombres (sauf absent en mode `label`) ;
étudiant en cours : convertie et finale vides.

**Pourquoi** : maintenu (juin 2026), une seule dépendance (`fflate`) contre neuf
orientées Node, chunk plus léger à pré-cacher ; couvre tout le besoin d'écriture
(onglets, largeurs, formats, dates, lignes figées). Les formules casseraient au
copier-coller entre classeurs de jurys différents. Pas d'autofiltre : non demandé.

**Reporté dans** : `PRODUCT.md` F16, F17, §9. Impacte F16, F17.

## D36 — PWA installable, mise à jour proposée jamais imposée (2026-09-24)

**Décision** : manifeste avec icônes 192 / 512 px, `display: standalone`.
`registerType: 'prompt'`, indicateur dans la vue examinateur seulement. La vue projetée
se recharge d'elle-même sur `versionchange` de Dexie (nouvelle version avec schéma plus
récent). Critère hors ligne vérifié par Playwright.

**Pourquoi** : une fenêtre dédiée le jour de l'oral ; un rechargement imposé en plein
passage fait perdre le fil, surtout devant l'étudiant ; la vue projetée, en lecture
seule, peut se recharger sans risque.

**Reporté dans** : `PRODUCT.md` F17. Impacte F17.

## D37 — shadcn v4 (base-ui, preset Nova) et Tabler à la place de Lucide (2026-09-24)

**Question** : F01 avait épinglé le CLI shadcn 3.8.5 (Radix + Lucide), la v4 ne proposant
plus l'interface classique. Rester sur une version figée, ou passer à la v4 ?

**Décision** :
- shadcn CLI v4 (4.21.0), primitives **base-ui**, preset Nova avec la bibliothèque
  d'icônes **Tabler** (code de preset `balE`), police Geist imposée par le preset.
- **Tabler partout** : UI shadcn et icônes de catégorie de la config. Remplace Lucide
  dans D16 : noms kebab-case validés par `iconsList` de `@tabler/icons-react` (6 220 noms),
  JSON Schema `anyOf: [enum, string]`.
- Chargement des icônes de catégorie : chunk unique `import * as icons from
  '@tabler/icons-react'`, **~3 Mo, ~489 Kio gzippés** (mesuré), chargé à la demande sur
  les vues de session, pré-caché par F17. Pas de chargement par icône : Tabler n'a pas
  d'équivalent officiel à `DynamicIcon`, et un chunk par icône compliquerait le hors ligne.
- `shadcn` reste en devDependency (`src/index.css` importe `shadcn/tailwind.css`), avec
  `ts-morph` en transitif (cf. ruling F01 : il embarque sa propre copie de TypeScript).
- Le `Button` du preset Nova est plus compact (h-8, rounded-lg, destructive teinté, pas
  d'`asChild`) : changement voulu.

**Pourquoi** : dernière version stable ; Tabler offre plus d'icônes et est très répandu ;
une seule bibliothèque d'icônes. Poids du chunk acceptable pour un outil installé en PWA
sur le portable de l'examinateur (téléchargé une fois).

**Reporté dans** : `PRODUCT.md` §6.2, F07, F17, §9 ; tickets #2, #7, #17. Remplace la
bibliothèque et le seuil de repli de D16.

## D38 — Règles croisées de la config : passe séparée après le parse structurel (2026-09-24)

**Question** : brancher les règles croisées de F02 dans le schéma Zod (`superRefine`), ou
dans une passe à part ?

**Décision** : `checkRules(parsed, { cssSupports, iconNames })` est une fonction pure
appelée seulement si `ConfigSchema.safeParse` a réussi. Elle renvoie directement des
`ConfigIssue` avec leur sévérité.

**Pourquoi** : même comportement que `superRefine` (D18), mais Zod ne sait pas porter
d'avertissement, et le schéma exporté par `z.toJSONSchema()` reste purement structurel.

**Reporté dans** : spec F02.

## D39 — `schemaVersion` future : seule issue renvoyée (2026-09-24)

**Question** : une config d'une version future doit-elle aussi lister ses autres erreurs ?

**Décision** : pré-contrôle avant le parse strict. Si le JSON est un objet dont
`schemaVersion` est un entier supérieur à `SCHEMA_VERSION`, `validateConfig` renvoie
uniquement `unsupported_schema_version`.

**Pourquoi** : une version future contient probablement des champs inconnus ; une
avalanche d'`unknown_key` noierait le seul message utile (recharger la page, D05).

**Reporté dans** : spec F02.

## D40 — Config normalisée : catégories triées, `order` réécrit (2026-09-24)

**Question** : la config normalisée garde-t-elle l'ordre du tableau, charge aux
consommateurs de trier par `order` ?

**Décision** : `normalize` trie les catégories par `order` puis par position dans le
tableau, et réécrit `order` en 1…n. Deux `order` égaux ne sont pas une erreur.
Cas mixte (certaines catégories avec `order`, d'autres sans) : une catégorie sans
`order` prend sa position 1-based comme clé, dans le même espace que les valeurs
explicites ; à clé égale, la position départage. Comportement figé par un test.

**Pourquoi** : F09, le side panel et les exports lisent un ordre unique sans retrier.

**Reporté dans** : spec F02.

## D41 — `title` dérivé du `prompt` : première ligne, 60 caractères (2026-09-24)

**Question** : comment dériver le `title` d'une question sans `title` (§6.2 : « début du
`prompt` sans markdown ») ?

**Décision** : blocs de code clôturés ignorés, première ligne non vide, markdown retiré
par expressions régulières (code en ligne gardé sans backticks, liens réduits à leur
texte, marqueurs `#`, `>`, listes et emphase supprimés), coupure à 60 caractères sur
une frontière de mot suivie de `…`.

**Pourquoi** : court et lisible dans le side panel et une cellule Excel ; pas de
dépendance au moteur markdown de F08.

**Reporté dans** : spec F02.

## D42 — Formatage des notes : `raw` à 3 décimales, `final` au pas (2026-09-25)

**Question** : le ticket F03 dérivait le nombre de décimales du pas d'arrondi pour toute
note. Une brute hors grille (barème à 0,25, pas de 0,5 : brute 7,25) s'affichait alors
« 7,3 ».

**Décision** : `formatScore(milli, kind, config, locale)`. `kind: 'final'` (convertie,
finale, ajustement) : décimales fixes dérivées du pas (« 14,0 », « 14,5 » au pas de 0,5).
`kind: 'raw'` : 0 à 3 décimales, zéros de fin retirés (« 7,25 », « 7 »).

**Pourquoi** : la brute s'affiche exacte ; les notes arrondies gardent un nombre de
décimales constant, alignées dans une colonne.

**Reporté dans** : spec F03. Impacte F09, F11–F13, F16.

## D43 — Types de domaine : dates ISO, décimaux hors moteur, absent sans note (2026-09-25)

**Question** : représentation des dates et des valeurs de note dans `Session`, `Student`,
`Attempt` ; notes d'un étudiant absent dans `computeScores`.

**Décision** :
- Identifiants en `string`, dates en chaînes ISO 8601.
- `Attempt.score` et `adjustment.value` restent des `number` décimaux, convertis en
  millièmes à l'entrée du moteur seulement.
- Absent : `converted` et `final` à `null`, `adjustment` à 0 ; la valeur d'absent ne passe
  que par `exportedFinal`.

**Pourquoi** : dates lisibles dans IndexedDB et un export JSON ; les données persistées
restent dans les unités de la config ; un absent n'a pas de note, seulement une valeur
exportée.

**Reporté dans** : spec F03. Impacte F04, F11–F13, F15.

## D44 — Valeurs de notation bornées à 10 000 (2026-09-25)

**Question** : une config valide pour F02 (`maxRawScore` et `finalScale` à 10⁶) faisait
sortir le moteur des entiers sûrs (10⁹ × 10⁹ millièmes²) : la garde de D21 aurait levé
une exception en plein passage.

**Décision** :
- Erreur de validation `scoring_value_too_large` si une valeur de notation (barème,
  `maxRawScore`, `finalScale`, `rounding.step`, `absent.value`) dépasse 10 000 en valeur
  absolue.
- Un ajustement valide est au plus `finalScale` en valeur absolue.

**Pourquoi** : aucune config acceptée ne peut faire échouer le moteur ; 10 000 couvre
largement tout barème d'oral. La garde `isSafeInteger` ne sert plus qu'aux données
corrompues.

**Reporté dans** : `PRODUCT.md` §5, §6.2, spec F03. Impacte F02, F03, F11.

## D45 — Changement de schéma venu d'un autre onglet : fermeture propre, état `outdated` (2026-09-25)

**Question** : une nouvelle version de l'app (PWA, mise à jour proposée et non imposée,
D36) qui monte le schéma Dexie alors qu'un autre onglet tourne sur l'ancienne version.

**Décision** : F04 intercepte `versionchange` : l'instance ferme sa connexion, passe à
l'état `'outdated'` (hook `useDbStatus()`) et remplace le traitement par défaut de Dexie.
Les écritures suivantes échouent avec `DatabaseClosedError`. Le message « recharger la
page » est affiché par la feature de mise à jour PWA.

**Pourquoi** : l'onglet qui monte de version n'est jamais bloqué, et l'ancien onglet a
un état observable au lieu d'erreurs silencieuses en console.

**Reporté dans** : spec F04. Impacte F04 et la feature PWA.

## D46 — Contrat d'écriture : `createSession` refuse un doublon, mutator synchrone sur la session fraîche (2026-09-25)

**Question** : forme exacte des écritures de F04 (création, import, mutations).

**Décision** :
- `createSession(session)` reçoit une `Session` complète (construite par F06) et rejette
  `SessionExistsError` si l'`id` existe ; `putSession` écrase (import F05, après
  confirmation).
- `updateSession(id, mutator)` : mutator synchrone `(Session) => Session`, appelé sur la
  session fraîchement lue dans la transaction (déjà une copie : IndexedDB clone à la
  lecture, donc pas de `structuredClone`) ; un
  changement d'`id` est refusé ; `updatedAt` posé par F04. Les contrôles métier se font
  dans le mutator, jamais sur l'état affiché.

**Pourquoi** : un import ne peut pas écraser une session par accident ; deux onglets
examinateur appliquent leurs contrôles sur l'état réel ; un mutator peut modifier en
place sans effet de bord.

**Reporté dans** : spec F04. Impacte F05, F06, F09–F13.

## D47 — Base IndexedDB indisponible : état `unavailable` (2026-09-25)

**Question** : IndexedDB bloqué (Safari « bloquer tous les cookies », politique
d'entreprise) ou absent : `useSessions()` restait `undefined` indéfiniment et l'état de
connexion affichait `'open'`.

**Décision** : `DbStatus` gagne `'unavailable'`. `QuestionatorDb` ouvre la base dès sa
construction et passe à `'unavailable'` si l'ouverture échoue. F05 affiche un message
explicite au lieu d'un chargement sans fin.

**Pourquoi** : un examinateur sur un navigateur qui bloque le stockage doit savoir
pourquoi rien ne s'affiche ; l'état coûte quelques lignes et reste additif.

**Reporté dans** : spec F04. Impacte F04, F05.

## D48 — Import de backup : règles croisées entre session et config (2026-09-25)

**Question** : D24 revalide la forme de la session et sa config figée, mais pas leur
cohérence mutuelle. Un backup retouché à la main peut être bien formé et incohérent
(attempt vers une question inconnue, score hors barème, étudiant actif inexistant).

**Décision** : `parseBackup` ajoute une dernière passe `checkSessionRules`, sur le
modèle de D38 : références (catégorie, question, étudiant actif et projeté), score dans
le barème et cohérent avec `outcome`, `skipReason` seulement sur `skipped`, un seul
`pending` par étudiant (D28), aucun attempt pour un absent (D08), unicité des `id`
d'étudiants et d'attempts, cohérence de `projection`. Toutes les issues sont collectées
et l'import est refusé.

**Pourquoi** : les features suivantes (F09–F16) peuvent supposer une session
cohérente ; une incohérence entrée par un import ferait planter l'écran de passage bien
loin de sa cause.

**Reporté dans** : `PRODUCT.md` F05, spec F05. Impacte F05.

## D49 — Import : config figée renormalisée, dates et version d'origine conservées (2026-09-25)

**Question** : à l'import, stocker la config telle qu'elle figure dans le fichier ou
celle que renvoie le validateur de F02 ?

**Décision** : celle que renvoie `validateConfig`, donc renormalisée. `createdAt`,
`updatedAt` et `appVersion` de la session sont conservés tels quels.

**Pourquoi** : `normalize` est idempotent, un backup produit par l'app ressort
strictement identique ; un backup retouché (catégories désordonnées, défauts omis)
reprend la forme canonique que le reste de l'app suppose. Un import restitue, il ne
modifie pas : les dates restent celles du fichier.

**Reporté dans** : spec F05. Impacte F05.

## D50 — F05 avant F06, routes provisoires `/new` et `/session/$sessionId` (2026-09-25)

**Question** : F05 renvoie vers la création (F06) et l'écran de passage (F09), qui
n'existent pas encore. Faire F06 d'abord, et que faire des liens ?

**Décision** : F05 d'abord. Elle crée deux routes provisoires « Bientôt disponible »
avec un lien de retour ; F06 et F09 remplaceront leur composant, les liens de F05 sont
définitifs.

**Pourquoi** : l'import de backup remplit la base sans F06 ; F05 pose le socle d'UI
(dictionnaire, dialogues) que F06 réutilisera ; F06 aurait eu de toute façon besoin
d'une route provisoire pour F09.

**Reporté dans** : spec F05. Impacte F05, F06, F09.

## D51 — Dictionnaire d'interface et langue du navigateur posés par F05 (2026-09-25)

**Question** : F05 doit être bilingue (langue du navigateur) alors que F07, qui porte
l'i18n de l'interface, n'est pas faite.

**Décision** : F05 crée `src/i18n/ui-messages.ts` (dictionnaire typé fr/en, lu par
`t()` du noyau F02) et `detectBrowserLocale` (premier sous-tag primaire supporté de
`navigator.languages`, sinon `fr`). F07 étend le dictionnaire et ajoute `config.locale`
pour les routes de session.

**Pourquoi** : aucune chaîne de l'accueil ne doit être écrite en dur puis réécrite ;
le noyau D18 est déjà prévu pour être étendu.

**Reporté dans** : spec F05. Impacte F05, F07.

## D52 — Accueil : cartes et menu d'actions, un étudiant en cours compte comme restant (2026-09-25)

**Décision** :
- Une carte par session, « Reprendre » en bouton principal, les autres actions dans un
  menu `⋯` (supprimer en dernier, séparée, style destructif).
- Avancement : passés = `done`, absents = `absent`, restants = `todo` + `in_progress`.
- « Exporter un backup d'abord » télécharge et laisse le dialogue de suppression ouvert.

**Pourquoi** : peu de sessions en pratique (une par oral), la carte reste lisible sur un
petit écran ; un passage entamé n'est pas terminé ; l'examinateur confirme la
suppression une fois le fichier en main.

**Reporté dans** : spec F05. Impacte F05.

## D53 — Composants shadcn vendus exclus de SonarQube (2026-09-25)

**Question** : SonarQube a remonté une issue (S6853) sur `src/components/ui/label.tsx`, code
vendu par le CLI shadcn : patcher le composant, ou l'exclure de l'analyse ?

**Décision** : `src/components/ui/**` est ajouté à `sonar.exclusions` dans
`.sonarcloud.properties`. Le composant `Label` garde son code d'origine.

**Pourquoi** : ce code est réécrit à chaque `shadcn add --overwrite` ; un correctif local
serait perdu en silence et chaque nouvel ajout pourrait remonter de nouvelles issues sans
rapport avec le code du projet. oxlint l'ignore déjà (`ignorePatterns`) pour la même raison.

**Reporté dans** : `.sonarcloud.properties`, `docs/CONVENTIONS.md`. Impacte toutes les
features qui ajoutent des composants shadcn.

## D54 — Création de session sur `#/new`, pas `#/session/new` (2026-09-25)

**Question** : le ticket F06 plaçait l'écran en `/session/new`, alors que F05 a posé la route
provisoire `/new` (D50) et que les liens de l'accueil y mènent.

**Décision** : l'écran de création reste sur `/new`.

**Pourquoi** : les liens de F05 sont définitifs ; une route fixe `/session/new` à côté de
`/session/$sessionId` rendrait inaccessible une session d'`id` « new ».

**Reporté dans** : `PRODUCT.md` F06, spec F06. Impacte F06.

## D55 — En-tête CSV cherché dans les 5 premières lignes non vides (corrige D25) (2026-09-25)

**Question** : D25 (« première ligne contenant les deux ») et le ticket F06 (« la première
ligne si elle contient les deux ») divergeaient ; les exports d'ENT ou d'Excel commencent
souvent par une ligne de titre.

**Décision** : l'en-tête est la première des 5 premières lignes non vides qui contient une
colonne nom et une colonne prénom. Les lignes qui la précèdent sont ignorées avec un
avertissement unique (`preamble_skipped`). Sans en-tête, toutes les lignes sont des données,
dans l'ordre nom puis prénom.

**Pourquoi** : couvre les exports avec préambule sans risquer de prendre une ligne
d'étudiant au milieu du fichier pour un en-tête ; rien n'est ignoré en silence.

**Reporté dans** : `PRODUCT.md` §6.1, spec F06. Impacte F06.

## D56 — Liste d'étudiants d'exemple publiée (2026-09-25)

**Décision** : `examples/students.example.csv` (UTF-8 avec BOM, `;`, en-tête `Nom;Prénom`,
noms fictifs accentués) est publié à la racine du site par le plugin Vite qui publie déjà
la config d'exemple. Liens depuis l'écran de création, l'état vide de l'accueil et le README.
Un test garantit qu'il se lit sans aucune issue.

**Pourquoi** : symétrie avec la config d'exemple ; montre d'un coup le format attendu,
calqué sur l'export Excel français le plus courant.

**Reporté dans** : `PRODUCT.md` F06, spec F06. Impacte F05 (état vide), F06.

## D57 — Écran de création : deux colonnes, nom prérempli une seule fois, persistance demandée à chaque création (2026-09-25)

**Décision** :
- Formulaire à gauche (deux zones de dépôt, nom, examinateur, « Créer »), aperçu à droite ;
  empilés sur petit écran.
- Nom prérempli `<exam.title> — <date longue localisée>` dès qu'une config valide est
  chargée, tant que l'utilisateur n'a pas touché au champ ; toute saisie manuelle arrête
  le préremplissage.
- `requestPersistentStorage()` appelée à chaque création (idempotente) plutôt qu'à la
  « première » session ; un refus ne bloque pas la création.

**Pourquoi** : tout visible d'un coup sur un portable ; une config changée après coup ne
doit pas écraser un nom choisi ; « première session » n'a pas de définition fiable (base
vidée, import de backup).

**Reporté dans** : spec F06. Impacte F06.

## D58 — CSV en Windows-1252 lu avec un avertissement, pas refusé (2026-09-25)

**Question** : l'export « CSV (séparateur : point-virgule) » d'Excel en français, le plus
courant, est en Windows-1252 ; lu comme de l'UTF-8, il donnait des noms corrompus et un
faux étudiant pour l'en-tête, sans aucun message (§6.1 ne prévoyait que l'UTF-8).

**Décision** : décodage en UTF-8 strict (`TextDecoder` `fatal`) ; en cas d'échec, repli sur
Windows-1252 et avertissement `legacy_encoding` dans l'aperçu (« vérifiez les accents »).
La config JSON reste en UTF-8.

**Pourquoi** : refuser le fichier renverrait l'enseignant vers une manipulation d'Excel
(« CSV UTF-8 ») pour un cas qu'on sait lire ; l'avertissement couvre le rare fichier dans un
autre encodage 8 bits.

**Reporté dans** : `PRODUCT.md` §6.1, spec F06 (revue finale). Impacte F06.

## D59 — Arborescence de `src/` : lib, domain, features, sens des imports vérifié par dependency-cruiser (2026-09-25)

**Question** : après F06, `src/` comptait 14 dossiers à plat qui mélangeaient infrastructure, métier, écrans et UI partagée. Le métier de session était éclaté sur quatre dossiers, `home/` et `create/` mêlaient composants et utilitaires génériques, deux styles d'import coexistaient et les barrels étaient incohérents. Faut-il tout mettre dans `lib/` ou séparer le métier ? Quel nommage adopter, que faire des barrels, et comment faire respecter la structure ?

**Décision** (#31) :
- Structure inspirée de Bulletproof React, en version allégée : `app/`, `routes/` (minces), `features/<x>/` (`<x>-page.tsx`, `components/`, `hooks/`), `components/` (ui + transverse), `lib/` (technique : db, i18n, cn, download, format-date…), `domain/` (règles de PRODUCT.md, sans React : config, scoring, session, students, backup) et `testing/`.
- Sens unique des imports : `lib` ← `domain` ← `components` ← `features` ← `routes` / `app`, et jamais d'import entre features. Deux exceptions : `lib/db/` peut lire les types de `domain/`, et `domain/` n'importe que la partie pure de `lib/`.
- Imports par `@/` partout, `./` seulement dans le même dossier. `runnerImport` reçoit l'alias `@`, ce qui supprime la règle « imports relatifs dans config/i18n/scoring/domain ».
- Aucun barrel. Tous les fichiers en kebab-case, hors routes TanStack.
- Vérification : dependency-cruiser (`pnpm deps`, dans `pnpm check` et la CI) contrôle les cycles, les couches, les imports entre features, les barrels, le singleton `db` et le dossier `testing/`. oxlint vérifie le kebab-case et interdit `../`.

**Pourquoi** :
- Le métier est séparé de `lib/` parce qu'un dossier de 40 fichiers mêlant Dexie et règles de notation n'aurait pas permis de savoir où ranger un fichier. `domain/` pur reste testable sous Node et chargeable par le plugin Vite.
- Pas de barrels, comme le recommande Bulletproof : les contournements existaient déjà pour préserver les chunks chargés à la demande.
- Le kebab-case suit Bulletproof et shadcn, et ne coûtait rien de plus puisque tous les fichiers étaient déjà déplacés.
- dependency-cruiser plutôt qu'oxlint pour les couches : oxlint n'a pas `import/no-restricted-paths`, et ses plugins JS sont en alpha.
- Feature-Sliced Design est écarté car surdimensionné pour environ 150 fichiers. On en garde seulement la règle « couche inférieure seulement ».

**Reporté dans** : `docs/CONVENTIONS.md` § « Arborescence et imports », `CLAUDE.md`, `.dependency-cruiser.cjs`, `.oxlintrc.json`. Impacte toutes les features à venir.

## D60 — F07 avant F09 : écrans de session provisoires et apparence par « portées » (2026-09-25)

**Question** : F07 doit appliquer thème, mode et langue « sur les deux vues », alors qu'aucune vue de session n'existe (F09, F14). Plusieurs écrans veulent aussi piloter la classe `.dark` et les tokens posés sur l'unique `<html>`.

**Décision** :
- F07 crée deux écrans provisoires qui hébergent l'apparence : le layout examinateur `#/session/$sessionId` (en-tête, catégories, bouton principal désactivé) et la vue projetée `#/present/$sessionId` (écran d'attente, config seule, jamais la `Session`). F09 et F14 remplacent leur contenu.
- Un seul `AppearanceProvider` (`src/app/`) écrit sur `<html>`. Les écrans déclarent une portée (`useAppearanceScope`, `<SessionAppearance>`), la dernière déclarée s'applique et son retrait ramène à la portée globale. `LocaleProvider` suit le même principe pour la langue et `lang`.
- Hors session : mode `system` par défaut, avec une bascule dans l'en-tête de l'accueil et de la création, mémorisée sous `questionator:color-mode:global`.

**Pourquoi** : F09 et F14 n'auront qu'à se brancher. Un hook par écran casserait dès que deux écrans s'imbriquent, car les effets des enfants s'exécutent avant ceux des parents. Des layouts sans chemin auraient forcé à déplacer les routes, pour le même problème en F15.

**Reporté dans** : spec F07. Impacte F07, F09, F14, F15.

## D61 — Dictionnaire d'interface exclu de la détection de duplication SonarQube (2026-09-25)

**Question** : la PR F07 échouait sur la quality gate (`new_duplicated_lines_density` 4,3 % pour un seuil de 3 %), en grande partie à cause de `src/lib/i18n/ui-messages.ts`. Ce fichier comptait déjà 32 lignes « dupliquées » sur `main`, 70 après F07.

**Décision** : `sonar.cpd.exclusions=src/lib/i18n/ui-messages.ts`. Le fichier reste analysé pour les issues. Les duplications réelles, comme deux tests identiques à la route près, se corrigent plutôt que de s'exclure.

**Pourquoi** : les dictionnaires `fr` et `en` se reflètent par construction, car `Dictionary<P>` impose la parité des clés. La détection de Sonar ignore les littéraux et y voit donc toujours un bloc copié. Chaque nouvelle chaîne d'interface aggravait la mesure sans qu'il existe de code à factoriser.

**Reporté dans** : `.sonarcloud.properties`. Impacte toutes les features qui ajoutent des chaînes d'interface.
