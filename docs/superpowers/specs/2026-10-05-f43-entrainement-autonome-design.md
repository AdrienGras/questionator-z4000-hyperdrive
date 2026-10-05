# F43 — Entraînement autonome — Design

- **Date** : 2026-10-05
- **Ticket** : à créer (découpage en 4 tickets, voir « Découpage »)
- **Branche** : une par ticket
- **Statut** : design validé en conversation, figé ici avant le découpage en tickets et le plan d'implémentation.

## Contexte

L'application sert aujourd'hui à faire passer des oraux notés : un examinateur, une liste d'étudiants, un nombre fixe de questions, une note finale sur une échelle. Rien n'est prévu pour l'étudiant qui veut **réviser seul** avant l'oral.

Les LLM savent produire une config à partir d'un cours. L'idée : l'étudiant fournit son cours à un LLM, récupère une config, la dépose dans l'application et s'entraîne sans limite de questions, avec des stats qui lui disent où il en est d'une séance à l'autre.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §3, §4, §6.2 · `src/domain/config/json-schema.ts` · `vite/config-schema-plugin.ts` · `src/lib/db/db.ts` · `docs/CONVENTIONS.md` § « Arborescence et imports », « Mutation de session », « Fichier déposé et lu », « Vue de session thémée » · D47, D59, D81.

## Objectif

Un étudiant passe de « j'ai un PDF de cours » à « je m'entraîne » en quelques minutes, sans aide. Il reprend son entraînement quand il veut, ses stats s'accumulent, et régénérer la config avec le LLM ne lui fait pas perdre son historique.

## Décisions (D101)

| Sujet | Décision | Raison |
|---|---|---|
| Évaluation | Auto-évaluation : l'étudiant révèle `answer` puis se note avec les boutons du barème de la catégorie | Réutilise le barème existant ; les stats restent chiffrées. |
| Tirage | Cycle sans répétition par catégorie : jamais vues d'abord, remélange une fois la catégorie épuisée | Simple, prévisible, chaque question finit par sortir. La priorité aux points faibles va au backlog. |
| Stats | Socle (questions faites, réussite par catégorie) + maîtrise par tag + détail par question + couverture | Ce qui aide à réviser. Courbe de progression au backlog (n'a de sens qu'après plusieurs séances). |
| Config | Même schéma strict que l'oral, aucune variante assouplie | Une config d'entraînement reste utilisable pour un oral ; une seule validation à maintenir. |
| Entité | `Training` à part, tables Dexie dédiées ; `Session` inchangée | Une session porte étudiants, passages, plafond, ajustements, export : un drapeau `mode` mettrait des `if` partout (D59). |
| Persistance | Un entraînement par config, reprenable ; mise à jour de config qui reprend l'historique des `id` conservés | Régénérer la config avec le LLM est le cas normal ; les `id` stables sont exigés par le prompt. |
| Journal | Table `trainingDraws` séparée, une ligne par tirage | Le journal grossit sans fin : une note ajoute une ligne au lieu de réécrire un document. |
| Prompt | Fourni par l'application, à copier ; renvoie au README et à un schéma allégé par URL | Le LLM a forcément accès au web (prérequis assumé) ; le prompt reste court et ne dérive pas du schéma. |
| Schéma allégé | `config.schema.lite.json`, identique au schéma complet sauf `icon` réduit à une chaîne | Dans `config.schema.json` (252 Ko), l'énumération des 6 220 icônes précède `questions` (caractère ~250 000) : un outil de lecture web qui tronque ne verrait jamais la structure des questions. |
| Niveaux | 4 catégories imposées par le prompt (`id`, libellé, barème, icône) | Configs homogènes, stats comparables, `id` de catégorie stables pour la reprise d'historique. |
| Calibrage | Grille cognitive (restituer / appliquer / analyser / concevoir), couverture par tag, 30 à 60 questions | Critère qu'un LLM applique de façon régulière ; volume qui suit le cours sans dépasser la longueur de sortie. |
| `answer` | Gabarit imposé : réponse de référence, barème palier par palier, pièges facultatifs | L'étudiant se note seul : sans grille alignée sur le barème, l'auto-évaluation devient approximative. |
| Dépôt | Fichier `.json` déposé **ou** JSON collé | Un LLM qui ne sait pas produire de fichier rend un bloc de code ; coller évite d'en faire un fichier à la main. |

