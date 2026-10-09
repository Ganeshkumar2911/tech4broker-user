<template>
  <div class="flex flex-col h-full text-primary-text">
    <!-- Filter Control Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 border-b border-primary-border bg-background/40">
      <!-- Left: Sub-tab Selector & Dynamic Filters -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Sub-tab Selector Pills (Positions, Orders, Deals) -->
        <div class="flex items-center bg-card-background border border-primary-border rounded-lg p-0.5 select-none shrink-0">
          <button @click="activeSubTab = 'positions'"
            class="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            :class="activeSubTab === 'positions' ? 'bg-primary text-black' : 'text-secondary-text hover:text-primary-text'">
            Positions ({{ filteredPositions.length }})
          </button>
          <button @click="activeSubTab = 'orders'"
            class="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            :class="activeSubTab === 'orders' ? 'bg-primary text-black' : 'text-secondary-text hover:text-primary-text'">
            Orders ({{ filteredOrders.length }})
          </button>
          <button @click="activeSubTab = 'deals'"
            class="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            :class="activeSubTab === 'deals' ? 'bg-primary text-black' : 'text-secondary-text hover:text-primary-text'">
            Deals ({{ filteredDeals.length }})
          </button>
        </div>

        <div class="h-4 w-px bg-primary-border shrink-0 hidden sm:block" />

        <!-- 1. Positions Filters -->
        <template v-if="activeSubTab === 'positions'">
          <BaseSelect v-model="posTypeFilter" :options="posTypeOptions" placeholder="Filter Type"
            height="32px" width="130px" rounded="lg" variant="surface" />

          <BaseSearch v-model="posSearchQuery" placeholder="Search symbol or ticket..." height="32px"
            rounded="lg" variant="background" container-class="w-44 sm:w-52" @clear="posSearchQuery = ''" />
        </template>

        <!-- 2. Orders Filters -->
        <template v-else-if="activeSubTab === 'orders'">
          <BaseSelect v-model="orderStateFilter" :options="orderStateOptions" placeholder="Filter State"
            height="32px" width="130px" rounded="lg" variant="surface" />

          <BaseSelect v-model="orderTypeFilter" :options="orderTypeOptions" placeholder="Filter Type"
            height="32px" width="140px" rounded="lg" variant="surface" />

          <BaseSearch v-model="orderSearchQuery" placeholder="Search symbol or ticket..." height="32px"
            rounded="lg" variant="background" container-class="w-44 sm:w-52" @clear="orderSearchQuery = ''" />
        </template>

        <!-- 3. Deals Filters -->
        <template v-else-if="activeSubTab === 'deals'">
          <BaseSelect v-model="dealTypeFilter" :options="dealTypeOptions" placeholder="Filter Type"
            height="32px" width="130px" rounded="lg" variant="surface" />

          <BaseSelect v-model="dealEntryFilter" :options="dealEntryOptions" placeholder="Filter Entry"
            height="32px" width="130px" rounded="lg" variant="surface" />

          <BaseSearch v-model="dealSearchQuery" placeholder="Search symbol or ticket..." height="32px"
            rounded="lg" variant="background" container-class="w-44 sm:w-52" @clear="dealSearchQuery = ''" />
        </template>
      </div>

      <!-- Right: Date Range Picker for Active Sub-tab -->
      <div class="flex items-center gap-2">
        <BaseDateRangePicker
          v-if="activeSubTab === 'positions'"
          v-model="posDateRange"
          size="sm"
          variant="filled"
          placeholder="Filter Date Range"
          @clear="posDateRange = [null, null]"
        />
        <BaseDateRangePicker
          v-else-if="activeSubTab === 'orders'"
          v-model="orderDateRange"
          size="sm"
          variant="filled"
          placeholder="Filter Date Range"
          @clear="orderDateRange = [null, null]"
        />
        <BaseDateRangePicker
          v-else-if="activeSubTab === 'deals'"
          v-model="dealDateRange"
          size="sm"
          variant="filled"
          placeholder="Filter Date Range"
          @clear="dealDateRange = [null, null]"
        />
      </div>
    </div>

    <!-- ================= 1. POSITIONS TAB VIEW ================= -->
    <template v-if="activeSubTab === 'positions'">
      <!-- Scrollable Table Container -->
      <div class="overflow-x-auto custom-scrollbar flex-1 flex flex-col min-h-0">
        <div class="min-w-[980px] flex-1 flex flex-col">
          <!-- Header Row -->
          <div
            class="grid grid-cols-12 w-full gap-2 bg-background/50 py-2.5 px-1 sm:px-3 text-[10px] md:text-[11px] font-semibold text-secondary-text select-none border-b border-primary-border items-center">
            <div class="col-span-2">Symbol / Ticket</div>
            <div class="col-span-1.5 text-nowrap">Account Number</div>
            <div class="col-span-1">Status</div>
            <div class="col-span-1">Type</div>
            <div class="col-span-0.5 text-center">Volume</div>
            <div class="col-span-1.5 text-right">Entry Price</div>
            <div class="col-span-1.5 text-right">Exit Price</div>
            <div class="col-span-1 text-right">Realized PnL</div>
            <div class="col-span-2 text-right">Time</div>
          </div>

          <!-- Scrollable Positions List -->
          <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <div v-for="item in filteredPositions" :key="'pos_' + (item.position_ticket || item.id)"
              class="grid grid-cols-12 w-full gap-2 items-center py-2 px-1 sm:px-3 text-[11px] md:text-xs border-b border-primary-border/30 hover:bg-background/80 transition-colors font-medium">
              
              <!-- Symbol & Ticket -->
              <div class="col-span-2 flex items-center gap-1.5 min-w-0">
                <div class="flex flex-col truncate">
                  <span class="text-primary-text text-[13px] font-bold leading-tight">{{ item.symbol }}</span>
                  <span class="text-[12px] text-secondary-text">#{{ item.position_ticket || item.id }}</span>
                </div>
              </div>

              <!-- Account Number -->
              <div class="col-span-1.5 flex items-center gap-1.5 min-w-0">
                <span class="text-primary-text font-bold leading-tight">#{{ item.account_number || item.login || '-' }}</span>
              </div>

              <!-- Status -->
              <div class="col-span-1">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-primary-blue/20 text-primary-blue">
                  CLOSED
                </span>
              </div>

              <!-- Type -->
              <div class="col-span-1">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
                  :class="isBuySide(item) ? 'bg-primary-green/15 text-primary-green' : 'bg-primary-red/15 text-primary-red'">
                  {{ getSideLabel(item) }}
                </span>
              </div>

              <!-- Volume -->
              <div class="col-span-0.5 text-center font-medium">
                {{ item.lot || item.volume || '0.00' }}
              </div>

              <!-- Entry Price -->
              <div class="col-span-1.5 text-right">
                {{ formatNum(item.price_open || item.entry_price) }}
              </div>

              <!-- Exit Price -->
              <div class="col-span-1.5 text-right">
                {{ formatNum(item.exit_price || item.price_current || item.price) }}
              </div>

              <!-- Realized PnL -->
              <div class="col-span-1 text-right font-semibold">
                <span :class="getPnl(item) >= 0 ? 'text-[#34A853]' : 'text-[#EA4335]'">
                  {{ getPnl(item) >= 0 ? '+' : '' }}{{ formatCurrency(getPnl(item)) }}
                </span>
              </div>

              <!-- Time -->
              <div class="col-span-2 text-right text-[11px] text-secondary-text whitespace-nowrap font-mono" :title="formatDate(item.time_close || item.updated_at || item.created_at)">
                {{ formatDate(item.time_close || item.updated_at || item.created_at) }}
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="positionsStore.closedPositionsLoading || positionsStore.loading"
              class="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
              <Loader2 class="h-5 w-5 animate-spin text-primary" />
              <span class="text-xs">Loading positions history...</span>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredPositions.length === 0"
              class="flex flex-col items-center justify-center py-10 text-secondary-text text-xs gap-1">
              <span class="font-medium">No closed positions found</span>
              <span class="text-[10px] opacity-70">Closed positions will appear here</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ================= 2. ORDERS TAB VIEW ================= -->
    <template v-else-if="activeSubTab === 'orders'">
      <!-- Scrollable Table Container -->
      <div class="overflow-x-auto custom-scrollbar flex-1 flex flex-col min-h-0">
        <div class="min-w-[980px] flex-1 flex flex-col">
          <!-- Header Row -->
          <div
            class="grid grid-cols-12 w-full gap-2 bg-background/50 py-2.5 px-1 sm:px-3 text-[10px] md:text-[11px] font-semibold text-secondary-text select-none border-b border-primary-border items-center">
            <div class="col-span-2">Symbol / Ticket</div>
            <div class="col-span-1.5 text-nowrap">Account Number</div>
            <div class="col-span-1">Status</div>
            <div class="col-span-1">Type</div>
            <div class="col-span-0.5 text-center">Volume</div>
            <div class="col-span-1.5 text-right">Order Price</div>
            <div class="col-span-1.5 text-right">Current Price</div>
            <div class="col-span-1 text-right">SL / TP</div>
            <div class="col-span-2 text-right">Time</div>
          </div>

          <!-- Scrollable Orders List -->
          <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <div v-for="ord in filteredOrders" :key="'ord_' + (ord.order_ticket || ord.id)"
              class="grid grid-cols-12 w-full gap-2 items-center py-2 px-1 sm:px-3 text-[11px] md:text-xs border-b border-primary-border/30 hover:bg-background/80 transition-colors font-medium">
              
              <!-- Symbol & Ticket -->
              <div class="col-span-2 flex items-center gap-1.5 min-w-0">
                <div class="flex flex-col truncate">
                  <span class="text-primary-text text-[13px] font-bold leading-tight">{{ ord.symbol }}</span>
                  <span class="text-[12px] text-secondary-text">#{{ ord.order_ticket || ord.id }}</span>
                </div>
              </div>

              <!-- Account Number -->
              <div class="col-span-1.5 flex items-center gap-1.5 min-w-0">
                <span class="text-primary-text font-bold leading-tight">#{{ ord.account_number || ord.login || '-' }}</span>
              </div>

              <!-- Status -->
              <div class="col-span-1">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase"
                  :class="getStatusClass(ord.state_name || ord.state || ord.status)">
                  {{ ord.state_name || getStatusLabel(ord.state || ord.status) }}
                </span>
              </div>

              <!-- Type -->
              <div class="col-span-1">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
                  :class="isBuySide(ord) ? 'bg-primary-green/15 text-primary-green' : 'bg-primary-red/15 text-primary-red'">
                  {{ getSideLabel(ord) }}
                </span>
              </div>

              <!-- Volume -->
              <div class="col-span-0.5 text-center font-medium">
                {{ ord.volume_initial || ord.volume_current || '0.00' }}
              </div>

              <!-- Order Price -->
              <div class="col-span-1.5 text-right">
                {{ formatNum(ord.price_order) }}
              </div>

              <!-- Current Price -->
              <div class="col-span-1.5 text-right">
                {{ formatNum(tickerStore.getLastPrice(ord.symbol)?.ask || ord.price_current) || '- -' }}
              </div>

              <!-- SL / TP -->
              <div class="col-span-1 text-right text-[11px] gap-0.5 flex flex-col items-end leading-tight">
                <span class="text-primary-red">{{ formatNum(ord.price_sl) }}</span>
                <span class="text-primary-green">{{ formatNum(ord.price_tp) }}</span>
              </div>

              <!-- Time -->
              <div class="col-span-2 text-right text-[11px] text-secondary-text whitespace-nowrap font-mono" :title="formatDate(ord.time_setup || ord.created_at)">
                {{ formatDate(ord.time_setup || ord.created_at) }}
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="orderStore.ordersLoading"
              class="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
              <Loader2 class="h-5 w-5 animate-spin text-primary" />
              <span class="text-xs">Loading orders history...</span>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredOrders.length === 0"
              class="flex flex-col items-center justify-center py-10 text-secondary-text text-xs gap-1">
              <span class="font-medium">No order history found</span>
              <span class="text-[10px] opacity-70">Past orders will appear here</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ================= 3. DEALS TAB VIEW ================= -->
    <template v-else-if="activeSubTab === 'deals'">
      <!-- Scrollable Table Container -->
      <div class="overflow-x-auto custom-scrollbar flex-1 flex flex-col min-h-0">
        <div class="min-w-[980px] flex-1 flex flex-col">
          <!-- Header Row -->
          <div
            class="grid grid-cols-12 w-full gap-2 bg-background/50 py-2.5 px-1 sm:px-3 text-[10px] md:text-[11px] font-semibold text-secondary-text select-none border-b border-primary-border items-center">
            <div class="col-span-2">Symbol / Deal #</div>
            <div class="col-span-1.5 text-nowrap">Account Number</div>
            <div class="col-span-1">Type</div>
            <div class="col-span-0.5">Entry</div>
            <div class="col-span-0.5 text-center">Volume</div>
            <div class="col-span-1 text-right">Deal Price</div>
            <div class="col-span-1 text-right">Commission</div>
            <div class="col-span-1 text-right">Swap</div>
            <div class="col-span-1 text-right">PnL</div>
            <div class="col-span-2.5 text-right">Time</div>
          </div>

          <!-- Scrollable Deals List -->
          <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <div v-for="deal in filteredDeals" :key="'deal_' + (deal.id || deal.deal_ticket)"
              class="grid grid-cols-12 w-full gap-2 items-center py-2 px-1 sm:px-3 text-[11px] md:text-xs border-b border-primary-border/30 hover:bg-background/80 transition-colors font-medium">
              
              <!-- Symbol & Deal Ticket -->
              <div class="col-span-2 flex items-center gap-1.5 min-w-0">
                <div class="flex flex-col truncate">
                  <span class="text-primary-text text-[13px] font-bold leading-tight">{{ deal.symbol }}</span>
                  <span class="text-[12px] text-secondary-text">#{{ deal.deal_ticket || deal.id }}</span>
                </div>
              </div>

              <!-- Account Number -->
              <div class="col-span-1.5 flex items-center gap-1.5 min-w-0">
                <span class="text-primary-text font-bold leading-tight">#{{ deal.account_number || deal.login || '-' }}</span>
              </div>

              <!-- Type -->
              <div class="col-span-1">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
                  :class="deal.action_name === 'BUY' || deal.action === 0 || deal.type === 'BUY' ? 'bg-primary-green/15 text-primary-green' : 'bg-primary-red/15 text-primary-red'">
                  {{ deal.action_name || deal.type || (deal.action === 0 ? 'BUY' : 'SELL') }}
                </span>
              </div>

              <!-- Entry (IN / OUT) -->
              <div class="col-span-0.5">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase"
                  :class="deal.entry_name === 'IN' || deal.entry === 0 ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'">
                  {{ deal.entry_name || (deal.entry === 0 ? 'IN' : 'OUT') }}
                </span>
              </div>

              <!-- Volume -->
              <div class="col-span-0.5 text-center font-medium">
                {{ deal.volume || '0.00' }}
              </div>

              <!-- Price -->
              <div class="col-span-1 text-right">
                {{ formatNum(deal.price) }}
              </div>

              <!-- Commission -->
              <div class="col-span-1 text-right text-secondary-text">
                {{ formatCurrency(deal.commission || 0) }}
              </div>

              <!-- Swap -->
              <div class="col-span-1 text-right text-secondary-text">
                {{ formatCurrency(deal.storage || 0) }}
              </div>

              <!-- PnL -->
              <div class="col-span-1 text-right font-semibold"
                :class="(deal.profit || 0) >= 0 ? 'text-[#34A853]' : 'text-[#EA4335]'">
                {{ (deal.profit || 0) >= 0 ? '+' : '' }}{{ formatCurrency(deal.profit || 0) }}
              </div>

              <!-- Time -->
              <div class="col-span-2.5 text-right text-[11px] text-secondary-text whitespace-nowrap font-mono" :title="formatDate(deal.time || deal.created_at)">
                {{ formatDate(deal.time || deal.created_at) }}
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="dealsStore.loading"
              class="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
              <Loader2 class="h-5 w-5 animate-spin text-primary" />
              <span class="text-xs">Loading deals history...</span>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredDeals.length === 0"
              class="flex flex-col items-center justify-center py-10 text-secondary-text text-xs gap-1">
              <span class="font-medium">No deals found</span>
              <span class="text-[10px] opacity-70">Executed deals will appear here</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import usePositionsStore from '@/stores/client/positions'
