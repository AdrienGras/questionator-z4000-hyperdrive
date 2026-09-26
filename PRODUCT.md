# QUESTIONATOR Z-4000 HYPERDRIVE

> Dépôt : `AdrienGras/questionator-z4000-hyperdrive`, publié sur `https://adriengras.github.io/questionator-z4000-hyperdrive/`.

## 1. Vision

Questionator Z-4000 Hyperdrive est une application web front-only qui sert à faire passer des oraux notés par tirage de questions. L'étudiant choisit une catégorie de difficulté, l'application tire une question au hasard dans cette catégorie, l'examinateur note la réponse avec les valeurs du barème, et le score cumulé est communiqué après chaque question. L'étudiant arbitre ainsi lui-même entre prudence et prise de risque.

L'application tourne entièrement dans le navigateur, sans backend : aucune donnée ne quitte la machine de l'examinateur. Elle est publiée sur GitHub Pages sous licence MIT, fonctionne hors ligne après un premier chargement, et propose un mode présentateur : une fenêtre projetée pour l'étudiant, une fenêtre de pilotage pour l'examinateur.

## 2. Contexte d'usage

- Un oral compte un nombre fixe de questions par étudiant (exemple : 3). Chaque catégorie a une valeur maximale (exemple : Facile 1 pt, Normal 2 pts, Difficile 3 pts, Cauchemar 4 pts). La note brute est plafonnée à un score cible (exemple : 10), puis convertie sur une échelle finale (exemple : /20).
- Plusieurs examinateurs peuvent faire passer les oraux en parallèle, chacun sur sa machine, avec sa propre liste d'étudiants et le même fichier de configuration. La consolidation se fait hors de l'outil, à partir des exports Excel.
- L'examinateur partage un écran avec l'étudiant. La vue projetée ne doit jamais afficher les éléments de réponse, les notes des autres étudiants ni les outils d'ajustement.

## 3. Principes directeurs

1. **Aucun backend.** Toutes les données vivent dans IndexedDB, dans le navigateur de l'examinateur.
2. **Config figée.** À la création d'une session, une copie complète de la configuration est stockée dans la session. Modifier le fichier source ensuite n'a aucun effet sur les sessions existantes.
3. **Persistance immédiate.** Chaque action (tirage, note, skip, ajustement) est écrite en base au moment où elle a lieu. En particulier, recharger la page ne permet pas de retirer une question déjà tirée.
4. **Séparation stricte des vues.** La vue projetée est en lecture seule et n'affiche que l'étudiant explicitement projeté par l'examinateur.
5. **Logique de notation isolée.** Plafond, conversion, arrondi et ajustement sont des fonctions pures, couvertes par des tests unitaires.

## 4. Glossaire

| Terme | Définition |
|---|---|
| Session | Un ensemble d'oraux : un nom, une config figée, une liste d'étudiants et leurs passages. |
| Config | Le fichier JSON qui décrit l'épreuve : catégories, questions, barèmes, règles de notation, thème, options. |
| Catégorie | Un groupe de questions de même difficulté, avec une valeur maximale et un barème. |
| Barème | La liste des valeurs attribuables pour une question d'une catégorie (exemple : `[0, 0.5, 1, 1.5, 2]`). |
| Passage | La séquence de questions d'un étudiant. |
| Tirage | La sélection aléatoire d'une question dans une catégorie, parmi celles encore disponibles pour cet étudiant. |
| Skip | L'abandon d'une question tirée, avec un motif facultatif. La question est exclue pour cet étudiant et ne compte pas dans le nombre de questions. |
| Note brute | La somme des points obtenus aux questions. |
| Note plafonnée | `min(note brute, maxRawScore)`. |
| Note convertie | La note plafonnée ramenée sur l'échelle finale. |
| Ajustement | Un bonus ou malus libre appliqué par l'examinateur sur la note convertie, avec une justification facultative. |
| Note finale | La note convertie arrondie plus l'ajustement, bornée entre 0 et l'échelle finale. |
| Étudiant projeté | L'étudiant que l'examinateur a explicitement poussé vers la vue projetée. |

## 5. Règles de notation

Pour un étudiant ayant terminé son passage :

1. `brute = somme des points des questions notées`
2. `plafonnée = min(brute, scoring.maxRawScore)`
3. `convertie = clamp(arrondi(plafonnée × scoring.finalScale / scoring.maxRawScore), 0, scoring.finalScale)`, arrondi selon `scoring.rounding`
4. `finale = clamp(arrondi(convertie + ajustement), 0, scoring.finalScale)`

La note convertie est arrondie **avant** l'ajustement : l'examinateur voit toujours un calcul juste (« 13,5 + 1 = 14,5 »). L'ajustement se saisit par multiples du pas d'arrondi, donc `convertie + ajustement` tombe déjà sur le pas et l'arrondi de l'étape 4 est sans effet dans le cas normal. On **arrondit puis on borne** : les bornes 0 et `finalScale` sont toujours atteignables et jamais dépassées, même quand `finalScale` n'est pas un multiple du pas (pas de 0,3 sur /20 : un étudiant au plafond a 20, pas 20,1).

Arrondi : le pas vaut `rounding.step` s'il est défini (exemple : `0.5` pour arrondir au demi-point), sinon `10^-rounding.decimals`. Le mode s'applique à ce pas : `nearest` arrondit à la valeur la plus proche, une égalité allant vers le haut (pas de 0,5 : 13,25 → 13,5) ; `up` arrondit au pas supérieur, `down` au pas inférieur.

Précision et représentation numérique :

- Toute valeur saisie ou configurée qui entre dans un calcul de note (valeurs de barème, `maxRawScore`, `finalScale`, `rounding.step`, `absent.value`, ajustement) a **au plus 3 décimales**. La config est rejetée sinon ; la saisie de l'ajustement est limitée à 3 décimales et, en valeur absolue, à `finalScale`. Les valeurs configurées sont bornées à 10 000 en valeur absolue.
- Les notes sont manipulées en **millièmes entiers**. La conversion d'échelle ne produit pas forcément un nombre entier de millièmes (exemple : /20 avec un plafond à 7) : elle est conservée sous forme de **fraction exacte** (numérateur et dénominateur entiers) jusqu'à son arrondi au pas demandé (étape 3). Aucun calcul intermédiaire en virgule flottante.
- La conversion en nombre décimal n'a lieu qu'à l'affichage et à l'export.

Des tests unitaires couvrent les cas limites : plafond atteint, ajustement qui ferait dépasser l'échelle, ajustement négatif sous zéro, barèmes décimaux, chaque mode d'arrondi.

