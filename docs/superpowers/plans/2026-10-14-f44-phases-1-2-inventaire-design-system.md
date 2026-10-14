# F44 — Refonte UI, phases 1 et 2 (inventaire, design system, maquettes) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouvrir les tickets de F44, verser la spec, puis produire sur claude.ai le canevas d'inventaire (phase 1), le design system et les maquettes refaites (phase 2), validés par l'utilisateur.

**Architecture:** Aucune ligne de code applicatif. Les livrables vivent dans deux Artifacts privés : un canevas de type **Design** (artboards `.dc.html`, captures en assets) et un **Design System** (tokens, composants, règles). Le dépôt ne reçoit que la documentation (spec, plan, D102, PRODUCT, INDEX, HANDOFF), par une PR de documentation, puis les arbitrages de phase 2 en tête de la branche d'intégration. La phase 3 aura son propre plan, écrit après validation des maquettes.

**Tech Stack:** `gh` (tickets, PR), `.claude/scripts/sonar-check.sh`, Playwright (`pnpm docs:screenshots`), outil `Artifact` (types Design et Design System), `ArtifactComments`.

**Spec:** `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md`

## Global Constraints

- Thème sombre uniquement ; le mode clair revient au ticket 10 par dérivation (D102).
- Schéma de config inchangé (`theme.light`, `theme.dark`, `presentation.defaultColorMode`).
- Deux registres de couleur : une couleur d'action en dégradé sur les boutons principaux ; une palette multicolore codée pour ce qui désigne (espaces, catégories, scores, jauges).
- Tout ce que le thème de session doit piloter (action, surfaces, halos) dérive des tokens shadcn ; les couleurs d'espace sont des tokens propres, non surchargeables par une config.
- Contraste texte 4.5:1 (3:1 au-delà de 24 px), texte gris et texte sur dégradé compris ; couleurs distinguées aussi par la luminosité.
- Menu présent partout sauf la vue projetée ; routes nouvelles limitées à `/sessions` et `/trainings`.
- Aucune police ni ressource réseau dans le code (paquets `@fontsource…` seulement) ; les maquettes peuvent utiliser Google Fonts.
- Maquettes en français ; mises en page qui tiennent avec les libellés anglais.
- Commits en gitmoji, message au présent en français ; pas de push sur `main` ; merge uniquement sur go explicite de l'utilisateur.
- Les Artifacts restent privés ; aucune donnée réelle d'étudiant dedans (données d'exemple uniquement).

## Review Focus

1. **Captures du guide écrasées** : `pnpm docs:screenshots` écrit dans `site/public/screenshots/`, fichiers commités. Attendu : les captures sombres partent ailleurs et `git status` est propre après la tâche 3.
2. **Couleurs de catégorie arbitraires** : une config peut choisir des teintes proches des couleurs d'espace. Attendu : la planche de collision (tâche 6) les confronte, et l'arbitrage est écrit.
3. **Thème de session personnalisé** : une config avec `theme.dark` doit encore changer l'apparence des écrans de session. Attendu : un artboard de session rendu avec le `theme.dark` de `examples/config.example.json` (tâche 7).
4. **Texte gris et texte sur dégradé illisibles** sur fond presque noir. Attendu : chaque paire texte/fond du design system mesurée à 4.5:1 au moins (tâche 5).
5. **Libellés anglais plus longs** qui cassent menu et tuiles. Attendu : le menu et l'accueil en tableau de bord ont aussi un artboard en anglais (tâche 7).

---

### Task 1: Ouvrir les tickets F44.1 à F44.10

**Files:**
- Modify: `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (ligne « Ticket » de l'en-tête, colonne « # » de « Découpage »)

**Interfaces:**
- Produces: les numéros d'issue `#<n1>` à `#<n10>`, utilisés par toutes les tâches suivantes (corps de PR, fermetures, HANDOFF).

