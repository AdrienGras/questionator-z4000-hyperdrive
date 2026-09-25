# Conventions de code

Squelettes et patterns récurrents du projet. À consulter avant de créer un nouveau
type de fichier ou de composant.

Si tu découvres un pattern récurrent : documente-le ici.

Une section par pattern (`## <Nom du pattern> — squelette`), avec le code minimal
reproductible dans un bloc de code, suivi si besoin d'une sous-section
`### Règles tacites`.

---

## Arborescence et imports — squelette

Arbitrage : D59 (#31). Vérifié par `pnpm deps` (`.dependency-cruiser.cjs`) et oxlint.

```
src/
  main.tsx  index.css  vite-env.d.ts  routeTree.gen.ts   imposés par Vite / TanStack, restent à la racine
  app/            router.tsx ; providers globaux à venir (thème F07…)
  routes/         routes minces : createFileRoute + la page d'une feature, rien d'autre
  features/<x>/   <x>-page.tsx          point d'entrée, seul fichier importé par routes/
                  components/           sous-composants de l'écran
                  hooks/                hooks de l'écran (use-*.ts)
                  *.ts                  logique propre à l'écran (slot-status, export-session…)
  components/     ui/ (shadcn, vendu, intouché) + UI transverse (text-field-dialog, db-status-banner…)
  hooks/          hooks transverses (alias shadcn `@/hooks`), créé au premier besoin
  lib/            technique, aucune règle de PRODUCT.md :
                  db/ (Dexie, hooks de lecture), i18n/ (noyau, dictionnaire d'UI, useUi),
                  utils.ts (cn), app-version, download, format-date, issue-list…
  domain/<c>/     règles de PRODUCT.md, sans React ni Dexie : config/ scoring/ session/ students/ backup/
  testing/        setup Vitest, fixtures, render-at : importé par les tests seulement
```

Sens des imports : `lib` ← `domain` ← `components` ← `features` ← `routes` / `app`.

### Où ranger un nouveau fichier

1. C'est une route → `routes/`. Elle importe `<x>-page` et ne contient pas de JSX métier.
2. Une règle de PRODUCT.md (calcul, validation, transformation de session…), sans React → `domain/<concept>/`. Un concept nouveau (ex. `domain/stats/` pour F15) mérite son dossier.
3. Du technique sans métier (wrapper de lib tierce, format, téléchargement, stockage) → `lib/`.
4. Un composant ou un hook utilisé par **une** feature → `features/<x>/components/` ou `hooks/`. Utilisé par **deux** features → il remonte : `components/` (UI), `hooks/`, `lib/` (technique) ou `domain/` (métier). Une feature n'importe jamais une autre feature.
5. Un helper de test partagé → `testing/`. Un helper propre à une feature reste dans ses tests.

### Règles tacites

- Imports par `@/…` partout ; `./…` seulement pour le même dossier ; `../` interdit (oxlint `no-restricted-imports`). Seule exception : `domain/config/example.test.ts`, qui lit `examples/` hors de `src/`.
- Pas de barrel (`index.ts` de réexportation, règle `no-barrel`) : on importe le fichier qui déclare le symbole. `vi.mock` cible ce même fichier (`vi.mock('@/lib/db/hooks', …)` pour `useDbStatus`), pas un dossier.
- Fichiers et dossiers en kebab-case, composants compris (`session-card.tsx` exporte `SessionCard`) ; seules les routes TanStack gardent leur syntaxe (`__root.tsx`, `session.$sessionId.tsx`).
- `domain/` n'importe ni `lib/db/` ni `lib/i18n/use-ui.ts` : un dictionnaire de messages (`domain/*/messages.ts`) utilise `t` de `@/lib/i18n/i18n`. Seul `lib/db/` a le droit de lire les types de `domain/`.
- Tests colocalisés (`x.test.ts` à côté de `x.ts`).
- Une exception à une règle de `.dependency-cruiser.cjs` s'écrit dans la règle elle-même, avec sa raison (ex. `domain/config/icon-names.ts`, D37).

## Message de commit — gitmoji

```
<emoji> <message court, au présent, en français>

<corps facultatif : le pourquoi, pas le quoi>

Refs #<issue>        (ou Closes #<issue> pour le commit qui la termine)
```

Exemple : `✨ Ajoute le tirage aléatoire d'une question par catégorie`

### Règles tacites

- Emoji en **Unicode**, jamais en `:shortcode:` : lisible dans `git log`, les terminaux
  et l'interface GitHub sans rendu.
- Un seul emoji, celui de l'intention principale. Si un commit en mériterait deux, c'est
  souvent qu'il faut le découper.
- Emojis les plus courants ici (liste complète : https://gitmoji.dev) :

| Emoji | Usage |
|---|---|
| 🎉 | Premier commit du projet |
| ✨ | Nouvelle fonctionnalité |
| 🐛 | Correction de bug |
| 📝 | Documentation, spec, mémoire projet |
| ✅ | Ajout ou mise à jour de tests |
| ♻️ | Refactoring sans changement de comportement |
| 🎨 | Structure ou format du code |
| 💄 | UI, styles |
| 🌐 | Internationalisation (chaînes fr/en) |
| 🔧 | Fichiers de configuration |
| 👷 | CI (GitHub Actions) |
| 🚀 | Déploiement |
| ⬆️ | Mise à jour de dépendances |
| ➕ / ➖ | Ajout / retrait d'une dépendance |
| 🔥 | Suppression de code ou de fichiers |
| 🗃️ | Schéma de base (Dexie) |
| 🦺 | Validation (schémas Zod) |
| 🚧 | Travail en cours (à éviter sur `main`) |

## Route TanStack (file-based) — squelette

```tsx
// src/routes/session.$sessionId.tsx — route mince
import { createFileRoute } from '@tanstack/react-router'
import { SessionPage } from '@/features/session/session-page'

export const Route = createFileRoute('/session/$sessionId')({
  component: SessionPage,
})
```

```tsx
// src/features/session/session-page.tsx — lit ses paramètres sans importer la route
import { getRouteApi } from '@tanstack/react-router'

const route = getRouteApi('/session/$sessionId')

export function SessionPage() {
  const { sessionId } = route.useParams()
  return <main>{sessionId}</main>
}
```

### Règles tacites

- Historique **par hash** (`createHashHistory` dans `src/main.tsx`) : les URL publiques sont `…/#/session/<id>`.
- Le routeur est créé par `createAppRouter(history)` (`src/app/router.tsx`) ; les tests passent `createMemoryHistory({ initialEntries: ['/…'] })`.
- Après ajout ou renommage d'une route : `pnpm test` (ou `pnpm dev`) régénère `src/routeTree.gen.ts` ; le **commiter** (voir QUIRKS).
- Les tests peuvent vivre dans `src/routes/` (`*.test.tsx`, ignorés par le plugin).

## Composant shadcn — ajout

```bash
corepack pnpm dlx shadcn@latest add <composant> -y
```

### Règles tacites

- shadcn v4, primitives base-ui, icônes Tabler (`@tabler/icons-react`), preset Nova (D37).
- Code vendu dans `src/components/ui/` : ignoré par oxlint, formaté par Prettier ; on peut le modifier, mais toute personnalisation doit rester compatible avec un `add --overwrite`.
- Un seul `cn`, dans `@/lib/utils`.
- Après chaque `add` : vérifier que le CLI n'a pas réécrit l'import de `cn` ni ajouté la dépendance `cn` (QUIRKS 2026-09-25).
- `DialogContent` du vendor affiche par défaut un bouton « Close » en anglais : toujours `showCloseButton={false}`, et fermer via un bouton traduit.
- Couleurs uniquement via les tokens CSS (`bg-primary`, `text-foreground`…), jamais de couleur en dur : le thème de session (F07) surcharge ces tokens.

## oxlint — règles configurées

- `import/no-unassigned-import` reste en erreur, avec une liste blanche pour les imports à effet de bord légitimes (`**/*.css`, `@testing-library/jest-dom/vitest`). Ajouter une entrée à `allow` dans `.oxlintrc.json` plutôt que désactiver la règle.
- Lint type-aware obligatoire (`--type-aware`) : une promesse non gérée est une erreur.
- `unicorn/filename-case` (kebab-case) partout sauf `src/routes/**` ; `no-restricted-imports` interdit `../*` (override pour `domain/config/example.test.ts`). Les règles de dépendances entre dossiers vivent dans `.dependency-cruiser.cjs` (`pnpm deps`), pas dans oxlint : il n'a pas `import/no-restricted-paths`, et un override y remplace la liste de motifs au lieu de la compléter.

## Pull request — checklist avant « Ready for review »

```bash
git push -u origin <branche>
gh pr create --draft -B main -t "Fxx — …" -F corps.md     # avec « Closes #n »
gh pr checks <n> --watch                                   # job CI « check » vert
.claude/scripts/sonar-check.sh --pr <n> --wait             # quality gate OK, 0 issue, 0 hotspot
gh pr ready <n>
```

### Règles tacites

- Toujours ouvrir la PR en brouillon : SonarQube Cloud (analyse automatique) n'analyse que `main` et les PR, pas une branche poussée seule.
- Chaque issue Sonar est corrigée, pas marquée « won't fix », sauf accord explicite. Un fichier généré (ex. `src/routeTree.gen.ts`) ou vendu (`src/components/ui/`, D53) s'exclut dans `.sonarcloud.properties`, comme dans `ignorePatterns` d'oxlint.
- Actions GitHub épinglées par **SHA de commit**, version en commentaire (`uses: owner/action@<sha> # vX.Y.Z`) — règle Sonar `githubactions:S7637`.

## Code d'issue de config — ajout

Un nouveau contrôle de config produit une issue typée, jamais du texte. Trois endroits, dans cet ordre :

1. `src/domain/config/issues.ts` : ajouter le code et le type exact de ses paramètres dans `ConfigIssueParams`.
2. `src/domain/config/messages.ts` : ajouter le message dans `fr` **et** `en` (le typage `Dictionary<ConfigIssueParams>` fait échouer `pnpm check` s'il en manque un).
3. Le contrôle lui-même : structurel dans `schema.ts` (un `refine` avec `params: { code }`, converti par `from-zod.ts`) ou croisé dans `rules.ts` (`configError` / `configWarning`), plus un test qui déclenche le code.

```ts
// issues.ts
untrimmed_id: { id: string }
// messages.ts (fr)
untrimmed_id: ({ id }) => `L’identifiant « ${id} » commence ou finit par une espace.`,
// rules.ts
configError('untrimmed_id', ['categories', c, 'id'], { id: category.id })
```

### Règles tacites

- Un nouveau champ `z.int()` s'ajoute aussi à `INTEGER_FIELDS` (`from-zod.ts`).
- Les défauts de §6.2 vivent dans `defaults.ts`, lus par les règles et la normalisation ; le schéma n'a aucun `.default()`.
- **Valeurs CSS de la config (thème, couleurs) : uniquement via `element.style.setProperty(nom, valeur)`**, jamais concaténées dans du texte CSS ou une balise `<style>`. Le filtre de forme (D15) laisse passer `/*`, `\` et `url(` : il n'est sûr qu'avec `setProperty`.

## Calcul de note — squelette

Toute note se calcule dans `src/domain/scoring/`, en millièmes entiers (`Milli`, D01). Les vues et l'export ne font jamais d'arithmétique sur des décimaux : ils appellent le moteur, puis `formatScore` (affichage) ou `fromMilli` (export).

```ts
import { computeScores, formatScore, studentStatus } from '../scoring'

const scores = computeScores(student, session.config) // converted/final null si non terminé (D21)
const shown = scores.final === null ? '—' : formatScore(scores.final, 'final', session.config, locale)
const cumulative = formatScore(scores.raw, 'raw', session.config, locale) // brute : jusqu'à 3 décimales (D42)
```

### Règles tacites

- Décimal → millièmes : `toMilli` dans le moteur (lève hors des entiers sûrs), `roundToMilli` dans les règles F02 (ne lève jamais : une config absurde produit des issues). Millièmes → décimal : `fromMilli` seulement.
- Fabriquer un `Milli` : `asMilli(n)` (garde de type), jamais `n as Milli`.
- Une donnée corrompue (attempt `scored` sans `score`) lève une `Error` ; une saisie utilisateur passe d'abord par un validateur qui ne lève pas (`isValidAdjustment`).
- Tests : fixtures `makeConfig(scoring, absent)` et `makeStudent(attempts, overrides)` de `src/testing/student-fixtures.ts` (nombre → attempt noté, `'pending'`, `{ skipped }`).

## Mutation de session — squelette

Toute écriture métier passe par `updateSession` (`@/lib/db/sessions`), jamais par `db.sessions.*` : la règle `db-singleton` de `pnpm deps` interdit d'importer le singleton hors de `src/lib/db/`, sauf dans les tests. Le mutator est synchrone et refait ses contrôles sur la session **fraîche** qu'il reçoit (deux onglets examinateur peuvent écrire en même temps).

```ts
import { updateSession } from '@/lib/db/sessions'

await updateSession(sessionId, (session) => {
  const student = session.students.find((s) => s.id === studentId)
  if (!student) throw new Error(`Étudiant « ${studentId} » introuvable`)
  if (student.attempts.some((a) => a.outcome === 'pending')) throw new Error('Une question est déjà en cours')
  student.attempts.push(newAttempt) // modification en place autorisée : la session est une copie
  return session
})
```

### Règles tacites

- Jamais d'`await` étranger à Dexie dans un mutator (le typage refuse un mutator `async`) : préparer les données avant l'appel.
- Un mutator qui lève annule tout ; l'erreur remonte telle quelle à la feature, qui l'affiche.
- Lecture : `useSession(id)` / `useSessions()` ; `undefined` = chargement, `null` = absente. Afficher un message si `useDbStatus()` vaut `'outdated'` (recharger) ou `'unavailable'` (stockage bloqué).
- Tests de `src/lib/db/` : `import 'fake-indexeddb/auto'` en première ligne ; `createDb(nomUnique)` pour les tests de cycle de vie, `beforeEach(() => db.sessions.clear())` pour ceux du singleton ; `makeSession()` de `src/testing/session-fixtures.ts`.

## Composant d'écran traduit — squelette

```tsx
import { Button } from '@/components/ui/button'
import type { Ui } from '@/lib/i18n/use-ui'

type SessionToolbarProps = Readonly<{
  ui: Ui
  disabled: boolean
  onExport: () => void
}>

export function SessionToolbar({ ui, disabled, onExport }: SessionToolbarProps) {
  const { text } = ui
  return (
    <Button variant="outline" disabled={disabled} onClick={onExport}>
      {text('action_export', {})}
    </Button>
  )
}
```

### Règles tacites

- `useUi()` (`@/lib/i18n/use-ui`) une seule fois par écran, au composant de page ; les sous-composants reçoivent `ui: Ui` en prop. Langue : celle du navigateur hors session (D51) ; F07 ajoutera `config.locale`.
- Toute chaîne visible, `aria-label` compris, passe par `text(clé, params)` ; nouvelle clé = ajout dans `UiMessageParams` et dans les dictionnaires `fr` **et** `en` de `src/lib/i18n/ui-messages.ts` (le test échoue sinon).
- Props en `Readonly<{…}>` (SonarQube S6759) ; jamais `const [x] = useState(...)` sans le setter, et le setter nommé `setX` (S6754 signale aussi `[name, setNameValue]`) : `useMemo` ou une constante de module.
- Tests : `src/testing/setup.ts` force `navigator.languages = ['fr-FR']` ; un test en anglais redéfinit la propriété puis la restaure. Monter un écran routé via `createAppRouter(createMemoryHistory(...))` (voir `src/testing/render-home.tsx`).

## Dialogue de saisie — squelette

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
    {/* Formulaire dans un composant enfant : démonté à la fermeture, son état repart de zéro. */}
    <TextFieldForm ui={ui} initialValue={initialValue} onSave={onSave} onClose={() => onOpenChange(false)} />
  </DialogContent>
</Dialog>
```

### Règles tacites

- État du champ dans l'enfant (`useState(initialValue)`), pas d'`useEffect` de synchronisation : base-ui démonte le contenu d'un dialogue fermé.
- `onSave` renvoie une promesse : succès → fermeture ; échec → message `write_error` en `role="alert"`, dialogue ouvert.
- Référence : `src/components/text-field-dialog.tsx`, `src/features/home/components/delete-dialog.tsx`.

## Module lourd chargé à la demande — squelette

```ts
// src/features/home/hooks/use-backup-import.ts
try {
  const { parseBackup } = await import('@/domain/backup/parse')
  // …
} catch {
  setState({ kind: 'load-error', fileName: file.name })
}
```

### Règles tacites

- Le validateur de config (liste des 6 220 icônes Tabler comprise) pèse ~200 kB : l'écran qui l'utilise ponctuellement le charge en `import()` dynamique, avec un état d'erreur si le chunk ne se charge pas.
- Les autres modules du dossier s'importent par chemin direct (`@/domain/backup/serialize`…), comme partout (pas de barrel) : un `index.ts` qui réexporterait le module lourd le remettrait dans le chunk principal.
- `pnpm build` ne doit afficher aucun avertissement de taille de chunk.

## Fichier déposé et lu — squelette

```tsx
<FileDropField
  ui={ui}
  label={text('create_students_label', {})}
  accept=".csv,text/csv"
  fileName={slot.kind === 'empty' ? undefined : slot.fileName}
  status={slotStatus(slot)}
  onFile={(file) => void form.setStudentsFile(file)}
  disabled={form.submitting}
/>
```

```ts
// état d'un emplacement (src/features/create-session/hooks/use-create-form.ts)
type FileSlot<T> =
  | { kind: 'empty' }
  | { kind: 'reading'; fileName: string }
  | { kind: 'read-error'; fileName: string }
  | { kind: 'load-error'; fileName: string }
  | { kind: 'loaded'; fileName: string; result: T }
```

### Règles tacites

- Un compteur de séquence par emplacement : seule la dernière lecture lancée écrit son résultat (un fichier lent ne remplace jamais un fichier plus récent).
- Une valeur lue après un `await` (drapeau « saisi à la main », verrou d'envoi) vit dans un `useRef`, pas dans un état capturé par la fermeture.
- `dragover` appelle toujours `preventDefault()` quand des fichiers sont survolés, même désactivé (`dropEffect = 'none'`), et la page entière pose la même garde : sinon le navigateur ouvre le fichier et le formulaire est perdu.
- Statut annoncé par une région `aria-live="polite"` toujours montée (`reading` compris) ; la zone est un `<fieldset>` + `<legend>` (rôle `group` nommé par le libellé visible).
- CSV : lire les octets et décoder avec `decodeCsvBytes` (UTF-8 strict, repli Windows-1252, D58), jamais `file.text()`.
- Référence : `src/features/create-session/components/file-drop-field.tsx`, `src/features/create-session/hooks/use-create-form.ts`, `src/features/create-session/slot-status.ts`.

## Vue de session thémée — squelette

```tsx
// src/features/<x>/<x>-page.tsx
export function XPage() {
  const { sessionId } = route.useParams()
  const session = useSession(sessionId)
  const status = useDbStatus()
  const ui = useUi() // états sans session seulement : langue du navigateur
  if (status !== 'open') return <DbStatusBanner ui={ui} status={status} />
  if (session === undefined) return <SessionFallback ui={ui} kind="loading" />
  if (session === null) return <SessionFallback ui={ui} kind="not-found" />
  return (
    <SessionAppearance sessionId={session.id} view="examiner" config={session.config}>
      <XView session={session} /> {/* appelle useUi() lui-même : langue de la config */}
    </SessionAppearance>
  )
}
```

### Règles tacites

- Un seul écrivain sur `<html>` : `AppearanceProvider` (`src/app/`), monté dans `__root.tsx`. Un écran ne touche jamais `document.documentElement`. Il déclare une portée avec `<SessionAppearance>` ou `useAppearanceScope(scope)` ; une portée garde sa place dans la pile même re-mémoïsée (un nouvel objet à chaque rendu ne la fait pas passer en fin de pile), mais mémoïser `scope` (`useMemo`) reste recommandé pour éviter de réécrire les tokens à chaque rendu (D60).
- `color-scheme` suit le mode forcé : `:root { color-scheme: light; }` et `.dark { color-scheme: dark; }` dans `src/index.css`, pour que les contrôles natifs (barres de défilement…) suivent le mode de l'app plutôt que la préférence système (D26).
- Sous `SessionAppearance`, `useUi()` s'appelle **dans** l'enfant : appelé au-dessus, il ignore `config.locale`.
- Couleur de config sur un élément : `style={{ '--category-color': color }}`, autorisé car React passe par `setProperty` (D15). Elle s'utilise en accent (`border-[var(--category-color)]`), jamais en fond sous du texte (D26).
- Bascule de mode : `<ColorModeToggle ui={ui} />` dans l'en-tête de chaque écran.
- Tests : `src/testing/setup.ts` simule `matchMedia` (`setSystemDark(true)` de `@/testing/match-media` pour simuler un système sombre) et vide `localStorage` après chaque test.
- Vue projetée : ses composants ne reçoivent jamais la `Session` (`usePresentedConfig`, puis `toProjectedView` en F14).
