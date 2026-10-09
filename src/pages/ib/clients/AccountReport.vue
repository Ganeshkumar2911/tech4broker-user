<template>
  <div class="min-h-screen pb-12 space-y-6">
    <!-- ================================================================= -->
    <!-- TAB 2: ACCOUNT REPORT (CLIENTS WITH ACCOUNTS) -->
    <!-- ================================================================= -->
    <div class="space-y-6">
      <!-- Filter Bar -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <!-- Search inputs container -->
        <div
          id="tour-ib-accounts-search"
          class="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto"
        >
          <!-- Client Search (Name / Email) -->
          <BaseSearch
            v-model="store.accountsSearch"
            placeholder="Search name/email..."
            container-class="flex-1 min-w-[160px] sm:w-64"
            @update:modelValue="onAccountsSearchInput"
          />

          <!-- Status Dropdown (all / active / inactive) -->
          <div class="w-36 min-w-[120px]">
            <BaseSelect
              v-model="store.accountsStatus"
              :options="statusOptions"
              placeholder="Status"
              borderless
              height="40px"
              rounded="full"
              @update:modelValue="onAccountsStatusChange"
            />
          </div>

          <!-- Search Sub IB Select Dropdown -->
          <div class="flex-1 min-w-[160px] sm:w-56">
            <IbNetworkSelect
              v-model="store.accountsSubIb"
              placeholder="Search Sub IB..."
              @update:modelValue="onAccountsSubIbChange"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto sm:ml-auto"
        >
          <div
            id="tour-ib-accounts-actions"
            class="flex items-center gap-3 ml-auto sm:ml-0 shrink-0"
          >
            <!-- Download Button -->
            <DownloadButton @click="store.downloadAccountsReport" />

            <!-- Refresh Button -->
            <Tooltip text="Refresh Account Reports" position="left">
              <RefreshButton
                :loading="store.isAccountsLoading"
                @click="store.fetchClientsWithAccounts(store.accountsPagination.page)"
              />
            </Tooltip>
          </div>
        </div>
      </div>

      <!-- Account Report Data Table Card -->
      <div
        id="tour-ib-accounts-table"
        class="overflow-hidden rounded-3xl bg-card-background border-0 shadow-none"
      >
        <DataTable
          :columns="clientColumns"
          :rows="store.accountsClients"
          :loading="store.isAccountsLoading"
          :skeleton-rows="6"
          row-key="id"
          clickable-rows
          :page="store.accountsPagination.page"
          :total-pages="store.accountsPagination.total_pages"
          :total-items="store.accountsPagination.total_items"
          :per-page="store.accountsPagination.per_page"
          :show-per-page="true"
          :show-info="true"
          :per-page-options="[10, 20, 30, 50]"
          :row-class="getRowClass"
          @update:page="store.changeAccountsPage"
          @update:perPage="store.setAccountsPerPage"
          @row-click="onRowClick"
        >
          <!-- Custom Name Cell -->
          <template #cell-name="{ row }">
            <div class="flex flex-col py-1">
              <span
                class="font-bold text-sm truncate max-w-[160px] sm:max-w-[200px]"
                :class="
                  isInactive(row)
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-primary-text'
                "
              >
                {{ getFullName(row) }}
              </span>
              <span
                class="text-xs truncate max-w-[160px] sm:max-w-[200px]"
                :class="
                  isInactive(row)
                    ? 'text-gray-400/80 dark:text-gray-500/80'
                    : 'text-secondary-text'
                "
              >
                {{ row.email || "—" }}
              </span>
            </div>
          </template>

          <!-- Custom Email Cell -->
          <template #cell-email="{ row }">
            <span
              class="text-xs truncate max-w-[180px] inline-block"
              :class="
                isInactive(row)
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-secondary-text'
              "
            >
              {{ row.email || "—" }}
            </span>
          </template>

          <!-- Custom Phone Cell -->
          <template #cell-phone="{ row }">
            <span
              class="text-xs font-mono"
              :class="
                isInactive(row)
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-secondary-text'
              "
            >
              {{ row.phone_number || "—" }}
            </span>
          </template>

          <!-- Custom KYC Badge Cell -->
          <template #cell-kyc="{ row }">
            <BaseBadge :value="row.kyc_status" size="xs" />
          </template>

          <!-- Custom Funnel Stage Cell -->
          <template #cell-stage="{ row }">
            <BaseBadge :value="row.stage" size="xs" />
          </template>

          <!-- Custom Accounts Cell (Click to expand drawer) -->
          <template #cell-accounts="{ row }">
            <button
              type="button"
              @click.stop="openAccountsDrawer(row)"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-background hover:bg-card-background text-secondary-text hover:text-primary-text border border-primary-border transition-all cursor-pointer active:scale-95 group"
              title="Click to view client trading accounts"
            >
              <CreditCard class="w-3 h-3 shrink-0 text-secondary-text group-hover:text-primary-text transition-colors" />
              <span>
                {{ getAccountsCount(row) }}
                {{ getAccountsCount(row) === 1 ? "Account" : "Accounts" }}
              </span>
            </button>
          </template>

          <!-- Custom Deposit Cell -->
          <template #cell-deposit="{ row }">
            <div class="flex items-center gap-1.5 py-1 font-mono">
              <span
                class="font-bold tabular-nums text-sm"
                :class="
                  isInactive(row)
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-primary-text'
                "
              >
                ${{ formatNum(row.total_deposit ?? row.deposit ?? 0) }}
              </span>
              <span
                v-if="row.has_deposit"
                class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                title="Deposit verified"
              />
            </div>
          </template>

          <!-- Custom Withdrawal Cell -->
          <template #cell-withdrawal="{ row }">
            <span
              class="font-bold tabular-nums text-sm font-mono"
              :class="
                isInactive(row)
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-primary-text'
              "
            >
              ${{ formatNum(row.total_withdrawal ?? 0) }}
            </span>
          </template>

          <!-- Custom Net Deposit Cell -->
          <template #cell-net_deposit="{ row }">
            <span
              class="font-bold tabular-nums text-sm font-mono"
              :class="
                isInactive(row)
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-primary-text'
              "
            >
              ${{ formatNum((row.total_deposit ?? row.deposit ?? 0) - (row.total_withdrawal ?? 0)) }}
            </span>
          </template>



          <!-- Custom Active Followings Cell -->
          <template #cell-followings="{ row }">
            <span
              class="text-xs font-semibold tabular-nums"
              :class="
                isInactive(row)
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-primary-text'
              "
            >
              {{ row.active_followings ?? 0 }}
            </span>
          </template>

          <!-- Custom Referral Cell -->
          <template #cell-referral="{ row }">
            <div
              v-if="getCampaignName(row)"
              class="flex flex-col items-start gap-1 py-1"
            >
              <span
                class="font-semibold text-xs"
                :class="
                  isInactive(row)
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-primary-text'
                "
              >
                {{ getCampaignName(row) }}
              </span>
              <div
                v-if="getCampaignCode(row)"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono border border-primary-border/60 bg-background/80"
                :class="
                  isInactive(row)
                    ? 'text-gray-400 dark:text-gray-500 border-gray-400/30'
                    : 'text-secondary-text'
                "
              >
                <Link2 class="w-2.5 h-2.5 shrink-0 text-secondary-text" />
                <span>{{ getCampaignCode(row) }}</span>
              </div>
            </div>
            <span
              v-else
              class="text-xs"
              :class="
                isInactive(row)
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-secondary-text'
              "
            >
              —
            </span>
          </template>

          <!-- Custom IB Info Cell -->
          <template #cell-ib="{ row }">
            <div
              v-if="row.ib"
              class="flex flex-col items-start gap-1 py-1"
            >
              <span
                class="font-semibold text-xs"
                :class="
                  isInactive(row)
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-primary-text'
                "
              >
                {{ row.ib.name || '—' }}
              </span>
              <span
                class="text-xs"
                :class="
                  isInactive(row)
                    ? 'text-gray-400/80 dark:text-gray-500/80'
                    : 'text-secondary-text'
                "
              >
                {{ row.ib.email || '—' }}
              </span>
            </div>
            <span
              v-else
              class="text-xs"
              :class="
                isInactive(row)
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-secondary-text'
              "
            >
              —
            </span>
          </template>

          <!-- Custom Status Cell -->
          <template #cell-status="{ row }">
            <BaseBadge :status="row.is_active !== false && !isInactive(row) ? 'Active' : 'Inactive'" size="xs" />
          </template>

          <!-- Custom Joined Date Cell -->
          <template #cell-joined="{ row }">
            <span
              class="text-xs whitespace-nowrap"
              :class="
                isInactive(row)
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-secondary-text'
              "
            >
              {{ formatDate(row.created_at || row.joined_on) }}
            </span>
          </template>

          <!-- Custom Actions Cell -->
          <template #cell-actions="{ row }">
            <div class="flex items-center justify-end gap-1.5" @click.stop>
              <Tooltip text="View Client Details" position="top">
                <button
                  type="button"
                  @click.stop="goToClientDetails(row)"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-background hover:bg-card-background text-secondary-text hover:text-primary-text border border-primary-border/60 transition-colors cursor-pointer active:scale-95 group"
                  aria-label="View Client Details"
                >
                  <Eye class="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </Tooltip>
              <Tooltip text="View Commission Report" position="top">
                <button
                  type="button"
                  @click.stop="goToIbReport(row)"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 hover:border-primary/40 transition-all cursor-pointer active:scale-95 group shadow-2xs"
                  aria-label="View Network Report"
                >
                  <BarChart2 class="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </Tooltip>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Slide-over Drawer for Client Trading Accounts -->
    <ClientAccountsDrawer
      :open="isAccountsDrawerOpen"
      :client="selectedClientForAccounts"
      @close="isAccountsDrawerOpen = false"
    />

    <!-- Footer Disclaimer Block -->
    <div
      class="pt-6 border-t border-primary-border/40 space-y-4 text-[11px] text-secondary-text leading-relaxed"
    >
      <div>
        <p class="font-bold text-primary-text mb-1">Disclaimer:</p>
        <p>
          The information presented on this page is intended exclusively for
          informational and regulatory transparency purposes. It should not be
          interpreted as an invitation, solicitation, or recommendation to
          participate in any financial service, investment, or transaction.
          Trading leveraged financial instruments such as Foreign Exchange
          (Forex) and Contracts for Difference (CFDs) carries substantial risk
          and can result in losses exceeding the initial capital invested. These
          products may not be appropriate for every investor, as leverage
          magnifies both profits and losses, and traders do not gain ownership
          of the underlying assets. Historical performance is not a reliable
          indicator of future outcomes.
        </p>
        <p class="mt-2">
          Before engaging in leveraged trading, individuals should carefully
          assess their financial situation, investment objectives, and trading
          experience to ensure they fully comprehend the risks involved. Panther
          Capitals Ltd. is not responsible for any financial losses arising from
          trading activities. The materials provided on this website are general
          in nature and do not take into account personal financial
          circumstances or investment goals. We strongly recommend reviewing the
          full suite of legal and risk disclosure documents available on this
          site and obtaining independent professional advice if needed.
        </p>
      </div>

      <div>
        <p class="font-bold text-primary-text mb-1">Regional Restrictions:</p>
        <p>
          Panther Capitals Ltd we don't offer services to residents of certain
          countries, including Syria, North Korea, Iran, Iraq, Mauritius, USA,
          Canada, Sudan, Myanmar, Yemen, Afghanistan, Vanuatu, and those within
          the European Economic Area (EEA).
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Link2, Info, CreditCard, Eye, BarChart2, Users } from "lucide-vue-next";
import BaseTabs from "@/components/base/BaseTabs.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import DownloadButton from "@/components/base/DownloadButton.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import IbNetworkSelect from "@/components/ib/IbNetworkSelect.vue";
import ClientAccountsDrawer from "@/components/ib/clients/ClientAccountsDrawer.vue";
import { useIbClientsStore } from "@/stores/ib/clients";

