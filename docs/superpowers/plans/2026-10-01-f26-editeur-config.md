# F26 — Éditeur de config — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Page `/editor` : éditeur JSON CodeMirror validé en direct (issues soulignées et cliquables), aperçu des questions et de l'écran final au thème de la config, brouillon local, téléchargement et passage vers la création de session ; accès par une troisième carte de l'accueil.

**Architecture:** Feature `src/features/config-editor/` (route `/editor`, chunk propre à la route). Briques partagées : `themeVariables` (`lib/appearance`), `ThemeScope` (`components/`), `ProjectionCanvas` (`components/projection/`, extrait de `ProjectionPreview`), `previewSession` (`domain/presentation/`), `config-handoff` (`lib/`). La création de session gagne `setConfigText`.

**Tech Stack:** React 19, TypeScript, Tailwind v4, CodeMirror 6, jsonc-parser, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-01-f26-editeur-config-design.md` — les signatures, textes fr/en et classes exacts y sont ; chaque tâche les reprend tels quels.

## Global Constraints

- Arborescence D59 : `lib` ← `domain` ← `components` ← `features` ← `routes`. Pas d'import entre features, imports `@/…`, pas de barrel, kebab-case. `pnpm deps` vert.
- CodeMirror (`@codemirror/*`, `@lezer/*`) n'apparaît que dans `src/features/config-editor/` ; jamais dans le bundle initial (`check:bundle`).
- Libellés i18n en fr et en en, clés ajoutées au type, aux deux tables et à `SAMPLE` (`src/lib/i18n/ui-messages.test.ts`).
- Délai de validation et d'écriture du brouillon : 300 ms. Clé de brouillon : `questionator:config-draft`. Canevas : 1280 × 720.
- Commits gitmoji en français, présent, emoji Unicode, terminés par :
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01EtRb32mHbi1w7WczeEkbh4
  ```
- Commandes préfixées par `rtk` ; `rtk pnpm check` vert avant chaque commit ; stage par chemins explicites.

## Review Focus

- Texte qui n'est pas du JSON du tout (vide, `[`) : aucune exception dans `locateIssue`, `useLiveValidation`, le téléchargement (nom `config.json`). → tests Task 3, 5, 7.
- `localStorage` / `sessionStorage` indisponibles (navigation privée, quota) : l'éditeur s'ouvre sur l'exemple, la création marche sans reprise. → tests Task 2 et 5.
- Brouillon vidé par l'utilisateur (texte `""`) : au retour, on retrouve `""`, pas l'exemple. → test Task 5.
- Issue dont le chemin pointe vers un champ absent ou un index hors limites : diagnostic sur l'ancêtre le plus proche, jamais hors du texte. → test Task 3.
- Changement de mode clair / sombre pendant l'édition : l'éditeur et l'aperçu suivent sans recharger. → test Task 1 (`ThemeScope`) et vérification visuelle.

---

### Task 1: Briques partagées — `themeVariables`, `ThemeScope`, `ProjectionCanvas`

**Files:**
- Create: `src/lib/appearance/theme-variables.ts` (+ test), `src/components/theme-scope.tsx` (+ test), `src/components/projection/projection-canvas.tsx` (+ test)
- Modify: `src/app/appearance-provider.tsx` (utilise `themeVariables`), `src/features/session/components/projection-preview.tsx` (rend `ProjectionCanvas`)

**Interfaces:**
- Produces: `themeVariables(tokens: ThemeTokens): Record<string, string>` ; `ThemeScope({ theme, className, children }: Readonly<{ theme: NormalizedConfig['theme']; className?: string; children: ReactNode }>)` (lit `useColorModeControl().effective`) ; `ProjectionCanvas({ view, className }: Readonly<{ view: ProjectedView; className?: string }>)` — reprend tel quel le DOM de la boîte et du canevas de `ProjectionPreview` (`data-projection-canvas`, `aria-hidden`, `inert`, scale, visibilité avant mesure).

- [ ] **Step 1: Failing tests** — `themeVariables({ primary: 'red', ring: undefined })` → `{ '--primary': 'red' }` ; `ThemeScope` sous `AppearanceProvider` (voir `src/app/appearance-provider.test.tsx` pour le montage et le passage en sombre) : `div` porte `--primary` du thème clair, puis du thème sombre après bascule ; `ProjectionCanvas` : canevas `aria-hidden` / `inert`, `scale(0.3)` à 384 px (stub `FixedWidthResizeObserver`-like : voir `src/features/session/components/projection-preview.test.tsx`).
- [ ] **Step 2:** `rtk pnpm vitest run src/lib/appearance src/components` → FAIL.
- [ ] **Step 3:** Implémenter ; `AppearanceProvider` boucle sur `themeVariables(tokens)` ; `ProjectionPreview` = `section` + `h2` + `<ProjectionCanvas view={view} />`.
- [ ] **Step 4:** `rtk pnpm vitest run src/lib/appearance src/components src/app src/features/session` → PASS ; `rtk pnpm check` vert.
- [ ] **Step 5:** Commit `♻️ Partage le canevas de projection et la portée de thème`.

---

### Task 2: Session factice, passage vers la création

**Files:**
- Create: `src/domain/presentation/preview-session.ts` (+ test), `src/lib/config-handoff.ts` (+ test)
- Modify: `src/features/create-session/hooks/use-create-form.ts` (+ test), `src/features/create-session/create-session-page.tsx` (+ test)

**Interfaces:**
- Produces: `previewSession(config: NormalizedConfig, now?: Date): Session` ; `stashConfigForCreation(handoff: { text: string; fileName: string }): void` ; `takeConfigForCreation(): { text: string; fileName: string } | undefined` (clé `sessionStorage` `questionator:config-handoff`) ; `CreateForm.setConfigText(text: string, fileName: string): Promise<void>`.

- [ ] **Step 1: Failing tests** — `previewSession` sur `normalize` de l'exemple (`examples/config.example.json`, lu comme dans `src/domain/config/example.test.ts`) : un étudiant Ada Lovelace, `attempts.length === scoring.questionsPerStudent`, tous `scored`, note = valeur médiane (index `Math.floor(n / 2)` du barème trié croissant), `finalRevealedAt` défini, `projection` sur cet étudiant ; `toProjectedView(previewSession(c)).mode === 'student'` et `final` défini. Handoff : stash puis take → l'objet ; second take → `undefined` ; `sessionStorage.getItem` qui lève → `undefined`. `setConfigText` : slot `loaded`, `fileName` fourni. Page : handoff déposé avant `renderAt('/new')` → nom de fichier affiché et aperçu de config visible (comme un dépôt de fichier).
- [ ] **Step 2:** `rtk pnpm vitest run src/domain/presentation src/lib src/features/create-session` → FAIL.
- [ ] **Step 3:** Implémenter ; `setConfigFile` lit le texte puis délègue à `setConfigText`. Construction des passages : `buildSession` ou la forme `Student` de `domain/session/types.ts` (ids déterministes `preview-<n>`, dates à partir de `now`).
- [ ] **Step 4:** Tests ciblés → PASS ; `rtk pnpm check` vert.
- [ ] **Step 5:** Commit `✨ Prépare la session factice et le passage de config vers la création`.

---

### Task 3: Position des issues dans le texte

**Files:**
- Create: `src/features/config-editor/issue-locations.ts` (+ test)

**Interfaces:**
- Produces: `locateIssue(text: string, issue: ConfigIssue): { from: number; to: number }` (`0 <= from <= to <= text.length`).

- [ ] **Step 1: Failing tests** (issues produites par le vrai `validateConfig` sur l'exemple modifié, `cssSupports: () => true`) :
  - virgule retirée entre deux propriétés → `json_syntax`, `from` sur la ligne attendue (comparer `text.slice(0, from).split('\n').length`) ;
  - `id` de la 2e question recopié depuis la 1re → `duplicate_question_id`, plage = valeur `"…"` sur la ligne du doublon ;
  - champ obligatoire supprimé (`exam.title`) → plage de l'objet `exam` ;
  - clé inconnue ajoutée (`"foo": 1` dans `exam`) → plage de la paire `"foo": 1` ;
  - `issue.path` vide, et texte `""` / `"["` → `{ from: 0, to: 0 }` ou plage valide, sans exception.
- [ ] **Step 2:** FAIL → **Step 3:** implémenter (`parseTree`, `findNodeAtLocation`, remontée du chemin ; `json_syntax` : ligne / colonne base 1 → décalage, borné) → **Step 4:** PASS, `rtk pnpm check` vert.
- [ ] **Step 5:** Commit `✨ Relie les issues de config à leur position dans le texte`.

---

### Task 4: Composant `JsonEditor` (CodeMirror)

**Files:**
- Modify: `package.json` / `pnpm-lock.yaml` (`pnpm add @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-json @codemirror/lint @codemirror/autocomplete @lezer/highlight`), `src/index.css` (variables `--cm-*` en `:root` et `.dark`), `scripts/check-initial-bundle.ts` (+ son test s'il existe : motif CodeMirror)
- Create: `src/features/config-editor/editor-theme.ts`, `src/features/config-editor/components/json-editor.tsx` (+ test)

**Interfaces:**
- Produces: `JsonEditor` — props `{ initialText: string; onChange: (text: string) => void; diagnostics: readonly { from: number; to: number; severity: 'error' | 'warning'; message: string }[]; ariaLabel: string; apiRef: Ref<JsonEditorApi> }` ; `type JsonEditorApi = { setText(text: string): void; reveal(from: number, to: number): void; getText(): string }`.

- [ ] **Step 1: Failing tests** (jsdom) — monté avec `initialText` → `.cm-content` contient le texte, `role="textbox"` nommé par `ariaLabel` ; `apiRef.current.setText('{}')` → `onChange('{}')` puis `undo` (commande de `@codemirror/commands` sur la vue, ou `getText` après `Mod-z` simulé) restaure le texte initial ; `diagnostics` d'une erreur → un `.cm-lintRange-error` présent. Si jsdom ne supporte pas une API CodeMirror (mesures), le signaler et limiter le test à ce qui marche (le comportement visuel est couvert en e2e, Task 9).
- [ ] **Step 2:** FAIL → **Step 3:** implémenter (extensions : `lineNumbers`, `history`, `keymap` défaut + historique, `closeBrackets`, `indentOnInput`, `bracketMatching`, `json()`, `lintGutter()`, `editorTheme`, `EditorView.contentAttributes.of({ 'aria-label': ariaLabel })` ; `setDiagnostics` à chaque changement de `diagnostics`) → **Step 4:** PASS ; `rtk pnpm check` vert (dont `check:bundle`).
- [ ] **Step 5:** Commit `✨ Ajoute l'éditeur JSON CodeMirror`.

---

### Task 5: Brouillon et validation en direct

**Files:**
- Create: `src/features/config-editor/hooks/use-config-draft.ts` (+ test), `src/features/config-editor/hooks/use-live-validation.ts` (+ test)

**Interfaces:**
- Consumes: exemple `@/../examples/config.example.json?raw` — si l'import `?raw` hors `src/` est refusé par la règle `../` d'oxlint, ajouter une exception documentée dans la règle (comme `domain/config/example.test.ts`) ou un alias Vite `@examples` ; consigner le choix.
- Produces: `useConfigDraft(): { initialText: string; save: (text: string) => void }` ; `useLiveValidation(text: string): { result: ValidationResult | undefined; lastValid: NormalizedConfig | undefined; pending: boolean }`.

- [ ] **Step 1: Failing tests** — brouillon : absent → texte de l'exemple ; présent → brouillon ; `""` stocké → `""` ; `save` écrit après 300 ms (fake timers) ; `localStorage` qui lève → exemple, `save` sans exception. Validation (`vi.useFakeTimers`, vrai `validateConfig`) : texte valide → après 300 ms `result.ok` et `lastValid` défini ; texte devenu invalide → `result.ok === false`, `lastValid` inchangé ; `pending` vrai pendant le délai ; texte `"["` → issue `json_syntax`, pas d'exception.
- [ ] **Step 2:** FAIL → **Step 3:** implémenter → **Step 4:** PASS ; `rtk pnpm check` vert.
- [ ] **Step 5:** Commit `✨ Ajoute le brouillon et la validation en direct de l'éditeur`.

---

### Task 6: Liste des issues et aperçu

**Files:**
- Create: `src/features/config-editor/components/issue-list.tsx`, `question-preview.tsx`, `config-preview.tsx` (+ tests) ; clés i18n `editor_*` nécessaires à ces composants (fr, en, `SAMPLE`)

**Interfaces:**
- Consumes: `ThemeScope`, `ProjectionCanvas` (Task 1), `previewSession` (Task 2), `formatConfigIssue`, `formatPath`.
- Produces: `IssueList({ ui, issues, onSelect })` ; `QuestionPreview({ ui, category, question })` ; `ConfigPreview({ ui, config, stale })` (`config: NormalizedConfig | undefined`).

- [ ] **Step 1: Failing tests** — `IssueList` : erreurs avant avertissements, message de `formatConfigIssue` + chemin, clic → `onSelect(issue)` ; aucune issue → « Aucune erreur ». `QuestionPreview` : en-tête (libellé, id, titre, barème « 0 / 1 / 2 »), énoncé dans un conteneur `prose-2xl`, `<details>` fermé contenant la réponse ; question sans réponse → pas de `<details>`. `ConfigPreview` : toutes les questions de l'exemple, groupées sous des `h3` de catégorie, puis « Écran final » et un `[data-projection-canvas]` ; `stale` → `role="status"` avec le texte périmé ; `config` absent → message d'attente.
- [ ] **Step 2:** FAIL → **Step 3:** implémenter (textes : spec) → **Step 4:** PASS ; `rtk pnpm check` vert.
- [ ] **Step 5:** Commit `✨ Ajoute la liste des issues et l'aperçu des questions`.

---

### Task 7: Page de l'éditeur et route

**Files:**
- Create: `src/features/config-editor/config-editor-page.tsx` (+ test), `src/routes/editor.tsx` (régénérer `routeTree.gen.ts` : voir QUIRKS « Ajouter une route casse `tsc -b` »)
- Modify: i18n (`editor_*` restants)

**Interfaces:**
- Consumes: Tasks 2 à 6 ; `downloadText` (`@/lib/download`), `slugify` (`@/domain/session/file-name`), `useNavigate`.

- [ ] **Step 1: Failing tests** (CodeMirror réel sous jsdom si la Task 4 l'a permis, sinon `vi.mock` du module `json-editor` par un `textarea` contrôlé exposant le même `apiRef`) — rendu sur l'exemple (`renderAt('/editor')`) : titre, deux colonnes, aperçu après validation ; texte rendu invalide → aperçu marqué périmé, bouton « Créer une session avec cette config » désactivé ; clic sur une issue → `reveal` appelé avec la plage de `locateIssue` ; « Télécharger » → `downloadText(nom, texte exact)` avec `<slug-du-titre>.json`, et `config.json` pour un texte non JSON ; « Repartir de l'exemple » → `setText(exemple)` ; « Charger un fichier » (input) → `setText(contenu)` ; « Créer… » sur config valide → `takeConfigForCreation()` renvoie le texte et la navigation mène à `/new`.
- [ ] **Step 2:** FAIL → **Step 3:** implémenter (mise en page : spec) → **Step 4:** PASS ; `rtk pnpm check` vert.
- [ ] **Step 5:** Commit `✨ Ajoute la page de l'éditeur de config`.

---

### Task 8: Carte « Éditer une config » sur l'accueil

**Files:**
- Modify: `src/features/home/components/action-cards.tsx` (+ test), i18n (`home_editor_*`)

- [ ] **Step 1: Failing test** — troisième carte `h3` « Éditer une config », texte `home_editor_body`, lien « Ouvrir l'éditeur » vers `/editor` ; présente même sans stockage.
- [ ] **Step 2:** FAIL → **Step 3:** implémenter (icône `IconFileCode`) → **Step 4:** PASS ; `rtk pnpm check` vert.
- [ ] **Step 5:** Commit `✨ Ajoute l'accès à l'éditeur de config depuis l'accueil`.

---

### Task 9: Parcours e2e

**Files:**
- Create: `e2e/config-editor.spec.ts`, `e2e/pages/config-editor-page.ts` (Page Object, voir CONVENTIONS § « Test e2e Playwright »)

- [ ] **Step 1: Tests** (spec § Tests, e2e) : accueil sans chunk `codemirror` (requêtes réseau, comme `languages.spec.ts`) ; carte → éditeur sur l'exemple ; virgule supprimée → issue de syntaxe et `.cm-lintRange-error` sur la ligne attendue ; doublon d'`id` → message identique à la création, soulignement sur la ligne du doublon, clic sur l'issue → ligne active = ligne du doublon ; aperçu périmé puis à jour ; réponse repliée ; écran final ; « Télécharger » (`waitForEvent('download')`) → contenu identique ; « Créer une session… » → `/new` avec la config, CSV d'exemple → session créée ; rechargement → brouillon. Saisie via `page.keyboard` dans `.cm-content`.
- [ ] **Step 2:** `rtk pnpm e2e e2e/config-editor.spec.ts` → corriger le code si un parcours échoue (pas les assertions), puis `rtk pnpm e2e` complet vert.
- [ ] **Step 3:** Commit `✅ Couvre l'éditeur de config en e2e`.

---

### Task 10 (session principale) : mémoire projet, vérification visuelle et hors ligne

D80, `PRODUCT.md` F05 / F26, INDEX, BACKLOG (`codemirror-json-schema`), CONVENTIONS, HANDOFF ; navigateur 1440 / 900 px, clair / sombre ; `pnpm build && pnpm preview` hors ligne.
