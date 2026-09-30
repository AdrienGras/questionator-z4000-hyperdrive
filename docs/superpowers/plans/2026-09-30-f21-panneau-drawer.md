# F21 — Panneau latéral en tiroir — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** le panneau latéral de la vue de passage devient un tiroir modal `Sheet` à droite (28 rem), fermé au chargement, ouvert par un bouton « Panneau » de la barre de titre.

**Architecture:** état du tiroir remonté dans `ExaminerView` par un hook `useSidePanel()` ; `SidePanel` devient contrôlé et rend un `Sheet` shadcn (base-ui). La barre de titre, les deux états vides et l'onglet « Étudiants » pilotent le tiroir via le hook. Les tests d'écran ouvrent le tiroir par une aide partagée.

**Tech Stack:** React 19, TanStack Router, Tailwind 4, shadcn v4 (base-ui, preset Nova), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-f21-panneau-drawer-design.md`

## Global Constraints

- Tiroir modal : `Sheet` > `SheetContent side="right"`, classes de largeur `w-full sm:max-w-md` ; contenu défilant `overflow-y-auto`.
- Fermé au montage ; seul l'onglet est mémorisé (`readSidePanelTab` / `writeSidePanelTab`, clé `questionator:side-panel:tab`) ; la clé `questionator:side-panel:open` et ses fonctions disparaissent.
- `TabsList className="w-full"`, deux `TabsTrigger className="flex-1"`.
- Bouton d'ouverture : premier élément des `actions` de `PageShell`, avant `ProjectionControls` ; `Button variant="outline"`, icône `IconLayoutSidebarRight` (`@tabler/icons-react`, `aria-hidden`), libellé `side_panel_open`.
- Libellés : `side_panel_open` = « Panneau » / « Panel » ; `side_panel_close` = « Fermer le panneau » / « Close the panel » ; `side_panel_label` = « Panneau latéral » (titre du tiroir, nom du `dialog`) ; `side_panel_show` = « Afficher le panneau » ; `side_panel_hide` supprimé. `comment_saved` = « Enregistré », `comment_error` = « Échec de l’enregistrement » (apostrophe typographique).
- Le tiroir se ferme après un changement d'étudiant actif réussi (clic dans la liste, « Ajouter et faire passer ») ; il reste ouvert sinon (et en cas d'échec).
- Pas de bouton « Close » anglais du vendor : `showCloseButton={false}` si la prop existe, bouton traduit à la place.
- shadcn : `corepack pnpm dlx shadcn@latest add sheet -y` ; vérifier ensuite que `cn` est importé de `@/lib/utils` et qu'aucune dépendance `cn` n'a été ajoutée à `package.json`.
- Arborescence D59 (`@/…`, pas de barrel, kebab-case, pas d'import entre features) ; `pnpm deps` vert.
- Commentaires et JSDoc en français. Commits gitmoji en français + lignes `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` et `Claude-Session: https://claude.ai/code/session_01EtRb32mHbi1w7WczeEkbh4`.
- Tests ciblés : `rtk proxy pnpm exec vitest run <fichier>` (ne jamais lire `.vitest/json/output.json`). Avant commit : `pnpm check` exit 0.

## Review Focus

1. Retour du focus au bouton « Panneau » après fermeture par Échap, voile ou bouton traduit : le bouton n'est pas un `SheetTrigger`. Test : Task 2.
2. Commentaire tapé puis tiroir fermé avant le délai d'autosave : la valeur doit être en base (démontage du contenu → flush). Test : Task 4.
3. Échec d'un changement d'étudiant (écriture refusée) : le tiroir reste ouvert et l'erreur visible dans l'onglet. Test : Task 2 (via `selectStudent` renvoyant `false`).
4. `localStorage` inaccessible : tiroir fermé, ouverture possible, onglet par défaut « Étudiant ». Test : Task 1.
5. Onglet mémorisé « Étudiants » puis bouton « Afficher le panneau » de l'état absent : le tiroir s'ouvre sur « Étudiant » et mémorise ce choix. Test : Task 3.

---

### Task 1: Composant `Sheet`, état et i18n

**Files:**
- Create: `src/components/ui/sheet.tsx` (CLI shadcn)
- Create: `src/features/session/hooks/use-side-panel.ts`, `src/features/session/hooks/use-side-panel.test.ts`
- Modify: `src/features/session/side-panel-state.ts`, `src/features/session/side-panel-state.test.ts`
- Modify: `src/lib/i18n/ui-messages.ts` (+ `ui-messages.test.ts` si les clés y sont listées)