- [ ] **Step 1: Créer les 10 issues**, label `feature`, au format de #134 (sections Contexte, Objectif, Périmètre, Critères d'acceptation en cases à cocher, Hors périmètre, Points à vérifier, Dépendances), chaque corps renvoyant à la spec. Titres exacts :

| # | Titre |
|---|---|
| 1 | `F44.1 — Refonte UI : inventaire des écrans sur canevas` |
| 2 | `F44.2 — Refonte UI : design system et maquettes` |
| 3 | `F44.3 — Refonte UI : tokens et composants de base` |
| 4 | `F44.4 — Refonte UI : menu et coquille de page` |
| 5 | `F44.5 — Refonte UI : accueil et pages d'espace` |
| 6 | `F44.6 — Refonte UI : création de session et éditeur` |
| 7 | `F44.7 — Refonte UI : session examinateur et vue projetée` |
| 8 | `F44.8 — Refonte UI : statistiques` |
| 9 | `F44.9 — Refonte UI : entraînement` |
| 10 | `F44.10 — Refonte UI : mode clair dérivé` |

Périmètre et critères de chaque ticket : la ligne correspondante de « Découpage » et les sections de la spec qu'elle touche. Les tickets 3 à 10 portent la mention « Provisoire : découpage confirmé à la fin de F44.2 » et « Livré dans la PR unique de la branche d'intégration (D102) ». Les tickets 1 et 2 portent « Fermé à la main après validation des Artifacts ».

Run: `gh issue create --title "<titre>" --label feature --body-file <fichier>` (corps rédigés dans le scratchpad).
Expected: 10 URL d'issue, numéros consécutifs.

