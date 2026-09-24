# Quirks & pièges connus

Comportements non-évidents découverts au fil du projet. **Catalogue perpétuel** :
un `##` par piège, jamais purgé — les entrées restent utiles indéfiniment.

Le titre de chaque section est **le seul élément injecté automatiquement** au
démarrage de session (index sans corps). Il doit donc être **descriptif du piège
concret**, jamais générique — un titre vague le rend invisible dans l'index, même
si le corps qui le détaille est correct. Format exact :
`## Sujet concret du piège (AAAA-MM-JJ)`.

**Si tu en découvres un nouveau pendant une session : ajoute-le ici dès la
découverte, pas plus tard.**

Corps attendu pour chaque entrée : `**Découvert**` (contexte de la découverte),
`**Symptôme**` (ce qui a été observé), `**Cause**` (l'explication), `**Workaround**`
(contournement ou correction), `**Référence**` (fichier·s/commande·s concerné·s).

---

## Le CLI shadcn v4 bloque sur une invite si on ne lui passe pas toutes les options (2026-09-24)

**Découvert** : migration shadcn 3.8.5 → 4.21 pendant F01.
**Symptôme** : `shadcn init` attend une saisie sans TTY ; un agent a tenté de simuler un terminal.
**Cause** : le CLI est interactif par défaut ; avec un ancien `components.json` Radix, il demande en plus une confirmation de bascule radix → base-ui qu'aucune option ne saute.
**Workaround** : passer toutes les options (`-t vite -b base -p <preset> --no-monorepo --no-rtl --css-variables --force --reinstall`), fermer stdin (`< /dev/null`), mettre un `timeout`. Pour un changement de base, supprimer d'abord `components.json`. Pour `add` : `corepack pnpm dlx shadcn@latest add <composant> -y`.
**Référence** : `components.json`, `src/components/ui/`.

## pnpm global 9.x alors que le projet épingle pnpm 12.6.0 (2026-09-24)

**Découvert** : F01.
**Symptôme** : `pnpm` du système est en 9.15.9 ; le projet exige `packageManager: pnpm@12.6.0`.
**Cause** : pnpm installé globalement en ancienne version sur la machine.
**Workaround** : lancer `corepack pnpm …` (corepack, livré avec Node 24, résout la version épinglée). La CI utilise `pnpm/action-setup`, qui lit `packageManager`.
**Référence** : `package.json`, `.github/workflows/ci.yml`.

## Ajouter une route casse `tsc -b` tant que `routeTree.gen.ts` n'est pas régénéré (2026-09-24)

**Découvert** : F01, tâche routeur.
**Symptôme** : après l'ajout d'une route, `pnpm build` et `pnpm check` échouent dès `tsc -b` (TS2345) avant que Vite n'ait la moindre chance de régénérer l'arbre.
**Cause** : `tsc -b` s'exécute avant Vite dans `pnpm build` (`tsc -b && vite build`) ; seul le plugin Vite du routeur régénère `routeTree.gen.ts`, donc seuls `pnpm dev`, `pnpm test` (Vitest) ou `vite build` le régénèrent — jamais `tsc -b` seul.
**Workaround** : le fichier est **commité** ; après tout ajout ou renommage de route, lancer `pnpm test` (ou `pnpm dev`) pour régénérer `src/routeTree.gen.ts`, puis le commiter. La CI échoue si le fichier commité est périmé (`git diff --exit-code`).
**Référence** : `src/routeTree.gen.ts`, `.github/workflows/ci.yml`.

## Fichiers de test dans `src/routes/` : warning « does not export a Route » (2026-09-24)

**Découvert** : F01.
**Symptôme** : chaque build ou run de tests affiche `Route file ".../routes.test.tsx" does not export a Route`.
**Cause** : le plugin TanStack traite tout fichier de `src/routes/` comme une route.
**Workaround** : `routeFileIgnorePattern: '\\.test\\.tsx?$'` dans les options de `tanstackRouter` (`vite.config.ts`).
**Référence** : `vite.config.ts`.

## jsdom : « Not implemented: Window's scrollTo() » dans les tests du routeur (2026-09-24)

**Découvert** : F01.
**Symptôme** : warnings jsdom dans la sortie de `pnpm test`.
**Cause** : la restauration du scroll de TanStack Router appelle `window.scrollTo`, absent de jsdom.
**Workaround** : `window.scrollTo = () => {}` dans `src/test/setup.ts`. Pas de globals Vitest : `afterEach(cleanup)` explicite dans le même fichier (sinon Testing Library ne nettoie pas le DOM entre les tests).
**Référence** : `src/test/setup.ts`.
