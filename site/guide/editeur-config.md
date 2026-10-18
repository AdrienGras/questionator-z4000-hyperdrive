# Éditeur de config

L'éditeur de config est intégré à l'application. Vous y écrivez ou corrigez un fichier de config : les erreurs sont signalées pendant la frappe, et les questions s'affichent à droite telles qu'elles seront projetées. Il évite les allers-retours entre un éditeur de texte et l'écran de création.

## Ouvrir l'éditeur

Cliquez sur « Éditeur de config » dans le menu, ou sur « Ouvrir l'éditeur » dans la tuile de l'accueil. L'écran a deux colonnes : le texte de la config à gauche, l'« Aperçu » à droite. Le cadre du texte porte en titre le nom du fichier que « Télécharger » produirait, par exemple `oral-php.json`.

![Éditeur de config : à gauche le cadre « oral-php.json » avec Charger, Repartir de l'exemple et Télécharger, le panneau Problèmes qui indique « Aucune erreur », puis le texte JSON numéroté ; à droite l'aperçu, avec un raccourci par catégorie et « Écran final », puis les questions de la catégorie Facile.](/screenshots/editeur-config.png)

À la première ouverture, l'éditeur contient la config d'exemple. Ensuite, il rouvre le texte tel que vous l'avez laissé.

## Écrire la config

Le texte est du JSON, avec des numéros de ligne et la coloration syntaxique. L'éditeur ferme automatiquement les accolades et les guillemets.

### Autocomplétion

Pendant que vous tapez un nom de champ ou une valeur, l'éditeur propose les choix possibles. Pour ouvrir la liste vous-même, appuyez sur Ctrl+Espace. L'éditeur propose les noms de champs de l'endroit où se trouve le curseur, les valeurs d'un champ à choix fermé (`nearest`, `up` ou `down` pour `scoring.rounding.mode`, par exemple) et les noms d'icônes Tabler pour `icon`.

### Survol

Placez le pointeur sur un nom de champ ou sur une valeur : une bulle affiche la description du champ, les « Valeurs possibles : » quand la liste est fermée, et le « Défaut : ». Sur un champ `icon`, la bulle propose un lien « Rechercher une icône sur tabler.io » et rappelle que Ctrl+Espace propose les noms connus.

Ces aides viennent du JSON Schema de la config, le même que celui qui sert à l'autocomplétion dans VSCode. Voir [Le champ `$schema` et l'aide de l'éditeur](./reference-config#le-champ-schema-et-l-aide-de-l-editeur).

## Corriger les erreurs

Environ 300 ms après votre dernière frappe, l'application vérifie la config avec les règles de la création de session. Les problèmes apparaissent de trois façons :

- **Dans le texte.** Le passage concerné est souligné, avec une pastille dans la marge. Survolez-le pour lire le message.
- **Dans le panneau « Problèmes », au-dessus du texte.** Il indique « Aucune erreur », ou le décompte (« 2 erreurs, 1 avertissement »), puis les erreurs avant les avertissements. Chaque problème donne son message, le chemin du champ concerné et son numéro de ligne.
- **Dans l'aperçu**, si la config contient une erreur : un bandeau « Aperçu périmé : la config contient des erreurs. » prévient que l'aperçu montre la dernière version valide.

Cliquez sur un problème pour que l'éditeur sélectionne l'endroit concerné et fasse défiler le texte jusque-là. Chaque message est expliqué dans [FAQ et dépannage](./depannage#json_syntax).

Une erreur bloque la création de session. Un avertissement, comme une icône inconnue, ne la bloque pas.

## L'aperçu

En haut de l'aperçu, un raccourci par catégorie, avec son nombre de questions, fait défiler jusqu'à elle ; le dernier mène à l'« Écran final ». L'aperçu affiche, catégorie par catégorie, chaque question avec son identifiant, son titre, son barème et son énoncé, rendu comme sur la vue projetée : markdown, blocs de code colorés, couleurs et thème de la config. Les éléments de réponse sont repliés sous « Réponse attendue ». L'aperçu se termine par l'« Écran final » tel que l'étudiant le verrait.

Tant que le texte est invalide, l'aperçu garde la dernière config valide. Avant la première config valide, il indique : « L'aperçu apparaîtra dès que la config sera valide. »

## Les boutons

Les trois premiers sont en haut du cadre du texte, le dernier dans l'en-tête de la page.

- **Charger** : remplace le texte par le contenu d'un fichier `.json` de votre appareil. Vous pouvez aussi déposer le fichier sur le cadre du texte.
- **Repartir de l'exemple** : remplace le texte par la config d'exemple. Si vous vous êtes trompé, Ctrl+Z annule ce remplacement.
- **Télécharger** : enregistre le texte dans un fichier `.json`. Le nom vient du titre de l'examen (`oral-php.json` pour « Oral PHP »), ou `config.json` si le titre est introuvable.
- **Créer une session avec cette config** : ouvre l'écran « Nouvelle session » avec cette config déjà déposée. Le bouton est inactif tant que la config contient une erreur ou que la vérification n'est pas terminée. Il vous reste à déposer la liste d'étudiants, puis à cliquer sur « Créer la session ». Voir [Prise en main](./prise-en-main).

## Où est enregistré votre travail

L'éditeur garde un brouillon dans le stockage local du navigateur, à chaque modification. Si vous fermez l'onglet ou actualisez la page, le texte revient à la prochaine ouverture. Ce brouillon n'est pas un fichier : il reste dans ce navigateur, sur cet appareil. Pour le conserver ailleurs ou le partager, cliquez sur « Télécharger ».
