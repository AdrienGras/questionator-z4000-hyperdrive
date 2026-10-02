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
  pour le cas où `finalScale` n'est pas multiple du pas (*cas désormais refusé par la validation : D81*).

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
- Avertissement de validation (F02) si `finalScale` n'est pas multiple du pas (*remplacé par D81 : c'est maintenant une erreur*).

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
  avec reprise au début ; ~~ne touche pas à la projection~~ (remplacé par D73 : la
  projection repasse en attente).

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

## D62 — F08 livré en composant seul, rangé selon D59 (2026-09-26)

**Question** : F08 exige qu'un bloc `php` soit « coloré dans les deux vues », alors qu'aucune vue n'affiche encore de question : les écrans de F07 sont provisoires. Le ticket range aussi le code dans `src/markdown/`, un emplacement antérieur à l'arborescence de D59.

**Décision** :
- F08 livre `<Markdown source size>` et ses tests, sans le brancher dans un écran, sans aperçu provisoire et sans page de démo. F09 vérifie la coloration dans la vue examinateur, F14 dans la vue projetée, F17 hors ligne.
- Le composant va dans `src/components/markdown/` (partagé par deux features), le highlighter Shiki dans `src/lib/markdown/` (technique).
- Les blocs sont colorés à partir des tokens (`codeToTokens`, `defaultColor: false`), rendus en `<span>` React : pas de `dangerouslySetInnerHTML`.
- `size="projection"` vaut `prose-2xl` à titre provisoire, à caler sur un vrai écran en F14.

**Pourquoi** : un aperçu provisoire serait du code jetable, que F09 remplacerait dès sa première tâche. Le rendu par tokens garde le composant sans injection HTML, et donc sans hotspot SonarQube.

**Reporté dans** : spec F08. Impacte F08, F09, F14, F17.

## D63 — Coloration ouverte à tout le catalogue Shiki, pré-caché en entier (2026-09-26)

**Question** : D27 limite la coloration à six langages (PHP, SQL, HTML, JS, JSON, bash). Un auteur de config qui écrit en Python, YAML ou Dockerfile obtient du texte brut, sans aucun signal. Peut-on ouvrir tout le catalogue Shiki sans perdre le hors-ligne ?

**Décision** :
- Tous les langages de `shiki/langs` (242 langages, 346 identifiants et alias), chacun chargé à la demande au premier bloc qui le demande. Un seul catalogue, celui de Shiki, lu par le highlighter et par le validateur de config ; pas de liste statique.
- F17 pré-cache toutes les grammaires (~1,3 Mo en gzip, ~9 Mo en cache, mesuré sur shiki 4.4.3). Ni préchargement selon la config, ni cache runtime.
- Langage inconnu : texte brut au rendu, et avertissement `unknown_code_language` (non bloquant) à la création de session. `text`, `txt`, `plain` et `plaintext` restent du texte brut, sans avertissement.
- Le moteur JavaScript reste (pas de WASM) : les 346 entrées se chargent et tokenisent sans erreur, et le repli en texte brut couvre une incompatibilité future.

**Pourquoi** : le pré-cache complet coûte moins de trois fois le chunk d'icônes Tabler déjà pré-caché. Il couvre aussi une session restaurée hors ligne sur une autre machine, ce qu'un préchargement selon la config ne couvrirait pas. L'avertissement attrape les fautes de frappe avant le jour de l'oral sans bloquer un pseudo-langage volontaire.

**Reporté dans** : `PRODUCT.md` F08, F17, F18 ; spec F18. Amende D27 (liste des langages). Impacte F08, F17, F18.

## D64 — F09 : transitions pures dans `domain/passage/`, trois écrans provisoires (2026-09-27)

**Question** : le ticket F09 place la logique dans `src/passage/` et décrit des mutations `drawQuestion(sessionId, …)`, alors que D59 interdit à `domain/` d'importer `lib/db/`. Livré seul, F09 ne ferait aussi passer que le premier étudiant : rien ne change `activeStudentId` avant F11 ou F13.

**Décision** :
- Transitions pures `(session, input, deps) → session` dans `src/domain/passage/` (`drawQuestion`, `scoreAttempt`, `setActiveStudent`), qui lèvent une `PassageError` à code typé. Un hook de la feature les passe à `updateSession` : les invariants sont vérifiés dans la transaction, sur la session fraîche. Aléa et identifiant sont calculés dans le mutator, de façon synchrone.
- Sélecteur d'étudiant provisoire (`<select>` dans l'en-tête), retiré par F13.
- Side panel : structure seule (colonne `aside` vide), le panneau et son repli arrivent en F12.
- État « terminé » provisoire (score brut), remplacé par l'écran final de F11.

**Pourquoi** : même modèle que `buildSession` (dépendances injectées, testable sans IndexedDB) et sens des imports D59 respecté. Le sélecteur rend F09 vérifiable de bout en bout sur plusieurs étudiants pour un coût minime. Un panneau vide avec un bouton de repli inutile n'apporterait rien.

**Reporté dans** : spec F09. Impacte F09, F10, F11, F12, F13.

## D65 — F10 : motif de skip revérifié dans la transaction, borné à 200 caractères (2026-09-29)

**Question** : le ticket F10 fixe les refus de `skipAttempt` (attempt non `pending`, skips désactivés, quota atteint) mais rien sur le motif lui-même : ni ce que vaut un motif libre quand `skips.allowFreeText` est faux, ni sa longueur.

**Décision** :
- Un motif hors de `skips.reasons` est refusé (`reason_not_allowed`) si `allowFreeText` est faux. Un motif vide reste toujours accepté (le motif est facultatif).
- Le motif est trimé, puis tronqué à 200 caractères (`MAX_SKIP_REASON_LENGTH`) ; le champ libre porte le même `maxLength`. Vide après trim, il n'est pas enregistré (`skipReason` absent).
- Sans motif prédéfini ni champ libre, le dialogue ne fait que confirmer.
- F10 livré sans spec ni plan séparés (tâche délimitée) : le ticket #10 et ce D65 font foi.

**Pourquoi** : même principe que `score_not_in_scale` pour la note : l'interface ne peut pas produire ce cas, mais le domaine ne dépend pas d'elle (deux onglets, backup importé). La borne protège l'export (F16) et le side panel (F12) d'un texte sans fin.

**Reporté dans** : `src/domain/passage/skip.ts`. Impacte F10, F12, F16.

## D66 — F11 : ouverture de la popup de fin déduite de la base, suivant calculé dans la transaction (2026-09-29)

**Question** : le ticket F11 ouvre la popup d'ajustement par un état local posé par la dernière note. Un rechargement avant sa fermeture, ou un étudiant terminé avant F11, laisserait `finalRevealedAt` vide pour toujours, puisque seule la fermeture de cette popup révèle la note (D31). Le ticket fait aussi calculer l'étudiant suivant par l'écran.

**Décision** :
- La popup s'ouvre en mode « fin de passage » tant que l'étudiant est `done` et que `finalRevealedAt` est vide (`shouldAutoOpenAdjustment`). Sa fermeture, enregistrer ou annuler, renseigne le champ. « Ajuster » la rouvre sans effet sur la révélation.
- Enregistrer en fin de passage compose `revealFinal(setAdjustment(…))` en une seule écriture.
- `goToNextStudent` calcule le suivant sur la session fraîche de la transaction et lève `no_next_student` s'il n'y a personne.
- La justification d'ajustement suit la règle du motif de skip (D65) : `normalizeReason`, 200 caractères.

**Pourquoi** : la révélation ne dépend plus d'un état perdu au rechargement, sans champ persisté de plus. Le calcul dans la transaction suit le principe de F09 (deux onglets examinateur).

**Reporté dans** : spec F11. Impacte F11, F14.

## D67 — F12 : composants partagés avec l'écran final, absence garantie par la transition, pas d'écriture sans changement (2026-09-29)

**Question** : pour un étudiant terminé, l'onglet « Étudiant » du panneau reprend le détail et les notes de l'écran final (F11). Le ticket confie l'enchaînement « réinitialiser puis marquer absent » à l'écran. La sauvegarde automatique du commentaire (délai et sortie du champ) réécrirait la session à chaque blur, même sans changement.

**Décision** :
- La liste des questions et la liste des notes sortent de `FinalScreen` en composants partagés (`AttemptList`, `ScoreList`) ; l'écran final reste complet, le panneau est la surface de correction.
- `setAbsent(…, { absent: true })` réinitialise et marque absent dans la même transition : l'invariant de D08 est garanti par le domaine.
- `updateSession` n'écrit rien si le mutator renvoie la session reçue (même référence) ; les transitions sans effet renvoient leur entrée. Un mutator ne modifie donc jamais la session en place.
- La sauvegarde du commentaire sort du verrou de passage (`run`) : elle appelle `updateSession` directement et ne touche ni à `busy` ni à l'erreur affichée. Passée par la garde, elle était ignorée pendant un tirage ou une correction en vol. `useAutosave` remet une valeur en échec en attente pour que la sortie du champ ou le démontage la retente ; `setAbsent` prend l'étudiant en paramètre, figé à l'ouverture du dialogue.

**Pourquoi** : pas de code dupliqué entre deux écrans qui doivent rester cohérents ; un invariant métier ne doit pas dépendre de l'ordre d'appels de l'interface ; `updatedAt` et `editedAt` ne bougent que sur un vrai changement (export F16, vue projetée F14).

**Reporté dans** : spec F12, CONVENTIONS « Mutation de session ». Impacte F12, F13, F14, F16.


## D68 — F13 : note finale dans la liste, navigation sans changement d'onglet, clé de doublon partagée (2026-09-29)

**Question** : le ticket F13 affiche une « note convertie » dans la liste des étudiants, alors que F14 appelle « converti » la note finale ajustement comprise. Faut-il aussi basculer sur l'onglet « Étudiant » quand l'examinateur choisit un étudiant, et comment détecter un doublon à l'ajout ?

**Décision** :
- La liste affiche la note brute, puis la **note finale** (`computeScores(...).final`, ajustement compris), « — » tant que le passage n'est pas terminé, `absent.label` pour un absent.
- Choisir un étudiant, ou « Ajouter et faire passer », laisse le panneau sur l'onglet « Étudiants ».
- La liste est une `<ul>` de `<button aria-current>`, pas un tableau ni une listbox ARIA.
- `identityKey` sort de `parse-csv.ts` dans `domain/students/identity.ts` ; le dialogue d'ajout s'en sert pour avertir d'un doublon, sans bloquer.
- `setActiveStudent` renvoie son entrée quand l'étudiant est déjà actif (D67).

