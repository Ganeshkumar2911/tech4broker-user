<template>
  <div v-if="isOpen" @click.self="$emit('close')"
    class="fixed inset-0 z-[9999] bg-black/60 backdrop-blur flex items-center justify-center p-8 select-none">
    <div
      class="bg-background/80 rounded-2xl w-full max-w-sm flex flex-col text-primary-text overflow-hidden transform transition-all duration-300 p-8 gap-8">

      <!-- 3 Action Buttons -->
      <div class="flex flex-col gap-4">
        <!-- 1. Chart Action Button -->
        <button @click="handleChartAction"
          class="w-full p-4 font-semibold text-primary-text border border-primary-border rounded-full bg-background hover:bg-primary-border cursor-pointer transition-colors">
          <p>Open Chart</p>
        </button>

        <!-- 2. Trade Action Button -->
        <button @click="handleTradeAction"
          class="w-full p-4 font-semibold border border-primary-border rounded-full bg-background hover:bg-primary-border cursor-pointer transition-colors">
          <p>Trade</p>
        </button>

        <!-- 3. Delete Action Button -->
        <button @click="promptDelete"
          class="w-full p-4 font-semibold border border-primary-border rounded-full bg-background hover:bg-red-500/20 hover:text-red-400 cursor-pointer transition-colors">
          <p>Delete from Watchlist</p>
        </button>
      </div>
    </div>

    <!-- Confirmation Modal for Delete -->
    <ConfirmationModal :is-open="showConfirmDelete" title="Remove Symbol" :subtitle="`Watchlist item: ${symbol}`"
      :message="`Are you sure you want to remove ${symbol} from this watchlist?`" confirm-text="Remove" variant="danger"
      :loading="isDeleting" @close="showConfirmDelete = false" @confirm="executeDelete" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CandlestickChart, TrendingUp, Trash2, ChevronRight } from 'lucide-vue-next'
import ConfirmationModal from '@/components/base/ConfirmationModal.vue'
import { useTickerStore } from '@/stores/shared/ticker'
import useOrderStore from '@/stores/client/orders'
import { useChartStore } from '@/stores/client/chart'
import { useWatchlistStore } from '@/stores/client/watchlist'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  symbol: { type: String, default: '' },
  item: { type: Object, default: null }
})

const emit = defineEmits(['close', 'switch-to-chart'])

const tickerStore = useTickerStore()
const orderStore = useOrderStore()
const chartStore = useChartStore()
const watchlistStore = useWatchlistStore()

const showConfirmDelete = ref(false)
const isDeleting = ref(false)

const liveTick = computed(() => (props.symbol ? tickerStore.getLastPrice(props.symbol) : null))

const handleChartAction = () => {
  if (props.symbol) {
    orderStore.selectedSymbol = props.symbol
    chartStore.openSymbolInTab(props.symbol)
    emit('switch-to-chart')
    emit('close')
  }
}

const handleTradeAction = () => {
  if (props.symbol) {
    orderStore.selectedSymbol = props.symbol
    orderStore.openOrderModal('Buy')
    emit('close')
  }
}

const promptDelete = () => {
  showConfirmDelete.value = true
}

const executeDelete = async () => {
  if (!props.symbol || !watchlistStore.activeWatchlistId) return
  isDeleting.value = true
  try {
    if (props.item?.id) {
      await watchlistStore.removeSymbolById(watchlistStore.activeWatchlistId, props.item.id)
    } else {
      await watchlistStore.removeSymbolByName(watchlistStore.activeWatchlistId, props.symbol)
    }
  } catch (err) {
    console.error("Failed to delete symbol:", err)
  } finally {
    isDeleting.value = false
    showConfirmDelete.value = false
    emit('close')
      / 50
  }
}
</script>

<style scoped></style>
