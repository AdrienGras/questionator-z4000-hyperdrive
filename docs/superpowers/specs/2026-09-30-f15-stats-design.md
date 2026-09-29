# F15 — Statistiques de session — Design

- **Date** : 2026-09-30
- **Ticket** : [#15](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/15)
- **Branche** : `feat/f15-stats`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

F13 a laissé un `actionsSlot` au pied de l'onglet « Étudiants » (réservé à F15 et F16). D10 place les statistiques sur un écran dédié `#/session/:sessionId/stats` ; D34 fixe leurs définitions. Le moteur de notation (F03) fournit `computeScores` (convertie et finale `null` tant que l'étudiant n'est pas terminé, D21) et `studentStatus`. Un absent n'a jamais d'attempt : `setAbsent` remet le passage à zéro (F12). Un motif de skip vide est déjà normalisé en `undefined` (`normalizeReason`, D65). Le plugin TanStack Router tourne avec `autoCodeSplitting: true` : chaque composant de route a son propre chunk.

## Objectif

Une fonction pure `computeStats(session)` aux définitions exactes, reprise telle quelle par l'export F16, et un écran dédié qui l'affiche, dont Recharts ne pèse que sur son propre chunk.

## Décisions (D70)

- **`src/domain/stats/`**, et non `src/stats/` comme l'écrit le ticket (antérieur à D59).
- **Stratégie = multiensemble** des catégories des questions notées : « Facile ×2 + Difficile ×1 » et « Facile ×1 + Difficile ×2 » sont deux stratégies distinctes ; l'ordre des choix est ignoré.
- **Périmètre** : notes finales, histogramme et stratégies portent sur les étudiants **terminés** ; catégories, tags et questions portent sur **tous les attempts** (étudiants en cours compris ; les absents n'en ont pas).
- **Ex æquo** : départagés par l'ordre de la config (catégorie par `order`, puis position de la question dans la catégorie).
- **Toutes les catégories et tous les tags de la config** apparaissent, même sans attempt (taux `null`).
- **Critère « Recharts hors bundle initial »** vérifié par un script sur le manifeste Vite, en CI ; un e2e léger couvre le parcours.
- **Route non imbriquée** `session.$sessionId_.stats.tsx` : imbriquée, elle deviendrait enfant de la vue de passage, qui n'a pas d'`<Outlet />`.

## Architecture

```
src/domain/stats/
  types.ts              SessionStats et sous-types
  numbers.ts            moyenne, médiane, écart-type de population sur des Milli
  headcount.ts          effectifs
  grades.ts             notes finales + histogramme
  categories.ts         par catégorie
  tags.ts               par tag
  questions.ts          top 10 tirées, questions passées et motifs
  strategies.ts         combinaisons de catégories
  adjustments.ts        ajustements
  compute-stats.ts      computeStats(session) : compose les blocs
src/features/stats/
  stats-page.tsx        point d'entrée (squelette « Vue de session thémée »)
  components/           stats-view, headcount-card, grades-card, histogram-chart,
                        category-table, tag-table, question-tables, strategy-table,
                        adjustment-card
src/routes/session.$sessionId_.stats.tsx
src/components/ui/chart.tsx          (shadcn add chart)
scripts/check-initial-bundle.mjs
e2e/pages/stats-page.ts, e2e/stats.spec.ts
```

Chaque fichier de `domain/stats/` exporte une fonction pure `(session) => bloc` (ou prend les scores déjà calculés), testée isolément. `computeStats` calcule une fois `computeScores` et `studentStatus` par étudiant, puis les passe aux blocs qui en ont besoin. Aucune arithmétique de note hors du moteur : les blocs travaillent sur des `Milli` et ne convertissent en décimal (`fromMilli`, ou division finale) qu'en sortie.

## Domaine — `SessionStats`

Aucun texte : identifiants de la config figée, nombres, `null`. L'écran et l'export formatent.

```ts
type SessionStats = {
  headcount: {
    total: number
    done: number
    inProgress: number
    todo: number
    absent: number
    addedDuringSession: number
  }
  grades: {
    count: number // terminés
    min: Milli | null
    max: Milli | null
    mean: number | null // décimal
    median: number | null // décimal
    stdDev: number | null // décimal, population (÷ n)
  }
  histogram: { from: number; to: number; count: number }[] // décimal ; dernier intervalle fermé
  categories: {
    categoryId: string
    choices: number // attempts notés + passés
    scored: number
    successRate: number | null // 0–1
  }[]
  tags: { tag: string; scored: number; successRate: number | null }[]
  topDrawn: { categoryId: string; questionId: string; count: number }[] // ≤ 10
  skipped: {
    categoryId: string
    questionId: string
    total: number
    reasons: { reason: string | null; count: number }[]
  }[]
  strategies: {
    composition: { categoryId: string; count: number }[]
    students: number
    meanFinal: number // décimal
  }[]
  adjustments: { count: number; sum: Milli; mean: number | null }
}
```

### Définitions

| Bloc | Définition |
|---|---|
| `headcount` | un compteur par `studentStatus` ; `addedDuringSession` compte les étudiants ajoutés, tous statuts confondus ; `total` = nombre d'étudiants |
| `grades` | `final` des étudiants `done` uniquement ; médiane d'un effectif pair = moyenne des deux valeurs centrales ; écart-type de population ; tout à `null` si aucun terminé |
| `histogram` | largeur `l` = 1 si `finalScale` ≤ 20, sinon `finalScale / 20` ; barres `[k·l, (k+1)·l[` pour `k` de 0 à `ceil(finalScale / l) − 1`, la dernière s'arrête à `finalScale` et l'inclut. Indice d'une note : `floor(final / 1000)` si `finalScale` ≤ 20, sinon `floor(final × 20 / finalScale)` en entiers (fraction exacte), borné au dernier indice. Aucun terminé : barres à 0 |
| `categories` | dans l'ordre de la config ; `choices` = attempts `scored` + `skipped` ; `successRate` = Σ `score` ÷ Σ `max(scale)` sur les attempts `scored`, `null` si aucun ou si Σ max vaut 0 |
| `tags` | tags de la config par ordre de première apparition ; une question à plusieurs tags compte dans chacun ; même taux que les catégories |
| `topDrawn` | nombre d'attempts par question, tous résultats (`pending` compris) ; tri décroissant, ex æquo par ordre de la config ; 10 premières questions tirées au moins une fois |
| `skipped` | questions passées au moins une fois ; `reasons` par nombre décroissant, ex æquo par ordre de `config.skips.reasons` puis ordre alphabétique, « sans motif » (`null`) en dernier ; questions triées par `total` décroissant, ex æquo par ordre de la config |
| `strategies` | étudiants `done` ; composition = nombre d'attempts `scored` par catégorie (catégories à 0 omises), triée par `order` ; `meanFinal` = moyenne des `final` ; tri par effectif décroissant, ex æquo par composition (ordre des catégories puis nombre décroissant) |
| `adjustments` | étudiants non absents dont `adjustment.value` ≠ 0 ; `sum` = somme algébrique en `Milli` ; `mean` = `sum / count`, `null` si aucun |

Les moyennes, médianes et écarts-types se calculent sur les millièmes entiers et ne passent en décimal (÷ 1000) qu'à la fin. Une donnée corrompue (attempt `scored` sans `score`) lève, comme le moteur.

## Écran — `src/features/stats/`

- **Route** `src/routes/session.$sessionId_.stats.tsx`, chemin `/session/$sessionId/stats`, mince : elle monte `StatsPage`. `autoCodeSplitting` met le composant, et Recharts avec lui, dans un chunk à part. Un `errorComponent` traduit (chunk introuvable, hors ligne avant F17) propose le retour au passage.
- **`StatsPage`** suit le squelette « Vue de session thémée » (états de la base, chargement, session introuvable), puis `SessionAppearance view="examiner"` et `StatsView`, qui appelle `useUi()` (langue de la config) et `computeStats(session)` en `useMemo`. La session reste vivante (`useSession`, `liveQuery`) : les chiffres suivent un passage mené dans une autre fenêtre.
- **En-tête** : nom de la session, bouton « Retour au passage » (`Link` vers `/session/$sessionId`), `ColorModeToggle`.
- **Blocs**, sur une colonne en mobile, en grille au-delà :
  1. **Effectifs** et **Notes finales** en cartes chiffrées ; `min`/`max` par `formatScore(…, 'final', …)` ; `mean`, `median`, `stdDev` à 2 décimales (`Intl.NumberFormat`) ; `null` → « — ».
  2. **Histogramme** : `ChartContainer` + `BarChart` de shadcn/Recharts, barres au token `--primary`, libellés `[a ; b[` (dernier `[a ; b]`). Un tableau équivalent, masqué visuellement (`sr-only`), sert les lecteurs d'écran et les tests jsdom. Aucun terminé : phrase « Aucun étudiant n'a terminé » à la place du graphique.
  3. **Catégories** et **Tags** en tableaux : libellé (couleur et icône de la catégorie en accent, D26), nombre de choix / d'attempts notés, taux en pourcentage (`Intl.NumberFormat` `style: 'percent'`, 0 à 1 décimale) ; `null` → « — ».
  4. **Questions les plus tirées** (titre de la question, catégorie, nombre) et **Questions passées** (titre, total, motifs « Hors programme ×2, sans motif ×1 »). Listes vides : phrase dédiée.
  5. **Stratégies** : composition en pastilles (« Facile ×2 · Difficile ×1 »), effectif, note finale moyenne à 2 décimales.
  6. **Ajustements** : nombre, somme signée (`formatScore`), moyenne à 2 décimales.
- **Entrée** : bouton « Statistiques » (`Link` stylé en bouton) passé dans l'`actionsSlot` de `StudentsTab` par `ExaminerView` ; la feature `session` n'importe rien de `features/stats`.
- **i18n** : clés nouvelles dans `src/lib/i18n/ui-messages.ts`, en fr et en en.

## Frontières

- `recharts` et `@/components/ui/chart` ne s'importent que depuis `src/features/stats/` : règle `dependency-cruiser` dédiée.
- `shadcn add chart` : vérifier ensuite l'import de `cn` et l'absence de dépendance `cn` (QUIRKS 2026-09-25).
- `scripts/check-initial-bundle.mjs` : `build.manifest: true` ; le script lit `dist/.vite/manifest.json`, part de l'entrée `index.html`, suit les `imports` **statiques** (pas les `dynamicImports`) et échoue si un fichier source du graphe se trouve sous `node_modules/recharts/` (ou si le chunk de `chart.tsx` y figure). Script `pnpm check:bundle`, lancé en CI après `pnpm build`. Un test Vitest du script, sur des manifestes jouets, vérifie qu'il détecte une fuite et accepte un import dynamique.

## Erreurs et cas limites

- Session sans étudiant, ou sans terminé : `grades` à `null`, histogramme à 0, `strategies` vide, écran lisible avec « — ».
- `finalScale` non entier (/12,5) : dernière barre plus courte `[12 ; 12,5]`.
- `finalScale` > 20 non multiple de 20 (/33) : largeur 1,65, indice calculé en fraction exacte (`floor(final × 20 / finalScale)`), sans pas décimal intermédiaire.
- Barème à valeurs négatives : `max(scale)` reste la référence ; un taux peut être négatif, il s'affiche tel quel.
- Session inconnue : `SessionFallback` « introuvable », comme la vue de passage.

## Tests

- **Domaine** (Vitest, fixtures `makeConfig` / `makeStudent`) : absents et en cours exclus des notes ; médiane paire et impaire ; écart-type de population sur un jeu connu ; histogramme — bornes, dernier intervalle inclusif, largeur sur /20, /100 et /12,5, note égale à `finalScale` ; taux par catégorie et par tag (question multi-tags), skips exclus du taux et comptés dans les choix, `pending` ignoré ; top 10 (11 questions, ex æquo) et décompte des motifs dont « sans motif » ; stratégies — deux ordres de choix → même combinaison, multiensemble différent → autre combinaison ; ajustements avec un négatif ; session sans terminé → `null` ; `computeStats` sur l'exemple `examples/config.example.json`.
- **Écran** (Testing Library, `render-at`) : accès par le bouton de l'onglet « Étudiants » et retour ; « — » sans terminé ; taux en pourcentage ; tableau de secours de l'histogramme ; libellés en anglais avec `locale: 'en'` ; session introuvable.
- **Bundle** : test du script sur manifestes jouets ; `pnpm check:bundle` en CI.
- **e2e** (`e2e/stats.spec.ts`, POM `StatsPage`) : une session, un étudiant noté jusqu'au bout, ouverture des statistiques, effectifs et histogramme visibles, retour au passage.

## Critères d'acceptation

- [ ] Les absents sont exclus des statistiques de notes.
- [ ] Recharts n'est pas dans le bundle initial (chunk de la route des stats), vérifié par `pnpm check:bundle` en CI.
- [ ] Toutes les définitions ci-dessus sont couvertes par un test.
- [ ] `pnpm check`, `pnpm build` sans avertissement de taille, `pnpm e2e` verts.

## Hors périmètre

- Export des statistiques (F16), pré-cache du chunk (F17).
- Graphiques autres que l'histogramme.
