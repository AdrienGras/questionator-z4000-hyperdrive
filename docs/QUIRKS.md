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
**Workaround** : `window.scrollTo = () => {}` dans `src/testing/setup.ts`. Pas de globals Vitest : `afterEach(cleanup)` explicite dans le même fichier (sinon Testing Library ne nettoie pas le DOM entre les tests).
**Référence** : `src/testing/setup.ts`.

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
**Référence** : `src/domain/config/from-zod.ts`.

## Zod 4 : `z.int()` renvoie `expected: 'number'` quand la valeur n'est pas un nombre (2026-09-25)

**Découvert** : F02.
**Symptôme** : une chaîne dans `questionsPerStudent` donnait « un nombre est attendu » au lieu de « un nombre entier ».
**Cause** : `expected: 'int'` n'apparaît que pour un nombre non entier ; pour une non-number, Zod dit `number`.
**Workaround** : liste `INTEGER_FIELDS` (champs `z.int()` du schéma, par nom) dans `from-zod.ts`. Tout nouveau `z.int()` doit y être ajouté.
**Référence** : `src/domain/config/from-zod.ts`, `src/domain/config/schema.ts`.

## V8 (Chrome, Node 24) ne donne aucune position pour la plupart des erreurs `JSON.parse` (2026-09-25)

**Découvert** : revue finale de F02.
**Symptôme** : virgule finale, commentaire, guillemets simples, valeur manquante → message « Unexpected token … » sans `position` ni `line/column`.
**Cause** : format des messages de V8 récent ; seuls certains cas portent `at position N (line L column C)`. Le message cite aussi un extrait du source, qui peut contenir « position 3 ».
**Workaround** : localiser avec `jsonc-parser` (offset de la première erreur, commentaires et virgules finales interdits) ; regex de repli ancrées en fin de message sur le libellé exact du moteur.
**Référence** : `src/domain/config/parse-json.ts`.

## Vitest vide le contenu des imports CSS, même avec `?raw` (2026-09-25)

**Découvert** : F02, test d'alignement `THEME_TOKENS` ↔ `src/index.css`.
**Symptôme** : `import css from '../index.css?raw'` vaut `''` sous Vitest.
**Cause** : Vitest ne traite que les CSS listés dans `test.css.include` ; les autres sont remplacés par une chaîne vide, requête `?raw` comprise.
**Workaround** : `test: { css: { include: [/index\.css/] } }` dans `vite.config.ts`. Les JSON `?raw` fonctionnent sans réglage.
**Référence** : `vite.config.ts`, `src/domain/config/schema.test.ts`.

## `setupFiles` de Vitest s'exécute aussi dans les fichiers `@vitest-environment node` (2026-09-25)

**Découvert** : F02, premier test en environnement `node` (plugin Vite).
**Symptôme** : `window is not defined` avant même le premier test.
**Cause** : `src/testing/setup.ts` touche `window` et tourne pour chaque fichier, quel que soit son environnement.
**Workaround** : garder tout accès à `window` derrière `typeof window !== 'undefined'`.
**Référence** : `src/testing/setup.ts`, `vite/config-schema-plugin.test.ts`.

## oxlint type-aware refuse les `as`, les `expect` conditionnels et les suppressions sur deux lignes (2026-09-25)

**Découvert** : F02, sur presque chaque tâche.
**Symptôme** : lint rouge sur du code pourtant correct.
**Cause** : règles actives `typescript/no-unsafe-type-assertion` (tests compris), `unicorn/no-array-sort`, `unicorn/consistent-function-scoping`, `vitest/no-conditional-expect`, `vitest/valid-expect` (pas de 2ᵉ argument à `expect`). Un `// oxlint-disable-next-line <règle> -- <raison>` ne marche que sur **une seule ligne physique**.
**Workaround** : gardes de type réelles (qui vérifient chaque niveau et lèvent une erreur), `.toSorted()`, helpers au niveau module, `if (!x) throw` avant `expect`. Suppression ciblée et justifiée seulement si un cast est inévitable.
**Référence** : `.oxlintrc.json`, `src/domain/config/*.test.ts`.

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

## SonarQube signale les regex `\[([^\]]*)\]\(…\)` et `(.+?)…\1` comme super-linéaires (2026-09-25)

**Découvert** : PR #21 (F02), analyse SonarQube Cloud.
**Symptôme** : règles `typescript:S8786` (backtracking super-linéaire) et `S5843` (complexité > 20) sur les regex de nettoyage markdown de `derive-title.ts`, alors que le lint et les tests passaient.
**Cause** : une classe qui n'exclut pas le délimiteur ouvrant, ou un `.+?` suivi d'une rétro-référence, relance le parcours à chaque position ; une alternance de marqueurs en une seule regex dépasse la complexité autorisée.
**Workaround** : parcours linéaire à la main (`indexOf`) pour les liens et images ; classes excluant le délimiteur (`[^*]+?`) pour l'emphase ; plusieurs petites regex ancrées appliquées en boucle pour les marqueurs de bloc. Lancer `.claude/scripts/sonar-check.sh --pr <n> --wait` tôt : Sonar voit des choses qu'oxlint ne voit pas.
**Référence** : `src/domain/config/derive-title.ts`.

## Le hook RTK réécrit `pnpm vitest` : sortie illisible et `.vitest/json/output.json` qui casse `pnpm check` (2026-09-25)

**Découvert** : F03, implémentation en subagents.
**Symptôme** : `pnpm vitest run <fichier>` (ou `rtk proxy pnpm vitest`) ne rend aucune sortie lisible, puis `pnpm check` échoue à l'étape Prettier sur `.vitest/json/output.json`.
**Cause** : le hook Claude Code RTK réécrit la commande vers son filtre vitest, qui écrit un rapport JSON dans `.vitest/` à la racine.
**Workaround** : lancer un test ciblé avec `./node_modules/.bin/vitest run <fichier>` ; `pnpm test` / `pnpm check` restent sûrs. `.vitest/` est désormais dans `.gitignore` ; supprimer le dossier s'il traîne. Autre forme lisible : `rtk proxy pnpm exec vitest run <fichier>` (sans `pnpm vitest`). **Ne pas lire `.vitest/json/output.json` pour conclure** : si le fichier de test échoue à l'import (module absent, phase rouge du TDD), le rapport n'est pas réécrit et montre encore le « passed » du lancement précédent (vu en F25, 2026-09-30).
**Référence** : `.gitignore`, `docs/superpowers/plans/2026-09-25-f03-scoring.md`.

## Un littéral décimal « à 3 décimales » peut tomber sous la demie une fois ×1000, et `Math.round(-0)` vaut `-0` (2026-09-25)

**Découvert** : F03, relecture du plan et revue finale.
**Symptôme** : `Math.round(2.0005 * 1000)` donne 2000, pas 2001 ; `formatScore(toMilli(-0))` affichait « -0,0 ».
**Cause** : 2.0005 n'est pas représentable (2.000499999…), le produit tombe juste sous .5 ; `Math.round` conserve le signe de zéro, et `Intl.NumberFormat` affiche le signe de `-0`.
**Workaround** : ne jamais écrire de test sur une demie « exacte » à la 4ᵉ décimale ; `toMilli` normalise `-0` en `0`. Toute conversion décimal → millièmes passe par `toMilli` (moteur) ou `roundToMilli` (règles F02).
**Référence** : `src/domain/scoring/milli.ts`.

## SonarQube refuse `tableau.map(fonction)` quand la fonction a un 2ᵉ paramètre (2026-09-25)

**Découvert** : PR #23 (F03), `src/testing/student-fixtures.ts`.
**Symptôme** : bug MAJOR `typescript:S7727` (« Do not pass function directly to `.map(…)` ») et quality gate en échec (fiabilité), alors qu'oxlint et les tests passaient.
**Cause** : `.map` passe aussi l'index et le tableau ; une fonction dont la signature accepte un 2ᵉ paramètre les recevrait par accident si elle évolue.
**Workaround** : toujours une flèche explicite, `items.map((item, index) => build(item, index))`.
**Référence** : `src/testing/student-fixtures.ts`.

## `useLiveQuery` garde son dernier résultat quand ses dépendances changent (2026-09-25)

**Découvert** : F04, revue de la tâche 3 (hooks).
**Symptôme** : juste après `rerender({ id: 'b' })`, `useSession('b')` renvoyait encore la session `a` pendant un rendu.
**Cause** : `dexie-react-hooks` conserve le résultat de l'observable précédent et ne recalcule pas de valeur initiale quand il en a déjà une.
**Workaround** : la requête renvoie `{ id, session }` et le hook masque (`undefined`) un résultat dont l'`id` n'est pas le courant. À reproduire pour tout hook `useLiveQuery` paramétré.
**Référence** : `src/lib/db/hooks.ts`.

## Après `versionchange`, `close()` fait échouer toute opération et les `liveQuery` se taisent (2026-09-25)

