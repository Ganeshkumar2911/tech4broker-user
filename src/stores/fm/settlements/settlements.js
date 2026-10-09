import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { useSnackbarStore } from '@/stores/shared/snackbar'
const perPageOptions = [{label: "10", value: 10}, {label: "20", value: 20}, {label: "30", value: 30}, {label: "50", value: 50}, {label: "100", value: 100}]

export const useSettlementsStore = defineStore('settlement', () => {
  // ─── Snackbar ─────────────────────────────────────────
  const snackbar = useSnackbarStore()

  // ─── State ────────────────────────────────────────────
  const records = ref([])
  const currency = ref(null)
  const note = ref('')
  const loading = ref(false)
  const isFetched = ref(false)
  const error = ref(null)

  const summary = reactive({
    broker_net: 0,
    ib_distributed: 0,
    ib_pool: 0,
    total_fees: 0,
  })

  const pagination = reactive({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  })

  // ─── Filters ──────────────────────────────────────────
  const filters = reactive({
    user_id: null,
    trading_account_id: null,
    offer_id: null,
    from_date: null,
    to_date: null,
    amount_view: 'account_units',
  })

  const filterOptions = reactive({
    clients: [],
    trading_accounts: [],
    offers: [],
    amount_view_values: [],
  })

  // ─── Helpers ──────────────────────────────────────────
  const cleanFilters = (payload = {}) => {
    return Object.fromEntries(
      Object.entries(payload).filter(
        ([, value]) =>
          value !== null &&
          value !== undefined &&
          value !== ''
      )
    )
  }

  const buildParams = () => {
    return cleanFilters({
      page: pagination.page,
      per_page: pagination.per_page,

      user_id: filters.user_id,
      trading_account_id: filters.trading_account_id,
      offer_id: filters.offer_id,
      from_date: filters.from_date,
      to_date: filters.to_date,
      amount_view: filters.amount_view,
    })
  }

  // ─── Actions ──────────────────────────────────────────
  const fetchSettlements = (page = pagination.page) => {
    pagination.page = page
    loading.value = true
    error.value = null

    const successHandler = (res) => {
        const dataObj = res?.data

        if (dataObj && Array.isArray(dataObj.records)) {
          records.value = dataObj.records
        } else if (Array.isArray(dataObj)) {
          records.value = dataObj
        } else {
          records.value = []
        }

        currency.value = dataObj?.currency || null
        note.value = dataObj?.note || ''

        const summaryData = dataObj?.summary || res?.summary
        if (summaryData) {
          summary.broker_net = summaryData.broker_net ?? 0
          summary.ib_distributed = summaryData.ib_distributed ?? 0
          summary.ib_pool = summaryData.ib_pool ?? summaryData.ib_distributed ?? 0
          summary.total_fees = summaryData.total_fees ?? 0
        }

        const paginationData = res?.pagination || dataObj?.pagination
        if (paginationData) {
          Object.assign(pagination, paginationData)
        }

        loading.value = false
        isFetched.value = true
      }

    const failureHandler = (err) => {
        loading.value = false
        error.value = err
        snackbar.show(err?.message || 'Failed to fetch settlements', 'error')
      }

    apiRequest(urls.KEYS.GET, urls.settlements.list, {
      params: buildParams(),
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  const fetchFilterOptions = () => {
    const successHandler = (res) => {
        const data = res?.data || {}
        Object.assign(filterOptions, data)
      }

    const failureHandler = (err) => {
        console.error('Failed to fetch filter options:', err)
      }

    apiRequest(urls.KEYS.GET, urls.settlements.filters, {
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  const setPage = (page) => {
    fetchSettlements(page)
  }

  const updatePerPage = (newPerPage) => {
    pagination.per_page = Number(newPerPage)
    pagination.page = 1
    fetchSettlements(1)
  }

  const setAmountView = (viewKey) => {
    filters.amount_view = viewKey
    fetchSettlements(1)
  }

  const applyFilters = () => {
    fetchSettlements(1)
  }

  // ─── Reset ────────────────────────────────────────────
  const reset = () => {
    records.value = []
    currency.value = null
    note.value = ''
    loading.value = false
    isFetched.value = false
    error.value = null

    Object.assign(summary, {
      broker_net: 0,
      ib_distributed: 0,
      ib_pool: 0,
      total_fees: 0,
    })

    Object.assign(pagination, {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 1,
    })

    Object.assign(filters, {
      user_id: null,
      trading_account_id: null,
      offer_id: null,
      from_date: null,
      to_date: null,
      amount_view: 'account_units',
    })
  }

  // ─── Expose ──────────────────────────────────────────
  return {
    records,
    currency,
    note,
    loading,
    isFetched,
    error,

    summary,
    pagination,
    filters,
    filterOptions,
    perPageOptions,

    fetchSettlements,
    fetchFilterOptions,
    setPage,
    updatePerPage,
    setAmountView,
    applyFilters,
    reset,
  }
})

if (typeof window !== "undefined") {
  window.addEventListener("fm-strategy-changed", () => {
    try {
      const store = useSettlementsStore();
      store.reset();
      store.fetchSettlements(1);
    } catch (e) {}
  });
}