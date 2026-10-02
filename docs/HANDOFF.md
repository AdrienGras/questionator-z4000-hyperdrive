# Handoff — état courant du projet

Notes informelles à destination de la prochaine session (humaine ou Claude). Format
libre, **antéchronologique** : l'entrée la plus récente en haut.

**À mettre à jour à la fin d'une session significative.** Pas besoin de noter chaque
petit truc — l'idée est de se resituer en 30 secondes en début de session.

Chaque entrée est un titre `## AAAA-MM-JJ — Titre court de la session`, suivi de
quatre marqueurs en **gras**, chacun en tête de paragraphe, dans cet ordre :
`**Dernière chose faite**`, `**Trucs en suspens**`, `**Prochaine chose à creuser**`,
`**Notes pour future Claude**`.

**Ces quatre marqueurs sont obligatoires, exactement sous cette forme — jamais en
sous-titres `###`, jamais en prose libre sans eux.** Le hook `SessionStart` extrait
le digest de resituation injecté à chaque démarrage de session en cherchant CES
marqueurs précis dans la dernière entrée. Une entrée qui ne les porte pas dégrade
silencieusement la resituation vers un extrait brut des 2000 premiers caractères du
corps, sans distinction entre ce qui est fait, en suspens, ou à creuser.

---

<!-- ARCHIVES:START -->
> Entrées antérieures archivées : [2026-09](handoff/2026-09.md)
<!-- ARCHIVES:END -->

## 2026-10-02 — #87 PR 2 : accueil, création, persistance, langue

**Dernière chose faite** : PR #106 (tests instables) mergée sur go de l'utilisateur. La PR 2 de #87 est faite sur `chore/87-dette-accueil-creation` par un subagent, puis relue ; les 8 lignes du BACKLOG sont traitées :
- un backup où deux étudiants partagent un `order` est refusé à l'import (`duplicate_student_order`, D89, qui nuance D81). Une session déjà stockée n'est jamais marquée endommagée pour cette raison (arbitrage du contrôleur) ;
- `listSessions` lit la table en une seule fois et trie en mémoire. Un `updatedAt` non textuel, donc déjà endommagé, se range désormais avec les sessions sans date ;
- filet `window` du glisser-déposer : une sortie de fenêtre arme une minuterie de 100 ms, annulée par tout `dragenter` ou `dragover`. La revue a montré que la première version, à drapeau, ne marchait pas dans Chromium ni Firefox ;
- `back_home` avec `’` ;
- classe de lien partagée (`text-link.ts`, 10 liens) ;
- tests manquants de l'accueil, de la création et de `LocaleProvider`.

**Trucs en suspens** : PR à ouvrir, Sonar, puis « Ready for review » ; ne pas merger sans le go de l'utilisateur. Le comportement réel du filet de glisser-déposer dans Safari et Firefox reste à vérifier à la main (#77).

**Prochaine chose à creuser** : après le merge, la PR 3 de #87 (projection, rendu markdown, éditeur, et le cas « appel écarté » de `ResetDialog`/`AdjustmentDialog`/absence), puis la PR 4 (stats).

**Notes pour future Claude** : jsdom n'a pas de `DragEvent`, et le `relatedTarget` passé à `fireEvent` est ignoré sans bruit (QUIRKS). Pour des tests de glisser-déposer réalistes, construire l'événement avec `createEvent` puis `defineProperty`.

## 2026-10-02 — #87 : tests instables expliqués et corrigés

