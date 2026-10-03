# Politique de sécurité

## Versions prises en charge

Seule la version déployée sur [GitHub Pages](https://adriengras.github.io/questionator-z4000-hyperdrive/) est prise en charge. Il n'y a pas de branche maintenue en parallèle : un correctif est publié sur `main`, puis déployé. L'application ouverte, dans un onglet ou installée, propose la nouvelle version avec son bouton « Recharger ».

## Signaler une faille

**N'ouvrez pas d'issue publique pour une faille de sécurité.**

Utilisez le signalement privé de GitHub : onglet [Security](https://github.com/AdrienGras/questionator-z4000-hyperdrive/security), bouton « Report a vulnerability ». Seul le mainteneur lit le rapport. Décrivez :

- ce que la faille permet ;
- les étapes ou le fichier (config, liste d'étudiants, backup) qui la déclenchent, anonymisés ;
- le navigateur et le système concernés.

Vous recevez une réponse dans ce même fil. Le correctif et la publication de l'avis sont discutés avec vous avant toute divulgation.

## Modèle de menace

Ce qui compte pour juger de la gravité d'un rapport :

- **Application statique.** Il n'y a pas de serveur applicatif : GitHub Pages sert des fichiers, tout s'exécute dans le navigateur.
- **Aucune donnée envoyée.** Les listes d'étudiants, les configs et les notes ne quittent pas l'appareil. Une requête réseau qui emporterait ces données est une faille.
- **Stockage local du navigateur.** Les sessions vivent dans IndexedDB, et quelques préférences et brouillons dans `localStorage`, sur l'appareil de l'examinateur. Quiconque a accès à ce navigateur y a accès : c'est hors du périmètre.
- **Fichiers fournis par l'utilisateur.** Configs, listes d'étudiants et backups sont lus et affichés, et le Markdown des questions est rendu dans la page. Un fichier qui fait exécuter du code ou bloque l'application est une faille. Une image distante dans une question est chargée depuis son URL : c'est voulu, l'auteur de la config la choisit.
