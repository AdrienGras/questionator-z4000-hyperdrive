# F43.4 — Stats d'entraînement et mise à jour de config — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L'étudiant voit où il en est (chiffres clés, questions à revoir, réussite par niveau et par notion, détail par question) et peut déposer une nouvelle version de sa config en gardant l'historique des questions dont l'`id` ne change pas, après un bilan.

**Architecture:** Nouvelle feature `training-stats` (route `/training/$trainingId/stats`), et un mode « mise à jour » de la feature `training-setup` servi par la route `/training/$trainingId/update`. Les briques de tableau de F15 remontent d'abord dans `src/components/stats/` (refactor sans changement de comportement). Le calcul reste dans le domaine (`computeTrainingStats`, `replaceTrainingConfig`) ; un nouveau `diffTrainingConfig` donne le bilan de la mise à jour.

**Tech Stack:** React 19, TanStack Router, Dexie (`useLiveQuery`), shadcn/ui (`Progress`, `Card`), Vitest + Testing Library, Playwright (POM + captures déterministes).

**Spec:** `docs/superpowers/specs/2026-10-05-f43-entrainement-autonome-design.md` (§ « Stats », « Mise à jour de config »). Ticket : #137. Branche : `feat/137-stats-mise-a-jour` (depuis `main` après le merge de #140).

## Décisions validées avec l'utilisateur (2026-10-05)

- **Disposition des stats** : chiffres clés en haut (réponses notées, passées, couverture « X / Y questions notées ») ; puis la liste **« À revoir »** ; puis deux tableaux côte à côte « Par niveau » et « Par notion » ; puis le **détail de toutes les questions, replié par défaut** (`<details>`).
- **Visuel** : tableaux accessibles comme F15, et à côté de chaque taux une **barre `Progress` de shadcn** (`src/components/ui/progress.tsx`, déjà utilisée par `session-card`). Pas de recharts.
- **Mise à jour de config** : mêmes 4 étapes que la création ; une fois la nouvelle config valide, un **bilan** avant confirmation : « N questions conservées — historique gardé », « N nouvelles », « N retirées — elles n'apparaissent plus dans les stats » ; bouton « Mettre à jour » ; retour à l'écran d'entraînement.
- **Libellés arrêtés pendant la revue de #139/#140** : « 42 réponses notées · 5 passées » (tirages, pas questions distinctes) ; couverture « 23 / 40 questions notées » ; « 3 passages » par question.
- **Route de mise à jour** : `/training/$trainingId/update` (paramètre de chemin) au lieu de `?replace=<id>` du ticket : le projet n'utilise pas `validateSearch`, le comportement est identique (décision du contrôleur, à consigner dans D101).

## Global Constraints

- D59 : routes minces ; jamais d'import entre features ; partagé → `components/`, `hooks/`, `lib/`, `domain/`. `pnpm deps` sans toucher aux règles. La règle `recharts-only-in-stats` ne doit pas être affectée (aucun recharts ici).
- Bundle : l'accueil ne charge ni validateur ni Markdown ; la route de stats suit `session.$sessionId_.stats.tsx` (`codeSplitGroupings: [['component']]` + `errorComponent` léger). Après chaque tâche qui touche une route : `rtk pnpm build && rtk pnpm check:bundle && rtk pnpm check:budget`.
- i18n : `src/lib/i18n/ui-messages.ts` (type, `fr`, `en`) **et** `SAMPLE` de `ui-messages.test.ts`. Préfixes `training_stats_*`, `training_update_*`. Français : vouvoiement, phrases courtes, apostrophe typographique ’. Anglais : « practice » (pas « training »), cohérent avec #136.
- Accessibilité : tableaux avec `th scope`, `Progress` avec un nom accessible (« Facile : 82 % »), `<details>` natif pour le détail replié ; rôles et noms explicites pour les e2e.
- Taux affichés en pourcentage entier (`Math.round(rate * 100)`), « — » sans note.
- Commits gitmoji au présent en français, trailer exact : `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` puis `Claude-Session: https://claude.ai/code/session_01Xy2DSgKQywYQtqqvZuaMFw`.
- `rtk` en préfixe ; si `rtk vitest run` avale la sortie : `rtk proxy pnpm exec vitest run <chemin>`. Ne jamais lire un `docs/*.md` en entier.