## Parcours et écrans

### Accueil (`features/home/`)

- Un bouton « S'entraîner », à côté de « Créer une session ».
- Une section « Mes entraînements », distincte de la liste des sessions : nom (`exam.title`), dernière activité, couverture en %. Actions : reprendre, voir les stats, mettre à jour la config, supprimer (dialogue de confirmation, comme pour une session).
- Un entraînement endommagé s'affiche comme une session endommagée (D81).

### Mise en place (`/training/new`, `features/training-setup/`)

Un seul écran, 4 étapes numérotées :

1. **Rassemble ton cours** : consigne de réunir cours et ateliers dans un PDF ou un zip unique. L'application ne lit jamais ce fichier : il va au LLM.
2. **Copie le prompt** : le prompt (section « Prompt ») dans un bloc en lecture seule, bouton « Copier ». Langue du prompt = langue de l'interface.
3. **Récupère ta config** : consigne de récupérer le fichier `.json` produit par le LLM, ou son bloc de code.
4. **Dépose-la** : zone de dépôt de fichier et champ de collage, puis « C'est parti ». Validation identique à la création de session : erreurs listées avec leur chemin, lien « Corriger dans l'éditeur » (F26, passage par `config-handoff`). Les avertissements seuls ne bloquent pas.

`/training/new?replace=<id>` réutilise l'écran pour **mettre à jour la config** d'un entraînement existant : étapes identiques, bouton « Mettre à jour », puis retour à l'entraînement.

### Entraînement (`/training/$trainingId`, `features/training/`)

- Vue thémée par la config (`theme`, `defaultColorMode`), comme une vue de session.
- Tuiles des 4 catégories ; une catégorie n'est jamais grisée (le cycle repart).
- Tirage → énoncé (`prompt`, rendu markdown) → « Voir la réponse » → `answer` + boutons du barème → note → retour aux tuiles. « Passer » est disponible avant et après la révélation.
- Animation de tirage selon `presentation.drawAnimation`.
- Un tirage en attente bloque les tuiles jusqu'à la note ou au passage ; recharger la page le restaure (principe 3).
- Lien vers les stats.

### Stats (`/training/$trainingId/stats`, `features/training-stats/`)

Les 4 blocs de la section « Stats ». Pas d'export en V1.

## Modèle de données

Dexie version 2 : `this.version(2).stores({ sessions: 'id, updatedAt', trainings: 'id, updatedAt', trainingDraws: '++id, trainingId' })`, sans `upgrade` (les sessions ne changent pas).

```ts
type Training = {
  id: string
  name: string // exam.title à la création, puis à chaque mise à jour de config
  createdAt: string
  updatedAt: string
  config: Config // figée (principe 2), remplacée seulement par « Mettre à jour la config »
}

type DrawOutcome =
  | { kind: 'pending' }
  | { kind: 'scored'; points: number; max: number } // valeurs du barème (D43), ex. 1.5 ; max figé à la note
  | { kind: 'passed' }

type TrainingDraw = {
  id?: number
  trainingId: string
  questionId: string
  drawnAt: string
  outcome: DrawOutcome
}
```

