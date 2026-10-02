# Backlog & idées

Choses identifiées comme "à faire un jour" mais pas prioritaires. Si tu trouves une
amélioration en passant, note-la ici plutôt que de l'oublier ou de la coder
maintenant.

Une fois faite, déplace-la en `INDEX.md` (livré) ou supprime-la (abandonnée).

Organise les entrées par thème (`## <Thème>`), chaque idée étant une case à cocher
`- [ ] …`.

---

## Outillage

- [ ] Vitest plus rapide et plus robuste à la charge : `isolate: false` ou `pool: 'vmThreads'` (~2× plus rapide, 15 s au lieu de 32 s), mais 5 tests à adapter (`toStrictEqual` entre royaumes, test du plugin de config, timings) et l'isolation entre fichiers à revérifier. Sous forte charge, la marge reste mince (test le plus lent 4,6 s contre 5 s). → #88
- [ ] Convention « doublures d'icônes et de Shiki pour un écran qui rend une config avec `icon` ou bloc de code » (CONVENTIONS, #87) appliquée à la main : un garde-fou (test de lenteur, règle de lint) si elle est oubliée. → #88
- [x] Échec isolé `getByRole('banner')` dans `config-editor-page.test.tsx` (vu une fois pendant F31), cause inconnue, jamais reproduit sur ~90 suites. → #87 *Fait en #87 (PR 3) : l'aperçu ajoute ses propres `header` (`QuestionPreview`, `StudentScreen`) après la validation différée (300 ms + imports) ; si elle finissait avant l'assertion, `getByRole('banner')` trouvait plusieurs éléments. Reproduit en asserant après l'aperçu ; la barre se cherche désormais par le `header` du `h1`.*
- [x] Tests instables vus pendant F31 : `src/features/create-session/create-session-page.test.tsx` (rejet non géré « window is not defined » au démontage du routeur) et `src/features/config-editor/config-editor-page.test.tsx` (`getByRole('banner')`, une fois). → #87 *Fait en #87 (tests instables).*
- [x] Tests instables vus pendant F36, une fois chacun sous `pnpm check`, jamais seuls ni en trois relances de `pnpm test` : `src/features/session/add-student.test.tsx` (« Ajouter et faire passer » active le nouvel étudiant…) et `config-editor-page.test.tsx` (« marque l'aperçu périmé… », 5 s). Même e2e : `color-mode.spec.ts` a expiré une fois (30 s) sur une suite complète, puis 15/15 seul et 3 suites complètes vertes. → #87 *Fait en #87 (tests instables).*
- [ ] Passer `.nvmrc` (et la CI) à Node 26 une fois LTS (prévu le 2026-10-28) ; Node 24 passe en maintenance le 2026-10-20. → #85
- [ ] Évaluer oxfmt en remplacement de Prettier + prettier-plugin-tailwindcss quand il sort en 1.0 (tri Tailwind natif via `sortTailwindcss`). → #88

## Config

- [x] Éditeur de config (#60) : autocomplétion et aide au survol depuis le JSON Schema (`codemirror-json-schema`), hors périmètre de F26. → #80 *Livré en F32 (D87).*
- [x] JSON Schema : descriptions et défauts (`.meta({ description })` depuis le tableau de `PRODUCT.md` §6.2) pour l'aide au survol dans VSCode. → #80 *Livré en F32 (D87).*
- [ ] Test d'alignement entre `INTEGER_FIELDS` (`from-zod.ts`) et les champs `z.int()` du schéma.

## Notation


## Persistance

- [x] Règle de backup / session stockée `duplicate_student_order` : deux étudiants au même `order` (backup édité à la main) partageraient le montage de l'écran projeté (D85) et rendraient l'ordre de passage ambigu. Les parcours de l'application gardent `order` unique (création : rang + 1, ajout : max + 1). → #87 *Fait en #87 (PR 2) : refusé à l'import seulement, jamais sur une session déjà en base (D89).*
- [x] `listSessions` lit la table deux fois hors transaction (index puis enregistrements sans `updatedAt`) : une lecture unique et un tri en mémoire. → #87 *Fait en #87 (PR 2).*
- [ ] Première migration de schéma (`version(2)`) : tester l'ouverture d'un ancien onglet sur une base déjà montée de version.

## Écran de passage

- [x] `ResetDialog`, `AdjustmentDialog` et confirmation d'absence : un appel écarté par le verrou (`run` renvoie `false`) est traité comme un échec ou un succès ; faire remonter l'issue `'written' | 'failed' | 'ignored'` comme l'ajout d'étudiant (#87 PR 1), via `FinalScreen` et `PassageBody`. Rare : boutons désactivés pendant une écriture. → #87 *Fait en #87 (PR 3).*
- [ ] Raccourcis clavier : chiffres pour les valeurs du barème, touches pour les catégories, raccourci de skip.
- [x] Helper `requireStudent(session, studentId)` dans `domain/passage/` : la recherche + `student_not_found` est copiée dans `drawQuestion`, `scoreAttempt`, `setActiveStudent` ; F10 et F11 en ajouteront deux copies. *Fait en F10.*
- [x] Test de la branche défensive `category_not_found` de `scoreAttempt` (inatteignable avec une config figée valide). → #87 *Fait en #87 (PR 1).*
- [x] `studentStatus` et `computeScores` calculés deux fois (`ExaminerView` et `PassageHeader`) : passer le statut en prop si l'écran grossit. → #87 *Fait en #87 (PR 1).*
- [x] `passage-example.test.tsx` : ~1,2 s seul, au-delà de 5 s sous la charge de la suite complète ; délai porté à 15 s en F12. Trouver où part le temps (le panneau n'en explique que ~12 %). → #87 *Fait en #87 (PR 1).*
- [x] Panneau latéral : la zone `aria-live` du commentaire annonce « Enregistrement… » puis « Enregistré » à chaque pause de frappe ; n'annoncer que « Enregistré » / « Échec ». → #55. *Livré en F21.*
- [x] `AbsentState` renvoie au panneau alors qu'il peut être replié ou sur l'onglet « Étudiants » : proposer « Afficher le panneau ». Même chose pour l'état « aucun étudiant » depuis F13, qui renvoie à l'onglet « Étudiants » sans l'ouvrir. → #55. *Livré en F21.*
- [x] Fixtures de tests d'écran : `src/testing/screen-fixtures.ts` (`screenCategory`, `REVEALED`, `panel()`) livré en F30 ; restent locales les copies qui diffèrent (échelle `[0, 1, 2, 3]` dans `side-panel.test.tsx` et `student-tab.test.tsx`, quatre questions dans `skip.test.tsx`) : à rapprocher si l'écart cesse d'être nécessaire. → #87 *Fait en #87 (PR 1).*
- [x] Cas `decimals: 0` (pas de 1) de l'ajustement jamais testé à l'écran (F11). → #87 *Fait en #87 (PR 1).*
- [x] Brouillons de commentaire (`comment-draft.ts`, F30) jamais nettoyés à la suppression d'une session ni à l'import d'un backup par-dessus : un brouillon resté peut écraser le commentaire importé à la réouverture du tiroir. → #87 *Fait en #87 (PR 1).*
- [x] Dialogue d'ajout d'étudiant : en cas d'échec, alerte du dialogue plus alerte du tiroir derrière (F30 n'a appliqué `ownError` qu'à l'ajustement, `reset` et l'absence). → #87 *Fait en #87 (PR 1).*
- [x] Onglet « Étudiants » (montage partagé dans `src/testing/students-tab-harness.tsx` depuis la PR #45) : le test de double clic ne distingue pas la garde `submitting` du verrou `run` ; pas de test `rosterScore` d'un absent qui a des notes (F13). → #87 *Fait en #87 (PR 1).*
- [x] Onglet « Étudiants » : l'icône de l'étudiant projeté n'est vérifiable qu'en test tant que F14 ne permet pas de projeter depuis l'interface. → #56. *Vérifiable depuis F22 : l'aperçu montre l'étudiant projeté.*
- [x] Vue projetée (F14) : `cursor-none` non testé au niveau page ; test de réinitialisation qui n'attend pas la disparition de l'énoncé. → #87 *Fait en #87 (PR 1).*
- [x] Pilotage (F14) : `?search` conservé dans l'URL de la fenêtre projetée ; tests manquants (boutons pendant `busy`, bandeau quand l'étudiant projeté a disparu). *Popup bloquée effacée au clic suivant et référence de fenêtre liée à la session : livrés en F22.* → #87 *Fait en #87 (PR 1).*
- [x] Tests F14 : marqueur `0.37` du test d'étanchéité en sous-chaîne (échec bruyant si un score le contient) ; pas de mutation vérifiée pour `editedAt` et le montant d'ajustement ; test d'architecture aveugle aux réexports de `Session` ; `computeScores` appelé deux fois dans `toProjectedView`. → #87 *Fait en #87 (PR 1).*
- [ ] `categoryButton` (`src/testing/passage-assertions.ts`) : `waitFor` au délai par défaut (1 s), à allonger si la CI devient lente. → #88
- [x] Tuiles de catégorie (F25, D74) : seuil du repli sur une colonne à revoir avec l'aperçu de #56. *Livré en F22 : seuil mesuré sur le conteneur (`@min-[40rem]:`, D77).*
- [ ] Aperçu de la vue projetée (F22) : suit le mode clair / sombre de l'examinateur, pas celui mémorisé par la vue projetée (D77) ; à reprendre si l'écart gêne.
- [x] Tests F22 : `FauxResizeObserver` recopié entre `projection.test.tsx` et `projection-preview-leak.test.tsx` (à sortir dans `src/testing/`) ; commentaire et motif de skip prouvés absents de l'aperçu mais seulement présents en base, pas dans le DOM examinateur ; `useElementWidth` garde la dernière largeur après `ref(null)`. → #87 *Fait en #87 (PR 1).*

## Accueil et backup

- [x] Glisser-déposer : filet `window` (`dragleave` avec `relatedTarget === null`, `drop`) qui remet le compteur de `useFileDrop` à zéro si l'élément survolé est démonté pendant le glisser (son `dragleave` n'atteint pas React : la surimpression de l'accueil reste affichée jusqu'au dépôt suivant). Rare (ligne de session re-rendue par un autre onglet). → #87 *Fait en #87 (PR 2).*
- [x] La clé `back_home` utilise une apostrophe droite alors que le reste de l'interface a `’` : harmoniser (e2e et tests à suivre). → #87 *Fait en #87 (PR 2).*
- [x] Tests manquants : erreurs d'écriture (renommer, examinateur, suppression), réinitialisation du champ à la réouverture d'un dialogue, « toutes les issues » avec un décompte exact, `score` sur un attempt `skipped`, date locale vs UTC du nom de fichier (cas à 00:30). → #87 *Fait en #87 (PR 2).*
- [x] Ajouter un favicon (404 sur `/favicon.ico` en preview et en prod). → #53 — réglé par F17 (D72), constaté en F19

## Création de session

- [ ] Garde de montage de la création : comparer aussi `router.state.location.pathname` avant de naviguer (fenêtre résiduelle pendant le chargement du chunk de l'accueil).
- [x] Tests manquants : courses du slot config (nom saisi pendant la lecture, deux configs successives), messages `read-error` / `load-error` rendus, état `unavailable` à l'écran, `activeStudentId` affirmé dans le test d'écran. → #87 *Fait en #87 (PR 2).*

## Thème et langue

- [x] Garde-fou de build : un script de fin de build qui échoue si un chunk autre que `icons-*` contient `IconBrandPhp`, ou si `index-*` dépasse un budget. *Livré en #86 (`pnpm check:budget`, D88).* `chunkSizeWarningLimit: 2400` ne surveille plus les autres chunks (D37). → #86
- [ ] Synchroniser le mode entre deux fenêtres d'une même vue (événement `storage`, via `useSyncExternalStore`). Aujourd'hui, la valeur est lue une fois par clé.
- [x] Tests manquants de `LocaleProvider` : changement de la locale du propriétaire avec une déclaration active, deux imbriqués frères de même locale. → #87 *Fait en #87 (PR 2).*
- [ ] `isIconComponent` accepte tout objet non nul : vérifier `$$typeof` si Tabler exporte un jour autre chose que des composants sous un nom `Icon…`.
- [ ] Faire disparaître l'avertissement `missing-typescript-transpiler` de `pnpm deps`, quand dependency-cruiser gérera typescript@7. → #88

## Rendu markdown

- [x] Fond des blocs colorés : `github-light` a un fond `#fff`, invisible sur une page blanche, alors que les blocs en texte brut (langage inconnu, chargement) gardent `--muted`. Le fond saute donc à la fin de la coloration. À trancher à l'écran (F09 monte désormais `<Markdown>`, pas encore vérifié visuellement) : bordure sur `.shiki`, ou fond clair surchargé. → #58. *Livré en F24 : fond `--muted` commun et bordure (D79).*
- [x] Code en ligne : `@tailwindcss/typography` ajoute des backticks littéraux (`code::before/::after`) et aucun fond ; vu à l'écran en F09. Retirer les pseudo-éléments et donner un fond `--muted` léger. → #58. *Livré en F24.*
- [ ] Taille de projection : `prose-2xl` est provisoire, à caler sur un vrai vidéoprojecteur en F14 (D62). → #77
- [x] Test de régression multi-ligne des offsets de `toHighlightedCode` (clés React), vérifié à la main par la revue finale. → #87 *Fait en #87 (PR 3) : Shiki réel, LF avec ligne vide et CRLF ; le CRLF a révélé un offset de ligne décalé d'un caractère par ligne (clés restées uniques), corrigé.*
- [x] F18 : tests manquants, sans bogue connu : import de grammaire en échec puis nouvel essai ; rerender `Python` → `python` de `CodeBlock` ; tabulation et fermeture suivie d'espaces dans `code-fences.test.ts`. → #87 *Fait en #87 (PR 3), sans bogue trouvé.*
- [ ] e2e F18 : deux fixtures de 178 lignes presque identiques (`e2e/fixtures/languages-*.config.json`), à générer depuis une base commune. → #88
- [x] Test du libellé de retour d'une note citée deux fois (suffixe `-2` de `footnoteBackLabel`, calqué sur `mdast-util-to-hast`, où `rereferenceIndex` commence à 1). → #87 *Fait en #87 (PR 3).*

## Éditeur de config

- [x] `locateIssue` : BOM en tête (colonne de `json_syntax` décalée d'un caractère en ligne 1), colonne au-delà de la ligne bornée à la fin du texte plutôt qu'à la fin de ligne ; pas de tests CRLF / BOM / index hors limites. → #87 *Fait en #87 (PR 3).*
- [x] `JsonEditor` : `aria-label` figé au montage, diagnostics envoyés deux fois au montage ; tests de `reveal` et des diagnostics après montage à ajouter. → #87 *Fait en #87 (PR 3).*
- [ ] Aperçu : énoncé très long sans `break-words`.
- [ ] Nom du fichier téléchargé (`configFileName`) : règle pure à sortir dans `domain/config/` avec ses tests (exam absent, titre vide). → #87

## Statistiques

- [x] `check:bundle` ne connaît que Recharts : généraliser (liste de couples bibliothèque → route) quand une deuxième bibliothèque lourde sera confinée à une route. *Fait au fil de F16, F18 et F26 : Recharts, xlsx, Shiki, CodeMirror.*
- [x] Liste blanche du groupe `vendor` (`vite.config.ts`) à étendre si `check:bundle` rougit après l'ajout d'une dépendance partagée avec Recharts (voir QUIRKS 2026-09-30). → #86 *Relue en #86 (D88) : rien à ajouter, `check:bundle` vert.*
- [ ] e2e : `StatsPage.headcount()` s'appuie sur `.last()` parmi des `div` imbriqués ; passer par `term` → `dd` suivant. → #88
- [ ] Tests manquants : taux négatif (barème à valeurs négatives), frontière 0,999 / 1 sur /20, id inconnu dans `computeSkipped`, départage alphabétique seul des motifs, table des tags non vide à l'écran. → #87
- [ ] Petits nettoyages de `domain/stats/` : `mean` en une seule division, `?? 0` inatteignable dans `strategies.ts`, `countBy` renommé, `Tally` au lieu de `ReturnType<typeof emptyTally>`, commentaire de limite 2^53 de `populationStdDev`. → #87
- [ ] Paragraphe d'état vide répété quatre fois dans `features/stats/components/` : extraire un `StatsEmpty`. → #87

## Export Excel

- [ ] Vérifier l'ouverture dans Excel (critère d'acceptation de F16, fait seulement sous LibreOffice) : pas d'invite de réparation, volet figé (`activePane="bottomRight"` avec `xSplit="0"` écrit par write-excel-file). → #77
- [ ] Autofiltre sur Synthèse et Détail (hors périmètre F16, D35) si la consolidation le demande.
- [x] Export depuis la carte de session de l'accueil (à côté du backup), sans ouvrir la vue examinateur. → #54. *Livré en F20 (item du menu « … »).*
- [x] Garde double-clic de `ExportButton` sur un `useRef` plutôt que sur l'état du rendu. → #54. *Livré en F20 (`useWorkbookExport`).*
- [x] Classe de lien (`text-sm text-primary underline underline-offset-4`) recopiée entre `create-session-page.tsx` et `action-cards.tsx` : à sortir dans `components/` si un troisième écran en a besoin (F20). → #87 *Fait en #87 (PR 2) : `@/components/text-link`, appliqué à tous les liens texte.*
- [ ] Accueil (F20) : `session-card` importe `exportWorkbook`, qui tire `buildWorkbook` et `computeStats` dans le chunk de l'accueil (chargé à la demande, hors bundle initial). Les passer dans l'`import()` dynamique si la taille du chunk devient gênante.

## Hors ligne

- [ ] Vérifier à la main l'installation dans Chrome et Edge, et la mise à jour au premier déploiement réel après F17 (critères de #17). → #77
- [x] Vue projetée ouverte sans contrôleur (Shift+Reload) : son premier `controllerchange` réel est pris pour celui de `clientsClaim`, elle ne se recharge pas à l'activation d'une version (sans effet en ligne ; hors ligne, ses chunks à la demande manqueraient). → #84 *Livré en F36 (D86).*
- [ ] Plafond `maximumFileSizeToCacheInBytes` à ~31 kB du chunk Tabler : une montée de `@tabler/icons-react` fera rougir `check:precache`, relever alors la valeur.
- [ ] Icônes du manifeste pré-cachées deux fois (motif glob + `includeManifestIcons`), sans effet ; `includeManifestIcons: false` pour un manifeste net.
- [x] Vérification périodique des mises à jour pendant la journée, message « prêt hors ligne » (hors périmètre F17). → #84 *Livré en F36 (D86).*
- [ ] Première installation interrompue (réseau coupé pendant le pré-cache) : le navigateur supprime l'enregistrement, les vérifications de F36 échouent alors sans bruit (`InvalidStateError`) et rien ne relance l'installation avant un rechargement. Relancer `register` au retour du réseau si le cas se présente.
- [ ] e2e : `highlightedCode` (`.first()`) peut se satisfaire d'un bloc de la question précédente ; le scoper à la question courante. → #88
- [x] Helper de test `deferred<T>()` dupliqué dans `import-controller.test.tsx` et `add-student.test.tsx` : le sortir dans `src/testing/` (F30). → #87 *Fait en #87 (PR 1).*
- [x] `stale-errors.test.tsx` attend avec `setTimeout(100)` : attendre un état observable à la place (F30). → #87 *Fait en #87 (PR 1).*
- [x] Commenter sur `PassageActions` que `adjust` et `revealFinal` laissent l'affichage de l'erreur à l'appelant (`ownError`) (F30). → #87 *Fait en #87 (PR 1).*
