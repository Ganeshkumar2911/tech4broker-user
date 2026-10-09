<script setup>
import { onMounted, computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  TrendingUp,
  Activity,
  Settings2,
  Clock,
  BarChart2,
  UserPlus,
} from "lucide-vue-next";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { useFmAnalysisStore } from "@/stores/fm/analysis";
import { useFmLeaderboardStore } from "@/stores/fm/leaderboard";
import { useProfileStore } from "@/stores/shared/profile";
import FollowDialog from "@/components/fm/leaderboard/FollowDialog.vue";
import EmptyState from "@/components/base/EmptyState.vue";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const analysisStore = useFmAnalysisStore();
const leaderboardStore = useFmLeaderboardStore();
const profileStore = useProfileStore();
const route = useRoute();
const router = useRouter();
const fmId = route.params.id;
const isFollowed = computed(() => route.query.is_followed === "true");
const followerId = computed(() => route.query.follower_id);

const dialog = ref({ open: false, mode: "follow", item: null });

const getActiveFmFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("activeFm") || "null");
  } catch {
    return null;
  }
};

const activeFm = ref(getActiveFmFromStorage());
const activeCurrency = ref(localStorage.getItem("active_currency") || "USD");

const currencySymbol = computed(() => {
  const syms = { USD: "$", USC: "C" };
  return syms[activeCurrency.value?.toUpperCase()] || "$";
});

const openDialog = (mode, item) => {
  if (mode === "unfollow" && item?.following_account_id) {
    leaderboardStore.fetchUnfollowPreview({
      trading_account_id: item.following_account_id,
    });
  }
  dialog.value = { open: true, mode, item };
};

const handleDialogSuccess = (event) => {
  if (!activeFm.value) return;
  const updated = { ...activeFm.value };
  if (event.mode === "follow") {
    updated.can_follow = false;
  } else if (event.mode === "unfollow") {
    updated.can_follow = true;
    updated.following_account_id = null;
    updated.following_account_number = null;
  }
  activeFm.value = updated;
  localStorage.setItem("activeFm", JSON.stringify(updated));
};

const handleDialogClose = () => {
  dialog.value.open = false;
};

const navigateToFullAnalysis = () => {
  const query = {};
  if (isFollowed.value) {
    query.is_followed = "true";
    query.follower_id = followerId.value;
  }
  router.push({ path: `/fm-details/${fmId}`, query });
};

