<template>
  <div class="space-y-6">
    <!-- Header Controls & Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      <!-- Sleek Stats Pills -->
      <div v-if="store.isFetched" class="flex items-center gap-2">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card-background text-xs">
          <span class="text-secondary-text">Total Subscriptions:</span>
          <span class="font-bold text-primary-text font-mono">
            {{ store.summary.total_memberships || store.pagination.total_items || store.records.length }}
          </span>
        </div>

        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card-background text-xs">
          <span class="text-secondary-text">Total Trades:</span>
          <span class="font-bold text-primary-text font-mono">
            {{ store.summary.total_trades || 0 }}
          </span>
        </div>
      </div>
      <div v-else />

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <BaseSearch
          v-model="store.filters.search"
          placeholder="Search FM, label, offer..."
          container-class="w-full sm:w-60"
          @update:modelValue="onSearch"
        />

        <button
          v-if="hasFilters"
          type="button"
          class="flex items-center justify-center px-4 h-10 rounded-full bg-card-background text-primary-text text-xs font-medium hover:opacity-80 transition-all cursor-pointer shrink-0 border-0 shadow-none outline-none focus:outline-none"
          @click="store.resetFilters()"
        >
          Clear
        </button>

        <RefreshButton
          :loading="store.loading"
          title="Refresh"
          @click="store.fetchHistory(true)"
        />
      </div>
    </div>

    <!-- Skeleton Cards -->
    <div v-if="store.loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="n in 6" :key="n" class="bg-card-background rounded-4xl p-6 flex flex-col gap-4 animate-pulse">
        <div class="flex items-center justify-between pb-3 border-b border-primary-border/60">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-primary-border/60 shrink-0" />
            <div class="space-y-1.5">
              <div class="h-4 w-28 bg-primary-border/60 rounded" />
              <div class="h-3 w-20 bg-primary-border/40 rounded" />
            </div>
          </div>
          <div class="h-6 w-14 bg-primary-border/40 rounded-full" />
        </div>

        <div class="space-y-1.5 pb-3 border-b border-primary-border/60">
          <div class="h-3 w-16 bg-primary-border/40 rounded" />
          <div class="h-6 w-28 bg-primary-border/60 rounded" />
        </div>

        <div class="space-y-2.5">
          <div v-for="m in 5" :key="m" class="flex items-center justify-between">
            <div class="h-3.5 w-20 bg-primary-border/40 rounded" />
            <div class="h-3.5 w-16 bg-primary-border/60 rounded" />
          </div>
        </div>

        <div class="pt-2">
          <div class="w-full h-9 bg-primary-border/40 rounded-full" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="store.records.length === 0"
      class="bg-card-background rounded-4xl p-8 sm:p-12 flex flex-col items-center justify-center text-center"
    >
      <EmptyState
        title="No Following History Found"
        subtitle="You do not have any past fund manager memberships."
      />
    </div>

    <!-- FM History Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="row in store.records"
        :key="row.id || row.follower_id"
        class="bg-card-background rounded-4xl p-6 flex flex-col justify-between gap-4 transition-all duration-200"
      >
        <!-- Top Section -->
        <div class="space-y-4">
          <!-- FM Header -->
          <div class="flex items-center justify-between gap-3 pb-3 border-b border-primary-border/80">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div
                class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden"
              >
                <img
                  :src="getAvatar(row.fund_manager?.id || row.id)"
                  :alt="row.fund_manager?.name || 'FM'"
                  class="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center gap-2 min-w-0">
                  <p class="text-sm font-bold text-primary-text leading-tight truncate">
                    {{ row.fund_manager?.name ?? 'Unnamed FM' }}
                  </p>
                  <span
                    v-if="getRowCurrency(row)"
                    class="inline-flex items-center px-2 py-0.5 rounded-full bg-background text-[10px] font-bold text-secondary-text uppercase tracking-wider shrink-0"
                  >
                    {{ getRowCurrency(row) }}
                  </span>
                </div>
                <p class="text-xs text-secondary-text truncate mt-0.5">
                  {{ formatDate(row.joined_at) }} – {{ row.left_at ? formatDate(row.left_at) : 'Left' }}
                </p>
              </div>
            </div>

            <!-- Status Pill: Past -->
            <span
              class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-background text-secondary-text shrink-0"
            >
              Past
            </span>
          </div>

          <!-- Net Profit Highlight -->
          <div class="pb-3 border-b border-primary-border/80">
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-secondary-text">Net Profit</span>
              <Tooltip text="Net profit earned from copying this strategy after performance fee deductions" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <div class="flex items-baseline justify-between gap-2 mt-1">
              <p
                class="font-bold text-xl font-mono tabular-nums leading-tight"
                :class="(row.net_profit ?? 0) >= 0 ? 'text-primary-green' : 'text-primary-red'"
              >
                {{ formatPnlValue(row.net_profit, getRowCurrency(row)) }}
              </p>
              <span class="text-xs text-secondary-text truncate">
                Gross: <span class="font-semibold text-primary-text font-mono">{{ formatPnlValue(row.gross_pnl ?? row.realized_pnl, getRowCurrency(row)) }}</span>
              </span>
            </div>
          </div>

          <!-- Stats List -->
          <div class="space-y-2.5 text-xs">
            <div class="flex items-center justify-between text-[13px]">
              <span class="text-secondary-text">Account</span>
              <span class="font-bold text-primary-text font-mono">
                #{{ row.account?.account_number || row.trading_account_id || '—' }}
                <span v-if="row.account?.broker_label" class="font-medium text-secondary-text font-sans">
                  ({{ row.account.broker_label }})
                </span>
              </span>
            </div>

            <div class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Lot Settings</span>
                <Tooltip text="Copied lot sizing mode (Fixed lot or Multiplier ratio)" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="font-bold text-primary-text capitalize">
                {{ row.lot_value != null ? row.lot_value : 1 }}{{ row.lot_type === 'multiplier' ? 'x' : ' Lots' }} ({{ row.lot_type ?? 'Fixed' }})
              </span>
            </div>

            <div class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Total Trades</span>
                <Tooltip text="Number of copied trades executed for this strategy" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="font-bold text-primary-text font-mono">{{ row.total_trades ?? 0 }}</span>
            </div>

            <div class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Total Fees</span>
                <Tooltip text="Cumulative performance and management fees paid to the manager" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="font-bold text-primary-text font-mono">{{ formatCurrencyValue(row.total_fees, getRowCurrency(row)) }}</span>
            </div>

            <div class="flex items-center justify-between text-[13px]">
              <div class="flex items-center gap-1.5">
                <span class="text-secondary-text">Performance Fee</span>
                <Tooltip text="Profit share percentage charged by the fund manager on profitable trades" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="font-bold text-primary-text font-mono">{{ row.fund_manager?.performance_fee ?? row.offer?.performance_fee ?? 0 }}%</span>
            </div>

            <div v-if="row.offer?.name" class="flex items-center justify-between text-[13px]">
              <span class="text-secondary-text">Offer</span>
              <span class="font-medium text-primary-text truncate max-w-45">{{ row.offer.name }}</span>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="pt-2">
          <button
            type="button"
            @click="goToTradeBook(row)"
            class="w-full flex items-center justify-center gap-1.5 bg-background hover:bg-primary-border/40 text-primary-text font-bold text-xs py-2.5 rounded-full transition-all duration-200 cursor-pointer"
          >
            <BookOpen class="w-3.5 h-3.5 text-secondary-text" />
            <span>Trade Book</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
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
import { useRouter } from 'vue-router'
import { History, CalendarDays, BookOpen, Users, TrendingUp, Info } from 'lucide-vue-next'
import { useFollowedFundManagersHistoryStore } from '@/stores/fm/followedFundManagersHistory'
import BaseSearch from '@/components/base/BaseSearch.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import RefreshButton from '@/components/base/RefreshButton.vue'
import Pagination from '@/components/base/Pagination.vue'
import Tooltip from '@/components/base/Tooltip.vue'
import { formatDate } from '@/utils/timeFormatter.js'
import { getAvatar } from '@/utils/avtar.js'

