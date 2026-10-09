<template>
  <div class="space-y-6">
    <!-- Top Announcement Banner / Competitions -->
    <div id="tour-competitions-banner">
      <CompetitionsBanner
        :loading="bannersStore.loading"
        :items="bannersStore.banners"
      />
    </div>

    <!-- Trading Accounts Section -->
    <div id="tour-trading-accounts" class="space-y-4">
      <div
        class="flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-1.5 my-2">
          <h3
            class="text-primary-text max-[320px]:text-xs font-bold md:text-[28px]"
          >
            Trading accounts
          </h3>
          <Tooltip text="Overview of your active live, copy trading, and demo accounts" position="top" wrap>
            <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
          </Tooltip>
        </div>

        <!-- Mobile Dropdown -->
        <div id="tour-account-mode-tabs-mobile" class="sm:hidden w-32">
          <BaseSelect
            :model-value="accountMode"
            :options="accountModeOptions"
            @update:model-value="setAccountMode"
            rounded="full"
            borderless
          />
        </div>

        <!-- Desktop Toggle Buttons -->
        <div id="tour-account-mode-tabs" class="hidden sm:flex h-10 items-center bg-card-background rounded-full p-1">
          <Tooltip text="View real live trading accounts" position="bottom">
            <button
              type="button"
              @click="setAccountMode('live')"
              class="h-8 px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
              :class="
                accountMode === 'live'
                  ? 'bg-button text-button-text font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              "
            >
              Live
            </button>
          </Tooltip>
          <Tooltip text="View copy trading strategy accounts" position="bottom">
            <button
              type="button"
              @click="setAccountMode('copyTrading')"
              class="h-8 px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
              :class="
                accountMode === 'copyTrading'
                  ? 'bg-button text-button-text font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              "
            >
              Copy Trading
            </button>
          </Tooltip>
          <Tooltip text="View demo practice accounts" position="bottom">
            <button
              type="button"
              @click="setAccountMode('demo')"
              class="h-8 px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
              :class="
                accountMode === 'demo'
                  ? 'bg-button text-button-text font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              "
            >
              Demo
            </button>
          </Tooltip>
        </div>
      </div>

      <!-- Account Cards Row -->
      <div class="flex flex-col lg:flex-row gap-4 pb-2">
        <!-- Loading State -->
        <div
          v-if="accountsStore.loading"
          class="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar flex-1 py-1"
        >
          <div
            v-for="n in 3"
            :key="n"
            :id="n === 1 ? 'tour-account-card-first' : undefined"
            class="w-[280px] min-[380px]:w-[320px] sm:w-[360px] md:w-[380px] xl:w-[404px] min-h-[205px] sm:min-h-[218px] xl:h-[229px] rounded-[20px] sm:rounded-[24px] xl:rounded-[30px] bg-card-background p-4 sm:p-5 animate-pulse shrink-0 flex flex-col justify-between"
          >
            <div class="flex justify-between items-center">
              <div class="h-4 w-28 bg-primary-border/50 rounded"></div>
              <div class="h-8 w-8 bg-primary-border/50 rounded-full"></div>
            </div>
            <div class="space-y-2">
              <div class="h-3 w-16 bg-primary-border/40 rounded"></div>
              <div class="h-7 w-36 bg-primary-border/50 rounded"></div>
            </div>
            <div class="flex gap-2">
              <div
                class="h-8 sm:h-9 flex-1 bg-primary-border/40 rounded-full"
              ></div>
              <div
                class="h-8 sm:h-9 flex-1 bg-primary-border/40 rounded-full"
              ></div>
              <div
                class="h-8 sm:h-9 w-8 sm:w-9 bg-primary-border/40 rounded-full"
              ></div>
              <div
                class="h-8 sm:h-9 w-8 sm:w-9 bg-primary-border/40 rounded-full"
              ></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!accountsStore.data.length"
          class="flex-1 bg-card-background rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[210px]"
        >
          <p class="text-primary-text font-semibold mb-1">
            No
            {{ accountMode === "copyTrading" ? "Copy Trading" : accountMode }}
            accounts found
          </p>
          <p class="text-secondary-text text-xs mb-3">
            Add a new
            {{ accountMode === "copyTrading" ? "copy trading" : accountMode }}
            account to get started.
          </p>
          <button
            type="button"
            @click="handleAddAccount"
            class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-button text-button-text font-semibold text-xs transition-all duration-200 hover:brightness-110 cursor-pointer shadow-sm"
          >
            <Plus class="w-4 h-4 text-button-text" />
            <span>Add Account</span>
          </button>
        </div>

        <!-- Cards -->
        <div v-else class="relative flex-1 min-w-0">
          <div
            ref="cardScrollContainerRef"
            @scroll="handleCardScroll"
            class="overflow-x-auto overflow-y-visible no-scrollbar scroll-smooth py-1"
            :style="maskStyle"
          >
            <div class="flex gap-3 sm:gap-4 items-stretch">
              <ClientCard
                v-for="(account, index) in accountsStore.data"
                :key="account.id || account.login"
                :id="index === 0 ? 'tour-account-card-first' : undefined"
                :account="account"
                @deposit="onDeposit"
                @withdraw="onWithdraw"
                @transfer="onTransfer"
                @history="onHistory"
                class="w-[280px] min-[380px]:w-[320px] sm:w-[360px] md:w-[380px] xl:w-[404px] shrink-0"
              />
            </div>
          </div>
        </div>

        <!-- Desktop & Mobile AddAccountMini (Only when accounts exist) -->
        <template v-if="accountsStore.data && accountsStore.data.length">
          <!-- Single Container for Desktop & Mobile -->
          <div id="tour-add-account-card" class="relative z-30 w-full lg:w-[90px] xl:w-[96px] shrink-0">
            <!-- Desktop -->
            <div class="hidden lg:flex w-full h-full">
              <AddAccountMini @click="handleAddAccount" class="w-full h-full" />
            </div>

            <!-- Mobile -->
            <div class="lg:hidden mt-1">
              <AddAccountMini
                @click="handleAddAccount"
                class="w-full max-w-full mx-auto min-h-[58px] sm:min-h-[70px]"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Markets Watch -->
    <div id="tour-marketwatch" class="space-y-4">
      <div class="flex items-center gap-1.5 mt-2 mb-5">
        <h3
          class="text-primary-text max-[320px]:text-xs font-bold md:text-[28px]"
        >
          Marketwatch
        </h3>
        <Tooltip text="Live streaming market prices and 24h performance changes" position="top" wrap>
          <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
        </Tooltip>
      </div>

      <div
        id="tour-marketwatch-table"
        class="rounded-2xl sm:rounded-[28px] bg-card-background overflow-hidden border-0 shadow-none"
      >
        <WatchDataTable
          :show-tabs="false"
          :rows="marketRows"
          :columns="marketColumns"
          :loading="loading"
          :page="page"
          :total-pages="1"
          sortable
        >
        <!-- Symbol: flag pair + bold symbol -->
        <template #cell-symbol="{ row }">
          <div class="flex items-center gap-1.5">
            <!-- Currency Pair Flags -->
            <div class="relative w-8 h-6 shrink-0">
              <!-- Base Currency -->
              <div
                class="absolute left-0 bg-card-background ring-1 ring-card-background shadow-xs top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center z-0"
              >
                <Icon :icon="'circle-flags:' + row.base" class="w-4.5 h-4.5" />
              </div>

              <!-- Quote Currency -->
              <div
                class="absolute left-[11px] top-[60%] -translate-y-1/2 w-5 h-5 rounded-full bg-card-background ring-1 ring-card-background shadow-xs flex items-center justify-center z-10"
              >
                <Icon :icon="'circle-flags:' + row.quote" class="w-4.5 h-4.5" />
              </div>
            </div>

            <!-- Symbol -->
            <div class="flex flex-col">
              <span
  class="text-[13px] font-normal text-primary-text tracking-tight"
