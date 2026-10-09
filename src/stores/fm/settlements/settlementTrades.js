import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { useSnackbarStore } from '@/stores/shared/snackbar'
const perPageOptions = [{label: "10", value: 10}, {label: "20", value: 20}, {label: "30", value: 30}, {label: "50", value: 50}, {label: "100", value: 100}]

export const useSettlementTradesStore = defineStore('settlementTrades', () => {
  // ─── Snackbar ────────────────────────────────────────
  const snackbar = useSnackbarStore()

  // ─── State ───────────────────────────────────────────
  const records = ref([])
  const loading = ref(false)
  const error = ref(null)

  const settlement = reactive({
    settlement_id: null,
    fm_id: null,
    fm_name: null,
    total_fee: 0,
    total_pnl: 0,
    created_at: null,
    status: null,
  })

  const summary = reactive({
    total_trades: 0,
    total_pnl: 0,
    net_pnl: 0,
    total_fee: 0,
  })

  const pagination = reactive({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  })

  const filters = reactive({
    user_id: null,
    trading_account_id: null,
  })

  const filterOptions = reactive({
    clients: [],
    trading_accounts: [],
  })

  // ─── Fetch Trades ────────────────────────────────────
  const fetchTrades = (id) => {
    if (!id) return

    loading.value = true
    error.value = null

    const successHandler = (res) => {
      const dataObj = res?.data || res
      records.value = Array.isArray(dataObj?.records)
        ? dataObj.records
        : Array.isArray(res?.records)
        ? res.records
        : Array.isArray(dataObj)
        ? dataObj
        : []

      const settlementObj = dataObj?.settlement || res?.settlement || {}
      Object.assign(settlement, {
        settlement_id: settlementObj?.settlement_id ?? id,
        fm_id: settlementObj?.fm_id || null,
        fm_name: settlementObj?.fm_name || null,
        total_fee: settlementObj?.total_fee || settlementObj?.gross_fee || 0,
        total_pnl: settlementObj?.total_pnl || settlementObj?.net_profit || 0,
        created_at: settlementObj?.created_at || settlementObj?.executed_at || null,
        status: settlementObj?.status || null,
      })

      const summaryObj = dataObj?.summary || res?.summary || {}
      Object.assign(summary, {
        total_trades: summaryObj?.total_trades || records.value.length || 0,
        total_pnl: summaryObj?.total_pnl ?? settlementObj?.total_pnl ?? 0,
        net_pnl: summaryObj?.net_pnl ?? summaryObj?.total_pnl ?? 0,
        total_fee: summaryObj?.total_fee ?? settlementObj?.total_fee ?? 0,
      })

      const paginationObj = res?.pagination || dataObj?.pagination || {}
      Object.assign(pagination, {
        page: paginationObj?.page || 1,
        per_page: paginationObj?.per_page || 10,
        total_items: paginationObj?.total_items || records.value.length,
        total_pages: paginationObj?.total_pages || 1,
      })

      loading.value = false
    }

    const failureHandler = (err) => {
      loading.value = false
      error.value = err

      snackbar.show(
        err?.message || 'Failed to fetch settlement trades.',
        'error'
      )
    }

    apiRequest(urls.KEYS.GET, urls.settlements.trades, {
      look_up_key: id,
      params: {
        page: pagination.page,
        per_page: pagination.per_page,
        user_id: filters.user_id,
        trading_account_id: filters.trading_account_id,
      },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  const fetchFilterOptions = () => {
    const successHandler = (res) => {
        const data = res?.data || {}
        filterOptions.clients = data.clients || []
        filterOptions.trading_accounts = data.trading_accounts || []
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

  // ─── Pagination ──────────────────────────────────────
  const setPage = (id, page) => {
    pagination.page = page
    fetchTrades(id)
  }

  const updatePerPage = (id, newPerPage) => {
    pagination.per_page = Number(newPerPage)
    pagination.page = 1
    fetchTrades(id)
  }

  // ─── Reset ───────────────────────────────────────────
  const reset = () => {
    records.value = []
    loading.value = false
    error.value = null

    Object.assign(settlement, {
      settlement_id: null,
      fm_id: null,
      fm_name: null,
      total_fee: 0,
      total_pnl: 0,
      created_at: null,
      status: null,
    })

    Object.assign(summary, {
      total_trades: 0,
      total_pnl: 0,
      net_pnl: 0,
      total_fee: 0,
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
    })
  }

  return {
    records,
    loading,
    error,

    settlement,
    summary,
    pagination,
    filters,
    filterOptions,
    perPageOptions,

    fetchTrades,
    fetchFilterOptions,
    setPage,
    updatePerPage,
    reset,
  }
})
