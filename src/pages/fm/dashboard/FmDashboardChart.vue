<script setup>
/**
 * PerformanceAnalyticsChart — Main hero chart section (Section 2)
 * Self-contained: reads from store directly.
 *
 * performanceAnalytics.chart:   [{ label, profit, fees, followers }]
 * performanceAnalytics.summary: { total_profit, total_fees, total_followers, avg_daily_profit }
 * analyticsFilters:             { range }
 * setAnalyticsRange(range)      → updates filter + fetches
 */
import { computed, watchEffect, onMounted } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { storeToRefs } from "pinia";
import { CalendarDays, Info } from "lucide-vue-next";
import { useFMDashboardStore } from "@/stores/fm/dashboard.js";
import EmptyState from "@/components/base/EmptyState.vue";
import BaseTabs from "../../../components/base/BaseTabs.vue";

import { useThemeStore } from "@/stores/shared/theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend,
);

const store = useFMDashboardStore();
const themeStore = useThemeStore();
const { performanceAnalytics, analyticsLoading, analyticsFilters } =
  storeToRefs(store);

const isDark = computed(() => themeStore.isDark);

// ─── Filters ─────────────────────────────────────────────────────
const filters = [
  { value: "weekly", label: "Week" },
  { value: "monthly", label: "Month" },
  { value: "yearly", label: "Year" },
];

// function setRange(key) {
//   store.setAnalyticsRange(key);
// }

// ─── Data ─────────────────────────────────────────────────────────
const rows = computed(() => performanceAnalytics.value?.chart ?? []);
const summary = computed(() => performanceAnalytics.value?.summary ?? {});
const isEmpty = computed(() => rows.value.length === 0);