>
  {{ row.symbol }}
</span>
            </div>
          </div>
        </template>

        <!-- Bid: green/red price text or dash -->
        <template #cell-bid="{ row, value }">
          <span
            class="font-mono tabular-nums font-medium text-sm"
            :class="
              value !== '—'
                ? row.isUp
                  ? 'text-primary-green'
                  : 'text-primary-red'
                : 'text-secondary-text'
            "
          >
            {{ value }}
          </span>
        </template>

        <!-- Ask Price -->
        <template #cell-ask="{ row, value }">
          <span
            class="font-mono tabular-nums font-medium text-sm"
            :class="
              value !== '—'
                ? row.isUp
                  ? 'text-primary-green'
                  : 'text-primary-red'
                : 'text-secondary-text'
            "
          >
            {{ value }}
          </span>
        </template>

        <!-- Change Value -->
        <template #cell-change="{ row }">
          <div
            class="inline-flex items-center gap-1 font-mono tabular-nums font-medium text-sm justify-end w-full"
            :class="row.change !== '—' ? (row.isUp ? 'text-primary-green' : 'text-primary-red') : 'text-secondary-text'"
          >
            <span>{{ row.change }}</span>
          </div>
        </template>

        <!-- Change % -->
        <template #cell-changePercent="{ row }">
          <div
            class="inline-flex items-center gap-1 font-mono tabular-nums font-medium text-sm justify-end w-full"
            :class="row.changePercent !== '—' ? (row.isUp ? 'text-primary-green' : 'text-primary-red') : 'text-secondary-text'"
          >
            <span>{{ row.changePercent }}</span>
          </div>
        </template>
      </WatchDataTable>
    </div>
  </div>

    <!-- Disclaimers / Warnings -->
    <AccountsDisclaimer />

    <AddEditAccount
      :open="openDialog"
      :editData="editData"
      @close="closeDialog"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { Plus, Info } from "lucide-vue-next";