Pendant le passage, le score cumulé affiché est la note brute. L'affichage de la note finale (brute, convertie ou les deux) est réglé par `presentation.finalScoreDisplay`.

## 6. Fichiers d'entrée

### 6.1 Liste d'étudiants (CSV)

- Deux colonnes : nom et prénom.
- En-tête reconnu sans tenir compte de la casse, des accents, des espaces ni des tirets. Nom : `nom`, `nom de famille`, `last name`, `lastname`, `surname`, `family name`. Prénom : `prenom`, `first name`, `firstname`, `given name`. L'en-tête est la première des cinq premières lignes non vides qui contient les deux colonnes ; l'ordre des colonnes est alors libre, et les lignes qui la précèdent (titre d'un export) sont ignorées avec un avertissement. Sans en-tête, toutes les lignes sont des données, dans l'ordre nom puis prénom.
- Séparateur `,` ou `;` détecté automatiquement (les exports Excel en français utilisent souvent `;`).
- UTF-8, avec ou sans BOM. Un fichier qui n'est pas de l'UTF-8 valide (export « CSV » d'Excel en français) est relu en Windows-1252, avec un avertissement invitant à vérifier les accents.
- L'ordre des lignes détermine l'ordre de passage.
- Lignes vides ignorées. Espaces de début et de fin supprimés, casse conservée.
- Aucune ligne isolée ne bloque, tout est visible dans l'aperçu : ligne avec un seul champ rempli ignorée avec un avertissement et son numéro de ligne ; colonnes en trop ignorées avec un avertissement unique ; doublons (nom et prénom identiques après normalisation) signalés par un avertissement.
- **Erreur** bloquante si aucun étudiant valide.

### 6.2 Configuration (JSON)

Le schéma est défini avec Zod. Un JSON Schema en est généré au build et publié sur GitHub Pages, pour que le champ `$schema` du fichier donne l'autocomplétion et la validation dans l'éditeur. Un fichier d'exemple complet est versionné dans le dépôt et téléchargeable depuis l'écran de création de session.

Exemple :

```json
{
  "$schema": "https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json",
  "schemaVersion": 1,
  "locale": "fr",
  "exam": {
    "title": "Oral PHP",
    "subject": "PHP",
    "cohort": "B2 2026"
  },
  "scoring": {
    "questionsPerStudent": 3,
    "maxRawScore": 10,
    "finalScale": 20,
    "rounding": { "mode": "nearest", "decimals": 2, "step": null }
  },
  "absent": {
    "export": "label",
    "label": "ABS",
    "value": 0
  },
  "skips": {
    "enabled": true,
    "maxPerStudent": 2,
    "reasons": ["Question déjà vue", "Hors programme", "Énoncé ambigu"],
    "allowFreeText": true
  },
  "presentation": {
    "showCumulativeScore": true,
    "finalScoreDisplay": "both",
    "showStatsOnFinal": false,
    "drawAnimation": true,
    "defaultColorMode": "dark"
  },
  "theme": {
    "light": {
      "background": "oklch(0.980 0.013 310.5)",
      "foreground": "oklch(0.234 0.095 287.8)",
      "card": "oklch(1 0 0)",
      "card-foreground": "oklch(0.234 0.095 287.8)",
      "popover": "oklch(1 0 0)",
      "popover-foreground": "oklch(0.234 0.095 287.8)",
      "primary": "oklch(0.518 0.226 323.9)",
      "primary-foreground": "oklch(1 0 0)",
      "secondary": "oklch(0.934 0.037 300.8)",
      "secondary-foreground": "oklch(0.234 0.095 287.8)",
      "muted": "oklch(0.948 0.025 303.5)",
      "muted-foreground": "oklch(0.456 0.103 294.2)",
      "accent": "oklch(0.956 0.044 203.4)",
      "accent-foreground": "oklch(0.450 0.077 224.3)",
      "destructive": "oklch(0.577 0.215 27.3)",
      "border": "oklch(0.869 0.060 303.6)",
      "input": "oklch(0.869 0.060 303.6)",
      "ring": "oklch(0.518 0.226 323.9)",
      "chart-1": "oklch(0.518 0.226 323.9)",
      "chart-2": "oklch(0.609 0.111 221.7)",
      "chart-3": "oklch(0.646 0.194 41.1)",
      "chart-4": "oklch(0.541 0.247 293.0)",
      "chart-5": "oklch(0.592 0.218 0.6)",
      "sidebar": "oklch(0.959 0.024 304.5)",
      "sidebar-foreground": "oklch(0.234 0.095 287.8)",
      "sidebar-primary": "oklch(0.518 0.226 323.9)",
      "sidebar-primary-foreground": "oklch(1 0 0)",
      "sidebar-accent": "oklch(0.934 0.037 300.8)",
      "sidebar-accent-foreground": "oklch(0.234 0.095 287.8)",
      "sidebar-border": "oklch(0.869 0.060 303.6)",
      "sidebar-ring": "oklch(0.518 0.226 323.9)",
      "radius": "0.75rem"
    },
    "dark": {
      "background": "oklch(0.192 0.075 287.5)",
      "foreground": "oklch(0.950 0.032 309.9)",
      "card": "oklch(0.237 0.094 288.4)",
      "card-foreground": "oklch(0.950 0.032 309.9)",
      "popover": "oklch(0.237 0.094 288.4)",
      "popover-foreground": "oklch(0.950 0.032 309.9)",
      "primary": "oklch(0.687 0.252 323.9)",
      "primary-foreground": "oklch(0.192 0.075 287.5)",
      "secondary": "oklch(0.300 0.128 286.5)",
      "secondary-foreground": "oklch(0.950 0.032 309.9)",
      "muted": "oklch(0.269 0.113 287.1)",
      "muted-foreground": "oklch(0.758 0.100 298.0)",
      "accent": "oklch(0.797 0.134 211.5)",
      "accent-foreground": "oklch(0.192 0.075 287.5)",
      "destructive": "oklch(0.679 0.213 14.7)",
      "border": "oklch(0.399 0.169 290.7)",
      "input": "oklch(0.399 0.169 290.7)",
      "ring": "oklch(0.687 0.252 323.9)",
      "chart-1": "oklch(0.687 0.252 323.9)",
      "chart-2": "oklch(0.797 0.134 211.5)",
      "chart-3": "oklch(0.758 0.159 55.9)",
      "chart-4": "oklch(0.606 0.219 292.7)",
      "chart-5": "oklch(0.725 0.175 349.8)",
      "sidebar": "oklch(0.237 0.094 288.4)",
      "sidebar-foreground": "oklch(0.950 0.032 309.9)",
      "sidebar-primary": "oklch(0.687 0.252 323.9)",
      "sidebar-primary-foreground": "oklch(0.192 0.075 287.5)",
      "sidebar-accent": "oklch(0.300 0.128 286.5)",
      "sidebar-accent-foreground": "oklch(0.950 0.032 309.9)",
      "sidebar-border": "oklch(0.399 0.169 290.7)",
      "sidebar-ring": "oklch(0.687 0.252 323.9)",
      "radius": "0.75rem"
    }
  },
  "categories": [
    {
      "id": "facile",
      "label": "Facile",
      "scale": [0, 0.5, 1],
      "color": "oklch(0.797 0.134 211.5)",
      "icon": "leaf",
      "order": 1,
      "questions": [
        {
          "id": "facile-001",
          "title": "== vs ===",
          "tags": ["bases"],
          "prompt": "Quelle différence entre `==` et `===` en PHP ?\n\n```php\nvar_dump(0 == \"a\");\n```",
          "answer": "- `==` compare après conversion de type\n- `===` compare valeur **et** type\n- Depuis PHP 8, `0 == \"a\"` vaut `false`"
        }
      ]
    }
  ]
}
```

Champs :

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `schemaVersion` | entier | oui | Version du format de config. Sert à la compatibilité des sessions et des backups. |
| `locale` | `"fr"` \| `"en"` | non | Langue de l'interface. Défaut : langue du navigateur si supportée, sinon `fr`. |
| `exam.title` | string | oui | Titre affiché sur la vue projetée et en tête des exports. |
| `exam.subject`, `exam.cohort` | string | non | Métadonnées reprises dans les exports. |
| `scoring.questionsPerStudent` | entier > 0 | oui | Nombre de questions notées par passage. |
| `scoring.maxRawScore` | nombre > 0 | oui | Plafond de la note brute. |
| `scoring.finalScale` | nombre > 0 | oui | Échelle de la note finale. |
| `scoring.rounding.mode` | `"nearest"` \| `"up"` \| `"down"` | non | Défaut : `nearest`. |
| `scoring.rounding.decimals` | entier 0–3 | non | Défaut : 2. |
| `scoring.rounding.step` | nombre > 0 \| null | non | Pas d'arrondi. S'il est défini, il prime sur `decimals`. |
| `absent.export` | `"label"` \| `"zero"` \| `"value"` | non | Ce que l'export met en note pour un absent. Défaut : `label`. |
| `absent.label` | string | non | Défaut : `ABS`. |
| `absent.value` | nombre | si `export = "value"` | Note attribuée aux absents. |
| `skips.enabled` | booléen | non | Défaut : `true`. |
| `skips.maxPerStudent` | entier ≥ 0 | non | Défaut : 1. |
| `skips.reasons` | string[] | non | Motifs proposés dans la boîte de skip. |
| `skips.allowFreeText` | booléen | non | Autorise un motif libre. Défaut : `true`. |
| `presentation.showCumulativeScore` | booléen | non | Affiche le score cumulé sur la vue projetée après chaque question. Défaut : `true`. |
| `presentation.finalScoreDisplay` | `"raw"` \| `"converted"` \| `"both"` | non | Défaut : `both`. |
| `presentation.showStatsOnFinal` | booléen | non | Affiche le détail du passage sur l'écran final projeté. Défaut : `false`. |
| `presentation.drawAnimation` | booléen | non | Animation lors du tirage. Défaut : `true`. |
| `presentation.defaultColorMode` | `"light"` \| `"dark"` \| `"system"` | non | Défaut : `system`. |
| `theme.light`, `theme.dark` | objet token → valeur CSS | non | Surcharge des variables CSS de shadcn/ui. Seuls les noms de tokens d'une liste blanche sont acceptés, alignée sur la version de shadcn/ui utilisée (couleurs de base, `chart-*`, `sidebar-*`, `radius`). Un token absent garde la valeur par défaut de shadcn. Les valeurs sont validées par le navigateur (`CSS.supports('color', …)`, `border-radius` pour `radius`) à la création de session. |
| `categories[].id` | string | oui | Identifiant stable. |
| `categories[].label` | string | oui | Libellé affiché. |
| `categories[].scale` | nombre[] | oui | Valeurs attribuables, décimales autorisées. Sa valeur maximale est la valeur de la catégorie (« points max »), affichée sur la tuile et utilisée dans les exports et les stats. |
| `categories[].color` | couleur CSS | non | Couleur de la tuile. Validée par le navigateur (`CSS.supports`) à la création de session. |
| `categories[].icon` | string | non | Nom d'icône Tabler (kebab-case, ex. `leaf`, `brand-php` ; liste `iconsList` de `@tabler/icons-react`, 6 220 noms). Nom inconnu : pas d'icône, avec un avertissement. Le JSON Schema propose les noms connus en autocomplétion sans refuser les autres. |
| `categories[].order` | entier | non | Ordre d'affichage. Défaut : ordre du tableau. |
| `categories[].questions[].id` | string | oui | Identifiant stable, unique dans toute la config. |
| `categories[].questions[].title` | string | non | Libellé court, utilisé dans le side panel et les exports. Défaut : début du `prompt` sans markdown. |
| `categories[].questions[].tags` | string[] | non | Notions pédagogiques, utilisées dans les stats. |
| `categories[].questions[].prompt` | markdown | oui | Énoncé affiché aux deux vues. |
| `categories[].questions[].answer` | markdown | non | Éléments de réponse, visibles uniquement dans la vue examinateur. |

Règles de validation, en plus des types :

- **Erreur** si un `id` de catégorie est dupliqué.
- **Erreur** si un `id` de question est dupliqué dans l'ensemble de la config.
- **Erreur** si un barème est vide, contient une valeur négative ou des doublons, ou si sa valeur maximale est 0.
- **Erreur** si une catégorie n'a aucune question.
- **Erreur** si le nombre total de questions de la config est inférieur à `questionsPerStudent + (skips.enabled ? skips.maxPerStudent : 0)`. Ce seuil garantit qu'un étudiant peut toujours terminer son passage, quitte à changer de catégorie. Une catégorie peut en revanche compter moins de questions que ce seuil : elle sera grisée pour un étudiant qui l'a épuisée (F09).
- **Erreur** si `absent.export = "value"` sans `absent.value`.
- **Erreur** si une valeur numérique de notation (barème, `maxRawScore`, `finalScale`, `rounding.step`, `absent.value`) a plus de 3 décimales (§5).
- **Erreur** si une valeur numérique de notation (mêmes champs) dépasse 10 000 en valeur absolue (D44).
- **Erreur** si un token de thème ne fait pas partie de la liste blanche.
- **Erreur** sur toute clé inconnue, à tout niveau (schéma strict ; seule `$schema` est admise en plus des champs du tableau) : une faute de frappe dans un nom de champ ne doit jamais retomber silencieusement sur la valeur par défaut.
- **Erreur** si `schemaVersion` est supérieure à celle que connaît l'application, avec un message invitant à recharger la page pour mettre l'application à jour.
- **Avertissement** si `questionsPerStudent × (plus grande valeur de barème, toutes catégories confondues)` est inférieur à `maxRawScore` (note maximale inatteignable).
- **Avertissement** si `finalScale` n'est pas un multiple du pas d'arrondi (la note maximale sera hors grille, §5).

Les erreurs sont listées avec leur chemin JSON (`categories[2].questions[5].id`) et un message lisible dans la langue de l'interface. Une config avec des erreurs bloque la création de session ; des avertissements seuls ne la bloquent pas.

## 7. Modèle de données (indicatif)

```ts
Session {
  id, name, createdAt, updatedAt,
  examiner?,               // nom de l'examinateur, facultatif
  appVersion,              // version de l'app à la création
  config,                  // snapshot figé et validé
  students: Student[],
  activeStudentId?,        // étudiant ouvert dans la vue examinateur
  projection: { mode: 'waiting' | 'student', studentId? }
}