- Au plus un tirage `pending` par entraînement. Le contrôle est refait dans la transaction d'écriture, sur les données fraîches (deux onglets).
- Toutes les écritures passent par `lib/db/trainings.ts`, dans une transaction `rw` sur `trainings` et `trainingDraws` : `createTraining`, `drawTrainingQuestion`, `scoreTrainingDraw`, `passTrainingDraw`, `replaceTrainingConfigInDb`, `deleteTraining` (supprime aussi le journal). Les points et `max` restent en valeurs du barème dans la base ; `toMilli` ne sert qu'aux calculs de `training-stats.ts`. Aucun import du singleton hors de `lib/db/` (règle `db-singleton`).
- `updatedAt` change à chaque écriture ; il sert au tri de l'accueil et à « dernière activité ».
- Lecture : `useTrainings()`, `useTraining(id)`, `useTrainingDraws(id)` ; `undefined` = chargement, `null` = absent. Un entraînement dont la config stockée ne passe plus la validation est endommagé (`checkStoredTraining`, sur le modèle de `checkStoredSession`) ; les lignes du journal invalides sont écartées à la lecture (`parseStoredDraws`).
- Fichiers du domaine : `types.ts`, `schema.ts` (`TrainingSchema`, `TrainingDrawSchema`), `stored-training.ts`, `new-training.ts`, `cycle-draw.ts`, `resolve-draw.ts` (`scoredOutcome`, `passedOutcome`), `replace-config.ts`, `training-stats.ts`, `errors.ts` (`TrainingError` : `category_not_found`, `pending_exists`, `not_pending`, `score_not_in_scale`). Côté `lib/db/` : `damaged-training.ts`, `errors.ts` (`TrainingExistsError`, `TrainingNotFoundError`, `TrainingDamagedError`), `record-order.ts` (tri partagé avec les sessions).

## Règles métier (`domain/training/`)

Toutes pures, sans React ni Dexie, testées unitairement. Seules comptent les questions de la **config courante**.

### Tirage en cycle (`cycle-draw.ts`)

Pour une catégorie : compter, pour chacune de ses questions, les tirages `scored` ou `passed` du journal. Le tour courant est le plus petit de ces comptes ; on tire au hasard (source injectée, comme `domain/passage/random.ts`) parmi les questions à ce compte. Pas d'état stocké : tout se déduit du journal. Une question ajoutée par une mise à jour de config a 0 tirage et sort donc en priorité.

### Stats (`training-stats.ts`)

Calculées sur les tirages `scored` des questions de la config courante, regroupés par leur catégorie et leurs tags **actuels**. Taux = somme des `points` / somme des `max`, en millièmes (`toMilli`) jusqu'à l'affichage, affiché en pourcentage entier.

- **Socle** : nombre de questions notées, nombre de questions passées, taux par catégorie.
- **Maîtrise par tag** : taux par tag ; une question à plusieurs tags compte dans chacun. Pas de bloc si la config n'a aucun tag.
- **Détail par question** : nombre de passages notés, dernière note / max, taux moyen. **À revoir** si la dernière note est strictement inférieure à la moitié du max (constante du domaine, réglage au backlog). Liste « À revoir » en tête.
- **Couverture** : questions avec au moins une note / questions de la config, au global et par catégorie.

### Mise à jour de config (`replace-config.ts`)

La nouvelle config remplace l'ancienne et `name` suit le nouveau `exam.title`. Le journal est conservé tel quel : les lignes dont le `questionId` n'existe plus restent en base, ignorées par le tirage et les stats. Un tirage `pending` sur une question supprimée passe à `passed`. Les `max` déjà enregistrés ne sont pas recalculés.

### Champs de config sans effet en entraînement

`scoring` (hors barèmes des catégories), `absent`, `skips`, `presentation.showCumulativeScore`, `finalScoreDisplay`, `showStatsOnFinal`, `showCategoryPoints`. Ils restent validés : la config reste valable pour un oral.

## Schéma allégé

`buildConfigJsonSchema` (`domain/config/json-schema.ts`) prend une option `{ lite: boolean }` : en `lite`, `icon` est déclaré `{ "type": "string" }` avec une description qui renvoie aux icônes Tabler, sans énumération. `vite/config-schema-plugin.ts` émet `config.schema.json` et `config.schema.lite.json`. Le fichier émis pèse environ 31 000 octets ; un test borne sa taille à 40 000 octets. Vérifier que les scripts `check:precache` et `check:budget` l'acceptent (fichier statique, hors bundle initial).

