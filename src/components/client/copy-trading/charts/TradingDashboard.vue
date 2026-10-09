<script setup>
import { computed, watch } from "vue";
import { Line, Bar, Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  BarElement,
  ArcElement,
} from "chart.js";
import { ChevronDown } from "lucide-vue-next";
import DashboardCard from "./DashboardCard.vue";
import { useFmAnalysisStore } from "@/stores/fm/analysis";
import EmptyState from "@/components/base/EmptyState.vue";
import Disclaimer from "@/components/common/Disclaimer.vue";
import { formatBrokerCurrency } from "@/utils/formatters";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  BarElement,
  ArcElement,
);

// disclaimer data
const disclaimerData = [
  {
    heading: "Disclaimer",
    description:
      "The information presented on this page is intended exclusively for informational and regulatory transparency purposes. It should not be interpreted as an invitation, solicitation, or recommendation to participate in any financial service, investment, or transaction. Trading leveraged financial instruments such as Foreign Exchange (Forex) and Contracts for Difference (CFDs) carries substantial risk and can result in losses exceeding the initial capital invested. These products may not be appropriate for every investor, as leverage magnifies both profits and losses, and traders do not gain ownership of the underlying assets. Historical performance is not a reliable indicator of future outcomes..",
  },
  {
    heading: "Regional Restrictions",
    description:
      "The information presented on this page is intended exclusively for informational and regulatory transparency purposes. It should not be interpreted as an invitation, solicitation, or recommendation to participate in any financial service, investment, or transaction. Trading leveraged financial instruments such as Foreign Exchange (Forex) and Contracts for Difference (CFDs) carries substantial risk and can result in losses exceeding the initial capital invested. These products may not be appropriate for every investor, as leverage magnifies both profits and losses, and traders do not gain ownership of the underlying assets. Historical performance is not a reliable indicator of future outcomes..",
  },
];

const analysisStore = useFmAnalysisStore();

/* ---------- Props ---------- */
const props = defineProps({
  activeTab: { type: String, default: "Performance" },
  tabs: { type: Array, default: () => ["Performance", "Risk", "Portfolio"] },
  dropdownLabel: { type: String, default: "30 Days" }, // HEADER: the select/dropdown button

  frequentlyTraded: {
    type: Array,
    default: () => [
      { symbol: "XAUUSD", winRate: "65%", share: "95.16% (452)" },
      { symbol: "XAUUSD", winRate: "65%", share: "95.16% (452)" },
    ],
  },
});