**Interfaces:**
- Produces:
  - `useSidePanel(): { open: boolean; tab: SidePanelTab; setOpen(open: boolean): void; setTab(tab: SidePanelTab): void; show(tab: SidePanelTab): void }` — `open` à `false` au montage ; `tab` = `readSidePanelTab()` ; `setTab` écrit l'onglet ; `show(tab)` = `setTab(tab)` + ouverture.
  - `side-panel-state.ts` n'exporte plus que `SidePanelTab`, `readSidePanelTab`, `writeSidePanelTab`.
  - Clés i18n `side_panel_open`, `side_panel_close` ; `side_panel_hide` retirée **seulement en Task 2** (encore utilisée par `SidePanel` jusque-là).

- [ ] **Step 1: Tests `use-side-panel.test.ts`** (`renderHook`) : `'fermé au montage, onglet par défaut « student »'` ; `'onglet mémorisé relu au montage'` (`localStorage` pré-rempli `students`) ; `'show(tab) ouvre sur l’onglet et le mémorise'` ; `'setOpen ne mémorise rien'` (après `setOpen(true)`, un nouveau `renderHook` est fermé) ; `'localStorage inaccessible : fermé, onglet « student », show fonctionne'` (espionner `Storage.prototype.getItem`/`setItem` pour lever une erreur). Retirer de `side-panel-state.test.ts` les tests de `readSidePanelOpen`/`writeSidePanelOpen`.
- [ ] **Step 2: Lancer, vérifier l'échec** — `rtk proxy pnpm exec vitest run src/features/session/hooks/use-side-panel.test.ts` → module absent.
- [ ] **Step 3: Implémenter** le hook (`useState`, `useCallback`) ; supprimer `readSidePanelOpen`, `writeSidePanelOpen`, `OPEN_KEY`. Ajouter `sheet.tsx` par le CLI et contrôler l'import de `cn`. Ajouter les deux clés i18n (types + fr + en).
- [ ] **Step 4: Relancer** — tests du hook et de `side-panel-state` verts ; le `SidePanel` actuel importe encore `readSidePanelOpen`/`writeSidePanelOpen` : les remplacer par un `useState(true)` local pour qu'il compile (le fichier est réécrit en Task 2). `pnpm check` exit 0.
- [ ] **Step 5: Commit** — `✨ Ajoute le Sheet et l’état du tiroir latéral`.

---

### Task 2: Tiroir dans la vue de passage et migration des tests d'écran

**Files:**
- Modify: `src/features/session/components/side-panel.tsx`, `src/features/session/components/examiner-view.tsx`, `src/features/session/hooks/use-passage-actions.ts`, `src/lib/i18n/ui-messages.ts` (retrait `side_panel_hide`)
- Create: `src/testing/side-panel-assertions.ts`
- Modify (tests) : `src/features/session/side-panel.test.tsx`, `student-tab.test.tsx`, `students-tab.test.tsx`, `examiner-view.test.tsx`, `add-student.test.tsx`, `projection.test.tsx`, `passage-example.test.tsx`, `src/testing/students-tab-harness.tsx`, `src/features/stats/stats-page.test.tsx`, `src/features/session/hooks/use-passage-actions.test.ts`

**Interfaces:**
- Consumes: `useSidePanel`, `sheet.tsx`, clés i18n (Task 1).
- Produces:
  - `SidePanel(props: { ui; open; tab; onOpenChange(open: boolean); onTabChange(tab: SidePanelTab); studentTab: ReactNode; studentsTab: ReactNode })` — structure de la spec § `side-panel.tsx`.
  - `selectStudent: (studentId: string) => Promise<boolean>` dans `usePassageActions` (renvoie le booléen de `run`).
  - `openSidePanel(tab?: 'Étudiant' | 'Étudiants'): Promise<HTMLElement>` dans `src/testing/side-panel-assertions.ts` : clique le bouton « Panneau », attend `findByRole('dialog', { name: 'Panneau latéral' })`, clique l'onglet s'il est donné, renvoie le `dialog`.
  - `PassageBody` n'est pas modifié ici (Task 3).