## Prompt (`domain/training/prompt.ts`)

`buildTrainingPrompt(locale)` rend le texte ; les URL (schéma allégé, README) sont des constantes, comme `CONFIG_SCHEMA_URL` : le prompt pointe toujours vers le site publié, même en dev. Les 4 catégories imposées vivent dans `training-categories.ts`, dont le tableau du prompt est généré ; les phrases vivent dans `domain/training/messages.ts` (fr et en, mêmes clés). Version française de référence :

````text
Tu vas générer un fichier de configuration pour Questionator Z-4000 Hyperdrive, une application
d'entraînement aux oraux. Je t'ai joint mon cours et mes ateliers (PDF ou zip) : c'est la seule
source de contenu autorisée.

## 1. Comprendre l'outil
Lis la présentation du projet :
https://raw.githubusercontent.com/AdrienGras/questionator-z4000-hyperdrive/main/README.md
L'étudiant choisit un niveau, une question est tirée, il y répond, affiche la réponse attendue
et se note lui-même avec le barème du niveau.

## 2. Respecter le format
Lis le JSON Schema, qui fait foi pour la structure et les champs autorisés :
https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.lite.json
Aucune clé hors schéma. Le champ `$schema` du fichier vaut :
"https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json"
Valeurs imposées :
- "schemaVersion": 1, "locale": "fr"
- "exam.title" : le titre du cours ; "exam.subject" : la matière
- "scoring": { "questionsPerStudent": 3, "maxRawScore": 10, "finalScale": 20 }
- exactement ces 4 catégories, dans cet ordre (`icon` = nom d'icône Tabler Icons) :
  | id        | label     | scale                 | icon    |
  |---|---|---|---|
  | facile    | Facile    | [0, 0.5, 1]           | leaf    |
  | normal    | Normal    | [0, 0.5, 1, 1.5, 2]   | flame   |
  | difficile | Difficile | [0, 1, 2, 3]          | bolt    |
  | cauchemar | Cauchemar | [0, 1, 2, 3, 4]       | skull   |

## 3. Procéder dans cet ordre
a. Dresse la liste fermée des notions du cours (5 à 15 tags courts, en minuscules, par exemple
   à partir des chapitres). Tu n'utiliseras que ces tags, écrits exactement pareil.
b. Rédige les questions, chacune avec 1 à 3 tags de cette liste.
c. Vérifie les règles d'oral, la couverture et le format (sections 2, 4, 5 et 6) avant de
   répondre.

## 4. Questions d'oral et difficulté
Ce sont des questions d'ORAL : chaque question se répond à voix haute, en 2 à 5 minutes, sans
écrire de code.
- Ne demande jamais d'écrire, de réécrire ou d'implémenter du code.
- Le cours et les ateliers illustrent des notions ; ils ne sont pas à mémoriser. Ne demande
  jamais un nom de classe, de méthode, de fichier ou une valeur de configuration propre aux
  ateliers, ni « la solution retenue dans l'atelier ». La réponse attendue est une notion, un
  mécanisme ou un raisonnement, jamais un détail du projet.
- Si une question s'appuie sur du code, l'énoncé fournit un extrait court et autonome
  (15 lignes au plus) : l'étudiant raisonne dessus (prédire, expliquer, repérer un problème
  et dire pourquoi), sans avoir vu l'atelier.
- Une seule question par énoncé : pas de liste de cas à traiter un par un.
Plus le niveau monte, plus le raisonnement s'approfondit (pourquoi, compromis, conséquences,
cas limites) ; la quantité de détails à connaître, elle, n'augmente pas.
- facile : RESTITUER. La réponse est littéralement dans le cours, en 1 ou 2 phrases. Une
  seule notion. « Qu'est-ce que… », « À quoi sert… ».
