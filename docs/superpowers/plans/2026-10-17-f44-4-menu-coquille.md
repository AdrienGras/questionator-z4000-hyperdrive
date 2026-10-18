# F44.4 — Menu et coquille de page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un menu latéral permanent et repliable sur tous les écrans sauf la vue projetée, une coquille de page commune (fil d'Ariane ou lien retour, plus d'aide dans l'en-tête), et les bandeaux et écrans de repli à la forme du canevas (#146).

**Architecture:** Le menu est monté une seule fois dans `RootLayout` (`src/routes/__root.tsx`), à côté de l'`Outlet`, et masqué sur `/present/$sessionId`. Il lit les tokens `sidebar-*` sur `<html>`, où `AppearanceProvider` pose déjà le thème de la session : il suit donc le thème de session sans être sous sa portée. Le lien actif vient d'une fonction pure sur le `pathname`. À partir de `md` (768 px), c'est une colonne collante de 248 px ou 72 px (état mémorisé dans `localStorage`). En dessous, une barre du haut ouvre le même contenu dans un tiroir (`Sheet` à gauche). `PageShell` perd le lien d'aide, qui passe en pied de menu ; son emplacement `back` reçoit soit un `Breadcrumb`, soit un `BackLink`, d'après l'artboard de chaque écran. `/sessions` et `/trainings` existent dès ce ticket : elles affichent provisoirement l'accueil actuel, jusqu'à #147.

**Tech Stack:** React 19, TanStack Router (`useLocation`, `createLink`), shadcn v4 sur base-ui (`Sheet`, `Tooltip`), Tailwind CSS v4, icônes Tabler, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (§ Navigation, Contraintes, Tests ; D102), carte des écrans `docs/superpowers/specs/2026-10-17-f44-carte-des-ecrans.md` (§ Transverse ; D103), D104. Maquettes : canevas <https://claude.ai/artifact/DvvtZZb9ie2vknoXtHfnJL>, artboards `apres/menu-replie`, `apres/bandeaux`, plus les en-têtes de `apres/creation-session`, `apres/editeur-config`, `apres/passage-question`, `apres/statistiques`, `apres/entrainement-*`. Design system <https://claude.ai/artifact/DMYaQZGYtm8RnJqbBMmBcy> (`project/components/Sidebar/README.md`, `project/tokens.json`).

## Global Constraints

- **Canevas avant l'interface (D102)** : le tiroir en écran étroit n'est pas maquetté. La Task 1 le dessine et l'utilisateur le valide avant que la Task 4 ne le code. Tout autre écart à une maquette met l'artboard à jour dans la même PR.
- **Arborescence (D59)** : menu, fil d'Ariane, lien retour et écran d'état vont dans `src/components/`. Le stockage de l'état replié va dans `src/lib/`. Une route ne contient qu'un `createFileRoute`. `pnpm deps` reste vert.
- **Couleurs** : uniquement des tokens. Menu : `bg-sidebar`, `border-sidebar-border`, `bg-sidebar-accent` (lien actif et survol), filet actif `shadow-[inset_3px_0_0_0_var(--color-sidebar-primary)]`. Icône d'espace en `text-space-*` sur une tuile neutre `bg-muted` (D103, traitement 2). Accueil en `text-muted-foreground`.
- **Mesures du menu** (design system, Sidebar) : 248 px déplié, 72 px replié ; padding `20px 12px`, `gap` de 20 px entre blocs ; lignes de 44 px, rayon `rounded-md` (12 px), `gap` de 12 px, graisse 500 (600 si actif) ; tuile d'icône de 32 px, rayon 10 px, icône de 18 px. Intertitre « Espaces » en `text-label` capitales `text-muted-foreground`, remplacé par un filet de 24 px une fois replié. Pied : Aide, puis filet `sidebar-border` et bouton « Replier le menu » de 36 px, texte 13 px `text-muted-foreground`, icônes `IconLayoutSidebarLeftCollapse` / `IconLayoutSidebarLeftExpand`. Marque : carré de 28 px, rayon 9 px, dégradé `from-primary to-action-to`, suivi de « Questionator Z-4000 » en graisse 700 (carré seul une fois replié, `role="img"` et `aria-label`).
- **Icônes Tabler** : `IconHome` (Accueil), `IconPresentationAnalytics` (Sessions), `IconFileCode` (Éditeur), `IconSchool` (Entraînement), `IconHelpCircle` (Aide). Ce sont les tracés de l'artboard.
- **Libellés** : marque « Questionator Z-4000 » dans le menu, `app_title` inchangé ailleurs (D103). FR et EN évoluent ensemble. Libellés EN de l'artboard `accueil-en` : Home, Spaces, Sessions, Config editor, Practice, Help, Collapse menu, Main navigation.
- **Langue du menu** : celle de l'application (`useUi()` à la racine, comme `UpdatePrompt` et la 404), même dans une session dont la config impose une autre langue. Le menu appartient à l'examinateur, pas à la session (à tracer dans D105).
- **Accessibilité** : 4,5:1 sur le fond sombre ; tout le menu se parcourt au clavier (liens et boutons natifs) ; `aria-current="page"` sur le lien actif ; `aria-expanded` sur le bouton de repli ; une fois replié, chaque lien garde son nom en `aria-label` et montre une infobulle au survol et au focus.
- **Tests (D102)** : un test de forme (libellé, structure, aide dans la barre) s'adapte ; un test de comportement qui casse signale une régression.
- Commits gitmoji en français, un groupe de commits pour #146 sur `feat/f44-refonte-ui`, PR #154 toujours en brouillon (D102).

