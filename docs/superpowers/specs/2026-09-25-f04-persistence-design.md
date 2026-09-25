# F04 — Persistance — Design

- **Date** : 2026-09-25
- **Ticket** : [#4](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/4)
- **Branche** : `feat/f04-persistence`
- **Statut** : spec validée en conversation, figée ici avant le plan d'implémentation.

## Contexte

Toutes les données vivent dans le navigateur de l'examinateur (aucun backend) et chaque action est écrite au moment où elle a lieu (persistance immédiate, §3). La vue projetée (F14) lit la même base depuis une autre fenêtre. F04 pose la couche de stockage sur laquelle toutes les features métier s'appuient ; elle n'a pas d'UI.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §3, §7 et F04 · [`docs/DECISIONS.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md) D12, D22, D23, D36, D45, D46.

## Objectif

Une base Dexie versionnée, une seule voie d'écriture transactionnelle pour les mutations métier (`updateSession`), des hooks de lecture réactifs (y compris entre fenêtres), le suivi de l'état de connexion (`versionchange`) et du stockage persistant.

## Dépendances à ajouter

- `dexie` ^4.4 et `dexie-react-hooks` ^4.4 (dépendances).
- `fake-indexeddb` ^6.2 (dépendance de dev).

## Modules

```
src/db/
  db.ts           QuestionatorDb (Dexie) : version(1) sessions: 'id, updatedAt' ; état de connexion ;
                  createDb(name), singleton `db` (nom 'questionator'), exposition dev
  errors.ts       SessionNotFoundError, SessionExistsError
  sessions.ts     createSession, getSession, listSessions, putSession, deleteSession, updateSession
  hooks.ts        useSessions(), useSession(id), useDbStatus()
  persistence.ts  requestPersistentStorage(), usePersistenceStatus()
  index.ts        réexports publics
```

Imports : `src/db/` peut utiliser l'alias `@/` (il n'est pas chargé par le plugin Vite de F02). Il importe `@/domain/types` ; il n'importe ni `src/scoring` ni l'UI.

## Base (`db.ts`)

```ts
type DbStatus = 'open' | 'outdated'

class QuestionatorDb extends Dexie {
  sessions!: EntityTable<Session, 'id'>
  get status(): DbStatus
  onStatusChange(listener: () => void): () => void   // renvoie la désinscription
}
function createDb(name: string): QuestionatorDb
export const db = createDb('questionator')
```

- `version(1).stores({ sessions: 'id, updatedAt' })`. Toute évolution future passe par `version(n).stores(...).upgrade(...)`.
- **`versionchange` (D45)** : l'instance ferme sa connexion, passe à `'outdated'`, notifie ses abonnés et renvoie `false` (remplace le traitement par défaut de Dexie, qui ferme et écrit dans la console). L'onglet qui monte de version n'est jamais bloqué. Les opérations suivantes sur l'instance fermée échouent avec la `DatabaseClosedError` de Dexie, que les fonctions de `sessions.ts` laissent remonter. Le message « recharger la page » est affiché par la feature de mise à jour PWA, pas par F04.
- **Dev (D23)** : `if (import.meta.env.DEV) window.__questionatorDb = db`, avec une déclaration globale typée (`declare global { interface Window { __questionatorDb?: QuestionatorDb } }`). Vite élimine la branche en production.

## Sessions (`sessions.ts`, D22, D46)

| Fonction | Contrat |
|---|---|
| `createSession(session: Session): Promise<void>` | `add` ; `SessionExistsError` si l'`id` existe déjà. Utilisée par F06, qui construit la `Session` complète. |
| `getSession(id): Promise<Session \| null>` | `null` si absente. |
| `listSessions(): Promise<Session[]>` | triées par `updatedAt` décroissant (index `updatedAt`, `reverse()`). |
| `putSession(session: Session): Promise<void>` | écrase (import F05, après confirmation de l'utilisateur). |
| `deleteSession(id): Promise<void>` | sans effet si absente. |
| `updateSession(id, mutator): Promise<Session>` | seule voie d'écriture des mutations métier, voir ci-dessous. |

`updateSession(id: string, mutator: (session: Session) => Session): Promise<Session>`, dans une seule transaction `db.transaction('rw', db.sessions, …)` :

1. Lire la session ; absente → `SessionNotFoundError`.
2. `next = mutator(structuredClone(current))` : le clone protège la valeur lue d'une mutation en place.
3. `next.id !== id` → `Error` (l'annulation de la transaction ne laisse rien écrit).
4. `next.updatedAt = new Date().toISOString()`, `put(next)`, renvoyer `next`.

Le mutator est **synchrone et pur** : il reçoit toujours la version fraîche lue dans la transaction, et c'est là qu'une feature refait ses contrôles métier (question déjà tirée, étudiant déjà terminé…), jamais sur l'état affiché. Un mutator qui lève annule la transaction et l'erreur remonte telle quelle. Le typage refuse un mutator qui renvoie une `Promise` : un `await` étranger à Dexie fermerait la transaction.

`SessionNotFoundError` et `SessionExistsError` (`errors.ts`) étendent `Error`, portent l'`id` et se reconnaissent par `instanceof`.

## Hooks (`hooks.ts`)

- `useSessions(): Session[] | undefined` — `useLiveQuery(listSessions)` ; `undefined` pendant le chargement.
- `useSession(id: string): Session | null | undefined` — `useLiveQuery(() => getSession(id), [id])` ; `undefined` pendant le chargement, `null` si absente ou supprimée.
- `useDbStatus(): DbStatus` — `useSyncExternalStore` sur `db.onStatusChange` / `db.status`.

`useLiveQuery` observe aussi les écritures des autres fenêtres de la même origine (D12) ; la vérification réelle est manuelle (voir plus bas).

## Stockage persistant (`persistence.ts`)

```ts
type PersistenceStatus = 'persisted' | 'best-effort' | 'unsupported'
function requestPersistentStorage(): Promise<boolean>
function usePersistenceStatus(): PersistenceStatus | undefined
```

- Store au niveau du module : état courant, abonnés. Première lecture au premier abonnement via `navigator.storage.persisted()` ; `'unsupported'` si `navigator.storage?.persisted` est absent. `undefined` tant que la première lecture n'a pas répondu.
- `requestPersistentStorage()` : `'unsupported'` → `false` ; sinon `navigator.storage.persist()`, puis relit `persisted()` et notifie les abonnés. Idempotente. Appelée par F06 à la première création de session.
- L'indicateur « stockage non persistant » est affiché par F05 (`'best-effort'`).

## Tests (Vitest)

Chaque fichier de test de `src/db/` commence par `import 'fake-indexeddb/auto'`. Les tests sur le singleton vident la table dans un `beforeEach` ; les tests de cycle de vie utilisent des instances `createDb(nom)` dédiées. Constructeur de `Session` de test dans `src/test/session-fixtures.ts`.

- **CRUD** : création puis lecture ; `SessionExistsError` sur doublon ; `putSession` écrase ; `deleteSession` (y compris absente) ; `getSession` absente → `null` ; tri de `listSessions`.
- **`updateSession`** : applique le mutator et renvoie la session écrite ; `updatedAt` avance (horloge simulée) ; `SessionNotFoundError` ; mutator qui lève → base inchangée et erreur propagée ; changement d'`id` refusé, base inchangée ; mutation en place dans le mutator sans effet sur la valeur d'origine ; **deux appels concurrents** (`Promise.all`, chacun ajoute un étudiant) → les deux étudiants présents.
- **Hooks** (`renderHook`, `waitFor`) : `useSessions` `undefined` → liste, puis mise à jour après une écriture ; `useSession` `undefined` → session → `null` après suppression ; `useDbStatus` passe à `'outdated'`.
- **`versionchange`** : instance `createDb('t')` ouverte, puis `new Dexie('t').version(2)` ouverte → la première passe à `'outdated'`, `isOpen()` faux, ses abonnés sont notifiés, l'ouverture en version 2 aboutit ; une écriture sur l'instance fermée rejette.
- **Persistance** (`vi.stubGlobal('navigator', …)`) : persistée, `best-effort`, API absente → `'unsupported'` et `requestPersistentStorage()` → `false` ; une demande acceptée fait passer le hook de `'best-effort'` à `'persisted'`.

## Vérification manuelle (à consigner dans la PR)

1. `pnpm dev`, ouvrir l'app dans une fenêtre A, puis une fenêtre B via `window.open(location.href)` depuis A.
2. Dans B : `__questionatorDb.constructor.liveQuery(() => __questionatorDb.sessions.toArray()).subscribe(console.log)` (`liveQuery` est une statique de `Dexie`, héritée par `QuestionatorDb` ; à vérifier à l'implémentation, sinon exposer aussi `liveQuery` en dev).
3. Dans A : écrire une session via `__questionatorDb.sessions.put({...})`.
4. Constater le log dans B sans rechargement. En cas d'échec : F14 ajoute une notification BroadcastChannel (D12).
5. Fermer et rouvrir le navigateur : la session est toujours là.
6. `pnpm build` puis `grep -r __questionatorDb dist/` : aucun résultat.

## Critères d'acceptation

- [ ] Une session créée survit à la fermeture et à la réouverture du navigateur (vérification manuelle).
- [ ] Une écriture dans une fenêtre est visible dans une autre fenêtre de la même origine, y compris ouverte par `window.open` (vérification manuelle, résultat consigné dans la PR).
- [ ] Deux `updateSession` concurrents sur la même session ne perdent aucune écriture (test).
- [ ] `window.__questionatorDb` absent du build de production.
- [ ] Un changement de schéma venu d'un autre onglet ferme proprement la connexion et passe `useDbStatus()` à `'outdated'` (test).
- [ ] `pnpm check` et `pnpm build` verts.

## Hors périmètre

- Mutations métier (F06, F09–F13), backup et import, schéma Zod de `Session` (F05).
- Affichage de l'indicateur de persistance (F05) et du bandeau de rechargement (mise à jour PWA).
- Test automatisé entre deux vraies fenêtres (F14, Playwright).