- normal : COMPRENDRE ET APPLIQUER. Expliquer un comportement ou un mécanisme, prédire le
  résultat d'un extrait fourni, appliquer une notion à une situation concrète. Une notion,
  dans un contexte légèrement nouveau.
- difficile : ANALYSER. Relier au moins 2 notions (au moins 2 tags), expliquer la cause d'un
  problème décrit ou montré dans un extrait, comparer deux approches et justifier un choix.
  Un raisonnement, pas une récitation.
- cauchemar : ÉVALUER ET ARGUMENTER. Cas limites, compromis, mécanismes internes, « que se
  passe-t-il si… » sur une notion centrale. Demande une compréhension fine, sans sortir du
  cours.
Toute question doit pouvoir se résoudre avec le contenu fourni, sans connaissance hors programme.

## 5. Volume et couverture
- Pour chaque tag : au moins 1 question facile et 1 question normal.
- Chaque question difficile porte au moins 2 tags.
- cauchemar : 3 à 6 questions, sur les notions centrales.
- Total : 30 à 60 questions, réparties environ en 35 % facile, 30 % normal, 25 % difficile
  et 10 % cauchemar.
- Pas deux questions qui demandent la même chose sous une autre forme.

## 6. Rédiger chaque question
- "id" : "<niveau>-<slug-du-sujet>", en kebab-case et sans numérotation
  (ex. "normal-comparaison-stricte"). Unique dans tout le fichier.
