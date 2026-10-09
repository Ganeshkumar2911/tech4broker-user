<script setup>
import { computed } from 'vue';
import { useCashbackStore } from '@/stores/client/cashback';
import DataTable from '@/components/base/datatable/DataTable.vue';
import { formatDate } from '@/utils/timeFormatter';

const store = useCashbackStore();

const columns = [
  { key: 'created_at', label: 'Date & Time' },
  { key: 'id', label: 'Redemption ID' },
  { key: 'trading_account_id', label: 'Destination Account' },
  { key: 'amount', label: 'Amount (USD)' },
  { key: 'status', label: 'Status' }
];

const onPageChange = (page) => {
  store.fetchRedemptions(page, store.redemptionsPagination.per_page);
};
</script>

<template>
  <div class="bg-card-background rounded-3xl p-6 border border-primary-border/10 shadow-xs">
    <div class="mb-6 flex justify-between items-center">
      <h3 class="text-xl font-bold text-primary-text">Redemption History</h3>
    </div>
    
    <DataTable
      :columns="columns"
      :rows="store.redemptions"
      :loading="store.isRedemptionsLoading"
      :page="store.redemptionsPagination.page"
      :total-pages="store.redemptionsPagination.pages"
      :total-items="store.redemptionsPagination.total"
      empty-text="No redemptions yet"
      empty-subtitle="Your redeemed cashback will appear here."
      @update:page="onPageChange"
    >
      <template #cell-created_at="{ row }">
        <span class="text-secondary-text text-xs whitespace-nowrap">
          {{ formatDate(row.created_at) }}
        </span>
      </template>
      
      <template #cell-id="{ row }">
        <span class="text-xs text-primary-text font-mono">#{{ row.id }}</span>
      </template>

      <template #cell-trading_account_id="{ row }">
        <span class="text-xs font-bold text-primary-text">
          {{ row.trading_account_id }}
        </span>
      </template>

      <template #cell-amount="{ row }">
        <span class="font-mono text-sm font-bold text-emerald-400 tabular-nums">
          ${{ Number(row.amount).toFixed(2) }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <span 
          class="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider inline-block"
          :class="{
            'bg-emerald-500/10 text-emerald-400': row.status === 'completed',
            'bg-amber-500/10 text-amber-400': row.status === 'pending',
            'bg-red-500/10 text-red-400': row.status === 'failed'
          }"
        >
          {{ row.status }}
        </span>
      </template>
    </DataTable>
  </div>
</template>
