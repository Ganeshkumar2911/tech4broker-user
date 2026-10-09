<template>
  <div class="min-h-screen pb-12 space-y-6">
    <!-- Top Back Navigation & Header Bar -->
    <div
      v-if="!store.detailLoading && clientDetails"
      class="relative bg-card-background border border-primary-border/60 rounded-3xl p-5 sm:p-6"
    >
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-5"
      >
        <!-- Left: Back Button + Client Avatar & Information -->
        <div class="flex items-start sm:items-center gap-4 flex-1 min-w-0">
          <!-- Avatar Initial -->
          <div class="relative shrink-0">
            <div
              class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden"
            >
              <span class="text-primary text-xl font-bold">
                {{ clientNameInitial }}
              </span>
            </div>
          </div>

          <!-- User Details & Meta -->
          <div class="flex-1 min-w-0 space-y-1.5">
            <!-- Name & Status Badges -->
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-primary-text font-bold text-lg sm:text-xl truncate">
                {{ clientDisplayName }}
              </h3>

              <!-- KYC Badge -->
              <BaseBadge
                v-if="clientDetails.kyc_status"
                :value="clientDetails.kyc_status"
                size="xs"
              />

              <!-- Stage Badge -->
              <BaseBadge
                v-if="clientDetails.stage"
                :value="clientDetails.stage"
                size="xs"
              />

              <!-- Active Status -->
              <BaseBadge
                :status="clientDetails.is_active !== false ? 'Active' : 'Inactive'"
                size="xs"
              />
            </div>

            <!-- Contact Details Row -->
            <div
              class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-secondary-text"
            >
              <span v-if="clientEmail" class="inline-flex items-center gap-1.5">
                <Mail class="w-3.5 h-3.5" />
                {{ clientEmail }}
              </span>

              <span v-if="clientPhone" class="inline-flex items-center gap-1.5 font-mono">
                <Phone class="w-3.5 h-3.5" />
                {{ clientPhone }}
              </span>

              <span v-if="referralLink" class="inline-flex items-center gap-1.5">
                <Link2 class="w-3.5 h-3.5" />
                <span class="font-medium">Ref:</span>
                <span v-if="referralLink.name" class="font-semibold text-primary-text">{{ referralLink.name }}</span>
                <span v-if="referralLink.code" class="font-mono font-bold text-primary-text bg-background px-1.5 py-0.5 rounded-md text-[11px] border border-primary-border/60">{{ referralLink.code }}</span>
              </span>

              <span v-if="clientDetails.created_at" class="inline-flex items-center gap-1.5">
                <span>Joined:</span>
                <span class="font-medium text-primary-text">{{ formatDate(clientDetails.created_at) }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Date Range Filter & Actions -->
        <div class="flex items-center gap-2 shrink-0 self-start lg:self-center">
          <BaseDateRangePicker
            borderless
            v-model="dateRange"
            placeholder="Filter dates..."
            width="220"
            bg-class="bg-background"
            @apply="handleDateApply"
            @clear="handleDateClear"
          />
          <RefreshButton
            :loading="store.detailLoading"
            title="Refresh Details"
            bg-class="bg-background"
            :icon-size="16"
            @click="reloadDetails"
          />
        </div>
      </div>
    </div>

    <!-- Pure Skeleton Loader State -->
    <div v-if="store.detailLoading" class="space-y-6 animate-pulse">
      <!-- Header Skeleton Card -->
      <div class="bg-card-background rounded-3xl p-5 sm:p-6 space-y-4">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-primary-border/60 shrink-0" />
            <div class="space-y-2">
              <div class="h-6 w-48 bg-primary-border/70 rounded-lg" />
              <div class="h-4 w-32 bg-primary-border/50 rounded-md" />
              <div class="h-3 w-64 bg-primary-border/40 rounded-md" />
            </div>
          </div>
          <div class="h-10 w-48 bg-background rounded-full shrink-0" />
        </div>
      </div>

      <!-- Performance Cards Skeleton Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div
          v-for="n in 5"
          :key="n"
          class="bg-card-background rounded-3xl p-5 space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="h-3.5 w-24 bg-primary-border/50 rounded" />
            <div class="w-8 h-8 rounded-full bg-primary-border/50" />
          </div>
          <div class="h-7 w-28 bg-primary-border/70 rounded-lg" />
          <div class="h-3 w-20 bg-primary-border/40 rounded" />
        </div>
      </div>

      <!-- Table Skeleton Card -->
      <div class="bg-card-background rounded-3xl p-5 sm:p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div class="h-5 w-40 bg-primary-border/70 rounded-lg" />
          <div class="h-9 w-60 bg-background rounded-full" />
        </div>
        <div class="space-y-2.5">
          <div
            v-for="n in 5"
            :key="n"
            class="h-12 w-full bg-background/80 rounded-xl"
          />
        </div>
      </div>
    </div>

    <!-- Error / Not Found State -->
    <div
      v-else-if="!clientDetails"
      class="h-96 flex flex-col items-center justify-center text-center p-6 bg-card-background rounded-3xl border border-primary-border/60 space-y-4"
    >
      <div class="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
        <Info class="w-8 h-8" />
      </div>
      <div class="space-y-1 max-w-sm">
        <h3 class="text-base font-bold text-primary-text">Client Not Found</h3>
        <p class="text-xs text-secondary-text">
          The requested client could not be loaded or is not associated with your IB profile.
        </p>
      </div>
      <button
        type="button"
        @click="handleBack"
        class="py-2.5 px-5 rounded-2xl bg-button text-button-text font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
      >
        Return to Clients List
      </button>
    </div>

    <!-- Main Content State (Loaded) -->
    <template v-else>
      <!-- Summary Cards Grid (8 Metrics) -->
      <div class="bg-card-background rounded-3xl p-5 lg:p-6">
        <!-- Top Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-6 lg:gap-0 divide-y sm:divide-y-0 lg:divide-x divide-primary-border">
          <!-- 1. Total Deposit -->
          <div class="flex items-center gap-3 pb-4 sm:pb-0 lg:pr-6">
            <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
              <span class="material-symbols-rounded text-[28px] text-black dark:text-white">payments</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <p class="text-[11px] font-bold text-secondary-text uppercase tracking-wider truncate">Total Deposit</p>
                <Tooltip text="Cumulative deposits" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <h3 class="text-xl sm:text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums tracking-tight">
                ${{ formatNum(summaryMetrics.total_deposit) }}
              </h3>
            </div>
          </div>

          <!-- 2. Total Withdrawal -->
          <div class="flex items-center gap-3 py-4 sm:py-0 lg:px-6">
            <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
              <span class="material-symbols-rounded text-[28px] text-black dark:text-white">account_balance</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <p class="text-[11px] font-bold text-secondary-text uppercase tracking-wider truncate">Total Withdrawal</p>
                <Tooltip text="Cumulative withdrawals" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <h3 class="text-xl sm:text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums tracking-tight">
                ${{ formatNum(summaryMetrics.total_withdrawal) }}
              </h3>
            </div>
          </div>

          <!-- 3. Total Balance -->
          <div class="flex items-center gap-3 py-4 sm:py-0 lg:px-6">
            <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
              <span class="material-symbols-rounded text-[28px] text-black dark:text-white">account_balance_wallet</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <p class="text-[11px] font-bold text-secondary-text uppercase tracking-wider truncate">Total Balance</p>
                <Tooltip text="Across trading accounts" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <h3 class="text-xl sm:text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums tracking-tight">
                ${{ formatNum(summaryMetrics.total_balance) }}
              </h3>
            </div>
          </div>

          <!-- 4. Total Equity -->
          <div class="flex items-center gap-3 pt-4 sm:pt-0 lg:pl-6">
            <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
              <span class="material-symbols-rounded text-[28px] text-black dark:text-white">stacked_line_chart</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <p class="text-[11px] font-bold text-secondary-text uppercase tracking-wider truncate">Total Equity</p>
                <Tooltip text="Live account equity" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <h3 class="text-xl sm:text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums tracking-tight">
                ${{ formatNum(summaryMetrics.total_equity) }}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Trading Accounts Table Card -->
      <div
        class="bg-card-background border border-primary-border/60 rounded-3xl p-5 sm:p-6 space-y-4"
      >
        <!-- Card Header & Search -->
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div class="flex items-center gap-2">
            <h4 class="text-base font-bold text-primary-text">
              Trading Accounts
            </h4>
            <span
              class="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {{ filteredAccounts.length }}
            </span>
          </div>

          <!-- Account Search -->
          <BaseSearch
            v-model="accountSearch"
            placeholder="Search account #, server, type..."
            container-class="w-full sm:w-72"
          />
        </div>

        <!-- Accounts DataTable -->
        <div class="overflow-hidden rounded-2xl border border-primary-border/40">
          <DataTable
            :columns="accountTableColumns"
            :rows="filteredAccounts"
            empty-text="No trading accounts registered for this client."
          >
            <!-- Custom Login Cell -->
            <template #cell-account_number="{ row }">
              <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-primary-text py-1">
                <span>{{ row.account_number || `Account #${row.id}` }}</span>
                <button
                  v-if="row.account_number"
                  type="button"
                  @click="copyText(row.account_number, row.id || row.account_number)"
                  class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer p-0.5"
                  title="Copy Account Number"
                >
                  <component
                    :is="copiedId === (row.id || row.account_number) ? Check : Copy"
                    class="w-3.5 h-3.5 text-emerald-500"
                    v-if="copiedId === (row.id || row.account_number)"
                  />
                  <Copy v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </template>

            <!-- Custom Type Cell -->
            <template #cell-type="{ row }">
              <div class="flex items-center gap-1.5 py-1">
                <BaseBadge
                  :value="row.trading_type || 'standard'"
                  size="2xs"
                  text-case="capitalize"
                />
                <BaseBadge
                  v-if="row.account_type"
                  :value="row.account_type"
                  size="2xs"
                  text-case="capitalize"
                />
              </div>
            </template>

            <!-- Custom Server Cell -->
            <template #cell-server="{ row }">
              <span class="text-xs font-mono text-secondary-text">
                {{ row.server || row.broker_label || '—' }}
              </span>
            </template>

            <!-- Custom Currency Cell -->
            <template #cell-broker_currency="{ row }">
              <span class="text-xs font-mono font-bold text-primary-text">
                {{ row.broker_currency || 'USD' }}
              </span>
            </template>

            <!-- Custom Balance Cell -->
            <template #cell-balance="{ row }">
              <div class="font-mono text-xs font-bold tabular-nums text-primary-text">
                {{ formatNum(row.balance) }}
                <span class="text-[10px] font-semibold text-secondary-text">{{ row.broker_currency || 'USD' }}</span>
              </div>
            </template>

            <!-- Custom Equity Cell -->
            <template #cell-equity="{ row }">
              <div class="font-mono text-xs font-bold tabular-nums text-primary-text">
                {{ formatNum(row.equity) }}
                <span class="text-[10px] font-semibold text-secondary-text">{{ row.broker_currency || 'USD' }}</span>
              </div>
            </template>

            <!-- Custom Deposit Cell -->
            <template #cell-deposit="{ row }">
              <span class="font-mono text-xs font-semibold tabular-nums text-primary-text">
                ${{ formatNum(row.deposit) }}
              </span>
            </template>

            <!-- Custom Withdrawal Cell -->
            <template #cell-withdrawal="{ row }">
              <span class="font-mono text-xs font-semibold tabular-nums text-primary-text">
                ${{ formatNum(row.withdrawal) }}
              </span>
            </template>

            <!-- Custom Net PnL Cell -->
            <template #cell-net_pnl="{ row }">
              <span
                v-if="row.net_pnl !== null && row.net_pnl !== undefined"
                class="font-mono text-xs font-bold tabular-nums"
                :class="
                  Number(row.net_pnl) >= 0
                    ? 'text-emerald-500'
                    : 'text-rose-500'
                "
              >
                {{ Number(row.net_pnl) >= 0 ? '+' : '' }}${{ formatNum(row.net_pnl) }}
              </span>
              <span v-else class="text-xs text-secondary-text">—</span>
            </template>

            <!-- Custom Total PnL Cell -->
            <template #cell-total_pnl="{ row }">
              <span
                v-if="row.total_pnl !== null && row.total_pnl !== undefined"
                class="font-mono text-xs font-bold tabular-nums"
                :class="
                  Number(row.total_pnl) >= 0
                    ? 'text-emerald-500'
                    : 'text-rose-500'
                "
              >
                {{ Number(row.total_pnl) >= 0 ? '+' : '' }}${{ formatNum(row.total_pnl) }}
              </span>
              <span v-else class="text-xs text-secondary-text">—</span>
            </template>

            <!-- Custom Free Margin Cell -->
            <template #cell-free_margin="{ row }">
              <span
                v-if="row.free_margin !== null && row.free_margin !== undefined"
                class="font-mono text-xs font-semibold tabular-nums text-primary-text"
              >
                ${{ formatNum(row.free_margin) }}
              </span>
              <span v-else class="text-xs text-secondary-text">—</span>
            </template>

            <!-- Custom Leverage Cell -->
            <template #cell-leverage="{ row }">
              <span v-if="row.leverage" class="font-mono text-xs font-semibold text-primary-text">
                1:{{ row.leverage }}
              </span>
              <span v-else class="text-xs text-secondary-text">—</span>
            </template>

            <!-- Custom MT5 Sync Cell -->
            <template #cell-mt5_synced="{ row }">
              <BaseBadge
                :value="row.mt5_synced ? 'Live MT5' : 'Standard'"
                size="2xs"
                :pulse="Boolean(row.mt5_synced)"
              />
            </template>

            <!-- Custom Status Cell -->
            <template #cell-is_active="{ row }">
              <BaseBadge
                :status="row.is_active !== false ? 'Active' : 'Inactive'"
                size="2xs"
              />
            </template>

            <!-- Custom Actions Cell -->
            <template #cell-actions="{ row }">
              <button
                type="button"
                @click="openTradesDrawer(row)"
                class="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                title="View Trades"
              >
                <span class="material-symbols-rounded text-[20px]">monitoring</span>
              </button>
            </template>
          </DataTable>
        </div>
      </div>
    </template>

    <IbAccountTradesDrawer
      :open="isTradesDrawerOpen"
      :account="selectedAccountForTrades"
      @close="isTradesDrawerOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  DollarSign,
  TrendingUp,
  Layers,
  Award,
  CreditCard,
  Wallet,
  Activity,
  ArrowUpRight,
  Mail,
  Phone,
  Link2,
  Copy,
  Check,
  ArrowLeft,
  Info,
} from "lucide-vue-next";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import IbAccountTradesDrawer from "@/components/ib/clients/IbAccountTradesDrawer.vue";
import { useIbClientsStore } from "@/stores/ib/clients";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const route = useRoute();
const router = useRouter();
const store = useIbClientsStore();
const snackbar = useSnackbarStore();

