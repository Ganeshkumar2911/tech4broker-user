<template>
  <div class="space-y-6 min-h-screen">
    <!-- Header -->
    <div v-if="showHeader">
      <h2 class="text-primary-text font-bold text-2xl">Followers</h2>
      <p class="text-xs text-secondary-text mt-1">
        Overview of investors following your fund manager account.
      </p>
    </div>

    <!-- Filters Row -->
    <div id="tour-fm-followers-filters" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <!-- Status Filter Tabs (Left) -->
      <AccountFilterTabs
        :model-value="store.status"
        :tabs="statusTabs"
        @update:model-value="store.setStatus"
      />

      <!-- Select Offer, Search & Refresh (Right / End) -->
      <div class="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
        <!-- Offer Dropdown Filter -->
        <div v-if="store.offers.length > 0" class="w-48">
          <BaseSelect
            :model-value="store.offerId"
            :options="store.offers"
            placeholder="All Offers"
            borderless
            rounded="full"
            @update:model-value="store.setOfferId"
          />
        </div>

        <!-- Search Input -->
        <BaseSearch
          :model-value="store.search"
          placeholder="Search followers..."
          container-class="w-full sm:w-64"
          @update:modelValue="store.setSearch"
        />

        <Tooltip text="Refresh Followers" position="top">
          <RefreshButton
            :loading="store.isLoading"
            :icon-size="16"
            button-class="w-9 h-9"
            @click="store.fetchFollowers(true)"
          />
        </Tooltip>
      </div>
    </div>

    <!-- Followers Data Table -->
    <div id="tour-fm-followers-table" class="bg-card-background border-0 shadow-none rounded-2xl overflow-hidden">
      <WatchDataTable
        :show-tabs="false"
        :columns="columns"
        :rows="store.data"
        :loading="store.isLoading"
        :total-items="store.pagination.total_items"
        row-key="id"
        :page="store.pagination.page"
        :total-pages="store.pagination.total_pages"
        empty-text="No followers found."
        @update:page="handlePageChange"
      >
        <!-- Account Cell -->
        <template #cell-account="{ row }">
          <div class="flex items-center gap-2.5">
            <div
              class="w-7 h-7 rounded-full bg-primary-blue/10 text-primary-blue flex items-center justify-center text-[10px] font-bold shrink-0"
            >
              {{ displayInitial(row.account_number) }}
            </div>
            <span class="font-bold text-primary-text font-mono">
              #{{ row.account_number || "—" }}
            </span>
          </div>
        </template>

        <!-- User Cell -->
        <template #cell-user="{ row }">
          <div>
            <p class="font-bold text-primary-text">
              {{ row.name || "—" }}
            </p>
            <p v-if="row.email" class="text-xs text-secondary-text truncate">
              {{ row.email }}
            </p>
          </div>
        </template>

        <!-- Offer Cell -->
        <template #cell-offer="{ row }">
          <span
            v-if="row.offer_name"
            class="text-xs font-semibold text-primary-blue bg-primary-blue/10 px-2.5 py-1 rounded-md inline-block"
          >
            {{ row.offer_name }}
          </span>
          <span v-else class="text-xs text-secondary-text">—</span>
        </template>

        <!-- Server Cell -->
        <template #cell-server="{ row }">
          <span
            class="inline-flex items-center gap-1.5 bg-background border border-primary-border/60 text-primary-text text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
          >
            {{ row.server || "—" }}
          </span>
        </template>

        <!-- Equity Cell -->
        <template #cell-equity="{ row }">
          <span class="font-bold font-mono tabular-nums text-primary-text">
            {{ formatCurrency(row.equity) }}
          </span>
        </template>

        <!-- Net Profit Cell -->
        <template #cell-netProfit="{ row }">
          <span
            class="font-bold font-mono tabular-nums px-2 py-0.5 rounded text-xs"
            :class="
              (row.net_profit ?? 0) >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            "
          >
            {{ (row.net_profit ?? 0) >= 0 ? "+" : "" }}{{ formatCurrency(row.net_profit) }}
          </span>
        </template>

        <!-- Lot Type Cell -->
        <template #cell-lotType="{ row }">
          <span class="text-xs text-secondary-text font-medium uppercase">
            {{ row.lot_type || "—" }}
          </span>
        </template>

        <!-- Lot Value Cell -->
        <template #cell-lotValue="{ row }">
          <span class="font-semibold font-mono tabular-nums text-primary-text">
            {{ row.lot_value ?? "—" }}
          </span>
        </template>

        <!-- Status Cell -->
        <template #cell-status="{ row }">
          <BaseBadge :status="isActive(row.status) ? 'Active' : 'Inactive'" />
        </template>

        <!-- Action Cell -->
        <template #cell-action="{ row }">
          <div class="flex items-center justify-end gap-2">
            <Tooltip text="View follower trading history" position="top">
              <button
                type="button"
                @click="navigateToTrades(row.id)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                aria-label="View Follower Trades"
              >
                <BookOpen class="w-3.5 h-3.5" />
                <span>Trades</span>
              </button>
            </Tooltip>

            <Tooltip text="View follower account details" position="top">
              <button
                type="button"
                @click="navigateToFollowerInfo(row.id)"
                class="p-1.5 rounded-full bg-background hover:bg-primary-border/40 text-secondary-text hover:text-primary-text cursor-pointer inline-flex items-center justify-center transition-colors"
                aria-label="View Follower Details"
              >
                <ChevronsRight class="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </template>
      </WatchDataTable>
    </div>

    <!-- Disclaimer -->
    <AccountsDisclaimer />
  </div>
