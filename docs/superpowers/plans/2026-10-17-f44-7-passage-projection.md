# F44.7 — Passage examinateur et vue projetée — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/session/$sessionId` et `/present/$sessionId` suivent leurs douze artboards validés (#149). Côté passage : le nom de l'étudiant en titre, une barre de progression segmentée et le score brut sur son maximum dans l'en-tête, la question en carte, « Tirage suivant » en tuiles teintées, une colonne de droite (vue projetée avec bascule, carte « Note » avec halo, commentaire et absence), un panneau restylé (« Cet étudiant » / « Liste »), un écran final avec jauge et barres par question, des dialogues alignés. Côté projection : cartes « Question » et « Score », grande grille puis rangée compacte des catégories, question en carte teintée, écran final en jauge avec détail coloré, écran d'attente. La notation, le tirage, le skip, l'absence et l'ajustement ne changent pas.

**Architecture:** On restyle sur place dans `features/session`, `features/present` et `components/projection`. Trois briques montent ou entrent dans `src/components/` parce que plusieurs écrans s'en servent : `CategoryBadge` (tuile d'icône teintée), `ScoreGauge` (demi-jauge de note) et la variante `around` d'`ActionHalo`. Deux petits changements de domaine, seuls écarts de fond : `categoryId` dans `ProjectedView.detail` (D103) et `final.decimals` (le nombre de décimales de l'arrondi, pour formater la note projetée comme partout ailleurs, D103). La progression segmentée est une fonction pure de la feature. Les tâches 1 à 9 couvrent le passage, 10 et 11 la projection, 12 le thème, l'e2e, le canevas et la mémoire.

**Tech Stack:** React 19, TanStack Router (routage par hash), shadcn v4 sur base-ui (`Sheet`, `Tabs`, `Dialog`), Tailwind CSS v4 (container queries), icônes Tabler, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (D102), carte des écrans `docs/superpowers/specs/2026-10-17-f44-carte-des-ecrans.md` (§ Passage et vue projetée ; D103), ticket #149. Maquettes du canevas <https://claude.ai/artifact/DvvtZZb9ie2vknoXtHfnJL>, page « Après » : `passage-question`, `passage-panneau`, `passage-panneau-etudiant`, `passage-note-finale`, `passage-question-theme`, `session-dialogues`, `projection-attente`, `projection-tuiles`, `projection-tirage`, `projection-question`, `projection-finale`, `projection-finale-detail`. Design system <https://claude.ai/artifact/DMYaQZGYtm8RnJqbBMmBcy>. Lecture des artboards : `Artifact` `read` avec `paths: ["project/apres/<nom>.dc.html"]`, puis extraire `<main>…</main>` et retirer les `<svg>` (HANDOFF F44.6, Notes pour future Claude).

## Global Constraints

