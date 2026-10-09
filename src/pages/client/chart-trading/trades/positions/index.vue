<template>
  <div class="flex flex-col h-full text-primary-text">
    <!-- Filter Control Bar -->
    <div
      class="flex flex-wrap items-center justify-between gap-2 p-2.5 border-b border-primary-border bg-background/40">
      <!-- Left: Status Filter Pills (Open, Closed, All) & Side Select -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Status Filter Pills -->
        <div class="flex items-center bg-card-background border border-primary-border rounded-lg p-0.5 select-none">
          <button @click="handleStatusChange('open')"
            class="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            :class="positionsStore.filters.statusFilter === 'open' ? 'bg-primary text-black' : 'text-secondary-text hover:text-primary-text'">
            Open
          </button>
          <button @click="handleStatusChange('closed')"
            class="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            :class="positionsStore.filters.statusFilter === 'closed' ? 'bg-primary text-black' : 'text-secondary-text hover:text-primary-text'">
            Closed
          </button>
          <button @click="handleStatusChange('all')"
            class="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            :class="positionsStore.filters.statusFilter === 'all' ? 'bg-primary text-black' : 'text-secondary-text hover:text-primary-text'">
            All
          </button>
        </div>

        <!-- Side/Type Select Filter using custom BaseSelect -->
        <BaseSelect v-model="positionsStore.filters.typeFilter" :options="sideOptions" placeholder="Filter Side"
          height="32px" width="150px" rounded="lg" variant="surface" @change="applyFilters" />

        <!-- Search Input for Symbol or Ticket -->
        <BaseSearch v-model="positionsStore.filters.searchQuery" placeholder="Search symbol or ticket..." height="32px"
          rounded="lg" variant="background" container-class="w-48 sm:w-56" @update:modelValue="handleSearchInput"
          @clear="applyFilters" @search="applyFilters" />
      </div>

      <!-- Right: Custom Date Range Picker -->
      <div class="flex items-center gap-2">
        <BaseDateRangePicker v-model="positionsStore.filters.dateRange" size="sm" variant="filled"
          placeholder="Filter Date Range" @apply="applyFilters" @clear="clearDateRange" />
      </div>
    </div>

    <!-- Scrollable Table Container -->
    <div class="overflow-x-auto custom-scrollbar flex-1 flex flex-col min-h-0">
      <div class="min-w-[980px] flex-1 flex flex-col">
        <!-- Header Row -->
        <div
          class="grid grid-cols-12 w-full gap-2 bg-background/50 py-2.5 px-3 text-[10px] md:text-[11px] font-semibold text-secondary-text select-none border-b border-primary-border items-center">
          <div class="col-span-2">Symbol / Ticket</div>
          <div class="col-span-1.5 text-nowrap">Account Number</div>
          <div class="col-span-0.5">Side</div>
          <div class="col-span-0.5 text-center">Volume</div>
          <div class="col-span-1 text-right">Open Price</div>
          <div class="col-span-1 text-right">
            {{ positionsStore.filters.statusFilter == 'closed' ? 'Exit Price' : 'Current Price' }}
          </div>
          <div class="col-span-1 text-right">SL / TP</div>
          <div class="col-span-1 text-right">PnL (USD)</div>
          <div class="col-span-2 text-right">Time</div>
          <div class="col-span-1.5 text-right">Actions</div>
        </div>

        <!-- Scrollable Positions & Placed Orders List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div v-for="item in combinedItems" :key="item._itemType + '_' + (item.position_ticket || item.order_ticket || item.id)"
            class="grid grid-cols-12 w-full gap-2 items-center py-2 px-3 text-[11px] md:text-xs border-b border-primary-border/30 hover:bg-background/80 transition-colors font-medium">
            <!-- Symbol & Ticket -->
            <div class="col-span-2 flex items-center gap-1.5 min-w-0">
              <div class="flex flex-col truncate">
                <div class="flex items-center gap-1">
                  <span class="text-primary-text text-[13px] font-bold leading-tight">{{ item.symbol }}</span>
                  <span v-if="item._itemType === 'order'" class="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-400 rounded font-semibold uppercase">Order</span>
                </div>
                <span class="text-[12px] text-secondary-text">#{{ item.position_ticket || item.order_ticket || item.id }}</span>
              </div>
            </div>

            <!-- Account Number -->
            <div class="col-span-1.5 flex items-center gap-1.5 min-w-0">
              <div class="flex flex-col truncate">
                <span class="text-primary-text font-bold leading-tight">#{{ item.account_number || item.login || '-' }}</span>
              </div>
            </div>

            <!-- Side / Type -->
            <div class="col-span-0.5">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
                :class="isBuySide(item) ? 'bg-primary-green/15 text-primary-green' : 'bg-primary-red/15 text-primary-red'">
                {{ getSideLabel(item) }}
              </span>
            </div>

            <!-- Volume -->
            <div class="col-span-0.5 text-center font-medium">
              {{ item.lot || item.volume_initial || item.volume || item.volume_current || '0.00' }}
            </div>

            <!-- Open Price / Order Price -->
            <div class="col-span-1 text-right">
              {{ formatNum(item.price_open || item.entry_price || item.price_order) }}
            </div>

            <!-- Current / Exit Price -->
            <div class="col-span-1 text-right">
              {{ formatNum(getCurrentPrice(item)) }}
            </div>

            <!-- Stop Loss / Take Profit -->
            <div class="col-span-1 text-right text-[11px] gap-0.5 flex flex-col items-end leading-tight">
              <span class="text-primary-red">{{ formatNum(item.price_sl) }}</span>
              <span class="text-primary-green">{{ formatNum(item.price_tp) }}</span>
            </div>

            <!-- PnL -->
            <div class="col-span-1 text-right font-semibold">
              <template v-if="item._itemType === 'position'">
                <span :class="getPnl(item) >= 0 ? 'text-[#34A853]' : 'text-[#EA4335]'">
                  {{ getPnl(item) >= 0 ? '+' : '' }}{{ formatCurrency(getPnl(item)) }}
                </span>
              </template>
              <template v-else>
                <span class="text-amber-400 text-[10px] font-semibold">PLACED</span>
              </template>
            </div>

            <!-- Dedicated Time Column -->
            <div class="col-span-2 text-right text-[11px] text-secondary-text whitespace-nowrap font-mono" :title="formatDate(item.created_at || item.time_create || item.time_setup)">
              {{ formatDate(item.created_at || item.time_create || item.time_setup) }}
            </div>

            <!-- Actions -->
            <div class="col-span-1.5 flex justify-end">
              <div class="flex items-center gap-1 shrink-0 ml-1">
                <template v-if="item._itemType === 'position'">
                  <button @click="openSltpModal(item)" :disabled="item.status == 'CLOSED'"
                    class="p-1 rounded disabled:bg-card-background disabled:text-primary-text/50 bg-background hover:bg-card-background border border-primary-border text-primary hover:text-primary-text transition-colors cursor-pointer"
                    title="Modify SL / TP">
                    Modify
                  </button>
                  <button @click="openCloseModal(item)" :disabled="item.status == 'CLOSED'"
                    class="p-1 rounded disabled:bg-card-background disabled:text-primary-text/50 bg-background hover:bg-card-background border border-primary-border text-[#EA4335] hover:text-red-400 transition-colors cursor-pointer"
                    title="Close Position">
                    Close
                  </button>
                </template>
                <template v-else>
                  <button @click="openModifyOrderModal(item)"
                    class="p-1 rounded bg-background hover:bg-card-background border border-primary-border text-primary hover:text-primary-text transition-colors cursor-pointer"
                    title="Modify Pending Order">
                    Modify
                  </button>
                  <button @click="openCancelOrderModal(item)"
                    class="p-1 rounded bg-background hover:bg-card-background border border-primary-border text-[#EA4335] hover:text-red-400 transition-colors cursor-pointer"
                    title="Cancel Pending Order">
                    Cancel
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="positionsStore.loading || orderStore.pendingOrdersLoading"
            class="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
            <Loader2 class="h-5 w-5 animate-spin text-primary" />
            <span class="text-xs">Loading positions & orders...</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="combinedItems.length === 0"
            class="flex flex-col items-center justify-center py-10 text-secondary-text text-xs gap-1">
            <span class="font-medium">No open positions or placed orders found</span>
            <span class="text-[10px] opacity-70">Open positions and pending orders matching filter criteria will appear here</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Dedicated Modals -->
    <ModifySlTpModal :is-open="isSltpModalOpen" :ticket="selectedTicket" :initial-sl="selectedPosSl"
      :initial-tp="selectedPosTp" :submitting="submitting" @close="isSltpModalOpen = false"
      @submit="submitModifySlTp" />

    <ClosePositionModal :is-open="isCloseModalOpen" :ticket="selectedTicket" :total-lot="selectedPositionLot"
      :closing="closing" @close="isCloseModalOpen = false" @submit="submitClosePosition" />

    <!-- Order Modals for Placed Orders in Positions Tab -->
    <ModifyOrderModal :is-open="isModifyOrderModalOpen" :ticket="selectedOrderTicket" :initial-price="selectedOrderPrice"
      :initial-sl="selectedOrderSl" :initial-tp="selectedOrderTp" :submitting="submittingOrder"
      @close="isModifyOrderModalOpen = false" @submit="submitModifyOrder" />

    <CancelOrderModal :is-open="isCancelOrderModalOpen" :ticket="selectedCancelOrderTicket" :cancelling="cancellingOrder"
      @close="isCancelOrderModalOpen = false" @confirm="submitCancelOrder" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import usePositionsStore from '../../../../../stores/client/positions'
