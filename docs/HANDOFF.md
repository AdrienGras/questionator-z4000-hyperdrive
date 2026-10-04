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

## 2026-10-04 — #130 : bannière animée du README

**Dernière chose faite** : la vidéo de présentation fournie par l'utilisateur (motion design, 30 s) est convertie en AVIF animé 1600 px, 30 i/s (`assets/readme-banner.avif`, 2,5 Mo), affichée en tête du README dans un `<picture>`, avec un WebP animé 800 px en secours et une image fixe pour le mouvement réduit (`assets/readme-banner-still.webp`). La première version, en WebP 800 px / 12 i/s, était pixélisée et saccadée. `assets/readme-hero.svg`, `check:hero` et son script sont retirés ; `scripts/readme-banner.test.ts` les remplace. D100 révise D95.

**Trucs en suspens** : PR empilée sur #129 (mémoire F42), à merger après elle. Vérifier le rendu de la bannière sur la page de la branche, puis dans l'application GitHub mobile (BACKLOG). La vidéo source `questionator-promo-muette.mp4` reste non suivie à la racine : à ranger hors du dépôt par l'utilisateur.

**Prochaine chose à creuser** : #77 (vérifications manuelles V1), puis #85 (passage à Node 26 LTS, pas avant le 2026-10-28).

**Notes pour future Claude** : régénérer depuis la vidéo : AVIF `ffmpeg -i <video> -vf "fps=30,scale=1600:-2:flags=lanczos" -c:v libsvtav1 -crf 38 -preset 6 -pix_fmt yuv420p -f avif assets/readme-banner.avif` ; secours `-vf "fps=12,scale=800:-1:flags=lanczos" -c:v libwebp_anim -quality 60 -compression_level 6 -loop 0 assets/readme-banner.webp` ; image fixe `-ss 29.5 -frames:v 1 -vf scale=1600:-2:flags=lanczos -c:v libwebp -quality 85`. Ne pas baisser la largeur sous 1600 px ni la cadence sous 30 i/s (retour utilisateur). Pillow lit les WebP animés (`n_frames`) quand ffmpeg n'a pas de décodeur `libwebp`.

## 2026-10-04 — #126 : F42, couverture des tests (Codecov et SonarQube)

**Dernière chose faite** : PR #128 mergée. `pnpm test:coverage` (`@vitest/coverage-v8`, Vitest monté en 5.0.3) ; le job `check` lance les tests couverts, envoie `coverage/lcov.info` à Codecov par OIDC, puis lance le scanner Sonar avant le build. `sonar-project.properties` remplace `.sonarcloud.properties` ; l'analyse automatique est désactivée et `SONAR_TOKEN` est en secret. Badge Codecov au README, section *Couverture* de la page *Tests*, D99. Sur `main` : Sonar 94,8 %, Codecov 93,2 %, déploiement vert. Job `check` : +47 s.

**Trucs en suspens** : sur la PR #129, Codecov commente bien (diff contre `main`), mais ne pose pas les statuts `project` et `patch` : il faut installer l'application GitHub Codecov sur le compte (https://github.com/apps/codecov/installations/select_target), action de l'utilisateur. À revérifier sur la PR suivante. Le contact du code de conduite (profil GitHub sans canal privé) reste à trancher par l'utilisateur.

**Prochaine chose à creuser** : #77 (vérifications manuelles V1), puis #85 (passage à Node 26 LTS, pas avant le 2026-10-28).

**Notes pour future Claude** : Sonar se lance désormais depuis la CI, plus rien à déclencher à la main ; `sonar-check.sh` marche comme avant. Une exclusion de couverture s'écrit à trois endroits (`vite.config.ts`, `sonar-project.properties`, `codecov.yml`). Les trois outils donnent des pourcentages différents (QUIRKS). Sonar ignore la condition de couverture sous 20 lignes nouvelles : une PR de doc passe.

## 2026-10-03 — #125 : F41, README et fichiers communautaires

