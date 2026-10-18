# F44.6 — Création de session et éditeur de config — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/new` et `/editor` suivent leurs artboards validés (#148). Côté création : zones de dépôt avec état visible et bordure colorée, aperçu en cartes avec résumé intitulé / valeur et une phrase sous le bouton désactivé. Côté éditeur : une frame (nom de fichier, barre d'outils, problèmes numérotés au-dessus du code, thème CodeMirror du design system) et un aperçu navigable par catégorie. Le comportement ne change pas.

**Architecture:** On garde la structure actuelle (`features/create-session`, `features/config-editor`) et on restyle sur place. Ce qui sert aux deux écrans, ou à la mise en place d'un entraînement, reste ou entre dans `src/components/` : `FileDropField`, `ConfigIssueList`, le nouveau `ActionHalo` (halo derrière l'action principale) et `formatScale` (barème formaté selon la langue). La cause qui bloque la création devient une fonction pure, `submitBlocker`, dans la feature. Le numéro de ligne d'un problème se calcule sur le texte validé, à côté de `locateIssue`. Aucun changement dans `src/domain/`.

**Tech Stack:** React 19, TanStack Router (routage par hash), shadcn v4 sur base-ui, Tailwind CSS v4, icônes Tabler, CodeMirror 6 (`@codemirror/lint`, `EditorView.theme`), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (D102), carte des écrans `docs/superpowers/specs/2026-10-17-f44-carte-des-ecrans.md` (§ Création de session et éditeur ; D103), ticket #148. Maquettes du canevas <https://claude.ai/artifact/DvvtZZb9ie2vknoXtHfnJL> : `apres/creation-session`, `apres/creation-avertissements`, `apres/editeur-config`. Design system <https://claude.ai/artifact/DMYaQZGYtm8RnJqbBMmBcy>.

## Global Constraints

- **Canevas avant l'interface (D102)** : les artboards sont validés (D103). Un écart d'implémentation met l'artboard à jour dans la même PR (Task 8). **Le code fait foi pour tout état que la maquette ne montre pas**, conservé et restylé : zone de dépôt vide et en lecture, erreur de lecture, de validateur et d'écriture, contour pendant le dépôt, « Aucune erreur », aperçu périmé et aperçu vide, marqueurs de la marge (`lintGutter`), infobulles et autocomplétion, avertissements d'une config valide sur `/new`, « Skips désactivés », état désactivé de « Créer une session » dans l'éditeur.
- **Arborescence (D59)** : aucun import entre features (`pnpm deps` vert), rien dans `src/domain/`. Une brique utilisée par deux features va dans `src/components/`.
- **Couleurs** : uniquement des tokens. Comme dans les artboards et `offline-ready-prompt` : l'état « valide » prend `space-training` (vert), le point d'avertissement de la marge prend `space-editor` (ambre), l'erreur prend `destructive`, l'avertissement texte prend `muted-foreground`. `border-amber-500` disparaît du code.
- **Typo** : libellés de carte (« Étudiants », « Configuration ») en `text-label` capitales `text-muted-foreground` ; chiffres clés en `text-score-md tabular-nums` ; textes secondaires en `text-small text-muted-foreground` ; code et chemins en `font-mono` 12 px.
- **Libellés** : FR et EN évoluent ensemble. Chaque nouvelle clé entre dans `UiMessageParams`, les deux dictionnaires et `SAMPLE` de `ui-messages.test.ts`, et une clé qui n'est plus lue est supprimée. Un libellé court visible garde le libellé long en `aria-label` (« Charger » / « Charger un fichier »). Le nom accessible reste donc celui que les tests visent, et il contient le texte visible (WCAG 2.5.3).
- **`useUi()` une fois par page**, `ui` en prop ensuite. Exception déjà en place : `QuestionPreview` lit la langue de la config par son propre `useUi()` (`LocaleScope`).
- **Routage par hash** : une ancre `href="#…"` changerait de route. La navigation de l'aperçu passe par des boutons qui font défiler (Task 7).
- **Mise en place d'un entraînement** : elle partage `FileDropField` et `ConfigIssueList` et prend leur nouvelle forme dès ce ticket. Sa zone de dépôt compacte (artboard `entrainement-mise-en-place`) relève de #151.
- **Tests (D102)** : un test de forme (libellé, structure) s'adapte ; un test de comportement qui casse signale une régression.
- Commits gitmoji en français sur `feat/f44-refonte-ui`, PR #154 toujours en brouillon (D102).

## Review Focus

1. **Annonce de l'état d'une zone de dépôt en double** : le texte d'état devient visible, et la région live `sr-only` actuelle le répéterait. `getByText('Fichier valide')` trouverait alors deux nœuds par zone (e2e `uploadConfig`, `guide.spec.ts`). Un seul nœud, visible, toujours monté et `aria-live="polite"`. Test dans la Task 1.
2. **Plusieurs causes de blocage à la fois** (CSV en erreur et nom vide, base fermée et config invalide) : une seule phrase, la première dans l'ordre fixé. Aucune phrase pendant une lecture ni pendant l'écriture, pour ne jamais expliquer un état transitoire. Tests dans la Task 4.
3. **Téléphone à 390 px** : un halo d'action de 320 à 400 px posé contre un bouton ne doit créer aucun défilement horizontal sur `/new` et `/editor`. La frame de l'éditeur, la barre d'outils et la navigation par catégorie passent à la ligne. Test e2e dans la Task 8.
4. **Numéro de ligne d'un problème pendant la frappe** : il se calcule sur `validatedText` (le texte validé), pas sur le texte courant. Il reste juste entre deux validations, et un texte à BOM ou en CRLF ne le décale pas. Tests dans la Task 6.
5. **Navigation de l'aperçu** : un clic fait défiler la frame jusqu'à la catégorie et donne le focus à son titre, sans toucher l'URL (routage par hash). Sur un aperçu périmé, elle suit la dernière config valide, et elle disparaît avec l'aperçu vide. Tests dans la Task 7.

