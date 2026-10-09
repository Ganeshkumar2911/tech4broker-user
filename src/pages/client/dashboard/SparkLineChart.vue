<template>
  <div class="w-[70px] h-[30px]">
    <Line ref="lineRef" :data="chartData" :options="options" />
  </div>
</template>

<script setup>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";

import { Line } from "vue-chartjs";
import { ref, computed, onBeforeUnmount } from "vue";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const props = defineProps({
  values: {
    type: Array,
    default: () => [8, 12, 10, 11, 9, 10, 15, 14],
  },

  labels: {
    type: Array,
    default: () => [
      "10:00",
      "10:05",
      "10:10",
      "10:15",
      "10:20",
      "10:25",
      "10:30",
      "10:35",
    ],
  },

  isUp: {
    type: Boolean,
    default: true,
  },
});

const lineRef = ref(null);

const color = computed(() => (props.isUp ? "#22c55e" : "#ef4444"));

onBeforeUnmount(() => {
  const chart = lineRef.value?.chart;
  if (chart) {
    const el = document.getElementById(`spark-tooltip-${chart.id}`);
    if (el) el.remove();
  }
});

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,

      borderColor: color.value,

      borderWidth: 1,

      tension: 0.4,

      fill: true,

      pointRadius: 0,

      pointHoverRadius: 5,

      pointHoverBorderWidth: 2,

      pointHoverBorderColor: "#fff",

      pointHoverBackgroundColor: color.value,

      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { chartArea } = chart;

        if (!chartArea) return;

        const gradient = chart.ctx.createLinearGradient(
          0,
          chartArea.top,
          0,
          chartArea.bottom,
        );

        if (props.isUp) {
          gradient.addColorStop(0, "rgba(34,197,94,.35)");
          gradient.addColorStop(1, "rgba(34,197,94,0)");
        } else {
          gradient.addColorStop(0, "rgba(239,68,68,.35)");
          gradient.addColorStop(1, "rgba(239,68,68,0)");
        }

        return gradient;
      },
    },
  ],
}));

// ─── External (DOM-based) tooltip so it never clips inside the tiny canvas ──
// IMPORTANT: we look up AND append the tooltip in the exact same place
// (document.body), keyed by a unique id per chart instance. Previously the
// lookup searched chart.canvas.parentNode while creation appended to
// document.body — that mismatch meant the lookup never found the existing
// element, so a brand-new tooltip div got created (and left behind) on
// every single hover, producing the stacked/duplicated tooltip boxes.
function getOrCreateTooltip(chart) {
  const tooltipId = `spark-tooltip-${chart.id}`;
  let tooltipEl = document.getElementById(tooltipId);

  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.id = tooltipId;
    tooltipEl.classList.add("spark-tooltip");
    tooltipEl.style.position = "fixed";
    tooltipEl.style.pointerEvents = "none";
    tooltipEl.style.zIndex = "9999";
    tooltipEl.style.background = "#111827";
    tooltipEl.style.color = "#fff";
    tooltipEl.style.borderRadius = "6px";
    tooltipEl.style.padding = "6px 10px";
    tooltipEl.style.fontSize = "12px";
    tooltipEl.style.lineHeight = "1.4";
    tooltipEl.style.whiteSpace = "nowrap";
    tooltipEl.style.transition = "opacity 0.1s ease";
    tooltipEl.style.boxShadow = "0 4px 10px rgba(0,0,0,0.25)";

    const title = document.createElement("div");
    title.classList.add("spark-tooltip-title");
    title.style.fontWeight = "600";
    title.style.marginBottom = "2px";
    tooltipEl.appendChild(title);

    const body = document.createElement("div");
    body.classList.add("spark-tooltip-body");
    tooltipEl.appendChild(body);

    document.body.appendChild(tooltipEl);
  }

  return tooltipEl;
}

function externalTooltipHandler(context) {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = "0";
    return;
  }

  // Set title
  if (tooltip.title && tooltip.title.length) {
    tooltipEl.querySelector(".spark-tooltip-title").textContent =
      tooltip.title[0];
  }

  // Set body (price line)
  if (tooltip.body && tooltip.body.length) {
    const lines = tooltip.body.map((b) => b.lines).flat();
    tooltipEl.querySelector(".spark-tooltip-body").textContent = lines[0] || "";
  }

  // Position relative to the actual canvas position on screen (fixed = never clipped by
  // any parent's overflow-hidden / overflow-x-auto, e.g. the market watch table row)
  const canvasRect = chart.canvas.getBoundingClientRect();

  let left = canvasRect.left + tooltip.caretX;
  let top = canvasRect.top + tooltip.caretY;

  // Keep tooltip above the point, centered horizontally on it
  tooltipEl.style.opacity = "1";
  tooltipEl.style.transform = "translate(-50%, -110%)";
  tooltipEl.style.left = left + "px";
  tooltipEl.style.top = top + "px";

  // Basic viewport clamping so it doesn't run off the left/right edge
  requestAnimationFrame(() => {
    const rect = tooltipEl.getBoundingClientRect();
    if (rect.left < 4) {
      tooltipEl.style.left = "4px";
      tooltipEl.style.transform = "translate(0, -110%)";
    } else if (rect.right > window.innerWidth - 4) {
      tooltipEl.style.left = window.innerWidth - 4 + "px";
      tooltipEl.style.transform = "translate(-100%, -110%)";
    }
  });
}

const options = {
  responsive: true,
  maintainAspectRatio: false,

  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: false, // in-canvas tooltip band karo, DOM tooltip use karenge
      external: externalTooltipHandler,
      callbacks: {
        title(items) {
          return items[0].label;
        },
        label(ctx) {
          return `Price : ${ctx.parsed.y}`;
        },
      },
    },
  },

  scales: {
    x: {
      display: false,
      grid: { display: false },
      border: { display: false },
    },
    y: {
      display: false,
      grid: { display: false },
      border: { display: false },
    },
  },
};
</script>