const store = useFollowedFundManagersHistoryStore()
const router = useRouter()

const hasFilters = computed(() => Boolean(store.filters.search || store.filters.offer_id || store.filters.offer_name || store.filters.trading_account_id))

let searchTimer = null
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => store.applyFilters(), 400)
}

const goToTradeBook = (row) => {
  const accNum =
    row?.account?.account_number || row?.trading_account_id || row?.account_number || "";
  const fmName =
    row?.fund_manager?.name ||
    row?.trade_book?.fund_manager?.name ||
    row?.fund_manager?.label_name ||
    row?.label_name ||
    row?.name ||
    "";
  const fmAvatarId =
    row?.fund_manager?.id ||
    row?.trade_book?.fund_manager?.id ||
    row?.fm_id ||
    row?.id ||
    "";
  if (accNum) {
    localStorage.setItem("follower_account_number", accNum);
  }
  if (fmName) {
    localStorage.setItem("follower_fm_name", fmName);
  }
  if (fmAvatarId) {
    localStorage.setItem("follower_fm_avatar", String(fmAvatarId));
  }
  const followerId = row.id || row.follower_id || row.trade_book?.follower_id;
  router.push({
    path: `/copy-trading/trade-book/${followerId}`,
    query: { from: 'history' },
  });
};

const handlePageChange = (page) => {
  store.setPage(page)
}

const getRowCurrency = (row) => {
  return (
    row?.account?.broker_currency ||
    row?.broker_currency ||
    row?.account?.currency ||
    row?.fund_manager?.broker_currency ||
    row?.fund_manager?.currency ||
    row?.currency ||
    'USD'
  )
}

const formatBrokerCurrency = (currency) => {
  const normalizedCurrency = String(currency || '').trim().toUpperCase()
  const currencySymbols = {
    USD: '$',
    USC: 'C',
    CENT: 'C',
    CAD: 'C$',
    EUR: '€',
    GBP: '£',
  }

  return currencySymbols[normalizedCurrency] || normalizedCurrency || '$'
}

const fmt = (v) => (v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatCurrencyValue = (val, currency = 'USD') => {
  if (val === null || val === undefined || isNaN(val)) return '—'
  const sym = formatBrokerCurrency(currency)
  return `${sym}${fmt(Number(val))}`
}

const formatPnlValue = (val, currency = 'USD') => {
  if (val === null || val === undefined || isNaN(val)) return '—'
  const num = Number(val)
  if (isNaN(num)) return '—'
  const sym = formatBrokerCurrency(currency)
  const prefix = num >= 0 ? `+${sym}` : `-${sym}`
  return `${prefix}${Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

onMounted(() => {
  store.fetchHistory()
})
</script>