Student {
  id, lastName, firstName, order,
  addedDuringSession: boolean,
  absent: boolean,
  attempts: Attempt[],     // questions tirées, dans l'ordre
  adjustment?: { value: number, reason?: string },
  comment?: string,
  finalRevealedAt?         // note finale affichée sur la vue projetée (F14)
}

Attempt {
  id, categoryId, questionId, drawnAt,
  outcome: 'pending' | 'scored' | 'skipped',
  score?: number,          // si scored, valeur du barème
  skipReason?: string,     // si skipped
  editedAt?                // dernière modification de la note
}
```

Le statut affiché d'un étudiant est dérivé : **absent** si `absent`, sinon **terminé** si le nombre d'attempts `scored` atteint `questionsPerStudent`, sinon **en cours** si au moins un attempt existe, sinon **à passer**.

## 8. Features

Chaque feature est pensée pour donner un ou plusieurs tickets. L'ordre proposé suit les dépendances.

### F01 — Socle projet et déploiement

**Objectif.** Un dépôt prêt à développer et à déployer.

**Contenu.**
- Vite + React + TypeScript strict, TanStack Router en mode SPA avec historique par hash (GitHub Pages n'offre pas de fallback SPA).
- Tailwind + shadcn/ui, thème par défaut de shadcn.
- oxlint avec lint type-aware (oxlint-tsgolint), Prettier avec prettier-plugin-tailwindcss, Vitest.
- Node 24 LTS épinglé par `.nvmrc` (nvm en local, `node-version-file` en CI), pnpm épinglé par `packageManager`.
- GitHub Action : lint, tests, build, déploiement sur GitHub Pages à chaque push sur `main`. `base` Vite réglé sur le nom du repo.
- Licence MIT, README (usage, format des fichiers, lien vers le schéma et l'exemple).

**Critères d'acceptation.**
- L'application vide est accessible sur l'URL GitHub Pages et les routes fonctionnent après rechargement.
- La CI échoue si lint ou tests échouent.

### F02 — Schéma de configuration et validation

**Objectif.** Charger, valider et expliquer une config.

**Contenu.**
- Schéma Zod complet (§6.2) avec les règles croisées. Le schéma est portable (navigateur, Vitest sous Node, génération du JSON Schema) : il ne valide que la forme des valeurs CSS (chaîne non vide, sans `;`, `{`, `}`, `<`). La validation réelle des valeurs CSS est une fonction `cssSupports` injectée par l'appelant (F06), remplacée par un faux dans les tests.
- La config validée est **normalisée** : défauts appliqués, `title` des questions dérivé du `prompt`. C'est cette forme qui est figée dans la session.
- Génération du JSON Schema par un plugin Vite local (`runnerImport` du module de schéma, `z.toJSONSchema()`), publié à une URL stable à la racine du site : `config.schema.json`. Le même plugin publie `config.example.json`. Les règles croisées ne sont pas exprimables en JSON Schema : l'éditeur ne valide que la structure, l'application valide tout.
- Fichier `examples/config.example.json` versionné : un oral PHP réaliste, 4 catégories de tailles inégales (dont une catégorie à 2 questions, pour rendre visible le grisage de F09), blocs de code `php`, éléments de réponse et tags. Il est téléchargeable depuis l'application.
- Le fichier d'exemple embarque le thème « Synthwave » ci-dessus, décliné de la bannière du projet, avec `defaultColorMode: "dark"`. Couleurs des catégories : Facile cyan `oklch(0.797 0.134 211.5)`, Normal violet `oklch(0.709 0.159 293.5)`, Difficile magenta `oklch(0.687 0.252 323.9)`, Cauchemar orange `oklch(0.758 0.159 55.9)`. Le thème par défaut de l'application reste celui de shadcn : ce thème ne s'applique qu'aux sessions créées avec cette config.
- Le validateur ne produit aucun texte : il renvoie des issues `{ severity, path, code, params }`. Les issues Zod natives sont converties en codes propres, un JSON mal formé donne le code `json_syntax` (avec ligne et colonne si disponibles). `formatPath` produit `categories[2].questions[5].id`.
- Messages fr/en par code, via un **noyau i18n minimal** posé ici (type `Locale`, dictionnaires typés, `t()`), étendu par F07.

**Critères d'acceptation.**
- Le fichier d'exemple passe la validation.
- Chaque règle du §6.2 a un test qui la déclenche.
- Le JSON Schema publié valide le fichier d'exemple dans VSCode, et un test le vérifie avec ajv.
- La liste blanche des tokens de thème correspond exactement aux variables CSS de shadcn présentes dans `src/index.css` (test).

### F03 — Moteur de notation

**Objectif.** Calculer toutes les notes à partir d'un étudiant et d'une config.

**Contenu.** Fonctions pures : note brute, plafonnée, convertie, finale, arrondi selon mode et pas, bornage de l'ajustement, valeur exportée pour un absent. Aussi : statut dérivé de l'étudiant (§7), validité d'un ajustement (multiple du pas), formatage localisé d'une note. Les notes convertie et finale valent `null` tant que le passage n'est pas terminé : le moteur n'expose jamais de note finale partielle. F03 pose les types de domaine du §7 (`Session`, `Student`, `Attempt`), persistés ensuite par F04.

**Critères d'acceptation.** Tests unitaires couvrant les cas du §5 et l'absence de dérive en virgule flottante sur les barèmes décimaux.

### F04 — Persistance

**Objectif.** Stocker les sessions de façon durable dans le navigateur.

**Contenu.**
- Base IndexedDB via Dexie, schéma versionné. Une seule table `sessions` : un document par session, étudiants et attempts imbriqués (§7). C'est aussi le format du backup (F05).
- Toute mutation passe par `updateSession(id, mutator)`, qui lit et réécrit dans **une seule transaction `rw`** : aucune écriture perdue, même avec deux onglets examinateur. Les mutations métier (tirer, noter, skipper…) sont écrites par leurs features.
- Demande de stockage persistant (`navigator.storage.persist()`) à la première création de session, avec un indicateur discret si le navigateur refuse.
- Hooks de lecture réactifs (`useLiveQuery`) : `useSessions()`, `useSession(id)`. Hook `usePersistenceStatus()` pour l'indicateur, affiché par F05.
- En dev uniquement, la base est exposée sur `window.__questionatorDb` pour vérifier à la main la réactivité entre fenêtres. Tests automatiques sous Vitest avec `fake-indexeddb` ; le test automatisé entre deux vraies fenêtres est fait en F14 (Playwright).

**Critères d'acceptation.**
- Une session créée survit à la fermeture et à la réouverture du navigateur.
- Une écriture dans un onglet est visible dans un autre onglet de la même origine, **y compris une fenêtre ouverte par `window.open`**. C'est le test de réactivité entre fenêtres dont dépend F14 : il est fait ici, avec `liveQuery` seul. S'il échoue, F14 ajoute une notification par BroadcastChannel.

### F05 — Accueil et gestion des sessions

**Objectif.** Point d'entrée de l'application.

**Contenu.**
- Liste des sessions avec nom, titre de l'épreuve, date de dernière modification et avancement (passés, absents, restants).
- Actions : reprendre, créer, renommer, modifier l'examinateur, supprimer (avec confirmation), exporter un backup, importer un backup.
- Backup : un fichier JSON `{ format: "questionator-backup", formatVersion, appVersion, exportedAt, session }`, nommé `<slug-session>-backup-<AAAA-MM-JJ>.json`. `appVersion` vient de `package.json` (injecté au build). À l'import, validation de l'enveloppe, de la session (schéma Zod de `Session`) **et de sa config figée par le validateur de F02**. Une dernière passe vérifie la cohérence entre session et config (références, scores dans le barème, un seul passage en attente par étudiant, identifiants uniques). `formatVersion` ou `schemaVersion` plus récents : erreur invitant à mettre l'application à jour. Si une session avec le même `id` existe, l'utilisateur choisit entre remplacer et annuler.
- État vide : bouton « Créer une session » et lien vers la config d'exemple.
- Indicateur discret dans l'en-tête, seulement si le navigateur a refusé le stockage persistant (F04), avec une infobulle qui recommande les backups.
- La confirmation de suppression propose « Exporter un backup d'abord ».

**Critères d'acceptation.**
- Un backup exporté puis importé dans un autre navigateur restitue une session identique, passages et ajustements compris.
- Un backup corrompu ou d'un format inconnu affiche une erreur explicite et ne modifie rien.

### F06 — Création de session

**Objectif.** Initialiser une session à partir d'un nom, d'un CSV et d'une config.

**Contenu.**
- Formulaire : nom de session, nom de l'examinateur (facultatif, modifiable ensuite depuis l'accueil), fichier CSV, fichier JSON. Glisser-déposer accepté.
- Aperçu : nombre d'étudiants, doublons éventuels, résumé de la config (catégories, nombre de questions, barèmes, règles de notation), erreurs et avertissements de F02. La validation passe ici la fonction `cssSupports` du navigateur (`CSS.supports`).
- Écran sur la route `#/new`. Liens de téléchargement du fichier de config d'exemple et d'une liste d'étudiants d'exemple (`students.example.csv`).
- Nom de session prérempli dès le chargement de la config : `<exam.title> — <date du jour>`, modifiable.
- À la validation : snapshot de la config dans la session, création des étudiants dans l'ordre du CSV, ouverture de l'écran de passage sur le premier étudiant.

