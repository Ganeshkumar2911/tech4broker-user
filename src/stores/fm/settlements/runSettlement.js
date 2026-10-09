import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import apiRequest from '@/api/request'
import urls from '@/api/urls'

import { useSnackbarStore } from '@/stores/shared/snackbar'

export const useRunSettlementStore = defineStore('runSettlement', () => {
  const snackbar = useSnackbarStore()

  const route = useRoute()
  const settlement = ref(null)
  const loading = ref(false)
  const runLoading = ref(false)
  const error = ref(null)
  const amountView = ref('account_units')

  const fetchSettlement = (view) => {
    if (view) {
      amountView.value = view
    }

    loading.value = true
    error.value = null

    const successHandler = (res) => {
      settlement.value = res?.data || null
      loading.value = false
    }

    const failureHandler = (err) => {
      loading.value = false
      error.value = err

      snackbar.show(
        err?.message || 'Failed to fetch settlement preview.',
        'error'
      )
    }

    apiRequest(urls.KEYS.GET, urls.settlements.preview, {
      params: { amount_view: amountView.value },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  // ─────────────────────────────────────
  // RUN SETTLEMENT
  // ─────────────────────────────────────

  const runSettlement = () => {
    runLoading.value = true

    error.value = null

    const successHandler = (res) => {
      snackbar.show(
        res?.message || 'Settlement executed successfully.',
        'success'
      )

      runLoading.value = false

      fetchSettlement()
    }

    const failureHandler = (err) => {
      runLoading.value = false

      error.value = err

      snackbar.show(
        err?.message || 'Failed to run settlement.',
        'error'
      )
    }

    apiRequest(urls.KEYS.POST, urls.settlements.run, {
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    })
  }

  // ─────────────────────────────────────
  // RESET
  // ─────────────────────────────────────

  const reset = () => {
    settlement.value = null
    loading.value = false
    runLoading.value = false
    error.value = null
    amountView.value = 'account_units'
  }

  return {
    settlement,
    loading,
    runLoading,
    error,
    amountView,

    fetchSettlement,
    runSettlement,
    reset,
  }
})