# F03 — Moteur de notation — Design

- **Date** : 2026-09-25
- **Ticket** : [#3](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/3)
- **Branche** : `feat/f03-scoring`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Toutes les notes de l'application (score cumulé, écran final, side panel, stats, export) passent par ce moteur. Il doit être exact, sans dérive de virgule flottante, et ne jamais exposer de note finale pour un passage incomplet.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §5, §7 et F03 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D01–D03, D19–D21, D31, D42–D44.

## Objectif

Des fonctions pures qui, à partir d'un étudiant et d'une `NormalizedConfig` (F02), donnent note brute, plafonnée, convertie, ajustement et finale, le statut de l'étudiant, la valeur exportée, la validité d'un ajustement et le formatage localisé d'une note. Aucune dépendance à l'UI, à Dexie ni au DOM ; aucune dépendance npm ajoutée.

## Modules

```
src/domain/types.ts        Session, Student, Attempt (§7) — posés ici, persistés par F04
src/scoring/
  milli.ts                 Milli, isMilli, asMilli, roundToMilli, toMilli, fromMilli, assertSafeInteger,
                           hasAtMostThreeDecimals, MAX_SCORING_VALUE
  fraction.ts              Fraction { num, den }, fraction(num, den)
  rounding.ts              roundToStep(value, stepMilli, mode), stepMilli(config)
  score.ts                 computeScores(student, config) → ScoreBreakdown
  status.ts                studentStatus(student, config) → StudentStatus
  export-value.ts          exportedFinal(student, config) → number | string | null
  adjustment.ts            isValidAdjustment(value, config) → boolean
  format.ts                formatScore(milli, kind, config, locale) → string
  index.ts                 réexports publics
src/test/student-fixtures.ts   makeStudent(...), constructeur de Student pour les tests
```

`src/config/rules.ts` abandonne ses aides locales `toThousandths` et le test des 3 décimales au profit de `roundToMilli` et `hasAtMostThreeDecimals` importés de `src/scoring/milli.ts` : une seule formule de conversion vers les millièmes dans tout le code. Les règles utilisent la variante sans garde (`roundToMilli`) : une config absurde doit produire des issues, jamais une exception. `src/scoring/` n'utilise que des imports relatifs, puisque `src/config/` l'importe et que le plugin Vite charge `src/config/` sans l'alias `@/`.

**Borne des valeurs de notation (D44)** : F02 rejette (`scoring_value_too_large`) toute valeur de notation (barème, `maxRawScore`, `finalScale`, `rounding.step`, `absent.value`) dont la valeur absolue dépasse `MAX_SCORING_VALUE = 10 000`. Une config validée ne peut donc jamais faire lever la garde du moteur : au pire `10⁷ × 10⁷ = 10¹⁴` millièmes², sous 2⁵³.

## Types de domaine (`src/domain/types.ts`, D43)

Reprise du §7. Identifiants en `string`, dates en chaînes ISO 8601. `Attempt.score` et `adjustment.value` restent des `number` décimaux (comme dans la config) ; ils ne passent en millièmes qu'à l'entrée du moteur.

```ts
type Session = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  examiner?: string
  appVersion: string
  config: NormalizedConfig
  students: Student[]
  activeStudentId?: string
  projection: { mode: 'waiting' | 'student'; studentId?: string }
}

type Student = {
  id: string
  lastName: string
  firstName: string
  order: number
  addedDuringSession: boolean
  absent: boolean
  attempts: Attempt[]
  adjustment?: { value: number; reason?: string }
  comment?: string
  finalRevealedAt?: string
}

type Attempt = {
  id: string
  categoryId: string
  questionId: string
  drawnAt: string
  outcome: 'pending' | 'scored' | 'skipped'
  score?: number
  skipReason?: string
  editedAt?: string
}
```

## Cœur arithmétique

### `milli.ts`

- `type Milli = number & { readonly __brand: 'Milli' }` : type marqué, empêche de passer un décimal là où des millièmes sont attendus.
- `assertSafeInteger(n)` : lève `RangeError` si `!Number.isSafeInteger(n)`, renvoie `n` sinon.
- `asMilli(n)` : `n` vérifié par la garde, typé `Milli` (garde de type, pas d'assertion `as`).
- `roundToMilli(n)` = `Math.round(n × 1000)`, sans garde : réservé aux règles de F02.
- `toMilli(n)` = `asMilli(roundToMilli(n))` ; conversion décimal → millièmes du moteur.
- `fromMilli(m)` = `m / 1000` ; seule conversion entier → décimal (affichage, export).
- `hasAtMostThreeDecimals(n)` : repris de `rules.ts` à l'identique.

### `fraction.ts`

- `type Fraction = { num: number; den: number }` : valeur en millièmes égale à `num / den`, `den > 0`, entiers sûrs.
- `fraction(num, den)` applique `assertSafeInteger` aux deux termes et refuse `den ≤ 0`. Pas de simplification par PGCD (inutile aux ordres de grandeur en jeu).

### `rounding.ts`

`roundToStep(value: Fraction, step: Milli, mode) → Milli`, entièrement entier, correct pour les valeurs négatives (`convertie + ajustement` peut passer sous 0 avant le bornage) :

- `d = den × step` ; `q = ⌊num / d⌋` (division euclidienne, reste `r = num − q × d`, `0 ≤ r < d`). Le quotient flottant `Math.floor(num / d)` n'est qu'une estimation : il est corrigé d'une unité tant que `r < 0` ou `r ≥ d`, pour rester exact même quand `num / d` frôle un entier.
- `down` : `q` ; `up` : `q + (r > 0 ? 1 : 0)` ; `nearest` : `q + (2r ≥ d ? 1 : 0)` — égalité vers le haut (D19).
- Résultat `q' × step`, passé à `asMilli`. Un `step ≤ 0` lève `RangeError`.

`stepMilli(config)` = `toMilli(rounding.step ?? 10^-rounding.decimals)`.

### Calcul (`score.ts`)

Toutes les grandeurs en millièmes (`maxRaw = toMilli(maxRawScore)`, `scale = toMilli(finalScale)`) :

1. `raw` = somme des `toMilli(score)` des attempts `scored`.
2. `capped` = `min(raw, maxRaw)`.
3. `converted` = `clamp(roundToStep(fraction(capped × scale, maxRaw), step, mode), 0, scale)`.
4. `final` = `clamp(roundToStep(fraction(converted + adjustment, 1), step, mode), 0, scale)`.

Arrondir puis borner (D20) : 0 et `finalScale` toujours atteignables, jamais dépassés. Ordre de grandeur au pire avec la borne D44 : `capped × scale` ≤ 10⁷ × 10⁷ = 10¹⁴, `den × step` ≤ 10¹⁴, sous 2⁵³ ≈ 9·10¹⁵ (D21) ; la garde lève une erreur au-delà (donnée corrompue).

Un attempt `scored` sans `score` est une donnée corrompue : `computeScores` lève une `Error` plutôt que de compter 0 en silence. De même `exportedFinal` lève si `absent.export` vaut `'value'` sans `absent.value` (cas écarté par F02).

```ts
type ScoreBreakdown = {
  raw: Milli
  capped: Milli
  converted: Milli | null // null tant que le statut n'est pas 'done' (D21)
  adjustment: Milli       // 0 si absent ou sans ajustement
  final: Milli | null     // null tant que le statut n'est pas 'done' (D21)
}
```

## API publique

| Fonction | Règle |
|---|---|
| `studentStatus(student, config)` | `'absent'` si `absent` ; sinon `'done'` si le nombre d'attempts `scored` ≥ `questionsPerStudent` ; sinon `'in_progress'` s'il existe au moins un attempt (`pending`, `scored` ou `skipped`) ; sinon `'todo'`. Skips et `pending` ne comptent pas vers `questionsPerStudent`. |
| `computeScores(student, config)` | `raw` et `capped` toujours calculés ; `converted` et `final` renseignés seulement si le statut est `'done'`, `null` sinon (absent compris) ; `adjustment` = 0 si absent (D43). |
| `exportedFinal(student, config)` | Absent : `absent.label` (texte) si `export: 'label'`, `0` si `'zero'`, `absent.value` si `'value'`. Statut `'done'` : `fromMilli(final)`. Sinon `null`. |
| `isValidAdjustment(value, config)` | `Number.isFinite(value)`, `hasAtMostThreeDecimals(value)`, `|value| ≤ finalScale` (D44 : un ajustement plus grand que l'échelle n'a pas de sens et pourrait sortir des entiers sûrs) et `toMilli(value) % step === 0`. Ne lève jamais. |
| `formatScore(milli, kind, config, locale)` | `Intl.NumberFormat(locale)` (D42). `kind: 'final'` (convertie, finale, ajustement) : décimales fixes dérivées du pas (`stepMilli` 500 → 1, 250 → 2, 1000 → 0), « 14,0 » et « 14,5 » au pas de 0,5. `kind: 'raw'` : 0 à 3 décimales, zéros de fin retirés, « 7,25 », « 7 ». |

Nombre de décimales dérivé du pas : `3 − (nombre de zéros de fin de stepMilli, plafonné à 3)`.

## Tests (Vitest)

Fichiers `*.test.ts` à côté du code, `makeStudent` dans `src/test/student-fixtures.ts`.

- **milli / fraction** : `toMilli(0.1) + toMilli(0.2) === toMilli(0.3)` ; garde `isSafeInteger` qui lève ; `fraction` refuse `den ≤ 0`.
- **rounding** : chaque mode ; égalité en `nearest` (13,25 → 13,5 au pas de 0,5) ; valeurs négatives dans les trois modes ; `step` prioritaire sur `decimals`.
- **score** :
  - plafond atteint ; brute sous le plafond ;
  - barèmes décimaux : aucune dérive sur une somme de demi-points ou de dixièmes ;
  - conversion non entière : /20 avec plafond à 7, à 3 ;
  - pas de 0,3 sur /20 : plafond → 20, pas 20,1 (D20) ;
  - ajustement : +1 sur 20/20 reste 20 ; négatif sous 0 → 0 ; 13,5 + 1 = 14,5 au pas de 0,5 ;
  - `converted` et `final` à `null` pour `in_progress`, `todo` et `absent` ;
  - balayage : toutes les brutes de 0 à `maxRaw` par pas de 0,25 sur plusieurs configs — `converted` dans `[0, finalScale]`, sur la grille du pas sauf en `finalScale` hors grille, monotone croissante.
- **status** : les quatre statuts ; un skip ne compte pas vers `questionsPerStudent` ; un `pending` rend `in_progress`.
- **export-value** : les trois modes `absent.export` ; `done` → nombre ; non terminé → `null`.
- **adjustment** : multiple du pas accepté (dont négatif) ; hors pas, plus de 3 décimales, `NaN` et `Infinity` refusés.
- **format** : `final` et `raw` en fr et en en (« 13,5 » / « 13.5 », « 14,0 », « 7,25 », « 7 »).
- **rules.ts** : les tests F02 existants passent inchangés après le passage à `milli.ts` ; `scoring_value_too_large` déclenché au-delà de 10 000 en valeur absolue, pas à 10 000.

## Critères d'acceptation

- [ ] Tous les tests ci-dessus passent ; `pnpm check` et `pnpm build` verts.
- [ ] Aucun calcul de note en virgule flottante hors `toMilli` / `fromMilli`.
- [ ] Le moteur ne renvoie jamais de note convertie ni finale pour un passage incomplet.
- [ ] Aucune dépendance à l'UI, à Dexie ni au DOM dans `src/scoring/` et `src/domain/`.

## Hors périmètre

- Persistance des types de domaine (F04).
- Affichage signé « +1 » de l'ajustement (F11, via `signDisplay`).
- Statistiques de session (F16).