**Critères d'acceptation.**
- Un CSV séparé par `;` avec BOM et en-tête `Nom;Prénom` est importé correctement.
- Une config invalide bloque la création et affiche toutes les erreurs.
- Modifier ensuite le fichier de config n'a aucun effet sur la session.

### F07 — Thème et langue

**Objectif.** Appliquer l'identité visuelle et la langue définies par la config.

**Contenu.**
- Application des surcharges de tokens `theme.light` et `theme.dark` sur les variables CSS de shadcn, sur les deux vues, **uniquement via `style.setProperty`**, jamais en construisant une feuille de style en texte. Le thème de la config ne s'applique qu'aux routes de session (passage, stats, vue projetée) ; l'accueil et la création gardent le thème shadcn par défaut. Un composant `<SessionTheme>` applique les tokens du mode courant, les réapplique au changement de mode et les retire au démontage.
- Mode clair, sombre ou système selon `presentation.defaultColorMode`, modifiable à la main dans chaque fenêtre. Le choix manuel est mémorisé par session et par vue (examinateur, projetée) dans `localStorage`.
- Couleur et icône par catégorie. La couleur sert d'accent (bordure, icône, halo, pastille de valeur max), jamais de fond sous le texte : le texte garde le `foreground` du thème, lisible quelles que soient les couleurs de la config. Les icônes Tabler sont servies par un chunk unique chargé à la demande sur les vues de session (`import * as icons from '@tabler/icons-react'`, ~489 Kio gzippés mesurés), pré-caché par F17 (D37).
- Interface en français et en anglais via un dictionnaire typé léger, en étendant le noyau i18n posé par F02. Langue : `config.locale` dans une session, sinon celle du navigateur ; pas de sélecteur manuel. L'accueil, sans config chargée, suit la langue du navigateur.

