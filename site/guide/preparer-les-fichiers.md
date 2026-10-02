# Préparer les fichiers

Une session se crée à partir de deux fichiers : la liste des étudiants (un CSV) et la config (un JSON). Cette page explique comment les écrire. Les deux fichiers d'exemple, [students.example.csv](https://adriengras.github.io/questionator-z4000-hyperdrive/students.example.csv) et [config.example.json](https://adriengras.github.io/questionator-z4000-hyperdrive/config.example.json), sont un bon point de départ.

## La liste des étudiants (CSV)

### Le contenu

Le fichier contient une ligne par étudiant, avec deux colonnes utiles : le nom et le prénom.

```csv
Nom;Prénom
Durand;Alice
Lefèvre;Chloé
Martin;Bruno
```

L'application lit seulement ces deux colonnes. D'autres colonnes (numéro étudiant, groupe, e-mail) sont ignorées, avec un avertissement.

### L'en-tête

L'en-tête est facultatif, mais recommandé : il permet d'écrire les colonnes dans l'ordre que vous voulez.

- Les intitulés reconnus pour le nom sont `nom`, `nom de famille`, `lastname`, `surname` et `familyname`.
- Les intitulés reconnus pour le prénom sont `prénom`, `firstname` et `givenname`.
- La casse, les accents, les espaces, les tirets et les tirets bas ne comptent pas : `Prénom`, `PRENOM` et `first_name` sont tous reconnus.
- L'en-tête doit se trouver dans les cinq premières lignes non vides du fichier. Les lignes qui le précèdent (titre, date, commentaire) sont ignorées, avec un avertissement.

Sans en-tête reconnu, la première colonne est le nom, la deuxième le prénom, et toutes les lignes non vides sont lues comme des étudiants.

### Séparateur et encodage

- **Séparateur.** Le point-virgule, la virgule et la tabulation sont reconnus automatiquement. Un export Excel français (point-virgule) fonctionne tel quel. Si une cellule contient elle-même le séparateur, entourez-la de guillemets.
- **Encodage.** L'UTF-8 est lu directement, avec ou sans BOM. Si le fichier n'est pas en UTF-8, l'application le lit en Windows-1252, l'encodage des exports « CSV (séparateur : point-virgule) » d'Excel, et vous prévient. Regardez alors l'aperçu : si les accents sont abîmés, réexportez en « CSV UTF-8 ».
- **Retours à la ligne et espaces.** Un retour à la ligne dans une cellule (Alt+Entrée dans Excel) ou des espaces répétées sont remplacés par une seule espace.

### Doublons et lignes incomplètes

- Une ligne sans nom ou sans prénom est ignorée, avec un avertissement.
- Si deux lignes portent le même nom et le même prénom, les deux sont conservées et l'application vous prévient. La comparaison ignore la casse et les accents : `Durand Alice` et `DURAND alice` sont le même étudiant. Le numéro de ligne est celui que vous voyez dans votre tableur.