## Review Focus

1. **Barème changé par une mise à jour** : des notes anciennes avec un `max` figé différent du barème actuel donnent des taux entre 0 et 100 % et des libellés « 2 / 2 » cohérents (tâche 3, test de composant).
2. **Mise à jour qui change tous les `id`** (LLM qui renumérote) : le bilan annonce « 0 conservée » et N retirées avant toute écriture (tâche 4).
3. **Entraînement absent ou endommagé** sur `/stats` et `/update` : message clair, aucune écriture (tâches 3 et 4).
4. **Tirage en attente sur une question retirée** au moment de la mise à jour : passe à « passé » (domaine #135) ; l'écran d'entraînement revient aux tuiles (tâche 4, test).
5. **Journal vide** : l'écran de stats invite à tirer une première question au lieu d'afficher des tableaux vides (tâche 3).

---

### Task 1: Remonter les briques de tableau de F15 (refactor)

**Files:**
- Move: `src/features/stats/components/stats-section.tsx` (`StatsSection`, `StatsTable`, `NUMERIC_CELL`, `ROW_HEADER`), `stats-empty.tsx`, et `formatRate` de `src/features/stats/format-stats.ts` → `src/components/stats/` (avec leurs tests) ; F15 importe depuis le nouvel emplacement.
- Aucun changement d'assertion dans les tests existants.

- [ ] **Step 1:** Déplacer, mettre à jour les imports. **Step 2:** `rtk vitest run src/features/stats src/components` → PASS ; `rtk pnpm deps` → OK. **Step 3: Commit** `♻️ Remonte les briques de tableau des stats dans les composants partagés`

---

### Task 2: Bilan d'une mise à jour de config (domaine)

**Files:**
- Modify: `src/domain/training/replace-config.ts` ; Test: `replace-config.test.ts`

**Interfaces:**
- Produces: `export function diffTrainingConfig(current: NormalizedConfig, next: NormalizedConfig): { kept: number; added: number; removed: number }` — compte par `id` de question, toutes catégories confondues (une question qui change de catégorie est « conservée »).

- [ ] **Step 1: Tests** : configs identiques → `{ kept: n, added: 0, removed: 0 }` ; une ajoutée et une retirée ; tous les `id` changés → `{ kept: 0, added: n, removed: m }` ; question déplacée d'une catégorie à l'autre → conservée.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS. **Step 5: Commit** `✨ Calcule le bilan d'une mise à jour de config d'entraînement`

---

### Task 3: Écran de stats (`/training/$trainingId/stats`)

**Files:**
- Create: `src/routes/training.$trainingId_.stats.tsx` (modèle : `session.$sessionId_.stats.tsx`, avec `errorComponent`), `src/features/training-stats/training-stats-page.tsx`, `components/key-figures.tsx`, `components/review-list.tsx`, `components/category-rates.tsx`, `components/tag-rates.tsx`, `components/question-details.tsx`, `components/rate-cell.tsx` (pourcentage + `Progress`)
- Modify: `src/features/training/training-page.tsx` (lien « Voir les stats » dans l'en-tête de page) ; `src/features/home/components/training-card.tsx` (lien « Stats » à côté de « Reprendre », ou entrée du menu)
- Modify: `ui-messages.ts` (+ `SAMPLE`)
- Test: un test par composant + `training-stats-page.test.tsx`

**Contenu :**
- États : chargement, absent (« Cet entraînement n’existe pas. » + retour), endommagé (écran de #136 réutilisable s'il est partagé, sinon même contenu), base non `open` (`DbStatusBanner`). Apparence : `SessionAppearance sessionId={\`training-${id}\`}` comme l'écran d'entraînement. Titre : nom de l'entraînement ; lien retour vers l'entraînement.
- Journal vide (aucun tirage noté ni passé) : carte « Pas encore de réponse notée. Tirez une première question pour voir vos stats. » + lien vers l'entraînement ; pas de tableaux.
- **Chiffres clés** (3 cartes) : « N réponses notées », « N passées », « X / Y questions notées » (+ `Progress`).
- **À revoir** : liste des questions `toReview` (déjà en tête de `stats.questions`), chacune : niveau, titre, dernière note « 0,5 / 2 » (format décimal de la langue via `formatRawScore`), « N passages ». Vide : « Aucune question à revoir pour l’instant. »
- **Par niveau** : une ligne par catégorie (ordre de la config) : libellé, taux (`RateCell`), couverture « 9 / 19 ».
- **Par notion** : une ligne par tag (ordre de `byTag`) : tag, taux (`RateCell`). Bloc absent si `byTag` est vide.
- **Détail** : `<details>` « Détail des N questions », replié ; tableau : niveau, titre, passages notés, dernière note, taux moyen (`RateCell`), marque « À revoir ».
- Mémoïser `computeTrainingStats(config, draws)` sur `[config, draws]`.

- [ ] **Step 1: Tests qui échouent** : nominal (chiffres, à revoir, taux par niveau et par tag, détail replié puis ouvert) ; journal vide ; config sans tags (pas de bloc « Par notion ») ; entraînement absent ; endommagé ; **barème modifié** (note `{ points: 2, max: 2 }` sur une catégorie dont le barème actuel a un max de 1 → « 2 / 2 » et 100 %) ; lien depuis l'écran d'entraînement et depuis la carte d'accueil.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS ; build + `check:bundle` + `check:budget`.
- [ ] **Step 5: Commit** `✨ Ajoute l'écran de stats d'un entraînement`

---

### Task 4: Mise à jour de config (`/training/$trainingId/update`)

**Files:**
- Create: `src/routes/training.$trainingId_.update.tsx` (route mince → `TrainingSetupPage` avec `trainingId`)
- Modify: `src/features/training-setup/training-setup-page.tsx`, `hooks/use-training-setup.ts`, `components/config-step.tsx` — prop `trainingId?: string` : en mode mise à jour, titre « Mettre à jour la config », lit l'entraînement (`useTraining`), affiche le **bilan** (`diffTrainingConfig(training.config, nextConfig)`) sous la config valide, bouton « Mettre à jour » → `replaceTrainingConfigInDb(trainingId, config, { now })` → navigation `/training/$trainingId`. Garde de soumission et de navigation identiques à la création.
- Entraînement absent ou endommagé : message (« Cet entraînement n’existe pas. » / « Cet entraînement est endommagé : il ne peut pas être mis à jour. ») et aucun bouton d'écriture.
- Points d'entrée : menu de la carte d'accueil (« Mettre à jour la config ») et lien dans l'en-tête de l'écran d'entraînement.
- Modify: `ui-messages.ts` (+ `SAMPLE`)
- Test: `training-setup-page.test.tsx`, `use-training-setup.test.ts` (ajouts), carte d'accueil, écran d'entraînement

- [ ] **Step 1: Tests qui échouent** : mode mise à jour : titre, bilan exact (conservées / nouvelles / retirées) pour une config qui ajoute et retire une question ; « Mettre à jour » remplace la config en base (nom suivi), garde le journal et navigue vers l'entraînement ; tirage en attente sur une question retirée → passé, l'écran revient aux tuiles ; id absent → message, pas d'écriture ; endommagé → message ; la création (sans `trainingId`) inchangée.
- [ ] **Step 2:** FAIL. **Step 3:** Implémenter. **Step 4:** PASS ; build + `check:bundle` + `check:budget`.
- [ ] **Step 5: Commit** `✨ Permet de mettre à jour la config d'un entraînement`

---

### Task 5: Parcours e2e

**Files:**
- Modify: `e2e/pages/training-page.ts`, `e2e/pages/home-page.ts`, `e2e/pages/training-setup-page.ts` ; Create: `e2e/pages/training-stats-page.ts`
- Modify: `e2e/training.spec.ts` (nouveau test)

- [ ] **Step 1:** Parcours : créer l'entraînement depuis `examples/training.example.json` → noter 0 sur une question (elle devient « à revoir ») et passer une autre → ouvrir les stats : « 1 réponse notée », « 1 passée », couverture « 1 / <total> », la question notée apparaît dans « À revoir » → « Mettre à jour la config » avec une variante dérivée dans le test (une question retirée **qui n'est pas celle notée**, une question ajoutée dans `facile`) → bilan « <total-1> conservées », « 1 nouvelle », « 1 retirée » → « Mettre à jour » → retour à l'entraînement → tirer en `facile` jusqu'à obtenir la nouvelle question ou vérifier qu'elle sort en premier si toutes les autres de la catégorie ont déjà été vues (adapter : noter d'abord les questions `facile` existantes) → les stats gardent la note d'avant la mise à jour. Valeurs dérivées du JSON, jamais en dur.
- [ ] **Step 2:** `rtk pnpm e2e e2e/training.spec.ts` (puis 10 répétitions) → PASS ; suite e2e complète → PASS.
- [ ] **Step 3: Commit** `✅ Ajoute le parcours e2e des stats et de la mise à jour de config`

---

### Task 6: Captures, guide et mémoire

**Files:**
- Modify: `e2e/screenshots/guide.spec.ts` (+ `determinism.ts` si besoin) : captures déterministes de la mise en place (étape 2 avec l'encadré), d'une question révélée et de l'écran de stats, dans `site/public/screenshots/` ; noms cohérents avec les existants.
- Modify: `site/guide/s-entrainer.md` : sections « Voir ses stats » et « Mettre à jour la config » (bilan, historique gardé par `id`), images ; supprimer la section « Ce qui n'existe pas encore » ; apostrophes typographiques dans les libellés cités (« C’est parti », « S’entraîner », « Corriger dans l’éditeur »), aussi dans `site/guide/prise-en-main.md`.
- Modify: `site/guide/reference-config.md` : mention du schéma allégé (`config.schema.lite.json`, pour les LLM).
- Modify: `docs/BACKLOG.md` : courbe de progression ; tirage qui favorise les points faibles ; export/import d'un entraînement (backup) ; seuil « à revoir » réglable ; schéma copié dans le prompt pour un LLM sans web ; mode « compléter une config existante » ; sauvegarde du brouillon de l'éditeur avant un passage de config (retour de #140).
- Modify: `docs/INDEX.md` (F43.4 et F43 livrée), `docs/HANDOFF.md` (entrée datée, 4 marqueurs), `docs/DECISIONS.md` (D101 : stats « À revoir » en tête, barres `Progress`, bilan avant mise à jour, route `/update` au lieu de `?replace=`).

- [ ] **Step 1:** Rédiger ; `rtk pnpm docs:screenshots` **deux fois** → `git status` identique après la seconde (captures stables).
- [ ] **Step 2:** `rtk pnpm check && rtk pnpm build && rtk pnpm docs:build` → vert.
- [ ] **Step 3: Commit** `📝 Documente les stats et la mise à jour de config (F43.4)` (captures comprises).

---

## Après les tâches (session principale)

PR brouillon `Closes #137`, `sonar-check.sh --pr <n> --wait`, « Ready for review » une fois le gate OK. **Pas de merge** : l'utilisateur donnera son go.