**Critères d'acceptation.**
- Une surcharge de `primary` change les boutons principaux sur les deux vues.
- Toutes les chaînes de l'interface existent dans les deux langues (vérifié par un test de typage ou un test unitaire).

### F08 — Rendu markdown

**Objectif.** Afficher énoncés et éléments de réponse.

**Contenu.**
- react-markdown + remark-gfm. Pas de HTML brut interprété (pas de `rehype-raw`). Liens ouverts dans un nouvel onglet (`rel="noopener noreferrer"`). Images autorisées ; une image distante ne s'affiche pas hors ligne (précisé dans le README).
- Coloration syntaxique avec Shiki, chargée à la demande et embarquée dans le build pour fonctionner hors ligne. Langages : PHP, SQL, HTML, JS, JSON et bash en V1 (D27), étendus à tout le catalogue Shiki par F18 (D63). `shiki/core` avec le moteur d'expressions régulières JavaScript (pas de WASM), langages importés explicitement, thèmes `github-light` / `github-dark` rendus en double via variables CSS (pas de re-rendu au changement de mode). Langage inconnu : texte brut.
- Taille de texte adaptée à la projection dans la vue projetée.

**Critères d'acceptation.**
- Un bloc ```` ```php ```` est coloré dans les deux vues, y compris hors ligne.
- Une balise `<script>` dans le markdown est affichée comme du texte, sans être exécutée.

### F09 — Écran de passage (vue examinateur)

**Objectif.** Dérouler le passage d'un étudiant.

**Contenu.**
- Route `#/session/$sessionId` ; l'étudiant affiché est `session.activeStudentId`, lu en base (pas de paramètre d'URL).
- En-tête : nom de l'étudiant, numéro de question (`2 / 3`), score cumulé brut.
- Grille des catégories triées par `order`, avec libellé, valeur max, couleur et icône.
- Une catégorie est grisée, avec une infobulle, si elle n'a plus de question disponible pour cet étudiant (toutes tirées, notées ou skippées).
- Au clic sur une catégorie : tirage uniforme parmi les questions disponibles pour cet étudiant, via `crypto.getRandomValues` avec rejet des valeurs hors plage (pas de biais de modulo), source d'aléa injectable pour les tests. L'attempt `pending` est persisté immédiatement.
- Tant qu'une question est `pending`, la grille est désactivée : il faut noter ou skipper.
- Les mutations (tirer, noter) revérifient leurs invariants **dans la transaction** de `updateSession` : pas de tirage si un attempt est `pending`, si le passage est terminé, si l'étudiant est absent ou si la catégorie est épuisée. Un double-clic ou deux onglets ne créent jamais deux tirages.
- Étudiant absent : état dédié avec renvoi vers F12 pour annuler l'absence.
- Affichage de la question : énoncé markdown, puis éléments de réponse dans un bloc repliable réservé à l'examinateur, **replié par défaut à chaque nouvelle question**. Pas d'animation de tirage dans cette vue (réservée à la vue projetée, F14).
- Sous la question : un bouton par valeur du barème de la catégorie. Au clic, l'attempt passe en `scored`, le score cumulé est mis à jour et la grille redevient disponible.
- Après la dernière question notée : passage à l'écran final (F11).

