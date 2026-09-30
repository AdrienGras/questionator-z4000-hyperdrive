# F22 — Aperçu de la vue projetée — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La vue de passage affiche un aperçu réduit et en direct de la vue projetée, avec les boutons de projection juste en dessous.

**Architecture:** Les composants de la vue projetée remontent de `features/present/components/` vers `src/components/projection/`, derrière un point d'entrée `ProjectedScreen`. La vue de passage calcule `toProjectedView(session)` et la rend dans un canevas virtuel 1280 × 720 réduit par `transform: scale`. Les seuils de mise en page passent en container queries pour que le canevas se comporte comme un écran de 1280 px quelle que soit la fenêtre examinateur.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (container queries natives), Vitest + Testing Library (jsdom), Dexie (fake-indexeddb en test).

**Spec:** `docs/superpowers/specs/2026-09-30-f22-apercu-projection-design.md`

## Global Constraints

- Arborescence D59 : `components/` n'importe aucune feature ; une feature n'importe jamais une autre feature ; imports `@/…` (`./` seulement dans le même dossier, `../` interdit) ; pas de barrel ; fichiers en kebab-case. `pnpm deps` doit passer.
- Canevas : `CANVAS_WIDTH = 1280`, `CANVAS_HEIGHT = 720`, échelle `width / 1280`.
- Seuil conteneur : `@min-[40rem]:` partout où il y avait `sm:` dans les composants projetés et `CategoryLayout`.
- Aucun composant de `src/components/projection/` ni `ProjectionPreview` ne reçoit ou n'importe `Session`, `Student` ou `NormalizedConfig` : seulement `ProjectedView` (D69).
- Nouvelle clé i18n `projection_preview_label` : fr « Vue projetée », en « Projected view ».
- Commits gitmoji en français, présent, emoji Unicode, avec les lignes :
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01EtRb32mHbi1w7WczeEkbh4
  ```
- Préfixer les commandes shell par `rtk` (ex. `rtk pnpm vitest run <fichier>`, `rtk git commit`). Vérification finale de chaque tâche : `rtk pnpm check` vert.
- Commentaires en français, densité du code voisin (JSDoc court sur chaque composant exporté).

## Review Focus

- Projection pointant vers un étudiant supprimé ou absent : l'aperçu montre l'écran d'attente, comme la vue projetée (`toProjectedView` renvoie `waiting`). → test en Task 5.
- Colonne masquée ou largeur non encore mesurée (`width === 0`) : pas d'échelle 1 visible, pas de `scale(0)` qui ferait croire à un aperçu vide définitif ; le canevas réapparaît à la première mesure. → test en Task 4.
- Énoncé contenant un lien Markdown : ne doit pas être atteignable au clavier depuis l'aperçu (`inert`). → test en Task 4.
- Popup bloquée puis ouverture réussie au clic suivant : le message disparaît et ne revient pas. → test en Task 6.
- Composant `ProjectionControls` qui reste monté quand `sessionId` change : « Ouvrir » ne ramène pas au premier plan la fenêtre de l'ancienne session. → test en Task 6.

---

### Task 1: Seuils de `CategoryLayout` en container queries

**Files:**
- Modify: `src/components/category-layout.tsx`
- Test: `src/components/category-layout.test.tsx`

**Interfaces:**
- Produces: `CategoryLayout` inchangé en API ; la `ul` est enveloppée dans un `div.@container`.

- [ ] **Step 1: Write the failing test** — dans `category-layout.test.tsx` :

```tsx
test('seuils mesurés sur le conteneur, pas sur la fenêtre (F22)', () => {
  const { list } = mount(4)
  expect(list.parentElement).toHaveClass('@container')
  expect(list.className).toContain('@min-[40rem]:grid-cols-[repeat(var(--cols),minmax(0,1fr))]')
  expect(list.className).not.toMatch(/(^|\s)sm:/)
  expect(screen.getAllByRole('listitem')[0]?.className).toContain('@min-[40rem]:col-span-2')
})
```

- [ ] **Step 2:** `rtk pnpm vitest run src/components/category-layout.test.tsx` → FAIL.
- [ ] **Step 3:** Envelopper la `ul` dans `<div className="@container">` ; remplacer les trois préfixes `sm:` par `@min-[40rem]:`. Mettre à jour le JSDoc (« Une seule colonne sous 40rem de conteneur »). `className` et `aria-label` restent sur la `ul`.
- [ ] **Step 4:** `rtk pnpm vitest run src/components/category-layout.test.tsx src/features/present src/features/session` → PASS (dont le test D74 `tile.closest('ul')` de la vue projetée).
- [ ] **Step 5:** Commit `🎨 Mesure le repli des tuiles sur leur conteneur`.

---

### Task 2: Extraction vers `src/components/projection/` et `ProjectedScreen`

**Files:**
- Move (`git mv`): `src/features/present/components/{student-screen,waiting-screen,final-card,final-card.test,category-tiles,draw-reveal}.tsx` → `src/components/projection/`
- Create: `src/components/projection/projected-screen.tsx`, `src/components/projection/projected-screen.test.tsx`
- Modify: `src/features/present/present-page.tsx`, `src/features/present/draw-reveal.test.tsx` (import), `src/features/present/present-page.test.tsx` (test d'architecture)

**Interfaces:**
- Produces:
  - `ProjectedScreen({ view, animate = true, className }: Readonly<{ view: ProjectedView; animate?: boolean; className?: string }>)` dans `@/components/projection/projected-screen`. Racine : `div` `cn('@container flex flex-col', className)`.
  - `StudentScreen({ view, animate = true }: Readonly<{ view: ProjectedStudentView; animate?: boolean }>)` : `DrawReveal` reçoit `animate && view.drawAnimation && current.drawnAt !== initialDrawnAt`.

- [ ] **Step 1: Write the failing tests** — `projected-screen.test.tsx` (rendu direct avec une `ProjectedView` littérale, sous le provider de langue que les autres tests de composants utilisent — voir `final-card.test.tsx` / `makeUi` ; si `useUi()` sans provider suffit en test, rendre sans) :
  - `'attente : titre de l’épreuve et message d’attente'` → `getByRole('heading', { name: <examTitle> })` et le texte de `present_waiting`.
  - `'étudiant : nom complet en titre'` → heading « Ada Lovelace ».
  - `'animate={false} : énoncé immédiat, sans cartes, même avec drawAnimation'` → vue étudiant avec `current` et `drawAnimation: true`, rerender avec un nouveau `current.drawnAt` : l'énoncé est présent et `container.querySelectorAll('[data-card]')` a une longueur 0.
  - `'racine en @container, className transmis'` → `container.firstElementChild` a les classes `@container` et `min-h-svh` quand `className="min-h-svh"`.
  - Dans `present-page.test.tsx`, le test d'architecture parcourt `['src/features/present', 'src/components/projection']` (même filtre, même motifs `domain/session/types` et `NormalizedConfig`), `files.length` > 0 pour chaque racine.
- [ ] **Step 2:** `rtk pnpm vitest run src/components/projection src/features/present` → FAIL (module introuvable).
- [ ] **Step 3:** `git mv` des six fichiers ; corriger leurs imports internes (`@/components/projection/…`). `StudentScreen` : `min-h-svh` → `flex-1`, `sm:p-10` → `@min-[40rem]:p-10`, prop `animate`. `WaitingScreen` : `min-h-svh` → `flex-1`. Créer `ProjectedScreen` (reprend l'aiguillage et la `key` `${lastName}\u0000${firstName}` de `PresentPage`, commentaire compris). `PresentPage` rend `<PresentControls idle={idle} />` puis `<ProjectedScreen view={view} className="min-h-svh" />` dans son `main`. `draw-reveal.test.tsx` importe `DrawReveal` depuis `@/components/projection/draw-reveal`.
- [ ] **Step 4:** `rtk pnpm vitest run src/components src/features/present` → PASS, sans autre modification des tests F14. `rtk pnpm deps` → vert.
- [ ] **Step 5:** Commit `♻️ Partage les écrans de la vue projetée dans components/projection`.

---

### Task 3: Hook `useElementWidth`

**Files:**
- Create: `src/hooks/use-element-width.ts`, `src/hooks/use-element-width.test.tsx`

**Interfaces:**
- Produces: `useElementWidth<T extends Element>(): [ref: RefCallback<T>, width: number]` dans `@/hooks/use-element-width`. `width` = `entry.contentRect.width` du dernier rappel, `0` avant toute mesure. Un nouvel élément déconnecte l'ancien observateur ; `ref(null)` et le démontage le déconnectent.

- [ ] **Step 1: Write the failing tests** — `ResizeObserver` simulé par `vi.stubGlobal` : une classe qui mémorise son rappel et expose `observe`/`disconnect` espionnés ; un composant de test `<div ref={ref}>{width}</div>`.
  - `'0 avant la première mesure'`.
  - `'suit contentRect.width à chaque rappel'` → appeler le rappel dans `act` avec `[{ contentRect: { width: 384 } }]` → texte `384` ; puis `512` → `512`.
  - `'déconnecte au démontage'` → `unmount()` → `disconnect` appelé.
- [ ] **Step 2:** `rtk pnpm vitest run src/hooks` → FAIL.
- [ ] **Step 3:** Implémenter avec `useState` (largeur) et un `useCallback` de ref qui garde l'observateur courant dans un `useRef`. JSDoc : « Largeur du contenu d'un élément, suivie par `ResizeObserver` ; 0 avant la première mesure. »
- [ ] **Step 4:** `rtk pnpm vitest run src/hooks` → PASS ; `rtk pnpm deps` → vert.
- [ ] **Step 5:** Commit `✨ Ajoute un hook de largeur d'élément`.

