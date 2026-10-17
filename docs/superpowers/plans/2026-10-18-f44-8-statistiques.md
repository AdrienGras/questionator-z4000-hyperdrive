# F44.8 — Statistiques de session et d'entraînement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/session/$sessionId/stats` et `/training/$trainingId/stats` suivent leurs trois artboards validés (#150) : synthèse avec barre empilée, histogramme dessiné en barres, anneaux de réussite, barres de taux, libellés de catégorie colorés, état vide global des stats de session. Aucun calcul de statistiques ne change, et les chiffres restent ceux d'avant sur les données de démonstration.

**Architecture:** On restyle sur place dans `features/stats` et `features/training-stats`. Les briques servies aux deux écrans vont dans `src/components/stats/` : `StatsSection` / `StatsTable` restylés, `CategoryLabel` (remonté de `features/stats`), `MeterBar` (barre horizontale), `RateRing` (anneau de taux avec valeur au centre), `StatsEmptyState` (état vide en carte). L'histogramme devient un dessin en `div` (`HistogramBars`), décrit par une phrase pour les lecteurs d'écran. Recharts, qui ne servait plus qu'à lui, sort du projet. Seul ajout hors features : l'export de `formatBound` dans `domain/stats/labels.ts`.

**Tech Stack:** React 19, TanStack Router (routage par hash), Tailwind CSS v4, icônes Tabler, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (D102), carte des écrans `docs/superpowers/specs/2026-10-17-f44-carte-des-ecrans.md` (§ Statistiques ; D103), ticket #150. Maquettes du canevas <https://claude.ai/artifact/DvvtZZb9ie2vknoXtHfnJL>, page « Après » : `statistiques`, `stats-vide`, `entrainement-stats`. Design system <https://claude.ai/artifact/DMYaQZGYtm8RnJqbBMmBcy>. Lecture des artboards : `Artifact` `read` avec `paths: ["project/apres/<nom>.dc.html"]`, puis extraire `<main>…</main>` et retirer les `<svg>` (HANDOFF F44.6, Notes pour future Claude).

## Global Constraints

- **Canevas avant l'interface (D102)** : les artboards sont validés (D103). Un écart d'implémentation met l'artboard à jour dans la même PR (Task 6). **Le code fait foi pour tout état que la maquette ne montre pas**, restylé avec les briques du design system : messages vides par bloc (`stats_*_empty`, `training_stats_review_empty`), bloc « Par notion » absent sans tag, états sans base / introuvable / endommagé (`DbStatusBanner`, `SessionFallback`, `DamagedSessionScreen`, `TrainingGate`), erreurs de route (`StatsError`, `TrainingStatsError`), état vide des stats d'entraînement.
- **Mêmes chiffres qu'avant (critère d'acceptation)** : aucun changement dans `computeStats`, `computeTrainingStats` ni leurs types. Formats conservés : moyenne, médiane, écart-type et moyenne d'ajustement par `formatDecimal` (2 décimales) ; min, max et somme d'ajustement par `formatScore(…, 'final', …)` ; taux de session par `formatRate` (0 à 1 décimale : « 83,3 % » reste « 83,3 % », même si l'artboard arrondit) ; taux d'entraînement par `formatPercent` (entier) ; dernière note par `formatLastScore`.
- **Comportements conservés (D103)** : tags de session dans l'ordre de la config ; détail des stats d'entraînement trié « à revoir » en tête puis ordre de la config ; « Détail des N questions » **replié par défaut** (`<details>` natif, chevron dessiné de `index.css`), l'artboard le montre ouvert pour l'illustrer ; une question ou une catégorie absente de la config garde sa ligne, sous son id, sans couleur.
- **État vide global (D103)** : seulement quand **aucun étudiant n'a de tentative** (`session.students.every((s) => s.attempts.length === 0)`). Dès qu'une question est tirée, la page normale s'affiche avec ses messages vides par bloc.
- **Perdu volontairement (D103)** : infobulle, axe Y et grille de l'histogramme, tableau `sr-only` de l'histogramme. Recharts sort des dépendances (`pnpm remove recharts`), avec `src/components/ui/chart.tsx`.
- **Accessibilité** : oxlint refuse `role="img"`. Un dessin (anneau, barre, histogramme, barre empilée) est `aria-hidden`, et son sens passe par un texte : phrase `sr-only` (anneau, histogramme) ou texte visible voisin (barres de taux, légende de la barre empilée, couverture). Plus aucune barre `Progress` nommée sur ces écrans.
- **Arborescence (D59)** : aucun import entre features (`pnpm deps` vert). Ce qui sert aux deux écrans va dans `src/components/stats/`. Le dictionnaire de l'export (`domain/export/messages.ts`) et le classeur Excel ne changent pas.
- **Couleurs** : uniquement des tokens et `--category-color` (posé en style par le composant qui connaît la catégorie). Repli sans couleur : `--color-muted-foreground` (D103). Libellé de catégorie : `text-[var(--category-color,var(--color-muted-foreground))]`. Barre empilée : passés `bg-primary`, en cours `bg-foreground`, à passer `bg-border`, absents `bg-input`, piste `bg-muted`. Pastille de stratégie : fond `color-mix(… 14%, transparent)`. Statut « À revoir » : `border-destructive text-destructive`, icône du titre `text-destructive`.
- **Typo** : intertitres de groupe (« Synthèse », « Détail », « Chiffres clés ») en `text-label` capitales `text-muted-foreground` ; titres de carte en `text-h2` (20 px) ou `text-h3` (16 px) ; grands chiffres en `text-score-md tabular-nums` ; textes secondaires en `text-small text-muted-foreground` ; en-têtes de colonne en `text-label` capitales `text-muted-foreground`.
- **Libellés** : FR et EN évoluent ensemble. Chaque nouvelle clé entre dans `UiMessageParams`, les deux dictionnaires et `SAMPLE` de `ui-messages.test.ts` ; une clé qui n'est plus lue est supprimée. Pluriels par `plural` (FR, singulier jusqu'à 1) et `pluralEn` (EN, singulier à 1 seulement).
- **`useUi()` une fois par page**, sous `SessionAppearance` dans l'enfant (`StatsView`, langue de la config) ; `ui` en prop ensuite.
- **Tests (D102)** : un test de forme (libellé, structure, rôle) s'adapte, page objects e2e compris (`e2e/pages/stats-page.ts`, `training-stats-page.ts`, et `e2e/screenshots/guide.spec.ts`, `offline.spec.ts`, `stats.spec.ts` qui doivent encore tourner) ; un test de comportement qui casse signale une régression.
- Commits gitmoji en français sur `feat/f44-refonte-ui`, PR #154 toujours en brouillon (D102).