function fmt(v, sign = false) {
  const abs = Math.abs(v ?? 0);
  const str =
    "$" +
    abs.toLocaleString("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (sign) return (v >= 0 ? "+" : "-") + str;
  return (v < 0 ? "-" : "") + str;
}

watchEffect(() => {
  console.log(analyticsFilters.value.range);
});

// ─── Chart ────────────────────────────────────────────────────────
// Two datasets: profit (bar, left Y) + fees (line, right Y)
// Followers shown in tooltip + summary only (scale too different)
const chartData = computed(() => ({
  labels: rows.value.map((d) => d.label),
  datasets: [
    {
      type: "bar",
      label: "Profit",
      data: rows.value.map((d) => d.profit),
      yAxisID: "yProfit",
      backgroundColor: rows.value.map((d) =>
        d.profit >= 0 ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.65)",
      ),
      borderRadius: 6,
      borderSkipped: false,
      order: 2,
    },
    {
      type: "line",
      label: "Fees",
      data: rows.value.map((d) => d.fees),
      yAxisID: "yFees",
      borderColor: "rgba(91,106,248,0.9)",
      backgroundColor: "rgba(91,106,248,0.07)",
      fill: true,
      tension: 0.45,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      order: 1,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      display: true,
      position: "bottom",
      labels: {
        color: isDark.value ? "#9ca3af" : "#6b7280",
        boxWidth: 10,
        boxHeight: 10,
        borderRadius: 3,
        font: { size: 11 },
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: isDark.value ? "rgba(15,17,23,0.96)" : "rgba(255,255,255,0.96)",
      borderColor: isDark.value ? "rgba(30,33,48,1)" : "rgba(229,231,235,1)",
      borderWidth: 1,
      titleColor: isDark.value ? "#e8eaf0" : "#111827",
      bodyColor: isDark.value ? "#9ca3af" : "#4b5563",
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        afterBody: (items) => {
          const i = items[0]?.dataIndex;
          const row = i !== undefined ? rows.value[i] : null;
          return row ? [`  Followers: ${row.followers}`] : [];
        },
        label: (ctx) =>
          ctx.dataset.label === "Fees"
            ? ` Fees: ${fmt(ctx.parsed.y)}`
            : ` Profit: ${fmt(ctx.parsed.y, true)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: isDark.value ? "#9ca3af" : "#6b7280", font: { size: 10 } },
      border: { display: false },
    },
    yProfit: {
      type: "linear",
      position: "left",
      grid: {
        color: isDark.value ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
        drawBorder: false,
      },
      ticks: {
        color: isDark.value ? "#9ca3af" : "#6b7280",
        font: { size: 10 },
        callback: (v) => `$${v}`,
      },
      border: { display: false },
    },
    yFees: {
      type: "linear",
      position: "right",
      grid: { display: false },
      ticks: {
        color: isDark.value ? "#9ca3af" : "#6b7280",
        font: { size: 10 },
        callback: (v) => `$${(v / 1000).toFixed(0)}k`,
      },
      border: { display: false },
    },
  },
}));

// ─── Summary tiles ────────────────────────────────────────────────
const tiles = computed(() => [
  {
    label: "Total Profit",
    value: fmt(summary.value.total_profit, true),
    pos: (summary.value.total_profit ?? 0) >= 0,
    colored: true,
    tooltip: "Total net profit generated by the strategy across selected timeframe",
  },
  {
    label: "Total Fees",
    value: fmt(summary.value.total_fees),
    pos: true,
    colored: false,
    tooltip: "Total management and performance fees earned",
  },
  {
    label: "Avg Daily Profit",
    value: fmt(summary.value.avg_daily_profit, true),
    pos: (summary.value.avg_daily_profit ?? 0) >= 0,
    colored: true,
    tooltip: "Average daily net profit generated across selected timeframe",
  },
  {
    label: "Total Followers",
    value: Number(summary.value.total_followers ?? 0).toLocaleString(),
    pos: true,
    colored: false,
    tooltip: "Total investors following this strategy",
  },
]);

function setRange(range) {
  if (!range || range === analyticsFilters.value.range) return;
  store.setAnalyticsRange(range);
}

onMounted(() => {
  store.fetchPerformanceAnalytics();
});
</script>

<template>
  <section class="bg-card-background rounded-2xl p-6">
    <div class="mb-6 w-full flex justify-end items-end">
      <BaseTabs
        :tabs="filters"
        overRideClass="border border-primary-border"
        :modelValue="analyticsFilters.range"
        @update:modelValue="(val) => setRange(val)"
      />
    </div>

    <!-- Chart skeleton -->
    <template v-if="analyticsLoading">
      <div class="animate-pulse h-64 bg-primary-border rounded-xl" />
    </template>

    <!-- Empty -->
    <template v-else-if="isEmpty">
      <EmptyState
        title="No analytics data"
        subtitle="Performance history will appear here"
      >
        <template #icon><CalendarDays :size="20" /></template>
      </EmptyState>
    </template>

    <!-- Chart -->
    <template v-else>
      <div class="h-64">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </template>

    <!-- Summary tiles -->
    <div class="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <template v-if="analyticsLoading">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-background rounded-xl px-4 py-3 animate-pulse"
        >
          <div class="h-2 w-16 bg-primary-border rounded-full" />
          <div class="h-5 w-24 bg-primary-border rounded-full mt-2" />
        </div>
      </template>
      <template v-else>
        <div
          v-for="tile in tiles"
          :key="tile.label"
          class="bg-background rounded-xl px-4 py-3"
        >
          <div class="flex items-center gap-1.5 min-w-0">
            <p
              class="text-2xs font-semibold tracking-wider text-secondary-text truncate"
            >
              {{ tile.label }}
            </p>
            <Tooltip v-if="tile.tooltip" :text="tile.tooltip" position="top" wrap>
              <Info
                :size="11"
                class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
              />
            </Tooltip>
          </div>
          <p
            :class="[
              'text-sm font-bold mt-1.5',
              tile.colored
                ? tile.pos
                  ? 'text-primary-green'
                  : 'text-primary-red'
                : 'text-primary-text',
            ]"
          >
            {{ tile.value }}
          </p>
        </div>
      </template>
    </div>
  </section>
</template>
