<script setup>
import { ref, computed } from "vue";
import { Line } from "vue-chartjs";
import { ChevronDown, Calendar } from "lucide-vue-next";
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
import Disclaimer from "@/components/common/Disclaimer.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import BaseTabs from "@/components/base/BaseTabs.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import DownloadButton from "@/components/base/DownloadButton.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

/* ---------------- Filter bar ---------------- */
const dateRange = ref([null, null]);
const search = ref("");
const loading = ref(false);

function handleDownload() {
  console.log("Download clicked");
}

function refreshReport() {
  console.log("Refresh clicked");
}

function handleUpdate() {
  // wire this up to your API call / store action
  console.log("Update clicked");
}

/* ---------------- Stats chart ---------------- */
const tabs = ["Deposit", "Withdrawal", "Net Funding"];
const activeTab = ref("withdrawal");

// Sample series per tab — swap for real API data.
const seriesByTab = {
  Deposit: [
    420, 460, 480, 470, 500, 520, 540, 560, 555, 590, 610, 630, 650, 680, 700,
    730, 760, 790, 810, 850,
  ],
  Withdrawal: [
    560, 590, 605, 600, 615, 620, 630, 625, 635, 640, 645, 650, 655, 660, 690,
    700, 705, 780, 790, 795,
  ],
  "Net Funding": [
    -140, -130, -125, -130, -115, -100, -90, -65, -80, -50, -35, -20, -5, 20,
    10, 30, 55, 10, 20, 55,
  ],
};

const labels = [
  "09 Jun",
  "11 Jun",
  "13 Jun",
  "15 Jun",
  "17 Jun",
  "19 Jun",
  "21 Jun",
  "23 Jun",
  "25 Jun",
  "27 Jun",
  "29 Jun",
  "Jul'26",
  "03 Jul",
  "05 Jul",
  "07 Jul",
];

const dataValues = computed(() => seriesByTab[activeTab.value]);

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

const chartData = computed(() => ({
  labels: labels,
  datasets: [
    {
      data: dataValues.value,
      borderColor: "#22c55e",
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "#22c55e",
      pointHoverBorderColor: "#fff",
      pointHoverBorderWidth: 2,
      tension: 0.35,
      fill: true,
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: canvasCtx, chartArea } = chart;
        if (!chartArea) return "rgba(34,197,94,0.15)";
        const gradient = canvasCtx.createLinearGradient(
          0,
          chartArea.top,
          0,
          chartArea.bottom,
        );
        gradient.addColorStop(0, "rgba(34,197,94,0.35)");
        gradient.addColorStop(1, "rgba(34,197,94,0.0)");
        return gradient;
      },
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#e2e8f0",
      bodyColor: "#e2e8f0",
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: "#94a3b8",
        font: { size: 11 },
        maxRotation: 0,
        autoSkipPadding: 8,
      },
    },
    y: {
      position: "left",
      grid: { color: "#eef2f6" },
      border: { display: false },
      ticks: { color: "#94a3b8", font: { size: 11 }, stepSize: 173 },
    },
  },
};

/* ---------------- IB of the week podium ---------------- */
const ranking = [
  {
    rank: 2,
    name: "Ganesh K...",
    score: 223,
    avatar: "https://i.pravatar.cc/150?img=12",
    color: "#3b82f6",
    shade: "#1d4ed8",
  },
  {
    rank: 1,
    name: "Ganesh K...",
    score: 223,
    avatar: "https://i.pravatar.cc/150?img=13",
    color: "#f59e0b",
    shade: "#b45309",
  },
  {
    rank: 3,
    name: "Ganesh K...",
    score: 223,
    avatar: "https://i.pravatar.cc/150?img=14",
    color: "#14b8a6",
    shade: "#0f766e",
  },
];

// Deterministic "random" star positions so they don't reshuffle on re-render.
const stars = Array.from({ length: 40 }, (_, i) => {
  const seed = i * 137.5;
  return {
    top: (seed % 100).toFixed(1) + "%",
    left: ((seed * 1.7) % 100).toFixed(1) + "%",
    size: (0.5 + (i % 5) * 0.4).toFixed(1) + "px",
    opacity: (0.2 + (i % 6) * 0.13).toFixed(2),
  };
});