**Découvert** : F04 (D45), sonde et revue finale.
**Symptôme** : dans l'ancien onglet, `put` rejette `DatabaseClosedError` ; les hooks gardent leur dernière valeur sans se mettre à jour.
**Cause** : `close()` sans argument vaut `{ disableAutoOpen: true }`. Le traitement par défaut de Dexie passe `false` et rouvrirait en silence sur l'ancien schéma.
**Workaround** : ne pas changer l'argument de `close()` ; se fier à `useDbStatus() === 'outdated'` pour proposer le rechargement.
**Référence** : `src/lib/db/db.ts`.

## `import 'fake-indexeddb/auto'` exige l'exception oxlint `import/no-unassigned-import` (2026-09-25)

**Découvert** : F04.
**Symptôme** : lint rouge sur la première ligne des tests de `src/lib/db/`.
**Cause** : la règle n'autorise que les imports à effet de bord listés.
**Workaround** : `"fake-indexeddb/auto"` ajouté à `allow` dans `.oxlintrc.json`. Importer `Dexie` par l'export nommé (`import { Dexie } from 'dexie'`), l'import par défaut déclenche `import/no-named-as-default`.
**Référence** : `.oxlintrc.json`, `src/lib/db/*.test.ts`.

## Rien n'évalue `src/lib/db` tant qu'aucune feature ne l'importe : `window.__questionatorDb` absent en dev (2026-09-25)

**Découvert** : F04, vérification manuelle entre fenêtres.
**Symptôme** : `typeof window.__questionatorDb === 'undefined'` sous `pnpm dev`.
**Cause** : Vite ne charge que les modules importés depuis `main.tsx`.
**Workaround** : `src/main.tsx` importe `@/lib/db/db` en dev seulement. En prod, rien tant que F05 n'importe pas `src/lib/db`.
**Référence** : `src/main.tsx`.

## Le premier `findBy*` d'un test rendu via le routeur dépasse 1 s sous la suite complète (2026-09-25)

**Découvert** : F05, tâche 5 (accueil), en lançant `pnpm check`.
**Symptôme** : le premier test de `src/features/home/home-page.test.tsx` et le test de `/` dans `routes.test.tsx` passent seuls mais échouent en suite complète (« Unable to find role="heading" » après ~1050 ms), de façon déterministe.
**Cause** : `autoCodeSplitting` charge le composant de la route par import dynamique ; sous 36 fichiers en parallèle, la première transformation de l'accueil et de ses composants base-ui prend ~2 s, au-delà du délai par défaut de 1 s de Testing Library.
**Workaround** : `configure({ asyncUtilTimeout: 5000 })` dans `src/testing/setup.ts`. Les menus et dialogues base-ui s'ouvrent bien avec `fireEvent.click` : `@testing-library/user-event` n'est pas nécessaire.
**Référence** : `src/testing/setup.ts`, `vite.config.ts` (`autoCodeSplitting`).

## `Equal<A, B>` (astuce des fonctions génériques) déclare différents une intersection et l'objet aplati équivalent (2026-09-25)

**Découvert** : test d'alignement `SessionSchema` / `Session` en F05.
**Symptôme** : `Equal<Omit<ParsedSession, 'config'> & { config: NormalizedConfig }, Session>` vaut `false` alors que clés, types et optionalité sont identiques et que l'assignabilité mutuelle passe.
**Cause** : l'astuce `(<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)` compare l'identité des types, pas leur structure : une intersection n'est pas identique à un objet aplati.
**Workaround** : aplatir avant de comparer, `type Simplify<T> = { [K in keyof T]: T[K] }`, puis `Equal<Simplify<A>, B>`.
**Référence** : `src/domain/session/schema.test.ts`.

## `shadcn add` (CLI 4.21) injecte une dépendance `cn` et réécrit l'import de `cn` dans tous les composants (2026-09-25)

**Découvert** : ajout de `dialog`, `alert-dialog`, `dropdown-menu`… en F05.
**Symptôme** : `package.json` et `pnpm-lock.yaml` gagnent `"cn": "^0.4.0"`, et les fichiers de `src/components/ui/` (y compris `button.tsx`, déjà présent) importent `cn` depuis ce paquet au lieu de `@/lib/utils`.
**Cause** : comportement du CLI 4.21 avec le preset Nova ; non documenté.
**Workaround** : après chaque `add`, remettre `import { cn } from '@/lib/utils'` dans les fichiers touchés, retirer la dépendance `cn`, `corepack pnpm install`, puis vérifier que `git diff package.json pnpm-lock.yaml src/components/ui/button.tsx` est vide.
**Référence** : `src/components/ui/`, `src/lib/utils.ts`, section CONVENTIONS « Composant shadcn — ajout ».

## Lancer un second `pnpm dev` réoptimise le cache Vite partagé et casse le serveur déjà ouvert (504 « Outdated Optimize Dep ») (2026-09-25)

**Découvert** : vérification manuelle de F05, un serveur de dev tournait déjà sur 5173.
**Symptôme** : le second `vite` échoue (`Port 5173 is already in use`), mais la page du premier serveur ne charge plus : 504 « Outdated Optimize Dep » sur `react`, `@tanstack/react-router`…, page blanche, même après rechargement.
**Cause** : au démarrage, le second processus réécrit `node_modules/.vite/deps` (« Re-optimizing dependencies because vite config has changed ») avant d'échouer sur le port ; le premier serveur garde en mémoire l'ancienne empreinte.
**Workaround** : vérifier le port avant (`ss -ltnp | grep 5173`) et réutiliser le serveur existant ; pour une vérification indépendante, `pnpm build` puis `vite preview --port 4173` (aucune optimisation de dépendances). Si le mal est fait, redémarrer le serveur de dev cassé.
**Référence** : `node_modules/.vite/`, `docs/ENVIRONMENT.md` (commandes).

## PapaParse `delimitersToGuess` retombe sur `,` dès qu'une ligne est courte ou vide (2026-09-25)

**Découvert** : F06, lecture d'un export Excel FR (`;`, BOM, CRLF, ligne vide finale).
**Symptôme** : le fichier est découpé à la virgule : chaque ligne devient une seule cellule, donc des `single_field_row` en série.
**Cause** : `guessDelimiter` exige une moyenne de plus de 1,99 champ par ligne sur l'échantillon ; une ligne vide finale, un préambule d'un mot ou une ligne à un champ la fait échouer, et PapaParse prend `,` par défaut.
**Workaround** : `detectDelimiter` (`src/domain/students/parse-csv.ts`) parse l'échantillon avec chaque candidat (`preview: 50`, guillemets respectés) et garde celui qui donne le plus de lignes à au moins deux cellules non vides ; égalité → `;`. Un comptage brut des caractères ne suffit pas (virgules d'une adresse ou d'un titre).
**Référence** : `src/domain/students/parse-csv.ts`, `src/domain/students/parse-csv.test.ts`.

## Un guillemet ouvrant mal placé dans un CSV avale toute la suite du fichier (2026-09-25)

**Découvert** : revue de F06.
**Symptôme** : `"Bob" Martin;Paul` produit `InvalidQuotes` puis `MissingQuotes` ; toutes les lignes suivantes finissent dans une seule cellule.
**Cause** : comportement RFC 4180 de PapaParse : un guillemet en début de cellule ouvre un champ cité jusqu'au prochain guillemet.
**Workaround** : toute erreur PapaParse de type `Quotes` donne `csv_syntax` (bloquant, avec numéro de ligne) plutôt que des étudiants faux. Les numéros de ligne dérivent aussi après un saut de ligne dans une cellule citée (cas accepté, documenté dans le code).
**Référence** : `src/domain/students/parse-csv.ts`.

## L'export « CSV » d'Excel en français est en Windows-1252, pas en UTF-8 (2026-09-25)

**Découvert** : revue finale de F06.
**Symptôme** : `file.text()` décode en UTF-8 : « Prénom » devient « Pr�nom », l'en-tête n'est plus reconnu et devient un étudiant, sans aucune issue.
**Cause** : seul le format « CSV UTF-8 » d'Excel écrit de l'UTF-8 (avec BOM) ; « CSV (séparateur : point-virgule) » écrit en Windows-1252.
**Workaround** : lire les octets (`file.arrayBuffer()`), décoder avec `new TextDecoder('utf-8', { fatal: true })`, et en cas d'exception relire en `windows-1252` avec l'avertissement `legacy_encoding` (D58).
**Référence** : `src/domain/students/decode.ts`, `src/features/create-session/hooks/use-create-form.ts`.

## dependency-cruiser ne lit pas les sources avec typescript@7 : parseur swc obligatoire (2026-09-25)

**Découvert** : #31, mise en place de `pnpm deps`.
**Symptôme** : `✔ no dependency violations found (0 modules, 0 dependencies cruised)`, suivi de l'avertissement `missing-typescript-transpiler`. La commande passe au vert sans avoir rien analysé.
**Cause** : dependency-cruiser 18 s'appuie sur l'API JS de `typescript` (versions 2 à 6). typescript@7, réécrit en Go, n'en publie pas encore.
**Workaround** : `options.parser: 'swc'` dans `.dependency-cruiser.cjs`, avec `@swc/core` en devDependency. Le type-only est bien détecté (`dependencyTypes` contient `type-only`). L'avertissement reste affiché à chaque exécution et on l'ignore. Toujours contrôler la ligne « N modules » : si elle retombe à 0, rien n'a été analysé.
**Référence** : `.dependency-cruiser.cjs`, `pnpm-workspace.yaml`.