const route = useRoute();
const router = useRouter();
const store = useIbClientsStore();

// ─── Active Report Tab State (Client Report vs Account Report) ──────────────
const activeMainTab = ref("client-report");

// ─── Funnel Sub-Tabs with Badges ────────────────────────────────────────────
const funnelFilterTabs = computed(() => [
  {
    label: "All",
    value: "all",
  },
  {
    label: "KYC Incomplete",
    value: "kyc_incomplete",
  },
  {
    label: "No Trading Account",
    value: "no_account",
  },
  {
    label: "No Deposit",
    value: "no_deposit",
  },
]);

// ─── Status Options ─────────────────────────────────────────────────────────
const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

// ─── Table Columns (Shared for Funnel & Accounts Report) ─────────────────────
const clientColumns = [
  {
    key: "name",
    label: "NAME",
    tooltip: "Referred client name and email",
    headerClass: "pl-6 sm:pl-8",
    cellClass: "pl-6 sm:pl-8",
  },
  {
    key: "email",
    label: "EMAIL",
    tooltip: "Client primary email address",
  },
  {
    key: "phone",
    label: "PHONE",
    tooltip: "Client registered contact number",
  },
  {
    key: "kyc",
    label: "KYC",
    tooltip: "KYC verification status",
  },
  {
    key: "stage",
    label: "STAGE",
    tooltip: "Clients conversion funnel stage",
  },
  {
    key: "accounts",
    label: "ACCOUNTS",
    tooltip: "Trading accounts count (click to open accounts drawer)",
  },
  {
    key: "deposit",
    label: "DEPOSIT",
    tooltip: "Total deposits made by client",
  },
  {
    key: "withdrawal",
    label: "WITHDRAWAL",
    tooltip: "Total withdrawal made by client",
  },
  {
    key: "net_deposit",
    label: "NET DEPOSIT",
    tooltip: "Net deposit (Total Deposit - Total Withdrawal)",
  },

  {
    key: "followings",
    label: "FOLLOWINGS",
    tooltip: "Active followings count",
  },
  {
    key: "referral",
    label: "REFERRAL",
    tooltip: "Referred campaign name and code",
  },
  {
    key: "ib",
    label: "IB INFO",
    tooltip: "IB Name and Email",
  },
  {
    key: "status",
    label: "STATUS",
    tooltip: "Account active status",
  },
  {
    key: "joined",
    label: "JOINED",
    tooltip: "Registration date",
  },
  {
    key: "actions",
    label: "ACTION",
    align: "right",
    tooltip: "View client details",
    headerClass: "pr-6 sm:pr-8 text-right",
    cellClass: "pr-6 sm:pr-8 text-right",
  },
];

