<template>
  <div v-if="isOrderModalOpen" class="fixed inset-0 z-[9999] select-none text-primary-text">
    <!-- Backdrop Overlay -->
    <div
      @click="orderStore.closeOrderModal()"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-[9998]"
    />

    <!-- Bottom Sheet Container -->
    <div
      class="fixed inset-x-0 bottom-0 z-[9999] bg-card-background border-t border-primary-border rounded-t-2xl shadow-2xl flex flex-col p-4 gap-3 max-h-[90vh] overflow-y-auto custom-scrollbar transform transition-transform duration-300 ease-out"
    >
      <!-- Grab Handle Bar -->
      <div class="w-12 h-1 bg-secondary-text/30 rounded-full mx-auto -mt-1 shrink-0" />

      <!-- Header: Symbol Display & Account Selector & Close Cross -->
      <div class="flex items-center justify-between gap-2 border-b border-primary-border/60 pb-2.5 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center font-black text-xs shrink-0">
            {{ symbolCode ? symbolCode.charAt(0) : 'S' }}
          </div>
          <span class="text-sm font-extrabold text-primary-text tracking-wide truncate" :title="symbolCode">
            {{ symbolCode }}
          </span>
        </div>

        <!-- Account Selector -->
        <div class="flex-1 max-w-[160px]">
          <BaseSelect
            v-model="selectedAccount"
            :options="accountOptions"
            placeholder="Select Account"
            height="28px"
            rounded="lg"
            variant="surface"
          />
        </div>

        <!-- Close Button -->
        <button
          @click="orderStore.closeOrderModal()"
          class="p-1.5 bg-background border border-primary-border hover:border-primary-red hover:text-primary-red text-secondary-text rounded-lg cursor-pointer transition-colors shrink-0"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Row 1: MARKET vs PENDING Segmented Control -->
      <div class="p-1 bg-background border border-primary-border rounded-xl grid grid-cols-2 gap-1 shrink-0">
        <button
          @click="orderType = 'market'"
          class="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
          :class="orderType === 'market' ? 'bg-primary-blue text-white shadow-sm' : 'text-secondary-text hover:text-primary-text'"
        >
          MARKET
        </button>
        <button
          @click="orderType = 'limit'"
          class="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
          :class="orderType === 'limit' ? 'bg-primary-blue text-white shadow-sm' : 'text-secondary-text hover:text-primary-text'"
        >
          PENDING
        </button>
      </div>

      <!-- Row 2: SELL vs BUY Action Tabs -->
      <div class="p-1 bg-background border border-primary-border rounded-xl grid grid-cols-2 gap-1 shrink-0">
        <button
          @click="actionDirection = 'Sell'"
          class="py-2.5 px-3 rounded-lg text-center cursor-pointer transition-all flex flex-col items-center justify-center"
          :class="actionDirection === 'Sell' ? 'bg-[#EA4335] text-white font-black shadow-md' : 'text-secondary-text hover:text-primary-text'"
        >
          <span class="text-xs font-bold tracking-wider">SELL</span>
          <span class="text-[11px] font-mono font-medium">{{ formattedBid }}</span>
        </button>
        <button
          @click="actionDirection = 'Buy'"
          class="py-2.5 px-3 rounded-lg text-center cursor-pointer transition-all flex flex-col items-center justify-center"
          :class="actionDirection === 'Buy' ? 'bg-[#34A853] text-white font-black shadow-md' : 'text-secondary-text hover:text-primary-text'"
        >
          <span class="text-xs font-bold tracking-wider">BUY</span>
          <span class="text-[11px] font-mono font-medium">{{ formattedAsk }}</span>
        </button>
      </div>

      <!-- Row 3: Pending Entry Price Input (If orderType === 'limit') -->
      <div v-if="orderType === 'limit'" class="flex flex-col gap-1 shrink-0">
        <label class="text-[11px] font-bold text-secondary-text">Entry Price</label>
        <input
          v-model="priceInput"
          type="number"
          step="any"
          :placeholder="actionDirection === 'Buy' ? formattedAsk : formattedBid"
          class="w-full bg-background border border-primary-border rounded-xl px-3 py-2 text-xs font-mono text-primary-text focus:outline-none focus:border-primary"
        />
      </div>

      <!-- Row 4: Stop Loss & Take Profit Cards -->
      <div class="grid grid-cols-2 gap-2 shrink-0">
        <!-- Stop Loss Card -->
        <div
          class="flex items-center gap-2 p-2 bg-background border border-primary-border rounded-xl"
          :class="{ 'border-[#EA4335]/50 bg-[#EA4335]/5': slActive }"
        >
          <input type="checkbox" v-model="slActive" class="w-4 h-4 accent-[#EA4335] cursor-pointer shrink-0" />
          <input
            v-model="slInput"
            type="number"
            step="any"
            placeholder="Stop Loss"
            :disabled="!slActive"
            class="w-full bg-transparent text-xs font-mono text-primary-text focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        <!-- Take Profit Card -->
        <div
          class="flex items-center gap-2 p-2 bg-background border border-primary-border rounded-xl"
          :class="{ 'border-[#34A853]/50 bg-[#34A853]/5': tpActive }"
        >
          <input type="checkbox" v-model="tpActive" class="w-4 h-4 accent-[#34A853] cursor-pointer shrink-0" />
          <input
            v-model="tpInput"
            type="number"
            step="any"
            placeholder="Take Profit"
            :disabled="!tpActive"
            class="w-full bg-transparent text-xs font-mono text-primary-text focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <!-- Row 5: Margin Display -->
      <div class="text-center text-[11px] text-secondary-text font-medium py-0.5 shrink-0">
        Init. Margin: <span class="text-primary-text font-bold">~${{ calculatedMargin }}</span> ({{ calculatedPercent }}%)
      </div>

      <!-- Row 6: Lots Adjuster Box -->
      <div class="bg-background border border-primary-border rounded-xl flex items-center justify-between px-4 py-2 shrink-0">
        <button
          @click="decrementLots"
          class="text-secondary-text hover:text-primary-text cursor-pointer select-none text-xl font-extrabold active:scale-90 transition-transform p-1"
        >
          &minus;
        </button>
        <div class="flex flex-col items-center justify-center">
          <span class="text-sm font-extrabold text-primary-text leading-none font-mono">{{ lots.toFixed(2) }}</span>
          <span class="text-[9px] text-secondary-text font-bold mt-0.5 leading-none tracking-wider uppercase">LOTS</span>
        </div>
        <button
          @click="incrementLots"
          class="text-secondary-text hover:text-primary-text cursor-pointer select-none text-xl font-extrabold active:scale-90 transition-transform p-1"
        >
          &#x2B;
        </button>
      </div>

      <!-- Row 7: Big Action Execution Button -->
      <button
        @click="handleTradeAction(actionDirection)"
        :disabled="!symbolCode || orderStore.loading"
        class="w-full py-3 px-4 rounded-xl text-center cursor-pointer transition-all font-extrabold text-sm text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] shrink-0 mt-1"
        :class="actionDirection === 'Sell' ? 'bg-[#EA4335] hover:bg-[#d93025]' : 'bg-[#34A853] hover:bg-[#2d9247]'"
      >
        {{ orderStore.loading ? 'Processing...' : `${actionDirection.toUpperCase()} ${lots.toFixed(2)} @ ${actionDirection === 'Sell' ? formattedBid : formattedAsk}` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useTradingAccountsStore } from '@/stores/client/tradingAccounts'
import { storeToRefs } from 'pinia'
import useOrderStore from '@/stores/client/orders'
import { useTickerStore } from '@/stores/shared/ticker'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { formatSymbolPrice } from '@/utils/symbolUtils'

const tradingAccountStore = useTradingAccountsStore()
const orderStore = useOrderStore()
const tickerStore = useTickerStore()
const snackbar = useSnackbarStore()

const { selectedAccount, selectedSymbol, isOrderModalOpen, modalDirection } = storeToRefs(orderStore)
const { data: tradingAccounts } = storeToRefs(tradingAccountStore)

const orderType = ref('market') // 'market' or 'limit'
const actionDirection = ref('Sell') // 'Sell' or 'Buy'
const slActive = ref(false)
const tpActive = ref(false)
const lots = ref(0.01)

const priceInput = ref(null)
const slInput = ref(null)
const tpInput = ref(null)

watch(
  modalDirection,
  (newDir) => {
    if (newDir === 'Buy' || newDir === 'Sell') {
      actionDirection.value = newDir
    }
  },
  { immediate: true }
)

const accountOptions = computed(() => {
  if (!tradingAccounts.value || !Array.isArray(tradingAccounts.value)) return []
  return tradingAccounts.value
    .filter((acc) => {
      const type = String(acc.account_category || acc.account_type || acc.type || acc.platform || '').toLowerCase()
      const isDemo = acc.is_demo === true || acc.is_demo === 1 || acc.is_demo === '1' || acc.isDemo === true || type.includes('demo')
      return !isDemo
    })
    .map((acc) => {
      const accId = acc.id ?? acc.raw?.id
      const accNum = acc.account_number || acc.login || acc.raw?.account_number || accId
      const labelName = acc.groupLabel || acc.broker_label || acc.raw?.broker_label || acc.account_category || ''
      const displayText = labelName ? `${accNum} (${labelName})` : `#${accNum}`
      return {
        label: displayText,
        value: accId
      }
    })
})

const symbolCode = computed(() => {
  return selectedSymbol.value || 'XAUUSD'
})

const livePriceData = computed(() => {
  const sym = symbolCode.value
  return tickerStore.getLastPrice(sym)
})

const bidPrice = computed(() => {
  const p = livePriceData.value?.bid
  return p && !isNaN(p) ? Number(p) : null
})

const askPrice = computed(() => {
  const p = livePriceData.value?.ask
  return p && !isNaN(p) ? Number(p) : null
})

const formattedBid = computed(() => {
  const tick = tickerStore.getLastPrice(selectedSymbol.value)
  return formatSymbolPrice(bidPrice.value, selectedSymbol.value, tick?.digits)
})

const formattedAsk = computed(() => {
  const tick = tickerStore.getLastPrice(selectedSymbol.value)
  return formatSymbolPrice(askPrice.value, selectedSymbol.value, tick?.digits)
})

const calculatedMargin = computed(() => {
  const currentPrice = actionDirection.value === 'Sell' ? (bidPrice.value || 0) : (askPrice.value || 0)
  const margin = (currentPrice * lots.value * 100) / 100
  return margin.toFixed(2)
})

const calculatedPercent = computed(() => {
  return (lots.value * 100).toFixed(0)
})

const incrementLots = () => {
  lots.value = parseFloat((lots.value + 0.01).toFixed(2))
}

const decrementLots = () => {
  if (lots.value > 0.01) {
    lots.value = parseFloat((lots.value - 0.01).toFixed(2))
  }
}

const handleTradeAction = async (action) => {
  if (!selectedAccount.value) {
    snackbar.show("Please select a trading account", "error")
    return
  }

  const tradeType = orderType.value === 'market'
    ? action.toUpperCase()
    : `${action.toUpperCase()}_LIMIT`

  const targetAccount = tradingAccounts.value?.find(
    (acc) => (acc.id ?? acc.raw?.id) == selectedAccount.value
  )
  const brokerCurrency = (
    targetAccount?.broker_currency ||
    targetAccount?.currency ||
    targetAccount?.raw?.broker_currency ||
    targetAccount?.raw?.currency ||
    ''
  ).toUpperCase()

  let finalSymbol = String(symbolCode.value)
  if (brokerCurrency === 'USC') {
    finalSymbol = finalSymbol.endsWith('.c') ? finalSymbol : `${finalSymbol}.c`
  }

  const payload = {
    trading_account_id: selectedAccount.value,
    symbol: finalSymbol,
    type: tradeType,
    volume: lots.value
  }

  let referencePrice = 0
  if (orderType.value === 'limit') {
    if (!priceInput.value || Number(priceInput.value) <= 0) {
      snackbar.show("Please enter a valid entry price for pending order", "error")
      return
    }
    referencePrice = Number(priceInput.value)
    payload.price_order = referencePrice
  } else {
    referencePrice = action === 'Buy' ? (askPrice.value || 0) : (bidPrice.value || 0)
  }

  if (slActive.value && slInput.value !== null && slInput.value !== '') {
    const slVal = Number(slInput.value)
    if (referencePrice > 0) {
      const formattedRef = referencePrice > 100 ? referencePrice.toFixed(2) : referencePrice.toFixed(4)
      const priceLabel = orderType.value === 'limit' ? 'entry' : 'current LTP'
      if (action === 'Buy' && slVal >= referencePrice) {
        snackbar.show(`Stop Loss for BUY order must be below ${priceLabel} price (${formattedRef})`, "error")
        return
      }
      if (action === 'Sell' && slVal <= referencePrice) {
        snackbar.show(`Stop Loss for SELL order must be above ${priceLabel} price (${formattedRef})`, "error")
        return
      }
    }
    payload.sl = slVal
  }

  if (tpActive.value && tpInput.value !== null && tpInput.value !== '') {
    const tpVal = Number(tpInput.value)
    if (referencePrice > 0) {
      const formattedRef = referencePrice > 100 ? referencePrice.toFixed(2) : referencePrice.toFixed(4)
      const priceLabel = orderType.value === 'limit' ? 'entry' : 'current LTP'
      if (action === 'Buy' && tpVal <= referencePrice) {
        snackbar.show(`Take Profit for BUY order must be above ${priceLabel} price (${formattedRef})`, "error")
        return
      }
      if (action === 'Sell' && tpVal >= referencePrice) {
        snackbar.show(`Take Profit for SELL order must be below ${priceLabel} price (${formattedRef})`, "error")
        return
      }
    }
    payload.tp = tpVal
  }

  payload.comment = `Manual Mobile ${tradeType}`

  try {
    await orderStore.placeOrder(payload)
    orderStore.closeOrderModal()
  } catch (err) {
    console.error("Mobile order placement error:", err)
  }
}

onMounted(() => {
  tradingAccountStore.setPlatformFilter('real')
  tradingAccountStore.fetchAccounts()
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
