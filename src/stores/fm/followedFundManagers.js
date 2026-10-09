import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

import apiRequest from '@/api/request'
import urls from '@/api/urls'

import { useSnackbarStore } from '@/stores/shared/snackbar'

export const useFollowedFundManagersStore = defineStore(
  'followedFundManagers',
  () => {
    // ─────────────────────────────────────
    // Snackbar
    // ─────────────────────────────────────

    const snackbar = useSnackbarStore()

    // ─────────────────────────────────────
    // State
    // ─────────────────────────────────────

    const records = ref([])

    const loading = ref(false)

    const error = ref(null)

    const isFetched = ref(false)

    // ─────────────────────────────────────
    // Filters
    // ─────────────────────────────────────

    const filters = reactive({
      search: '',
      status: '',
    })

    // ─────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────

    const pagination = reactive({
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 1,
    })

    // ─────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────

    const cleanFilters = () =>
      Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) =>
            value !== null &&
            value !== '' &&
            value !== undefined
        )
      )

    // ─────────────────────────────────────
    // Fetch Followed Fund Managers
    // ─────────────────────────────────────

    const fetchFollowedFundManagers = (
      force = false
    ) => {
      if (isFetched.value && !force) return

      loading.value = true

      error.value = null

      const successHandler = (res) => {
        records.value = res?.data || []

        Object.assign(pagination, {
          page: res?.pagination?.page || 1,
          per_page: res?.pagination?.per_page || 10,
          total_items:
            res?.pagination?.total_items || 0,
          total_pages:
            res?.pagination?.total_pages || 1,
        })

        isFetched.value = true

        loading.value = false
      }

      const failureHandler = (err) => {
        loading.value = false

        error.value = err

        snackbar.show(
          err?.message ||
          'Failed to fetch followed fund managers.',
          'error'
        )
      }

      apiRequest(
        urls.KEYS.GET,
        urls.followedFundManagers.list,
        {
          params: {
            page: pagination.page,
            per_page: pagination.per_page,

            ...cleanFilters(),
          },

          isTokenRequired: true,

          onSuccess: successHandler,
          onFailure: failureHandler,
        }
      )
    }

    // ─────────────────────────────────────
    // Filters
    // ─────────────────────────────────────

    const applyFilters = (newFilters) => {
      if (newFilters) {
        Object.assign(filters, newFilters)
      }

      pagination.page = 1

      isFetched.value = false

      fetchFollowedFundManagers(true)
    }

    const resetFilters = () => {
      Object.assign(filters, {
        search: '',
        status: '',
      })

      applyFilters()
    }

    // ─────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────

    const setPage = (page) => {
      pagination.page = page

      isFetched.value = false

      fetchFollowedFundManagers(true)
    }

    // ─────────────────────────────────────
    // Action State
    // ─────────────────────────────────────

    const actionLoading = ref(false)

    // ─────────────────────────────────────
    // Update Lot Value
    // ─────────────────────────────────────

    const updateLotValue = (idOrPayload, dataOrOnDone, onDone) => {
      let id, data, callback

      if (typeof idOrPayload === 'object' && idOrPayload !== null) {
        id = idOrPayload.id || idOrPayload.look_up_key
        data = {
          lot_type: idOrPayload.lot_type,
          lot_value: Number(idOrPayload.lot_value),
        }
        callback = typeof dataOrOnDone === 'function' ? dataOrOnDone : onDone
      } else {
        id = idOrPayload
        data = dataOrOnDone
        callback = onDone
      }

      actionLoading.value = true

      const successHandler = (res) => {
        actionLoading.value = false
        snackbar.show('Lot settings updated successfully.', 'success')
        fetchFollowedFundManagers(true)
        callback?.(res)
      }

      const failureHandler = (err) => {
        actionLoading.value = false
        snackbar.show(
          err?.message || err?.error || 'Failed to update lot value.',
          'error'
        )
      }

      apiRequest(urls.KEYS.PUT, urls.followedFundManagers.edit, {
        look_up_key: id,
        data,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      })
    }

    // ─────────────────────────────────────
    // Reset
    // ─────────────────────────────────────

    const reset = () => {
      records.value = []

      loading.value = false
      actionLoading.value = false

      error.value = null

      isFetched.value = false

      Object.assign(filters, {
        search: '',
        status: '',
      })

      Object.assign(pagination, {
        page: 1,
        per_page: 10,
        total_items: 0,
        total_pages: 1,
      })
    }

    return {
      // state
      records,

      loading,
      actionLoading,
      error,
      isFetched,

      filters,
      pagination,

      // methods
      fetchFollowedFundManagers,
      updateLotValue,

      applyFilters,
      resetFilters,

      setPage,

      reset,
    }
  }
)