const clientId = computed(() => route.params.id);
const clientDetails = computed(() => store.currentClient);

const isIb = computed(
  () => route.query.is_ib === "true" || route.query.is_ib === true,
);

const dateRange = ref(null);
const accountSearch = ref("");
const copiedId = ref(null);

const isTradesDrawerOpen = ref(false);
const selectedAccountForTrades = ref(null);

const openTradesDrawer = (account) => {
  selectedAccountForTrades.value = account;
  isTradesDrawerOpen.value = true;
};

const copyText = async (text, id) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(String(text));
    copiedId.value = id;
    snackbar.show("Copied to clipboard!", "success");
    setTimeout(() => {
      copiedId.value = null;
    }, 2000);
  } catch (err) {
    snackbar.show("Failed to copy.", "error");
  }
};

const handleBack = () => {
  if (isIb.value) {
    router.push("/my-network");
  } else {
    router.push("/clients");
  }
};

// ─── Header Information Computations ────────────────────────
const clientDisplayName = computed(() => {
  if (clientDetails.value?.name) return clientDetails.value.name;
  if (clientDetails.value?.CustomerName) return clientDetails.value.CustomerName;
  const listMatch = store.clients?.find(
    (c) => String(c.id) === String(clientId.value),
  );
  if (listMatch?.name) return listMatch.name;
  return `Client #${clientId.value}`;
});