![Écran Nouvelle session avec un CSV de 11 étudiants : l'aperçu signale « Ligne 12 : Durand Alice figure déjà ligne 2. »](/screenshots/creation-avertissements.png)

Un avertissement ne bloque pas la création. Seuls deux cas la bloquent : un guillemet qui n'est jamais refermé, et un fichier sans aucun étudiant valide. Chaque message est expliqué dans [FAQ et dépannage](./depannage#csv_syntax) ; voir aussi [Le CSV est mal reconnu](./depannage#csv-mal-reconnu).

## La config (JSON)

La config décrit l'examen, la notation, les catégories et les questions. Partez du fichier d'exemple et modifiez-le. Cette section présente les blocs dont vous aurez besoin tout de suite. Tous les champs sont décrits dans la [Référence de la config](./reference-config).

Pour écrire la config avec un contrôle en direct, utilisez l'[Éditeur de config](./editeur-config).

### L'examen et la notation

```json
"exam": { "title": "Oral PHP", "subject": "PHP", "cohort": "B2 2026" },
"scoring": {
  "questionsPerStudent": 3,
  "maxRawScore": 10,
  "finalScale": 20
}
```

Ici, chaque étudiant répond à 3 questions. Les points s'additionnent dans une note brute, plafonnée à 10, puis convertie en une note finale sur 20. Voir [`scoring`](./reference-config#scoring).

### Les catégories et le barème

```json
{
  "id": "normal",
  "label": "Normal",
  "scale": [0, 0.5, 1, 1.5, 2],
  "color": "oklch(0.709 0.159 293.5)",
  "icon": "brand-php",
  "order": 2,
  "questions": []
}
```

- `scale` est la liste des notes que vous pouvez attribuer à une question de cette catégorie. Elle donne les boutons de note de l'écran de passage. Sa valeur la plus haute est la valeur de la catégorie : c'est le nombre de points affiché sur la tuile (« 2 pts »).
- `color` colore la tuile. C'est n'importe quelle couleur CSS : `#a21caf`, `rebeccapurple`, `oklch(…)`.
- `icon` est le nom d'une icône [Tabler](https://tabler.io/icons) en minuscules séparées par des tirets (`leaf`, `flame`, `skull`, `brand-php`). Un nom inconnu n'empêche pas la création : la tuile s'affiche sans icône, avec un avertissement ([Icône inconnue](./depannage#unknown_icon)).
- `order` fixe l'ordre d'affichage des tuiles. Sans lui, l'ordre du fichier s'applique.

Voir [`categories`](./reference-config#categories).

### Les questions

```json
{
  "id": "normal-003",
  "title": "match ou switch",
  "tags": ["contrôle"],
  "prompt": "Quelles différences entre `match` et `switch` ?",
  "answer": "- `match` est une expression : elle renvoie une valeur\n- Comparaison stricte (`===`)"
}
```

- `id` est obligatoire et unique dans toute la config.
- `prompt` est l'énoncé. Il s'affiche sur les deux vues, l'écran examinateur et la vue projetée.
- `answer` contient les éléments de réponse. Il s'affiche seulement sur l'écran examinateur, dans « Éléments de réponse ».
- `title` est un libellé court, repris dans le panneau et les exports. Sans lui, l'application utilise le début de l'énoncé.
- `tags` sont les notions travaillées, utilisées dans les statistiques.

Voir [Questions](./reference-config#questions).

### Écrire l'énoncé et la réponse en markdown

`prompt` et `answer` sont du markdown. Dans un fichier JSON, une chaîne tient sur une seule ligne : écrivez `\n` pour un saut de ligne, et `\"` pour un guillemet dans le texte.

- **Mise en forme** : `**gras**`, `*italique*`, listes à tirets, tableaux, liens. Le HTML brut n'est pas interprété : il s'affiche comme du texte.
- **Code en ligne** : entourez le code de simples accents graves, comme `` `match` ``.
- **Blocs de code** : ouvrez et fermez le bloc avec trois accents graves, et donnez le langage après les premiers.

  ````json
  "prompt": "Qu'affiche ce code ?\n\n```php\n$t = [1, 2, 3];\nforeach ($t as &$v) {}\nprint_r($t);\n```"
  ````

  Le code est coloré selon le langage (`php`, `js`, `python`, `sql`, `json`…). Le catalogue est celui de [Shiki](https://shiki.style/languages), alias compris. `text` désigne du texte brut, sans coloration. Un langage inconnu n'empêche pas la création : le bloc s'affiche en texte brut, avec un avertissement ([Langage de bloc de code non reconnu](./depannage#unknown_code_language)).
- **Images** : `![texte alternatif](https://exemple.org/schema.png)`. L'image est chargée depuis son adresse quand la question s'affiche : elle doit être accessible en ligne. Elle n'est pas incluse dans la config.

## Avant de créer la session

Lors du dépôt, l'application vérifie la config et affiche l'aperçu : titre, matière, promotion, catégories avec leur nombre de questions, notation, nombre de skips. Une erreur bloque la création, un avertissement non. Chaque message est expliqué dans [FAQ et dépannage](./depannage). Les règles vérifiées sont listées en fin de la [Référence de la config](./reference-config#regles-verifiees-a-la-creation).
