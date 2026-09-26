# Handoff — état courant du projet

Notes informelles à destination de la prochaine session (humaine ou Claude). Format
libre, **antéchronologique** : l'entrée la plus récente en haut.

**À mettre à jour à la fin d'une session significative.** Pas besoin de noter chaque
petit truc — l'idée est de se resituer en 30 secondes en début de session.

Chaque entrée est un titre `## AAAA-MM-JJ — Titre court de la session`, suivi de
quatre marqueurs en **gras**, chacun en tête de paragraphe, dans cet ordre :
`**Dernière chose faite**`, `**Trucs en suspens**`, `**Prochaine chose à creuser**`,
`**Notes pour future Claude**`.

**Ces quatre marqueurs sont obligatoires, exactement sous cette forme — jamais en
sous-titres `###`, jamais en prose libre sans eux.** Le hook `SessionStart` extrait
le digest de resituation injecté à chaque démarrage de session en cherchant CES
marqueurs précis dans la dernière entrée. Une entrée qui ne les porte pas dégrade
silencieusement la resituation vers un extrait brut des 2000 premiers caractères du
corps, sans distinction entre ce qui est fait, en suspens, ou à creuser.

---

## 2026-09-26 — F08 implémenté : rendu markdown

**Dernière chose faite** : F08 (#8) implémenté sur `feat/f08-markdown` en subagent-driven development. Spec et D62 d'abord (composant seul, sans branchement dans un écran ; rangement D59), puis un plan en 3 tâches, une revue par tâche, une revue finale et une vague de correction.
- `src/lib/markdown/highlighter.ts` : `resolveLanguage` (6 langages + alias), `createHighlightLoader(loadCore, languages)` (cache par fermeture, nouvel essai après échec, comme `createIconLoader`), tokens réduits à `offset`/`content`/`style` ; Shiki uniquement par `import()`, moteur JavaScript, pas de WASM.
- `src/components/markdown/code-block.tsx` : texte brut, puis tokens en `<span>` React (pas de `dangerouslySetInnerHTML`). Double thème par `--shiki-light`/`--shiki-dark` et les règles `.shiki` / `.dark .shiki` de `index.css`, hors `@layer`.
- `src/components/markdown/markdown.tsx` : `<Markdown source ui size>`, react-markdown + remark-gfm, sans `rehype-raw`. Liens externes en nouvel onglet, ancres `#…` dans la page. Libellés des notes GFM traduits (`markdown_footnotes`, `markdown_footnote_back`).
- `@tailwindcss/typography` : `.prose` branché sur les tokens shadcn, sans `prose-invert` (QUIRKS).

La revue finale n'a trouvé que 4 mineurs. Les ancres en nouvel onglet et les libellés anglais des notes ont été corrigés ; le fond des blocs et la taille de projection sont au BACKLOG ; la spec a été alignée sur l'API livrée. La revue a aussi monté `<Markdown>` temporairement dans la route de session et construit : Shiki forme ses chunks (noyau 94 kB, moteur 58 kB, php 146 kB…), le chunk d'entrée n'y fait pas référence, aucun `.wasm`, aucun avertissement.

`pnpm check` est vert (534 tests) et `pnpm build` ne donne aucun avertissement.

**Trucs en suspens** : PR #37 mergée, #8 fermé, SonarQube : gate OK, 0 issue, 0 hotspot. F18 (#36, coloration de tous les langages Shiki, D63) est spécifiée (`docs/superpowers/specs/2026-09-26-f18-langages-design.md`), pas implémentée. Aucun écran ne monte encore `<Markdown>` : pas de vérification visuelle possible avant F09. Toujours non vérifié depuis F04 : la survie des données à un vrai redémarrage du navigateur.

**Prochaine chose à creuser** : F09 (écran de passage), qui remplace le corps de `ExaminerView` et monte `<Markdown source={question.prompt} ui={ui} />` ; y trancher le fond des blocs `.shiki` en clair (BACKLOG § « Rendu markdown »).

**Notes pour future Claude** : `rootStyle` de Shiki est une chaîne, pas un objet. Avec pnpm, importer `shiki/langs/*.mjs` et `shiki/themes/*.mjs`, jamais `@shikijs/*` (QUIRKS). Charger `php` enregistre aussi html, css, javascript, sql, json et xml. Les tests qui montent un bloc `php` réel chargent Shiki en arrière-plan : attendre `data-highlighted="true"` avec `waitFor` pour garder une sortie propre. `<Markdown>` exige `ui` (convention « Composant d'écran traduit »).

## 2026-09-25 — F07 implémenté : thème et langue

**Dernière chose faite** : F07 (#7) implémenté sur `feat/f07-theme` en subagent-driven development. D'abord la spec, avec D60 (F07 avant F09 : écrans de session provisoires et apparence par portées), puis un plan en 6 tâches, une revue finale et une vague de correction.
- `AppearanceProvider` (`src/app/`), seul à écrire sur `<html>` : classe `.dark` et tokens via `setProperty`. Les portées sont déclarées par `useAppearanceScope` et `<SessionAppearance>`. Une portée garde sa place dans la pile même si elle est re-mémoïsée (`register` + `update` par `useId`).
- Mode clair, sombre ou système, mémorisé par session et par vue (`questionator:color-mode:<id>:<examiner|present>`), avec une clé globale pour l'accueil et la création. La bascule `ColorModeToggle` est présente partout, et `color-scheme` suit `.dark`.
- `LocaleProvider` : le propriétaire le plus externe est le seul à écrire `lang`, les providers imbriqués se déclarent auprès de lui. `useUi()` lit ce contexte.
- `CategoryIcon` : chunk Tabler unique chargé à la demande (`icons-*`, 2 370 kB, 441 kB gzip), avec un nouvel essai après un échec.
- Écrans provisoires : `#/session/$sessionId` (en-tête, catégories, bouton principal désactivé) et `#/present/$sessionId` (écran d'attente, reçoit la config seule).

Défauts rattrapés pendant l'exécution :
- ordre des effets entre `LocaleProvider` imbriqués ;
- un test de nouvel essai qui ne prouvait rien (`vi.resetModules`) ;
- **fuite des 2,8 Mo d'icônes dans le bundle de l'accueil**, corrigée par un import profond (QUIRKS) ;
- portée re-mémoïsée qui passait en fin de pile.

`pnpm check` est vert (493 tests) et `pnpm build` ne donne aucun avertissement. Vérifié à la main dans Chromium sur `vite preview` avec la config d'exemple en `locale: 'en'` :
- vue examinateur : sombre par défaut, `lang="en"`, 32 tokens, bouton principal à la couleur `primary`, 4 icônes ;
- vue projetée : passée en clair dans un second onglet, fermée puis rouverte, elle reste claire, et seule la clé `:present` a été écrite ;
- accueil : aucun token, pas de `.dark`, et aucun chunk `icons-*` chargé à froid.

**Trucs en suspens** : PR #34 mergée (`35c5bcf`), #7 fermé. CI verte et SonarQube : gate OK, 0 issue, 0 hotspot, après D61 (dictionnaire exclu de la détection de duplication) et la fusion de deux tests identiques. Les mineurs reportés sont dans BACKLOG § « Thème et langue ». Toujours non vérifié depuis F04 : la survie des données à un vrai redémarrage du navigateur.

**Prochaine chose à creuser** : F09 (écran de passage), qui remplace le corps de `ExaminerView` dans `src/features/session/`, ou F08 (rendu markdown).

**Notes pour future Claude** :
- Sous `SessionAppearance`, `useUi()` s'appelle dans l'enfant, sinon `config.locale` est ignoré (CONVENTIONS § « Vue de session thémée »).
- Ne touche jamais `document.documentElement` depuis un écran : déclare une portée. React exécute les effets de l'enfant avant ceux du parent.
- Après chaque build qui touche aux icônes, vérifie `for f in dist/assets/*.js; do grep -l "from\"./icons-" $f; done` : la sortie doit être vide.
- Le script `task-brief` du skill SDD cherche des titres « Task N ». Le plan F07 utilise « Tâche N », donc les briefs ont été extraits avec un awk adapté.

## 2026-09-25 — Arborescence de src/ réorganisée (#31)

**Dernière chose faite** : #31 traité sur `refactor/31-arborescence`, PR #32. Recherche des standards (Bulletproof React, FSD, TanStack Router, shadcn) et état des lieux, puis arbitrage avec l'utilisateur (D59) :
- `lib/` pour la technique, `domain/` pour le métier sans React, `features/<x>/` pour les écrans, plus `app/` et `testing/`.
- Tout en kebab-case, aucun barrel.
- dependency-cruiser ajouté à l'outillage.

La migration a été scriptée : 120 `git mv`, imports réécrits vers `@/`, imports de barrel éclatés symbole par symbole. Viennent ensuite `pnpm deps` (10 règles, chacune testée avec un fichier fautif) et deux règles oxlint (kebab-case, `../` interdit). La documentation suit : CONVENTIONS § « Arborescence et imports », D59, 4 QUIRKS, `CLAUDE.md`. `pnpm check` est vert (427 tests, identique à `main`), le build ne produit aucun avertissement, les chunks sont équivalents et le JSON Schema est identique octet pour octet. CI verte, Sonar : gate OK, 0 issue, 0 hotspot.

**Trucs en suspens** : PR #32 mergée (`2eda85a`), #31 fermé. Pas de vérification manuelle dans le navigateur : il n'y a aucun changement de comportement et les tests d'écran couvrent les routes. Toujours non vérifié depuis F04 : la survie des données à un vrai redémarrage du navigateur.

**Prochaine chose à creuser** : F07 (thème et langue, provider dans `src/app/`) ou F09 (écran de passage, `src/features/session/`, route mince + `getRouteApi`).

**Notes pour future Claude** : avant de créer un fichier, lire CONVENTIONS § « Arborescence et imports » (lignes 14 à 54). Si `pnpm deps` casse, déplace le fichier au lieu d'assouplir la règle ; une exception s'écrit dans la règle avec sa raison. Si `pnpm deps` annonce « 0 modules », le parseur swc n'a pas tourné (QUIRKS). Un `vi.mock` vise le fichier qui déclare le symbole. Le ticket #31 a été créé à la main puis ajouté au projet n°3 : pour les prochains, utiliser `.claude/scripts/gh-ticket.sh`.

## 2026-09-25 — F06 implémenté : création de session

**Dernière chose faite** : F06 (#6) livré, PR #29 mergée. Implémenté sur `feat/f06-creation` en subagent-driven
development : spec + D54–D57, plan en 5 tâches.
- Deux corrections en revue de tâche : la détection du séparateur CSV (le comptage brut de
  `;`/`,` se trompait sur une ligne de titre ou une colonne d'adresse ; score par parse
  PapaParse désormais) et les accents des noms de tests.
- Revue finale « with fixes » : un CSV Excel FR en Windows-1252 était lu corrompu sans aucun
  message. Il est désormais décodé en UTF-8 strict avec repli Windows-1252 et avertissement
  (D58). S'y ajoute une garde de dépôt sur toute la page.
- Livré : `src/students/` (lecture et décodage du CSV), `src/sessions/build-session.ts`,
  `src/create/` (page, hook, zones de dépôt, aperçus), `DbStatusBanner` partagé, CSV
  d'exemple publié et lié depuis l'accueil et le README.

`pnpm check` vert (427 tests), `pnpm build` sans avertissement : chunk `/new` 34 kB, validateur
197 kB sans composants Tabler. Vérifié à la main dans Chromium sur `vite preview` : CSV
Windows-1252, CSV avec préambule, ligne incomplète, doublon et colonnes en trop, config
invalide (3 erreurs avec chemins, bouton bloqué, nom conservé), création jusqu'à la page de
session, carte visible sur l'accueil.

**Trucs en suspens** : PR #29 mergée (`4e388e3`, CI verte ; SonarQube : gate OK, 0 issue,
0 hotspot, après renommage d'un setter pour S6754). Pendant la tâche 2, un
glisser-déposer involontaire (bureau à distance RustDesk) a déplacé `src/i18n` vers
`src/lib/i18n` ; restauré et nettoyé, sans trace dans l'historique. Toujours non vérifié
depuis F04 : survie des données à un vrai redémarrage du navigateur.

**Prochaine chose à creuser** : F07 (thème et langue de la session) ou F09 (écran de passage,
qui remplira `/session/$sessionId`, aujourd'hui page provisoire après la création).

**Notes pour future Claude** : ne jamais compter sur `delimitersToGuess` ni sur `file.text()`
pour un CSV (QUIRKS). Le hook de création suit la convention « Fichier déposé et lu »
(séquence par emplacement, refs lues après `await`). `back_home` (« Retour à l'accueil »)
remplace le « ← Accueil » de la spec. Idées reportées : BACKLOG « Création de session ».

## 2026-09-25 — F05 implémenté : accueil et backup

**Dernière chose faite** : F05 (#5) livré, PR #27 mergée. Implémenté sur `feat/f05-accueil` en subagent-driven
development : spec + D48–D52, plan en 6 tâches, toutes approuvées en revue de tâche sans
boucle de correction. En cours de route, le validateur est passé en chargement à la demande
(chunk de l'accueil 515 → 316 kB). La revue finale a rendu « with fixes » : trois alertes
SonarQube anticipées (props `Readonly`, `useState` à moitié déstructuré, regex ancrée en fin)
et quatre mineurs, tous corrigés et revalidés. Livré :
- `src/domain/schema.ts` (`SessionSchema`) ;
- `src/backup/` (enveloppe, `parseBackup` en 5 étapes avec règles croisées, config renormalisée) ;
- `src/i18n/` (langue du navigateur, dictionnaire d'interface, `useUi`) ;
- `src/home/` (cartes, dialogues, import par fichier ou glisser-déposer) ;
- routes provisoires `/new` et `/session/$sessionId`.

`pnpm check` vert (332 tests), `pnpm build` sans avertissement. Vérifié à la main dans
Chromium sur le build de prod (`vite preview`) : refus d'un fichier qui n'est pas un backup
(une seule issue) et d'un backup incohérent (3 règles croisées avec chemins), import
strictement identique en base, export identique, renommage, suppression avec « exporter
d'abord », conflit d'`id` avec Remplacer.

**Trucs en suspens** : PR #27 mergée (`a10625a`, CI verte, SonarQube : gate OK, 0 issue,
0 hotspot, après exclusion de `src/components/ui/` de l'analyse, D53). Toujours non vérifié depuis F04 : la
survie des données à un vrai redémarrage du navigateur. Le serveur `pnpm dev` qui tournait
sur 5173 avant la session est cassé (504 « Outdated Optimize Dep ») par ma tentative de
second démarrage ; il suffit de le relancer (QUIRKS).

**Prochaine chose à creuser** : F06 (création de session). Elle remplit la route provisoire
`/new` et réutilise `useUi`, le « Dialogue de saisie » et le chargement du validateur à la
demande (CONVENTIONS) ; elle appelle `createSession` et `requestPersistentStorage`.

**Notes pour future Claude** : `makeStudent` dérive `questionId` de l'index (`a-1`, `a-2`…)
alors que la config minimale n'a que `a-1`. Une session de fixture à plusieurs attempts
échoue donc aux règles croisées : `richSession()` (`src/test/backup-fixtures.ts`) utilise
une config à 3 questions. `asyncUtilTimeout` vaut 5 s dans `src/test/setup.ts`, parce que
le chargement à la demande des routes dépasse 1 s quand la suite tourne en parallèle.
Idées reportées : BACKLOG « Accueil et backup ».

## 2026-09-25 — F04 implémenté : persistance

**Dernière chose faite** : F04 (#4) livré, PR #25 mergée (`7f61e5b`, CI et Sonar verts dès la
première analyse). Implémenté en subagent-driven development sur `feat/f04-persistence` : spec + D45–D47, plan en 4 tâches, une seule correction en revue de tâche
(`useSession` renvoyait brièvement la session de l'ancien `id`), revue finale « with fixes »
puis une vague de 6 corrections (état `unavailable`, exposition dev réellement chargée, import
nommé de `Dexie`, `index.ts` sans le singleton, séquence des relectures de persistance).
`src/db/` : Dexie 4, un document par session, `updateSession` transactionnel (seule voie
d'écriture), hooks `useSessions`/`useSession`/`useDbStatus`, états `open`/`outdated`/
`unavailable`, `requestPersistentStorage`/`usePersistenceStatus`. Réactivité entre fenêtres
vérifiée dans Chromium (fenêtre ouverte par `window.open` : l'écriture de l'autre apparaît
sans rechargement) : F14 n'a pas besoin de BroadcastChannel. `pnpm check` vert (238 tests).
Mémoire à jour (INDEX, QUIRKS ×4, BACKLOG, CONVENTIONS « Mutation de session »).

**Trucs en suspens** : cette PR de clôture (docs) à merger. Non vérifié : survie à un vrai
redémarrage du navigateur (seule une fermeture de page a été testée) — à contrôler à la main
à la première occasion (`pnpm dev`, écrire via `__questionatorDb`, quitter le navigateur).

**Prochaine chose à creuser** : F05 (accueil, backup/import : premier consommateur de
`useSessions`, `putSession`, `useDbStatus`, `usePersistenceStatus`) ou F06 (création de
session : `createSession`, `requestPersistentStorage`, `validateConfig`).

**Notes pour future Claude** : écrire uniquement via `updateSession` (CONVENTIONS « Mutation de
session ») ; `@/db` n'exporte pas le singleton. Tout hook `useLiveQuery` paramétré doit masquer
le résultat d'anciens paramètres (QUIRKS). Afficher un message si `useDbStatus()` vaut
`'outdated'` ou `'unavailable'`. Tests de `src/db/` : `import 'fake-indexeddb/auto'` en tête,
`createDb(nomUnique)` pour le cycle de vie.

## 2026-09-25 — F03 implémenté : moteur de notation

**Dernière chose faite** : F03 (#3) livré, PR #23 mergée (`364e451`). Implémenté en
subagent-driven development sur `feat/f03-scoring` : spec + D42–D44, plan en 7 tâches, chaque tâche revue sans tour de correction,
revue finale de branche (« with fixes ») puis une vague de 4 corrections (`-0`, accents des
tests, exhaustivité `never`, `.vitest/` ignoré). `src/scoring/` : millièmes entiers
(`Milli`), fraction exacte, arrondi entier au pas (vérifié contre un oracle BigInt),
`computeScores` (null tant que non terminé), `studentStatus`, `exportedFinal`,
`isValidAdjustment`, `formatScore` ; types `Session`/`Student`/`Attempt` dans
`src/domain/types.ts`. F02 réutilise `milli.ts` et rejette toute valeur de notation au-delà
de 10 000 (`scoring_value_too_large`, D44). `pnpm check` vert (205 tests). Mémoire à jour
(INDEX, QUIRKS ×3, BACKLOG, CONVENTIONS, PRODUCT §5/§6.2).

**Trucs en suspens** : cette PR de clôture (docs) à merger. SonarQube avait relevé 1 bug
(S7727, `map(fonction)` dans la fixture d'étudiant), corrigé avant la revue. Les pieds de
commit des tâches créditent le modèle réel de chaque sous-agent (Haiku 4.5, Sonnet 5), pas
Opus (laissé tel quel, historique mergé). Toujours ouvert : quality gate Sonar
obligatoire sur `main` ?

**Prochaine chose à creuser** : F04 (persistance Dexie des types de `src/domain/`, un document
par session, D22) ou F06 (création de session, premier consommateur de `validateConfig`).

**Notes pour future Claude** : aucune arithmétique de note hors `src/scoring/` : passer par
`computeScores` puis `formatScore` (`raw` pour la brute, `final` pour convertie, finale et
ajustement) — voir CONVENTIONS « Calcul de note ». `toMilli` lève hors des entiers sûrs,
`roundToMilli` (règles F02) jamais. Tests ciblés : `./node_modules/.bin/vitest run <fichier>`,
pas `pnpm vitest` (hook RTK, voir QUIRKS). Reporté en BACKLOG : affichage d'un `finalScale`
à plus de décimales que le pas, validation des données persistées.

## 2026-09-25 — F02 implémenté : schéma de config et validation

**Dernière chose faite** : F02 (#2) livré, PR #21 mergée (`7f5a3ce`) ; Pages sert
`config.schema.json` et `config.example.json` (200, `application/json`). Implémenté en
subagent-driven development sur
`feat/f02-config` : spec + D38–D41, plan en 7 tâches, chaque tâche revue (3 tours de
correction au total), revue finale de branche puis une vague de 8 corrections (dont la
localisation des erreurs JSON sous Chrome via `jsonc-parser`). `validateConfig` renvoie des
issues typées sans texte, messages fr/en, config normalisée ; JSON Schema et exemple
publiés par `vite/config-schema-plugin.ts`. `pnpm check` (104 tests) et `pnpm build` verts,
sans avertissement. Mémoire à jour (INDEX, QUIRKS ×8, BACKLOG, CONVENTIONS, ENVIRONMENT, D40).

**Trucs en suspens** : cette PR de clôture (docs) à merger. SonarQube avait relevé 3 issues
sur la PR (regex complexes ou à backtracking dans `derive-title.ts`, tests à paramétrer),
corrigées avant la revue. Question toujours ouverte : rendre le quality gate Sonar
obligatoire dans la protection de `main` ?

**Prochaine chose à creuser** : F03 (moteur de notation) ou F06 (création de session, premier
consommateur de `validateConfig` : `cssSupports` = `CSS.supports`, chargement paresseux du
validateur, affichage des issues via `formatConfigIssue` + `formatPath`).

**Notes pour future Claude** : dans `src/config/`, imports relatifs uniquement (runnerImport
sans alias). Ajouter un code d'issue = `ConfigIssueParams` + fr/en + contrôle + test
(CONVENTIONS). Tout nouveau `z.int()` va aussi dans `INTEGER_FIELDS`. Les valeurs CSS de la
config ne passent que par `style.setProperty` (F07). oxlint type-aware est strict sur les
`as` et les `expect` conditionnels : voir QUIRKS. Registre SDD du plan dans
`.superpowers/sdd/2026-09-24-f02-config/` (ignoré par git, supprimé à la fin).

## 2026-09-24 — F01 livré : socle, CI, Pages

**Dernière chose faite** : F01 (#1) implémenté en subagent-driven development (5 tâches du
plan + migration shadcn v4 / Tabler demandée en cours de route), revue finale de branche,
PR #18 mergée. App vide en ligne sur https://adriengras.github.io/questionator-z4000-hyperdrive/
(404 par hash vérifiée en navigateur). `main` protégée (job `check` requis). Alertes
SonarQube Cloud corrigées (actions épinglées par SHA, `String.raw`, `routeTree.gen.ts`
exclu) et étape Sonar ajoutée avant toute PR. D37 : shadcn v4 base-ui + Tabler partout,
chunk d'icônes complet (~489 Kio gz) accepté ; tickets #2, #7, #17 mis à jour.

**Trucs en suspens** : favicon manquant (404 console) → F17. Question ouverte à l'utilisateur :
rendre aussi le quality gate SonarQube Cloud obligatoire dans la protection de `main` ?
Cette PR de clôture (docs) à merger.

**Prochaine chose à creuser** : ticket #2 (F02 — schéma de config et validation) : branche,
figer la spec de l'issue dans `docs/superpowers/specs/`, plan, subagent-driven development.
Attention : noms d'icônes Tabler (`iconsList`), liste blanche des tokens alignée sur
`src/index.css` (shadcn v4 Nova).

**Notes pour future Claude** : cycle d'une PR = branche → PR **brouillon** → `gh pr checks`
→ `.claude/scripts/sonar-check.sh --pr <n> --wait` → `gh pr ready` (SonarQube Cloud n'analyse
que `main` et les PR). pnpm via `corepack pnpm` (pnpm global 9.x). Après ajout d'une route :
`pnpm test` ou `pnpm dev` pour régénérer `routeTree.gen.ts`, puis commit (voir QUIRKS). Le CLI
shadcn v4 doit recevoir toutes ses options, stdin fermé (voir QUIRKS). Sous-agents : leur
passer brief + contraintes globales en fichiers, jamais d'outil interactif.

## 2026-09-24 — Spec V1 arbitrée et 17 tickets rédigés

**Dernière chose faite** : les 12 points ouverts de `PRODUCT.md` tranchés, puis chaque
feature F01–F17 creusée (brainstorming superpowers) et rédigée en issue GitHub #1 à #17,
rangées dans le projet n°3 en **Ready**, avec Priority, Size et relations « blocked by ».
36 décisions tracées dans `docs/DECISIONS.md` (D01–D36) et reportées dans `PRODUCT.md`.
Toolset challengé : TS 7, oxlint type-aware, Prettier, pnpm, Node 24 via nvm (D13) ;
ExcelJS remplacé par write-excel-file (D35) ; Playwright adopté (D33). Conventions :
commits gitmoji, une branche + PR par ticket. Tout est commité et poussé sur `main`
(pas encore de code applicatif).

**Trucs en suspens** : rien sur la spec. `rtk trust` à lancer par l'utilisateur pour
les filtres RTK du projet (modèle vide, sans effet). Protection de `main` à activer à la
fin de F01 (critère du ticket #1).

**Prochaine chose à creuser** : prendre le ticket #1 (F01 — socle) : créer la branche
`feat/f01-socle`, figer la spec de l'issue dans
`docs/superpowers/specs/AAAA-MM-JJ-f01-socle-design.md`, puis writing-plans et le cycle
habituel. Ordre des dépendances : #1 → #2 → #3 → #4 → (#5, #6) → #7, #8 → #9 → #10, #11 →
#12 → #13 → #14, #15 → #16 → #17.

**Notes pour future Claude** : `PRODUCT.md` (~40 Ko) est la source de vérité produit ;
le lire par sections (`grep -n '^##'`). Le corps de chaque issue est la spec détaillée
de sa feature (`gh issue view <n> -R AdrienGras/questionator-z4000-hyperdrive`).
`docs/DECISIONS.md` garde le pourquoi (`## Dnn — Sujet (date)`), à compléter à chaque
arbitrage. Créer un ticket : `.claude/scripts/gh-ticket.sh` (voir `INDEX.md`). TS 7 :
pas de `baseUrl`, rien qui dépende de l'API JS de TypeScript (typescript-eslint,
ts-morph). `gh` a le scope `project`. Interface et docs en français.

## 2026-09-24 — Bootstrap de la mémoire projet et arbitrage de PRODUCT.md

**Dernière chose faite** : mise en place du système de mémoire projet via
`/init-memory`. Revue de `PRODUCT.md` : 12 incohérences / points ouverts tranchés un par
un avec l'utilisateur, reportés dans `PRODUCT.md` et tracés dans `docs/DECISIONS.md`
(D01 à D12). Le §11 de `PRODUCT.md` est vide. Hook RTK ajouté dans
`~/.claude/settings.json` (backup `settings.json.bak-rtk`). Aucun commit.

**Trucs en suspens** : rien sur la spec. Dépôt sans commit (`PRODUCT.md`, `banner.webp`,
`CLAUDE.md`, `.claude/`, `.rtk/`, `docs/` non suivis).

**Prochaine chose à creuser** : étape 2 du process convenu — pour chaque feature F01 à
F17, creuser si besoin (brainstorming superpowers) et créer une issue GitHub dans le
dépôt, rattachée au projet https://github.com/users/AdrienGras/projects/3 (vrais issues,
pas des drafts ; titre `Fxx — Nom` ; corps = spec, critères d'acceptation, `Dépend de
#x` ; labels `feature` / `spike`). Profondeur pressentie : peu à creuser F01, F04, F08,
F17 ; à creuser F02, F03, F09, F14, F15, F16 ; le reste entre les deux. Ensuite, par
ticket : figer la spec dans `docs/superpowers/`, plan d'implémentation, cycle habituel.

**Notes pour future Claude** : `PRODUCT.md` (~33 Ko) est la source de vérité produit ;
le lire par sections (`grep -n '^##'`). `docs/DECISIONS.md` garde le pourquoi de chaque
arbitrage (format `## Dnn — Sujet (date)`), à compléter à chaque nouvel arbitrage.
`banner.webp` sert de base au thème « Synthwave » de la config d'exemple (F02). `gh` est
authentifié avec le scope `project`. Interface et docs en français.
