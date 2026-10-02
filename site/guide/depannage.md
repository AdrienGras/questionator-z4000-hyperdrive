# FAQ et dépannage

Cette page explique chaque message que l'application affiche quand la création d'une session échoue ou prévient d'un risque. Chaque entrée donne le message tel qu'il apparaît (les parties variables sont en *italique*), sa cause et la marche à suivre.

Deux niveaux existent :

- une **erreur** bloque la création de la session ;
- un **avertissement** ne la bloque pas : il signale quelque chose à vérifier.

Les règles qui croisent plusieurs champs sont décrites dans la [référence de la config](./reference-config#regles-verifiees-a-la-creation).

## Erreurs du fichier de configuration

### Le fichier n'est pas un JSON valide {#json_syntax}

Erreur.

> Le fichier n'est pas un JSON valide (ligne *n*, colonne *n*).

**Cause.** Le fichier a une faute de syntaxe JSON : virgule oubliée ou en trop, guillemet manquant, accolade non fermée. La ligne et la colonne indiquent où la lecture s'est arrêtée. La faute se trouve souvent juste avant.

**Que faire.** Corrigez le fichier à l'endroit indiqué. L'[éditeur de config](./editeur-config) signale ces fautes en direct.

### Version du format non prise en charge {#unsupported_schema_version}

Erreur.

> Cette configuration utilise la version *found* du format, mais l'application ne connaît que la version *supported*. Rechargez la page pour mettre l'application à jour.

**Cause.** Le champ `schemaVersion` du fichier ne correspond pas à la version que l'application lit. Soit le fichier vient d'une version plus récente, soit votre navigateur garde une ancienne version de l'application.

**Que faire.** Rechargez la page pour récupérer la dernière version. Si le message revient, vérifiez la valeur de `schemaVersion` dans le fichier.

### Erreur de structure {#required}

<span id="invalid_type"></span><span id="unknown_key"></span><span id="invalid_enum"></span><span id="not_integer"></span><span id="too_small"></span><span id="too_big"></span><span id="empty_string"></span><span id="invalid_value"></span><span id="invalid_css_shape"></span>

Erreur. Dix messages décrivent la forme d'un champ. Chacun s'affiche avec le chemin du champ concerné.

| Message | Cause |
|---|---|
| Champ obligatoire manquant : « *champ* ». | Un champ requis est absent. |
| Type invalide : la valeur doit être *un type*. | La valeur n'a pas le bon type (texte, nombre, booléen, objet, tableau). |
| Clé inconnue « *clé* » : vérifiez l'orthographe du nom de champ. | Le nom du champ n'existe pas, souvent à cause d'une faute de frappe ou d'une casse différente. |
| Valeur non autorisée. Valeurs possibles : *liste*. | Le champ n'accepte qu'un petit nombre de valeurs, et la vôtre n'en fait pas partie. |
| Un nombre entier est attendu. | Le champ n'accepte pas les décimales. |
| La valeur doit être supérieure ou égale à *minimum*. | Le nombre est sous la borne basse. Selon le champ, la borne peut être stricte : « strictement supérieure à ». |
| La valeur doit être inférieure ou égale à *maximum*. | Le nombre dépasse la borne haute. Selon le champ, la borne peut être stricte : « strictement inférieure à ». |
| Ce champ ne peut pas être vide. | Un texte obligatoire est vide. |
| Valeur CSS invalide : elle ne doit pas être vide ni contenir « ; », « { », « } » ou « &lt; ». | Une valeur de thème contient un caractère interdit. |
| Valeur invalide. | La valeur est refusée sans plus de précision. |

**Que faire.** Ouvrez la [référence de la config](./reference-config) et comparez le champ signalé à sa ligne : type, valeurs permises et bornes y sont indiqués.

### Identifiant de catégorie déjà utilisé {#duplicate_category_id}

Erreur.

> L'identifiant de catégorie « *id* » est déjà utilisé (*chemin*).

**Cause.** Deux catégories portent le même `id`. Le chemin désigne la première.

**Que faire.** Donnez un `id` différent à l'une des deux.

### Identifiant de question déjà utilisé {#duplicate_question_id}

Erreur.

> L'identifiant de question « *id* » est déjà utilisé (*chemin*) : il doit être unique dans toute la configuration.

**Cause.** Deux questions portent le même `id`. L'unicité vaut pour toute la config, pas seulement au sein d'une catégorie.

**Que faire.** Renommez l'une des deux questions.

### Identifiants qui se ressemblent {#unicode_variant_id}

Erreur.

> L'identifiant « *id* » ressemble à celui de *chemin* mais ne s'écrit pas avec les mêmes caractères (accents saisis différemment) : retapez l'un des deux pour qu'ils soient identiques, ou choisissez un autre identifiant.

**Cause.** Deux identifiants paraissent identiques à l'écran mais diffèrent à l'octet près. Le cas typique : un « é » saisi en un seul caractère d'un côté, et en « e » suivi d'un accent combiné de l'autre.

**Que faire.** Retapez l'un des deux identifiants, ou choisissez-en un autre. Si les deux sont censés désigner la même chose, retapez-les à l'identique.

### Identifiant entouré d'espaces {#padded_id}

Erreur.

> L'identifiant « *id* » commence ou finit par une espace : retirez-la.

**Cause.** Un `id` contient une espace en tête ou en fin.

**Que faire.** Supprimez l'espace.

### Barème vide {#empty_scale}

Erreur.

> Le barème est vide : indiquez au moins une valeur attribuable.

**Cause.** Le `scale` d'une catégorie ne contient aucune valeur.

**Que faire.** Indiquez au moins une valeur, par exemple `[0, 1, 2]`.

### Valeur négative dans un barème {#negative_scale_value}

Erreur.

> Le barème contient une valeur négative (*valeur*).

**Cause.** Un barème ne peut pas contenir de valeur sous zéro.

**Que faire.** Remplacez la valeur par un nombre positif ou nul.

### Valeur en double dans un barème {#duplicate_scale_value}

Erreur.

> La valeur *valeur* apparaît plusieurs fois dans le barème.

**Cause.** Le même nombre figure deux fois dans un `scale`.

**Que faire.** Supprimez le doublon.

### Valeur maximale du barème à zéro {#zero_max_scale}

Erreur.

> La valeur maximale du barème est 0 : la catégorie ne rapporterait aucun point.

**Cause.** Toutes les valeurs du barème valent 0.

**Que faire.** Ajoutez au moins une valeur supérieure à 0.

### Catégorie sans question {#category_without_questions}

Erreur.

> Cette catégorie ne contient aucune question.

**Cause.** La liste `questions` d'une catégorie est vide.

**Que faire.** Ajoutez des questions à la catégorie, ou supprimez-la.

### Pas assez de questions {#not_enough_questions}

Erreur.

> La configuration contient *total* question(s), il en faut au moins *requis* (*n* par étudiant, plus *s* skip(s) autorisé(s)).

Sans skip autorisé, le message se termine par « il en faut au moins *requis* ».

**Cause.** Chaque étudiant doit pouvoir recevoir `scoring.questionsPerStudent` questions, plus `skips.maxPerStudent` si les skips sont activés. La config en contient moins.

**Que faire.** Ajoutez des questions, ou baissez `questionsPerStudent` ou `skips.maxPerStudent`.

### Valeur d'absence manquante {#missing_absent_value}

Erreur.

> « absent.value » est obligatoire quand « absent.export » vaut « value ».

**Cause.** Vous avez demandé d'exporter une valeur pour les absents sans dire laquelle.

**Que faire.** Renseignez `absent.value`, ou changez `absent.export`.

### Plus de trois décimales {#too_many_decimals}

Erreur.

> *valeur* a plus de 3 décimales : les notes sont calculées au millième.

**Cause.** Une valeur de notation (`maxRawScore`, `finalScale`, `rounding.step`, `absent.value`, valeur d'un barème) a plus de trois décimales.

**Que faire.** Arrondissez la valeur au millième.

### Valeur de notation trop grande {#scoring_value_too_large}

Erreur.

> *valeur* dépasse *max* en valeur absolue, le maximum pour une valeur de notation.

**Cause.** Une valeur de notation dépasse 10 000 en valeur absolue.

**Que faire.** Utilisez une valeur plus petite.

### Couleur ou rayon non reconnu {#invalid_css_value}

Erreur.

> « *valeur* » n'est pas une couleur CSS reconnue par ce navigateur.

Pour le champ `radius`, le message dit « n'est pas une valeur de border-radius reconnue par ce navigateur ».

**Cause.** Le navigateur que vous utilisez refuse la valeur. Une couleur récente peut être acceptée par un navigateur et pas par un autre.

**Que faire.** Corrigez la valeur, ou utilisez une notation plus répandue (`#rrggbb`, `rgb(…)`).

### Note maximale inatteignable {#unreachable_max_score}

Avertissement.

> Note maximale inatteignable : *atteignable* point(s) au mieux, pour une note brute plafonnée à *maxRawScore*.

**Cause.** Même avec la meilleure valeur de chaque barème, un étudiant n'atteindrait pas `scoring.maxRawScore`.

**Que faire.** Baissez `maxRawScore`, augmentez les valeurs des barèmes ou le nombre de questions par étudiant. Si c'est voulu, vous pouvez ignorer l'avertissement.

### Échelle finale hors du pas d'arrondi {#final_scale_off_grid}

Erreur.

> L'échelle finale (*finalScale*) doit être un multiple du pas d'arrondi (*pas*).

**Cause.** `scoring.finalScale` n'est pas un multiple du pas d'arrondi. Sans `rounding.step`, le pas vaut 10 puissance moins `decimals`.

**Que faire.** Choisissez une échelle finale qui est un multiple du pas, ou changez le pas.

### Icône inconnue {#unknown_icon}

Avertissement.

> Icône inconnue « *icône* » : la catégorie s'affichera sans icône.

**Cause.** Le nom d'icône n'existe pas dans la bibliothèque Tabler.

**Que faire.** Corrigez le nom, ou retirez le champ `icon` si vous ne voulez pas d'icône.

### Langage de bloc de code non reconnu {#unknown_code_language}

Avertissement.

> Le langage « *langage* » d'un bloc de code de la question *id* n'est pas reconnu : il s'affichera en texte brut.

**Cause.** Un bloc de code d'énoncé ou de réponse annonce un langage que l'application ne connaît pas.

**Que faire.** Corrigez le nom du langage. Le bloc s'affiche de toute façon, sans coloration.

## Erreurs et avertissements de la liste d'étudiants

### Guillemet non fermé {#csv_syntax}

Erreur.

> Guillemet non fermé : la suite du fichier ne peut pas être lue.

**Cause.** Un guillemet ouvert dans une cellule n'est jamais refermé. Le numéro de ligne indique où.

**Que faire.** Ouvrez le CSV dans un éditeur de texte, repérez la ligne et fermez le guillemet, ou supprimez-le.

### Fichier en Windows-1252 {#legacy_encoding}

Avertissement.

> Fichier lu en Windows-1252 (export Excel) : vérifiez les accents dans l'aperçu.

**Cause.** Le fichier n'est pas en UTF-8. L'application l'a lu en Windows-1252, l'encodage des exports Excel français.

**Que faire.** Regardez l'aperçu : si les accents sont corrects, ne faites rien. Sinon, réexportez le fichier en « CSV UTF-8 ».

### Aucun étudiant valide {#no_students}

Erreur.

> Aucun étudiant valide dans ce fichier (il faut un nom et un prénom par ligne).

**Cause.** Aucune ligne ne contient à la fois un nom et un prénom. Le fichier est vide, ou ses colonnes ne sont pas celles attendues.

**Que faire.** Vérifiez que le fichier a deux colonnes, nom et prénom, avec une ligne par étudiant. Voir [Préparer les fichiers](./preparer-les-fichiers).

### Lignes avant l'en-tête ignorées {#preamble_skipped}

Avertissement.

> *n* ligne(s) avant l'en-tête ignorée(s).

**Cause.** Le fichier commence par des lignes de titre ou de commentaire avant la ligne d'en-tête. L'application les saute.

**Que faire.** Rien, si ces lignes ne contenaient pas d'étudiants. Sinon, déplacez-les sous l'en-tête.

### Nom ou prénom manquant {#single_field_row}

Avertissement.

> Ligne *n* : Nom ou prénom manquant : ligne ignorée.

**Cause.** Une ligne n'a qu'un des deux champs. L'étudiant n'est pas ajouté.

**Que faire.** Complétez la ligne, ou supprimez-la si elle est vide par erreur.

### Colonnes en trop {#extra_columns}

Avertissement.

> Colonnes en trop sur *n* ligne(s) : seules les colonnes nom et prénom sont lues.

**Cause.** Des lignes contiennent d'autres colonnes que le nom et le prénom (numéro étudiant, groupe, e-mail). Elles sont ignorées.

**Que faire.** Rien, sauf si une de ces colonnes était censée être le nom ou le prénom : dans ce cas, vérifiez l'ordre des colonnes.

### Étudiant en double {#duplicate_student}

Avertissement.

> Ligne *n* : *Nom Prénom* figure déjà ligne *m*.

**Cause.** La même personne apparaît deux fois. Les deux lignes sont conservées.

**Que faire.** Supprimez le doublon si c'est une erreur. Si deux étudiants ont réellement le même nom et le même prénom, ignorez l'avertissement.

## Autres problèmes

### La création est impossible {#creation-impossible}

Deux messages peuvent apparaître au moment de cliquer sur « Créer la session ».

> La validation n'a pas pu démarrer. Rechargez la page.

La vérification de la config n'a pas pu se charger, par exemple à cause d'une connexion coupée pendant le chargement. Rechargez la page.

> La création a échoué. Réessayez.

L'enregistrement de la session dans le navigateur a échoué. Réessayez. Si le message persiste, regardez [la perte de données](#perte-de-donnees) : le stockage local est peut-être bloqué.

### Le CSV est mal reconnu {#csv-mal-reconnu}

- **Accents abîmés dans l'aperçu.** Réexportez le fichier en UTF-8.
- **Une seule colonne lue, ou noms et prénoms mélangés.** Le séparateur (virgule ou point-virgule) est détecté automatiquement. Si une cellule contient elle-même ce caractère, entourez-la de guillemets.
- **Nom et prénom inversés.** Si le fichier a un en-tête, l'application repère les colonnes par leur intitulé. Sans en-tête, la première colonne est le nom et la seconde le prénom.

### La vue projetée ne s'ouvre pas {#projection}

> Autorisez les fenêtres pop-up pour ce site pour ouvrir la vue projetée.

Le navigateur a bloqué l'ouverture de la seconde fenêtre. Autorisez les fenêtres pop-up pour le site de l'application, puis cliquez de nouveau sur « Ouvrir la vue projetée ».

Pour projeter sur un second écran, ouvrez la vue projetée puis déplacez cette fenêtre sur l'écran du vidéoprojecteur. Voir [Projeter](./projeter).

### Mes sessions ont disparu {#perte-de-donnees}

Les sessions sont enregistrées dans le stockage local du navigateur, sur cet appareil. Elles n'existent nulle part ailleurs. Elles disparaissent si vous effacez les données du site, si le navigateur manque d'espace, ou si vous changez de navigateur ou d'appareil.

> Stockage non garanti : le navigateur n'a pas garanti la conservation des données : il peut effacer vos sessions s'il manque d'espace. Exportez régulièrement un backup.

Cet avertissement s'affiche quand le navigateur ne promet pas de conserver les données. Exportez régulièrement une sauvegarde de vos sessions.

> Le stockage local est indisponible (navigation privée ou cookies bloqués ?). Les sessions ne peuvent pas être enregistrées.

Ce message apparaît en navigation privée, ou quand les cookies et données de site sont bloqués. Ouvrez l'application dans une fenêtre normale et autorisez le stockage pour le site.