const themeColor = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const withAlpha = (hex, alpha) => {
  const value = hex.replace("#", "");
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const chartData = computed(() => {
  const points = analysisStore.analytics.growth_chart;
  if (!points?.length) return null;

  const labels = points.map((point) => point.date);
  const values = points.map((p) => p.equity);
  const isPositive = values[values.length - 1] >= values[0];
  const lineColor = themeColor(
    isPositive ? "--color-primary-green" : "--color-primary-red",
  );

  return {
    labels,
    datasets: [
      {
        data: values,
        borderColor: lineColor,
        backgroundColor: withAlpha(lineColor, 0.08),
        borderWidth: 1.5,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // let the h-72 wrapper control size
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: {
      display: true,
      grid: { display: false },
      ticks: {
        color: themeColor("--color-secondary-text"),
        font: { size: 9 },
        maxRotation: 45,
        minRotation: 0,
        autoSkip: true,
        autoSkipPadding: 20,
        maxTicksLimit: 6,
      },
    },
    y: {
      display: true,
      grid: { color: themeColor("--color-primary-border"), drawBorder: false },
      ticks: {
        color: themeColor("--color-secondary-text"),
        font: { size: 10 },
      },
    },
  },
};

const formatNum = (val) =>
  (val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

onMounted(() =>
  analysisStore.fetchAnalytics(fmId, isFollowed.value, followerId.value),
);
</script>

<template>
  <div class="px-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-full bg-button flex items-center justify-center text-button-text font-semibold text-lg shrink-0"
        >
          {{ activeFm?.label_name?.charAt(0) ?? "F" }}
        </div>
        <div>
          <h1 class="text-base font-semibold text-primary-text">
            {{ activeFm?.label_name ?? "Fund Manager" }}
          </h1>
          <div class="flex items-center gap-2 mt-0.5">
            <span
              class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200"
            >
              Medium Risk
            </span>
            <span class="text-xs text-secondary-text"
              >{{ activeFm?.win_rate_percent }}% win rate</span
            >
          </div>
        </div>
      </div>
      <button
        v-if="profileStore.user?.role === 'client' && !isFollowed"
        @click="
          openDialog(activeFm?.can_follow ? 'follow' : 'follow', activeFm)
        "
        class="shrink-0 px-4 py-2 rounded-sm bg-button hover:opacity-90 text-button-text text-xs font-medium transition-colors flex items-center gap-1.5"
      >
        <UserPlus class="w-3.5 h-3.5" />
        Follow
      </button>
    </div>

    <!-- Overview Cards -->
    <div
      v-if="analysisStore.loading"
      class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
    >
      <div
        v-for="n in 4"
        :key="n"
        class="bg-card-background border border-primary-border rounded-xl p-4 animate-pulse space-y-2"
      >
        <div class="h-6 w-20 bg-background rounded" />
        <div class="h-3 w-24 bg-background rounded" />
      </div>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div
        class="bg-card-background border border-primary-border rounded-xl p-4 text-center"
      >
        <p
          class="text-xl font-semibold"
          :class="
            analysisStore.analytics.overview?.total_return >= 0
              ? 'text-primary-green'
              : 'text-primary-red'
          "
        >
          {{ analysisStore.analytics.overview?.total_return >= 0 ? "+" : ""
          }}{{ currencySymbol
          }}{{ formatNum(analysisStore.analytics.overview?.total_return) }}
        </p>
        <p class="text-[11px] uppercase tracking-wide text-secondary-text mt-1">
          Total Return
        </p>
      </div>
      <div
        class="bg-card-background border border-primary-border rounded-xl p-4 text-center"
      >
        <p class="text-xl font-semibold text-primary-text">
          {{ analysisStore.analytics.overview?.win_rate }}%
        </p>
        <p class="text-[11px] uppercase tracking-wide text-secondary-text mt-1">
          Win Rate
        </p>
      </div>
      <div
        class="bg-card-background border border-primary-border rounded-xl p-4 text-center"
      >
        <p class="text-xl font-semibold text-primary-text">
          {{ analysisStore.analytics.overview?.profit_factor }}
        </p>
        <p class="text-[11px] uppercase tracking-wide text-secondary-text mt-1">
          Profit Factor
        </p>
      </div>
      <div
        class="bg-card-background border border-primary-border rounded-xl p-4 text-center"
      >
        <p class="text-xl font-semibold text-primary-red">
          {{ analysisStore.analytics.overview?.max_drawdown }}%
        </p>
        <p class="text-[11px] uppercase tracking-wide text-secondary-text mt-1">
          Max Drawdown
        </p>
      </div>
    </div>

    <!-- Two column layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Left Column -->
      <div class="flex flex-col gap-4 h-full">
        <!-- Growth Chart -->
        <div
          class="bg-card-background border border-primary-border rounded-xl overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-5 py-3.5 border-b border-primary-border"
          >
            <div class="flex items-center gap-2">
              <TrendingUp class="w-3.5 h-3.5 text-secondary-text" />
              <span class="text-xs font-medium text-primary-text">Growth</span>
            </div>
            <span
              class="text-xs font-medium"
              :class="
                analysisStore.analytics.overview?.total_return >= 0
                  ? 'text-primary-green'
                  : 'text-primary-red'
              "
            >
              {{ analysisStore.analytics.overview?.total_return >= 0 ? "+" : ""
              }}{{ currencySymbol
              }}{{ formatNum(analysisStore.analytics.overview?.total_return) }}
            </span>
          </div>
          <div
            v-if="analysisStore.loading"
            class="h-72 bg-background rounded-lg animate-pulse"
          />
          <div v-else-if="chartData" class="relative h-72 w-full">
            <Line :data="chartData" :options="chartOptions" />
          </div>
          <div v-else class="h-72 flex items-center justify-center">
            <EmptyState
              title="No data available to show"
              subtitle="Growth performance history will appear here"
            >
              <template #icon
                ><TrendingUp class="w-5 h-5 text-secondary-text"
              /></template>
            </EmptyState>
          </div>
        </div>

        <!-- Trade Statistics -->
        <div
          class="bg-card-background border border-primary-border rounded-xl overflow-hidden flex flex-col flex-1"
        >
          <div
            class="flex items-center gap-2 px-5 py-3.5 border-b border-primary-border"
          >
            <Activity class="w-3.5 h-3.5 text-secondary-text" />
            <span class="text-xs font-medium text-primary-text"
              >Trade Statistics</span
            >
          </div>

          <div
            v-if="analysisStore.loading"
            class="p-4 space-y-3 animate-pulse flex-1"
          >
            <div v-for="n in 5" :key="n" class="flex justify-between">
              <div class="h-3 w-24 bg-background rounded" />
              <div class="h-3 w-16 bg-background rounded" />
            </div>
          </div>

          <div v-else class="divide-y divide-primary-border flex-1">
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Total Trades</span>
              <span class="text-xs font-medium text-primary-text">{{
                analysisStore.analytics.trade_statistics?.total_trades
              }}</span>
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Avg Trade PnL</span>
              <span
                class="text-xs font-medium"
                :class="
                  analysisStore.analytics.trade_statistics?.avg_trade_pnl >= 0
                    ? 'text-primary-green'
                    : 'text-primary-red'
                "
              >
                {{
                  analysisStore.analytics.trade_statistics?.avg_trade_pnl >= 0
                    ? "+"
                    : ""
                }}{{ currencySymbol
                }}{{
                  formatNum(
                    analysisStore.analytics.trade_statistics?.avg_trade_pnl,
                  )
                }}
              </span>
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Best Trade</span>
              <span class="text-xs font-medium text-primary-green">
                +{{ currencySymbol
                }}{{
                  formatNum(
                    analysisStore.analytics.trade_statistics?.best_trade,
                  )
                }}
              </span>
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Worst Trade</span>
              <span class="text-xs font-medium text-primary-red">
                {{ currencySymbol
                }}{{
                  formatNum(
                    analysisStore.analytics.trade_statistics?.worst_trade,
                  )
                }}
              </span>
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Long / Short</span>
              <span class="text-xs font-medium text-primary-text">{{
                analysisStore.analytics.trade_statistics?.long_short
              }}</span>
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Profitable Trades</span>
              <span class="text-xs font-medium text-primary-text">{{
                analysisStore.analytics.trade_statistics?.profitable_trades
              }}</span>
            </div>
          </div>

          <div class="px-5 py-4 border-t border-primary-border mt-auto">
            <button
              @click="navigateToFullAnalysis"
              class="w-full px-4 py-2.5 rounded-lg bg-button hover:opacity-90 text-button-text text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <BarChart2 class="w-3.5 h-3.5" /> View Full Analysis
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="flex flex-col gap-4 h-full">
        <!-- Strategy Info -->
        <div
          class="bg-card-background border border-primary-border rounded-xl overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-5 py-3.5 border-b border-primary-border"
          >
            <Settings2 class="w-3.5 h-3.5 text-secondary-text" />
            <span class="text-xs font-medium text-primary-text"
              >Strategy Info</span
            >
          </div>

          <div v-if="analysisStore.loading" class="p-4 space-y-3 animate-pulse">
            <div v-for="n in 6" :key="n" class="flex justify-between">
              <div class="h-3 w-24 bg-background rounded" />
              <div class="h-3 w-16 bg-background rounded" />
            </div>
          </div>

          <div v-else class="divide-y divide-primary-border">
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Master Balance</span>
              <span class="text-xs font-medium text-primary-text"
                >{{ currencySymbol
                }}{{
                  formatNum(
                    analysisStore.analytics.strategy_info?.master_balance ??
                      analysisStore.analytics.follower_info?.balance ??
                      analysisStore.analytics.strategy_info?.balance,
                  )
                }}</span
              >
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Master Equity</span>
              <span class="text-xs font-medium text-primary-text"
                >{{ currencySymbol
                }}{{
                  formatNum(
                    analysisStore.analytics.strategy_info?.master_equity ??
                      analysisStore.analytics.follower_info?.equity,
                  )
                }}</span
              >
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Settlement</span>
              <span class="text-xs font-medium text-primary-text capitalize">{{
                analysisStore.analytics.strategy_info?.settlement
              }}</span>
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Profit Sharing</span>
              <span class="text-xs font-medium text-primary-text"
                >{{
                  analysisStore.analytics.strategy_info?.profit_sharing
                }}%</span
              >
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Min Balance</span>
              <span class="text-xs font-medium text-primary-text"
                >{{ currencySymbol
                }}{{
                  formatNum(analysisStore.analytics.strategy_info?.min_balance)
                }}</span
              >
            </div>
            <div class="flex items-center justify-between px-5 py-3">
              <span class="text-xs text-secondary-text">Active Since</span>
              <span class="text-xs font-medium text-primary-text">{{
                analysisStore.analytics.strategy_info?.active_since
              }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Performance -->
        <div
          class="bg-card-background border border-primary-border rounded-xl overflow-hidden"
        >
          <div
            class="flex items-center gap-2 px-5 py-3.5 border-b border-primary-border"
          >
            <Clock class="w-3.5 h-3.5 text-secondary-text" />
            <span class="text-xs font-medium text-primary-text"
              >Recent Performance</span
            >
          </div>

          <div
            v-if="analysisStore.loading"
            class="p-4 grid grid-cols-2 gap-3 animate-pulse"
          >
            <div
              v-for="n in 2"
              :key="n"
              class="h-16 bg-background rounded-xl"
            />
          </div>

          <div v-else class="p-4 grid grid-cols-2 gap-3">
            <div
              class="rounded-xl p-3 text-center border"
              :class="
                analysisStore.analytics.recent_performance?.['7_days'] >= 0
                  ? 'bg-primary-green/10 border-primary-green/25'
                  : 'bg-primary-red/10 border-primary-red/25'
              "
            >
              <p class="text-xs text-secondary-text mb-1">7 Days</p>
              <p
                class="text-sm font-semibold"
                :class="
                  analysisStore.analytics.recent_performance?.['7_days'] >= 0
                    ? 'text-primary-green'
                    : 'text-primary-red'
                "
              >
                {{
                  analysisStore.analytics.recent_performance?.["7_days"] >= 0
                    ? "+"
                    : ""
                }}{{ currencySymbol
                }}{{
                  formatNum(
                    analysisStore.analytics.recent_performance?.["7_days"],
                  )
                }}
              </p>
            </div>
            <div
              class="rounded-xl p-3 text-center border"
              :class="
                analysisStore.analytics.recent_performance?.['30_days'] >= 0
                  ? 'bg-primary-green/10 border-primary-green/25'
                  : 'bg-primary-red/10 border-primary-red/25'
              "
            >
              <p class="text-xs text-secondary-text mb-1">30 Days</p>
              <p
                class="text-sm font-semibold"
                :class="
                  analysisStore.analytics.recent_performance?.['30_days'] >= 0
                    ? 'text-primary-green'
                    : 'text-primary-red'
                "
              >
                {{
                  analysisStore.analytics.recent_performance?.["30_days"] >= 0
                    ? "+"
                    : ""
                }}{{ currencySymbol
                }}{{
                  formatNum(
                    analysisStore.analytics.recent_performance?.["30_days"],
                  )
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Monthly Returns -->
        <div
          class="bg-card-background border border-primary-border rounded-xl overflow-hidden flex flex-col flex-1"
        >
          <div
            class="flex items-center gap-2 px-5 py-3.5 border-b border-primary-border"
          >
            <BarChart2 class="w-3.5 h-3.5 text-secondary-text" />
            <span class="text-xs font-medium text-primary-text"
              >Monthly Returns</span
            >
          </div>

          <div
            v-if="analysisStore.loading"
            class="p-4 space-y-3 animate-pulse flex-1"
          >
            <div v-for="n in 2" :key="n" class="flex justify-between">
              <div class="h-3 w-20 bg-background rounded" />
              <div class="h-3 w-16 bg-background rounded" />
            </div>
          </div>

          <div
            v-else-if="analysisStore.analytics.monthly_returns?.length"
            class="divide-y divide-primary-border flex-1"
          >
            <div
              v-for="item in analysisStore.analytics.monthly_returns"
              :key="item.month"
              class="flex items-center justify-between px-5 py-3"
            >
              <span class="text-xs text-secondary-text">{{ item.month }}</span>
              <span
                class="text-xs font-medium"
                :class="
                  item.return >= 0 ? 'text-primary-green' : 'text-primary-red'
                "
              >
                {{ item.return >= 0 ? "+" : "" }}{{ currencySymbol
                }}{{ formatNum(item.return) }}
              </span>
            </div>
          </div>
          <EmptyState
            v-else
            class="flex-1 justify-center"
            title="No data available to show"
            subtitle="Monthly returns will appear here"
          >
            <template #icon
              ><BarChart2 class="w-5 h-5 text-secondary-text"
            /></template>
          </EmptyState>
        </div>
      </div>
    </div>

    <FollowDialog
      :open="dialog.open"
      :mode="dialog.mode"
      :item="dialog.item"
      :unfollow-preview-loading="leaderboardStore.unfollowPreviewLoading"
      :unfollow-active-positions="
        leaderboardStore.unfollowPreview?.active_positions
      "
      @success="handleDialogSuccess"
      @close="handleDialogClose"
    />
  </div>
</template>