const clientNameInitial = computed(() => {
  const name = clientDisplayName.value;
  if (!name || name.startsWith("Client #")) return "C";
  return name.charAt(0).toUpperCase();
});

const clientEmail = computed(() => {
  return clientDetails.value?.email || "—";
});

const clientPhone = computed(() => {
  return clientDetails.value?.phone_number || null;
});

const referralLink = computed(() => {
  const ref = clientDetails.value?.referral_link;
  if (!ref) return null;
  if (typeof ref === "object") return ref;
  return { code: String(ref) };
});

// ─── Summary Metrics Computations ───────────────────────────
const summaryMetrics = computed(() => {
  const sum = clientDetails.value?.summary || {};
  return {
    trading_accounts_count: sum.trading_accounts_count ?? clientDetails.value?.accounts?.length ?? 0,
    total_deposit: Number(sum.total_deposit ?? 0),
    total_withdrawal: Number(sum.total_withdrawal ?? 0),
    total_equity: Number(sum.total_equity ?? 0),
    total_balance: Number(sum.total_balance ?? 0),
    total_pnl: Number(sum.total_pnl ?? 0),
    total_trades: Number(sum.total_trades ?? 0),
    active_followings: Number(sum.active_followings ?? 0),
  };
});

// ─── Accounts Table Computations ────────────────────────────
const rawAccounts = computed(() => {
  if (Array.isArray(clientDetails.value?.accounts)) {
    return clientDetails.value.accounts;
  }
  return [];
});

