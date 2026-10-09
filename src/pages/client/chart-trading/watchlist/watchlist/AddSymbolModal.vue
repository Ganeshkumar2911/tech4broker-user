<template>
  <div v-if="isOpen" @click.self="$emit('close')"
    class="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div
      class="bg-card-background min-h-[40vh] rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] select-none text-primary-text overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-primary-border bg-background/50">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-bold text-primary-text">Add Symbol to Watchlist</h3>
        </div>
        <button @click="$emit('close')"
          class="p-1 hover:bg-background rounded-lg text-secondary-text hover:text-primary-text transition-colors cursor-pointer">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Search & Category Filter -->
      <div class="p-3 border-b border-primary-border flex flex-col gap-2.5 bg-background/30">
        <BaseSearch v-model="searchQuery" placeholder="Search catalog symbols (e.g. XAUUSD, BTC)..." height="34px"
          rounded="lg" variant="background" container-class="w-full" @update:modelValue="handleSearchInput"
          @clear="handleSearchInput" />


      </div>

      <!-- Symbols Catalog List -->
      <div class="flex-1 overflow-y-auto custom-scrollbar  min-h-0 flex flex-col gap-1">
        <div v-for="sym in watchlistStore.catalogSymbols" :key="sym.id || sym.symbol"
          class="flex items-center justify-between p-2.5 hover:bg-background/80  transition-all group">
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-bold text-primary-text leading-tight">{{ sym.symbol }}</span>
            <span class="text-[10px] text-secondary-text truncate">{{ sym.name || sym.category }}</span>
          </div>

          <button @click="addSymbol(sym.symbol)"
            :disabled="isAlreadyInWatchlist(sym.symbol) || addingSymbol === sym.symbol"
            class="px-1 disabled:opacity-50 bg-primary hover:bg-primary/90 text-black font-bold rounded-md transition-all cursor-pointer  flex items-center gap-1 ">
            <Loader2 v-if="addingSymbol === sym.symbol" class="w-4 animate-spin" />
            <Plus v-else class=" w-4" />
            <!-- <span>{{ isAlreadyInWatchlist(sym.symbol) ? 'Added' : '+ Add' }}</span> -->
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="watchlistStore.loadingCatalog"
          class="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
          <Loader2 class="w-6 h-6 animate-spin text-primary" />
          <span class="text-xs">Searching catalog...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="!watchlistStore.loadingCatalog && watchlistStore.catalogSymbols.length === 0"
          class="flex flex-col items-center justify-center py-10 text-secondary-text text-xs gap-1">
          <span class="font-medium">No symbols found</span>
          <span class="text-[10px] opacity-70">Try searching with a different symbol name or category</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { PlusCircle, X, Loader2, Plus } from 'lucide-vue-next'
import BaseSearch from '@/components/base/BaseSearch.vue'
import { useWatchlistStore } from '@/stores/client/watchlist'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const watchlistStore = useWatchlistStore()

const searchQuery = ref('')
const selectedCategory = ref('All')
const addingSymbol = ref(null)


let searchTimer = null

const handleSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    watchlistStore.searchCatalogSymbols(searchQuery.value, selectedCategory.value)
  }, 300)
}

const selectCategory = (cat) => {
  selectedCategory.value = cat
  watchlistStore.searchCatalogSymbols(searchQuery.value, cat)
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

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      searchQuery.value = ''
      selectedCategory.value = 'All'
      watchlistStore.searchCatalogSymbols('', 'All')
    }
  }
)
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
