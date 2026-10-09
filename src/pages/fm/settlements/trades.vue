<template>
  <div class="px-4 pb-8 space-y-6">

    <!-- Header & Navigation -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
      <div class="flex items-center gap-2.5">
        <button
          :disabled="store.loading"
          class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary-border bg-card-background hover:bg-background text-xs font-medium text-secondary-text hover:text-primary-text transition-colors disabled:opacity-50 cursor-pointer"
          @click="loadTrades"
        >
          <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': store.loading }" />
          Refresh
        </button>

        <button
          class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary-border bg-card-background hover:bg-background text-xs font-medium text-primary-text transition-colors cursor-pointer"
          @click="goToDetails"
        >
          <Eye class="w-3.5 h-3.5 text-primary" />
          Settlement Overview
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <template v-if="store.loading && !store.records?.length">
        <div v-for="n in 4" :key="n" class="bg-card-background border border-primary-border rounded-2xl p-4 animate-pulse space-y-2">
          <div class="h-3 w-24 bg-background rounded" />
          <div class="h-6 w-28 bg-background rounded" />
        </div>
      </template>
      <template v-else>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1">Total Trades</p>
          <p class="text-2xl font-bold text-primary-text">{{ store.summary.total_trades }}</p>
        </div>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1">Total PnL</p>
          <p class="text-2xl font-bold tabular-nums" :class="store.summary.total_pnl >= 0 ? 'text-primary-green' : 'text-primary-red'">
            {{ store.summary.total_pnl >= 0 ? '+' : '' }}${{ formatNum(store.summary.total_pnl) }}
          </p>
        </div>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1">Net PnL</p>
          <p class="text-2xl font-bold tabular-nums" :class="store.summary.net_pnl >= 0 ? 'text-primary-green' : 'text-primary-red'">
            {{ store.summary.net_pnl >= 0 ? '+' : '' }}${{ formatNum(store.summary.net_pnl) }}
          </p>
        </div>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1">Total Fee</p>
          <p class="text-2xl font-bold text-primary-text tabular-nums">${{ formatNum(store.summary.total_fee) }}</p>
        </div>
      </template>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card-background border border-primary-border rounded-xl p-2.5">
      <div class="flex items-center gap-2 flex-wrap flex-1">
        <!-- Client Filter -->
        <BaseSelect
          v-model="store.filters.user_id"
          :options="clientOptions"
          placeholder="All Clients"
          class="w-full sm:w-48"
          @update:modelValue="handleFilterChange"
        />

        <!-- Account Filter -->
        <BaseSelect
          v-model="store.filters.trading_account_id"
          :options="accountOptions"
          placeholder="All Accounts"
          class="w-full sm:w-48"
          @update:modelValue="handleFilterChange"
        />

        <!-- Reset Button -->
        <button
          v-if="store.filters.user_id || store.filters.trading_account_id"
          type="button"
          class="rounded-lg px-2.5 py-2 text-xs font-medium text-secondary-text hover:bg-background hover:text-primary-text transition-colors cursor-pointer flex items-center gap-1.5"
          @click="clearFilters"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-secondary-text px-1">
          Showing <strong>{{ store.records.length }}</strong> of <strong>{{ store.pagination.total_items }}</strong> trades
        </span>

        <BaseSelect
        :modelValue="store.pagination.per_page"
        :options="store.perPageOptions"
        placeholder="Per page..."
        class="w-32"
        @update:modelValue="(val) => store.updatePerPage(settlementId, val)"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="w-full border border-primary-border rounded-2xl overflow-hidden bg-card-background shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b border-primary-border bg-background/50">
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Trade ID</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Client</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Account</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Symbol</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Type</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Volume</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">PnL</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Fee</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">FM Fee</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Broker Net</th>
              <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">IB Share</th>
              <th class="text-center text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Status</th>
              <th class="text-right text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3">Closed / Opened</th>
            </tr>
          </thead>

          <!-- Skeleton -->
          <tbody v-if="store.loading">
            <tr v-for="n in 8" :key="n" class="border-b border-primary-border animate-pulse">
              <td class="p-3"><div class="h-3 w-12 bg-background rounded" /></td>
              <td class="p-3"><div class="h-3 w-28 bg-background rounded" /></td>
              <td class="p-3"><div class="h-3 w-20 bg-background rounded" /></td>
              <td class="p-3"><div class="h-3 w-14 bg-background rounded" /></td>
              <td class="p-3"><div class="h-5 w-10 bg-background rounded-full" /></td>
              <td class="p-3"><div class="h-3 w-10 bg-background rounded" /></td>
              <td class="p-3"><div class="h-3 w-16 bg-background rounded" /></td>
              <td class="p-3"><div class="h-3 w-12 bg-background rounded" /></td>
              <td class="p-3"><div class="h-3 w-12 bg-background rounded" /></td>
              <td class="p-3"><div class="h-3 w-12 bg-background rounded" /></td>
              <td class="p-3"><div class="h-3 w-12 bg-background rounded" /></td>
              <td class="p-3"><div class="h-5 w-14 bg-background rounded-full mx-auto" /></td>
              <td class="p-3 flex justify-end"><div class="h-3 w-20 bg-background rounded" /></td>
            </tr>
          </tbody>

          <!-- Empty -->
          <tbody v-else-if="store.records.length === 0">
            <tr>
              <td colspan="13" class="py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-card-background border border-primary-border flex items-center justify-center">
                    <BarChart2 class="w-5 h-5 text-secondary-text" />
                  </div>
                  <p class="text-sm font-semibold text-primary-text">No trades found</p>
                  <p class="text-xs text-secondary-text">No trades recorded for this settlement</p>
                  <button
                    v-if="store.filters.user_id || store.filters.trading_account_id"
                    class="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
                    @click="clearFilters"
                  >
                    Clear Filters
                  </button>
                </div>
              </td>
            </tr>
          </tbody>

          <!-- Data -->
          <tbody v-else>
            <tr
              v-for="row in store.records"
              :key="row.trade_id"
              class="border-b border-primary-border last:border-none hover:bg-background/40 transition-colors"
            >
              <td class="p-3 text-xs font-bold font-mono text-primary">#{{ row.trade_id }}</td>

              <td class="p-3">
                <p class="text-xs font-semibold text-primary-text">{{ row.client?.name ?? row.client_name ?? '—' }}</p>
                <p class="text-[11px] text-secondary-text font-mono">{{ row.client?.email ?? row.client_email ?? '' }}</p>
              </td>

              <td class="p-3">
                <p class="text-xs font-mono font-medium text-primary-text">
                  #{{ row.trading_account?.account_number ?? row.account_number ?? '—' }}
                </p>
                <p class="text-[11px] text-secondary-text">{{ row.trading_account?.broker ?? '' }}</p>
              </td>

              <td class="p-3">
                <span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-background border border-primary-border text-primary-text">
                  {{ row.symbol ?? '—' }}
                </span>
              </td>

              <td class="p-3">
                <span
                  class="text-2xs font-bold px-2 py-0.5 rounded-full border uppercase"
                  :class="String(row.order_type || row.type).toLowerCase() === 'buy'
                    ? 'bg-primary-green/10 text-primary-green border-primary-green/20'
                    : 'bg-primary-red/10 text-primary-red border-primary-red/20'"
                >
                  {{ row.order_type || row.type || '—' }}
                </span>
              </td>

              <td class="p-3 text-xs font-mono text-primary-text tabular-nums">{{ formatNum(row.lot ?? row.volume) }}</td>

              <td class="p-3">
                <span
                  class="text-xs font-bold font-mono tabular-nums"
                  :class="(row.pnl ?? row.gross_pnl ?? 0) >= 0 ? 'text-primary-green' : 'text-primary-red'"
                >
                  {{ (row.pnl ?? row.gross_pnl ?? 0) >= 0 ? '+' : '' }}${{ formatNum(row.pnl ?? row.gross_pnl) }}
                </span>
              </td>

              <td class="p-3 text-xs font-mono text-primary-text tabular-nums">${{ formatNum(row.fee) }}</td>

              <td class="p-3 text-xs font-mono text-secondary-text tabular-nums">
                {{ row.fm_fee != null ? `$${formatNum(row.fm_fee)}` : '—' }}
              </td>

              <td class="p-3 text-xs font-mono text-secondary-text tabular-nums">
                {{ row.broker_net != null ? `$${formatNum(row.broker_net)}` : (row.broker_fee != null ? `$${formatNum(row.broker_fee)}` : '—') }}
              </td>

              <td class="p-3 text-xs font-mono text-primary-green tabular-nums">
                {{ row.ib_distributed != null ? `$${formatNum(row.ib_distributed)}` : '—' }}
              </td>

              <td class="p-3 text-center">
                <span class="text-2xs font-medium px-2 py-0.5 rounded-full border capitalize inline-block" :class="statusClass(row.status)">
                  {{ row.status ?? '—' }}
                </span>
              </td>

              <td class="p-3 text-xs text-secondary-text text-right font-mono">
                {{ formatDate(row.closed_at ?? row.opened_at ?? row.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-4">
      <Pagination
        v-if="store.pagination.total_items > store.pagination.per_page"
        :pagination="store.pagination"
        @page-change="handlePageChange"
      />
    </div>

  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BarChart2, ArrowLeft, RotateCw, Eye, RotateCcw } from 'lucide-vue-next'
import { useSettlementTradesStore } from '@/stores/fm/settlements/settlementTrades'
import Pagination from '@/components/base/Pagination.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'

const store = useSettlementTradesStore()
const route = useRoute()
const router = useRouter()
const settlementId = route.params.id

const clientOptions = computed(() => {
  return [
    { label: 'All Clients', value: null },
    ...store.filterOptions.clients.map(c => ({
      label: c.name || `User #${c.user_id}`,
      value: c.user_id,
    }))
  ]
})

const accountOptions = computed(() => {
  return [
    { label: 'All Accounts', value: null },
    ...store.filterOptions.trading_accounts.map(a => ({
      label: a.account_number || `Account #${a.trading_account_id}`,
      value: a.trading_account_id,
    }))
  ]
})

const handleFilterChange = () => {
  store.setPage(settlementId, 1)
}

const clearFilters = () => {
  store.filters.user_id = null
  store.filters.trading_account_id = null
  store.setPage(settlementId, 1)
}

const handlePageChange = (page) => {
  store.setPage(settlementId, page)
}

const loadTrades = () => {
  store.fetchTrades(settlementId)
}

const goBack = () => {
  router.push(`/fm-settlements/${settlementId}`)
}

const goToDetails = () => {
  router.push(`/fm-settlements/${settlementId}`)
}

const formatNum = (val) =>
  (Number(val) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const formatDate = (val) => {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val)
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch (e) {
    return String(val)
  }
}

const statusClass = (s) =>
  ({
    closed: 'bg-background text-secondary-text border-primary-border',
    open: 'bg-primary-blue/10 text-primary-blue border-primary-blue/20',
    completed: 'bg-primary-green/10 text-primary-green border-primary-green/20',
    pending: 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20',
    cancelled: 'bg-primary-red/10 text-primary-red border-primary-red/20',
  }[String(s).toLowerCase()] ?? 'bg-background text-secondary-text border-primary-border')

onMounted(() => {
  store.fetchFilterOptions()
  loadTrades()
})
</script>