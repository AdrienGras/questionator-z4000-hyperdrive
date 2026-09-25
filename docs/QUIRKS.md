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

## SonarQube signale les regex `\[([^\]]*)\]\(…\)` et `(.+?)…\1` comme super-linéaires (2026-09-25)

**Découvert** : PR #21 (F02), analyse SonarQube Cloud.
**Symptôme** : règles `typescript:S8786` (backtracking super-linéaire) et `S5843` (complexité > 20) sur les regex de nettoyage markdown de `derive-title.ts`, alors que le lint et les tests passaient.
**Cause** : une classe qui n'exclut pas le délimiteur ouvrant, ou un `.+?` suivi d'une rétro-référence, relance le parcours à chaque position ; une alternance de marqueurs en une seule regex dépasse la complexité autorisée.
**Workaround** : parcours linéaire à la main (`indexOf`) pour les liens et images ; classes excluant le délimiteur (`[^*]+?`) pour l'emphase ; plusieurs petites regex ancrées appliquées en boucle pour les marqueurs de bloc. Lancer `.claude/scripts/sonar-check.sh --pr <n> --wait` tôt : Sonar voit des choses qu'oxlint ne voit pas.
**Référence** : `src/config/derive-title.ts`.

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
**Référence** : `src/scoring/milli.ts`.

## SonarQube refuse `tableau.map(fonction)` quand la fonction a un 2ᵉ paramètre (2026-09-25)

**Découvert** : PR #23 (F03), `src/test/student-fixtures.ts`.
**Symptôme** : bug MAJOR `typescript:S7727` (« Do not pass function directly to `.map(…)` ») et quality gate en échec (fiabilité), alors qu'oxlint et les tests passaient.
**Cause** : `.map` passe aussi l'index et le tableau ; une fonction dont la signature accepte un 2ᵉ paramètre les recevrait par accident si elle évolue.
**Workaround** : toujours une flèche explicite, `items.map((item, index) => build(item, index))`.
**Référence** : `src/test/student-fixtures.ts`.

## `useLiveQuery` garde son dernier résultat quand ses dépendances changent (2026-09-25)

**Découvert** : F04, revue de la tâche 3 (hooks).
**Symptôme** : juste après `rerender({ id: 'b' })`, `useSession('b')` renvoyait encore la session `a` pendant un rendu.
**Cause** : `dexie-react-hooks` conserve le résultat de l'observable précédent et ne recalcule pas de valeur initiale quand il en a déjà une.
**Workaround** : la requête renvoie `{ id, session }` et le hook masque (`undefined`) un résultat dont l'`id` n'est pas le courant. À reproduire pour tout hook `useLiveQuery` paramétré.
**Référence** : `src/db/hooks.ts`.

## Après `versionchange`, `close()` fait échouer toute opération et les `liveQuery` se taisent (2026-09-25)

**Découvert** : F04 (D45), sonde et revue finale.
**Symptôme** : dans l'ancien onglet, `put` rejette `DatabaseClosedError` ; les hooks gardent leur dernière valeur sans se mettre à jour.
**Cause** : `close()` sans argument vaut `{ disableAutoOpen: true }`. Le traitement par défaut de Dexie passe `false` et rouvrirait en silence sur l'ancien schéma.
**Workaround** : ne pas changer l'argument de `close()` ; se fier à `useDbStatus() === 'outdated'` pour proposer le rechargement.
**Référence** : `src/db/db.ts`.

## `import 'fake-indexeddb/auto'` exige l'exception oxlint `import/no-unassigned-import` (2026-09-25)

**Découvert** : F04.
**Symptôme** : lint rouge sur la première ligne des tests de `src/db/`.
**Cause** : la règle n'autorise que les imports à effet de bord listés.
**Workaround** : `"fake-indexeddb/auto"` ajouté à `allow` dans `.oxlintrc.json`. Importer `Dexie` par l'export nommé (`import { Dexie } from 'dexie'`), l'import par défaut déclenche `import/no-named-as-default`.
**Référence** : `.oxlintrc.json`, `src/db/*.test.ts`.

## Rien n'évalue `src/db` tant qu'aucune feature ne l'importe : `window.__questionatorDb` absent en dev (2026-09-25)

