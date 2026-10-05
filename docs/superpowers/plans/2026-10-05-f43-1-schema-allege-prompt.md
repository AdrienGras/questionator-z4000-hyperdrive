# F43.1 — Schéma allégé et prompt de génération — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publier `config.schema.lite.json` et une fonction pure qui produit, en fr et en en, le prompt de génération d'une config d'entraînement, avec une config d'exemple qui respecte ce prompt.

**Architecture:** `buildConfigJsonSchema` prend une option `lite` qui remplace l'`anyOf` d'icônes par `{ type: 'string' }` ; le plugin Vite émet les deux fichiers. Un nouveau concept `src/domain/training/` porte les 4 catégories imposées (constante partagée par le prompt et les tests) et le prompt, découpé en sections dans un dictionnaire `Dictionary` fr/en. Aucun écran.

**Tech Stack:** TypeScript, Zod 4 (`z.toJSONSchema`), Vite (plugin maison), Vitest, Ajv 2020 (déjà en dev).

**Spec:** `docs/superpowers/specs/2026-10-05-f43-entrainement-autonome-design.md` (§ « Schéma allégé », « Prompt »). Ticket : #134. Branche : `feat/134-schema-allege-prompt` (déjà créée depuis `main`, spec déjà commitée).

## Global Constraints

- Arborescence D59 : `domain/` sans React ni Dexie ; imports par `@/`, pas de `../`, pas de barrel, fichiers en kebab-case, tests colocalisés. `pnpm deps` doit passer sans toucher aux règles.
- Messages : `Dictionary<P>` et `t` de `@/lib/i18n/i18n` (patron de `src/domain/passage/messages.ts`) ; `Locale` = `'fr' | 'en'`.
- Commits gitmoji, message au présent en français, emoji Unicode, terminés par :
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` puis `Claude-Session: https://claude.ai/code/session_01Xy2DSgKQywYQtqqvZuaMFw`.
- Préfixer les commandes par `rtk` (ex. `rtk pnpm test …`, `rtk git commit …`).
- URL figées :
  - schéma complet : `https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json` (`CONFIG_SCHEMA_URL`, existe déjà) ;
  - schéma allégé : `https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.lite.json` ;
  - README : `https://raw.githubusercontent.com/AdrienGras/questionator-z4000-hyperdrive/main/README.md`.
- Catégories imposées, dans cet ordre : `facile` `[0, 0.5, 1]` `leaf` ; `normal` `[0, 0.5, 1, 1.5, 2]` `flame` ; `difficile` `[0, 1, 2, 3]` `bolt` ; `cauchemar` `[0, 1, 2, 3, 4]` `skull`. Libellés fr : Facile, Normal, Difficile, Cauchemar ; en : Easy, Normal, Hard, Nightmare.
- Seuil de taille du schéma allégé : **< 40 000 octets** (mesuré ≈ 31 000 ; le ticket disait 30 Ko, corrigé en tâche 5).
- Écart assumé avec la spec : `buildTrainingPrompt(locale)` au lieu de `({ locale, appBaseUrl, readmeUrl })` — les URL sont des constantes, comme `CONFIG_SCHEMA_URL`, ce qui règle d'office le point « le prompt pointe vers le site publié même en dev ». La tâche 5 met la spec à jour.

## Review Focus

1. **Schéma allégé qui dérive du complet** : un futur champ ajouté au schéma doit apparaître dans les deux — le test d'égalité « tout sauf `icon` » (tâche 1) le garantit.
2. **Prompt anglais incomplet ou qui laisse du français** : un test vérifie que chaque section en existe et qu'aucun libellé fr (`Facile`, `Réponse de référence`) n'apparaît dans la version en (tâche 3).
3. **Barème du prompt désaligné avec `TRAINING_CATEGORIES`** : la table des catégories du prompt est générée depuis la constante, jamais écrite à la main ; le test vérifie chaque ligne (tâche 3).
4. **Exemple d'entraînement qui ne suit pas le prompt** : un test vérifie les conventions (catégories = constante, `id` `<niveau>-<slug>`, gabarit de `answer` avec une ligne par valeur non nulle, difficile ≥ 2 tags, tags d'une liste fermée) en plus de la validation (tâche 4).
5. **Dev server qui ne sert pas le schéma allégé** : `matchConfigAsset` et le middleware le couvrent, testés (tâche 2).

---

### Task 1: Option `lite` de `buildConfigJsonSchema`

**Files:**
- Modify: `src/domain/config/json-schema.ts`
- Test: `src/domain/config/json-schema.test.ts`

