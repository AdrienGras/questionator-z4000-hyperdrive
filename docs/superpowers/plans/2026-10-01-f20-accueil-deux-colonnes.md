# F20 — Accueil sur deux colonnes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Accueil en deux colonnes (cartes d'action descriptives à gauche, sessions à droite) et export Excel depuis le menu de chaque carte de session.

**Architecture:** La logique d'export Excel (fonction `exportWorkbook` + hook `useWorkbookExport` avec garde en `useRef`) remonte dans `src/components/export/`, partagée par `ExportButton` (vue de passage) et la carte de session (accueil). L'accueil garde `PageShell` et `ImportController` ; son contenu devient une grille `24rem | 1fr` à partir de `lg`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn (base-ui), Vitest + Testing Library, Dexie (fake-indexeddb en test).

**Spec:** `docs/superpowers/specs/2026-10-01-f20-accueil-deux-colonnes-design.md`

## Global Constraints

- Arborescence D59 : `components/` n'importe aucune feature ; une feature n'importe jamais une autre feature ; imports `@/…` (`./` seulement dans le même dossier, `../` interdit) ; pas de barrel ; kebab-case. `pnpm deps` vert.
- `@/lib/xlsx/*` ne s'importe qu'en `import()` dynamique (D71) ; `check:bundle` (dans `pnpm check`) doit rester vert.
- Libellés i18n en fr **et** en en (`src/lib/i18n/ui-messages.ts` : type, fr, en ; la table `SAMPLE` de `ui-messages.test.ts` liste chaque clé). Textes exacts : ceux de la spec, § Architecture.
- Colonnes : `lg:grid-cols-[24rem_minmax(0,1fr)]`, liste `2xl:grid-cols-2`.
- Commits gitmoji en français, présent, emoji Unicode, terminés par :
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01EtRb32mHbi1w7WczeEkbh4
  ```
- Commandes préfixées par `rtk` ; `rtk pnpm check` vert avant chaque commit.

## Review Focus

- Double clic très rapide sur « Exporter en Excel » (vue de passage) ou deux ouvertures du menu : un seul fichier. → test de garde en Task 1.
- Export qui échoue puis réussit : l'alerte disparaît. → test en Task 1 (état) et Task 2 (alerte de carte).
- Base `outdated` / `unavailable` : la carte d'import est désactivée, la carte de création masquée en `unavailable`, le glisser-déposer reste refusé. → tests en Task 4.
- Titres `h2` des sessions : les tests (et les lecteurs d'écran) ne doivent pas mélanger titres d'action et titres de session. → test « liste triée » scopé en Task 4.
- Accueil sans clic sur l'export : aucun chunk xlsx. → `check:bundle` à chaque tâche.

---

### Task 1: Export partagé — `exportWorkbook` et `useWorkbookExport`

**Files:**
- Move (`git mv`): `src/features/session/export-workbook.ts` → `src/components/export/export-workbook.ts`
- Create: `src/components/export/use-workbook-export.ts`, `src/components/export/use-workbook-export.test.ts`
- Modify: `src/features/session/components/export-button.tsx`, `src/features/session/export-button.test.tsx` (chemin du mock)

**Interfaces:**
- Produces:
  - `exportWorkbook(session: Session, locale: Locale): Promise<void>` dans `@/components/export/export-workbook` (inchangé).
  - `type WorkbookExportState = 'idle' | 'busy' | 'failed'` et `useWorkbookExport(locale: Locale): { state: WorkbookExportState; run: (session: Session) => Promise<void> }` dans `@/components/export/use-workbook-export`. `Locale` vient de `@/lib/i18n/i18n`.

- [ ] **Step 1: Write the failing tests** — `use-workbook-export.test.ts` (`renderHook`, `vi.mock('@/components/export/export-workbook')`) :
  - `'un seul export pour deux appels dans le même tick'` : `exportWorkbook` renvoie une promesse gardée ouverte ; `act(() => { void result.current.run(s); void result.current.run(s) })` → `toHaveBeenCalledTimes(1)`, `state === 'busy'` ; résoudre → `state === 'idle'`.
  - `'échec → failed, puis nouvel essai repasse par busy'` : rejet → `failed` ; second `run` avec résolution → `idle`, `toHaveBeenCalledTimes(2)`.
  - `'appelle exportWorkbook avec la session et la locale'` → `toHaveBeenCalledWith(session, 'en')` pour `useWorkbookExport('en')`.
- [ ] **Step 2:** `rtk pnpm vitest run src/components/export` → FAIL.
- [ ] **Step 3:** `git mv` ; créer le hook (ref `running`, `finally` qui le remet à faux ; JSDoc : garde en ref, pas en état, BACKLOG #54) ; `ExportButton` utilise `useWorkbookExport(ui.locale)` (`state`, `run(session)`), rendu inchangé ; mock de `export-button.test.tsx` sur le nouveau chemin.
- [ ] **Step 4:** `rtk pnpm vitest run src/components/export src/features/session/export-button.test.tsx` → PASS ; `rtk pnpm check` vert (dont `deps` et `check:bundle`).
- [ ] **Step 5:** Commit `♻️ Partage l'export Excel dans components/export avec une garde en ref`.