- **Canevas avant l'interface (D102)** : les artboards sont validés (D103). Un écart d'implémentation met l'artboard à jour dans la même PR (Task 12). **Le code fait foi pour tout état que la maquette ne montre pas**, conservé et restylé : animation de tirage (fondu en mouvement réduit), « Épuisée » / « Indisponible », bandeau « la projection montre un autre étudiant », pop-up bloquée, alertes d'erreur de page et de tiroir, aucun étudiant, étudiant absent, grille entre deux questions, quota de skip atteint, « Tous les étudiants sont passés », note non encore révélée, ouverture automatique de l'ajustement en fin de passage (D66), ajustement invalide ou borné.
- **Comportements conservés (D103)** : notation en un clic (un bouton du barème note et ferme la question, aucun état « sélectionné ») ; « Éléments de réponse » repliés à chaque question (`key={attempt.id}`, D28) ; correction d'une note déjà donnée dans l'onglet « Cet étudiant » (`<select>`, `editScore`) ; motif d'une question passée dans le détail ; le tiroir se ferme après un changement d'étudiant réussi.
- **Refusé (D103)** : aucun titre de question sur la projection. La liste blanche de `ProjectedView` (D69) ne s'ouvre qu'à `detail[].categoryId` et `final.decimals` ; un test de forme le tient (Task 2).
- **Vue projetée** : ses composants ne reçoivent jamais la `Session`, seulement la `ProjectedView` (D69, D77). Ils sont rendus aussi dans le canevas réduit de l'aperçu : seuils en container queries (`@min-[40rem]:`), jamais en `sm:` / `lg:` (CONVENTIONS § Vue de session thémée).
- **Arborescence (D59)** : aucun import entre features (`pnpm deps` vert). Ce qui sert au passage et à la projection, ou à l'entraînement, va dans `src/components/`. Les seuls changements dans `src/domain/` sont ceux de la Task 2.
- **Couleurs** : uniquement des tokens et `--category-color`. Teinte de catégorie (D103) : fond `color-mix(… 10%, var(--color-card))`, bordure `color-mix(… 35%, transparent)`, tuile d'icône à 16 %. Sans couleur de catégorie, la teinte retombe sur `--color-muted-foreground`. Statuts d'étudiant : « en cours » en `text-link` sur `bg-primary/15`, « terminé » en `text-space-training` sur `bg-space-training/15`, « à passer » et « absent » en `text-muted-foreground` sur `bg-muted`.
- **Typo** : titres de section en `text-h3` (16 px) ou `text-h2` (20 px), libellés en `text-label` capitales `text-muted-foreground`, chiffres en `tabular-nums`, textes secondaires en `text-small text-muted-foreground`.
- **Notes formatées selon la config partout (D103)** : brute et maximum de barème par `formatRawScore` (jusqu'à 3 décimales, sans zéro final), convertie, finale et ajustement par les décimales du pas d'arrondi (`formatScore(…, 'final', …)`, ou `formatFixed` côté projection). Plus aucun `Intl.NumberFormat` à 2 décimales max dans `components/projection/`.
- **Libellés** : FR et EN évoluent ensemble. Chaque nouvelle clé entre dans `UiMessageParams`, les deux dictionnaires et `SAMPLE` de `ui-messages.test.ts` ; une clé qui n'est plus lue est supprimée. Un libellé court visible garde le libellé long en `aria-label`, qui contient le texte visible (WCAG 2.5.3).
- **`useUi()` une fois par page**, `ui` en prop ensuite ; sous `SessionAppearance`, dans l'enfant (langue de la config). Les composants de projection gardent leur propre `useUi()`.
- **Briques partagées avec l'entraînement** : `CategoryTile`, `categoryTileButtonProps` et `ScaleButtons` prennent leur nouvelle forme dès ce ticket, écrans d'entraînement compris ; leur version propre relève de #151.
- **Tests (D102)** : un test de forme (libellé, structure, rôle) s'adapte, page objects e2e compris (`e2e/pages/examiner-page.ts`, `present-page.ts`, et `e2e/screenshots/guide.spec.ts` qui doit encore tourner) ; un test de comportement qui casse signale une régression.
- Commits gitmoji en français sur `feat/f44-refonte-ui`, PR #154 toujours en brouillon (D102).

## Disposition des tuiles : D74 partout *(décision de l'utilisateur)*

Les artboards montrent 4 catégories sur une ligne ; la règle actuelle (D74) est conservée sur les trois grilles (tirage de l'examinateur, « Choisissez une catégorie » projeté, rangée compacte pendant une question), et les artboards sont corrigés (Task 12). La règle, toujours rendue par `CategoryLayout` :
- `categoryRows(n)` : 1 ligne si `n ≤ 3`, 2 si `n ≤ 10`, 3 au-delà ; les `n mod r` premières lignes comptent `⌈n/r⌉` tuiles, les autres `⌊n/r⌋` (4 → 2 + 2, 5 → 3 + 2, 7 → 4 + 3, 13 → 5 + 4 + 4) ;
- une seule `<ul>` en grille de `2c` colonnes, chaque tuile sur deux ; la première tuile d'une ligne courte démarre à la colonne 2, ce qui la centre ;
- toutes les catégories comptent, épuisées comprises : la disposition ne bouge pas pendant un passage ;
- une seule colonne sous 40rem de conteneur (container query, pour l'aperçu réduit).

## Review Focus

1. **Commentaire sorti du tiroir** : il passe dans la colonne de droite de la page. Changer d'étudiant (liste, « Étudiant suivant », ajout avec « faire passer ») doit toujours enregistrer la frappe en attente sur l'étudiant qu'on quitte, et un brouillon restauré après rechargement doit toujours l'emporter. Le champ reste monté avec `key={student.id}` sur l'étudiant actif ; il s'affiche aussi pour un étudiant absent ou terminé. Tests dans la Task 6.
2. **Barre de progression avec des questions passées** : un skip ne remplit aucun segment, une question en cours remplit la moitié du segment suivant, un étudiant terminé remplit tous ses segments, et le total vient de `questionsPerStudent`, même quand des catégories sont épuisées. Le nom accessible décrit chaque segment rempli. Tests dans la Task 4.
3. **Note projetée selon l'arrondi** : un pas de 0,5 donne « 11,5 », un pas de 0,01 « 11,50 », un pas de 1 « 12 », en anglais « 11.50 » ; le score brut garde jusqu'à 3 décimales sans zéro final. Tests dans les Tasks 2 et 11.
4. **Thème d'une session** : avec un `theme.dark.primary` dans la config, le halo de la carte « Note », celui de « Étudiant suivant », le dégradé des actions et la barre active du menu suivent la couleur de la config, sur le passage comme sur la projection. Test e2e dans la Task 12.
5. **Téléphone à 390 px** : en-tête (titre, progression, score, « Panneau ») passé à la ligne, la carte « Note » juste sous la question, tiroir en pleine largeur, aucun défilement horizontal (mesure élément par élément, HANDOFF F44.6). Test e2e dans la Task 12.

---

### Task 1: Tuile teintée, tuiles de tirage, barème et halo autour

**Files:**
- Create : `src/components/category-badge.tsx` (+ test)
- Modify : `src/components/category-tile.tsx` (+ Create `category-tile.test.tsx`), `src/components/scale-buttons.tsx` (+ Create `scale-buttons.test.tsx`), `src/components/action-halo.tsx` (+ test), `src/features/create-session/components/config-preview.tsx`, `src/features/session/components/category-grid.tsx`

**Interfaces:**
- Produces :
  - `CategoryBadge({ color, icon, size, className }: { color?: string; icon?: string; size: 'sm' | 'md' | 'lg' | 'xl' | 'projection-sm' | 'projection-lg'; className?: string })` : `span aria-hidden` carré, `--category-color` posé en style si `color`, fond `bg-[color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_16%,transparent)]`, icône `text-[var(--category-color,var(--color-muted-foreground))]`. `CategoryIcon` si `icon`, sinon un point `bg-current` du tiers de la taille. Tailles (boîte / rayon / icône) : `sm` 28 px / `rounded-sm` / 16 ; `md` 32 / `rounded-[10px]` / 18 ; `lg` 36 / `rounded-md` / 20 ; `xl` 40 / `rounded-md` / 22 ; `projection-sm` 44 / `rounded-md` / 26 ; `projection-lg` 72 / `rounded-[18px]` / 40.
  - `categoryTileButtonProps(category)` garde sa signature ; classes de la tuile de tirage (artboard `passage-question`) : `flex h-full min-h-32 w-full flex-col items-start gap-2.5 rounded-xl border p-4 text-left whitespace-normal`, bordure `border-[color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_35%,transparent)]`, fond `bg-[color-mix(in_oklch,var(--category-color,var(--color-muted-foreground))_10%,var(--color-card))]`, `aria-disabled:cursor-not-allowed aria-disabled:opacity-45 disabled:opacity-45`. Le `variant="outline"` du bouton ne doit plus imposer sa bordure ni son fond : le préfixe `dark:` est répété comme aujourd'hui.
  - `CategoryTile` : `CategoryBadge size="xl"`, libellé `text-base font-bold`, puis le maximum `passage_category_max` en `mt-auto text-small font-semibold tabular-nums text-[var(--category-color,var(--color-muted-foreground))]`.
  - `ScaleButtons` garde ses props ; conteneur `grid grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] gap-2` ; chaque bouton `h-16 rounded-md border bg-background text-[1.375rem] leading-none font-bold tabular-nums` (variant `outline`), nom accessible inchangé (`passage_score_button`).
  - `ActionHalo` accepte `side: 'start' | 'end' | 'around'`. `around` (carte « Note », artboard `passage-question`) : enveloppe `relative isolate` pleine largeur (pas `self-start`), décor `-inset-8` en `bg-[radial-gradient(closest-side,var(--color-halo-action),var(--color-halo-action)_55%,transparent)]`.

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `category-badge.test.tsx` : `test('icône teintée par la couleur de la catégorie')` (style `--category-color: #a78bfa`, `aria-hidden`) ; `test('sans icône : un point')` ; `test('sans couleur : aucun style, teinte neutre')`.
  - `category-tile.test.tsx` : `test('tuile : libellé, maximum en points, badge')` → `Normal`, `2 pts` ; `test('bouton teinté : accent posé, classes de teinte')` → `style` porte `--category-color`, `className` contient `min-h-32` et `rounded-xl`.
  - `scale-buttons.test.tsx` : `test('un bouton par valeur, formaté en français, nom « Noter 0,5 »')` ; `test('grille qui s'adapte au nombre de valeurs')` (classe `grid`).
  - `action-halo.test.tsx` : ajouter `test('autour : décor sur les quatre côtés, enveloppe pleine largeur')` → décor `-inset-8`, enveloppe sans `self-start`.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/components/category-badge.test.tsx src/components/category-tile.test.tsx src/components/scale-buttons.test.tsx src/components/action-halo.test.tsx`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter** les quatre briques. `config-preview.tsx` remplace son `TILE_CLASS` par `CategoryBadge size="sm"`. `category-grid.tsx` garde `CategoryLayout` (D74, voir « Disposition des tuiles ») avec `gap-3`.

- [ ] **Step 4 : Relancer** les quatre fichiers, puis `pnpm vitest run src/features/session src/features/training src/features/create-session`. Attendu : PASS ; un test de forme de l'entraînement qui cassait s'adapte.

- [ ] **Step 5 : Commit** `💄 Teinte les tuiles de catégorie et pose le barème en grille`.

---

### Task 2: Vue projetée : catégorie du détail et décimales de la note

**Files:**
- Modify : `src/domain/presentation/projected-view.ts` (+ test), `src/domain/scoring/format.ts` (+ test)

**Interfaces:**
- Produces :
  - `ProjectedStudentView['detail'][number]` gagne `categoryId: string` (après `questionId`).
  - `ProjectedStudentView['final']` devient `{ raw?: number; final?: number; scale: number; decimals: number }`, `decimals = stepDecimals(stepMilli(config))`.
  - `formatFixed(value: Milli, decimals: number, locale: Locale): string` dans `format.ts` ; la branche `final` de `formatScore` l'appelle (aucun changement de sortie).

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `projected-view.test.ts` :
    - `test('détail : catégorie de chaque question')` → `detail.map((row) => row.categoryId)` vaut les catégories des tentatives notées et passées, dans l'ordre.
    - `test('note finale : décimales du pas d'arrondi')` → pas de 0,5 : `decimals` 1 ; 0,01 : 2 ; 1 : 0.
    - Le test de liste blanche existant (clés exactes de la vue) ajoute `categoryId` et `decimals`, rien d'autre ; s'il n'existe pas, l'écrire : `Object.keys(view.detail[0]).toSorted()` vaut `['categoryId', 'categoryLabel', 'maxPoints', 'points', 'questionId', 'skipped', 'title']`, et `Object.keys(view.final).toSorted()` vaut `['decimals', 'final', 'raw', 'scale']` en `finalScoreDisplay: 'both'`.
  - `format.test.ts` : `test('formatFixed : décimales imposées')` → `formatFixed(11500, 2, 'fr')` vaut `11,50`, `formatFixed(11500, 0, 'en')` vaut `12`.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/domain/presentation src/domain/scoring`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter** dans `detailOf` et `finalOf` (champ par champ, sans spread de la config, D69) et dans `format.ts`. Commentaire de `ProjectedView` : citer D103 pour les deux champs.

- [ ] **Step 4 : Relancer**, puis `pnpm typecheck`. Attendu : PASS.

- [ ] **Step 5 : Commit** `✨ Projette la catégorie du détail et les décimales de la note finale`.

---

### Task 3: Jauge de note

**Files:**
- Create : `src/components/score-gauge.tsx` (+ test)

**Interfaces:**
- Produces : `ScoreGauge({ ratio, size, label, children }: { ratio: number | undefined; size: 'md' | 'lg'; label: string; children: ReactNode })`.
  - `div role="img" aria-label={label}`, `relative`, largeur `md` 320 px / `lg` 600 px (`max-w-full`).
  - SVG `aria-hidden` de demi-cercle, `viewBox` et tracé des artboards : `md` `0 0 320 182`, arc `M20 170 A140 140 0 0 1 300 170`, trait 16 ; `lg` `0 0 600 300`, arc `M30 285 A270 270 0 0 1 570 285`, trait 30. Piste en `stroke-muted`, arc rempli en dégradé `primary` → `action-to` (`<linearGradient>` avec `stop-color` en `var(--color-primary)` et `var(--color-action-to)`, id unique par `useId`), `stroke-linecap="round"`, longueur par `pathLength="100"` et `strokeDasharray={`${pct} 100`}`.
  - `ratio` borné à [0, 1] ; `undefined` : aucun arc rempli.
  - `children` posé en bas, centré (`absolute inset-x-0 bottom-0 flex flex-col items-center`).

- [ ] **Step 1 : Écrire les tests qui échouent** :
  - `test('nom accessible et contenu')` → `getByRole('img', { name: 'Note finale : 11,50 sur 20' })` contient `11,50` ;
  - `test('arc rempli au prorata, borné')` → `ratio 0.575` donne `stroke-dasharray` `57.5 100` ; `1.4` donne `100 100` ; `-1` donne `0 100` ;
  - `test('sans note : pas d'arc rempli')`.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/components/score-gauge.test.tsx`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.**

- [ ] **Step 4 : Relancer.** Attendu : PASS.

- [ ] **Step 5 : Commit** `✨ Ajoute la jauge de note`.

---

### Task 4: En-tête du passage

**Files:**
- Create : `src/features/session/passage-segments.ts` (+ test), `src/features/session/components/passage-progress.tsx` (+ test), `src/features/session/components/passage-header-stats.tsx`
- Modify : `src/features/session/components/examiner-view.tsx` (+ `examiner-view.test.tsx`), `src/lib/i18n/ui-messages.ts` (+ test)
- Delete : `src/features/session/components/passage-meta.tsx`

**Interfaces:**
- Produces :
  - `type PassageSegment = { state: 'scored' | 'pending' | 'todo'; categoryId?: string; categoryLabel?: string; color?: string }` ; `passageSegments(student: Student, config: NormalizedConfig): PassageSegment[]` : les tentatives `scored` dans l'ordre, puis la `pending`, puis des `todo` jusqu'à `questionsPerStudent`. Les `skipped` n'occupent aucun segment. Tronqué à `questionsPerStudent`.
  - `PassageProgress({ ui, config, student })` : `div role="img"` nommé par `passage_progress_label`, puis `<b>` `passage_question_number` et ` / {total}` en `text-small`, puis la barre `flex gap-1` de segments `h-1.5 flex-1 rounded-full bg-muted` remplis à 100 % (`scored`), 50 % (`pending`) ou 0 en `bg-[var(--category-color,var(--color-primary))]`, `min-w-45`.
  - `PassageHeaderStats({ ui, config, student, standing })` : pendant le passage (`todo` / `in_progress`), `PassageProgress` puis le score (`passage_raw_score_label` en `text-small text-muted-foreground`, valeur en `text-h2 font-bold tabular-nums` suivie de `attempt_out_of` avec `formatRawScore(toMilli(config.scoring.maxRawScore))` en `text-small`) ; terminé, une pastille `passage_done_title` (`IconCheck`, `h-7 rounded-sm px-2.5 text-small font-semibold text-space-training bg-space-training/15`) ; absent ou sans étudiant, rien.
  - `ExaminerView` : `title` = `` `${student.lastName} ${student.firstName}` `` (le titre de l'oral sans étudiant actif) ; plus de `meta` ; `actions` = `PassageHeaderStats` puis le bouton « Panneau » (`IconLayoutSidebarRight`, `size="lg"`, `aria-haspopup="dialog"`).
- Clés i18n (barrées : supprimées) :

| Clé | FR | EN |
|---|---|---|
| `passage_question_number` `{ current }` | `Question 2` | `Question 2` |
| `passage_progress_label` `{ current, total, detail }` | `Question 2 sur 3 : Facile notée, Normal en cours` (sans ` : …` si `detail` vide) | `Question 2 of 3: Easy scored, Normal in progress` |
| `passage_progress_scored` `{ category }` | `Facile notée` | `Easy scored` |
| `passage_progress_pending` `{ category }` | `Normal en cours` | `Normal in progress` |
| `passage_raw_score_label` | `Score brut` | `Raw score` |
| ~~`passage_question_index`, `passage_raw_score`~~ | | |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `passage-segments.test.ts` :
    - `test('notées, puis en cours, puis à venir')` → 1 notée, 1 en cours, total 3 : états `['scored', 'pending', 'todo']`, catégories reportées ;
    - `test('une question passée n'occupe aucun segment')` ;
    - `test('terminé : tous les segments remplis')` ;
    - `test('aucune tentative : tout à venir')`.
  - `passage-progress.test.tsx` : `test('nom accessible : segments remplis décrits')` → `Question 2 sur 3 : Facile notée, Normal en cours` ; `test('premier tirage pas encore fait')` → `Question 1 sur 3`.
  - `examiner-view.test.tsx` : `h1` = nom de l'étudiant ; score `1` et `/ 10` dans l'en-tête ; étudiant terminé : pastille « Passage terminé », ni progression ni score ; aucun étudiant : `h1` = titre de l'oral.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/session src/lib/i18n`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter**, supprimer `PassageMeta` et les deux clés.

- [ ] **Step 4 : Relancer**, puis `pnpm typecheck`. Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Met l'étudiant en titre du passage, avec sa progression segmentée`.

---

### Task 5: Question en carte et « Tirage suivant »

**Files:**
- Modify : `src/features/session/components/question-panel.tsx`, `src/features/session/components/category-grid.tsx`, `src/features/session/components/passage-body.tsx`, `src/components/markdown/code-block.tsx`, leurs tests (`examiner-view.test.tsx`, `skip.test.tsx`, `code-block.test.tsx`), `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `CategoryBadge` (Task 1).
- Produces :
  - `QuestionPanel` ne rend plus que la question : `section aria-label={present_prompt_label}` en carte (`rounded-lg bg-card p-7 shadow-card flex flex-col gap-5 wrap-anywhere`) ; en-tête `CategoryBadge size="md"`, libellé `font-semibold`, ` · ` et `passage_category_max` en `text-small text-muted-foreground` ; titre en `h2 text-h2`, énoncé `Markdown` ; `details key={attempt.id}` en `border-t pt-1`, `summary` `h-10 text-sm font-semibold`, contenu en `text-muted-foreground`. Ses props `onScore`, `onSkip`, `skipsRemaining` partent dans la carte « Note » (Task 6).
  - `CategoryGrid` est enveloppé dans `section aria-labelledby` : `h2` `passage_draw_title` en `text-h3`, puis, seulement pendant une question, `passage_draw_hint` en `text-small text-muted-foreground`. La liste garde son nom `passage_categories` (page object `draw`).
  - `PassageBody` garde son aiguillage par statut, mais ne rend plus que la colonne de gauche ; la Task 6 pose la droite.
- Clés i18n :

| Clé | FR | EN |
|---|---|---|
| `passage_draw_title` | `Tirage suivant` | `Next draw` |
| `passage_draw_hint` | `Disponible une fois la question notée` | `Available once the question is scored` |

- [ ] **Step 1 : Écrire les tests qui échouent** dans `examiner-view.test.tsx` :
  - `test('question en carte : catégorie et points, titre, énoncé, éléments de réponse repliés')` ;
  - `test('« Tirage suivant » : indice pendant une question, tuiles désactivées')` ;
  - `test('entre deux questions : pas d'indice, tuiles actives')` ;
  - le test existant « éléments de réponse repliés à chaque question » (D28) passe sans changement.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/session`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.** Étiquette de langage (nouveau, retenu) : `CodeBlock` (`src/components/markdown/code-block.tsx`) affiche le langage normalisé en haut à droite (`absolute top-2.5 right-3.5 font-mono text-label font-normal text-muted-foreground`, conteneur `relative`) quand il est connu et non « texte brut », sauf en `size="projection"` (artboard `projection-question` : pas d'étiquette). Test dans `code-block.test.tsx` : `test('étiquette du langage, absente en projection et sans langage')`.

- [ ] **Step 4 : Relancer.** Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Présente la question en carte et le tirage suivant en tuiles`.

---

### Task 6: Colonne de droite : vue projetée, note, commentaire

**Files:**
- Create : `src/features/session/components/score-card.tsx` (+ test), `src/features/session/components/comment-card.tsx`
- Modify : `src/features/session/components/examiner-view.tsx`, `projection-preview.tsx`, `projection-controls.tsx`, `projection-banner.tsx`, `skip-button.tsx`, `comment-field.tsx`, `absent-button.tsx`, `absent-state.tsx`, `student-tab.tsx`, leurs tests (`projection.test.tsx`, `skip.test.tsx`, `student-tab.test.tsx`, `examiner-view.test.tsx`), `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `ActionHalo side="around"`, `ScaleButtons` (Task 1) ; `QuestionPanel` allégé (Task 5).
- Produces :
  - **Disposition** (`ExaminerView`) : grille `flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_25rem] lg:grid-rows-[auto_1fr] lg:items-start`, trois enfants : la question ou l'état (col. 1, rang. 1), la colonne de droite (col. 2, `row-span-2`), « Tirage suivant » ou l'écran final (col. 1, rang. 2). Dans la colonne de droite (`flex flex-col gap-4`), la carte « Note » porte `order-first lg:order-none` : sur téléphone, question, note, vue projetée, commentaire, puis tirage.
  - **Vue projetée** (`ProjectionPreview`) : carte `rounded-lg bg-card p-5 shadow-card gap-3`, en-tête `h2 text-h3` et « Ouvrir » en `variant="ghost" size="sm"` (`IconExternalLink`, visible `projection_open_short`, nom `projection_open`) ; `notice` et `ProjectionCanvas` inchangés.
  - **Bascule** (`ProjectionControls`) : `div role="group" aria-label={projection_group}` en `flex gap-1 rounded-md bg-muted p-1`, deux boutons `flex-1 h-8 rounded-[9px] text-small font-semibold`, le pressé en `bg-card shadow-card text-foreground`, l'autre `text-muted-foreground` transparent. « Cet étudiant » (`IconDeviceDesktop`, visible `projection_project_short`, nom `projection_project`) : `aria-pressed` = étudiant actif projeté, `disabled` dans ce cas, sans étudiant actif ou pendant une écriture (comme aujourd'hui). « Écran d'attente » (`IconPlayerPause`) : `aria-pressed` = mode `waiting`, `disabled` dans ce cas.
  - **Bandeau** (`ProjectionBanner`) : sous la bascule, forme seule (`rounded-md bg-muted px-3 py-2 text-small`).
  - **Carte « Note »** : `ScoreCard({ ui, config, attempt, disabled, skipsRemaining, onScore, onSkip })`, rendue seulement s'il y a une question en cours, dans `ActionHalo side="around"`. `section aria-label={passage_score_card}` en carte `p-6 gap-4` : `h2 text-h2` `passage_score_heading` et, à droite, `passage_score_context` en `text-small text-muted-foreground` ; `ScaleButtons` ; pied `border-t pt-3 flex flex-wrap items-center justify-between gap-2` avec `SkipButton` puis `passage_skips_remaining`.
  - **`SkipButton`** : `variant="ghost" size="sm"`, `IconPlayerSkipForward`, libellé `passage_skip_label` (le compteur sort du bouton) ; quota atteint : même `aria-disabled` + infobulle + `aria-describedby` qu'aujourd'hui. Rien si `skips.enabled` est faux (et pas de compteur).
  - **Carte commentaire** : `CommentCard({ ui, sessionId, student, disabled, onSave, onSetAbsent })` en carte `p-5 gap-2.5` : en-tête `label` `text-small font-semibold` et statut à droite (`IconCheck` + `comment_saved`, ou `comment_saving`, `comment_error` en `text-destructive`, en `text-label font-normal text-muted-foreground`) ; `Textarea` `min-h-21` ; `AbsentButton` en `variant="ghost" size="sm" self-start -ml-2`. Montée avec `key={student.id}` pour tout étudiant actif (en cours, à passer, absent, terminé). `CommentField` garde sa logique (brouillon, `useAutosave`, annonce `aria-live`) et prend la nouvelle disposition.
  - **`StudentTab`** perd `commentSlot` et `absentSlot`.
  - **`AbsentState`** : le corps devient `passage_absent_body` réécrit, le bouton « Afficher le panneau » ouvre l'onglet « Liste » (choisir un autre étudiant).
- Clés i18n (barrées : supprimées) :

| Clé | FR | EN |
|---|---|---|
| `projection_open_short` | `Ouvrir` | `Open` |
| `projection_project_short` | `Cet étudiant` | `This student` |
| `projection_group` | `Projection` | `Projection` |
| `projection_waiting` (inchangée) | `Écran d’attente` | |
| `passage_score_card` | `Noter la question` | `Score the question` |
| `passage_score_context` `{ category, max }` | `Normal, sur 2` | `Normal, out of 2` |
| `passage_skip_label` | `Passer la question` | `Skip the question` |
| `passage_skips_remaining` `{ remaining }` | `2 passes restantes` / `1 passe restante` / `Aucune passe restante` | `2 skips left` / `1 skip left` / `No skips left` |
| `passage_absent_body` (texte changé) | `Marquez-le présent pour le faire passer, ou choisissez un autre étudiant.` | `Mark them present to examine them, or choose another student.` |
| ~~`passage_skip_button`~~ | | |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `score-card.test.tsx` : `test('note en un clic : « Noter 1 » appelle onScore et rien n'est sélectionné')` ; `test('contexte « Normal, sur 2 » et passes restantes')` ; `test('skips désactivés : ni bouton ni compteur')` ; `test('quota atteint : bouton aria-disabled, motif décrit, clic sans effet')`.
  - `projection.test.tsx` : `test('bascule : « Cet étudiant » pressé et désactivé quand l'actif est projeté')` ; `test('« Écran d'attente » pressé en attente')` ; les tests de pilotage existants passent en visant les noms longs.
  - `examiner-view.test.tsx` :
    - `test('commentaire visible sur la page, sans ouvrir le panneau')` ;
    - `test('changer d'étudiant enregistre le commentaire en cours sur l'étudiant quitté')` (Review Focus 1 : frappe, sélection d'un autre étudiant dans « Liste », `onSave` reçu avec l'id du premier) ;
    - `test('étudiant absent : « Marquer présent » sur la page')` ;
    - `test('étudiant terminé : commentaire présent, pas de carte « Note »')`.
  - `student-tab.test.tsx` : retirer les assertions sur le commentaire et l'absence.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/session src/lib/i18n`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.**

- [ ] **Step 4 : Relancer**, puis `pnpm typecheck`. Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Range la vue projetée, la note et le commentaire dans la colonne de droite`.

---

### Task 7: Panneau latéral

**Files:**
- Create : `src/features/session/components/student-status-pill.tsx` (+ test)
- Modify : `src/features/session/components/side-panel.tsx`, `students-tab.tsx`, `student-row.tsx`, `student-tab.tsx`, `attempt-list.tsx`, `score-list.tsx`, `add-student-dialog.tsx` (déclencheur seul), `examiner-view.tsx`, leurs tests (`side-panel.test.tsx`, `students-tab.test.tsx`, `student-tab.test.tsx`, `add-student.test.tsx`), `src/lib/i18n/ui-messages.ts` (+ test), `e2e/pages/examiner-page.ts`

**Interfaces:**
- Consumes : `CategoryBadge` (Task 1), `sessionProgress` (`domain/session/progress.ts`).
- Produces :
  - `StudentStatusPill({ ui, status, size })` : `span` `inline-flex h-5.5 items-center gap-1.5 rounded-sm px-2 text-label font-semibold`, point de 6 px `bg-current`, couleurs de « Global Constraints », texte `STATUS_KEY`.
  - **`SidePanel`** : nouvelle prop `title: string` (le nom de la session) et `footer: ReactNode`. `SheetContent` en `bg-popover p-6 gap-5`, largeur `data-[side=right]:w-full data-[side=right]:sm:max-w-110`. En-tête : sur-titre `side_panel_label` en `text-label` capitales, puis `SheetTitle` = `title` en `text-h2` ; fermeture `ghost` `icon` inchangée. Alerte d'erreur fraîche inchangée. Onglets en bascule (`TabsList` `rounded-md bg-muted p-1`, déclencheurs `h-9 flex-1 rounded-[9px] text-sm font-semibold`, actif `bg-card shadow-card`) nommés par `side_panel_label` (`aria-label` du `TabsList`). Pied commun aux deux onglets : `footer` dans `flex flex-wrap gap-2 border-t pt-4`.
  - **Onglet « Liste »** (`StudentsTab`, `actionsSlot` retiré) : ligne `flex items-center justify-between` avec `students_summary` en `text-small text-muted-foreground tabular-nums`, puis le déclencheur d'`AddStudentDialog` en `variant="secondary" size="sm"`, visible `students_add_short`, nom `students_add`. Liste `-mx-1 flex flex-col gap-0.5`.
  - **Ligne** (`StudentRow`) : bouton `flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2.5 text-left` ; actif `bg-accent shadow-[inset_0_0_0_1px_var(--color-primary)]` ; colonne nom (`truncate`, `font-semibold` si actif sinon `font-medium`) + icône projeté (`IconDeviceDesktop` `role="img"` nommée `students_projected`) au-dessus de `StudentStatusPill` ; à droite les notes en `text-sm tabular-nums whitespace-nowrap`, `font-semibold text-foreground` si terminé, sinon `text-muted-foreground`. Bouton d'absence compact inchangé.
  - **Onglet « Cet étudiant »** : ligne nom (`text-lg font-semibold`) et `StudentStatusPill` ; section `student_tab_questions` (titre `h3 text-label` capitales `mb-2`), `AttemptList` en `variant="panel"` ; section `student_tab_totals` : `dl` à deux lignes séparées par `border-t`, `final_raw` = brute `/ max brut`, `final_final` = finale `/ échelle` ou `score_not_computed`.
  - **`AttemptList`** gagne `variant: 'panel' | 'final'` (défaut `panel`) ; ligne `panel` : rang (`w-3.5 text-small text-muted-foreground`, « – » pour une passée), `CategoryBadge size="md"`, titre `font-semibold` au-dessus du libellé de catégorie `text-small text-muted-foreground`, puis à droite le `<select>` (`h-9 rounded-[10px] border-input bg-background px-2 text-sm font-semibold tabular-nums`, `aria-label` inchangé) et `/ max`, ou `attempt_pending` / `final_skipped_reason` en `text-small font-semibold text-muted-foreground`. La variante `final` est posée en Task 8.
  - **`ScoreList`** n'est plus utilisée par le panneau (elle sert l'écran final, Task 8).
  - Pied passé par `ExaminerView` : lien « Statistiques » et `ExportButton`, tous deux en `secondary` `size="sm"`. `ExportButton` gagne `variant?: 'outline' | 'secondary'` et `size?: 'default' | 'sm'` (défauts actuels : `outline`, `default`).
- Clés i18n (barrées : supprimées) :

| Clé | FR | EN |
|---|---|---|
| `side_panel_label` (texte changé) | `Panneau` | `Panel` |
| `side_panel_tab_student` (texte changé) | `Cet étudiant` | `This student` |
| `side_panel_tab_students` (texte changé) | `Liste` | `List` |
| `students_summary` `{ total, done, absent }` | `10 étudiants · 1 terminé · 1 absent` (pluriels) | `10 students · 1 done · 1 absent` |
| `students_add_short` | `Ajouter` | `Add` |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `student-status-pill.test.tsx` : un test par statut (texte et classe de couleur).
  - `side-panel.test.tsx` : `test('titre : nom de la session sous « Panneau »')` (`getByRole('dialog', { name: 'Oral de démonstration' })`) ; `test('pied commun aux deux onglets')` ; le test « erreur fraîche » passe sans changement.
  - `students-tab.test.tsx` : `test('résumé « 3 étudiants · 1 terminé · 1 absent »')` ; `test('« Ajouter » nommé « Ajouter un étudiant »')` ; `test('ligne : statut en pastille, notes « brute · finale »')`.
  - `student-tab.test.tsx` : `test('totaux : note brute sur le maximum, note finale ou « — »')` ; le test de correction d'une note (`editScore`) passe sans changement.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/session src/lib/i18n`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.** Le page object e2e `examiner-page.ts` vise le tiroir par `page.getByRole('dialog').filter({ has: page.getByRole('tablist', { name: 'Panneau' }) })` et les onglets `Cet étudiant` / `Liste` ; `setComment` et `typeCommentWithoutSaving` écrivent dans le champ de la page, sans ouvrir le tiroir ; `commentSaved` vise le statut de la carte commentaire.

- [ ] **Step 4 : Relancer**, puis `pnpm typecheck`. Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Restyle le panneau du passage : « Cet étudiant » et « Liste »`.

---

### Task 8: Écran final du passage

**Files:**
- Modify : `src/features/session/components/final-screen.tsx`, `attempt-list.tsx`, `score-list.tsx`, leurs tests (`final-screen.test.tsx`, `adjustment.test.tsx`), `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `ScoreGauge size="md"` (Task 3), `ActionHalo side="start"`, `AttemptList` (Task 7).
- Produces :
  - **Carte « Note finale »** : `section aria-label={final_scores_heading}` en carte `p-7` ; en-tête `text-label` capitales `final_final` et « Ajuster la note » en `ghost size="sm"` (`IconAdjustments`) ; corps `flex flex-wrap items-center justify-center gap-x-10 gap-y-6` : `ScoreGauge` (`ratio = final / finalScale`, nom `final_gauge_label`, contenu : valeur en `text-score-xl tabular-nums` et `final_gauge_scale` en `text-small text-muted-foreground`, « — » sans note calculable) puis `ScoreList` en `variant="final"`.
  - **`ScoreList`** `variant="final"` : quatre lignes `flex items-baseline justify-between gap-3 border-b py-2`, `dt` `text-muted-foreground`, `dd` `font-medium tabular-nums text-right` : brute `/ max brut`, plafonnée, convertie, ajustement signé avec la justification en dessous (`block text-small font-normal text-muted-foreground`), ou `final_no_adjustment`. La note finale est dans la jauge, pas dans la liste.
  - **Carte « Détail du passage »** : `h2 text-h3` `final_detail_heading` et « Réinitialiser l'étudiant » en `ghost size="sm"` `text-destructive` (`IconRotate`) ; `AttemptList variant="final"` : rang (`w-4`, « – » pour une passée), `CategoryBadge size="lg"` (à 60 % d'opacité pour une passée), titre `font-semibold` (`text-muted-foreground` si passée) sur `catégorie` ou `catégorie · motif` ; à droite, colonne `w-24 items-end gap-1.5` : `points / max` en `font-bold tabular-nums` et barre `h-1.5 rounded-full bg-muted` remplie au prorata en `bg-[var(--category-color,var(--color-primary))]` (`aria-hidden`), ou une pastille `final_skipped` (`h-6 rounded-full bg-muted px-2.5 text-label text-muted-foreground`).
  - **Actions** : `ActionHalo side="start"` autour de « Étudiant suivant » (`IconArrowRight`, variante par défaut) puis `ExportButton` en `outline` ; `final_no_next` dessous comme aujourd'hui.
- Clés i18n :

| Clé | FR | EN |
|---|---|---|
| `final_adjust` (texte changé) | `Ajuster la note` | `Adjust the grade` |
| `final_gauge_label` `{ value, scale }` | `Note finale : 11,50 sur 20` | `Final grade: 11.50 out of 20` |
| `final_gauge_scale` `{ scale }` | `sur 20` | `out of 20` |

- [ ] **Step 1 : Écrire les tests qui échouent** dans `final-screen.test.tsx` :
  - `test('jauge : note finale formatée selon l'arrondi, nom accessible')` ;
  - `test('liste : brute sur le maximum, plafonnée, convertie, ajustement et justification')` ;
  - `test('détail : points sur le maximum et barre ; question passée avec son motif, hors rang')` ;
  - `test('note non calculable : « — » dans la jauge')` ;
  - les tests existants d'ajustement auto-ouvert (D66), de réinitialisation et de « Tous les étudiants sont passés » passent en visant les nouveaux noms.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/session src/lib/i18n`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.**

- [ ] **Step 4 : Relancer.** Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Présente la note finale en jauge et le détail du passage en barres`.

---

### Task 9: Dialogues de session

**Files:**
- Modify : `src/features/session/components/add-student-dialog.tsx`, `adjustment-dialog.tsx`, `skip-dialog.tsx`, `reset-dialog.tsx`, `confirm-write-dialog.tsx`, leurs tests (`add-student.test.tsx`, `adjustment.test.tsx`, `skip.test.tsx`), `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Produces (artboard `session-dialogues`, « une action engageante par dialogue, Annuler en texte seul ») :
  - Les cinq dialogues : « Annuler » en `variant="ghost"`. `AddStudentDialog` passe `showCloseButton={false}` et ajoute ce « Annuler » en tête du pied (avant « Ajouter et faire passer » et « Ajouter »).
  - Doublon d'ajout : `output` gardé (ce n'est pas une erreur), avec `IconAlertTriangle` de 16 px, `flex items-start gap-2 text-small text-muted-foreground`.
  - Échecs d'écriture (`write_error`, ajout, ajustement, confirmations) : `p role="alert"` `flex items-start gap-2 text-small text-destructive` avec `IconCircleX`.
  - **Ajustement** : la valeur s'affiche signée et aux décimales des notes finales (`+0,50`, `−0,25`, `0,00`) à l'ouverture et après « − » / « + » ; la saisie libre reste acceptée telle quelle (`parseAdjustmentInput` accepte déjà `+`). L'aperçu se découpe en trois `span` : `adjust_preview_sum` (`11,00 + 0,50 =`) en `text-muted-foreground`, la finale en `text-score-md tabular-nums`, `attempt_out_of` en `text-muted-foreground`, puis `adjust_clamped` s'il y a lieu ; le `p aria-live` englobe le tout.
  - **Skip** : le motif choisi porte `IconCheck` ; le champ « Autre motif » prend `placeholder={passage_skip_placeholder}`.
- Clés i18n (barrées : supprimées) :

| Clé | FR | EN |
|---|---|---|
| `adjust_preview_sum` `{ converted, sign, adjustment }` | `11,00 + 0,50 =` | `11.00 + 0.50 =` |
| `passage_skip_placeholder` | `Précisez` | `Specify` |
| ~~`adjust_preview`~~ | | |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `adjustment.test.tsx` : `test('valeur signée aux décimales des notes finales')` → ouverture sur un ajustement de 0,5 avec un pas de 0,01 : `+0,50` ; « − » deux fois avec un pas de 0,25 depuis 0 : `−0,50` ; `test('aperçu découpé : somme, finale, échelle')`.
  - `add-student.test.tsx` : `test('pas de croix, « Annuler » ferme sans écrire')`.
  - `skip.test.tsx` : `test('« Autre motif » : placeholder « Précisez »')`.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/session src/lib/i18n`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.** Le signe affiché est `+` ou le moins typographique `−` (comme `signedAdjustment` de `score-list.tsx`) ; `0` s'affiche sans signe.

- [ ] **Step 4 : Relancer.** Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Aligne les dialogues de session sur le design system`.

---

### Task 10: Projection : en-tête, tuiles, question, tirage

**Files:**
- Modify : `src/components/projection/student-screen.tsx`, `category-tiles.tsx`, `draw-reveal.tsx`, `projected-screen.tsx`, leurs tests, `src/features/present/present-page.test.tsx`, `src/lib/i18n/ui-messages.ts` (+ test), `e2e/pages/present-page.ts`
- Create : `src/components/projection/projection-header.tsx` (+ test)

**Interfaces:**
- Consumes : `CategoryBadge` (Task 1), `formatRawScore`.
- Produces (tailles en px du canevas de 1280, valables dans l'aperçu réduit) :
  - **Écran étudiant** : `flex h-full flex-col gap-6 px-16 py-12` (container query : `p-6` sous 40rem).
  - **`ProjectionHeader({ ui, view })`** : `header flex items-end justify-between gap-8 pr-14` (place du bouton plein écran) ; à gauche `examTitle` en `text-[1.375rem] font-medium text-muted-foreground` au-dessus du nom (`h1` `text-[4rem] leading-none font-extrabold tracking-[-0.03em]`, « Prénom Nom » comme aujourd'hui) ; à droite, pendant le passage, un `dl flex gap-4` de cartes `min-w-37 rounded-lg bg-card px-5.5 py-3.5 shadow-card` (`dt` `text-sm font-semibold uppercase tracking-[.06em] text-muted-foreground`, `dd` `text-[2.5rem] font-bold tabular-nums`) : `present_question_label` = `{current} / {total}`, puis `present_score_label` = `formatRawScore(toMilli(cumulativeRaw))` si `cumulativeRaw` est défini. Passage terminé : à la place, la pastille `present_finished` (`IconCheck` `text-space-training`, `h-13 rounded-full bg-card px-5.5 text-[1.375rem] font-semibold text-muted-foreground shadow-card`).
  - **`CategoryTiles`** gagne `variant: 'grid' | 'row'`. `grid` (aucune question en cours) : `section` avec `h2` `present_choose_category` (`text-2xl font-semibold text-muted-foreground`) puis `CategoryLayout` (D74) de tuiles `min-h-55 flex-col items-start gap-4 rounded-xl border-[1.5px] p-7` teintées (constantes de teinte de la Task 1), `CategoryBadge size="projection-lg"`, libellé `text-4xl font-extrabold`, points en `mt-auto text-[1.625rem] font-bold` couleur de catégorie. `row` (question en cours) : `CategoryLayout` (D74) nommé `present_categories`, `gap-4`, tuiles `h-18 items-center gap-3 rounded-lg border-[1.5px] px-4`, `CategoryBadge size="projection-sm"`, libellé `text-[1.375rem] font-bold whitespace-nowrap truncate`, points `ml-auto text-lg font-bold`. Tuile courante : `aria-current="true"`, bordure de 2 px pleine `border-[var(--category-color,var(--color-primary))]`, fond à 18 % ; les autres à `opacity-45`. Les états `exhausted` / `unavailable` gardent leur libellé (`present_category_exhausted`, `present_category_unavailable`) en `text-base text-muted-foreground`, à `opacity-45`.
  - **Question** : `section aria-label={present_prompt_label}` en `flex-1 min-h-0 flex flex-col gap-4.5 rounded-xl border-[1.5px] px-11 py-8`, bordure à 35 %, fond à 8 % de la couleur ; en-tête `CategoryIcon` de 26 px si la catégorie a une icône, puis `libellé · points` (`libellé` seul sans `maxPoints`) en `text-lg font-bold uppercase tracking-[.06em]` couleur de catégorie ; `Markdown size="projection"`.
  - **`DrawReveal`** : trois cartes `h-70 w-50 rounded-xl border-[1.5px]` teintées à 12 % / bordure 45 % de la couleur, avec un carré `size-18 rounded-[22px]` en dégradé `from-primary to-action-to` au centre ; la carte du milieu `border-[var(--category-color,…)]`. Durée, ordre et fondu en mouvement réduit inchangés ; les `@keyframes` de `draw-card` gardent leur nom.
- Clés i18n (barrées : supprimées) :

| Clé | FR | EN |
|---|---|---|
| `present_question_label` | `Question` | `Question` |
| `present_score_label` | `Score` | `Score` |
| `present_choose_category` | `Choisissez une catégorie` | `Choose a category` |
| `present_categories` | `Catégories` | `Categories` |
| ~~`present_question_index`, `present_cumulative`~~ | | |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `projection-header.test.tsx` : `test('cartes Question et Score')` → `getByRole('term')` `Question`, `Score`, définitions `2 / 3`, `1,5` ; `test('sans score cumulé : carte Question seule')` ; `test('terminé : pastille « Passage terminé », sans cartes')`.
  - `category-tiles.test.tsx` : `test('grille : consigne « Choisissez une catégorie »')` ; `test('rangée : catégorie courante marquée, autres atténuées')` (`aria-current`, `opacity-45`) ; les tests d'états existants (`exhausted`, `unavailable`) passent.
  - `present-page.test.tsx` : l'énoncé reste dans `region` « Question en cours » ; aucun titre de question dans la fenêtre (test D103 : le titre de la question tirée n'apparaît pas dans `main`).
  - `draw-reveal.test.tsx` : les tests existants (mélange, fondu, montage sans animation) passent sans changement.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/components/projection src/features/present src/lib/i18n`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.** Le page object `present-page.ts` lit l'index dans la carte : `questionIndex = page.getByRole('definition').filter({ hasText: /^\d+ \/ \d+$/ })`, et `present.spec.ts` attend `1 / 3`, `2 / 3`.

- [ ] **Step 4 : Relancer**, puis `pnpm typecheck`. Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Projette l'étudiant avec ses cartes, la rangée des catégories et la question teintée`.

---

### Task 11: Projection : écran final, attente, commandes et halos

**Files:**
- Modify : `src/components/projection/final-card.tsx` (+ test), `waiting-screen.tsx`, `student-screen.tsx`, `projected-screen.tsx` (+ test), `src/features/present/components/present-controls.tsx` (+ test), `src/lib/i18n/ui-messages.ts` (+ test)
- Create : `src/components/projection/projection-halos.tsx`

**Interfaces:**
- Consumes : `ScoreGauge size="lg"` (Task 3), `formatFixed`, `final.decimals`, `detail[].categoryId` (Task 2), `CategoryBadge`.
- Produces :
  - **`FinalCard`** (plus de tuiles de catégorie sur l'écran final, la `StudentScreen` ne rend plus `CategoryTiles` quand `final` est défini) :
    - `final.final` défini : `ScoreGauge size="lg"`, `ratio = final / scale`, nom `present_gauge_label`, contenu `present_note_label` (`text-[1.5625rem] font-semibold uppercase tracking-[.08em] text-muted-foreground`) puis valeur `formatFixed(toMilli(final), decimals)` en `text-[7.75rem] leading-none font-extrabold tabular-nums` et `/ {scale}` en `text-5xl font-bold text-muted-foreground`.
    - `final.raw` défini : `present_raw_label` puis la brute en `b` (`formatRawScore`), `text-[2rem] text-muted-foreground` ; sous la jauge, ou seule en grand (`text-[7.75rem]`) si `final.final` est absent.
    - `detail` défini : mise en page à deux colonnes (`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-16` au-dessus de 40rem, sinon une colonne) : jauge à gauche, à droite `section aria-labelledby` avec `h2` `present_detail_heading` et une liste dont chaque ligne porte `CategoryBadge size="projection-sm"` (couleur et icône lues dans `view.categories` par `categoryId`), `catégorie · titre` (catégorie en `text-muted-foreground`), et `points / max` (`formatRawScore`) ou `present_skipped`.
  - **Finie, note pas encore révélée** : en-tête avec la pastille (Task 10), `CategoryTiles variant="grid"` sans consigne (toutes « Indisponible »), rien d'autre.
  - **`WaitingScreen`** : trois points (`size-3.5 rounded-full` en `bg-primary`, `bg-action-to`, `bg-muted`), titre `text-[7rem] leading-[6.75rem] font-extrabold tracking-[-0.035em]`, message `text-4xl font-medium text-muted-foreground` ; marque en bas à gauche (`absolute bottom-9 left-12`, carré `size-5.5 rounded-[7px]` en dégradé et `menu_brand` (« Questionator Z-4000 ») en `text-[0.9375rem] font-semibold text-muted-foreground`).
  - **`ProjectionHalos({ placement })`** : deux halos `aria-hidden` flous (`halo-action` et `halo-cool`) posés en absolu sous le contenu (`-z-10`, racine `relative isolate overflow-hidden`), positions des artboards : `waiting` (centre et bas droite), `student` (haut gauche et bas droite), `final` (centre et haut droite). Rendu par `ProjectedScreen`, donc aussi dans l'aperçu.
  - **`PresentControls`** : bouton plein écran `size-11 rounded-md border bg-card text-muted-foreground`, `title={present_fullscreen_hint}`, `aria-label` inchangé ; position `top-6 right-6` ; disparition après 3 s inchangée.
- Clés i18n (barrées : supprimées) :

| Clé | FR | EN |
|---|---|---|
| `present_note_label` | `Note` | `Grade` |
| `present_gauge_label` `{ value, scale }` | `Note : 11,50 sur 20` | `Grade: 11.50 out of 20` |
| `present_raw_label` | `Score brut` | `Raw score` |
| `present_detail_heading` | `Détail par question` | `Question by question` |
| `present_fullscreen_hint` | `Plein écran (les commandes s'effacent après 3 s)` | `Full screen (controls fade after 3 s)` |
| ~~`present_final`, `present_raw`~~ | | |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `final-card.test.tsx` :
    - `test('note selon l'arrondi : pas de 0,01 → « 11,50 », pas de 1 → « 12 »')` (Review Focus 3, avec `decimals` 2 puis 0) ;
    - `test('en anglais : « 11.50 »')` ;
    - `test('score brut : jusqu'à 3 décimales, sans zéro final')` → `5,5` ;
    - `test('brute seule (finalScoreDisplay raw) : en grand, sans jauge')` ;
    - `test('détail : badge de la catégorie, points, « Passée »')` ;
    - `test('rien à afficher : « Passage terminé »')` (test existant).
  - `projected-screen.test.tsx` : `test('écran final : pas de tuiles de catégorie')` ; `test('fini sans note révélée : tuiles indisponibles, pas de consigne')` ; `test('attente : titre, message, marque')`.
  - `present-controls.test.tsx` : le bouton porte `title` ; les tests de disparition passent.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/components/projection src/features/present src/lib/i18n`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.**

- [ ] **Step 4 : Relancer**, puis `pnpm typecheck` et `pnpm deps`. Attendu : PASS.

- [ ] **Step 5 : Commit** `💄 Projette la note finale en jauge, l'écran d'attente et les halos`.

---

### Task 12: Thème de session, e2e, captures, canevas et mémoire

**Files:**
- Modify : `e2e/appearance.spec.ts`, `e2e/present.spec.ts`, `e2e/long-words.spec.ts` (si besoin), `e2e/screenshots/guide.spec.ts`, `e2e/pages/*.ts` touchés
- Create : `e2e/passage-layout.spec.ts`
- Modify (mémoire) : `docs/DECISIONS.md` (D108), `docs/INDEX.md`, `docs/HANDOFF.md`, `docs/QUIRKS.md`, `docs/BACKLOG.md`, `docs/CONVENTIONS.md`, corps de la PR #154 (section #149)

**Interfaces:**
- Consumes : tout ce qui précède.

- [ ] **Step 1 : Écrire les e2e qui échouent.**
  - `appearance.spec.ts`, `test('thème de session : halos du passage et de la projection dérivés de theme.dark.primary')` : config `primary-only` (helper existant `primaryButtonBackground`), tirer une question ; le `background-image` du décor de la carte « Note » (`[aria-label="Noter la question"]` puis son halo frère) diffère de celui d'une session au thème par défaut ; même mesure sur un halo de la vue projetée ouverte ; le dégradé de « Étudiant suivant » diffère aussi (Review Focus 4).
  - `passage-layout.spec.ts` :
    - `test('390 px : aucun débordement, note sous la question')` : `page.setViewportSize({ width: 390, height: 844 })`, tirer une question ; chaque élément visible de `main` a `getBoundingClientRect().right <= 390` ; la carte « Noter la question » est au-dessus de « Tirage suivant » ; le tiroir ouvert fait 390 px de large (Review Focus 5).
    - `test('1280 px : note dans la colonne de droite, sous la vue projetée')`.
  - `present.spec.ts` : l'index se lit dans la carte (`1 / 3`), la note finale s'affiche avec les décimales de la config d'exemple.

- [ ] **Step 2 : Lancer** `pnpm e2e`. Attendu : FAIL sur les nouveaux tests, puis corriger ce qui casse sur la forme dans les autres spécifications.

- [ ] **Step 3 : Captures et comparaison.** Config Playwright jetable dans `.superpowers/sdd/2026-10-17-f44-7-passage-projection/cap/` (spec `*.pw.ts`, `testMatch`, `locale: 'fr-FR'`, HANDOFF F44.6) : `passage-question`, `passage-panneau`, `passage-panneau-etudiant`, `passage-note-finale`, `passage-question-theme`, les six écrans de projection à 1280 × 800, et `passage-question` à 390 px. Comparer à chaque artboard ; corriger le code, ou mettre l'artboard à jour quand l'écart est voulu (disposition D74 des tuiles sur `passage-question`, `passage-panneau`, `passage-question-theme`, `projection-tuiles`, `projection-tirage`, `projection-question`, cartes 1280 × 720 de l'aperçu, états non maquettés). Publier le canevas (`read` sur l'URL seule avant la publication, QUIRKS 2026-10-17).

- [ ] **Step 4 : Vérification complète** : `pnpm check` (tests, lint, typecheck, deps, budgets) et `pnpm e2e`. Attendu : tout vert. Noter le nombre de tests.

- [ ] **Step 5 : Mémoire.**
  - **D108** : colonne de droite du passage (note, commentaire et absence sortis du tiroir), panneau à pied commun, totaux réduits à brute et finale dans « Cet étudiant », `final.decimals` et `detail[].categoryId` (D69 élargie), D74 maintenue sur les trois grilles malgré les artboards (décision de l'utilisateur), libellés renommés (`Panneau`, `Cet étudiant`, `Liste`).
  - **CONVENTIONS** : § Page examinateur (grille à deux colonnes avec carte qui remonte sur téléphone, `CategoryBadge`, `ScoreGauge`, `ActionHalo side="around"`), § Vue de session thémée (projection : `formatFixed` et `final.decimals`, jamais `Intl` à décimales fixes).
  - **INDEX** (ligne F44.7), **HANDOFF** (entrée datée aux quatre marqueurs), **QUIRKS** et **BACKLOG** selon ce que l'exécution révèle.
  - Corps de la PR #154 : section #149 (contexte, changements, tests, captures).

- [ ] **Step 6 : Commits** `✅ Vérifie le thème de session et la disposition du passage en e2e`, puis `📝 Consigne F44.7 dans la mémoire (D108, conventions, journal)`.