const withAlpha = (hex, alpha) => {
  const value = hex.replace("#", "");
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* ---------- Equity area chart ---------- */
const equityChartData = computed(() => {
  const points =
    analysisStore.growthChartData?.length
      ? analysisStore.growthChartData
      : (analysisStore.analytics?.growth_chart ?? []);

  if (!points.length) return null;

  const labels = points.map(
    (item) => item.date || item.time || item.day || item.timestamp || item.created_at || ""
  );
  const values = points.map((item) =>
    Number(item.equity ?? item.growth ?? item.value ?? item.profit ?? item.total_growth ?? 0)
  );

  return {
    labels,

    datasets: [
      {
        data: values,

        borderWidth: 2,

        pointRadius: 0,
        pointHoverRadius: 4,

        tension: 0.35,

        fill: {
          target: "origin",
        },

        // default (will be overridden by segment)
        borderColor: "#22c55e",

        backgroundColor: "rgba(34,197,94,.08)",

        segment: {
          borderColor: (ctx) => {
            const current = ctx.p1.parsed.y;

            return current >= 0 ? "#22c55e" : "#dc2626";
          },

          backgroundColor: (ctx) => {
            const current = ctx.p1.parsed.y;

            return current >= 0 ? "rgba(34,197,94,.08)" : "rgba(220,38,38,.08)";
          },
        },
      },
    ],
  };
});

const themeColor = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const equityChartOptions = {
  responsive: true,

  maintainAspectRatio: false,

  interaction: {
    mode: "index",
    intersect: false,
  },

  plugins: {
    legend: {
      display: false,
    },

    tooltip: {
      enabled: true,

      callbacks: {
        label: (ctx) => `${ctx.parsed.y}`,
      },
    },
  },

  scales: {
    x: {
      grid: {
        display: false,
      },

      ticks: {
        color: themeColor("--color-secondary-text"),

        font: {
          size: 10,
        },

        maxTicksLimit: 6,
      },
    },

    y: {
      grid: {
        color: "rgba(148, 163, 184, 0.12)",
      },

      ticks: {
        color: themeColor("--color-secondary-text"),

        callback: (value) => `${value}`,
      },
    },
  },

  elements: {
    line: {
      capBezierPoints: true,
    },
  },
};

/* ---------- Statics Info  ---------- */
const staticsInfo = computed(() => {
  const data = analysisStore.analytics.strategy_info;
  return data;
});

const tradeStatistics = computed(() => {
  const info = staticsInfo.value ?? {};
  const followerInfo = analysisStore.analytics?.follower_info ?? {};
  const masterBalance =
    info.master_balance ??
    followerInfo.balance ??
    info.balance ??
    null;

  const currency = analysisStore.analytics?.broker_currency || "USD";
  const formatMoney = (val) => {
    if (val == null) return "-";
    const sym = formatBrokerCurrency(currency);
    return `${sym}${val}`;
  };

  const list = [
    {
      label: "Master Balance",
      value:
        masterBalance != null
          ? formatMoney(masterBalance)
          : formatMoney(0),
    },
    {
      label: "Master Equity",
      value:
        info.master_equity != null
          ? formatMoney(info.master_equity)
          : followerInfo.equity != null
          ? formatMoney(followerInfo.equity)
          : "-",
    },
    {
      label: "Settlement",
      value: info.settlement
        ? String(info.settlement).charAt(0).toUpperCase() +
          String(info.settlement).slice(1)
        : "-",
    },
    {
      label: "Min Balance",
      value: info.min_balance != null ? formatMoney(info.min_balance) : "-",
    },
    {
      label: "Active Since",
      value: info.active_since ?? "-",
    },
    {
      label: "Profit Sharing",
      value: info.profit_sharing != null ? `${info.profit_sharing}%` : "-",
    },
  ];

  if (info.trades_per_week !== undefined) {
    list.push({
      label: "Trades Per Week",
      value: info.trades_per_week,
    });
  }

  if (info.profitable_weeks !== undefined) {
    list.push({
      label: "Profitable Weeks",
      value: info.profitable_weeks,
    });
  }

  return list;
});

/* ---------- Monthly Returns ---------- */
const monthlyReturns = computed(
  () => analysisStore.analytics?.monthly_returns ?? [],
);

const monthlyChartData = computed(() => ({
  labels: monthlyReturns.value.map((item) => item.month),

  datasets: [
    {
      data: monthlyReturns.value.map((item) => item.return),

      backgroundColor: monthlyReturns.value.map((item) =>
        item.return >= 0 ? "#22c55e" : "#dc2626",
      ),

      borderRadius: 4,
      barThickness: 24,
    },
  ],
}));

const monthlyChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.parsed.y}`,
      },
    },
  },

  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: "#94a3b8",
        font: {
          size: 11,
        },
      },
    },

    y: {
      ticks: {
        color: "#94a3b8",
        font: {
          size: 11,
        },
        callback: (value) => `${value}`,
      },

      grid: {
        color: "rgba(148, 163, 184, 0.12)",
      },

      border: {
        display: false,
      },
    },
  },
}));

/* ---------- Trade Statistics ---------- */
const tradeStats = computed(
  () => analysisStore.analytics?.trade_statistics ?? {},
);

const overview = computed(() => analysisStore.analytics?.overview ?? {});

const currencySymbol = computed(() => {
  return formatBrokerCurrency(analysisStore.analytics?.broker_currency || "USD");
});

const formatCurrencyValue = (val) => {
  if (val == null || val === "—") return "-";
  const num = Number(val);
  if (!Number.isFinite(num)) return String(val);
  const formatted = Math.abs(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (num > 0) {
    return `+${currencySymbol.value}${formatted}`;
  } else if (num < 0) {
    return `-${currencySymbol.value}${formatted}`;
  }
  return `${currencySymbol.value}0.00`;
};

const totalTradesCount = computed(() => Number(tradeStats.value.total_trades ?? 0));
const profitableTradesCount = computed(() => Number(tradeStats.value.profitable_trades ?? 0));
const losingTradesCount = computed(() => {
  if (totalTradesCount.value > 0) {
    return Math.max(0, totalTradesCount.value - profitableTradesCount.value);
  }
  return 0;
});

const calculatedWinRate = computed(() => {
  if (overview.value.win_rate != null) {
    return Number(overview.value.win_rate);
  }
  if (totalTradesCount.value > 0) {
    return Number(((profitableTradesCount.value / totalTradesCount.value) * 100).toFixed(2));
  }
  return null;
});

const calculatedLossRate = computed(() => {
  if (calculatedWinRate.value != null) {
    return Number((100 - calculatedWinRate.value).toFixed(2));
  }
  return null;
});

const profitablePercentDisplay = computed(() => {
  if (calculatedWinRate.value != null) {
    return calculatedWinRate.value.toFixed(1);
  }
  return "0.0";
});

const losingPercentDisplay = computed(() => {
  if (calculatedLossRate.value != null) {
    return calculatedLossRate.value.toFixed(1);
  }
  return "0.0";
});

const tradesBreakdown = computed(() => {
  const stats = tradeStats.value;

  const formatVal = (val) => {
    if (val == null) return "-";
    const num = Number(val);
    if (!Number.isFinite(num)) return String(val);
    if (num > 0) return `+${val}`;
    return String(val);
  };

  return [
    {
      label: "Profitable Trades",
      value: stats.profitable_trades ?? 0,
      positive: (stats.profitable_trades ?? 0) > 0,
    },
    {
      label: "Best Trade",
      value: formatVal(stats.best_trade),
      positive: (stats.best_trade ?? 0) >= 0,
    },
    {
      label: "Worst Trade",
      value: formatVal(stats.worst_trade),
      positive: (stats.worst_trade ?? 0) >= 0,
    },
    {
      label: "Average Trade PnL",
      value: formatVal(stats.avg_trade_pnl),
      positive: (stats.avg_trade_pnl ?? 0) >= 0,
    },
    {
      label: "Long / Short",
      value: stats.long_short ?? "-",
      positive: true,
    },
  ];
});

const donutChartData = computed(() => {
  const total = totalTradesCount.value;
  const profitable = profitableTradesCount.value;
  const winRate = calculatedWinRate.value ?? 0;

  if (total > 0) {
    const won = profitable > 0 ? profitable : Math.round((winRate / 100) * total);
    const lost = Math.max(0, total - won);
    return {
      labels: ["Profitable Trades", "Losing Trades"],
      datasets: [
        {
          data: [won, lost],
          backgroundColor: ["#22c55e", "#dc2626"],
          borderWidth: 0,
          borderRadius: 8,
          spacing: 4,
          cutout: "72%",
        },
      ],
    };
  }

  if (winRate > 0) {
    return {
      labels: ["Profitable Trades", "Losing Trades"],
      datasets: [
        {
          data: [winRate, Math.max(0, 100 - winRate)],
          backgroundColor: ["#22c55e", "#dc2626"],
          borderWidth: 0,
          borderRadius: 8,
          spacing: 4,
          cutout: "72%",
        },
      ],
    };
  }

  // 0 Trades fallback - subtle neutral ring
  return {
    labels: ["No Trades"],
    datasets: [
      {
        data: [1],
        backgroundColor: ["rgba(148, 163, 184, 0.25)"],
        borderWidth: 0,
        borderRadius: 0,
        spacing: 0,
        cutout: "72%",
      },
    ],
  };
});

const donutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      borderColor: "rgba(255, 255, 255, 0.15)",
      borderWidth: 1,
      padding: { top: 6, bottom: 6, left: 10, right: 10 },
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        title: () => "",
        label: (ctx) => {
          const label = ctx.label || "";
          const val = ctx.parsed ?? ctx.raw ?? 0;
          const total = totalTradesCount.value;
          const winRate = calculatedWinRate.value;

          if (label === "No Trades") {
            return "No trades recorded";
          }

          if (total > 0) {
            const pct = ((val / total) * 100).toFixed(1);
            return `${label}: ${val} trades (${pct}%)`;
          }

          if (winRate != null) {
            return `${label}: ${val}%`;
          }

          return `${label}: ${val}`;
        },
      },
    },
  },
}));
</script>

<template>
  <div class="w-full text-primary-text mt-4">
    <div
      class="grid grid-cols-1 xl:grid-cols-[3fr_1.5fr] 2xl:grid-cols-[4fr_1.5fr] gap-4"
    >
      <!-- LEFT COLUMN -->
      <div class="">
        <!-- growth chart -->
        <DashboardCard class="">
          <template #header>
            <!-- <div
              class="inline-flex items-center gap-1 rounded-full bg-gray-100 p-1"
            >
              <button
                v-for="tab in tabs"
                :key="tab"
                class="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                :class="
                  tab === activeTab
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                {{ tab }}
              </button>
            </div>

            <button
              class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
            >
              {{ dropdownLabel }}
              <ChevronDown class="h-4 w-4 text-gray-500" />
            </button> -->

            <h3 class="text-lg font-bold text-primary-text">Growth Chart</h3>
          </template>

          <!-- body -->
          <!-- <p class="text-sm text-gray-500">{{ periodLabel }}</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">
            {{ periodReturn }}
          </p> -->

          <div
            v-if="analysisStore.loading || analysisStore.growthChartLoading"
            class="h-80 bg-background rounded-lg animate-pulse"
          />

          <div v-else-if="equityChartData" class="mt-4 h-80">
            <Line :data="equityChartData" :options="equityChartOptions" />
          </div>

          <div v-else class="flex items-center h-80 justify-center">
            <EmptyState
              title="No data available to show"
              subtitle="Growth performance history will appear here"
            >
              <template #icon>
                <span class="material-symbols-outlined"> bar_chart </span>
              </template>
            </EmptyState>
          </div>
        </DashboardCard>

        <!-- Trade Statistics + Monthly Return cards -->
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DashboardCard title="Trade Statistics">
            <div
              v-if="analysisStore.loading"
              class="p-4 space-y-3 animate-pulse flex-1"
            >
              <div v-for="n in 6" :key="n" class="flex justify-between">
                <div class="h-3 w-20 bg-background rounded" />
                <div class="h-3 w-16 bg-background rounded" />
              </div>
            </div>

            <ul v-else class="space-y-3 min-h-56">
              <li
                v-for="item in tradeStatistics"
                :key="item.label"
                class="flex items-baseline justify-between text-sm"
              >
                <span class="text-secondary-text shrink-0">{{
                  item.label
                }}</span>

                <span
                  class="flex-1 border-b border-dotted border-gray-300 mx-2 -translate-y-0.75"
                ></span>

                <span class="font-bold text-primary-text shrink-0">
                  {{ item.value ?? "-" }}
                </span>
              </li>
            </ul>
          </DashboardCard>

          <DashboardCard title="Monthly Return">
            <div
              v-if="analysisStore.loading"
              class="p-4 space-y-3 animate-pulse flex-1"
            >
              <div v-for="n in 6" :key="n" class="flex justify-between">
                <div class="h-3 w-20 bg-background rounded" />
                <div class="h-3 w-16 bg-background rounded" />
              </div>
            </div>
            <div
              v-else-if="analysisStore.analytics.monthly_returns?.length"
              class=""
            >
              <Bar :data="monthlyChartData" :options="monthlyChartOptions" />
            </div>

            <EmptyState
              v-else
              class="flex-1 justify-center h-56"
              title="No data available to show"
              subtitle="Monthly returns will appear here"
            >
              <template #icon>
                <span class="material-symbols-outlined">
                  android_cell_5_bar
                </span>
              </template>
            </EmptyState>
          </DashboardCard>
        </div>
      </div>

      <!-- RIGHT COLUMN -->

      <!-- Trades Stats card -->
      <DashboardCard title="Trades Stats">
        <div class="grid grid-cols-1 gap-4">
          <div
            class="w-full flex justify-center items-center relative mt-4 h-52 mx-auto lg:mx-0"
          >
            <Doughnut :data="donutChartData" :options="donutChartOptions" />
            <div
              class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <p class="text-xs text-secondary-text">Total Trades</p>
              <p class="text-2xl font-bold text-primary-text mt-1">
                {{ tradeStats.total_trades ?? 0 }}
              </p>
            </div>
          </div>

          <div class="mt-4 rounded-xl bg-background p-5">
            <div
              v-if="analysisStore.loading"
              class="p-4 space-y-3 animate-pulse flex-1"
            >
              <div v-for="n in 5" :key="n" class="flex justify-between">
                <div class="h-3 w-20 bg-background rounded" />
                <div class="h-3 w-16 bg-background rounded" />
              </div>
            </div>

            <ul v-else class="space-y-4">
              <li
                v-for="item in tradesBreakdown"
                :key="item.label"
                class="flex items-baseline justify-between text-sm"
              >
                <span class="text-secondary-text text-sm shrink-0">
                  {{ item.label }}
                </span>

                <span
                  class="flex-1 border-b border-dotted border-primary-border/60 mx-2 -translate-y-0.75"
                ></span>

                <span
                  class="font-bold shrink-0"
                  :class="
                    item.positive ? 'text-primary-green' : 'text-primary-red'
                  "
                >
                  {{ item.value }}
                </span>
              </li>
            </ul>
          </div>

          <!-- <h3 class="text-lg font-bold text-primary-text">Frequently Traded</h3>

          <div class="rounded-xl bg-background p-5">
            <div
              v-if="analysisStore.loading"
              class="p-4 space-y-3 animate-pulse flex-1"
            >
              <div v-for="n in 2" :key="n" class="flex justify-between">
                <div class="h-3 w-20 bg-background rounded" />
                <div class="h-3 w-16 bg-background rounded" />
              </div>
            </div>
            <table v-else class="w-full text-sm">
              <thead>
                <tr class="text-secondary-text text-left">
                  <th class="font-normal pb-3">Symbols</th>
                  <th class="font-normal pb-3">Win Rate</th>
                  <th class="font-normal pb-3 text-right">% of total trades</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in frequentlyTraded" :key="i">
                  <td class="py-1.5 font-semibold text-primary-text">
                    {{ row.symbol }}
                  </td>
                  <td class="py-1.5 text-secondary-text pl-2">
                    {{ row.winRate }}
                  </td>
                  <td class="py-1.5 text-secondary-text text-right">
                    {{ row.share }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div> -->
        </div>
      </DashboardCard>
    </div>
  </div>
  <div class="">
    <Disclaimer :data="disclaimerData" />
  </div>
</template>
<style scoped>
.text::v-deep {
  color: red;
}
</style>
