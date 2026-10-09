import { defineStore } from 'pinia'
import { ref } from 'vue'
import { request, urls } from '@/api'
import { useSnackbarStore } from '@/stores/shared/snackbar'

// NOTE: this store is built against placeholder paths in `urls.funds` --
// swap those for the real endpoints and adjust the response mapping below
// once the Funds API is confirmed (same pattern as `stores/accounts/accounts.js`).
export const useFundsStore = defineStore('funds', () => {
  const snackbar = useSnackbarStore()

  const paymentDetails = ref(null)
  const history = ref([])
  const loading = ref(false)

  function deposit(payload) {
    return request(urls.KEYS.POST, urls.funds.deposit, {
      data: payload,
      onSuccess: () => {
        snackbar.show('Deposit request submitted', 'success')
      },
      onFailure: (err) => snackbar.show(err?.message || 'Deposit failed', 'error'),
    })
  }

  function withdraw(payload) {
    return request(urls.KEYS.POST, urls.funds.withdraw, {
      data: payload,
      onSuccess: () => {
        snackbar.show('Withdrawal request submitted', 'success')
      },
      onFailure: (err) => snackbar.show(err?.message || 'Withdrawal failed', 'error'),
    })
  }

  function transfer(payload) {
    return request(urls.KEYS.POST, urls.funds.transfer, {
      data: payload,
      onSuccess: () => {
        snackbar.show('Transfer completed', 'success')
      },
      onFailure: (err) => snackbar.show(err?.message || 'Transfer failed', 'error'),
    })
  }

  function fetchPaymentDetails() {
    return request(urls.KEYS.GET, urls.funds.paymentDetails, {
      onSuccess: (res) => { paymentDetails.value = res?.data ?? null },
    })
  }

  function fetchHistory(params = {}) {
    loading.value = true
    return request(urls.KEYS.GET, urls.funds.history, {
      params,
      onSuccess: (res) => { history.value = res?.data ?? [] },
      onFailure: (err) => snackbar.show(err?.message || 'Failed to load history', 'error'),
      onFinally: () => { loading.value = false },
    })
  }

  return {
    paymentDetails,
    history,
    loading,
    deposit,
    withdraw,
    transfer,
    fetchPaymentDetails,
    fetchHistory,
  }
})