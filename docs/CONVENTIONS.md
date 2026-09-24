# Conventions de code

Squelettes et patterns récurrents du projet. À consulter avant de créer un nouveau
type de fichier ou de composant.

Si tu découvres un pattern récurrent : documente-le ici.

Une section par pattern (`## <Nom du pattern> — squelette`), avec le code minimal
reproductible dans un bloc de code, suivi si besoin d'une sous-section
`### Règles tacites`.

---

## Message de commit — gitmoji

```
<emoji> <message court, au présent, en français>

<corps facultatif : le pourquoi, pas le quoi>

Refs #<issue>        (ou Closes #<issue> pour le commit qui la termine)
```

Exemple : `✨ Ajoute le tirage aléatoire d'une question par catégorie`

### Règles tacites

- Emoji en **Unicode**, jamais en `:shortcode:` : lisible dans `git log`, les terminaux
  et l'interface GitHub sans rendu.
- Un seul emoji, celui de l'intention principale. Si un commit en mériterait deux, c'est
  souvent qu'il faut le découper.
- Emojis les plus courants ici (liste complète : https://gitmoji.dev) :

| Emoji | Usage |
|---|---|
| 🎉 | Premier commit du projet |
| ✨ | Nouvelle fonctionnalité |
| 🐛 | Correction de bug |
| 📝 | Documentation, spec, mémoire projet |
| ✅ | Ajout ou mise à jour de tests |
| ♻️ | Refactoring sans changement de comportement |
| 🎨 | Structure ou format du code |
| 💄 | UI, styles |
| 🌐 | Internationalisation (chaînes fr/en) |
| 🔧 | Fichiers de configuration |
| 👷 | CI (GitHub Actions) |
| 🚀 | Déploiement |
| ⬆️ | Mise à jour de dépendances |
| ➕ / ➖ | Ajout / retrait d'une dépendance |
| 🔥 | Suppression de code ou de fichiers |
| 🗃️ | Schéma de base (Dexie) |
| 🦺 | Validation (schémas Zod) |
| 🚧 | Travail en cours (à éviter sur `main`) |
