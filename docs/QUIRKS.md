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
**Workaround** : lancer un test ciblé avec `./node_modules/.bin/vitest run <fichier>` ; `pnpm test` / `pnpm check` restent sûrs. `.vitest/` est désormais dans `.gitignore` ; supprimer le dossier s'il traîne.
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
