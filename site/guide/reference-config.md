# Référence de la config

Cette page décrit chaque champ du fichier de config. Le fichier est un JSON : un en-tête, des blocs de réglages, puis les catégories et leurs questions.

## Structure générale

Voici le squelette d'une config. Les blocs `absent`, `skips`, `presentation` et `theme` sont facultatifs, ainsi que `locale` et `$schema`.

```json
{
  "$schema": "https://adriengras.github.io/questionator-z4000-hyperdrive/config.schema.json",
  "schemaVersion": 1,
  "locale": "fr",
  "exam": { "title": "Oral PHP" },
  "scoring": { "questionsPerStudent": 3, "maxRawScore": 10, "finalScale": 20 },
  "categories": []
}
```

Une clé inconnue est refusée : une faute de frappe dans un nom de champ est donc signalée tout de suite.

### Le champ `$schema` et l'aide de l'éditeur

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `$schema` | texte | non | aucun | URL du JSON Schema, pour l'autocomplétion dans l'éditeur. |

Copiez la ligne `$schema` ci-dessus telle quelle en tête de votre fichier. Un éditeur comme VSCode lit alors le JSON Schema publié avec l'application et vous aide :

- l'autocomplétion des noms de champs et des valeurs possibles (`nearest`, `up`, `down`, etc.) ;
- le survol d'un champ : sa description et sa valeur par défaut ;
- les noms d'icônes : pour `icon`, l'éditeur propose les noms d'icônes Tabler. L'éditeur n'en refuse aucun autre ; l'application signale un nom inconnu à la création de la session.

Le JSON Schema contrôle la forme du fichier. Les règles qui croisent plusieurs champs sont vérifiées par l'application, à la création de la session (voir la dernière section de cette page).

## `schemaVersion`

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `schemaVersion` | entier | oui | aucun | Version du format de config. La seule valeur acceptée est `1`. |

```json
"schemaVersion": 1
```

## `locale`

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `locale` | `fr` ou `en` | non | langue du navigateur si elle est prise en charge, sinon `fr` | Langue des écrans de la session et de l'export. L'accueil et la création de session suivent toujours la langue du navigateur. |

```json
"locale": "fr"
```

## `exam`

Titre et métadonnées de l'examen, repris sur la vue projetée et dans les exports.

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `exam` | objet | oui | aucun | Bloc de l'examen. |
| `exam.title` | texte non vide | oui | aucun | Titre affiché sur la vue projetée et en tête des exports. |
| `exam.subject` | texte | non | aucun | Matière, reprise dans les exports. |
| `exam.cohort` | texte | non | aucun | Promotion, reprise dans les exports. |

```json
"exam": { "title": "Oral PHP", "subject": "PHP", "cohort": "B2 2026" }
```

## `scoring`

Notation : nombre de questions, plafond de la note brute, échelle finale et arrondi.

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `scoring` | objet | oui | aucun | Bloc de notation. |
| `scoring.questionsPerStudent` | entier strictement positif | oui | aucun | Nombre de questions notées par passage. |
| `scoring.maxRawScore` | nombre strictement positif | oui | aucun | Plafond de la note brute. |
| `scoring.finalScale` | nombre strictement positif | oui | aucun | Échelle de la note finale (par exemple `20` pour une note sur 20). |
| `scoring.rounding` | objet | non | voir ci-dessous | Arrondi de la note finale. Tous ses champs sont facultatifs. |
| `scoring.rounding.mode` | `nearest`, `up` ou `down` | non | `nearest` | Sens de l'arrondi : au plus proche, au-dessus ou au-dessous. |
| `scoring.rounding.decimals` | entier de 0 à 3 | non | `2` | Nombre de décimales de la note finale. |
| `scoring.rounding.step` | nombre strictement positif ou `null` | non | `null` | Pas d'arrondi. S'il est défini, il prime sur `decimals`. |

