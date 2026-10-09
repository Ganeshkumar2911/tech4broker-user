import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { useSnackbarStore } from '@/stores/shared/snackbar'

export const useTradingAccountsStore = defineStore('tradingAccounts', () => {
  const data = ref([])
  const summary = ref({
    total_accounts: 0,
    total_balance: 0,
    total_pnl: 0,
  })
  const filters = ref({
    trading_type: 'all',
    account_type: 'all',
  })
  const pagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  })
  const isLoading = ref(false)
  const actionLoading = ref(false)
  const error = ref(null)
  const isFetched = ref(false)
  const paymentMethods = ref([])
  const isPaymentMethodsLoading = ref(false)

  const accountSearchLoading = ref(false)
  const searchedAccounts = ref([])

  const snackbar = useSnackbarStore()

  const normalizeSummary = (payload = {}) => ({
    total_accounts: Number(payload.total_accounts ?? 0) || 0,
    total_balance: Number(payload.total_balance ?? 0) || 0,
    total_pnl: Number(payload.total_pnl ?? 0) || 0,
  })

  const normalizeFilters = (nextFilters = {}) => {
    const tradingType = nextFilters.trading_type ?? filters.value.trading_type ?? 'all'
    let accountType = nextFilters.account_type ?? filters.value.account_type ?? 'all'

    if (tradingType !== 'real') {
      accountType = 'all'
    } else if (!['all', 'demo', 'live'].includes(accountType)) {
      accountType = 'all'
    }

    return {
      trading_type: tradingType,
      account_type: accountType,
    }
  }

  const buildParams = (page, activeFilters) => {
    const params = { page }

    if (activeFilters.trading_type && activeFilters.trading_type !== 'all') {
      params.trading_type = activeFilters.trading_type
    }

    if (
      activeFilters.trading_type === 'real' &&
      activeFilters.account_type &&
      activeFilters.account_type !== 'all'
    ) {
      params.account_type = activeFilters.account_type
    }

    return params
  }

  // ─── Fetch
  const fetchTradingAccounts = (force = false, page = 1, nextFilters = null) => {
    if (isFetched.value && !force) return

    isLoading.value = true
    filters.value = normalizeFilters(nextFilters || filters.value)
    pagination.value.page = page
    const params = buildParams(page, filters.value)

    const successHandler = (res) => {
      data.value = res?.data?.accounts || []
      summary.value = normalizeSummary(res?.data?.summary)
      pagination.value = res?.data?.pagination || pagination.value
      isLoading.value = false
      isFetched.value = true
    }

    const failureHandler = (err) => {
      isLoading.value = false
      error.value = err
      snackbar.show(err?.message || 'Something went wrong.', 'error')
    }

    apiRequest(urls.KEYS.GET, urls.tradingAccounts.list, {
      params,
      cancelPrevious: true,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  const setFilters = (nextFilters = {}) => {
    filters.value = normalizeFilters({
      ...filters.value,
      ...nextFilters,
    })

    fetchTradingAccounts(true, 1)
  }

  const fetchPaymentMethods = (type = 'deposit') => {
    isPaymentMethodsLoading.value = true

    const successHandler = (res) => {
      paymentMethods.value = res?.data || []
      isPaymentMethodsLoading.value = false
    }

    const failureHandler = (err) => {
      isPaymentMethodsLoading.value = false
      snackbar.show(err?.message || 'Something went wrong while fetching payment methods.', 'error')
    }

    apiRequest(urls.KEYS.GET, urls.wallet.paymentMethods, {
      params: { type },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  const handleTransaction = (type, payload, currentBalance = 0, isDemo = false, options = {}) => {
    // Validation for withdraw
    if (!isDemo && type === 'withdraw' && payload.amount > currentBalance) {
      snackbar.show('Amount exceeds balance', 'error')
      return
    }

    actionLoading.value = true

    const url = isDemo
      ? type === 'deposit'
        ? urls.tradingAccounts.demoDeposit
        : urls.tradingAccounts.demoWithdraw
      : type === 'deposit'
        ? urls.tradingAccounts.deposit
        : urls.tradingAccounts.withdraw

    const successHandler = async (res) => {
      actionLoading.value = false

      if (options.onSuccess) {
        options.onSuccess(res)
      }
    }

    const failureHandler = (err) => {
      actionLoading.value = false
      console.log(err)

      if (options.onFailure) {
        options.onFailure(err)
      } else {
        snackbar.show(
          err?.message || 'Something went wrong.',
          'error'
        )
      }
    }

    return apiRequest(
      urls.KEYS.POST,
      url,
      {
        data: payload,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      }
    )
  }

  const fetchWithdrawableBalance = (accountId, options = {}) => {
    const successHandler = (res) => {
      if (options.onSuccess) {
        options.onSuccess(res)
      }
    }

    const failureHandler = (err) => {
      if (options.onFailure) {
        options.onFailure(err)
      } else {
        snackbar.show(
          err?.message || 'Failed to fetch withdrawable balance.',
          'error'
        )
      }
    }

    return apiRequest(
      urls.KEYS.GET,
      urls.tradingAccounts.withdrawable,
      {
        look_up_key: accountId,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      }
    )
  }

  const searchTradingAccounts = (q = '') => {
    accountSearchLoading.value = true

    const successHandler = (res) => {
      searchedAccounts.value = res?.data?.accounts || []
      accountSearchLoading.value = false
    }

    const failureHandler = (err) => {
      accountSearchLoading.value = false
      snackbar.show(
        err?.message || 'Failed to search trading accounts.',
        'error'
      )
    }

    return apiRequest(
      urls.KEYS.GET,
      urls.tradingAccounts.searchAccounts,
      {
        params: {
          q,
        },
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      }
    )
  }

  const internalTransfer = (payload, options = {}) => {
    actionLoading.value = true

    const successHandler = (res) => {
      snackbar.show(
        res?.message || 'Transfer completed successfully.',
        'success'
      )
      actionLoading.value = false
      if (options.onSuccess) {
        options.onSuccess(res)
      }
      fetchTradingAccounts(true, pagination.value?.page || 1)
    }

    const failureHandler = (err) => {
      actionLoading.value = false
      if (options.onFailure) {
        options.onFailure(err)
      } else {
        snackbar.show(
          err?.message || 'Failed to complete transfer.',
          'error'
        )
      }
    }

    return apiRequest(
      urls.KEYS.POST,
      urls.tradingAccounts.internalTransfer,
      {
        data: {
          ...(payload.from_account_id && { from_account_id: payload.from_account_id }),
          to_account_id: payload.to_account_id,
          amount: Number(payload.amount),
        },
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      }
    )
  }

  const updateTradingAccount = (payload) => {
    actionLoading.value = true

    const successHandler = (res) => {
      snackbar.show(
        res?.message || 'Account updated successfully.',
        'success'
      )
      actionLoading.value = false
      fetchTradingAccounts(true, pagination.value?.page || 1)
    }

    const failureHandler = (err) => {
      actionLoading.value = false
      snackbar.show(
        err?.message || 'Failed to update account.',
        'error'
      )
    }

    apiRequest(
      urls.KEYS.POST,
      urls.tradingAccounts.update,
      {
        data: payload,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      }
    )
  }

  const reset = () => {
    data.value = []
    summary.value = {
      total_accounts: 0,
      total_balance: 0,
      total_pnl: 0,
    }
    filters.value = {
      trading_type: 'all',
      account_type: 'all',
    }
    pagination.value = {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    }
    searchedAccounts.value = []
    accountSearchLoading.value = false
    isLoading.value = false
    actionLoading.value = false
    error.value = null
    isFetched.value = false
    paymentMethods.value = []
    isPaymentMethodsLoading.value = false
  }

  return {
    data,
    summary,
    pagination,
    isLoading,
    actionLoading,
    error,
    isFetched,
    filters,
    searchedAccounts,
    accountSearchLoading,
    searchTradingAccounts,
    internalTransfer,
    updateTradingAccount,
    fetchTradingAccounts,
    setFilters,
    handleTransaction,
    fetchWithdrawableBalance,
    reset,
    paymentMethods,
    isPaymentMethodsLoading,
    fetchPaymentMethods,
  }
})
