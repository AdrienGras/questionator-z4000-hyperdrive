# F44.5 — Accueil et pages d'espace — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/sessions` et `/trainings` deviennent les pages de leur espace (liste, création, restauration, enregistrements endommagés). L'accueil devient un tableau de bord : reprise des trois éléments les plus récents, tuiles d'espace avec compteur, et premier lancement guidé quand il n'y a aucune donnée (#147).

**Architecture:** Les composants de `features/home` sont redistribués selon D59. Les cartes de session et leurs dialogues passent dans `features/sessions`, les cartes d'entraînement dans `features/trainings`. L'import d'une sauvegarde sert l'accueil et `/sessions` : il remonte dans `src/components/import/`, sur le modèle de `src/components/export/`. Ce qui est commun aux cartes de l'accueil et à celles des espaces remonte aussi dans `src/components/` : tuile d'icône d'espace, bloc de progression d'une session, anneau et chiffres d'un entraînement, pastille « Endommagée ». `PageShell` gagne deux props, `icon` (tuile à gauche du titre) et `halo` (décor flou en fond, premier usage des tokens `halo-*` de #145). `features/home` ne garde que le tableau de bord et le premier lancement. Le taux de réussite global d'un entraînement est un nouveau champ de `computeTrainingStats`.

**Tech Stack:** React 19, TanStack Router, shadcn v4 sur base-ui (`Tooltip`, `DropdownMenu`, `Progress`), Tailwind CSS v4, icônes Tabler, Dexie (`useLiveQuery`), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (D102), carte des écrans `docs/superpowers/specs/2026-10-17-f44-carte-des-ecrans.md` (§ Accueil, Sessions, Entraînements ; D103), ticket #147. Maquettes du canevas <https://claude.ai/artifact/DvvtZZb9ie2vknoXtHfnJL> : `apres/accueil`, `apres/accueil-premier-lancement`, `apres/accueil-en`, `apres/sessions`, `apres/trainings`, `apres/accueil-dialogues`. Design system <https://claude.ai/artifact/DMYaQZGYtm8RnJqbBMmBcy>.

## Global Constraints

