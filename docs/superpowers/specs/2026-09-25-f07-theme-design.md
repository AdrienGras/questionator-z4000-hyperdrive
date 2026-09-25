# F07 — Thème et langue — Design

- **Date** : 2026-09-25
- **Ticket** : [#7](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/7)
- **Branche** : `feat/f07-theme`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

La config porte l'identité visuelle de l'épreuve : tokens shadcn clair/sombre, mode par défaut, couleur et icône par catégorie. Elle porte aussi sa langue. F07 les applique aux vues de session. Aucune vue de session n'existe encore : `#/session/$sessionId` affiche la page provisoire de F05, et la vue projetée relève de F14. F07 livre donc l'infrastructure et deux écrans provisoires qui l'hébergent. F09 et F14 n'auront qu'à remplacer leur contenu.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §6.2 (`theme`, `presentation.defaultColorMode`, `locale`, `categories[].color|icon`), F07, F14 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D15, D26, D37, D51, D59.

## Objectif

Les vues de session prennent le thème, le mode et la langue de la config. Chaque fenêtre peut changer de mode, et son choix est mémorisé par session et par vue. L'accueil et la création suivent le mode système, gardent une bascule, et conservent le thème shadcn par défaut.

## Écart avec le ticket (D60)

- « Sur les deux vues » s'entend au sens des deux **écrans provisoires** créés ici : le layout examinateur `#/session/$sessionId` et la vue projetée `#/present/$sessionId`. F09 et F14 remplacent leur contenu sans toucher à l'apparence.
- Hors session, le ticket prévoyait une « clé globale » sans dire où la bascule vivait. Elle est placée dans l'en-tête de l'accueil et de la création, et le défaut est `system`.

## Architecture (approche « provider unique + portées »)

Un seul composant écrit sur `<html>` : `AppearanceProvider`. Les écrans déclarent une **portée**. La dernière déclarée s'applique, et son retrait ramène à la portée globale. Pour la langue, `LocaleProvider` suit le même principe.

On écarte deux alternatives. Un hook `useColorMode` appelé par chaque écran est fragile, car les effets des enfants s'exécutent avant ceux des parents : deux écrans imbriqués se marcheraient dessus. Des layouts sans chemin (`_global/`, `_session/`) imposeraient de déplacer les routes, et le problème d'imbrication reviendrait avec `stats` (F15).

### Modules (D59)

| Fichier | Rôle |
|---|---|
| `src/lib/appearance/color-mode.ts` | `ColorMode`, `resolveColorMode`, `colorModeKey`, `readStoredMode`, `writeStoredMode` (fonctions pures ou gardées par try/catch) |
| `src/lib/appearance/appearance-context.ts` | Contexte, `AppearanceScope`, `GLOBAL_SCOPE`, `useAppearanceScope(scope)`, `useColorModeControl()` |
| `src/app/appearance-provider.tsx` | `AppearanceProvider` : portée active, mode, application sur `<html>` |
| `src/lib/i18n/locale-context.tsx` | `LocaleProvider`, `useLocale()`, `resolveSessionLocale` |
| `src/lib/i18n/use-ui.ts` | Lit `useLocale()` au lieu de détecter la langue |
| `src/components/session-appearance.tsx` | `<SessionAppearance sessionId view config>` : portée de session et locale de session |
| `src/components/color-mode-toggle.tsx` | Bascule clair / sombre / système |
| `src/components/category-icon.tsx` | Icône Tabler chargée à la demande |
| `src/features/session/session-page.tsx` (+ `components/`) | Layout examinateur provisoire |
| `src/features/present/present-page.tsx` (+ `hooks/use-presented-config.ts`) | Vue projetée provisoire |
| `src/routes/present.$sessionId.tsx` | Route mince |
| `src/routes/session.$sessionId.tsx` | Route mince, qui rend maintenant `SessionPage` |
| `src/routes/__root.tsx` | Monte `LocaleProvider` et `AppearanceProvider` |
| `src/components/coming-soon.tsx` | Supprimé (plus d'utilisateur) ; ses chaînes sont réutilisées |
| `index.html` | `<meta name="color-scheme" content="light dark">` |

`lib/` n'importe pas `domain/` : `lib/appearance` manipule des tokens génériques (`Readonly<Record<string, string | undefined>>`), et `resolveSessionLocale` reçoit un `Locale | undefined`. La conversion depuis `NormalizedConfig` se fait dans `components/session-appearance.tsx`.

## Mode et thème

### `lib/appearance/color-mode.ts`

```ts
export type ColorMode = 'light' | 'dark' | 'system'
export type EffectiveMode = 'light' | 'dark'

export function resolveColorMode(stored: ColorMode | undefined, fallback: ColorMode, systemPrefersDark: boolean): EffectiveMode
export function colorModeKey(scope: { sessionId: string; view: 'examiner' | 'present' } | 'global'): string
export function readStoredMode(key: string): ColorMode | undefined   // undefined si absent, invalide ou stockage inaccessible
export function writeStoredMode(key: string, mode: ColorMode): void  // ignore silencieusement un stockage inaccessible
```

- Priorité : choix mémorisé, puis `fallback` de la portée. Si le mode retenu vaut `system`, c'est `systemPrefersDark` qui tranche.
- Clés : `questionator:color-mode:global` et `questionator:color-mode:<sessionId>:<examiner|present>`.
- Une valeur mémorisée qui n'est ni `light`, ni `dark`, ni `system` est ignorée.
- Si le stockage est inaccessible (navigation privée, stockage bloqué, exception), on retombe sur le défaut sans erreur, et le choix ne vaut que pour la fenêtre (état React).

### `lib/appearance/appearance-context.ts`

```ts
export type ThemeTokens = Readonly<Record<string, string | undefined>>
export type AppearanceScope = {
  key: string
  defaultMode: ColorMode
  theme?: { light: ThemeTokens; dark: ThemeTokens }
}
export const GLOBAL_SCOPE: AppearanceScope // { key: colorModeKey('global'), defaultMode: 'system' }

export function useAppearanceScope(scope: AppearanceScope): void // déclare au montage, retire au démontage
export function useColorModeControl(): { mode: ColorMode; effective: EffectiveMode; setMode: (mode: ColorMode) => void }
```

- `useAppearanceScope` compare la portée par valeur (clé, défaut, tokens) pour ne pas redéclarer à chaque rendu.
- Hors provider, `useColorModeControl` lève une erreur explicite : c'est une erreur de montage, pas un cas à gérer.

### `app/appearance-provider.tsx`

- Il garde la portée active : `GLOBAL_SCOPE`, ou la portée déclarée. Il lit le mode mémorisé sous la clé de cette portée et le relit quand la portée change.
- Il suit `matchMedia('(prefers-color-scheme: dark)')`, avec un écouteur `change` retiré au démontage.
- Dans un `useLayoutEffect`, donc avant l'affichage :
  1. `document.documentElement.classList.toggle('dark', effective === 'dark')` ;
  2. il retire chaque propriété qu'il a lui-même posée au passage précédent (il garde la liste des noms), puis
  3. pose `style.setProperty('--' + token, value)` pour chaque token défini du mode effectif. Jamais de texte CSS ni de `<style>` (D15).
- `setMode(mode)` met à jour l'état et appelle `writeStoredMode(scope.key, mode)`.
- Au démontage du provider (tests), il retire la classe `.dark` et toutes les propriétés posées.

### `components/session-appearance.tsx`

```tsx
<SessionAppearance sessionId={id} view="examiner" config={session.config}>
  {children}
</SessionAppearance>
```

- Il déclare la portée `{ key: colorModeKey({ sessionId, view }), defaultMode: config.presentation.defaultColorMode, theme: config.theme }`.
- Il enveloppe ses enfants dans `<LocaleProvider locale={resolveSessionLocale(config.locale)}>`.

### `components/color-mode-toggle.tsx`

- Un menu déroulant (`dropdown-menu` shadcn, déjà vendu) avec les options Clair, Sombre et Système. La case cochée indique l'option choisie.
- Le bouton déclencheur est une icône Tabler du mode effectif (`IconSun`, `IconMoon`) avec un `aria-label` traduit (« Mode d'affichage : sombre »).
- Il est placé dans l'en-tête de l'accueil (`home-header`), de la création, du layout examinateur et de la vue projetée.

## Langue

### `lib/i18n/locale-context.tsx`

```ts
export function LocaleProvider(props: { locale: Locale; children: ReactNode }): JSX.Element
export function useLocale(): Locale                  // hors provider : detectBrowserLocale(readNavigatorLanguages())
export function resolveSessionLocale(configLocale: Locale | undefined, languages?: readonly string[]): Locale
```

- `resolveSessionLocale` renvoie `configLocale`, sinon `detectBrowserLocale(languages)`, qui retombe lui-même sur `fr`.
- `LocaleProvider` pose `document.documentElement.lang` dans un `useLayoutEffect`, puis rétablit la valeur précédente au démontage.
- La racine monte `<LocaleProvider locale={browserLocale}>`, et `SessionAppearance` le surcharge.
- `useUi()` lit `useLocale()`. Son API ne change pas, ni pour les écrans existants ni pour leurs tests.

### Dictionnaire

Nouvelles clés dans `UI_MESSAGES`, en fr et en en :
- libellés de la bascule (déclencheur, trois options) ;
- chargement de session, « Session introuvable » ;
- corps provisoire de l'examinateur (bouton désactivé « Bientôt disponible ») ;
- écran d'attente de la vue projetée.

Les clés `coming_soon_*` sont réutilisées. Le typage `Dictionary<UiMessageParams>` refuse une clé manquante, et le test de parité existant la vérifie aussi.

## Écrans provisoires

### Layout examinateur — `#/session/$sessionId`

- `routes/session.$sessionId.tsx` rend `SessionPage`. `SessionPage` lit `sessionId` via `getRouteApi('/session/$sessionId')`, puis appelle `useSession(sessionId)`.
- Selon l'état :
  - `undefined` : « Chargement… » ;
  - `null` : « Session introuvable », avec un lien vers l'accueil ;
  - base `outdated` ou `unavailable` : `DbStatusBanner`.
- Quand la session est trouvée, le contenu est enveloppé dans `SessionAppearance view="examiner"` :
  - en-tête : titre de l'épreuve (`config.exam.title`), nom de la session, lien vers l'accueil, `ColorModeToggle` ;
  - corps provisoire : la liste des catégories dans l'ordre (`CategoryIcon`, libellé, bordure `--category-color`) et un `Button` principal désactivé « Bientôt disponible », qui rend visible une surcharge de `primary`.

### Vue projetée — `#/present/$sessionId`

- `routes/present.$sessionId.tsx` rend `PresentPage`.
- **Étanchéité (F14)** : `usePresentedConfig(sessionId)` renvoie `NormalizedConfig | null | undefined`, jamais la `Session`, et les composants de la vue ne reçoivent que la config. F14 remplacera ce hook par `toProjectedView`.
- Le contenu est enveloppé dans `SessionAppearance view="present"`. L'écran d'attente affiche le titre de l'épreuve et le message d'attente, avec `ColorModeToggle` dans un coin.
- Les états de chargement et « introuvable » sont les mêmes que pour l'examinateur.
- Aucun lien n'y mène encore : c'est le bouton de F14 qui l'ouvrira.

## Icônes et couleur de catégorie

### `components/category-icon.tsx`

```tsx
<CategoryIcon name="brand-php" className="size-5" />
```

- Il charge `import('@tabler/icons-react')` une seule fois, avec une promesse mise en cache au niveau du module.
- `iconComponentName('brand-php')` renvoie `'IconBrandPhp'`. Chaque segment est capitalisé, chiffres compris (`a-b-2` → `IconAB2`).
- Il ne rend rien pendant le chargement, si le nom est inconnu ou si le chunk échoue. Une icône n'est jamais bloquante.
- `aria-hidden`, car le libellé de la catégorie est toujours affiché à côté.

### Couleur

- Elle passe par `style={{ '--category-color': category.color }}` sur l'élément de la catégorie. React applique une propriété personnalisée via `style.setProperty`, ce qui respecte D15 : c'est la forme autorisée côté JSX, à noter dans CONVENTIONS.
- Elle sert d'accent seulement, `border-[var(--category-color)]` et `text-[var(--category-color)]` sur l'icône, jamais en fond sous du texte (D26). Sans couleur, on garde la bordure `border`.

### Chunk

`pnpm build` doit produire un chunk Tabler séparé, absent du bundle initial, et son poids réel est consigné dans la PR. Les icônes de l'UI, importées par nom, restent dans le bundle principal.

## Tests (Vitest)

- **`color-mode`** :
  - priorité choix, puis défaut, puis système, pour chaque combinaison ;
  - valeur mémorisée invalide ignorée ;
  - clé distincte par session et par vue, plus la clé globale ;
  - `readStoredMode` et `writeStoredMode` ne lèvent pas quand `localStorage` lève.
- **`locale-context`** :
  - `resolveSessionLocale` : config, puis navigateur, puis `fr` ;
  - `LocaleProvider` pose `lang` et le rétablit au démontage.
- **`appearance-provider`** (jsdom, `matchMedia` simulé) :
  - `.dark` suit le mode effectif ;
  - en `system`, `.dark` réagit à l'événement `change` ;
  - `setMode` écrit sous la clé de la portée active.
- **`session-appearance`** :
  - `--primary` est posé avec la valeur `light`, puis `dark` après la bascule ;
  - au démontage, aucun `--*` ne reste sur `<html>` et le mode global revient ;
  - `lang="en"` pour une config `locale: 'en'`, avec les chaînes en anglais.
- **`color-mode-toggle`** : changer le mode dans la portée `present` ne modifie pas la valeur mémorisée de `examiner`.
- **`category-icon`** (module Tabler simulé) : un nom connu est rendu, un nom inconnu ne rend rien ; conversion du nom.
- **Routes** (`renderAt`) :
  - `#/session/<id>` affiche le titre de l'épreuve et les catégories ;
  - `#/session/inconnu` affiche « Session introuvable » ;
  - `#/present/<id>` affiche l'écran d'attente ;
  - après `#/session/<id>` puis `#/`, aucun token ne reste sur `<html>`.
- `src/testing/setup.ts` fournit un `matchMedia` simulé (absent de jsdom) et vide `localStorage` entre les tests.

## Vérification manuelle (à consigner dans la PR)

Dans Chromium, sur `vite preview` :
- une config qui surcharge `primary` en clair et en sombre : les boutons principaux changent sur les deux vues ;
- la vue projetée ouverte dans une seconde fenêtre et passée en sombre, fermée puis rouverte, revient en sombre pendant que la vue examinateur reste en clair ;
- retour à l'accueil : thème par défaut ;
- une config `locale: 'en'` donne des vues en anglais, avec `lang="en"` ;
- poids du chunk Tabler relevé.

## Critères d'acceptation

- [ ] Une surcharge de `primary` change les boutons principaux sur les deux vues provisoires.
- [ ] Toutes les chaînes de l'interface existent dans les deux langues (typage et test de parité).
- [ ] Le mode choisi à la main dans la vue projetée survit à sa fermeture et à sa réouverture, sans changer la vue examinateur.
- [ ] L'accueil garde le thème shadcn par défaut après l'ouverture d'une session thémée.
- [ ] Le chunk d'icônes Tabler est absent du bundle initial, et son poids est consigné dans la PR.
- [ ] `pnpm check` (`pnpm deps` compris) et `pnpm build` passent sans avertissement ; SonarQube affiche quality gate OK, 0 issue, 0 hotspot.

## Hors périmètre

- La grille des catégories et le passage (F09) ; le contenu réel de la vue projetée, le bouton qui l'ouvre, le plein écran et `toProjectedView` (F14).
- Le pré-cache du chunk d'icônes (F17).
- La synchronisation du mode entre deux fenêtres de la même vue.
- Un sélecteur de langue.