const filteredAccounts = computed(() => {
  let list = rawAccounts.value;
  if (accountSearch.value && accountSearch.value.trim()) {
    const q = accountSearch.value.toLowerCase().trim();
    list = list.filter((acc) => {
      const login = String(acc.account_number || "").toLowerCase();
      const server = String(acc.server || "").toLowerCase();
      const type = String(acc.trading_type || "").toLowerCase();
      const curr = String(acc.broker_currency || "").toLowerCase();
      return (
        login.includes(q) ||
        server.includes(q) ||
        type.includes(q) ||
        curr.includes(q)
      );
    });
  }
  return list;
});

const accountTableColumns = [
  { key: "account_number", label: "LOGIN", tooltip: "Trading Account Number" },
  { key: "type", label: "TYPE", tooltip: "Trading & Account Type" },
  { key: "server", label: "SERVER", tooltip: "Server or Broker Label" },
  { key: "broker_currency", label: "CURRENCY", tooltip: "Account Currency" },
  { key: "balance", label: "BALANCE", tooltip: "Account Balance", align: "right" },
  { key: "equity", label: "EQUITY", tooltip: "Live Account Equity", align: "right" },
  { key: "deposit", label: "DEPOSIT", tooltip: "Total Deposits to Account", align: "right" },
  { key: "withdrawal", label: "WITHDRAWAL", tooltip: "Total Withdrawals from Account", align: "right" },
  { key: "net_pnl", label: "NET PNL", tooltip: "Live Net Profit / Loss", align: "right" },
  { key: "total_pnl", label: "TOTAL PNL", tooltip: "Total Profit / Loss", align: "right" },
  { key: "free_margin", label: "FREE MARGIN", tooltip: "Available Free Margin", align: "right" },
  { key: "leverage", label: "LEVERAGE", tooltip: "Account Leverage" },
  { key: "is_active", label: "STATUS", tooltip: "Account Active Status" },
  { key: "actions", label: "ACTION", align: "right" },
];

