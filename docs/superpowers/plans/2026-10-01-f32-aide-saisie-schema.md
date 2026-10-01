# F32 — Aide à la saisie depuis le JSON Schema — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** décrire chaque champ du JSON Schema de config (description et défaut, en français), et en tirer dans l'éditeur de l'app l'autocomplétion (Ctrl+Espace) et l'aide au survol.

**Architecture:** `.meta({ description, default })` sur le schéma Zod ; le JSON Schema publié en hérite (VSCode). Un module pur `schema-assist.ts` lit ce JSON Schema avec `jsonc-parser` pour proposer clés et valeurs et décrire une clé ; `JsonEditor` le branche sur `@codemirror/autocomplete` et `hoverTooltip`.

**Tech Stack:** Zod 4 (`z.toJSONSchema`), CodeMirror 6, `jsonc-parser`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-01-f32-aide-saisie-schema-design.md`

## Global Constraints

- Descriptions en **français seul**, un seul schéma publié.
- Aucune dépendance nouvelle (`codemirror-json-schema` écarté).
- CodeMirror et le nouveau module restent hors du bundle initial : `pnpm build && pnpm check:bundle && pnpm check:precache` doivent passer.
- Les défauts viennent de `CONFIG_DEFAULTS` (`src/domain/config/defaults.ts`), jamais recopiés en dur.
- Pas de validation par le JSON Schema dans l'éditeur ; pas d'extraits de blocs entiers.
- Conventions : `CLAUDE.md` (arborescence D59, imports `@/`, kebab-case, pas de barrel), commits gitmoji en français au présent, avec les lignes `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` et `Claude-Session: https://claude.ai/code/session_014Q14V1gq549DYF3LbkcaUe`.
- Lancer les commandes avec `rtk proxy` devant `pnpm exec vitest` / `pnpm exec playwright` (le filtre RTK de vitest échoue sur ce dépôt). `pnpm check` = format, lint (oxlint type-aware, `--deny-warnings`), deps, types, tests.
- Ne jamais lire un `docs/*.md` en entier : `grep -n '^## '` puis lecture par plage.

## Review Focus

