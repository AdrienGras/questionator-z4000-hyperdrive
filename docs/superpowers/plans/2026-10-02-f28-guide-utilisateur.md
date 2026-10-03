# F28 — Guide utilisateur Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplir les dix pages de `site/guide/` d'un guide complet, illustré de captures Playwright déterministes, avec deux garde-fous Vitest (couverture du schéma, ancres du dépannage).

**Architecture:** Contenu Markdown VitePress dans `site/guide/` ; captures produites par une config Playwright dédiée qui réutilise le serveur et les page objects des e2e ; tests Vitest qui lisent `site/guide/*.md` et les sources de vérité de `src/domain/`.

**Tech Stack:** VitePress 2.0.0-alpha.20, Playwright, Vitest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-02-f28-guide-utilisateur-design.md`

## Global Constraints

- Français, vouvoiement, phrases courtes, vocabulaire de l'interface (libellés exacts des boutons : les lire dans `src/lib/i18n/ui-messages.ts`, dictionnaire `fr`). Chaque page rédigée passe par le skill `humanize-fr` (registre « support pédagogique ») avant commit.
- Le guide décrit **ce que fait le code**. Source produit : `PRODUCT.md` (59 Ko : `grep -n '^##'` puis lecture par plage, jamais en entier). En cas d'écart entre PRODUCT.md et le code, suivre le code et le signaler dans le rapport.
- Slugs, titres `#` et sidebar de `site/.vitepress/config.ts` inchangés.
- Images : `![texte alternatif descriptif](/screenshots/<nom>.png)`, fichiers dans `site/public/screenshots/`.
- Captures : 1280×800, `deviceScaleFactor: 2`, Chromium, `fr-FR`, `Europe/Paris`, `colorScheme: 'light'`, PRNG mulberry32 graine `72` à la place de `crypto.getRandomValues`, horloge figée à `2026-09-15T09:00:00+02:00`, données = `public/students.example.csv` et `public/config.example.json`.
- Ne jamais `Read` un `docs/*.md` racine en entier (`grep -n '^## '` puis plage).
- Commits gitmoji en français, emoji Unicode, terminés par :
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_016cZs3fAZqobifoZLYBXkgD
  ```
- Préfixer les commandes par `rtk`. `pnpm check` et `pnpm docs:build` verts avant chaque commit.

## Review Focus

1. **Exactitude** : un libellé de bouton, un nom de champ ou une valeur par défaut faux dans le guide trompe l'enseignant seul. Chaque tâche de rédaction vérifie ses affirmations contre le code (`ui-messages.ts`, `src/domain/config/schema.ts`, `defaults.ts`) et liste dans son rapport les points vérifiés.
2. **Captures non déterministes** : une date, un identifiant aléatoire, une animation ou un focus clignotant fait varier les PNG ; la Tâche 3 exécute deux fois et exige un `git status` vide.
3. **Images cassées sous la base** : un chemin `/screenshots/…` mal résolu donne une image vide en ligne ; `docs:build` + contrôle d'existence des fichiers référencés (Tâche 4/5).
4. **Ancres dupliquées ou mal formées** dans le dépannage (VitePress génère aussi des ids de titres) : le test de la Tâche 2 vérifie l'unicité des ancres de codes.
5. **Parcours de la prise en main** : chaque étape nomme l'écran et le bouton suivants ; relecture « en suivant la page » en revue finale.

---

### Task 1: Référence de la config et test de couverture du schéma

**Files:**
- Create: `site/guide/reference-config.test.ts`
- Modify: `site/guide/reference-config.md`

**Interfaces:**
- Consumes: `buildConfigJsonSchema(): Record<string, unknown>` (`@/domain/config/json-schema`).
- Produces: la page de référence, avec une section par bloc de premier niveau et un tableau de jetons de thème partagé par `theme.light` et `theme.dark` (cibles de liens pour les Tâches 2, 4 et 5). `listSchemaPaths` reste local au test.

- [ ] **Step 1: Test qui échoue** — `site/guide/reference-config.test.ts` :
  - `listSchemaPaths` locale : parcourt `properties` (chemin `a.b`), `items` (suffixe `[]`), `anyOf`/`oneOf`/`allOf` (même chemin) ; renvoie les chemins triés et uniques. Valeurs attendues partielles : contient `exam.title`, `scoring.rounding.step`, `categories[].questions[].answer`, `theme.light.card-foreground`, et compte ≥ 100 chemins (garde de non-vacuité).
  - `test('chaque champ du schéma est documenté dans la référence')` : lit `site/guide/reference-config.md` ; un chemin `theme.light.<j>` / `theme.dark.<j>` est couvert si `` `<j>` `` est présent ; tout autre chemin si `` `<chemin>` `` est présent ; échoue avec la liste des manquants (`expect(missing).toEqual([])`).
  - Vérifier que Vitest le découvre : `rtk pnpm vitest run site/guide/reference-config.test.ts` → FAIL listant les chemins manquants. Si Vitest ou `tsc` ne couvrent pas `site/guide/*.test.ts` (alias `@/`, tsconfig), régler par configuration minimale et le justifier.
- [ ] **Step 2: Rédiger `reference-config.md`** — sections : structure générale et `$schema` (ligne exacte de l'exemple, aide VSCode : autocomplétion, survol, noms d'icônes) ; puis une section par bloc de premier niveau dans l'ordre du schéma (`schemaVersion`, `locale`, `exam`, `scoring`, `absent`, `skips`, `presentation`, `theme`, `categories`) ; pour chaque champ : chemin en code inline, type, obligatoire, défaut, description, exemple JSON court. Valeurs par défaut et descriptions tirées de `src/domain/config/schema.ts`, `defaults.ts` et des `.describe()` du schéma. Thème : un tableau unique des jetons (nom, rôle) valable pour `theme.light` et `theme.dark`. Section finale « Règles vérifiées à la création » : chaque règle croisée de `src/domain/config/rules.ts` en une phrase, avec un lien vers l'ancre du dépannage correspondante (`./depannage#<code>` ; ces ancres sont créées en Tâche 2 — pour que `docs:build` ne casse pas, mettre ces liens dans la Tâche 2, pas ici).
- [ ] **Step 3:** test → PASS ; supprimer une ligne de champ, test → FAIL nommant ce champ ; restaurer (consigner l'expérience).
- [ ] **Step 4:** `humanize-fr` sur la page ; `rtk pnpm docs:build` ; `rtk pnpm check`.
- [ ] **Step 5: Commit** — `📝 Rédige la référence de la config et verrouille sa couverture du schéma`.

---

### Task 2: Dépannage et test des ancres

**Files:**
- Create: `site/guide/depannage.test.ts`
- Modify: `site/guide/depannage.md`, `site/guide/reference-config.md` (liens des règles vers les ancres)

**Interfaces:**
- Consumes: `CONFIG_ISSUE_MESSAGES` (`@/domain/config/messages`), `CSV_ISSUE_MESSAGES` (`@/domain/students/messages`) — codes = `Object.keys(X.fr)`.

- [ ] **Step 1: Test qui échoue** — `depannage.test.ts` : extrait les ancres de la page (titres `## … {#code}` / `### … {#code}` et `<span id="code"></span>`) ; `test('chaque code d’erreur de création a une entrée')` : codes de config + CSV ⊆ ancres, échec listant les manquants ; `test('aucune ancre de code n’est dupliquée')`. Garde : ≥ 30 codes lus. RUN → FAIL.
- [ ] **Step 2: Rédiger `depannage.md`** — sections : « Erreurs du fichier de configuration » (une entrée par code ou par groupe ; les codes génériques de structure `required`, `invalid_type`, `unknown_key`, `invalid_enum`, `not_integer`, `too_small`, `too_big`, `empty_string`, `invalid_value`, `invalid_css_shape` regroupés en une entrée « Erreur de structure » portant toutes leurs ancres) ; « Erreurs et avertissements de la liste d'étudiants » ; « Autres problèmes » : création impossible (`create_validator_load_error`, `create_write_error` : lire leurs textes dans `ui-messages.ts`), CSV mal reconnu, projection (seconde fenêtre bloquée, double écran), perte de données (stockage local du navigateur, sauvegarde, navigation privée), avertissement « Stockage non garanti ». Chaque entrée : le message tel qu'affiché (texte du dictionnaire `fr`, paramètres en italique), la cause, quoi faire.
- [ ] **Step 3:** ajouter dans `reference-config.md` les liens « Règles vérifiées à la création » → `./depannage#<code>`.
- [ ] **Step 4:** tests → PASS ; `humanize-fr` sur la page ; `rtk pnpm docs:build` (aucun lien mort) ; `rtk pnpm check`.
- [ ] **Step 5: Commit** — `📝 Rédige le dépannage, une entrée par erreur de création de session`.

---

### Task 3: Captures déterministes (`pnpm docs:screenshots`)

**Files:**
- Create: `playwright.screenshots.config.ts`, `e2e/screenshots/determinism.ts`, `e2e/screenshots/guide.spec.ts`, `site/public/screenshots/*.png`
- Modify: `playwright.config.ts` (`testIgnore: ['screenshots/**']` relatif à `testDir`, et export des valeurs partagées), `package.json` (script), `tsconfig.e2e.json` si besoin

**Interfaces:**
- Consumes: page objects `e2e/pages/*.ts` (`HomePage.goto/createSession/openEditor`, `CreateSessionPage.uploadStudents/uploadConfig/fillName/submit`, `ExaminerPage.draw/score/openPanel/openPresentView/projectActiveStudent/confirmAdjustment/openStats`, `StatsPage`, `ConfigEditorPage`), `examplePath` de `e2e/fixtures.ts`.
- Produces: ces fichiers, utilisés par les Tâches 4-5 :
  `accueil.png` (accueil vide), `creation-session.png` (création remplie avec les exemples, aperçu visible), `creation-avertissements.png` (CSV avec avertissement : produire un CSV temporaire avec une ligne en doublon), `passage-question.png` (question tirée, réponse attendue visible), `passage-panneau.png` (panneau latéral ouvert, onglet « Étudiants »), `passage-note-finale.png` (note finale d'un étudiant terminé), `vue-projetee.png` (fenêtre projetée, question affichée), `statistiques.png`, `editeur-config.png` (éditeur avec l'exemple et l'aperçu), `accueil-sessions.png` (accueil avec la session créée).

- [ ] **Step 1: Config** — `playwright.config.ts` exporte `webServer` et `baseURL` (constantes nommées) et ignore `screenshots/**` ; `playwright.screenshots.config.ts` les importe : `testDir: 'e2e/screenshots'`, `workers: 1`, `fullyParallel: false`, `retries: 0`, projet Chromium avec `viewport: { width: 1280, height: 800 }`, `deviceScaleFactor: 2`, `colorScheme: 'light'`, `locale: 'fr-FR'`, `timezoneId: 'Europe/Paris'`. Script `"docs:screenshots": "playwright test -c playwright.screenshots.config.ts"`.
- [ ] **Step 2: `determinism.ts`** — `test` étendu (`base.extend`) : avant chaque test, `context.addInitScript` remplace `crypto.getRandomValues` par un remplissage mulberry32 graine `72` (même contrat : remplit le TypedArray reçu et le renvoie), et `page.clock.install({ time: new Date('2026-09-15T09:00:00+02:00') })` ; s'applique aussi aux pages ouvertes ensuite dans le contexte (vue projetée). Helper `capture(page|locator, nom)` → `screenshot({ path: 'site/public/screenshots/<nom>.png', animations: 'disabled', caret: 'hide' })`.
- [ ] **Step 3: `guide.spec.ts`** — un scénario séquentiel qui produit les dix captures dans l'ordre du parcours (créer la session « Oral de démonstration » avec les exemples, passer un étudiant complet, ouvrir la vue projetée, les statistiques, revenir à l'accueil, l'éditeur ; scénario séparé pour `creation-avertissements.png`). Attendre des états visibles (assertions web-first) avant chaque capture ; pas de `waitForTimeout`.
- [ ] **Step 4: Déterminisme** — `rtk pnpm docs:screenshots` deux fois ; après la 2ᵉ, `git status --porcelain site/public/screenshots` vide. Si une capture varie, trouver la source (date, focus, animation CSS non couverte, police) et la neutraliser dans la fixture, pas dans l'app ; consigner la cause (QUIRKS).
- [ ] **Step 5:** `rtk pnpm e2e` toujours vert et ne produit aucune capture ; `rtk pnpm check` ; taille totale `du -sh site/public/screenshots` notée dans le rapport.
- [ ] **Step 6: Commit** — `📸 Génère les captures du guide de façon déterministe`.

---

### Task 4: Pages de préparation (prise en main, fichiers, éditeur, sessions)

**Files:**
- Modify: `site/guide/prise-en-main.md`, `site/guide/preparer-les-fichiers.md`, `site/guide/editeur-config.md`, `site/guide/sessions.md`

**Interfaces:**
- Consumes: captures de la Tâche 3 (noms ci-dessus) ; ancres du dépannage (Tâche 2) ; sections de `reference-config.md` (Tâche 1) pour les liens.

- [ ] **Step 1: `prise-en-main.md`** — ce que fait l'app ; données locales (rien ne quitte le navigateur, stockage du navigateur) ; parcours numéroté de bout en bout avec les fichiers d'exemple (liens absolus vers `https://adriengras.github.io/questionator-z4000-hyperdrive/students.example.csv` et `…/config.example.json`) : accueil → « Nouvelle session » → dépôt des deux fichiers → nom → création → tirage d'une question → note → étudiant suivant → statistiques → export Excel. Chaque étape nomme le bouton exact. Captures : `accueil`, `creation-session`, `passage-question`, `statistiques`. Liens vers les pages détaillées.
- [ ] **Step 2: `preparer-les-fichiers.md`** — CSV (règles réelles de `src/domain/students/parse-csv.ts`, `header.ts`, `decode.ts` : colonnes, en-tête, séparateurs acceptés, encodage, doublons, préambule ignoré) ; capture `creation-avertissements` ; config par l'exemple (extraits de `config.example.json`) : catégories, questions, barèmes, couleurs, icônes Tabler, blocs de code (langages Shiki), images ; liens vers la référence et le dépannage.
- [ ] **Step 3: `editeur-config.md`** — ouverture depuis l'accueil, autocomplétion (Ctrl+Espace), survol, liste des erreurs et navigation, aperçu, téléchargement, « créer une session » depuis l'éditeur (libellés exacts). Capture `editeur-config`.
- [ ] **Step 4: `sessions.md`** — créer, reprendre depuis l'accueil, sauvegarde (export / import), supprimer ; ce qui est conservé où. Capture `accueil-sessions`.
- [ ] **Step 5:** `humanize-fr` sur les quatre pages ; `rtk pnpm docs:build` ; vérifier que chaque `/screenshots/<nom>.png` référencé existe dans `site/public/screenshots/` ; `rtk pnpm check`.
- [ ] **Step 6: Commit** — `📝 Rédige la prise en main et les pages de préparation du guide`.

---

### Task 5: Pages de l'oral (faire passer, projeter, stats et export, hors ligne)

**Files:**
- Modify: `site/guide/faire-passer.md`, `site/guide/projeter.md`, `site/guide/stats-export.md`, `site/guide/hors-ligne.md`

**Interfaces:**
- Consumes: captures `passage-question`, `passage-panneau`, `passage-note-finale`, `vue-projetee`, `statistiques` ; ancres du dépannage.

- [ ] **Step 1: `faire-passer.md`** — choix de l'étudiant, tirage par catégorie, ce que voit l'examinateur (réponse attendue), notation au barème, score cumulé, skip (motifs, texte libre), absent, commentaire, ajustement et note finale (arrondi), étudiant suivant, panneau latéral (onglets). Captures `passage-question`, `passage-panneau`, `passage-note-finale`.
- [ ] **Step 2: `projeter.md`** — ouvrir la vue projetée, la placer sur le second écran, ce qui est projeté et quand (attente, question, score selon `presentation.*`), aperçu de projection, mode présentateur ; ce que l'étudiant ne voit jamais. Capture `vue-projetee`.
- [ ] **Step 3: `stats-export.md`** — statistiques (contenu réel de l'écran) ; export Excel : feuilles et colonnes réelles (`src/domain/export/*-sheet.ts`), traitement des absents (`absent.export`). Capture `statistiques`.
- [ ] **Step 4: `hors-ligne.md`** — installation (Chrome, Edge), hors ligne après un premier chargement, « Recharger » à chaque version (jamais appliquée d'office), images distantes, la doc n'est pas disponible hors ligne.
- [ ] **Step 5:** `humanize-fr` sur les quatre pages ; `rtk pnpm docs:build` ; images référencées existantes ; `grep -rl 'Cette page décrira' site/guide` vide ; `rtk pnpm check`.
- [ ] **Step 6: Commit** — `📝 Rédige les pages de l'oral du guide`.

---

### Task 6: README et mémoire projet

**Files:**
- Modify: `README.md`, `docs/DECISIONS.md`, `docs/ENVIRONMENT.md`, `docs/QUIRKS.md`, `docs/BACKLOG.md`, `docs/INDEX.md`, `docs/HANDOFF.md`

- [ ] **Step 1: README** — section « Écrire une config » réduite à : une phrase, la ligne `$schema`, le lien vers `https://adriengras.github.io/questionator-z4000-hyperdrive/docs/guide/reference-config.html`, le lien vers le fichier d'exemple.
- [ ] **Step 2: DECISIONS** — D97 (tableau de décisions de la spec), même format que D96.
- [ ] **Step 3: ENVIRONMENT** — `pnpm docs:screenshots` (construit app + doc via le `webServer`, écrit `site/public/screenshots/`, non lancé en CI).
- [ ] **Step 4: QUIRKS** — pièges des rapports des Tâches 1-5.
- [ ] **Step 5: BACKLOG** — captures en mode sombre, traduction anglaise du guide (si absents de la section « Documentation »).
- [ ] **Step 6: INDEX** — ligne F28 (spec, plan) ; ligne `docs:screenshots` dans la table des commandes.
- [ ] **Step 7: HANDOFF** — corriger l'entrée #71 (« Trucs en suspens » : PR #122 mergée, #71 fermé) ; nouvelle entrée F28 en tête, quatre marqueurs en gras.
- [ ] **Step 8: Commit** — `📝 Documente F28 dans le README et la mémoire projet`.
