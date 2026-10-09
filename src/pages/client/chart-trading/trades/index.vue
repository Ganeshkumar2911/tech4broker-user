<template>
  <div 
    id="tour-trading-trades-panel"
    :class="[
      'flex flex-col text-primary-text transition-all duration-300 select-none',
      isFullscreen 
        ? 'fixed inset-0 z-[9999] p-4 bg-background h-screen w-screen overflow-hidden' 
        : 'bg-card-background border border-primary-border h-full rounded-lg overflow-hidden'
    ]"
  >
    <!-- Header Controls & Tabs Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-2.5 border-b border-primary-border">
      <!-- Left: Account Selector + Tab Buttons -->
      <div class="flex items-center gap-3 overflow-x-auto no-scrollbar">
        <!-- Account Select Dropdown -->
        <div id="tour-trading-account-select" class="w-[180px] sm:w-[220px] shrink-0">
          <BaseSelect 
            v-model="selectedAccount" 
            :options="accountOptions" 
            placeholder="Select Account" 
            height="32px" 
            rounded="lg" 
            variant="surface" 
          />
        </div>

        <div class="h-5 w-px bg-primary-border shrink-0" />

        <!-- Tab Buttons -->
        <div class="flex items-center gap-4 shrink-0">
          <button
            v-for="tab in tradesTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="pb-1.5 px-1 text-xs md:text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            :class="activeTab === tab.id ? 'text-primary-text' : 'text-secondary-text hover:text-primary-text'"
          >
            <span>{{ tab.name }}</span>
            <!-- Count Badge -->
            <span 
              v-if="tab.count !== undefined" 
              class="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold"
            >
              {{ tab.count }}
            </span>
            
            <!-- Underline Indicator -->
            <span
              v-if="activeTab === tab.id"
              class="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full"
            ></span>
          </button>
        </div>
      </div>

      <!-- Right: Action Controls (Refresh, Fullscreen Toggle) -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Refresh Button -->
        <button 
          @click="refreshData"
          :disabled="positionsStore.loading || orderStore.ordersLoading || dealsStore.loading"
          class="bg-background hover:bg-card-background border border-primary-border text-primary-text rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-colors"
          title="Refresh Data"
        >
          <RotateCw :class="['h-3.5 w-3.5 text-secondary-text', (positionsStore.loading || orderStore.ordersLoading || dealsStore.loading) ? 'animate-spin' : '']" />
        </button>

        <!-- Fullscreen Button -->
        <button 
          @click="isFullscreen = !isFullscreen"
          class="bg-background hover:bg-card-background border border-primary-border text-primary-text rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-colors"
          :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'"
        >
          <Minimize2 v-if="isFullscreen" class="h-3.5 w-3.5 text-primary" />
          <Maximize2 v-else class="h-3.5 w-3.5 text-secondary-text" />
        </button>
      </div>
    </div>

    <!-- Active Content Area -->
    <div class="flex-1 min-h-0 relative">
      <KeepAlive>
        <component :is="activeComponent" v-model:active-sub-tab="historySubTab" />
      </KeepAlive>
    </div>

    <!-- Footer Pagination Bar -->
    <div v-if="activePagination?.total_pages > 1 || activePagination?.total_items > 0" class="p-2 border-t border-primary-border bg-background/40 shrink-0">
      <Pagination 
        :pagination="activePagination" 
        :show-info="true"
        @change="handlePageChange" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RotateCw, Maximize2, Minimize2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import useOrderStore from '@/stores/client/orders'
import usePositionsStore from '@/stores/client/positions'
import useDealsStore from '@/stores/client/deals'
import { useTradeBookFiltersStore } from '@/stores/shared/tradeBookFilters'
import { useTradingAccountsStore } from '@/stores/client/tradingAccounts'
import BaseSelect from '@/components/base/BaseSelect.vue'
import Pagination from '@/components/base/Pagination.vue'