- "title" : un libellé court (moins de 60 caractères).
- "prompt" : l'énoncé en markdown ; les blocs de code indiquent leur langage.
- "answer" : exactement ce gabarit markdown :

  **Réponse de référence**
  <ce qu'un bon candidat dit à l'oral, en quelques phrases, sans code à produire>

  **Barème**
  - **<valeur>** : <ce que dit une réponse qui vaut cette note>
  (une ligne par valeur non nulle du barème du niveau, en ordre croissant, écrite avec une
  virgule décimale : 0,5 / 1 / 1,5… ; chaque ligne décrit la réponse complète à ce palier,
  sans « en plus de »)

  **Pièges**
  - <erreur fréquente>
  (section facultative, 1 ou 2 lignes, à omettre si elle n'apporte rien)

## 7. Livrer
Rends un unique fichier `.json`, valide et complet, sans commentaire. Si tu ne peux pas créer
de fichier, rends un seul bloc de code ```json``` et rien d'autre.
````

La version anglaise impose `"locale": "en"`, les libellés `Easy`, `Normal`, `Hard`, `Nightmare` (mêmes `id`), et le point décimal dans les barèmes de `answer`. Le prompt sera affiné à l'usage ; ses contraintes structurelles (URL, 4 catégories, gabarit de `answer`) sont verrouillées par des tests.

La section 4 a été réécrite après une première génération réelle (cours d'API REST, Claude Opus 5.5) : le LLM demandait de réécrire du code et de réciter l'implémentation des ateliers. Elle impose désormais des questions d'oral (sans code à écrire, ateliers comme illustrations et non comme matière à mémoriser, extrait de code court et autonome fourni dans l'énoncé, une question par énoncé) et un calibrage qui approfondit le raisonnement plutôt que la quantité de détails.

## Arborescence (D59)

| Emplacement | Contenu |
|---|---|
| `domain/training/` | `types.ts`, `cycle-draw.ts`, `training-stats.ts`, `replace-config.ts`, `stored-training.ts`, `prompt.ts`, `messages.ts`, `training-categories.ts` |
| `domain/config/json-schema.ts` | option `lite` |
| `vite/config-schema-plugin.ts` | émission de `config.schema.lite.json` |
| `lib/db/` | Dexie v2, `trainings.ts` (écritures), hooks de lecture |
| `features/training-setup/` | écran en 4 étapes, création et mise à jour |
| `features/training/` | écran d'entraînement |
| `features/training-stats/` | écran de stats |
| `features/home/` | bouton « S'entraîner », section « Mes entraînements » |
| `components/` | ce qui est partagé avec `features/session/` (tuiles de catégorie, affichage d'une question…), remonté dans un commit de refactor séparé, sans changement de comportement |
| `routes/` | `training.new.tsx`, `training.$trainingId.tsx`, `training.$trainingId_.stats.tsx` |

## Tests

- **Domaine** (Vitest) : cycle (premier tour, remélange, question ajoutée prioritaire, journal d'une question supprimée ignoré, `passed` compté) ; stats (millièmes, multi-tags, seuil « à revoir » aux bornes, config sans tags, journal vide) ; mise à jour de config (`pending` orphelin → `passed`, `name` suivi, `max` conservés) ; prompt (contient les URL du README et du schéma allégé, les 4 `id` et barèmes, le gabarit de `answer` ; fr et en ont les mêmes clés) ; schéma allégé (ne diffère du complet que sur `icon`).
- **Exemple** : un fichier `examples/training.example.json` conforme au prompt passe la validation sans erreur ni avertissement.
- **`lib/db`** : migration v1 → v2 sans perte des sessions ; un seul `pending` sous concurrence ; suppression en cascade du journal ; endommagement.
- **Composants** : chaque écran dans ses états chargement / absent / endommagé / nominal ; copie du prompt ; dépôt et collage ; erreurs de validation.
- **e2e** (Playwright, Page Object Model) : coller une config → tirer → révéler → noter → recharger (le `pending` est restauré) → stats → mettre à jour la config → l'historique des `id` conservés est là.
- Couverture du nouveau code ≥ 80 % (gate Sonar, D99).

## Découpage

Une spec, quatre tickets en séquence, chacun avec sa PR :

1. Schéma allégé et prompt (domaine seul).
2. Stockage et domaine de l'entraînement (Dexie v2, cycle, stats, mise à jour de config).
3. Mise en place, écran d'entraînement, accueil.
4. Stats et mise à jour de config (UI).

Les tickets seront rédigés au format des précédents.

## Mémoire et documentation

- `PRODUCT.md` : glossaire (Entraînement, Tirage en cycle) et section F43.
- `docs/DECISIONS.md` : D101 (tableau ci-dessus).
- `docs/INDEX.md`, `docs/HANDOFF.md` à chaque ticket ; `docs/CONVENTIONS.md` si `lib/db/trainings.ts` fixe un squelette de mutation propre aux entraînements.
- `site/guide/` : page « S'entraîner seul » (étapes, prompt, stats) ; la référence de config mentionne le schéma allégé.
- `docs/BACKLOG.md` : courbe de progression ; tirage qui favorise les points faibles ; export et import d'un entraînement (backup) ; seuil « à revoir » réglable ; option « copier le schéma dans le prompt » pour un LLM sans web ; mode « compléter une config existante ».

## Critères d'acceptation et vérification

| Critère | Vérifié par |
|---|---|
| D'un PDF de cours à une première question tirée sans autre source que l'écran de mise en place | Essai manuel avec un LLM réel sur un cours du dépôt, consigné dans la PR du ticket 3 |
| Le cycle ne répète aucune question avant d'avoir épuisé la catégorie | Tests de `cycle-draw.ts` |
| Recharger ne retire pas une question tirée | e2e |
| Mettre à jour la config conserve l'historique des `id` communs | Tests de `replace-config.ts` + e2e |
| Les sessions existantes survivent à la migration | Test de migration v1 → v2 |
| Le schéma allégé ne diffère du complet que sur `icon` | Test structurel |
| La config d'exemple d'entraînement est aussi valable pour un oral | Test de validation de `examples/training.example.json` |

## Hors périmètre

Évaluation de la réponse par un LLM ou toute requête réseau depuis l'application ; lecture du PDF ou du zip par l'application ; export Excel d'un entraînement ; partage d'un entraînement entre appareils ; courbe de progression et autres entrées du backlog ci-dessus.
