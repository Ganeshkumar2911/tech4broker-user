<template>
  <div @click="$emit('select-symbol', item.symbol)"
    class="hidden lg:grid grid-cols-8 items-center p-2.5 border-b border-primary-border/40 transition-all group cursor-pointer select-none relative"
    :class="isSelected ? 'bg-primary/10 border-l-2 border-l-primary font-bold' : 'hover:bg-background/80'">
    <!-- Left: Symbol Badge & Name -->
    <div class="col-span-3 flex items-center gap-2 min-w-0">
      <div
        class="w-6 h-6 shrink-0 rounded-full flex items-center justify-center bg-background text-primary font-extrabold text-[10px] border border-primary-border shadow-xs">
        {{ item.symbol.charAt(0) }}
      </div>
      <div class="flex flex-col min-w-0">
        <span class="text-[12px] font-bold text-primary-text truncate group-hover:text-primary transition-colors">
          {{ item.symbol }}
        </span>
        <span class="text-[9px] font-mono text-secondary-text/70 leading-none">
          Spr: {{ formattedSpread }}
        </span>
      </div>
    </div>

    <!-- Center: Bid Price -->
    <div class="col-span-2 text-center text-xs font-mono font-semibold transition-colors duration-300 whitespace-nowrap"
      :class="bidFlashClass">
      {{ formattedBid }}
    </div>

    <!-- Right: Ask Price -->
    <div class="col-span-3 flex items-center justify-end gap-2 text-right">
      <span class="text-xs font-mono font-semibold transition-colors duration-300 whitespace-nowrap"
        :class="askFlashClass">
        {{ formattedAsk }}
      </span>
    </div>

    <!-- Desktop Hover Action Overlay -->
    <div @click="$emit('select-symbol', item.symbol)"
      class="absolute inset-0 bg-card-background/95 backdrop-blur-xs flex items-center justify-between px-2.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none group-hover:pointer-events-auto border-b border-primary-border/40 cursor-pointer">
      <!-- Left: Symbol Name -->
      <div class="flex items-center gap-1.5 min-w-0 max-w-[70px]">
        <span class="text-[12px] font-extrabold text-primary-text truncate">
          {{ item.symbol }}
        </span>
      </div>

      <!-- Center: 3 Action Buttons (Chart, Buy, Sell) -->
      <div class="flex items-center gap-1.5 justify-center flex-1 mx-1">
        <!-- 1. Chart Button -->
        <button @click.stop="handleChart" title="Show Chart"
          class=" px-1 py-1 text-[11px] font-bold rounded flex items-center gap-1 bg-primary/5 hover:bg-primary/20 text-primary border border-primary/10 transition-colors cursor-pointer shrink-0">
          <CandlestickChart :size="12" />
        </button>

        <!-- 2. Buy Button -->
        <button @click.stop="handleBuy" title="Buy"
          class="px-2 py-0.5 text-[11px] font-extrabold rounded flex items-center justify-center bg-primary-green/5 text-primary-text hover:bg-primary-green/20 border border-primary-green/10 transition-colors cursor-pointer shrink-0 shadow-xs">
          B
        </button>

        <!-- 3. Sell Button -->
        <button @click.stop="handleSell" title="Sell"
          class="px-2 py-0.5 text-[11px] font-extrabold rounded flex items-center justify-center bg-primary-red/5 text-primary-text hover:bg-primary-red/20 border border-primary-red/10 transition-colors cursor-pointer shrink-0 shadow-xs">
          S
        </button>
      </div>

      <!-- Right: Remove Symbol Button -->
      <button @click.stop="$emit('remove-symbol', item)" title="Remove symbol"
        class="p-1 hover:bg-red-500/20 hover:text-red-400 text-secondary-text rounded transition-all cursor-pointer shrink-0">
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>

  <!-- Mobile View -->
  <div @click="$emit('select-symbol', item)"
    class="grid lg:hidden grid-cols-8 items-center p-3 border-b border-primary-border/40 transition-all group cursor-pointer select-none relative">
    <!-- Left: Symbol Badge & Name -->
    <div class="col-span-3 flex items-center gap-2 min-w-0">

      <div class="flex flex-col min-w-0">
        <span class="text-[14px] font-bold text-primary-text truncate group-hover:text-primary transition-colors">
          {{ item.symbol }}
        </span>
        <span class="text-[10px] font-mono text-secondary-text/70">
          Spr: {{ formattedSpread }}
        </span>
      </div>
    </div>

    <!-- Center: Bid Price -->
    <div class="col-span-2 transition-colors duration-300 whitespace-nowrap" :class="bidFlashClass">
      <p class="text-[9px] text-primary-text font-normal">BID:</p>
      <p class="text-[16px] font-mono font-semibold ">{{ formattedBid }}</p>
    </div>

    <!-- Right: Ask Price & Delete Button -->
    <div class="col-span-3 flex items-center justify-end gap-2 text-left">
      <span class="transition-colors duration-300 whitespace-nowrap" :class="askFlashClass">
        <p class="text-[9px] text-primary-text font-normal">ASK:</p>

        <p class="font-mono font-semibold ">
          {{ formattedAsk }}
        </p>
      </span>

      <!-- Remove Symbol Button on Hover -->
      <button @click.stop="$emit('remove-symbol', item)" title="Remove symbol"
        class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 text-secondary-text rounded transition-all cursor-pointer shrink-0">
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Trash2, CandlestickChart } from 'lucide-vue-next'
import { useTickerStore } from '@/stores/shared/ticker'
import useOrderStore from '@/stores/client/orders'
import { useChartStore } from '@/stores/client/chart'
import { formatSymbolPrice, calculateSpreadPoints } from '@/utils/symbolUtils'

