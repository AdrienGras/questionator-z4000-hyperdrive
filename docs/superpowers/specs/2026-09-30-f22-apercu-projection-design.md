# F22 — Aperçu de la vue projetée — Design

- **Date** : 2026-09-30
- **Ticket** : [#56](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/56)
- **Branche** : `feat/f22-apercu-projection`
- **Statut** : design validé en conversation, figé ici avant le plan d'implémentation.

## Contexte

Retours des tests manuels V1. L'examinateur pilote la vue projetée (F14) sans voir ce qu'elle affiche : il doit regarder l'autre écran. Les boutons de projection (`ProjectionControls`) sont dans la barre de titre de `PageShell`, à côté du bouton « Panneau ». Depuis F21 (#55), le panneau latéral est un tiroir : la vue de passage dispose de toute la largeur de la coque.

Les composants de la vue projetée (`StudentScreen`, `WaitingScreen`, `FinalCard`, `CategoryTiles`, `DrawReveal`) vivent dans `features/present/components/`. `features/session` ne peut pas les importer (D59).

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §3 (principe 4, séparation des vues), F14 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D30, D59, D69 (étanchéité), D74 (disposition des tuiles), D75 (coque) · `docs/BACKLOG.md` § Écran de passage (pilotage F14, seuil des tuiles → #56).

## Objectif

La vue de passage montre un aperçu réduit de la vue projetée, en haut à droite, avec les boutons de projection juste en dessous. L'aperçu est rendu par les mêmes composants et la même fonction de domaine que la vue projetée, sans iframe ni second chargement.

## Décisions (D77)

| Sujet | Décision | Raison |
|---|---|---|
| Emplacement partagé | `src/components/projection/` : les cinq composants de la vue projetée, plus un nouveau `ProjectedScreen` | UI utilisée par deux features → `components/` (D59, règle 4). `components/` peut importer `domain/presentation`. `PresentControls` et `useIdle` restent propres à `features/present`. |
| Mise à l'échelle | Canevas virtuel fixe **1280 × 720** réduit par `transform: scale(largeur / 1280)`, largeur mesurée par `ResizeObserver` | Demandé par le ticket (pas d'iframe). 1280 plutôt que 1920 : à 1920, le texte courant de l'aperçu tomberait vers 4 px ; 1280 est aussi la largeur des vidéoprojecteurs WXGA courants en salle. |
| Débordement | Boîte extérieure `aspect-video overflow-hidden` : un contenu plus haut que 720 px est coupé | L'aperçu montre l'écran, pas la page entière ; un énoncé qui déborde se voit comme tel. |
| Animation de tirage | Désactivée dans l'aperçu (`animate={false}`) : l'énoncé apparaît directement | L'examinateur n'a pas besoin du mélange ; deux animations simultanées sur l'écran de pilotage seraient du bruit. |
| Seuils de mise en page | Container queries (`@container`, `@min-[40rem]:`) au lieu de media queries dans les composants projetés et `CategoryLayout` | Dans le canevas, `sm:` réagirait à la largeur de la fenêtre examinateur, pas à celle du canevas : sur écran étroit, les tuiles de l'aperçu passeraient sur une colonne alors que la projection en montre plusieurs. Le seuil de 640 px est conservé, mesuré sur le conteneur. Règle aussi l'item BACKLOG « seuil du repli des tuiles » : la grille examinateur suit la largeur de sa colonne. |
| Mode clair / sombre | Celui de la vue examinateur | Aucune mécanique de plus. Le contenu est identique ; seules les couleurs de fond peuvent différer de l'écran projeté, dont le mode est mémorisé à part. |
| Mise en page | ≥ `lg` : grille `minmax(0,1fr) \| 26rem`, colonne droite = aperçu, `ProjectionControls`, `ProjectionBanner`. < `lg` : même colonne empilée en haut, aperçu plafonné à `max-w-xl` | Placement demandé par le ticket ; choix utilisateur pour l'écran étroit. Plafond : à pleine largeur sur tablette, l'aperçu dépasserait 500 px de haut. |
| Accessibilité | Section intitulée « Vue projetée » ; canevas `aria-hidden` + `inert` | Le canevas duplique titres et contenu déjà présents sur la page (nom de l'étudiant en `h1`, énoncé) ; `inert` retire les liens des énoncés de l'ordre de tabulation. Le bandeau « autre étudiant projeté » reste lisible. |
| Popup bloquée | Message effacé au début de chaque clic sur « Ouvrir », « Projeter » ou « Écran d'attente » | Item BACKLOG F14 repris par le ticket. |
| Référence de fenêtre | `useRef<{ sessionId; window }>` ; une fenêtre ouverte pour une autre session est rouverte (`window.open` sous le même nom la renavigue) au lieu d'être ramenée au premier plan | Item BACKLOG F14 : la référence n'était pas liée à la session. |

## Architecture

### `src/components/projection/` (déplacements)

Déplacés depuis `src/features/present/components/`, sans changement de rendu hors seuils et hauteur :

- `student-screen.tsx` : `min-h-svh` retiré (remplacé par `flex-1`), `sm:p-10` → `@min-[40rem]:p-10`. Nouvelle prop `animate: boolean` (défaut `true`) : `DrawReveal` reçoit `animate && view.drawAnimation && current.drawnAt !== initialDrawnAt`.
- `waiting-screen.tsx` : `min-h-svh` → `flex-1`.
- `final-card.tsx` (+ `final-card.test.tsx`), `category-tiles.tsx`, `draw-reveal.tsx` : déplacés tels quels.

### `src/components/projection/projected-screen.tsx` (nouveau)

```tsx
export function ProjectedScreen({
  view,
  animate = true,
  className,
}: Readonly<{ view: ProjectedView; animate?: boolean; className?: string }>)
```

Rend un `div` `@container flex flex-col` (+ `className`) contenant `StudentScreen` (avec la `key` par étudiant reprise de `PresentPage`) ou `WaitingScreen`. Seul point d'entrée des deux vues.

### `src/components/category-layout.tsx`

La `ul` est enveloppée dans un `div className="@container"` ; `sm:grid-cols-…`, `sm:col-span-2`, `sm:data-[row-start=true]:col-start-2` → préfixe `@min-[40rem]:`. `className` et `aria-label` restent sur la `ul`.

### `src/features/present/present-page.tsx`

Remplace l'aiguillage par `<ProjectedScreen view={view} className="min-h-svh" />` sous `PresentControls`. Imports vers `@/components/projection/…`.

### `src/hooks/use-element-width.ts` (nouveau, hook transverse)

`useElementWidth<T extends Element>(): [RefCallback<T>, number]` : largeur du contenu (`contentRect.width`) suivie par un `ResizeObserver`, `0` avant la première mesure, observateur déconnecté au démontage ou au changement d'élément.

### `src/features/session/components/projection-preview.tsx` (nouveau)

```tsx
export function ProjectionPreview({ ui, view }: Readonly<{ ui: Ui; view: ProjectedView }>)
```

- `section` `aria-labelledby` → `h2` « Vue projetée » (`projection_preview_label`), petit et discret.
- Boîte `relative aspect-video w-full overflow-hidden rounded-md border` mesurée par `useElementWidth`.
- Canevas `absolute top-0 left-0 w-[1280px] h-[720px] origin-top-left bg-background`, `style={{ transform: `scale(${width / 1280})` }}`, `aria-hidden`, `inert`, contenant `<ProjectedScreen view={view} animate={false} className="h-full" />`.
- Tant que `width === 0`, le canevas est rendu avec `visibility: hidden` (pas de flash à l'échelle 1).
- Constantes `CANVAS_WIDTH = 1280`, `CANVAS_HEIGHT = 720` en tête de fichier.

Ne reçoit que la `ProjectedView` : aucune prop `Session`, `Student` ou `NormalizedConfig`.

### `src/features/session/components/examiner-view.tsx`

- `const projected = useMemo(() => toProjectedView(session), [session])`.
- `ProjectionControls` sort des `actions` de `PageShell` (reste : bouton « Panneau », puis thème).
- Enfant de `PageShell` : grille `flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start`.
  - D'abord (DOM) un `div` sans rôle (l'intitulé est porté par la section de l'aperçu) `flex flex-col gap-3 w-full max-w-xl lg:max-w-none lg:col-start-2 lg:row-start-1` : `ProjectionPreview`, `ProjectionControls`, `ProjectionBanner`.
  - Puis la colonne de passage `lg:col-start-1 lg:row-start-1` : erreur `role="alert"` et `PassageBody`, inchangés.
- `SidePanel` inchangé.

### `src/features/session/components/projection-controls.tsx`

- `presentWindow: useRef<{ sessionId: string; window: Window } | null>`.
- `openWindow` : `setPopupBlocked(false)` ; si la référence existe, appartient à `sessionId` et n'est pas fermée → `focus()` ; sinon `window.open(url, WINDOW_NAME)`, référence `{ sessionId, window }` ou `null`, `setPopupBlocked(opened === null)`.
- « Projeter » et « Écran d'attente » : `setPopupBlocked(false)` avant `onProject`.
- Mise en page : `flex flex-wrap gap-2` (inchangée), les boutons passent à la ligne dans la colonne de 26 rem.

### i18n (`src/lib/i18n/ui-messages.ts`)

Nouvelle clé `projection_preview_label: NoParams` — fr « Vue projetée », en « Projected view ».

### Test d'architecture (`src/features/present/present-page.test.tsx`)

Le test « aucun import du modèle de session » couvre `src/features/present` **et** `src/components/projection`.

## Tests (Vitest)

- **F14 inchangés** : `present-page.test.tsx`, `present-page.reload.test.tsx`, `draw-reveal.test.tsx`, `present-controls.test.tsx` verts avec pour seul changement les chemins d'import (`@/components/projection/…`).
- **`category-layout.test.tsx`** : adapté si ses assertions visent les classes `sm:` ; disposition (`--cols`, `data-row-start`) inchangée.
- **`use-element-width.test.tsx`** : `ResizeObserver` simulé (jsdom n'en a pas) ; largeur à 0 avant mesure, mise à jour au rappel, `disconnect` au démontage.
- **`projection-preview.test.tsx`** : échelle `scale(0.3)` pour une largeur de 384 ; canevas `aria-hidden` et `inert` ; aucun `iframe` ; attente → titre de l'épreuve ; étudiant → nom ; question tirée avec `drawAnimation: true` → énoncé présent immédiatement, aucune carte `[data-card]`.
- **Étanchéité (`projection-preview` monté via `ExaminerView`)** : session avec marqueurs uniques dans la réponse attendue, le commentaire, le score cumulé masqué (`showCumulativeScore: false`) et le motif de skip ; chaque marqueur présent ailleurs sur la page (au moins la réponse attendue et le commentaire), absent du DOM de l'aperçu.
- **Suivi en direct (`examiner-view.test.tsx` ou `projection.test.tsx`)** : projeter l'étudiant → l'aperçu montre son nom ; tirage → énoncé ; révélation de la note finale → note ; « Écran d'attente » → message d'attente.
- **Placement** : `ProjectionControls` n'est plus dans l'en-tête (`banner`) ; il suit l'aperçu dans la colonne de droite ; états désactivés inchangés (tests existants de `projection.test.tsx`).
- **Pilotage** : popup bloquée (`window.open` → `null`) puis clic sur « Écran d'attente » → message disparu ; référence d'une autre session (rerender avec un autre `sessionId`) → nouvel appel à `window.open` au lieu de `focus()`.

## Vérification visuelle (à consigner dans la PR)

`pnpm dev`, vue de passage à 1440 px et à 900 px : aperçu en haut à droite puis empilé en haut ; suivre tirage, révélation, note finale, écran d'attente ; vue projetée ouverte à côté, rendu identique au mode de couleur près. Onglet réseau : ouvrir la vue de passage ne charge aucun second document ni bundle pour l'aperçu.

## Documentation

- `docs/DECISIONS.md` : D77 (table ci-dessus, résumée).
- `docs/INDEX.md` : ligne F22.
- `docs/CONVENTIONS.md` : § « Vue de session thémée » ou nouvelle sous-section — un composant rendu à la fois en page et dans un canevas réduit utilise des container queries, pas des media queries.
- `docs/BACKLOG.md` : cocher les items repris (seuil des tuiles, popup bloquée, référence de fenêtre, icône de l'étudiant projeté vérifiable depuis l'interface) ; ajouter « aperçu dans le mode de couleur de la projection » si pertinent.
- `docs/HANDOFF.md` : entrée de fin de ticket.

## Critères d'acceptation

- [ ] L'aperçu affiche exactement ce que montre la vue projetée dans tous ses états (attente, étudiant, question tirée, révélée, note finale), animation de tirage exceptée.
- [ ] Aucune donnée réservée à l'examinateur n'apparaît dans l'aperçu (test d'étanchéité).
- [ ] Aperçu en haut à droite à partir de `lg`, empilé en haut en dessous ; boutons de projection juste en dessous, états désactivés inchangés, retirés de l'en-tête.
- [ ] Vue projetée inchangée après l'extraction (tests F14 verts).
- [ ] Pas de second chargement pour l'aperçu (onglet réseau).
- [ ] Message de popup bloquée effacé au clic suivant ; référence de fenêtre liée à la session.

## Hors périmètre

- Taille de texte de la projection (`prose-2xl`, D62) et distinction « indisponible » / « épuisée » (restent au BACKLOG ; l'aperçu les rend visibles).
- Aperçu dans le mode de couleur de la vue projetée.
- Aperçu cliquable ou agrandissable.
