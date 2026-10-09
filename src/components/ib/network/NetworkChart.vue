<template>
  <div class="space-y-3">
    <!-- Chart State: Loading -->
    <div
      v-if="loading"
      class="h-[340px] rounded-xl animate-pulse bg-background/50 border border-primary-border/40"
    />

    <!-- Chart State: Empty -->
    <div
      v-else-if="!series.length"
      class="h-[340px] flex items-center justify-center text-secondary-text text-sm"
    >
      <EmptyState
        title="No performance data available"
        subtitle="Performance analytics for Individual and Network will appear here"
      >
        <template #icon>
          <span class="material-symbols-outlined"> bar_chart </span>
        </template>
      </EmptyState>
    </div>

    <!-- Chart Canvas Container -->
    <div v-else class="h-[340px] relative">
      <Line :data="chartData" :options="chartOptions" :plugins="chartPlugins" />
    </div>

    <!-- Bottom Center Dynamic Legend / Labels -->
    <div
      v-if="!loading && series.length"
      class="flex flex-wrap items-center justify-center gap-6 pt-2 pb-1"
    >
      <!-- Individual Legend -->
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-[#06b6d4]"></span>
        <span class="text-xs font-semibold text-primary-text">
          {{ metricInfo.individualLabel }}
        </span>
      </div>

      <!-- Network Legend -->
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-[#ecd338]"></span>
        <span class="text-xs font-semibold text-primary-text">
          {{ metricInfo.downlineLabel }}
        </span>
      </div>
    </div>
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

const props = defineProps({
  loading: { type: Boolean, default: false },
  series: { type: Array, default: () => [] },
  selectedMetric: { type: String, default: "withdrawal" },
});

// Dynamic metric configuration based on selected overview card
const metricInfo = computed(() => {
  switch (props.selectedMetric) {
    case "deposit":
    case "deposits":
      return {
        key: "deposits",
        title: "Total Deposit",
        unit: "USD",
        isCurrency: true,
        individualLabel: "Individual Deposits",
        downlineLabel: "Network Deposits",
      };
    case "accounts":
    case "account":
      return {
        key: "accounts",
        title: "Total Account",
        unit: "Accounts",
        isCurrency: false,
        individualLabel: "Individual Accounts",
        downlineLabel: "Network Accounts",
      };
    case "withdrawal":
    case "withdrawals":
    default:
      return {
        key: "withdrawal",
        title: "Total Withdrawal",
        unit: "USD",
        isCurrency: true,
        individualLabel: "Individual Withdrawals",
        downlineLabel: "Network Withdrawals",
      };
  }
});

// Build gradients for individual and downline areas
const buildIndividualGradient = (ctx, area) => {
  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, "rgba(6, 182, 212, 0.22)");
  gradient.addColorStop(1, "rgba(6, 182, 212, 0.0)");
  return gradient;
};

const buildDownlineGradient = (ctx, area) => {
  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, "rgba(236, 211, 56, 0.22)");
  gradient.addColorStop(1, "rgba(236, 211, 56, 0.0)");
  return gradient;
};

// Plain Solid Vertical Crosshair Line Plugin
const crosshairLinePlugin = {
  id: "crosshairLine",
  afterDraw: (chart) => {
    if (chart.tooltip?._active && chart.tooltip._active.length) {
      const activePoint = chart.tooltip._active[0];
      const ctx = chart.ctx;
      const x = activePoint.element.x;
      const topY = chart.chartArea.top;
      const bottomY = chart.chartArea.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([]); // Solid plain vertical line
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1.5;
      const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");
      ctx.strokeStyle = isDark
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(100, 116, 139, 0.45)";
      ctx.stroke();
      ctx.restore();
    }
  },
};

const chartPlugins = [crosshairLinePlugin];

