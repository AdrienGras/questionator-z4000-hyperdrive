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

## SonarQube Cloud n'analyse pas une branche sans PR (2026-09-24)

**Découvert** : F01, PR #18 (quality gate en échec découvert après ouverture).
**Symptôme** : `api/qualitygates/project_status?branch=<branche>` renvoie 404 ; seule `main` apparaît dans `api/project_branches/list`.
**Cause** : le projet est en analyse automatique, qui ne couvre que la branche principale et les pull requests.
**Workaround** : ouvrir la PR en brouillon, puis `.claude/scripts/sonar-check.sh --pr <n> --wait` avant de la passer en « Ready for review ».
**Référence** : `.claude/scripts/sonar-check.sh`, `.sonarcloud.properties`.

## Zod 4 : un champ absent n'est signalé que par `invalid_type` (ou `invalid_value` pour un littéral) (2026-09-25)

**Découvert** : F02, conversion des issues Zod en codes propres.
**Symptôme** : impossible de distinguer « champ manquant » de « mauvais type » à partir de l'issue seule ; un `schemaVersion` absent sortait en « valeur non autorisée ».
**Cause** : Zod 4 ne reporte pas l'entrée dans l'issue (`reportInput` désactivé) ; un `z.literal` absent donne `invalid_value`.
**Workaround** : relire la valeur au chemin de l'issue dans l'entrée brute (`valueAt`) : `undefined` → code `required`.
**Référence** : `src/config/from-zod.ts`.

## Zod 4 : `z.int()` renvoie `expected: 'number'` quand la valeur n'est pas un nombre (2026-09-25)

**Découvert** : F02.
**Symptôme** : une chaîne dans `questionsPerStudent` donnait « un nombre est attendu » au lieu de « un nombre entier ».
**Cause** : `expected: 'int'` n'apparaît que pour un nombre non entier ; pour une non-number, Zod dit `number`.
**Workaround** : liste `INTEGER_FIELDS` (champs `z.int()` du schéma, par nom) dans `from-zod.ts`. Tout nouveau `z.int()` doit y être ajouté.
**Référence** : `src/config/from-zod.ts`, `src/config/schema.ts`.

## V8 (Chrome, Node 24) ne donne aucune position pour la plupart des erreurs `JSON.parse` (2026-09-25)

**Découvert** : revue finale de F02.
**Symptôme** : virgule finale, commentaire, guillemets simples, valeur manquante → message « Unexpected token … » sans `position` ni `line/column`.
**Cause** : format des messages de V8 récent ; seuls certains cas portent `at position N (line L column C)`. Le message cite aussi un extrait du source, qui peut contenir « position 3 ».
**Workaround** : localiser avec `jsonc-parser` (offset de la première erreur, commentaires et virgules finales interdits) ; regex de repli ancrées en fin de message sur le libellé exact du moteur.
**Référence** : `src/config/parse-json.ts`.

## Vitest vide le contenu des imports CSS, même avec `?raw` (2026-09-25)

**Découvert** : F02, test d'alignement `THEME_TOKENS` ↔ `src/index.css`.
**Symptôme** : `import css from '../index.css?raw'` vaut `''` sous Vitest.
**Cause** : Vitest ne traite que les CSS listés dans `test.css.include` ; les autres sont remplacés par une chaîne vide, requête `?raw` comprise.
**Workaround** : `test: { css: { include: [/index\.css/] } }` dans `vite.config.ts`. Les JSON `?raw` fonctionnent sans réglage.
**Référence** : `vite.config.ts`, `src/config/schema.test.ts`.

## `setupFiles` de Vitest s'exécute aussi dans les fichiers `@vitest-environment node` (2026-09-25)

**Découvert** : F02, premier test en environnement `node` (plugin Vite).
**Symptôme** : `window is not defined` avant même le premier test.
**Cause** : `src/test/setup.ts` touche `window` et tourne pour chaque fichier, quel que soit son environnement.
**Workaround** : garder tout accès à `window` derrière `typeof window !== 'undefined'`.
**Référence** : `src/test/setup.ts`, `vite/config-schema-plugin.test.ts`.

## oxlint type-aware refuse les `as`, les `expect` conditionnels et les suppressions sur deux lignes (2026-09-25)

**Découvert** : F02, sur presque chaque tâche.
**Symptôme** : lint rouge sur du code pourtant correct.
**Cause** : règles actives `typescript/no-unsafe-type-assertion` (tests compris), `unicorn/no-array-sort`, `unicorn/consistent-function-scoping`, `vitest/no-conditional-expect`, `vitest/valid-expect` (pas de 2ᵉ argument à `expect`). Un `// oxlint-disable-next-line <règle> -- <raison>` ne marche que sur **une seule ligne physique**.
**Workaround** : gardes de type réelles (qui vérifient chaque niveau et lèvent une erreur), `.toSorted()`, helpers au niveau module, `if (!x) throw` avant `expect`. Suppression ciblée et justifiée seulement si un cast est inévitable.
**Référence** : `.oxlintrc.json`, `src/config/*.test.ts`.

## Un bloc ```php dans une chaîne JSON de PRODUCT.md casse l'extraction naïve du bloc ```json (2026-09-25)

**Découvert** : F02, copie du thème Synthwave dans l'exemple.
**Symptôme** : `JSON.parse` → « Unterminated string » en découpant le bloc d'exemple de §6.2 au premier ```.
**Cause** : un `prompt` de l'exemple contient une clôture ``` dans une chaîne.
**Workaround** : chercher la clôture seule sur sa ligne (`indexOf('\n```\n', début)`).
**Référence** : `PRODUCT.md` §6.2, `examples/config.example.json`.

## Importer un plugin Vite local sans extension déclenche l'avertissement `configLoader: 'native'` (2026-09-25)

**Découvert** : F02.
**Symptôme** : `(!) Your Vite config uses features that are unsupported by 'configLoader: native'` à chaque build et run de tests.
**Cause** : `import … from './vite/config-schema-plugin'` sans extension dans `vite.config.ts`.
**Workaround** : importer avec `.ts` et activer `allowImportingTsExtensions` dans `tsconfig.node.json` (déjà `noEmit`).
**Référence** : `vite.config.ts`, `tsconfig.node.json`.