const funnelClientColumns = clientColumns.filter(c => c.key !== "actions");

// ─── Drawer State ───────────────────────────────────────────────────────────
const isAccountsDrawerOpen = ref(false);
const selectedClientForAccounts = ref(null);

const openAccountsDrawer = (client) => {
  selectedClientForAccounts.value = client;
  isAccountsDrawerOpen.value = true;
};

const getAccountsCount = (row) => {
  if (!row) return 0;
  if (row.trading_accounts_count !== undefined && row.trading_accounts_count !== null) {
    return Number(row.trading_accounts_count) || 0;
  }
  if (Array.isArray(row.accounts)) {
    return row.accounts.length;
  }
  return 0;
};

// ─── Badges Styling Helpers ─────────────────────────────────────────────────
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

// ─── Debounced Search Handlers (Funnel) ──────────────────────────────────────
let funnelSearchTimer = null;
const onFunnelSearchInput = () => {
  clearTimeout(funnelSearchTimer);
  funnelSearchTimer = setTimeout(() => {
    store.funnelPagination.page = 1;
    store.fetchFunnelClients(1);
  }, 300);
};

const onFunnelStatusChange = () => {
  store.funnelPagination.page = 1;
  store.fetchFunnelClients(1);
};

const onFunnelSubIbChange = () => {
  store.funnelPagination.page = 1;
  store.fetchFunnelClients(1);
};