**Dernière chose faite** : README réécrit en vitrine (badges CI, quality gate, application, licence, hors ligne, 100 % local ; trois liens d'appel ; sept fonctionnalités vérifiées dans le guide et le code). Ajout de `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (traduction officielle 2.1, contact remplacé seul), `SECURITY.md`, trois formulaires d'issue + `config.yml`, modèle de PR. `scripts/community-links.test.ts` vérifie liens relatifs, liens vers `main` et liens vers la doc (page + ancre VitePress). Renvois dans *Workflow*, *Installer le poste* et `CLAUDE.md`. D98, une ligne de BACKLOG.

**Trucs en suspens** : PR #127 mergée, #125 fermé ; Community Standards à 100 %. Le contact du code de conduite renvoie au profil GitHub, qui n'affiche pas de canal privé : à trancher par l'utilisateur.

**Prochaine chose à creuser** : #126 (F42, couverture Codecov et SonarQube) ou #77 (vérifications manuelles V1), puis #85 (Node 26 LTS, pas avant le 2026-10-28).

**Notes pour future Claude** : l'interface n'affiche pas `APP_VERSION` ; le formulaire de bug demande donc la date et le mode (D98, BACKLOG « Accueil et backup »). Renommer un titre d'une page de `site/` vers lequel pointe un fichier communautaire fait échouer `community-links.test.ts`. `rtk vitest` ne sait pas toujours analyser la sortie : lire `.vitest/json/output.json`.

## 2026-10-03 — #73 : F29, guide contributeur

**Dernière chose faite** : les 7 pages de `site/contribuer/` sont rédigées d'après le dépôt (`package.json`, CI, configs, `src/`, `.claude/`, `CLAUDE.md`), sans règle recopiée : chaque convention est un lien `blob/main/…#ancre`. `site/contribuer/links.test.ts` vérifie que chaque fichier et chaque ancre (slug GitHub) existent ; `CLAUDE.md` et le README renvoient au guide ; un QUIRKS sur les slugs GitHub.

**Trucs en suspens** : PR #124, revue faite et corrigée, page *Installer le poste* suivie dans un clone neuf jusqu'à `pnpm check` vert, SonarQube OK (0 issue, 0 hotspot), passée en « Ready for review » une fois la CI verte. Ne pas merger sans le go explicite de l'utilisateur.

**Prochaine chose à creuser** : retour de revue de la PR ; ensuite #77 (vérifications manuelles V1), puis #85 (passage à Node 26 LTS, pas avant le 2026-10-28).

**Notes pour future Claude** : renommer un titre de `docs/*.md` ou de `CLAUDE.md` vers lequel pointe le guide fait échouer `links.test.ts` (ancre introuvable) : mettre à jour le lien. La règle sur les commentaires du guide (pages Conventions) décrit la pratique observée, `CONVENTIONS.md` n'a pas de section dédiée.

## 2026-10-02 — #72 : F28, guide utilisateur

**Dernière chose faite** : guide complet sur `feat/72-guide-utilisateur`, en local, non poussé. Les 10 pages de `site/guide/` sont rédigées d'après le code (libellés du dictionnaire `fr`), avec 10 captures déterministes générées par `pnpm docs:screenshots` ; `reference-config.test.ts` et `depannage.test.ts` verrouillent la couverture du schéma et des codes d'erreur ; README réduit à un renvoi vers la référence ; D97, trois QUIRKS, deux lignes de BACKLOG.

**Trucs en suspens** : rien. PR #123 mergée sur le go de l'utilisateur, #72 fermé, guide en ligne.

**Prochaine chose à creuser** : #73 (F29, section Contribuer de `site/contribuer/`), qui part de `main` à jour après le merge de #72.

**Notes pour future Claude** : les captures ne sont pas lancées en CI ; après un changement d'interface visible dans le guide, relancer `pnpm docs:screenshots` et commiter les PNG (deux exécutions successives ne doivent laisser aucun diff). Ajouter un champ au schéma ou un code d'erreur sans l'ajouter à `reference-config.md` / `depannage.md` fait échouer `pnpm check`. VitePress ne contrôle pas les ancres `#` (voir QUIRKS). Les écrans de session des captures sont sombres (config d'exemple).

## 2026-10-02 — #71 : F27, site de documentation (socle)

