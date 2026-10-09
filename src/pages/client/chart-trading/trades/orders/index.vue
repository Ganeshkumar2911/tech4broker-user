<template>
  <div class="flex flex-col h-full text-primary-text">
    <!-- Filter Control Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 border-b border-primary-border bg-background/40">
      <!-- Left: State Select, Type Select & Search Bar -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- State / Status Filter using custom BaseSelect -->
        <BaseSelect 
          v-model="orderStore.filters.stateFilter"
          :options="stateOptions"
          placeholder="Filter State"
          height="32px"
          width="140px"
          rounded="lg"
          variant="surface"
          @change="applyFilters"
        />

        <!-- Order Type Filter using custom BaseSelect -->
        <BaseSelect 
          v-model="orderStore.filters.typeFilter"
          :options="typeOptions"
          placeholder="Filter Type"
          height="32px"
          width="150px"
          rounded="lg"
          variant="surface"
          @change="applyFilters"
        />

        <!-- Search Input for Symbol or Ticket -->
        <BaseSearch 
          v-model="orderStore.filters.searchQuery"
          placeholder="Search symbol or ticket..."
          height="32px"
          rounded="lg"
          variant="background"
          container-class="w-48 sm:w-56"
          @update:modelValue="handleSearchInput"
          @clear="applyFilters"
          @search="applyFilters"
        />
      </div>

      <!-- Right: Custom Date Range Picker -->
      <div class="flex items-center gap-2">
        <BaseDateRangePicker 
          v-model="orderStore.filters.dateRange"
          size="sm"
          variant="filled"
          placeholder="Filter Date Range"
          @apply="applyFilters"
          @clear="clearDateRange"
        />
      </div>
    </div>

    <!-- Scrollable Table Container -->
    <div class="overflow-x-auto custom-scrollbar flex-1 flex flex-col min-h-0">
      <div class="min-w-[980px] flex-1 flex flex-col">
        <!-- Header Row (Matches Positions UI structure) -->
        <div class="grid grid-cols-12 w-full gap-2 bg-background/50 py-2.5 px-3 text-[10px] md:text-[11px] font-semibold text-secondary-text select-none border-b border-primary-border items-center">
          <div class="col-span-2">Symbol / Ticket</div>
          <div class="col-span-1.5 text-nowrap">Account Number</div>
          <div class="col-span-1">Status</div>
          <div class="col-span-1">Type</div>
          <div class="col-span-0.5 text-center">Volume</div>
          <div class="col-span-1 text-right">Order Price</div>
          <div class="col-span-1 text-right">Current Price</div>
          <div class="col-span-1 text-right">SL / TP</div>
          <div class="col-span-2 text-right">Time</div>
          <div class="col-span-1 text-right">Actions</div>
        </div>

        <!-- Scrollable Orders List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div 
            v-for="ord in filteredOrdersData" 
            :key="ord.id || ord.order_ticket" 
            class="grid grid-cols-12 w-full gap-2 items-center py-2 px-3 text-[11px] md:text-xs border-b border-primary-border/30 hover:bg-background/80 transition-colors font-medium"
          >
            <!-- Symbol & Ticket -->
            <div class="col-span-2 flex items-center gap-1.5 min-w-0">
              <div class="flex flex-col truncate">
                <span class="text-primary-text text-[13px] font-bold leading-tight">{{ ord.symbol }}</span>
                <span class="text-[12px] text-secondary-text">#{{ ord.order_ticket || ord.id }}</span>
              </div>
            </div>

            <!-- Account Number -->
            <div class="col-span-1.5 flex items-center gap-1.5 min-w-0">
              <div class="flex flex-col truncate">
                <span class="text-primary-text font-bold leading-tight">#{{ ord.account_number || ord.login || '-' }}</span>
              </div>
            </div>

            <!-- Status / State -->
            <div class="col-span-1">
              <span 
                class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
                :class="getStatusClass(ord.state_name || ord.state)"
              >
                {{ ord.state_name || getStatusLabel(ord.state) }}
              </span>
            </div>

            <!-- Type -->
            <div class="col-span-1">
              <span 
                class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
                :class="isBuySide(ord) ? 'bg-primary-green/15 text-primary-green' : 'bg-primary-red/15 text-primary-red'"
              >
                {{ getSideLabel(ord) }}
              </span>
            </div>

            <!-- Volume -->
            <div class="col-span-0.5 text-center font-medium">
              {{ ord.volume_initial || ord.volume_current || '0.00' }}
            </div>

            <!-- Order Price -->
            <div class="col-span-1 text-right">
              {{ formatNum(ord.price_order) }}
            </div>

            <!-- Current Price -->
            <div class="col-span-1 text-right">
              {{ formatNum(tickerStore.getLastPrice(ord.symbol)?.ask || ord.price_current) || '- -' }}
            </div>

            <!-- Stop Loss / Take Profit -->
            <div class="col-span-1 text-right text-[11px] gap-0.5 flex flex-col items-end leading-tight">
              <span class="text-primary-red">{{ formatNum(ord.price_sl) }}</span>
              <span class="text-primary-green">{{ formatNum(ord.price_tp) }}</span>
            </div>

            <!-- Dedicated Time Column -->
            <div class="col-span-2 text-right text-[11px] text-secondary-text whitespace-nowrap font-mono" :title="formatDate(ord.time_setup || ord.created_at)">
              {{ formatDate(ord.time_setup || ord.created_at) }}
            </div>

            <!-- Pending Action Controls -->
            <div class="col-span-1 flex justify-end">
              <div class="flex items-center gap-1 shrink-0 ml-1">
                <button 
                  @click="openModifyModal(ord)" 
                  :disabled="!isPendingOrder(ord)"
                  class="p-1 rounded disabled:bg-card-background disabled:text-primary-text/50 bg-background hover:bg-card-background border border-primary-border text-primary hover:text-primary-text transition-colors cursor-pointer"
                  title="Modify Pending Order"
                >
                  Modify
                </button>
                <button 
                  @click="openCancelModal(ord)" 
                  :disabled="!isPendingOrder(ord) || cancellingTicket === (ord.order_ticket || ord.id)"
                  class="p-1 rounded disabled:bg-card-background disabled:text-primary-text/50 bg-background hover:bg-card-background border border-primary-border text-[#EA4335] hover:text-red-400 transition-colors cursor-pointer"
                  title="Cancel Pending Order"
                >
                  <Loader2 v-if="cancellingTicket === (ord.order_ticket || ord.id)" class="h-3 w-3 animate-spin inline" />
                  <span v-else>Cancel</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="orderStore.ordersLoading" class="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
            <Loader2 class="h-5 w-5 animate-spin text-primary" />
            <span class="text-xs">Loading orders...</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredOrdersData.length === 0" class="flex flex-col items-center justify-center py-10 text-secondary-text text-xs gap-1">
            <span class="font-medium">No orders found</span>
            <span class="text-[10px] opacity-70">Order history items will appear here</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Dedicated Modify Order Modal Component -->
    <ModifyOrderModal 
      :is-open="isModifyModalOpen"
      :ticket="selectedOrderTicket"
      :initial-price="selectedOrderPrice"
      :initial-sl="selectedOrderSl"
      :initial-tp="selectedOrderTp"
      :submitting="submitting"
      @close="isModifyModalOpen = false"
      @submit="submitModifyOrder"
    />

    <!-- Dedicated Cancel Order Confirmation Modal Component -->
    <CancelOrderModal 
      :is-open="isCancelModalOpen"
      :ticket="selectedCancelTicket"
      :cancelling="cancelling"
      @close="isCancelModalOpen = false"
      @confirm="submitCancelOrder"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import useOrderStore from '@/stores/client/orders'
