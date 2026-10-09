<template>
  <div class="space-y-6 min-h-screen">
    <!-- <div class="flex items-center gap-1.5">
      <h2 class="text-primary-text font-bold text-2xl">IB Reports</h2>
      <Tooltip
        text="Detailed commission analytics, volume breakdowns, and referral reports"
        position="top"
        wrap
      >
        <Info
          :size="11"
          class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
        />
      </Tooltip>
    </div> -->

    <!-- Main Account Summary Card (Live UI Style - Compact & Clean) -->
    <div
      id="tour-ib-reports-summary"
      class="bg-card-background rounded-3xl p-4 sm:p-5"
    >
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 lg:gap-6">
        <!-- Left: Selected IB Account Selector (Hidden in Client Mode) -->
        <div v-if="!isClientMode" class="w-full lg:w-72 xl:w-80 shrink-0 space-y-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-[11px] font-bold text-secondary-text uppercase tracking-wider">
              Selected IB Account
            </span>
          </div>

          <div
            id="tour-ib-reports-selector"
            class="w-full"
          >
            <BaseSelect
              :model-value="reportsStore.selectedIbId ? String(reportsStore.selectedIbId) : null"
              :options="ibOptions"
              :is-loading="reportsStore.ibLoading"
              placeholder="Select IB Account"
              search-placeholder="Search IB account..."
              rounded="full"
              @update:model-value="onSelectIb"
            >
              <template #trigger="{ selected }">
                <div class="flex items-center gap-2 truncate min-w-0">
                  <span class="truncate text-primary-text font-medium text-xs sm:text-sm">
                    {{ selected ? (selected.label || selected.name) : 'Select IB Account' }}
                  </span>
                  <BaseBadge
                    v-if="selected && selected.level !== undefined && selected.level !== null"
                    :value="'L' + selected.level"
                    variant="primary"
                    size="2xs"
                  />
                </div>
              </template>

              <template #option="{ option }">
                <div class="flex items-center justify-between w-full py-0.5">
                  <div class="flex items-center gap-2 truncate min-w-0">
                    <span class="font-medium text-xs sm:text-sm text-primary-text truncate">
                      {{ option.label || option.name }}
                    </span>
                    <BaseBadge
                      v-if="option.level !== undefined && option.level !== null"
                      :value="'Level ' + option.level"
                      variant="info"
                      size="2xs"
                    />
                  </div>
                </div>
              </template>
            </BaseSelect>
          </div>
        </div>

        <!-- Vertical Divider (Desktop) -->
        <div v-if="!isClientMode" class="hidden lg:block w-[1px] self-stretch bg-primary-border/60 shrink-0"></div>

        <!-- Right: IB Information -->
        <div class="flex-1 min-w-0 flex flex-col justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-primary-border/40">
          <!-- Row 1: Name, Email & Active Status -->
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-2 min-w-0">
              <!-- <Tooltip :text="isClientMode ? 'Client Account details' : 'Selected IB Account details'" position="top" wrap>
                <Info
                  :size="13"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
                />
              </Tooltip> -->
              <h3 class="text-sm sm:text-base font-bold text-primary-text truncate">
                {{ reportsStore.selectedIb?.name || (isClientMode ? "Client Account" : "Select IB Account") }}
              </h3>
              <span v-if="reportsStore.selectedIb?.email" class="text-xs text-secondary-text truncate">
                &bull; {{ reportsStore.selectedIb.email }}
              </span>
            </div>

            <!-- Active Status Badge -->
            <div class="flex items-center gap-2 shrink-0">
              <BaseBadge status="Active" pulse />
            </div>
          </div>

          <!-- Row 2: Chips (IB ID & Level) -->
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="reportsStore.selectedIbId"
              class="inline-flex items-center font-mono text-[11px] font-bold text-primary-text bg-background border border-primary-border/60 px-2.5 py-0.5 rounded-md"
            >
              {{ isClientMode ? 'Client ID' : 'IB ID' }}: {{ reportsStore.selectedIbId }}
            </span>
            <span
              v-if="reportsStore.selectedIb && !isClientMode"
              class="inline-flex items-center text-[11px] font-semibold text-secondary-text bg-background border border-primary-border/60 px-2.5 py-0.5 rounded-md"
            >
              Level: {{ reportsStore.selectedIb.level ?? 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Summary Metric Cards (Standalone Row) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <!-- 1. Total Deposit Card -->
      <BaseOverviewCard
        title="Total Deposit"
        :value="'$' + formatMoney(summaryData.total_deposit)"
        :loading="reportsStore.loading || reportsStore.ibLoading"
        left-label="Real"
        :left-value="'$' + formatMoney(summaryData.deposit_real)"
        left-tooltip="Total deposits into real accounts"
        right-label="Copy"
        :right-value="'$' + formatMoney(summaryData.deposit_copy)"
        right-tooltip="Total deposits into copy trading accounts"
      />

      <!-- 2. Total Withdrawal Card -->
      <BaseOverviewCard
        title="Total Withdrawal"
        :value="'$' + formatMoney(summaryData.total_withdrawal)"
        :loading="reportsStore.loading || reportsStore.ibLoading"
        left-label="Real"
        :left-value="'$' + formatMoney(summaryData.withdrawal_real)"
        left-tooltip="Total withdrawals from real accounts"
        right-label="Copy"
        :right-value="'$' + formatMoney(summaryData.withdrawal_copy)"
        right-tooltip="Total withdrawals from copy trading accounts"
      />

      <!-- 3. Net Deposit Card -->
      <BaseOverviewCard
        title="Net Deposit"
        :value="'$' + formatMoney(summaryData.net_deposit)"
        :loading="reportsStore.loading || reportsStore.ibLoading"
        left-label="Real"
        :left-value="'$' + formatMoney(summaryData.net_real)"
        left-tooltip="Net deposit in real accounts (Deposit - Withdrawal)"
        right-label="Copy"
        :right-value="'$' + formatMoney(summaryData.net_copy)"
        right-tooltip="Net deposit in copy trading accounts (Deposit - Withdrawal)"
      />
    </div>

    <!-- Symbol Group Performance Section -->
    <div class="space-y-4">
      <!-- Header -->
      <div class="space-y-0.5">
        <div class="flex items-center gap-1.5">
          <h2 class="text-xl font-bold text-primary-text">
            Symbol Group Performance
          </h2>
          <Tooltip
            text="Detailed trading volume, lot counts, and commission breakdown by instrument category"
            position="top"
            wrap
          >
            <Info
              :size="11"
              class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
            />
          </Tooltip>
        </div>
        <p class="text-xs text-secondary-text">
          Detailed trading volume and spread breakdown by instrument group
        </p>
      </div>

      <!-- Filter Controls (Below Header) -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 w-full"
      >
        <!-- Row 1 (Mobile) / Left Side (Desktop): Search & All Symbols -->
        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <BaseSearch
            v-model="symbolSearch"
            placeholder="Search symbols..."
            container-class="flex-1 sm:w-64 min-w-0"
          />

          <button
            type="button"
            @click="showOnlyActive = !showOnlyActive"
            class="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 h-10 rounded-full text-xs font-semibold cursor-pointer transition-all shrink-0"
            :class="
              showOnlyActive
                ? 'bg-button text-button-text font-bold shadow-xs'
                : 'bg-card-background text-primary-text border border-primary-border/60 hover:bg-navbar-hover-bg'
            "
          >
            <span>{{ showOnlyActive ? "Active Only" : "All Symbols" }}</span>
          </button>
        </div>

        <!-- Row 2 (Mobile) / Right Side (Desktop): Date Range & Refresh -->
        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <div class="flex-1 sm:w-auto min-w-0 sm:min-w-[220px]">
            <BaseDateRangePicker
              v-model="dateRange"
              placement="bottom-end"
              borderless
              @apply="handleDateApply"
              @clear="handleDateClear"
            />
          </div>

          <Tooltip text="Refresh IB Reports" position="left">
            <RefreshButton
              :loading="reportsStore.loading"
              :icon-size="16"
              button-class="w-10 h-10 shrink-0"
              @click="onRefresh"
            />
          </Tooltip>
        </div>
      </div>

      <!-- Data Table -->
      <div
        id="tour-ib-reports-table"
        class="overflow-hidden rounded-3xl bg-card-background border-0 shadow-none"
      >
        <DataTable
          :columns="symbolColumns"
          :rows="filteredSymbols"
          :loading="reportsStore.loading"
          empty-text="No symbol performance activity found for the selected IB account."
        >
          <!-- Symbol Group Cell -->
          <template #cell-symbol="{ row }">
            <span class="font-bold text-primary-text py-1 inline-block">{{
              row.symbol
            }}</span>
          </template>

          <!-- Close Volume Cell -->
          <template #cell-closeVolumeLots="{ value }">
            <span
              class="font-semibold font-mono tabular-nums text-primary-text"
            >
              {{ formatLots(value) }}
            </span>
          </template>

          <!-- Open Volume Cell -->
          <template #cell-openVolumeLots="{ value }">
            <span
              class="font-semibold font-mono tabular-nums text-primary-text"
            >
              {{ formatLots(value) }}
            </span>
          </template>

          <!-- Close Trades Cell -->
          <template #cell-closeTrades="{ value }">
            <span
              class="font-semibold font-mono tabular-nums text-primary-text"
            >
              {{ formatNum(value) }}
            </span>
          </template>

          <!-- Open Trades Cell -->
          <template #cell-openTrades="{ value }">
            <span
              class="font-semibold font-mono tabular-nums text-primary-text"
            >
              {{ formatNum(value) }}
            </span>
          </template>

          <!-- Commission Per Lot Cell -->
          <template #cell-commissionPerLot="{ value }">
            <span class="font-bold font-mono tabular-nums text-emerald-500">
              ${{ formatMoney(value) }}
            </span>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Accounts Disclaimer -->
    <AccountsDisclaimer />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRoute } from "vue-router";
import { ChevronDown, Info } from "lucide-vue-next";

import BaseMetricCard from "@/components/base/BaseMetricCard.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import BaseBadge from "@/components/base/BaseBadge.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseOverviewCard from "@/components/base/BaseOverviewCard.vue";

import { useIbReportsStore } from "@/stores/ib/reports";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { formatNumber } from "@/utils/formatters";

const reportsStore = useIbReportsStore();
const snackbar = useSnackbarStore();
const route = useRoute();

const isClientMode = computed(() => route.meta.isClientMode === true);

// ─── Formatting Helpers ─────────────────────────────────
const money = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const countFormat = (value) =>
  Number(value || 0).toLocaleString();

// ─── Filter Controls State ──────────────────────────────
const symbolSearch = ref("");
const showOnlyActive = ref(false);
const dateRange = ref(null);

const symbolColumns = [
  {
    key: "symbol",
    label: "SYMBOL GROUP",
    tooltip: "Instrument or asset category name",
    headerClass: "pl-6 sm:pl-8",
    cellClass: "pl-6 sm:pl-8",
  },
  {
    key: "closeVolumeLots",
    label: "CLOSE VOLUME (LOTS)",
    tooltip: "Total volume closed in standard lots",
    align: "right",
  },
  {
    key: "openVolumeLots",
    label: "OPEN VOLUME (LOTS)",
    tooltip: "Currently open volume in standard lots",
    align: "right",
  },
  {
    key: "closeTrades",
    label: "CLOSE TRADES",
    tooltip: "Total count of closed trades",
    align: "right",
  },
  {
    key: "openTrades",
    label: "OPEN TRADES",
    tooltip: "Total count of active open trades",
    align: "right",
  },
  {
    key: "commissionPerLot",
    label: "TOTAL COMMISSION",
    tooltip: "Total commission earned from this symbol group",
    align: "right",
    headerClass: "pr-6 sm:pr-8",
    cellClass: "pr-6 sm:pr-8",
  },
];

// ─── IB Options for BaseSelect ─────────────────────────
const ibOptions = computed(() => {
  return reportsStore.ibList.map((ib) => ({
    label: ib.name || `IB #${ib.id}`,
    value: String(ib.id),
    level: ib.level,
    name: ib.name,
    raw: ib,
  }));
});

const onSelectIb = (ibId) => {
  if (!ibId) return;
  reportsStore.selectIb(ibId);
};

// ─── Selected IB Summary Metrics ─────────────────────────────
const summaryData = computed(() => {
  const storeSummary = reportsStore.summary || {};
  const payload = reportsStore.recordsPayload || {};
  const realPayload = payload.real || {};
  const copyPayload = payload.copy_trading || payload.copy || {};

  const selected = reportsStore.selectedIb;
  const self =
    selected?.transactions?.self || selected?.raw?.transactions?.self || null;
  const netTrans =
    selected?.transactions?.network || selected?.raw?.transactions?.network || null;
  const rawNode = selected?.raw || {};

  const parseNum = (v) => {
    if (v == null || v === "") return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  // Deposits
  const depReal =
    parseNum(storeSummary.deposit_real) ||
    parseNum(realPayload.total_deposit) ||
    parseNum(realPayload.deposit) ||
    parseNum(self?.deposit?.real) ||
    parseNum(netTrans?.deposit?.real) ||
    0;

  const depCopy =
    parseNum(storeSummary.deposit_copy) ||
    parseNum(copyPayload.total_deposit) ||
    parseNum(copyPayload.deposit) ||
    parseNum(self?.deposit?.copy_trading) ||
    parseNum(self?.deposit?.copy) ||
    parseNum(netTrans?.deposit?.copy_trading) ||
    parseNum(netTrans?.deposit?.copy) ||
    0;

  const totalDep =
    (depReal + depCopy) ||
    parseNum(storeSummary.total_deposit) ||
    parseNum(payload.summary?.total_deposit) ||
    parseNum(payload.total_deposit) ||
    parseNum(self?.deposit?.overall) ||
    parseNum(netTrans?.deposit?.overall) ||
    0;

  // Withdrawals
  const wdrReal =
    parseNum(storeSummary.withdrawal_real) ||
    parseNum(realPayload.total_withdrawal) ||
    parseNum(realPayload.withdrawal) ||
    parseNum(self?.withdrawal?.real) ||
    parseNum(netTrans?.withdrawal?.real) ||
    0;

  const wdrCopy =
    parseNum(storeSummary.withdrawal_copy) ||
    parseNum(copyPayload.total_withdrawal) ||
    parseNum(copyPayload.withdrawal) ||
    parseNum(self?.withdrawal?.copy_trading) ||
    parseNum(self?.withdrawal?.copy) ||
    parseNum(netTrans?.withdrawal?.copy_trading) ||
    parseNum(netTrans?.withdrawal?.copy) ||
    0;

  const totalWdr =
    (wdrReal + wdrCopy) ||
    parseNum(storeSummary.total_withdrawal) ||
    parseNum(payload.summary?.total_withdrawal) ||
    parseNum(payload.total_withdrawal) ||
    parseNum(self?.withdrawal?.overall) ||
    parseNum(netTrans?.withdrawal?.overall) ||
    0;

  // Accounts
  const accReal =
    parseNum(storeSummary.accounts_real) ||
    parseNum(realPayload.accounts) ||
    parseNum(rawNode.real_accounts) ||
    parseNum(rawNode.total_clients) ||
    0;

  const accCopy =
    parseNum(storeSummary.accounts_copy) ||
    parseNum(copyPayload.accounts) ||
    parseNum(rawNode.copy_accounts) ||
    0;

  const totalAcc =
    (accReal + accCopy) ||
    parseNum(storeSummary.total_accounts) ||
    parseNum(payload.summary?.total_accounts) ||
    parseNum(payload.total_accounts) ||
    parseNum(rawNode.total_overall_clients) ||
    (reportsStore.records?.length || 0);

  // Net calculations (strictly Net Deposit = Total Deposit - Total Withdrawal)
  const netDep = totalDep - totalWdr;
  const netReal = depReal - wdrReal;
  const netCopy = depCopy - wdrCopy;

  return {
    total_accounts: totalAcc,
    accounts_real: accReal,
    accounts_copy: accCopy,
    accountsRealFormatted: `${countFormat(accReal)}`,
    accountsCopyFormatted: `${countFormat(accCopy)}`,
    totalAccountsFormatted: `${countFormat(totalAcc)}`,

    total_withdrawal: totalWdr,
    withdrawal_real: wdrReal,
    withdrawal_copy: wdrCopy,
    withdrawalRealFormatted: `${money(wdrReal)} USD`,
    withdrawalCopyFormatted: `${money(wdrCopy)} USD`,
    totalWithdrawalFormatted: `${money(totalWdr)} USD`,

    total_deposit: totalDep,
    deposit_real: depReal,
    deposit_copy: depCopy,
    depositRealFormatted: `${money(depReal)} USD`,
    depositCopyFormatted: `${money(depCopy)} USD`,
    totalDepositFormatted: `${money(totalDep)} USD`,

    net_deposit: netDep,
    net_real: netReal,
    net_copy: netCopy,
    netDepositFormatted: `${money(netDep)} USD`,
    netRealFormatted: `${money(netReal)} USD`,
    netCopyFormatted: `${money(netCopy)} USD`,
  };
});

const cards = computed(() => [
  {
    key: "accounts",
    title: "Total Account",
    tooltip: "Total registered trading accounts under this IB",
    value: summaryData.value.totalAccountsFormatted,
    real: summaryData.value.accountsRealFormatted,
    copy: summaryData.value.accountsCopyFormatted,
    realTooltip: "Real trading accounts",
    copyTooltip: "Copy trading accounts",
  },
  {
    key: "withdrawal",
    title: "Total Withdrawal",
    tooltip: "Total volume withdrawn under this IB",
    value: summaryData.value.totalWithdrawalFormatted,
    real: summaryData.value.withdrawalRealFormatted,
    copy: summaryData.value.withdrawalCopyFormatted,
    realTooltip: "Total withdrawals from real accounts",
    copyTooltip: "Total withdrawals from copy trading accounts",
  },
  {
    key: "deposit",
    title: "Total Deposit",
    tooltip: "Total volume deposited under this IB",
    value: summaryData.value.totalDepositFormatted,
    real: summaryData.value.depositRealFormatted,
    copy: summaryData.value.depositCopyFormatted,
    realTooltip: "Total deposits into real accounts",
    copyTooltip: "Total deposits into copy trading accounts",
  },
]);

const netDepositValue = computed(
  () => summaryData.value.netDepositFormatted,
);



// ─── Symbol Group Data Parsing ──────────────────────────
const symbolGroups = computed(() => {
  const payload = reportsStore.recordsPayload || {};

  let rawGroups = null;

  if (payload.PartitionedPerformances?.SymbolGroup) {
    rawGroups = payload.PartitionedPerformances.SymbolGroup;
  } else if (Array.isArray(payload.DataTable)) {
    for (const item of payload.DataTable) {
      if (item?.PartitionedPerformances?.SymbolGroup) {
        rawGroups = item.PartitionedPerformances.SymbolGroup;
        break;
      }
      if (item?.SymbolGroup) {
        rawGroups = item.SymbolGroup;
        break;
      }
    }
  } else if (payload.SymbolGroup) {
    rawGroups = payload.SymbolGroup;
  } else if (payload.symbol_groups) {
    rawGroups = payload.symbol_groups;
  } else if (payload.symbols) {
    rawGroups = payload.symbols;
  } else if (Array.isArray(payload.records)) {
    rawGroups = payload.records;
  } else if (Array.isArray(payload.data)) {
    rawGroups = payload.data;
  }

  if (!rawGroups) return [];

  let parsedList = [];

  if (Array.isArray(rawGroups)) {
    parsedList = rawGroups.map((g) => {
      const closeVol = Number(
        g.closeVolumeLots || g.CloseVolumeLots || g.close_volume || 0,
      );
      const openVol = Number(
        g.openVolumeLots || g.OpenVolumeLots || g.open_volume || 0,
      );
      const closeTrades = Number(
        g.closeTrades || g.CloseTrades || g.close_trades || 0,
      );
      const openTrades = Number(
        g.openTrades || g.OpenTrades || g.open_trades || 0,
      );
      const comm = Number(
        g.commissionPerLot || g.CommissionPerLot || g.commission || 0,
      );

      const hasData = Boolean(
        g &&
        typeof g === "object" &&
        Object.keys(g).length > 0 &&
        (closeVol > 0 ||
          openVol > 0 ||
          closeTrades > 0 ||
          openTrades > 0 ||
          comm > 0),
      );

      return {
        symbol: g.symbol || g.symbol_group || g.group || g.name || "—",
        hasData,
        closeVolumeLots: closeVol,
        openVolumeLots: openVol,
        closeTrades,
        openTrades,
        commissionPerLot: comm,
      };
    });
  } else if (typeof rawGroups === "object") {
    parsedList = Object.entries(rawGroups).map(([symbol, groupData]) => {
      if (
        !groupData ||
        typeof groupData !== "object" ||
        Object.keys(groupData).length === 0
      ) {
        return {
          symbol,
          hasData: false,
          closeVolumeLots: 0,
          openVolumeLots: 0,
          closeTrades: 0,
          openTrades: 0,
          commissionPerLot: 0,
        };
      }

      const closeVol = Number(
        groupData.CloseVolumeLots ||
          groupData.closeVolumeLots ||
          groupData.close_volume ||
          0,
      );
      const openVol = Number(
        groupData.OpenVolumeLots ||
          groupData.openVolumeLots ||
          groupData.open_volume ||
          0,
      );
      const closeTrades = Number(
        groupData.CloseTrades ||
          groupData.closeTrades ||
          groupData.close_trades ||
          0,
      );
      const openTrades = Number(
        groupData.OpenTrades ||
          groupData.openTrades ||
          groupData.open_trades ||
          0,
      );
      const comm = Number(
        groupData.CommissionPerLot ||
          groupData.commissionPerLot ||
          groupData.commission ||
          0,
      );

      const hasData =
        closeVol > 0 ||
        openVol > 0 ||
        closeTrades > 0 ||
        openTrades > 0 ||
        comm > 0;

      return {
        symbol,
        hasData,
        closeVolumeLots: closeVol,
        openVolumeLots: openVol,
        closeTrades,
        openTrades,
        commissionPerLot: comm,
      };
    });
  }

  // Filter out empty symbol groups (that have no actual trades or volume data)
  return parsedList.filter((item) => item.hasData);
});

const filteredSymbols = computed(() => {
  let list = symbolGroups.value;

  if (showOnlyActive.value) {
    list = list.filter(
      (item) =>
        item.hasData &&
        (item.closeTrades > 0 ||
          item.openTrades > 0 ||
          item.closeVolumeLots > 0 ||
          item.openVolumeLots > 0),
    );
  }

  if (symbolSearch.value.trim()) {
    const q = symbolSearch.value.toLowerCase().trim();
    list = list.filter((item) => item.symbol.toLowerCase().includes(q));
  }

  return list;
});

// ─── Formatting Helpers ────────────────────────────────
const formatMoney = (val) =>
  Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtSignedMoney = (val) => {
  const num = Number(val || 0);
  const formatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (num > 0) return `+$${formatted}`;
  if (num < 0) return `-$${formatted}`;
  return `$${formatted}`;
};

const formatLots = (val) =>
  Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatNum = (val) => Number(val || 0).toLocaleString("en-US");

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

// ─── Date Range Handlers ────────────────────────────────
const handleDateApply = (val) => {
  if (!reportsStore.selectedIbId) return;
  if (Array.isArray(val) && val.length === 2 && val[0] && val[1]) {
    reportsStore.fetchIbDeposits(reportsStore.selectedIbId, true, {
      from_date: formatDateToYYYYMMDD(val[0]),
      to_date: formatDateToYYYYMMDD(val[1]),
    });
  } else if (val && typeof val === "object" && val.start && val.end) {
    reportsStore.fetchIbDeposits(reportsStore.selectedIbId, true, {
      from_date: formatDateToYYYYMMDD(val.start),
      to_date: formatDateToYYYYMMDD(val.end),
    });
  } else {
    reportsStore.fetchIbDeposits(reportsStore.selectedIbId, true);
  }
};

const handleDateClear = () => {
  dateRange.value = null;
  if (reportsStore.selectedIbId) {
    reportsStore.fetchIbDeposits(reportsStore.selectedIbId, true);
  }
};

// ─── Actions ────────────────────────────────────────────
const onRefresh = () => {
  reportsStore.fetchIbDeposits(reportsStore.selectedIbId, true);
};

onMounted(() => {
  reportsStore.isClientMode = isClientMode.value;

  if (isClientMode.value) {
    if (route.query.client_id) {
      reportsStore.selectedIbId = route.query.client_id;
      reportsStore.fetchIbDeposits(route.query.client_id, true);
    }
  } else {
    if (route.query.ib_id) {
      reportsStore.selectedIbId = route.query.ib_id;
      reportsStore.selectIb(route.query.ib_id);
    }
    reportsStore.fetchIbList();
  }
});
</script>