**Interfaces:**
- Produces: `export const CONFIG_SCHEMA_LITE_URL = 'https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.lite.json'` ; `export function buildConfigJsonSchema(options?: { lite?: boolean }): Record<string, unknown>` (sans option : sortie strictement identique à aujourd'hui).

- [ ] **Step 1: Écrire les tests qui échouent** (à la suite de `json-schema.test.ts`, dans un `describe('schéma allégé (F43)')`)
  - `test('icon est une simple chaîne, sans anyOf ni liste de noms')` : sur `buildConfigJsonSchema({ lite: true })`, le nœud `properties.categories.items.properties.icon` a `type === 'string'`, pas de clé `anyOf`, et sa `description` est égale à celle du schéma complet.
  - `test('ne diffère du schéma complet que sur icon et $id')` : cloner les deux sorties (`structuredClone`), supprimer `$id` à la racine et `properties.categories.items.properties.icon` dans chacune, puis `expect(lite).toEqual(full)`.
  - `test('$id pointe vers le schéma allégé')` : `expect(lite.$id).toBe(CONFIG_SCHEMA_LITE_URL)`.
  - `test('pèse moins de 40 000 octets')` : `new TextEncoder().encode(JSON.stringify(lite, null, 2) + '\n').length < 40_000`.
  - `test('sans option, la sortie est inchangée')` : `expect(buildConfigJsonSchema()).toEqual(buildConfigJsonSchema({ lite: false }))`.

- [ ] **Step 2: Lancer et constater l'échec**
  Run: `rtk vitest run src/domain/config/json-schema.test.ts`
  Expected: FAIL (`CONFIG_SCHEMA_LITE_URL` non exporté).

- [ ] **Step 3: Implémenter**
  Dans l'`override` existant, si `options.lite` : vider le nœud comme aujourd'hui puis poser `node.type = 'string'` au lieu de l'`anyOf` (description et défaut conservés). `$id` = `CONFIG_SCHEMA_LITE_URL` en `lite`. Mettre à jour le commentaire JSDoc (D17 + F43 : le schéma allégé existe pour les LLM, dont les outils de lecture tronquent avant `questions`).

- [ ] **Step 4: Lancer et constater le succès**
  Run: `rtk vitest run src/domain/config/`
  Expected: PASS, y compris `example.test.ts` et les tests existants de `json-schema.test.ts`.

- [ ] **Step 5: Commit**
  `rtk git add src/domain/config/json-schema.ts src/domain/config/json-schema.test.ts && rtk git commit -m "✨ Ajoute une variante allégée du JSON Schema de config" -m "…attribution…"`

---

### Task 2: Publication de `config.schema.lite.json`

**Files:**
- Modify: `vite/config-schema-plugin.ts`
- Test: `vite/config-schema-plugin.test.ts`

**Interfaces:**
- Consumes: `buildConfigJsonSchema({ lite: true })` (tâche 1).
- Produces: `export const LITE_SCHEMA_FILE_NAME = 'config.schema.lite.json'` ; `renderConfigAssets()` renvoie en plus `liteSchema: string`.

- [ ] **Step 1: Écrire les tests qui échouent** (sur le modèle des tests existants du fichier)
  - `matchConfigAsset(\`${BASE}config.schema.lite.json\`, BASE)` vaut `LITE_SCHEMA_FILE_NAME`.
  - `renderConfigAssets()` : `JSON.parse(liteSchema).$id` vaut l'URL du schéma allégé, et `liteSchema` se termine par `\n`.
  - Si le fichier teste déjà `generateBundle` / le middleware pour `config.schema.json`, ajouter le même cas pour le fichier allégé (émis avec `fileName: LITE_SCHEMA_FILE_NAME` ; servi avec `application/json; charset=utf-8`).

- [ ] **Step 2: Lancer et constater l'échec**
  Run: `rtk vitest run vite/config-schema-plugin.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implémenter**
  `JsonSchemaModule` devient `{ buildConfigJsonSchema: (options?: { lite?: boolean }) => Record<string, unknown> }`. Ajouter le nom à la liste de `matchConfigAsset`, `liteSchema` au rendu (même sérialisation `JSON.stringify(…, null, 2) + '\n'`), à `assetsByFileName` et à `generateBundle`. Mettre à jour le JSDoc du plugin.

- [ ] **Step 4: Vérifier**
  Run: `rtk vitest run vite/` puis `rtk pnpm build && ls -l dist/config.schema.lite.json`
  Expected: PASS ; le fichier existe, < 40 000 octets. `rtk pnpm check:precache && rtk pnpm check:budget` passent (le `.json` est pré-caché par `globPatterns`, c'est accepté).

- [ ] **Step 5: Commit**
  `✨ Publie config.schema.lite.json à côté du schéma complet`

---

### Task 3: Catégories imposées et prompt de génération

**Files:**
- Create: `src/domain/training/training-categories.ts`, `src/domain/training/prompt.ts`, `src/domain/training/messages.ts`
- Test: `src/domain/training/prompt.test.ts`

**Interfaces:**
- Consumes: `CONFIG_SCHEMA_URL`, `CONFIG_SCHEMA_LITE_URL` (`@/domain/config/json-schema`) ; `t`, `Dictionary`, `Locale` (`@/lib/i18n/i18n`).
- Produces :
  - `training-categories.ts` : `export type TrainingCategory = { id: string; scale: readonly number[]; icon: string; label: Record<Locale, string> }` ; `export const TRAINING_CATEGORIES: readonly TrainingCategory[]` (valeurs des Global Constraints) ; `export const README_RAW_URL` (URL du README des Global Constraints).
  - `prompt.ts` : `export function buildTrainingPrompt(locale: Locale): string`.
  - `messages.ts` : `export const TRAINING_PROMPT_SECTIONS` (tableau ordonné des clés) et le dictionnaire fr/en ; clés : `intro`, `tool`, `format`, `steps`, `calibration`, `volume`, `writing`, `delivery`. Paramètres : `tool: { readmeUrl }`, `format: { liteSchemaUrl, fullSchemaUrl, categoryTable }`, `writing: { decimalExample }`, les autres `NoParams`.

- [ ] **Step 1: Écrire les tests qui échouent** (`prompt.test.ts`)
  - `test.each(['fr', 'en'])('%s : contient les URL du README, du schéma allégé et du schéma complet')`.
  - `test.each(['fr', 'en'])('%s : une ligne par catégorie imposée, avec id, libellé, barème et icône')` : pour chaque entrée de `TRAINING_CATEGORIES`, le prompt contient une ligne qui contient `c.id`, `c.label[locale]`, `JSON.stringify(c.scale).replaceAll(',', ', ')` et `c.icon`.
  - `test.each(['fr', 'en'])('%s : impose locale et schemaVersion')` : contient `"locale": "<locale>"` et `"schemaVersion": 1`.
  - `test('fr : gabarit de answer')` : contient `**Réponse de référence**`, `**Barème**`, `**Pièges**`, `0,5`.
  - `test('en : gabarit de answer, sans français')` : contient `**Reference answer**`, `**Scoring**`, `**Pitfalls**`, `0.5` ; ne contient ni `Facile`, ni `Réponse de référence`, ni `Barème`.
  - `test.each(['fr', 'en'])('%s : sections dans l’ordre')` : le prompt est la jonction par `\n\n` des sections de `TRAINING_PROMPT_SECTIONS`, chacune non vide (indexOf croissant des débuts de sections).
  - `test('les barèmes imposés sont des barèmes valides')` : chaque `scale` commence par 0, est strictement croissant, a au plus 3 décimales (règles de §6.2).

- [ ] **Step 2: Lancer et constater l'échec**
  Run: `rtk vitest run src/domain/training/`
  Expected: FAIL (modules absents).

- [ ] **Step 3: Implémenter**
  - Texte fr : celui du bloc « Prompt » de la spec, **mot pour mot**, section par section (« Tu vas générer… » = `intro`, « ## 1. Comprendre l'outil » = `tool`, etc.). La table des catégories (`categoryTable`) est construite dans `prompt.ts` à partir de `TRAINING_CATEGORIES` au format de la spec (`| id | label | scale | icon |`, barème écrit `[0, 0.5, 1]`), jamais en dur dans les messages.
  - Texte en : traduction fidèle, `"locale": "en"`, libellés en, gabarit `**Reference answer**` / `**Scoring**` / `**Pitfalls**`, point décimal (`0.5 / 1 / 1.5…`).
  - `buildTrainingPrompt` = sections dans l'ordre de `TRAINING_PROMPT_SECTIONS`, jointes par `\n\n`.

- [ ] **Step 4: Vérifier**
  Run: `rtk vitest run src/domain/training/ && rtk pnpm deps && rtk pnpm lint`
  Expected: PASS ; aucune violation `domain-is-pure`.

- [ ] **Step 5: Commit**
  `✨ Ajoute le prompt de génération d'une config d'entraînement`

---

### Task 4: Config d'exemple d'entraînement

**Files:**
- Create: `examples/training.example.json`
- Modify: `.oxlintrc.json`, `docs/CONVENTIONS.md` (exception d'import, ligne « Seule exception »)
- Test: `src/domain/training/training-example.test.ts`

**Interfaces:**
- Consumes: `TRAINING_CATEGORIES` (tâche 3) ; `validateConfig` (`@/domain/config/validate`, appelé comme dans `example.test.ts` : `validateConfig(text, { cssSupports: () => true })`).

- [ ] **Step 1: Écrire le fichier et les tests**
  Fichier : un petit cours fictif en français (ex. « Git, les bases »), `$schema` = schéma complet, `schemaVersion: 1`, `locale: "fr"`, `exam.title` et `exam.subject`, `scoring` imposé (`3` / `10` / `20`), les 4 catégories exactes de `TRAINING_CATEGORIES` (id, label fr, scale, icon), 3 tags (ex. `commit`, `branche`, `historique`), 2 questions en facile, 2 en normal, 2 en difficile, 1 en cauchemar ; chaque `answer` au gabarit fr de la spec. Import en `?raw` depuis `../../../examples/training.example.json` : ajouter `"src/domain/training/training-example.test.ts"` à la liste `files` du dernier override de `.oxlintrc.json` (celui qui coupe `no-restricted-imports` pour `src/domain/config/example.test.ts`), et mentionner ce fichier à côté de l'exception existante dans `docs/CONVENTIONS.md` § « Arborescence et imports » › Règles tacites.
  Tests :
  - `test('passe validateConfig sans erreur ni avertissement')`.
  - `test('catégories identiques aux catégories imposées')` : `[id, label, scale, icon]` de chaque catégorie = `TRAINING_CATEGORIES` avec `label.fr`.
  - `test('id de question au format <niveau>-<slug>')` : `/^(facile|normal|difficile|cauchemar)-[a-z0-9]+(-[a-z0-9]+)*$/` et préfixe = id de sa catégorie.
  - `test('answer suit le gabarit, une ligne par valeur non nulle du barème')` : contient `**Réponse de référence**` et `**Barème**` ; les lignes `- **<v>** :` du barème listent exactement les valeurs non nulles de la catégorie, en ordre croissant, écrites avec virgule (`0,5`).
  - `test('difficile : au moins 2 tags ; chaque tag a une question facile et une normal')`.

- [ ] **Step 2: Lancer**
  Run: `rtk vitest run src/domain/training/`
  Expected: PASS (si un test échoue, corriger l'exemple, pas le test).

- [ ] **Step 3: Commit**
  `✨ Ajoute une config d'exemple d'entraînement conforme au prompt`

---

### Task 5: Produit, décisions et mémoire

**Files:**
- Modify: `PRODUCT.md` (glossaire §4 ; nouvelle section `### F43 — Entraînement autonome` après F26, au format des autres : **Objectif.** / **Contenu.** / **Critères d'acceptation.**)
- Modify: `docs/DECISIONS.md` (ajout en fin : `## D101 — F43 : entraînement autonome (2026-10-05)`, format de D100 : **Question**, **Décision** = tableau « Décisions (D101) » de la spec, plus la ligne « Prompt : URL en constantes » de cet écart, **Pourquoi**)
- Modify: `docs/superpowers/specs/2026-10-05-f43-entrainement-autonome-design.md` (signature `buildTrainingPrompt(locale)`, constantes d'URL ; `training-categories.ts` dans l'arborescence ; seuil 40 000 octets)
- Modify: `docs/QUIRKS.md` (nouvelle entrée : dans `config.schema.json`, l'énumération des 6 220 icônes précède `questions` — un outil de lecture qui tronque ne voit pas la structure des questions ; d'où le schéma allégé)
- Modify: `docs/INDEX.md` (ligne F43.1 en tête de la table Features, au format des lignes voisines, statut « En revue »), `docs/HANDOFF.md` (entrée datée en haut, avec les 4 marqueurs en gras du gabarit)

- [ ] **Step 1: Rédiger** les fichiers ci-dessus. Lire chaque `docs/*.md` par plage (`grep -n '^## '` puis `Read` avec `offset`/`limit`), jamais en entier.
- [ ] **Step 2: Vérifier**
  Run: `rtk pnpm check`
  Expected: vert (format, lint, deps, typecheck, tests).
- [ ] **Step 3: Commit**
  `📝 Documente F43.1 dans le produit, les décisions et la mémoire`

---

## Après les tâches (session principale, pas un sous-agent)

PR **brouillon** vers `main` depuis `.github/pull_request_template.md` (`Closes #134`), `.claude/scripts/sonar-check.sh --pr <n> --wait` jusqu'à « Quality gate OK », 0 issue, 0 hotspot, puis « Ready for review ». Corriger le critère « < 30 Ko » du ticket #134 en « < 40 000 octets ». Pas de merge sans le go de l'utilisateur.