**Dernière chose faite** : socle du site de documentation livré sur `feat/71-site-doc`, complet en local, non poussé. Lien « Aide » dans `PageShell` (avant le sélecteur de thème, nouvel onglet, clés `help_link` / `help_link_label`) ; service worker qui laisse passer `/docs/` (denylist + `globIgnores`) et `check:precache` qui échoue si la doc entre dans le manifeste ; `site/` en VitePress 2.0.0-alpha.20 (10 pages guide et 7 pages contribuer en squelette, thème et recherche en français, accent rose contrasté) ; CI et e2e qui construisent l'app puis la doc ; `e2e/docs.spec.ts`. Décision D96, sept QUIRKS, trois lignes de BACKLOG.

**Trucs en suspens** : rien. PR #122 mergée sur le go de l'utilisateur, #71 fermé ; la documentation est en ligne sur https://adriengras.github.io/questionator-z4000-hyperdrive/docs/.

**Prochaine chose à creuser** : #72 (F28) et #73 (F29) remplissent les pages squelettes (`site/guide/`, `site/contribuer/`).

**Notes pour future Claude** : la doc se construit après l'app (`pnpm build && pnpm docs:build`), car `vite build` vide `dist/`. `docs:dev` sert une coquille vide : vérifier le contenu sur le build. En local, seule l'URL avec barre finale (`…/docs/`) est fiable sous `vite preview`. À chaque montée de VitePress : refaire le contrôle des libellés de thème et des 12 clés de recherche contre `default-theme.d.ts` et `local-search.d.ts`. Un lien mort fait échouer `docs:build` (voulu). Le logo du site est une copie de `public/icons/icon.svg`, verrouillée par `scripts/site-logo.test.ts`.

## 2026-10-02 — #74 : animation du parcours en tête du README

