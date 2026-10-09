<template>
  <div class="h-[calc(100vh-60px)] w-full bg-background flex flex-col overflow-hidden relative select-none">
    <!-- Mobile Chart Trading View (Full Height, No Bottom Navbar) -->
    <div class="flex-1 min-h-0 relative overflow-y-auto">
      <MobileChartTradingView class="w-full" />
    </div>

    <!-- Order Placement Mobile Bottom Sheet Backdrop -->
    <div v-if="isOrderModalOpen" @click="orderStore.closeOrderModal()"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" />

    <!-- Mobile Order Placement Bottom Sheet Component -->
    <MobileOrderPlacement v-if="isOrderModalOpen" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import useOrderStore from '@/stores/client/orders'
import { useTradingAccountsStore } from '@/stores/client/tradingAccounts'
import MobileChartTradingView from './MobileChartTradingView.vue'
import MobileOrderPlacement from './MobileOrderPlacement.vue'

const orderStore = useOrderStore()
const tradingAccountStore = useTradingAccountsStore()

const { isOrderModalOpen } = storeToRefs(orderStore)

onMounted(() => {
  if (typeof tradingAccountStore.setPlatformFilter === 'function') {
    tradingAccountStore.setPlatformFilter('real')
  }
  tradingAccountStore.fetchAccounts()
})
</script>

<style scoped></style>