---

### Task 4: Composant `ProjectionPreview`

**Files:**
- Create: `src/features/session/components/projection-preview.tsx`, `src/features/session/components/projection-preview.test.tsx`
- Modify: `src/lib/i18n/ui-messages.ts` (type + fr + en de `projection_preview_label`)

**Interfaces:**
- Consumes: `ProjectedScreen` (Task 2), `useElementWidth` (Task 3).
- Produces: `ProjectionPreview({ ui, view }: Readonly<{ ui: Ui; view: ProjectedView }>)` dans `@/features/session/components/projection-preview`. DOM : `section[aria-labelledby]` → `h2` (`projection_preview_label`, `text-sm font-medium text-muted-foreground`) ; boîte `div.relative.aspect-video.w-full.overflow-hidden.rounded-md.border` (ref de mesure) ; canevas `div[data-projection-canvas][aria-hidden="true"][inert]`, `absolute top-0 left-0 h-[720px] w-[1280px] origin-top-left bg-background text-foreground`, `style.transform = scale(${width / 1280})`, `style.visibility = 'hidden'` tant que `width === 0`.

- [ ] **Step 1: Write the failing tests** — `ResizeObserver` simulé comme en Task 3 (le déclencher à 384 dans `act`) ; `ui = makeUi()` ; vues littérales :
  - `'section intitulée « Vue projetée »'` → `getByRole('region', { name: 'Vue projetée' })`.
  - `'canevas réduit à la largeur mesurée'` → après mesure 384 : `canvas.style.transform === 'scale(0.3)'`, `visibility` vide.
  - `'canevas caché avant la première mesure'` → `canvas.style.visibility === 'hidden'`.
  - `'canevas hors de l’arbre d’accessibilité et du clavier'` → `aria-hidden="true"`, `hasAttribute('inert')` ; avec un énoncé `'[doc](https://example.org)'` : `queryByRole('link')` → null (le lien est dans le DOM du canevas mais pas exposé).
  - `'aucune iframe'` → `container.querySelector('iframe')` null.
  - `'tirage animé côté projection, immédiat dans l’aperçu'` → vue avec `drawAnimation: true`, rerender avec un nouveau `drawnAt` : énoncé dans le canevas, aucun `[data-card]`.