## Review Focus

1. **Tirages sans aucun terminé** : un étudiant en cours avec une question notée. La page normale s'affiche (pas l'état vide) ; « Notes finales » montre « Aucun étudiant n'a terminé. » à la place du dessin, ses chiffres en « — » ; la synthèse affiche Moyenne et Médiane en « — » **sans** « / 20 » ; l'anneau d'une catégorie sans note notée montre la piste seule et « — ». Tests dans les Tasks 2 et 3.
2. **Catégorie sans couleur ou absente de la config** : libellé, arc, barre et pastille retombent sur `--color-muted-foreground` ; une catégorie inconnue s'affiche sous son id, sans icône. Tests dans la Task 1.
3. **Barème final autre que 20** (`finalScale` 10, 2,5 ou 100) : le suffixe devient « / 10 », « / 2,5 », « / 100 » ; l'axe montre 0, ¼, ½, ¾ et le maximum (« 0 · 25 · 50 · 75 · 100 », « 0 · 0,625 · 1,25 · 1,875 · 2,5 ») ; la phrase de l'histogramme reprend les bornes de `formatBound`. Tests dans la Task 3.
4. **Taux hors de [0 ; 1]** (barème à points négatifs) : le texte montre la valeur telle quelle (« −12,5 % »), l'arc et la barre sont bornés (vides sous 0, pleins au-dessus de 1). Tests dans la Task 1.
5. **Téléphone à 390 px, 13 catégories, titres longs** : cartes l'une sous l'autre, tableaux défilant dans leur carte (`overflow-x-auto`), titres coupés (`wrap-anywhere`), aucun défilement horizontal de la page (mesure élément par élément, HANDOFF F44.6). Test e2e dans la Task 6.

---

### Task 1: Briques partagées des statistiques

