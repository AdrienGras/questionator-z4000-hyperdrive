# F31 — Robustesse des données persistées — Design

- **Date** : 2026-10-01
- **Ticket** : [#79](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/79)
- **Branche** : `feat/79-robustesse-donnees`
- **Statut** : design validé en conversation, figé ici avant le plan d'implémentation.

## Contexte

Les sessions vivent dans IndexedDB. Un backup édité à la main est revalidé en entier à l'import (D24, D48, D49), mais rien ne revalide une session **lue** : le code suppose des données cohérentes. Une session stockée incohérente fait lever `computeScores` (passage `scored` sans `score`, `src/domain/scoring/score.ts`) ou `toMilli` (ajustement hors des entiers sûrs, que `SessionSchema` accepte comme tout `z.number()`), et l'écran plante. Les quatre écrans qui lisent une session passent par `useSession` / `useSessions` (`src/lib/db/hooks.ts`) : passage, statistiques, vue projetée, accueil.

Deux écarts du BACKLOG complètent le ticket : l'arrondi d'affichage de la note plafonnée quand `finalScale` n'est pas sur la grille du pas (§ Notation), et l'indicateur « Stockage non garanti » lu une seule fois (§ Persistance).

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §5, §6.2 · `docs/DECISIONS.md` D24, D44, D48, D49, D59 · F04, F05, F11.

## Objectif

Une session endommagée n'emporte plus l'application : l'examinateur est prévenu, peut exporter le contenu stocké tel quel et revenir à l'accueil. Une config dont `finalScale` sort de la grille du pas est refusée. L'indicateur de persistance se met à jour au retour sur l'onglet.

## Décisions (D81)

| Sujet | Décision | Raison |
|---|---|---|
| Lieu de la détection | Dans la couche de lecture `lib/db` (`getSession`, `listSessions`, `updateSession`) | Un seul point de passage pour les quatre écrans ; le reste du code continue de recevoir des sessions sûres. Un error boundary ne verrait que les incohérences qui lèvent, et ne saurait pas dire lesquelles. |
| Règles appliquées | Exactement celles de l'import de backup, via une fonction partagée | Deux chemins, une seule définition de « session valide ». Coût mesuré : ~0,17 ms par session (exemple, 40 étudiants). |
| `final_scale_off_grid` | Avertissement → **erreur** | Le projet n'est pas encore en production. Refuser la config supprime le cas d'affichage trompeur (« 20,3 » pour 20,25 au pas de 0,5) au lieu de l'habiller. Conséquence assumée : une session ou un backup qui porte une telle config devient « endommagé » / inimportable. |
| Ajustement | Nouvelle règle `invalid_adjustment` : fini, au plus 3 décimales, au plus 10 000 en valeur absolue | Mêmes bornes que les autres valeurs de notation (§5, D44) ; supprime l'exception de `toMilli`. Vaut aussi pour l'import de backup. |
| Vue projetée | Message seul, sans action ni détail | Écran projeté devant l'étudiant : rien à exporter, et les issues peuvent citer des noms ou des notes. Écart assumé au ticket. |
| Mutations | `updateSession` refuse une session endommagée (`SessionDamagedError`), sans écrire | Filet pour un composant resté monté ou un autre onglet ; on ne réécrit jamais un contenu qu'on ne comprend pas. |
| Hors périmètre | Error boundary générique, réparation automatique, migration `version(2)` | Une session validée qui lève relève d'un bug, pas d'une donnée endommagée. |

## Design

### 1. Domaine : validation partagée (`src/domain/backup/`)

- `checkStoredSession(raw: unknown, deps: { cssSupports }): StoredSessionResult`, avec `StoredSessionResult = { ok: true; session: Session } | { ok: false; issues: BackupIssue[] }`. Enchaîne `SessionSchema` → `validateConfig` sur la config figée (issues préfixées `session.config`) → `checkSessionRules`. Renvoie la config du validateur (D49).
- `parseBackup` garde JSON → format → enveloppe (`BackupEnvelopeSchema` avec `session: z.unknown()`), puis délègue la session à `checkStoredSession`. Les chemins d'issues restent ceux d'aujourd'hui (`session.…`) : les tests existants de `parseBackup` ne changent pas.
- `checkSessionRules` gagne `invalid_adjustment` (chemin `session.students[i].adjustment.value`) : `Number.isFinite`, au plus 3 décimales (même test que `parseAdjustmentInput`), `|value| ≤ 10 000`. Message fr/en dans `domain/backup/messages.ts`.
- `domain/config/rules.ts` : `checkFinalScaleGrid` émet une **erreur** ; messages fr/en réécrits en refus (« L'échelle finale (20,25) doit être un multiple du pas d'arrondi (0,5). »). PRODUCT.md §6.2 : la ligne passe d'« Avertissement » à « Erreur ».

### 2. Lecture et écriture (`src/lib/db/`)

- `DamagedSession = { id: string; damaged: true; raw: unknown; issues: BackupIssue[] }` et la garde `isDamaged(value)`. `id` est la clé primaire Dexie, toujours lisible.
- `getSession(id): Promise<Session | DamagedSession | null>` et `listSessions(): Promise<(Session | DamagedSession)[]>` passent chaque enregistrement dans `checkStoredSession` (`cssSupports` = `CSS.supports` du navigateur, comme à l'import).
- Le tri de `listSessions` reste celui de l'index `updatedAt`. Un enregistrement sans `updatedAt` n'est pas dans l'index : il est lu à part (`toCollection`, filtre des id absents) et ajouté en fin de liste.
- `useSession` / `useSessions` relaient les nouveaux types.
- `updateSession` valide la session lue dans la transaction ; si elle est endommagée, il lève `SessionDamagedError(id)` (`lib/db/errors.ts`) avant d'appeler le mutator.
- `putSession` et `createSession` restent inchangés : leurs appelants (création, import) écrivent une session déjà validée.

### 3. Écrans

- **`src/components/damaged-session.tsx`** : `DamagedSessionScreen({ ui, damaged, variant: 'examiner' | 'present' })`, dans la langue et le thème de l'interface (la config n'est pas fiable).
  - `examiner` : titre « Cette session est endommagée », phrase « Le contenu enregistré est incohérent ; l'application ne peut pas l'ouvrir. Exportez un backup pour le conserver ou le corriger. », bouton « Exporter un backup », lien « Retour à l'accueil », puis un `<details>` « Détails » listant les issues (chemin + message, mêmes libellés qu'à l'import).
  - `present` : le titre seul.
- `SessionPage`, `StatsPage` : branche `isDamaged(session)` avant `SessionAppearance`. `useProjectedView` renvoie `'damaged'` au lieu de construire la `ProjectedView`, et `PresentPage` affiche la variante `present`.
- **Export brut** : `serializeBackup` accepte `session: unknown` dans l'enveloppe et l'écrit tel quel ; `backupFileName` prend le `name` s'il s'agit d'une chaîne non vide, sinon l'`id`. Le fichier exporté d'une session endommagée sera refusé à l'import tant qu'il n'est pas corrigé : c'est la boucle « exporter, corriger, réimporter ». La fonction `exportSession` sort de `features/home/` vers `src/components/export/export-backup.ts` pour être partagée par l'accueil et l'écran « endommagée ».
- **Accueil** : `SessionList` aiguille vers `DamagedSessionCard` (`features/home/components/`). La carte affiche le nom lisible ou l'id, un badge « Endommagée » et la phrase d'explication. Son menu ne propose que « Exporter un backup » et « Supprimer » (même dialogue de confirmation). Ni progression, ni « Reprendre », ni renommage, ni examinateur, ni Excel.
- **Mutations refusées** : les composants qui écrivent (autosave du commentaire, actions de passage) affichent leur erreur habituelle sur `SessionDamagedError` ; au rendu suivant, la page bascule sur l'écran « endommagée ».

### 4. Indicateur de persistance (`src/lib/db/persistence.ts`)

Le premier abonné installe un écouteur `visibilitychange` sur `document` ; quand `visibilityState === 'visible'`, il lance `refresh()` (le compteur de séquence existant protège des réponses dans le désordre). Le dernier désabonnement retire l'écouteur ; un nouvel abonnement le réinstalle et relance une lecture.

## Tests

- `domain/backup` : `checkStoredSession` (session saine ; `scored` sans note ; ajustement `1e20`, à 4 décimales, `Infinity` et `NaN` (IndexedDB les stocke, le clonage structuré n'étant pas du JSON ; l'export les écrit `null`, seule entorse au « tel quel ») ; étudiant actif inconnu ; config hors grille) ; `invalid_adjustment` dans les tests des règles croisées ; `parseBackup` inchangé sur les fixtures existantes.
- `domain/config` : `final_scale_off_grid` en erreur (tests existants adaptés), config d'exemple toujours valide.
- `lib/db` (fake-indexeddb) : `getSession`, `listSessions` (dont l'enregistrement sans `updatedAt` placé en fin) et `useSession` renvoient la forme endommagée ; `updateSession` lève `SessionDamagedError` sans écrire ni appeler le mutator.
- `persistence` : `visibilitychange` relit l'état ; l'écouteur est retiré au dernier désabonnement et réinstallé au suivant.
- Composants : passage, stats et vue projetée sur une session endommagée (aucune exception, actions selon la variante, export qui télécharge le contenu brut à l'identique) ; `DamagedSessionCard` (badge, menu réduit, suppression).
- **e2e** : session neuve, corrompue dans IndexedDB (un passage `scored` sans note), rechargement → écran « endommagée » ; le backup téléchargé a pour `session` l'enregistrement stocké à l'identique ; retour à l'accueil → carte badgée.

## Critères d'acceptation (ticket)

- [ ] Une session avec un passage `scored` sans note ouvre un écran « session endommagée » avec export possible, sans exception non gérée.
- [ ] Le backup exporté d'une session endommagée est le contenu stocké, tel quel.
- [ ] La note plafonnée n'est plus arrondie de façon trompeuse : la config est refusée.
- [ ] L'indicateur de persistance se met à jour au retour sur l'onglet.