import { useTickerStore } from '@/stores/shared/ticker.js'
import BaseDateRangePicker from '@/components/base/BaseDateRangePicker.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseSearch from '@/components/base/BaseSearch.vue'
import ModifyOrderModal from './ModifyOrderModal.vue'
import CancelOrderModal from './CancelOrderModal.vue'
import { Loader2 } from 'lucide-vue-next'

const orderStore = useOrderStore()
const tickerStore = useTickerStore()

const stateOptions = [
  { label: 'All States', value: 'all' },
  { label: 'FILLED', value: 'FILLED' },
  { label: 'REJECTED', value: 'REJECTED' },
  { label: 'CANCELED', value: 'CANCELED' }
]

const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'BUY', value: 'BUY' },
  { label: 'SELL', value: 'SELL' },
  { label: 'BUY LIMIT', value: 'BUY_LIMIT' },
  { label: 'SELL LIMIT', value: 'SELL_LIMIT' },
  { label: 'BUY STOP', value: 'BUY_STOP' },
  { label: 'SELL STOP', value: 'SELL_STOP' }
]

const isModifyModalOpen = ref(false)
const selectedOrderTicket = ref(null)
const selectedOrderPrice = ref(null)
const selectedOrderSl = ref(null)
const selectedOrderTp = ref(null)

