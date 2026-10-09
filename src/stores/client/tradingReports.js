import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { useSnackbarStore } from '@/stores/shared/snackbar'

// "Opening List" / "Close List" tabs -> `side` filter value sent to the API
export const SIDE_TABS = [
    { value: '', label: 'All' },
  { value: 'open', label: 'Opening List' },
  { value: 'closed', label: 'Close List' },
]

// "All" dropdown -> `type` filter value sent to the API
export const TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'BUY', label: 'Buy' },
  { value: 'SELL', label: 'Sell' },
]

export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

export const useTradingReportsStore = defineStore('tradingReports', () => {
  const snackbar = useSnackbarStore()

  // ─── State ───────────────────────────────────────────
  const trades           = ref([])
  const summary           = ref({ total_trades: 0, total_lots: 0, total_pnl: 0 })
  const pagination        = ref({ page: 1, per_page: 10, total_items: 0, total_pages: 0 })
  const filters           = ref({ side: '', type: '', from_date: null, to_date: null, dateRange: 'today' })
  const loading           = ref(false)
  const isFetched         = ref(false)
  const error             = ref(null)
  const selectedAccountId = ref(null)

  // ─── Actions ─────────────────────────────────────────
  const fetchTrades = (accountId = selectedAccountId.value, force = false) => {
    if (!accountId) return
    if (isFetched.value && !force && selectedAccountId.value === accountId) return
    if (loading.value && !force) return

    selectedAccountId.value = accountId
    loading.value = true
    error.value = null

    apiRequest(urls.KEYS.GET, urls.tradingAccounts.accountTrades, {
      look_up_key: accountId,
      isTokenRequired: true,
      params: {
        page: pagination.value.page,
        per_page: pagination.value.per_page,
        side: filters.value.side || undefined,
        type: filters.value.type || undefined,
        from_date: filters.value.from_date || undefined,
        to_date: filters.value.to_date || undefined,
      },
      onSuccess: (res) => {
        trades.value = res?.data ?? []
        summary.value = res?.summary ?? { total_trades: 0, total_lots: 0, total_pnl: 0 }
        pagination.value = res?.pagination ?? pagination.value
        loading.value = false
        isFetched.value = true
      },
      onFailure: (err) => {
        loading.value = false
        error.value = err
        snackbar.show(err?.message || 'Failed to fetch trading reports.', 'error')
      },
    })
  }

  const selectAccount = (accountId) => {
    if (selectedAccountId.value === accountId) return
    pagination.value.page = 1
    fetchTrades(accountId, true)
  }

  const setSide = (side) => {
    if (filters.value.side === side) return
    filters.value.side = side
    pagination.value.page = 1
    fetchTrades(selectedAccountId.value, true)
  }

  const setType = (type) => {
    if (filters.value.type === type) return
    filters.value.type = type
    pagination.value.page = 1
    fetchTrades(selectedAccountId.value, true)
  }

  const setDateRange = (fromDate, toDate) => {
    filters.value.from_date = fromDate || null
    filters.value.to_date = toDate || null
    pagination.value.page = 1
    fetchTrades(selectedAccountId.value, true)
  }

  const setPage = (page) => {
    if (pagination.value.page === page) return
    pagination.value.page = page
    fetchTrades(selectedAccountId.value, true)
  }

  const setPerPage = (perPage) => {
    const val = typeof perPage === 'object' && perPage?.per_page ? perPage.per_page : perPage
    if (pagination.value.per_page === val) return
    pagination.value.per_page = val
    pagination.value.page = 1
    fetchTrades(selectedAccountId.value, true)
  }

  const reset = () => {
    trades.value = []
    summary.value = { total_trades: 0, total_lots: 0, total_pnl: 0 }
    pagination.value = { page: 1, per_page: 10, total_items: 0, total_pages: 0 }
    filters.value = { side: '', type: '', from_date: null, to_date: null }
    loading.value = false
    isFetched.value = false
    error.value = null
    selectedAccountId.value = null
  }

  return {
    // state
    trades,
    summary,
    pagination,
    filters,
    loading,
    error,
    selectedAccountId,
    // actions
    fetchTrades,
    selectAccount,
    setSide,
    setType,
    setDateRange,
    setPage,
    setPerPage,
    reset,
  }
})