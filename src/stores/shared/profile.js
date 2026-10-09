import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { useSnackbarStore } from '@/stores/shared/snackbar'

export const useProfileStore = defineStore('user', () => {
  const snackbar = useSnackbarStore()

  // ─── State ───────────────────────────────────────────
  const user              = ref(null)
  const activeRole        = ref(localStorage.getItem('role') || 'client')
  const dashboard         = ref(null)
  const kycToken          = ref(null)
  const loading           = ref(false)
  const dashboardLoading  = ref(false)
  const isFetched         = ref(false)
  const dashboardFetched  = ref(false)
  const error             = ref(null)
  const profileDialogOpen = ref(false)
  const profileDialogMode = ref('profile')

  // ─── Fetch User Profile ──────────────────────────────
  const fetchUserProfile = (force = false) => {
    if (isFetched.value && !force) return Promise.resolve(user.value)

    loading.value = true
    error.value   = null

    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.GET, urls.auth.profile, {
        isTokenRequired: true,
        onSuccess: (res) => {
          user.value      = res || null
          loading.value   = false
          isFetched.value = true

          // Sync theme if provided in user profile response
          const profileData = res?.data || res
          if (profileData && (profileData.theme !== undefined && profileData.theme !== null)) {
            try {
              const { useThemeStore } = require('@/stores/shared/theme')
            } catch (e) {
              // ESM fallback
            }
            import('@/stores/shared/theme').then(({ useThemeStore }) => {
              const themeStore = useThemeStore()
              themeStore.setThemeFromProfile(profileData.theme)
            }).catch(() => {})
          }

          resolve(res)
        },
        onFailure: (err) => {
          loading.value = false
          error.value   = err
          snackbar.show(err?.message || 'Failed to fetch user profile.', 'error')
          reject(err)
        },
      })
    })
  }

  // ─── Get KYC Token ───────────────────────────────────
  const getKycToken = () => {
    return new Promise((resolve, reject) => {
      loading.value = true
      error.value   = null

      apiRequest(urls.KEYS.POST, urls.auth.kycToken, {
        isTokenRequired: true,
        onSuccess: (res) => {
          const token   = res?.token ?? res?.data?.token ?? null
          kycToken.value = token
          loading.value  = false
          resolve(token)
        },
        onFailure: (err) => {
          loading.value = false
          error.value   = err
          snackbar.show(err?.message || 'Failed to initialize KYC.', 'error')
          reject(err)
        },
      })
    })
  }

  // ─── Fetch Dashboard ─────────────────────────────────
  const fetchDashboard = (force = false) => {
    if (dashboardFetched.value && !force) return

    dashboardLoading.value = true
    error.value            = null

    apiRequest(urls.KEYS.GET, urls.dashboard.stats, {
      isTokenRequired: true,
      onSuccess: (res) => {
        dashboard.value        = res?.data || null
        dashboardLoading.value = false
        dashboardFetched.value = true
      },
      onFailure: (err) => {
        dashboardLoading.value = false
        error.value            = err
        snackbar.show(err?.message || 'Failed to fetch dashboard.', 'error')
      },
    })
  }

  // ─── Submit FM Request ───────────────────────────────
  // NOTE: min_capital was missing from the original payload — added here
  const submitFmRequest = (payload) => {
    return new Promise((resolve, reject) => {

      apiRequest(urls.KEYS.POST, urls.auth.fmRequest, {
        data: payload,
        isTokenRequired: true,
        onSuccess: (res) => resolve(res?.data || null),
        onFailure: (err) => {
          snackbar.show(err?.message || 'Failed to submit FM request.', 'error')
          reject(err)
        },
      })
    })
  }

  // ─── Fetch FM Broker Group Details ───────────────────
  const fetchFmGroupDetails = () => {
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.GET, urls.auth.fmGroupDetails, {
        isTokenRequired: true,
        onSuccess: (res) => resolve(res),
        onFailure: (err) => {
          snackbar.show(err?.message || 'Failed to fetch broker group details.', 'error')
          reject(err)
        },
      })
    })
  }

  // ─── Change Password ─────────────────────────────────
  const changePassword = (current_password, new_password) => {
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.POST, urls.auth.changePassword, {
        data: {
          current_password,
          new_password,
        },
        isTokenRequired: true,
        onSuccess: (res) => resolve(res?.data || null),
        onFailure: (err) => {
          snackbar.show(err?.error || 'Failed to change password.', 'error')
          reject(err)
        },
      })
    })
  }

  // ─── Update Profile (PUT /update-profile) ───────────
  const updateUserProfile = (payload, options = {}) => {
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.PUT, urls.auth.updateProfile, {
        data: payload,
        isTokenRequired: true,
        cancelPrevious: options.cancelPrevious ?? true,
        onSuccess: async (res) => {
          const updated = res?.user || res?.data || res
          if (updated && typeof updated === 'object') {
            user.value = { ...user.value, ...updated }
          }
          if (!options.silent) {
            try {
              await fetchUserProfile(true)
            } catch (e) {
              console.error('Error refreshing profile:', e)
            }
            snackbar.show(res?.message || 'Profile updated successfully!', 'success')
          }
          resolve(res)
        },
        onFailure: (err) => {
          if (err?.name === 'CanceledError' || err?.message === 'canceled') return
          if (!options.silent) {
            snackbar.show(err?.message || err?.error || 'Failed to update profile.', 'error')
          }
          reject(err)
        },
      })
    })
  }

  const openProfileDialog = (mode = 'profile') => {
    profileDialogMode.value = mode
    profileDialogOpen.value = true
  }

  const closeProfileDialog = () => {
    profileDialogOpen.value = false
    profileDialogMode.value = 'profile'
  }

  const setActiveRole = (role) => {
    activeRole.value = role
    localStorage.setItem('role', role)
  }

  // ─── Reset ───────────────────────────────────────────
  const reset = () => {
    user.value             = null
    dashboard.value        = null
    kycToken.value         = null
    loading.value          = false
    dashboardLoading.value = false
    isFetched.value        = false
    dashboardFetched.value = false
    error.value            = null
    activeRole.value       = 'client'
  }

  return {
    // state
    user,
    activeRole,
    dashboard,
    kycToken,
    loading,
    dashboardLoading,
    isFetched,
    dashboardFetched,
    error,
    profileDialogOpen,
    profileDialogMode,
    // methods
    fetchUserProfile,
    fetchDashboard,
    getKycToken,
    submitFmRequest,
    fetchFmGroupDetails,
    changePassword,
    updateUserProfile,
    openProfileDialog,
    closeProfileDialog,
    setActiveRole,
    reset,
  }
})