const props = defineProps({
  item: { type: Object, required: true },
  isSelected: { type: Boolean, default: false }
})

const emit = defineEmits(['select-symbol', 'remove-symbol'])

const tickerStore = useTickerStore()
const orderStore = useOrderStore()
const chartStore = useChartStore()

const handleChart = () => {
  orderStore.selectedSymbol = props.item.symbol
  chartStore.openSymbolInTab(props.item.symbol)
  emit('select-symbol', props.item.symbol)
}

const handleBuy = () => {
  orderStore.selectedSymbol = props.item.symbol
  orderStore.openOrderModal('Buy')
}

const handleSell = () => {
  orderStore.selectedSymbol = props.item.symbol
  orderStore.openOrderModal('Sell')
}

const liveTick = computed(() => tickerStore.getLastPrice(props.item.symbol))

const bidFlashClass = ref('')
const askFlashClass = ref('')

const prevBid = ref(null)
const prevAsk = ref(null)

watch(
  () => liveTick.value?.bid,
  (newBid) => {
    if (newBid !== undefined && newBid !== null && prevBid.value !== null) {
      if (newBid > prevBid.value) {
        bidFlashClass.value = 'text-primary-green font-bold'
      } else if (newBid < prevBid.value) {
        bidFlashClass.value = 'text-primary-red font-bold'
      }
      setTimeout(() => {
        bidFlashClass.value = ''
      }, 500)
    }
    prevBid.value = newBid
  }
)

watch(
  () => liveTick.value?.ask,
  (newAsk) => {
    if (newAsk !== undefined && newAsk !== null && prevAsk.value !== null) {
      if (newAsk > prevAsk.value) {
        askFlashClass.value = 'text-primary-green font-bold'
      } else if (newAsk < prevAsk.value) {
        askFlashClass.value = 'text-primary-red font-bold'
      }
      setTimeout(() => {
        askFlashClass.value = ''
      }, 500)
    }
    prevAsk.value = newAsk
  }
)

const formattedBid = computed(() => {
  return formatSymbolPrice(liveTick.value?.bid, props.item.symbol, liveTick.value?.digits)
})

const formattedAsk = computed(() => {
  return formatSymbolPrice(liveTick.value?.ask, props.item.symbol, liveTick.value?.digits)
})

const formattedSpread = computed(() => {
  return calculateSpreadPoints(props.item.symbol, liveTick.value)
})
</script>

<style scoped></style>
