# F44.11 — Guide, captures et README : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** la documentation (guide utilisateur, captures, guide contributeur, README) décrit l'interface livrée par F44, dans une prose relue.

**Architecture :** d'abord le script des captures (réparé, étendu, passé en sombre), qui produit les images de référence ; puis un test garde-fou des pages du guide (libellés d'avant la refonte, captures manquantes), activé page par page à mesure qu'elles sont réécrites ; enfin le guide contributeur, le README et la mémoire. Aucun code applicatif ne change.

**Tech Stack :** VitePress (`site/`), Playwright (`playwright.screenshots.config.ts`, `e2e/screenshots/`), Vitest pour les tests de contenu du site.

**Spec :** ticket #155 ; `docs/superpowers/specs/2026-10-14-f44-refonte-ui-design.md` (§ Navigation, § Mémoire et documentation) ; `docs/superpowers/specs/2026-10-17-f44-carte-des-ecrans.md` (vocabulaire et comportements par écran) ; D110, D112.

**Branche :** `feat/f44-refonte-ui` (PR #154, brouillon), exécution native. Pas de passe canevas : documentation seulement.

## Global Constraints

- **Source des libellés** : tout libellé cité entre « » dans le guide est recopié depuis le dictionnaire FR de `src/lib/i18n/ui-messages.ts` (lignes `const fr` 527-1043) ou lu dans l'app lancée (`pnpm dev`), jamais de mémoire. Un libellé court à l'écran avec un libellé long en `aria-label` se cite sous sa forme visible (« Ouvrir », pas « Ouvrir la vue projetée »).
- **Vocabulaire** : « sauvegarde » partout où l'interface disait « backup » ; seul le nom de fichier garde `-backup-` (`<nom-de-la-session>-backup-<AAAA-MM-JJ>.json`, `src/domain/backup/serialize.ts:31`).
- **Navigation** : on entre dans un espace par le menu latéral (Accueil, Sessions, Éditeur de config, Entraînement ; Aide, mode d'affichage et « Replier le menu » en pied) ; les écrans d'un espace ont un fil d'Ariane (`Sessions › <nom de session> · <titre de l'oral>`) ; la vue projetée n'a jamais de menu.
- **Mode d'affichage** (D60, D112) : bascule « Mode d'affichage : … » (Clair, Sombre, Système) en pied du menu ; sur un écran de session elle règle le mode de cette session, ailleurs le mode global ; défaut global `system` ; la vue projetée n'a pas de bascule et suit toujours `presentation.defaultColorMode`.
- **Captures** *(utilisateur, 2026-10-18)* : toutes en sombre (`colorScheme: 'dark'`), plus une seule en clair, `mode-clair.png` (accueil). Nouvelles captures : `sessions.png` (remplace `accueil-sessions.png`), `accueil-reprendre.png`, `entrainements.png`, `stats-vide.png`, `mode-clair.png`.
- **Prose** *(utilisateur : « à revoir aussi si les textes des docs sont bons »)* : chaque page touchée est relue en entier, pas seulement les passages périmés. Critères : vouvoiement, présent, phrases courtes, une action par étape numérotée, un seul nom par chose (session, config, sauvegarde, vue projetée, écran de passage), pas de tics de texte généré (passer le skill `humanize-fr`, registre « support pédagogique », sur chaque page réécrite), orthographe et typographie françaises comme le reste du site (espace simple avant `:` `;` `?` `!`, pas d'insécable ; guillemets « » ; apostrophe telle que la page l'emploie déjà). Les textes alternatifs des captures décrivent ce que montre la nouvelle image.
- **Liens** : renommer un titre change son ancre ; avant tout renommage, `grep -rn '<page>#' site README.md` et mettre à jour les liens.
- `pnpm check`, `pnpm docs:build`, `pnpm docs:screenshots` verts en fin de ticket. Commits gitmoji en français.

## Review Focus

1. **Libellé cité qui n'existe plus** à l'écran (« Exporter un backup », onglet « Étudiants ») : le lecteur cherche un bouton introuvable. Couvert par le garde-fou de la tâche 2, à compléter par la vérification au dictionnaire.
2. **Parcours décrit par l'ancien accueil** (cartes « Nouvelle session », « Restaurer une session », « Éditer une config », « Commencer ») : sur base vide l'accueil montre le premier lancement, sinon le tableau de bord. Couvert par le garde-fou (motifs dédiés).
3. **Bascule de mode décrite au mauvais endroit** (« en haut à droite », sur la vue projetée) : motif dédié dans le garde-fou ; portée session/global vérifiée à la main (tâches 2 et 4).
4. **Capture citée absente ou orpheline** après le renommage `accueil-sessions.png` → `sessions.png` : test « captures présentes » (tâche 2) et « aucune capture orpheline » (tâche 8).
5. **Ancre cassée** après un titre renommé (« Sauvegarder : exporter un backup ») : `pnpm docs:build` ne vérifie pas les ancres ; grep imposé par les contraintes, test d'ancres existant pour le dépannage.

---

### Task 1 : script des captures réparé, étendu et passé en sombre

**Files :**
- Modify : `playwright.screenshots.config.ts` (`colorScheme`, `timeout`)
- Modify : `e2e/screenshots/guide.spec.ts`
- Regenerate : `site/public/screenshots/*.png` ; Delete : `site/public/screenshots/accueil-sessions.png`

**Interfaces :**
- Consumes : page objects existants `HomePage` (`firstRun`, `resume`, `spaces`, `createSession`, `startTraining`, `openEditor`), `SessionsPage` (`goto`, `sessionCard`), `TrainingsPage` (`goto`, `trainingCard`), `StatsPage` (`emptyState`, `goToPassage`), `ExaminerPage.openStats`.
- Produces : 17 PNG dans `site/public/screenshots/` : `accueil` (premier lancement), `creation-session`, `stats-vide`, `passage-question`, `vue-projetee`, `passage-panneau`, `passage-note-finale`, `statistiques`, `editeur-config`, `entrainement-mise-en-place`, `entrainement-question`, `entrainement-stats`, `sessions`, `entrainements`, `accueil-reprendre`, `mode-clair`, `creation-avertissements`.

- [ ] **Step 1 : constater l'échec actuel**

Run : `pnpm docs:screenshots`
Expected : FAIL dans « parcours complet », sur `Actions pour « Oral de démonstration »` attendu sur l'accueil (rouge depuis F44.5).

- [ ] **Step 2 : config** — `colorScheme: 'dark'` (commentaire : sombre par décision F44.11, une seule capture claire forcée dans le scénario), `timeout: 180_000` (le scénario unique enchaîne session et entraînement).

- [ ] **Step 3 : scénario** — `guide.spec.ts` garde deux tests : « création : un CSV avec un doublon… » inchangé, et un test unique « parcours complet » qui enchaîne deux fonctions locales `sessionScenario(page)` et `trainingScenario(page)` (contenu des deux tests actuels), puis les captures d'espaces, pour que l'accueil et les pages d'espace montrent la session **et** l'entraînement. Changements dans l'ordre :
  - `accueil` : attendre `home.firstRun` visible (au lieu du lien « Créer une session »).
  - Juste après `create.submit()` : `examiner.openStats()`, `expect(stats.emptyState).toBeVisible()`, capture `stats-vide`, puis `stats.goToPassage()` et la suite inchangée (ouverture de la vue projetée…).
  - Supprimer le bloc `home.goto()` / « Actions pour » / `accueil-sessions` ; l'éditeur s'ouvre ensuite par `home.goto()` puis `home.openEditor()`.
  - Après les stats d'entraînement : `SessionsPage.goto()`, carte `SESSION_NAME` visible, capture `sessions` ; `TrainingsPage.goto()`, carte `TRAINING_NAME = 'Git, les bases'` visible, capture `entrainements` ; `home.goto()`, `home.resume` contient `SESSION_NAME` et `TRAINING_NAME`, capture `accueil-reprendre` ; enfin `page.emulateMedia({ colorScheme: 'light' })`, `home.goto()`, `expect(page.locator('html')).not.toHaveClass(/\bdark\b/)`, capture `mode-clair`.
  - Tout locator qui ne trouve plus sa cible se corrige par le page object de `e2e/pages/` qui couvre l'écran, pas par un sélecteur ad hoc.

- [ ] **Step 4 : régénérer**

Run : `pnpm docs:screenshots`
Expected : 2 passed. `git rm site/public/screenshots/accueil-sessions.png`.

- [ ] **Step 5 : contrôle visuel** — `Read` de chaque PNG : nouvelle interface (menu latéral visible sauf vue projetée), sombre sauf `mode-clair`, aucun bandeau parasite, rien de coupé ; comparer aux artboards de la carte des écrans (canevas, URL dans `docs/ENVIRONMENT.md`). Relancer une seconde fois et vérifier `git status` : seules les images attendues changent (déterminisme).

- [ ] **Step 6 : commit** — `📸 Régénère les captures du guide en sombre, avec les nouveaux écrans`

### Task 2 : garde-fou du guide, prise en main et hors ligne

**Files :**
- Create : `site/guide/interface.test.ts`
- Modify : `site/guide/prise-en-main.md`, `site/guide/hors-ligne.md`

**Interfaces :**
- Produces : dans `interface.test.ts`, `const PENDING: ReadonlySet<string>` (noms de fichiers `.md` du guide pas encore réécrits) et `const OBSOLETE: ReadonlyArray<{ label: string; pattern: RegExp }>`. Les tâches 3 à 6 retirent leurs pages de `PENDING` ; la tâche 8 supprime `PENDING`.

- [ ] **Step 1 : écrire le test** — `describe('guide : interface livrée par F44')`, `test.each` sur les `site/guide/*.md` hors `PENDING` :
  - `'<page> ne cite aucun libellé d’avant la refonte'` : `expect(hits).toEqual([])`, où `hits` liste `label` + numéro de ligne pour chaque motif trouvé. `OBSOLETE` :
    - backup hors nom de fichier : `/(?<![-\w])backups?(?![-\w])/i`
    - `/«\s*Restaurer une session\s*»/`, `/«\s*Éditer une config\s*»/`, `/«\s*Commencer\s*»/`, `/«\s*Retour à l['’]accueil\s*»/`
    - ancien onglet : `/onglet\s+«\s*Étudiants?\s*»/`
    - ancienne bascule : `/(mode d['’]affichage|bascule)[^.\n]*en haut à droite/i`, `/en haut à droite[^.\n]*mode d['’]affichage/i`
  - `'<page> ne cite que des captures présentes'` : chaque `/screenshots/<x>.png` cité existe dans `site/public/screenshots/`.
  - `PENDING` initial : `sessions.md`, `preparer-les-fichiers.md`, `faire-passer.md`, `projeter.md`, `reference-config.md`, `stats-export.md`, `depannage.md`, `s-entrainer.md`, `editeur-config.md`. `prise-en-main.md` et `hors-ligne.md` n'y sont pas.

- [ ] **Step 2 : RED** — Run : `pnpm vitest run site/guide/interface.test.ts` ; Expected : FAIL sur `prise-en-main.md` (backup ligne 16, bouton de mode ligne 45, onglet « Étudiants » ligne 61).

- [ ] **Step 3 : réécrire `prise-en-main.md`**
  - Liens d'exemple : sur l'accueil (premier lancement), « Liste d’étudiants d’exemple (.csv) » et « Config d’exemple (.json) » ; capture `accueil.png` = premier lancement, texte alternatif refait.
  - Nouvelle section « Se repérer dans l'application » (après « Vos données… », avant le parcours) : menu latéral et son pied, repli (icônes seules, mémorisé sur l'appareil), tiroir « Menu » en fenêtre étroite, fil d'Ariane, bascule de mode et sa portée (contraintes globales), capture `mode-clair.png`.
  - Étape 6 : le mode de l'écran de session vient de `defaultColorMode` de la config, se change par la bascule du menu.
  - Étapes 7-10 : vocabulaire de l'écran de passage livré (nom de l'étudiant en titre, « Tirage suivant », barème dans la colonne de droite, « Éléments de réponse » repliés, « Projeter cet étudiant »), à vérifier à l'écran et sur `passage-question.png`.
  - Étape 11 : « Statistiques » en pied du panneau (« Panneau », puis le lien), « Retour au passage ».
- [ ] **Step 4 : `hors-ligne.md`** — le message de mise en cache est un titre « Prête pour le hors ligne » et un corps « L’application fonctionne désormais sans réseau. » ; le bouton « OK » ; relire le reste (« Nouvelle version disponible », « Recharger »).
- [ ] **Step 5 : prose** — relecture complète des deux pages selon les contraintes, `humanize-fr`.
- [ ] **Step 6 : GREEN** — Run : `pnpm vitest run site/guide/interface.test.ts` ; Expected : PASS.
- [ ] **Step 7 : commit** — `📝 Décrit le menu et la bascule de mode dans la prise en main`

### Task 3 : sessions et préparation des fichiers

**Files :** Modify : `site/guide/sessions.md`, `site/guide/preparer-les-fichiers.md`, `site/guide/interface.test.ts` (`PENDING`)

- [ ] **Step 1 : RED** — retirer les deux pages de `PENDING` ; `pnpm vitest run site/guide/interface.test.ts` échoue (backup, « Restaurer une session », `accueil-sessions.png` absente).
- [ ] **Step 2 : `sessions.md`**
  - Créer : depuis la page Sessions (menu) ou l'accueil, « Créer une session ».
  - Retrouver et reprendre : page Sessions (`sessions.png`), compteur « N sessions · dernière modification d’abord », carte avec « Jury : … », « Modifiée le … », avancement en deux lignes (« 1 / 10 passés » puis « 0 absent · 9 restants », d'après `card_progress_of` / `card_progress_rest`), « Reprendre » ; section « Reprendre » de l'accueil (`accueil-reprendre.png`) : les trois éléments les plus récents, sessions et entraînements confondus, endommagés exclus.
  - Menu « … » : « Exporter une sauvegarde » ; titres « Sauvegarder : exporter une sauvegarde » et « Restaurer : importer une sauvegarde » (grep des ancres avant renommage) ; import par « Importer une sauvegarde » de la page Sessions ou par dépôt n'importe où sur la page ; « Exporter une sauvegarde d'abord » dans la suppression.
  - Session endommagée : badge « Endommagée », « Exporter » en bouton visible sur la carte, « Détails · N problèmes ».
  - Tableau des fichiers et badge « Stockage non garanti » : « sauvegarde ».
- [ ] **Step 3 : `preparer-les-fichiers.md`** — liens d'exemple : accueil (premier lancement) et écran « Nouvelle session » (« Liste d’exemple », « Config d’exemple ») ; texte alternatif de `creation-avertissements.png` d'après la nouvelle image ; libellé d'état « Fichier valide, avec avertissements ».
- [ ] **Step 4 : prose** — relecture complète des deux pages, `humanize-fr`.
- [ ] **Step 5 : GREEN** — test PASS.
- [ ] **Step 6 : commit** — `📝 Met à jour les sessions et la préparation des fichiers pour la page Sessions`

### Task 4 : passage, projection et `defaultColorMode`

**Files :** Modify : `site/guide/faire-passer.md`, `site/guide/projeter.md`, `site/guide/reference-config.md`, `site/guide/interface.test.ts` (`PENDING`)

- [ ] **Step 1 : RED** — retirer les trois pages de `PENDING` ; le test échoue (onglet « Étudiants », bouton de mode de la vue projetée).
- [ ] **Step 2 : `faire-passer.md`** (carte des écrans § Passage) : titre = nom de l'étudiant, fil d'Ariane, barre de progression par catégorie, « Score brut » et maximum ; colonne de droite : carte « Vue projetée » en tête, puis note (« Noter la question », un clic note et ferme la question), « Passer la question » et « N passes restantes », « Commentaire » (« Enregistré »), « Marquer absent » ; panneau (« Panneau ») à onglets « Cet étudiant » (correction d'une note, « Questions », « Totaux ») et « Liste » (résumé « N étudiants · N terminés · N absents », « Ajouter un étudiant », « Ajouter et faire passer ») ; question passée « Passée — motif » ; écran « Passage terminé » avec jauges, « Ajuster la note », « Réinitialiser l’étudiant », « Étudiant suivant ». Textes alternatifs des trois captures refaits.
- [ ] **Step 3 : `projeter.md`** : ouvrir par « Ouvrir » dans la carte « Vue projetée » ; « Projeter cet étudiant », « Écran d’attente » ; la vue projetée n'a que « Plein écran » (plus de bouton de mode : supprimer la phrase ligne 17) ; cartes « Question » et « Score » en haut à droite, consigne « Choisissez une catégorie », rangée compacte des catégories pendant une question, écran final sans tuiles avec couleur et icône de catégorie dans le détail ; ligne `defaultColorMode` : la vue projetée suit toujours ce réglage.
- [ ] **Step 4 : `reference-config.md:147`** : `defaultColorMode` = mode de départ des écrans de la session (la bascule du menu le change pour cette session) et mode permanent de la vue projetée. Relire les autres lignes de la section `presentation` contre `projeter.md`.
- [ ] **Step 5 : prose** — relecture complète des trois pages, `humanize-fr`.
- [ ] **Step 6 : GREEN** — test PASS ; `pnpm vitest run site/guide/reference-config.test.ts` PASS.
- [ ] **Step 7 : commit** — `📝 Décrit l'écran de passage et la vue projetée livrés par F44`

### Task 5 : statistiques, export et dépannage

**Files :** Modify : `site/guide/stats-export.md`, `site/guide/depannage.md`, `site/guide/interface.test.ts` (`PENDING`)

- [ ] **Step 1 : RED** — retirer les deux pages de `PENDING` ; le test échoue (backup).
- [ ] **Step 2 : `stats-export.md`** (carte § Statistiques) : accès par « Statistiques » en pied du panneau ; sous-titre ; bloc « Synthèse » (Étudiants, Passés, Absents, Moyenne, Médiane, barre empilée et légende) ; « Notes finales » (histogramme et chiffres fusionnés) ; « Réussite par catégorie » en anneaux ; « Questions les plus tirées » avec « Part » ; état vide « Pas encore de statistiques » et « Aller au passage » (`stats-vide.png`) ; « Exporter en Excel » en pied du panneau et dans le menu « … » de la carte. La description du classeur Excel ne change pas (libellés de `src/domain/export/messages.ts`, inchangés) : la vérifier, pas la réécrire. Texte alternatif de `statistiques.png` refait.
- [ ] **Step 3 : `depannage.md`** : « sauvegarde » (lignes 349-353) ; relire chaque entrée qui décrit un écran (vue projetée, import, stockage) contre l'interface livrée.
- [ ] **Step 4 : prose** — relecture complète des deux pages (le dépannage par entrée, ancres `{#code}` intactes), `humanize-fr`.
- [ ] **Step 5 : GREEN** — `pnpm vitest run site/guide/` PASS (dont `depannage.test.ts`).
- [ ] **Step 6 : commit** — `📝 Met à jour les statistiques et le dépannage`

### Task 6 : entraînement et éditeur de config

**Files :** Modify : `site/guide/s-entrainer.md`, `site/guide/editeur-config.md`, `site/guide/interface.test.ts` (`PENDING` vide)

- [ ] **Step 1 : RED** — retirer les deux pages ; le test échoue (« Commencer », « Éditer une config », « Retour à l'accueil »).
- [ ] **Step 2 : `s-entrainer.md`** (carte § Entraînement, D111) : créer par « Nouvel entraînement » de la page Entraînement, ou « S’entraîner seul » au premier lancement ; étapes indicatives (« Étape N sur 4 », toutes utilisables) ; après copie, « Prompt copié. · Copier à nouveau » et le repli « Afficher le prompt » ; dépôt « Déposez la config (.json) ici » ou repli « … ou collez le JSON ici » avec « Vérifier » ; « Questions par niveau » ; « C’est parti ». Question : tuiles verrouillées, surtitre « Normal · 2 pts », « Voir la réponse », bloc « Réponse » repliable (« Masquer »), « Notez-vous · sur 2 », « Passer ». Page Entraînement (`entrainements.png`) : taux de réussite, « N / M questions notées », « Reprendre », « Stats », menu « … » (« Mettre à jour la config », « Supprimer »). Bilan de mise à jour : trois cartes « conservées · Historique gardé », « nouvelles · Ajoutées au tirage », « retirées · N’apparaissent plus dans les stats ». Textes alternatifs des trois captures refaits.
- [ ] **Step 3 : `editeur-config.md`** (carte § Éditeur) : ouvrir par le menu « Éditeur de config » ou la tuile de l'accueil ; nom de fichier en titre du cadre ; en-tête « Charger », « Repartir de l'exemple », « Télécharger », « Créer une session avec cette config » ; panneau « Problèmes » au-dessus du code, numéro de ligne par problème ; aperçu avec navigation par catégorie et « Écran final ».
- [ ] **Step 4 : prose** — relecture complète des deux pages, `humanize-fr`.
- [ ] **Step 5 : GREEN** — test PASS, `PENDING` vide.
- [ ] **Step 6 : commit** — `📝 Met à jour l'entraînement et l'éditeur de config`

### Task 7 : guide contributeur

**Files :** Modify : `site/contribuer/architecture.md`, `site/contribuer/conventions.md`, `site/contribuer/workflow.md`, `site/contribuer/tests.md` ; relire `installer.md`, `decisions.md`, `claude-code.md`

- [ ] **Step 1 : `architecture.md`** — carte de `src/` d'après `ls` : features `config-editor`, `create-session`, `home`, `present`, `session`, `sessions`, `stats`, `training`, `training-setup`, `training-stats`, `trainings` ; components `export/`, `import/`, `markdown/`, `menu/`, `projection/`, `stats/`, `ui/` (ajouter : coquille de page `page-shell.tsx`, fil d'Ariane) ; domain + `training` ; « Stockage local » : sessions **et** entraînements, lien vers « Mutation d'entraînement ».
- [ ] **Step 2 : `conventions.md`** — section « Interface et langues » complétée : canevas avant le code (D102, lien vers `CLAUDE.md`), tokens dans `src/index.css` qui suivent le design system, liens vers `docs/CONVENTIONS.md#tokens-et-palette--règles` et `#menu-et-coquille-de-page--règles`. Renvoi, pas de recopie.
- [ ] **Step 3 : `workflow.md`** — l'étape canevas pour un ticket qui touche l'UI (spec → artboards validés → plan → code). **`tests.md`** — captures en sombre, `mode-clair.png` seule en clair, et le garde-fou `site/guide/interface.test.ts`.
- [ ] **Step 4 : prose** — relecture complète des sept pages, `humanize-fr` (registre « prose générale »).
- [ ] **Step 5 : vérifier** — `pnpm vitest run site/contribuer/` PASS (liens et ancres vers le dépôt).
- [ ] **Step 6 : commit** — `📝 Met à jour le guide contributeur pour la refonte F44`

### Task 8 : README, captures orphelines, vérification et mémoire

**Files :** Modify : `README.md`, `site/guide/interface.test.ts`, `docs/INDEX.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md` (D113), `docs/QUIRKS.md` si piège, `docs/BACKLOG.md` si idée

- [ ] **Step 1 : test** — supprimer `PENDING` ; ajouter `'aucune capture n’est orpheline'` : chaque PNG de `site/public/screenshots/` est cité par au moins une page du guide (`expect(orphans).toEqual([])`). Run : PASS (sinon citer la capture ou la retirer du script).
- [ ] **Step 2 : `README.md`** — relire chaque phrase sur l'interface (« Essayer en 5 minutes » : exemples téléchargés depuis le premier lancement, « Créer une session ») et la prose ; ne pas toucher à la bannière (#156).
- [ ] **Step 3 : vérifier**

Run : `pnpm check && pnpm docs:build && pnpm docs:screenshots && git status --short site/public/screenshots`
Expected : tout vert, aucune image modifiée par la dernière régénération.

- [ ] **Step 4 : mémoire** — D113 (captures sombres plus une claire, nouvelles captures, garde-fou des libellés, relecture de prose demandée) ; ligne F44.11 dans `docs/INDEX.md` ; entrée `HANDOFF.md` aux quatre marqueurs ; mention F44.11 dans la spec F44 § Découpage si l'état y est suivi.
- [ ] **Step 5 : commit et push** — `📝 Note F44.11 dans la mémoire projet (D113)` ; `git push` ; la PR #154 reste en brouillon (D110 : elle n'en sort qu'après #156). Demander la validation de #155 à l'utilisateur, captures et pages à l'appui.