**Pourquoi** : la note finale est celle qui sort à l'export ; une note sans ajustement tromperait l'examinateur. Le corps de l'écran montre déjà l'étudiant choisi, changer d'onglet casserait l'enchaînement des clics. Un doublon doit être reconnu de la même façon dans le CSV et à la main.

**Reporté dans** : spec F13. Impacte F13, F15, F16.

## D69 — F14 : vue projetée dans `domain/presentation/`, attente pour un absent, animation décidée côté projection, e2e en Page Object Model (2026-09-29)

**Question** : le ticket F14 place `toProjectedView` dans `src/present/` et ne dit rien d'un étudiant projeté absent. Il faut aussi distinguer un nouveau tirage (animation) d'un rechargement de la fenêtre projetée, et poser l'organisation des premiers tests Playwright, que F17 réutilisera.

**Décision** :
- `toProjectedView` et le type `ProjectedView` vivent dans `src/domain/presentation/` ; `setProjection` dans `domain/passage/`.
- Un étudiant projeté absent ou introuvable donne l'écran d'attente.
- `ProjectedView` est construite par liste blanche, sans étalement d'objet du modèle ; elle porte sa propre apparence (langue, thème, mode par défaut), la route `present` ne reçoit jamais la config.
- L'animation se décide dans la fenêtre projetée : le `drawnAt` présent au montage est retenu, seul un `drawnAt` nouveau anime ; rien n'est écrit en base.
- Tests e2e en Page Object Model : un objet par écran, locators par rôle accessible, assertions dans les specs seulement ; `deploy` dépend du job `e2e`.
- Une seule PR pour F14, Playwright compris.

**Pourquoi** : D59 range les règles pures dans `domain/`. Afficher une absence devant la salle n'apporte rien et un identifiant orphelin ne doit pas devenir une erreur. Une liste blanche rend l'étanchéité robuste aux évolutions du modèle. La vue projetée reste en lecture seule (D30) sans second canal de synchronisation. Des pages par écran rendent les scénarios lisibles et réutilisables en F17.

**Reporté dans** : spec F14. Impacte F14, F17.

## D70 — F15 : stats dans `domain/stats/`, stratégie en multiensemble, périmètre des blocs, bundle vérifié sur le manifeste (2026-09-30)

**Question** : le ticket F15 place `computeStats` dans `src/stats/` et laisse ouverts la nature d'une « combinaison » de catégories, le périmètre des blocs hors notes, le départage des ex æquo et la façon de prouver que Recharts reste hors du bundle initial.

**Décision** :
- `computeStats` et `SessionStats` vivent dans `src/domain/stats/`, un fichier par bloc.
- Une stratégie est le **multiensemble** des catégories des questions notées (« Facile ×2 + Difficile ×1 ») ; l'ordre des choix est ignoré.
- Notes, histogramme et stratégies : étudiants terminés. Catégories, tags et questions : tous les attempts (en cours compris).
- Toutes les catégories et tous les tags de la config apparaissent, taux `null` sans attempt noté. Ex æquo départagés par l'ordre de la config.
- Route non imbriquée `session.$sessionId_.stats.tsx`.
- `recharts` et `components/ui/chart` confinés à `features/stats/` (dependency-cruiser) ; `pnpm check:bundle` lit le manifeste Vite et échoue si Recharts est atteint par les imports statiques depuis `index.html`.

**Pourquoi** : D59 range les règles pures dans `domain/`. Avec `questionsPerStudent` fixé, seul le multiensemble distingue les stratégies. Les taux par catégorie décrivent les questions, pas les notes : un passage en cours les renseigne déjà. Un script sur le manifeste est déterministe et réutilisable par F17, là où un test réseau dépendrait des noms de chunks.

**Reporté dans** : spec F15. Impacte F15, F16, F17.

## D71 — F16 : description neutre dans `domain/export/`, dates en heure locale, formats par type, `check:bundle` multi-cibles (2026-09-30)

**Question** : le ticket F16 place la génération dans `src/export/` ; il ne dit ni comment rester testable sans générer de fichier, ni comment write-excel-file écrit les dates, ni quel format donner aux notes brutes à 3 décimales, ni comment garder la bibliothèque hors du bundle initial.

**Décision** :
- `buildWorkbook(session, stats, locale, now)` pur dans `src/domain/export/` renvoie une description neutre (`WorkbookSpec`, cellules texte, nombre, date ou vide) ; `lib/xlsx/write-workbook.ts`, seul importeur de `write-excel-file/browser`, la traduit ; `features/session/export-workbook.ts` orchestre et charge `lib/xlsx` en `import()` dynamique.
- Dates décalées de `getTimezoneOffset()` à l'écriture : write-excel-file suit les composantes UTC, l'examinateur doit lire son heure murale.
- Convertie, ajustement, finale au format du pas ; brute, plafonnée, points au format général ; taux en `0.0%` ; moyennes en `0.00`.
- `check:bundle` porte une liste de cibles (Recharts, write-excel-file), chacune avec son garde de non-vacuité ; groupe `codeSplitting` `xlsx` ; règle dependency-cruiser `xlsx-only-in-lib-xlsx`.

**Pourquoi** : D59 range les règles pures dans `domain/` et le technique dans `lib/`. Une description neutre se teste cellule par cellule sans ZIP. Une heure décalée de deux heures fausserait la lecture du déroulé. `0.###` afficherait « 12. » pour un entier. Le patron F15 (D70) se généralise sans nouveau mécanisme.

**Reporté dans** : spec F16. Impacte F16, F17.

## D72 — F17 : `clientsClaim`, rechargement de la vue projetée sur `controllerchange`, pastille globale, `check:precache` (2026-09-30)