// ─── Badges Styling Helpers ─────────────────────────────────
const getKycBadgeClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "approved" || s === "verified") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  }
  if (s === "pending" || s === "in_review" || s === "submitted") {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  }
  if (s === "rejected" || s === "declined") {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
  }
  return "bg-gray-500/10 text-gray-500 border border-gray-500/20";
};

const formatKycStatus = (status) => {
  if (!status) return "Pending";
  const s = String(status).replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const getStageBadgeClass = (stage) => {
  const s = String(stage || "").toLowerCase();
  if (s === "funded") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  }
  if (s === "no_deposit") {
    return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20";
  }
  if (s === "no_account") {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
  }
  if (s === "kyc_incomplete") {
    return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20";
  }
  return "bg-gray-500/10 text-gray-500 border border-gray-500/20";
};

const formatStage = (stage) => {
  if (!stage) return "—";
  if (stage === "funded") return "Funded";
  if (stage === "no_deposit") return "No Deposit";
  if (stage === "no_account") return "No Account";
  if (stage === "kyc_incomplete") return "KYC Incomplete";
  const s = String(stage).replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// ─── Lifecycle & Data Fetching ──────────────────────────────
onMounted(() => {
  if (clientId.value) {
    store.fetchClientDetail(clientId.value, {}, isIb.value);
  }
});

const reloadDetails = () => {
  if (clientId.value) {
    if (dateRange.value) {
      handleDateApply(dateRange.value);
    } else {
      store.fetchClientDetail(clientId.value, {}, isIb.value);
    }
  }
};

const formatDateToYYYYMMDD = (val) => {
  if (!val) return null;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const handleDateApply = (val) => {
  if (!clientId.value) return;
  if (Array.isArray(val) && val.length === 2 && val[0] && val[1]) {
    store.fetchClientDetail(
      clientId.value,
      {
        from_date: formatDateToYYYYMMDD(val[0]),
        to_date: formatDateToYYYYMMDD(val[1]),
      },
      isIb.value,
    );
  } else if (val && typeof val === "object" && val.start && val.end) {
    store.fetchClientDetail(
      clientId.value,
      {
        from_date: formatDateToYYYYMMDD(val.start),
        to_date: formatDateToYYYYMMDD(val.end),
      },
      isIb.value,
    );
  } else {
    store.fetchClientDetail(clientId.value, {}, isIb.value);
  }
};

const handleDateClear = () => {
  dateRange.value = null;
  if (clientId.value) {
    store.fetchClientDetail(clientId.value, {}, isIb.value);
  }
};

// ─── Formatters ─────────────────────────────────────────────
const formatNum = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCount = (val) => {
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US");
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};
</script>