import useOrderStore from '@/stores/client/orders'
import useDealsStore from '@/stores/client/deals'
import { useTradeBookFiltersStore } from '@/stores/shared/tradeBookFilters'
import { useTickerStore } from '@/stores/shared/ticker'
import BaseDateRangePicker from '@/components/base/BaseDateRangePicker.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseSearch from '@/components/base/BaseSearch.vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
  activeSubTab: {
    type: String,
    default: 'positions'
  }
})

const emit = defineEmits(['update:activeSubTab'])

const positionsStore = usePositionsStore()
const orderStore = useOrderStore()
const dealsStore = useDealsStore()
const tickerStore = useTickerStore()
const filterStore = useTradeBookFiltersStore()

const activeSubTab = ref(props.activeSubTab || 'positions') // 'positions', 'orders', 'deals'

watch(() => props.activeSubTab, (val) => {
  if (val && val !== activeSubTab.value) {
    activeSubTab.value = val
  }
})

watch(activeSubTab, (val) => {
  emit('update:activeSubTab', val)
  const acc = orderStore.selectedAccount
  if (!acc) return
  if (val === 'positions') fetchPositionsHistory()
  else if (val === 'orders') fetchOrdersHistory()
  else if (val === 'deals') fetchDealsHistory()
})

// --- 1. Positions Filters ---
const posTypeFilter = ref('all')
const posSearchQuery = ref('')
const posDateRange = ref([null, null])