- [ ] **Step 2:** `rtk pnpm vitest run src/features/session/components/projection-preview.test.tsx` → FAIL.
- [ ] **Step 3:** Ajouter la clé i18n (le test `ui-messages.test.ts` vérifie la parité fr/en), puis le composant avec `CANVAS_WIDTH = 1280` / `CANVAS_HEIGHT = 720` en constantes de module et `<ProjectedScreen view={view} animate={false} className="h-full" />` dans le canevas. JSDoc : aperçu réduit, même rendu que la vue projetée, ne reçoit que la `ProjectedView` (D69, D77).
- [ ] **Step 4:** `rtk pnpm vitest run src/features/session/components/projection-preview.test.tsx src/lib/i18n` → PASS.
- [ ] **Step 5:** Commit `✨ Ajoute l'aperçu réduit de la vue projetée`.

---

### Task 5: Aperçu et contrôles dans la vue de passage

**Files:**
- Modify: `src/features/session/components/examiner-view.tsx`
- Test: `src/features/session/projection.test.tsx` (suivi en direct, placement), nouveau `src/features/session/projection-preview-leak.test.tsx` (étanchéité)

**Interfaces:**
- Consumes: `ProjectionPreview` (Task 4), `toProjectedView` (`@/domain/presentation/projected-view`).

