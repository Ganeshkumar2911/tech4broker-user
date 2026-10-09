import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { useSnackbarStore } from '@/stores/shared/snackbar'

export const useSettlementUserStore = defineStore('settlementUser', () => {
  const snackbar = useSnackbarStore()

  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const amountView = ref('account_units')

  const fetchSettlementUser = (settlementId, userId, view) => {
    if (!settlementId || !userId) return
    if (view) {
      amountView.value = view
    }
    loading.value = true
    error.value = null

    const successHandler = (res) => {
      data.value = res?.data || null
      loading.value = false
    }

    const failureHandler = (err) => {
      loading.value = false
      error.value = err
      snackbar.show(
        err?.message || 'Failed to fetch settlement user details.',
        'error'
      )
    }

    apiRequest(urls.KEYS.GET, urls.settlements.list, {
      look_up_key: `${settlementId}/user/${userId}`,
      params: { amount_view: amountView.value },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  const reset = () => {
    data.value = null
    loading.value = false
    error.value = null
    amountView.value = 'account_units'
  }

  return {
    data,
    loading,
    error,
    amountView,
    fetchSettlementUser,
    reset,
  }
})