## Review Focus

1. **`localStorage` inaccessible ou valeur corrompue** (navigation privée, `getItem` qui lève, valeur `"oui"`) : le menu s'ouvre déplié et la bascule marche pour la durée de la page. Test dans la Task 3.
2. **Route inconnue (404)** : le menu est là et aucun lien n'est actif. Test dans les Tasks 2 et 3.
3. **Vue projetée ouverte dans sa fenêtre** : ni menu, ni barre du haut, ni tiroir, ni pastille. Test dans la Task 3, e2e dans la Task 7.
4. **Tiroir sur téléphone** : un lien choisi ferme le tiroir et navigue ; Échap le ferme. Test dans la Task 4.
5. **Nom de session ou titre d'oral très long dans le fil d'Ariane** : le fil passe à la ligne sans élargir la page (`min-w-0`, `flex-wrap`, `break-words`). Test de classes dans la Task 5.

---

### Task 1: Maquette du menu en écran étroit (canevas)

**Files:**
- Canevas : `project/apres/menu-etroit.dc.html` (nouveau), `project/canvas.json` (entrée `apres/menu-etroit.dc.html`, ajoutée à `order` après `apres/menu-replie.dc.html`, rangée « Transverse » : `x: 1360, y: 12820, w: 1280, h: 900, page: "apres", expand: "fill"`)
- Design system : `project/components/Sidebar/README.md` (paragraphe « Écran étroit »)

**Interfaces:**
- Produces : l'artboard validé, référence de la Task 4.