```json
"scoring": {
  "questionsPerStudent": 3,
  "maxRawScore": 10,
  "finalScale": 20,
  "rounding": { "mode": "nearest", "step": 0.5 }
}
```

Les notes sont calculées au millième : une valeur de notation ne peut pas avoir plus de trois décimales, ni dépasser 10 000 en valeur absolue.

## `absent`

Note exportée pour un étudiant absent. Tous les champs sont facultatifs.

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `absent` | objet | non | voir ci-dessous | Bloc des absents. |
| `absent.export` | `label`, `zero` ou `value` | non | `label` | Ce que l'export met en note pour un absent : le libellé, zéro ou une valeur. |
| `absent.label` | texte | non | `ABS` | Texte exporté pour un absent quand `export` vaut `label`. |
| `absent.value` | nombre | non | aucun | Note attribuée aux absents. Obligatoire quand `export` vaut `value`. |

```json
"absent": { "export": "value", "value": 0 }
```

## `skips`

Questions passées (« skips »). Tous les champs sont facultatifs.

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `skips` | objet | non | voir ci-dessous | Bloc des questions passées. |
| `skips.enabled` | booléen | non | `true` | Autorise l'examinateur à passer une question. |
| `skips.maxPerStudent` | entier ≥ 0 | non | `1` | Nombre maximal de questions passées par étudiant. |
| `skips.reasons` | liste de textes non vides | non | aucun | Motifs proposés dans la boîte de skip. |
| `skips.reasons[]` | texte non vide | oui, dans la liste | aucun | Un motif proposé dans la boîte de skip. |
| `skips.allowFreeText` | booléen | non | `true` | Autorise un motif libre. |

```json
"skips": {
  "enabled": true,
  "maxPerStudent": 2,
  "reasons": ["Question déjà vue", "Hors programme"],
  "allowFreeText": true
}
```

## `presentation`

Affichage de la vue projetée. Tous les champs sont facultatifs.

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `presentation` | objet | non | voir ci-dessous | Bloc de présentation. |
| `presentation.showCumulativeScore` | booléen | non | `true` | Affiche le score cumulé sur la vue projetée après chaque question notée, pendant le passage. Il disparaît quand le passage est terminé. |
| `presentation.finalScoreDisplay` | `raw`, `converted` ou `both` | non | `both` | Note affichée sur l'écran final : brute, convertie ou les deux. |
| `presentation.showStatsOnFinal` | booléen | non | `false` | Affiche le détail du passage sur l'écran final projeté. |
| `presentation.drawAnimation` | booléen | non | `true` | Active l'animation lors du tirage. |
| `presentation.defaultColorMode` | `light`, `dark` ou `system` | non | `system` | Mode d'affichage clair, sombre ou celui du système à l'ouverture de la session. |
| `presentation.showCategoryPoints` | booléen | non | `true` | Affiche le maximum de points de chaque catégorie sur la vue projetée. |

```json
"presentation": { "finalScoreDisplay": "converted", "defaultColorMode": "dark" }
```

## `theme`

Surcharge des variables CSS de l'interface, par mode clair et sombre. Tout le bloc est facultatif, et chaque jeton aussi : un jeton absent garde sa valeur d'origine.

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `theme` | objet | non | aucun | Bloc du thème. |
| `theme.light` | objet | non | aucun | Variables CSS du thème clair. |
| `theme.dark` | objet | non | aucun | Variables CSS du thème sombre. |

`theme.light` et `theme.dark` acceptent exactement les mêmes jetons, listés dans le tableau ci-dessous. Chaque jeton est un texte qui contient une valeur CSS : une couleur (`oklch(0.52 0.23 324)`, `#a21caf`, `rebeccapurple`…), ou une longueur pour `radius`. Il ne doit pas être vide ni contenir `;`, `{`, `}` ou `<`. Le navigateur vérifie que la valeur est reconnue.

### Jetons de thème