**Critères d'acceptation.**
- Un même étudiant ne peut pas tirer deux fois la même question, y compris une question skippée.
- Deux étudiants différents peuvent tirer la même question.
- Recharger la page pendant qu'une question est `pending` réaffiche la même question.

### F10 — Skip de question

**Objectif.** Abandonner une question tirée sans pénaliser l'étudiant.

**Contenu.**
- Bouton « Passer la question » sur une question `pending`, si `skips.enabled`.
- Boîte de dialogue : motifs prédéfinis de `skips.reasons` en choix unique, champ libre si `skips.allowFreeText` (taper dans le champ désélectionne le motif prédéfini, et inversement). Un seul motif, facultatif.
- L'attempt passe en `skipped`, la question est exclue pour cet étudiant, et l'étudiant rechoisit une catégorie.
- Le bouton affiche le nombre de passes restantes ; il est désactivé, avec une infobulle, une fois `skips.maxPerStudent` atteint.
- La mutation revérifie dans la transaction : attempt `pending`, skips activés, quota non atteint (même principe que F09).
- Un skip n'est pas annulable ; en cas d'erreur, « Réinitialiser l'étudiant » (F11).

**Critères d'acceptation.**
- Un skip ne compte pas dans `questionsPerStudent`.
- Le motif apparaît dans le side panel et dans l'export.

### F11 — Écran final et ajustement

**Objectif.** Clore le passage et fixer la note.

**Contenu.**
- Affichage de toutes les notes (brute, plafonnée, convertie, ajustement, finale) et du détail du passage (questions, catégories, points, skips). `presentation.finalScoreDisplay` ne s'applique qu'à la vue projetée (F14) : l'examinateur voit toujours tout.
- Popup d'ajustement réservée à l'examinateur, ouverte automatiquement **une seule fois**, au moment où la dernière note termine le passage, puis rouvrable par un bouton « Ajuster » : valeur positive ou négative, en points de l'échelle finale, saisie par multiples du pas d'arrondi (§5), et justification facultative. La note finale recalculée est affichée en direct, bornée entre 0 et `finalScale`. Champ numérique avec boutons − / + d'un pas ; une valeur hors pas bloque l'enregistrement. Calcul affiché en direct (« 13,5 + 1 = 14,5 / 20 », mention « bornée à 20 » si le bornage intervient). Un ajustement de 0 supprime l'ajustement et sa justification. La fermeture de la popup ouverte en fin de passage (enregistrer ou annuler) renseigne `finalRevealedAt` si ce n'est pas déjà fait (F14).
- Bouton « Réinitialiser l'étudiant » avec confirmation : supprime tous les attempts, l'ajustement et `finalRevealedAt`, et remet l'étudiant à « à passer ». Le commentaire est conservé : il porte sur l'étudiant, pas sur son passage.
- Bouton « Étudiant suivant » : l'étudiant actif devient le prochain étudiant non terminé et non absent (à passer ou en cours) dans l'ordre de passage, en reprenant au début si besoin. La vue projetée n'est pas modifiée. S'il ne reste personne : bouton désactivé, « Tous les étudiants sont passés ».

**Critères d'acceptation.**
- Un étudiant à 20/20 avec un ajustement de +1 reste à 20.
- La justification de l'ajustement apparaît dans l'export.

### F12 — Side panel, onglet « Étudiant »

**Objectif.** Suivre et corriger l'étudiant actif.

