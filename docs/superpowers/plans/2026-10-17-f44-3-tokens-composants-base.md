# F44.3 — Tokens et composants de base — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le thème sombre du design system en place dans le code, composants de base compris : toute l'app change d'apparence d'un coup, sans changement de disposition (#145).

**Architecture:** `src/index.css` reçoit les valeurs du design system dans son bloc `:root`, qui ne contient toujours que les `THEME_TOKENS`, surchargeables par une config. Le reste va dans `@theme` : couleurs d'espace, ombres, typographie, toutes fixes. Les tokens dérivés de `--primary` (fin du dégradé d'action, lueur, halos) vont dans `@theme inline`, pour que les utilitaires les recalculent là où le thème d'une session s'applique. `AppearanceProvider` reçoit un mode forcé (`forcedMode="dark"` dans `__root.tsx`) : la mécanique clair / sombre reste intacte pour #152, qui n'aura qu'à retirer la prop et remonter la bascule.

**Tech Stack:** Tailwind CSS v4 (`@theme`, `@theme inline`, `color-mix`), shadcn v4 sur base-ui, React 19, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (D102), carte des écrans `docs/superpowers/specs/2026-10-17-f44-carte-des-ecrans.md` (D103), design system <https://claude.ai/artifact/DMYaQZGYtm8RnJqbBMmBcy> (`project/tokens.json`, `project/README.md`, `project/components/*/README.md`).

## Global Constraints

- Hors ligne et 100 % local : toute nouvelle police s'installe en paquet (`@fontsource…`), jamais par Google Fonts ni un CDN. Aucune requête réseau ajoutée.
- Contraste texte 4.5:1 (3:1 au-delà de 24 px) sur le fond sombre, y compris le texte gris secondaire et le texte posé sur un dégradé.
- Couleurs uniquement via les tokens CSS, jamais en dur dans un composant : le thème de session surcharge les tokens shadcn. Seules les couleurs d'espace échappent à la config.
- Schéma de config inchangé : `THEME_TOKENS` et le bloc `:root` de `src/index.css` gardent exactement les mêmes 33 noms (test de parité `src/domain/config/schema.test.ts`).
- Mode sombre forcé, bascule clair / sombre retirée de l'interface ; `defaultColorMode` reste dans le schéma, sans effet jusqu'à #152.
- Code vendu de `src/components/ui/` : on peut le modifier, mais toute personnalisation doit rester compatible avec un `shadcn add --overwrite` (noms de variantes du vendor conservés).
- Tests : un changement de libellé ou de structure adapte le test de forme concerné (D102, « Tests et libellés ») ; un test de comportement qui casse signale une régression, sauf s'il teste précisément la bascule retirée (Task 2).
- Commits gitmoji en français (`<emoji> <message au présent>`), un groupe de commits pour #145 sur `feat/f44-refonte-ui`.
- Canevas avant l'interface (D102) : tout écart à une maquette met l'artboard à jour dans la même PR.

## Review Focus

1. **Préférence « clair » mémorisée avant la refonte** (`localStorage` `questionator:color-mode:global` = `light`, ou une clé de session) : l'app reste sombre, avec les tokens `theme.dark` de la session. Test dans la Task 2.
2. **Config dont `theme.dark` ne surcharge que `primary`** : le dégradé du bouton principal suit la nouvelle couleur ; les autres tokens restent ceux du design system. Test e2e dans la Task 4.
3. **Config qui n'a que `theme.light`** : la session prend le thème sombre par défaut et ignore les tokens clairs. Test dans la Task 2.
4. **Écran étroit (375 px) avec des boutons passés de 32 à 44 px** : la modale de suppression garde ses trois boutons visibles, empilés. Couvert par `e2e/delete-dialog.spec.ts`, rejoué dans la Task 4.
5. **`prefers-reduced-motion: reduce`** : le chevron d'un `<details>` change d'orientation sans animation. Test e2e dans la Task 6.