## dependency-cruiser voit les paquets npm sous `node_modules/.pnpm/<pkg>@<v>/node_modules/<pkg>/` (2026-09-25)

**Découvert** : #31, règle `domain-no-ui-packages`.
**Symptôme** : une règle `to.path: '^node_modules/react/'` ne se déclenche jamais, même quand `domain/` importe React.
**Cause** : avec pnpm, le chemin résolu passe par le store virtuel `.pnpm`.
**Workaround** : ancrer sur le segment final, `'/node_modules/(react|dexie|…)/'`, et vérifier chaque nouvelle règle avec un fichier fautif temporaire.
**Référence** : `.dependency-cruiser.cjs`.

## `pnpm add` d'un paquet à postinstall ajoute la clé factice `'<pkg>': set this to true or false` dans `allowBuilds` (2026-09-25)

**Découvert** : #31, ajout de `@swc/core`.
**Symptôme** : `pnpm install --frozen-lockfile` échoue d'abord sur « Ignored build scripts ». Une fois la vraie clé ajoutée à la main, il échoue sur `duplicate mapping key`.
**Cause** : pnpm 12 est strict sur les scripts de build. Il écrit une entrée d'attente dans `pnpm-workspace.yaml`, et cette entrée casse l'installation en CI.
**Workaround** : remplacer cette ligne par `'<pkg>': false` (ou `true`) avec un commentaire qui justifie le choix, comme pour `msw`.
**Référence** : `pnpm-workspace.yaml`.

## `vi.mock` doit viser le fichier qui déclare le symbole, pas un dossier ni un ancien barrel (2026-09-25)

**Découvert** : #31, suppression des `index.ts`.
**Symptôme** : un `vi.mock('@/db', …)` qui remplaçait `useDbStatus` n'agit plus une fois le composant passé à un import direct (`@/lib/db/hooks`). Le test lit la vraie base.
**Cause** : Vitest remplace un module par son identifiant résolu. Mocker le barrel ne touche pas le fichier que le code importe réellement.
**Workaround** : un `vi.mock` par fichier source (`@/lib/db/hooks` pour `useDbStatus`, `@/lib/db/persistence` pour `usePersistenceStatus`, `@/lib/db/sessions` pour `createSession`).
**Référence** : `src/features/home/home-page.test.tsx`, `src/features/create-session/hooks/use-create-form.test.ts`.

## `import('@tabler/icons-react')` fait fuiter les 2,8 Mo d'icônes dans le bundle initial (2026-09-25)

**Découvert** : F07, tâche 6 (vérification du build).
**Symptôme** : `pnpm build` produit un chunk de 2,8 Mo au nom trompeur (`db-status-banner-*.js`), importé **statiquement** par l'accueil, `/new` et le validateur. `validate-*` tombe de 196 à 104 kB : les icônes ont été déplacées dans ce chunk partagé.
**Cause** : l'import dynamique vise le même module barrel que les imports statiques par nom de l'UI (`IconSun`, `IconX`…). Rollup place alors le barrel et tout son espace de noms dans un chunk partagé par tous.
**Workaround** : importer dynamiquement un module **distinct**, `import('@tabler/icons-react/dist/esm/icons/index.mjs')` (le paquet n'a pas de champ `exports`), déclaré dans `src/lib/tabler-icons-index.d.ts`. Contrôler après chaque build : `for f in dist/assets/*.js; do grep -l "from\"./icons-" $f; done` doit rester vide. `dist/esm/dynamic-imports.mjs` de Tabler 3.48 est inutilisable : il pointe vers des `.ts` absents.
**Référence** : `src/components/category-icon.tsx`, `vite.config.ts` (`chunkSizeWarningLimit`).

## Deux `LocaleProvider` imbriqués qui posent `lang` : le parent écrase l'enfant au montage (2026-09-25)

**Découvert** : F07, tâche 2.
**Symptôme** : une session `locale: 'en'` sous la racine `fr` donne `lang="fr"` dès le premier rendu.
**Cause** : React exécute les effets (`useLayoutEffect` compris) de l'enfant **avant** ceux du parent. Si chaque niveau écrit sur le DOM, c'est le plus externe qui gagne.
**Workaround** : un seul propriétaire écrit sur le DOM, et les niveaux imbriqués se déclarent auprès de lui par un état. C'est le principe des portées (D60), appliqué à `AppearanceProvider` et `LocaleProvider`. Une portée garde sa place dans la pile même quand elle est re-mémoïsée (`register` + `update` par `useId`).
**Référence** : `src/lib/i18n/locale-context.tsx`, `src/app/appearance-provider.tsx`.

## `vi.resetModules()` remet à zéro le cache d'un module : un test de « nouvelle tentative » passe alors même sur le code bogué (2026-09-25)

**Découvert** : F07, tâche 5, tour de correction 1.
**Symptôme** : un test qui simule un échec puis un succès de chargement passe avec et sans le correctif.
**Cause** : `vi.resetModules()` réinstancie le module testé, et donc son cache au niveau du module. Le test simule un rechargement de page, pas un remontage dans la même session.
**Workaround** : extraire la logique de cache dans une fabrique injectable (`createIconLoader(importIcons)`) et la tester directement avec un faux importeur. Vérifier que le test devient rouge quand on retire le correctif.
**Référence** : `src/components/category-icon.loader.test.tsx`.

## `@shikijs/langs` et `@shikijs/themes` introuvables avec pnpm : passer par `shiki/langs/*.mjs` (2026-09-26)

**Découvert** : F08, sondage avant le plan.
**Symptôme** : `import('@shikijs/themes/github-light')`, l'exemple de la doc Shiki, échoue avec `ERR_MODULE_NOT_FOUND`.
**Cause** : ce sont des dépendances transitives de `shiki`, que pnpm (isolation stricte) ne rend pas résolubles depuis le projet.
**Workaround** : importer les sous-chemins réexportés par `shiki` : `import('shiki/langs/php.mjs')`, `import('shiki/themes/github-dark.mjs')`. `rootStyle` de `codeToTokens` est par ailleurs une **chaîne** (`--shiki-light:#24292e;…`), pas un objet : `parseCssVariables` la découpe.
**Référence** : `src/lib/markdown/highlighter.ts`.

## `prose-invert` écrase les couleurs du thème de la config en mode sombre (2026-09-26)

**Découvert** : F08, plan.
**Symptôme** : avec `dark:prose-invert`, le texte markdown reprend les gris de Tailwind en sombre, quel que soit le thème de la config.
**Cause** : `prose-invert` réaffecte les variables `--tw-prose-*` à ses propres couleurs `--tw-prose-invert-*`.
**Workaround** : brancher `--tw-prose-*` sur les tokens shadcn (qui basculent déjà sous `.dark`) dans un bloc `.prose` **hors `@layer`**, pour qu'il l'emporte sur la couche `utilities` de `@tailwindcss/typography` ; pas de `prose-invert`.
**Référence** : `src/index.css` (bloc `.prose`).

## `updateSession` se résout avant que `useLiveQuery` livre la session écrite (2026-09-27)

**Découvert** : F09, revue finale.
**Symptôme** : juste après un tirage, un clic tombant avant le rafraîchissement de la liveQuery trouvait la grille réactivée et affichait « Une question est déjà en cours » (la transaction refusait correctement le second tirage).
**Cause** : la promesse de `updateSession` se résout à la fin de la transaction ; la liveQuery relit ensuite IndexedDB et ne pousse la nouvelle session que quelques millisecondes plus tard. Un `busy` remis à `false` dans le `finally` rouvre l'écran sur des données périmées.
**Workaround** : garder `busy` vrai tant que `session.updatedAt` (prop) est antérieur à l'`updatedAt` renvoyé par l'écriture (chaînes ISO, comparaison lexicale). Hypothèse : horloge unique et liveQuery qui finit par livrer ; une liveQuery figée laisserait l'écran verrouillé jusqu'au rechargement.
**Référence** : `src/features/session/hooks/use-passage-actions.ts`.

## Un bouton `disabled` ne déclenche pas d'infobulle ; l'envelopper dans un `span tabIndex` fait tomber Sonar (2026-09-27)

**Découvert** : F09, tâche 5 et revue finale.
**Symptôme** : l'infobulle « Plus de question disponible » d'une catégorie épuisée ne s'ouvrait ni au survol ni au focus ; le contournement par `<span tabIndex={0}>` exigeait de désactiver `jsx-a11y/no-noninteractive-tabindex`, règle que SonarQube (S6845) signale malgré le commentaire oxlint.
**Cause** : un `<button disabled>` n'émet ni événement de pointeur ni focus.
**Workaround** : le `Button` est lui-même le déclencheur (`TooltipTrigger render={<Button …/>}`), avec `aria-disabled="true"`, un clic neutralisé dans le handler et le motif en `aria-describedby` vers un `span sr-only`. Si une montée de Base UI se met à gérer `aria-describedby` sur le déclencheur, revérifier que le motif n'est ni perdu ni annoncé deux fois.
**Référence** : `src/features/session/components/category-grid.tsx`.

## Attendre un texte déjà présent laisse un test d'écran continuer avant l'écriture (2026-09-27)

**Découvert** : F09, tâche 5.
**Symptôme** : `passage-example.test.tsx` échouait par intermittence après une note de `0`.
**Cause** : `findByText('Score brut : 0')` réussissait immédiatement sur l'état initial (déjà 0), avant que la note soit écrite et relue.
**Workaround** : attendre un changement qui n'existe qu'après l'écriture (`waitForElementToBeRemoved` du panneau de question, nouvelle valeur différente de l'ancienne). Note : `toBeVisible()` de jest-dom sait qu'un contenu de `<details>` fermé est invisible, l'assertion est fiable.
**Référence** : `src/features/session/passage-example.test.tsx`.