**Dernière chose faite** : `assets/readme-hero.svg` remplace `banner.webp` en tête du README (`banner.webp` supprimé). Première version (fenêtre de navigateur, 15 s) refaite après retour de l'utilisateur (ni l'oral ni les deux écrans n'étaient compris) : titre synthwave 0-2 s, puis une salle d'oral (groupes `#room` > `#around` (décor, `#projector`, examinateur, bureau, `#students`), `#laptop`, `#zoom`). A passe en entier (choix, tirage, réponse orale, note), B et C en accéléré, puis le portable grandit (12,3-13 s) et `#zoom` prend le relais : stats 13-15 s, export Excel 15-18 s, retour au titre 17,7-18 s. Boucle de 18 s, symboles Tabler 3.48.0. Les deux écrans diffèrent surtout par la réponse attendue et les boutons de note (portable seul) et par le score (écran projeté seul). Mouvement réduit = salle figée au moment de la note. Nouveau texte alternatif (`<desc>` et README). Sonde de thème : le SVG en `<img>` suit le thème GitHub (pas l'OS), donc mode `img`, pas de `<picture>` (QUIRKS, D95 et sa révision). `pnpm check:hero` dans `pnpm check` et la CI. Mémoire à jour (D95, INDEX, BACKLOG, QUIRKS).

**Trucs en suspens** : PR #120 mergée sur go de l'utilisateur, #74 fermé. Restent au BACKLOG : le rendu dans l'application GitHub mobile (thème), non vérifié, et un contrôle XML complet dans `check:hero` (`&` nu, balises, `width` / `height`).

**Prochaine chose à creuser** : #71 (F27), puis #72 / #73 ; ou #85 (Node 26) après le 2026-10-28.

**Notes pour future Claude** : pour itérer sur le SVG, le charger en ligne dans Playwright et figer l'animation à l'instant t : injecter `animation-play-state: paused` et un `animation-delay` négatif sur tous les éléments (1 s = 5,5556 % de la timeline). C'est pourquoi le SVG lui-même ne doit jamais utiliser `animation-delay` (`check:hero` le refuse). Le SVG doit rester du XML strict : un `--` dans un commentaire ou un `&` nu, tolérés par un navigateur qui ouvre le fichier, cassent l'affichage en `<img>` ; vérifier par `python3 -c "import xml.dom.minidom as m; m.parse('assets/readme-hero.svg')"`. `#zoom` est rangé dans `#room` exprès : la salle s'efface d'un bloc sous le titre, sans que le contenu du portable agrandi transparaisse sous l'écran zoomé.

## 2026-10-02 — #118 : rapidfire du BACKLOG (débordements, « pt », taux)

**Dernière chose faite** : PR #117 (#88) mergée sur go de l'utilisateur. Revue du BACKLOG à sa demande : rien de critique. Le seul bug de calcul (taux sur barème négatif) est inatteignable, car `negative_scale_value` et `zero_max_scale` le refusent. Ticket #118 créé au format des autres (P2, S) pour regrouper les petits correctifs, puis traité sur `fix/118-rapidfire-debordements` :
- **Mots très longs :** `wrap-anywhere` sur la région « Question en cours » de l'écran de passage et sur l'énoncé de la vue projetée.
- **Titre des cartes de l'accueil :** même correctif. Débordement confirmé : titre à 660 px dans une carte de 359 px, sans élargir la page.
- **Accord :** `pluralDecimal` pour `passage_category_max` (« 1,5 pt »), D90 mis à jour.
- **Taux :** `successRate` vaut `null` si le maximum est ≤ 0.
- **Test :** e2e `long-words.spec.ts`, vérifié rouge avant le correctif (543 px et 1424 px de débordement, puis 660 px pour la carte seule).

**Trucs en suspens** : PR en brouillon, Sonar, puis « Ready for review » ; merge sur go de l'utilisateur. Reste ouvert au BACKLOG : vérifications manuelles (#77), idées de fonctionnalités (raccourcis clavier, autofiltre, synchro du mode), points à surveiller (pré-cache, installation interrompue), Node 26 (#85), `vmThreads`.

**Prochaine chose à creuser** : #85 (Node 26) après le 2026-10-28. Sinon, une décision de l'utilisateur sur les idées du BACKLOG.

**Notes pour future Claude** : un débordement peut rester dans un conteneur sans élargir la page (carte de l'accueil). En e2e, mesurer aussi la boîte de l'élément, pas seulement `scrollWidth` du document.

## 2026-10-02 — #88 : outillage, reports tracés et e2e stabilisés

**Dernière chose faite** : PR #116 (F40) mergée sur go de l'utilisateur. #88 est passé en « In progress », branche `chore/88-outillage`.
- **Fait :**
  - garde-fou `src/testing/heavy-doubles.test.ts`, vérifié en retirant une doublure ;
  - fixture `languages-unknown` supprimée, la variante est écrite par le test ;
  - `StatsPage.headcount` par `term` → `dd` ;
  - région « Question en cours » sur `QuestionPanel`, et `highlightedCode` scopé dessus ;
  - `CreateSessionPage.submit()` attend le bouton « Panneau » : `color-mode` passe de 1 échec sur 30 à 0 sur 100 ;
  - `update.spec` attend le contrôleur avant « Prête pour le hors ligne ».
  La suite e2e rejouée 4 fois passe 148 fois sur 148.
- **Fait aussi, à la demande de l'utilisateur :** oxfmt 0.71 remplace Prettier (`.oxfmtrc.json` migré, écart de 2 fichiers, tri Tailwind identique). L'avertissement dependency-cruiser est supprimé : alias `@/` dans `depcruise.resolve.cjs` (`webpackConfig`) au lieu de `tsConfig` (D94).
- **Reporté avec mesures :** `vmThreads` (2,5× plus rapide mais `examiner-view` instable). `isolate: false` est écarté (15 tests cassés).

**Trucs en suspens** : PR en brouillon, Sonar, puis « Ready for review » ; merge sur go de l'utilisateur. La PR ferme #88 en entier ; seul `vmThreads` reste au BACKLOG (évaluation faite, reportée).

**Prochaine chose à creuser** : #85 (Node 26) pas avant le 2026-10-28. Sinon, le rapidfire du BACKLOG annoncé par l'utilisateur.

**Notes pour future Claude** : `pnpm format` lance oxfmt, plus Prettier (`rtk prettier` ne sert plus). Pour réévaluer `vmThreads`, la config en projets (`app` en `vmThreads` sur `src/`, `tooling` en pool par défaut sur `vite/` et `scripts/`) et le `toEqual` de `create-session-page.test.tsx` sont décrits dans D94 ; ils ne sont pas dans le code.

## 2026-10-02 — F40 (#103) : champ manquant nommé, valeurs possibles au survol

**Dernière chose faite** : PR #115 (F39) mergée sur go de l'utilisateur. #103 est passé en « In progress », branche `feat/f40-editeur-survol`.
- **Champ manquant :** `required` porte `field`, d'où le message « Champ obligatoire manquant : « finalScale ». » (FR et EN), partagé avec la création, l'import et la relecture d'une session.
- **Valeurs possibles :** `collectValues` est déplacé dans `domain/config/schema-values.ts`, avec un nouveau `hoverValues` (liste fermée, `open`, rien). `hoverAt` renvoie `values` / `openValues`, et `hover-dom.ts` rend la bulle : valeurs en `code`, et pour `icon` un lien Tabler souligné et le rappel Ctrl+Espace. Le `markdownDescription` publié ajoute les mêmes valeurs, et le lien pour `icon`.
- **Libellés :** `editor_hover_values`, `editor_hover_icon_search`, `editor_hover_icon_hint` ; la prop `defaultLabel` de `JsonEditor` devient `hoverLabels`.
- **Documentation :** D93, PRODUCT.md F26 et README à jour.
- **Tests :** domaine, assistant, JSON Schema, bulle, et 3 e2e (champ manquant, survol de `mode`, lien d'`icon`).

**Trucs en suspens** : PR en brouillon, Sonar, puis « Ready for review » ; merge sur go de l'utilisateur. Le BACKLOG attend un rapidfire. Écart assumé avec le ticket : le nom du champ est entre « » (FR) et "" (EN), comme `unknown_key`, et non entre backticks, puisque les messages sont du texte brut.

**Prochaine chose à creuser** : #88 (outillage : Vitest `vmThreads`/`isolate`, garde-fou des doublures, e2e `color-mode`), puis #85 (Node 26, pas avant le 2026-10-28).

**Notes pour future Claude** : pour survoler une clé lointaine de l'exemple en e2e, réordonner l'objet (`JSON.stringify({ categories, ...rest })`) puis `ControlOrMeta+Home` : CodeMirror ne rend que les lignes visibles.

## 2026-10-02 — F39 (#102) : ouverture de la vue projetée à côté du titre, icônes

**Dernière chose faite** : PR #114 (F38) mergée sur go de l'utilisateur. #102 est passé en « In progress », branche `feat/f39-controles-projection`.
- La logique de fenêtre sort de `ProjectionControls` dans `usePresentWindow`, appelé par `ExaminerView`.
- « Ouvrir la vue projetée » est rendu dans l'emplacement `action` de `ProjectionPreview`, sur la ligne du titre, et la popup bloquée dans `notice`.
- `ProjectionControls` ne garde que le pilotage (projeter, attente), avec `onAction` qui efface le message.
- Icônes `IconExternalLink`, `IconPlayerPlay`, `IconPlayerPause`.
- Décision D92, PRODUCT.md F22 à jour. Tests : emplacement et ordre, icônes `aria-hidden` et libellés, popup bloquée dans la région de l'aperçu, ouverture jamais désactivée, hook réouvrant pour une autre session (`renderHook`).

**Trucs en suspens** : PR en brouillon, Sonar, puis « Ready for review » ; merge sur go de l'utilisateur. Le BACKLOG attend un rapidfire de l'utilisateur.

**Prochaine chose à creuser** : #103 (F40, éditeur : champ manquant nommé, valeurs possibles au survol), puis #88 et #85 (pas avant la LTS de Node 26, le 2026-10-28).

**Notes pour future Claude** : la popup bloquée est maintenant dans la région « Vue projetée » : un test qui cherche `getByRole('alert')` hors de cette région ne la trouvera plus que via `screen`.

## 2026-10-02 — F38 (#101) : panneau ouvert sur l'étudiant, absence en bouton d'action

**Dernière chose faite** : PR #113 (F37) mergée sur go de l'utilisateur. À sa demande, les points en suspens sont au BACKLOG, pour un rapidfire plus tard : accord « 1,5 pts » (§ Thème et langue), mots très longs dans l'écran de passage et la vue projetée (marqué non urgent), carte de l'accueil, barème négatif.
#101 est passé en « In progress », branche `feat/f38-panneau-absence`, avec deux changements :
- **Onglet par défaut :** `useSidePanel` ne mémorise plus rien (`side-panel-state.ts` supprimé). « Panneau » appelle `show()`, qui ouvre toujours sur « Étudiant ».
- **Absence :** `AbsentToggle` devient `AbsentButton`, en version pleine dans l'onglet « Étudiant » et en version `compact` sur chaque ligne de la liste, à côté du bouton de sélection. Libellés `absent_mark*` / `absent_unmark*` ; `absent_label` est retiré.

Décision D91 (remplace l'onglet mémorisé de D76), PRODUCT.md F12, F13 et F21 à jour. Tests : hook, réouverture même après remontage, absence depuis la liste avec et sans questions tirées, bouton compact `ignored`, bouton désactivé pendant une écriture ; une quinzaine de tests existants adaptés (QUIRK du jour).

**Trucs en suspens** : PR en brouillon, Sonar, puis « Ready for review » ; merge sur go de l'utilisateur. L'utilisateur prévoit plus tard un rapidfire de tickets sur le BACKLOG.

**Prochaine chose à creuser** : #102 (F39, contrôles de la vue projetée ; touche aussi `examiner-view.tsx`), puis #103, #88, #85.

**Notes pour future Claude** : l'absence depuis la liste passe par `actions.setAbsent(studentId, …)` sans `ownError` hors dialogue : un échec s'affiche dans l'alerte du tiroir (D82). Le bouton compact utilise `Tooltip` sans provider local, sous le `TooltipProvider` d'`ExaminerView`.

## 2026-10-02 — F37 (#100) : barème des catégories en points

**Dernière chose faite** : PR #112 (#109) mergée sur go de l'utilisateur. #100 est passé en « In progress », branche `feat/f37-bareme-points`.
- Libellé `passage_category_max` : « 2 pts », « 1 pt », avec un paramètre `points` pour l'accord.
- La grille examinateur l'affiche toujours. Les tuiles projetées l'affichent selon la nouvelle clé `presentation.showCategoryPoints` (défaut `true`) : à `false`, `toProjectedView` ne transmet pas `maxPoints`.
- `formatRawScore` est extrait de `formatScore` : la vue projetée n'a pas la config.
- La clé est ajoutée au schéma, avec description et défaut, et documentée dans PRODUCT.md §6.2 et F09/F14 ainsi que dans `examples/config.example.json`. Décision D90.
- Tests : i18n, normalisation, vue projetée (champ absent), tuiles, nouveau `category-grid.test.tsx`, session stockée sans la clé, e2e de survol dans l'éditeur.

**Trucs en suspens** : PR en brouillon, Sonar, puis « Ready for review » ; merge sur go de l'utilisateur. Point à faire valider : l'accord français suit le helper `plural` existant (`> 1` donne le pluriel), donc « 1,5 pts ». La règle typographique stricte voudrait « 1,5 point » (singulier sous 2). Toujours en attente : le débordement sur un mot long dans l'écran de passage et la vue projetée (BACKLOG, #109), la carte de session de l'accueil (BACKLOG) et le taux de réussite avec un barème négatif.

**Prochaine chose à creuser** : #101 (F38, panneau latéral ouvert sur l'étudiant, absence en bouton d'action), puis #102, #103, #88, #85.

**Notes pour future Claude** : le test ponctuel `e2e/zz-adhoc.spec.ts`, avec captures dans le scratchpad puis supprimé, reste le moyen le plus rapide de regarder la vue projetée. `PresentPage.page` est privé, il faut passer par `page.waitForEvent('popup')`.

## 2026-10-02 — #109 : l'aperçu de l'éditeur coupe les mots très longs

**Dernière chose faite** : PR #111 (#104) mergée sur go de l'utilisateur. #109 est passé en « In progress », branche `fix/109-apercu-mot-long`. Le correctif pose `wrap-anywhere` sur l'`article` de `QuestionPreview` : la propriété est héritée par l'en-tête (`id`, libellé) et par les Markdown, et les blocs de code continuent de défiler. Deux e2e dans `config-editor.spec.ts`, à 1280 et 375 px, avec une URL de 200 caractères, un `id` de 127 caractères et une ligne de code longue. Ils étaient rouges avant le correctif (2231 px de débordement).

**Trucs en suspens** : PR en brouillon, Sonar, puis « Ready for review » ; merge sur go de l'utilisateur. Constaté et commenté dans #109 sans être corrigé : l'écran de passage (`QuestionPanel`) et la vue projetée (`StudentScreen`) débordent eux aussi sur un mot très long. C'est au BACKLOG (§ Écran de passage), décision à prendre (nouveau ticket ?). La carte de session de l'accueil avec un nom insécable est toujours à confirmer (BACKLOG). Toujours en attente : la décision sur le taux de réussite avec un barème entièrement négatif.

**Prochaine chose à creuser** : #100 (F37, barème des catégories en points), puis #101, #102, #103, #88, #85.

**Notes pour future Claude** : pour mesurer un débordement en e2e, comparer `scrollWidth` et `clientWidth` du conteneur ou de `document.documentElement`, et les boîtes au cadre parent. Le `scrollWidth` de l'élément texte ne suffit pas quand c'est la grille parente qui grandit (QUIRK #104). Un test ponctuel jetable (`e2e/zz-adhoc.spec.ts`, supprimé après) reste pratique pour regarder un écran sans l'ajouter à la suite.

## 2026-10-02 — #104 : la modale de suppression tient ses trois boutons

**Dernière chose faite** : #104 passé en « In progress » sur le projet n°3, branche `fix/104-pied-modale-suppression`. Dans `DeleteDialog`, la largeur passe à `data-[size=default]:sm:max-w-md` (28 rem). Le préfixe est requis, sinon le `sm:max-w-sm` du vendor l'emporte. Le titre passe en `wrap-anywhere`. Un e2e `delete-dialog.spec.ts` couvre trois largeurs (1280, 700, 375) avec un nom sans espace ni tiret ; il était rouge avant le correctif (boutons à 23 px hors du cadre à partir de `sm`, toute la modale élargie par un nom insécable). `src/components/ui/alert-dialog.tsx` n'est pas modifié.

**Trucs en suspens** : PR en brouillon, Sonar, puis « Ready for review » ; merge sur go de l'utilisateur. L'EN n'est pas testé en e2e (les pages e2e sont en libellés FR) : ses trois libellés sont plus courts que les FR, et le FR est vérifié. Toujours en attente de l'utilisateur : la décision sur le taux de réussite avec un barème entièrement négatif (BACKLOG).

**Prochaine chose à creuser** : #109 (aperçu de l'éditeur qui déborde sur un énoncé long sans espace). C'est probablement le même remède `wrap-anywhere` (voir le nouveau QUIRK). Ensuite #100, #101, #102, #103, #88, #85.

**Notes pour future Claude** : la carte de session de l'accueil semble déborder elle aussi avec un nom insécable sur mobile (BACKLOG, à confirmer). Elle pourrait se traiter avec #109 si l'utilisateur est d'accord.

## 2026-10-02 — #87 terminé (PR 4) et grooming : ordre de la suite fixé

**Dernière chose faite** : PR #108 (#87 PR 3) mergée sur go de l'utilisateur. Grooming du projet à sa demande :
- #88 repassé en Ready, et sa description complétée (Vitest `vmThreads`/`isolate`, garde-fou des doublures, e2e `color-mode`) ;
- #77 complété de 5 vérifications manuelles (Safari/Firefox, vidéoprojecteur, pastille hors ligne sur GitHub Pages, survol VS Code, autocomplétion en sombre) ;
- #101 annoté : son « retour d'échec » est déjà fait par #108 ;
- #71 à #74 en P2 avec une taille ;
- nouveau bug #109 (aperçu de l'éditeur qui déborde sur un énoncé long sans espace) ;
- deux lignes orphelines du BACKLOG rattachées à #87.

La PR 4 de #87 est faite sur `chore/87-dette-stats` : tests de stats, nettoyages de `domain/stats/`, `StatsEmpty`, test d'alignement `INTEGER_FIELDS`, et un vrai bug corrigé. Quand on quittait l'écran de création pendant l'écriture, l'app naviguait quand même vers la session créée ; la garde compare maintenant le chemin du routeur. Cette PR ferme #87.

**Trucs en suspens** : PR 4 à ouvrir (`Closes #87`), Sonar, puis « Ready for review » ; l'utilisateur merge tout, puis vide le contexte. Décision produit en attente, au BACKLOG sans ticket : sur un barème entièrement négatif, le taux de réussite sort faux (−2 donne 200 %). Deux options : afficher « — » quand le maximum est ≤ 0, ou interdire ce barème dans la config.

**Prochaine chose à creuser** : **ordre fixé avec l'utilisateur**, un ticket à la fois, une branche et une PR par ticket depuis `main` à jour :
1. #104 — bug XS, pied de la modale de suppression qui déborde ;
2. #109 — bug XS, aperçu de l'éditeur qui déborde (placé après #104 par le contrôleur, l'utilisateur n'a pas objecté) ;
3. #100 — F37, barème des catégories en points ;
4. #101 — F38, panneau latéral ouvert sur l'étudiant, absence en bouton d'action ;
5. #102 — F39, contrôles de la vue projetée ;
6. #103 — F40, éditeur : champ manquant nommé, valeurs possibles au survol ;
7. #88 — outillage ;
8. #85 — Node 26, pas avant sa sortie LTS le 2026-10-28.

Restent hors planification : #77 (vérifications manuelles de l'utilisateur) et #71 à #74 (documentation, en Backlog).

**Notes pour future Claude** : méthode qui a marché tout au long de #87.
- Brief = lignes exactes du BACKLOG (numéros sur `main`) plus des arbitrages explicites ; implémenteur Opus en subagent ; relecteur Opus neuf, sans suite complète ; re-revue ciblée des correctifs ; Sonar jusqu'à 0 issue. La duplication et la complexité cognitive y font rougir des PR que `pnpm check` laisse passer.
- Jamais deux suites complètes en même temps.
- Une erreur API 529 sur un subagent se rattrape en le relançant par `SendMessage` : il garde son contexte.

## 2026-10-02 — #87 PR 3 : projection, rendu, éditeur

**Dernière chose faite** : PR #107 (#87 PR 2) mergée sur go de l'utilisateur. La PR 3 de #87 est faite sur `chore/87-dette-projection-rendu-editeur` par un subagent ; la revue la juge Ready. Les 8 lignes du BACKLOG sont traitées :
- `ResetDialog`, `AdjustmentDialog` et l'absence suivent l'issue `written` / `failed` / `ignored` : plus de fausse erreur quand un appel est écarté par le verrou (CONVENTIONS § Transition de passage) ;
- l'échec isolé `getByRole('banner')` est expliqué : les `header` des cartes de l'aperçu arrivent après la validation différée. L'outil de test cherche désormais le seul `h1` placé dans un `header` (QUIRKS) ;
- tests manquants du rendu markdown ;
- quatre vrais petits bugs trouvés par les nouveaux tests et corrigés : décalage CRLF des offsets de `toHighlightedCode`, `locateIssue` après un BOM et pour une colonne au-delà de la ligne, `JsonEditor` (`aria-label` figé, diagnostics envoyés deux fois), et `configFileName`, sorti dans `domain/config/`, qui gère maintenant un BOM et un titre sans caractère utile.

**Trucs en suspens** : PR à ouvrir, Sonar, puis « Ready for review » ; ne pas merger sans le go de l'utilisateur. Reste connu, non traité : si le brouillon initial contient des CRLF, la première validation tourne sur ce texte alors que CodeMirror affiche du LF, donc les diagnostics dérivent d'un caractère par ligne jusqu'à la première frappe. Cas rare.

**Prochaine chose à creuser** : après le merge, la PR 4 de #87 (stats : tests manquants, nettoyages de `domain/stats/`, `StatsEmpty`), qui fermera #87. Puis #88 (outillage), et #85 (Node 26) à partir du 2026-10-28.

**Notes pour future Claude** : CodeMirror normalise CRLF et CR seul en LF dans son document, mais garde un BOM : la localisation d'une issue doit raisonner sur le texte de l'éditeur, pas sur le fichier d'origine.

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