import useOrderStore from '../../../../../stores/client/orders'
import BaseDateRangePicker from '@/components/base/BaseDateRangePicker.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseSearch from '@/components/base/BaseSearch.vue'
import ModifySlTpModal from './ModifySlTpModal.vue'
import ClosePositionModal from './ClosePositionModal.vue'
import ModifyOrderModal from '../orders/ModifyOrderModal.vue'
import CancelOrderModal from '../orders/CancelOrderModal.vue'
import { Loader2 } from 'lucide-vue-next'
import { useTickerStore } from '../../../../../stores/shared/ticker.js'
import { useSnackbarStore } from '../../../../../stores/shared/snackbar.js'
import { livePNL } from '@/utils/livePNL.js'

const positionsStore = usePositionsStore()
const orderStore = useOrderStore()
const tickerStore = useTickerStore()
const snackbar = useSnackbarStore()

const isPendingOrder = (ord) => {
  if (!ord) return false
  const stateStr = String(ord.state_name || ord.state || ord.status || '').toUpperCase()
  return stateStr === 'PLACED' || stateStr === '1'
}

const isBuySide = (item) => {
  if (!item) return true
  if (item.action === 0 || item.type === 0) return true
  const str = String(item.type_name || item.type || '').toUpperCase()
  return str.includes('BUY')
}