import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useProfileStore } from "@/stores/shared/profile";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import { useTickerStore } from "@/stores/shared/ticker";
import { useTourStore } from "@/stores/shared/tour";
import apiRequest from "@/api/request";
import urls from "@/api/urls";

import CompetitionsBanner from "@/components/common/CompetitionsBanner.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import ClientCard from "@/components/client/dashboard/ClientCard.vue";
import WatchDataTable from "@/components/base/datatable/WatchDataTable.vue";
import AddAccountMini from "@/components/base/AddAccountMini.vue";
import AddEditAccount from "@/components/client/accounts/AddEditAccount.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";

import banner1 from "@/assets/header.png";
import banner2 from "@/assets/header.png";
import banner3 from "@/assets/header.png";
import { Icon } from "@iconify/vue";

const profile = useProfileStore();
const router = useRouter();
const snackbar = useSnackbarStore();
const accountsStore = useTradingAccountsStore();
const tickerStore = useTickerStore();
const tourStore = useTourStore();

// ─── Scroll & Navigation for Account Cards ─────────────────────────
const cardScrollContainerRef = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

const handleCardScroll = () => {
  const el = cardScrollContainerRef.value;
  if (!el) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }
  const { scrollLeft, scrollWidth, clientWidth } = el;
  canScrollLeft.value = scrollLeft > 8;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 8;
};

const maskStyle = computed(() => {
  const left = canScrollLeft.value
    ? "transparent 0, black 40px"
    : "black 0, black 40px";
  const right = canScrollRight.value ? "transparent 100%" : "black 100%";
  const mask = `linear-gradient(to right, ${left}, black calc(100% - 40px), ${right})`;
  return {
    maskImage: mask,
    WebkitMaskImage: mask,
  };
});



