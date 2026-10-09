<template>
  <div class="rounded-2xl bg-card-background">
    <!-- 1. Chart Loading Skeleton -->
    <div
      v-if="loading"
      class="h-[300px] sm:h-[340px] w-full rounded-2xl bg-background/50 p-4 flex flex-col justify-between animate-pulse"
    >
      <!-- Skeleton Legend / Header -->
      <div class="flex items-center justify-end gap-3 px-2">
        <div class="h-3 w-16 bg-primary-border/50 rounded-full"></div>
        <div class="h-3 w-20 bg-primary-border/40 rounded-full"></div>
      </div>

      <!-- Skeleton Grid Lines + Chart Wave simulation -->
      <div class="relative flex-1 my-3 flex flex-col justify-between py-2 overflow-hidden">
        <!-- Horizontal Grid Lines -->
        <div class="w-full border-b border-primary-border/20"></div>
        <div class="w-full border-b border-primary-border/20"></div>
        <div class="w-full border-b border-primary-border/20"></div>
        <div class="w-full border-b border-primary-border/20"></div>

        <!-- Simulated Chart Curve / Bars Skeleton SVG -->
        <div class="absolute inset-0 flex items-end justify-between px-4 pt-4 pb-2 gap-3 opacity-60">
          <div class="w-full bg-primary-border/20 rounded-t-lg h-[40%]"></div>
          <div class="w-full bg-primary-border/30 rounded-t-lg h-[65%]"></div>
          <div class="w-full bg-primary-border/20 rounded-t-lg h-[35%]"></div>
          <div class="w-full bg-primary-border/40 rounded-t-lg h-[80%]"></div>
          <div class="w-full bg-primary-border/30 rounded-t-lg h-[55%]"></div>
          <div class="w-full bg-primary-border/20 rounded-t-lg h-[45%]"></div>
          <div class="w-full bg-primary-border/40 rounded-t-lg h-[75%]"></div>
          <div class="w-full bg-primary-border/30 rounded-t-lg h-[60%]"></div>
        </div>
      </div>

      <!-- Skeleton X-Axis Labels -->
      <div class="flex justify-between items-center px-2">
        <div v-for="i in 6" :key="i" class="h-2.5 w-8 sm:w-10 bg-primary-border/40 rounded-md"></div>
      </div>
    </div>

    <!-- 2. Actual Chart Content (when not loading) -->
    <template v-else>
      <!-- Empty State -->
      <div
        v-if="!hasData"
        class="h-[300px] sm:h-[340px] flex items-center justify-center text-secondary-text text-sm"
      >
        <EmptyState
          title="No data available to show"
          subtitle="Performance data will appear here"
        >
          <template #icon>
            <span class="material-symbols-outlined"> bar_chart </span>
          </template>
        </EmptyState>
      </div>

      <!-- Chart & Bottom Legend -->
      <div v-else class="flex flex-col">
        <div class="h-[280px] sm:h-[310px] w-full">
          <Line
            :data="chartData"
            :options="chartOptions"
            :plugins="[verticalConnectorPlugin]"
          />
        </div>

        <!-- Multi-line Custom Legend for Net Deposit tab at the BOTTOM (CENTERED) -->
        <div
          v-if="!isAccountsTab && hasData"
          class="flex items-center justify-center gap-4 pt-2.5 pb-1 px-3 text-xs font-medium border-t border-white/5 mt-1"
        >
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#34C784] shrink-0"></span>
            <span class="text-secondary-text">Deposits</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#EF4444] shrink-0"></span>
            <span class="text-secondary-text">Withdrawals</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import EmptyState from "@/components/base/EmptyState.vue";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

