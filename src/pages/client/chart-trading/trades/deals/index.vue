<template>
  <div class="flex flex-col h-full text-primary-text">
    <!-- Filter Control Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 border-b border-primary-border bg-background/40">
      <!-- Left: Type Select, Entry Select & Search Bar -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Type Filter using custom BaseSelect -->
        <BaseSelect 
          v-model="dealsStore.filters.typeFilter"
          :options="typeOptions"
          placeholder="Filter Type"
          height="32px"
          width="140px"
          rounded="lg"
          variant="surface"
          @change="applyFilters"
        />

        <!-- Entry Filter using custom BaseSelect -->
        <BaseSelect 
          v-model="dealsStore.filters.entryFilter"
          :options="entryOptions"
          placeholder="Filter Entry"
          height="32px"
          width="140px"
          rounded="lg"
          variant="surface"
          @change="applyFilters"
        />

        <!-- Search Input for Symbol or Ticket -->
        <BaseSearch 
          v-model="dealsStore.filters.searchQuery"
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
          v-model="dealsStore.filters.dateRange"
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
          <div 
            v-for="deal in dealsStore.dealsData" 
            :key="deal.id || deal.deal_ticket" 
            class="grid grid-cols-12 w-full gap-2 items-center py-2 px-3 text-[11px] md:text-xs border-b border-primary-border/30 hover:bg-background/80 transition-colors font-medium"
          >
            <!-- Symbol & Deal Ticket -->
            <div class="col-span-2 flex items-center gap-1.5 min-w-0">
              <div class="flex flex-col truncate">
                <span class="text-primary-text text-[13px] font-bold leading-tight">{{ deal.symbol }}</span>
                <span class="text-[12px] text-secondary-text">#{{ deal.deal_ticket || deal.id }}</span>
              </div>
            </div>

            <!-- Account Number -->
            <div class="col-span-1.5 flex items-center gap-1.5 min-w-0">
              <div class="flex flex-col truncate">
                <span class="text-primary-text font-bold leading-tight">#{{ deal.account_number || deal.login || '-' }}</span>
              </div>
            </div>

            <!-- Type -->
            <div class="col-span-1">
              <span 
                class="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
                :class="deal.action_name === 'BUY' || deal.action === 0 || deal.type === 'BUY' ? 'bg-primary-green/15 text-primary-green' : 'bg-primary-red/15 text-primary-red'"
              >
                {{ deal.action_name || deal.type || (deal.action === 0 ? 'BUY' : 'SELL') }}
              </span>
            </div>

            <!-- Entry (IN / OUT) -->
            <div class="col-span-0.5">
              <span 
                class="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase"
                :class="deal.entry_name === 'IN' || deal.entry === 0 ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'"
              >
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

            <!-- Swap / Storage -->
            <div class="col-span-1 text-right text-secondary-text">
              {{ formatCurrency(deal.storage || 0) }}
            </div>

            <!-- Profit / PnL -->
            <div 
              class="col-span-1 text-right font-semibold"
              :class="(deal.profit || 0) >= 0 ? 'text-[#34A853]' : 'text-[#EA4335]'"
            >
              {{ (deal.profit || 0) >= 0 ? '+' : '' }}{{ formatCurrency(deal.profit || 0) }}
            </div>

            <!-- Dedicated Time Column -->
            <div class="col-span-2.5 text-right text-[11px] text-secondary-text whitespace-nowrap font-mono" :title="formatDate(deal.time || deal.created_at)">
              {{ formatDate(deal.time || deal.created_at) }}
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="dealsStore.loading" class="flex flex-col items-center justify-center py-10 text-secondary-text gap-2">
            <Loader2 class="h-5 w-5 animate-spin text-primary" />
            <span class="text-xs">Loading deals...</span>
          </div>

          <!-- Empty State -->
          <div v-else-if="dealsStore.dealsData.length === 0" class="flex flex-col items-center justify-center py-10 text-secondary-text text-xs gap-1">
            <span class="font-medium">No deals found</span>
            <span class="text-[10px] opacity-70">Executed deals will appear here</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import useDealsStore from '@/stores/client/deals'
import useOrderStore from '@/stores/client/orders'
import BaseDateRangePicker from '@/components/base/BaseDateRangePicker.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseSearch from '@/components/base/BaseSearch.vue'
import { Loader2 } from 'lucide-vue-next'

const dealsStore = useDealsStore()
const orderStore = useOrderStore()

const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'BUY', value: 'BUY' },
  { label: 'SELL', value: 'SELL' }
]

const entryOptions = [
  { label: 'All Entries', value: 'all' },
  { label: 'IN', value: 'IN' },
  { label: 'OUT', value: 'OUT' }
]

let searchDebounceTimer = null

const handleSearchInput = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    applyFilters()
  }, 350)
}

const applyFilters = () => {
  if (orderStore.selectedAccount) {
    dealsStore.fetchDeals(orderStore.selectedAccount)
  }
}

const clearDateRange = () => {
  dealsStore.filters.dateRange = [null, null]
  applyFilters()
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