const getSideLabel = (item) => {
  if (!item) return 'BUY'
  if (item.type_name) return item.type_name
  if (item.type === 0 || item.action === 0) return 'BUY'
  if (item.type === 1 || item.action === 1) return 'SELL'
  return String(item.type || '')
}

const combinedItems = computed(() => {
  const openPos = (positionsStore.data || []).map(pos => ({ ...pos, _itemType: 'position' }))
  const pendingOrds = (orderStore.pendingOrdersData || []).map(ord => ({ ...ord, _itemType: 'order' }))
  return [...openPos, ...pendingOrds]
})

const getPnl = (pos) => {
  if (pos.status === 'CLOSED') {
    return Number(pos.pnl || pos.profit || 0)
  }
  return Number(livePNL(pos) || 0)
}

const getCurrentPrice = (item) => {
  if (item._itemType === 'position' && item.status === 'CLOSED') {
    return item.exit_price || item.price_current || null
  }
  const isBuy = isBuySide(item)
  const livePrice = tickerStore.getLastPrice(item.symbol)
  if (!livePrice) return item.price_current ?? null
  return isBuy ? livePrice.bid : livePrice.ask
}

const sideOptions = [
  { label: 'All Sides', value: 'all' },
  { label: 'BUY Only', value: 'BUY' },
  { label: 'SELL Only', value: 'SELL' },
]

const isSltpModalOpen = ref(false)
const isCloseModalOpen = ref(false)
const selectedTicket = ref(null)
const selectedPosSl = ref(null)
const selectedPosTp = ref(null)
const selectedPositionLot = ref(0)

// Pending Order Modals state
const isModifyOrderModalOpen = ref(false)
const isCancelOrderModalOpen = ref(false)
const selectedOrderTicket = ref(null)
const selectedOrderPrice = ref(null)
const selectedOrderSl = ref(null)
const selectedOrderTp = ref(null)
const selectedCancelOrderTicket = ref(null)
const submittingOrder = ref(false)
const cancellingOrder = ref(false)

const submitting = ref(false)
const closing = ref(false)

let searchDebounceTimer = null

const handleSearchInput = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    applyFilters()
  }, 350)
}

const handleStatusChange = (status) => {
  positionsStore.filters.statusFilter = status
  applyFilters()
}

const applyFilters = () => {
  if (orderStore.selectedAccount) {
    positionsStore.fetchPositions(orderStore.selectedAccount)
    orderStore.fetchPendingOrders(orderStore.selectedAccount)
  }
}

const clearDateRange = () => {
  positionsStore.filters.dateRange = [null, null]
  applyFilters()
}

const openSltpModal = (pos) => {
  selectedTicket.value = pos.position_ticket || pos.id
  selectedPosSl.value = pos.price_sl ?? null
  selectedPosTp.value = pos.price_tp ?? null
  isSltpModalOpen.value = true
}