- [ ] **Step 1: Réécrire `side-panel.test.tsx`** sur le tiroir :
  - `'fermé au chargement ; « Panneau » l’ouvre sur l’onglet « Étudiant »'` ;
  - `'onglet « Étudiants » mémorisé : rouvert dessus après fermeture et après remontage'` ;
  - `'onglets sur toute la largeur'` — `TabsList` a `w-full`, chaque `tab` a `flex-1` ;
  - `'Échap ferme et rend le focus à « Panneau »'`, `'« Fermer le panneau » ferme et rend le focus'`, `'clic sur le voile ferme et rend le focus'` (localiser le voile par l'attribut/`data-slot` que pose le vendor, à lire dans `sheet.tsx`) ;
  - conserver les tests de contenu existants (lignes ~123-167) en ouvrant d'abord le tiroir par `openSidePanel()`.
  - Supprimer les tests de repli (`Masquer le panneau`, repli mémorisé, localStorage inaccessible ⇒ repli).
- [ ] **Step 2: Tests de fermeture automatique** (`examiner-view.test.tsx`) : `'clic sur un autre étudiant : il devient actif et le tiroir se ferme'` ; `'échec du changement d’étudiant : le tiroir reste ouvert'` (étudiant retiré de la base avant le clic, comme le test existant « erreur affichée même hors du panneau » ~ligne 440) ; `add-student.test.tsx` : `'« Ajouter » laisse le tiroir ouvert'`, `'« Ajouter et faire passer » ferme le tiroir'`.
- [ ] **Step 3: Lancer, vérifier l'échec** — `rtk proxy pnpm exec vitest run src/features/session/side-panel.test.tsx src/features/session/examiner-view.test.tsx src/features/session/add-student.test.tsx`.
- [ ] **Step 4: Implémenter** — `SidePanel` contrôlé sur `Sheet` ; `ExaminerView` : `useSidePanel()`, bouton « Panneau » en tête des `actions`, suppression de la grille `lg:grid-cols-[1fr_auto]`, `onSelect` et `onAdd` qui ferment le tiroir sur succès (activate), `SidePanel` rendu en frère du corps ; `selectStudent` renvoie le booléen. Si le focus ne revient pas au bouton, passer sa ref à `finalFocus` de `SheetContent`. Retirer `side_panel_hide`.
- [ ] **Step 5: Migrer les autres tests** — `students-tab-harness.tsx`, `student-tab.test.tsx` (`mount` et `panel()`), `examiner-view.test.tsx` (`studentButton`), `projection.test.tsx`, `passage-example.test.tsx`, `stats-page.test.tsx` (retour au passage : le bouton « Panneau » est présent, plus de `complementary`), `use-passage-actions.test.ts` (type de `selectStudent`) : ouvrir le tiroir par `openSidePanel(...)` avant d'interagir ; remplacer `complementary` par le `dialog` renvoyé.
- [ ] **Step 6: Relancer** — `rtk proxy pnpm exec vitest run src/features/session src/features/stats` vert, puis `pnpm check` exit 0.
- [ ] **Step 7: Commit** — `✨ Passe le panneau latéral en tiroir`.

---

### Task 3: Bouton « Afficher le panneau » dans les états vides

**Files:**
- Modify: `src/features/session/components/absent-state.tsx`, `src/features/session/components/passage-body.tsx`, `src/features/session/components/examiner-view.tsx`
- Test: `src/features/session/examiner-view.test.tsx`

**Interfaces:**
- Consumes: `useSidePanel().show` (Task 1), `ExaminerView` câblé (Task 2).
- Produces: `AbsentState({ ui, onShowPanel }: Readonly<{ ui: Ui; onShowPanel: (tab: SidePanelTab) => void }>)` ; prop `onShowPanel: (tab: SidePanelTab) => void` sur `PassageBody`.

- [ ] **Step 1: Tests** (`examiner-view.test.tsx`) : `'étudiant absent : « Afficher le panneau » ouvre l’onglet « Étudiant »'` (le `tab` « Étudiant » a `aria-selected="true"` dans le `dialog`, la case « Absent » est visible) ; `'aucun étudiant : « Afficher le panneau » ouvre l’onglet « Étudiants »'` ; `'onglet « Étudiants » mémorisé, état absent : ouvert sur « Étudiant » et ce choix est mémorisé'` (`localStorage` pré-rempli, puis vérifier la clé `questionator:side-panel:tab` = `student`).
- [ ] **Step 2: Lancer, vérifier l'échec** — `rtk proxy pnpm exec vitest run src/features/session/examiner-view.test.tsx`.
- [ ] **Step 3: Implémenter** — bouton `variant="outline"` `self-start`, libellé `side_panel_show`, dans `AbsentState` (`onShowPanel('student')`) et dans l'état « aucun étudiant » de `PassageBody` (`onShowPanel('students')`) ; `ExaminerView` passe `onShowPanel={panel.show}`. Textes explicatifs inchangés.
- [ ] **Step 4: Relancer** — même commande verte ; `pnpm check` exit 0.
- [ ] **Step 5: Commit** — `✨ Ajoute « Afficher le panneau » aux états vides du passage`.

---

### Task 4: Commentaire — annonce réduite et enregistrement à la fermeture

**Files:**
- Modify: `src/features/session/components/comment-field.tsx`
- Test: `src/features/session/student-tab.test.tsx`

**Interfaces:**
- Consumes: `openSidePanel` (Task 2).

- [ ] **Step 1: Tests** (`student-tab.test.tsx`, avec les faux timers ou l'attente déjà utilisés par les tests de commentaire existants de ce fichier) :
  - `'zone annoncée : vide pendant l’enregistrement, « Enregistré » ensuite'` — la zone `aria-live="polite"` du champ ne contient pas « Enregistrement… » pendant la sauvegarde, puis contient « Enregistré » ; le statut visible affiche toujours « Enregistrement… » puis « Enregistré ».
  - `'échec : la zone annoncée contient « Échec de l’enregistrement »'` (même technique d'échec que les tests existants du commentaire).
  - `'commentaire tapé puis tiroir fermé par Échap avant le délai : enregistré en base'`.
- [ ] **Step 2: Lancer, vérifier l'échec** — `rtk proxy pnpm exec vitest run src/features/session/student-tab.test.tsx` (le troisième test peut déjà passer grâce au flush au démontage : le noter).
- [ ] **Step 3: Implémenter** — paragraphe visible sans `aria-live` ; `<p className="sr-only" aria-live="polite">` rendu en permanence, contenant `comment_saved` ou `comment_error` selon `status`, vide sinon.
- [ ] **Step 4: Relancer** — vert ; `pnpm check` exit 0.
- [ ] **Step 5: Commit** — `♿ N’annonce que le résultat de l’enregistrement du commentaire`.

---

### Task 5: e2e et documentation

**Files:**
- Modify: `e2e/pages/examiner-page.ts` (et tout Page Object qui clique dans le panneau)
- Modify: `docs/DECISIONS.md` (D76 en fin de fichier), `PRODUCT.md` (F12, F13 ; section `### F21 — Panneau latéral en tiroir` après F19), `docs/BACKLOG.md` (deux items → #55 cochés), `docs/CONVENTIONS.md` (ligne `Sheet` dans « Composant shadcn — ajout » si le vendor a demandé un réglage : bouton de fermeture, `finalFocus`)

- [ ] **Step 1: e2e** — dans `examiner-page.ts`, une méthode `openPanel(tab?: 'Étudiant' | 'Étudiants')` (clic « Panneau », attente du `dialog` « Panneau latéral », onglet) utilisée par l'ouverture des stats et l'export à la place du clic direct sur l'onglet. Chercher d'autres clics dans le panneau (`grep -rn "tab'" e2e`). Lancer `pnpm e2e` → vert.
- [ ] **Step 2: Docs** — D76 au format de D75 (`**Question**`, `**Décision**`, `**Pourquoi**`, `**Reporté dans**`), contenu = tableau « Décisions (D76) » de la spec ; `PRODUCT.md` : F12/F13 parlent du panneau comme d'un tiroir, nouvelle section F21 (**Objectif.**, **Contenu.**, **Critères d'acceptation.** repris de la spec) ; BACKLOG : les deux items cochés avec « livré en F21 ». Lire les `docs/*.md` par plage (`grep -n '^## '` puis offset/limit), jamais en entier.
- [ ] **Step 3: Vérification** — `pnpm check` exit 0.
- [ ] **Step 4: Commit** — `📝 Documente le panneau latéral en tiroir (D76, F21)`.

La vérification visuelle (1280 et 1920 px, deux onglets, clair et sombre, largeur 448 px) et les mises à jour `INDEX.md` / `HANDOFF.md` sont faites par le contrôleur après la revue finale.