const posTypeOptions = computed(() => filterStore.positionsActionOptions)

const fetchPositionsHistory = () => {
  const acc = orderStore.selectedAccount
  if (!acc) return
  positionsStore.fetchClosedPositions(acc, {
    type: posTypeFilter.value !== 'all' ? posTypeFilter.value : undefined,
    search: posSearchQuery.value.trim() ? posSearchQuery.value.trim() : undefined,
    dateRange: posDateRange.value,
  })
}

watch([posTypeFilter, posDateRange], () => {
  fetchPositionsHistory()
})

let posSearchTimeout = null
watch(posSearchQuery, () => {
  if (posSearchTimeout) clearTimeout(posSearchTimeout)
  posSearchTimeout = setTimeout(() => {
    fetchPositionsHistory()
  }, 300)
})

const filteredPositions = computed(() => {
  return positionsStore.closedPositionsData || []
})

// --- 2. Orders Filters ---
const orderStateFilter = ref('all')
const orderTypeFilter = ref('all')
const orderSearchQuery = ref('')
const orderDateRange = ref([null, null])

const orderStateOptions = computed(() => filterStore.ordersStateOptions)
const orderTypeOptions = computed(() => filterStore.ordersTypeOptions)

const fetchOrdersHistory = () => {
  const acc = orderStore.selectedAccount
  if (!acc) return
  orderStore.fetchOrders(acc, {
    state: orderStateFilter.value !== 'all' ? orderStateFilter.value : undefined,
    type: orderTypeFilter.value !== 'all' ? orderTypeFilter.value : undefined,
    search: orderSearchQuery.value.trim() ? orderSearchQuery.value.trim() : undefined,
    dateRange: orderDateRange.value,
  })
}