**Question** : D36 ne dit ni comment une page chargée une seule fois fonctionne hors ligne sans rechargement, ni ce que deviennent la vue projetée et les autres onglets quand une nouvelle version est activée depuis un onglet (l'ancien pré-cache est supprimé, leurs chunks à la demande ne se chargent plus), ni où placer l'indicateur, ni comment garantir qu'un nouveau chunk entre au pré-cache.

**Décision** :
- `clientsClaim: true` : la page qui installe le service worker passe sous son contrôle sans rechargement ; `controllerchange` au premier chargement est ignoré.
- La vue projetée se recharge d'elle-même sur `controllerchange` (hors premier chargement) comme sur `versionchange`, une seule fois ; les autres onglets examinateur affichent l'indicateur, sans rechargement forcé.
- Indicateur : pastille fixe en bas à droite, montée dans le layout racine, absente de `/present/*`, non fermable ; le bandeau `outdated` (D45) a la priorité.
- Store `lib/pwa/pwa-update.ts` alimenté par `registerSW` (`virtual:pwa-register`), hooks par `useSyncExternalStore`, sur le modèle de `QuestionatorDb.status`.
- Deux états distincts : `waiting` (une version attend : pastille, rien d'autre) et `activated` (une version a pris le contrôle depuis un autre onglet : pastille, rechargement de la vue projetée). `registerSW` reçoit `onNeedReload: () => {}` : sans lui, la bibliothèque recharge d'office chaque onglet au changement de contrôleur. Seul l'onglet qui a cliqué se recharge.
- `pnpm check:precache` échoue en CI si un fichier de `dist/` manque au manifeste de pré-cache de `sw.js`.
- Icônes : le soleil rayé de la bannière redessiné en SVG (favicon compris), PNG 192, 512 et `maskable` générés et commités.

**Pourquoi** : sans `clientsClaim`, l'examinateur qui charge l'app puis perd le réseau n'a pas de hors-ligne ; le mode `prompt` rend l'option sans risque. La vue projetée, en lecture seule, se recharge sans perte ; un onglet examinateur peut être en pleine saisie. Workbox écarte un fichier trop gros par un simple avertissement. Recharger la vue projetée sur une version seulement en attente la ferait boucler (la version attend toujours après rechargement), mesuré à la revue finale.

**Reporté dans** : `PRODUCT.md` F17, spec F17. Amende D36. Impacte F17, F18.

## D73 — F23 : changer d'étudiant actif remet la projection en attente (remplace D29 sur ce point) (2026-09-30)

**Question** : D29 laisse la vue projetée intacte quand l'étudiant actif change. En test manuel, l'étudiant précédent reste affiché devant la salle tant que l'examinateur ne pense pas à cliquer sur « Écran d'attente ».

**Décision** :
- Tout changement d'étudiant actif (clic dans la liste, « Étudiant suivant », « Ajouter et faire passer ») remet la projection en attente si elle montrait un autre étudiant, dans la même écriture que le changement d'actif.
- Projection déjà en attente, ou déjà sur le nouvel actif : inchangée (même référence, pas d'écriture inutile, D67). Cliquer l'étudiant déjà actif ne change rien.
- Le nouvel étudiant n'est jamais projeté d'office : l'examinateur projette explicitement.
- Règle portée par le domaine (`withActiveStudent`, `domain/passage/active-student.ts`), appelée par `setActiveStudent`, `goToNextStudent` et `addStudent` avec `activate`.
- Le bandeau « La vue projetée montre X » reste : il ne peut plus apparaître après un changement d'actif, mais il couvre une session importée ou antérieure dans cet état.

**Pourquoi** : afficher par défaut l'étudiant précédent n'a aucun usage et l'expose à toute la salle ; projeter d'office le nouveau ferait apparaître un étudiant avant qu'il ne soit prêt. « Ajouter et faire passer » est un changement d'actif comme un autre, l'en exclure aurait laissé le même trou.

**Reporté dans** : `PRODUCT.md` F11, F13, F14. Remplace D29 (« ne touche pas à la projection »). Impacte F11, F13, F14.

## D74 — F25 : disposition des tuiles de catégorie selon leur nombre, grille à demi-colonnes, repli sous `sm` (2026-09-30)

**Question** : les tuiles de catégorie suivaient une grille fonction de la largeur d'écran (`sm:grid-cols-2 lg:grid-cols-3`) : 4 catégories donnaient 3 + 1. Il faut une disposition fonction du nombre de catégories, la même dans les deux vues, et choisir comment centrer une ligne plus courte sans changer la largeur des tuiles.

**Décision** :
- `categoryRows(n)` (`domain/presentation/category-rows.ts`) : `r` = 1 ligne si `n ≤ 3`, 2 si `n ≤ 10`, 3 au-delà ; les `n mod r` premières lignes comptent `⌈n/r⌉` tuiles, les autres `⌊n/r⌋`.
- Rendu par `CategoryLayout` (`components/category-layout.tsx`), partagé par `CategoryGrid` (examinateur) et `CategoryTiles` (projetée) : une seule `<ul>` en grille de `2c` colonnes (`c` = longueur de la première ligne, variable `--cols`), chaque tuile sur deux colonnes, la première tuile de chaque ligne courte marquée `data-row-start` et démarrée à la colonne 2. Une ligne courte n'a qu'une tuile de moins : ce décalage d'une demi-tuile la centre exactement.
- Toutes les catégories comptent (épuisées, indisponibles) : `n` ne change pas pendant un passage.
- Sous `sm` (640 px) : une seule colonne, décalage neutralisé.

**Pourquoi** : un flex à retour à la ligne donne 5 + 5 + 3 pour 13 au lieu de 5 + 4 + 4 ; des lignes rendues séparément casseraient la liste unique (sémantique, tests par rôle). La fonction de domaine se teste sans navigateur ; jsdom ne calculant pas de mise en page, les tests de composant vérifient `--cols` et `data-row-start`, le rendu réel a été contrôlé au navigateur (4, 7, 13 catégories, 420 px).

**Reporté dans** : `PRODUCT.md` F09, F14. Impacte F09, F14, F22 (#56 : l'aperçu réduit la largeur disponible côté examinateur).

## D75 — F19 : coque PageShell, plafond 1536 px, actions à droite avant le thème (2026-09-30)

**Question** : les quatre pages examinateur (accueil, création, passage, stats) avaient chacune leur en-tête et leur largeur, et le bouton de thème n'était pas toujours au même endroit. Comment leur donner une mise en page commune, sans toucher à la vue projetée ?

**Décision** :
- `PageShell` (`components/page-shell.tsx`), composant appelé par chaque page : props `ui`, `title`, `back?`, `meta?`, `actions?`, plus celles du `<main>`.
- Largeur : plafond `max-w-(--breakpoint-2xl)` (96 rem = 1536 px CSS, Tailwind 4 n'a plus `max-w-screen-*`), centré ; marges `px-4`, `sm:px-6`, `lg:px-10`, `py-4`, `sm:py-6`.
- Barre de titre : retour, titre et ligne d'infos à gauche ; actions à droite, **bouton de thème toujours en dernier** (ce n'est pas une prop, une page ne peut pas le déplacer). Barre non sticky, sans bordure.
- Repli d'un titre long : bloc titre en `flex-[1_1_20rem]`, groupe de droite en `ml-auto justify-end` ; un titre long se replie dans sa colonne sans faire passer le bouton de thème à gauche.
- Hors coque, inchangés : les écrans d'état rendus en retour anticipé (`DbStatusBanner` de la session et des stats, `SessionFallback`, erreur des stats, 404) et la vue projetée (sa propre mise en page). `DbStatusBanner` affiché dans l'accueil et la création reste du contenu de la coque.
- Favicon : rien à coder. Déjà réglé par F17 (D72), avec `<link rel="icon">` vers `icons/icon.svg` ; constaté le 2026-09-30 en preview et en prod (200, aucune requête `/favicon.ico`).

**Pourquoi** : un composant appelé par la page est rendu sous `SessionAppearance` là où la page l'est déjà, donc langue et thème de la config sans tuyauterie. Une route de mise en page TanStack aurait dû remonter titre et actions par contexte ou portail, et aurait rendu la barre hors du thème de session. Une simple classe partagée ne garantit pas la place du bouton de thème. 1536 px : pleine largeur sur un portable HDPI (≈ 1280 à 1440 px CSS) et sur un MDPI 1366, marge pour #54 et #56 sur un 1920 ou un 2560 à 100 %. Sans barre sticky : seules les stats sont longues, et une barre collée prend de la hauteur sur 1366 × 768.

**Reporté dans** : `PRODUCT.md` F19, `docs/CONVENTIONS.md` § « Page examinateur — squelette ». Impacte F19 ; prépare #54, #55, #56.

## D76 — F21 : panneau latéral en tiroir modal `Sheet`, fermé au chargement (2026-09-30)

**Question** : le panneau latéral (`SidePanel`) était une `<aside>` dans le flux, repliable, qui retirait 22 rem à la grille de tirage et dont les onglets n'occupaient pas toute la largeur. Comment le rendre moins encombrant sans perdre ses gestes (changer d'étudiant, corriger une note, exporter) ?

**Décision** :
- Modalité : tiroir **modal** `Sheet` à droite (`role=dialog` nommé « Panneau latéral »), avec voile, focus piégé, fermeture par Échap, clic sur le voile ou bouton traduit, focus rendu au bouton d'ouverture.
- Largeur : 28 rem (448 px) au-delà de 640 px, pleine largeur en dessous. Classes `data-[side=right]:w-full data-[side=right]:sm:max-w-md` : les largeurs du vendor portent le préfixe `data-[side=right]:`, des classes nues perdraient.
- Bouton d'ouverture : « Panneau » (icône + texte), premier élément des `actions` de `PageShell`, avant `ProjectionControls` ; le thème reste dernier (D75).
- État : hook `useSidePanel()` dans `ExaminerView`, `SidePanel` contrôlé. Fermé à chaque chargement ; seul l'onglet reste mémorisé (`localStorage`), la clé de l'état ouvert n'est plus lue ni écrite (une valeur orpheline peut subsister dans le `localStorage` des navigateurs existants).
- Fermeture automatique quand un **autre** étudiant devient actif avec succès (clic dans la liste, « Ajouter et faire passer »). Le tiroir reste ouvert pour « Ajouter » seul, le commentaire, la correction de note, absent, export, stats et en cas d'échec.
- États vides (étudiant absent, aucun étudiant) : bouton « Afficher le panneau » qui ouvre l'onglet utile (« Étudiant » pour l'absence, « Étudiants » sinon). Après l'ouverture depuis un état vide, le focus revient au bouton « Panneau ».
- Commentaire : statut visible inchangé ; la zone `sr-only` `aria-live="polite"` n'annonce que « Enregistré » ou « Échec de l’enregistrement ».
- Le bouton « Close » anglais du vendor est désactivé (`showCloseButton={false}`), remplacé par un bouton traduit « Fermer le panneau ».
- Le bouton « Panneau » n'est pas un `SheetTrigger` : le retour du focus passe par une ref explicite donnée à `finalFocus`.
- L'erreur de passage est aussi affichée dans le tiroir (prop `error` de `SidePanel`), car le modal masque l'alerte de la page.

**Pourquoi** : le panneau sert à des gestes ponctuels, pas à rester ouvert pendant un tirage ; un tiroir modal rend toute la largeur à la vue et donne l'accessibilité (piège de focus, Échap, retour du focus) sans code maison. Un tiroir non modal aurait dû renoncer à la fermeture au clic extérieur (chaque tirage le fermerait). 28 rem : la ligne d'étudiant (nom, statut, note brute, note convertie) tient, et il reste plus de 800 px de vue à 1280 px ; 24 rem est trop serré, 32 rem couvre 40 % d'un écran de 1280 px. Un hook local suffit pour trois consommateurs (barre de titre, états vides, onglet « Étudiants ») : un contexte serait de la plomberie. La modalité cache la page, donc l'erreur de passage doit être visible dans le tiroir.

**Reporté dans** : `PRODUCT.md` F12, F13, F21 ; `docs/CONVENTIONS.md` § « Composant shadcn — ajout » ; `docs/BACKLOG.md` (deux items livrés). Impacte F12, F13, F19 ; prépare #56 (aperçu de la vue projetée, plus de largeur libre côté examinateur).

## D77 — F22 : aperçu de la vue projetée en canevas réduit, seuils par conteneur (2026-09-30)

**Question** : l'examinateur pilote la vue projetée (F14) sans voir ce qu'elle affiche. Comment lui montrer un aperçu fidèle, sans iframe ni second chargement, alors que les composants de la vue projetée vivent dans `features/present/` (D59 : pas d'import entre features) ?

**Décision** :
- Les écrans de la vue projetée (`StudentScreen`, `WaitingScreen`, `FinalCard`, `CategoryTiles`, `DrawReveal`) remontent dans `src/components/projection/`, derrière un point d'entrée `ProjectedScreen({ view, animate, className })`. `PresentControls` et `useIdle` restent dans `features/present/`. Le test d'architecture « aucun import du modèle de session » couvre les deux dossiers.
- `ExaminerView` calcule `toProjectedView(session)` (`useMemo`) et le passe à `ProjectionPreview`, qui ne reçoit que la `ProjectedView` (D69).
- Canevas virtuel **1280 × 720**, réduit par `transform: scale(largeur / 1280)` ; largeur mesurée par `useElementWidth` (`src/hooks/`, `ResizeObserver`). Boîte `aspect-video overflow-hidden` : un contenu plus haut est coupé. Canevas caché (`visibility: hidden`) avant la première mesure.
- Seuils en **container queries** : `@min-[40rem]:` remplace `sm:` dans `StudentScreen` et `CategoryLayout` (dont la `ul` est enveloppée d'un `div.@container`). Même seuil de 640 px, mesuré sur le conteneur.
- Animation de tirage désactivée dans l'aperçu (`animate={false}`). Mode clair / sombre : celui de l'examinateur.
- Accessibilité : `section` intitulée « Vue projetée », canevas `aria-hidden` + `inert`.
- Mise en page : ≥ `lg`, grille `minmax(0,1fr) | 26rem`, colonne droite = aperçu, `ProjectionControls`, `ProjectionBanner` ; < `lg`, même colonne empilée en haut, plafonnée à `max-w-xl`. Cette colonne vient en premier dans le DOM. Les contrôles quittent la barre de titre.
- Pilotage : l'alerte de popup bloquée s'efface au début de chaque clic sur « Ouvrir », « Projeter », « Écran d'attente » ; la référence de fenêtre retient le `sessionId`, une fenêtre d'une autre session est rouverte au lieu d'être ramenée au premier plan.

**Pourquoi** : réutiliser les composants et la fonction de domaine garantit que l'aperçu montre exactement la projection, et hérite de son étanchéité. 1280 plutôt que 1920 : à 1920, le texte courant de l'aperçu tomberait vers 4 px ; 1280 est aussi la largeur des vidéoprojecteurs WXGA courants. Dans le canevas, une media query réagirait à la fenêtre examinateur et non à la largeur simulée : sur écran étroit, les tuiles de l'aperçu passeraient sur une colonne alors que la projection en montre plusieurs ; la container query règle aussi le repli de la grille examinateur, qui suit désormais sa colonne. `aria-hidden` + `inert` : le canevas duplique des titres et un énoncé déjà présents sur la page, et ses liens ne doivent pas entrer dans l'ordre de tabulation. Suivre le mode de couleur de la projection aurait demandé d'écouter le stockage de l'autre fenêtre et de scoper les tokens de thème, pour un gain cosmétique.

**Reporté dans** : `PRODUCT.md` F22 ; `docs/CONVENTIONS.md` § « Vue de session thémée » ; `docs/BACKLOG.md` (items → #56). Impacte F14, F19, F21, F25.

## D78 — F20 : accueil sur deux colonnes, export Excel partagé par un hook (2026-10-01)

**Question** : l'accueil empilait actions et sessions, sans dire ce que faisaient les actions, et l'export Excel n'existait que dans la vue de passage, que `features/home` ne peut pas importer (D59). Comment exposer l'export sur la carte de session et rendre les actions explicites ?

**Décision** :
- Logique d'export partagée dans `src/components/export/` : `exportWorkbook` (déplacé, `import()` dynamique de `lib/xlsx` inchangé, D71) et `useWorkbookExport(locale) → { state, run }`, avec une garde contre le double clic en `useRef` (lue et écrite dans `run`, jamais au rendu). `ExportButton` reste dans `features/session/` et consomme le hook.
- Carte de session : item « Exporter en Excel » dans le menu « … », sous « Exporter un backup », désactivé et libellé « Export en cours… » pendant l'export ; échec → alerte sur la carte.
- Mise en page : `lg:grid-cols-[24rem_minmax(0,1fr)]`, actions puis sessions (empilées sous `lg`), liste `2xl:grid-cols-2`. Barre de titre : indicateur de persistance et thème seulement.
- Cartes d'action (`ActionCards`) : « Nouvelle session » (texte, liens vers les deux exemples et le JSON Schema, lien vers `/new`, masquée sans stockage) et « Restaurer une session » (texte, bouton d'import désactivé si la base n'est pas ouverte). Section « Actions » et section « Sessions » titrées en `h2` `sr-only`, cartes en `h3`.
- État vide réduit à un titre et une phrase.

**Pourquoi** : l'export de la carte est un item de menu (choix utilisateur) ; le menu se ferme au clic, le bouton et son alerte ne s'y réutilisent pas. Ce que les deux features partagent est la logique (garde, état, échec), d'où un hook plutôt qu'un bouton déplacé : écart assumé avec le ticket. La garde en ref corrige deux clics dans le même tick, qui passaient la garde sur l'état du rendu (BACKLOG). Colonne d'actions de largeur fixe : lisible et stable ; à 1536 px, une carte de session sur une colonne ferait ~1100 px, d'où deux colonnes à partir de `2xl`. Les fichiers d'exemple et le schéma sont déjà pré-cachés (F17) : rien à ajouter pour le hors ligne.

**Reporté dans** : `PRODUCT.md` F05, F16, F20 ; `docs/BACKLOG.md` (deux items → #54). Impacte F05, F16, F19.

## D79 — F24 : un seul fond pour les blocs de code, code en ligne sans backticks (2026-10-01)

**Question** : les blocs colorés prenaient le fond du thème Shiki (`#fff` en `github-light`, invisible sur une page blanche ; `#24292e` en sombre), les blocs bruts celui de `prose` (`--muted`) : le fond sautait à la fin de la coloration. Le code en ligne affichait les backticks de `@tailwindcss/typography`, sans fond.

**Décision** :
- Les règles `background-color` de `.shiki` (claire et sombre) sont supprimées : tout bloc, coloré ou brut, prend le fond de `.prose pre` (`--tw-prose-pre-bg` = `--muted`) et une bordure `1px solid var(--border)`. Shiki ne pilote plus que la couleur des tokens.
- Code en ligne (`.prose :where(code):not(:where(pre *))`) : `::before` / `::after` à `content: none`, fond `--muted`, padding `0.15em 0.35em`, coins de `0.25rem`.
- Vérification par e2e (`e2e/code-style.spec.ts`), jsdom n'évaluant pas le CSS.

**Pourquoi** : un fond unique supprime le saut quel que soit l'état de la coloration, et suit le thème de la config (tokens shadcn) au lieu de couleurs codées en dur. La bordure détache le bloc de la page dans les deux modes. Vérifié à l'écran, vue examinateur et vue projetée, clair et sombre : les couleurs de github-light et github-dark restent lisibles sur `--muted`, y compris sur le `--muted` violet du thème d'exemple.

**Reporté dans** : `docs/CONVENTIONS.md` § « Markdown et bloc de code » ; `docs/BACKLOG.md` (deux items → #58). Impacte F08, F09, F14, F18.

## D80 — F26 : éditeur de config (CodeMirror sur route dédiée, issues localisées, aperçu au thème de la config) (2026-10-01)

**Question** : pour voir le rendu de ses questions, l'auteur d'une config devait créer une session et tirer les questions une à une ; les erreurs n'apparaissaient qu'à la création, par leur chemin. Comment offrir un éditeur avec validation en direct et aperçu, sans alourdir le reste de l'application ni importer entre features ?

**Décision** :
- Route `#/editor`, feature `features/config-editor/`, ouverte par une troisième carte d'action de l'accueil. CodeMirror 6 sans wrapper React (`@codemirror/*`, `@lezer/highlight`), groupe de chunk `codemirror`, interdit au bundle initial (`check:bundle`, cible avec `importer` = route de l'éditeur).
- Couleurs de l'éditeur : thème et `HighlightStyle` sur des variables `--cm-*` (`index.css`, clair et sombre) ; ligne active marquée.
- Validation 300 ms après la frappe (`validateConfig` chargé à la demande) ; la dernière config valide est gardée pour l'aperçu. Position d'une issue (`locateIssue`) : `json_syntax` par ligne / colonne, sinon `parseTree` + `findNodeAtLocation` de `jsonc-parser` en remontant au premier nœud existant ; `unknown_key` → paire clé-valeur. Diagnostics calculés sur le texte validé et passés à `@codemirror/lint`.
- Brouillon : `localStorage` `questionator:config-draft` (300 ms) ; départ : brouillon, sinon l'exemple importé en `?raw` (exception oxlint limitée au fichier). Charger / repartir de l'exemple : transaction annulable. Les fichiers déposés sur l'éditeur sont ignorés par CodeMirror (la page remplace le texte une seule fois).
- Aperçu : `ThemeScope` (variables du thème de la config sur la seule colonne d'aperçu, `themeVariables` partagé avec `AppearanceProvider`) et langue de la config ; questions en cartes (`<Markdown size="projection">`, réponse en `<details>`) ; écran final par `ProjectionCanvas` (extrait de F22) sur `toProjectedView(previewSession(config))`, session factice pure de `domain/presentation/`.
- Sorties : téléchargement du texte exact (`<slug du titre>.json`, sinon `config.json`) ; « Créer une session avec cette config » via `lib/config-handoff.ts` (`sessionStorage`, repris une fois par la création, `useCreateForm.setConfigText`).

**Pourquoi** : la route dédiée garde CodeMirror (et l'exemple) hors de l'accueil et de la création ; le pré-cache de F17 couvre le hors ligne sans rien ajouter. Réutiliser le validateur et ses messages garantit qu'une erreur s'affiche à l'identique dans l'éditeur et à la création. Thème et langue limités à l'aperçu : l'éditeur reste dans l'apparence de l'application pendant qu'on tape un `theme`. Le passage par `sessionStorage` évite l'import entre features (D59) et survit au rechargement de `#/new`.

**Reporté dans** : `PRODUCT.md` F05, F26 ; `docs/CONVENTIONS.md` § « Vue de session thémée » ; `docs/BACKLOG.md` ; `docs/QUIRKS.md`. Impacte F02, F06, F14, F20, F22.

## D81 — F31 : robustesse des données persistées (sessions endommagées, échelle hors grille refusée, persistance relue) (2026-10-01)

**Question** : une session lue en IndexedDB mais incohérente (attempt `scored` sans `score`, ajustement hors bornes, config qui ne valide plus) faisait lever `computeScores` ou affichait une note trompeuse, sans que l'utilisateur puisse récupérer ses données. Comment détecter, afficher et conserver une telle session ?

**Décision** :
- Détection dans la couche de lecture `lib/db` (`getSession`, `listSessions`, `updateSession`), par `checkStoredSession` (`domain/backup/stored-session.ts`) : exactement les règles de l'import de backup (schéma, `validateConfig` sur la config figée, `checkSessionRules`) (nuancé par D89 : `duplicate_student_order` est refusé à l'import seulement, jamais à la lecture). Coût mesuré : ~0,17 ms par session (exemple, 40 étudiants). Un enregistrement invalide devient un `DamagedSession` (`id`, `raw`, `issues`), garde `isDamaged` ; le reste du code reçoit des sessions sûres.
- `updateSession` lève `SessionDamagedError` sans écrire : on ne réécrit jamais un contenu qu'on ne comprend pas.
- `DamagedSessionScreen` : variante examinateur (titre, explication, « Exporter un backup », retour à l'accueil, détails des issues) sur la session et les statistiques ; variante vue projetée : le titre seul (écart assumé au ticket : rien à exporter ni à lire devant l'étudiant, et les issues peuvent citer des noms ou des notes). La vue projetée ne reçoit pas la session (D69) : la variante n'en prend aucune, `useProjectedView` ne remonte que `'damaged'`.
- Export brut : `raw` est écrit tel quel dans l'enveloppe ; nom de fichier = nom lisible, sinon id, sinon `session`. Accueil : `DamagedSessionCard` (badge « Endommagée », menu « Exporter un backup » + « Supprimer »).
- Réparation : l'import d'un backup par-dessus une session endommagée reste possible (dialogue de conflit : nom lisible ou id, sans date). Boucle « exporter, corriger, réimporter ».
- `final_scale_off_grid` passe d'avertissement à **erreur** (remplace D02 / D20 sur ce point). Conséquence assumée : une session ou un backup portant une telle config devient « endommagé » / inimportable.
- Nouvelle règle de backup `invalid_adjustment` : ajustement fini, au plus 3 décimales, au plus 10 000 en valeur absolue (mêmes bornes que les autres valeurs de notation, supprime l'exception de `toMilli`). `parseBackup` signale désormais les erreurs d'enveloppe avant celles de la session.
- `persistence.ts` relit `navigator.storage.persisted()` quand l'onglet redevient visible.
- Bundle initial : `lib/db` charge le validateur à la demande (`loadReadStored()`, `import('@/domain/backup/stored-session')` mémoïsé, avant la transaction de `updateSession`, après les lectures de `getSession` / `listSessions`) ; le contrôle `unknown_code_language` est injecté (`isKnownLanguage`, facultatif) par l'écran de création et l'éditeur seuls, `rules.ts` n'importe plus `code-languages.ts` (`shiki/langs`).
- Hors périmètre : error boundary générique, réparation automatique, migration `version(2)`.

**Pourquoi** : un seul point de passage pour tous les écrans ; deux chemins (lecture, import), une seule définition de « session valide ». Refuser l'échelle hors grille supprime le cas d'affichage trompeur (« 20,3 » pour 20,25 au pas de 0,5) plutôt que de l'habiller, le projet n'étant pas encore en production. Une session validée qui lève relève d'un bug, pas d'une donnée endommagée.

**Reporté dans** : `PRODUCT.md` §6.2 ; `docs/CONVENTIONS.md` § « Mutation de session » ; `docs/BACKLOG.md` ; `docs/QUIRKS.md`. Spec : `docs/superpowers/specs/2026-10-01-f31-robustesse-design.md`. Impacte F04, F05, F11, F14, F18, F30.

---

## D82 — F30 : finitions de l'écran de passage, une erreur ne s'affiche que là où elle est survenue (2026-10-01)

**Question** : l'écran de passage affichait des erreurs au mauvais endroit (une vieille erreur du hook réapparue à chaque ouverture du tiroir ou du dialogue d'ajout, l'alerte du dialogue d'ajustement doublée par l'alerte générique de la page), laissait fermer un dialogue pendant une écriture, et perdait un commentaire tapé juste avant un rechargement. Que corriger, et comment ?

**Décision** :
- `run(mutator, { ownError })` dans `usePassageActions` : avec `ownError`, un échec laisse `error` du hook à `null` et l'appelant affiche le sien. Utilisé par `adjust` et `revealFinal` (dont le seul appelant est le dialogue d'ajustement), par `reset` (seul appelant : `ResetDialog`) et par `setAbsent(id, true, { ownError: true })` de la confirmation d'absence (`AbsentToggle.confirm`) : plus de double alerte. Cocher ou décocher l'absence sans dialogue n'a pas de surface propre et garde l'alerte de la page et du tiroir.
- `useFreshError(error, open)` (`Failure = { readonly message: string }`, un objet par occurrence) : n'expose que les erreurs survenues pendant que la surface est ouverte. `SidePanel` et `AddStudentDialog` l'utilisent. `examiner-view` mémoïse la `Failure` sur `actions.error` seul : le message est figé à l'instant de l'échec (la langue vient de la config de la session).
- Dialogue d'ajustement : focus initial sur le champ dont le contenu est sélectionné (taper remplace la valeur), boutons − / + bornés à ±`finalScale` et désactivés à la borne ; `score-list` affiche « aucun » pour un ajustement absent ou nul.
- Écriture en cours : « Annuler » désactivé et Échap / clic extérieur ignorés dans `TextFieldDialog`, `DeleteDialog`, `ImportConflictDialog` et `AddStudentDialog`. Ajustement, réinitialisation et absent le faisaient déjà ; le saut et `ImportErrorDialog` n'ont rien à protéger.
- Commentaire et rechargement : `useAutosave` flushe aussi sur `pagehide` (même principe que `useConfigDraft`), mais une écriture IndexedDB lancée à `pagehide` n'aboutit pas avant le déchargement en Chromium (`updateSession` charge le validateur, lit, puis écrit : `put` n'est jamais appelé, mesuré en e2e). Le flush n'est donc qu'un plus. Ce qui sauve la frappe est une copie synchrone dans `localStorage` (`src/features/session/comment-draft.ts`, clé `questionator:comment-draft:<session>:<étudiant>`, tout accès protégé) : écrite à chaque frappe, supprimée quand l'enregistrement de cette valeur réussit (si elle n'a pas été remplacée entre-temps), relue au montage de `CommentField` (une copie différente du commentaire stocké s'affiche et est reprogrammée en sauvegarde ; une copie égale est supprimée). Compromis assumé : une copie restée en place l'emporte sur un commentaire modifié dans un autre onglet pendant la fenêtre de déchargement.
- Fixtures d'écran partagées dans `src/testing/screen-fixtures.ts` (`screenCategory`, `REVEALED`, `panel()`).

**Pourquoi** : une alerte `role="alert"` est annoncée par le lecteur d'écran à chaque apparition ; une erreur périmée y est trompeuse. L'erreur appartient à la surface qui l'a provoquée, le temps qu'elle est ouverte.

**Reporté** : `docs/CONVENTIONS.md` § « Dialogue de saisie » (motif `ownError` + `useFreshError`), `docs/QUIRKS.md` (IndexedDB à `pagehide`), `docs/BACKLOG.md` (mineurs → #87).

## D83 — F35 : fichiers d'entrée plus tolérants (tabulation, cellules sur plusieurs lignes, identifiants presque identiques) (2026-10-01)

**Question** : un CSV séparé par tabulations donnait « aucun étudiant valide », un nom saisi sur deux lignes dans une cellule Excel gardait son saut de ligne, et deux identifiants de config presque identiques (espace en bord, accent précomposé contre accent combinant) passaient pour deux clés distinctes. Avertir ou refuser ?

**Décision** :
- CSV : séparateur détecté parmi `;`, `,` et tabulation par le même score qu'avant (lignes découpées en au moins deux cellules non vides) ; égalité : `;`, puis `,`. Chaque cellule passe par `replace(/\s+/gu, ' ').trim()`. Le numéro de ligne cité (avertissements, `csv_syntax`) reste celui de l'enregistrement, c'est-à-dire la ligne vue dans Excel ou LibreOffice, où l'enseignant prépare son fichier : une cellule saisie sur plusieurs lignes (Alt+Entrée) compte pour une ligne. Choix de l'utilisateur en revue, plutôt que la ligne de texte (dont le comptage dépendrait aussi des fins de ligne : un LF dans une cellule d'un fichier CRLF).
- Config : deux **erreurs**, au même titre que les doublons : `padded_id` (id de catégorie ou de question avec une espace en début ou en fin) et `unicode_variant_id` (deux ids du même type égaux une fois normalisés en NFC, mais écrits avec des caractères différents). Une égalité stricte reste `duplicate_category_id` / `duplicate_question_id`, même si une variante l'a précédée.

**Pourquoi** : un id est une clé de référence (attempts, stats, export) ; une variante invisible est presque toujours une faute de saisie, et on ne peut plus la corriger depuis l'application une fois la session créée. Le projet n'étant pas en production, refuser ne casse rien d'existant ; une session stockée qui porterait un tel id serait signalée endommagée (D81).

**Reporté** : `PRODUCT.md` §6.1 et §6.2.

## D84 — F34 : glisser-déposer fiabilisé, un seul hook (2026-10-01)

**Question** : trois zones de dépôt (import de backup, création de session, éditeur de config) avaient chacune leur code, avec un test `relatedTarget` qui fait clignoter la surimpression sous WebKit ; un second fichier déposé pendant le dialogue de conflit remplaçait le conflit en attente ; les dialogues d'import se vidaient pendant leur fermeture ; une issue répétée s'affichait deux fois.

**Décision** :
- `useFileDrop({ disabled, isolate, onFile })` dans `src/hooks/` (hook transverse, D59), avec `hasFiles` : surimpression tenue par un compteur `dragenter` / `dragleave` (un `dragover` sans `dragenter` préalable amorce le compteur), dépôt du premier fichier ; désactivé : `dragover` empêché avec `dropEffect = 'none'`, ni surimpression ni lecture ; `isolate` arrête la propagation (colonne de l'éditeur, avant la garde de page). Les trois zones l'utilisent.
- Import de backup : la zone est désactivée tant qu'un dialogue d'import est ouvert (`state.kind !== 'idle'`) ou qu'un import est en cours (`importing`, plus un verrou `busy` en ref dans le hook) ; le bouton « Importer un backup » suit la même règle, et `importFile` lui-même refuse un import par-dessus un dialogue ouvert (contrat tenu quel que soit le chemin d'appel).
- Dialogues d'import : contenu tiré du dernier état non nul (`useRetained`, sur l'`ImportState`, objet stable), `open` sur l'état courant : rien ne se vide pendant l'animation de fermeture.
- Issues dédoublonnées à l'affichage sur `chemin|message` (`uniqueBy`, `lib/issue-list.ts`) : deux issues de même chemin et même message sont un doublon d'affichage, pas une information.

**Pourquoi** : un seul mécanisme, testé une fois, qui ne remplace jamais une action en cours.

**Reporté** : `docs/CONVENTIONS.md` § « Fichier déposé et lu », `docs/QUIRKS.md` (jsdom et dialogues), `docs/BACKLOG.md` (items → #82 retirés).

## D85 — F33 : finitions de la vue projetée (états des tuiles, détail final, clés de montage, animation figée) (2026-10-01)

**Question** : la vue projetée atténuait de la même façon une catégorie épuisée et une catégorie non tirable (question en cours, passage terminé), inventait « 0 » pour une question notée sans note, remontait l'écran sur le nom affiché (deux homonymes partageaient un montage) et rejouait le mélange quand `drawAnimation` changeait pendant une question.

**Décision** :
- Tuiles à cinq états (`data-state`) : `exhausted` (atténuation forte, pointillés, « Épuisée »), `current` (catégorie de la question en cours, bordure épaisse), `waiting` (une autre question est en cours : atténuation légère, **sans libellé**, pour ne pas charger l'écran à chaque question), `unavailable` (passage terminé : atténuation légère et « Indisponible »), `available`. Choix de l'utilisateur en session : le libellé « Indisponible » seulement en fin de passage.
- Détail final : « catégorie · titre » ; une question notée sans note affiche « — », jamais une note inventée.
- `ProjectedView` gagne `student.order` (clé de montage de l'écran étudiant) et `detail[].questionId` (clé de ligne). Pas l'`id` de l'étudiant : le test d'étanchéité de D69 l'interdit ; l'ordre de passage n'apprend rien de plus que l'écran lui-même.
- `DrawReveal` fige `animate` au montage.
- La tuile de la catégorie en cours reste `current` même si sa question était la dernière (elle est alors déjà « épuisée » au sens de `isCategoryExhausted`).
- `questionId` n'est jamais affiché ; il voyage dans la vue sérialisée, ce qui reste acceptable même si un enseignant choisit des identifiants parlants.

**Pourquoi** : l'étudiant comprend pourquoi une catégorie est grisée sans que l'écran se charge de libellés à chaque question ; aucune donnée inventée ne s'affiche devant la salle.

**Reporté** : `docs/QUIRKS.md` (stub `matchMedia` et mouvement réduit), `docs/BACKLOG.md` (items → #81 retirés, restes → #87).

## D86 — F36 : vérification horaire des mises à jour, message « prête hors ligne » à fermer, premier `controllerchange` selon le worker actif (2026-10-01)

**Question** : F17 ne cherche une nouvelle version qu'au chargement : une version publiée en cours de journée reste invisible tant que l'examinateur ne recharge pas. Rien ne lui dit quand l'app est prête pour une salle sans réseau. Et la vue projetée ouverte par Shift+Reload (page sans contrôleur, worker déjà actif) prend son premier vrai `controllerchange` pour celui de `clientsClaim` (D72) et ne se recharge pas.

**Décision** :
- `PwaUpdate` appelle `registration.update()` toutes les heures, au retour sur l'onglet (`visibilitychange` vers `visible`) et au retour du réseau (`online`) ; ces deux derniers au plus une fois par tranche de 5 minutes depuis la dernière vérification (horaire comprise). Posé une seule fois, à la réception de l'enregistrement. Échec (hors ligne) ignoré sans bruit, et la limite est levée : le retour du réseau qui suit vérifie sans attendre 5 minutes. Une version trouvée passe par `onNeedRefresh` : pastille « Recharger » existante, jamais appliquée d'office. Déclencheurs injectables (`UpdateTriggers`).
- « Prête pour le hors ligne » : état `offlineReady` du store, levé par `onOfflineReady` de `registerSW` (pré-cache terminé, première installation seulement), filtré par la même lecture du worker actif : après un Shift+Reload qui trouve une version, workbox-window prend son installation pour une première installation. Pastille `OfflineReadyPrompt` au même endroit que `UpdatePrompt`, fermée par « OK » (choix de l'utilisateur, plutôt qu'une disparition automatique), absente de `/present/*`, masquée dès qu'une version est proposée. Fermeture non mémorisée : un rechargement avant « OK » ne la fait pas revenir, ce qui tient le « une seule fois ».
- Premier `controllerchange` d'une page sans contrôleur : ignoré seulement si `navigator.serviceWorker.getRegistration()`, lu avant `register`, ne renvoie aucun worker actif (premier chargement). Worker déjà actif (Shift+Reload) : aucun `clientsClaim` ne viendra, le premier `controllerchange` est une vraie activation. Page sous contrôle : décision synchrone, inchangée.

**Pourquoi** : une journée d'oraux dure plusieurs heures ; une heure suffit, et le retour sur l'onglet couvre le cas d'un examinateur qui revient de pause. Une pastille qui s'efface seule peut passer inaperçue au moment où l'examinateur prépare la salle. Lire le worker actif avant l'enregistrement est sûr : même lu après, `active` reste nul tant que le pré-cache de la première installation n'est pas fini.

**Reporté dans** : `PRODUCT.md` F17. Amende D72. Impacte F17.

## D87 — F32 : aide à la saisie tirée du JSON Schema, descriptions en français, complétion et survol maison (2026-10-01)

**Question** : le JSON Schema publié ne dit rien de chaque champ, et l'éditeur de config (F26) n'aide pas à la saisie. Dans quelle langue décrire les champs, d'où tirer les textes et les défauts, et avec quelle bibliothèque brancher complétion et survol ?

**Décision** :
- Descriptions en français seul, un seul schéma publié. Source : `.meta({ description })` sur chaque champ de `ConfigSchema`, texte tiré du tableau de `PRODUCT.md` §6.2 ; le JSON Schema les hérite.
- Défauts : `.meta({ default })` sur les champs optionnels qui en ont un, valeur lue dans `CONFIG_DEFAULTS` (pas recopiée).
- Jetons de thème : description générique construite par jeton (« Variable CSS `--primary` du thème clair »).
- Icône : l'`override` de `buildConfigJsonSchema` conserve `description` et `default` du nœud qu'il remplace.
- Éditeur : complétion et survol maison (`jsonc-parser` + `@codemirror/autocomplete` + `hoverTooltip`), pas `codemirror-json-schema`. Le schéma est produit par `buildConfigJsonSchema()` dans le chunk de l'éditeur, mémorisé au premier usage.
- `markdownDescription` = `description` + « Défaut : `…` » sur chaque nœud décrit, car le survol de VS Code ignore `default`. `description` reste brut (l'éditeur de l'app l'affiche tel quel).
- Hors périmètre : validation par le JSON Schema (le validateur de l'app reste la référence) ; extraits de blocs entiers.

**Pourquoi** : public francophone, comme `PRODUCT.md`, et un JSON Schema ne porte qu'une langue. Le schéma Zod reste la source unique : le survol ne peut pas diverger de la normalisation. 64 jetons de thème : un texte par jeton n'apporterait rien de plus que son nom. Sans l'`override` corrigé, l'aide disparaît sur `icon`. `codemirror-json-schema` 0.8.1 n'est plus maintenu depuis avril 2025 et tire shiki v1 (doublon de notre v4), `markdown-it`, `yaml`, `json-schema-library`. Pas de réseau ni d'état de chargement : Zod et la liste d'icônes sont déjà chargés par la validation en direct. `vscode-json-languageservice` n'affiche que `title`, `markdownDescription` (ou `description`) et les descriptions d'enum : sans `markdownDescription`, le défaut promis par le README n'apparaîtrait pas dans VS Code.

**Reporté dans** : `PRODUCT.md` F26 et §6.2 ; `README.md`. Impacte F26.

## D88 — #86 : budgets de taille du build en gzip, sur le premier affichage de l'accueil et par chunk (2026-10-01)

**Question** : `check:bundle` garantit que Recharts, xlsx, Shiki et CodeMirror restent hors du bundle initial, mais rien ne surveille les tailles : `chunkSizeWarningLimit` est calé sur le chunk des icônes (D37) et ne voit plus le reste. Que mesurer, sur quel périmètre, avec quelle marge ?

**Décision** :
- `pnpm check:budget` (`scripts/check-bundle-budget.ts`), après `pnpm build`, en CI après `check:precache`. Lit le manifeste Vite, réutilise `manifestSchema` et `staticClosure` de `check-initial-bundle.ts`.
- Mesure **gzip** (`zlib`, déterministe), ce qui transite réellement. Marge d'environ **15 %** au-dessus des tailles du 2026-10-01 (choix de l'utilisateur pour les deux).
- **Premier affichage de l'accueil ≤ 275 Ko** (mesuré 238,5 Ko) : JS et CSS atteints statiquement depuis l'entrée **et** depuis la route `/` (`src/routes/index.tsx?tsr-split=component`). La route est découpée paresseusement par TanStack mais chargée aussitôt ; sans elle, un import lourd dans l'accueil échappait à la fois au budget et à `check:bundle` (vérifié : Recharts importé dans `home-page.tsx` passait `check:bundle` ; `check:budget` le refuse à +98,9 Ko).
- **Chaque chunk JS ≤ 135 Ko** (plus gros mesuré : `codemirror`, 116 Ko), sauf `icons-*` (D37) et les grammaires et thèmes Shiki (`@shikijs/langs|themes`, chargés un par un à la demande, jusqu'à 194 Ko pour `emacs-lisp`).
- `IconBrandPhp` (marqueur des icônes Tabler) n'apparaît dans aucun autre chunk.
- Gardes de non-vacuité : une entrée, la route `/`, un chunk `icons-*` portant le marqueur, au moins une grammaire ou un thème exemptés.
- Message d'erreur : fichier, taille, budget et écart (`… : 373,9 Ko gzip, budget 275,0 Ko (+98,9 Ko)`) ; en succès, une ligne avec les tailles et budgets.
- `check:bundle` part lui aussi de la route `/` en plus de l'entrée (`HOME_ROUTE_KEY`, partagé) : une bibliothèque confinée et légère (xlsx, 19 Ko) importée dans l'accueil tiendrait dans la marge du budget.
- Un fichier n'est exempté du budget par chunk que si **toutes** ses clés du manifeste sont des grammaires ou thèmes Shiki ; l'écart affiché est arrondi au dixième de Ko supérieur.
- Polices non comptées : seul le sous-ensemble `latin` de Geist se charge (`unicode-range`, ~29 Ko) ; le budget porte sur JS et CSS.
- Liste blanche du groupe `vendor` relue : rien à ajouter tant que `check:bundle` reste vert.

**Pourquoi** : le gzip est ce que paie l'examinateur au premier chargement ; une marge de 15 % laisse grandir l'app et attrape une bibliothèque lourde. Les grammaires Shiki imposeraient un budget par chunk de ~200 Ko qui ne surveillerait plus rien.

**Reporté dans** : `docs/ENVIRONMENT.md` (commandes), `docs/INDEX.md`, `docs/BACKLOG.md`, `docs/QUIRKS.md`.

## D89 — #87 : rang de passage en double refusé à l'import seulement (2026-10-02)

**Question** : deux étudiants au même `order` (backup édité à la main) partageraient le montage de l'écran projeté (D85) et rendraient l'ordre de passage ambigu. Faut-il le refuser à l'import, et déclarer endommagée (F31, D81) une session déjà en base qui l'aurait ?

**Décision** :
- Nouvelle règle de backup `duplicate_student_order` (erreur, chemin `session.students[i].order`, paramètres `order` et `firstPath`, messages fr et en), dans `checkStudentOrders` (`domain/backup/rules.ts`), hors de `checkSessionRules`.
- `parseBackup` la passe à `checkStoredSession` comme règle supplémentaire (`extraRules`) : un backup qui la porte est refusé, avec les autres issues de règles.
- La couche de lecture (`loadReadStored`) ne l'applique pas : une session déjà en base avec un rang en double reste saine. Écart assumé à D81 (« exactement les règles de l'import ») : on n'enferme jamais l'utilisateur hors de données déjà stockées pour une incohérence que l'application ne produit pas et qui ne fausse aucune note.

**Pourquoi** : les parcours de l'application gardent `order` unique (création : rang + 1, ajout : max + 1) ; seul un fichier édité à la main peut le casser, et l'import est le seul endroit où l'utilisateur peut encore le corriger.

**Reporté dans** : `docs/BACKLOG.md` (§ Persistance).

## D90 — F37 (#100) : barème des catégories en points, affichage côté étudiant piloté par la config (2026-10-02)

**Question** : « max 2 » sous chaque case de l'examinateur se lisait « 2 questions au maximum », et la vue projetée ne montrait pas ce maximum. Comment l'écrire, et qui décide de le montrer à l'étudiant ?

**Décision** :
- Libellé `passage_category_max` : « 2 pts », « 1 pt », commun à la grille examinateur et aux tuiles projetées. Le paramètre `points` (nombre) porte l'accord, à côté de `max` (chaîne formatée) : « 1,0 pt ». Accord : en français, singulier strictement sous 2 (« 0,5 pt », « 1,5 pt », « 2 pts »), par un helper décimal propre à ce libellé (`pluralDecimal`) ; en anglais, singulier pour 1 seulement (« 1.5 pts »). *Modifié par #118 : à la livraison de F37, l'accord suivait `plural` (pluriel au-delà de 1, « 1,5 pts »).*
- Examinateur : toujours affiché. Vue projetée : nouvelle clé `presentation.showCategoryPoints`, défaut `true`. À `false`, `toProjectedView` ne transmet pas `categories[].maxPoints` (champ optionnel), comme `showCumulativeScore` et `showStatsOnFinal` retirent leurs données (D69).
- Format : `formatRawScore` (extrait de `formatScore` en `raw`), utilisable par la vue projetée, qui ne reçoit pas la config.
- Sessions et backups antérieurs : rien à migrer, `checkStoredSession` repasse la config par `validateConfig`, qui applique le défaut.

**Pourquoi** : l'unité lève l'ambiguïté sans ajouter de texte. Montrer le barème à l'étudiant l'aide à choisir sa difficulté, mais certains examinateurs préfèrent ne pas l'afficher ; le défaut suit l'usage le plus courant.

## D91 — F38 (#101) : panneau toujours rouvert sur « Étudiant », absence en bouton d'action (2026-10-02)

**Question** : l'onglet mémorisé (D76) rouvrait le panneau sur la liste une fois qu'on y était passé, et déclarer un étudiant absent obligeait à le rendre actif puis à chercher une case à cocher en bas de l'onglet « Étudiant ». Comment rendre ces deux gestes directs ?

**Décision** :
- Remplace l'onglet mémorisé de D76 : `useSidePanel` ne lit ni n'écrit plus rien, `side-panel-state.ts` est supprimé. `show()` ouvre sur « Étudiant » par défaut, et c'est ce que fait le bouton « Panneau ». Le changement d'onglet tiroir ouvert reste libre ; les ouvertures ciblées (« aucun étudiant » → « Étudiants », absent → « Étudiant ») sont inchangées. L'ancienne clé `questionator:side-panel:tab` n'est plus lue, une valeur orpheline peut subsister.
- `AbsentToggle` devient `AbsentButton` : « Marquer absent » / « Marquer présent », même dialogue de confirmation (D67, issue `written` / `failed` / `ignored`). Variante pleine dans l'onglet « Étudiant », variante `compact` (icône, infobulle, nom accessible « Marquer Durand Alice absent ») à côté du bouton de chaque ligne de la liste, jamais dedans.
- Depuis la liste, l'action vise l'étudiant de la ligne, sans le rendre actif : le tiroir reste ouvert (D76 ne le ferme qu'au changement d'étudiant actif). Le bouton est désactivé pendant une écriture, la ligne garde le focus clavier.
- `absent_label` retiré ; `absent_mark`, `absent_unmark`, `absent_mark_named` et `absent_unmark_named` ajoutés (FR, EN). Le texte de l'état absent renvoie à « Marquer présent ».

**Pourquoi** : pendant un oral, on ouvre le panneau pour l'étudiant en cours ; la liste est un détour ponctuel. L'absence est une action (elle supprime parfois des questions), pas un état à cocher, et elle concerne souvent un étudiant qui n'est pas encore actif.

## D92 — F39 (#102) : ouverture de la vue projetée séparée du pilotage (2026-10-02)

**Question** : « Ouvrir la vue projetée » était aligné avec « Projeter cet étudiant » et « Écran d'attente » sous l'aperçu, alors qu'il n'écrit rien et n'est jamais désactivé. Où le placer, et où mettre la logique de fenêtre ?

**Décision** :
- « Ouvrir la vue projetée » passe sur la ligne du titre de l'aperçu, à droite, par l'emplacement `action` de `ProjectionPreview`. Le message de popup bloquée suit, dans l'emplacement `notice`, sous l'en-tête.
- La logique de fenêtre (ref liée à la session, URL sans paramètres de recherche, popup bloquée) sort de `ProjectionControls` dans le hook `usePresentWindow`, appelé une seule fois par `ExaminerView`. `ProjectionControls` ne garde que le pilotage ; son `onAction` efface le message, comme avant.
- Icônes Tabler décoratives à côté du libellé : `IconExternalLink`, `IconPlayerPlay`, `IconPlayerPause`.

**Pourquoi** : ouvrir une fenêtre et piloter ce qu'elle montre sont deux gestes distincts ; un hook unique évite de dupliquer la logique de fenêtre entre deux composants.

## D93 — F40 (#103) : champ manquant nommé, valeurs possibles au survol (2026-10-02)

**Question** : « Champ obligatoire manquant. » ne disait pas quel champ manque, et le survol d'une clé n'affichait que la description et le défaut, alors que les descriptions paraphrasent les valeurs à écrire. Comment donner ces deux informations sans dupliquer le parcours du schéma ?

**Décision** :
- `required` prend un paramètre `field`, le dernier segment du chemin quand c'est une clé (`requiredIssue`, `from-zod.ts`). Message FR « Champ obligatoire manquant : « finalScale ». », EN `Required field is missing: "finalScale".`, avec les guillemets des autres messages (`unknown_key`). Sans clé (index de tableau, chemin vide) : message d'avant. Le message partagé change aussi à la création de session, à l'import de backup et à la relecture d'une session.
- `collectValues` quitte `features/config-editor` pour `domain/config/schema-values.ts`, avec `hoverValues` : littéraux JSON d'une liste fermée (`enum`, `const`, `null` d'un nullable, sans `true` / `false`), `open` pour un `anyOf` qui accepte aussi une chaîne libre, rien sinon. Les mêmes valeurs alimentent l'autocomplétion, le survol de l'app et le `markdownDescription` publié (VS Code), dans l'ordre description, valeurs, défaut.
- Liste ouverte : pas de liste (6 000 noms d'icônes), mais un lien vers https://tabler.io/icons (nouvel onglet, `noopener noreferrer`) et le rappel de Ctrl+Espace. `icon` est aujourd'hui la seule liste ouverte du schéma : le lien Tabler lui est attaché d'office ; une deuxième liste ouverte demanderait de rendre ce lien propre au champ.
- Bulle construite dans `hover-dom.ts` par `createElement` / `textContent`, libellés traduits passés en `hoverLabels` (remplace `defaultLabel`).

**Pourquoi** : on écrit le JSON avec les littéraux, pas avec leur paraphrase ; un seul parcours du schéma garde les trois aides cohérentes.

## D94 — #88 : outillage, ce qui est fait et ce qui est reporté (2026-10-02)

**Question** : quels points d'outillage du BACKLOG traiter maintenant, y compris ceux qui semblaient attendre des outils pas encore prêts (oxfmt 1.0, dependency-cruiser compatible TypeScript 7) ?

**Décision** :
- **oxfmt : adopté en 0.71** (à la demande de l'utilisateur, sans attendre la 1.0). Il remplace Prettier et `prettier-plugin-tailwindcss` (`pnpm format`, `format:check`). `.oxfmtrc.json` vient de `oxfmt --migrate=prettier` : mêmes options, `sortTailwindcss` sur `src/index.css`, et les motifs de `.prettierignore` en `ignorePatterns`. L'écart à la bascule tient en 2 fichiers (une union de types passée à la ligne) ; le tri Tailwind est vérifié identique. Il vérifie 497 fichiers (TS, JSON, CSS, YAML, HTML), les Markdown restent ignorés. Le risque d'une version 0.x est accepté : le format est figé par la version épinglée, et `pnpm format` réécrit tout en cas d'écart.
- **Avertissement `missing-typescript-transpiler` : supprimé.** dependency-cruiser 18.5 n'accepte que `typescript <7`, mais le parseur est déjà swc. L'avertissement venait des options `tsConfig` et `tsPreCompilationDeps`, qui supposent le compilateur. `tsPreCompilationDeps` ne changeait rien avec swc (mêmes 2 117 dépendances). La résolution de l'alias `@/` passe par `webpackConfig: depcruise.resolve.cjs` (seule la section `resolve` est lue, webpack n'est pas installé). Mêmes comptes qu'avant (501 modules, 1 205 imports `@/` résolus), et une violation injectée (`domain` → `features`) est bien signalée.
- **Vitest `pool: 'vmThreads'` : reporté.** Mesuré sur 16 cœurs : 13 à 15 s au lieu de 36 s. Il a fallu des projets séparés (le plugin Vite et les scripts de build en pool par défaut, car les bindings natifs de Rolldown refusent une `RegExp` d'un autre contexte `vm`), et `toEqual` au lieu de `toStrictEqual` sur un objet relu de fake-indexeddb. Malgré cela, un test de `examiner-view.test.tsx` expire une passe sur deux à trois, même à 33 % de workers. Le gain ne vaut pas une suite instable.
- **Vitest `isolate: false` : écarté.** 15 tests cassent : les doublures (`vi.mock`, globals) fuient d'un fichier à l'autre.
- **Garde-fou des doublures d'icônes et de Shiki** : `src/testing/heavy-doubles.test.ts` lit les sources des `.test.tsx`. Un fichier qui rend la config d'exemple (`config.example.json`, `<ConfigEditorPage`) doit déclarer les deux `vi.mock`. C'est une vérification textuelle, sans règle de lint maison.
- **e2e** : fixture de langages unique (la variante « pyhton » est écrite par le test) ; `StatsPage.headcount` par `term` puis `dd` suivant ; `highlightedCode` scopé à la région « Question en cours », désormais aussi posée sur le panneau de question de l'examinateur ; `categoryButton` inchangé (CI stable).
- **Instabilités e2e** : `CreateSessionPage.submit()` attend l'écran examinateur monté. Sans cela, `chooseColorMode` visait le bouton « Mode d'affichage » de l'écran de création ou de l'état de chargement, démonté juste après. Résultat : 1 échec sur 30 avant, 0 sur 100 après. Le test « Prête pour le hors ligne » attend le contrôle du service worker avant d'asserter le message, car le pré-cache dépasse 5 s sous charge. Suite complète rejouée 4 fois : 148 sur 148.

**Pourquoi** : traiter ce qui se fait sans dette, tracer les mesures de ce qui est reporté pour ne pas refaire l'évaluation à l'aveugle.

## D95 — #74 : animation du parcours en tête du README (2026-10-02)

**Question** : comment remplacer `banner.webp` par une animation du parcours (config, étudiants, tirage, note, stats, export) qui s'affiche telle quelle dans le README GitHub ?

**Décision** :

| Sujet | Décision | Raison |
|---|---|---|
| Direction visuelle | Hybride : scène 1 synthwave (soleil rayé, grille en perspective, en géométrie simple), scènes 2-6 en interface épurée aux tokens de l'app *(scènes 2-6 remplacées par la salle d'oral, voir la Révision ci-dessous ; scène 1 inchangée)* | Garde l'identité du banner au moment où l'on présente le nom ; le parcours reste lisible ensuite. Choix de l'utilisateur. |
| Cadrage | Scènes 2-6 dans une fenêtre de navigateur stylisée (barre, trois pastilles, fausse URL) ; vignette « vue projetée » pendant le passage | On voit tout de suite une app web, cohérent avec « tout tourne dans le navigateur ». La vignette évoque la double vue sans charger l'image. Choix de l'utilisateur. *(remplacé par la Révision ci-dessous : salle d'oral + zoom)* |
| Production | SVG écrit à la main, un fichier, une timeline CSS commune (approche A) | Le ticket veut un fichier source unique et modifiable à la main ; un générateur créerait deux sources. SMIL écarté : il faudrait quand même du CSS pour les médias, deux systèmes mêlés. |
| Emplacement | `assets/readme-hero.svg` (nouveau dossier, hors `public/`) | Pas publié avec l'app (ticket). |
| Thème GitHub | Levé en premier par un SVG témoin ; résultat : mode `img`, un seul SVG avec son propre `@media (prefers-color-scheme: dark)`, pas de `<picture>` ni de variante sombre | Vérifié sur ordinateur, sur la page de la branche : le SVG affiché par `<img>` suit le thème réglé dans GitHub, pas celui de l'OS (sondes CLAIR / SOMBRE, les deux croisements). Application GitHub mobile non vérifiée (BACKLOG). |
| Mouvement réduit | Scène 6 (export) figée | Ticket ; image fixe qui résume la fin du parcours. *(remplacé : salle figée au moment de la note)* |
| `banner.webp` | Supprimé | Plus aucun usage hors plans et archives historiques, non réécrits. |

`pnpm check:hero` (`scripts/check-readme-hero.ts`, dans `pnpm check` et en CI) refuse en plus tout `animation-delay` (les captures figées injectent un délai négatif pour arrêter l'animation à un instant donné) et tout `font-size` inférieur à 40 (lisibilité sur mobile, où l'image est réduite). Il contrôle aussi le poids (≤ 100 Ko), l'absence de script et de ressource externe, et le bloc `prefers-reduced-motion`. Il refuse enfin un `--` dans un commentaire : interdit en XML, il casse l'affichage en `<img>` (QUIRKS). La racine porte `width="1200" height="600"`, sans quoi un `<img>` sans taille l'affiche en 300 × 150.

**Pourquoi** : une image unique, légère et autonome, que GitHub affiche sans neutraliser ; les garde-fous automatiques évitent qu'une retouche à la main dégrade le rendu sans que personne ne s'en aperçoive.

**Révision (2026-10-02, spec « Révision 2 — scène de salle »)** : retour de l'utilisateur sur la première version : ni l'oral, ni les deux écrans, ni le principe n'étaient compris. La fenêtre de navigateur cède la place à une salle d'oral vue de côté : un examinateur à son bureau avec son portable, un grand écran projeté, un étudiant debout face à l'écran. Les personnages sont simplifiés mais expressifs (bulle de choix, bulle de réponse orale). Les deux écrans montrent la même question et diffèrent surtout par ce que seul le portable montre (encadré vert de la réponse attendue, boutons de note) et par le score, affiché sur l'écran projeté seul. Puis la vue zoome dans l'écran du portable pour les statistiques et l'export Excel. La boucle passe à 18 s (titre 0-2 s, préparation 2-4 s, passage de A 4-10 s, B et C en accéléré 10-12 s, zoom stats 12-15 s, export 15-18 s, retour au titre 17,7-18 s). Le mouvement réduit fige la salle au moment de la note (question projetée, réponse attendue et note sur le portable, score affiché). Texte alternatif refait pour dire le principe (oral, deux écrans, note), dans `<desc>` et dans le README. Seuls textes visibles : le titre, « +2 », le score et les noms de fichiers « config.json », « etudiants.csv », « .xlsx » (≥ 40 unités). La catégorie Normal prend l'icône Tabler `mountain` et non le `brand-php` de la config d'exemple : l'animation présente l'outil, pas une matière (choix de l'utilisateur).

## D96 — F27 (#71) : site de documentation VitePress (2026-10-02)

**Question** : avec quel outil, où et comment publier une documentation d'usage et de contribution à côté de l'application, sans toucher à son hors ligne ?

**Décision** :

| Sujet | Décision | Raison |
|---|---|---|
| Générateur | **VitePress `2.0.0-alpha.20`**, épinglé en version exacte | VitePress stable (`1.6.4`, août 2025) dépend de Vite 5 (hors support) et de Shiki 2 : il ajouterait un second Vite et un second Shiki à l'arbre. La 2.0 alpha dépend de Vite 8 et Shiki 4, comme l'application (`pnpm why vite` : une seule version, 8.3.0). Risque assumé : l'API peut bouger d'une alpha à l'autre ; chaque montée est manuelle. Starlight écarté : écosystème Astro en plus pour un site squelette. |
| Emplacement | Sources dans `site/`, pas dans `docs/` | `docs/` porte la mémoire projet, que VitePress publierait, et le hook `SessionStart` classe les `docs/*.md` de la racine. |
| URL | `cleanUrls` désactivé (URL en `.html`) ; base `/questionator-z4000-hyperdrive/docs/`, sortie `dist/docs/` | Fonctionne tel quel sur GitHub Pages et en `vite preview` (avec la barre finale), sans réécriture. |
| Hors ligne | La doc n'est **pas** pré-cachée ; le service worker de l'app la laisse passer au réseau | Le pré-cache vise l'app (F17). La doc hors ligne est au BACKLOG. |
| Formatage | oxfmt couvre `site/**/*.{ts,css}` ; les `.md` restent ignorés | `**/*.md` est déjà ignoré dans tout le dépôt (`.oxfmtrc.json`). |
| Accent | Rose du soleil de l'icône : `#c4126e` en clair (5,74:1 sur blanc), `#ff2d95` en sombre (4,96:1 sur `#1b1b1f`) | `#ff2d95` sur blanc tombe à ~3,4:1 ; `#e0197f` aurait donné 4,55 sur blanc mais 3,77 en sombre. Habillage limité au logo et à l'accent. |
| Vue projetée | Pas de lien « Aide » | Elle n'utilise pas `PageShell` et s'adresse à l'étudiant. |
| Denylist du service worker | `navigateFallbackDenylist: [/\/docs(?:[/?]\|$)/]` et `globIgnores: ['docs/**']` | Sans cela, le repli de navigation du SW servirait l'`index.html` de l'app sur `/docs/`. Le motif couvre `…/docs/…`, `…/docs` sans barre finale (`$`) et `…/docs?…`, sans écarter `/docsfoo` (constante testée dans `vite/docs-navigation-denylist.ts`). |
| Garde `check:precache` | Ignore le `dist/docs/` de premier niveau et échoue si une URL du manifeste commence par `docs/` (`findDocsEntries`) | Empêche qu'un changement de config pré-cache la doc sans que la CI le voie. |
| Garde-fous | Lien mort = `docs:build` en échec (vérifié) ; copie du logo verrouillée par `scripts/site-logo.test.ts` ; libellés du thème et 12 clés de recherche locale traduits, contrôlés contre `default-theme.d.ts` / `local-search.d.ts` | Le build échoue plutôt que de publier une doc cassée ; les traductions sont à refaire à chaque montée de VitePress. |
| CI et e2e | Étape « Build de la doc » après « Build », avec contrôle de la base des assets ; le `webServer` de Playwright construit l'app puis la doc ; `e2e/docs.spec.ts` (4 tests, sous contrôle du SW) | La doc est testée telle que déployée. |

**Pourquoi** : une doc publiée avec l'app, sans second Vite, sans effet sur le pré-cache ni sur le hors ligne, et dont les régressions probables (lien mort, SW qui avale `/docs/`) font échouer la CI.

## D97 — F28 (#72) : guide utilisateur, captures et garde-fous (2026-10-02)

**Question** : comment rédiger le guide d'usage de `site/guide/` pour qu'il reste exact quand l'application évolue ?

**Décision** :

| Sujet | Décision | Raison |
|---|---|---|
| Captures | Playwright, config dédiée `playwright.screenshots.config.ts` (qui réutilise `webServer` et `baseURL` exportés par `playwright.config.ts`, lequel ignore `e2e/screenshots/**`), specs dans `e2e/screenshots/`, page objects des e2e réutilisés | Même serveur et mêmes sélecteurs : une capture casse quand l'UI casse, pas silencieusement. |
| Format | PNG, 1280×800, `deviceScaleFactor: 2`, Chromium, locale `fr-FR`, animations désactivées ; 10 images, ~1,9 Mo, dans `site/public/screenshots/`. Mode sombre hors périmètre | Net sur écran HiDPI. Les écrans de session sont sombres parce que la config d'exemple fixe `presentation.defaultColorMode` à sombre : c'est ce que voit l'utilisateur. |
| Déterminisme | `crypto.getRandomValues` remplacé par mulberry32 (graine 72) via `context.addInitScript` (la popup projetée est couverte) ; horloge fixée par `context.clock.setFixedTime('2026-09-15T09:00:00+02:00')` ; `storage.persisted/persist` forcés à vrai ; `serviceWorkers: 'block'` ; `document.fonts.ready` attendu ; données = fichiers d'exemple. Aucun code de l'app ne change | Le tirage et les dates affichées sont les seules sources de variation. `clock.install` aurait figé ou fait dériver les minuteries. Prouvé par deux exécutions sans diff. |
| CI | `docs:screenshots` n'est pas lancé en CI | Coûteux et dépendant du rendu de la machine ; les PNG sont commités. `docs:build` échoue déjà si une image référencée manque. |
| Référence | Rédigée à la main ; `site/guide/reference-config.test.ts` exige que chaque chemin du JSON Schema soit la première cellule d'une ligne de tableau de `reference-config.md` (jetons de thème par leur nom seul) | Une page générée perdrait les exemples et les explications ; retirer un champ fait échouer le test. |
| Dépannage | Une ancre par code d'erreur (config et CSV) dans `depannage.md`, verrouillée par `site/guide/depannage.test.ts` (aucun doublon, tout lien `depannage#id` des pages résolu) | Rend vérifiable le critère « chaque message d'erreur a une entrée ». |
| Voix | Vouvoiement, phrases courtes, libellés exacts de l'interface ; relecture `humanize-fr` de chaque page | Cohérence avec les messages de l'app. |

**Pourquoi** : un guide qui décrit ce que fait le code, avec des captures régénérables à l'identique et des tests qui échouent quand la référence ou le dépannage prennent du retard sur le schéma.