## Les variantes `dark:` du `Button` outline écrasent un accent `data-[…]:border-*`, et `pointer-events-none` tue l'infobulle (2026-09-27)

**Découvert** : F09, validation dans le navigateur (invisible en jsdom, qui ne calcule ni la cascade CSS ni `pointer-events`).
**Symptôme** : en mode sombre, les cartes de catégorie gardaient toutes la bordure `--input` au lieu de leur couleur ; l'infobulle d'une catégorie épuisée ne s'ouvrait qu'au focus clavier, jamais au survol.
**Cause** : `dark:border-input` du variant `outline` a la même spécificité que `data-[colored=true]:border-[…]` et vient après dans la feuille. `aria-disabled:pointer-events-none` empêchait la souris d'atteindre le déclencheur.
**Workaround** : répéter l'accent sous `dark:` (`dark:data-[colored=true]:border-[var(--category-color)]`) ; sur un bouton `aria-disabled` porteur d'infobulle, `cursor-not-allowed` et clic neutralisé dans le handler, jamais `pointer-events-none`. Toute retouche visuelle de la grille se vérifie dans un vrai navigateur, dans les deux modes.
**Référence** : `src/features/session/components/category-grid.tsx`.

## SonarQube (S9153) exige un callback `queryBy*` dans `waitForElementToBeRemoved` (2026-09-27)

**Découvert** : F09, gate SonarQube de la PR #39 (2 bugs « Major », fiabilité notée C).
**Symptôme** : `waitForElementToBeRemoved(() => screen.getByText(…))` passe en local mais fait échouer le gate.
**Cause** : avec `getBy*`, un élément déjà absent lève une erreur de requête au lieu du message clair de `waitForElementToBeRemoved`.
**Workaround** : toujours `waitForElementToBeRemoved(() => screen.queryBy…(…))`.
**Référence** : `src/features/session/passage-example.test.tsx`.

## Un helper de test qui prend « la » liste de l'écran casse dès qu'une deuxième liste apparaît (2026-09-29)

**Découvert** : F11, revue finale (test « Review Focus 2 » en échec 5 fois sur 6).
**Symptôme** : `categoryButton('A')` lève « bouton de catégorie « A » introuvable » de façon intermittente, juste après une réinitialisation.
**Cause** : le helper faisait `findByRole('list')` en supposant une seule liste à l'écran. `FinalScreen` ajoute une `<ol>` (détail du passage) qui contient aussi le libellé de catégorie ; selon le moment du rendu, la requête attrapait l'`<ol>` encore montée, sans bouton.
**Workaround** : le helper attend (`waitFor`) une `<ul>` contenant un bouton au libellé voulu. Tout helper de requête de l'écran de passage doit viser son conteneur précis, jamais le premier élément d'un rôle générique.
**Référence** : `src/testing/passage-assertions.ts`.

## Une action de fond qui passe par le verrou `busy` fait perdre le clic suivant (2026-09-29)

**Découvert** : F12, revue finale (sauvegarde différée du commentaire).
**Symptôme** : l'examinateur tape un commentaire puis clique aussitôt sur une note ou une catégorie : le clic est parfois ignoré, et l'écran clignote désactivé à chaque pause de frappe.
**Cause** : le `mousedown` retire le focus du champ, le blur lance la sauvegarde, `run` passe `busy` à vrai de façon synchrone ; le bouton est `disabled` au moment où le `click` arrive.
**Workaround** : une action qui ne change aucun état de passage n'utilise pas `run` (`setComment` appelle `updateSession` directement). Voir CONVENTIONS « Transition de passage ».

## Nouveau sous-module base-ui : « Invalid hook call » au premier chargement en dev (2026-09-29)

**Découvert** : F12, vérification dans Chromium après l'ajout de `tabs`.
**Symptôme** : au premier chargement de l'écran après l'ajout d'un composant shadcn, la console montre « Invalid hook call » / « Cannot read properties of null (reading 'useRef') » dans `TabsRoot`, puis la page se recharge seule.
**Cause** : Vite découvre `@base-ui/react/tabs`, l'optimise et recharge ; pendant ce court instant, deux copies de React (hachages `?v=` différents) cohabitent.
**Workaround** : aucun en production (build statique). En dev, recharger ; si ça gêne, ajouter le sous-chemin à `optimizeDeps.include`.

## Intercepter une levée synchrone et un rejet : ni `try` + `.catch`, ni `new Promise` (2026-09-29)

**Découvert** : F12, gate SonarQube de la PR #43 (`use-autosave.ts`).
**Symptôme** : `try { return save(v).catch(() => false) } catch { return Promise.resolve(false) }` fait tomber le gate (S4822, « bug » majeur : le `try` serait redondant avec `.catch`, alors qu'il attrape la levée synchrone) ; le contournement `new Promise((resolve) => resolve(save(v))).catch(() => false)` est ensuite signalé S4634 (« promesse triviale »).
**Workaround** : une fonction `async` : `try { return await save(v) } catch { return false }`. Le corps s'exécute jusqu'au premier `await`, donc `save` est appelé tout de suite ; `return await` n'est pas redondant dans un `try` (S4326 ne s'applique pas).
**Référence** : `src/features/session/hooks/use-autosave.ts`.


## oxlint refuse `role="status"` / `role="img"` : prendre la balise native (2026-09-29)

**Découvert** : F13, dialogue d'ajout d'étudiant et icône de l'étudiant projeté.
**Symptôme** : `<p role="status">` et `<svg role="img" aria-label="…">` font échouer `pnpm check` (règle jsx-a11y `prefer-tag-over-role`).
**Workaround** : `<output>` porte le rôle implicite `status` (`getByRole('status')` le trouve) ; pour une icône Tabler, `aria-label` seul sur le `<svg>` suffit : le composant ne pose pas `aria-hidden`, le libellé entre dans le nom accessible du bouton parent.
**Référence** : `src/features/session/components/add-student-dialog.tsx`, `student-row.tsx`.

## Désactiver un bouton pendant l'écriture qu'il déclenche fait perdre le focus clavier (2026-09-29)

**Découvert** : F13, revue finale (liste des étudiants).
**Symptôme** : une ligne `disabled={busy}` devient désactivée juste après Entrée ; le navigateur renvoie alors le focus sur `<body>` et la tabulation repart du haut de la page. jsdom ne reproduit pas ce retour du focus : un test ne peut vérifier que `toBeEnabled()`.
**Workaround** : ne pas désactiver sur `busy` un contrôle qu'on active au clavier en série (lignes de liste, déclencheur de dialogue) ; le verrou `inFlight` de `run` écarte déjà les appels concurrents. Vérifier le focus dans un vrai navigateur.
**Référence** : `src/features/session/components/student-row.tsx`, `students-tab.tsx`.

## Un composant monté à l'arrivée de la question ne voit jamais de « nouveau » tirage (2026-09-29)

**Découvert** : F14, revue de l'animation de tirage.
**Symptôme** : `DrawReveal` retenait le `drawnAt` de son premier rendu et n'animait qu'un `drawnAt` différent : l'animation ne se jouait jamais dans l'application. Un tirage passe toujours de « aucune question en cours » à « une question » (on ne tire pas par-dessus une question `pending`), donc le composant, rendu seulement quand une question existe, est monté à neuf avec le nouveau `drawnAt` comme valeur initiale. Les tests unitaires passaient parce qu'ils changeaient `drawnAt` sans démonter le composant, ce que le domaine n'autorise pas.
**Workaround** : retenir la valeur initiale au niveau qui reste monté pour l'étudiant (`StudentScreen`, remonté par `key` à chaque changement d'étudiant) et tester par le vrai parcours (session sans question → ajout d'une question `pending` en base).
**Référence** : `src/features/present/components/student-screen.tsx`, `draw-reveal.tsx`.

## `pnpm preview` en `webServer` Playwright laisse un serveur orphelin, réutilisé avec un vieux build (2026-09-29)

**Découvert** : F14, mise en place de l'e2e.
**Symptôme** : après un `pnpm e2e`, un `vite preview` restait sur le port 4173 ; le run suivant, avec `reuseExistingServer`, testait l'ancien build sans prévenir (échecs inexpliqués, ou succès sur du code qui n'était plus le bon). Playwright tue le processus `pnpm`, pas son enfant `vite`.
**Workaround** : `webServer.command` = `pnpm build && exec node_modules/.bin/vite preview --port 4173 --strictPort` : `exec` fait du serveur le processus suivi par Playwright. En cas de doute, `ss -ltnp | grep 4173` avant de relancer.
**Référence** : `playwright.config.ts`.

