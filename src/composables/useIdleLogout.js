import { onMounted, onUnmounted } from 'vue'
import authToken from '@/common/authToken'
import router from '@/router'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import { useTourStore } from '@/stores/shared/tour'

const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes
const ACTIVITY_STORAGE_KEY = 'panther_last_activity'
const INACTIVITY_LOGOUT_FLAG = 'panther_inactivity_logout'

export function useIdleLogout() {
  let timerId = null
  let isLoggingOut = false
  let lastLocalActivity = Date.now()
  let lastStorageWrite = 0

  const isAuthRoute = (path = window.location.pathname) => {
    return (
      path === '/' ||
      path === '/login' ||
      path.startsWith('/login/') ||
      path === '/auto-login' ||
      path.startsWith('/auto-login/') ||
      path === '/dev-login' ||
      path === '/register' ||
      path.startsWith('/register/') ||
      path === '/forgot-password' ||
      path === '/reset-password' ||
      path === '/two-factor' ||
      path === '/2fa' ||
      path === '/join' ||
      path.startsWith('/join/')
    )
  }

  const recordActivity = () => {
    const now = Date.now()
    lastLocalActivity = now

    // Only update localStorage if user is currently logged in
    const token = authToken.getToken()?.accessToken
    if (token) {
      // Throttle localStorage writes to once every 2 seconds
      if (now - lastStorageWrite > 2000) {
        lastStorageWrite = now
        try {
          localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now))
        } catch (e) {}
      }
    }
  }

  const performInactivityLogout = () => {
    if (isLoggingOut) return
    isLoggingOut = true

    // 1. Stop tour if active
    try {
      useTourStore().stopTour()
    } catch (e) {}

    // 2. Broadcast logout across open tabs
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('my-channel')
        channel.postMessage({ type: 'logout', reason: 'inactivity' })
        channel.close()
      }
    } catch (e) {}

    // 3. Clear auth credentials & storage
    authToken.removeToken()
    try {
      localStorage.removeItem('role')
      localStorage.removeItem(ACTIVITY_STORAGE_KEY)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear()
        sessionStorage.setItem(INACTIVITY_LOGOUT_FLAG, 'true')
      }
    } catch (e) {}

    // 4. Show snackbar notice
    try {
      const snackbar = useSnackbarStore()
      snackbar.show('You have been logged out due to inactivity.', 'info')
    } catch (e) {}

    // 5. Force reliable redirect to login page
    const currentPath = window.location.pathname
    if (!isAuthRoute(currentPath)) {
      window.location.href = '/login'
    } else {
      isLoggingOut = false
    }
  }

  const checkInactivity = () => {
    const token = authToken.getToken()?.accessToken

    // If not logged in
    if (!token) {
      return
    }

    const now = Date.now()
    let lastActive = lastLocalActivity

    try {
      const stored = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY))
      if (stored && !isNaN(stored)) {
        lastActive = Math.max(stored, lastLocalActivity)
      } else {
        localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now))
        lastActive = now
      }
    } catch (e) {}

    const elapsed = now - lastActive
    if (elapsed >= INACTIVITY_TIMEOUT) {
      performInactivityLogout()
    }
  }

  const handleStorageEvent = (event) => {
    if (event.key === ACTIVITY_STORAGE_KEY && event.newValue) {
      const val = Number(event.newValue)
      if (!isNaN(val)) {
        lastLocalActivity = Math.max(lastLocalActivity, val)
      }
    } else if (event.key === 'accessToken' || event.key === null) {
      // Token removed in another tab
      const token = authToken.getToken()?.accessToken
      if (!token && !isAuthRoute()) {
        window.location.href = '/login'
      }
    }
  }

  // Activity listeners
  const activityEvents = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
    'wheel',
    'click',
  ]

  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, recordActivity, { passive: true })
  })

  window.addEventListener('storage', handleStorageEvent)

  // Initialize activity timestamp
  if (authToken.getToken()?.accessToken) {
    recordActivity()
  }

  // Periodic inactivity checker (runs every 1 second)
  timerId = setInterval(checkInactivity, 1000)

  return {
    checkInactivity,
    recordActivity,
    performInactivityLogout,
  }
}