watch(
  () => accountsStore.data,
  () => {
    nextTick(() => {
      handleCardScroll();
    });
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  window.addEventListener("resize", handleCardScroll);
  nextTick(() => {
    handleCardScroll();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", handleCardScroll);
});

// ─── Trading accounts (Demo / Live / Copy Trading) ────────────────
const accountMode = ref("live"); // 'live' | 'copyTrading' | 'demo'
const accountModeOptions = [
  { label: "Live", value: "live" },
  { label: "Copy Trading", value: "copyTrading" },
  { label: "Demo", value: "demo" },
];

const setAccountMode = (mode) => {
  accountMode.value = mode;
  if (mode === "demo") {
    accountsStore.platformFilter = "real";
    accountsStore.typeFilter = "demo";
  } else if (mode === "live") {
    accountsStore.platformFilter = "real";
    accountsStore.typeFilter = "live";
  } else if (mode === "copyTrading") {
    accountsStore.platformFilter = "copy_trading";
    accountsStore.typeFilter = "all";
  }
  accountsStore.pagination.page = 1;
  accountsStore.fetchAccounts(true);
};

// data table logic
const loading = ref(false);
const page = ref(1);

// Sorting -- client-side (DataTable sorts `marketRows` itself)
const sortBy = ref(null);
const sortDir = ref("asc");

// Row selection
const selectedSymbols = ref([]);

function handleRowClick(row, index) {
  console.log("clicked", row.symbol, index);
}
const kycStatus = computed(() => String(profile.user?.kyc_status || '').toLowerCase().trim());
const isKycApproved = computed(() => {
  return kycStatus.value === "approved" || kycStatus.value === "verified" || kycStatus.value === "completed";
});

const openDialog = ref(false);
const editData = ref(null);
const handleAddAccount = () => {
  if (!isKycApproved.value) {
    snackbar.show("Please verify your KYC before adding an account.", "error");
    return;
  }

  onAddAccount();
};
const onAddAccount = () => {
  editData.value = null; // Add mode
  openDialog.value = true;
};
const closeDialog = () => {
  openDialog.value = false;
  editData.value = null;
};
const onDeposit = (account) => {
  router.push({
    name: "funds",
    query: { tab: "deposit", accountId: account?.id },
  });
};

const onWithdraw = (account) => {
  router.push({
    name: "funds",
    query: { tab: "withdraw", accountId: account?.id },
  });
};

const onTransfer = (account) => {
  router.push({
    name: "funds",
    query: { tab: "transfer", accountId: account?.id },
  });
};

const onHistory = (account) => {
  if (account?.id) {
    localStorage.setItem("active_account", JSON.stringify(account));
    router.push({
      name: "account-transactions",
      params: {
        id: account.id,
      },
    });
  } else {
    snackbar.show(
      `Loading transaction history for account #${account?.login || "—"}...`,
      "info",
    );
  }
};

const onJoinCompetition = () => {
  snackbar.show("Competitions page coming soon.", "info");
};

// ─── Markets watch table ──────────────────────────────────────────
const marketTab = ref("Markets to Watch");
const marketTabs = ["Markets to Watch"];

const marketSymbols = [
  { symbol: "XAUUSD", base: "us", quote: "us" },
  { symbol: "EURUSD", base: "eu", quote: "us" },
  { symbol: "GBPUSD", base: "gb", quote: "us" },
  { symbol: "USDJPY", base: "us", quote: "jp" },
  { symbol: "AUDUSD", base: "au", quote: "us" },
  { symbol: "AUDJPY", base: "au", quote: "jp" },
  { symbol: "USDCAD", base: "us", quote: "ca" },
  { symbol: "EURGBP", base: "eu", quote: "gb" },
  { symbol: "EURCHF", base: "eu", quote: "ch" },
  { symbol: "USDCHF", base: "us", quote: "ch" },
];

const marketColumns = [
  {
    key: "symbol",
    label: "Symbol",
    tooltip: "Currency pair or trading asset symbol",
    width: "28%",
  },
  {
    key: "bid",
    label: "Bid",
    tooltip: "Highest price a buyer is willing to pay (Sell price)",
    align: "right",
    width: "18%",
  },
  {
    key: "ask",
    label: "Ask",
    tooltip: "Lowest price a seller is willing to accept (Buy price)",
    align: "right",
    width: "18%",
  },
  {
    key: "change",
    label: "Change",
    tooltip: "24-hour price change value",
    align: "right",
    width: "18%",
  },
  {
    key: "changePercent",
    label: "Change %",
    tooltip: "24-hour percentage price change",
    align: "right",
    width: "18%",
  },
];

const updateActiveTabSymbols = () => {
  tickerStore.startWebSocket();
  const symbolTokens = marketSymbols.map((item) => item.symbol);
  tickerStore.updateTickerList(symbolTokens);
};

const marketRows = computed(() => {
  return marketSymbols.map((item) => {
    const live =
      tickerStore.getLastPrice(item.symbol) ||
      tickerStore.lastPrices[item.symbol];

    if (!live || live.bid == null) {
      return {
        symbol: item.symbol,
        base: item.base,
        quote: item.quote,
        bid: "—",
        ask: "—",
        change: "—",
        changePercent: "—",
        isUp: true,
      };
    }

    const isJpy = item.symbol.includes("JPY");
    const precision = isJpy
      ? 3
      : item.symbol.includes("XAU") || item.symbol.length === 3
        ? 2
        : 5;

    const bidVal = live.bid != null ? Number(live.bid).toFixed(precision) : "—";
    const askVal = live.ask != null ? Number(live.ask).toFixed(precision) : "—";

    let changeVal = "—";
    let changePercentVal = "—";
    let isUpVal = true;

    const bidNum = live.bid != null ? Number(live.bid) : null;
    const basePrice = Number(live.open || live.prevClose || live.close || live.initialBid);

    const rawChange = live.change ?? live.price_change;
    const rawChangePercent = live.changePercent ?? live.change_percent ?? live.percent_change;

    if (rawChange != null) {
      const c = Number(rawChange);
      isUpVal = c >= 0;
      changeVal = (c >= 0 ? "+" : "") + c.toFixed(precision);
    } else if (bidNum != null && basePrice > 0) {
      const diff = bidNum - basePrice;
      isUpVal = diff >= 0;
      changeVal = (diff >= 0 ? "+" : "") + diff.toFixed(precision);
    }

    if (rawChangePercent != null) {
      const pct = Number(rawChangePercent);
      if (rawChange == null) isUpVal = pct >= 0;
      changePercentVal = (pct >= 0 ? "+" : "") + Math.abs(pct).toFixed(2) + "%";
    } else if (rawChange != null && basePrice > 0) {
      const c = Number(rawChange);
      const pct = (c / basePrice) * 100;
      changePercentVal = (pct >= 0 ? "+" : "") + Math.abs(pct).toFixed(2) + "%";
    } else if (bidNum != null && basePrice > 0) {
      const diff = bidNum - basePrice;
      const pct = (diff / basePrice) * 100;
      changePercentVal = (pct >= 0 ? "+" : "") + Math.abs(pct).toFixed(2) + "%";
    }

    return {
      symbol: item.symbol,
      base: item.base,
      quote: item.quote,
      bid: bidVal,
      ask: askVal,
      change: changeVal,
      changePercent: changePercentVal,
      isUp: isUpVal,
    };
  });
});

import { useBannersStore } from "@/stores/shared/banners";

const bannersStore = useBannersStore();

onMounted(() => {
  bannersStore.fetchBanners();
  setAccountMode(accountMode.value);
  updateActiveTabSymbols();
});

onUnmounted(() => {
  accountsStore.reset();
});
</script>
