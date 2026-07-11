import { defineRoutes } from '../core/defineRoutes';

/**
 * Application route definitions.
 *
 * Static paths  →  use directly as strings in <Route path={...} />
 * Dynamic paths →  call .build({ param: value }) to get the resolved URL
 *
 * @example
 * // In your router:
 * <Route path={PATHS.SERVICES.DETAILS} element={<ServiceDetails />} />
 *
 * // When navigating:
 * navigate(PATHS.SERVICES.DETAILS.build({ id: 42 }));
 * navigate(PATHS.SERVICES.BENEFICIARY_CARE_CENTER.EDIT.build({ id: 7 }));
 * navigate(PATHS.ROLES.PERMISSIONS.build({ name: 'admin' }));
 */
export const PATHS = defineRoutes({
  HOME: '/',
  LOGIN: '/login',
  SETTINGS: '/settings',

  SERVICES: {
    ROOT: '/services',
    ADD: '/services/add',
    DETAILS: '/services/:id',
    EDIT: '/services/edit/:id',
    CATEGORIES: '/services/categories',
    BENEFICIARY_CARE_CENTER: {
      ROOT: '/services/beneficiary-care-center',
      ADD: '/services/beneficiary-care-center/add',
      DETAILS: '/services/beneficiary-care-center/:id',
      EDIT: '/services/beneficiary-care-center/edit/:id',
    },
  },

  REQUESTS: {
    ROOT: '/requests',
    ADD: '/requests/add',
    ANALYTICS: '/requests/analytics',
    DETAILS: '/requests/:id',
    BENEFICIARY_CARE_CENTER: '/requests/beneficiary-care-center',
    BENEFICIARY_CARE_CENTER_DETAILS: '/requests/beneficiary-care-center/:id',
    WORKFLOW: '/requests/workflow',
    WORKFLOW_DETAILS: '/requests/workflow/:id',
  },

  USERS: {
    ROOT: '/users',
    ADD: '/users/add',
    EDIT: '/users/edit/:id',
  },

  ROLES: {
    ROOT: '/roles',
    ADD: '/roles/add',
    EDIT: '/roles/edit/:id',
    PERMISSIONS: '/roles/permissions/:name',
  },

  COMPANIES: {
    ROOT: '/companies',
    ADD: '/companies/add',
    EDIT: '/companies/edit/:id',
  },

  ACTIVITIES: {
    ROOT: '/activities',
    ADD: '/activities/add',
    EDIT: '/activities/edit/:id',
  },

  PARTICIPANT: {
    ROOT: '/participant',
    ADD: '/participant/add',
    EDIT: '/participant/edit/:id',
  },

  SATISFACTION_SURVEYS: {
    ROOT: '/satisfaction-surveys',
    STATS: '/satisfaction-surveys/:id',
  },
} as const);

// ─── Usage Examples ──────────────────────────────────────────────────────────
//
// Router setup (React Router v6):
//   <Route path={PATHS.SERVICES.DETAILS} />           → '/services/:id'
//   <Route path={PATHS.ROLES.PERMISSIONS} />          → '/roles/permissions/:name'
//
// Navigation:
//   navigate(PATHS.SERVICES.DETAILS.build({ id: 5 }))
//   navigate(PATHS.ROLES.PERMISSIONS.build({ name: 'admin' }))
//   navigate(PATHS.SERVICES.BENEFICIARY_CARE_CENTER.EDIT.build({ id: 3 }))
//
// Checking param names:
//   PATHS.REQUESTS.WORKFLOW_DETAILS.paramNames   → ['id']
//   PATHS.ROLES.PERMISSIONS.paramNames           → ['name']