- [ ] **Step 1 : Lire les deux Artifacts en entier** (`Artifact` `read` avec l'`url` seule, QUIRKS 2026-10-17), puis lire `apres/menu-replie.dc.html` pour en reprendre les styles en ligne.

- [ ] **Step 2 : Dessiner `menu-etroit.dc.html`** : deux téléphones de 390 × 844 côte à côte, l'Accueil derrière.
  - **Fermé** : une barre du haut de 56 px en `sidebar`, avec un filet `sidebar-border` en bas, la marque (carré et nom) à gauche et un bouton fantôme de 44 px « Menu » (`IconMenu2`, libellé visible) à droite. Le contenu de la page vient dessous, gouttière de 16 px.
  - **Ouvert** : un tiroir à gauche de 280 px en `sidebar`, sur un voile. Il contient le menu déplié (marque, Accueil, « Espaces », trois espaces, Aide en pied) sans le bouton « Replier le menu », et un bouton « Fermer le menu » (`IconX`, 44 px, `aria-label`) en haut à droite du tiroir. Lien actif sur Accueil.
  - Légende sous chaque téléphone : « Sous 768 px : barre du haut, le menu s'ouvre en tiroir. » et « Un lien choisi ferme le tiroir ; Échap aussi. »

- [ ] **Step 3 : Ajouter le paragraphe au README Sidebar** : « Écran étroit (< 768 px) : barre du haut (marque, bouton Menu) ; le menu déplié s'ouvre en tiroir à gauche, 280 px, sans bouton de repli ; choisir un lien ou Échap le ferme. »

- [ ] **Step 4 : Publier les deux Artifacts** avec `root` et `files`, en ne touchant que les fichiers ci-dessus.

- [ ] **Step 5 : Faire valider l'artboard par l'utilisateur.** C'est un point d'arrêt : la Task 4 ne commence pas sans son accord. Ses retours modifient l'artboard, pas le plan.

---

### Task 2: Lien actif et routes provisoires

**Files:**
- Create: `src/components/menu/active-menu-item.ts`, `src/components/menu/active-menu-item.test.ts`
- Create: `src/routes/sessions.tsx`, `src/routes/trainings.tsx`
- Modify: `src/routeTree.gen.ts` (régénéré par `pnpm test`, commité)

**Interfaces:**
- Produces : `export type MenuItemId = 'home' | 'sessions' | 'editor' | 'training'` et `export function activeMenuItem(pathname: string): MenuItemId | undefined`. Les routes `/sessions` et `/trainings` (composant `HomePage` de `@/features/home/home-page`), que #147 remplacera.

- [ ] **Step 1 : Écrire le test** `active-menu-item.test.ts`, un `test.each` :

```ts
test.each([
  ['/', 'home'],
  ['/sessions', 'sessions'],
  ['/new', 'sessions'],
  ['/session/abc', 'sessions'],
  ['/session/abc/stats', 'sessions'],
  ['/editor', 'editor'],
  ['/trainings', 'training'],
  ['/training/new', 'training'],
  ['/training/t1', 'training'],
  ['/training/t1/stats', 'training'],
  ['/training/t1/update', 'training'],
  ['/nope', undefined],
  ['/sessionsx', undefined],
  ['/editor-old', undefined],
] as const)('%s → %s', (pathname, expected) => {
  expect(activeMenuItem(pathname)).toBe(expected)
})
```

- [ ] **Step 2 : Lancer** `pnpm test src/components/menu/active-menu-item.test.ts`. Attendu : FAIL (module absent).

- [ ] **Step 3 : Implémenter `activeMenuItem`.** La comparaison se fait par segment, et non par préfixe brut, pour que `/sessionsx` ne compte pas. Créer les deux routes minces (`createFileRoute('/sessions')({ component: HomePage })`, même chose pour `/trainings`), chacune avec un commentaire d'une ligne : « Provisoire (#146) : l'accueil, en attendant la page de l'espace (#147). »

- [ ] **Step 4 : Lancer** `pnpm test src/components/menu` puis `pnpm typecheck`. Attendu : PASS, et `routeTree.gen.ts` régénéré.

- [ ] **Step 5 : Commit** `✨ Calcule le lien actif du menu et ouvre /sessions et /trainings`

---

### Task 3: Menu latéral repliable dans la coquille racine

**Files:**
- Create: `src/lib/menu-collapsed.ts`, `src/lib/menu-collapsed.test.ts`
- Create: `src/components/menu/menu-links.tsx` (contenu commun au menu latéral et au tiroir)
- Create: `src/components/menu/app-menu.tsx`, `src/components/menu/app-menu.test.tsx`
- Modify: `src/routes/__root.tsx` (disposition `flex flex-col md:flex-row`, `AppMenu` hors projection)
- Modify: `src/components/page-shell.tsx` (retirer le lien d'aide), `src/components/page-shell.test.tsx`
- Modify: `src/testing/page-shell-assertions.ts` (retirer `expectHelpLinkLast` et `HELP_LINK_LABEL`), et ses appelants : `src/features/{config-editor/config-editor-page,stats/stats-page,session/examiner-view,create-session/create-session-page,home/home-page}.test.tsx`
- Modify: `src/routes/routes.test.tsx` (présence, lien actif, absence sur la projection)
- Modify: `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Consumes : `activeMenuItem`, `MenuItemId` (Task 2).
- Produces :
  - `readMenuCollapsed(): boolean` et `writeMenuCollapsed(collapsed: boolean): void`, clé `'questionator:menu-collapsed'`, valeur `'true'` ou `'false'`. Tout ce qui n'est pas `'true'` vaut déplié ; une lecture ou une écriture qui lève est avalée (même schéma que `readStoredMode` / `writeStoredMode` de `src/lib/appearance/color-mode.ts`).
  - `MenuLinks({ ui, active, collapsed, onNavigate }: Readonly<{ ui: Ui; active: MenuItemId | undefined; collapsed: boolean; onNavigate?: () => void }>)` : la marque, puis `nav` « Navigation principale » (Accueil), l'intertitre « Espaces » (ou le filet), `nav` « Espaces » (Sessions `/sessions`, Éditeur `/editor`, Entraînement `/trainings`), et `nav` « Aide » en pied, poussé par `mt-auto`. Le lien d'aide garde `href={`${import.meta.env.BASE_URL}docs/`}`, `target="_blank"`, `rel="noopener noreferrer"` et `aria-label` = `help_link_label`. Une fois replié, chaque lien a son `aria-label` et un `Tooltip` (`side="right"`) qui porte le même libellé. `onNavigate` est appelé au clic sur un lien (le tiroir s'en sert en Task 4).
  - `AppMenu()` : `useUi()` et `useLocation({ select: (l) => l.pathname })`. Rend, dans un `TooltipProvider`, un `<aside>` `hidden md:flex sticky top-0 h-svh shrink-0 flex-col` de largeur `w-62` ou `w-18`, avec `transition-[width] motion-reduce:transition-none`. L'aside contient `MenuLinks` et le bouton de repli (`aria-expanded`, libellé `menu_collapse` / `menu_expand`, `aria-label` une fois replié). L'état initial vient de `readMenuCollapsed()`, lu dans l'initialiseur de `useState` ; chaque bascule appelle `writeMenuCollapsed`.
  - Clés i18n (FR / EN) : `menu_brand` « Questionator Z-4000 » / idem ; `menu_main_label` « Navigation principale » / « Main navigation » ; `menu_home` « Accueil » / « Home » ; `menu_spaces` « Espaces » / « Spaces » ; `menu_sessions` « Sessions » / « Sessions » ; `menu_editor` « Éditeur de config » / « Config editor » ; `menu_training` « Entraînement » / « Practice » ; `menu_help_label` « Aide » / « Help » (nom de la `nav`) ; `menu_collapse` « Replier le menu » / « Collapse menu » ; `menu_expand` « Déplier le menu » / « Expand menu ». `help_link` et `help_link_label` sont réutilisées.

- [ ] **Step 1 : Écrire les tests du stockage** (`menu-collapsed.test.ts`) : rien de stocké → `false` ; `'true'` → `true` ; `'oui'` → `false` ; `getItem` qui lève (`vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqué') })`) → `false` ; `setItem` qui lève → `writeMenuCollapsed(true)` ne lève pas ; aller-retour `write(true)` puis `read()` → `true`.

- [ ] **Step 2 : Écrire les tests du menu** (`app-menu.test.tsx`, monté par `renderAt('/editor')` de `@/testing/render-at`). Les requêtes de lien passent par `within(screen.getByRole('navigation', { name: … }))` : à partir de la Task 5, le fil d'Ariane a lui aussi un lien « Sessions ».
  - `test('liens du menu, Éditeur actif', …)` : liens « Accueil », « Sessions », « Éditeur de config », « Entraînement » avec leurs `href` (`/`, `/sessions`, `/editor`, `/trainings`, hash compris selon l'historique mémoire), et `aria-current="page"` sur « Éditeur de config » seulement.
  - `test('aide en pied : doc dans un nouvel onglet', …)` : `getByRole('link', { name: 'Aide (nouvel onglet)' })` avec `href`, `target`, `rel`. Ce test remplace celui de `page-shell.test.tsx`.
  - `test('replier puis déplier, état mémorisé', …)` : clic sur « Replier le menu » → `aria-expanded="false"`, nom accessible « Déplier le menu », `localStorage.getItem('questionator:menu-collapsed') === 'true'`, les liens gardent leur nom (« Sessions »…) et l'intertitre « Espaces » disparaît. On démonte, on remonte : toujours replié.
  - `test('stockage illisible : déplié, bascule utilisable', …)` : `getItem` qui lève → bouton « Replier le menu » ; un clic le fait passer à « Déplier le menu » (Review Focus 1).
  - `test('clavier : Tab parcourt les liens puis le bouton', …)` : `userEvent.tab()` répété depuis le `body` ; la suite des éléments focalisés contient, consécutifs et dans cet ordre, Accueil, Sessions, Éditeur de config, Entraînement, Aide, Replier le menu. On vérifie une sous-suite et non un début de liste, parce que la Task 4 place le bouton « Menu » avant.

- [ ] **Step 3 : Ajouter les cas de route** à `routes.test.tsx` :
  - `'/session/<id>'` (session en base) → « Sessions » actif ;
  - `'/training/new'` → « Entraînement » actif ;
  - `'/nope'` → menu présent (« Page introuvable » affichée), aucun `aria-current` (Review Focus 2) ;
  - `'/present/<id>'` → `queryByRole('navigation', { name: 'Navigation principale' })` est `null` (Review Focus 3).

- [ ] **Step 4 : Lancer** `pnpm test src/lib/menu-collapsed.test.ts src/components/menu src/routes`. Attendu : FAIL.

- [ ] **Step 5 : Implémenter** `menu-collapsed.ts`, `menu-links.tsx`, `app-menu.tsx` et les clés i18n. Dans `RootLayout`, envelopper `Outlet` dans `<div className="flex min-w-0 flex-1 flex-col">` et rendre `{!projected && <AppMenu />}` avant. Retirer le lien d'aide et `IconHelp` de `PageShell`, puis mettre à jour sa JSDoc (« actions à droite », sans aide).

- [ ] **Step 6 : Adapter les tests de forme** : supprimer `expectHelpLinkLast` et ses appels. Dans `page-shell.test.tsx`, le test « lien Aide » disparaît, `names` passe à 2 éléments, et le test du titre long vérifie `ml-auto` sur le groupe d'actions. Ne garder `bannerInteractiveNames` que là où il vérifie l'ordre des actions.

- [ ] **Step 7 : Lancer** `pnpm check`. Attendu : vert. Les e2e qui cliquent « Aide (nouvel onglet) » (`e2e/docs.spec.ts`) passent sans modification à 1280 px.

- [ ] **Step 8 : Commit** `✨ Ajoute le menu latéral repliable et y déplace l'aide`

---

### Task 4: Menu en tiroir sur écran étroit

Ne commence qu'une fois l'artboard de la Task 1 validé.

**Files:**
- Create: `src/components/menu/menu-drawer.tsx`, `src/components/menu/menu-drawer.test.tsx`
- Modify: `src/components/menu/app-menu.tsx` (rendre `MenuDrawer` à côté de l'`aside`)
- Modify: `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Consumes : `MenuLinks` et son `onNavigate` (Task 3).
- Produces : `MenuDrawer({ ui, active }: Readonly<{ ui: Ui; active: MenuItemId | undefined }>)`. C'est une barre `md:hidden` de 56 px (`bg-sidebar`, `border-b border-sidebar-border`, marque à gauche, `SheetTrigger` « Menu » en `ghost`) suivie d'une `Sheet` `side="left"` : `showCloseButton={false}`, largeur surchargée par `data-[side=left]:w-70 data-[side=left]:sm:max-w-70` (CONVENTIONS § Composant shadcn), `bg-sidebar`, `SheetTitle` masqué (`sr-only`) « Menu », un bouton traduit « Fermer le menu » (`SheetClose`, `IconX`) et `MenuLinks collapsed={false} onNavigate={() => setOpen(false)}`. Clés : `menu_open` « Menu » / « Menu » ; `menu_close` « Fermer le menu » / « Close menu ».

- [ ] **Step 1 : Écrire les tests** (`menu-drawer.test.tsx`, monté par `renderAt('/')`). Le tiroir est dans le DOM à toute largeur, parce que jsdom n'applique pas les classes `md:` ; les requêtes passent donc par le bouton « Menu ».
  - `test('le bouton Menu ouvre le tiroir', …)` : clic sur « Menu » → `getByRole('dialog', { name: 'Menu' })` contient le lien « Sessions », et pas de bouton « Replier le menu ».
  - `test('un lien choisi ferme le tiroir et navigue', …)` : ouvrir, cliquer « Éditeur de config » dans le dialogue → plus de `dialog`, `router.state.location.pathname === '/editor'` (Review Focus 4).
  - `test('Échap ferme le tiroir et rend le focus au bouton Menu', …)` : `userEvent.keyboard('{Escape}')` → plus de `dialog`, `document.activeElement` est le bouton « Menu ».

- [ ] **Step 2 : Lancer** `pnpm test src/components/menu/menu-drawer.test.tsx`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter `MenuDrawer`** et l'ajouter dans `AppMenu`. La barre du haut et l'`aside` vivent côte à côte dans la colonne `flex-col md:flex-row` de `RootLayout`.

- [ ] **Step 4 : Lancer** `pnpm test src/components/menu`. Attendu : PASS. Puis `pnpm check`.

- [ ] **Step 5 : Commit** `📱 Ouvre le menu en tiroir sur écran étroit`

---

### Task 5: Coquille de page, fil d'Ariane et lien retour

**Files:**
- Create: `src/components/breadcrumb.tsx`, `src/components/breadcrumb.test.tsx`
- Create: `src/components/back-link.tsx`, `src/components/back-link.test.tsx`
- Modify: `src/components/page-shell.tsx`, `src/components/page-shell.test.tsx`
- Modify: `src/features/create-session/create-session-page.tsx`, `src/features/config-editor/config-editor-page.tsx`, `src/features/session/components/examiner-view.tsx`, `src/features/stats/components/stats-view.tsx`, `src/features/training/training-page.tsx`, `src/features/training-setup/training-setup-page.tsx`, `src/features/training-stats/training-stats-page.tsx`, et leurs tests de forme s'ils cassent
- Modify: `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Produces :
  - `Breadcrumb({ ui, root, parts }: Readonly<{ ui: Ui; root: { label: string; to?: '/sessions' }; parts?: readonly string[] }>)` : `<nav aria-label={breadcrumb_label}>` en `text-sm text-muted-foreground`, `flex flex-wrap items-center gap-1.5 min-w-0`. `root` est un `Link` (sans soulignement, `hover:text-foreground`) quand `to` est donné ; sinon c'est un `<span aria-current="page">`. Viennent ensuite `IconChevronRight` (16 px, `aria-hidden`) et les `parts` séparées par `·` (`aria-hidden`), chaque part en `<span className="min-w-0 break-words">`. Clé : `breadcrumb_label` « Fil d'Ariane » / « Breadcrumb ».
  - `BackLink = createLink(BackAnchor)` (TanStack `createLink`). `BackAnchor` est une ancre `forwardRef` qui rend `IconChevronLeft` (16 px, `aria-hidden`) puis ses enfants, en `inline-flex items-center gap-1 self-start text-sm font-medium text-muted-foreground no-underline hover:text-foreground`. Usage : `<BackLink to="/">{text('back_home', {})}</BackLink>`.
  - `PageShell` : `main` en `gap-6 px-4 py-6 md:px-10 md:py-8`, toujours borné à `max-w-(--breakpoint-2xl)`. En-tête `flex flex-wrap items-end justify-between gap-x-6 gap-y-4`. Bloc titre `flex min-w-0 flex-[1_1_20rem] flex-col gap-2`. `h1` en `text-h1 font-bold tracking-tight`. `meta` en `text-muted-foreground`. Les props ne changent pas ; la JSDoc de `back` devient « fil d'Ariane (`Breadcrumb`) ou lien retour (`BackLink`) ».

- [ ] **Step 1 : Écrire les tests**
  - `breadcrumb.test.tsx` : `test('racine en lien, parts séparées par un point', …)`. On monte `root={{ label: 'Sessions', to: '/sessions' }}` et `parts={['Oral de démonstration', 'Oral PHP']}` sous un routeur mémoire. Attendu : `getByRole('navigation', { name: "Fil d'Ariane" })`, un lien « Sessions » vers `/sessions`, et le texte `Oral de démonstration` puis `Oral PHP`. `test('racine sans lien : page courante', …)` : `root={{ label: 'Éditeur de config' }}` → pas de lien, et un `aria-current="page"` sur le texte. `test('part longue : passe à la ligne', …)` : une part de 200 caractères porte `min-w-0` et `break-words`, la `nav` porte `flex-wrap` (Review Focus 5).
  - `back-link.test.tsx` : `test('lien retour avec chevron', …)` : lien « Retour à l’accueil » vers `/`, qui contient un `svg[aria-hidden]` avant le texte.

- [ ] **Step 2 : Lancer** `pnpm test src/components/breadcrumb.test.tsx src/components/back-link.test.tsx`. Attendu : FAIL.

- [ ] **Step 3 : Implémenter** `Breadcrumb`, `BackLink` et la nouvelle mise en forme de `PageShell`.

- [ ] **Step 4 : Remplacer les liens retour**, d'après l'artboard de chaque écran :

| Écran | Avant | Après |
|---|---|---|
| `/new` | « Retour à l’accueil » | `Breadcrumb root={{ label: menu_sessions, to: '/sessions' }}` |
| `/editor` | « Retour à l’accueil » | `Breadcrumb root={{ label: menu_editor }}` |
| `/session/$id` | « Retour à l’accueil » | `Breadcrumb root={{ label: menu_sessions, to: '/sessions' }} parts={[session.name, config.exam.title]}` |
| `/session/$id/stats` | bouton contour « Retour au passage » | `BackLink` « Retour au passage » |
| `/training/$id` | « Retour à l’accueil » | `BackLink` « Retour à l’accueil » |
| `/training/new` | « Retour à l’accueil » | `BackLink` « Retour à l’accueil » |
| `/training/$id/update` | « Retour à l’entraînement » | `BackLink` « Retour à l’entraînement » |
| `/training/$id/stats` | « Retour à l’entraînement » | `BackLink` « Retour à l’entraînement » |

Les écrans d'entraînement gardent leur lien retour : leurs artboards le montrent. La carte des écrans visait les écrans d'un espace en général ; l'artboard fait foi (à tracer dans D105). Les `h1` et sous-titres ne changent pas ici : ils relèvent des tickets d'écran (#147 à #151).

- [ ] **Step 5 : Lancer** `pnpm check`, puis adapter les tests de forme qui cherchaient « Retour à l’accueil » sur `/new`, `/editor` ou `/session/$id` : ils cherchent désormais le lien « Sessions » du fil d'Ariane, ou la `nav` « Fil d'Ariane ». Attendu : vert. Lancer aussi `pnpm e2e e2e/stats.spec.ts e2e/training.spec.ts e2e/damaged-session.spec.ts`, qui cliquent les liens retour conservés. Attendu : PASS.

- [ ] **Step 6 : Commit** `💄 Met la coquille de page à la forme du canevas, fil d'Ariane et lien retour`

---

### Task 6: Bandeaux, invites et écrans de repli

**Files:**
- Create: `src/components/status-screen.tsx`, `src/components/status-screen.test.tsx`
- Modify: `src/components/db-status-banner.tsx`, `src/components/update-prompt.tsx` (+ test), `src/components/offline-ready-prompt.tsx` (+ test), `src/components/damaged-session.tsx` (+ test), `src/components/session-fallback.tsx` (+ test), `src/components/damaged-training-screen.tsx`, `src/routes/__root.tsx` (`NotFound`), `src/routes/db-status.test.tsx`
- Modify: `src/lib/i18n/ui-messages.ts`, `src/lib/i18n/ui-messages.test.ts`

**Interfaces:**
- Produces : `StatusScreen({ icon, tone = 'neutral', title, children }: Readonly<{ icon: ReactNode; tone?: 'neutral' | 'danger'; title: ReactNode; children?: ReactNode }>)`. C'est un `main` centré (`flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center`). Il contient une tuile d'icône de 56 px, `rounded-md` (`bg-muted text-muted-foreground` en neutre, `bg-destructive/14 text-destructive` en danger), puis un `h1` en `text-2xl font-bold`, puis `children`. `DamagedSessionScreen`, `SessionFallback` (introuvable), `DamagedTrainingScreen` et `NotFound` passent par lui.
- Clés i18n, découpées en titre et corps (le corps garde la clé existante, le titre est nouveau) :
  - `db_outdated_title` « L’application a été mise à jour dans un autre onglet. » / « The app was updated in another tab. » ; `db_outdated` devient « Rechargez la page pour continuer. » / « Reload the page to continue. »
  - `db_unavailable_title` « Le stockage local est indisponible » / « Local storage is unavailable » ; `db_unavailable` devient « (navigation privée ou cookies bloqués ?). Les sessions ne peuvent pas être enregistrées. » / « (private browsing or blocked cookies?). Sessions cannot be saved. »
  - `offline_ready_title` « Prête pour le hors ligne » / « Ready to work offline » ; `offline_ready` devient « L’application fonctionne désormais sans réseau. » / « The app now works without a network. »
  - `update_available` reste le titre ; `update_available_body` (nouvelle) « Rechargez quand vous voulez. » / « Reload whenever you like. »
  - `damaged_details` prend `{ count: number }` : « Détails · 1 problème » / « Détails · N problèmes » (`plural`), « Details · 1 issue » / « Details · N issues » (`pluralEn`).

- [ ] **Step 1 : Écrire ou adapter les tests**
  - `status-screen.test.tsx` : `test('titre en h1, icône, actions', …)` et `test('ton danger', …)` (la tuile porte `text-destructive`).
  - `db-status.test.tsx` : le bandeau `outdated` a pour nom de `role="alert"` le titre puis le corps, et un bouton « Recharger » ; le bandeau `unavailable` a son titre en `strong`.
  - `update-prompt.test.tsx`, `offline-ready-prompt.test.tsx` : titre et corps rendus dans l'`output`, bouton inchangé.
  - `damaged-session.test.tsx` : `test('détails : nombre de problèmes', …)` avec 2 problèmes → summary « Détails · 2 problèmes » ; « Exporter une sauvegarde » est un bouton `default` ; « Retour à l’accueil » est un lien.
  - `session-fallback.test.tsx` : `test('introuvable : retour en bouton principal', …)` → le lien « Retour à l’accueil » porte les classes de `buttonVariants({ variant: 'default' })`.

- [ ] **Step 2 : Lancer** les tests ci-dessus. Attendu : FAIL.

- [ ] **Step 3 : Implémenter**, d'après l'artboard `apres/bandeaux` :
  - **`DbStatusBanner`** : carte `bg-card shadow-card rounded-lg px-5 py-4 flex flex-wrap items-center gap-4`. Tuile de 40 px : `IconRefresh` sur `bg-muted` pour `outdated` ; `IconDatabase` sur `bg-destructive/14 text-destructive` pour `unavailable`, avec la carte en `bg-destructive/8 border border-destructive/45`. Le texte est un `<p className="flex-[1_1_22rem]">` avec `<strong>` titre puis `<span className="text-muted-foreground">` corps. Bouton `default` « Recharger » avec `IconRefresh`.
  - **`UpdatePrompt`, `OfflineReadyPrompt`** : `output` de `max-w-100` en `bg-popover border rounded-lg shadow-popover p-3.5 pl-4 flex items-center gap-3.5`. Tuile de 36 px : `IconDownload` en `bg-primary/16 text-link` pour la mise à jour, `IconCloudCheck` en `bg-space-training/14 text-space-training` pour le hors ligne (tracés de l'artboard). Titre en `strong`, corps en `text-sm text-muted-foreground`. Boutons `size="sm"` : `default` « Recharger », `outline` « OK ».
  - **`DamagedSessionScreen`** : variante examinateur en `StatusScreen tone="danger"`, `IconAlertTriangle`. Ensuite le corps, puis la rangée « Exporter une sauvegarde » (`default`, `IconDownload`) et « Retour à l’accueil » (`Link` en `buttonVariants({ variant: 'ghost' })`), puis le `details` en carte (`bg-card shadow-card rounded-lg px-4.5 py-3.5 text-left w-full max-w-120`), summary « Détails · N problèmes », chaque `li` séparé par `border-t` et son code en `font-mono text-xs text-muted-foreground`. Variante projetée : tuile et titre seuls, titre en `text-3xl font-extrabold`, halo `bg-[radial-gradient(closest-side,var(--color-halo-cool),transparent)]` derrière (`aria-hidden`).
  - **`SessionFallback`** : chargement avec `IconLoader2` `animate-spin motion-reduce:animate-none text-link` et le texte en `text-muted-foreground`. Introuvable en `StatusScreen` (`IconFileX`), avec le retour en `Link` `buttonVariants({ variant: 'default' })`.
  - **`DamagedTrainingScreen`** (non maquetté) : `StatusScreen tone="danger"` (`IconAlertTriangle`), corps, `ConfigIssueList`, retour en bouton `default`, comme « Session introuvable ».
  - **`NotFound`** : `StatusScreen` (`IconFileX`), retour en bouton `default`.

- [ ] **Step 4 : Lancer** `pnpm check`, puis `pnpm e2e e2e/update.spec.ts e2e/offline.spec.ts e2e/damaged-session.spec.ts`. Attendu : vert. Un e2e qui cherche l'ancienne phrase entière s'adapte au titre ou au corps (test de forme).

- [ ] **Step 5 : Commit** `💄 Découpe les bandeaux en titre et corps, écrans de repli à la forme du canevas`

---

### Task 7: E2E du menu, mémoire et PR

**Files:**
- Create: `e2e/menu.spec.ts`, `e2e/pages/app-menu.ts` (Page Object)
- Modify: `docs/CONVENTIONS.md` (§ « Page examinateur — squelette » ; nouvelle section « Menu et coquille de page — règles »), `docs/DECISIONS.md` (D105), `docs/INDEX.md`, `docs/HANDOFF.md`, `docs/QUIRKS.md` (si un piège est apparu), `docs/BACKLOG.md` (si une idée est apparue)
- Canevas et design system : artboards dont l'implémentation s'écarte (à constater, pas à supposer)
- PR #154 : corps mis à jour (`Closes #146`, cases de la checklist)

**Interfaces:**
- Consumes : tout ce qui précède.

- [ ] **Step 1 : Écrire `e2e/menu.spec.ts`** (squelette CONVENTIONS § Test e2e). Le Page Object `AppMenu` cherche ses liens dans `page.getByRole('complementary')` (l'`aside`), jamais dans toute la page : le fil d'Ariane et l'accueil ont des liens de même nom.
  - `test('naviguer entre les espaces sans repasser par l’accueil', …)` : depuis `/editor`, clic sur « Entraînement » → l'URL finit par `#/trainings`, puis « Sessions » → `#/sessions`. Le lien cliqué a `aria-current="page"`.
  - `test('replié : infobulle au survol et au focus, état gardé au rechargement', …)` : clic sur « Replier le menu » ; `hover` sur « Sessions » → `getByRole('tooltip', { name: 'Sessions' })` visible ; `Tab` jusqu'à « Éditeur de config » → infobulle « Éditeur de config » ; `page.reload()` → bouton « Déplier le menu » ; largeur de l'`aside` à 72 px (`boundingBox`).
  - `test('écran étroit : tiroir', …)` : `page.setViewportSize({ width: 390, height: 844 })` ; l'`aside` est masqué ; le bouton « Menu » ouvre le dialogue ; « Éditeur de config » navigue et le referme.
  - `test('vue projetée : aucun menu', …)` : ouvrir `/present/<id>` d'une session d'exemple → aucune `navigation` « Navigation principale », aucun bouton « Menu ».

- [ ] **Step 2 : Lancer** `pnpm build && pnpm e2e`. Attendu : tous les e2e verts (55 + 4).

- [ ] **Step 3 : Comparer au canevas** sous `pnpm dev`, à 1280 px et à 390 px : menu déplié et replié, en-têtes de `/new`, `/editor`, `/session/$id`, bandeaux. Tout écart volontaire met à jour l'artboard concerné (lecture complète de l'Artifact d'abord, QUIRKS 2026-10-17).

- [ ] **Step 4 : Mémoire projet**
  - **D105** : menu monté dans `RootLayout` (thème de session lu sur `<html>`, langue de l'application) ; état replié dans `questionator:menu-collapsed` ; tiroir sous 768 px (décision de l'utilisateur, artboard `menu-etroit`) ; `/sessions` et `/trainings` provisoires sur l'accueil (décision de l'utilisateur) ; aide sortie de `PageShell` ; fil d'Ariane sur `/new`, `/editor` et `/session/$id`, lien retour ailleurs d'après les artboards ; bandeaux en titre et corps.
  - **CONVENTIONS** : § « Page examinateur » (plus d'aide dans la coque, `back` = `Breadcrumb` ou `BackLink`, plus de `expectHelpLinkLast`) ; nouvelle section « Menu et coquille de page — règles » (une seule instance dans `RootLayout`, `activeMenuItem` à étendre pour toute nouvelle route, `StatusScreen` pour les écrans d'état, liens retour en `BackLink` et non en `TEXT_LINK_CLASS`).
  - **INDEX** : ligne F44.4 (#146), qui renvoie vers ce plan.
  - **HANDOFF** : entrée datée avec les quatre marqueurs.

- [ ] **Step 5 : Commit** `📝 Trace le menu et la coquille de F44.4 (D105)`

- [ ] **Step 6 : Pousser, mettre à jour le corps de la PR #154** (ajouter `Closes #146`) et lancer `.claude/scripts/sonar-check.sh --pr 154 --wait`. Attendu : « Quality gate OK », 0 issue, 0 hotspot. La PR reste en brouillon (D102).

- [ ] **Step 7 : Faire valider #146 par l'utilisateur en local** (`pnpm dev`, tour des écrans à 1280 px et sur téléphone) avant le ticket suivant.