import TradesTab from './trades/index.vue'
import HistoryTab from './history/index.vue'

const orderStore = useOrderStore()
const positionsStore = usePositionsStore()
const dealsStore = useDealsStore()
const tradingAccountStore = useTradingAccountsStore()
const filterStore = useTradeBookFiltersStore()

const { selectedAccount } = storeToRefs(orderStore)
const { data: tradingAccounts } = storeToRefs(tradingAccountStore)

const activeTab = ref('trades') // default tab 'trades'
const historySubTab = ref('positions') // 'positions', 'orders', 'deals'
const isFullscreen = ref(false)

// Account Options dropdown list
const accountOptions = computed(() => {
  if (!tradingAccounts.value || !Array.isArray(tradingAccounts.value)) return []
  return tradingAccounts.value.map((acc) => {
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

// Auto select account from options while preserving valid persisted selection
watch(accountOptions, (newOptions) => {
  if (!newOptions || newOptions.length === 0) return

  if (selectedAccount.value !== null && selectedAccount.value !== undefined) {
    const exists = newOptions.some((opt) => String(opt.value) === String(selectedAccount.value))
    if (exists) {
      const matched = newOptions.find((opt) => String(opt.value) === String(selectedAccount.value))
      if (matched && matched.value !== selectedAccount.value) {
        selectedAccount.value = matched.value
      }
      return
    }
  }

  selectedAccount.value = newOptions[0].value
}, { immediate: true })

const tradesTabs = computed(() => {
  const openPosCount = (positionsStore.data || []).filter(p => p.status !== 'CLOSED').length
  const pendingCount = (orderStore.pendingOrdersData || []).length
  const closedCount = (positionsStore.closedPositionsData?.length) || (positionsStore.data || []).filter(p => p.status === 'CLOSED').length
  const pastOrdersCount = (orderStore.ordersData || []).filter(o => {
    const stateStr = String(o.state_name || o.state || o.status || '').toUpperCase()
    return stateStr !== 'PLACED' && stateStr !== '1'
  }).length
  const dealsCount = (dealsStore.dealsData || []).length

  return [
    { id: 'trades', name: 'Trades', count: openPosCount + pendingCount },
    { id: 'history', name: 'History', count: closedCount + pastOrdersCount + dealsCount }
  ]
})

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case 'trades':
      return TradesTab
    case 'history':
      return HistoryTab
    default:
      return TradesTab
  }
})

const activePagination = computed(() => {
  if (activeTab.value === 'history') {
    if (historySubTab.value === 'positions') {
      return positionsStore.closedPagination
    } else if (historySubTab.value === 'orders') {
      return orderStore.pagination
    } else if (historySubTab.value === 'deals') {
      return dealsStore.pagination
    }
  }
  return positionsStore.pagination
})

const handlePageChange = (page) => {
  if (activeTab.value === 'history') {
    if (historySubTab.value === 'positions') {
      positionsStore.setClosedPage(page)
    } else if (historySubTab.value === 'orders') {
      orderStore.setPage(page)
    } else if (historySubTab.value === 'deals') {
      dealsStore.setPage(page)
    }
  } else {
    positionsStore.setPage(page)
  }
}

const refreshData = () => {
  if (selectedAccount.value) {
    positionsStore.fetchPositions(selectedAccount.value)
    positionsStore.fetchClosedPositions(selectedAccount.value)
    orderStore.fetchPendingOrders(selectedAccount.value)
    orderStore.fetchOrders(selectedAccount.value)
    dealsStore.fetchDeals(selectedAccount.value)
  }
}

onMounted(() => {
  filterStore.fetchFilterMetadata()
  tradingAccountStore.setPlatformFilter('real')
  tradingAccountStore.fetchAccounts()
  if (selectedAccount.value) {
    refreshData()
  }
})

watch(selectedAccount, (newAcc) => {
  if (newAcc) {
    refreshData()
  }
}, { immediate: true })
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