// ─── Debounced Search Handlers (Account Report) ──────────────────────────────
let accountsSearchTimer = null;
const onAccountsSearchInput = () => {
  clearTimeout(accountsSearchTimer);
  accountsSearchTimer = setTimeout(() => {
    store.accountsPagination.page = 1;
    store.fetchClientsWithAccounts(1);
  }, 300);
};

const onAccountsStatusChange = () => {
  store.accountsPagination.page = 1;
  store.fetchClientsWithAccounts(1);
};

const onAccountsSubIbChange = () => {
  store.accountsPagination.page = 1;
  store.fetchClientsWithAccounts(1);
};

const onSubIbSearch = (query) => {
  store.searchSubIbs(query);
};

// ─── Row Click Handler ──────────────────────────────────────────────────────
const onRowClick = (row) => {
  if (row && row.id) {
    router.push(`/clients/${row.id}`);
  }
};

// ─── Account Report Action Handlers ─────────────────────────────────────────
const goToClientDetails = (row) => {
  if (row && row.id) {
    router.push({ path: `/account-report/client-details/${row.id}` });
  }
};

const goToIbReport = (row) => {
  if (row && row.id) {
    router.push({ path: '/client-network-report', query: { client_id: row.id } });
  }
};

const goToIbClients = (row) => {
  if (row && row.id) {
    router.push({ path: '/clients', query: { ib_id: row.id, from: '/account-report' } });
  }
};

watch(
  () => route.query.ib_id,
  (newIbId) => {
    if (newIbId) {
      store.selectedSubIb = String(newIbId);
      store.accountsSubIb = String(newIbId);
    } else {
      store.selectedSubIb = null;
      store.accountsSubIb = null;
    }
    store.fetchClientsWithAccounts(1);
  },
  { immediate: true },
);

// ─── Helper Functions ───────────────────────────────────────────────────────
const isInactive = (row) => {
  if (!row) return false;
  if (
    row.status === "inactive" ||
    row.status === 0 ||
    row.status === false ||
    row.status === "disabled"
  )
    return true;
  if (row.is_active === false || row.is_active === 0 || row.is_active === "0")
    return true;
  return false;
};

const getRowClass = (row) => {
  if (isInactive(row)) {
    return "text-gray-400 dark:text-gray-500 opacity-80";
  }
  return "";
};

const getCampaignName = (row) => {
  const ref = row?.referral_link;
  if (!ref) return null;
  if (typeof ref === "object") return ref.name || ref.code || null;
  return String(ref) || null;
};

const getCampaignCode = (row) => {
  const ref = row?.referral_link;
  if (!ref || typeof ref !== "object") return null;
  if (ref.name && ref.code) return ref.code;
  return null;
};

const getFullName = (row) => {
  if (row.name) return row.name;
  const first = row.first_name || "";
  const last = row.last_name || "";
  const name = `${first} ${last}`.trim();
  return name || "—";
};

const formatNum = (num) => {
  const parsed = Number(num);
  if (isNaN(parsed)) return "0.00";
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
