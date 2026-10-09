<template>
  <div class="flex flex-col h-full text-primary-text min-w-[260px] overflow-hidden select-none relative">
    <!-- Inline Sliding Add Symbol Panel -->
    <Transition name="slide-panel">
      <div v-if="isAddSymbolPanelOpen" class="absolute inset-0 z-20 bg-card-background h-full w-full">
        <AddSymbolPanel @close="isAddSymbolPanelOpen = false" />
      </div>
    </Transition>

    <!-- Main Watchlist Container -->
    <div class="flex flex-col h-full w-full">
      <!-- Watchlist Header & Controls -->
      <WatchlistHeader v-model:searchQuery="searchQuery" @open-add-symbol="isAddSymbolPanelOpen = true"
        @open-create-watchlist="openCreateWatchlist" @open-manage-watchlist="openManageWatchlist" />

      <!-- Table Column Headers -->
      <div
        class="hidden lg:grid  bg-background border-b border-primary-border grid-cols-8 px-3 py-2 text-[11px] font-semibold text-secondary-text shrink-0">
        <div class="col-span-3">Instrument</div>
        <div class="col-span-2 text-center">Bid</div>
        <div class="col-span-3 text-right">Ask</div>
      </div>

      <!-- Scrollable Symbol Rows -->
      <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <!-- Active Watchlist Symbol Rows -->
        <template v-if="filteredSymbols.length > 0">
          <WatchlistSymbolItem v-for="item in filteredSymbols" :key="item.id || item.symbol" :item="item"
            :is-selected="selectedSymbol === item.symbol" @select-symbol="selectSymbol" @remove-symbol="removeSymbol" />
        </template>

        <!-- Loading State -->
        <div v-else-if="watchlistStore.loadingDetail || watchlistStore.loadingWatchlists"
          class="flex flex-col items-center justify-center py-12 text-secondary-text gap-2">
          <Loader2 class="w-5 h-5 animate-spin text-primary" />
          <span class="text-xs">Loading watchlist...</span>
        </div>

        <!-- Empty State -->
        <div v-else
          class="flex flex-col items-center justify-center py-12 px-4 text-center text-secondary-text text-xs gap-2">
          <span class="font-bold text-primary-text">No symbols in this watchlist</span>
          <span class="text-[11px] opacity-70">Click "+ Add" above to add instruments to your watchlist</span>
          <button @click="isAddSymbolPanelOpen = true"
            class="mt-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer">
            + Add Symbols
          </button>
        </div>
      </div>
    </div>

    <!-- Manage / Create Watchlist Modal -->
    <ManageWatchlistModal :is-open="showManageModal" :mode="manageModalMode" @close="showManageModal = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Loader2 } from 'lucide-vue-next'
import { useWatchlistStore } from '@/stores/client/watchlist'
import useOrderStore from '@/stores/client/orders'
import { useChartStore } from '@/stores/client/chart'

import WatchlistHeader from './WatchlistHeader.vue'
import WatchlistSymbolItem from './WatchlistSymbolItem.vue'
import AddSymbolPanel from './AddSymbolPanel.vue'
import ManageWatchlistModal from './ManageWatchlistModal.vue'

const watchlistStore = useWatchlistStore()
const orderStore = useOrderStore()
const chartStore = useChartStore()

const { selectedSymbol } = storeToRefs(orderStore)

const searchQuery = ref('')
const isAddSymbolPanelOpen = ref(false)
const showManageModal = ref(false)
const manageModalMode = ref('manage') // 'create' or 'manage'

const filteredSymbols = computed(() => {
  if (!watchlistStore.activeSymbols) return []
  if (!searchQuery.value.trim()) {
    return watchlistStore.activeSymbols
  }
  const q = searchQuery.value.trim().toLowerCase()
  return watchlistStore.activeSymbols.filter(s => s.symbol.toLowerCase().includes(q))
})

const selectSymbol = (itemOrSymbol) => {
  const symbol = typeof itemOrSymbol === 'string' ? itemOrSymbol : (itemOrSymbol?.symbol || itemOrSymbol)
  if (!symbol) return
  orderStore.selectedSymbol = symbol
  chartStore.openSymbolInTab(symbol)
}

const removeSymbol = async (item) => {
  if (!watchlistStore.activeWatchlistId) return
  try {
    if (item.id) {
      await watchlistStore.removeSymbolById(watchlistStore.activeWatchlistId, item.id)
    } else {
      await watchlistStore.removeSymbolByName(watchlistStore.activeWatchlistId, item.symbol)
    }
  } catch (err) {
    console.error("Failed to remove symbol:", err)
  }
}

const openCreateWatchlist = () => {
  manageModalMode.value = 'create'
  showManageModal.value = true
}

const openManageWatchlist = () => {
  manageModalMode.value = 'manage'
  showManageModal.value = true
}

onMounted(() => {
  watchlistStore.fetchWatchlists().then(() => {
    if (watchlistStore.activeSymbols.length > 0) {
      const defaultSym = chartStore.currentSymbol || selectedSymbol.value || watchlistStore.activeSymbols[0].symbol
      if (!selectedSymbol.value) {
        orderStore.selectedSymbol = defaultSym
      }
      if (chartStore.currentSymbol !== defaultSym) {
        chartStore.openSymbolInTab(defaultSym)
      }
    }
  })
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

/* Sliding animation for AddSymbolPanel inside Watchlist */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.25s ease-in-out, opacity 0.25s ease-in-out;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