## Rolldown inline Recharts dans le chunk qui l'importe, invisible dans le manifeste (2026-09-30)

**Découvert** : F15, contrôle du bundle initial.
**Symptôme** : sans groupe `codeSplitting` nommé, Rolldown range Recharts et ses d3 dans le chunk de la route qui l'importe ; le manifeste Vite ne contient alors aucune clé `node_modules/recharts/…` ni chunk dédié, et un contrôle qui cherche Recharts dans le graphe initial passe sans rien voir, fuite ou pas.
**Workaround** : groupe nommé `recharts` dans `build.rolldownOptions.output.codeSplitting.groups` (clé `_recharts-<hash>.js` dans le manifeste), et garde-fou de non-vacuité dans `check:bundle` : échec si ce chunk n'existe pas ou si la route des statistiques ne l'atteint plus.
**Référence** : `vite.config.ts`, `scripts/check-initial-bundle.ts` (`findVacuityProblems`).

## Un groupe `codeSplitting` embarque ses dépendances partagées : React finit dans `_recharts-*` (2026-09-30)

**Découvert** : F15, contrôle du bundle initial.
**Symptôme** : `includeDependenciesRecursively` vaut `true` par défaut ; le groupe `recharts` tire donc aussi React, `clsx`, `use-sync-external-store`…, que l'application partage avec Recharts. L'entrée importe alors `_recharts-*` statiquement pour obtenir React, et `check:bundle` échoue. La parade tentante `{ test: /node_modules[\\/]/, tags: ['$initial'] }` range tout le socle initial dans `vendor`, y compris un Recharts qui fuirait, et aveugle le contrôle.
**Workaround** : groupe `vendor` en liste blanche (react, react-dom, scheduler, clsx, tiny-invariant, use-sync-external-store), placé avant `recharts`. Il échoue du bon côté : si la liste dérive, `check:bundle` rougit en CI et on la complète.
**Référence** : `vite.config.ts`.

## `autoCodeSplitting` met l'`errorComponent` dans un chunk paresseux (2026-09-30)

**Découvert** : F15, revue finale.
**Symptôme** : TanStack Router découpe par défaut `errorComponent` dans son propre chunk (`…stats.tsx?tsr-split=errorComponent` dans le manifeste). Quand le chunk de l'écran échoue à se charger (hors ligne, fichiers supprimés par un redéploiement), celui de l'`errorComponent` échoue aussi : l'écran d'erreur prévu ne s'affiche jamais. Les tests Vitest ne le voient pas (pas de découpage sous Vitest).
**Workaround** : `codeSplitGroupings: [['component']]` dans les options de la route : seul le composant part en chunk paresseux, l'`errorComponent` reste dans le fichier de route chargé d'emblée. Vérifier après `pnpm build` qu'aucune clé `tsr-split=errorComponent` ne figure dans `dist/.vite/manifest.json` pour la route.
**Référence** : `src/routes/session.$sessionId_.stats.tsx`.

## write-excel-file sérialise une `Date` par ses composantes UTC (2026-09-30)

**Découvert** : F16, écriture du classeur.
**Symptôme** : une cellule `Date` s'ouvre dans Excel avec un décalage égal au fuseau local : la bibliothèque lit `getUTC*()` et non l'heure locale.
**Workaround** : décaler chaque date de `getTimezoneOffset()` avant l'écriture, pour que les composantes UTC soient celles de l'heure locale voulue.
**Référence** : `src/lib/xlsx/write-workbook.ts`.

## dependency-cruiser affiche « no TypeScript compiler detected » avec TypeScript 7 (2026-09-30)

**Découvert** : F16, règles `lib-xlsx-*`.
**Symptôme** : `pnpm deps` termine par l'avertissement `missing-typescript-transpiler` (TypeScript 7 hors de la plage supportée), qui laisse craindre des dépendances manquées.
**Workaround** : aucun besoin. Avec `parser: 'swc'`, les arêtes `import type` sont bien détectées (`type-only`), et les règles `lib-xlsx-only-export-types` et `lib-xlsx-export-types-import-type-only` s'appuient dessus. Ignorer l'avertissement.
**Référence** : `.dependency-cruiser.cjs` (`options.parser`).

## `check:bundle` ne garde que le graphe initial (2026-09-30)

**Découvert** : F16, revue finale.
**Symptôme** : un import statique d'une bibliothèque lourde depuis une route paresseuse (ex. `write-excel-file` via `lib/xlsx/`) n'entre pas dans le bundle initial : `check:bundle` reste vert, mais la bibliothèque est chargée avec la route au lieu de l'être à la demande.
**Workaround** : règle dependency-cruiser `lib-xlsx-dynamic-import-only`, qui n'autorise que `import()` vers `src/lib/xlsx/` (D35, D71).
**Référence** : `.dependency-cruiser.cjs`.

## `Closes #n` dans le corps d'une PR ne lie pas toujours le ticket (2026-09-30)

**Découvert** : PR #47 (F15) et #48 (F16).
**Symptôme** : `gh pr view <n> --json closingIssuesReferences` renvoie une liste vide malgré `Closes #n` en première ligne du corps ; le merge ne ferme pas le ticket.
**Workaround** : vérifier `closingIssuesReferences` à l'ouverture de la PR ; à défaut, fermer le ticket après le merge (`gh issue close <n> -c "Livré par #<pr>."`).
**Référence** : `docs/CONVENTIONS.md` § « Pull request — checklist ».

## SonarQube compte les dictionnaires fr/en comme du code dupliqué (2026-09-30)

**Découvert** : PR #48 (F16), gate en échec sur `new_duplicated_lines_density` (9,5 %, seuil 3).
**Symptôme** : un dictionnaire `Dictionary<P>` fr + en (ex. `src/domain/export/messages.ts`) a deux blocs de même structure ; le CPD de Sonar ignore les littéraux et signale tout le fichier.
**Workaround** : ajouter le fichier à `sonar.cpd.exclusions` dans `.sonarcloud.properties` (D61), comme `src/lib/i18n/ui-messages.ts`. Un petit dictionnaire de domaine (quelques clés) passe sous le seuil sans exclusion.
**Référence** : `.sonarcloud.properties`.

## `registerSW` en mode `prompt` recharge chaque onglet sans `onNeedReload`, et réémet `waiting` à chaque chargement (2026-09-30)

