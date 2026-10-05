import { defineConfig } from 'vitepress'

/** Préfixe de publication : la doc vit sous `/docs/` de l'app sur GitHub Pages (F27). */
const base = '/questionator-z4000-hyperdrive/docs/'

/** Adresse de l'application, utilisée dans le menu et sur l'accueil. */
const urlApp = 'https://adriengras.github.io/questionator-z4000-hyperdrive/'

/** Adresse du dépôt, pour le lien GitHub de la barre de navigation. */
const urlDepot = 'https://github.com/AdrienGras/questionator-z4000-hyperdrive'

/**
 * Libellés français de la boîte de recherche locale.
 * Toutes les clés exposées par `LocalSearchTranslations` sont traduites : le
 * thème par défaut est en anglais sinon.
 */
const translations = {
  button: {
    buttonText: 'Rechercher',
    buttonAriaLabel: 'Rechercher dans la documentation',
  },
  modal: {
    displayDetails: 'Afficher la liste détaillée',
    resetButtonTitle: 'Réinitialiser la recherche',
    backButtonTitle: 'Fermer la recherche',
    noResultsText: 'Aucun résultat pour',
    footer: {
      selectText: 'sélectionner',
      selectKeyAriaLabel: 'entrée',
      navigateText: 'naviguer',
      navigateUpKeyAriaLabel: 'flèche du haut',
      navigateDownKeyAriaLabel: 'flèche du bas',
      closeText: 'fermer',
      closeKeyAriaLabel: 'échap',
    },
  },
}

export default defineConfig({
  lang: 'fr',
  title: 'Questionator Z-4000 Hyperdrive',
  description: 'Faire passer des oraux notés par tirage de questions.',
  base,
  // Relatif à `site/` : la doc est servie sous `dist/docs/`, à côté de l'app.
  // Elle se construit après `vite build`, qui vide `dist/`.
  outDir: '../dist/docs',
  // `ignoreDeadLinks` reste volontairement absent : un lien interne mort fait
  // échouer `docs:build`.
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }]],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/prise-en-main', activeMatch: '/guide/' },
      { text: 'Contribuer', link: '/contribuer/installer', activeMatch: '/contribuer/' },
      { text: 'Application', link: urlApp },
    ],
    socialLinks: [{ icon: 'github', link: urlDepot }],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Prise en main', link: '/guide/prise-en-main' },
            { text: 'Préparer les fichiers', link: '/guide/preparer-les-fichiers' },
            { text: 'Référence de la config', link: '/guide/reference-config' },
            { text: 'Éditeur de config', link: '/guide/editeur-config' },
            { text: 'Créer, reprendre et importer une session', link: '/guide/sessions' },
            { text: 'Faire passer un oral', link: '/guide/faire-passer' },
            { text: "S'entraîner seul", link: '/guide/s-entrainer' },
            { text: 'Projeter', link: '/guide/projeter' },
            { text: 'Statistiques et export Excel', link: '/guide/stats-export' },
            { text: 'Hors ligne et installation', link: '/guide/hors-ligne' },
            { text: 'FAQ et dépannage', link: '/guide/depannage' },
          ],
        },
      ],
      '/contribuer/': [
        {
          text: 'Contribuer',
          items: [
            { text: 'Installer le poste', link: '/contribuer/installer' },
            { text: 'Architecture', link: '/contribuer/architecture' },
            { text: 'Conventions', link: '/contribuer/conventions' },
            { text: 'Workflow', link: '/contribuer/workflow' },
            { text: 'Tests', link: '/contribuer/tests' },
            { text: 'Décisions', link: '/contribuer/decisions' },
            { text: 'Travailler avec Claude Code', link: '/contribuer/claude-code' },
          ],
        },
      ],
    },
    editLink: {
      pattern: `${urlDepot}/edit/main/site/:path`,
      text: 'Modifier cette page sur GitHub',
    },
    search: { provider: 'local', options: { translations } },
    // Libellés vérifiés contre `DefaultTheme.Config` (node_modules/vitepress/types/default-theme.d.ts) :
    // à refaire à chaque montée de version de VitePress.
    outline: { label: 'Sur cette page' },
    docFooter: { prev: 'Page précédente', next: 'Page suivante' },
    darkModeSwitchLabel: 'Apparence',
    lightModeSwitchTitle: 'Passer en mode clair',
    darkModeSwitchTitle: 'Passer en mode sombre',
    sidebarMenuLabel: 'Menu',
    navMenuLabel: 'Navigation principale',
    mobileMenuLabel: 'Menu',
    extraMenuLabel: 'Plus d’options',
    returnToTopLabel: 'Retour en haut',
    langMenuLabel: 'Changer de langue',
    skipToContentLabel: 'Aller au contenu',
    notFound: {
      title: 'Page introuvable',
      quote: 'Cette page n’existe pas ou a changé d’adresse.',
      linkText: 'Retour à l’accueil',
      linkLabel: 'Retour à l’accueil de la documentation',
    },
  },
})