watch([orderStateFilter, orderTypeFilter, orderDateRange], () => {
  fetchOrdersHistory()
})

let orderSearchTimeout = null
watch(orderSearchQuery, () => {
  if (orderSearchTimeout) clearTimeout(orderSearchTimeout)
  orderSearchTimeout = setTimeout(() => {
    fetchOrdersHistory()
  }, 300)
})

const filteredOrders = computed(() => {
  return orderStore.ordersData || []
})

// --- 3. Deals Filters ---
const dealTypeFilter = ref('all')
const dealEntryFilter = ref('all')
const dealSearchQuery = ref('')
const dealDateRange = ref([null, null])

const dealTypeOptions = computed(() => filterStore.dealsActionOptions)
const dealEntryOptions = computed(() => filterStore.dealsEntryOptions)

const fetchDealsHistory = () => {
  const acc = orderStore.selectedAccount
  if (!acc) return
  dealsStore.fetchDeals(acc, {
    type: dealTypeFilter.value !== 'all' ? dealTypeFilter.value : undefined,
    entry: dealEntryFilter.value !== 'all' ? dealEntryFilter.value : undefined,
    search: dealSearchQuery.value.trim() ? dealSearchQuery.value.trim() : undefined,
    dateRange: dealDateRange.value,
  })
}