const isCancelModalOpen = ref(false)
const selectedCancelTicket = ref(null)
const cancelling = ref(false)
const cancellingTicket = ref(null)

const submitting = ref(false)

let searchDebounceTimer = null

const handleSearchInput = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    applyFilters()
  }, 350)
}

const applyFilters = () => {
  if (orderStore.selectedAccount) {
    orderStore.fetchOrders(orderStore.selectedAccount)
  }
}

const clearDateRange = () => {
  orderStore.filters.dateRange = [null, null]
  applyFilters()
}

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

const filteredOrdersData = computed(() => {
  if (!orderStore.ordersData || !Array.isArray(orderStore.ordersData)) return []
  return orderStore.ordersData.filter(ord => !isPendingOrder(ord))
})

const openModifyModal = (ord) => {
  selectedOrderTicket.value = ord.order_ticket || ord.id
  selectedOrderPrice.value = ord.price_order ?? ord.price_current ?? null
  selectedOrderSl.value = ord.price_sl ?? null
  selectedOrderTp.value = ord.price_tp ?? null
  isModifyModalOpen.value = true
}

const submitModifyOrder = async (payload) => {
  if (!selectedOrderTicket.value) return
  submitting.value = true
  try {
    await orderStore.modifyOrder(selectedOrderTicket.value, payload)
    isModifyModalOpen.value = false
  } catch (err) {
    console.error("Failed to modify pending order:", err)
  } finally {
    submitting.value = false
  }
}

const openCancelModal = (ord) => {
  const ticket = ord.order_ticket || ord.id
  if (!ticket) return
  selectedCancelTicket.value = ticket
  isCancelModalOpen.value = true
}

const submitCancelOrder = async () => {
  const ticket = selectedCancelTicket.value
  if (!ticket) return

  cancelling.value = true
  cancellingTicket.value = ticket
  try {
    await orderStore.cancelOrder(ticket)
    isCancelModalOpen.value = false
  } catch (err) {
    console.error("Failed to cancel pending order:", err)
  } finally {
    cancelling.value = false
    cancellingTicket.value = null
  }
}

const formatNum = (val) => {
  if (val === undefined || val === null || val === '') return '-'
  const num = Number(val)
  if (isNaN(num)) return '-'
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
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

const getStatusClass = (status) => {
  if (!status) return 'bg-secondary-text/20 text-secondary-text'
  const str = String(status).toUpperCase()
  if (str === 'PLACED' || str === '1') return 'bg-primary/20 text-primary'
  if (str === 'FILLED' || str === '4') return 'bg-primary-green/20 text-primary-green'
  if (str === 'REJECTED') return 'bg-primary-red/20 text-primary-red'
  return 'bg-amber-500/20 text-amber-500'
}

const getStatusLabel = (state) => {
  switch (state) {
    case 1: return 'PLACED'
    case 4: return 'FILLED'
    default: return String(state || '-')
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
