# F19 — Mise en page commune pleine largeur, thème à droite — Design

- **Date** : 2026-09-30
- **Ticket** : [#53](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/53)
- **Branche** : `feat/f19-mise-en-page`
- **Statut** : design validé en conversation section par section, figé ici avant le plan d'implémentation.

## Contexte

Retours des tests manuels V1. Chaque page examinateur est une colonne centrée de largeur propre : accueil `max-w-3xl` (768 px), création `max-w-5xl` (1024 px), passage et stats `max-w-6xl` (1152 px). Sur un grand écran, c'est une bande étroite au milieu. Chaque page a aussi sa barre de titre : `home-header.tsx` (thème au milieu des actions), `passage-header.tsx` (projection puis thème), en-têtes en ligne dans `stats-view.tsx` et `create-session-page.tsx` (thème à droite, mais structure différente à chaque fois).

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §3, F05, F06, F09, F15 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D59 (arborescence), D72 (icônes et favicon) · tickets dépendants #54 (accueil sur deux colonnes), #55 (panneau latéral en drawer).

## Objectif

Les quatre pages examinateur (accueil, création, passage, stats) partagent une coque : une barre de titre de même structure, avec le bouton de thème toujours à droite, et une zone de contenu large. La vue projetée n'est pas touchée.

## Décisions (D75)

| Sujet | Décision | Raison |
|---|---|---|
| Construction | Composant `PageShell` appelé par chaque page (approche 1) | Rendu sous `SessionAppearance` là où la page l'est déjà : langue et thème de la config sans tuyauterie. Une route de mise en page TanStack (approche 2) aurait dû remonter titre et actions par contexte ou portail, et aurait rendu la barre hors du thème de session. Une simple classe partagée (approche 3) ne garantit pas la place du bouton de thème. |
| Largeur | Plafond `max-w-(--breakpoint-2xl)` (96 rem = 1536 px CSS), centré | Pleine largeur sur un portable HDPI (≈ 1280 à 1440 px CSS) et sur un MDPI 1366 ; marge pour #54 et #56 sur un 1920 ou un 2560 à 100 %. Tailwind 4 n'a plus `max-w-screen-*`. |
| Marges latérales | `px-4` (16 px), `sm:px-6` (24 px), `lg:px-10` (40 px) ; vertical `py-4`, `sm:py-6` | Mobile inchangé ; aération sur grand écran. |
| Barre de titre | Retour, titre, ligne d'infos à gauche ; actions à droite, **bouton de thème toujours en dernier** | Disposition courante : « quoi » à gauche, « faire » à droite. Le thème n'est pas une prop : aucune page ne peut le déplacer. |
| Défilement | Barre non sticky, sans bordure | Seules les stats sont longues ; une barre collée prend de la hauteur sur 1366 × 768. |
| Écrans d'état | `DbStatusBanner` (session, stats), `SessionFallback`, 404 : hors coque, inchangés | Messages d'état sans titre ni actions, pas des pages. |
| Favicon | Rien à coder | Réglé par F17 (D72) : `<link rel="icon">` vers `icons/icon.svg`, préfixé par Vite du `base` ; vérifié le 2026-09-30 en preview (200, aucune requête `/favicon.ico` par Chrome headless) et en prod (200). |

## Architecture

### `src/components/page-shell.tsx`

Composant transverse (utilisé par trois features, D59 règle 4).

```tsx
type PageShellProps = Readonly<{
  ui: Ui
  title: ReactNode
  back?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  children: ReactNode
}> &
  Omit<ComponentProps<'main'>, 'title' | 'children'>
```

Rendu :

```tsx
<main
  {...rest}
  className={cn(
    'mx-auto flex min-h-svh w-full max-w-(--breakpoint-2xl) flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-10',
    className,
  )}
>
  <header className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-1">
      {back}
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {meta}
    </div>
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      {actions}
      <ColorModeToggle ui={ui} />
    </div>
  </header>
  {children}
</main>
```

- `...rest` va au `<main>` : la création y pose sa garde de dépôt (`onDragOver`, `onDrop`) et son commentaire `oxlint-disable` reste sur l'appel.
- `back`, `meta`, `actions` absents : rien n'est rendu à leur place (pas de conteneur vide).
- Écran étroit : le groupe de droite passe sous le titre (`flex-wrap`), le thème y reste dernier.

### Pages

| Page | `back` | `title` | `meta` | `actions` |
|---|---|---|---|---|
| Accueil (`features/home/home-page.tsx`) | — | `app_title` | — | `HomeActions` : alerte de persistance, « Importer », « Créer une session » |
| Création (`features/create-session/create-session-page.tsx`) | lien `back_home` | `create_title` | — | — |
| Passage (`features/session/components/examiner-view.tsx`) | lien `back_home` | `config.exam.title` | `PassageMeta` (étudiant · question n / N · score brut, pendant le passage seulement) | `ProjectionControls` |
| Stats (`features/stats/components/stats-view.tsx`) | bouton-lien outline `stats_back` | `session.name` | — | — |

Fichiers :

- `features/home/components/home-header.tsx` → **`home-actions.tsx`** (`HomeActions`) : ne rend plus que les actions ; `<header>`, `h1` et `ColorModeToggle` partent dans la coque. L'ordre devient alerte de persistance, « Importer », « Créer une session », puis le thème (ajouté par la coque).
- `features/session/components/passage-header.tsx` → **`passage-meta.tsx`** (`PassageMeta`) : ne rend plus que la ligne étudiant · question · score (même règle d'affichage qu'aujourd'hui : rien si aucun étudiant, progression seulement en `todo` / `in_progress`). `ExaminerView` câble retour, titre et `ProjectionControls` dans la coque.
- `stats-view.tsx` et `create-session-page.tsx` : en-têtes en ligne supprimés, remplacés par les props de la coque.
- Plus aucun import de `ColorModeToggle` dans `features/`, sauf la vue projetée.

Contenu inchangé, seule sa largeur change : grilles `md:grid-cols-2` de la création et des stats, `lg:grid-cols-[1fr_auto]` du passage avec le panneau latéral. Leur réorganisation relève de #54, #55, #56.

### Vue projetée

`features/present/present-page.tsx` garde son `main`, son bouton de thème et ses commandes plein écran. Aucun import de `PageShell`.

## Tests (Vitest)

- `components/page-shell.test.tsx` :
  - `h1` avec le titre ; `back` et `meta` rendus quand fournis, absents sinon ;
  - le bouton de thème est le dernier bouton de la barre, avec et sans `actions` ;
  - les props du `<main>` sont transmises (`onDrop` appelé, `className` fusionnée).
- Une assertion par page (accueil, création, passage, stats), dans leurs fichiers de test existants : le bouton de thème est le dernier élément interactif de la barre de titre, les actions attendues y sont.
- `present-page.test.tsx` : pas de lien de retour à l'accueil (la coque n'est pas montée).
- Tests existants : textes et rôles inchangés, ils passent tels quels ; les Page Objects de `e2e/pages/` visent titres, liens et boutons par nom et ne dépendent pas de la structure des en-têtes (vérifié).

## Vérification visuelle (à consigner dans la PR)

Captures au navigateur (`pnpm dev`, Playwright MCP, sessions de démo par import des fixtures) des quatre pages à 1280, 1366 et 1920 px de large, d'une page à 2560 px, et d'une page en mode sombre.

## Documentation

- `docs/DECISIONS.md` : D75 (tableau ci-dessus).
- `PRODUCT.md` : nouvelle section F19 (coque, largeur, barre de titre, vue projetée exclue).
- `docs/CONVENTIONS.md` : section « Page examinateur — squelette » (toute page examinateur passe par `PageShell` ; titre, retour, infos, actions en props ; jamais de `ColorModeToggle` dans une page).
- `docs/BACKLOG.md` : item favicon coché (réglé par F17, D72).
- `docs/INDEX.md`, `docs/HANDOFF.md` en fin de ticket.

## Critères d'acceptation

- [ ] Les quatre pages examinateur passent par `PageShell`.
- [ ] Largeur utile : pleine largeur moins les marges jusqu'à 1536 px CSS, 1536 px centrés au-delà ; vérifié à 1280, 1366, 1920 et 2560 px.
- [ ] Le bouton de thème est le dernier élément de la barre de titre sur les quatre pages.
- [ ] La vue projetée n'est pas modifiée.
- [ ] Favicon servi sans 404 (constaté, pas de changement).
- [ ] Mise en page utilisable à 1280 px de large.

## Hors périmètre

- Réorganisation du contenu de l'accueil (#54) et du panneau latéral (#55), aperçu de la projection (#56).
- Écrans d'état (`DbStatusBanner`, `SessionFallback`, 404).
- Barre sticky.
