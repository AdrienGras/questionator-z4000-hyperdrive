# Backlog & idées

Choses identifiées comme "à faire un jour" mais pas prioritaires. Si tu trouves une
amélioration en passant, note-la ici plutôt que de l'oublier ou de la coder
maintenant.

Une fois faite, déplace-la en `INDEX.md` (livré) ou supprime-la (abandonnée).

Organise les entrées par thème (`## <Thème>`), chaque idée étant une case à cocher
`- [ ] …`.

---

## Outillage

- [ ] Passer `.nvmrc` (et la CI) à Node 26 une fois LTS (prévu le 2026-10-28) ; Node 24 passe en maintenance le 2026-10-20.
- [ ] Évaluer oxfmt en remplacement de Prettier + prettier-plugin-tailwindcss quand il sort en 1.0 (tri Tailwind natif via `sortTailwindcss`).

## Config

- [ ] Éditeur de config (#60) : autocomplétion et aide au survol depuis le JSON Schema (`codemirror-json-schema`), hors périmètre de F26.
- [ ] JSON Schema : descriptions et défauts (`.meta({ description })` depuis le tableau de `PRODUCT.md` §6.2) pour l'aide au survol dans VSCode.
- [ ] Identifiants de catégorie/question avec espaces en bord (`'a-1 '`) ou en formes Unicode différentes (NFC/NFD) : erreur ou avertissement.
- [ ] Test d'alignement entre `INTEGER_FIELDS` (`from-zod.ts`) et les champs `z.int()` du schéma.

## Notation

- [ ] `formatScore` en `final` : si `finalScale` a plus de décimales que le pas (ex. 20,25 au pas de 0,5, déjà signalé par `final_scale_off_grid`), Intl arrondit l'affichage de la note plafonnée (« 20,3 »). Prendre le max des décimales du pas et de `finalScale`, ou refuser ce cas en F02.
- [ ] Valider en F04/F11 les données persistées (ajustement hors bornes, attempt `scored` sans `score`) : aujourd'hui `computeScores` lève sur donnée corrompue.

## Persistance

- [ ] Relire `navigator.storage.persisted()` sur `visibilitychange` : le navigateur peut accorder la persistance de lui-même (PWA installée), l'indicateur de F05 resterait sinon à `best-effort` jusqu'au rechargement.
- [ ] Première migration de schéma (`version(2)`) : tester l'ouverture d'un ancien onglet sur une base déjà montée de version.

## Écran de passage

- [ ] Raccourcis clavier : chiffres pour les valeurs du barème, touches pour les catégories, raccourci de skip.
- [x] Helper `requireStudent(session, studentId)` dans `domain/passage/` : la recherche + `student_not_found` est copiée dans `drawQuestion`, `scoreAttempt`, `setActiveStudent` ; F10 et F11 en ajouteront deux copies. *Fait en F10.*
- [ ] Test de la branche défensive `category_not_found` de `scoreAttempt` (inatteignable avec une config figée valide).
- [ ] `studentStatus` et `computeScores` calculés deux fois (`ExaminerView` et `PassageHeader`) : passer le statut en prop si l'écran grossit.
- [ ] `passage-example.test.tsx` : ~1,2 s seul, au-delà de 5 s sous la charge de la suite complète ; délai porté à 15 s en F12. Trouver où part le temps (le panneau n'en explique que ~12 %).
- [x] Panneau latéral : la zone `aria-live` du commentaire annonce « Enregistrement… » puis « Enregistré » à chaque pause de frappe ; n'annoncer que « Enregistré » / « Échec ». → #55. *Livré en F21.*
- [x] `AbsentState` renvoie au panneau alors qu'il peut être replié ou sur l'onglet « Étudiants » : proposer « Afficher le panneau ». Même chose pour l'état « aucun étudiant » depuis F13, qui renvoie à l'onglet « Étudiants » sans l'ouvrir. → #55. *Livré en F21.*
- [ ] Une erreur refusée hors tiroir (ex. « Étudiant suivant » sans suivant) reste dans `actions.error` ; chaque ouverture du tiroir remonte une `role="alert"` avec ce vieux message, réannoncée par le lecteur d'écran. Piste : n'afficher dans le tiroir que les erreurs survenues tiroir ouvert, ou un paragraphe non live.
- [ ] Fermer l'onglet dans les 500 ms qui suivent une frappe perd le commentaire non enregistré (pas de flush sur `pagehide`).
- [ ] Fixtures de tests d'écran (`category` à trois questions, `REVEALED`, `mount`, `panel`) copiées entre `side-panel.test.tsx`, `student-tab.test.tsx`, `final-screen.test.tsx`, `adjustment.test.tsx`, `skip.test.tsx` : à sortir dans `src/testing/`.
- [ ] Popup d'ajustement : focus initial sur le champ plutôt que sur le bouton « − » (vu dans le navigateur, F11).
- [ ] Popup d'ajustement : en cas d'échec d'écriture, l'alerte `write_error` du dialogue et l'alerte générique de la page (« Rechargez la page ») s'affichent ensemble ; effacer l'erreur du hook quand un dialogue la prend en charge.
- [ ] Boutons − / + de l'ajustement : s'arrêter à ±`finalScale` au lieu de laisser le message d'erreur apparaître.
- [ ] Tests d'écran F11 : fixtures (`category` à trois questions, `config()`, `stored()`) copiées entre `adjustment.test.tsx` et `final-screen.test.tsx`, à sortir dans `src/testing/` pour F12/F14 ; cas `decimals: 0` (pas de 1) jamais testé à l'écran.
- [ ] Un backup édité à la main avec `adjustment: { value: 0 }` affiche « 0,00 » au lieu de « aucun ».
- [ ] Dialogue d'ajout d'étudiant : une erreur antérieure (tirage, note) encore dans le hook s'affiche dans le dialogue dès son ouverture ; ne l'y montrer qu'après un échec d'ajout dans ce dialogue (flag local remis à zéro à l'ouverture) (F13).
- [ ] Onglet « Étudiants » (montage partagé dans `src/testing/students-tab-harness.tsx` depuis la PR #45) : le test de double clic ne distingue pas la garde `submitting` du verrou `run` ; pas de test `rosterScore` d'un absent qui a des notes (F13).
- [x] Onglet « Étudiants » : l'icône de l'étudiant projeté n'est vérifiable qu'en test tant que F14 ne permet pas de projeter depuis l'interface. → #56. *Vérifiable depuis F22 : l'aperçu montre l'étudiant projeté.*
- [ ] Vue projetée (F14) : catégorie « indisponible » visuellement identique à « épuisée » (même atténuation, sans libellé) ; séparateur entre catégorie et titre dans le détail, `points ?? 0` pour une question notée sans note.
- [ ] Vue projetée (F14) : `animate` non figé au montage de `DrawReveal` (basculer `drawAnimation` pendant une question rejoue le mélange) ; `cursor-none` non testé au niveau page ; test de réinitialisation qui n'attend pas la disparition de l'énoncé.
- [ ] Vue projetée (F14) : écran étudiant remonté par une `key` sur le nom affiché, deux homonymes partagent un montage ; `key` du détail (catégorie + titre) non garantie unique.
- [ ] Pilotage (F14) : `?search` conservé dans l'URL de la fenêtre projetée ; tests manquants (boutons pendant `busy`, bandeau quand l'étudiant projeté a disparu). *Popup bloquée effacée au clic suivant et référence de fenêtre liée à la session : livrés en F22.*
- [ ] Tests F14 : marqueur `0.37` du test d'étanchéité en sous-chaîne (échec bruyant si un score le contient) ; pas de mutation vérifiée pour `editedAt` et le montant d'ajustement ; test d'architecture aveugle aux réexports de `Session` ; `computeScores` appelé deux fois dans `toProjectedView`.
- [ ] `categoryButton` (`src/testing/passage-assertions.ts`) : `waitFor` au délai par défaut (1 s), à allonger si la CI devient lente.
- [x] Tuiles de catégorie (F25, D74) : seuil du repli sur une colonne à revoir avec l'aperçu de #56. *Livré en F22 : seuil mesuré sur le conteneur (`@min-[40rem]:`, D77).*
- [ ] Aperçu de la vue projetée (F22) : suit le mode clair / sombre de l'examinateur, pas celui mémorisé par la vue projetée (D77) ; à reprendre si l'écart gêne.
- [ ] Tests F22 : `FauxResizeObserver` recopié entre `projection.test.tsx` et `projection-preview-leak.test.tsx` (à sortir dans `src/testing/`) ; commentaire et motif de skip prouvés absents de l'aperçu mais seulement présents en base, pas dans le DOM examinateur ; `useElementWidth` garde la dernière largeur après `ref(null)`.

## Accueil et backup

- [ ] Ignorer le glisser-déposer pendant qu'un dialogue d'import est ouvert (aujourd'hui un second fichier remplace le conflit en attente) et pendant un import en cours.
- [ ] Surimpression de dépôt : compteur `dragenter`/`dragleave` au lieu du test `relatedTarget` (WebKit envoie `relatedTarget = null`, scintillement possible).
- [ ] Garder le contenu des dialogues d'import pendant l'animation de fermeture (il disparaît dès que l'état revient à `idle`).
- [ ] Dédoublonner les issues identiques avant affichage (clé React `chemin|message`).
- [ ] Tests manquants : erreurs d'écriture (renommer, examinateur, suppression), réinitialisation du champ à la réouverture d'un dialogue, « toutes les issues » avec un décompte exact, `score` sur un attempt `skipped`, date locale vs UTC du nom de fichier (cas à 00:30).
- [ ] Désactiver « Annuler » pendant un enregistrement en cours dans les dialogues de saisie.
- [x] Ajouter un favicon (404 sur `/favicon.ico` en preview et en prod). → #53 — réglé par F17 (D72), constaté en F19

## Création de session

- [ ] Factoriser le glisser-déposer (`hasFiles`, dragover/dragleave/drop) de `FileDropField` et `ImportController` dans un hook `useFileDrop(disabled, onFile)`.
- [ ] Remplacer les sauts de ligne et espaces multiples internes aux noms lus dans le CSV par une espace (`"Du\nrand"`).
- [ ] Message dédié pour un fichier séparé par tabulations (aujourd'hui : lignes à un champ puis « aucun étudiant valide »).
- [ ] Garde de montage de la création : comparer aussi `router.state.location.pathname` avant de naviguer (fenêtre résiduelle pendant le chargement du chunk de l'accueil).
- [ ] Tests manquants : courses du slot config (nom saisi pendant la lecture, deux configs successives), messages `read-error` / `load-error` rendus, état `unavailable` à l'écran, `activeStudentId` affirmé dans le test d'écran.

## Thème et langue

- [ ] Le menu du bouton de thème (`DropdownMenuRadioItem`, base-ui) reste ouvert après le choix d'un mode et bloque les clics de la page jusqu'à Échap ou un clic extérieur ; constaté en F21. Piste : fermer le menu à la sélection.
- [ ] Garde-fou de build : un script de fin de build qui échoue si un chunk autre que `icons-*` contient `IconBrandPhp`, ou si `index-*` dépasse un budget. `chunkSizeWarningLimit: 2400` ne surveille plus les autres chunks (D37).
- [ ] Synchroniser le mode entre deux fenêtres d'une même vue (événement `storage`, via `useSyncExternalStore`). Aujourd'hui, la valeur est lue une fois par clé.
- [ ] Tests manquants de `LocaleProvider` : changement de la locale du propriétaire avec une déclaration active, deux imbriqués frères de même locale.
- [ ] `isIconComponent` accepte tout objet non nul : vérifier `$$typeof` si Tabler exporte un jour autre chose que des composants sous un nom `Icon…`.
- [ ] Faire disparaître l'avertissement `missing-typescript-transpiler` de `pnpm deps`, quand dependency-cruiser gérera typescript@7.

## Rendu markdown

- [ ] Fond des blocs colorés : `github-light` a un fond `#fff`, invisible sur une page blanche, alors que les blocs en texte brut (langage inconnu, chargement) gardent `--muted`. Le fond saute donc à la fin de la coloration. À trancher à l'écran (F09 monte désormais `<Markdown>`, pas encore vérifié visuellement) : bordure sur `.shiki`, ou fond clair surchargé. → #58
- [ ] Code en ligne : `@tailwindcss/typography` ajoute des backticks littéraux (`code::before/::after`) et aucun fond ; vu à l'écran en F09. Retirer les pseudo-éléments et donner un fond `--muted` léger. → #58
- [ ] Taille de projection : `prose-2xl` est provisoire, à caler sur un vrai vidéoprojecteur en F14 (D62).
- [ ] Test de régression multi-ligne des offsets de `toHighlightedCode` (clés React), vérifié à la main par la revue finale.
- [ ] F18 : tests manquants, sans bogue connu : import de grammaire en échec puis nouvel essai ; rerender `Python` → `python` de `CodeBlock` ; tabulation et fermeture suivie d'espaces dans `code-fences.test.ts`.
- [ ] e2e F18 : deux fixtures de 178 lignes presque identiques (`e2e/fixtures/languages-*.config.json`), à générer depuis une base commune.
- [ ] Test du libellé de retour d'une note citée deux fois (suffixe `-2` de `footnoteBackLabel`, calqué sur `mdast-util-to-hast`, où `rereferenceIndex` commence à 1).

## Statistiques

- [ ] `check:bundle` ne connaît que Recharts : généraliser (liste de couples bibliothèque → route) quand une deuxième bibliothèque lourde sera confinée à une route.
- [ ] Liste blanche du groupe `vendor` (`vite.config.ts`) à étendre si `check:bundle` rougit après l'ajout d'une dépendance partagée avec Recharts (voir QUIRKS 2026-09-30).
- [ ] e2e : `StatsPage.headcount()` s'appuie sur `.last()` parmi des `div` imbriqués ; passer par `term` → `dd` suivant.
- [ ] Tests manquants : taux négatif (barème à valeurs négatives), frontière 0,999 / 1 sur /20, id inconnu dans `computeSkipped`, départage alphabétique seul des motifs, table des tags non vide à l'écran.
- [ ] Petits nettoyages de `domain/stats/` : `mean` en une seule division, `?? 0` inatteignable dans `strategies.ts`, `countBy` renommé, `Tally` au lieu de `ReturnType<typeof emptyTally>`, commentaire de limite 2^53 de `populationStdDev`.
- [ ] Paragraphe d'état vide répété quatre fois dans `features/stats/components/` : extraire un `StatsEmpty`.

## Export Excel

- [ ] Vérifier l'ouverture dans Excel (critère d'acceptation de F16, fait seulement sous LibreOffice) : pas d'invite de réparation, volet figé (`activePane="bottomRight"` avec `xSplit="0"` écrit par write-excel-file).
- [ ] Autofiltre sur Synthèse et Détail (hors périmètre F16, D35) si la consolidation le demande.
- [x] Export depuis la carte de session de l'accueil (à côté du backup), sans ouvrir la vue examinateur. → #54. *Livré en F20 (item du menu « … »).*
- [x] Garde double-clic de `ExportButton` sur un `useRef` plutôt que sur l'état du rendu. → #54. *Livré en F20 (`useWorkbookExport`).*
- [ ] Classe de lien (`text-sm text-primary underline underline-offset-4`) recopiée entre `create-session-page.tsx` et `action-cards.tsx` : à sortir dans `components/` si un troisième écran en a besoin (F20).
- [ ] Accueil (F20) : `session-card` importe `exportWorkbook`, qui tire `buildWorkbook` et `computeStats` dans le chunk de l'accueil (chargé à la demande, hors bundle initial). Les passer dans l'`import()` dynamique si la taille du chunk devient gênante.

## Hors ligne

- [ ] Vérifier à la main l'installation dans Chrome et Edge, et la mise à jour au premier déploiement réel après F17 (critères de #17).
- [ ] Vue projetée ouverte sans contrôleur (Shift+Reload) : son premier `controllerchange` réel est pris pour celui de `clientsClaim`, elle ne se recharge pas à l'activation d'une version (sans effet en ligne ; hors ligne, ses chunks à la demande manqueraient).
- [ ] Plafond `maximumFileSizeToCacheInBytes` à ~31 kB du chunk Tabler : une montée de `@tabler/icons-react` fera rougir `check:precache`, relever alors la valeur.
- [ ] Icônes du manifeste pré-cachées deux fois (motif glob + `includeManifestIcons`), sans effet ; `includeManifestIcons: false` pour un manifeste net.
- [ ] Vérification périodique des mises à jour pendant la journée, message « prêt hors ligne » (hors périmètre F17).
- [ ] e2e : `highlightedCode` (`.first()`) peut se satisfaire d'un bloc de la question précédente ; le scoper à la question courante.
