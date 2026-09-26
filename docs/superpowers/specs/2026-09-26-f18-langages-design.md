# F18 — Coloration de tous les langages — Design

- **Date** : 2026-09-26
- **Ticket** : à créer (F18)
- **Branche** : à créer à l'implémentation (`feat/f18-langages`)
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

F08 (#8) colore les blocs de code avec Shiki, mais D27 limite la coloration à six langages : PHP, SQL, HTML, JavaScript, JSON et bash. Un auteur de config qui écrit ```` ```python ````, ```` ```yaml ```` ou ```` ```dockerfile ```` obtient du texte brut, sans aucun signal. F18 ouvre la coloration à tout le catalogue Shiki, chargé à la demande, en gardant le hors-ligne de D27.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) F08, F17, F18 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D27, D37, D62, D63 · spec F08 `docs/superpowers/specs/2026-09-26-f08-markdown-design.md`.

## Objectif

Tout bloc dont le langage est connu de Shiki est coloré, y compris hors ligne. Seule sa grammaire est téléchargée. Un langage inconnu s'affiche en texte brut, sans erreur, et la création de session le signale par un avertissement non bloquant.

## Mesures (shiki 4.4.3, 2026-09-26)

- Catalogue `shiki/langs` :
  - `bundledLanguages` : 346 clés, identifiants et alias réunis ;
  - `bundledLanguagesInfo` : 242 langages (`id`, `name`) ;
  - `bundledLanguagesAlias` : 104 alias.
  - Le module du catalogue pèse ~26 kB, et ses grammaires sont des `import()`.
- Grammaires : ~9 Mo non compressés, **~1,3 Mo en gzip**, en ~360 fichiers. Les plus grosses sont `emacs-lisp` (776 kB), `cpp` (524 kB) et `cpp-macro` (300 kB), toutes sous la limite par défaut de Workbox (2 Mo).
- Moteur JavaScript : les 346 entrées se chargent et tokenisent un extrait sans erreur (sondage `createJavaScriptRegexEngine()`, sans `forgiving`). Il n'y a donc pas de liste d'incompatibles à maintenir, et le repli en texte brut suffit comme filet.
- `text`, `txt`, `plain` et `plaintext` ne sont pas dans le catalogue : Shiki les traite comme du texte brut.

## Décisions (D63)

- **Catalogue unique** : celui de `shiki/langs`, lu par le highlighter et par le validateur de config. Pas de liste statique générée, ni d'`import.meta.glob`.
- **Hors-ligne** : F17 pré-cache toutes les grammaires (« tous les assets émis »), pour ~1,3 Mo téléchargés une fois et ~9 Mo en cache. Il n'y a ni préchargement selon la config, ni cache runtime. Une session restaurée d'une sauvegarde sur une autre machine, hors ligne, garde donc sa coloration.
- **Config** : un langage inconnu donne un avertissement (`configWarning`), jamais une erreur. Les pseudo-langages (`text`…) n'en donnent pas.

## Architecture

```
src/domain/config/code-languages.ts   catalogue des langages (identifiants + alias) et reconnaissance, fonction pure
src/domain/config/code-fences.ts      extraction des langages des blocs d'un texte markdown, ligne par ligne
src/domain/config/rules.ts            + règle unknown_code_language (configWarning)
src/domain/config/issues.ts           + code unknown_code_language
src/domain/config/messages.ts         + message fr / en
src/lib/markdown/highlighter.ts       résolution asynchrone sur le catalogue ; fin de la liste fermée
src/components/markdown/code-block.tsx  tout bloc avec langage appelle highlight
.dependency-cruiser.cjs               exception domain-no-ui-packages pour code-languages.ts (comme icon-names.ts, D37)
```

### `domain/config/code-languages.ts`

```ts
export const PLAIN_LANGUAGES: ReadonlySet<string> // 'text', 'txt', 'plain', 'plaintext'
export function normalizeLanguage(info: string): string // premier mot de l'info string, en minuscules
export function isKnownLanguage(language: string): boolean // identifiant ou alias du catalogue
export function isPlainLanguage(language: string): boolean
```

- Ce module lit les clés de `bundledLanguages` (ou `bundledLanguagesInfo` et `bundledLanguagesAlias`) de `shiki/langs`. L'import de ce module n'amène que des références `import()` vers les grammaires, pas leur contenu.
- Il faut une exception dans la règle `domain-no-ui-packages` de `.dependency-cruiser.cjs`, écrite dans la règle avec sa raison, sur le modèle de `icon-names.ts`.
- La même reconnaissance sert au validateur et au highlighter : un langage que le validateur accepte est toujours un langage que le rendu sait colorer, et réciproquement.

### `domain/config/code-fences.ts`

```ts
export function fenceLanguages(markdown: string): readonly string[] // langages normalisés, dans l'ordre, doublons compris
```

- On parcourt le texte ligne par ligne. Une ligne ouvre un bloc si elle commence (après au plus 3 espaces) par au moins 3 ```` ` ```` ou 3 `~`, suivis d'une info string. Elle le ferme si elle reprend le même marqueur, d'une longueur au moins égale.
- Le langage est le premier mot de l'info string (```` ```php title=x ```` donne `php`), en minuscules. Un bloc sans info string n'a pas de langage.
- Les lignes intérieures d'un bloc ne sont jamais lues comme des ouvertures.
- Pas de regex à risque super-linéaire (QUIRKS SonarQube) : on découpe la ligne à la main, ou avec une regex ancrée sans quantificateur imbriqué.
- C'est une heuristique : elle ne sert qu'à produire un avertissement. Le rendu, lui, repose sur l'arbre de react-markdown.