1. Curseur sur une clé dont la chaîne n'est pas fermée (`{ "scoring": { "qu`) : les clés de `scoring` sont proposées, la plage remplacée couvre `"qu`. → test Task 2.
2. Curseur entre deux propriétés, hors guillemets (`"maxRawScore": 10, |`) : les clés sont proposées et l'insertion apporte ses guillemets. → test Task 2.
3. Curseur dans un élément de tableau (`categories[0]`, `categories[0].questions[1]`) : clés de catégorie / de question. → test Task 2.
4. Chemin hors schéma (clé inconnue, valeur d'un champ libre comme `exam.title`) : aucune proposition, aucune exception. → test Task 2.
5. Survol d'une valeur, d'un jeton de thème, de `icon` : rien sur une valeur ; description générique sur un jeton ; description conservée sur `icon` malgré son `anyOf`. → tests Task 1 et Task 2.

---

### Task 1: Descriptions et défauts dans le schéma

**Files:**
- Modify: `src/domain/config/schema.ts`
- Modify: `src/domain/config/json-schema.ts` (override `icon`)
- Create: `src/domain/config/json-schema.test.ts`

**Interfaces:**
- Consumes: `CONFIG_DEFAULTS` (`src/domain/config/defaults.ts`), `buildConfigJsonSchema()`.
- Produces: JSON Schema dont chaque nœud de propriété porte `description: string` et, s'il a un défaut, `default`. Inchangé : signatures, validation, messages d'erreur.

- [ ] **Step 1: Écrire les tests qui échouent** dans `json-schema.test.ts` :

```ts
test('chaque propriété du JSON Schema a une description', () => {
  // parcours récursif de properties / items / anyOf ; collecte les chemins sans description
  expect(missingDescriptions(buildConfigJsonSchema())).toEqual([])
})
test('les défauts publiés égalent CONFIG_DEFAULTS', () => {
  const p = buildConfigJsonSchema().properties
  expect(p.scoring.properties.rounding.properties.mode.default).toBe(CONFIG_DEFAULTS.rounding.mode)
  // idem pour chaque champ de CONFIG_DEFAULTS.rounding, .absent, .skips, .presentation (boucle)
})
test('icon garde sa description à côté de son anyOf', () => {
  const icon = /* categories.items.properties.icon */
  expect(icon.description).toMatch(/Tabler/)
  expect(icon.anyOf).toHaveLength(2)
})
test('un jeton de thème a une description générique', () => {
  expect(/* theme.properties.light.properties.primary */.description).toBe('Variable CSS `--primary` du thème clair.')
  expect(/* theme.properties.dark.properties['chart-1'] */.description).toBe('Variable CSS `--chart-1` du thème sombre.')
})
```

`step` vaut `null` par défaut : tester `toBe(null)` passe par la même boucle (`toStrictEqual`).

- [ ] **Step 2: Lancer** `rtk proxy pnpm exec vitest run src/domain/config/json-schema.test.ts` — attendu : FAIL (descriptions absentes).

- [ ] **Step 3: Implémenter.**
  - Poser `.meta({ description })` sur le schéma **final** de chaque propriété (après `.optional()`, `.nullable()`), sinon la description n'atterrit pas sur le nœud de la propriété.
  - Textes : `PRODUCT.md` §6.2, tableau des champs (lignes ~215-248, `grep -n 'Champ | Type' PRODUCT.md`), réécrits en une phrase sans le « Défaut : … » (porté par `default`). Pour les lignes sans texte propre, utiliser :
    - `$schema` : « URL du JSON Schema, pour l'autocomplétion dans l'éditeur. »
    - `exam` : « Examen : titre et métadonnées reprises dans la vue projetée et les exports. »
    - `scoring` : « Notation : nombre de questions, plafond de la note brute, échelle finale et arrondi. »
    - `rounding` : « Arrondi de la note finale ; tous ses champs sont optionnels. »
    - `rounding.mode` : « Sens de l'arrondi : au plus proche, au-dessus ou au-dessous. »
    - `rounding.decimals` : « Nombre de décimales de la note finale (0 à 3). »
    - `absent` : « Note exportée pour un étudiant absent ; tous ses champs sont optionnels. »
    - `absent.label` : « Texte exporté pour un absent quand `export` vaut `label`. »
    - `skips` : « Questions passées (skips) ; tous ses champs sont optionnels. »
    - `skips.enabled` : « Autorise l'examinateur à passer une question. »
    - `skips.maxPerStudent` : « Nombre maximal de questions passées par étudiant. »
    - `presentation` : « Affichage de la vue projetée ; tous ses champs sont optionnels. »
    - `presentation.finalScoreDisplay` : « Note affichée sur l'écran final : brute, convertie ou les deux. »
    - `presentation.defaultColorMode` : « Mode d'affichage clair, sombre ou celui du système à l'ouverture de la session. »
    - `theme` : « Surcharge des variables CSS de l'interface, par mode clair et sombre. »
    - `theme.light` / `theme.dark` : « Variables CSS du thème clair. » / « … sombre. »
    - `categories` : « Catégories de difficulté proposées au tirage. »
    - `categories[].questions` : « Questions de la catégorie. »
  - `locale` : pas de `default` (il dépend du navigateur) ; la description le dit.
  - `default` : pour chaque champ de `CONFIG_DEFAULTS.rounding`, `.absent`, `.skips`, `.presentation`, la valeur lue dans `CONFIG_DEFAULTS` (ex. `default: CONFIG_DEFAULTS.rounding.mode`).
  - `ThemeSchema` → fabrique `themeSchema(mode: 'light' | 'dark')` qui pose la description générique par jeton (texte exact des tests).
  - `json-schema.ts` : l'`override` d'`IconSchema` garde `description` et `default` du nœud avant de le vider, puis les remet à côté d'`anyOf`.

- [ ] **Step 4: Lancer** le test du Step 2, puis `rtk proxy pnpm exec vitest run src/domain/config vite` — attendu : tout PASS (`config-schema-plugin.test.ts` et `example.test.ts` lisent aussi le schéma).

- [ ] **Step 5: Commit** — `✨ Décrit chaque champ du JSON Schema de config (descriptions et défauts)`.

---

### Task 2: Module pur `schema-assist`

**Files:**
- Create: `src/features/config-editor/schema-assist.ts`
- Create: `src/features/config-editor/schema-assist.test.ts`

**Interfaces:**
- Consumes: `buildConfigJsonSchema()` (Task 1), `getLocation`, `parseTree`, `findNodeAtLocation` de `jsonc-parser`.
- Produces :

```ts
export type SchemaNode = {
  type?: string | string[]
  properties?: Record<string, SchemaNode>
  items?: SchemaNode
  anyOf?: SchemaNode[]
  enum?: unknown[]
  const?: unknown
  description?: string
  default?: unknown
}
export type AssistCompletion = { label: string; apply: string; detail?: string; info?: string }
export type AssistCompletions = { from: number; to: number; options: AssistCompletion[] }
export type AssistHover = { from: number; to: number; description: string; default?: unknown }

export function schemaAt(root: SchemaNode, path: readonly (string | number)[]): SchemaNode | undefined
export function completionsAt(text: string, offset: number, root: SchemaNode): AssistCompletions | undefined
export function hoverAt(text: string, offset: number, root: SchemaNode): AssistHover | undefined
/** buildConfigJsonSchema() mémorisé, typé SchemaNode. */
export function configJsonSchema(): SchemaNode
```

- [ ] **Step 1: Écrire les tests qui échouent** (`|` marque le curseur dans le texte ; un helper `at(textWithCursor)` renvoie `[text, offset]`). Utiliser le vrai `configJsonSchema()` :
  - clés racine sur `{ | }` : `labels` contient `schemaVersion`, `scoring`, `categories` ; `apply` de `scoring` vaut `"scoring": ` ; `info` = description.
  - clés de `scoring` dans `{ "scoring": { "maxRawScore": 10, | } }` : contient `questionsPerStudent`, ne contient pas `maxRawScore` (déjà présente).
  - **Review Focus 1** : `{ "scoring": { "qu|` → contient `questionsPerStudent` ; `from` = position du `"` ouvrant.
  - **Review Focus 2** : `{ "scoring": { "maxRawScore": 10, | } }` → `from === to === offset`, `apply` commence par `"`.
  - **Review Focus 3** : `{ "categories": [ { | } ] }` → contient `scale`, `questions` ; `{ "categories": [ { "questions": [ {}, { | } ] } ] }` → contient `prompt`, `answer`.
  - valeurs : `{ "scoring": { "rounding": { "mode": | } } }` → labels `["\"nearest\"", "\"up\"", "\"down\""]` ; `"mode": "ne|"` → mêmes options, `from` sur le `"` ouvrant de la valeur, `to` après le `"` fermant.
  - booléen : `"drawAnimation": |` → `["true", "false"]` ; `null` : `"step": |` → contient `null`.
  - `locale` → `["\"fr\"", "\"en\""]` ; `schemaVersion` → `["1"]` ; `icon` → contient `"\"leaf\""` et `"\"brand-php\""`.
  - **Review Focus 4** : clé inconnue `{ "foo": { | } }` → `undefined` ; valeur libre `{ "exam": { "title": | } }` → `undefined` ; texte vide `""` → pas d'exception.
  - survol : sur `rounding` dans `{ "scoring": { "rounding": {} } }` → description non vide, `from`/`to` couvrent la clé guillemets compris ; sur `mode` → `default: 'nearest'` ; sur `step` → `default: null` (présent, `'default' in hover`).
  - **Review Focus 5** : survol d'une valeur (`"mode": "ne|arest"`) → `undefined` ; sur `primary` dans `theme.light` → description `Variable CSS \`--primary\` du thème clair.` ; sur `icon` d'une catégorie → description contenant `Tabler`.

- [ ] **Step 2: Lancer** `rtk proxy pnpm exec vitest run src/features/config-editor/schema-assist.test.ts` — attendu : FAIL (module absent).

- [ ] **Step 3: Implémenter** `schema-assist.ts`.
  - `schemaAt` : clé → `properties[clé]` ; indice → `items` ; sur un nœud à `anyOf`, essayer chaque branche dans l'ordre et prendre la première qui répond.
  - `completionsAt` : `getLocation(text, offset)`. Plage remplacée : `previousNode` s'il est une chaîne (clé ou valeur) dont la plage contient le curseur, sinon `[offset, offset]`.
    - `isAtPropertyKey` : objet parent = `schemaAt(root, path.slice(0, -1))` ; clés déjà présentes lues par `findNodeAtLocation(parseTree(text), path.slice(0, -1))` (nœud objet → `children` → clé de chaque propriété) ; exclure la clé en cours de frappe elle-même seulement si elle est complète ailleurs. `apply` = `JSON.stringify(clé) + ': '`, `detail` = type du nœud si simple.
    - Sinon (valeur) : nœud = `schemaAt(root, path)` ; options = `enum`, `const`, `true`/`false` si `boolean`, `null` si le type l'admet, en parcourant `anyOf` ; labels et `apply` = `JSON.stringify(valeur)` ; dédoublonner.
    - Aucune option → `undefined`.
  - `hoverAt` : `getLocation` ; seulement si `isAtPropertyKey` et `previousNode` est la clé sous le curseur ; nœud = `schemaAt(root, path)` ; sans description → `undefined`. Inclure `default` seulement si la propriété `default` existe sur le nœud.
  - `configJsonSchema` : mémorisation module (variable `let cached`).

- [ ] **Step 4: Lancer** le test du Step 2 — attendu : PASS. Puis `rtk proxy pnpm exec vitest run src/features/config-editor` — PASS.

- [ ] **Step 5: Commit** — `✨ Ajoute la complétion et le survol tirés du JSON Schema (module pur)`.

---

### Task 3: Branchement dans `JsonEditor`

**Files:**
- Modify: `src/features/config-editor/components/json-editor.tsx`
- Modify: `src/features/config-editor/components/json-editor.test.tsx`
- Modify: `src/features/config-editor/editor-theme.ts`
- Modify: `src/features/config-editor/config-editor-page.tsx` (passe le libellé)
- Modify: `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts` (clé `editor_hover_default`)

**Interfaces:**
- Consumes: `completionsAt`, `hoverAt`, `configJsonSchema` (Task 2).
- Produces: prop `defaultLabel: string` sur `JsonEditor` (texte « Défaut » localisé, fourni par la page via `text('editor_hover_default', {})`) ; fonction exportée `configCompletionSource(context: CompletionContext): CompletionResult | null` dans `json-editor.tsx` (pour le test).

- [ ] **Step 1: Écrire les tests qui échouent** dans `json-editor.test.tsx` :
  - `configCompletionSource` sur `new CompletionContext(EditorState.create({ doc: '{ "scoring": {  } }' }), <position entre les accolades internes>, true)` → `result.options` contient un `label` `questionsPerStudent`, `result.from` = position.
  - même source, `explicit: false`, curseur hors de tout mot → `null` (pas de liste qui s'ouvre seule sur un espace).
  - le montage existant passe toujours (ajouter `defaultLabel="Défaut"` au helper `mount`).

- [ ] **Step 2: Lancer** `rtk proxy pnpm exec vitest run src/features/config-editor/components/json-editor.test.tsx` — attendu : FAIL.

- [ ] **Step 3: Implémenter.**
  - `configCompletionSource` : `completionsAt(state.doc.toString(), context.pos, configJsonSchema())` ; si `!context.explicit` et aucun mot ni guillemet juste avant le curseur (`context.matchBefore(/["\w-]+$/)` nul) → `null`. Renvoie `{ from, to, options, validFor: /^["\w-]*$/ }`.
  - Extensions : `autocompletion({ override: [configCompletionSource] })`, `completionKeymap` ajouté au `keymap.of` (avant `defaultKeymap`), `hoverTooltip` qui construit un `<div>` : description en `<p>`, puis si `default` présent `<p>` « `${defaultLabel} : ` » + `<code>JSON.stringify(default)</code>` (via `textContent`, jamais `innerHTML`). `defaultLabel` lu par une ref, comme `ariaLabel`.
  - `editor-theme.ts` : `.cm-tooltip` (fond `var(--popover)`, texte `var(--popover-foreground)`, bordure `var(--border)`, rayon `var(--radius)`), `.cm-tooltip-autocomplete ul li[aria-selected]` (fond `var(--accent)`, texte `var(--accent-foreground)`), `.cm-completionInfo` et la bulle de survol avec `max-width: 28rem`, `padding: 0.5rem 0.75rem`.
  - i18n : `editor_hover_default: NoParams` ; fr `'Défaut'`, en `'Default'`.

- [ ] **Step 4: Lancer** le test du Step 2, puis `rtk proxy pnpm check` — attendu : PASS ; puis `pnpm build && pnpm check:bundle && pnpm check:precache` — attendu : « Bundle initial sans recharts, xlsx, shiki, codemirror. » et « Pré-cache complet ».

- [ ] **Step 5: Commit** — `✨ Branche l'autocomplétion et le survol dans l'éditeur de config`.

---

### Task 4: e2e et documentation

**Files:**
- Modify: `e2e/config-editor.spec.ts` (et `e2e/pages/config-editor-page.ts` si un helper manque)
- Modify: `docs/DECISIONS.md` (D87 en fin de fichier), `PRODUCT.md` (F26 et §6.2), `docs/INDEX.md` (ligne F32 sous F36), `docs/BACKLOG.md` (deux items `→ #80` cochés : `- [x] … *Livré en F32 (D87).*`), `README.md` (« Écrire une config »)

**Interfaces:**
- Consumes: l'éditeur branché (Task 3).

- [ ] **Step 1: Écrire les e2e** dans `config-editor.spec.ts` :
  - « Ctrl+Espace propose les clés à l'endroit du curseur, puis les valeurs d'une énumération » : `editor.replaceText('{\n  "scoring": {\n    \n  }\n}')`, clic sur la 3ᵉ ligne de `.cm-content` puis `End`, `Control+Space` → `page.getByRole('option', { name: /questionsPerStudent/ })` visible ; `Escape`, taper `"rounding": { "mode": ` puis `Control+Space` → options `"nearest"`, `"up"`, `"down"` visibles. Ajouter au page object une méthode `complete(): Promise<void>` (focus de l'éditeur gardé, `Control+Space`) si cela simplifie.
  - « le survol de finalScoreDisplay affiche sa description et son défaut » : `hover` sur le texte `"finalScoreDisplay"` de `.cm-content` → `.cm-tooltip-hover` contient `écran final` et `Défaut : "both"`.

- [ ] **Step 2: Lancer** `rtk proxy pnpm exec playwright test e2e/config-editor.spec.ts --retries=0` — attendu : PASS (les tests précédents restent verts, dont « l'accueil ne charge pas CodeMirror »).

- [ ] **Step 3: Documenter.**
  - D87 : reprendre le tableau « Décisions (D87) » de la spec au format des autres entrées (`**Question**`, `**Décision**`, `**Pourquoi**`, `**Reporté dans**`), date 2026-10-01.
  - `PRODUCT.md` : F26, une puce « Autocomplétion (Ctrl+Espace) des clés et des valeurs d'énumération, aide au survol (description, défaut), tirées du JSON Schema (D87). » ; §6.2, phrase d'intro : le JSON Schema publié porte la description et le défaut de chaque champ, en français.
  - `docs/INDEX.md` : ligne `| F32 — Aide à la saisie depuis le JSON Schema (#80) | 2026-10-01 | [spec](superpowers/specs/2026-10-01-f32-aide-saisie-schema-design.md) | [plan](superpowers/plans/2026-10-01-f32-aide-saisie-schema.md) | Livré | … ; D87 |` (vérifier le format des liens des lignes voisines).
  - `README.md` « Écrire une config » : VSCode affiche aussi la description et le défaut de chaque champ au survol ; l'éditeur de l'app propose les mêmes aides.

- [ ] **Step 4: Lancer** `rtk proxy pnpm check` et `rtk proxy pnpm e2e --retries=0` — attendu : tout PASS.

- [ ] **Step 5: Commit** — `📝 Documente F32 (D87, PRODUCT, INDEX, BACKLOG, README)` (et `✅ …` séparé pour l'e2e si préféré).