- [ ] **Step 2: Reporter les numéros dans la spec** (en-tête « Ticket » : `#<n1> à #<n10>` ; colonne « # » de « Découpage »).

Run: `gh issue list --label feature --search "F44" --json number,title`
Expected: 10 issues, titres identiques au tableau.

### Task 2: PR de documentation (spec, plan, D102, PRODUCT, mémoire)

**Files:**
- Create: `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (déjà écrit), `docs/superpowers/plans/2026-10-14-f44-phases-1-2-inventaire-design-system.md` (ce plan)
- Modify: `CLAUDE.md` (règle du canevas), `docs/DECISIONS.md` (ajout en fin de fichier), `PRODUCT.md` (section `### F44` après `### F43`, avant `## 9. Stack technique`), `docs/INDEX.md` (ligne F44 en tête de table), `docs/HANDOFF.md` (entrée en tête)

**Interfaces:**
- Consumes: numéros d'issue de la tâche 1.
- Produces: D102 sur `main` ; la branche d'intégration de la phase 3 partira de ce `main`.

- [ ] **Step 1: Branche** `docs/f44-spec-refonte-ui` depuis `main` à jour.

- [ ] **Step 2: D102** dans `docs/DECISIONS.md`, au format de D101 : titre `## D102 — F44 : refonte UI, thème sombre et navigation (2026-10-14)`, une **Question** (comment donner une identité à l'app et une navigation sans toucher aux fonctionnalités ni exposer une app à moitié refaite), puis le tableau « Décisions (D102) » de la spec repris tel quel, et **Reporté dans** : spec, `PRODUCT.md` § F44.

- [ ] **Step 3: `PRODUCT.md` § F44**, au format de § F43 : **Objectif** (celui de la spec), **Contenu** (thème sombre, direction visuelle, menu, pages d'espace et accueil en tableau de bord, mode clair dérivé en dernier, avec les numéros de ticket), **Critères d'acceptation** (ceux de la spec). Une phrase signale que F44 remplace la mise en page de F19 et F20 et retire temporairement la bascule de F07.

- [ ] **Step 3b: `CLAUDE.md`** : une puce dans « Conventions du projet », à côté de la règle Sonar : toute feature qui touche l'interface passe par le canevas (spec validée → artboards validés par l'utilisateur → plan → code), l'artboard est mis à jour dans la même PR si l'implémentation s'en écarte, le design system est la référence des tokens ; renvoi à D102 et à `docs/ENVIRONMENT.md` pour les URL.

- [ ] **Step 4: `INDEX.md`** : ligne `F44 — Refonte UI (#<n1> à #<n10>)`, date 2026-10-14, spec, plan, statut « Spec validée, phases 1-2 en cours », résumé en une ligne. **`HANDOFF.md`** : entrée `## 2026-10-14 — F44 : spec et tickets de la refonte UI` avec les quatre marqueurs en gras.

- [ ] **Step 5: Vérifier**

Run: `pnpm check`
Expected: vert (les tests de liens du site et de la doc passent).

- [ ] **Step 6: Commit et PR brouillon**

```bash
rtk git add CLAUDE.md docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md docs/superpowers/plans/2026-10-14-f44-phases-1-2-inventaire-design-system.md docs/DECISIONS.md PRODUCT.md docs/INDEX.md docs/HANDOFF.md
rtk git commit -m "📝 Verse la spec et le plan de la refonte UI (F44)"
rtk git push -u origin docs/f44-spec-refonte-ui
```

PR en brouillon vers `main`, corps depuis `.github/pull_request_template.md`, avec `Refs #<n1>` à `Refs #<n10>` (pas `Closes` : aucun ticket n'est livré par cette PR).

- [ ] **Step 7: Sonar puis revue**

Run: `.claude/scripts/sonar-check.sh --pr <n> --wait`
Expected: « Quality gate OK », 0 issue, 0 hotspot. Passer la PR en « Ready for review », puis **s'arrêter** : merge seulement sur go explicite de l'utilisateur.

### Task 3: Captures « avant » en mode sombre (F44.1)

**Files:**
- Modify temporairement (jamais commités) : `playwright.screenshots.config.ts` (`colorScheme`), `e2e/screenshots/determinism.ts` (`OUT_DIR`)

**Interfaces:**
- Produces: `<scratchpad>/captures-avant/sombre/*.png` (13 fichiers) et `<scratchpad>/captures-avant/clair/*.png` (copie des 13 de `site/public/screenshots/`), noms identiques à ceux de l'inventaire de la spec.

- [ ] **Step 1: Copier les captures claires** de `site/public/screenshots/` vers `<scratchpad>/captures-avant/clair/`.

- [ ] **Step 2: Rediriger et assombrir** : `colorScheme: 'dark'` dans le `use` de la config, `OUT_DIR = '.playwright-mcp/captures-avant'` (dossier ignoré par git).

- [ ] **Step 3: Capturer**

Run: `pnpm docs:screenshots`
Expected: 13 PNG dans `.playwright-mcp/captures-avant/`. Si un écran de session reste clair (mode imposé par la config de démonstration), le noter tel quel : c'est l'état réel de l'app.

- [ ] **Step 4: Restaurer et déplacer**

Run: `rtk git checkout -- playwright.screenshots.config.ts e2e/screenshots/determinism.ts && mv .playwright-mcp/captures-avant <scratchpad>/captures-avant/sombre && rtk git status`
Expected: arbre de travail propre ; `site/public/screenshots/` inchangé.

### Task 4: Canevas d'inventaire (F44.1)

**Files:** aucun dans le dépôt. Artifact Design « Questionator — Refonte UI ».

**Interfaces:**
- Consumes: captures de la tâche 3.
- Produces: l'URL du canevas (notée dans HANDOFF et dans un commentaire de #<n1>) ; une page de canevas `avant` et une page `references`, que la tâche 7 complète d'une page `apres`.

- [ ] **Step 1: Créer le canevas** depuis le type Design (`type_url` de `Artifact` `list` `scope: "types"`), titre « Questionator — Refonte UI », puis suivre le `SKILL.md` renvoyé par la création (format des fichiers, index `project/canvas.json`, envoi fichier par fichier). Pas de design system installé pour l'« avant » : les artboards reproduisent l'app actuelle (tokens de `src/index.css`, Geist).

- [ ] **Step 2: Déposer les 26 captures** (13 sombres, 13 claires) comme assets du canevas.

- [ ] **Step 3: Page `avant`** : pour chaque ligne de l'inventaire de la spec, un artboard redessiné (largeur 1280, fluide) à partir du code de la feature, et à sa droite la capture sombre correspondante ; une rangée par route, une note de titre par rangée. Les dialogues secondaires d'un écran peuvent tenir sur une seule planche. Données : celles de la démonstration des captures.

- [ ] **Step 4: Page `references`** : une note par référence retenue (#2, 4, 6, 7, 8, 9, 10 de la spec), avec le lien, ce qu'on en prend et le poids (« fort », « référence principale ») ; une note pour les références écartées. Pas de reproduction des visuels de Dribbble.

- [ ] **Step 5: Validation** : donner le lien à l'utilisateur et attendre son retour. Sur validation : commentaire sur #<n1> avec le lien, issue fermée à la main.

### Task 5: Design System (F44.2)

**Files:** aucun dans le dépôt. Artifact Design System « Questionator Z-4000 ».

**Interfaces:**
- Produces: l'URL du design system ; ses tokens (`project/tokens.json`), installés ensuite dans le canevas (tâche 7). Noms de tokens : ceux de shadcn (`background`, `foreground`, `card`, `primary`, `accent`, `muted`, `border`, `ring`, `sidebar-*`, `chart-1` à `chart-5`…) **plus** les tokens d'espace `space-sessions`, `space-editor`, `space-training`, `space-help` et les tokens de dégradé `action-from`, `action-to`.

- [ ] **Step 1: Créer le design system** par `Artifact` `quickstart` (`intent: "other"`), type Design System, et suivre ses instructions.

- [ ] **Step 2: Tokens du thème sombre** en `oklch` : fond presque noir teinté de violet, surfaces de carte à peine plus claires, couleur d'action et son dégradé, tokens d'espace (quatre teintes distinctes en luminosité autant qu'en teinte), `chart-*` pour les données ; typo (Geist conservée ou titre ajouté, au choix argumenté), rayons généreux, espacements.

- [ ] **Step 3: Contrastes** : script jetable dans le scratchpad (conversion OKLCH → sRGB → luminance relative WCAG) sur chaque paire texte/fond du design system, texte gris secondaire et texte posé sur les deux extrémités du dégradé d'action compris.
Expected: toutes les paires ≥ 4.5:1 (≥ 3:1 pour le texte de 24 px et plus). Les valeurs mesurées figurent dans les règles d'usage.

- [ ] **Step 4: Composants avec aperçus** : bouton principal (dégradé), secondaire, discret ; carte ; tuile d'espace et tuile de catégorie ; menu latéral (lien actif, icône en tuile colorée) ; anneau de score ; jauge en arc ; barre de progression ; dialogue ; champ de saisie ; zone de dépôt de fichier ; badge ; état vide guidé.

- [ ] **Step 5: Règles d'usage** : les deux registres de couleur, « ce que le thème de session pilote dérive des tokens shadcn », couleurs d'espace non surchargeables, halos (où, combien), contrastes mesurés.

- [ ] **Step 6: Revue utilisateur** du design system, itérations par commentaires (`ArtifactComments`) jusqu'à accord.

### Task 6: Planche de collision des couleurs (F44.2)

**Files:** aucun dans le dépôt. Page `collision` du canevas.

**Interfaces:**
- Consumes: tokens de la tâche 5.
- Produces: un arbitrage écrit (familles de couleurs distinctes, ou code d'espace plus discret), repris en tâche 8.

- [ ] **Step 0: Installer le design system** dans le canevas (étape 4 du `SKILL.md` du type Design : `project/ds/<dossier>/tokens.json` et entrée `designSystems`).

- [ ] **Step 1: Trois artboards identiques** de l'écran de session (menu visible, tuiles de catégorie, anneau de score), chacun avec un jeu de catégories différent : celui de `examples/config.example.json` ; quatre teintes quelconques espacées ; quatre teintes volontairement proches des tokens d'espace.

- [ ] **Step 2: Deux variantes de traitement** sur le jeu le plus proche : couleurs d'espace pleines et catégories douces ; code d'espace discret (icône seule colorée).

- [ ] **Step 3: Arbitrage** avec l'utilisateur ; la règle retenue va dans les règles d'usage du design system.

### Task 7: Maquettes refaites (F44.2)

**Files:** aucun dans le dépôt. Page `apres` du canevas (design system déjà installé en tâche 6).

**Interfaces:**
- Consumes: design system (tâche 5), arbitrage (tâche 6), artboards `avant` (tâche 4).
- Produces: un artboard `apres` par artboard `avant`, plus les nouveaux écrans ; c'est la référence visuelle de toute la phase 3.

- [ ] **Step 1: Nouveaux écrans** : menu latéral (déplié et, si retenu, replié), accueil en tableau de bord avec données, accueil au premier lancement, `/sessions`, `/trainings`. Le menu et l'accueil ont aussi un artboard en anglais.

- [ ] **Step 2: Écrans refaits**, dans l'ordre de l'inventaire : création de session, éditeur, session examinateur (tous ses états), vue projetée (sans menu), stats de session, mise en place d'entraînement, entraînement, stats d'entraînement, bandeaux et coquille. Chaque artboard `apres` est placé sous son `avant`.

- [ ] **Step 3: Thème de session** : un artboard de session examinateur rendu avec les tokens `theme.dark` de `examples/config.example.json`, pour montrer que le thème pilote encore action, surfaces et halos.

- [ ] **Step 4: Itérations** : l'utilisateur commente sur le canevas ; chaque fil est traité (`ArtifactComments`) jusqu'à validation de l'ensemble.

### Task 8: Clôture des phases 1-2 et départ de la phase 3

**Files:**
- Modify: `docs/DECISIONS.md` (D103 : arbitrages de phase 2), `docs/ENVIRONMENT.md` (URL du canevas et du design system), `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (« Découpage » confirmé ou ajusté, liens des deux Artifacts), `docs/INDEX.md`, `docs/HANDOFF.md`

**Interfaces:**
- Consumes: URL du canevas et du design system, arbitrages des tâches 5 à 7.
- Produces: branche d'intégration `feat/f44-refonte-ui` dont les premiers commits portent les arbitrages ; base du plan de phase 3.

- [ ] **Step 1: Branche** `feat/f44-refonte-ui` depuis `main` à jour (PR de documentation mergée).

- [ ] **Step 2: D103** au format de D101 : couleurs (valeurs finales des tokens, règle de collision), typo, forme du menu, tout autre arbitrage pris sur le canevas.

- [ ] **Step 3: Spec** : liens des deux Artifacts dans « Phases et outils » ; « Découpage » confirmé ou ajusté (les issues #<n3> à #<n10> sont modifiées ou complétées en conséquence avec `gh issue edit`).

- [ ] **Step 4: Mémoire** : ENVIRONMENT (URL des deux Artifacts, section des accès), INDEX (statut « Maquettes validées, phase 3 »), HANDOFF (entrée avec les quatre marqueurs).

- [ ] **Step 5: Commit**

```bash
rtk git add docs/DECISIONS.md docs/ENVIRONMENT.md docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md docs/INDEX.md docs/HANDOFF.md
rtk git commit -m "📝 Trace les arbitrages du design system et des maquettes (F44.2)"
```

- [ ] **Step 6: Fermer #<n2>** à la main avec les liens des Artifacts ; puis écrire le plan de phase 3 (superpowers:writing-plans) à partir des maquettes validées.
