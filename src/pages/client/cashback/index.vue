<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCashbackStore } from '@/stores/client/cashback';
import BaseTabs from '@/components/base/BaseTabs.vue';
import CashbackWalletCard from '@/components/client/cashback/CashbackWalletCard.vue';
import CashbackAccountsList from '@/components/client/cashback/CashbackAccountsList.vue';
import CashbackTransactions from '@/components/client/cashback/CashbackTransactions.vue';
import CashbackRedemptions from '@/components/client/cashback/CashbackRedemptions.vue';
import CashbackPlans from '@/components/client/cashback/CashbackPlans.vue';

const route = useRoute();
const router = useRouter();
const store = useCashbackStore();

const activeTab = ref('overview');

const tabList = computed(() => [
  {
    label: 'Overview',
    value: 'overview',
  },
  {
    label: 'Plans',
    value: 'plans',
  },
  {
    label: 'Transactions',
    value: 'transactions',
  },
  {
    label: 'Redemptions',
    value: 'redemptions',
  }
]);

const selectTab = (tabValue) => {
  activeTab.value = tabValue;
  router.replace({ query: { ...route.query, tab: tabValue } });
  
  if (tabValue === 'transactions') {
    store.fetchTransactions(1, 50);
  } else if (tabValue === 'redemptions') {
    store.fetchRedemptions(1, 50);
  }
};

watch(() => route.query.tab, (newTab) => {
  if (newTab && ['overview', 'plans', 'transactions', 'redemptions'].includes(newTab)) {
    activeTab.value = newTab;
  }
});

onMounted(() => {
  const queryTab = route.query.tab;
  if (queryTab && ['overview', 'plans', 'transactions', 'redemptions'].includes(queryTab)) {
    activeTab.value = queryTab;
  }

  // Fetch initial data
  store.fetchProgram();
  store.fetchAccounts();
  store.fetchBalance();
});
</script>

<template>
  <div class="space-y-6 pb-12 w-full max-w-full">
    <!-- Top Level Tabs -->
    <div class="w-full max-w-full overflow-x-auto no-scrollbar">
      <BaseTabs
        :model-value="activeTab"
        @update:model-value="selectTab"
        :tabs="tabList"
      />
    </div>

    <!-- OVERVIEW TAB -->
    <div v-if="activeTab === 'overview'" class="space-y-6 animate-in fade-in duration-200">
      <div v-if="store.isProgramLoading && !store.isProgramFetched" class="animate-pulse h-32 bg-card-background rounded-3xl" />
      <div v-else-if="store.program">
        <div>
          <h3 class="text-lg font-bold text-primary-text mb-4">Trading Accounts</h3>
          <CashbackAccountsList />
        </div>
      </div>
      <div v-else class="p-6 bg-card-background rounded-3xl text-center text-secondary-text">
        Cashback program is currently unavailable.
      </div>
    </div>

    <!-- PLANS TAB -->
    <div v-else-if="activeTab === 'plans'" class="space-y-6 animate-in fade-in duration-200">
      <CashbackPlans />
    </div>

    <!-- TRANSACTIONS TAB -->
    <div v-else-if="activeTab === 'transactions'" class="space-y-6 animate-in fade-in duration-200">
      <CashbackWalletCard v-if="store.program" />
      <CashbackTransactions />
    </div>

    <!-- REDEMPTIONS TAB -->
    <div v-else-if="activeTab === 'redemptions'" class="space-y-6 animate-in fade-in duration-200">
      <CashbackRedemptions />
    </div>
  </div>
</template>