- **Canevas avant l'interface (D102)** : les artboards sont validés (D103). Tout écart d'implémentation met l'artboard à jour dans la même PR (Task 8). **Le code fait foi pour tout état que la maquette ne montre pas** : stockage indisponible, base périmée, liste vide, chargement, export Excel en cours ou en échec, journal d'entraînement pas encore lu. Ces états sont conservés et restylés.
- **Arborescence (D59)** : aucun import entre features (`pnpm deps` vert). Une route ne contient qu'un `createFileRoute` qui importe `<x>-page`. Fichiers déplacés par `git mv` (l'historique suit).
- **Couleurs** : uniquement des tokens. Tuile d'espace **teintée** sur l'accueil et les en-têtes d'espace (`bg-space-*/14 text-space-*`, artboards), contrairement au menu qui garde sa tuile neutre (D103). Cartes `bg-card shadow-card` ; `rounded-xl` (24 px) pour les cartes de l'accueil, `rounded-lg` (18 px) pour les cartes de liste. Bouton principal = variante par défaut (dégradé d'action) ; bouton neutre = `outline` ; texte seul = `ghost`.
- **Typo** : chiffres clés en `text-score-md tabular-nums` (32/36) ; titres de section en `text-h2` ; titre de carte en `text-h3` sur l'accueil, `text-lg` (18/24) dans les listes ; libellés de type (« Session », « Entraînement », « Étape 1 », « Premier lancement ») en `text-label` capitales `text-muted-foreground` ; textes secondaires en `text-[13px] leading-[18px] text-muted-foreground`.
- **Téléphone (390 px)** : toute grille `auto-fit`/`auto-fill` écrit son minimum `min(100%, Npx)`, sinon une carte de 380 px déborde de l'écran. Aucun défilement horizontal.
- **Noms longs (#118)** : tout titre de carte garde `wrap-anywhere`.
- **Libellés** : FR et EN évoluent ensemble, chaque nouvelle clé entre dans `UiMessageParams`, les deux dictionnaires et `SAMPLE` de `ui-messages.test.ts`. Libellés EN de l'accueil : ceux de l'artboard `accueil-en` (repris dans les tableaux des tasks). Les textes d'explication des anciennes cartes d'action (`home_*_body`) disparaissent (D103).
- **`useUi()` une fois par page**, `ui` en prop ensuite (CONVENTIONS § Composant d'écran traduit).
- **Tests (D102)** : un test de forme (libellé, structure) s'adapte ; un test de comportement qui casse signale une régression. Un test déplacé garde son nom et ses assertions de comportement.
- Commits gitmoji en français, un groupe de commits pour #147 sur `feat/f44-refonte-ui`, PR #154 toujours en brouillon (D102).

## Review Focus

1. **Stockage indisponible ou base périmée sur chacune des trois pages** : ni création ni entraînement si `unavailable`, import désactivé dès que la base n'est pas `open`, bandeau `DbStatusBanner` à la place des listes et du tableau de bord, jamais le premier lancement. Tests dans les Tasks 4, 5 et 6.
2. **Uniquement des enregistrements endommagés** (une session illisible, aucun autre) : pas de section « Reprendre » (elle exclut les endommagés), pas de premier lancement (il y a des données), tuile « Sessions » à 1. Test dans les Tasks 6 et 7.
3. **Sauvegarde ancienne importée depuis l'accueil** : sa date la laisse hors des trois éléments récents, l'import réussirait sans rien montrer. L'accueil mène donc à `/sessions` après un import réussi, et la carte y est visible. Tests dans les Tasks 2 et 6.
4. **Téléphone à 390 px** : grilles sur une colonne, en-têtes qui passent à la ligne, aucun défilement horizontal sur `/`, `/sessions` et `/trainings`. Test de classes dans la Task 3, e2e dans la Task 8.
5. **Entraînement sans note, ou journal pas encore lu** : anneau vide et « — » sans `NaN` (taux `null`) ; tant que le journal n'est pas lu, ni anneau ni chiffres, mais la carte et ses liens sont là. Tests dans les Tasks 3 et 5.

---

### Task 1: Taux de réussite global et date courte

**Files:**
- Modify: `src/domain/training/training-stats.ts`, `src/domain/training/training-stats.test.ts`
- Modify: `src/lib/format-date.ts` ; Create: `src/lib/format-date.test.ts`

**Interfaces:**
- Produces : `TrainingStats.rate: Rate`, le taux global ; `formatShortDateTime(iso: string, locale: Locale): string`.

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `training-stats.test.ts`, avec les constructeurs de config et de tirages déjà employés dans le fichier :
    - `test('taux global : somme des points sur somme des max, toutes questions confondues')` : deux catégories, une question notée 2/4 dans la première, une notée 3/4 dans la seconde. Attendu `rate` = `{ points: 5000, max: 8000, rate: 0.625 }`, la même définition que `byCategory[].rate`.
    - `test('taux global : null sans note, questions disparues et passages ignorés')` : un tirage passé, un tirage noté sur un `questionId` absent de la config. Attendu `rate.rate` `null`, `rate.max` 0.
  - `format-date.test.ts` (date construite en heure locale, le test ne dépend pas du fuseau) :
    - `const iso = new Date(2026, 9, 14, 10, 42).toISOString()`
    - `test('date courte sans année, en français')` : `expect(formatShortDateTime(iso, 'fr')).toBe('14 oct., 10:42')`
    - `test('date courte sans année, en anglais')` : `expect(formatShortDateTime(iso, 'en')).toMatch(/^Oct 14, 10:42\sAM$/u)` (ICU met une espace insécable fine avant AM)
    - `test('date complète inchangée')` : `formatDateTime(iso, 'fr')` contient `2026`.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/domain/training/training-stats.test.ts src/lib/format-date.test.ts`. Attendu : FAIL (`rate` absent, `formatShortDateTime` introuvable).

- [ ] **Step 3 : Implémenter.**
  - `rate: sumRate([...notes.values()].flat())` dans `computeTrainingStats`, champ ajouté au type `TrainingStats` avec un commentaire d'une ligne (« Taux global, même définition que `byCategory[].rate` »).
  - `formatShortDateTime` : `Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })`. Si ICU ne rend pas exactement `14 oct., 10:42`, ajuster les options et non le test : la valeur vient de l'artboard.

- [ ] **Step 4 : Relancer les deux fichiers.** Attendu : PASS. Puis `pnpm typecheck` : un littéral `TrainingStats` construit à la main dans un test peut réclamer `rate`, à compléter.

- [ ] **Step 5 : Commit** `✨ Calcule le taux de réussite global d'un entraînement et formate une date courte`.

---

### Task 2: Import d'une sauvegarde partagé

**Files:**
- Move (`git mv`) : `src/features/home/components/import-controller.tsx` (+ `.test.tsx`) → `src/components/import/import-controller.tsx` ; `src/features/home/hooks/use-backup-import.ts` (+ `.test.ts`) → `src/components/import/use-backup-import.ts` ; `src/features/home/hooks/use-retained.ts` (+ `.test.ts`) → `src/components/import/use-retained.ts`
- Modify : `src/features/home/home-page.tsx` (import du nouveau chemin)

**Interfaces:**
- Produces : `ImportController({ ui, disabled, onImported?, children })`, avec `onImported?: () => void` appelé après une écriture réussie (nouvel `id` ou remplacement confirmé), jamais sur un refus, une annulation ou une écriture en échec ; `useBackupImport(onImported?: () => void)`.

- [ ] **Step 1 : Déplacer les six fichiers**, corriger les imports (`@/components/import/...`). `pnpm deps` et `pnpm vitest run src/components/import` passent sans autre changement.

- [ ] **Step 2 : Écrire les tests qui échouent** dans `use-backup-import.test.ts` :
  - `test('import réussi : onImported appelé une fois')`
  - `test('fichier refusé, conflit annulé ou écriture en échec : onImported jamais appelé')`
  - `test('conflit puis remplacer : onImported appelé après l'écriture')`

- [ ] **Step 3 : Lancer** `pnpm vitest run src/components/import/use-backup-import.test.ts`. Attendu : FAIL.

- [ ] **Step 4 : Implémenter** : `useBackupImport` reçoit le rappel et l'appelle après `setState({ kind: 'idle' })`, dans `runImport` et dans `replace`. `ImportController` le transmet.

- [ ] **Step 5 : Restyler le voile de dépôt** (artboard `accueil-dialogues`, « Dépôt d'une sauvegarde · voile ») : `rounded-lg border-2 border-dashed border-primary bg-primary/8`, `min-h-55`, contenu centré en colonne `gap-3`, `IconUpload` de 32 px en `text-link`, libellé `import_drop_hint` en `text-lg font-semibold`. Le voile reste `pointer-events-none fixed inset-0 z-50` sur `bg-background/80`. Le test « glisser-déposer : surimpression… » passe toujours.

- [ ] **Step 6 : Relancer** `pnpm vitest run src/components/import && pnpm deps`. Attendu : PASS.

- [ ] **Step 7 : Commit** `♻️ Remonte l'import d'une sauvegarde dans les composants partagés`.

---

### Task 3: Briques communes aux cartes et aux en-têtes d'espace

**Files:**
- Create : `src/components/space-icon.tsx` (+ test), `src/components/session-progress.tsx` (+ test), `src/components/success-ring.tsx`, `src/components/training-figures.tsx` (+ test, qui couvre aussi l'anneau), `src/hooks/use-training-summary.ts` (+ test)
- Modify : `src/components/damaged-badge.tsx`, `src/components/page-shell.tsx` (+ `page-shell.test.tsx`), `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Produces :
  - `type Space = 'sessions' | 'training' | 'editor'` ; `SpaceIcon({ space: Space; size: 'sm' | 'md' | 'lg' })` : tuile `aria-hidden` de 32 / 40 / 52 px, rayon 10 / 12 / 14 px, icône de 18 / 22 / 26 px, `bg-space-<x>/14 text-space-<x>`. Icônes : `IconPresentationAnalytics`, `IconSchool`, `IconFileCode`, celles du menu.
  - `SessionProgress({ ui, session }: { ui: Ui; session: Session })` : passés en `text-score-md`, puis `card_progress_of` ; jauge `Progress` de 8 px (`aria-label` = `card_progress` existant) ; puis `card_progress_rest`.
  - `SuccessRing({ rate, label }: { rate: number | null; label: string })` : `div role="img" aria-label={label}` de 56 px. SVG `viewBox="0 0 64 64"` tourné de -90°, piste `r=26 stroke-width=7` en `stroke-muted`, arc de même rayon `stroke-linecap="round"` en dégradé `primary → action-to` (`<linearGradient>` d'id `useId()`), `strokeDasharray={`${rate * C} ${C}`}` avec `C = 2πr`. `rate` est borné à [0, 1] ; à `null`, piste seule.
  - `TrainingFigures({ ui, summary, showCoverage }: { ui: Ui; summary: TrainingSummary; showCoverage: boolean })` : anneau (`label` = `training_success_aria`), taux `formatRate(summary.rate, locale)` en `text-score-md` au-dessus de `training_success_label`. Si `showCoverage` : couvertes en `text-score-md`, `/ total` en 18 px `text-muted-foreground`, puis `training_coverage_label`.
  - `type TrainingSummary = { rate: number | null; coverage: { covered: number; total: number } }` ; `useTrainingSummary(training: Training): TrainingSummary | undefined` : `undefined` tant que `useTrainingDraws` charge, sinon `computeTrainingStats(training.config, draws)`, réduit à `{ rate: stats.rate.rate, coverage: stats.coverage }` (mémoïsé sur `draws`).
  - `PageShell` : `icon?: ReactNode`, rendu à gauche du bloc titre (`flex items-center gap-4 min-w-0`) ; `halo?: 'home' | 'space'`, des `div aria-hidden` en `pointer-events-none absolute -z-10` sur `bg-[radial-gradient(closest-side,var(--color-halo-action),transparent)] blur-sm`. `home` en pose deux, comme l'artboard `accueil` : 620 × 380 px à `-top-50 -right-30` en `halo-action`, puis 460 × 300 px à `-top-30 right-90` en `halo-cool`. `space` en pose un, 560 × 340 px à `-top-55 -right-35`. Avec un halo, le `main` reçoit `relative isolate overflow-x-clip`.
- Clés i18n :

| Clé | FR | EN |
|---|---|---|
| `card_progress_of` `{ total }` | `/ ${total} passés` (`plural`) | `/ ${total} done` |
| `card_progress_rest` `{ absent, remaining }` | `2 absents · 15 restants` (`plural` sur chacun) | `2 absent · 15 remaining` |
| `training_success_label` | `de réussite` | `success rate` |
| `training_success_aria` `{ rate }` | `Taux de réussite : ${rate}` | `Success rate: ${rate}` |
| `training_coverage_label` | `questions notées` | `questions rated` |

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `space-icon.test.tsx` : `test('tuile teintée de la couleur de l'espace, cachée aux lecteurs d'écran')` : pour `sessions` en `lg`, classes `size-13`, `bg-space-sessions/14`, `text-space-sessions`, `aria-hidden`.
  - `session-progress.test.tsx` : une session de 24 étudiants, 7 passés et 2 absents (`makeSession`, `makeStudent`). Textes `7`, `/ 24 passés`, `2 absents · 15 restants` ; jauge de nom `7 passés · 2 absents · 15 restants`. `test('accord au singulier : 1 / 1 passé, 0 absent · 0 restant')`.
  - `training-figures.test.tsx` :
    - `test('72 % de réussite et 38 / 60 questions notées')` : `summary = { rate: 0.72, coverage: { covered: 38, total: 60 } }`, `showCoverage`. Attendu : `img` de nom `Taux de réussite : 72 %`, textes `72 %`, `de réussite`, `38`, `/ 60`, `questions notées`.
    - `test('sans note : « — » et anneau sans arc')` : `rate: null` ; texte `—`, aucun `circle` avec `stroke-dasharray`.
    - `test('taux hors bornes : arc borné au cercle')` : `rate: 1.2` ; le premier nombre de `stroke-dasharray` vaut au plus `2π × 26`.
  - `use-training-summary.test.ts` (`renderHook`, base réelle `fake-indexeddb`) : `undefined` avant lecture du journal, puis `{ rate: 0.5, coverage: { covered: 1, total: N } }` après un tirage noté 2/4.
  - `page-shell.test.tsx` :
    - `test('icon : tuile avant le titre')`
    - `test('halo space : un décor caché, sans pointeur ; aucun sans la prop')` (`main` en `overflow-x-clip` seulement avec halo)

- [ ] **Step 2 : Lancer** `pnpm vitest run src/components src/hooks/use-training-summary.test.ts`. Attendu : FAIL sur les nouveaux tests.

- [ ] **Step 3 : Implémenter** les composants, le hook et les clés (FR, EN, `SAMPLE`). Restyler `DamagedBadge` d'après l'artboard `sessions` : `inline-flex h-6 items-center gap-1.5 rounded-sm border border-destructive px-2.5 text-xs font-semibold whitespace-nowrap text-destructive`, avec `IconAlertTriangle` de 14 px `aria-hidden` en tête.

- [ ] **Step 4 : Relancer** les mêmes tests puis `pnpm deps`. Attendu : PASS.

- [ ] **Step 5 : Commit** `✨ Ajoute les briques communes des cartes et des en-têtes d'espace`.

---

### Task 4: Page Sessions

**Files:**
- Move (`git mv`) de `src/features/home/components/` vers `src/features/sessions/components/` : `session-list.tsx`, `session-card.tsx`, `damaged-session-card.tsx` (+ test), `delete-dialog.tsx` (+ test), `empty-state.tsx`
- Create : `src/features/sessions/sessions-page.tsx`, `src/features/sessions/sessions-page.test.tsx`
- Modify : `src/routes/sessions.tsx` (→ `SessionsPage`, commentaire « Provisoire » retiré), `src/features/home/home-page.tsx` (plus de liste de sessions, voir Step 6), `src/components/import/import-controller.test.tsx` (`renderAt('/sessions')`), `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `ImportController` (Task 2) ; `SpaceIcon`, `SessionProgress`, `DamagedBadge`, `PageShell icon/halo` (Task 3).
- Produces : `SessionsPage()` ; `card_resume_named` (repris par les Tasks 5 et 6).
- Clés i18n :

| Clé | FR | EN |
|---|---|---|
| `sessions_subtitle` | `Vos oraux, de la liste d’étudiants à la note finale.` | `Your oral exams, from the student list to the final grade.` |
| `sessions_drop_hint` | `Déposez une sauvegarde (.json) n’importe où sur la page pour la restaurer.` | `Drop a backup (.json) anywhere on the page to restore it.` |
| `sessions_list_title` | `Liste des sessions` | `Session list` |
| `sessions_count` `{ count }` | `${count} session(s) · dernière modification d’abord` (`plural`) | `${count} session(s) · most recently updated first` (`pluralEn`) |
| `card_resume_named` `{ name }` | `Reprendre « ${name} »` | `Resume “${name}”` |

`empty_body` devient « Créez une session ou importez une sauvegarde. » (EN « Create a session or import a backup. »). `home_sessions_title` disparaît.

- [ ] **Step 1 : Déplacer les fichiers.** L'accueil ne peut pas les importer depuis `features/sessions` (pas d'import entre features) : il cesse donc dès ce commit d'afficher la liste des sessions (Step 6).

- [ ] **Step 2 : Écrire `sessions-page.test.tsx`** sur le modèle de l'en-tête de `home-page.test.tsx` (mêmes `vi.mock` de `useDbStatus`, `usePersistenceStatus`, `downloadText`, `exportWorkbook`), avec `renderAt('/sessions')`.
  - **Déplacer de `home-page.test.tsx`**, sans toucher aux assertions de comportement : « liste triée de la plus récente à la plus ancienne… », « outdated : bandeau… », « unavailable : message et pas de création », les tests « renommer », « examinateur », « supprimer », « Exporter une sauvegarde d'abord », « exporter depuis le menu », « Exporter en Excel », « export Excel en échec ». Ne s'adaptent que les libellés de forme, par exemple la progression découpée en deux lignes.
  - **Nouveaux tests :**
    - `test('en-tête : tuile, titre, sous-titre, import puis création')` : `h1` « Sessions », sous-titre `sessions_subtitle`, `bannerInteractiveNames()` égal à `['Importer une sauvegarde', 'Créer une session']`, le lien vers `/new`.
    - `test('compteur et encart de dépôt')` : avec deux sessions, texte `2 sessions · dernière modification d’abord` et encart `sessions_drop_hint` ; `h2` « Liste des sessions » présent (`sr-only`).
    - `test('carte : date, jury et progression')` : `Modifiée le … · Jury : Mme Laurent`, `7`, `/ 24 passés`, lien de nom `Reprendre « Oral de test »` vers `/session/<id>`.
    - `test('carte endommagée : « Exporter une sauvegarde » visible, hors du menu')` : le bouton télécharge (`download` appelé) ; le menu « … » garde Exporter et Supprimer.
    - `test('unavailable : ni création, ni encart, import désactivé')`.
    - `test('liste vide : message, encart de dépôt présent')`.

- [ ] **Step 3 : Lancer** `pnpm vitest run src/features/sessions`. Attendu : FAIL (page absente).

- [ ] **Step 4 : Implémenter `SessionsPage`** : `useUi`, `useDbStatus`, `useSessions`. `ImportController` (`disabled={status !== 'open'}`) enveloppe un `PageShell` qui prend :
  - `title` : `menu_sessions` ; `icon` : `<SpaceIcon space="sessions" size="lg" />` ; `meta` : `sessions_subtitle` ; `halo="space"` ;
  - `actions` : `Button variant="outline"` `IconUpload` + `home_import` (`onClick={openPicker}`, désactivé si la base n'est pas `open`), puis le `Link` vers `/new` en variante par défaut, `IconPlus` + `home_create`, masqué si `unavailable`.

  Le contenu, en `flex flex-col gap-6` : l'encart de dépôt (si `open` : `flex items-center gap-2.5 rounded-md border border-dashed border-input px-4 py-3 text-[13px] leading-[18px] text-muted-foreground`, `IconUpload` de 16 px), puis la `section aria-labelledby` avec son `h2` `sr-only` et `SessionList`. `SessionList` garde ses états (bandeau, chargement, vide) ; avec des sessions, il rend le compteur puis `ul grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))]`.

- [ ] **Step 5 : Restyler les cartes** d'après l'artboard `sessions` :
  - `SessionCard` : `Card` en `rounded-lg p-6 gap-4 h-full`. En tête, `h3 text-lg font-semibold wrap-anywhere`, `config.exam.title` en 13 px `text-muted-foreground`, puis `CardActionsMenu` (inchangé, 36 px). Ligne de date : `card_updated` (`formatDateTime`), suivie de ` · ` et `card_examiner` s'il y a un examinateur. Puis `SessionProgress` ; l'alerte d'échec Excel reste. En pied (`mt-auto`), le lien « Reprendre » `variant="outline" size="sm"` avec `aria-label={card_resume_named}`.
  - `DamagedSessionCard` : même en-tête (titre et `DamagedBadge`, menu), corps `damaged_body` en 14 px `text-muted-foreground`, puis en pied `Button variant="outline" size="sm"` `IconDownload` + `action_export` → `exportBackup(damaged.raw)`.
  - `EmptyState` : forme seule (carte `rounded-lg`, centrée).

- [ ] **Step 6 : Accueil intermédiaire** : retirer de `home-page.tsx` la section des sessions et `SessionList`. `ActionCards` et la liste d'entraînements restent jusqu'aux Tasks 5 et 6. Retirer de `home-page.test.tsx` les tests déplacés, adapter ceux qui comptaient sur la liste. Passer `import-controller.test.tsx` sur `/sessions` : « nouvel id : session écrite et carte affichée » y voit la carte.

- [ ] **Step 7 : Relancer** `pnpm vitest run src/features src/components/import src/routes && pnpm deps && pnpm typecheck`. Attendu : PASS.

- [ ] **Step 8 : Commit** `✨ Donne à l'espace Sessions sa page`.

