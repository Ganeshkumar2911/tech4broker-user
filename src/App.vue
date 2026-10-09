<template>
  <div>
    <!-- Single Central Page Loader Component for the entire application -->
    <PageLoader
      :show="loaderStore.isLoading"
      :title="loaderStore.title"
      :message="loaderStore.message"
    />
    <router-view />
    <Snackbar />
    <SupportWidget />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import PageLoader from '@/components/common/PageLoader.vue'
import Snackbar from '@/components/base/snackbar.vue'
import SupportWidget from '@/components/support/SupportWidget.vue'
import { useLoaderStore } from '@/stores/shared/loader'
import { useIdleLogout } from '@/composables/useIdleLogout'

const loaderStore = useLoaderStore()

// Initialize idle logout feature
useIdleLogout()

onMounted(() => {
  // Hide loader after initial app mount and route setup
  loaderStore.hideLoader(500)
})
</script>