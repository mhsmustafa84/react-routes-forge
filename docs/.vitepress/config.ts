import { defineConfig } from "vitepress";

export default defineConfig({
  title: "react-routes-forge",
  description:
    "Type-safe route definitions with automatic path builders for React apps",
  base: "/react-routes-forge/",
  lastUpdated: true,

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "API Reference", link: "/api/define-routes" },
      {
        text: "npm",
        link: "https://www.npmjs.com/package/react-routes-forge",
        target: "_blank",
      },
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
          { text: "defineRoutes", link: "/api/define-routes" },
          { text: "build (standalone)", link: "/api/build" },
          { text: "isActivePath", link: "/api/is-active-path" },
          {
            text: "extractParamsFromPath",
            link: "/api/extract-params-from-path",
          },
          { text: "matchPath", link: "/api/match-path" },
          { text: "joinPaths", link: "/api/join-paths" },
          { text: "getParamNames", link: "/api/get-param-names" },
          { text: "flattenRoutes", link: "/api/flatten-routes" },
          { text: "getBreadcrumbs", link: "/api/get-breadcrumbs" },
          { text: "appendQuery", link: "/api/append-query" },
          {
            text: "extractQueryFromPath",
            link: "/api/extract-query-from-path",
          },
          { text: "devWarn", link: "/api/dev-warn" },
          { text: "clearPathCache", link: "/api/clear-path-cache" },
          { text: "Optional Parameters", link: "/api/optional-parameters" },
          { text: "Known Behaviours & Gotchas", link: "/api/known-behaviours" },
        ],
      },
      {
        text: "React Hooks",
        items: [
          { text: "useRouteParams", link: "/hooks/use-route-params" },
          { text: "useNavigateTo", link: "/hooks/use-navigate-to" },
          { text: "useResolvedPath", link: "/hooks/use-resolved-path" },
          { text: "useActivePath", link: "/hooks/use-active-path" },
          {
            text: "useTypedSearchParams",
            link: "/hooks/use-typed-search-params",
          },
        ],
      },
      {
        text: "Guides",
        items: [
          { text: "Strict Mode", link: "/strict-mode" },
          { text: "Next.js Integration", link: "/nextjs" },
          { text: "Migration", link: "/migration" },
          { text: "TypeScript Support", link: "/typescript-support" },
          { text: "Performance", link: "/performance" },
          { text: "Troubleshooting", link: "/troubleshooting" },
          { text: "Changelog", link: "/changelog" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/mhsmustafa84/react-routes-forge",
      },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024-present Mostafa Abdelhamid",
    },
  },
});
