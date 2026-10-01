# Backlog & idées

Choses identifiées comme "à faire un jour" mais pas prioritaires. Si tu trouves une
amélioration en passant, note-la ici plutôt que de l'oublier ou de la coder
maintenant.

Une fois faite, déplace-la en `INDEX.md` (livré) ou supprime-la (abandonnée).

Organise les entrées par thème (`## <Thème>`), chaque idée étant une case à cocher
`- [ ] …`.

---

## Outillage

- [ ] Tests instables vus pendant F31 : `src/features/create-session/create-session-page.test.tsx` (rejet non géré « window is not defined » au démontage du routeur) et `src/features/config-editor/config-editor-page.test.tsx` (`getByRole('banner')`, une fois). → #87
- [ ] Passer `.nvmrc` (et la CI) à Node 26 une fois LTS (prévu le 2026-10-28) ; Node 24 passe en maintenance le 2026-10-20. → #85
- [ ] Évaluer oxfmt en remplacement de Prettier + prettier-plugin-tailwindcss quand il sort en 1.0 (tri Tailwind natif via `sortTailwindcss`). → #88

## Config

- [ ] Éditeur de config (#60) : autocomplétion et aide au survol depuis le JSON Schema (`codemirror-json-schema`), hors périmètre de F26. → #80
- [ ] JSON Schema : descriptions et défauts (`.meta({ description })` depuis le tableau de `PRODUCT.md` §6.2) pour l'aide au survol dans VSCode. → #80
- [ ] Identifiants de catégorie/question avec espaces en bord (`'a-1 '`) ou en formes Unicode différentes (NFC/NFD) : erreur ou avertissement. → #83
- [ ] Test d'alignement entre `INTEGER_FIELDS` (`from-zod.ts`) et les champs `z.int()` du schéma.

## Notation


## Persistance

- [ ] `listSessions` lit la table deux fois hors transaction (index puis enregistrements sans `updatedAt`) : une lecture unique et un tri en mémoire. → #87
- [ ] Première migration de schéma (`version(2)`) : tester l'ouverture d'un ancien onglet sur une base déjà montée de version.

## Écran de passage

- [ ] Raccourcis clavier : chiffres pour les valeurs du barème, touches pour les catégories, raccourci de skip.
- [x] Helper `requireStudent(session, studentId)` dans `domain/passage/` : la recherche + `student_not_found` est copiée dans `drawQuestion`, `scoreAttempt`, `setActiveStudent` ; F10 et F11 en ajouteront deux copies. *Fait en F10.*
- [ ] Test de la branche défensive `category_not_found` de `scoreAttempt` (inatteignable avec une config figée valide). → #87
- [ ] `studentStatus` et `computeScores` calculés deux fois (`ExaminerView` et `PassageHeader`) : passer le statut en prop si l'écran grossit. → #87
- [ ] `passage-example.test.tsx` : ~1,2 s seul, au-delà de 5 s sous la charge de la suite complète ; délai porté à 15 s en F12. Trouver où part le temps (le panneau n'en explique que ~12 %). → #87
- [x] Panneau latéral : la zone `aria-live` du commentaire annonce « Enregistrement… » puis « Enregistré » à chaque pause de frappe ; n'annoncer que « Enregistré » / « Échec ». → #55. *Livré en F21.*
- [x] `AbsentState` renvoie au panneau alors qu'il peut être replié ou sur l'onglet « Étudiants » : proposer « Afficher le panneau ». Même chose pour l'état « aucun étudiant » depuis F13, qui renvoie à l'onglet « Étudiants » sans l'ouvrir. → #55. *Livré en F21.*
- [ ] Fixtures de tests d'écran : `src/testing/screen-fixtures.ts` (`screenCategory`, `REVEALED`, `panel()`) livré en F30 ; restent locales les copies qui diffèrent (échelle `[0, 1, 2, 3]` dans `side-panel.test.tsx` et `student-tab.test.tsx`, quatre questions dans `skip.test.tsx`) : à rapprocher si l'écart cesse d'être nécessaire. → #87
- [ ] Cas `decimals: 0` (pas de 1) de l'ajustement jamais testé à l'écran (F11). → #87
- [ ] Onglet « Étudiants » (montage partagé dans `src/testing/students-tab-harness.tsx` depuis la PR #45) : le test de double clic ne distingue pas la garde `submitting` du verrou `run` ; pas de test `rosterScore` d'un absent qui a des notes (F13). → #87
- [x] Onglet « Étudiants » : l'icône de l'étudiant projeté n'est vérifiable qu'en test tant que F14 ne permet pas de projeter depuis l'interface. → #56. *Vérifiable depuis F22 : l'aperçu montre l'étudiant projeté.*
- [ ] Vue projetée (F14) : catégorie « indisponible » visuellement identique à « épuisée » (même atténuation, sans libellé) ; séparateur entre catégorie et titre dans le détail, `points ?? 0` pour une question notée sans note. → #81
- [ ] Vue projetée (F14) : `animate` non figé au montage de `DrawReveal` (basculer `drawAnimation` pendant une question rejoue le mélange) ; `cursor-none` non testé au niveau page ; test de réinitialisation qui n'attend pas la disparition de l'énoncé. → #81
- [ ] Vue projetée (F14) : écran étudiant remonté par une `key` sur le nom affiché, deux homonymes partagent un montage ; `key` du détail (catégorie + titre) non garantie unique. → #81
- [ ] Pilotage (F14) : `?search` conservé dans l'URL de la fenêtre projetée ; tests manquants (boutons pendant `busy`, bandeau quand l'étudiant projeté a disparu). *Popup bloquée effacée au clic suivant et référence de fenêtre liée à la session : livrés en F22.* → #87
- [ ] Tests F14 : marqueur `0.37` du test d'étanchéité en sous-chaîne (échec bruyant si un score le contient) ; pas de mutation vérifiée pour `editedAt` et le montant d'ajustement ; test d'architecture aveugle aux réexports de `Session` ; `computeScores` appelé deux fois dans `toProjectedView`. → #87
- [ ] `categoryButton` (`src/testing/passage-assertions.ts`) : `waitFor` au délai par défaut (1 s), à allonger si la CI devient lente. → #88
- [x] Tuiles de catégorie (F25, D74) : seuil du repli sur une colonne à revoir avec l'aperçu de #56. *Livré en F22 : seuil mesuré sur le conteneur (`@min-[40rem]:`, D77).*
- [ ] Aperçu de la vue projetée (F22) : suit le mode clair / sombre de l'examinateur, pas celui mémorisé par la vue projetée (D77) ; à reprendre si l'écart gêne.
- [ ] Tests F22 : `FauxResizeObserver` recopié entre `projection.test.tsx` et `projection-preview-leak.test.tsx` (à sortir dans `src/testing/`) ; commentaire et motif de skip prouvés absents de l'aperçu mais seulement présents en base, pas dans le DOM examinateur ; `useElementWidth` garde la dernière largeur après `ref(null)`. → #87

## Accueil et backup

- [ ] La clé `back_home` utilise une apostrophe droite alors que le reste de l'interface a `’` : harmoniser (e2e et tests à suivre). → #87
- [ ] Ignorer le glisser-déposer pendant qu'un dialogue d'import est ouvert (aujourd'hui un second fichier remplace le conflit en attente) et pendant un import en cours. → #82
- [ ] Surimpression de dépôt : compteur `dragenter`/`dragleave` au lieu du test `relatedTarget` (WebKit envoie `relatedTarget = null`, scintillement possible). → #82
- [ ] Garder le contenu des dialogues d'import pendant l'animation de fermeture (il disparaît dès que l'état revient à `idle`). → #82
- [ ] Dédoublonner les issues identiques avant affichage (clé React `chemin|message`). → #82
- [ ] Tests manquants : erreurs d'écriture (renommer, examinateur, suppression), réinitialisation du champ à la réouverture d'un dialogue, « toutes les issues » avec un décompte exact, `score` sur un attempt `skipped`, date locale vs UTC du nom de fichier (cas à 00:30). → #87
- [x] Ajouter un favicon (404 sur `/favicon.ico` en preview et en prod). → #53 — réglé par F17 (D72), constaté en F19

## Création de session

- [ ] Factoriser le glisser-déposer (`hasFiles`, dragover/dragleave/drop) de `FileDropField` et `ImportController` dans un hook `useFileDrop(disabled, onFile)`. → #82
- [ ] Remplacer les sauts de ligne et espaces multiples internes aux noms lus dans le CSV par une espace (`"Du\nrand"`). → #83
- [ ] Message dédié pour un fichier séparé par tabulations (aujourd'hui : lignes à un champ puis « aucun étudiant valide »). → #83
- [ ] Garde de montage de la création : comparer aussi `router.state.location.pathname` avant de naviguer (fenêtre résiduelle pendant le chargement du chunk de l'accueil).
- [ ] Tests manquants : courses du slot config (nom saisi pendant la lecture, deux configs successives), messages `read-error` / `load-error` rendus, état `unavailable` à l'écran, `activeStudentId` affirmé dans le test d'écran. → #87

## Thème et langue

- [ ] Garde-fou de build : un script de fin de build qui échoue si un chunk autre que `icons-*` contient `IconBrandPhp`, ou si `index-*` dépasse un budget. `chunkSizeWarningLimit: 2400` ne surveille plus les autres chunks (D37). → #86
- [ ] Synchroniser le mode entre deux fenêtres d'une même vue (événement `storage`, via `useSyncExternalStore`). Aujourd'hui, la valeur est lue une fois par clé.
- [ ] Tests manquants de `LocaleProvider` : changement de la locale du propriétaire avec une déclaration active, deux imbriqués frères de même locale. → #87
- [ ] `isIconComponent` accepte tout objet non nul : vérifier `$$typeof` si Tabler exporte un jour autre chose que des composants sous un nom `Icon…`.
- [ ] Faire disparaître l'avertissement `missing-typescript-transpiler` de `pnpm deps`, quand dependency-cruiser gérera typescript@7. → #88

## Rendu markdown

- [x] Fond des blocs colorés : `github-light` a un fond `#fff`, invisible sur une page blanche, alors que les blocs en texte brut (langage inconnu, chargement) gardent `--muted`. Le fond saute donc à la fin de la coloration. À trancher à l'écran (F09 monte désormais `<Markdown>`, pas encore vérifié visuellement) : bordure sur `.shiki`, ou fond clair surchargé. → #58. *Livré en F24 : fond `--muted` commun et bordure (D79).*
- [x] Code en ligne : `@tailwindcss/typography` ajoute des backticks littéraux (`code::before/::after`) et aucun fond ; vu à l'écran en F09. Retirer les pseudo-éléments et donner un fond `--muted` léger. → #58. *Livré en F24.*
- [ ] Taille de projection : `prose-2xl` est provisoire, à caler sur un vrai vidéoprojecteur en F14 (D62). → #77
- [ ] Test de régression multi-ligne des offsets de `toHighlightedCode` (clés React), vérifié à la main par la revue finale. → #87
- [ ] F18 : tests manquants, sans bogue connu : import de grammaire en échec puis nouvel essai ; rerender `Python` → `python` de `CodeBlock` ; tabulation et fermeture suivie d'espaces dans `code-fences.test.ts`. → #87
- [ ] e2e F18 : deux fixtures de 178 lignes presque identiques (`e2e/fixtures/languages-*.config.json`), à générer depuis une base commune. → #88
- [ ] Test du libellé de retour d'une note citée deux fois (suffixe `-2` de `footnoteBackLabel`, calqué sur `mdast-util-to-hast`, où `rereferenceIndex` commence à 1). → #87

## Éditeur de config

- [ ] `locateIssue` : BOM en tête (colonne de `json_syntax` décalée d'un caractère en ligne 1), colonne au-delà de la ligne bornée à la fin du texte plutôt qu'à la fin de ligne ; pas de tests CRLF / BOM / index hors limites. → #87
- [ ] `JsonEditor` : `aria-label` figé au montage, diagnostics envoyés deux fois au montage ; tests de `reveal` et des diagnostics après montage à ajouter. → #87
- [ ] Aperçu : énoncé très long sans `break-words`.
- [ ] Nom du fichier téléchargé (`configFileName`) : règle pure à sortir dans `domain/config/` avec ses tests (exam absent, titre vide). → #87

## Statistiques

- [x] `check:bundle` ne connaît que Recharts : généraliser (liste de couples bibliothèque → route) quand une deuxième bibliothèque lourde sera confinée à une route. *Fait au fil de F16, F18 et F26 : Recharts, xlsx, Shiki, CodeMirror.*
- [ ] Liste blanche du groupe `vendor` (`vite.config.ts`) à étendre si `check:bundle` rougit après l'ajout d'une dépendance partagée avec Recharts (voir QUIRKS 2026-09-30). → #86
- [ ] e2e : `StatsPage.headcount()` s'appuie sur `.last()` parmi des `div` imbriqués ; passer par `term` → `dd` suivant. → #88
- [ ] Tests manquants : taux négatif (barème à valeurs négatives), frontière 0,999 / 1 sur /20, id inconnu dans `computeSkipped`, départage alphabétique seul des motifs, table des tags non vide à l'écran. → #87
- [ ] Petits nettoyages de `domain/stats/` : `mean` en une seule division, `?? 0` inatteignable dans `strategies.ts`, `countBy` renommé, `Tally` au lieu de `ReturnType<typeof emptyTally>`, commentaire de limite 2^53 de `populationStdDev`. → #87
- [ ] Paragraphe d'état vide répété quatre fois dans `features/stats/components/` : extraire un `StatsEmpty`. → #87

## Export Excel

- [ ] Vérifier l'ouverture dans Excel (critère d'acceptation de F16, fait seulement sous LibreOffice) : pas d'invite de réparation, volet figé (`activePane="bottomRight"` avec `xSplit="0"` écrit par write-excel-file). → #77
- [ ] Autofiltre sur Synthèse et Détail (hors périmètre F16, D35) si la consolidation le demande.
- [x] Export depuis la carte de session de l'accueil (à côté du backup), sans ouvrir la vue examinateur. → #54. *Livré en F20 (item du menu « … »).*
- [x] Garde double-clic de `ExportButton` sur un `useRef` plutôt que sur l'état du rendu. → #54. *Livré en F20 (`useWorkbookExport`).*
- [ ] Classe de lien (`text-sm text-primary underline underline-offset-4`) recopiée entre `create-session-page.tsx` et `action-cards.tsx` : à sortir dans `components/` si un troisième écran en a besoin (F20). → #87
- [ ] Accueil (F20) : `session-card` importe `exportWorkbook`, qui tire `buildWorkbook` et `computeStats` dans le chunk de l'accueil (chargé à la demande, hors bundle initial). Les passer dans l'`import()` dynamique si la taille du chunk devient gênante.

## Hors ligne

- [ ] Vérifier à la main l'installation dans Chrome et Edge, et la mise à jour au premier déploiement réel après F17 (critères de #17). → #77
- [ ] Vue projetée ouverte sans contrôleur (Shift+Reload) : son premier `controllerchange` réel est pris pour celui de `clientsClaim`, elle ne se recharge pas à l'activation d'une version (sans effet en ligne ; hors ligne, ses chunks à la demande manqueraient). → #84
- [ ] Plafond `maximumFileSizeToCacheInBytes` à ~31 kB du chunk Tabler : une montée de `@tabler/icons-react` fera rougir `check:precache`, relever alors la valeur.
- [ ] Icônes du manifeste pré-cachées deux fois (motif glob + `includeManifestIcons`), sans effet ; `includeManifestIcons: false` pour un manifeste net.
- [ ] Vérification périodique des mises à jour pendant la journée, message « prêt hors ligne » (hors périmètre F17). → #84
- [ ] e2e : `highlightedCode` (`.first()`) peut se satisfaire d'un bloc de la question précédente ; le scoper à la question courante. → #88
- [ ] Helper de test `deferred<T>()` dupliqué dans `import-controller.test.tsx` et `add-student.test.tsx` : le sortir dans `src/testing/` (F30). → #87
- [ ] `stale-errors.test.tsx` attend avec `setTimeout(100)` : attendre un état observable à la place (F30). → #87
- [ ] Commenter sur `PassageActions` que `adjust` et `revealFinal` laissent l'affichage de l'erreur à l'appelant (`ownError`) (F30). → #87