**Files:**
- Modify : `src/components/stats/stats-section.tsx`, `src/components/stats/stats-empty.tsx`
- Move : `src/features/stats/components/category-label.tsx` → `src/components/stats/category-label.tsx` (imports mis à jour dans `features/stats`)
- Create : `src/components/stats/meter-bar.tsx`, `src/components/stats/rate-ring.tsx`, `src/components/stats/stats-empty-state.tsx`
- Test : `src/components/stats/stats-section.test.tsx`, `category-label.test.tsx`, `meter-bar.test.tsx`, `rate-ring.test.tsx`, `stats-empty-state.test.tsx` (tous créés)
- Modify : `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Produces :
  - `StatsSection({ title, as, size, hideTitle, icon, aside, className, children }: { title: string; as?: 'h2' | 'h3'; size?: 'h2' | 'h3'; hideTitle?: boolean; icon?: ReactNode; aside?: ReactNode; className?: string; children: (headingId: string) => ReactNode })` : `section aria-labelledby` en carte, `flex flex-col gap-4 rounded-lg bg-card p-6 text-card-foreground shadow-card` ; titre de niveau `as` (défaut `h2`), classe `text-h2` ou `text-h3` selon `size` (défaut : `as`), `sr-only` si `hideTitle`. `icon` (avant le titre) et `aside` (après, `ml-auto`) partagent sa ligne `flex items-center gap-2.5`. Plus de `Card` / `CardHeader` à l'intérieur.
  - `StatsGroup({ title, children }: { title: string; children: ReactNode })` (même fichier) : `section aria-labelledby` sans carte, `flex flex-col gap-4`, titre `h2` en `text-label uppercase text-muted-foreground` (« Synthèse », « Détail », « Chiffres clés »).
  - `StatsTable` garde ses props. En-têtes `pb-2 text-label uppercase text-muted-foreground`, `pr-3 last:pr-0`, à droite si `numeric`. Une colonne accepte `srOnly?: boolean` (libellé en `sr-only`, colonne « Part » et barre des tags). Constantes : `CELL = 'border-t py-3 pr-3 align-middle last:pr-0'`, `NUMERIC_CELL = \`${CELL} text-right font-semibold tabular-nums whitespace-nowrap\``, `ROW_HEADER = \`${CELL} text-left font-medium\``.
  - `StatsEmpty` inchangé (phrase `text-muted-foreground` d'un bloc).
  - `CategoryLabel({ config, categoryId, className }: { config: NormalizedConfig; categoryId: string; className?: string })` : `inline-flex items-center gap-1.5 text-small font-semibold whitespace-nowrap` teinté par `--category-color`, `CategoryIcon size-4` si la catégorie a une icône ; catégorie inconnue : son id, `text-muted-foreground`, sans icône. Le liseré gauche disparaît.
  - `MeterBar({ value, tone, color, gradient, className }: { value: number | null; tone: 'primary' | 'category'; color?: string; gradient?: boolean; className?: string })` : `span aria-hidden` piste `block h-1.5 overflow-hidden rounded-full bg-muted`, remplissage `rounded-full` de largeur `clamp(value, 0, 1) × 100 %`. `tone="primary"` : `bg-primary`, ou `bg-linear-90 from-primary to-action-to` si `gradient` (couverture d'entraînement). `tone="category"` : `bg-[var(--category-color,var(--color-muted-foreground))]`, `--category-color` posé si `color`. `value === null` : piste seule. La largeur (`w-22`, `w-24`, `w-16`, `w-full`) et la hauteur `h-2` viennent de `className`.
  - `RateRing({ rate, value, label, caption, color, className }: { rate: number | null; value: string; label: string; caption: string; color?: string; className?: string })` : `span relative inline-flex shrink-0` de taille `className` (`size-26` session, `size-24` entraînement) ; `span sr-only` = `label` ; SVG `aria-hidden` `viewBox="0 0 140 140"` `-rotate-90`, piste `r=58 strokeWidth=12 stroke-muted`, arc `strokeLinecap="round"` `strokeDasharray="{clamp(rate)×C} {C}"` (C = 2π·58) en `stroke-[var(--category-color,var(--color-muted-foreground))]`, absent si `rate === null` ; au centre, `aria-hidden`, `value` en `text-[1.375rem] font-bold tabular-nums` puis `caption` en `text-label font-normal text-muted-foreground`.
  - `StatsEmptyState({ title, body, action }: { title?: string; body: string; action: ReactNode })` : section (`aria-labelledby` sur le titre s'il existe) centrée `relative isolate overflow-hidden flex flex-col items-center gap-4 rounded-xl bg-card px-8 py-16 text-center shadow-card`, halo d'en-tête `aria-hidden` (`-top-38 left-1/2 h-95 w-140 -translate-x-1/2` en `bg-[radial-gradient(closest-side,var(--color-halo-action),transparent)] blur-sm`), tuile `size-14 rounded-md bg-muted text-muted-foreground` avec `IconChartBar size-7`, titre `h2 text-[1.375rem] font-bold`, corps `max-w-110 text-muted-foreground`, puis `action` (un `Link` en `buttonVariants()` posé par l'appelant, `mt-2`).
  - Clés : `rate_ring_label: { label: string; rate: string }` (« Réussite {label} : {rate} » / « {label} success: {rate} »), `rate_ring_caption: NoParams` (« réussite » / « success »).

- [ ] **Step 1: Écrire les tests qui échouent**

`meter-bar.test.tsx` : `value 0.25` → le remplissage a `style.width === '25%'` ; `value -0.1` → `'0%'` ; `value 1.4` → `'100%'` (Review Focus 4) ; `value null` → aucun remplissage ; le nœud racine a `aria-hidden="true"` ; `tone="category" color="#21d3ee"` pose `--category-color: #21d3ee` ; `tone="category"` sans `color` → aucun `--category-color`, classe de repli `var(--color-muted-foreground)` (Review Focus 2) ; `tone="primary"` → `bg-primary`.

`rate-ring.test.tsx` : `rate 0.833, value '83,3 %', label 'Réussite Facile : 83,3 %'` → `getByText('Réussite Facile : 83,3 %')` a la classe `sr-only` ; deux `circle`, l'arc a `stroke-dasharray` commençant par `(0.833 * 2 * Math.PI * 58).toString()` à 0,1 près ; `rate null, value '—'` → un seul `circle`, `—` affiché ; `rate -0.2, value '−20 %'` → arc de longueur 0 ; `rate 1.3` → arc égal à la circonférence.

`category-label.test.tsx` : catégorie colorée avec icône → `--category-color` posé, une icône rendue, texte = libellé ; catégorie sans couleur → aucun `--category-color` ; id inconnu → texte = l'id, classe `text-muted-foreground`.

`stats-section.test.tsx` : `StatsSection` `as="h3" size="h2"` → `getByRole('region', { name })` existe, `getByRole('heading', { level: 3 })` a la classe `text-h2` ; `StatsGroup` → `heading level 2` en `text-label` ; `StatsTable` avec une colonne `srOnly` → son `columnheader` contient un `span.sr-only`.

`stats-empty-state.test.tsx` : avec titre → `getByRole('region', { name: titre })`, corps et action rendus ; sans titre → pas de `heading`, corps et action rendus.

- [ ] **Step 2: Vérifier l'échec**

Run : `rtk vitest run src/components/stats`
Expected : FAIL (modules `meter-bar`, `rate-ring`, `stats-empty-state`, `category-label` introuvables sous `components/stats`).

- [ ] **Step 3: Implémenter les cinq briques, déplacer `CategoryLabel`, ajouter les deux clés**

`git mv` pour `category-label.tsx` ; mettre à jour ses imports dans `features/stats/components/*`. `StatsSection` restylé garde son contrat `children(headingId)` : les écrans existants continuent de compiler.

- [ ] **Step 4: Vérifier**

Run : `rtk vitest run src/components/stats src/features/stats src/features/training-stats src/lib/i18n && rtk tsc`
Expected : PASS (les tests de page qui visaient `Card` ou le liseré s'adaptent ici s'il le faut, sans toucher à leurs assertions de chiffres).

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/stats src/features/stats src/lib/i18n
rtk git commit -m "💄 Ajoute les briques partagées des statistiques (anneau, barre, état vide)"
```

---

### Task 2: Stats de session — en-tête, état vide global et synthèse

**Files:**
- Modify : `src/features/stats/components/stats-view.tsx`, `src/features/stats/components/headcount-card.tsx` (→ renommé `synthesis-card.tsx`), `src/lib/i18n/ui-messages.ts` (+ test)
- Test : `src/features/stats/stats-page.test.tsx`, Create `src/features/stats/components/synthesis-card.test.tsx`

**Interfaces:**
- Consumes : `StatsGroup`, `StatsSection` (`hideTitle`), `StatsEmptyState`, `formatDecimal`.
- Produces :
  - `formatBound(value: number, locale: Locale): string` exporté de `src/domain/stats/labels.ts` (jusqu'à 3 décimales, corps inchangé) ; test dans `labels.test.ts` : `formatBound(0.625, 'fr') === '0,625'`, `formatBound(20, 'en') === '20'`.
  - `StatsView` : `PageShell` avec `title={session.name}`, `back` = `BackLink` « Retour au passage » (inchangé), `meta` = `[text('stats_kicker'), exam.title, exam.subject, exam.cohort]` sans les `undefined`, joints par « · ». Si aucun étudiant n'a de tentative : `StatsEmptyState` (titre `stats_empty_title`, corps `stats_empty_body`, action `Link` vers `/session/$sessionId` en `buttonVariants()` libellé `stats_empty_action`) et rien d'autre. Sinon : `StatsGroup` « Synthèse » (Tasks 2 et 3), `StatsGroup` « Détail » (Task 4).
  - `SynthesisCard({ ui, config, headcount, grades }: { ui: Ui; config: NormalizedConfig; headcount: Headcount; grades: GradeStats })` : `StatsSection` `as="h3" hideTitle` titre `stats_headcount` (« Chiffres clés »), gap 20 px :
    - `dl flex flex-wrap gap-x-6 gap-y-5`, cinq `div flex-[1_1_8.75rem]` : `dt text-small text-muted-foreground`, `dd text-score-md tabular-nums`. Étudiants (`total`), Passés (`done`), Absents (`absent`), Moyenne (`formatDecimal(grades.mean)`), Médiane (`formatDecimal(grades.median)`). Moyenne et médiane non nulles suivies de `span text-body font-semibold tracking-normal text-muted-foreground` « / {formatBound(config.scoring.finalScale)} » (avec l'espace insécable de `stats_out_of`).
    - Barre empilée `aria-hidden` `flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted` : un segment par statut non nul, dans l'ordre passés, en cours, à passer, absents, largeur `count / total × 100 %`, couleurs des Global Constraints.
    - Légende `ul flex flex-wrap gap-x-5 gap-y-2 text-small text-muted-foreground tabular-nums` : quatre `li` avec pastille `size-2.5 rounded-[3px]` (mêmes couleurs) et `stats_legend_done` / `_in_progress` / `_todo` / `_absent`, puis `li ml-auto` `stats_legend_added` sans pastille.
  - Clés (FR / EN) :
    - `stats_kicker` : « Statistiques » / « Statistics » ;
    - `stats_out_of: { max: string }` : « / {max} » / « / {max} » ;
    - `stats_empty_title` : « Pas encore de statistiques » / « No statistics yet » ;
    - `stats_empty_body` : « Aucune question tirée pour l’instant. Les chiffres apparaissent dès le premier tirage. » / « No question drawn yet. The figures appear with the first draw. » ;
    - `stats_empty_action` : « Aller au passage » / « Go to the exam » ;
    - `stats_synthesis` : « Synthèse » / « Overview » ;
    - `stats_legend_done: { count }` : « {n} passé(s) » / « {n} done » ; `stats_legend_in_progress: { count }` : « {n} en cours » / « {n} in progress » ; `stats_legend_todo: { count }` : « {n} à passer » / « {n} not started » ; `stats_legend_absent: { count }` : « {n} absent(s) » / « {n} absent » ; `stats_legend_added: { count }` : « {n} ajouté(s) en séance » / « {n} added during the session » ;
    - valeurs modifiées : `stats_headcount` « Chiffres clés » / « Key figures », `stats_headcount_done` « Passés » / « Done » ;
    - supprimées : `stats_headcount_in_progress`, `stats_headcount_todo`, `stats_headcount_added` (remplacées par la légende).

- [ ] **Step 1: Écrire les tests qui échouent**

`synthesis-card.test.tsx` (headcount `{ total: 10, done: 7, inProgress: 0, todo: 2, absent: 1, addedDuringSession: 0 }`, mean 13.0714, median 13, `finalScale` 20, `fr`) :
- le `dd` qui suit chaque `dt` (visé par son texte) : « Étudiants » → `10`, « Passés » → `7`, « Absents » → `1`, « Moyenne » → `13,07 / 20` (texte normalisé), « Médiane » → `13,00 / 20` ;
- trois segments dans la barre (en cours vaut 0) de largeurs `70%`, `20%`, `10%` ;
- légende : `7 passés`, `0 en cours`, `2 à passer`, `1 absent`, `0 ajouté en séance` ;
- mean et median `null` → `—` sans « / 20 » (Review Focus 1) ;
- `finalScale` 2,5 → « / 2,5 » (Review Focus 3).

`stats-page.test.tsx` :
- nouveau : session dont aucun étudiant n'a de tentative → `getByRole('heading', { name: 'Pas encore de statistiques' })`, lien « Aller au passage » vers `#/session/<id>`, aucune région « Synthèse » ;
- nouveau : un étudiant en cours avec une question notée → région « Synthèse » présente, « Aucun étudiant n'a terminé. » affiché (Review Focus 1) ;
- nouveau : sous-titre « Statistiques · <titre> · <matière> · <promotion> » ; sans matière ni promotion, « Statistiques · <titre> » ;
- adaptés : les tests qui visaient « Effectifs » / « Terminés » visent « Chiffres clés » / « Passés ». Les tests existants dont la session n'a aucune tentative reçoivent une tentative, sauf ceux qui testent l'état vide.

- [ ] **Step 2: Vérifier l'échec**

Run : `rtk vitest run src/features/stats`
Expected : FAIL (`synthesis-card` introuvable, état vide absent).

- [ ] **Step 3: Implémenter `SynthesisCard`, l'état vide et le sous-titre dans `StatsView` ; clés FR / EN**

- [ ] **Step 4: Vérifier**

Run : `rtk vitest run src/features/stats src/domain/stats/labels.test.ts src/lib/i18n && rtk tsc`
Expected : PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/features/stats src/components/stats src/lib/i18n src/domain/stats
rtk git commit -m "💄 Restyle la synthèse des statistiques et ajoute l'état vide global"
```

---

### Task 3: Stats de session — notes finales et réussite par catégorie, sans Recharts

**Files:**
- Create : `src/features/stats/components/grades-card.tsx` (réécrit : histogramme et chiffres), `src/features/stats/components/histogram-bars.tsx`, `src/features/stats/components/category-rings.tsx`
- Delete : `src/features/stats/components/histogram-chart.tsx`, `histogram-table.tsx`, `adjustment-card.tsx`, `category-table.tsx`, `histogram.test.tsx` ; `src/components/ui/chart.tsx` ; dépendance `recharts`
- Modify : `src/domain/stats/labels.ts` (`binTick` supprimé s'il n'est plus lu), `src/features/stats/components/stats-view.tsx`, `src/lib/i18n/ui-messages.ts` (+ test)
- Test : Create `histogram-bars.test.tsx`, `grades-card.test.tsx`, `category-rings.test.tsx`

**Interfaces:**
- Consumes : `StatsSection`, `StatsEmpty`, `RateRing`, `CategoryLabel`, `formatRate`, `formatDecimal`, `formatScore`, `formatBound` (Task 2).
- Produces :
  - `HistogramBars({ ui, bins, finalScale, count }: { ui: Ui; bins: HistogramBin[]; finalScale: number; count: number })` : `p sr-only` = `stats_histogram_aria` avec `count` et la liste des barres **non vides** jointes par « , » (`stats_histogram_bin` avec `count`, `from`, `to` formatés par `formatBound`) ; dessin `aria-hidden` : zone `flex h-54 items-end gap-1 border-b` d'une colonne `flex-1 flex-col items-center justify-end gap-1` par barre : barre non vide = effectif `text-label tabular-nums` puis barre `w-full rounded-t-[6px] rounded-b-[2px] bg-primary` de hauteur `count / max × 10.5rem` ; barre vide = trait `h-[3px] w-full rounded-[2px] bg-muted`. Axe `flex justify-between text-label font-normal text-muted-foreground tabular-nums` : 0, ¼, ½, ¾ et `finalScale` par `formatBound`.
  - `GradesCard({ ui, config, grades, histogram, adjustments })` : `StatsSection` `as="h3" size="h2"` titre `stats_grades` (« Notes finales »), classe `flex-[3_1_28.75rem]`. Corps `flex flex-wrap items-end gap-6` : à gauche (`flex-[3_1_18.75rem]`) `HistogramBars`, ou `StatsEmpty` `stats_histogram_empty` si `grades.count === 0` ; à droite `dl flex-[1_1_10rem]` de lignes `flex justify-between gap-3 border-t py-2` (`dt text-muted-foreground`, `dd font-bold tabular-nums`) : Étudiants notés, Minimum, Maximum, Écart-type. Pied `p mt-auto border-t pt-3 text-small text-muted-foreground` : `stats_adjustments` `<b>{count}</b>` · `stats_adjustments_sum` `<b>{somme signée}</b>` · `stats_adjustments_mean` `<b>{moyenne}</b>`, chiffres en `text-foreground tabular-nums` (somme : `+` explicite si positive, comme aujourd'hui).
  - `CategoryRings({ ui, config, categories }: { ui: Ui; config: NormalizedConfig; categories: CategoryStats[] })` : `StatsSection` `as="h3" size="h2"` titre `stats_categories`, classe `flex-[2_1_20rem]` ; `ul grid grid-cols-2 gap-x-3 gap-y-5`, un `li flex flex-col items-center gap-2 text-center` par catégorie : `RateRing` `size-26` (`rate = successRate`, `value = formatRate(successRate)`, `label = rate_ring_label`, `caption = rate_ring_caption`, `color` de la catégorie), puis `CategoryLabel` et `stats_category_counts` en `text-label font-normal text-muted-foreground tabular-nums`.
  - Clés (FR / EN) :
    - `stats_histogram_aria: { count: number; bins: string }` : « Notes des {count} étudiant(s) noté(s) : {bins} » / « Scores of the {count} scored student(s): {bins} » ;
    - `stats_histogram_bin: { count: number; from: string; to: string }` : « {count} entre {from} et {to} » / « {count} between {from} and {to} » ;
    - `stats_category_counts: { scored: number; choices: number }` : « {scored} notée(s) · {choices} choix » / « {scored} scored · {choices} pick(s) » ;
    - valeurs modifiées : `stats_categories` « Réussite par catégorie » / « Success by category », `stats_adjustments_sum` « somme » / « sum », `stats_adjustments_mean` « moyenne » / « mean » ;
    - supprimées : `stats_histogram`, `stats_col_range`, `stats_adjustments_count` (`stats_col_choices` et `stats_col_category` partent à la Task 4).

- [ ] **Step 1: Écrire les tests qui échouent**

`histogram-bars.test.tsx` (`finalScale` 20, 20 barres d'un point, effectifs 1 en [8 ; 9[, 2 en [13 ; 14[, `fr`) :
- `getByText('Notes des 3 étudiants notés : 1 entre 8 et 9, 2 entre 13 et 14')` ;
- le dessin est `aria-hidden` ; 20 colonnes ; la barre de 2 mesure `10.5rem`, celle de 1 `5.25rem` ;
- axe `0 5 10 15 20` ; avec `finalScale` 100 (20 barres de 5), axe `0 25 50 75 100` ; avec 2,5 (3 barres), axe `0 0,625 1,25 1,875 2,5` (Review Focus 3).

`grades-card.test.tsx` : `grades.count 0` → « Aucun étudiant n'a terminé. », aucune colonne de dessin, Minimum / Maximum / Écart-type en `—` (Review Focus 1) ; ajustements `{ count: 2, sum: 1000, mean: 0.5 }` → pied « Ajustements 2 · somme +1,00 · moyenne 0,50 » (texte normalisé, config au pas de 0,01).

`category-rings.test.tsx` : trois catégories (une à 0,8333 colorée, une à `null`, une d'id inconnu) → phrases `sr-only` « Réussite Facile : 83,3 % » et « Réussite Normal : — », légendes « 6 notées · 6 choix » et « 1 notée · 1 choix » ; la catégorie inconnue s'affiche sous son id (Review Focus 2).

- [ ] **Step 2: Vérifier l'échec**

Run : `rtk vitest run src/features/stats`
Expected : FAIL

- [ ] **Step 3: Implémenter, brancher dans `StatsView` (rangée `flex flex-wrap items-stretch gap-4` sous la synthèse), supprimer Recharts**

`pnpm remove recharts`, suppression de `chart.tsx` et des composants remplacés ; `rtk grep recharts` ne doit plus rien trouver dans `src/` (la doc et `docs/` peuvent le citer au passé).

- [ ] **Step 4: Vérifier**

Run : `rtk vitest run src/features/stats src/domain/stats src/lib/i18n && rtk tsc && pnpm knip`
Expected : PASS, aucun export ni dépendance inutilisé.

- [ ] **Step 5: Commit**

```bash
rtk git add -A src/features/stats src/components src/domain/stats src/lib/i18n package.json pnpm-lock.yaml
rtk git commit -m "💄 Dessine l'histogramme et les anneaux de réussite des statistiques sans Recharts"
```

---

### Task 4: Stats de session — détail (questions, stratégies, tags)

**Files:**
- Modify : `src/features/stats/components/question-tables.tsx`, `strategy-table.tsx`, `tag-table.tsx`, `stats-view.tsx`, `src/lib/i18n/ui-messages.ts` (+ test)
- Test : `src/features/stats/stats-page.test.tsx`, Create `src/features/stats/components/question-tables.test.tsx`

**Interfaces:**
- Consumes : `StatsGroup`, `StatsSection`, `StatsTable` (`srOnly`), `CategoryLabel`, `MeterBar`, `formatRate`, `formatDecimal`.
- Produces : `StatsGroup` « Détail » (`stats_detail`) contenant deux rangées `flex flex-wrap items-stretch gap-4` de cartes `StatsSection as="h3"` (taille `h3`) en `flex-[1_1_25rem]` : questions les plus tirées + questions passées, puis stratégies + tags. Messages vides inchangés.
  - **Questions les plus tirées** : colonnes Question, Part (`srOnly`), Tirages (`numeric`). Ligne : `th` = titre (`questionTitle`) puis `CategoryLabel` dessous (`flex flex-col gap-0.5`, `wrap-anywhere` sur le titre) ; Part = `MeterBar tone="category" w-22` `value = count / topDrawn[0].count`, `color` de la catégorie ; Tirages = `count`.
  - **Questions passées** : colonnes Question, Motifs, Passes (`numeric`). Question comme ci-dessus ; Motifs = `reasonsLabel(…)` en `text-small text-muted-foreground` ; Passes = `total`.
  - **Stratégies** : colonnes Composition, Étudiants, Note moyenne (`numeric`). `th` garde son `aria-label` (« Facile ×1, Normal ×1 ») ; pastilles `inline-flex h-6 items-center rounded-sm px-2.5 text-label whitespace-nowrap` teintées par la catégorie (fond 14 %, texte `--category-color`), `flex flex-wrap gap-1.5`, sans le séparateur « · ».
  - **Tags** : colonnes Tag, Notées (`numeric`, chiffre `font-normal text-muted-foreground`), barre (`srOnly`, `pl-4`), Réussite (`numeric`). Barre = `MeterBar tone="primary" w-24` `value = successRate`, absente si `successRate === null`.
  - Clés (FR / EN) : `stats_detail` « Détail » / « Details » ; `stats_col_share` « Part » / « Share » ; `stats_col_bar` « Barre » / « Bar » ; valeurs modifiées : `stats_col_mean_final` « Note moyenne » / « Mean score », `stats_col_scored` « Notées » / « Scored » ; supprimées : `stats_col_category`, `stats_col_choices` (plus de colonne catégorie ni de tableau des catégories).

- [ ] **Step 1: Écrire les tests qui échouent**

`question-tables.test.tsx` : deux questions tirées 4 et 2 fois → la ligne de la première a une barre `100%`, la seconde `50%` ; la catégorie s'affiche sous le titre dans le `rowheader` ; colonnes `['Question', 'Part', 'Tirages']` ; une question passée « Hors programme ×2, sans motif ×1 » ; question d'id inconnu : son id en titre (comportement existant).

`stats-page.test.tsx` : régions « Détail », « Stratégies », « Tags » présentes ; stratégie à deux catégories : nom accessible inchangé (test existant) ; tags : « Notées » et taux par ligne (test existant adapté aux colonnes) ; tag sans note → « — » et aucune barre.

- [ ] **Step 2: Vérifier l'échec**

Run : `rtk vitest run src/features/stats`
Expected : FAIL

- [ ] **Step 3: Implémenter les quatre tableaux et le groupe « Détail »**

- [ ] **Step 4: Vérifier**

Run : `rtk vitest run src/features/stats src/lib/i18n && rtk tsc && pnpm deps`
Expected : PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/features/stats src/lib/i18n
rtk git commit -m "💄 Restyle le détail des statistiques de session"
```

---

### Task 5: Stats d'entraînement

**Files:**
- Modify : `src/features/training-stats/training-stats-page.tsx`, `components/key-figures.tsx`, `category-rates.tsx`, `tag-rates.tsx`, `review-list.tsx`, `question-details.tsx`, `rate-cell.tsx` (garde `formatPercent`, `RateCell` devient barre + texte), `src/lib/i18n/ui-messages.ts` (+ test)
- Test : `training-stats-page.test.tsx`, `components/*.test.tsx` existants

**Interfaces:**
- Consumes : `StatsGroup`, `StatsSection`, `StatsTable`, `StatsEmpty`, `StatsEmptyState`, `CategoryLabel`, `MeterBar`, `RateRing`, `formatPercent`, `formatLastScore`.
- Produces :
  - **Page** : `PageShell` `meta = text('training_stats_subtitle')`. Journal vide : `StatsEmptyState` sans titre, corps `training_stats_empty`, action `Link` `buttonVariants()` `training_stats_start`. Sinon, dans l'ordre de l'artboard : chiffres clés ; rangée `flex flex-wrap items-stretch gap-4` « Par niveau » (`flex-[3_1_27.5rem]`) + « Par notion » (`flex-[2_1_18.75rem]`, absent sans tag) ; « À revoir » ; détail.
  - **`KeyFigures`** : `StatsGroup` `training_stats_key_figures` ; `flex flex-wrap gap-4` de trois cartes `flex-[1_1_12.5rem] flex flex-col gap-2 rounded-lg bg-card px-6 py-5 shadow-card`. Chaque carte est un `p` : chiffre `text-score-md tabular-nums`, un espace, libellé `text-muted-foreground` sur sa ligne (`block`) — le texte du `p` reste « 5 réponses notées ». Libellés : `training_stats_scored_label { count }`, `training_stats_passed_label { count }`, `training_coverage_label` (couverture « 5 » puis « / 9 » en `text-lg text-muted-foreground`). Sous la couverture, `MeterBar tone="primary" gradient h-2 w-full` (`value = covered / total`, `null` si `total === 0`).
  - **`CategoryRates`** : `StatsSection` `training_stats_by_category` ; `ul grid grid-cols-[repeat(auto-fit,minmax(6.875rem,1fr))] gap-x-2 gap-y-4` ; par niveau : `RateRing size-24` (`rate.rate`, `formatPercent`, `rate_ring_label`, `rate_ring_caption`, couleur du niveau), `CategoryLabel`, `training_stats_level_coverage { covered, total }`.
  - **`TagRates`** : `StatsSection` `training_stats_by_tag` ; `ul flex flex-col gap-4.5`, par notion : ligne `flex justify-between` (tag `font-medium`, taux `font-bold tabular-nums`) puis `MeterBar tone="primary" h-2 w-full`.
  - **`ReviewList`** : `StatsSection` avec `icon` = `IconAlertTriangle size-5 text-destructive` (`aria-hidden`) et `aside` = `training_stats_review_count { count }` en `text-small text-muted-foreground`. `ul aria-labelledby` ; `li flex flex-wrap items-center gap-x-4 gap-y-2 border-t py-3.5` : à gauche (`flex-[1_1_16.25rem] flex flex-col gap-0.5`) titre `font-semibold wrap-anywhere` et `CategoryLabel` ; à droite `text-small text-muted-foreground tabular-nums` : `training_stats_last_score` `<b className="text-foreground">{note}</b>` · `training_stats_attempts { count }`. Aucune question à revoir : `StatsEmpty` et pas de compteur.
  - **`QuestionDetails`** : carte `rounded-lg bg-card p-6 shadow-card` ; `details` replié, `summary` `text-h2` (chevron global) ; tableau `mt-4`, colonnes Niveau, Question, Passages notés, Dernière note, Taux de réussite, Statut. Niveau = `CategoryLabel` ; Taux = `RateCell` ; Statut = pastille `inline-flex h-6 items-center rounded-sm border border-destructive px-2.5 text-label text-destructive` « À revoir ». Les chiffres de ce tableau restent `font-normal` (`NUMERIC_CELL` sans `font-semibold` : classe surchargée localement).
  - **`RateCell({ ui, rate, color })`** : `span inline-flex items-center gap-2.5` : `MeterBar tone="category" w-16` (`color` du niveau), absent si `rate === null`, puis le texte `formatPercent` en `min-w-10.5`, lu normalement (plus d'`aria-hidden`, plus de `label`).
  - Clés (FR / EN) :
    - `training_stats_subtitle` : « Stats de l’entraînement » / « Practice stats » ;
    - `training_stats_scored_label: { count }` : « réponse(s) notée(s) » / « rated answer(s) » ; `training_stats_passed_label: { count }` : « passée(s) » / « skipped » ;
    - `training_stats_level_coverage: { covered; total }` : « {covered} / {total} notées » / « {covered} / {total} rated » ;
    - `training_stats_review_count: { count }` : « {n} question(s) » / « {n} question(s) » ;
    - valeur modifiée : `training_stats_last_score` devient `NoParams` « Dernière note » / « Last score » ;
    - supprimées : `training_stats_scored`, `training_stats_passed`, `training_stats_coverage`, `training_stats_rate_label`, `training_stats_col_tag`, `training_stats_col_coverage`.

- [ ] **Step 1: Écrire les tests qui échouent**

`training-stats-page.test.tsx` (test « titre, retour… » adapté) :
- sous-titre « Stats de l’entraînement » ;
- `getByRole('region', { name: 'Chiffres clés' })` contient « 5 réponses notées », « 1 passée », « 5 / 9 » et « questions notées » ;
- « Par niveau » : phrase `sr-only` « Réussite Facile : 50 % », légende « 2 / 3 notées » ; niveau sans note → « Réussite Cauchemar : — » ;
- « Par notion » : « commit » puis « 17 % » dans le même `li` ;
- « À revoir » : compteur « 2 questions », ligne « Dernière note 0 / 1 · 1 passage » (texte normalisé) ;
- détail : replié au montage (`details` sans `open`), colonnes inchangées, pastille « À revoir » sur les deux premières lignes, ordre « à revoir » en tête conservé ;
- journal vide : texte `training_stats_empty` et lien « Aller à l’entraînement » ; aucune région « Chiffres clés ».

`rate-cell.test.tsx` adapté : `rate 0.25` → texte « 25 % » lisible (pas d'`aria-hidden`), barre `25%` ; `null` → « — » sans barre.

- [ ] **Step 2: Vérifier l'échec**

Run : `rtk vitest run src/features/training-stats`
Expected : FAIL

- [ ] **Step 3: Implémenter les cinq blocs, la page et les clés**

- [ ] **Step 4: Vérifier**

Run : `rtk vitest run src/features/training-stats src/components/stats src/lib/i18n && rtk tsc && pnpm deps`
Expected : PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/features/training-stats src/components/stats src/lib/i18n
rtk git commit -m "💄 Restyle les stats d'entraînement (anneaux, barres, à revoir)"
```

---

### Task 6: E2e, captures, canevas et mémoire

**Files:**
- Modify : `e2e/pages/stats-page.ts`, `e2e/pages/training-stats-page.ts`, `e2e/stats.spec.ts`, `e2e/offline.spec.ts`, `e2e/screenshots/guide.spec.ts`
- Create : `e2e/stats-layout.spec.ts`
- Docs : `docs/INDEX.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md` (D109), `docs/QUIRKS.md` / `docs/BACKLOG.md` / `docs/CONVENTIONS.md` selon ce qui est découvert, corps de la PR #154 (section #150)

**Interfaces:**
- Consumes : tout ce qui précède.
- Produces :
  - `StatsPage.headcount(label)` vise la région « Chiffres clés » ; `StatsPage.histogram` devient la phrase `sr-only` de la région « Notes finales » (`getByText(/^Notes des /)`) ; nouveau `StatsPage.emptyState` (`getByRole('region', { name: 'Pas encore de statistiques' })`). `TrainingStatsPage` : `keyFigures` inchangé ; `openDetails` inchangé (le `summary` garde son texte).
  - `e2e/stats.spec.ts` : « Passés » vaut 1, la phrase de l'histogramme cite l'étudiant noté (au lieu des 21 lignes du tableau) ; nouveau test : session créée sans tirage → état vide, « Aller au passage » ramène au passage. `offline.spec.ts` et `guide.spec.ts` : « Terminés » → « Passés », `histogram` toujours attaché.
  - `e2e/stats-layout.spec.ts` (Review Focus 5) : à 390 px, stats de session (config de démonstration complétée de 13 catégories et d'un titre de question sans espace de 60 caractères, au moins une tentative) et stats d'entraînement : aucun élément de `main` ne déborde de la fenêtre (mesure élément par élément, comme `passage-layout.spec.ts`), chaque `table` est dans un conteneur `overflow-x-auto`.

- [ ] **Step 1: Adapter les page objects et les specs, écrire `stats-layout.spec.ts`**

- [ ] **Step 2: Lancer l'e2e**

Run : `rtk playwright test`
Expected : tous verts (78 + les nouveaux), `guide.spec.ts` compris.

- [ ] **Step 3: Captures 1280 et 390 px, comparaison aux artboards**

Config Playwright jetable dans `.superpowers/sdd/2026-10-18-f44-8-statistiques/cap/` (HANDOFF F44.6) : `statistiques`, `stats-vide`, `entrainement-stats` sur les données de démonstration. Comparer à l'œil avec les artboards ; relever chaque écart (chiffres compris : si la démo donne « 83,3 % » là où l'artboard montre « 83 % », c'est l'artboard qui suit).

- [ ] **Step 4: Mettre le canevas à jour**

`Artifact` `read` sur l'URL seule, puis republier les artboards touchés : chiffres réels de la démo, `role="img"` remplacé par la phrase `sr-only` et le dessin `aria-hidden`, « Détail des 9 questions » replié s'il le faut pour montrer l'état par défaut (sinon une note dans l'artboard), tout autre écart relevé au Step 3.

- [ ] **Step 5: `pnpm check` complet**

Run : `pnpm check`
Expected : PASS (lint, types, `deps`, `knip`, tests et couverture).

- [ ] **Step 6: Mémoire et PR**

- `docs/DECISIONS.md` **D109 — F44.8 : statistiques** : taux de session à 0–1 décimale conservés ; détail d'entraînement replié par défaut ; « Passés » pour les terminés de la synthèse ; histogramme dessiné sans Recharts, retiré du projet ; dessins `aria-hidden` décrits par phrase ou texte voisin ; état vide global sur « aucune tentative ».
- `docs/INDEX.md` : ligne F44.8 (#150) avec ce plan. `docs/HANDOFF.md` : entrée datée avec les quatre marqueurs. `docs/CONVENTIONS.md` : si `StatsSection` / `StatsGroup` / `MeterBar` / `RateRing` sont la règle pour tout bloc chiffré, une ligne dans § Page examinateur. QUIRKS et BACKLOG selon ce qui est apparu.
- Corps de la PR #154 : section #150 (contexte, changements, tests).

- [ ] **Step 7: Commit**

```bash
rtk git add e2e docs
rtk git commit -m "✅ Adapte l'e2e des statistiques et note F44.8 dans la mémoire"
```

Puis `rtk git push`, CI et `.claude/scripts/sonar-check.sh --pr 154 --wait` verts, et validation locale par l'utilisateur (`pnpm dev`) avant #151.