**Dernière chose faite** : PR #105 (#87 PR 1) mergée sur go de l'utilisateur. À sa demande, investigation dédiée des tests instables sur `chore/87-tests-instables`, par un subagent, mesures à l'appui (environ 90 suites complètes) :
- machine calme : 0 échec sur 20 suites, avant comme après ;
- échecs reproduits en chargeant le CPU (8 boucles actives) : 6 sur 7 avant, 0 sur 20 après ;
- causes : CPU saturé (15 workers, jsdom recréé par fichier) contre des délais de 5 s ; `config-editor-page` chargeait icônes et Shiki pour rien ; deux tests attendaient un état déjà à l'écran avant l'action (`create-session` : « window is not defined », la navigation n'était même pas vérifiée ; `add-student` : course sur la barre de titre).

Corrections : `test.maxWorkers: '75%'`, doublures icônes et Shiki dans les tests de l'éditeur, attentes corrigées, règle dans CONVENTIONS, entrée QUIRKS. Machine calme : p50 32,2 → 31,8 s, test le plus lent 4,57 → 2,77 s.

**Trucs en suspens** : PR à ouvrir, Sonar, puis « Ready for review » ; ne pas merger sans le go de l'utilisateur. Restes au BACKLOG : `vmThreads` ou `isolate: false` (#88), garde-fou de la convention des doublures (#88), échec `getByRole('banner')` jamais reproduit (#87). L'e2e `color-mode` n'a pas été examiné (#88).

**Prochaine chose à creuser** : après le merge, PR 2 de #87 (accueil, création, persistance, langue), puis PR 3 (projection, rendu, éditeur) et PR 4 (stats ; la partie « instables » est faite ici).

**Notes pour future Claude** :
- Pour reproduire une instabilité, charger le CPU pendant la suite : `scratchpad/flaky/hog.sh`, `runs.sh` et `agg.mjs` (rapport JSON de Vitest agrégé). Sur une machine calme, rien n'échoue.
- Ne jamais faire tourner deux suites complètes en même temps : implémenteur, relecteur et e2e se marchent dessus.

## 2026-10-01 — #87 PR 1 : dette de l'écran de passage

**Dernière chose faite** : PR #99 (#86) mergée sur go de l'utilisateur. #87 découpé en 4 PR successives, découpage validé par l'utilisateur : écran de passage ; accueil, création, persistance, langue ; projection, rendu, éditeur ; stats, puis les tests instables. La PR 1 est faite sur `chore/87-dette-ecran-passage` par un subagent, puis relue :
- les 15 lignes du BACKLOG de l'écran de passage sont traitées : fixtures regroupées et paramétrables dans `src/testing/` (`deferred`, `FauxResizeObserver`, `storedSession` sur `getHealthySession`), tests manquants, statut et notes calculés une fois dans `ExaminerView` ;
- trois défauts corrigés : `?search` retiré de l'URL de la fenêtre projetée, brouillons de commentaire effacés à la suppression et à l'import, une seule alerte sur l'échec d'ajout d'étudiant ;
- l'ajout d'étudiant renvoie désormais son issue (`written` / `failed` / `ignored`) ;
- `passage-example` est passé de 4,35 s à environ 2,1 s sous la suite (QUIRKS : icônes Tabler et Shiki tirés par la config d'exemple).

**Trucs en suspens** : PR à ouvrir, Sonar, puis « Ready for review » ; ne pas merger sans le go de l'utilisateur. Changement visible : l'échec d'ajout d'étudiant affiche `write_error`. L'utilisateur s'intéresse aux tests instables : une investigation dédiée, mesures sur une vingtaine de suites complètes, est proposée à la place de la partie « instables » de la PR 4. 3 échecs sur environ 13 suites ont été vus pendant la PR 1 (`config-editor-page` « ouvre l'exemple… » à 5 s, `add-student`, un non identifié). Hypothèse : charge CPU (177 jsdom) contre des délais de 5 s, avec icônes et Shiki chargés au premier rendu.

**Prochaine chose à creuser** : après le merge, investigation des tests instables si l'utilisateur la valide, puis PR 2 de #87 (accueil, création, persistance, langue).

**Notes pour future Claude** : le brief de chaque PR = les lignes exactes du BACKLOG (numéros sur `main`) plus des arbitrages explicites ; ça a bien marché avec un implémenteur Opus et une revue Opus. Ne pas lancer deux suites complètes en parallèle (implémenteur et relecteur) : la charge CPU est justement suspecte dans les instabilités.

## 2026-10-01 — #86 : budgets de taille du build

**Dernière chose faite** : PR #98 (F32) mergée sur go de l'utilisateur. #86 implémenté sur `chore/86-budget-bundle` (D88), ticket borné, design validé en session : `pnpm check:budget` (`scripts/check-bundle-budget.ts`, en CI après `check:precache`) mesure en gzip le premier affichage de l'accueil (entrée + route `/`, ≤ 275 Ko, mesuré 238,5 Ko) et chaque chunk (≤ 135 Ko, hors `icons-*` et grammaires/thèmes Shiki), vérifie que `IconBrandPhp` reste dans le chunk des icônes, avec des gardes de non-vacuité. Choix de l'utilisateur : gzip, marge ~15 %. Écart au design annoncé, signalé : la route `/` est comptée avec l'entrée, car elle est découpée paresseusement et `check:bundle` ne la voit pas (QUIRKS). Preuve : Recharts importé dans l'accueil passait `check:bundle` et `check:budget` le refuse (+98,9 Ko) ; après la revue de branche, `check:bundle` part aussi de la route `/` et le refuse à son tour.

**Trucs en suspens** : PR à ouvrir en brouillon, Sonar, puis « Ready for review » ; ne pas merger sans le go de l'utilisateur.

**Prochaine chose à creuser** : après le merge, #87 (dette de tests et de code : beaucoup de mineurs rangés là, dont les tests instables), puis #88 (outillage) ; #85 (Node 26) à partir du 2026-10-28.

**Notes pour future Claude** : relever un budget se fait dans les constantes de `scripts/check-bundle-budget.ts`, avec la mesure du jour en commentaire ; jamais pour absorber une fuite. `check:bundle` part maintenant aussi de la route `/` (`HOME_ROUTE_KEY`), comme le budget : une route découpée paresseusement mais chargée d'office se traite comme une entrée.

## 2026-10-01 — F32 (#80) : aide à la saisie depuis le JSON Schema

**Dernière chose faite** : PR #97 (F36) mergée sur go de l'utilisateur. F32 implémentée sur `feat/80-aide-saisie-schema` (D87), avec une spec et un plan courts (`docs/superpowers/`), exécutés par subagents avec une revue par tâche puis une revue finale de branche :
- chaque champ du schéma Zod porte une description en français (`.meta`) et, s'il en a un, un défaut lu dans `CONFIG_DEFAULTS` ;
- `buildConfigJsonSchema` ajoute un `markdownDescription` (description + « Défaut : `…` »), car le survol de VS Code ignore `default` ;
- `features/config-editor/schema-assist.ts` (module pur, `jsonc-parser`) calcule les complétions (clés, `enum`, `const`, booléens, `null`) et le survol ;
- `JsonEditor` branche Ctrl+Espace et l'infobulle de survol.

Choix de l'utilisateur : descriptions en français seul ; complétion maison plutôt que `codemirror-json-schema` (non maintenu, tire shiki v1). La revue finale a trouvé le trou VS Code et deux bugs à l'acceptation d'une complétion (mot en cours conservé, double deux-points au renommage), tous corrigés et testés.

**Trucs en suspens** : PR à ouvrir en brouillon, Sonar, puis « Ready for review » ; ne pas merger sans le go de l'utilisateur. À vérifier à la main (#77) : le survol dans un vrai VS Code (description et « Défaut : » en Markdown) et la couleur de l'option sélectionnée en mode sombre (l'e2e ne la vérifie qu'en clair). `color-mode.spec.ts` a encore échoué une fois sur une suite e2e complète (#87).

**Prochaine chose à creuser** : après le merge de F32, les chores #86 (budget de bundle), #87 (dette de tests et de code), #88 (outillage) ; #85 (Node 26) pas avant le 2026-10-28.

**Notes pour future Claude** :
- Tout ajout de champ au schéma de config exige une `description` : `json-schema.test.ts` échoue sinon, et `markdownDescription` se déduit tout seul.
- `example.test.ts` déclare `markdownDescription` à ajv en mode strict.
- Dans un e2e CodeMirror, Entrée est ignorée pendant 75 ms après l'ouverture de la liste (`interactionDelay`) : d'où l'attente fixe de `config-editor.spec.ts`, commentée.
- Un pointeur posé sur la liste change l'option sélectionnée : éloigner la souris.

## 2026-10-01 — F36 (#84) : mises à jour en cours de journée

**Dernière chose faite** : F36 implémentée sur `feat/84-mises-a-jour-journee` (D86), ticket borné, design validé en session :
- `PwaUpdate` vérifie la mise à jour toutes les heures, au retour sur l'onglet et au retour du réseau. Ces deux derniers déclencheurs sont limités à une vérification par tranche de 5 minutes, limite levée après un échec. Choix de l'utilisateur : 1 h, plus le retour sur l'onglet et du réseau.
- Pastille « Prête pour le hors ligne » à fermer par « OK » (choix de l'utilisateur, plutôt qu'une disparition automatique).
- Le premier `controllerchange` d'une page sans contrôleur n'est ignoré que si aucun worker n'était actif au démarrage : la vue projetée ouverte par Shift+Reload se recharge maintenant. Le même filtre évite un faux « Prête pour le hors ligne » après un Shift+Reload qui trouve une version.

Tests de correctif prouvés rouges sans le correctif, y compris deux e2e (vérification horaire par `page.clock`, Shift+Reload par CDP). Une revue de branche par un relecteur neuf n'a rien trouvé de bloquant ; ses mineurs ont été corrigés.

**Trucs en suspens** : PR à ouvrir en brouillon, Sonar, puis « Ready for review » ; ne pas merger sans le go de l'utilisateur. Pendant F36, trois tests ont échoué une fois chacun sans être reproduits : deux unitaires (`add-student`, `config-editor-page`) et un e2e (`color-mode`), tous rangés au BACKLOG → #87. À vérifier à la main (#77) : la pastille hors ligne sur un vrai premier chargement de GitHub Pages.

**Prochaine chose à creuser** : après le merge de F36, #80 (F32, aide à la saisie depuis le JSON Schema), puis les chores #86, #87, #88 ; #85 (Node 26) pas avant le 2026-10-28.

**Notes pour future Claude** : `PwaUpdate` a maintenant deux états observables (`status`, `offlineReady`) sur le même abonnement `onStatusChange`. Ses déclencheurs (`UpdateTriggers`) sont injectables. Le vrai `browserTriggers` n'est posé que lorsque `onRegisteredSW` reçoit un enregistrement, donc aucun minuteur réel ne traîne dans vitest. Pour les e2e de service worker, voir QUIRKS « Simuler un Shift+Reload ou une heure qui passe ». Une page sous contrôle garde une décision synchrone sur `controllerchange` : les tests de hooks et de routes en dépendent.

## 2026-10-01 — Vague de fix terminée, suite : #84, #80, puis les chores

**Dernière chose faite** : PR #95 (F33) mergée sur go de l'utilisateur. La vague de fix est entièrement livrée et mergée : #76 (PR #90, menu de thème), #79 (PR #91, F31 robustesse), #78 (PR #92, F30 écran de passage), #83 (PR #93, F35 fichiers d'entrée), #82 (PR #94, F34 glisser-déposer), #81 (PR #95, F33 vue projetée). Décisions D81 à D85.

**Trucs en suspens** : #77 (vérifications manuelles) reste à faire par l'utilisateur, avec en plus : Safari pour le glisser-déposer (F34, pas de clignotement, contenu des dialogues pendant la fermeture), rendu des tuiles sur un vrai vidéoprojecteur (F33, lisibilité de « Épuisée » à `opacity-40`). Un e2e local a échoué une fois sans être reproduit (F34) ; deux tests unitaires instables connus (BACKLOG → #87). #71 à #74 (documentation) sans priorité.

**Prochaine chose à creuser** : ordre fixé par l'utilisateur : #84 (F36, mises à jour en cours de journée), puis #80 (F32, aide à la saisie depuis le JSON Schema), puis les chores #86 (budget de bundle), #87 (dette de tests et de code, beaucoup de mineurs y ont été rangés pendant la vague), #88 (outillage), et #85 (Node 26) pas avant sa sortie LTS le 2026-10-28. Partir de `main` à jour, une branche et une PR par ticket.

**Notes pour future Claude** : méthode qui a bien marché pendant la vague. Ticket borné : design court en chat, validé par l'utilisateur, exécution directe en TDD puis une revue de toute la branche par un relecteur neuf (modèle le plus capable). Ticket plus gros (F31, F30) : spec ou plan court et sous-agents par tâche avec revue à chaque tâche. Dans les deux cas : prouver chaque test de correctif rouge en retirant le correctif (et vérifier par `grep -c` que le retrait a bien eu lieu), lancer `pnpm build && pnpm check:bundle` et `pnpm e2e` avant la PR, puis Sonar (`.claude/scripts/sonar-check.sh --pr <n> --wait`) ; Sonar a relevé deux fois un défaut que `pnpm check` laisse passer (test e2e sans assertion dans son corps, ternaire imbriqué).

## 2026-10-01 — F33 (#81) : finitions de la vue projetée, fin de la vague de fix

**Dernière chose faite** : PR #94 (F34) mergée sur go de l'utilisateur. F33 implémentée sur `feat/81-finitions-projection` (D85), en exécution directe : tuiles de la vue projetée à états (« Épuisée », catégorie en cours mise en avant, « Indisponible » seulement en fin de passage — choix de l'utilisateur) ; détail final « catégorie · titre » et « — » au lieu d'un « 0 » inventé ; écran étudiant monté sur `student.order` (homonymes) et lignes du détail sur `questionId` ; animation de tirage figée au montage. Chaque test de correctif prouvé rouge en retirant le correctif. Avec ce ticket, la vague de fix convenue (#76, #79, #78, #83, #82, #81) est terminée.

**Trucs en suspens** : PR de F33 (brouillon, Sonar, puis « Ready for review »), merge sur go de l'utilisateur. #77 (vérifications manuelles) reste à faire à la main, avec en plus : Safari pour le glisser-déposer (F34), rendu des tuiles sur un vrai vidéoprojecteur, en particulier la lisibilité de « Épuisée » sur une tuile à `opacity-40` (F33).

**Prochaine chose à creuser** : demander à l'utilisateur la suite après la vague de fix : #84 (F36, mises à jour en cours de journée), #80 (F32, aide à la saisie depuis le JSON Schema), les chores (#85 pas avant le 28/10, #86, #87, #88) ou la documentation (#71 à #74).

**Notes pour future Claude** : le stub `matchMedia` des tests peut annoncer `prefers-reduced-motion` : prouver « pas d'animation » avec `[data-card], .draw-reveal, .animate-in`. Pour prouver un test rouge par `sed`, vérifier que le motif a bien été remplacé (`grep -c`) : prettier fusionne parfois les lignes.

## 2026-10-01 — F34 (#82) : glisser-déposer fiabilisé

**Dernière chose faite** : PR #93 (F35) mergée sur go de l'utilisateur. F34 implémentée sur `feat/82-glisser-deposer` (D84), en exécution directe : `useFileDrop` (`src/hooks/`) remplace les trois implémentations (compteur `dragenter`/`dragleave`, plus de clignotement WebKit) ; l'import de backup ignore un dépôt pendant un dialogue ou un import en cours ; ses dialogues gardent leur contenu pendant la fermeture (`useRetained`) ; issues dédoublonnées (`uniqueBy`). Gardes d'import prouvées une à une en les retirant : zone désactivée pendant un dialogue (contrôleur), verrou `busy` et refus d'un import par-dessus un dialogue ouvert (hook, `use-backup-import.test.ts`).

**Trucs en suspens** : PR de F34 (brouillon, Sonar, puis « Ready for review »), merge sur go de l'utilisateur. Le non-clignotement sous WebKit et le contenu retenu pendant l'animation ne se voient qu'en vrai navigateur : à vérifier à la main (Safari), ajoutable à #77.

**Prochaine chose à creuser** : #81 (F33, finitions de la vue projetée), dernier ticket de la vague de fix.

**Notes pour future Claude** : jsdom démonte un dialogue Base UI dès sa fermeture et masque `main` derrière un modal (QUIRKS) : la rétention du contenu se teste sur `useRetained`, un dépôt pendant un dialogue avec `getByRole('main', { hidden: true })`.

## 2026-10-01 — F35 (#83) : fichiers d'entrée plus tolérants

**Dernière chose faite** : PR #92 (F30) mergée sur go de l'utilisateur. F35 implémentée sur `feat/83-fichiers-tolerants` (D83), en exécution directe (portée petite) : CSV séparé par tabulations lu comme le même fichier à virgules, sauts de ligne et espaces répétées d'une cellule réduits à une espace, numéro de ligne cité = ligne du tableur (choix de l'utilisateur en revue) ; config : erreurs `padded_id` et `unicode_variant_id`, au même titre que les doublons, visibles à la création et dans l'éditeur. PRODUCT.md §6.1 et §6.2 à jour.

**Trucs en suspens** : PR de F35 (brouillon, Sonar, puis « Ready for review »), merge sur go de l'utilisateur.

**Prochaine chose à creuser** : #82 (F34, glisser-déposer fiabilisé), puis #81 (F33), dans l'ordre convenu de la vague de fix.

**Notes pour future Claude** : `Record` est un utilitaire global de TypeScript : ne pas nommer un type local ainsi. Les deux nouvelles erreurs de config valent aussi pour l'import de backup et la lecture des sessions stockées (`checkStoredSession`) : une session avec un tel id serait « endommagée ».

## 2026-10-01 — F30 (#78) : finitions de l'écran de passage

**Dernière chose faite** : F30 implémentée sur `feat/78-finitions-passage` (D82). Fixtures d'écran partagées (`src/testing/screen-fixtures.ts`) ; dialogue d'ajustement (focus sur le champ, − / + bornés à ±`finalScale`, `run(mutator, { ownError })` pour `adjust` / `revealFinal`) ; « aucun » pour un ajustement absent ou nul ; `useFreshError` dans `SidePanel` et `AddStudentDialog` ; « Annuler » et Échap verrouillés pendant l'écriture dans quatre dialogues ; `useAutosave` flushe sur `pagehide` et `CommentField` garde une copie synchrone du commentaire dans `localStorage` (`comment-draft.ts`) : taper puis recharger immédiatement retrouve la saisie (e2e `comment-reload.spec.ts`). Vague finale : `reset` et la confirmation d'absence passent `ownError` (plus de double alerte), et le contenu du champ d'ajustement est sélectionné à l'ouverture.

**Trucs en suspens** : ouvrir la PR (brouillon), `.claude/scripts/sonar-check.sh --pr <n> --wait`, passer en « Ready for review », merger sur le go de l'utilisateur.

**Prochaine chose à creuser** : #83 (F35, fichiers d'entrée plus tolérants), selon l'ordre convenu #76, #79, #78, #83, #82, #81.

**Notes pour future Claude** : une erreur ne s'affiche que dans la surface où elle est survenue (`ownError` + `useFreshError`, CONVENTIONS § « Dialogue de saisie »). Mineurs reportés au BACKLOG (→ #87) : `deferred<T>()` dupliqué, `setTimeout(100)` dans `stale-errors.test.tsx`, commentaire sur `PassageActions`. Fixtures locales restantes : échelle `[0, 1, 2, 3]` (side-panel, student-tab), `skip` à quatre questions. QUIRKS : écriture IndexedDB à `pagehide`. Une copie locale restée en place l'emporte sur un commentaire changé dans un autre onglet (D82).

## 2026-10-01 — F31 (#79) : sessions endommagées, échelle hors grille refusée, persistance relue

**Dernière chose faite** : F31 implémentée sur `feat/79-robustesse-donnees` (D81). Toute lecture IndexedDB est validée par `checkStoredSession` (mêmes règles que l'import de backup) ; un enregistrement invalide devient un `DamagedSession` (`isDamaged`). Écran « Cette session est endommagée » (examinateur : export du brut, détails ; vue projetée : titre seul), carte « Endommagée » à l'accueil, `updateSession` qui lève `SessionDamagedError` sans écrire. `final_scale_off_grid` est maintenant une erreur ; nouvelle règle `invalid_adjustment` ; `persistence.ts` relit `persisted()` au retour sur l'onglet. e2e `e2e/damaged-session.spec.ts` (corruption par IndexedDB, rechargement, export, retour à l'accueil) vert. Correctif R2 : `lib/db` charge le validateur à la demande (`loadReadStored()`, avant la transaction de `updateSession`), `isKnownLanguage` est injecté par la création et l'éditeur seuls, `check:bundle` est repointé sur `code-languages.ts` (voir D81) ; le bundle initial reste sans `shiki/langs`. Mémoire mise à jour (D81 + notes de remplacement sur D02/D20, INDEX, QUIRKS, BACKLOG, CONVENTIONS).

**Trucs en suspens** : ouvrir la PR en brouillon, `.claude/scripts/sonar-check.sh --pr <n> --wait`, passer en « Ready for review », puis merger sur le go de l'utilisateur. Deux tests instables vus pendant F31 (consignés au BACKLOG, → #87) : `create-session-page.test.tsx` (« window is not defined » au démontage du routeur) et `config-editor-page.test.tsx` (`getByRole('banner')`, une fois).

**Prochaine chose à creuser** : #78 (F30).

**Notes pour future Claude** : une fixture qui sème une session incohérente est lue comme endommagée (QUIRKS) : utiliser `healthy()`. L'import d'un backup par-dessus une session endommagée reste le chemin de réparation. Ne pas rouvrir la question de la vue projetée : elle ne reçoit jamais la session (D69).

## 2026-10-01 — #76 corrigé : le menu de thème se ferme au choix d'un mode

**Dernière chose faite** : priorités relues avec l'utilisateur, qui a validé une vague de fix dans cet ordre : #76, #79, #78, #83, #82, #81 ; ensuite #84, #80, puis les chores (#85 pas avant le 28/10). #77 reste à faire à la main par l'utilisateur ; #71 à #74 n'ont pas de priorité. #76 corrigé sur `fix/76-menu-theme` : `closeOnClick` sur les `DropdownMenuRadioItem` de `ColorModeToggle`, deux tests unitaires (souris et clavier) et un e2e `color-mode.spec.ts` (changement de mode puis tirage), rouge sans le correctif.

**Trucs en suspens** : PR de #76 (brouillon, Sonar, puis « Ready for review »), merge sur go de l'utilisateur. Un premier `pnpm check` a eu un test unitaire en échec, que je n'ai pas pu identifier ; cinq exécutions suivantes (suite seule et `pnpm check`) sont vertes. À surveiller.

**Prochaine chose à creuser** : #79 (F31, robustesse des données persistées), en partant de `main` à jour après le merge de #76.

**Notes pour future Claude** : `RadioItem` et `CheckboxItem` de base-ui gardent le menu ouvert par défaut (QUIRKS). Le blocage du clic suivant ne se voit pas dans jsdom : le reproduire en e2e. Le filtre `rtk vitest` échoue sur ce dépôt (« All parsing tiers failed ») : lancer `rtk proxy pnpm exec vitest run …`.

## 2026-10-01 — F26 mergé, BACKLOG relu et découpé en tickets (#76 à #88)

**Dernière chose faite** : PR #75 (F26) mergée sur go de l'utilisateur. BACKLOG relu item par item avec l'utilisateur, et 13 tickets créés, tous au Project n°3 en Backlog :
- #76 bug du menu de thème (P1) ;
- #77 vérifications manuelles V1, en checklist (P1) ;
- #78 F30 finitions de l'écran de passage, commentaire perdu à la fermeture compris ;
- #79 F31 robustesse des données persistées ;
- #80 F32 aide à la saisie depuis le JSON Schema ;
- #81 F33 finitions de la vue projetée ;
- #82 F34 glisser-déposer fiabilisé ;
- #83 F35 fichiers d'entrée plus tolérants (tabulation acceptée) ;
- #84 F36 mises à jour en cours de journée ;
- #85 Node 26 ;
- #86 budget de bundle ;
- #87 dette de tests et de code ;
- #88 outillage.
Label `chore` créé. Les items repris portent un renvoi `→ #n` dans le BACKLOG.

**Trucs en suspens** : PR de docs de cette entrée (BACKLOG, HANDOFF) à merger. Tickets #71 à #74 (site de documentation, guides, animation du README) ouverts par l'utilisateur, pas encore traités. Restent au BACKLOG sans ticket : raccourcis clavier de notation (refusés pour l'instant), migration `version(2)`, autofiltre Excel, mode de couleur de l'aperçu, synchronisation du mode entre fenêtres, et quelques petits points.

**Prochaine chose à creuser** : demander à l'utilisateur l'ordre de passage. Ordre proposé : #76 (bug P1, XS), puis #78 ou #79 ; #77 se fait à la main, de son côté.

**Notes pour future Claude** : le Project n°3 ajoute lui-même les nouvelles issues (`gh project item-add` répond « Content already exists ») ; renseigner les champs avec `gh project item-edit 3 --owner AdrienGras --url <issue> --field <nom> --value <valeur>`. Priorités du Project : P0 à P2 seulement. Numérotation des features : F27 à F29 sont pris par #71 à #73 ; la prochaine libre est F37.

## 2026-10-01 — F24 mergé, F26 : éditeur de config (#60)

**Dernière chose faite** : PR #70 (F24) mergée sur go de l'utilisateur. F26 implémenté sur `feat/f26-editeur-config` en subagent-driven development : neuf tâches revues (trois cycles de correction), une revue finale, une vague de corrections et sa re-revue. Livré :
- route `#/editor` et carte d'accueil « Éditer une config » ;
- `JsonEditor` CodeMirror 6, dans un chunk `codemirror` hors bundle initial ;
- validation en direct, `locateIssue`, diagnostics et liste d'issues cliquable ;
- brouillon `localStorage`, enregistré aussi au `pagehide` ;
- aperçu au thème et à la langue de la config (`ThemeScope`, `LocaleScope` non déclarant, `ProjectionCanvas`, `previewSession`), marqué périmé si la config est invalide ;
- téléchargement, et « Créer une session » par `lib/config-handoff.ts` + `setConfigText`.
Vérifs : `pnpm check` (1327 tests), e2e 18/18 (6 pour l'éditeur), `check:bundle`, `check:precache` ; vérifié à l'écran en clair et en sombre à 1440 px.

**Trucs en suspens** : PR F26 à ouvrir en brouillon, Sonar, « Ready for review », puis go de l'utilisateur. À vérifier à la main avant merge : le hors ligne (`pnpm build && pnpm preview`), et un navigateur en anglais avec l'exemple `fr` (l'écran final doit dire « Note »). BACKLOG « Éditeur de config » : `locateIssue` (BOM, colonne hors ligne), `configFileName` à sortir dans `domain/`, tests `JsonEditor`.

**Prochaine chose à creuser** : la série V1 des retours de tests manuels est terminée (F19 à F26). Il restera à relire le BACKLOG avec l'utilisateur pour choisir la suite.

**Notes pour future Claude** : un `LocaleProvider` imbriqué réécrit `<html lang>` pour toute la page (QUIRKS) ; pour une portée partielle, utiliser `LocaleScope` avec un `lang` local. CodeMirror ne rend que les lignes visibles : faire défiler la ligne (clic sur l'issue) avant d'asserter dans le DOM. Un fichier déposé sur CodeMirror est ignoré par l'éditeur (`Prec.highest` sur `drop`) : c'est la page qui remplace le texte. La session Claude a changé en cours de F26 : les commits portent l'identifiant de session courant.

## 2026-10-01 — F20 mergé, F24 : fond des blocs de code (#58)

**Dernière chose faite** : PR #69 (F20) mergée sur go de l'utilisateur. F24 traité comme ticket borné (design court validé en conversation, pas de spec ni de plan), sur `feat/f24-blocs-de-code`. Dans `src/index.css`, le fond du thème Shiki est abandonné : blocs colorés et bruts partagent `--muted` avec une bordure `--border`. Le code en ligne n'a plus de backticks et prend un fond `--muted`. Nouvel e2e `e2e/code-style.spec.ts` (clair et sombre, `getComputedStyle`), test de `index.css` adapté dans `code-block.test.tsx`. D79, INDEX, BACKLOG et CONVENTIONS sont à jour. Vérifié à l'écran : vue examinateur clair et sombre, vue projetée sombre.

**Trucs en suspens** : PR F24 à ouvrir en brouillon, Sonar, « Ready for review », puis go de l'utilisateur. Toujours au BACKLOG : taille de projection `prose-2xl`.

**Prochaine chose à creuser** : #60 (F26, éditeur de config ; ses dépendances #54 et #56 sont mergées).

**Notes pour future Claude** : un réglage CSS (index.css, prose) ne se teste pas en Vitest/jsdom, sauf par lecture du texte du fichier. Le vérifier en e2e avec `getComputedStyle`, en imposant le mode par `presentation.defaultColorMode` dans la config du test : la fixture python est en `dark`, et `emulateMedia` n'y change rien. Les sélecteurs e2e de la vue de passage doivent exclure `[data-projection-canvas]`. `pkill -f "<motif>"` lancé depuis le shell de l'outil tue ce shell s'il contient le motif : viser le PID.

## 2026-10-01 — F22 mergé, F20 : accueil sur deux colonnes (#54)

**Dernière chose faite** : PR #68 (F22) mergée sur go de l'utilisateur. F20 implémenté sur `feat/f20-accueil-deux-colonnes` en subagent-driven development (quatre tâches revues, revue finale, correctifs : titres h3 dans la région « Sessions », clé `create_config_example_link`). `ActionCards` : « Nouvelle session » (liens vers les exemples et le JSON Schema) et « Restaurer une session ». Grille `lg:grid-cols-[24rem_minmax(0,1fr)]`, sessions en `2xl:grid-cols-2`. La barre de titre est réduite à l'indicateur de persistance et au thème, l'état vide à un message. Export Excel dans le menu « … » de la carte de session via `useWorkbookExport` (`components/export/`, garde en `useRef`), partagé avec `ExportButton`. D78, `PRODUCT.md` F05, F16 et F20, INDEX et BACKLOG sont à jour. Vérifié dans le navigateur à 1440 et 900 px ; aucun chunk xlsx au chargement de l'accueil.

**Trucs en suspens** : PR F20 à ouvrir en brouillon, Sonar, « Ready for review », puis go de l'utilisateur. Le clic « Exporter en Excel » depuis la carte n'a pas été vérifié dans le navigateur (le navigateur Playwright MCP plante sur le téléchargement) ; il est couvert par les tests unitaires. BACKLOG : classe de lien recopiée entre la création et l'accueil, `buildWorkbook` / `computeStats` dans le chunk de l'accueil.

**Prochaine chose à creuser** : #58 (F24, fond des blocs de code), puis #60 (F26, éditeur de config, débloqué une fois #54 et #56 mergés).

**Notes pour future Claude** : l'accueil a maintenant des titres `h3` à la fois dans les cartes d'action et dans les cartes de session : scoper les requêtes de test par `region` (« Actions », « Sessions »). La page de création a un `h1` « Nouvelle session » et la carte d'action un `h3` du même nom : filtrer par `level`. Le navigateur Playwright MCP plante sur un téléchargement déclenché depuis la page : vérifier un export par les tests ou à la main.