---

### Task 2: Export Excel depuis le menu de la carte de session

**Files:**
- Modify: `src/features/home/components/session-card.tsx`
- Test: `src/features/home/home-page.test.tsx`

**Interfaces:**
- Consumes: `useWorkbookExport` (Task 1).

- [ ] **Step 1: Write the failing tests** — dans `home-page.test.tsx`, `vi.mock('@/components/export/export-workbook')` ; ouvrir le menu d'une session comme le test « exporter depuis le menu télécharge le backup » :
  - `'« Exporter en Excel » exporte la session dans la langue de l’interface'` → `exportWorkbook` appelé une fois avec la session stockée (`expect.objectContaining({ id })`) et `'fr'` ; l'item suit « Exporter un backup » dans l'ordre des `menuitem`.
  - `'export Excel en échec : alerte sur la carte'` → rejet → `findByRole('alert')` avec le texte de `export_error`.
  - `'item désactivé pendant l’export'` → promesse gardée ouverte, réouvrir le menu → item « Export… » `aria-disabled="true"` (ou `toBeDisabled` selon le rendu base-ui : vérifier et asserter l'attribut effectivement posé).
- [ ] **Step 2:** `rtk pnpm vitest run src/features/home/home-page.test.tsx` → FAIL.
- [ ] **Step 3:** Implémenter selon la spec (§ `session-card.tsx`).
- [ ] **Step 4:** `rtk pnpm vitest run src/features/home` → PASS ; `rtk pnpm check` vert.
- [ ] **Step 5:** Commit `✨ Exporte une session en Excel depuis l'accueil`.

---

### Task 3: Cartes d'action

**Files:**
- Create: `src/features/home/components/action-cards.tsx`, `src/features/home/components/action-cards.test.tsx`
- Modify: `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Produces: `ActionCards({ ui, storageAvailable, importDisabled, onImport }: Readonly<{ ui: Ui; storageAvailable: boolean; importDisabled: boolean; onImport: () => void }>)` dans `@/features/home/components/action-cards`. Clés i18n nouvelles : `home_actions_title`, `home_sessions_title`, `home_create_title`, `home_create_body`, `home_students_example_link`, `home_config_example_link`, `home_config_schema_link`, `home_import_title`, `home_import_body` (textes : spec ; `home_actions_title` fr « Actions » en « Actions » ; `home_sessions_title` fr « Sessions » en « Sessions »).

- [ ] **Step 1: Write the failing tests** — rendu direct avec `ui = makeUi()` (`@/testing/make-ui`) :
  - `'section « Actions » avec deux cartes titrées'` → `getByRole('region', { name: 'Actions' })`, `heading` level 3 « Nouvelle session » et « Restaurer une session ».
  - `'création : texte, trois liens, lien vers /new'` → texte `home_create_body` ; `link` « Télécharger la liste d'étudiants d'exemple » `href` finissant par `students.example.csv` + `download` ; « Télécharger la config d'exemple » → `config.example.json` + `download` ; « JSON Schema de la config » → `config.schema.json`, `target="_blank"`, `rel` contenant `noreferrer` ; `link` « Créer une session » → `href` `/new` (ou se terminant par `#/new` selon le routeur de test : le rendre sous `renderAt` si `Link` l'exige, sinon via le wrapper routeur existant de `@/testing/`).
  - `'import : texte et bouton qui appelle onImport'` ; `'import désactivé'` (`importDisabled`) ; `'création masquée sans stockage'` (`storageAvailable: false` → pas de « Nouvelle session »).
- [ ] **Step 2:** `rtk pnpm vitest run src/features/home/components/action-cards.test.tsx` → FAIL.
- [ ] **Step 3:** Clés i18n (fr + en + `SAMPLE`), puis le composant (spec § `action-cards.tsx`). Icônes `IconPlus`, `IconFileImport` de `@tabler/icons-react`, `aria-hidden`.
- [ ] **Step 4:** `rtk pnpm vitest run src/features/home src/lib/i18n` → PASS ; `rtk pnpm check` vert.
- [ ] **Step 5:** Commit `✨ Ajoute les cartes d'action de l'accueil`.

---

### Task 4: Mise en page de l'accueil sur deux colonnes

**Files:**
- Modify: `src/features/home/home-page.tsx`, `src/features/home/components/home-actions.tsx`, `src/features/home/components/empty-state.tsx`, `src/features/home/components/session-list.tsx`, `src/lib/i18n/ui-messages.ts` (+ test), `src/features/home/home-page.test.tsx`, `e2e/` si un spec clique sur les anciens boutons (`e2e/pages/home-page.ts` utilise `link` « Créer une session » `.first()` : doit continuer à marcher)

**Interfaces:**
- Consumes: `ActionCards` (Task 3).

- [ ] **Step 1: Write / update the failing tests** in `home-page.test.tsx` :
  - Remplacer `'barre de titre : Importer un backup, Créer une session, puis le thème en dernier'` par `'barre de titre : plus de création ni d’import, thème en dernier'` → `bannerInteractiveNames()` ne contient ni « Créer une session » ni « Importer un backup » ; `expectColorModeToggleLast()`.
  - Remplacer `'état vide : message, création, import et config d’exemple'` par `'état vide : message seul, actions à gauche'` → dans la `region` « Sessions » : heading « Aucune session », texte `empty_body` (nouveau), aucun `link` ni `button` ; dans la `region` « Actions » : lien « Créer une session » et bouton « Importer un backup ».
  - `'liste triée…'` : lire les `heading` level 2 **dans** la `region` « Sessions ».
  - `'outdated'` / `'unavailable'` : le bouton « Importer un backup » (carte d'action) est désactivé ; en `unavailable`, pas de lien « Créer une session ».
  - `'deux colonnes : actions avant sessions'` → `region` « Actions » précède `region` « Sessions » dans le DOM (`compareDocumentPosition`), parent commun porte `lg:grid-cols-[24rem_minmax(0,1fr)]`.
- [ ] **Step 2:** `rtk pnpm vitest run src/features/home` → FAIL.
- [ ] **Step 3:** Implémenter selon la spec (§ `home-actions.tsx`, `empty-state.tsx`, `session-list.tsx`, `home-page.tsx`) ; supprimer les clés `empty_example_link` et `empty_students_example_link` (type, fr, en, `SAMPLE`) et réécrire `empty_body` (fr, en). Mettre à jour les JSDoc (`HomePage`, `HomeActions`, `EmptyState`).
- [ ] **Step 4:** `rtk pnpm vitest run src/features/home src/lib/i18n` → PASS ; `rtk pnpm check` vert ; `rtk pnpm e2e` 10/10.
- [ ] **Step 5:** Commit `💄 Passe l'accueil sur deux colonnes`.

---

### Task 5 (session principale) : mémoire projet, vérification visuelle

- D78, `PRODUCT.md` F03 / F16, INDEX, BACKLOG (deux items → #54), HANDOFF, CONVENTIONS si besoin.
- `pnpm dev` 1440 / 900 px, onglet réseau (chunk xlsx au clic seulement).
