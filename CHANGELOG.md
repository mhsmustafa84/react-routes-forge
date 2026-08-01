# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.3.0](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.2.0...v1.3.0) (2026-08-01)


### Features

* add hash-aware appendQuery and extractQueryFromPath helpers ([087d961](https://github.com/mhsmustafa84/react-routes-forge/commit/087d9617ecb1f866b983656b1f7732003221320e))
* add number coercion, match path options and cache clearing ([582041b](https://github.com/mhsmustafa84/react-routes-forge/commit/582041b6e19921a43b26302bd0803cc42613c80e))
* add splat (*) segment support across the core API ([893c795](https://github.com/mhsmustafa84/react-routes-forge/commit/893c79591fdd4de602cd0cf4748c394362415fe7))
* add useActivePath and useTypedSearchParams hooks ([b337a9b](https://github.com/mhsmustafa84/react-routes-forge/commit/b337a9bf3d4c5df112de27139c3d6882df542321))
* add useActivePath and useTypedSearchParams hooks ([3e3a1c2](https://github.com/mhsmustafa84/react-routes-forge/commit/3e3a1c2c96d3e7ca572bddb96335e9591e936fe1))
* attach build() to static routes and detect shadowed paths ([9f4e645](https://github.com/mhsmustafa84/react-routes-forge/commit/9f4e6452103add0ea8e8ee13c67a392ce986ef6b))
* export new types and path utilities ([4dd68dc](https://github.com/mhsmustafa84/react-routes-forge/commit/4dd68dc2e3c95b9eff2f6b3e781edcefc565cd9c))
* export RouteTree type for annotating route maps ([d84fb0a](https://github.com/mhsmustafa84/react-routes-forge/commit/d84fb0a376bca069be290f48d3f6bf0ee72d1002))
* infer params from PATHS route in useRouteParams ([2773b2c](https://github.com/mhsmustafa84/react-routes-forge/commit/2773b2cd2171c457bf59c7f6b8a6b2491fc36f3b))
* match NavLink semantics in isActivePath ([03959dc](https://github.com/mhsmustafa84/react-routes-forge/commit/03959dcf3f1efae43111d4d13fcbaa875b96db59))
* support static label map in getBreadcrumbs ([7c02492](https://github.com/mhsmustafa84/react-routes-forge/commit/7c0249229be35caed71e77a4e883ba385fa94c1e))
* validate route templates and warn on duplicate paths ([543577b](https://github.com/mhsmustafa84/react-routes-forge/commit/543577b8069de8d3123045d2ccf9990776d7f974))


### Bug Fixes

* align param parsing with React Router and correct path extraction ([1cb7fc6](https://github.com/mhsmustafa84/react-routes-forge/commit/1cb7fc684c4b5b3efeb3a18c30471e5783008158))
* correct segment matching, optional params, and URL encoding ([5c90b6b](https://github.com/mhsmustafa84/react-routes-forge/commit/5c90b6bb095face9162ac6b403b2af41e60e97b6))
* infer useRouteParams params from route paramNames ([0c99a5f](https://github.com/mhsmustafa84/react-routes-forge/commit/0c99a5f6272892f85b37319bfcb7da924b27cc44))
* keep ExtractParams valid for widened DynamicRoute segments ([2139bce](https://github.com/mhsmustafa84/react-routes-forge/commit/2139bce5f989dea39295333f191972a612b742fa))

## [1.2.0](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.1.3...v1.2.0) (2026-07-26)


### Features

* add getBreadcrumbs utility for deriving breadcrumb trails from route trees ([4dd1ff6](https://github.com/mhsmustafa84/react-routes-forge/commit/4dd1ff669a51e8abc092e09f711807a13be256e8))
* add url hash fragment support (#section) to buildPath and all builders ([9a8eba2](https://github.com/mhsmustafa84/react-routes-forge/commit/9a8eba2d1ba70fec3e0eeab520603c2dd74abb9c))
* expose matchPath as public utility for custom path matching ([ae58f40](https://github.com/mhsmustafa84/react-routes-forge/commit/ae58f404c4af6dd609f1dad6c78cbf1d5d4c5493))


### Bug Fixes

* split regex into two operations to avoid polynomial backtracking ([bb7e9b4](https://github.com/mhsmustafa84/react-routes-forge/commit/bb7e9b48f2e4e43c55f989807720421fdbc55308))

### [1.1.3](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.1.2...v1.1.3) (2026-07-26)

### [1.1.2](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.1.1...v1.1.2) (2026-07-26)

### [1.1.1](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.1.0...v1.1.1) (2026-07-26)


### Bug Fixes

* handle optional param segments (:param?) correctly ([a801029](https://github.com/mhsmustafa84/react-routes-forge/commit/a80102954bc72947dd1900152203c0eaaadf6cb6))

## [1.1.0](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.0.3...v1.1.0) (2026-07-12)


### Features

* add support for query parameters in route building and path resolution ([2078134](https://github.com/mhsmustafa84/react-routes-forge/commit/20781344bd587c94e471133af0520f3a85499927))
* enhance routing utilities with strict mode and flattening support ([7357331](https://github.com/mhsmustafa84/react-routes-forge/commit/7357331b8cdfb861017b5e8135220376ccf83c65))


### Bug Fixes

* implement appendQuery function for improved query parameter handling in path building ([33d602b](https://github.com/mhsmustafa84/react-routes-forge/commit/33d602b7a1b571120ff63866aa2fc4cbf658b42f))

### [1.0.3](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.0.2...v1.0.3) (2026-07-11)

### 1.0.2 (2026-07-11)