### Règle `unknown_code_language`

- Paramètres : `{ language: string; questionId: string }`.
- Chemin : `['categories', c, 'questions', q, 'prompt' | 'answer']`.
- Une seule issue par couple (question, langage), à la première occurrence, même si le langage apparaît dans l'énoncé et dans la réponse.
- Pas d'issue pour un langage connu, un alias, un pseudo-langage ou un bloc sans langage.
- Messages :
  - fr : « Le langage « {language} » d'un bloc de code de la question {questionId} n'est pas reconnu : il s'affichera en texte brut. »
  - en : « The language “{language}” of a code block in question {questionId} is not recognized: it will be shown as plain text. »

### Highlighter (`lib/markdown/highlighter.ts`)

```ts
export type Highlight = (code: string, lang: string) => Promise<HighlightedCode | null>
export function createHighlightLoader(
  loadCore: () => Promise<HighlighterLike>,
  loadCatalog: () => Promise<Readonly<Record<string, () => LanguageInput>>>,
): Highlight
```

- Disparaissent : `SupportedLanguage`, `LANGUAGE_ALIASES`, `LANGUAGE_IMPORTS` et le `resolveLanguage` synchrone.
- `highlight(code, lang)` :
  1. normalise `lang` (minuscules) ;
  2. si c'est un pseudo-langage, renvoie `null` sans rien charger ;
  3. charge le catalogue, avec un cache de fermeture et un nouvel essai après échec ;
  4. si le langage n'est ni un identifiant ni un alias, renvoie `null` ;
  5. sinon, charge sa grammaire une seule fois (cache par identifiant **canonique**, pour que `py` et `python` ne la chargent pas deux fois), puis tokenise comme en F08.
- Le catalogue est chargé par `import('shiki/langs')`, jamais importé statiquement : il reste dans le chunk du highlighter, hors du bundle de l'accueil.
- Le reste ne change pas : tokens `offset`/`content`/`style`, `defaultColor: false`, thèmes `github-light`/`github-dark`, `null` en cas d'échec.

### `CodeBlock`

- `resolveLanguage` synchrone disparaît. Sans langage, ou avec un pseudo-langage (`isPlainLanguage`), le bloc reste en texte brut sans appeler `highlight`. Sinon, il appelle `highlight(code, lang)`, et `null` le laisse en texte brut.
- La garde contre les réponses périmées reste la même, comparée sur la chaîne `lang` normalisée.

## Comportement

| Cas | Rendu |
|---|---|
| Pas de langage, ou `text`, `txt`, `plain`, `plaintext` | texte brut ; aucun chargement, pas même le catalogue |
| Langage ou alias connu (`python`, `py`, `yml`, `Dockerfile`…) | texte brut, puis coloré ; seule sa grammaire (et ses dépendances) est téléchargée |
| Langage inconnu (`pyhton`) | on charge le catalogue, `highlight` renvoie `null`, et le bloc reste en texte brut ; avertissement à la création de session |
| Échec du catalogue, de la grammaire ou de la tokenisation | texte brut ; nouvel essai au montage suivant |
| Grammaire qui embarque d'autres langages (`php` → html, css, javascript…) | Shiki charge les dépendances, pré-cachées comme le reste |