**Découvert** : F04, vérification manuelle entre fenêtres.
**Symptôme** : `typeof window.__questionatorDb === 'undefined'` sous `pnpm dev`.
**Cause** : Vite ne charge que les modules importés depuis `main.tsx`.
**Workaround** : `src/main.tsx` importe `@/db/db` en dev seulement. En prod, rien tant que F05 n'importe pas `@/db`.
**Référence** : `src/main.tsx`.

## Le premier `findBy*` d'un test rendu via le routeur dépasse 1 s sous la suite complète (2026-09-25)

**Découvert** : F05, tâche 5 (accueil), en lançant `pnpm check`.
**Symptôme** : le premier test de `src/home/HomePage.test.tsx` et le test de `/` dans `routes.test.tsx` passent seuls mais échouent en suite complète (« Unable to find role="heading" » après ~1050 ms), de façon déterministe.
**Cause** : `autoCodeSplitting` charge le composant de la route par import dynamique ; sous 36 fichiers en parallèle, la première transformation de l'accueil et de ses composants base-ui prend ~2 s, au-delà du délai par défaut de 1 s de Testing Library.
**Workaround** : `configure({ asyncUtilTimeout: 5000 })` dans `src/test/setup.ts`. Les menus et dialogues base-ui s'ouvrent bien avec `fireEvent.click` : `@testing-library/user-event` n'est pas nécessaire.
**Référence** : `src/test/setup.ts`, `vite.config.ts` (`autoCodeSplitting`).

## `Equal<A, B>` (astuce des fonctions génériques) déclare différents une intersection et l'objet aplati équivalent (2026-09-25)

**Découvert** : test d'alignement `SessionSchema` / `Session` en F05.
**Symptôme** : `Equal<Omit<ParsedSession, 'config'> & { config: NormalizedConfig }, Session>` vaut `false` alors que clés, types et optionalité sont identiques et que l'assignabilité mutuelle passe.
**Cause** : l'astuce `(<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)` compare l'identité des types, pas leur structure : une intersection n'est pas identique à un objet aplati.
**Workaround** : aplatir avant de comparer, `type Simplify<T> = { [K in keyof T]: T[K] }`, puis `Equal<Simplify<A>, B>`.
**Référence** : `src/domain/schema.test.ts`.

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
**Workaround** : `detectDelimiter` (`src/students/parse-csv.ts`) parse l'échantillon avec chaque candidat (`preview: 50`, guillemets respectés) et garde celui qui donne le plus de lignes à au moins deux cellules non vides ; égalité → `;`. Un comptage brut des caractères ne suffit pas (virgules d'une adresse ou d'un titre).
**Référence** : `src/students/parse-csv.ts`, `src/students/parse-csv.test.ts`.

## Un guillemet ouvrant mal placé dans un CSV avale toute la suite du fichier (2026-09-25)

**Découvert** : revue de F06.
**Symptôme** : `"Bob" Martin;Paul` produit `InvalidQuotes` puis `MissingQuotes` ; toutes les lignes suivantes finissent dans une seule cellule.
**Cause** : comportement RFC 4180 de PapaParse : un guillemet en début de cellule ouvre un champ cité jusqu'au prochain guillemet.
**Workaround** : toute erreur PapaParse de type `Quotes` donne `csv_syntax` (bloquant, avec numéro de ligne) plutôt que des étudiants faux. Les numéros de ligne dérivent aussi après un saut de ligne dans une cellule citée (cas accepté, documenté dans le code).
**Référence** : `src/students/parse-csv.ts`.

## L'export « CSV » d'Excel en français est en Windows-1252, pas en UTF-8 (2026-09-25)

**Découvert** : revue finale de F06.
**Symptôme** : `file.text()` décode en UTF-8 : « Prénom » devient « Pr�nom », l'en-tête n'est plus reconnu et devient un étudiant, sans aucune issue.
**Cause** : seul le format « CSV UTF-8 » d'Excel écrit de l'UTF-8 (avec BOM) ; « CSV (séparateur : point-virgule) » écrit en Windows-1252.
**Workaround** : lire les octets (`file.arrayBuffer()`), décoder avec `new TextDecoder('utf-8', { fatal: true })`, et en cas d'exception relire en `windows-1252` avec l'avertissement `legacy_encoding` (D58).
**Référence** : `src/students/decode.ts`, `src/create/use-create-form.ts`.