---

### Task 1: Design system et canevas alignés sur D103

Pas de code : publication sur les deux Artifacts. Lire d'abord `SKILL.md` du design system (`Artifact` `read` avec `path`) pour savoir comment publier ses fichiers. Pour les artboards du canevas (`.dc.html` sur une seule ligne), faire des remplacements exacts par script Python, avec une assertion sur le nombre d'occurrences (HANDOFF 2026-10-17).

**Files (Artifacts):**
- Modify (design system): `project/README.md`, `project/components/Sidebar/README.md`, `project/components/Sidebar/preview.html`, `project/components/Button/README.md`, `project/components/Button/preview.html`, `project/components/Dialog/README.md`
- Create (design system): `project/components/Disclosure/README.md`, `project/components/Disclosure/preview.html`
- Modify (canevas): artboards de la page « Après » qui montrent un bouton de confirmation de suppression (`accueil-dialogues`, `session-dialogues`, et tout autre artboard repéré par une recherche de `qz-btn--danger` ou de `destructive` sur fond plein)

**Interfaces:**
- Produces: la référence que suivent les Tasks 3 à 6 (danger plein en texte sombre, chevron dessiné).

- [ ] **Step 1: README** : remplacer « Première proposition (F44, ticket #144), à faire évoluer par commentaires. » par « Validé en F44.2 (D103). » ; dans « Contrastes mesurés », ajouter la ligne `background` sur `destructive` : 6,2.
- [ ] **Step 2: Sidebar** : remplacer « Forme repliée et comportement en largeur étroite : à trancher sur le canevas. » par la forme de D103 : 248 px déplié, 72 px replié (icônes seules, infobulles au survol et au focus, séparateur à la place de l'intertitre), « Replier le menu » en pied, état mémorisé sur l'appareil. La bascule clair / sombre revient au ticket 10 au-dessus de « Replier le menu ». L'aperçu montre les deux états.
- [ ] **Step 3: Button et Dialog** : le danger plein (confirmation d'une suppression) a le fond `destructive` et le texte `background`, soit 6,2:1 (le blanc ne donne que 3,1:1). L'aperçu de Button ajoute ce bouton.
- [ ] **Step 4: Disclosure** (nouveau) : `<details>` avec le chevron `chevron-right` de Tabler (trait de 2 px, 16 px, couleur du texte de `summary`) avant le libellé, tourné de 90° quand le bloc est ouvert, en 150 ms, sans transition sous `prefers-reduced-motion`. Pas de triangle natif.
- [ ] **Step 5: Canevas** : passer en texte `background` le texte des boutons de danger plein des artboards concernés ; relire chaque artboard modifié (`Artifact` `read` avec `path`).
- [ ] **Step 6: Vérifier** : relire les fichiers publiés. Ils reflètent les Steps 1 à 5 et aucun autre fichier n'a changé.

---

### Task 2: Mode sombre forcé, bascule retirée

**Files:**
- Modify: `src/app/appearance-provider.tsx`, `src/routes/__root.tsx`, `src/components/page-shell.tsx`, `src/features/present/components/present-controls.tsx`, `src/testing/page-shell-assertions.ts`
- Test: `src/app/appearance-provider.test.tsx`, `src/routes/routes.test.tsx`, `src/components/page-shell.test.tsx`, ainsi que les appelants de `expectColorModeToggleLast` (`config-editor-page.test.tsx`, `stats-page.test.tsx`, `examiner-view.test.tsx`, `create-session-page.test.tsx`, `home-page.test.tsx`)
- Delete: `e2e/color-mode.spec.ts` (il teste #76 à travers la bascule ; #152 le rétablit depuis l'historique git)

**Interfaces:**
- Produces: `AppearanceProvider({ children, forcedMode }: Readonly<{ children: ReactNode; forcedMode?: EffectiveMode }>)`. Quand `forcedMode` est défini, `effective === forcedMode` quels que soient le choix mémorisé, la préférence système et le `defaultMode` de la portée ; les tokens appliqués sont `scope.theme?.[forcedMode]`, et `mode` vaut `forcedMode` dans le contexte. Sans la prop, rien ne change.
- Produces: `expectHelpLinkLast(): void` dans `src/testing/page-shell-assertions.ts` remplace `expectColorModeToggleLast` (dernier nom accessible de la barre : `ui.text('help_link_label')`, en FR comme en EN).
- `ColorModeToggle`, son test unitaire, `color-mode.ts` et les clés i18n `color_mode_*` restent en place, simplement démontés : #152 les remonte en pied de menu.

- [ ] **Step 1: Tests du mode forcé** dans `appearance-provider.test.tsx`, avec le harnais du fichier :

```tsx
test('forcedMode : sombre malgré un choix « clair » mémorisé et un système clair', () => {
  localStorage.setItem('questionator:color-mode:global', 'light')
  renderWithProvider({ forcedMode: 'dark' })
  expect(document.documentElement).toHaveClass('dark')
})

test('forcedMode : une portée sans theme.dark n’applique aucun token clair', () => {
  // portée { defaultMode: 'light', theme: { light: { primary: 'rgb(1, 2, 3)' }, dark: {} } }
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('')
  expect(document.documentElement).toHaveClass('dark')
})

test('forcedMode : les tokens theme.dark de la portée s’appliquent', () => {
  // portée { defaultMode: 'light', theme: { light: {}, dark: { primary: 'rgb(4, 5, 6)' } } }
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('rgb(4, 5, 6)')
})
```

`renderWithProvider` est le rendu de `<AppearanceProvider>` que le fichier utilise déjà, avec en plus la prop `forcedMode` ; adapter le nom au harnais existant.

- [ ] **Step 2: Lancer** `rtk vitest run src/app/appearance-provider.test.tsx`. Attendu : les trois tests échouent (prop inconnue, `.dark` absente).
- [ ] **Step 3: Implémenter `forcedMode`** dans `AppearanceProvider` : `const effective = forcedMode ?? resolveColorMode(stored, scope.defaultMode, systemDark)`, et `mode` dans la valeur du contexte vaut `forcedMode ?? stored ?? scope.defaultMode`.
- [ ] **Step 4: Lancer** le même fichier. Attendu : PASS, anciens tests compris.
- [ ] **Step 5: Brancher** : `<AppearanceProvider forcedMode="dark">` dans `__root.tsx`, avec le commentaire `{/* Thème sombre seul pendant la refonte (D102) ; le mode clair revient en #152. */}`. Retirer `<ColorModeToggle ui={ui} />` de `page-shell.tsx` et de `present-controls.tsx`, ainsi que leurs imports.
- [ ] **Step 6: Adapter les tests de forme** : remplacer `expectColorModeToggleLast` par `expectHelpLinkLast` (définition et appels) ; dans `page-shell.test.tsx`, le conteneur `ml-auto justify-end` se retrouve par le lien d'aide ; dans `stats-page.test.tsx:40`, la présence de « Mode d'affichage » devient sa présence du lien d'aide. Dans `routes.test.tsx`, les cas qui attendent l'absence de `.dark` (mode clair, système clair) attendent maintenant `.dark` et les tokens `theme.dark` ; le test « d'une session à l'autre » garde son changement de `--primary` et de `lang`. Supprimer `e2e/color-mode.spec.ts`.
- [ ] **Step 7: Lancer** `rtk pnpm check`. Attendu : vert. Puis `rtk playwright test e2e/present.spec.ts e2e/code-style.spec.ts`. Attendu : PASS ; `code-style` reste vert en `light`, car ses assertions ne dépendent pas du mode.
- [ ] **Step 8: Commit, push, PR en brouillon**

```bash
rtk git add -A src e2e
rtk git commit -m "🎨 Force le thème sombre et retire la bascule de mode pendant la refonte (F44.3)"
rtk git push
```

Ouvrir la PR en brouillon vers `main` à partir de `.github/pull_request_template.md` (titre « F44 — Refonte UI », `Closes #145` à `Closes #152`, une section par ticket, #145 en cours), puis `.claude/scripts/sonar-check.sh --pr <n> --wait`. Attendu : « Quality gate OK », 0 issue, 0 hotspot.

---

### Task 3: Tokens du design system dans `src/index.css`

**Files:**
- Modify: `src/index.css`, `examples/config.example.json` (bloc `theme.dark`), `package.json` (+ lockfile)
- Test: `src/domain/config/schema.test.ts` (parité, inchangé), `src/domain/config/example.test.ts`, nouveau `e2e/appearance.spec.ts`

**Interfaces:**
- Produces (utilitaires Tailwind) : `bg-/text-/border-space-sessions|space-editor|space-training|space-help` (fond teinté de la tuile : modificateur `/14`, pas de token `*-soft`) ; `to-action-to`, `shadow-action`, `shadow-card`, `shadow-popover` ; `bg-halo-action`, `bg-halo-cool` ; tailles `text-display|h1|h2|h3|score-xl|score-md|body|small|label` ; `font-mono` ; rayons `rounded-sm|md|lg|xl` = 8 / 12 / 18 / 24 px.

- [ ] **Step 1: Test e2e** dans `e2e/appearance.spec.ts`, sur l'accueil (`HomePage.goto()`) :

```ts
test('thème sombre du design system par défaut', async ({ page }) => {
  await new HomePage(page).goto()
  const html = page.locator('html')
  await expect(html).toHaveClass(/\bdark\b/)
  const style = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    return {
      scheme: root.colorScheme,
      background: root.getPropertyValue('--background').trim(),
      radius: root.getPropertyValue('--radius').trim(),
    }
  })
  expect(style).toEqual({ scheme: 'dark', background: 'oklch(0.16 0.02 292)', radius: '1.125rem' })
})
```

Pas d'assertion sur `--font-mono` : Tailwind n'émet une variable de `@theme` que si un utilitaire s'en sert. La police est vérifiée au build (Step 8).

- [ ] **Step 2: Lancer** `rtk playwright test e2e/appearance.spec.ts`. Attendu : FAIL sur `background` (ancienne valeur `oklch(0.145 0 0)`).
- [ ] **Step 3: Bloc `:root`** : les 33 `THEME_TOKENS` avec les valeurs de `project/tokens.json`, références (`{muted}`, `{foreground}`…) résolues en valeurs, `primary` = valeur d'`action-from` (`oklch(0.585 0.235 356)`), `--radius: 1.125rem`, `color-scheme: dark`. Supprimer le bloc `.dark { … }` des tokens : la classe `.dark` reste posée (Task 2) pour les variantes `dark:` et les règles `.dark .cm-editor` / `.dark .shiki span`. Mettre à jour le commentaire de `.cm-editor`, qui parle des blocs `:root` / `.dark`.
- [ ] **Step 4: `@theme inline`** : rayons `--radius-sm: calc(var(--radius) - 10px)`, `--radius-md: calc(var(--radius) - 6px)`, `--radius-lg: var(--radius)`, `--radius-xl: calc(var(--radius) + 6px)`, `--radius-2xl: calc(var(--radius) + 10px)`, `--radius-3xl: calc(var(--radius) + 14px)`, `--radius-4xl: calc(var(--radius) + 18px)` ; dérivés de `--primary` :

```css
--color-action-to: color-mix(in oklch, var(--primary) 55%, oklch(0.45 0.2 280));
--color-halo-action: color-mix(in oklch, var(--primary) 22%, transparent);
--color-halo-cool: color-mix(in oklch, color-mix(in oklch, var(--primary) 55%, oklch(0.45 0.2 280)) 18%, transparent);
--shadow-action: 0 8px 24px -8px color-mix(in oklch, var(--primary) 60%, transparent);
```

Avec la `primary` par défaut, `--color-action-to` donne environ `oklch(0.52 0.22 322)`, l'`action-to` du design system. `color-mix` a le même seuil de navigateurs que Tailwind v4 ; la syntaxe de couleur relative, non. Chaque dérivé écrit son expression en entier, sans passer par un autre token inline : une variable `@theme inline` n'est pas garantie en sortie. Les halos n'ont pas encore d'utilisateur : la partie « halos compris » du critère de #145 se vérifie au premier qui s'en sert (état vide de #147). Le noter dans le corps de la PR.
- [ ] **Step 5: `@theme`** (valeurs fixes, hors config) : `--color-space-sessions: oklch(0.8 0.12 215)`, `--color-space-editor: oklch(0.84 0.14 80)`, `--color-space-training: oklch(0.76 0.16 150)`, `--color-space-help: oklch(0.72 0.12 295)` ; `--shadow-card: inset 0 1px 0 0 #ffffff0d, 0 1px 2px 0 #00000066` ; `--shadow-popover: 0 24px 48px -12px #000000cc` ; `--font-mono: 'Geist Mono Variable', ui-monospace, monospace` ; les neuf tailles de `tokens.json` (`type.groups`), chacune avec `--text-<nom>--line-height`, et `--font-weight` / `--letter-spacing` quand le token en a (ex. `--text-h1: 1.875rem; --text-h1--line-height: 2.25rem; --text-h1--font-weight: 700; --text-h1--letter-spacing: -0.015em`). Dans `@layer base`, `body` passe en `text-body`.
- [ ] **Step 6: Police** : `rtk pnpm add @fontsource-variable/geist-mono`, puis `@import '@fontsource-variable/geist-mono';` après Geist.
- [ ] **Step 7: Config d'exemple** : `theme.dark` reçoit les 33 tokens du `:root` de l'étape 3, avec leurs valeurs (décision de l'utilisateur : remplacer le thème entier). `theme.light` ne bouge pas jusqu'à #152.
- [ ] **Step 8: Lancer** `rtk playwright test e2e/appearance.spec.ts` (PASS), puis `rtk pnpm check` (vert, parité `THEME_TOKENS` comprise) et `rtk pnpm build && rtk pnpm check:precache && rtk pnpm check:budget`. Attendu : vert, et `ls dist/assets | grep -i geist-mono` liste au moins un `.woff2`. Si le budget refuse la police mono, noter la valeur et ajuster le seuil dans le même commit, en citant ce ticket.
- [ ] **Step 9: Commit**

```bash
rtk git add src/index.css examples/config.example.json package.json pnpm-lock.yaml e2e/appearance.spec.ts
rtk git commit -m "🎨 Pose les tokens du design system dans index.css (F44.3)"
```

---

### Task 4: Boutons

**Files:**
- Modify: `src/components/ui/button.tsx`, `src/components/confirm-delete-dialog.tsx:85`, `src/features/session/components/confirm-write-dialog.tsx:74`
- Test: `e2e/appearance.spec.ts`, `e2e/delete-dialog.spec.ts`

**Interfaces:**
- Consumes: `to-action-to`, `shadow-action`, `rounded-md` (Task 3).
- Produces: `Button` pose `data-variant={variant}` à côté de `data-slot="button"` ; nouvelle variante `destructive-solid`.

- [ ] **Step 1: Tests e2e**. Dans `appearance.spec.ts` : (a) `test('le bouton principal porte le dégradé d’action, qui suit theme.dark.primary')`. Créer une session avec une copie de `config.example.json` où `theme.dark.primary = 'oklch(0.7 0.15 150)'` (écriture dans `testInfo.outputPath`, comme `writeConfig` de `code-style.spec.ts`), relever le `backgroundImage` calculé du premier `[data-slot="button"][data-variant="default"]` visible de l'écran examinateur, puis le comparer à celui d'une session créée avec la config d'exemple telle quelle. Attendu : les deux contiennent `linear-gradient` et diffèrent. (b) Dans `delete-dialog.spec.ts` : `test('le bouton « Supprimer » de la modale : texte sombre sur destructive')`, qui vérifie que la `color` calculée du bouton « Supprimer » est égale au `backgroundColor` calculé de `body`.
- [ ] **Step 2: Lancer** `rtk playwright test e2e/appearance.spec.ts e2e/delete-dialog.spec.ts`. Attendu : les deux nouveaux tests échouent.
- [ ] **Step 3: Variantes** dans `buttonVariants`. Base : `rounded-md text-[15px] font-semibold`, focus `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` à la place de `focus-visible:ring-3 focus-visible:ring-ring/50`, et `disabled:opacity-45 disabled:shadow-none`.
  - `default` : `bg-primary bg-linear-135 from-primary to-action-to text-primary-foreground shadow-action hover:brightness-110`. `bg-primary` sert d'aplat de secours.
  - `outline` et `secondary` (même rendu, le Secondaire du design system) : `border-border bg-secondary text-secondary-foreground hover:bg-accent aria-expanded:bg-accent`.
  - `ghost` : `hover:bg-accent hover:text-foreground aria-expanded:bg-accent`.
  - `destructive` (Danger) : `border-destructive bg-transparent text-destructive hover:bg-destructive/10`.
  - `destructive-solid` : `bg-destructive text-background hover:bg-destructive/90`.
  - Tailles : `default` `h-11 gap-2 px-4.5 [&_svg:not([class*='size-'])]:size-4.5`, `sm` `h-9 px-3 text-sm`, `xs` `h-7 rounded-sm px-2 text-xs`, `lg` `h-12 px-5`, `icon` `size-11`, `icon-sm` `size-9`, `icon-xs` `size-7 rounded-sm`, `icon-lg` `size-12`. Les `rounded-[min(…)]` du vendor disparaissent.
- [ ] **Step 4: Confirmations** : `variant="destructive-solid"` sur le bouton de confirmation de `confirm-delete-dialog.tsx` et de `confirm-write-dialog.tsx`. Les déclencheurs (« Supprimer » d'une carte, « Recommencer » de `final-screen.tsx`) restent en `destructive`. Plusieurs écrans garderont plus d'un bouton `default`, donc plusieurs dégradés : ne pas changer leurs variantes ici. Chaque ticket d'écran (#147 à #151) choisit son action principale d'après l'artboard.
- [ ] **Step 5: Lancer** `rtk playwright test e2e/appearance.spec.ts e2e/delete-dialog.spec.ts` (PASS, cas mobile 375 px compris), puis `rtk pnpm check` (vert).
- [ ] **Step 6: Commit**

```bash
rtk git add src/components/ui/button.tsx src/components/confirm-delete-dialog.tsx src/features/session/components/confirm-write-dialog.tsx e2e
rtk git commit -m "💄 Restyle les boutons : dégradé d'action, secondaire, danger (F44.3)"
```

---

### Task 5: Surfaces et champs

**Files:**
- Modify: `src/components/ui/card.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `input.tsx`, `textarea.tsx`, `progress.tsx`, `tabs.tsx`
- Test: `e2e/appearance.spec.ts`

- [ ] **Step 1: Test e2e** `test('surfaces et champs du design system')` : sur l'écran de création de session (`HomePage.createSession()`), le premier `[data-slot="card"]` a `border-radius` = `18px` et un `box-shadow` qui contient `inset` ; le premier `input` visible a `height` = `44px` et `border-radius` = `12px`. Dans la modale de suppression ouverte depuis l'accueil, `[data-slot="alert-dialog-content"]` a `border-radius` = `18px`.
- [ ] **Step 2: Lancer** le test. Attendu : FAIL.
- [ ] **Step 3: Restyler**, en ne changeant que les classes :
  - `Card` : `rounded-lg bg-card shadow-card` à la place de `rounded-xl … ring-1 ring-foreground/10`, `[--card-spacing:--spacing(6)]` (taille `sm` : `--spacing(4)`), coins des images en `rounded-t-lg` / `rounded-b-lg`.
  - `DialogContent`, `AlertDialogContent` : `rounded-lg border border-border bg-popover shadow-popover` ; voile `bg-black/60`. `SheetContent` : `bg-popover shadow-popover`.
  - `DropdownMenuContent`, `TooltipContent` : `bg-popover text-popover-foreground shadow-popover`, `rounded-md` (menu) et `rounded-sm` (infobulle).
  - `Input` : `h-11 rounded-md border-input bg-background px-3.5 text-[15px]`, focus `focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring` ; retirer `dark:bg-input/30`. `Textarea` : mêmes contour, fond, focus et rayon, sans la hauteur.
  - `Progress` : piste `h-2 rounded-full bg-muted`, indicateur `rounded-full bg-primary`.
  - `Tabs` : liste sur `bg-muted`, onglet actif sur `bg-card shadow-card`, `rounded-md`.
- [ ] **Step 4: Lancer** `rtk playwright test e2e/appearance.spec.ts` (PASS), puis `rtk pnpm check` (vert) et la suite e2e complète `rtk playwright test`. Attendu : PASS. Un échec de boîte ou de mise en page (`long-words.spec.ts`, `delete-dialog.spec.ts`) se corrige dans le composant, pas dans le test.
- [ ] **Step 5: Commit**

```bash
rtk git add src/components/ui e2e/appearance.spec.ts
rtk git commit -m "💄 Restyle cartes, dialogues, menus et champs (F44.3)"
```

---

### Task 6: Chevrons des `<details>` et « sauvegarde »

**Files:**
- Modify: `src/index.css` (`@layer base`), `src/lib/i18n/ui-messages.ts` (chaînes FR), `src/domain/backup/messages.ts` (chaînes FR)
- Test: `e2e/appearance.spec.ts` ; tests qui citent les anciens libellés FR (`damaged-session.test.tsx`, `stats-page.test.tsx`, `projection.test.tsx`, `examiner-view.test.tsx`, `damaged-session-card.test.tsx`, `import-controller.test.tsx`, `ui-messages.test.ts`, `e2e/delete-dialog.spec.ts`, et tout autre résultat de `grep -rn "backup" src e2e site/guide` dans une chaîne affichée)

- [ ] **Step 1: Test e2e** `test('chevron dessiné sur les details, sans animation si mouvement réduit')` : sur l'écran examinateur (fixture `examiner`, tirer « Facile »), le `summary` de « Éléments de réponse » a `list-style-type` = `none`, et son `::before` a un `mask-image` différent de `none` ; après un clic, `transform` du `::before` différent de `none`. Avec `page.emulateMedia({ reducedMotion: 'reduce' })`, `transition-duration` du `::before` = `0s`.
- [ ] **Step 2: Lancer** le test. Attendu : FAIL.
- [ ] **Step 3: CSS** dans `@layer base` : `summary { list-style: none; display: flex; align-items: center; gap: 0.375rem }` ; `summary::-webkit-details-marker { display: none }` ; `summary::before` : carré de 1rem, `background-color: currentColor`, `mask` du SVG Tabler `chevron-right` en data URI (`<path d="M9 6l6 6l-6 6"/>`, `stroke-width="2"`, `fill="none"`, `stroke="black"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `viewBox="0 0 24 24"`), `transition: transform 150ms ease-out` ; `details[open] > summary::before { transform: rotate(90deg) }` ; sous `prefers-reduced-motion: reduce`, `transition: none`. `damaged-session.tsx` centre son `summary` : y ajouter `justify-center`.
- [ ] **Step 4: Libellés** : remplacer « backup » par « sauvegarde » dans toutes les chaînes FR affichées, en accordant (« une sauvegarde », « la sauvegarde ») : `home_import` → « Importer une sauvegarde », `action_export` → « Exporter une sauvegarde », `delete_export_first` → « Exporter une sauvegarde d'abord », `import_drop_hint` → « Déposez la sauvegarde ici », `empty_body`, `persistence_warning`, `damaged_body`, les références à « Exporter un backup » dans les autres textes, et les messages FR de `domain/backup/messages.ts` (« Ce fichier n'est pas une sauvegarde Questionator. »). Les chaînes EN, les identifiants et les commentaires ne changent pas. Adapter les tests qui citent ces textes.
- [ ] **Step 5: Lancer** `rtk pnpm check` puis `rtk playwright test`. Attendu : vert, et `grep -rn "backup" src/lib/i18n/ui-messages.ts src/domain/backup/messages.ts` ne renvoie plus que des lignes EN ou des identifiants.
- [ ] **Step 6: Commit**

```bash
rtk git add src e2e
rtk git commit -m "💄 Dessine les chevrons des details et dit « sauvegarde » en français (F44.3)"
```

---

### Task 7: Mémoire, Sonar, validation locale

**Files:**
- Modify: `docs/CONVENTIONS.md`, `docs/DECISIONS.md`, `docs/INDEX.md`, `docs/HANDOFF.md`, et selon le cas `docs/QUIRKS.md`, `docs/BACKLOG.md` ; corps de la PR ; commentaire sur #152

- [ ] **Step 1: CONVENTIONS** : nouvelle section « Tokens et palette — règles » : les deux registres de couleur, les couleurs d'espace (`@theme`, hors config), les tokens dérivés de `--primary` (`@theme inline`), un seul bouton `default` par écran, `destructive-solid` réservé aux confirmations, « tout dérive des tokens ». Dans « Vue de session thémée », réécrire les règles sur `color-scheme` et sur la bascule (`forcedMode="dark"` jusqu'à #152, plus de `ColorModeToggle` dans l'en-tête).
- [ ] **Step 2: DECISIONS** : D104, au format de D103 : danger plein en texte `background` (contraste) ; mode forcé par prop plutôt que par suppression de la mécanique ; `action-to` dérivé par `color-mix` (seuil de navigateurs) ; `theme.dark` de l'exemple remplacé en entier ; chevrons et libellés rattachés à #145, bandeaux à #146.
- [ ] **Step 3: Commentaire sur #152** : à rétablir dans ce ticket, `e2e/color-mode.spec.ts` (supprimé au commit de la Task 2, citer son hash), la bascule dans le menu, la prop `forcedMode` à retirer et les cas clairs de `routes.test.tsx`.
- [ ] **Step 4: INDEX et HANDOFF** : statut de F44 « #145 fait, en attente de validation » ; entrée HANDOFF avec ses quatre marqueurs.
- [ ] **Step 5: Vérification** : `rtk pnpm check`, `rtk playwright test`, `rtk git push`, puis `.claude/scripts/sonar-check.sh --pr <n> --wait`. Attendu : vert partout, « Quality gate OK », 0 issue, 0 hotspot.
- [ ] **Step 6: Commit**

```bash
rtk git add docs
rtk git commit -m "📝 Trace les tokens et le mode forcé de F44.3"
rtk git push
```

- [ ] **Step 7: Validation par l'utilisateur** : `pnpm dev`, parcours accueil → création → session → projection → stats → éditeur → entraînement, en comparant au canevas. #145 n'est terminé qu'après son accord ; la PR reste en brouillon.