---

### Task 1: Zone de dépôt avec état visible

**Files:**
- Modify : `src/components/file-drop-field.tsx`, `src/components/file-drop-field.test.tsx`, `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Produces : `FileDropField` garde ses props. Le rendu devient `fieldset` > `legend` + `div` de dépôt (les écouteurs restent sur le `div` neutre) ; `data-status={status}` sur ce `div`, pour les tests.

- [ ] **Step 1 : Écrire les tests qui échouent** dans `file-drop-field.test.tsx` :
  - `test('état visible et annoncé : un seul nœud par état')` : pour chaque statut de la table existante (`ok`, `warnings`, `errors`, `reading`), `getAllByText(<libellé>)` a une longueur de 1, et ce nœud porte `aria-live="polite"`.
  - `test('bordure selon l'état')` : `data-status` vaut le statut. Classes attendues sur le `div` de dépôt : `empty` → `border-dashed border-input` ; `reading` → `border-input` ; `ok` → `border-space-training` ; `warnings` → `border-muted-foreground` ; `errors` → `border-destructive`.
  - `test('vide : aucun nom, aucun état, bouton « Choisir un fichier »')`.
  - Le test existant « glisser-déposer » garde son intention : la bordure passe à `border-primary` pendant le survol.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/components/file-drop-field.test.tsx`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter** d'après les artboards :
  - `legend` en `mb-2 text-small font-semibold`.
  - Zone `flex flex-col items-center gap-2 rounded-lg border-[1.5px] bg-card px-5 py-6 text-center`, bordure de la table ci-dessus.
  - Icône de 28 px : `IconFileUpload` `text-muted-foreground` (vide), `IconLoader2 animate-spin`, `IconCircleCheck text-space-training`, `IconAlertTriangle text-muted-foreground`, `IconCircleX text-destructive`.
  - Nom en `strong` `max-w-full truncate font-semibold`.
  - Texte d'état en `text-small`, `text-destructive` pour `errors`, sinon `text-muted-foreground`. Ce `span` est **toujours monté**, vide quand la zone est vide.
  - Rangée `mt-1 flex flex-wrap items-center justify-center gap-2` : bouton `outline` `size="sm"` (« Choisir un fichier » / « Remplacer »), puis `create_drop_hint` en `text-small text-muted-foreground`.

- [ ] **Step 4 : Relancer** le fichier, puis `pnpm vitest run src/features/create-session src/features/training-setup`. Attendu : PASS. Un test de la mise en place d'un entraînement qui cassait sur la forme s'adapte.

- [ ] **Step 5 : Commit** `💄 Montre l'état d'une zone de dépôt et colore sa bordure`.

---

### Task 2: Halo d'action, barème formaté, liste des problèmes d'une config

**Files:**
- Create : `src/components/action-halo.tsx` (+ test), `src/components/format-scale.ts` (+ test)
- Modify : `src/components/config-issue-list.tsx` (+ Create `config-issue-list.test.tsx`), `src/routes/__root.tsx`, `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Produces :
  - `ActionHalo({ side, children }: { side: 'start' | 'end'; children: ReactNode })` : enveloppe `relative isolate self-start` avec un `div aria-hidden` en `pointer-events-none absolute -top-10 -z-10 h-32.5 blur-sm bg-[radial-gradient(closest-side,var(--color-halo-action),transparent)]`. `start` : `-left-6 w-80` (bouton de formulaire, artboard `creation-session`) ; `end` : `-right-6 w-100` (action d'en-tête, artboard `editeur-config`).
  - `formatScale(scale: readonly number[], locale: Locale, separator: ' · ' | ' / '): string`, qui applique `formatRawScore(toMilli(point), locale)` à chaque point : `[0, 0.5, 1]` donne `0 · 0,5 · 1` en `fr` et `0 · 0.5 · 1` en `en`.
  - `ConfigIssueList` garde ses props, avec un nouveau rendu des éléments :
    - erreur : colonne `gap-1.5 text-small text-destructive`, puis ligne `font-semibold` avec `IconCircleX` de 16 px et `issue_error_label`, puis chemin en `code` (`self-start rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground`), puis message en `text-foreground` ;
    - avertissement : ligne `gap-2 text-small text-muted-foreground`, `IconAlertTriangle` de 16 px, message puis chemin en `font-mono text-xs` ;
    - la liste porte `border-t pt-3`.
- Clé i18n :

| Clé | FR | EN |
|---|---|---|
| `issue_error_label` | `Erreur` | `Error` |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `format-scale.test.ts` : `test('barème en français : virgule décimale')` → `formatScale([0, 0.5, 1], 'fr', ' · ')` vaut `0 · 0,5 · 1` ; `test('barème en anglais, séparateur de l'aperçu de l'éditeur')` → `formatScale([0, 1.5, 3], 'en', ' / ')` vaut `0 / 1.5 / 3`.
  - `action-halo.test.tsx` : `test('halo caché aux lecteurs d'écran, sans pointeur, du côté demandé')` : le bouton enfant est rendu, le décor porte `aria-hidden` et `pointer-events-none`, ainsi que `-left-6` pour `start` et `-right-6` pour `end`.
  - `config-issue-list.test.tsx` :
    - `test('erreur : libellé « Erreur », chemin, message')` ;
    - `test('avertissement : icône et chemin, sans libellé « Erreur »')` ;
    - `test('erreurs d'abord, rien sans issue')`.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/components/format-scale.test.ts src/components/action-halo.test.tsx src/components/config-issue-list.test.tsx`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter** les trois briques et la clé (FR, EN, `SAMPLE`). Dans `__root.tsx`, la colonne de contenu (`relative isolate flex min-w-0 flex-1 flex-col`) reçoit `overflow-x-clip`, avec ce commentaire : le halo d'une action peut dépasser du bord sur téléphone ; `clip` ne crée pas de conteneur de défilement, donc les colonnes collantes de l'éditeur restent collantes.

- [ ] **Step 4 : Relancer** les trois fichiers, puis `pnpm vitest run src/components src/features/training-setup` (l'écran d'entraînement endommagé utilise `ConfigIssueList`) et `pnpm deps`. Attendu : PASS.

- [ ] **Step 5 : Commit** `✨ Ajoute le halo d'action, le barème formaté et la nouvelle liste des problèmes d'une config`.

---

### Task 3: Aperçu de la création

**Files:**
- Modify : `src/features/create-session/components/students-preview.tsx`, `src/features/create-session/components/config-preview.tsx`, `src/features/create-session/create-session-page.test.tsx`, `src/lib/i18n/ui-messages.ts` (+ test)
- Create : `src/features/create-session/components/config-preview.test.tsx`

**Interfaces:**
- Consumes : `formatScale`, `ConfigIssueList` (Task 2) ; `CategoryIcon`, `categoryAccent` (`components/category-tile.tsx`).
- Produces : `StudentsPreview` et `ConfigPreview` gardent leurs props. Chacun rend sa propre carte (`section` en `rounded-lg bg-card p-5 shadow-card flex flex-col gap-2`, `gap-3` pour la config), et la page ne les enveloppe plus dans `Card`.
- Rendu :
  - **Étudiants** : libellé `preview_students_title`, puis `count` en `text-score-md` et `preview_students_noun`. Ensuite « Voir la liste » (`summary` en `font-semibold text-foreground`, liste inchangée). Enfin les issues : erreur en `text-destructive` avec `IconCircleX`, avertissement en `text-muted-foreground` avec `IconAlertTriangle`, en `text-small` et dans le même ordre qu'aujourd'hui (erreurs d'abord, `preview_line`).
  - **Config valide** :
    - libellé `preview_config_title`, puis `exam.title` en `h3 text-h2`, puis une ligne `text-small text-muted-foreground` qui joint `subject` et `cohort` présents par ` · ` (rien si les deux manquent) ;
    - une liste des catégories, chaque `li` en `flex items-center gap-3 border-t py-2`. Tuile de 28 px `rounded-sm` teintée par `--category-color` (style `categoryAccent`, classes `bg-[color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_16%,transparent)] text-[var(--category-color,var(--color-muted-foreground))]`). Elle contient `CategoryIcon` de 16 px si `icon` est défini, sinon un point de 8 px `bg-current`. Viennent ensuite le libellé (`text-sm font-semibold`) au-dessus de `preview_category_questions` (`text-xs text-muted-foreground`), puis le barème à droite, `formatScale(scale, locale, ' · ')`, en `text-small text-muted-foreground tabular-nums` ;
    - un `dl` (`border-t pt-3 flex flex-col gap-1.5 text-small`), chaque ligne en `flex justify-between gap-3`, avec `dt` en `text-muted-foreground` et `dd` en `font-medium tabular-nums text-right`. Lignes : questions par étudiant, note brute → finale, arrondi, skips ;
    - `ConfigIssueList` (les avertissements d'une config valide).
  - **Config invalide** : libellé `preview_config_title`, puis le nombre d'erreurs en `text-score-md text-destructive` et `preview_config_errors` en `text-muted-foreground`, puis `ConfigIssueList`.
- Clés i18n (les clés barrées sont supprimées) :

| Clé | FR | EN |
|---|---|---|
| `preview_students_title` | `Étudiants` | `Students` |
| `preview_students_noun` `{ count }` | `étudiant` / `étudiants` | `student` / `students` |
| `preview_config_errors` `{ count }` | `erreur à corriger` / `erreurs à corriger` | `error to fix` / `errors to fix` |
| `preview_category_questions` `{ count }` | `1 question` / `5 questions` | `1 question` / `5 questions` |
| `preview_questions_per_student` | `Questions par étudiant` | `Questions per student` |
| `preview_scale_label` | `Note brute → finale` | `Raw → final score` |
| `preview_scale_value` `{ maxRawScore, finalScale }` | `sur 10 → sur 20` | `out of 10 → out of 20` |
| `preview_rounding_label` | `Arrondi` | `Rounding` |
| `preview_rounding_value` (`RoundingParams`) | `au plus proche, 2 décimales` · `au pas de 0,5` | `to nearest, 2 decimals` · `to nearest, step 0.5` |
| `preview_skips_label` | `Skips autorisés` | `Skips allowed` |
| `preview_skips_value` `{ max }` | `2 par étudiant` | `2 per student` |
| `preview_skips_disabled` (texte changé) | `aucun (skips désactivés)` | `none (skips disabled)` |
| ~~`preview_students_count`, `preview_subject`, `preview_cohort`, `preview_category`, `preview_scoring`, `preview_rounding`, `preview_skips`~~ | | |

  `roundingFr` / `roundingEn` deviennent les fonctions de `preview_rounding_value`, sans le préfixe « Arrondi » / « Rounded ». Les valeurs numériques de `preview_scale_value` passent par `toLocaleString(locale)`.

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `config-preview.test.tsx`, avec les constructeurs de config des tests existants :
    - `test('résumé en lignes intitulé / valeur')` : `getAllByRole('term')` et `getAllByRole('definition')` donnent, dans l'ordre, `Questions par étudiant` / `3`, `Note brute → finale` / `sur 10 → sur 20`, `Arrondi` / `au plus proche, 2 décimales`, `Skips autorisés` / `2 par étudiant`.
    - `test('catégorie : nombre de questions et barème formaté en français')` : `5 questions` et `0 · 0,5 · 1`.
    - `test('catégorie sans couleur ni icône : tuile neutre')` : aucun attribut `style` sur la tuile.
    - `test('matière et promotion jointes, absentes sans ligne')`.
    - `test('config invalide : nombre d'erreurs à corriger, avertissements non comptés')` : deux erreurs et un avertissement donnent `2` et `erreurs à corriger`, et les trois issues sont listées.
    - `test('skips désactivés')` : `aucun (skips désactivés)`.
  - `create-session-page.test.tsx` : adapter les assertions de forme sur l'ancien résumé (`A : 1 question, barème 0, 1, 2`, `Skips désactivés`) aux nouveaux textes. Aucune assertion de comportement ne change.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/create-session src/lib/i18n`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter** les deux composants et les clés, retirer les `Card` de la page. Pour l'aperçu vide (`create_preview_empty`), le texte reste.

- [ ] **Step 4 : Relancer.** Attendu : PASS, puis `pnpm typecheck` (aucune clé supprimée encore lue).

- [ ] **Step 5 : Commit** `💄 Présente l'aperçu de la création en cartes, avec le résumé de la config en lignes`.

---

### Task 4: Page de création

**Files:**
- Create : `src/features/create-session/submit-blocker.ts` (+ test)
- Modify : `src/features/create-session/create-session-page.tsx` (+ test), `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `ActionHalo` (Task 2), `SpaceIcon`.
- Produces : `type SubmitBlocker = 'db' | 'students' | 'config' | 'files' | 'name'` ; `submitBlocker(form: Pick<CreateForm, 'students' | 'config' | 'name' | 'submitting'>, dbStatus: DbStatus): SubmitBlocker | undefined`. Les causes sont essayées dans l'ordre :
  1. `db` si `dbStatus !== 'open'` ;
  2. `students` si le CSV est `read-error`, ou `loaded` avec une issue `error` ;
  3. `config` si la config est `read-error`, `load-error`, ou `loaded` avec `!result.ok` ;
  4. `files` si un emplacement est `empty` ;
  5. `name` si `name.trim() === ''`.

  Le résultat est `undefined` pendant `submitting` ou si un emplacement est `reading` (état transitoire), et sinon `undefined` quand rien ne bloque.
- Rendu de la page (artboard `creation-session`) :
  - `PageShell` avec `icon={<SpaceIcon space="sessions" size="lg" />}` et `meta={text('create_subtitle', {})}` ;
  - contenu `flex flex-wrap items-start gap-8`, avec le formulaire en `flex-[999_1_27.5rem] min-w-0 flex flex-col gap-6` et l'aperçu en `flex-[1_1_18.75rem] max-w-90 min-w-0 flex flex-col gap-3` (`h2` en `text-h2`) ;
  - zones de dépôt dans une grille `grid-cols-[repeat(auto-fit,minmax(min(100%,13.75rem),1fr))] gap-4`, avec l'erreur de chaque emplacement (`role="alert"`) sous sa zone ;
  - liens d'exemple : `IconDownload` de 14 px, texte court visible, libellé long existant en `aria-label` (`create_students_example_link`, `create_config_example_link`), en `text-small text-muted-foreground` ;
  - bloc des noms en `flex flex-col gap-4 border-t pt-6`. Champs `Input` en `h-11`, libellés en `text-small font-semibold`. Libellé de l'examinateur : `examiner_label`, suivi d'un `span` `font-normal text-muted-foreground` qui contient `optional_hint`. Indication : `create_examiner_hint` ;
  - soumission : rangée `flex flex-wrap items-center gap-x-4 gap-y-3`, avec `ActionHalo side="start"` autour du `Button` (`IconPlus`, `create_submit`), puis, si `submitBlocker` rend une cause, son texte en `text-small text-muted-foreground` avec un `id`. Le bouton porte `aria-describedby` vers cet `id` seulement quand la phrase est là. `create_write_error` reste en `role="alert"` au-dessus.
- Clés i18n :

| Clé | FR | EN |
|---|---|---|
| `create_subtitle` | `Déposez la liste des étudiants et la config de l’oral.` | `Drop the student list and the exam config.` |
| `create_students_example_short` | `Liste d’exemple` | `Example list` |
| `create_config_example_short` | `Config d’exemple` | `Example config` |
| `optional_hint` | `(facultatif)` | `(optional)` |
| `create_examiner_hint` | `Repris en colonne dans les exports.` | `Included as a column in exports.` |
| `create_blocked_db` | `La base n’est pas disponible : la session ne peut pas être créée.` | `The database isn’t available: the session can’t be created.` |
| `create_blocked_students` | `Corrigez la liste d’étudiants pour créer la session.` | `Fix the student list to create the session.` |
| `create_blocked_config` | `Corrigez la configuration pour créer la session.` | `Fix the configuration to create the session.` |
| `create_blocked_files` | `Déposez la liste d’étudiants et la config pour créer la session.` | `Drop the student list and the config to create the session.` |
| `create_blocked_name` | `Donnez un nom à la session pour la créer.` | `Name the session to create it.` |

  `examiner_hint` reste tel quel : le dialogue « Modifier l'examinateur » le lit.

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `submit-blocker.test.ts` (emplacements construits à la main, `FileSlot`) :
    - `test('rien ne bloque : undefined')` ;
    - `test.each` sur une cause seule : base `unavailable` et base `outdated` → `db` ; CSV avec une issue `error` et CSV `read-error` → `students` ; config `!ok`, `read-error` et `load-error` → `config` ; un emplacement vide → `files` ; nom `'  '` → `name` ;
    - `test('plusieurs causes : la première dans l'ordre')` : base fermée, config invalide et nom vide donnent `db` ; CSV en erreur et nom vide donnent `students` ;
    - `test('lecture ou écriture en cours : aucune phrase')` : un emplacement `reading` avec le nom vide donne `undefined` ; `submitting` donne `undefined`.
  - `create-session-page.test.tsx` :
    - `test('bouton désactivé : la phrase de la cause le décrit')` : config invalide déposée, le bouton « Créer la session » est `disabled` et sa description accessible (`toHaveAccessibleDescription`) vaut `Corrigez la configuration pour créer la session.` ;
    - `test('formulaire complet : ni phrase ni description')` ;
    - adapter les tests de forme : le champ de l'examinateur se trouve par `{ name: "Nom de l'examinateur (facultatif)" }`, et les liens d'exemple gardent leur nom long.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/create-session`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter** `submitBlocker`, la page et les clés. La garde de dépôt (`PAGE_DROP_GUARD`), le passage depuis l'éditeur et la navigation après création ne bougent pas.

- [ ] **Step 4 : Relancer** puis `pnpm deps`. Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Met la page de création au format de sa maquette et explique le bouton désactivé`.

---

### Task 5: Thème CodeMirror du design system

**Files:**
- Modify : `src/features/config-editor/editor-theme.ts`, `src/index.css`

**Interfaces:**
- Produces : `editorTheme` garde son nom et son type. L'éditeur n'a plus de bordure ni de rayon : la frame de la Task 6 les porte.

- [ ] **Step 1 : Réécrire `editorChrome`** d'après l'artboard `editeur-config` :
  - `&` : `backgroundColor: var(--background)`, sans `border` ni `borderRadius`, `fontSize: 13px` ;
  - `&.cm-focused` : `outline: 2px solid var(--ring)` avec `outlineOffset: -2px` (dans la frame, qui coupe le débord) ;
  - `.cm-scroller` : `fontFamily: var(--font-mono)`, `lineHeight: 20px`, avec `.cm-content` en `padding: 12px 0` ;
  - `.cm-gutters` : fond transparent, sans bordure, `color: var(--input)`, et `.cm-lineNumbers .cm-gutterElement` aligné à droite avec `padding: 0 12px 0 8px` ;
  - ligne active (`.cm-activeLine`, `.cm-activeLineGutter`) : `backgroundColor: color-mix(in oklch, var(--muted-foreground) 8%, transparent)`, et numéro actif en `var(--foreground)` ;
  - marqueurs de `lintGutter` : `.cm-lint-marker` en pastille de 8 px `border-radius: 999px` sans image (`content: none`), `.cm-lint-marker-error` en `var(--destructive)`, `.cm-lint-marker-warning` en `var(--color-space-editor)` ;
  - soulignement : `.cm-lintRange-error` et `.cm-lintRange-warning` sans `backgroundImage`, avec `textDecoration: underline wavy` en `var(--destructive)` pour l'un et `var(--muted-foreground)` pour l'autre, `textUnderlineOffset: 3px` ;
  - infobulles, autocomplétion et survol de schéma inchangés (tokens `popover`, `accent`).
- [ ] **Step 2 : Couleurs de syntaxe** : dans `index.css`, le bloc `.dark .cm-editor` prend la palette des artboards, celle de la vue projetée : `--cm-property: #7dd3fc`, `--cm-string: #f9a8d4`, `--cm-number: #fcd34d`, `--cm-keyword: #c4b5fd`, `--cm-punctuation: var(--muted-foreground)`. Le bloc clair `.cm-editor` reste pour #152. Mettre à jour le commentaire du bloc.
- [ ] **Step 3 : Lancer** `pnpm vitest run src/features/config-editor`. Attendu : PASS (aucune assertion ne vise un style). La vérification visuelle se fait en Task 8.
- [ ] **Step 4 : Commit** `💄 Accorde le thème de l'éditeur JSON au design system`.

---

### Task 6: Frame de l'éditeur et problèmes numérotés

**Files:**
- Modify : `src/features/config-editor/issue-locations.ts` (+ test), `src/features/config-editor/components/issue-list.tsx` (+ test), `src/features/config-editor/config-editor-page.tsx` (+ test), `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `ActionHalo` (Task 2), `SpaceIcon`, `configFileName`.
- Produces :
  - `lineAt(text: string, offset: number): number` dans `issue-locations.ts` : ligne en base 1 de la position `offset` (nombre de `\n` avant elle, plus 1). Bornée au texte.
  - `type LocatedIssue = { issue: ConfigIssue; line: number }` ; `IssueList({ ui, issues, onSelect }: { ui: Ui; issues: readonly LocatedIssue[]; onSelect: (issue: ConfigIssue) => void })`.
- Rendu de `IssueList` :
  - un en-tête `flex items-center justify-between gap-2` avec un `h2` `editor_issues_title` en `text-small font-semibold`, puis à droite `editor_issues_count`, ou `editor_issues_none` sans liste quand il n'y a rien, en `text-small text-muted-foreground tabular-nums` ;
  - chaque issue est un `button` `w-full flex items-start gap-2.5 rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent focus-visible:…`. Il contient l'icône de 16 px (`IconCircleX text-destructive` ou `IconAlertTriangle text-muted-foreground`, `aria-hidden`), puis une colonne avec le message et le chemin (`font-mono text-xs text-muted-foreground`), puis `editor_issue_line` à droite en `text-xs text-muted-foreground tabular-nums whitespace-nowrap` ;
  - ordre inchangé : erreurs puis avertissements.
- Rendu de la page :
  - `PageShell` avec `icon={<SpaceIcon space="editor" size="lg" />}`, `meta={t('editor_subtitle', {})}`, et dans `actions` « Créer une session avec cette config » (`IconPlus`, même condition `disabled`) entouré de `ActionHalo side="end"`. Le bouton quitte la barre d'outils ;
  - colonnes `flex flex-wrap items-start gap-6` : source en `flex-[999_1_28.75rem] min-w-0`, aperçu en `flex-[1_1_22.5rem] max-w-110 min-w-0`. La colonne source garde son `lg:sticky` et sa hauteur d'écran ;
  - la colonne source est une frame (`section` en `flex flex-col overflow-hidden rounded-lg bg-card shadow-card`), et c'est elle qui porte l'écoute du dépôt et son contour pendant le dépôt ;
  - barre de la frame (`flex flex-wrap items-center justify-between gap-2 border-b py-2.5 pr-3 pl-4`) : `h2` de la région en `text-sm font-semibold` avec `IconFileCode` de 16 px et le nom `useMemo(() => configFileName(validatedText ?? draft.initialText), [validatedText])`, puis trois boutons `ghost` `size="sm"` : « Charger » (`editor_load_file_short`, `aria-label` = `editor_load_file`, `IconUpload`), « Repartir de l'exemple » (`IconRefresh`), « Télécharger » (`IconDownload`) ;
  - erreurs de lecture et de validateur (`role="alert"`) sous la barre, en `px-4 pt-3` ;
  - problèmes (`border-b px-4 py-3`, liste bornée en `max-h-48 overflow-auto`) **au-dessus** de `JsonEditor`, présents dès que `result !== undefined` ;
  - `JsonEditor` en `flex-1 min-h-0`, `h-[60vh]` sous `lg`.
  - Le mémo des diagnostics calcule une fois `locateIssue(validatedText, issue)` par issue, et en tire à la fois le diagnostic et la `LocatedIssue` (`line: lineAt(validatedText, range.from)`).
- Clés i18n :

| Clé | FR | EN |
|---|---|---|
| `editor_subtitle` | `Écrivez la config d’un oral et vérifiez-la au fil de la frappe.` | `Write an exam config and check it as you type.` |
| `editor_load_file_short` | `Charger` | `Load` |
| `editor_issues_title` | `Problèmes` | `Problems` |
| `editor_issue_line` `{ line }` | `ligne 115` | `line 115` |
| ~~`editor_source_title`~~ | | |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `issue-locations.test.ts` :
    - `test('lineAt : première ligne, ligne suivante, fin du texte')` : `lineAt('a\nb\nc', 0)` vaut 1, `lineAt('a\nb\nc', 2)` vaut 2, `lineAt('a\nb\nc', 99)` vaut 3 ;
    - `test('lineAt : CRLF et BOM ne décalent pas la ligne')` : `lineAt('﻿a\r\nb', 4)` vaut 2 ;
    - `test('ligne d'un problème : celle de sa valeur')` : dans un texte de 3 lignes dont la ligne 3 porte `"icon": "leafs"`, `lineAt(text, locateIssue(text, issue).from)` vaut 3.
  - `issue-list.test.tsx` :
    - `test('en-tête « Problèmes » et compteur')` ;
    - `test('chaque problème affiche sa ligne')` : texte `ligne 115` ;
    - `test('aucune issue : « Aucune erreur », aucune liste')` ;
    - le test existant du clic sur un problème garde son intention.
  - `config-editor-page.test.tsx` :
    - `test('la région de la source porte le nom de fichier dérivé du titre')` : avec l'exemple, `getByRole('region', { name: 'oral-de-demonstration.json' })`. Le nom exact vient de `configFileName(EXAMPLE_TEXT)`, à calculer dans le test plutôt qu'à recopier ;
    - `test('« Charger » : nom accessible « Charger un fichier »')` ;
    - `test('« Créer une session avec cette config » dans l'en-tête, désactivé sur une config invalide')` ;
    - `test('les problèmes précèdent le code')` : `compareDocumentPosition` entre le titre « Problèmes » et le `textbox` « Configuration JSON » ;
    - adapter les tests de forme qui visent `heading`/`region` « Configuration » (lignes 69 et 138).

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/config-editor`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter** `lineAt`, `IssueList`, la page et les clés. `selectIssue` garde son calcul sur `validatedText ?? text`.

- [ ] **Step 4 : Relancer** puis `pnpm deps`. Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Range l'éditeur dans une frame avec ses problèmes numérotés au-dessus du code`.

---

### Task 7: Aperçu de l'éditeur navigable

**Files:**
- Modify : `src/features/config-editor/components/config-preview.tsx` (+ test), `src/features/config-editor/components/question-preview.tsx` (+ test), `src/features/config-editor/config-editor-page.tsx`, `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `formatScale` (Task 2).
- Produces : `ConfigPreview` garde ses props. Il rend la navigation (au-dessus de la frame à thème), la frame et ses sections. Chaque section a un `id` dérivé de `useId()` et de son rang (jamais de `category.id`, qui peut contenir n'importe quel caractère), et son `h3` porte `tabIndex={-1}`.
- Rendu :
  - la page met l'en-tête de l'aperçu en `flex flex-col gap-0.5` : `h2` `text-h2` puis `editor_preview_subtitle` en `text-small text-muted-foreground` ;
  - navigation : `nav aria-label={editor_preview_nav}` en `flex flex-wrap gap-1.5`, présente seulement si `config !== undefined`. Une puce par catégorie : `button` `inline-flex h-7 items-center gap-1.5 rounded-sm bg-muted px-2.5 text-small font-medium`, avec un point de 8 px `aria-hidden` à la couleur de la catégorie (absent sans couleur), le libellé, puis le nombre de questions en `text-muted-foreground tabular-nums`. Une dernière puce `editor_final_screen`, sans point ni nombre ;
  - au clic : `section.scrollIntoView({ block: 'start', behavior })`, avec `behavior` à `auto` si `prefers-reduced-motion: reduce` et `smooth` sinon, puis `heading.focus({ preventScroll: true })`. L'URL ne change pas ;
  - frame : `ThemeScope` en `max-h-160 overflow-auto rounded-lg bg-background p-4 text-foreground flex flex-col gap-3`. `opacity-60` sur un aperçu périmé, comme aujourd'hui ;
  - titres de catégorie et de l'écran final en `text-lg font-bold` ;
  - aperçu périmé : `output` en `rounded-md bg-muted px-3 py-2 text-small`, avec `IconAlertTriangle` de 16 px en `text-space-editor` (à la place de `border-amber-500`) ;
  - `QuestionPreview` : carte `rounded-md border border-border bg-card p-4 flex flex-col gap-3`, en-tête en `text-small` ; point de catégorie de 10 px ; `code` de l'id en `font-mono text-xs text-muted-foreground` ; barème `formatScale(category.scale, contentUi.locale, ' / ')` en `ml-auto text-muted-foreground tabular-nums` ; `details` en `rounded-[10px] border border-border px-3 py-2` ; `summary` en `text-sm font-semibold`.
- Clés i18n :

| Clé | FR | EN |
|---|---|---|
| `editor_preview_subtitle` | `Chaque question telle qu’elle sera projetée, dans le thème de la config.` | `Each question as it will be projected, in the config’s theme.` |
| `editor_preview_nav` | `Aller à une catégorie` | `Go to a category` |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `config-preview.test.tsx` :
    - `test('une puce par catégorie avec son nombre de questions, puis « Écran final »')` : `within(getByRole('navigation', { name: 'Aller à une catégorie' })).getAllByRole('button')` a une longueur de catégories + 1, et la première contient `Facile` et `5` ;
    - `test('clic sur une puce : défilement jusqu'à la catégorie et focus sur son titre')` : `Element.prototype.scrollIntoView` simulé (jsdom ne l'implémente pas) ; après le clic, il a été appelé sur la section, et `document.activeElement` est le `h3` de la catégorie ;
    - `test('l'URL ne change pas')` : `window.location.hash` est inchangé après le clic ;
    - `test('aperçu vide : ni navigation ni frame')` ;
    - `test('aperçu périmé : navigation de la dernière config valide')`.
  - `question-preview.test.tsx` : `test('barème formaté dans la langue de la config')` : sous `LocaleScope locale="fr"`, une échelle `[0, 0.5, 1]` donne `0 / 0,5 / 1`. Sous `en`, elle donne `0 / 0.5 / 1`.
  - Les e2e et tests qui cherchent « Écran final » par `getByText` trouvent aussi la puce : passer par le rôle (`heading` de niveau 3, déjà le cas dans `e2e/pages/config-editor-page.ts`).

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/config-editor`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.** Le `lang` et la `LocaleScope` de l'aperçu ne bougent pas, et l'habillage (puces, « Écran final », « Réponse attendue ») reste dans la langue de l'éditeur.

- [ ] **Step 4 : Relancer.** Attendu : PASS.

- [ ] **Step 5 : Commit** `✨ Ajoute la navigation par catégorie dans l'aperçu de l'éditeur`.

---

### Task 8: E2E, vérification visuelle, mémoire et PR

**Files:**
- Modify : `e2e/pages/create-session-page.ts`, `e2e/pages/config-editor-page.ts`, `e2e/config-editor.spec.ts` et toute spec qui casse sur une forme ; Create : `e2e/create-and-editor.spec.ts`
- Canevas : les artboards touchés par un écart (Step 5)
- Mémoire : `docs/INDEX.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md` (D107), `docs/CONVENTIONS.md`, `docs/QUIRKS.md` et `docs/BACKLOG.md` au besoin ; corps de la PR #154

- [ ] **Step 1 : Adapter les Page Objects** : `uploadConfig` attend toujours `getByText('Fichier valide').nth(1)`, qui vise désormais le texte visible (un seul nœud par zone, Task 1). `ConfigEditorPage` gagne `problems` (`getByRole('heading', { name: 'Problèmes' })`) et `categoryNav` (`getByRole('navigation', { name: 'Aller à une catégorie' })`).

- [ ] **Step 2 : Écrire `e2e/create-and-editor.spec.ts`.**
  - `test('création : la phrase sous le bouton suit la cause')` : avec une config invalide, `Corrigez la configuration pour créer la session.` ; une fois les deux fichiers d'exemple déposés, plus de phrase et le bouton est actif.
  - `test('éditeur : un problème montre sa ligne et y mène')` : remplacer une icône par `leafs`, attendre `ligne N` dans « Problèmes ». Après le clic, `activeLineNumber` vaut `N`.
  - `test('éditeur : une puce mène à sa catégorie')` : clic sur la deuxième puce, puis son `h3` est focalisé et visible dans la frame, et l'URL reste `#/editor`.
  - `test('390 px : aucun défilement horizontal sur /new et /editor')` : `document.documentElement.scrollWidth <= clientWidth`, deux fichiers déposés sur `/new`.

- [ ] **Step 3 : Lancer** `pnpm check` puis `pnpm e2e`. Attendu : tout vert. Une spec qui casse sur un comportement est une régression à corriger dans le code.

- [ ] **Step 4 : Comparer aux artboards**, avec des captures Playwright à 1280 × 800 et à 390 × 844 :
  - `/new` vide, avec les fichiers d'exemple, et avec `etudiants-doublon` plus une config à id en double (`creation-avertissements`) ;
  - `/editor` avec l'exemple, et avec un avertissement d'icône (`editeur-config`) ;
  - pour chaque capture, relever les écarts à l'artboard de même nom.

- [ ] **Step 5 : Aligner** : un écart non voulu se corrige dans le code. Un écart voulu met à jour l'artboard :
  - tuile d'en-tête à 52 px comme sur les pages d'espace (les artboards en montrent 48) ;
  - zone de dépôt vide (non maquettée) ;
  - phrase « Déposez la liste d'étudiants et la config… » ;
  - marqueurs de `lintGutter` dans leur propre colonne.

  Publier le canevas avec `root` et `files`, en ne touchant que ces artboards (lecture complète d'abord, QUIRKS 2026-10-17).

- [ ] **Step 6 : Mettre à jour la mémoire.**
  - `INDEX.md` : une ligne #148.
  - `HANDOFF.md` : une entrée datée avec les quatre marqueurs.
  - **D107** dans `DECISIONS.md` :
    - l'ordre des causes de `submitBlocker` et la cause `files` (ajoutée à la liste de la carte) ;
    - `space-training` pour l'état valide et `space-editor` pour le point d'avertissement ;
    - la palette de syntaxe de l'éditeur (celle de la projection, mot-clé `#c4b5fd`) ;
    - la navigation de l'aperçu par boutons (routage par hash) ;
    - la colonne de contenu en `overflow-x-clip` ;
    - le nouveau rendu partagé par la mise en place d'un entraînement jusqu'à #151.
  - `CONVENTIONS.md` § Page examinateur : `ActionHalo` derrière l'action principale d'un écran (un seul par écran), libellé court visible et libellé long en `aria-label`.
  - `QUIRKS.md` pour tout piège rencontré (`scrollIntoView` absent de jsdom, ancres et routage par hash). `BACKLOG.md` pour ce qui est repoussé, dont la zone de dépôt compacte de l'entraînement si #151 ne la couvre pas.

- [ ] **Step 7 : Corps de la PR #154** : passer #147 en « validé » ; ajouter la section « #148 — Création de session et éditeur (à valider) » (plan, D107, points clés) et la ligne de tests. Cocher la mémoire #148 dans la checklist.

- [ ] **Step 8 : Pousser**, attendre la CI, lancer `.claude/scripts/sonar-check.sh --pr 154 --wait` et corriger jusqu'à « Quality gate OK », 0 issue, 0 hotspot. La PR reste en brouillon.

- [ ] **Step 9 : Faire valider l'utilisateur en local** (`pnpm dev` sur le tailnet, à 1280 px et sur téléphone ; en `http://`, la création de session échoue, QUIRKS 2026-10-17 : tester la création sur `localhost` ou en HTTPS). C'est un point d'arrêt : #149 ne commence pas sans son accord.
