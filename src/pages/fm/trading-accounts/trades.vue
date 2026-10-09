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
      <!-- <div>
        <p class="text-[10px] uppercase tracking-widest text-secondary-text mb-1 font-semibold">Balance</p>
        <p class="text-sm font-bold text-primary-text tabular-nums">{{ currencySymbol }}{{ activeAccount.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
      </div>
      <div>
        <p class="text-[10px] uppercase tracking-widest text-secondary-text mb-1 font-semibold">PnL</p>
        <p class="text-sm font-bold tabular-nums" :class="(activeAccount.pnl ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'">
          {{ (activeAccount.pnl ?? 0) >= 0 ? '+' : '' }}{{ currencySymbol }}{{ activeAccount.pnl?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </p>
      </div> -->
    </div>

     <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <template v-if="store.loading">
        <div
          v-for="n in 2"
          :key="n"
          class="bg-card-background border border-primary-border rounded-xl p-4 animate-pulse space-y-2"
        >
          <div class="h-3 w-20 bg-background rounded" />
          <div class="h-6 w-28 bg-background rounded" />
        </div>
      </template>

      <template v-else>
        <div
          class="bg-card-background border border-primary-border rounded-xl p-4"
        >
          <p
            class="text-[11px] uppercase tracking-wide text-secondary-text mb-1"
          >
            Total Volume
          </p>

          <p class="text-2xl font-medium text-primary-text">
            {{ formatNum(store.summary.total_lots) }}
          </p>
        </div>

        <div
          class="bg-card-background border border-primary-border rounded-xl p-4"
        >
          <p
            class="text-[11px] uppercase tracking-wide text-secondary-text mb-1"
          >
            Total Trades
          </p>

          <p class="text-2xl font-medium text-primary-text">
            {{ store.summary.total_trades }}
          </p>
        </div>

        <div
          class="bg-card-background border border-primary-border rounded-xl p-4"
          v-if="activePositionTab !== 'open'"
        >
          <p
            class="text-[11px] uppercase tracking-wide text-secondary-text mb-1"
          >
            Total PnL
          </p>

          <p
            class="text-2xl font-medium"
            :class="
              store.summary.total_pnl >= 0
                ? 'text-green-700'
                : 'text-red-700'
            "
          >
            {{ store.summary.total_pnl >= 0 ? "+" : "" }}{{ currencySymbol }} {{
              formatNum(store.summary.total_pnl)
            }}
          </p>
        </div>
      </template>
    </div>
    <!-- Position Tabs -->
    <div class="flex gap-2 mb-6 border-b border-primary-border">
      <button
        @click="activePositionTab = 'all'"
        class="px-4 py-3 text-sm font-medium transition-colors"
        :class="
          activePositionTab === 'all'
            ? 'text-primary-text border-b-2 border-primary-blue'
            : 'text-secondary-text hover:text-primary-text'
        "
      >
        All Positions
      </button>

      <button
        @click="activePositionTab = 'open'"
        class="px-4 py-3 text-sm font-medium transition-colors"
        :class="
          activePositionTab === 'open'
            ? 'text-primary-text border-b-2 border-primary-blue'
            : 'text-secondary-text hover:text-primary-text'
        "
      >
        Open
      </button>

      <button
        @click="activePositionTab = 'closed'"
        class="px-4 py-3 text-sm font-medium transition-colors"
        :class="
          activePositionTab === 'closed'
            ? 'text-primary-text border-b-2 border-primary-blue'
            : 'text-secondary-text hover:text-primary-text'
        "
      >
        Closed
      </button>
    </div>

    <!-- Table -->
    <div class="w-full border border-primary-border rounded-xl overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-primary-border">
            <th
              class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3 pl-6 sm:pl-8"
            >
              Trade ID
            </th>

            <th
              class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3"
            >
              Symbol
            </th>

            <th
              class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3"
            >
              Type
            </th>

            <th
              class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3"
            >
              Volume
            </th>

            <th
              class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3"
            >
              Entry
            </th>

            <th
              class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3"
            >
              Exit
            </th>

            <!-- <th
              class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3"
            >
              LTP
            </th> -->

            <th
              class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3"
            >
              PnL
            </th>

            <th
              class="text-left text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3"
            >
              Status
            </th>

            <th
              class="text-right text-[11px] font-medium text-secondary-text uppercase tracking-widest p-3"
            >
              Created
            </th>
          </tr>
        </thead>

        <!-- Skeleton -->
        <tbody v-if="store.loading">
          <tr
            v-for="n in 8"
            :key="n"
            class="border-b border-primary-border animate-pulse"
          >
            <td class="p-3">
              <div class="h-3 w-10 bg-card-background rounded" />
            </td>

            <td class="p-3">
              <div class="h-3 w-16 bg-card-background rounded" />
            </td>

            <td class="p-3">
              <div class="h-5 w-10 bg-card-background rounded-full" />
            </td>

            <td class="p-3">
              <div class="h-3 w-10 bg-card-background rounded" />
            </td>

            <td class="p-3">
              <div class="h-3 w-14 bg-card-background rounded" />
            </td>

            <td class="p-3">
              <div class="h-3 w-14 bg-card-background rounded" />
            </td>

            <td class="p-3">
              <div class="h-3 w-14 bg-card-background rounded" />
            </td>

            <td class="p-3">
              <div class="h-3 w-16 bg-card-background rounded" />
            </td>

            <td class="p-3">
              <div class="h-5 w-14 bg-card-background rounded-full" />
            </td>

            <td class="p-3 flex justify-end">
              <div class="h-3 w-20 bg-card-background rounded" />
            </td>
          </tr>
        </tbody>

        <!-- Empty -->
        <tbody v-else-if="store.data.length === 0">
          <tr>
            <td colspan="10" class="py-16 text-center">
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full bg-card-background flex items-center justify-center"
                >
                  <BarChart2 class="w-5 h-5 text-secondary-text" />
                </div>

                <p class="text-sm font-medium text-primary-text">
                  No trades found
                </p>

                <p class="text-xs text-secondary-text">
                  Trades will appear here once executed
                </p>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Data -->
        <tbody v-else>
          <tr
            v-for="trade in store.data"
            :key="trade.trade_id"
            class="border-b border-primary-border last:border-none hover:bg-card-background transition-colors"
          >
            <td class="p-3 pl-6 sm:pl-8 text-xs font-medium text-primary-text">
              #{{ trade.trade_id }}
            </td>

            <td class="p-3 text-xs font-medium text-primary-text">
              {{ trade.symbol }}
            </td>

            <td class="p-3">
              <BaseBadge :value="trade.type" />
            </td>

            <td class="p-3 text-xs text-primary-text tabular-nums">
              {{ trade.lot.toFixed(2) }}
            </td>

            <td class="p-3 text-xs text-primary-text tabular-nums">
              {{
                trade.entry_price != null
                  ? Number(trade.entry_price).toFixed(3)
                  : "—"
              }}
            </td>

            <td class="p-3 text-xs text-primary-text tabular-nums">
              {{
                trade.exit_price != null
                  ? Number(trade.exit_price).toFixed(3)
                  : "—"
              }}
            </td>

            <!-- LTP -->
            <!-- <td class="p-3 text-xs text-primary-text tabular-nums">
              {{ lastTickerPriceText(trade) }}
            </td> -->

            <!-- PNL -->
            <td class="p-3">
              <span
                class="text-xs tabular-nums font-medium"
                :class="
                  pnlValue(trade) >= 0
                    ? 'text-green-700'
                    : 'text-red-700'
                "
              >
                {{ pnlValue(trade) >= 0 ? "+" : "" }}{{ currencySymbol }} {{
                  formatNum(pnlValue(trade))
                }}
              </span>
            </td>

            <td class="p-3">
              <BaseBadge :value="trade.status" />
            </td>

            <td class="p-3 text-xs text-secondary-text text-right">
              {{ formatDate(trade.created_at) }}
            </td>
          </tr>
        </tbody>
      </table>
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
import { onMounted, ref, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { BarChart2 } from "lucide-vue-next";

import { useAccountTradesStore } from "@/stores/client/accountsTrades";
import { useProfileStore } from "@/stores/shared/profile";
import Pagination from "@/components/base/Pagination.vue";

import { livePNL } from "@/utils/livePNL";
import { useTickerStore } from "@/stores/shared/ticker";

const activeCurrency = ref(localStorage.getItem('active_currency') || 'USD')
const activeAccount = ref(null)

const currencySymbol = computed(() => {
  const syms = { USD: '$', USC: 'C' }
  return syms[activeCurrency.value?.toUpperCase()] || '$'
})

const store = useAccountTradesStore();
const profileStore = useProfileStore();
const tickerStore = useTickerStore();

const route = useRoute();

const accountId = route.params.id;

const activePositionTab = ref("all");

const isFmRole = () => profileStore.user?.role === "fm";

const handlePageChange = (page) => {
  store.setPage(page, getSideParam());
};

const getSideParam = () => {
  if (activePositionTab.value === "open") return "open";

  if (activePositionTab.value === "closed") return "closed";

  return null;
};

const isOpenTrade = (trade) =>
  String(trade?.status ?? "").toUpperCase() === "OPEN";

const pnlValue = (trade) => {
  const raw = isOpenTrade(trade) ? livePNL(trade) : trade?.pnl;

  const val = Number(raw);

  return Number.isFinite(val) ? val : 0;
};

const lastTickerPriceText = (trade) => {
  const quote = tickerStore?.getLastPrice?.(trade?.symbol);

  if (quote == null) return "—";

  if (typeof quote === "number") {
    return Number.isFinite(quote) ? formatNum(quote) : "—";
  }

  const side = String(trade?.type ?? "").toUpperCase();

  const raw =
    side === "BUY" || side === "buy"
      ? quote?.bid
      : quote?.ask;

  const val = Number(raw);

  return Number.isFinite(val) ? formatNum(val) : "—";
};

const formatNum = (val) =>
  (val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatDate = (val) =>
  new Date(val).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

watch(activePositionTab, () => {
  store.setPage(1, getSideParam());
});

watch(
  () => store.data,
  (newData) => {
    if (newData && newData.length > 0) {
      const uniqueSymbols = [
        ...new Set(newData.map((trade) => trade.symbol)),
      ].filter(Boolean);

      tickerStore.updateTickerList(uniqueSymbols);
    }
  },
  { deep: true }
);

onMounted(() => {
  try {
    const stored = localStorage.getItem('active_account')
    if (stored) activeAccount.value = JSON.parse(stored)
  } catch (e) {
    // ignore parsing errors
  }
  store.fetchTrades(accountId)
});
</script>