**Contenu.**
- Liste des questions tirées : ordre, catégorie, titre, points obtenus sur points max, ou motif de skip.
- Modification d'une note déjà saisie (sélection parmi les valeurs du barème), avec recalcul immédiat. La date de modification est conservée pour l'export. Uniquement sur un attempt `scored` : ni un skip ni une question en cours ne se modifient ici.
- Panneau repliable à deux onglets (« Étudiant », « Étudiants ») ; état ouvert / fermé et onglet actif mémorisés en `localStorage`.
- Totaux : brute, plafonnée, convertie, ajustement, finale.
- Commentaire libre sur l'étudiant, sauvegardé automatiquement (délai d'environ 500 ms et à la sortie du champ), avec un indicateur « Enregistré ».
- Bascule du statut absent, réversible. Sans attempt, elle est directe. Si le passage est entamé, une confirmation indique le nombre de questions tirées qui seront supprimées ; l'accepter réinitialise l'étudiant (comme F11, commentaire conservé) puis le marque absent. Un étudiant absent n'a donc jamais d'attempt.

**Critères d'acceptation.**
- Modifier une note d'un étudiant terminé met à jour sa note finale partout, vue projetée comprise si elle l'affiche.

### F13 — Side panel, onglet « Étudiants »

**Objectif.** Naviguer dans la session.

**Contenu.**
- Liste dans l'ordre de passage : nom, prénom, statut, note brute, note convertie ou « ABS ».
- Clic sur un étudiant : il devient l'étudiant actif de la vue examinateur. On reprend son passage s'il n'est pas terminé, sinon on affiche son écran final. Cela ne change pas la vue projetée (voir F14).
- L'étudiant actif est surligné, l'étudiant projeté porte une icône d'écran.
- Ajout d'un étudiant en cours de session (nom, prénom), placé en fin de liste et marqué `addedDuringSession`. Doublon : avertissement sans blocage. Deux boutons : « Ajouter » et « Ajouter et faire passer » (il devient aussi l'étudiant actif).
- Pas de suppression d'étudiant (l'absence couvre le cas).
- Bouton d'export Excel (F16).
- Bouton « Statistiques », qui ouvre l'écran de F15.

**Critères d'acceptation.**
- Basculer d'un étudiant à un autre puis revenir restitue exactement l'état du premier.

### F14 — Mode présentateur

**Objectif.** Une vue projetée pour l'étudiant, pilotée depuis la vue examinateur.

