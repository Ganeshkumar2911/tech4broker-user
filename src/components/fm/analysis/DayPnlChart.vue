<script setup>
import { computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { livePNL } from "@/utils/livePNL";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
);

const props = defineProps({
  trades: {
    type: Array,
    default: () => [],
  },
  currencySymbol: {
    type: String,
    default: "$",
  },
});

const isOpenTrade = (trade) =>
  String(trade?.status ?? "").toUpperCase() === "OPEN";

const getTradePnl = (trade) => {
  const raw = isOpenTrade(trade) ? livePNL(trade) : (trade?.profit ?? trade?.pnl);
  const val = Number(raw);
  return Number.isFinite(val) ? val : 0;
};

// Sort trades chronologically (oldest to newest)
const chronologicalTrades = computed(() => {
  if (!props.trades?.length) return [];
  return [...props.trades].sort((a, b) => {
    const timeA = new Date(a.created_at || a.time || 0).getTime();
    const timeB = new Date(b.created_at || b.time || 0).getTime();
    return timeA - timeB;
  });
});

const getDirectTime = (dateStr) => {
  if (!dateStr) return "";
  const match = String(dateStr).match(/\b(\d{2}:\d{2}(?::\d{2})?)\b/);
  return match ? match[1] : String(dateStr);
};

const cumulativeData = computed(() => {
  const trades = chronologicalTrades.value;
  if (!trades.length) {
    return {
      labels: [],
      cumulativeValues: [],
      tradeMetadata: [],
      finalPnl: 0,
    };
  }

  const labels = ["Start"];
  const cumulativeValues = [0];
  const tradeMetadata = [
    {
      isStart: true,
      trade: null,
      cumulative: 0,
      pnl: 0,
      time: "Start of Day",
    },
  ];

  let runningSum = 0;

  trades.forEach((trade, idx) => {
    const pnl = getTradePnl(trade);
    runningSum += pnl;
    const timeLabel = getDirectTime(trade.created_at || trade.time);
    const shortLabel = timeLabel || `#${idx + 1}`;

    labels.push(shortLabel);
    cumulativeValues.push(Number(runningSum.toFixed(2)));
    tradeMetadata.push({
      isStart: false,
      trade,
      cumulative: Number(runningSum.toFixed(2)),
      pnl,
      time: trade.created_at || trade.time || timeLabel,
      tradeNumber: idx + 1,
    });
  });

  return {
    labels,
    cumulativeValues,
    tradeMetadata,
    finalPnl: runningSum,
  };
});

const isOverallProfitable = computed(
  () => (cumulativeData.value.finalPnl ?? 0) >= 0,
);

const chartData = computed(() => {
  const { labels, cumulativeValues } = cumulativeData.value;
  const isPositive = isOverallProfitable.value;
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";
  const fillColor = isPositive
    ? "rgba(34, 197, 94, 0.12)"
    : "rgba(239, 68, 68, 0.12)";

  return {
    labels,
    datasets: [
      {
        label: "Cumulative P&L",
        data: cumulativeValues,
        borderColor: strokeColor,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: (ctx) => (ctx.dataIndex === 0 ? 0 : 4),
        pointHoverRadius: 6,
        pointBackgroundColor: strokeColor,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1.5,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 600,
    easing: "easeOutQuart",
  },
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
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      titleColor: "#f8fafc",
      bodyColor: "#e2e8f0",
      borderColor: "rgba(255, 255, 255, 0.12)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 10,
      displayColors: false,
      callbacks: {
        title: (tooltipItems) => {
          const idx = tooltipItems[0]?.dataIndex;
          const meta = cumulativeData.value.tradeMetadata[idx];
          if (!meta) return "";
          if (meta.isStart) return "Day Start (Baseline)";
          const t = meta.trade;
          return `Trade #${meta.tradeNumber} · ${t?.symbol || "Trade"} (${meta.time})`;
        },
        label: (tooltipItem) => {
          const idx = tooltipItem.dataIndex;
          const meta = cumulativeData.value.tradeMetadata[idx];
          if (!meta) return "";
          if (meta.isStart) return "P&L: $0.00";

          const pnlSign = meta.pnl >= 0 ? "+" : "";
          const cumSign = meta.cumulative >= 0 ? "+" : "";
          const t = meta.trade;

          const lines = [
            `Trade P&L: ${pnlSign}${props.currencySymbol}${meta.pnl.toFixed(2)}`,
            `Cumulative: ${cumSign}${props.currencySymbol}${meta.cumulative.toFixed(2)}`,
          ];

          if (t) {
            const side = (t.side || t.type || "").toUpperCase();
            const lot = t.lot != null ? `${t.lot} Lots` : "";
            if (side || lot) lines.push(`Order: ${side} ${lot}`.trim());

            if (t.entry_price != null && t.exit_price != null) {
              lines.push(`Price: ${t.entry_price} ➔ ${t.exit_price}`);
            }
          }

          return lines;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#94a3b8",
        font: {
          size: 10,
          weight: "500",
        },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
      },
    },
    y: {
      grid: {
        color: "rgba(148, 163, 184, 0.12)",
        drawBorder: false,
      },
      ticks: {
        color: "#94a3b8",
        font: {
          size: 10,
          weight: "500",
        },
        callback: (val) =>
          `${val >= 0 ? "+" : ""}${props.currencySymbol}${Number(val).toFixed(0)}`,
      },
    },
  },
}));
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <div
      v-if="!trades || trades.length === 0"
      class="flex flex-col items-center justify-center h-48 text-secondary-text text-xs"
    >
      <span>No trades to display chart</span>
    </div>
    <div v-else class="relative w-full h-48 sm:h-56 lg:h-64">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
