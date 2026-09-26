# F08 — Rendu markdown — Design

- **Date** : 2026-09-26
- **Ticket** : [#8](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/8)
- **Branche** : `feat/f08-markdown`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Les énoncés (`prompt`) et les éléments de réponse (`answer`) de la config sont en markdown, souvent avec du code. La vue examinateur (F09) affiche les deux, la vue projetée (F14) l'énoncé seul. Aucune de ces deux vues n'affiche encore de question : les écrans de F07 sont provisoires.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) F08 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D27, D37, D59, D60, D62.

## Objectif

Un composant `<Markdown source size>` sûr, où aucun HTML n'est interprété. Il colore le code sans WASM, change de thème clair ou sombre par CSS seul et reste lisible sur un vidéoprojecteur. F09 et F14 n'ont qu'à l'importer.

## Écart avec le ticket (D62)

- **Composant seul.** F08 ne branche `<Markdown>` dans aucun écran et ne crée ni aperçu ni page de démo. Le critère « coloré dans les deux vues » est vérifié par F09 (vue examinateur) et F14 (vue projetée), qui montent le composant.
- **« Hors ligne »** relève de F17 (pré-cache), comme le prévoyait déjà le ticket.
- **Emplacement** : le ticket place le code dans `src/markdown/`, mais il est antérieur à D59. Le composant va dans `src/components/markdown/`, car il est partagé par deux features, et le highlighter dans `src/lib/markdown/`, car c'est un wrapper technique.
- **Taille de projection** : `prose-2xl` est une valeur **provisoire**, à caler sur un vrai écran en F14.

## Architecture

```
src/lib/markdown/highlighter.ts        résolution des langages, fabrique du loader, tokenisation (sans React)
src/components/markdown/code-block.tsx <CodeBlock lang code> : texte brut, puis tokens colorés
src/components/markdown/markdown.tsx   <Markdown source size> : react-markdown + remark-gfm
src/index.css                          règles .shiki (double thème) + @plugin '@tailwindcss/typography'
```

Nouvelles dépendances : `react-markdown`, `remark-gfm`, `shiki` (utilisé via `shiki/core`, le moteur JavaScript et les langages importés un par un), `@tailwindcss/typography`.

Approche retenue : `react-markdown` **synchrone** et `<CodeBlock>` qui rend les tokens de `codeToTokens` en `<span>` React. Deux approches ont été écartées :
- `@shikijs/rehype` dans `MarkdownHooks` : tout le markdown attend Shiki, et chaque changement de source relance toute la chaîne.
- `codeToHtml` injecté par `dangerouslySetInnerHTML` : cela introduit une injection HTML dans un composant dont le rôle est de n'en faire aucune, et SonarQube la signale en hotspot.

### `src/lib/markdown/highlighter.ts`

```ts
export type SupportedLanguage = 'php' | 'sql' | 'html' | 'javascript' | 'json' | 'bash'
export function resolveLanguage(lang: string | undefined): SupportedLanguage | null
// alias : js → javascript, sh / shell → bash ; insensible à la casse ; inconnu ou absent → null

export type CssVariables = Readonly<Record<`--${string}`, string>>
export type HighlightedToken = Readonly<{ offset: number; content: string; style: CssVariables }>
export type HighlightedLine = Readonly<{ offset: number; tokens: readonly HighlightedToken[] }>
export type HighlightedCode = Readonly<{ lines: readonly HighlightedLine[]; rootStyle: CssVariables }>
export type Highlight = (code: string, lang: SupportedLanguage) => Promise<HighlightedCode | null>

export function createHighlightLoader(
  loadCore: () => Promise<HighlighterLike>,
  languages: Readonly<Record<SupportedLanguage, () => LanguageInput>>,
): Highlight // `offset` sert de clé React stable
export const highlight: Highlight // instance réelle, imports dynamiques
```

- `createHighlightLoader` suit le modèle de `createIconLoader` (D37). Le highlighter (`createHighlighterCore` + `createJavaScriptRegexEngine()`, thèmes `github-light` et `github-dark`) est mis en cache dans une fermeture. Il est créé paresseusement au premier bloc coloré, puis chaque langage est chargé une seule fois, par `loadLanguage`, la première fois qu'il est demandé.
- En cas d'échec, que ce soit le chunk Shiki, un langage ou la tokenisation, `null` est renvoyé et le cache fautif est vidé, pour qu'un montage ultérieur réessaie.
- Tokenisation : `codeToTokens(code, { lang, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false })`. Avec `defaultColor: false`, chaque token porte seulement les variables `--shiki-light` et `--shiki-dark`, sans couleur fixe, et le fond suit le même principe (`--shiki-light-bg` / `--shiki-dark-bg` via `rootStyle`). La fonction ne renvoie que ce dont le rendu a besoin (`content`, `style`), et non les objets Shiki.
- Aucun `import` statique de `shiki` : tout passe par `import()`, pour que Shiki forme ses propres chunks (un pour le noyau, un par langage et par thème) chargés au premier bloc de code.

### `<CodeBlock lang code>`

| Cas | Rendu |
|---|---|
| Pas de langage, ou langage inconnu | `<pre><code>` en texte brut ; Shiki n'est pas chargé |
| Langage connu, pendant le chargement | texte brut, remplacé par les tokens une fois prêts |
| Échec (`highlight` renvoie `null`) | le bloc reste en texte brut, sans message ; nouvel essai au montage suivant |
| `code` ou `lang` qui change | nouvelle tokenisation ; un drapeau `active` ignore une réponse périmée |