**Découvert** : revue finale F17, mesuré dans Chromium (copie de `dist/`, `sw.js` modifié d'un octet).
**Symptôme** : (1) sans `onNeedReload`, `registerSW` (vite-plugin-pwa 1.3.0) ajoute après `onNeedRefresh` un écouteur `controlling` qui fait `window.location.reload()` dans **chaque** onglet quand un autre onglet active la version ; (2) tant qu'une version attend, workbox-window réémet `waiting` à chaque chargement, donc `onNeedRefresh` revient : recharger sur « version en attente » boucle (259 chargements en 8 s) ; (3) `updateSW(true)` ne recharge jamais : il n'envoie que `SKIP_WAITING`, et rien du tout s'il n'y a plus de worker en attente.
**Workaround** : passer `onNeedReload: () => {}` ; distinguer `waiting` (rien à recharger) et `activated` (`controllerchange` venu d'un autre onglet) ; recharger l'onglet demandeur sur le `controllerchange` qui suit, ou tout de suite si `registration.waiting` est nul. Couvert par `e2e/update.spec.ts`.
**Référence** : `src/lib/pwa/pwa-update.ts`, D72, `node_modules/vite-plugin-pwa/dist/client/build/register.js`.

## Un `await` de haut niveau dans `main.tsx` fait découper l'appli en chunks supplémentaires (2026-09-30)

**Découvert** : correction de la règle Sonar S7785 (« Prefer top-level await over using a promise chain ») sur l'enregistrement du service worker, F17.
**Symptôme** : avec `const { registerSW } = await import('virtual:pwa-register')` au niveau de l'entrée, Rolldown émet 9 chunks de plus (`hooks-*`, `route-*`, `useNavigate-*`, `validate-*`…), et le pré-cache passe de 68 à 77 entrées. Le chargement initial fait donc plus de requêtes pour rien.
**Workaround** : garder l'entrée synchrone. L'import dynamique vit dans une fonction `async` d'un autre module (`src/lib/pwa/register-service-worker.ts`), appelée par `void registerServiceWorker()`. Sonar ne signale plus de chaîne de promesse, et le découpage ne bouge pas. Comparer le nombre d'entrées du pré-cache avant/après toute retouche de `main.tsx`.
**Référence** : `src/main.tsx`, `src/lib/pwa/register-service-worker.ts`, PR #50.

## L'avertissement `unknown_code_language` lit le texte brut, pas l'arbre markdown (2026-09-30)

**Découvert** : revue finale F18.
**Symptôme** : `fenceLanguages` (heuristique ligne par ligne) ne voit pas les blocs dans une citation (`> ```js`) ni dans une liste indentée de 4 espaces ou plus : pas d'avertissement pour eux. À l'inverse, une info string échappée (```` ```c\+\+ ````) ou avec entité (`c&#43;&#43;`) est décodée en `c++` par remark, donc colorée, mais l'heuristique voit le texte brut et avertit à tort.
**Workaround** : aucun nécessaire, l'avertissement n'est jamais bloquant. Le rendu, lui, repose sur l'arbre de react-markdown. Si le cas devient courant, extraire les langages avec `mdast-util-from-markdown` au lieu de l'heuristique.
**Référence** : `src/domain/config/code-fences.ts`, spec F18.

## Un `<header>` dans `<main>` est un `banner` en jsdom, pas dans un navigateur (2026-09-30)

**Découvert** : revue finale F19.
**Symptôme** : dans jsdom / Testing Library, le `<header>` de `PageShell`, placé dans `<main>`, est exposé avec le rôle `banner`. Les vrais navigateurs (HTML-AAM) ne l'exposent pas comme repère `banner` à cet endroit (seul un `header` hors `main`, `article`, `section`… le devient).
**Cause** : le mapping d'`aria-query` / dom-accessibility-api utilisé par Testing Library ne tient pas compte de l'ancêtre sectionnant.
**Workaround** : aucun, les tests s'appuient sur le mapping jsdom (`expectColorModeToggleLast`, `bannerInteractiveNames` dans `src/testing/page-shell-assertions.ts`, `add-student.test.tsx`…). Si Testing Library s'aligne sur HTML-AAM, ces tests échoueront d'un coup : passer l'aide sur `main > header`.
**Référence** : `src/components/page-shell.tsx`, `src/testing/page-shell-assertions.ts`, D75.

## base-ui garde un `dialog` fermé dans le DOM pendant son animation de sortie (2026-09-30)

**Découvert** : F21, relecture de la tâche 2.
**Symptôme** : un test « le tiroir reste ouvert » qui vérifie `getByRole('dialog', …)` passe même si le code ferme le tiroir : juste après la fermeture, le popup est toujours là, avec `role="dialog"`.
**Cause** : le `Dialog` base-ui (et donc le `Sheet` shadcn) garde le popup monté le temps de sa sortie, marqué `data-closed` / `data-ending-style`, puis le démonte.
**Workaround** : pour « ouvert », laisser passer la fenêtre de fermeture puis vérifier l'état (`data-open` présent, `data-closed` et `data-ending-style` absents) : `expectPanelStaysOpen()` dans `src/testing/side-panel-assertions.ts`. Pour « fermé », attendre la disparition (`waitFor(() => expect(…).not.toBeInTheDocument())`). Ne pas passer par les faux timers : base-ui ne termine alors jamais sa fermeture.
**Référence** : `src/features/session/examiner-view.test.tsx`, `add-student.test.tsx`, D76.

## Un test « enregistré au démontage » passe sans le flush si son attente dépasse le délai d'autosave (2026-09-30)

**Découvert** : F21, revue finale.
**Symptôme** : le test « commentaire tapé puis tiroir fermé avant le délai : enregistré en base » restait vert après la suppression du `flush()` de démontage de `use-autosave`.
**Cause** : `waitFor` attend 1000 ms par défaut, plus que le délai de l'autosave (500 ms) : le minuteur, jamais annulé, enregistre de lui-même pendant l'attente.
**Workaround** : borner l'attente sous le délai (`waitFor(…, { timeout: 250 })`) et le dire en commentaire ; vérifier par mutation (retirer le flush → le test doit échouer).
**Référence** : `src/features/session/student-tab.test.tsx`, `src/features/session/hooks/use-autosave.ts`.

## Depuis F22, la vue de passage contient deux fois le nom de l'étudiant et l'énoncé (2026-09-30)

**Découvert** : revue finale de F22.
**Symptôme** : dans un test de la vue examinateur, `getByText('…')` sur le nom de l'étudiant ou l'énoncé en cours peut lever « Found multiple elements ».
**Cause** : l'aperçu de la vue projetée (`ProjectionPreview`) rend le même contenu dans son canevas. Celui-ci est `aria-hidden` et `inert`, ce qui le retire des requêtes par rôle (`getByRole`), mais pas de `getByText` / `getAllByText`, qui lisent tout le DOM.
**Workaround** : préférer `getByRole(…, { name })`, ou restreindre la requête : `within(<zone examinateur>)` pour la page, `canvas.textContent` (`[data-projection-canvas]`) pour l'aperçu.
**Référence** : `src/features/session/components/projection-preview.tsx`, `src/features/session/projection.test.tsx`.

## Le navigateur Playwright MCP plante sur un téléchargement déclenché par la page (2026-10-01)

**Découvert** : vérification visuelle de F20 (export Excel depuis la carte de session).
**Symptôme** : un clic `browser_click` sur « Exporter en Excel » renvoie « Cannot read properties of undefined (reading 'url') » et la page repasse à `about:blank`. Un clic déclenché depuis `browser_evaluate` ferme ensuite le navigateur (« Target page, context or browser has been closed »).
**Cause** : l'outil MCP gère mal l'événement de téléchargement (blob `a[download]` créé par `lib/download` / write-excel-file). Le test e2e Playwright du dépôt (`waitForEvent('download')`) n'a pas ce problème.
**Workaround** : vérifier un export par les tests unitaires, par l'e2e (`e2e/export.spec.ts`), ou à la main. Dans le MCP, se limiter aux vérifications sans téléchargement (réseau, rendu).
**Référence** : `src/lib/download.ts`, `e2e/export.spec.ts`.

## CodeMirror ne rend que les lignes visibles (2026-10-01)

**Découvert** : e2e de l'éditeur de config (F26).
**Symptôme** : après avoir remplacé tout le texte (Ctrl+A puis saisie), un `.cm-lintRange-error` attendu près du début du document est introuvable dans le DOM, alors que l'issue est bien dans la liste.
**Cause** : CodeMirror virtualise le rendu : seules les lignes proches de la zone visible existent dans le DOM. Après un remplacement, la vue est en fin de document.
**Workaround** : amener la ligne à l'écran avant d'asserter (clic sur l'issue, qui appelle `reveal` et fait défiler), ou asserter sur l'état de l'éditeur plutôt que sur le DOM. Même chose pour la ligne active et les numéros de ligne.
**Référence** : `e2e/config-editor.spec.ts`, `src/features/config-editor/components/json-editor.tsx`.

## Un fichier déposé sur CodeMirror est inséré par l'éditeur lui-même (2026-10-01)

**Découvert** : revue de la tâche 7 de F26.
**Symptôme** : déposer un fichier `.json` sur le texte de l'éditeur pouvait dupliquer le contenu : CodeMirror insère le texte du fichier au point de dépôt, puis le gestionnaire `onDrop` de la page remplace le document.
**Cause** : le gestionnaire `drop` natif de `@codemirror/view` lit le fichier avec `FileReader` et n'appelle que `preventDefault()` ; l'événement remonte ensuite jusqu'à React.
**Workaround** : `Prec.highest(EditorView.domEventHandlers({ drop: (e) => (e.dataTransfer?.files.length ?? 0) > 0 }))` dans `JsonEditor` : renvoyer `true` court-circuite l'insertion de CodeMirror sans arrêter la propagation vers React.
**Référence** : `src/features/config-editor/components/json-editor.tsx`.

## Un `LocaleProvider` imbriqué change `<html lang>` pour toute la page (2026-10-01)

**Découvert** : revue finale de F26 (aperçu de l'éditeur dans la langue de la config).
**Symptôme** : envelopper l'aperçu d'une config `en` dans un `LocaleProvider` sous une page `fr` traduit bien l'aperçu, mais `<html lang>` passe à `en` pour toute la page tant que l'aperçu est monté (lecteurs d'écran, césure, correcteur).
**Cause** : un `LocaleProvider` imbriqué appelle `declare(locale)` auprès du provider racine, qui écrit sur `<html>` la dernière locale déclarée. C'est voulu pour une vue de session qui prend toute la page, pas pour un fragment.
**Workaround** : `LocaleScope` (non déclarant) fixe la langue des descendants sans appeler `declare`, et l'appelant pose `lang` sur le conteneur local. Garder l'habillage dans la langue de l'interface (`ui` reçu en prop, `lang={ui.locale}` sur les intitulés).
**Référence** : `src/lib/i18n/locale-context.tsx`, `src/features/config-editor/components/config-preview.tsx`.

## `Menu.RadioItem` et `Menu.CheckboxItem` de base-ui ne ferment pas le menu au clic (2026-10-01)

**Découvert** : bug #76 (menu de thème).
**Symptôme** : après le choix d'un mode, la valeur change mais le menu reste ouvert ; dans un vrai navigateur, il capte le clic suivant sur la page (un tirage, une note) jusqu'à Échap ou un clic extérieur. jsdom ne reproduit pas la capture du clic : seul l'e2e la montre.
**Cause** : `closeOnClick` vaut `false` par défaut sur `Menu.RadioItem` et `Menu.CheckboxItem` (choix multiples attendus), alors qu'il vaut `true` sur `Menu.Item`.
**Workaround** : passer `closeOnClick` sur l'item quand un choix doit refermer le menu. base-ui rend alors le focus au déclencheur, au clavier comme à la souris.
**Référence** : `src/components/color-mode-toggle.tsx`, `e2e/color-mode.spec.ts`, `node_modules/@base-ui/react/menu/radio-item/MenuRadioItem.d.ts`.

## Un test qui sème une session incohérente la lit désormais comme endommagée (2026-10-01)

**Découvert** : F31.
**Symptôme** : un test qui écrivait en base une session aux données incohérentes (attempt `scored` sans `score`, question absente de la config, ajustement hors bornes) obtient un `DamagedSession` au lieu d'une `Session` ; 51 tests existants ont dû être corrigés.
**Cause** : toute lecture IndexedDB passe par `checkStoredSession` (mêmes règles que l'import de backup).
**Workaround** : les fixtures doivent passer `checkStoredSession` (`makeConfig` contient les questions `a-1` à `a-10`) ; `healthy()` (`src/testing/healthy-session.ts`) réduit le type `Session | DamagedSession` à `Session` dans les assertions.
**Référence** : `src/testing/healthy-session.ts`, `src/domain/backup/stored-session.ts`.

## jsdom n'a pas `CSS.supports` : le validateur de `lib/db` retombe sur « tout accepter » (2026-10-01)

**Découvert** : F31.
**Symptôme** : sous jsdom, valider une couleur de thème par `CSS.supports` lèverait un `TypeError`.
**Cause** : jsdom n'implémente pas `CSS.supports`.
**Workaround** : le validateur renvoyé par `loadReadStored()` (`src/lib/db/damaged-session.ts`) détecte l'absence de `CSS.supports` et injecte un `cssSupports` qui accepte tout. Un test qui veut une couleur refusée doit fournir sa propre fonction à `checkStoredSession`.
**Référence** : `src/lib/db/damaged-session.ts`.

## Écrire un enregistrement brut endommagé dans un test : `db.table('sessions').put(...)` (2026-10-01)

**Découvert** : F31.
**Symptôme** : `db.sessions.put(donnee as Session)` pour semer une session endommagée échoue à oxlint (règle type-aware sur les `as`, cf. entrée précédente sur oxlint).
**Cause** : `db.sessions` est typée `EntityTable<Session, 'id'>` ; il faudrait un cast.
**Workaround** : passer par `db.table('sessions').put(brut)`, non typée, qui accepte tout objet porteur d'un `id`.
**Référence** : tests de `src/lib/db/`.

## Un `import()` attendu dans une transaction Dexie la valide trop tôt : `PrematureCommitError` (2026-10-01)

**Découvert** : F31 (correctif R2, validateur de `lib/db` chargé à la demande).
**Symptôme** : `updateSession` lève `PrematureCommitError: Transaction committed too early` à la première écriture, quand le validateur n'est pas encore chargé ; les suivantes passent (module en cache), d'où un bug qui ne se voit qu'une fois par chargement de page.
**Cause** : IndexedDB valide une transaction dès qu'aucune requête n'est en attente à la fin d'une tâche ; attendre une promesse non Dexie (`await import(...)`, `fetch`) dans le callback de `db.transaction` laisse la transaction sans requête. Dans un querier `liveQuery`, le même `await` peut faire perdre la zone Dexie : les lectures faites *après* ne sont plus observées.
**Workaround** : charger le module **avant** `db.transaction(...)` et valider de façon synchrone dedans ; dans `getSession` / `listSessions` (queriers de `useLiveQuery`), faire toutes les lectures Dexie d'abord, attendre le validateur ensuite. Test : `sessions.test.ts`, « validateur pas encore chargé » (`vi.resetModules()` puis import neuf de `./sessions`), rouge avec l'`await` dans la transaction.
**Référence** : `src/lib/db/sessions.ts`, `src/lib/db/damaged-session.ts` (`loadReadStored`).
**Garde de bundle** : `e2e/languages.spec.ts`, « le validateur de lib/db reste hors de la clôture statique de l'accueil » (échoue si un import statique de `@/domain/backup/stored-session` entre dans `lib/db`).

## La clé du catalogue `shiki/langs` dans le manifeste dépend du graphe d'imports (2026-10-01)

**Découvert** : F31 (correctif R2).
**Symptôme** : `check:bundle` signale « aucun chunk /^_langs[.-]/ » alors que le catalogue est bien chargé à la demande.
**Cause** : importé statiquement par plusieurs chunks, Rolldown en fait un chunk partagé `_langs-<hash>.js` ; importé statiquement par un seul (`code-languages.ts`) et en `import()` par le surligneur, il devient une entrée dynamique à son chemin de module (`node_modules/.pnpm/shiki@…/shiki/dist/langs.mjs`). Un groupe `codeSplitting` nommé ne le capture pas (entrée dynamique) : il produit un `_langs-*` vide qui rendrait le contrôle vacant, et avec `includeDependenciesRecursively` par défaut il avale l'assistant de préchargement de Vite et fuit dans l'entrée.
**Workaround** : `SHIKI_CHUNK` (`scripts/check-initial-bundle.ts`) et `CATALOG_KEY` (`e2e/languages.spec.ts`) acceptent les deux formes de clé ; ne pas ajouter de groupe `langs`.
**Référence** : `scripts/check-initial-bundle.ts`, `e2e/languages.spec.ts`.

## Une écriture IndexedDB lancée à `pagehide` ne finit pas avant le déchargement (2026-10-01)

**Découvert** : F30 (#78), e2e `comment-reload.spec.ts` (`page.reload()` juste après la frappe).
**Symptôme** : un commentaire tapé puis une actualisation immédiate de la page perd la saisie, bien que `useAutosave` flushe à `pagehide`.
**Cause** : `updateSession` enchaîne un `import()` mémoïsé du validateur, une lecture puis un `put` ; en Chromium, le document est déchargé avant que `put` ne soit appelé. Le flush à `pagehide` n'est donc qu'un plus.
**Workaround** : copie **synchrone** de la saisie dans `localStorage` à chaque frappe (`comment-draft.ts`, D82), supprimée quand l'enregistrement de cette valeur réussit, relue au montage de `CommentField`. Le test e2e ne doit ni attendre ni quitter le champ avant `reload()`.
**Référence** : `src/features/session/comment-draft.ts`, `src/features/session/hooks/use-autosave.ts`, `e2e/comment-reload.spec.ts`, D82.

## jsdom démonte un dialogue Base UI dès sa fermeture et masque `main` quand il est ouvert (2026-10-01)

**Découvert** : F34 (#82), tests du contrôleur d'import.
**Symptôme** : un test « le contenu du dialogue reste affiché pendant sa fermeture » passe sans correctif ; `getByRole('main')` échoue pendant qu'un dialogue modal est ouvert.
**Cause** : jsdom n'a pas d'animation, Base UI démonte donc le popup aussitôt `open` passé à `false` (rien à observer) ; un dialogue modal pose `aria-hidden` sur le reste de la page.
**Workaround** : tester la rétention du contenu par son hook (`useRetained`) ; chercher l'élément de page avec `getByRole('main', { hidden: true })` pour y simuler un dépôt pendant qu'un dialogue est ouvert. Un dépôt sur le dialogue lui-même remonte bien au contrôleur dans le navigateur (les portails React suivent l'arbre React).
**Référence** : `src/features/home/hooks/use-retained.ts`, `src/features/home/components/import-controller.test.tsx`.

## Le stub `matchMedia` des tests annonce `prefers-reduced-motion` : un tirage animé n'y montre pas de cartes (2026-10-01)

**Découvert** : F33 (#81), test « deux homonymes à la suite » de `projected-screen.test.tsx`.
**Symptôme** : un test qui attend « pas de cartes de mélange » (`[data-card]`) passe même quand l'animation se déclenche à tort.
**Cause** : sous `prefers-reduced-motion`, `DrawReveal` remplace le mélange par un fondu (`animate-in`) ; selon le premier montage, le stub de test peut annoncer le mouvement réduit.
**Workaround** : pour prouver qu'aucune animation n'est jouée, vérifier l'absence des cartes **et** des classes d'animation (`[data-card], .draw-reveal, .animate-in`), et prouver le test rouge en retirant le correctif. Attention aussi aux preuves par `sed` : prettier peut fusionner les lignes visées, le retrait temporaire ne s'applique alors pas.
**Référence** : `src/components/projection/draw-reveal.tsx`, `src/components/projection/projected-screen.test.tsx`, `src/testing/match-media.ts`.

## Simuler un Shift+Reload ou une heure qui passe dans un e2e de service worker (2026-10-01)

**Découvert** : F36 (#84), `e2e/update.spec.ts`.
**Symptôme** : Playwright n'a ni Shift+Reload, ni moyen d'attendre une heure ; `page.reload()` garde le contrôleur, et un `registration.update()` lancé à la main par le test masque l'absence de vérification périodique.
**Workaround** : Shift+Reload = `context.newCDPSession(page)` puis `Page.reload` avec `ignoreCache: true` ; la page recharge sans contrôleur (`navigator.serviceWorker.controller === null`) alors qu'un worker est actif. Heure qui passe = `page.clock.install()` **avant** `goto`, puis `page.clock.fastForward('01:00:00')` : le `setInterval` de la page tourne, le service worker (horloge réelle) n'est pas touché. Pour un déploiement vu par la seule vérification périodique, modifier `sw.js` sans appeler `deploy()` (qui force `update()`).
**Référence** : `e2e/update.spec.ts`, `src/lib/pwa/pwa-update.ts`, D86.

## Le survol JSON de VS Code ignore `default` : passer par `markdownDescription` (2026-10-01)

**Découvert** : F32 (#80), revue finale de la branche.
**Symptôme** : un JSON Schema avec `description` et `default` n'affiche, au survol d'une clé dans VS Code, que la description ; le défaut n'apparaît nulle part.
**Cause** : `doHover` de `vscode-json-languageservice` n'utilise que `title`, `markdownDescription` (à défaut `description`) et les descriptions d'enum, jamais `default`.
**Workaround** : `buildConfigJsonSchema` recopie le défaut dans `markdownDescription` (`description` + « Défaut : `…` ») sur chaque nœud décrit, après `toJSONSchema` et après l'`override` d'icône. `description` reste brut, l'éditeur de l'app s'en sert.
**Référence** : `src/domain/config/json-schema.ts`, `src/domain/config/json-schema.test.ts`, D87.

## `check:bundle` ne voit pas l'accueil : la route `/` est un chunk paresseux (2026-10-01)

**Découvert** : #86 (budget du bundle), preuve d'acceptation.
**Symptôme** : `import * as Recharts from 'recharts'` ajouté dans `src/features/home/home-page.tsx` : `pnpm check:bundle` affiche toujours « Bundle initial sans recharts… », alors que l'accueil charge 99 Ko gzip de plus.
**Cause** : `autoCodeSplitting` de TanStack découpe le composant de chaque route, accueil compris (`src/routes/index.tsx?tsr-split=component`, entrée dynamique). La fermeture statique depuis `index.html` s'arrête avant lui.
**Workaround** : `check:bundle` et `check:budget` partent tous deux de l'entrée **et** de la route `/` (`HOME_ROUTE_KEY` dans `check-initial-bundle.ts`, D88).
**Référence** : `scripts/check-bundle-budget.ts`, `scripts/check-initial-bundle.ts`, D88.

## Un test d'écran sur une config avec `icon` charge tout l'index Tabler : plusieurs secondes sous la suite (2026-10-01)

**Découvert** : #87 (PR 1), en cherchant pourquoi `passage-example.test.tsx` dépassait 5 s sous `pnpm test`.
**Symptôme** : le test passe en ~1,2 s seul mais monte à 4,3 s sous la suite complète (délai porté à 15 s en F12). Le temps part par paliers : ~540 ms au premier montage de la route, ~430 ms au premier tirage, ~140 ms à la première note.
**Cause** : dès qu'une catégorie porte une `icon`, `CategoryIcon` importe `@tabler/icons-react/dist/esm/icons/index.mjs`, qui réexporte des milliers de modules d'icônes : Vitest les résout et les évalue un par un (~400 ms seul, bien plus quand les workers se disputent le CPU). Les blocs ```php ajoutent le chargement de Shiki (cœur, thèmes, grammaire, ~140 ms). Le premier montage de la route (découpage à la demande) reste, lui, inhérent (voir le piège du premier `findBy*`).
**Workaround** : dans un test qui ne vérifie ni les icônes ni la coloration, `vi.mock('@tabler/icons-react/dist/esm/icons/index.mjs', () => ({}))` (aucune icône rendue) et `highlight` remplacé par `() => Promise.resolve(null)` (code en texte brut). Mesuré : 4,3 s → ~2,1 s sous la suite, ~0,75 s seul, délai par défaut rétabli.
**Référence** : `src/features/session/passage-example.test.tsx`, `src/components/category-icon.tsx`, `src/lib/markdown/highlighter.ts`.

## Suite Vitest instable dès que la machine porte une autre charge : délais de 5 s frôlés, et deux tests qui finissaient trop tôt (2026-10-01)

**Découvert** : #87 (tests instables), mesures sur 20 suites complètes machine libre puis sous charge simulée (8 boucles `node -e 'for(;;){}'` sur 16 cœurs).
**Symptôme** : `pnpm test` vert 20 fois sur 20 machine libre (32,2 s), mais 4 à 5 suites sur 10 en échec dès que la moitié des cœurs est occupée (autre suite, e2e, `pnpm check`) : « Test timed out in 5000ms » sur « marque l'aperçu périmé… » (`config-editor-page.test.tsx`), puis sur le premier test des fichiers d'écran routés (`add-student`, `student-tab`, `stats-page`…). Plus rares : « Martin Zoé » introuvable dans la barre de titre (`add-student.test.tsx`), rejet « window is not defined » au démontage (`create-session-page.test.tsx`).
**Cause** : trois causes distinctes. (1) Saturation : par défaut Vitest lance un worker par cœur moins un (15) ; chaque fichier y recrée jsdom (~47 % du temps cumulé de la suite) et réévalue son graphe de modules, et le premier rendu d'un écran routé coûte ~0,8 s seul, 2,5 s sous la suite, 4,5 à 5,7 s sous charge. (2) `config-editor-page.test.tsx` rendait l'aperçu complet de la config d'exemple, donc l'index des icônes Tabler et Shiki avec la grammaire PHP : son deuxième test payait ces chargements lancés par le premier, 4,3 s machine libre (0,7 s de marge). (3) Deux tests attendaient un état déjà présent avant l'action (piège du 2026-09-27) : le titre « Oral de test » est déjà dans l'aperçu de l'écran de création, le test se terminait avant l'écriture et la navigation, et la route de session, chargée à la demande, finissait après le démontage, voire après le fichier ; la liste des catégories est déjà celle de l'étudiante active quand le tiroir se ferme, avant que la lecture en direct ait rendu le nouvel étudiant actif.
**Workaround** : `maxWorkers: '75%'` dans `vite.config.ts` (12 workers sur 16, 3 sur 4 cœurs comme le défaut) ; doublures d'icônes et de Shiki dans `config-editor-page.test.tsx` et `config-preview.test.tsx` (voir le piège précédent) ; attendre l'écran d'arrivée (`pathname` puis `panelButton()`) et le nom dans la barre de titre (`waitFor`). Mesuré : machine libre 0/20 → 0/20, 32,2 s → 31,8 s, test le plus lent 4,6 s → 2,8 s ; sous charge 5/10 (après doublures, défaut de workers) → 0/20, test le plus lent 5,7 s → 4,6 s. Testé et écarté : `maxWorkers: 8` (0/10 sous charge mais +2 s machine libre), `pool: 'vmThreads'` (15 s au lieu de 32, mais 5 échecs dès le premier essai : `toStrictEqual` entre royaumes, plugin Vite, chronologies changées).
**Référence** : `vite.config.ts` (`test.maxWorkers`), `src/features/config-editor/config-editor-page.test.tsx`, `src/features/create-session/create-session-page.test.tsx`, `src/features/session/add-student.test.tsx`.

## jsdom n'a pas de `DragEvent` : `fireEvent.dragLeave(el, { relatedTarget })` n'a aucun `relatedTarget` (2026-10-02)

**Découvert** : #87, filet `window` de `useFileDrop`.
**Symptôme** : un test qui passe `relatedTarget: null` (ou un élément) à `fireEvent.dragLeave` le croit posé ; le gestionnaire lit `undefined`. Un contrôle `event.relatedTarget !== null` laisse donc passer tous les `dragleave` de jsdom, et un test « avec `relatedTarget` » passe pour une mauvaise raison.
**Cause** : jsdom n'implémente pas `DragEvent` ; Testing Library retombe sur un `Event` générique, dont l'init ignore `relatedTarget` (seul `dataTransfer` est recopié à la main).
**Workaround** : côté code, tester la valeur par vérité (`if (event.relatedTarget) return`), pas contre `null`. Côté test, pour un `relatedTarget` réel : `createEvent.dragLeave(el, …)` puis `Object.defineProperty(event, 'relatedTarget', { value })` et `fireEvent(el, event)`. Et ne pas déduire une sortie de fenêtre d'un `dragleave` à `relatedTarget` nul, ni de l'ordre `dragenter` / `dragleave` : WebKit le laisse nul entre parent et enfant, Chromium et Firefox le posent, et un élément démonté ne reçoit plus son `dragleave`. `useFileDrop` lance un délai (`WINDOW_EXIT_DELAY_MS`) qu'annule tout `dragenter` ou `dragover` ; tests sous `vi.useFakeTimers()`.
**Référence** : `src/hooks/use-file-drop.ts`, `src/hooks/use-file-drop.test.tsx`.
