import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { useSnackbarStore } from '@/stores/shared/snackbar'

export const useAccountTradesStore = defineStore('accountTrades', () => {
  const snackbar = useSnackbarStore()

  // ─── State ─────────────────────────────────────────────
  const data        = ref([])
  const loading     = ref(false)
  const error       = ref(null)

  const summary = ref({
    total_lots: 0,
    total_pnl:  0,
  })

  const pagination = reactive({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0,
  })

  const accountId = ref(null)
  const side = ref(null)
  const isFetched = ref(false)

  // ─── Fetch Trades ──────────────────────────────────────
  const fetchTrades = (id, sideParam, force = false) => {
    if (!id) return
    if (isFetched.value && !force && accountId.value === id && side.value === (sideParam || null)) return

    accountId.value = id
    side.value = sideParam || null
    loading.value   = true

    const successHandler = (res) => {
      data.value = res?.data || []

      if (res?.pagination) {
        Object.assign(pagination, res.pagination)
      }

      if (res?.summary) {
        summary.value = res.summary
      }

      loading.value   = false
      isFetched.value = true
    }

    const failureHandler = (err) => {
      loading.value = false
      error.value   = err
      snackbar.show(err?.message || 'Failed to fetch trades', 'error')
    }

    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
    }

    if (sideParam) {
      params.side = sideParam
    }

    apiRequest(urls.KEYS.GET, urls.tradingAccounts.accountTrades, {
      look_up_key: id,
      params,
      cancelPrevious: true,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  // ─── Pagination ────────────────────────────────────────
  const setPage = (page, sideParam) => {
    pagination.page = page
    fetchTrades(accountId.value, sideParam === undefined ? side.value : sideParam, true)
  }

  // ─── Reset ─────────────────────────────────────────────
  const reset = () => {
    data.value      = []
    loading.value   = false
    error.value     = null
    isFetched.value = false

    summary.value = {
      total_lots: 0,
      total_pnl:  0,
    }

    Object.assign(pagination, {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 0,
    })

    accountId.value = null
    side.value = null
  }

  return {
    data,
    loading,
    error,
    pagination,
    summary,

    fetchTrades,
    setPage,
    reset,
  }
})