- Coloré : `<pre className="shiki" style={rootStyle}><code>`, une ligne par `<span className="line">` et un `<span style={token.style}>` par token. Le rendu passe par React uniquement, sans `dangerouslySetInnerHTML`.
- `highlight` est injectable en prop optionnelle (défaut : l'instance réelle), pour tester l'échec et la course sans `vi.mock`.

### `<Markdown source size>`

```tsx
export function Markdown(props: Readonly<{ source: string; ui: Ui; size?: 'default' | 'projection'; className?: string }>): JSX.Element
// `ui` : libellés traduits des notes GFM (footnoteLabel, footnoteBackLabel), convention « Composant d'écran traduit »
```

- `react-markdown` avec `remarkPlugins={[remarkGfm]}`, **sans `rehype-raw`** : le HTML brut est affiché comme du texte. L'`urlTransform` par défaut est conservé, ce qui neutralise les URL `javascript:`.
- Composants surchargés :
  - `a` : `target="_blank"` et `rel="noopener noreferrer"`, sauf pour les ancres internes (`#…`, notes GFM comprises) ;
  - `img` : `loading="lazy"`, `alt` conservé ;
  - `pre` et `code` : un bloc (un `code` dans un `pre`, identifié par `language-xxx`) va vers `<CodeBlock>`, qui prend le texte sans le `\n` final. Le code inline reste un `<code>` stylé par `prose`, sans coloration.
- Taille :
  - `default` : `prose dark:prose-invert max-w-none` ;
  - `projection` : les mêmes classes avec `prose-2xl`, valeur provisoire à caler en F14.
- Les couleurs de `prose` sont branchées sur les tokens shadcn (`--tw-prose-body` → `var(--foreground)`…) dans `index.css`, pour que le thème de la config (F07) s'applique au texte markdown.

### Double thème (CSS)

```css
.shiki { background-color: var(--shiki-light-bg); }
.shiki span { color: var(--shiki-light); }
.dark .shiki { background-color: var(--shiki-dark-bg); }
.dark .shiki span { color: var(--shiki-dark); }
```

Il n'y a pas de `!important`, puisque les tokens ne portent aucune couleur fixe. Quand `AppearanceProvider` bascule `.dark`, seul le CSS change et React ne refait aucun rendu.

## Poids du bundle

- `autoCodeSplitting` (TanStack) place `react-markdown` et `remark-gfm` dans les chunks des routes qui importent le composant, donc de session à partir de F09. L'accueil ne les charge pas.
- Shiki n'est jamais importé statiquement, et aucun `.wasm` n'est produit.
- `pnpm build` : aucun avertissement de taille.

## Tests (Vitest)

- `highlighter.test.ts` :
  - alias et casse : `js`, `JS`, `sh` et `shell` sont résolus, `cobol`, `''` et `undefined` donnent `null` ;
  - fabrique, avec un import injecté (`vi.fn`) : cache partagé entre deux appels, nouvel essai après un échec. Pas de `vi.resetModules`, qui masque le bug d'un nouvel essai (QUIRKS) ;
  - tokenisation réelle d'un extrait `php` avec l'instance réelle : plusieurs tokens, chacun avec `--shiki-light` et `--shiki-dark`, et `rootStyle` avec les deux fonds.
- `code-block.test.tsx` :
  - un bloc `php` passe du texte brut aux spans colorés ;
  - un langage inconnu reste brut et `highlight` n'est pas appelé ;
  - un `highlight` qui renvoie `null` laisse le texte brut ;
  - quand `code` change, le nouveau contenu est retokenisé ;
  - une réponse périmée (ancienne promesse résolue après la nouvelle) est ignorée.
- `markdown.test.tsx` :
  - `<script>alert(1)</script>` s'affiche comme texte, et il n'y a aucun élément `script` dans le DOM ;
  - un lien `javascript:` n'a pas de `href` exécutable ;
  - GFM : un tableau, une liste de tâches et un texte barré sont rendus ;
  - lien : `target` et `rel` présents ; image : `loading="lazy"` et `alt` ;
  - un bloc `php` est délégué à `CodeBlock`, le code inline non ;
  - `size="projection"` applique `prose-2xl`, et `default` ne l'applique pas.
- Test CSS sur `index.css?raw` (mécanisme existant) : les règles `.shiki` claire et `.dark` sont présentes.

## Vérification au build (à consigner dans la PR)

- `find dist -name '*.wasm'` ne renvoie rien.
- Les chunks Shiki existent et ne sont pas référencés par le chunk d'entrée.
- `pnpm build` n'affiche aucun avertissement.

## Critères d'acceptation

- [ ] Une balise `<script>` dans le markdown est affichée comme du texte, sans être exécutée.
- [ ] Un bloc ```` ```php ```` est coloré par `<Markdown>` (test) ; la coloration dans les deux vues est vérifiée en F09 et F14, et le hors-ligne en F17 (D62).
- [ ] Aucun fichier `.wasm` dans le build.
- [ ] Le passage clair / sombre change la coloration par CSS seul : les tokens portent les deux variables, et les règles `.dark .shiki` existent.
- [ ] Un langage inconnu ou un chargement en échec laisse le code lisible en texte brut, sans erreur.

## Hors périmètre

- Mise en page des vues et branchement du composant (F09, F14), pré-cache hors ligne (F17).
- Numéros de ligne, bouton « copier », surlignage de lignes.
- Langages au-delà des six de D27.
