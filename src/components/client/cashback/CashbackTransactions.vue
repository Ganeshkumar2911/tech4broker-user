<script setup>
import { computed } from 'vue';
import { useCashbackStore } from '@/stores/client/cashback';
import DataTable from '@/components/base/datatable/DataTable.vue';
import { formatDate } from '@/utils/timeFormatter';

const store = useCashbackStore();

const columns = [
  { key: 'created_at', label: 'Date & Time' },
  { key: 'trading_account_id', label: 'Account' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'transaction_type', label: 'Type' },
  { key: 'lots', label: 'Lots' },
  { key: 'profit', label: 'Profit' },
  { key: 'plan_code', label: 'Plan / Deal' },
  { key: 'rate_per_lot', label: 'Rate/Lot' },
  { key: 'amount', label: 'Amount (USD)' },
  { key: 'status', label: 'Status' }
];

const onPageChange = (page) => {
  store.fetchTransactions(page, store.transactionsPagination.per_page);
};
</script>

<template>
  <div class="bg-card-background rounded-3xl p-6 border border-primary-border/10 shadow-xs">
    <div class="mb-6 flex justify-between items-center">
      <h3 class="text-xl font-bold text-primary-text">Cashback Ledger</h3>
    </div>
    
    <DataTable
      :columns="columns"
      :rows="store.transactions"
      :loading="store.isTransactionsLoading"
      :page="store.transactionsPagination.page"
      :total-pages="store.transactionsPagination.pages"
      :total-items="store.transactionsPagination.total"
      empty-text="No transactions yet"
      empty-subtitle="Your cashback earnings and redemptions will appear here."
      @update:page="onPageChange"
    >
      <template #cell-created_at="{ row }">
        <span class="text-secondary-text text-xs whitespace-nowrap">
          {{ formatDate(row.created_at) }}
        </span>
      </template>

      <template #cell-trading_account_id="{ row }">
        <span class="text-xs font-medium text-primary-text">{{ row.trading_account.account_number || '-' }}</span>
      </template>

      <template #cell-symbol="{ row }">
        <span class="text-xs font-bold text-primary-text">{{ row.symbol || '-' }}</span>
      </template>

      <template #cell-transaction_type="{ row }">
        <span 
          class="px-2 py-0.5 text-2xs font-bold rounded-full uppercase tracking-wider"
          :class="{
            'bg-emerald-500/10 text-emerald-400': row.transaction_type === 'EARN',
            'bg-blue-500/10 text-blue-400': row.transaction_type === 'REDEEM',
            'bg-amber-500/10 text-amber-400': row.transaction_type === 'REVERSE',
            'bg-purple-500/10 text-purple-400': row.transaction_type === 'ADJUST'
          }"
        >
          {{ row.transaction_type }}
        </span>
      </template>

      <template #cell-lots="{ row }">
        <span class="text-xs text-secondary-text tabular-nums">{{ row.lots ? Number(row.lots).toFixed(2) : '-' }}</span>
      </template>

      <template #cell-profit="{ row }">
        <span class="text-xs tabular-nums" :class="row.profit && Number(row.profit) < 0 ? 'text-red-400' : (row.profit ? 'text-emerald-400' : 'text-secondary-text')">
          {{ row.profit ? (Number(row.profit) > 0 ? '+' : '') + '$' + Number(row.profit).toFixed(2) : '-' }}
        </span>
      </template>

      <template #cell-plan_code="{ row }">
        <div class="text-xs text-secondary-text">
          <span v-if="row.plan_code" class="capitalize font-bold">{{ row.plan_code }} Plan</span>
          <span v-if="row.mt5_deal_id" class="block text-2xs">Deal: {{ row.mt5_deal_id }}</span>
          <span v-if="!row.plan_code && !row.mt5_deal_id">-</span>
        </div>
      </template>

      <template #cell-rate_per_lot="{ row }">
        <span class="text-xs text-secondary-text tabular-nums">{{ row.rate_per_lot ? '$' + Number(row.rate_per_lot).toFixed(2) : '-' }}</span>
      </template>

      <template #cell-amount="{ row }">
        <span 
          class="font-mono text-sm font-bold tabular-nums"
          :class="row.transaction_type === 'REDEEM' || row.transaction_type === 'REVERSE' ? 'text-red-400' : 'text-emerald-400'"
        >
          {{ row.transaction_type === 'REDEEM' || row.transaction_type === 'REVERSE' ? '-' : '+' }}${{ Number(row.amount).toFixed(2) }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <span 
          class="text-xs"
          :class="{
            'text-emerald-400': row.status === 'CREDITED' || row.status === 'COMPLETED',
            'text-secondary-text opacity-70': row.status === 'SKIPPED',
            'text-red-400': row.status === 'FAILED'
          }"
        >
          {{ row.status }}
        </span>
      </template>
    </DataTable>
  </div>
</template>