const baseTabMenu = [
  { label: "Deposit", value: "deposit" },
  { label: "Withdrawal", value: "withdrawal" },
  { label: "Net Funding", value: "net-funding" },
];
</script>

<template>
  <div class="min-h-screen">
    <!-- Filter row -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-4">
        <BaseSelect placeholder="Month To Date" borderless rounded="full" />
        <BaseDateRangePicker placement="left" v-model="dateRange" borderless />
        <BaseSelect placeholder="Month To Date" borderless rounded="full" />
        <BaseSelect placeholder="Month To Date" borderless rounded="full" />
      </div>
    </div>

    <!-- Section title -->
    <h1 class="mb-4 mt-6 text-xl font-bold text-primary-text">
      Deposit and Withdrawal Statistics
    </h1>

    <!-- Chart + IB card -->
    <div class="grid w-full grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr] min-w-0">
      <!-- Stats chart card -->
      <div
        class="rounded-2xl min-w-0 bg-card-background border border-primary-border p-5 shadow-sm"
      >
        <BaseTabs
          over-ride-class="bg-background border border-primary-border"
          class="mb-4"
          :tabs="baseTabMenu"
          v-model="activeTab"
          active-class="bg-primary text-secondary font-bold shadow-sm"
          inactive-class="text-secondary-text hover:text-primary-text"
        />

        <div class="h-72">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- IB of the week card -->
      <div
        class="relative overflow-hidden rounded-2xl p-6 shadow-sm"
        style="
          background: radial-gradient(
            ellipse at top,
            #2b2b33 0%,
            #17171c 60%,
            #0d0d10 100%
          );
        "
      >
        <div class="pointer-events-none absolute inset-0 opacity-70">
          <span
            v-for="(star, i) in stars"
            :key="i"
            class="absolute rounded-full bg-white"
            :style="{
              width: star.size,
              height: star.size,
              top: star.top,
              left: star.left,
              opacity: star.opacity,
            }"
          />
        </div>

        <div class="relative z-10 text-center">
          <p class="text-sm font-medium tracking-wide text-slate-200">
            The Top Performing
          </p>
          <p
            class="text-3xl italic text-white"
            style="font-family: Georgia, &quot;Times New Roman&quot;, serif"
          >
            IB of the week
          </p>
        </div>

        <div class="relative z-10 mt-8 flex items-end justify-center gap-6">
          <div
            v-for="item in ranking"
            :key="item.rank"
            class="flex flex-col items-center"
            :class="item.rank === 1 ? '-translate-y-4' : ''"
          >
            <div
              class="relative"
              :style="{ width: item.rank === 1 ? '84px' : '68px' }"
            >
              <svg viewBox="0 0 100 130" class="w-full">
                <defs>
                  <linearGradient
                    :id="`ribbon-${item.rank}`"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" :stop-color="item.color" />
                    <stop offset="100%" :stop-color="item.shade" />
                  </linearGradient>
                </defs>
                <path
                  d="M20 60 L20 125 L50 105 L80 125 L80 60 Z"
                  :fill="`url(#ribbon-${item.rank})`"
                  opacity="0.95"
                />
                <polygon
                  points="50,5 61,38 96,38 68,59 79,92 50,71 21,92 32,59 4,38 39,38"
                  :fill="`url(#ribbon-${item.rank})`"
                  stroke="rgba(255,255,255,0.5)"
                  stroke-width="1.5"
                />
                <text
                  x="50"
                  y="46"
                  text-anchor="middle"
                  font-size="26"
                  font-weight="700"
                  fill="#fff"
                >
                  {{ item.rank }}
                </text>
              </svg>
            </div>

            <img
              :src="item.avatar"
              :alt="item.name"
              class="-mt-3 rounded-full border-4 object-cover"
              :style="{
                borderColor: item.color,
                width: item.rank === 1 ? '64px' : '52px',
                height: item.rank === 1 ? '64px' : '52px',
              }"
            />

            <p class="mt-2 text-sm font-medium text-white">{{ item.name }}</p>
            <p class="text-lg font-bold text-white">{{ item.score }}</p>
          </div>
        </div>
      </div>
    </div>

    <Disclaimer :data="disclaimerData" />
  </div>
</template>
