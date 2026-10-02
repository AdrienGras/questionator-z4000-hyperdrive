# #74 — Animation du parcours en tête du README — Design

- **Date** : 2026-10-02
- **Ticket** : [#74](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/74)
- **Branche** : `feat/74-animation-readme`
- **Statut** : design validé en conversation, figé ici avant le plan d'implémentation. **Révisé** après la première version (PR #120) : la section « Révision 2 » remplace le cadrage en fenêtre de navigateur et la timeline de 15 s (§1, §2, §4 pour la structure des scènes) ; le reste tient.

## Contexte

Le README s'ouvre sur `banner.webp` (123,7 Ko), une image synthwave fixe : soleil rayé, grille en perspective, titre chromé. Elle donne le nom, pas l'usage. Elle a déjà servi de base au thème « Synthwave » de la config d'exemple (F02) et à l'icône PWA (F17).

Le ticket fixe le format (SVG animé en CSS, sans script ni ressource externe, clair / sombre, < 100 Ko, ~2:1, lisible à 800 px) et le storyboard en six étapes. Cette spec ne reprend que ce que la conversation a tranché en plus.

Existant utile :
- Tokens de thème clair / sombre : `src/index.css` (`--background`, `--foreground`, `--card`, `--muted`, `--muted-foreground`, `--border`, `--radius`).
- Catégories de `examples/config.example.json` : Facile `oklch(0.797 0.134 211.5)` `leaf`, Normal `oklch(0.709 0.159 293.5)` `brand-php`, Difficile `oklch(0.687 0.252 323.9)` `flame`, Cauchemar `oklch(0.758 0.159 55.9)` `skull`.
- Modèle de contrôle scripté : `scripts/check-*.ts` + `scripts/check-*.test.ts`, lancés par `pnpm check`.

Références : `PRODUCT.md` §2, §8 · ticket #74.

## Objectif

Un visiteur du dépôt comprend en ~15 s ce que fait l'application, sans lire le README.

## Révision 2 — scène de salle (2026-10-02)

**Pourquoi** : retour de l'utilisateur sur la première version. On voyait une interface qui s'anime dans une fenêtre, sans comprendre qu'il s'agit d'un **oral** (un étudiant face à un examinateur), qu'il se joue sur **deux écrans** (l'examinateur pilote et note, l'étudiant voit la question projetée), ni le **fonctionnement** (choix de la difficulté → tirage → réponse orale → note → score cumulé). Le cadrage en fenêtre unique avec vignette de projection, recommandé au départ, était le mauvais choix.

**Décisions** (choix de l'utilisateur) :

| Sujet | Décision |
|---|---|
| Mise en scène | Mélange : vue de la salle pour le passage, puis zoom dans l'écran de l'examinateur pour les stats et l'export. |
| Personnages | Simplifiés et expressifs : formes géométriques (tête ronde, buste arrondi) avec quelques détails qui racontent (lunettes et tasse pour l'examinateur, une couleur par étudiant, bulles). Pas de membres articulés. |
| Durée | `--loop: 18s` (1 s = 5,5556 %). |

**Décor de la salle** (une seule scène, sans changement de plan pendant le passage) :
- à gauche, l'examinateur assis derrière un ordinateur portable vu de trois quarts (écran ~280 × 170) ;
- en haut à droite, le grand écran projeté au mur (~560 × 320), toujours sombre (il est éclairé), quel que soit le thème ;
- au centre, la place de l'étudiant, face à l'écran ; les étudiants entrent par la droite et ressortent par la droite ;
- mur, sol et mobilier en variables CSS, clair / sombre comme les tokens de l'app.

**Timeline (boucle de 18 s)** :

| Plage | Moment | Contenu |
|---|---|---|
| 0 – 2 s | Titre | Écran synthwave existant (soleil, grille, titre), raccourci. |
| 2 – 4 s | Préparation | La salle apparaît. `config.json` et `etudiants.csv` volent dans le portable ; les 4 tuiles de catégorie s'allument sur l'écran projeté. |
| 4 – 6 s | L'étudiant choisit | L'étudiant A (couleur `--cat1`) entre et se place. Bulle avec l'icône « flamme » au-dessus de lui ; la tuile Difficile s'allume sur l'écran projeté et sur le portable. |
| 6 – 8,5 s | Tirage et réponse | Sur l'écran projeté, cartes mélangées puis carte question retenue (énoncé seul). Sur le portable, la même question **plus une barre « réponse attendue »** de couleur distincte. L'étudiant répond : bulle « … » animée. |
| 8,5 – 10 s | Note | L'examinateur « clique » une note sur son portable (bouton qui s'allume) ; « +2 » monte au-dessus du portable ; le score s'affiche sur l'écran projeté. |
| 10 – 12 s | Suivants en accéléré | A sort ; B (`--cat2`) puis C (`--cat4`) passent vite : tuile, question, note qui clignotent ; le score se met à jour pour chacun. |
| 12 – 15 s | Zoom : stats | Le portable s'agrandit jusqu'à remplir l'image (`scale` sur son groupe, centré sur son écran), le décor s'efface ; barres par catégorie et courbe de distribution dans l'écran. |
| 15 – 18 s | Export | Un fichier Excel sort de l'écran zoomé ; fondu vers le titre à 17,7 – 18 s. |

**Lisibilité** : personnages ~160 unités de haut ; bulles ≥ 80 unités avec une icône ou « … » ; seuls textes : le titre, « +2 » et le score (≥ 40 unités). Le contenu des écrans est schématique (barres de texte simulées, icônes).

**Structure** : chaque personnage défini une fois dans `<defs>` (`#p-student`, `#p-examiner`), instancié par `<use>`, couleur passée par `color`. Déplacements par `transform` (glissement + léger rebond). Groupes de premier niveau : `ambiance`, `scene-title`, `room` (décor, `examiner`, `laptop`, `projector`, `students`), `zoom` (stats et export dans l'écran agrandi). La fenêtre de navigateur, l'accueil et les scènes 2 à 4 de la première version disparaissent ; on réutilise le titre, les symboles Tabler, les tuiles, les stats et l'export.

**Mouvement réduit** : image fixe de la salle au moment de la note : l'étudiant A en place, la question projetée, la réponse côté portable, le score affiché. (Remplace « scène d'export figée ».)

**Inchangé** : SVG écrit à la main, un fichier, timeline CSS unique sans `animation-delay`, variables CSS, icônes Tabler 3.48.0, `width="1200" height="600"` + `viewBox`, aucun `--` dans un commentaire, < 100 Ko, `check:hero`, texte alternatif (reformulé ci-dessous), mode `<img>`.

**Texte alternatif** (remplace le précédent) : « Animation du principe : un étudiant choisit une difficulté, une question est tirée et projetée sur grand écran, il répond à l'oral pendant que l'examinateur voit la réponse attendue et note sur son ordinateur ; puis on consulte les statistiques et on exporte un fichier Excel. »

## Décisions (D95)

| Sujet | Décision | Raison |
|---|---|---|
| Direction visuelle | Hybride : scène 1 synthwave (soleil rayé, grille en perspective, en géométrie simple), scènes 2-6 en interface épurée aux tokens de l'app | Garde l'identité du banner au moment où l'on présente le nom ; le parcours reste lisible ensuite. Choix de l'utilisateur. |
| Cadrage | Scènes 2-6 dans une fenêtre de navigateur stylisée (barre, trois pastilles, fausse URL) ; vignette « vue projetée » pendant le passage | On voit tout de suite une app web, cohérent avec « tout tourne dans le navigateur ». La vignette évoque la double vue sans charger l'image. Choix de l'utilisateur. |
| Production | SVG écrit à la main, un fichier, une timeline CSS commune (approche A) | Le ticket veut un fichier source unique et modifiable à la main ; un générateur créerait deux sources. SMIL écarté : il faudrait quand même du CSS pour les médias, deux systèmes mêlés. |
| Emplacement | `assets/readme-hero.svg` (nouveau dossier, hors `public/`) | Pas publié avec l'app (ticket). |
| Thème GitHub | Levé en premier par un SVG témoin. Si `prefers-color-scheme` dans `<img>` ne suit pas le thème GitHub, bascule `<picture>` + variante `readme-hero.dark.svg` | Le média d'un SVG-image peut suivre l'OS et non le thème GitHub ; à vérifier sur la vraie page avant de dessiner. |
| Mouvement réduit | Scène 6 (export) figée | Ticket ; image fixe qui résume la fin du parcours. |
| `banner.webp` | Supprimé | Plus aucun usage hors plans et archives historiques, non réécrits. |

## Conception

### 1. Canevas et lisibilité

- `viewBox="0 0 1200 600"`. Fenêtre de navigateur ~1040 × 500, centrée sur le fond d'ambiance.
- Texte : quelques mots seulement, corps ≥ 40 unités (~27 px à 800 px, ~12 px sur mobile à ~360 px). Pas de phrase ; le sens passe par les formes et les icônes.
- Typographie : pile système (`system-ui, sans-serif`), aucune fonte embarquée (budget de poids).

### 2. Timeline (boucle de 15 s)

| Plage | Scène | Contenu |
|---|---|---|
| 0 – 2,5 s | 1. Arrivée (synthwave) | Le soleil rayé se lève sur la grille, le titre apparaît ; la scène se replie dans la fenêtre, qui montre l'accueil et ses cartes d'action. |
| 2,5 – 5 s | 2. Configuration | Icônes `config.json` et `etudiants.csv` glissent dans la fenêtre ; les 4 tuiles de catégorie se forment (couleurs et icônes de l'exemple). |
| 5 – 8,5 s | 3. Passage | File de 4 avatars à gauche ; le premier avance, une tuile pulse, la carte question apparaît puis la réponse se dévoile. Vignette « vue projetée » en bas à droite, qui reprend la question. |
| 8,5 – 11 s | 4. Note | Une note est choisie, le score cumulé s'incrémente (0 → 3 → 5) ; deux autres avatars défilent en accéléré. |
| 11 – 13 s | 5. Stats | Barres par catégorie qui montent, courbe de distribution qui se trace. |
| 13 – 15 s | 6. Export | Une icône Excel sort de la fenêtre vers la droite ; fondu vers la scène 1. |

### 3. Couleurs

- Scène 1 : palette nuit synthwave fixe, quel que soit le thème (écran titre).
- Scènes 2-6 : tokens neutres de `src/index.css`, clair ou sombre, plus les 4 couleurs de catégorie en accent.
- Fond d'ambiance : grille très légère violet / magenta, en faible opacité, derrière la fenêtre.

### 4. Structure du fichier

```
<svg viewBox="0 0 1200 600" role="img" aria-labelledby="t d">
  <title id="t">…</title><desc id="d">…</desc>
  <style>
    variables sur svg : --loop, --bg, --fg, --card, --muted, --border, --cat1..4, --night…
    @media (prefers-color-scheme: dark) { surcharge des variables }
    @keyframes scene-1 … scene-6      (opacité, en % de la boucle)
    @keyframes de mouvements internes (glissement, montée, compteur, tracé)
    @media (prefers-reduced-motion: reduce) { animations coupées ; scène 6 seule visible }
  </style>
  <defs> symboles Tabler, dégradés synthwave </defs>
  <g id="ambiance"> <g id="scene-1"> <g id="window"> chrome + scènes 2 à 6 </g>
</svg>
```

- Une seule durée (`--loop: 15s`). Chaque scène a son keyframe d'opacité, avec des fondus de 0,3 s aux bornes de sa plage ; les mouvements internes partagent la même durée. On ne séquence pas par `animation-delay`, pour que tout reste synchronisé d'un tour à l'autre.
- Aucune couleur en dur dans les scènes 2-6 hors catégories et palette nuit : tout passe par les variables.
- Icônes Tabler en `<symbol>` (`stroke="currentColor"`, `fill="none"`, trait 2), colorées par `color:` sur le `<use>`. La version de Tabler d'où viennent les tracés est notée en commentaire.
- Texte alternatif, dans `<desc>` et dans l'`alt` du README : « Animation du parcours : on charge une config et une liste d'étudiants, chaque étudiant tire une question par catégorie et reçoit une note, puis on consulte les statistiques et on exporte un fichier Excel. »

### 5. Levée de risque du thème (étape 0)

1. Pousser sur la branche un SVG témoin minimal (fond qui change avec `prefers-color-scheme`), affiché par `<img>` dans le README.
2. L'utilisateur regarde la page de la branche sur GitHub en croisant les réglages (OS clair / GitHub sombre, et l'inverse), sur ordinateur et dans l'application mobile.
3. S'il suit le thème GitHub : un seul fichier. Sinon : `<picture>` avec `<source media="(prefers-color-scheme: dark)" srcset="assets/readme-hero.dark.svg">`. `readme-hero.svg` reste la source (version claire par défaut) ; `readme-hero.dark.svg` est le même fichier avec une ligne qui force les variables sombres, et le contrôle vérifie qu'ils ne diffèrent que par cette ligne. Résultat consigné dans D95.

### 6. Contrôle automatique

`scripts/check-readme-hero.ts`, sur le ou les SVG :
- ni `<script>`, ni attribut `on*`, ni `<foreignObject>` ;
- ni `href` ni `url()` vers `http(s)` ;
- poids < 100 Ko ;
- présence de `@media (prefers-reduced-motion: reduce)`.

`scripts/check-readme-hero.test.ts` couvre chaque cas d'échec (écrit d'abord). Script `check:hero` dans `package.json`, ajouté à `pnpm check`, et étape dédiée de la CI (`ci.yml`).

### 7. Vérification visuelle (revue, pas CI)

Script Playwright jetable dans le scratchpad (non commité) : il fige l'animation (`animation-play-state: paused` + `animation-delay` négatif injectés de l'extérieur) et capture les 6 scènes en clair, en sombre et en mouvement réduit. Une planche est montrée à l'utilisateur à chaque itération.

### 8. Intégration

- README : l'animation remplace la ligne du banner, avec l'`alt` ci-dessus.
- Suppression de `banner.webp`.
- BACKLOG : réutiliser le SVG comme en-tête du site de doc (F27, #71).
- Mémoire : `INDEX`, `HANDOFF`, `DECISIONS` (D95) ; `QUIRKS` si le thème GitHub réserve une surprise.

## Critères d'acceptation

Ceux du ticket #74, plus :
- [ ] Le comportement du thème GitHub est vérifié sur la vraie page (étape 0) et la solution retenue est consignée en D95.
- [ ] `pnpm check` lance le contrôle du SVG et passe.

## Hors périmètre

Ceux du ticket (vidéo, MP4, réutilisation dans la doc). Pas de test de non-régression visuelle en CI.