watch([dealTypeFilter, dealEntryFilter, dealDateRange], () => {
  fetchDealsHistory()
})

let dealSearchTimeout = null
watch(dealSearchQuery, () => {
  if (dealSearchTimeout) clearTimeout(dealSearchTimeout)
  dealSearchTimeout = setTimeout(() => {
    fetchDealsHistory()
  }, 300)
})

const filteredDeals = computed(() => {
  return dealsStore.dealsData || []
})

// React when selectedAccount changes in store
watch(() => orderStore.selectedAccount, (newAcc) => {
  if (newAcc) {
    if (activeSubTab.value === 'positions') fetchPositionsHistory()
    else if (activeSubTab.value === 'orders') fetchOrdersHistory()
    else if (activeSubTab.value === 'deals') fetchDealsHistory()
  }
})

onMounted(() => {
  if (orderStore.selectedAccount) {
    if (activeSubTab.value === 'positions') fetchPositionsHistory()
    else if (activeSubTab.value === 'orders') fetchOrdersHistory()
    else if (activeSubTab.value === 'deals') fetchDealsHistory()
  }
})

// --- Shared Helpers ---
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

const getPnl = (pos) => {
  return Number(pos.pnl || pos.profit || pos.realized_pnl || 0)
}

const getStatusClass = (status) => {
  if (!status) return 'bg-secondary-text/20 text-secondary-text'
  const str = String(status).toUpperCase()
  if (str === 'CLOSED') return 'bg-primary-blue/20 text-primary-blue'
  if (str.includes('FILLED') || str === '4') return 'bg-primary-green/20 text-primary-green'
  if (str.includes('REJECT') || str.includes('CANCEL')) return 'bg-primary-red/20 text-primary-red'
  return 'bg-amber-500/20 text-amber-500'
}

const getStatusLabel = (state) => {
  if (typeof state === 'number') {
    switch (state) {
      case 1: return 'PLACED'
      case 4: return 'FILLED'
      default: return String(state)
    }
  }
  return String(state || 'COMPLETED')
}

const formatNum = (val) => {
  if (val === undefined || val === null || val === '') return '-'
  const num = Number(val)
  if (isNaN(num)) return '-'
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '$0.00'
  const num = Number(val)
  return num.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
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
