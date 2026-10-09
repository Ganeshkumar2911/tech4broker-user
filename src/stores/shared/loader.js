import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoaderStore = defineStore('loader', () => {
  const isLoading = ref(true)
  const title = ref('Loading Panther Capitals...')
  const message = ref('Please wait...')

  let timer = null

  function showLoader(customTitle = 'Loading Panther Capitals...', customMessage = 'Please wait...') {
    if (timer) clearTimeout(timer)
    title.value = customTitle
    message.value = customMessage
    isLoading.value = true
  }

  function hideLoader(delayMs = 400) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      isLoading.value = false
      timer = null
    }, delayMs)
  }

  return {
    isLoading,
    title,
    message,
    showLoader,
    hideLoader,
  }
})
