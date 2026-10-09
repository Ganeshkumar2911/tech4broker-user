<template>
  <div class="px-4">

    <!-- Account Info Card -->
    <div v-if="activeAccount" class="bg-card-background border border-primary-border rounded-xl p-4 mb-6 flex flex-wrap items-center gap-8 shadow-sm">
      <div>
        <p class="text-[10px] uppercase tracking-widest text-secondary-text mb-1 font-semibold">Account</p>
        <p class="text-sm font-bold text-primary-text">#{{ activeAccount.login }}</p>
      </div>
      <div>
        <p class="text-[10px] uppercase tracking-widest text-secondary-text mb-1 font-semibold">Platform</p>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-button text-button-text">{{ activeAccount.platform }}</span>
      </div>
      <div>
        <p class="text-[10px] uppercase tracking-widest text-secondary-text mb-1 font-semibold">Type</p>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded border border-primary-border text-secondary-text capitalize">{{ activeAccount.raw.account_type }}</span>
      </div>
      <div v-if="activeAccount.raw.account_category !== null">
        <p class="text-[10px] uppercase tracking-widest text-secondary-text mb-1 font-semibold">Category</p>
        <p class="text-sm font-bold text-primary-text capitalize">{{ activeAccount.raw.account_category }}</p>
      </div>
      <div v-if="activeAccount.broker_leverage">
        <p class="text-[10px] uppercase tracking-widest text-secondary-text mb-1 font-semibold">Leverage</p>
        <p class="text-sm font-bold text-primary-text">1:{{ activeAccount.broker_leverage }}</p>
      </div>
      <div>
        <p class="text-[10px] uppercase tracking-widest text-secondary-text mb-1 font-semibold">Balance</p>
        <p class="text-sm font-bold text-primary-text tabular-nums">{{ formatNum(activeAccount.balance) }} {{ currencyDisplay }}</p>
      </div>
      <div>
        <p class="text-[10px] uppercase tracking-widest text-secondary-text mb-1 font-semibold">PnL</p>
        <p class="text-sm font-bold tabular-nums" :class="(activeAccount.pnl ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'">
          {{ (activeAccount.pnl ?? 0) >= 0 ? '+' : '' }}{{ formatNum(activeAccount.pnl) }} {{ currencyDisplay }}
        </p>
      </div>
    </div>

    <!-- Header -->
    <!-- <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-base font-semibold text-primary-text">Account Transactions</h1>
        <p class="text-xs text-secondary-text mt-0.5">Transaction history for account #{{ route.params.id }}</p>
      </div>
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search transactions..."
          class="pl-9 pr-4 py-2 text-xs rounded-xl bg-background border border-primary-border text-primary-text outline-none focus:border-primary transition-colors placeholder:text-secondary-text w-52"
          @input="onSearch"
        />
      </div>
    </div> -->

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      <template v-if="store.isLoading">
        <div v-for="n in 6" :key="n" class="bg-card-background border border-primary-border rounded-2xl p-4 animate-pulse space-y-2">
          <div class="h-3 w-24 bg-background rounded" />
          <div class="h-6 w-28 bg-background rounded" />
        </div>
      </template>
      <template v-else>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1">Current Balance</p>
          <p class="text-2xl font-semibold" :class="store.summary.net_flow >= 0 ? 'text-primary-green' : 'text-primary-red'">
            {{ store.summary.net_flow >= 0 ? '+' : '' }}{{ store.summary.current_balance }} {{ currencyDisplay }}
          </p>
        </div>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1">Total Transactions</p>
          <p class="text-2xl font-semibold text-primary-text">{{ store.summary.total_transactions ?? 0 }}</p>
        </div>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1">Total Credits</p>
          <p class="text-2xl font-semibold text-primary-green">+{{ formatNum(store.summary.current_credit) }} {{ currencyDisplay }}</p>
        </div>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1"> Current Equity</p>
          <p class="text-2xl font-semibold text-primary-green">{{ store.summary.current_equity }} {{ currencyDisplay }}</p>
        </div>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1">Total Deposit</p>
          <p class="text-2xl font-semibold text-primary-green">+ {{ formatNum(store.summary.total_deposit) }} {{ currencyDisplay }}</p>
        </div>
        <div class="bg-card-background border border-primary-border rounded-2xl p-4">
          <p class="text-[11px] uppercase tracking-wide text-secondary-text mb-1">Total Withdrawal</p>
          <p class="text-2xl font-semibold text-primary-red">-{{ formatNum(store.summary.total_withdrawal) }} {{ currencyDisplay }}</p>
        </div>
      </template>
    </div>

    <!-- Table Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div>
        <h3 class="text-sm font-bold text-primary-text uppercase tracking-wider">
          Transaction History
        </h3>
        <p class="text-xs text-secondary-text mt-0.5 font-medium">
          Detailed list of all deposits, withdrawals, and account transactions.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <RefreshButton
          :loading="store.isLoading"
          title="Refresh Transactions"
          :icon-size="16"
          button-class="w-9 h-9"
          @click="store.fetchTransactions(route.params.id, true)"
        />
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="hidden md:block border border-primary-border rounded-2xl">
      <table class="w-full border-collapse">
        <thead class="border-b border-primary-border bg-card-background">
          <tr>
            <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest px-4 py-3">Transaction</th>
            <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest px-4 py-3">Type</th>
            <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest px-4 py-3">Direction</th>
            <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest px-4 py-3">Amount</th>
            <!-- <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest px-4 py-3">Bal. Before</th> -->
            <!-- <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest px-4 py-3">Bal. After</th> -->
            <th class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest px-4 py-3">Reference</th>
            <th class="text-right text-[11px] font-medium text-secondary-text uppercase tracking-widest px-4 py-3">Date</th>
          </tr>
        </thead>

        <!-- Skeleton -->
        <tbody v-if="store.isLoading">
          <tr v-for="n in 8" :key="n" class="border-b border-primary-border bg-card-background animate-pulse">
            <td class="px-4 py-3.5">
              <div class="space-y-1.5">
                <div class="h-3 w-10 bg-background rounded" />
                <div class="h-2.5 w-28 bg-background rounded" />
              </div>
            </td>
            <td class="px-4 py-3.5"><div class="h-5 w-16 bg-background rounded-full" /></td>
            <td class="px-4 py-3.5"><div class="h-5 w-14 bg-background rounded-full" /></td>
            <td class="px-4 py-3.5"><div class="h-3 w-16 bg-background rounded" /></td>
            <!-- <td class="px-4 py-3.5"><div class="h-3 w-16 bg-background rounded" /></td>
            <td class="px-4 py-3.5"><div class="h-3 w-16 bg-background rounded" /></td> -->
            <td class="px-4 py-3.5"><div class="h-3 w-20 bg-background rounded" /></td>
            <td class="px-4 py-3.5 flex justify-end"><div class="h-3 w-20 bg-background rounded" /></td>
          </tr>
        </tbody>

        <!-- Empty -->
        <tbody v-else-if="store.data.length === 0">
          <tr>
            <td colspan="8" class="py-20 text-center bg-card-background">
              <div class="flex flex-col items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                  <Receipt class="w-5 h-5 text-secondary-text" />
                </div>
                <p class="text-sm font-medium text-primary-text">No transactions found</p>
                <p class="text-xs text-secondary-text">Transactions will appear here once recorded</p>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Data -->
        <tbody v-else>
          <tr
            v-for="tx in store.data"
            :key="tx.transaction_id"
            class="border-b border-primary-border last:border-none bg-card-background hover:bg-background transition-colors"
          >
            <td class="px-4 py-3.5">
              <p class="text-xs font-medium text-primary-text">#{{ tx.transaction_id }}</p>
              <p class="text-[11px] text-secondary-text max-w-[160px] truncate">{{ tx.description }}</p>
            </td>

            <td class="px-4 py-3.5">
              <span class="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize" :class="typeClass(tx.type)">
                {{ formatType(tx.type) }}
              </span>
            </td>

            <td class="px-4 py-3.5">
              <span
                class="text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-fit capitalize"
                :class="tx.direction === 'credit'
                  ? 'bg-primary-green text-black'
                  : 'bg-primary-red text-white'"
              >
                <ArrowDownLeft v-if="tx.direction === 'credit'" class="w-3 h-3" />
                <ArrowUpRight v-else class="w-3 h-3" />
                {{ tx.direction }}
              </span>
            </td>

            <td class="px-4 py-3.5">
              <span
                class="text-xs font-medium tabular-nums"
                :class="tx.direction === 'credit' ? 'text-primary-green' : 'text-primary-red'"
              >
                {{ tx.direction === 'credit' ? '+' : '-' }}{{ formatNum(tx.amount) }} {{ currencyDisplay }}
              </span>
            </td>

            <!-- <td class="px-4 py-3.5 text-xs text-secondary-text tabular-nums">{{ currencySymbol }} {{ formatNum(tx.balance_before) }}</td> -->
            <!-- <td class="px-4 py-3.5 text-xs text-primary-text tabular-nums">{{ currencySymbol }} {{ formatNum(tx.balance_after) }}</td> -->
            <td class="px-4 py-3.5 text-xs text-secondary-text">{{ tx.reference_id ?? '—' }}</td>
            <td class="px-4 py-3.5 text-xs text-secondary-text text-right">{{ formatDate(tx.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-3">
      <template v-if="store.isLoading">
        <div v-for="n in 4" :key="n" class="bg-card-background border border-primary-border rounded-2xl p-4 animate-pulse space-y-3">
          <div class="flex items-center justify-between">
            <div class="h-3 w-16 bg-background rounded" />
            <div class="h-5 w-14 bg-background rounded-full" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="m in 4" :key="m" class="h-12 bg-background rounded-xl" />
          </div>
        </div>
      </template>

      <div v-else-if="store.data.length === 0" class="py-16 text-center">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-card-background flex items-center justify-center">
            <Receipt class="w-5 h-5 text-secondary-text" />
          </div>
          <p class="text-sm font-medium text-primary-text">No transactions found</p>
        </div>
      </div>

      <div
        v-else
        v-for="tx in store.data"
        :key="tx.transaction_id"
        class="bg-card-background border border-primary-border rounded-2xl p-4 space-y-3"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-xs font-medium text-primary-text">#{{ tx.transaction_id }}</p>
            <p class="text-[11px] text-secondary-text mt-0.5">{{ tx.description }}</p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize" :class="typeClass(tx.type)">
              {{ formatType(tx.type) }}
            </span>
            <span
              class="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize"
              :class="tx.direction === 'credit' ? 'bg-primary-green text-black' : 'bg-primary-red text-white'"
            >
              {{ tx.direction }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="bg-background rounded-xl px-3 py-2.5">
            <p class="text-[10px] text-secondary-text mb-1">Amount</p>
            <p class="text-xs font-semibold tabular-nums" :class="tx.direction === 'credit' ? 'text-primary-green' : 'text-primary-red'">
              {{ tx.direction === 'credit' ? '+' : '-' }}{{ formatNum(tx.amount) }} {{ currencyDisplay }}
            </p>
          </div>
          <div class="bg-background rounded-xl px-3 py-2.5">
            <p class="text-[10px] text-secondary-text mb-1">Balance After</p>
            <p class="text-xs font-semibold text-primary-text tabular-nums">{{ formatNum(tx.balance_after) }} {{ currencyDisplay }}</p>
          </div>
          <div class="bg-background rounded-xl px-3 py-2.5">
            <p class="text-[10px] text-secondary-text mb-1">Reference</p>
            <p class="text-xs font-medium text-primary-text truncate">{{ tx.reference_id ?? '—' }}</p>
          </div>
          <div class="bg-background rounded-xl px-3 py-2.5">
            <p class="text-[10px] text-secondary-text mb-1">Date</p>
            <p class="text-xs font-medium text-primary-text">{{ formatDate(tx.created_at) }}</p>
          </div>
        </div>
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
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Receipt, ArrowUpRight, ArrowDownLeft } from 'lucide-vue-next'
import { useAccountTransactionsStore } from '@/stores/client/transactions'
import Pagination from '@/components/base/Pagination.vue'
import RefreshButton from '@/components/base/RefreshButton.vue'

const store = useAccountTransactionsStore()
const activeCurrency = ref(localStorage.getItem('active_currency') || 'USD')
const activeAccount = ref(null)

const currencySymbol = computed(() => {
  const syms = { USD: '$', USC: 'C' }
  return syms[activeCurrency.value?.toUpperCase()] || '$'
})

const currencyDisplay = computed(() => {
  return activeAccount.value?.broker_currency?.toUpperCase() || 'USD'
})

const route = useRoute()
const searchQuery = ref('')

let searchTimer = null
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.fetchTransactions(route.params.id, true)
  }, 500)
}

const handlePageChange = (page) => {
  store.setPage(page)
  store.fetchTransactions(route.params.id, true)
}

const formatNum = (val) => (val ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate = (val) => {
  if (!val) return '—';

  const date = new Date(val);

  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${datePart} ${timePart}`;
};
const formatType = (t) => t?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—'

const typeClass = (type) => ({
  trade_pnl: 'bg-button text-button-text',
  fee_paid:  'bg-primary-yellow text-black',
  deposit:   'bg-primary-green text-black',
  withdrawal:'bg-primary-red text-white',
  bonus:     'bg-primary-yellow text-black',
}[type] ?? 'border border-primary-border text-secondary-text')

onMounted(() => {
  try {
    const stored = localStorage.getItem('active_account')
    if (stored) activeAccount.value = JSON.parse(stored)
  } catch (e) {
    // ignore parsing errors
  }
  store.fetchTransactions(route.params.id)
})
</script>