const submitModifySlTp = async (payload) => {
  if (!selectedTicket.value) return
  const pos = positionsStore.data.find(p => String(p.position_ticket || p.id) === String(selectedTicket.value))
  if (pos) {
    const isBuy = isBuySide(pos)
    const currentPrice = getCurrentPrice(pos) || Number(pos.entry_price || pos.price_open || 0)
    if (currentPrice && currentPrice > 0) {
      const formattedPrice = currentPrice > 100 ? currentPrice.toFixed(2) : currentPrice.toFixed(4)
      if (payload.sl !== undefined && payload.sl !== null && payload.sl > 0) {
        if (isBuy && Number(payload.sl) >= currentPrice) {
          snackbar.show(`Stop Loss for BUY order must be below current price (${formattedPrice})`, 'error')
          return
        }
        if (!isBuy && Number(payload.sl) <= currentPrice) {
          snackbar.show(`Stop Loss for SELL order must be above current price (${formattedPrice})`, 'error')
          return
        }
      }
      if (payload.tp !== undefined && payload.tp !== null && payload.tp > 0) {
        if (isBuy && Number(payload.tp) <= currentPrice) {
          snackbar.show(`Take Profit for BUY order must be above current price (${formattedPrice})`, 'error')
          return
        }
        if (!isBuy && Number(payload.tp) >= currentPrice) {
          snackbar.show(`Take Profit for SELL order must be below current price (${formattedPrice})`, 'error')
          return
        }
      }
    }
  }

  submitting.value = true
  try {
    await positionsStore.modifySlTp(selectedTicket.value, payload)
    isSltpModalOpen.value = false
  } catch (err) {
    console.error("Failed to modify SL/TP:", err)
  } finally {
    submitting.value = false
  }
}

const openCloseModal = (pos) => {
  selectedTicket.value = pos.position_ticket || pos.id
  selectedPositionLot.value = Number(pos.lot || pos.volume_initial || pos.volume || 0)
  isCloseModalOpen.value = true
}

const submitClosePosition = async (payload) => {
  if (!selectedTicket.value) return
  closing.value = true
  try {
    await positionsStore.closePosition(selectedTicket.value, payload)
    isCloseModalOpen.value = false
  } catch (err) {
    console.error("Failed to close position:", err)
  } finally {
    closing.value = false
  }
}

const openModifyOrderModal = (ord) => {
  selectedOrderTicket.value = ord.order_ticket || ord.id
  selectedOrderPrice.value = ord.price_order ?? ord.price_current ?? null
  selectedOrderSl.value = ord.price_sl ?? null
  selectedOrderTp.value = ord.price_tp ?? null
  isModifyOrderModalOpen.value = true
}

const submitModifyOrder = async (payload) => {
  if (!selectedOrderTicket.value) return
  submittingOrder.value = true
  try {
    await orderStore.modifyOrder(selectedOrderTicket.value, payload)
    isModifyOrderModalOpen.value = false
    applyFilters()
  } catch (err) {
    console.error("Failed to modify order:", err)
  } finally {
    submittingOrder.value = false
  }
}

const openCancelOrderModal = (ord) => {
  selectedCancelOrderTicket.value = ord.order_ticket || ord.id
  isCancelOrderModalOpen.value = true
}

const submitCancelOrder = async () => {
  if (!selectedCancelOrderTicket.value) return
  cancellingOrder.value = true
  try {
    await orderStore.cancelOrder(selectedCancelOrderTicket.value)
    isCancelOrderModalOpen.value = false
    applyFilters()
  } catch (err) {
    console.error("Failed to cancel order:", err)
  } finally {
    cancellingOrder.value = false
  }
}

const formatNum = (val) => {
  if (val === undefined || val === null || val === '') return '-'
  const num = Number(val)
  if (isNaN(num)) return '-'
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '0.00'
  const num = Number(val)
  return num.toLocaleString()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const normalized = (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr))
      ? dateStr.replace(' ', 'T') + 'Z'
      : dateStr
    const d = new Date(normalized)
    if (isNaN(d.getTime())) return String(dateStr)

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const day = String(d.getUTCDate()).padStart(2, '0')
    const month = months[d.getUTCMonth()]
    const year = d.getUTCFullYear()
    const hours = String(d.getUTCHours()).padStart(2, '0')
    const minutes = String(d.getUTCMinutes()).padStart(2, '0')
    const seconds = String(d.getUTCSeconds()).padStart(2, '0')

    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`
  } catch (e) {
    return String(dateStr)
  }
}
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