## Impact sur F17 (#17)

- Le pré-cache de « tous les assets émis » couvre les grammaires : aucun réglage de `maximumFileSizeToCacheInBytes` pour elles.
- La PR de F17 consigne le coût mesuré : nombre de chunks de grammaire, poids en gzip, taille en cache.
- Le test Playwright hors ligne ajoute, à côté du bloc `php`, un bloc dans un langage hors des six de D27 (`python`).

## Tests (Vitest)

- `code-languages.test.ts` :
  - identifiant, alias et casse : `python`, `py`, `PY`, `yml`, `dockerfile` sont reconnus ;
  - `pyhton` ne l'est pas ;
  - `text`, `txt`, `plain` et `plaintext` sont des pseudo-langages.
- `code-fences.test.ts` :
  - blocs ```` ``` ```` et `~~~` ;
  - info string avec des attributs ;
  - bloc sans langage ;
  - indentation de 0 à 3 espaces (4 espaces n'ouvrent pas de bloc) ;
  - une ligne ```` ``` ```` à l'intérieur d'un bloc `~~~` n'ouvre rien ;
  - code inline ignoré ;
  - un marqueur de fermeture plus long ferme le bloc.
- `rules.test.ts` :
  - `unknown_code_language` est levé pour `pyhton`, dans l'énoncé et dans la réponse ;
  - il est dédoublonné par question et par langage ;
  - il est absent pour `python`, `py`, `text` et un bloc sans langage ;
  - sa sévérité est `warning` ;
  - la config d'exemple ne lève aucune issue de ce code.
- `messages.test.ts` : le message existe en fr et en en (typage).
- `highlighter.test.ts` :
  - avec un faux catalogue injecté : il est chargé une fois, et réessayé après un échec ;
  - un langage inconnu donne `null` sans charger de grammaire ;
  - un pseudo-langage donne `null` sans charger le catalogue ;
  - `py` puis `python` ne chargent la grammaire qu'une fois ;
  - vraie coloration d'un extrait `python` et d'un extrait `yaml`.
- `code-block.test.tsx` : `text` n'appelle pas `highlight`, et un langage inconnu (`highlight` renvoie `null`) reste en texte brut.

## Vérification au build (à consigner dans la PR)

- Nombre de chunks de grammaire et leur poids total en gzip.
- Le chunk d'entrée ne référence ni le catalogue ni aucune grammaire. Tant que F09 n'a pas monté `<Markdown>`, faire la vérification par un montage temporaire, comme en F08.
- Aucun `.wasm`, et `pnpm build` n'affiche aucun avertissement. Si le nombre de chunks rallonge le build de façon notable, consigner la durée.

## Documentation

- `PRODUCT.md` : F08 renvoie à F18 pour la liste des langages, nouvelle section F18, et une ligne sur le coût des grammaires en F17.
- `README.md` § « Écrire une config » : tous les langages Shiki sont colorés, un langage inconnu est signalé à la création de session.
- `docs/CONVENTIONS.md` § « Markdown et bloc de code » : la règle « Ajouter un langage » disparaît (tous sont disponibles).

## Critères d'acceptation

- [ ] Un bloc ```` ```python ````, ```` ```yaml ```` ou ```` ```dockerfile ```` est coloré, et seule sa grammaire est téléchargée (onglet réseau).
- [ ] Un langage inconnu s'affiche en texte brut, sans erreur, et la création de session le signale par un avertissement non bloquant.
- [ ] Les alias (`py`, `yml`, `sh`) et la casse (`PHP`) sont reconnus de la même façon par le validateur et par le rendu.
- [ ] L'accueil ne charge ni le catalogue ni aucune grammaire.
- [ ] Une fois F17 livrée, un bloc `python` est coloré hors ligne (critère ajouté au test Playwright de F17).

## Hors périmètre

- Grammaires personnalisées apportées par la config.
- Thèmes Shiki configurables (les thèmes restent `github-light` / `github-dark`, D27).
- Moteur Oniguruma (WASM).
- Préchargement des grammaires selon la config (écarté par D63).
