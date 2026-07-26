import { defineConfig } from "vitepress";

export default defineConfig({
  title: "react-routes-forge",
  description: "Type-safe route definitions with automatic path builders for React apps",
  base: "/react-routes-forge/",
  lastUpdated: true,

  themeConfig: {
    logo: false,

    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "API Reference", link: "/api-reference" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is react-routes-forge?", link: "/" },
          { text: "Getting Started", link: "/getting-started" },
        ],
      },
      {
        text: "API Reference",
        items: [
          { text: "defineRoutes", link: "/api-reference#defineroutes" },
          { text: "build (standalone)", link: "/api-reference#build" },
          { text: "isActivePath", link: "/api-reference#isactivepath" },
          { text: "extractParamsFromPath", link: "/api-reference#extractparamsfrompath" },
          { text: "matchPath", link: "/api-reference#matchpath" },
          { text: "joinPaths", link: "/api-reference#joinpaths" },
          { text: "getParamNames", link: "/api-reference#getparamnames" },
          { text: "flattenRoutes", link: "/api-reference#flattenroutes" },
          { text: "getBreadcrumbs", link: "/api-reference#getbreadcrumbs" },
        ],
      },
      {
        text: "React Hooks",
        items: [
          { text: "useRouteParams", link: "/hooks#userouteparams" },
          { text: "useNavigateTo", link: "/hooks#usenavigateto" },
          { text: "useResolvedPath", link: "/hooks#useresolvedpath" },
        ],
      },
      {
        text: "Guides",
        items: [
          { text: "Query String & Hash Support", link: "/query-hash" },
          { text: "Strict Mode", link: "/strict-mode" },
          { text: "Migrating from Old Patterns", link: "/migration" },
          { text: "TypeScript Support", link: "/typescript-support" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/mhsmustafa84/react-routes-forge" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024-present Mostafa Abdelhamid",
    },
  },
});
