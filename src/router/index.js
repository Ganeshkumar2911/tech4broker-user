import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import authToken from '@/common/authToken'
import { useProfileStore } from '@/stores/shared/profile'
import { useLoaderStore } from '@/stores/shared/loader'
import { useTourStore } from '@/stores/shared/tour'
import { getSafeRedirectPath } from '@/utils/security'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function hasData(val) {
  if (!val) return false
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === 'object') return Object.keys(val).length > 0
  return true
}

function getFmStatus(user) {
  const userData = user?.data || user
  const { fm_info, fm_request } = userData || {}
  const hasFmInfo = hasData(fm_info)
  const hasFmReq = hasData(fm_request)

  if (
    hasFmInfo ||
    fm_request?.status === 'approved' ||
    userData?.is_fund_manager ||
    userData?.is_fm ||
    userData?.role === 'fm'
  ) {
    return 'approved'
  }
  if (fm_request?.status === 'rejected') return 'rejected'
  if (hasFmReq) return 'pending'
  return 'incomplete'
}

router.beforeEach(async (to, from) => {
  const customApi = to.query.api || to.query.base_url || to.query.backend_url
  if (customApi) {
    const cleanApi = String(customApi)
      .trim()
      .replace(/\/+$/, '')
      .replace(/\/(client|fm|ib|admin)$/, '')
    if (cleanApi) {
      localStorage.setItem('custom_base_url', cleanApi)
    }
  }

  const getDashboardPath = (userRole) => {
    if (userRole === 'fm') return '/fm-dashboard'
    if (userRole === 'ib') return '/ib-dashboard'
    return '/dashboard'
  }

  // ─── Helper for Auth Routes ─────────────────────────────────
  const isAuthRoutePath = (path) => {
    return (
      path === '/' ||
      path === '/login' ||
      (path.startsWith('/login/') && !path.startsWith('/login/join/')) ||
      path === '/auto-login' ||
      path.startsWith('/auto-login/') ||
      path === '/dev-login' ||
      path === '/register' ||
      path.startsWith('/register/') ||
      path === '/forgot-password' ||
      path === '/fm-login' ||
      path === '/fm-register' ||
      path.startsWith('/fund-manager/') ||
      path === '/reset-password' ||
      path === '/two-factor' ||
      path === '/2fa' ||
      path === '/two-factor-auth' ||
      path === '/verify-2fa' ||
      path === '/login/2fa' ||
      path === '/login-2fa'
    )
  }

  // ─── URL Token Auto-Login Check ────────────────────────────
  const queryToken =
    to.query.token ||
    to.query.secret ||
    to.query.code ||
    to.query.key ||
    to.query.access_token ||
    to.query.auth_token

  if (queryToken) {
    const customApi = to.query.api || to.query.base_url || to.query.backend_url
    if (customApi) {
      const cleanApi = String(customApi)
        .trim()
        .replace(/\/+$/, '')
        .replace(/\/(client|fm|ib|admin)$/, '')
      if (cleanApi) {
        localStorage.setItem('custom_base_url', cleanApi)
      }
    }

    const rawToken = String(queryToken).trim()
    const rawRedirect = to.query.redirect
    let sanitizedRedirect = getSafeRedirectPath(rawRedirect)
    if (sanitizedRedirect && (isAuthRoutePath(sanitizedRedirect) || sanitizedRedirect === '/login/user')) {
      sanitizedRedirect = null
    }

    const queryRole = String(to.query.role || '').toLowerCase() === 'fm' ? 'fm' : 'client'

    // 1) If it is already a valid 3-part JWT token, set token and navigate directly
    if (rawToken && rawToken.split('.').length === 3) {
      authToken.setToken(rawToken)
      localStorage.setItem('role', queryRole)

      const cleanQuery = { ...to.query }
      delete cleanQuery.token
      delete cleanQuery.secret
      delete cleanQuery.code
      delete cleanQuery.key
      delete cleanQuery.access_token
      delete cleanQuery.auth_token
      delete cleanQuery.role
      delete cleanQuery.redirect

      const finalPath = sanitizedRedirect || getDashboardPath(queryRole)

      return {
        path: finalPath,
        query: Object.keys(cleanQuery).length ? cleanQuery : {},
        replace: true,
      }
    } else if (rawToken) {
      // 2) If it is a secret code (not a 3-part JWT) and we are not on /login/user yet:
      if (to.name !== 'login-user' && to.path !== '/login/user' && to.path !== '/reset-password') {
        const queryParams = {
          token: rawToken,
          redirect: sanitizedRedirect || getDashboardPath(queryRole),
        }
        if (to.query.role) queryParams.role = to.query.role
        if (to.query.api) queryParams.api = to.query.api
        if (to.query.base_url) queryParams.base_url = to.query.base_url
        if (to.query.backend_url) queryParams.backend_url = to.query.backend_url

        return {
          path: '/login/user',
          query: queryParams,
          replace: true,
        }
      }
    }
  }

  const token = authToken.getToken()?.accessToken
  const role = localStorage.getItem('role') || 'client'

  const authRouteNames = [
    'login',
    'login-user',
    'dev-login',
    'register',
    'forgot-password',
    'reset-password',
    'two-factor',
  ]
  const isAuthRoute = authRouteNames.includes(to.name) || isAuthRoutePath(to.path)

  // Always forcefully stop tour and reset dark class if unauthenticated or on auth routes
  if (!token || isAuthRoute) {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark')
    }
    try {
      useTourStore().stopTour()
    } catch (e) {}
  }

  // Public routes that can be accessed without auth (e.g. join-offer link)
  const isPublicRoute =
    isAuthRoute ||
    to.name === 'join-offer' ||
    to.path.startsWith('/join/') ||
    to.path.startsWith('/login/join/')

  // If navigating to root path '/'
  if (to.path === '/') {
    if (token) {
      return getDashboardPath(role)
    } else {
      return '/login'
    }
  }

  // If user is already logged in and attempts to open an auth-only route (login/register/reset-password)
  if (token && isAuthRoute) {
    const hasIncomingSecret = Boolean(
      to.query.token ||
        to.query.secret ||
        to.query.code ||
        to.query.key ||
        to.query.access_token ||
        to.query.auth_token
    )
    if (to.path === '/login/user' && hasIncomingSecret) {
      // Allow secret-login.vue to handle switching the user session!
    } else {
      return getDashboardPath(role)
    }
  }

  // If user is not logged in and attempts to open a protected route
  if (!token && !isPublicRoute) {
    return { path: '/login' }
  }

  // Validate module route access based on active role (e.g. client/ib cannot access FM routes)
  const targetModuleRole = to.matched.find((record) => record.meta?.role)?.meta?.role
  const isFmRoute =
    targetModuleRole === 'fm' ||
    (to.path.startsWith('/fm-') &&
      !to.path.startsWith('/fm-copy-trading-profile') &&
      to.path !== '/fm-login' &&
      to.path !== '/fm-register') ||
    to.path === '/register-fm' ||
    to.path.startsWith('/followers') ||
    to.path.startsWith('/your-wallet')

  if (token && role !== 'fm' && isFmRoute) {
    return getDashboardPath(role)
  }

  // Seamlessly auto-sync active role between Client & IB routes for authorized users
  if (token && (targetModuleRole === 'client' || targetModuleRole === 'ib')) {
    const profileStore = useProfileStore()
    if (!profileStore.isFetched) {
      try {
        await profileStore.fetchUserProfile()
      } catch (err) {
        console.error('Failed to fetch profile in router guard:', err)
      }
    }

    const userData = profileStore.user?.data || profileStore.user
    const isIbUser = userData?.is_ib === true || userData?.role === 'ib'

    if (targetModuleRole === 'ib' && !isIbUser) {
      return getDashboardPath(role)
    }

    // Automatically synchronize active role if navigating between Client and IB routes
    if (role !== targetModuleRole) {
      localStorage.setItem('role', targetModuleRole)
      profileStore.setActiveRole(targetModuleRole)
    }
  } else if (token && targetModuleRole && targetModuleRole !== role) {
    return getDashboardPath(role)
  }

  // For logged in FM user, check profile FM registration status
  if (token && role === 'fm') {
    const profileStore = useProfileStore()
    if (!profileStore.isFetched) {
      try {
        await profileStore.fetchUserProfile()
      } catch (err) {
        console.error('Failed to fetch profile in router guard:', err)
      }
    }

    const fmStatus = getFmStatus(profileStore.user)

    // If FM registration is not approved yet (incomplete, pending, or rejected), keep user on /register-fm
    if (fmStatus !== 'approved' && to.path !== '/register-fm') {
      return '/register-fm'
    }

    // If FM registration is approved and user visits /register-fm, redirect to /fm-dashboard
    if (fmStatus === 'approved' && to.path === '/register-fm') {
      return '/fm-dashboard'
    }
  }
})

router.afterEach(() => {
  // Hide global page loader smoothly after navigation completes
  const loaderStore = useLoaderStore()
  loaderStore.hideLoader(500)
})

export default router