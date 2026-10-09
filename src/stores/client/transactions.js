import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { useSnackbarStore } from '@/stores/shared/snackbar'

export const useAccountTransactionsStore = defineStore('accountTransactions', () => {
  const data = ref([])

  const pagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  })

  const summary = ref({
    net_flow: 0,
    total_credits: 0,
    total_debits: 0,
    total_deposit: 0,
    total_withdrawal: 0,
    total_transactions: 0,
  })

  const filters = ref({
    search: '',
    page: 1,
    per_page: 10,
  })

  const isLoading = ref(false)
  const isFetched = ref(false)
  const currentAccountId = ref(null)

  const snackbar = useSnackbarStore()

  // ─── Fetch Transactions ─────────────────────────────────────
  const fetchTransactions = (accountId, page = filters.value.page, force = false) => {
    if (isFetched.value && !force && currentAccountId.value === accountId && filters.value.page === page) return
    
    currentAccountId.value = accountId
    filters.value.page = page

    isLoading.value = true

    const successHandler = (res) => {
      data.value = res?.data || []

      pagination.value = res?.pagination || {
        page: 1,
        per_page: 10,
        total_items: 0,
        total_pages: 1,
      }

      summary.value = res?.summary || {
        net_flow: 0,
        total_credits: 0,
        total_debits: 0,
        total_deposit: 0,
        total_withdrawal: 0,
        total_transactions: 0,
      }

      isLoading.value = false
      isFetched.value = true
    }

    const failureHandler = (err) => {
      data.value = []

      pagination.value = {
        page: 1,
        per_page: 10,
        total_items: 0,
        total_pages: 1,
      }

      summary.value = {
        net_flow: 0,
        total_credits: 0,
        total_debits: 0,
        total_deposit: 0,
        total_withdrawal: 0,
        total_transactions: 0,
      }

      isLoading.value = false

      snackbar.show(
        err?.message || 'Failed to fetch transactions.',
        'error'
      )
    }

    apiRequest(
      urls.KEYS.GET,
      urls.tradingAccounts.transactions,
      {
        look_up_key: accountId,

        params: {
          page: filters.value.page,
          per_page: filters.value.per_page,
          // search: filters.value.search || undefined,
        },
        
        cancelPrevious: true,

        isTokenRequired: true,

        onSuccess: successHandler,
        onFailure: failureHandler,
      }
    )
  }

  // ─── Apply Filters ─────────────────────────────────────
  const applyFilters = (accountId) => {
    filters.value.page = 1
    fetchTransactions(accountId, 1, true)
  }

  // ─── Reset Store ─────────────────────────────────────
  const reset = () => {
    data.value = []

    pagination.value = {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 1,
    }

    summary.value = {
      net_flow: 0,
      total_credits: 0,
      total_debits: 0,
      total_deposit: 0,
      total_withdrawal: 0,
      total_transactions: 0,
    }

    filters.value = {
      search: '',
      page: 1,
      per_page: 10,
    }

    isLoading.value = false
    isFetched.value = false
    currentAccountId.value = null
  }

  return {
    data,
    pagination,
    summary,

    filters,

    isLoading,

    fetchTransactions,
    applyFilters,
    reset,
  }
})