- [ ] **Step 1: Write the failing tests** — `ResizeObserver` simulé (mesure 384) ; aide locale `preview = () => screen.getByRole('region', { name: 'Vue projetée' })` et `canvas = () => preview().querySelector('[data-projection-canvas]')!`.
  - `projection.test.tsx`, `'aperçu : suit la projection en direct'` : `mountSession([A, B])` → canevas contient le message d'attente ; clic « Projeter cet étudiant » → `waitFor` : canevas contient « X Aba » (prénom nom tel que rendu par `StudentScreen`) ; clic « Écran d'attente » → `waitFor` : message d'attente revenu.
  - `'aperçu : tirage puis note finale'` : étudiant projeté, clic sur une catégorie de la grille (helper `categoryButton` de `@/testing/passage-assertions`) → énoncé (`prompt` = id de la question) dans le canevas ; session semée avec un étudiant terminé et `finalRevealed`, projeté → la note finale (texte de `present_final`) est dans le canevas. S'appuyer sur `makeStudent` / options existantes ; si l'état « note révélée » n'y est pas exprimable, semer via `updateSession` comme dans `present-page.test.tsx`.
  - `'aperçu : étudiant projeté supprimé → attente'` : `projection: { mode: 'student', studentId: 'inconnu' }` → canevas en attente.
  - `'contrôles sous l’aperçu, hors de l’en-tête'` : `within(screen.getByRole('banner'))` ne contient pas « Ouvrir la vue projetée » ; `preview().compareDocumentPosition(open()) & Node.DOCUMENT_POSITION_FOLLOWING` non nul ; les tests de désactivation existants restent inchangés.
  - `projection-preview-leak.test.tsx`, `'aperçu étanche : rien de réservé à l’examinateur'` : session semée (config propre au test, calquée sur `present-page.test.tsx`) avec marqueurs uniques `ANSWER-7Q`, `COMMENT-7Q`, `SKIP-7Q`, le score cumulé masqué (`presentation.showCumulativeScore: false`) avec une note de valeur marquante (ex. 0,37 → « 0,37 » absent du canevas ; voir le test d’étanchéité de `present-page.test.tsx` pour la forme), étudiant actif = étudiant projeté, question en cours dont la réponse attendue est `ANSWER-7Q`, commentaire `COMMENT-7Q`, une tentative sautée de motif `SKIP-7Q`. Assertions : `document.body.textContent` contient `ANSWER-7Q` (page examinateur) ; `canvas().textContent` ne contient aucun des trois marqueurs ni la note masquée.
- [ ] **Step 2:** `rtk pnpm vitest run src/features/session/projection.test.tsx src/features/session/projection-preview-leak.test.tsx` → FAIL.
- [ ] **Step 3:** Dans `ExaminerView` : `const projected = useMemo(() => toProjectedView(session), [session])` ; retirer `ProjectionControls` des `actions` (reste le bouton « Panneau ») ; enfant de `PageShell` (avant `SidePanel`) :