---

### Task 5: Page Entraînements

**Files:**
- Move (`git mv`) de `src/features/home/components/` vers `src/features/trainings/components/` : `training-list.tsx` (+ test), `training-card.tsx` (+ test), `damaged-training-card.tsx` (+ test), `delete-training-dialog.tsx` (+ test)
- Create : `src/features/trainings/trainings-page.tsx`, `src/features/trainings/trainings-page.test.tsx`, `src/features/trainings/components/trainings-empty.tsx`
- Modify : `src/routes/trainings.tsx`, `src/features/home/home-page.tsx` (plus de liste d'entraînements), `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `SpaceIcon`, `TrainingFigures`, `useTrainingSummary`, `DamagedBadge`, `PageShell` (Task 3) ; `card_resume_named` (Task 4).
- Produces : `TrainingsPage()`.
- Clés i18n (`home_trainings_title` « Mes entraînements » / « My practice » reste, en `h2` `sr-only` ; `home_training_coverage` disparaît) :

| Clé | FR | EN |
|---|---|---|
| `trainings_subtitle` | `Révisez seul, à partir d’une config générée par un LLM.` | `Review on your own, from a config generated by an LLM.` |
| `trainings_new` | `Nouvel entraînement` | `New practice` |
| `trainings_count` `{ count }` | `${count} entraînement(s) · dernière activité d’abord` | `${count} practice session(s) · most recent activity first` |
| `trainings_empty_title` | `Aucun entraînement` | `No practice yet` |
| `trainings_empty_body` | `Lancez un entraînement à partir d’une config.` | `Start a practice from a config.` |

- [ ] **Step 1 : Déplacer les fichiers.**

- [ ] **Step 2 : Écrire les tests qui échouent.**
  - `trainings-page.test.tsx` (`renderAt('/trainings')`) :
    - `test('en-tête : titre « Entraînement », sous-titre, lien « Nouvel entraînement » vers /training/new')`
    - `test('compteur, cartes de la plus récente à la plus ancienne')` : celui de `training-list.test.tsx`, porté ici.
    - `test('aucun entraînement : message « Aucun entraînement »')`
    - `test('unavailable : bandeau, pas de « Nouvel entraînement »')`
    - `test('outdated : bandeau à la place de la liste')`
  - `training-card.test.tsx`, adapté : « nom, dernière activité, couverture et lien « Reprendre » » attend `38`, `/ 60`, `questions notées` et l'anneau ; « sans tirage : 0 % des questions notées » devient `test('sans tirage : « — » de réussite et 0 / N questions notées')`. Nouveau : `test('journal pas encore lu : carte et liens, sans chiffres')`, avec `useTrainingDraws` qui reste `undefined` (`vi.mock` de `@/lib/db/hooks`).
  - `damaged-training-card.test.tsx` : `test('« Supprimer » visible hors du menu ouvre le dialogue')`.

- [ ] **Step 3 : Lancer** `pnpm vitest run src/features/trainings`. Attendu : FAIL.

- [ ] **Step 4 : Implémenter.**
  - `TrainingsPage` : `PageShell` avec le titre `menu_training`, `icon` `<SpaceIcon space="training" size="lg" />`, `meta` `trainings_subtitle` et `halo="space"`. Action : le `Link` vers `/training/new` en variante par défaut, `IconPlus` + `trainings_new`, masqué si `unavailable`. Contenu : la `section` avec son `h2` `sr-only` `home_trainings_title`. Si la base n'est pas `open`, `DbStatusBanner` ; pendant le chargement, rien ; liste vide, `TrainingsEmpty` (même carte que `EmptyState`) ; sinon le compteur et la liste, dans la même grille que la Task 4.
  - `TrainingCard`, d'après l'artboard `trainings` : en tête le titre, `home_training_updated` (`formatDateTime`) en 13 px et le menu « … » (inchangé). Ensuite `TrainingFigures showCoverage` si `useTrainingSummary` a rendu sa valeur. En pied, « Reprendre » (`outline sm`, `aria-label` = `card_resume_named`) et « Stats » (`ghost sm`, `IconChartBar`).
  - `DamagedTrainingCard` : corps `home_training_damaged_body`, puis `Button variant="outline" size="sm"` `IconTrash` + `action_delete`, qui ouvre `DeleteTrainingDialog`. Le menu garde « Supprimer ».

- [ ] **Step 5 : Accueil intermédiaire** : retirer de `home-page.tsx` la section « Mes entraînements » et ses tests dans `home-page.test.tsx`.

- [ ] **Step 6 : Relancer** `pnpm vitest run src/features src/routes && pnpm deps && pnpm typecheck`. Attendu : PASS.

- [ ] **Step 7 : Commit** `✨ Donne à l'espace Entraînement sa page`.

---

### Task 6: Accueil en tableau de bord

**Files:**
- Create : `src/features/home/recent-activity.ts` (+ test), `src/features/home/components/resume-section.tsx`, `resume-session-card.tsx`, `resume-training-card.tsx`, `space-tiles.tsx`, `persistence-badge.tsx`
- Rewrite : `src/features/home/home-page.tsx`, `src/features/home/home-page.test.tsx`
- Delete : `src/features/home/components/action-cards.tsx` (+ test), `src/features/home/components/home-actions.tsx`
- Modify : `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `ImportController onImported` (Task 2) ; `SpaceIcon`, `SessionProgress`, `TrainingFigures`, `useTrainingSummary`, `PageShell halo` (Task 3) ; `formatShortDateTime` (Task 1) ; `card_resume_named` (Task 4) ; `compareRecords` (`@/lib/db/record-order`).
- Produces : `type RecentItem = { kind: 'session'; session: Session } | { kind: 'training'; training: Training }` ; `recentActivity(sessions: readonly StoredSession[], trainings: readonly StoredTraining[], limit?: number): RecentItem[]` (`limit` vaut 3) ; `PersistenceBadge({ ui })` (repris par la Task 7).
- Clés i18n (`home_title` n'existe pas : le `h1` reprend `menu_home`, « Accueil » / « Home ») :

| Clé | FR | EN |
|---|---|---|
| `home_subtitle` | `Reprenez un oral ou préparez le suivant.` | `Resume a session in progress or prepare the next oral exam.` |
| `home_train` | `S’entraîner` | `Practice` |
| `home_resume_title` | `Reprendre` | `Resume` |
| `home_kind_session` | `Session` | `Session` |
| `home_kind_training` | `Entraînement` | `Practice` |
| `home_training_coverage_short` `{ covered, total }` | `${covered} / ${total} questions notées` | `${covered} of ${total} questions rated` |
| `home_spaces_title` | `Espaces` | `Spaces` |
| `home_space_sessions_body` | `Oraux en cours et terminés` | `Exams in progress and finished` |
| `home_space_trainings` | `Entraînements` | `Practice` |
| `home_space_trainings_body` | `Révisions en solo` | `Solo review` |
| `home_space_editor_body` | `Erreurs signalées en direct, aperçu des questions` | `Errors flagged as you type, live question preview` |
| `home_space_view_all` | `Voir tout` | `View all` |

Disparaissent : `home_actions_title`, `home_create_title`, `home_create_body`, `home_import_title`, `home_import_body`, `home_editor_title`, `home_editor_body`, `home_training_title`, `home_training_body`, `home_training_start`. `home_students_example_link`, `home_config_example_link` et `home_config_schema_link` restent, pour la Task 7.

- [ ] **Step 1 : Écrire `recent-activity.test.ts`.**
  - `test('trois éléments au plus, sessions et entraînements mêlés, le plus récent d'abord')` : sessions datées du 10, du 14 et du 2 ; entraînements du 13 et du 1er. Attendu : 14 (session), 13 (entraînement), 10 (session).
  - `test('endommagés exclus')` : une session endommagée plus récente que tout le reste n'apparaît pas.
  - `test('rien de lisible : liste vide')`.

- [ ] **Step 2 : Écrire `home-page.test.tsx`**, avec les mocks d'en-tête existants et `renderAt('/')` :
  - `test('en-tête : « Accueil », sous-titre, import, entraînement, création')` : `bannerInteractiveNames()` égal à `['Importer une sauvegarde', 'S’entraîner', 'Créer une session']` ; liens vers `/training/new` et `/new`.
  - `test('Reprendre : les trois plus récents, type, date courte, état')` : deux sessions et un entraînement, plus une session ancienne. Trois `article` dans la région « Reprendre » ; libellés `Session` et `Entraînement` ; `14 oct., 10:42` ; `/ 24 passés` sur la session ; `38 / 60 questions notées` et `72 %` sur l'entraînement ; liens `Reprendre « … »` et `Stats`.
  - `test('Espaces : compteurs, endommagés compris, et « Voir tout »')` : 2 sessions dont une endommagée, 1 entraînement. Lien de la tuile Sessions vers `/sessions` contenant `2` ; tuile Entraînements vers `/trainings` contenant `1` ; tuile Éditeur vers `/editor` avec `Ouvrir l'éditeur`.
  - `test('seulement des endommagés : pas de section Reprendre')`.
  - `test.each([['persisted'], ['unsupported'], [undefined]])('pas de pastille de stockage en %s')` et `test('pastille « Stockage non garanti » en best-effort, explication au survol et au focus')` : celui de l'ancien indicateur, adapté.
  - `test('outdated : bandeau à la place du tableau de bord, import désactivé, création présente')`.
  - `test('unavailable : bandeau, ni création ni entraînement')`.
  - `test('import réussi : l'accueil mène à /sessions, où la carte est visible')` : un fichier valide déposé sur la page (`fireEvent.drop`, comme `import-controller.test.tsx`) ; attendu `router.state.location.pathname` `/sessions` et le titre de carte.

- [ ] **Step 3 : Lancer** `pnpm vitest run src/features/home`. Attendu : FAIL.

- [ ] **Step 4 : Implémenter** d'après l'artboard `accueil`.
  - `recentActivity` : filtre `isDamaged` et `isDamagedTraining`, trie avec `compareRecords` sur l'enregistrement sous-jacent, tronque à `limit`.
  - `HomePage` : `useUi`, `useDbStatus`, `useSessions`, `useTrainings`, `useNavigate`, puis `ImportController` (`disabled={status !== 'open'}`, `onImported={() => void navigate({ to: '/sessions' })}`) autour de `PageShell`. Celui-ci prend `title={menu_home}`, `halo="home"`, `meta` = `home_subtitle` suivi de `<PersistenceBadge ui={ui} />`, et `actions` : `Button variant="ghost"` `IconUpload` + `home_import` ; `Link` `outline` `IconSchool` + `home_train` vers `/training/new` et `Link` par défaut `IconPlus` + `home_create` vers `/new`, ces deux liens masqués si `unavailable`. Contenu en `flex flex-col gap-10` : si la base n'est pas `open`, `DbStatusBanner` seul ; si une des deux listes charge, rien ; sinon `ResumeSection` (absente si `recentActivity` est vide) puis `SpaceTiles`.
  - `ResumeSection` : `section aria-labelledby`, `h2 text-h2` `home_resume_title`, `div grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]`, une carte par élément.
  - `ResumeSessionCard` et `ResumeTrainingCard` : `article` en `bg-card shadow-card rounded-xl p-5 flex flex-col gap-3.5`. Ligne du haut : `SpaceIcon size="sm"`, libellé de type en `text-label`, date `formatShortDateTime` en `ml-auto` 13 px `tabular-nums`. Puis `h3 text-h3 wrap-anywhere`. Pour une session : `config.exam.title` en sous-titre, puis `SessionProgress`. Pour un entraînement : `home_training_coverage_short` en sous-titre et `TrainingFigures showCoverage={false}`, tous deux seulement quand `useTrainingSummary` a rendu sa valeur. En pied (`mt-auto pt-1`) : « Reprendre » (`outline sm`, `aria-label` = `card_resume_named`) et, pour un entraînement, « Stats » (`ghost sm`, `IconChartBar`).
  - `SpaceTiles` : `section` titrée `home_spaces_title`, grille `minmax(min(100%,220px),1fr)` de trois `Link` en carte (`rounded-xl p-5 min-h-49 flex flex-col gap-3`, survol `hover:bg-accent`, anneau de focus visible). En haut, `SpaceIcon size="md"` et, à droite, le compteur en `text-score-md` : `sessions.length` et `trainings.length`, endommagés compris ; l'éditeur n'en a pas. Puis le nom (`menu_sessions`, `home_space_trainings`, `menu_editor`) en `text-h3`, la description en 13 px, et en pied `home_space_view_all` (`home_editor_open` pour l'éditeur) avec `IconArrowRight` de 16 px.
  - `PersistenceBadge` : rien sauf en `best-effort`. Sinon, un `Tooltip` dont le déclencheur est un `button type="button"` en pastille : `inline-flex h-6 items-center gap-1.5 rounded-sm bg-muted px-2.5 text-xs font-semibold text-muted-foreground`, `IconAlertTriangle` de 14 px, texte `persistence_warning_label`. Son contenu est `persistence_warning`. L'artboard pose un `title`, que le clavier et le tactile n'atteignent pas : on garde l'infobulle de l'ancien bouton (le code fait foi).
  - Supprimer `ActionCards`, `HomeActions` et les clés listées plus haut.

- [ ] **Step 5 : Relancer** `pnpm vitest run src/features/home src/lib/i18n && pnpm deps && pnpm typecheck && pnpm lint`. Attendu : PASS.

- [ ] **Step 6 : Commit** `✨ Fait de l'accueil un tableau de bord`.

---

### Task 7: Premier lancement

**Files:**
- Create : `src/features/home/components/first-run.tsx` (+ test)
- Modify : `src/features/home/home-page.tsx`, `src/features/home/home-page.test.tsx`, `src/lib/i18n/ui-messages.ts` (+ test)

**Interfaces:**
- Consumes : `PersistenceBadge` (Task 6), `ImportController` via `openPicker`.
- Produces : `FirstRun({ ui, onImport }: { ui: Ui; onImport: () => void })`.
- Clés i18n (artboard `accueil-premier-lancement` ; l'EN n'est pas maquetté) :

| Clé | FR | EN |
|---|---|---|
| `first_run_title` | `Bienvenue` | `Welcome` |
| `first_run_subtitle` | `Faites passer des oraux notés par tirage au sort, ou révisez seul.` | `Run graded oral exams with random draws, or review on your own.` |
| `first_run_eyebrow` | `Premier lancement` | `First launch` |
| `first_run_heading` | `Votre premier oral en trois étapes` | `Your first oral exam in three steps` |
| `first_run_body` | `Une liste d’étudiants (CSV) et une config (JSON) suffisent. Des exemples sont prêts.` | `A student list (CSV) and a config (JSON) are all you need. Examples are ready.` |
| `first_run_step` `{ n }` | `Étape ${n}` | `Step ${n}` |
| `first_run_step1` | `Téléchargez les exemples` | `Download the examples` |
| `first_run_step2`, `first_run_step2_body` | `Créez une session` / `Avec ces deux fichiers, ou les vôtres.` | `Create a session` / `With these two files, or your own.` |
| `first_run_step3`, `first_run_step3_body` | `Tirez une question et notez` / `La vue projetée affiche la question sur le second écran.` | `Draw a question and grade` / `The projected view shows the question on the second screen.` |
| `first_run_solo_title`, `first_run_solo_body` | `Ou révisez seul` / `À partir d’une config générée par un LLM, sans session ni étudiants.` | `Or review on your own` / `From a config generated by an LLM, no session or students needed.` |
| `first_run_solo_cta` | `S’entraîner seul` | `Practice on your own` |
| `first_run_resources` | `Autres ressources` | `Other resources` |
| `first_run_editor_link` | `Écrire une config dans l’éditeur` | `Write a config in the editor` |
| `first_run_drop_hint` | `Vous pouvez aussi déposer une sauvegarde (.json) n’importe où sur la page.` | `You can also drop a backup (.json) anywhere on the page.` |

`home_students_example_link` devient `Liste d’étudiants d’exemple (.csv)` / `Example student list (.csv)` ; `home_config_example_link` devient `Config d’exemple (.json)` / `Example config (.json)`.

- [ ] **Step 1 : Écrire les tests qui échouent.**
  - `home-page.test.tsx` :
    - `test('aucune session ni aucun entraînement : premier lancement, ni Reprendre ni Espaces')` : `h1` « Bienvenue », `h2` « Votre premier oral en trois étapes », trois `listitem` dans la liste ordonnée.
    - `test('une session endommagée seule : tableau de bord, pas de premier lancement')`.
    - `test('premier lancement en best-effort : pastille présente')`.
    - `test('outdated ou unavailable sans donnée : bandeau, jamais le premier lancement')`.
  - `first-run.test.tsx` (`renderInRouter` ou `renderAt('/')` sur base vide) :
    - `test('liens d'exemple téléchargeables, schéma dans un nouvel onglet')` : `href` en `${BASE_URL}students.example.csv` et `config.example.json` avec `download`, schéma `target="_blank" rel="noreferrer"`.
    - `test('créer, s'entraîner seul, éditeur')` : liens vers `/new`, `/training/new` et `/editor`.
    - `test('« Importer une sauvegarde » appelle onImport')`, puis le texte `first_run_drop_hint`.

- [ ] **Step 2 : Lancer** `pnpm vitest run src/features/home`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter.**
  - `HomePage` : quand la base est `open`, les deux listes lues et vides, `PageShell` prend le titre `first_run_title`, en `meta` `first_run_subtitle` et `PersistenceBadge`, aucune `actions`, le halo `home` ; contenu `<FirstRun ui={ui} onImport={openPicker} />`. Le dépôt n'importe où reste actif (même `ImportController`).
  - `FirstRun` d'après l'artboard :
    - La `section aria-labelledby` en carte `rounded-xl px-8 pt-10 pb-8 relative isolate overflow-hidden flex flex-col items-center gap-6 text-center`, avec un halo centré propre (`left-1/2 -top-42 h-95 w-155 -translate-x-1/2`, `halo-action`).
    - L'en-tête : surtitre `text-label`, `h2 text-[22px] leading-7 font-bold`, corps `max-w-130 text-muted-foreground`.
    - Un `ol` en grille `minmax(min(100%,200px),1fr)`, `max-w-205`, de trois étapes `rounded-md bg-muted p-4 text-left`. Chacune porte « Étape n » en `text-label`, son titre en `font-semibold`, puis soit les deux liens d'exemple (`SMALL_TEXT_LINK_CLASS`, `IconDownload` de 16 px), soit son corps en 13 px.
    - Le bouton principal : `Link` vers `/new`, `IconPlus` + `home_create`.
    - Sous un filet `border-t`, à gauche `SpaceIcon space="training" size="md"`, le titre et le corps « solo » ; à droite, `Link outline` `first_run_solo_cta` vers `/training/new`.
    - Après la section, `nav aria-label={first_run_resources}` (centrée, `gap-x-7 gap-y-2`, liens en 13 px `text-muted-foreground`) : le schéma (`IconBraces`, `IconExternalLink`), l'éditeur (`IconFileCode`), puis « Importer une sauvegarde » en `button` (`IconUpload`). Enfin `first_run_drop_hint`, en 13 px centré.

- [ ] **Step 4 : Relancer** `pnpm vitest run src/features/home src/lib/i18n && pnpm deps && pnpm typecheck && pnpm lint`. Attendu : PASS.

- [ ] **Step 5 : Commit** `✨ Guide le premier lancement depuis l'accueil`.

---

### Task 8: E2E, vérification visuelle, mémoire et PR

**Files:**
- Modify : `e2e/pages/home-page.ts` ; Create : `e2e/pages/sessions-page.ts`, `e2e/pages/trainings-page.ts`, `e2e/home.spec.ts`
- Modify : les specs qui appellent `home.trainings`, `home.trainingCard`, `home.openTraining`, `home.openTrainingStats` ou `home.openDeleteDialog` (`rtk proxy grep -rnE 'home\.(trainings|trainingCard|openTraining|openTrainingStats|openDeleteDialog)' e2e`), plus `e2e/long-words.spec.ts` et `e2e/languages.spec.ts` s'ils visent les cartes de l'accueil
- Canevas : les artboards touchés par un écart (Step 5)
- Mémoire : `docs/INDEX.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md` (D106), `docs/CONVENTIONS.md`, `docs/QUIRKS.md` et `docs/BACKLOG.md` au besoin ; corps de la PR #154

**Interfaces:**
- Produces (Page Objects) :
  - `HomePage` : `goto()`, `createSession()` (premier lien « Créer une session » du `main`), `startTraining()` (premier lien du `main` dont le nom commence par « S’entraîner »), `openEditor()` (tuile Éditeur ou lien « Écrire une config dans l’éditeur »), `resumeCard(name)`.
  - `SessionsPage` : `goto()` (`#/sessions`), `sessionCard(name)`, `openDeleteDialog(name)`.
  - `TrainingsPage` : `goto()` (`#/trainings`), `trainings` (région « Mes entraînements »), `trainingCard(name)`, `openTraining(name)`, `openTrainingStats(name)`, déplacés tels quels de `HomePage`.

- [ ] **Step 1 : Réécrire les Page Objects** et adapter les specs : une spec qui ouvrait une carte depuis l'accueil passe par `SessionsPage` ou `TrainingsPage`.

- [ ] **Step 2 : Écrire `e2e/home.spec.ts`.**
  - `test('base vide : premier lancement, puis tableau de bord après une session')` : « Votre premier oral en trois étapes » visible ; une session créée avec les fichiers d'exemple ; de retour sur l'accueil, une carte dans « Reprendre » et le compteur `1` sur la tuile Sessions.
  - `test('« Voir tout » mène aux pages d'espace')`.
  - `test('390 px : aucun défilement horizontal sur l'accueil, Sessions et Entraînements')` : pour chaque page, `document.documentElement.scrollWidth <= clientWidth`, avec une session et un entraînement en base.

- [ ] **Step 3 : Lancer** `pnpm check` puis `pnpm e2e`. Attendu : tout vert. Une spec qui casse sur un comportement (et non sur un libellé) est une régression à corriger dans le code.

- [ ] **Step 4 : Comparer aux artboards**, avec des captures Playwright à 1280 × 860 et à 390 × 844 : accueil avec et sans données, `/sessions` avec une carte endommagée, `/trainings`, dialogues (renommer, examinateur, suppressions, erreur et conflit d'import, voile de dépôt). Pour chaque capture, relever les écarts à l'artboard de même nom.

- [ ] **Step 5 : Aligner** : un écart non voulu se corrige dans le code. Un écart voulu met à jour l'artboard : pastille de stockage focalisable, état vide de `/trainings` s'il faut le montrer. Publier le canevas avec `root` et `files`, en ne touchant que ces artboards (lecture complète d'abord, QUIRKS 2026-10-17).

- [ ] **Step 6 : Mettre à jour la mémoire.**
  - `INDEX.md` : une ligne #147.
  - `HANDOFF.md` : une entrée datée avec les quatre marqueurs.
  - **D106** dans `DECISIONS.md` :
    - l'import partagé dans `components/import/` ;
    - l'accueil qui mène à `/sessions` après un import ;
    - le taux global `TrainingStats.rate` ;
    - la règle du premier lancement (base `open` et zéro enregistrement, endommagés compris) ;
    - « Reprendre » sans les endommagés, mais compteurs qui les incluent ;
    - la pastille de stockage gardée en infobulle ;
    - le `h1` « Accueil » à la place de `app_title`.
  - `CONVENTIONS.md` § Page examinateur : props `icon` (page d'espace : `SpaceIcon size="lg"`) et `halo` (`home` pour l'accueil, `space` pour une page d'espace), et la règle des grilles `min(100%, Npx)`.
  - `QUIRKS.md` pour tout piège rencontré, par exemple l'espace insécable fine d'ICU dans les dates anglaises. `BACKLOG.md` pour ce qui est repoussé.

- [ ] **Step 7 : Corps de la PR #154** : passer #146 en « validé » ; ajouter la section « #147 — Accueil et pages d'espace (à valider) » (plan, D106, points clés), la ligne de tests, et la note sur les halos : leur premier usage est ici, avec le thème par défaut ; la vérification sous un thème de session reste à faire avec #149. Cocher la mémoire #147 dans la checklist.

- [ ] **Step 8 : Pousser**, attendre la CI, lancer `.claude/scripts/sonar-check.sh --pr 154 --wait` et corriger jusqu'à « Quality gate OK », 0 issue, 0 hotspot. La PR reste en brouillon.

- [ ] **Step 9 : Faire valider l'utilisateur en local** (`pnpm dev` sur le tailnet, à 1280 px et sur téléphone). C'est un point d'arrêt : #148 ne commence pas sans son accord.