</template>

<script setup>
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { BookOpen, ChevronsRight } from "lucide-vue-next";
import RefreshButton from "@/components/base/RefreshButton.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import AccountFilterTabs from "@/components/client/accounts/AccountFilterTabs.vue";
import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";

import { useFollowersStore } from "@/stores/fm/followers";

defineProps({
  showHeader: {
    type: Boolean,
    default: true,
  },
});

const router = useRouter();
const store = useFollowersStore();

const statusTabs = computed(() => [
  {
    label: "All",
    value: "all",
    count: store.counts.all ?? (store.status === "all" ? store.pagination.total_items : undefined),
  },
  {
    label: "Active",
    value: "active",
    count: store.counts.active ?? (store.status === "active" ? store.pagination.total_items : undefined),
  },
  {
    label: "Paused",
    value: "paused",
    count: store.counts.paused ?? (store.status === "paused" ? store.pagination.total_items : undefined),
  },
]);

const columns = [
  { key: "account", label: "Account", headerClass: "pl-6 sm:pl-8", cellClass: "pl-6 sm:pl-8" },
  { key: "user", label: "User" },
  { key: "offer", label: "Offer" },
  { key: "server", label: "Server" },
  { key: "equity", label: "Equity", align: "right" },
  { key: "netProfit", label: "Net Profit", align: "right" },
  { key: "lotType", label: "Lot Type", align: "center" },
  { key: "lotValue", label: "Lot Value", align: "right" },
  { key: "status", label: "Status", align: "center" },
  { key: "action", label: "Action", align: "right", headerClass: "pr-6 sm:pr-8", cellClass: "pr-6 sm:pr-8" },
];

const displayInitial = (value) => {
  return value ? value.toString().charAt(0).toUpperCase() : "?";
};

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const isActive = (status) => status === true || status === "active";

const handlePageChange = (page) => {
  store.pagination.page = page;
  store.fetchFollowers(true, page, store.search);
};

const navigateToTrades = (id) => {
  router.push({ name: "follower-trades", params: { id } });
};

const navigateToFollowerInfo = (id) => {
  router.push({ name: "follower-info", params: { id } });
};

onMounted(() => {
  store.fetchFollowers();
});
</script>