// Custom plugin to draw solid vertical plain connecting lines between both chart lines
const verticalConnectorPlugin = {
  id: "verticalConnectors",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const datasets = chart.data.datasets;
    if (datasets.length < 2) return;

    const meta0 = chart.getDatasetMeta(0);
    const meta1 = chart.getDatasetMeta(1);

    if (!meta0?.data || !meta1?.data) return;

    ctx.save();

    // 1. Draw solid vertical plane connector line at each point
    const len = Math.min(meta0.data.length, meta1.data.length);
    for (let i = 0; i < len; i++) {
      const pt0 = meta0.data[i];
      const pt1 = meta1.data[i];

      if (!pt0 || !pt1) continue;

      const x = pt0.x;
      const y0 = pt0.y;
      const y1 = pt1.y;

      if (Math.abs(y0 - y1) > 2) {
        ctx.beginPath();
        ctx.setLineDash([]); // Plain solid line (no dots)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y1);
        ctx.stroke();
      }
    }

    // 2. Active hovered vertical connecting beam with highlight
    const activeElements = chart.getActiveElements();
    if (activeElements && activeElements.length > 0) {
      const index = activeElements[0].index;
      const pt0 = meta0.data[index];
      const pt1 = meta1.data[index];

      if (pt0 && pt1) {
        const x = pt0.x;
        const yTop = Math.min(pt0.y, pt1.y);
        const yBottom = Math.max(pt0.y, pt1.y);

        // Vertical glowing solid connector line
        const grad = ctx.createLinearGradient(0, yTop, 0, yBottom);
        grad.addColorStop(0, "rgba(52, 199, 132, 0.9)");
        grad.addColorStop(1, "rgba(239, 68, 68, 0.9)");

        ctx.beginPath();
        ctx.setLineDash([]); // Plain solid line
        ctx.lineWidth = 2;
        ctx.strokeStyle = grad;
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yBottom);
        ctx.stroke();

        // Highlight dots at endpoints
        ctx.beginPath();
        ctx.arc(x, pt0.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#34C784";
        ctx.shadowColor = "#34C784";
        ctx.shadowBlur = 6;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, pt1.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#EF4444";
        ctx.shadowColor = "#EF4444";
        ctx.shadowBlur = 6;
        ctx.fill();
      }
    }

    ctx.restore();
  },
};

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  graph: {
    type: [Array, Object],
    default: () => [],
  },
  type: {
    type: String,
    default: "withdraw_deposit",
  },
});

const isAccountsTab = computed(() => {
  return (
    props.type === "opened_accounts" ||
    props.type === "opend_accounts_new_client" ||
    props.type === "accounts" ||
    props.type === "opened_account"
  );
});

const formatDateLabel = (rawDate) => {
  if (!rawDate) return "";
  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
    });
  }
  return String(rawDate);
};