```tsx
<div className="flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
  <div className="flex w-full max-w-xl flex-col gap-3 lg:col-start-2 lg:row-start-1 lg:max-w-none">
    <ProjectionPreview ui={ui} view={projected} />
    <ProjectionControls … inchangé … />
    <ProjectionBanner … inchangé … />
  </div>
  <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
    {/* erreur role="alert" et PassageBody inchangés, commentaire compris */}
  </div>
</div>
```

  Mettre à jour le JSDoc d'`ExaminerView` (aperçu et contrôles de projection en colonne droite, F22).
- [ ] **Step 4:** `rtk pnpm vitest run src/features/session` → PASS (toute la feature, dont `examiner-view.test.tsx` et `side-panel.test.tsx`).
- [ ] **Step 5:** Commit `✨ Affiche l'aperçu de la projection dans la vue de passage`.

---

### Task 6: Pilotage F14 — popup bloquée et fenêtre liée à la session

**Files:**
- Modify: `src/features/session/components/projection-controls.tsx`
- Test: `src/features/session/projection.test.tsx`

**Interfaces:**
- `ProjectionControls` : API inchangée.

- [ ] **Step 1: Write the failing tests** (réutiliser `fakeWindow` / `stubOpen`) :
  - `'popup bloquée : message effacé au clic suivant'` : `stubOpen(null)`, clic « Ouvrir » → `role="alert"` avec le texte de `projection_popup_blocked` ; clic « Écran d'attente » (session projetée sur B pour qu'il soit actif) → alerte absente. Même test avec « Projeter cet étudiant ».
  - `'popup bloquée puis ouverture réussie : message effacé'` : `stubOpen(null)` puis `mockReturnValue(win)`, deux clics « Ouvrir » → alerte absente.
  - `'fenêtre d’une autre session : rouverte, pas ramenée'` : rendre `ProjectionControls` directement (`render`, `ui = makeUi()`, `projection: { mode: 'waiting' }`, `onProject` = `vi.fn()`), `stubOpen(win)` ; clic « Ouvrir » avec `sessionId="s1"` ; `rerender` avec `sessionId="s2"` ; clic « Ouvrir » → `window.open` appelé 2 fois, la 2e URL contient `#/present/s2`, `focus` non appelé.
- [ ] **Step 2:** `rtk pnpm vitest run src/features/session/projection.test.tsx` → FAIL.
- [ ] **Step 3:** `presentWindow = useRef<{ sessionId: string; window: Window } | null>(null)` ; `openWindow` commence par `setPopupBlocked(false)`, ne fait `focus()` que si `current?.sessionId === sessionId && !current.window.closed`, sinon ouvre et stocke `{ sessionId, window }` (ou `null`) ; les deux boutons de projection appellent `setPopupBlocked(false)` avant `onProject`. Mettre à jour le JSDoc (référence liée à la session).
- [ ] **Step 4:** `rtk pnpm vitest run src/features/session` → PASS ; `rtk pnpm check` → vert.
- [ ] **Step 5:** Commit `🐛 Lie la fenêtre projetée à sa session et efface l'alerte de popup`.

---

### Task 7 (session principale, pas de subagent) : mémoire projet et vérification visuelle

- `docs/DECISIONS.md` : D77 (résumé de la table de la spec).
- `docs/INDEX.md` : ligne F22 (spec + plan).
- `docs/CONVENTIONS.md` : règle container queries pour un composant rendu en page et en canevas réduit.
- `docs/BACKLOG.md` : cocher les items → #56 (seuil des tuiles, popup bloquée, référence de fenêtre, icône de l'étudiant projeté) ; ajouter les restes éventuels (`?search` conservé dans l'URL, aperçu dans le mode de la projection).
- `docs/HANDOFF.md` : entrée avec les quatre marqueurs.
- Vérification dans le navigateur (`pnpm dev`) à 1440 px et 900 px, onglet réseau, consignée dans la PR.
