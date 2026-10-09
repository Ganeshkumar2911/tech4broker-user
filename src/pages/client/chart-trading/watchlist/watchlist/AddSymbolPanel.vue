<template>
  <div class="flex flex-col h-full bg-card-background text-primary-text select-none overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between p-2.5 border-b border-primary-border bg-background/50 shrink-0">
      <div class="flex items-center gap-2">
        <button
          @click="$emit('close')"
          class="p-1 hover:bg-card-background text-secondary-text hover:text-primary-text rounded-md transition-colors cursor-pointer"
          title="Back to Watchlist"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <span class="text-xs font-bold text-primary-text">Add Symbol</span>
      </div>
      <button
        @click="$emit('close')"
        class="p-1 hover:bg-card-background text-secondary-text hover:text-primary-text rounded-md transition-colors cursor-pointer"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Search Input Bar -->
    <div class="p-2.5 border-b border-primary-border bg-background/30 shrink-0">
      <BaseSearch
        v-model="searchQuery"
        placeholder="Search symbols (e.g. XAUUSD, BTC)..."
        height="32px"
        rounded="lg"
        variant="background"
        container-class="w-full"
        @update:modelValue="handleSearchInput"
        @clear="handleSearchInput"
      />
    </div>

    <!-- Symbols Catalog Search Results -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-1.5 min-h-0 flex flex-col gap-1">
      <div
        v-for="sym in watchlistStore.catalogSymbols"
        :key="sym.id || sym.symbol"
        class="flex items-center justify-between p-2 hover:bg-background/80 rounded-lg transition-all group"
      >
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-bold text-primary-text leading-tight">{{ sym.symbol }}</span>
          <span class="text-[10px] text-secondary-text truncate">{{ sym.name || sym.category }}</span>
        </div>

        <button
          @click="addSymbol(sym.symbol)"
          :disabled="isAlreadyInWatchlist(sym.symbol) || addingSymbol === sym.symbol"
          class="p-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 active:scale-95"
          :title="isAlreadyInWatchlist(sym.symbol) ? 'Already in watchlist' : 'Add to watchlist'"
        >
          <Loader2 v-if="addingSymbol === sym.symbol" class="w-3.5 h-3.5 animate-spin" />
          <Check v-else-if="isAlreadyInWatchlist(sym.symbol)" class="w-3.5 h-3.5 text-primary-green" />
          <Plus v-else class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="watchlistStore.loadingCatalog" class="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
        <Loader2 class="w-5 h-5 animate-spin text-primary" />
        <span class="text-xs">Searching symbols...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!watchlistStore.loadingCatalog && watchlistStore.catalogSymbols.length === 0"
        class="flex flex-col items-center justify-center py-10 text-secondary-text text-xs gap-1"
      >
        <span class="font-medium">No symbols found</span>
        <span class="text-[10px] opacity-70">Try searching for another symbol</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowLeft, X, Plus, Check, Loader2 } from 'lucide-vue-next'
import BaseSearch from '@/components/base/BaseSearch.vue'
import { useWatchlistStore } from '@/stores/client/watchlist'

const emit = defineEmits(['close'])

const watchlistStore = useWatchlistStore()

const searchQuery = ref('')
const addingSymbol = ref(null)

let searchTimer = null

const handleSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    watchlistStore.searchCatalogSymbols(searchQuery.value, 'All')
  }, 250)
}

const isAlreadyInWatchlist = (symbol) => {
  if (!watchlistStore.activeWatchlistDetail?.symbols) return false
  return watchlistStore.activeWatchlistDetail.symbols.some(s => s.symbol === symbol)
}

const addSymbol = async (symbol) => {
  if (!watchlistStore.activeWatchlistId) return
  addingSymbol.value = symbol
  try {
    await watchlistStore.addSymbolToWatchlist(watchlistStore.activeWatchlistId, symbol)
  } catch (err) {
    console.error("Failed to add symbol:", err)
  } finally {
    addingSymbol.value = null
  }
}

onMounted(() => {
  watchlistStore.searchCatalogSymbols('', 'All')
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
</style>