// Custom HTML Tooltip Handler with active metric & accounts display
const externalTooltipHandler = (context) => {
  const { chart, tooltip } = context;
  let tooltipEl = chart.canvas.parentNode.querySelector(".chartjs-custom-tooltip");

  // Create element on first render
  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.className =
      "chartjs-custom-tooltip absolute z-50 pointer-events-none transition-all duration-100 ease-out";
    chart.canvas.parentNode.appendChild(tooltipEl);
  }

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = "0";
    return;
  }

  const dataIndex = tooltip.dataPoints?.[0]?.dataIndex;
  const point = props.series?.[dataIndex];
  if (!point) return;

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const fmtCurr = (n) =>
    `$${Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const fmtInt = (n) => Number(n || 0).toLocaleString();

  const d = point.downlineDetails || {};
  const i = point.individualDetails || {};

  const dDep = d.deposits || {};
  const dWith = d.withdrawal || {};
  const dAcc = d.accounts || {};

  const iDep = i.deposits || {};
  const iWith = i.withdrawal || {};
  const iAcc = i.accounts || {};

  const dateStr = point.date || point.label || "";
  let dateFormatted = dateStr;
  try {
    const dObj = new Date(dateStr);
    if (!isNaN(dObj.getTime())) {
      dateFormatted = dObj.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch (e) {}

  const activeMetricKey = metricInfo.value.key;
  const isDepActive = activeMetricKey === "deposits" || activeMetricKey === "deposit";
  const isWithActive = activeMetricKey === "withdrawal" || activeMetricKey === "withdrawals";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const tooltipWidth = isMobile ? Math.min(260, window.innerWidth - 24) : 310;

  // Build section rows for a given dataset (Downline or Individual)
  const renderSectionRows = (depObj, withObj, accObj) => {
    if (isDepActive) {
      return `
        <div style="display: grid; grid-template-columns: ${isMobile ? "75px" : "90px"} 1fr; align-items: center; gap: 4px;">
          <span style="display: flex; align-items: center; gap: 4px; color: ${isDark ? "#94a3b8" : "#64748b"}; font-weight: 500;">
            <span style="width: 4px; height: 4px; border-radius: 50%; background: #10b981; display: inline-block;"></span> Deposit:
          </span>
          <span style="text-align: left;">Real: <b>${fmtCurr(depObj.real)}</b> | Copy: <b>${fmtCurr(depObj.copy)}</b></span>
        </div>
        <div style="display: grid; grid-template-columns: ${isMobile ? "75px" : "90px"} 1fr; align-items: center; gap: 4px;">
          <span style="display: flex; align-items: center; gap: 4px; color: ${isDark ? "#94a3b8" : "#64748b"}; font-weight: 500;">
            <span style="width: 4px; height: 4px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span> Accounts:
          </span>
          <span style="text-align: left;">Real: <b>${fmtInt(accObj.real)}</b> | Copy: <b>${fmtInt(accObj.copy)}</b></span>
        </div>
      `;
    } else if (isWithActive) {
      return `
        <div style="display: grid; grid-template-columns: ${isMobile ? "75px" : "90px"} 1fr; align-items: center; gap: 4px;">
          <span style="display: flex; align-items: center; gap: 4px; color: ${isDark ? "#94a3b8" : "#64748b"}; font-weight: 500;">
            <span style="width: 4px; height: 4px; border-radius: 50%; background: #ef4444; display: inline-block;"></span> Withdrawal:
          </span>
          <span style="text-align: left;">Real: <b>${fmtCurr(withObj.real)}</b> | Copy: <b>${fmtCurr(withObj.copy)}</b></span>
        </div>
        <div style="display: grid; grid-template-columns: ${isMobile ? "75px" : "90px"} 1fr; align-items: center; gap: 4px;">
          <span style="display: flex; align-items: center; gap: 4px; color: ${isDark ? "#94a3b8" : "#64748b"}; font-weight: 500;">
            <span style="width: 4px; height: 4px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span> Accounts:
          </span>
          <span style="text-align: left;">Real: <b>${fmtInt(accObj.real)}</b> | Copy: <b>${fmtInt(accObj.copy)}</b></span>
        </div>
      `;
    } else {
      // Accounts active
      const totalAcc = Number(accObj.real || 0) + Number(accObj.copy || 0);
      return `
        <div style="display: grid; grid-template-columns: ${isMobile ? "75px" : "90px"} 1fr; align-items: center; gap: 4px;">
          <span style="display: flex; align-items: center; gap: 4px; color: ${isDark ? "#94a3b8" : "#64748b"}; font-weight: 500;">
            <span style="width: 4px; height: 4px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span> Accounts:
          </span>
          <span style="text-align: left;">Real: <b>${fmtInt(accObj.real)}</b> | Copy: <b>${fmtInt(accObj.copy)}</b> (Total: <b>${fmtInt(totalAcc)}</b>)</span>
        </div>
      `;
    }
  };

  tooltipEl.innerHTML = `
    <div style="
      background: ${isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.98)"};
      border: 1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(226, 232, 240, 0.9)"};
      color: ${isDark ? "#f3f4f6" : "#0f172a"};
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-radius: 12px;
      padding: ${isMobile ? "8px 10px" : "10px 12px"};
      max-width: ${tooltipWidth}px;
      font-family: inherit;
      font-size: ${isMobile ? "10px" : "11px"};
    ">
      <!-- Date Header & Active Metric Badge -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: ${isMobile ? "4px" : "6px"};
        margin-bottom: ${isMobile ? "6px" : "7px"};
        border-bottom: 1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.8)"};
      ">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: ${isMobile ? "10px" : "11px"}; font-weight: 600; color: ${isDark ? "#94a3b8" : "#64748b"};">Date:</span>
          <span style="font-size: ${isMobile ? "11px" : "12px"}; font-weight: 700; color: ${isDark ? "#f8fafc" : "#0f172a"};">${dateFormatted}</span>
        </div>
        <span style="
          font-size: ${isMobile ? "9px" : "10px"};
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 9999px;
          background: ${isDark ? "rgba(6, 182, 212, 0.2)" : "rgba(6, 182, 212, 0.12)"};
          color: ${isDark ? "#67e8f9" : "#0891b2"};
          border: 1px solid ${isDark ? "rgba(6, 182, 212, 0.3)" : "rgba(6, 182, 212, 0.25)"};
        ">
          ${metricInfo.value.title}
        </span>
      </div>

      <!-- Downline Section -->
      <div style="
        background: ${isDark ? "rgba(236, 211, 56, 0.07)" : "rgba(236, 211, 56, 0.09)"};
        border: 1px solid ${isDark ? "rgba(236, 211, 56, 0.22)" : "rgba(236, 211, 56, 0.3)"};
        border-radius: 8px;
        padding: ${isMobile ? "6px 8px" : "7px 10px"};
        margin-bottom: ${isMobile ? "5px" : "6px"};
      ">
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #ecd338; display: inline-block;"></span>
          <span style="font-size: ${isMobile ? "10.5px" : "11px"}; font-weight: 700; color: ${isDark ? "#fef08a" : "#854d0e"};">Network</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2.5px; font-size: ${isMobile ? "10px" : "11px"}; color: ${isDark ? "#e2e8f0" : "#334155"};">
          ${renderSectionRows(dDep, dWith, dAcc)}
        </div>
      </div>

      <!-- Individual Section -->
      <div style="
        background: ${isDark ? "rgba(6, 182, 212, 0.07)" : "rgba(6, 182, 212, 0.08)"};
        border: 1px solid ${isDark ? "rgba(6, 182, 212, 0.22)" : "rgba(6, 182, 212, 0.28)"};
        border-radius: 8px;
        padding: ${isMobile ? "6px 8px" : "7px 10px"};
      ">
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #06b6d4; display: inline-block;"></span>
          <span style="font-size: ${isMobile ? "10.5px" : "11px"}; font-weight: 700; color: ${isDark ? "#67e8f9" : "#0e7490"};">Individual</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 2.5px; font-size: ${isMobile ? "10px" : "11px"}; color: ${isDark ? "#e2e8f0" : "#334155"};">
          ${renderSectionRows(iDep, iWith, iAcc)}
        </div>
      </div>
    </div>
  `;

  // Position calculation
  const parentRect = chart.canvas.parentNode.getBoundingClientRect();
  const leftPos = tooltip.caretX;
  const topPos = tooltip.caretY;

  if (isMobile) {
    const calculatedLeft = leftPos - tooltipWidth / 2;
    const clampedLeft = Math.max(6, Math.min(calculatedLeft, parentRect.width - tooltipWidth - 6));
    tooltipEl.style.left = clampedLeft + "px";
    tooltipEl.style.top = Math.max(4, Math.min(topPos - 50, parentRect.height - 180)) + "px";
  } else {
    // Flip if near right edge
    if (leftPos + tooltipWidth > parentRect.width - 20) {
      tooltipEl.style.left = Math.max(10, leftPos - tooltipWidth - 15) + "px";
    } else {
      tooltipEl.style.left = leftPos + 15 + "px";
    }
    tooltipEl.style.top = Math.max(8, Math.min(topPos - 50, parentRect.height - 230)) + "px";
  }

  tooltipEl.style.opacity = "1";
};

const chartData = computed(() => {
  const labels = props.series.map((i) => i.label || i.date || "");
  const individualValues = props.series.map((i) => Number(i.individual ?? 0));
  const downlineValues = props.series.map((i) => Number(i.downline ?? 0));

  return {
    labels,
    datasets: [
      {
        label: metricInfo.value.individualLabel,
        data: individualValues,
        borderColor: "#06b6d4", // Cyan
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#06b6d4",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        backgroundColor: (context) => {
          const { chart } = context;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          return buildIndividualGradient(ctx, chartArea);
        },
      },
      {
        label: metricInfo.value.downlineLabel,
        data: downlineValues,
        borderColor: "#ecd338", // Gold / Yellow
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#ecd338",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        backgroundColor: (context) => {
          const { chart } = context;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          return buildDownlineGradient(ctx, chartArea);
        },
      },
    ],
  };
});

const chartOptions = computed(() => {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const isCurrency = metricInfo.value.isCurrency;

  return {
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
        enabled: false, // Use rich custom HTML tooltip
        external: externalTooltipHandler,
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: { size: 11, weight: "500" },
          color: isDark ? "#64748b" : "#94a3b8",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
      y: {
        border: {
          display: false,
          dash: [4, 4],
        },
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(226, 232, 240, 0.7)",
          borderDash: [4, 4],
          drawTicks: false,
        },
        ticks: {
          font: { size: 11 },
          color: isDark ? "#64748b" : "#94a3b8",
          callback: (value) => {
            const num = Number(value);
            return isCurrency ? `$${num.toLocaleString()}` : num.toLocaleString();
          },
        },
      },
    },
  };
});
</script>