**Contenu.**
- Bouton « Ouvrir la vue projetée » : `window.open(url, 'questionator-present')` sur la route `#/present/:sessionId` ; un second clic remet la fenêtre existante au premier plan.
- **Étanchéité** : la vue projetée ne rend jamais l'objet `Session`. Une fonction pure `toProjectedView(session)` produit un type `ProjectedView` limité à l'affichable (titre, catégories, énoncé de la question en cours, scores autorisés par la config) ; les composants de la route `present` ne reçoivent que ce type.
- La vue projetée est en lecture seule. Ses seules commandes sont le plein écran (l'API Fullscreen exige un geste utilisateur dans cette fenêtre) et la bascule de mode (F07) ; curseur et commandes masqués après quelques secondes d'inactivité.
- Elle n'affiche que l'étudiant projeté (`projection`), jamais l'étudiant actif par défaut.
- Dans la vue examinateur, un bouton « Projeter cet étudiant » pousse l'étudiant actif, et un bouton « Écran d'attente » repasse en attente. Si l'étudiant actif n'est pas celui qui est projeté, un bandeau le signale.
- Écran d'attente : titre de l'épreuve et message d'attente.
- Écran étudiant : grille des catégories, question tirée (énoncé seul), score cumulé si `showCumulativeScore`, note finale selon `finalScoreDisplay`, détail du passage si `showStatsOnFinal`. `converted` désigne ici la **note finale, ajustement compris** (« Note : 14,5 / 20 ») ; le montant et la justification de l'ajustement ne sont jamais affichés.
- La note finale n'apparaît qu'une fois `finalRevealedAt` renseigné, c'est-à-dire à la fermeture de la popup d'ajustement de F11 (enregistrer ou annuler). Avant : « Passage terminé » et, si `showCumulativeScore`, le score cumulé brut. Une modification ultérieure met à jour la note affichée sans la masquer.
- Animation de tirage si `drawAnimation` : **neutre**, sans jamais afficher d'autre question que celle tirée (cartes retournées aux couleurs de la catégorie qui se mélangent ~1,5 s, puis l'une se retourne sur l'énoncé). Fondu simple si `prefers-reduced-motion`.
- Synchronisation : la vue projetée lit IndexedDB via `liveQuery`. La réactivité entre fenêtres est vérifiée par F04 ; le repli sur BroadcastChannel n'est ajouté que si ce critère a échoué.
- La vue projetée se reconstruit entièrement depuis la base si elle est fermée puis rouverte.

**Critères d'acceptation.**
- Aucun élément de réponse, note d'un autre étudiant, commentaire ni ajustement n'apparaît dans la vue projetée.
- Un tirage ou une note dans la vue examinateur apparaît dans la vue projetée sans action supplémentaire.
- Test Playwright à deux fenêtres couvrant ces deux critères (D23).

### F15 — Statistiques de session

**Objectif.** Vue d'ensemble de la session.

**Contenu.** Écran dédié, route `#/session/:sessionId/stats`, ouvert depuis l'onglet « Étudiants » du side panel (F13), avec retour à l'écran de passage. Le contenu est repris dans l'export :
- Effectifs : passés, en cours, à passer, absents, ajoutés en cours de session.
- Notes finales : moyenne, médiane, minimum, maximum, écart-type, histogramme.
- Catégories : nombre de choix, taux de réussite (points obtenus / points max).
- Tags : taux de réussite par notion.
- Questions : les plus tirées, les plus skippées avec leurs motifs.
- Stratégies : combinaisons de catégories choisies et note moyenne associée.
- Ajustements : nombre, somme, moyenne.

Définitions (fonction pure `computeStats(session)`, reprise par l'export F16) :
- Notes finales, histogramme et stratégies : étudiants **terminés** uniquement. Écart-type de population (division par n). Médiane d'un effectif pair : moyenne des deux valeurs centrales.
- Histogramme : intervalles de 1 point si `finalScale` ≤ 20, sinon `finalScale / 20` (20 barres au plus) ; intervalles `[a, a + largeur[`, le dernier inclut `finalScale`.
- Catégories : nombre de choix = attempts de la catégorie (notés et passés) ; taux de réussite = Σ points ÷ Σ points max sur les attempts notés. Tags : même taux, par tag ; une question à plusieurs tags compte dans chacun.
- Questions : les 10 plus tirées (tous résultats) ; les plus passées, avec le décompte des motifs.
- Stratégies : combinaison des catégories des questions notées, sans ordre, triée par `order` ; effectif et note finale moyenne par combinaison.
- Ajustements : sur les étudiants ajustés ; somme algébrique.
- Aucun étudiant terminé : indicateurs de notes affichés « — ».
- Histogramme via le composant chart de shadcn (Recharts), chargé uniquement sur la route des stats. Le bouton « Statistiques » de l'onglet « Étudiants » est ajouté par ce ticket.

**Critères d'acceptation.** Les absents sont exclus des statistiques de notes.

### F16 — Export Excel

**Objectif.** Tout sortir dans un classeur exploitable pour la consolidation.

**Contenu.** Classeur `.xlsx` généré avec write-excel-file (`write-excel-file/browser`), chargé à la demande :
- **Synthèse** : examinateur, nom, prénom, ordre, statut, ajouté en cours de session, note brute, plafonnée, convertie, ajustement, justification, note finale (ou valeur absent selon `absent.export`), commentaire.
- **Détail des questions** : examinateur, étudiant, rang, catégorie, id et titre de la question, tags, résultat (noté, skippé ou en cours), points, points max, motif de skip, dates de tirage et de modification.
- **Statistiques** : contenu de F15.
- **Configuration** : catégories, barèmes, règles de notation et d'arrondi, version du schéma.
- **Métadonnées** : nom de session, examinateur, titre, matière, promo, dates de création et d'export, version de l'application.
- Mise en forme : en-têtes figés, largeurs adaptées, formats numériques avec le nombre de décimales configuré.
- Valeurs uniquement, aucune formule (le classeur sert à la consolidation par copier-coller). Onglets et en-têtes dans la langue de la session. Dates en vraies cellules date. Étudiant en cours : convertie et finale vides, statut « en cours ». Statistiques : blocs de `computeStats` (F15) empilés, une ligne de titre par bloc.
- Le bouton « Exporter en Excel » de l'onglet « Étudiants » est ajouté par ce ticket.
- Nom de fichier : `<slug-session>-<date>.xlsx`.

**Critères d'acceptation.**
- Le fichier s'ouvre sans avertissement dans Excel et LibreOffice.
- Les notes y sont des nombres, pas du texte, sauf la valeur absent en mode `label`.

### F17 — Hors ligne

**Objectif.** Fonctionner sans réseau après un premier chargement.

**Contenu.** vite-plugin-pwa (Workbox) avec précache de tous les assets, dont toutes les grammaires Shiki (~1,3 Mo en gzip avec F18, D63), write-excel-file, le chunk d'icônes Tabler (F07) et le chunk de graphiques des stats (F15). Scope du service worker réglé pour le sous-chemin GitHub Pages. Indication discrète quand une nouvelle version est disponible.
- Mise à jour proposée, jamais imposée (`registerType: 'prompt'`) : indicateur « Nouvelle version disponible — Recharger » dans la vue examinateur uniquement. Aucun rechargement automatique pendant une session.
- La vue projetée n'affiche jamais l'indicateur. Si une nouvelle version ouvre la base avec un schéma Dexie plus récent, la vue projetée (lecture seule, reconstruite depuis la base) se recharge d'elle-même à l'événement `versionchange`.
- Application installable : manifeste avec icônes carrées 192 et 512 px (recadrage d'un élément de la bannière, sinon monogramme aux couleurs Synthwave), `display: standalone`.
- Critère réseau coupé vérifié par Playwright (mode hors ligne du contexte).

**Critères d'acceptation.** Après un chargement en ligne, l'application permet, réseau coupé, de créer une session, de faire passer un étudiant, d'ouvrir la vue projetée et d'exporter un Excel.

### F18 — Coloration de tous les langages

**Objectif.** Colorer n'importe quel langage connu de Shiki, et plus seulement les six de D27.

**Contenu.**
- Catalogue `shiki/langs` (identifiants et alias, insensibles à la casse), chaque grammaire chargée à la demande au premier bloc qui l'utilise ; moteur JavaScript, pas de WASM. `text`, `txt`, `plain` et `plaintext` restent du texte brut.
- Même reconnaissance des langages pour le rendu et pour la validation de config.
- Création de session : avertissement non bloquant pour un bloc de code dont le langage n'est pas reconnu (il s'affichera en texte brut).
- Hors ligne : toutes les grammaires sont pré-cachées par F17 (D63).

**Critères d'acceptation.**
- Un bloc ```` ```python ```` ou ```` ```yaml ```` est coloré, et seule sa grammaire est téléchargée.
- Un langage inconnu s'affiche en texte brut et est signalé à la création de session.
- Après F17, un bloc `python` est coloré hors ligne.

## 9. Stack technique

| Besoin | Choix |
|---|---|
| Runtime | Node 24 LTS via nvm (`.nvmrc`), pnpm 12 |
| Build | Vite 8, TypeScript 7 strict (compilateur natif) |
| Lint / format | oxlint + oxlint-tsgolint (type-aware), Prettier + prettier-plugin-tailwindcss |
| UI | React, Tailwind, shadcn/ui v4 (base-ui, preset Nova, police Geist), icônes Tabler |
| Routing | TanStack Router, historique par hash |
| Persistance | Dexie (IndexedDB), `useLiveQuery` |
| Validation | Zod v4, génération de JSON Schema |
| CSV | PapaParse |
| Excel | write-excel-file, chargé à la demande |
| Markdown | react-markdown, remark-gfm, Shiki |
| Hors ligne | vite-plugin-pwa |
| Tests | Vitest 5 ; Playwright (Chromium, job CI `e2e`) pour les parcours à plusieurs fenêtres et le hors ligne |
| Déploiement | GitHub Actions vers GitHub Pages |

Pas de store global ni de TanStack Query : Dexie et `liveQuery` couvrent l'état persistant, l'état local d'interface reste dans les composants.

## 10. Hors périmètre V1

- Contraintes sur le choix des catégories (exemple : un seul Cauchemar).
- Synchronisation entre machines et fusion automatique des exports de plusieurs examinateurs.
- Édition de la config dans l'application, et remplacement de la config d'une session existante.
- Chronomètre.
- Duplication de session.

## 11. Points à confirmer

Aucun point ouvert. Les arbitrages sont tracés dans `docs/DECISIONS.md`.