| Jeton | Rôle |
| --- | --- |
| `radius` | Rayon des coins arrondis (valeur de `border-radius`, par exemple `0.75rem`). |
| `background` | Fond de l'application. |
| `foreground` | Couleur du texte par défaut. |
| `card` | Fond des cartes. |
| `card-foreground` | Texte sur les cartes. |
| `popover` | Fond des menus et fenêtres flottantes. |
| `popover-foreground` | Texte dans les menus et fenêtres flottantes. |
| `primary` | Couleur principale : boutons d'action, éléments actifs. |
| `primary-foreground` | Texte sur la couleur principale. |
| `secondary` | Couleur des boutons et zones secondaires. |
| `secondary-foreground` | Texte sur la couleur secondaire. |
| `muted` | Fond des zones discrètes. |
| `muted-foreground` | Texte discret : légendes, aides. |
| `accent` | Fond mis en avant au survol ou à la sélection. |
| `accent-foreground` | Texte sur le fond mis en avant. |
| `destructive` | Actions destructrices et erreurs. |
| `border` | Bordures. |
| `input` | Bordure des champs de saisie. |
| `ring` | Anneau de focus. |
| `chart-1` | Couleur 1 des graphiques. |
| `chart-2` | Couleur 2 des graphiques. |
| `chart-3` | Couleur 3 des graphiques. |
| `chart-4` | Couleur 4 des graphiques. |
| `chart-5` | Couleur 5 des graphiques. |
| `sidebar` | Fond du panneau latéral. |
| `sidebar-foreground` | Texte du panneau latéral. |
| `sidebar-primary` | Couleur principale du panneau latéral. |
| `sidebar-primary-foreground` | Texte sur la couleur principale du panneau latéral. |
| `sidebar-accent` | Fond mis en avant dans le panneau latéral. |
| `sidebar-accent-foreground` | Texte sur le fond mis en avant du panneau latéral. |
| `sidebar-border` | Bordures du panneau latéral. |
| `sidebar-ring` | Anneau de focus du panneau latéral. |

```json
"theme": {
  "light": { "primary": "oklch(0.518 0.226 323.9)", "radius": "0.75rem" },
  "dark": { "primary": "oklch(0.687 0.252 323.9)" }
}
```

## `categories`

Catégories de difficulté proposées au tirage. Le champ est obligatoire. Chaque élément de la liste décrit une catégorie.

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `categories` | liste d'objets | oui | aucun | Liste des catégories. |
| `categories[]` | objet | oui, dans la liste | aucun | Une catégorie. |
| `categories[].id` | texte non vide | oui | aucun | Identifiant stable de la catégorie. |
| `categories[].label` | texte non vide | oui | aucun | Libellé affiché. |
| `categories[].scale` | liste de nombres | oui | aucun | Valeurs attribuables, décimales autorisées. La valeur maximale est la valeur de la catégorie (points max) : elle est affichée sur la tuile et utilisée dans les exports et les stats. |
| `categories[].scale[]` | nombre | oui, dans la liste | aucun | Une valeur attribuable. |
| `categories[].color` | couleur CSS | non | aucun | Couleur de la tuile, validée par le navigateur à la création de session. |
| `categories[].icon` | texte | non | aucun | Nom d'icône Tabler en kebab-case (par exemple `leaf`, `brand-php`). Un nom inconnu n'affiche aucune icône, avec un avertissement. |
| `categories[].order` | entier | non | ordre du tableau | Ordre d'affichage. |
| `categories[].questions` | liste d'objets | oui | aucun | Questions de la catégorie. |
| `categories[].questions[]` | objet | oui, dans la liste | aucun | Une question de la catégorie. |

```json
"categories": [
  {
    "id": "facile",
    "label": "Facile",
    "scale": [0, 1, 2],
    "color": "oklch(0.7 0.15 150)",
    "icon": "leaf",
    "questions": []
  }
]
```

### Questions

Chaque élément de `categories[].questions` est une question.

