# F21 — Panneau latéral en tiroir — Design

- **Date** : 2026-09-30
- **Ticket** : [#55](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/55)
- **Branche** : `feat/f21-panneau-lateral`
- **Statut** : design validé en conversation section par section, figé ici avant le plan d'implémentation.

## Contexte

Retours des tests manuels V1. Le panneau latéral de la vue de passage (`SidePanel`, onglets « Étudiant » et « Étudiants ») est une `<aside>` dans le flux, dans une grille `lg:grid-cols-[1fr_auto]`, repliable par un bouton « Masquer / Afficher le panneau ». Ouvert, il retire 22 rem à la grille de tirage. Son état ouvert/fermé et son onglet sont mémorisés dans `localStorage` (`features/session/side-panel-state.ts`). Ses onglets n'occupent pas toute sa largeur. Deux états vides (étudiant absent, aucun étudiant sélectionné) renvoient au panneau par un texte, sans l'ouvrir. La zone `aria-live` du commentaire annonce « Enregistrement… » à chaque pause de frappe.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) F12, F13, F19 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D67 (commentaire hors verrou), D75 (coque `PageShell`) · `docs/BACKLOG.md` § Écran de passage (deux items → #55) · ticket dépendant #56 (aperçu de la vue projetée).

## Objectif

Le panneau devient un tiroir modal `Sheet` à droite, fermé au chargement, ouvert depuis un bouton de la barre de titre. La vue de passage récupère toute la largeur de la coque.

## Décisions (D76)

| Sujet | Décision | Raison |
|---|---|---|
| Modalité | Tiroir **modal** : voile, focus piégé, fermeture par Échap, clic sur le voile ou bouton traduit, focus rendu au bouton d'ouverture | Ce que décrivent les critères du ticket ; le panneau sert à des gestes ponctuels, pas à rester ouvert pendant un tirage. Un tiroir non modal aurait dû renoncer à la fermeture au clic extérieur (chaque tirage le fermerait) et piloter l'accessibilité à la main. |
| Largeur | `w-full sm:max-w-md` (28 rem, 448 px) | La ligne d'étudiant (nom, statut, note brute, note convertie) tient ; à 1280 px il reste plus de 800 px de vue. 24 rem trop serré, 32 rem couvre 40 % d'un écran de 1280 px. |
| Bouton d'ouverture | Premier élément des `actions` de `PageShell`, avant `ProjectionControls` : icône + « Panneau » | Le panneau est l'outil principal de l'examinateur ; le thème reste dernier (D75). |
| État | Hook `useSidePanel()` dans `ExaminerView`, `SidePanel` contrôlé | Un seul propriétaire pour trois consommateurs (barre de titre, états vides, onglet « Étudiants »). Un contexte serait de la plomberie, une ref impérative hors de l'idiome du projet. |
| Mémoire | Fermé à chaque chargement ; seul l'onglet reste mémorisé (`localStorage`) | Demandé par le ticket ; l'état ouvert mémorisé n'a plus de sens pour un tiroir modal. |
| Fermeture automatique | Le tiroir se ferme quand un **autre** étudiant devient actif avec succès : clic dans la liste, « Ajouter et faire passer ». Il reste ouvert pour « Ajouter » seul, commentaire, correction de note, absent, export, stats, et en cas d'échec | Choisir un étudiant, c'est pour le faire passer ; le tiroir modal bloquerait la grille. Cliquer l'étudiant déjà actif n'est pas relayé (inchangé) : le tiroir reste ouvert. |
| États vides | Bouton « Afficher le panneau » : état absent → onglet « Étudiant » (case « Absent ») ; aucun étudiant → onglet « Étudiants » | Items du BACKLOG repris par le ticket. |
| Commentaire | Statut visible inchangé ; zone `sr-only` `aria-live="polite"` qui n'annonce que « Enregistré » ou « Échec » | Item du BACKLOG : l'annonce « Enregistrement… » à chaque pause est du bruit. |

## Architecture

### `src/components/ui/sheet.tsx`

Ajouté par `corepack pnpm dlx shadcn@latest add sheet -y` (base-ui, preset Nova). Après l'ajout : l'import de `cn` pointe `@/lib/utils` et aucune dépendance `cn` n'est ajoutée (QUIRKS 2026-09-25). Si `SheetContent` affiche un bouton de fermeture par défaut en anglais : `showCloseButton={false}` et bouton traduit (même règle que `DialogContent`, CONVENTIONS « Composant shadcn — ajout »).

### `src/features/session/side-panel-state.ts`

Supprimer `readSidePanelOpen`, `writeSidePanelOpen` et la clé `questionator:side-panel:open`. Restent `SidePanelTab`, `readSidePanelTab`, `writeSidePanelTab`.

### `src/features/session/hooks/use-side-panel.ts`

```ts
export function useSidePanel(): {
  open: boolean
  tab: SidePanelTab
  setOpen: (open: boolean) => void
  setTab: (tab: SidePanelTab) => void // écrit l'onglet (writeSidePanelTab)
  show: (tab: SidePanelTab) => void // setTab(tab) puis ouverture
}
```

`open` vaut `false` au montage ; `tab` est initialisé par `readSidePanelTab`.

### `src/features/session/components/side-panel.tsx`

Composant contrôlé :

```ts
type SidePanelProps = Readonly<{
  ui: Ui
  open: boolean
  tab: SidePanelTab
  onOpenChange: (open: boolean) => void
  onTabChange: (tab: SidePanelTab) => void
  studentTab: ReactNode
  studentsTab: ReactNode
}>
```

Rendu : `Sheet` (`open`, `onOpenChange`) > `SheetContent side="right"` (`w-full sm:max-w-md`, contenu en `overflow-y-auto`) > `SheetHeader` avec `SheetTitle` (`side_panel_label`, « Panneau latéral ») et bouton « Fermer le panneau » (`side_panel_close`) > `Tabs` (`value`, `onValueChange` filtré par `isSidePanelTab`) > `TabsList className="w-full"` avec deux `TabsTrigger className="flex-1"` > deux `TabsContent`. Le contenu est démonté à la fermeture : `CommentField` flushe alors la frappe en attente (`use-autosave`, démontage).

### `src/features/session/components/examiner-view.tsx`

- `const panel = useSidePanel()`.
- `actions` de `PageShell` : bouton `variant="outline"` avec `IconLayoutSidebarRight` (`aria-hidden`) et `side_panel_open`, `onClick={() => panel.setOpen(true)}`, puis `ProjectionControls`.
- Plus de grille `lg:grid-cols-[1fr_auto]` : le corps (erreur, `PassageBody`) occupe la largeur ; `SidePanel` est rendu en frère, hors flux (portail du `Sheet`).
- `onSelect` de `StudentsTab` : `if (await actions.selectStudent(id)) panel.setOpen(false)`.
- `onAdd` de `StudentsTab` : si `options.activate` et succès, `panel.setOpen(false)` ; le booléen de succès est renvoyé tel quel à l'onglet.
- `PassageBody` reçoit `onShowPanel={panel.show}`.

Le retour du focus au bouton « Panneau » repose sur le Dialog base-ui, qui rend le focus à l'élément actif avant l'ouverture. Si un test montre le contraire, passer une ref du bouton à `finalFocus` de `SheetContent`.

### `src/features/session/hooks/use-passage-actions.ts`

`selectStudent: (studentId: string) => Promise<boolean>` (succès de l'écriture, comme `addStudent`), au lieu de `Promise<void>`. Appels existants inchangés dans leur effet.

### États vides

- `absent-state.tsx` : `AbsentState({ ui, onShowPanel })` ajoute un bouton `variant="outline"` « Afficher le panneau » (`side_panel_show`) qui appelle `onShowPanel('student')`.
- `passage-body.tsx` : prop `onShowPanel: (tab: SidePanelTab) => void` ; l'état « aucun étudiant » ajoute le même bouton, `onShowPanel('students')` ; `AbsentState` reçoit `onShowPanel`.
- Textes explicatifs (`passage_absent_body`, `passage_no_student_body`) inchangés.

### `src/features/session/components/comment-field.tsx`

Le paragraphe de statut visible perd son `aria-live`. Une zone `<p className="sr-only" aria-live="polite">` ne contient que le texte de `comment_saved` ou `comment_error` (vide en `idle` et `saving`).

### i18n (`src/lib/i18n/ui-messages.ts`)

- Ajout : `side_panel_open` (« Panneau » / « Panel »), `side_panel_close` (« Fermer le panneau » / « Close the panel »).
- Suppression : `side_panel_hide`.
- Conservés : `side_panel_label`, `side_panel_show`, `side_panel_tab_student`, `side_panel_tab_students`.

## Tests (Vitest)

- Aide partagée `openSidePanel(tab?: 'Étudiant' | 'Étudiants')` dans `src/testing/` : clic sur « Panneau », attente du `dialog` nommé « Panneau latéral », clic sur l'onglet si demandé. `students-tab-harness.tsx`, `student-tab.test.tsx`, `side-panel.test.tsx`, `examiner-view.test.tsx` et `stats-page.test.tsx` l'utilisent à la place de `complementary`.
- `side-panel.test.tsx` :
  - fermé au chargement, même après une ouverture précédente ; l'onglet choisi est relu à la réouverture et après remontage ;
  - `TabsList` en `w-full`, deux déclencheurs en `flex-1` ;
  - fermeture par Échap, par « Fermer le panneau », par clic sur le voile ; dans les trois cas le focus revient au bouton « Panneau ».
- `examiner-view.test.tsx` (ou `students-tab.test.tsx`) : clic sur un autre étudiant → tiroir fermé et étudiant actif ; `add-student.test.tsx` : « Ajouter » → tiroir ouvert, « Ajouter et faire passer » → tiroir fermé.
- États vides : « Afficher le panneau » depuis l'état absent ouvre l'onglet « Étudiant » ; depuis l'état « aucun étudiant », l'onglet « Étudiants ».
- Commentaire : frappe, fermeture par Échap avant le délai d'autosave, commentaire présent en base.
- `aria-live` : pendant l'enregistrement la zone annoncée est vide ; après, elle contient « Enregistré » ; en échec, « Échec de l’enregistrement » (libellé exact de `comment_error`).
- e2e : `e2e/pages/examiner-page.ts` ouvre le tiroir avant de cliquer l'onglet « Étudiants » (stats, export) ; autres Page Objects vérifiés.

## Vérification visuelle (à consigner dans la PR)

Captures au navigateur à 1280 et 1920 px : tiroir ouvert sur chaque onglet, clair et sombre ; largeur du tiroir 448 px ; vue de passage pleine largeur tiroir fermé.

## Documentation

- `docs/DECISIONS.md` : D76 (tableau ci-dessus).
- `PRODUCT.md` : F12 et F13 (le panneau est un tiroir), nouvelle section F21.
- `docs/BACKLOG.md` : items `aria-live` du commentaire et « Afficher le panneau » cochés.
- `docs/CONVENTIONS.md` : si le squelette `Sheet` diffère de `Dialog` sur un point à reproduire (bouton de fermeture, `finalFocus`), une ligne dans « Composant shadcn — ajout ».
- `docs/INDEX.md`, `docs/HANDOFF.md` en fin de ticket.

## Critères d'acceptation

- [ ] Le panneau s'ouvre par-dessus la vue depuis le bouton « Panneau », se ferme par Échap, par le bouton de fermeture et par un clic à l'extérieur, et rend le focus au bouton d'ouverture.
- [ ] Fermé à chaque chargement ; l'onglet choisi est mémorisé.
- [ ] Les deux onglets se partagent toute la largeur du panneau (28 rem au-delà de 640 px, pleine largeur en dessous).
- [ ] Choisir un autre étudiant (liste, « Ajouter et faire passer ») referme le tiroir.
- [ ] Depuis l'état absent ou « aucun étudiant », un bouton ouvre le panneau sur l'onglet utile.
- [ ] Un commentaire en cours de saisie est enregistré si l'on ferme le panneau.
- [ ] Le commentaire n'annonce que « Enregistré » ou « Échec de l’enregistrement ».
- [ ] Tests d'écran et e2e adaptés.

## Hors périmètre

- Panneau épinglable qui pousse le contenu.
- Raccourci clavier d'ouverture.
- Aperçu de la vue projetée (#56).