const chartData = computed(() => {
  const g = props.graph;
  if (!g) return { labels: [], datasets: [] };

  // 1. If graph is an Object with separate keys
  if (!Array.isArray(g) && typeof g === "object") {
    if (isAccountsTab.value) {
      const list =
        g.accounts ||
        g.opened_accounts ||
        g.new_clients ||
        g.data ||
        g.records ||
        g.list ||
        g.graph ||
        [];
      const labels = list.map((item) =>
        formatDateLabel(item?.date || item?.day || item?.created_at || item?.label),
      );
      const values = list.map((item) => {
        if (typeof item === "number") return item;
        return Number(
          item?.value ??
            item?.count ??
            item?.accounts ??
            item?.opened_accounts ??
            item?.new_clients ??
            item?.total ??
            0,
        );
      });

      return {
        labels,
        datasets: [
          {
            label: "Accounts",
            data: values,
            borderColor: "#34C784",
            borderWidth: 1,
            backgroundColor: "rgba(52, 199, 132, 0.2)",
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      };
    } else {
      // Net Deposit / Withdraw & Deposit tab
      const depositList = g.deposits || g.deposit || g.total_deposit;
      const withdrawList = g.withdrawals || g.withdrawal || g.total_withdrawal || g.withdraw;

      if (Array.isArray(depositList) || Array.isArray(withdrawList)) {
        const depArr = Array.isArray(depositList) ? depositList : [];
        const withArr = Array.isArray(withdrawList) ? withdrawList : [];

        const allDates = Array.from(
          new Set(
            [
              ...depArr.map((d) => d?.date || d?.day || d?.created_at || d?.label),
              ...withArr.map((w) => w?.date || w?.day || w?.created_at || w?.label),
            ].filter(Boolean),
          ),
        );

        const labels = allDates.map(formatDateLabel);
        const depositMap = new Map(
          depArr.map((d) => [
            d?.date || d?.day || d?.created_at || d?.label,
            Number(d?.amount ?? d?.value ?? d?.total ?? d?.deposit ?? 0),
          ]),
        );
        const withdrawMap = new Map(
          withArr.map((w) => [
            w?.date || w?.day || w?.created_at || w?.label,
            Number(w?.amount ?? w?.value ?? w?.total ?? w?.withdrawal ?? 0),
          ]),
        );

        return {
          labels,
          datasets: [
            {
              label: "Deposits",
              data: allDates.map((d) => depositMap.get(d) ?? 0),
              borderColor: "#34C784",
              borderWidth: 2,
              backgroundColor: "rgba(52, 199, 132, 0.15)",
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 4,
            },
            {
              label: "Withdrawals",
              data: allDates.map((d) => withdrawMap.get(d) ?? 0),
              borderColor: "#EF4444",
              borderWidth: 2,
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 4,
            },
          ],
        };
      }

      // If array is nested inside object (e.g. g.data or g.records or g.graph)
      const list = g.data || g.records || g.graph || g.list || [];
      if (Array.isArray(list)) {
        const labels = list.map((item) =>
          formatDateLabel(item?.date || item?.day || item?.created_at || item?.label),
        );
        const depositValues = list.map((item) =>
          Number(item?.deposit ?? item?.total_deposit ?? item?.deposits ?? item?.value ?? 0),
        );
        const withdrawValues = list.map((item) =>
          Number(item?.withdrawal ?? item?.total_withdrawal ?? item?.withdrawals ?? item?.withdraw ?? 0),
        );

        return {
          labels,
          datasets: [
            {
              label: "Deposits",
              data: depositValues,
              borderColor: "#34C784",
              borderWidth: 2,
              backgroundColor: "rgba(52, 199, 132, 0.15)",
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 4,
            },
            {
              label: "Withdrawals",
              data: withdrawValues,
              borderColor: "#EF4444",
              borderWidth: 2,
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 4,
            },
          ],
        };
      }
    }
  }

  // 2. If graph is directly an Array
  const list = Array.isArray(g) ? g : [];
  const labels = list.map((item) =>
    formatDateLabel(item?.date || item?.day || item?.created_at || item?.label),
  );

  if (isAccountsTab.value) {
    const values = list.map((item) => {
      if (typeof item === "number") return item;
      return Number(
        item?.value ??
          item?.count ??
          item?.accounts ??
          item?.opened_accounts ??
          item?.new_clients ??
          item?.total ??
          0,
      );
    });

    return {
      labels,
      datasets: [
        {
          label: "Accounts",
          data: values,
          borderColor: "#34C784",
          borderWidth: 2,
          backgroundColor: "rgba(52, 199, 132, 0.2)",
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };
  }

  // Net Deposit (Multi-line: Deposits & Withdrawals)
  const depositValues = list.map((item) => {
    if (typeof item === "number") return item;
    return Number(
      item?.deposit ??
        item?.total_deposit ??
        item?.deposits ??
        item?.deposit_amount ??
        item?.value ??
        0,
    );
  });

  const withdrawValues = list.map((item) => {
    if (typeof item === "number") return 0;
    return Number(
      item?.withdrawal ??
        item?.total_withdrawal ??
        item?.withdrawals ??
        item?.withdrawal_amount ??
        item?.withdraw ??
        0,
    );
  });

  return {
    labels,
    datasets: [
      {
        label: "Deposits",
        data: depositValues,
        borderColor: "#34C784",
        borderWidth: 2,
        backgroundColor: "rgba(52, 199, 132, 0.15)",
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: "Withdrawals",
        data: withdrawValues,
        borderColor: "#EF4444",
        borderWidth: 2,
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };
});

const hasData = computed(() => {
  return chartData.value.labels && chartData.value.labels.length > 0;
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: "index",
      intersect: false,
      position: "nearest",
      caretPadding: 6,
      caretSize: 6,
      cornerRadius: 8,
      padding: {
        top: 8,
        bottom: 8,
        left: 12,
        right: 12,
      },
      backgroundColor: "#1C2334",
      titleColor: "#FFFFFF",
      bodyColor: "#E2E8F0",
      borderColor: "rgba(255, 255, 255, 0.12)",
      borderWidth: 1,
      boxPadding: 4,
      usePointStyle: true,
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null && context.parsed.y !== undefined) {
            if (isAccountsTab.value) {
              label += Number(context.parsed.y).toLocaleString();
            } else {
              label += "$" + Number(context.parsed.y).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            }
          }
          return label;
        },
      },
    },
  },
  interaction: {
    mode: "index",
    intersect: false,
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: { size: 11 },
        color: "#94a3b8",
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(255, 255, 255, 0.06)",
      },
      ticks: {
        font: { size: 11 },
        color: "#94a3b8",
        callback: (value) => {
          if (isAccountsTab.value) {
            return Number(value).toLocaleString();
          }
          return "$" + Number(value).toLocaleString("en-US");
        },
      },
    },
  },
}));
</script>