| Champ | Type | Obligatoire | Défaut | Description |
| --- | --- | --- | --- | --- |
| `categories[].questions[].id` | texte non vide | oui | aucun | Identifiant stable de la question, unique dans toute la config. |
| `categories[].questions[].title` | texte non vide | non | début du `prompt` sans markdown | Libellé court, utilisé dans le panneau latéral et les exports. |
| `categories[].questions[].tags` | liste de textes non vides | non | aucun | Notions pédagogiques, utilisées dans les stats. |
| `categories[].questions[].tags[]` | texte non vide | oui, dans la liste | aucun | Une notion pédagogique. |
| `categories[].questions[].prompt` | texte non vide | oui | aucun | Énoncé en markdown, affiché aux deux vues. |
| `categories[].questions[].answer` | texte | non | aucun | Éléments de réponse en markdown, visibles uniquement sur l'écran de passage. |

```json
{
  "id": "php-001",
  "title": "Typage strict",
  "tags": ["typage"],
  "prompt": "Que fait `declare(strict_types=1)` ?",
  "answer": "Il désactive la conversion implicite des types scalaires."
}
```

## Règles vérifiées à la création

Le JSON Schema ne contrôle que la forme du fichier. À la création de la session, l'application vérifie aussi ces règles, qui croisent plusieurs champs. Une erreur bloque la création, un avertissement non.

Erreurs :

- Les identifiants de catégories sont uniques, et ceux des questions le sont dans toute la config ([duplicate_category_id](./depannage#duplicate_category_id), [duplicate_question_id](./depannage#duplicate_question_id)).
- Deux identifiants qui ne diffèrent que par la façon dont un accent est saisi sont refusés ([unicode_variant_id](./depannage#unicode_variant_id)).
- Un identifiant ne commence ni ne finit par une espace ([padded_id](./depannage#padded_id)).
- Le barème (`scale`) d'une catégorie n'est pas vide, ne contient aucune valeur négative ni aucun doublon, et sa valeur maximale est supérieure à 0 ([empty_scale](./depannage#empty_scale), [negative_scale_value](./depannage#negative_scale_value), [duplicate_scale_value](./depannage#duplicate_scale_value), [zero_max_scale](./depannage#zero_max_scale)).
- Chaque catégorie contient au moins une question ([category_without_questions](./depannage#category_without_questions)).
- La config contient au moins `scoring.questionsPerStudent` questions, plus `skips.maxPerStudent` si les skips sont activés ([not_enough_questions](./depannage#not_enough_questions)).
- `absent.value` est renseigné quand `absent.export` vaut `value` ([missing_absent_value](./depannage#missing_absent_value)).
- Chaque valeur de notation (`maxRawScore`, `finalScale`, `rounding.step`, `absent.value` et les valeurs des barèmes) a au plus trois décimales et ne dépasse pas 10 000 en valeur absolue ([too_many_decimals](./depannage#too_many_decimals), [scoring_value_too_large](./depannage#scoring_value_too_large)).
- Chaque couleur, `radius` compris, est une valeur CSS reconnue par le navigateur ([invalid_css_value](./depannage#invalid_css_value)).
- `scoring.finalScale` est un multiple du pas d'arrondi (`rounding.step`, ou 10 puissance moins `decimals` à défaut) ([final_scale_off_grid](./depannage#final_scale_off_grid)).

Avertissements :

- La note brute maximale est atteignable : `questionsPerStudent` fois la plus grande valeur de barème doit atteindre `maxRawScore` ([unreachable_max_score](./depannage#unreachable_max_score)).
- Le nom d'icône est connu de Tabler ; sinon la catégorie s'affiche sans icône ([unknown_icon](./depannage#unknown_icon)).
- Le langage d'un bloc de code des énoncés et réponses est reconnu ; sinon le bloc s'affiche en texte brut ([unknown_code_language](./depannage#unknown_code_language)).
