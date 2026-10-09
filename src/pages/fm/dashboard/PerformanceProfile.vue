<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { Info } from "lucide-vue-next";
import { useFMDashboardStore } from "@/stores/fm/dashboard.js";

const store = useFMDashboardStore();
const { dashboard, dashboardLoading } = storeToRefs(store);

const performanceData = computed(
  () => dashboard.value?.performance_profile ?? {},
);

const profileItems = computed(() => [
  {
    label: "PROFIT FEE",
    value: `${performanceData.value.performance_fee ?? 0}%`,
    tooltip: "Performance fee percentage charged on net profits",
  },
  {
    label: "BROKER SHARE",
    value: `${performanceData.value.broker_share ?? 0}%`,
    tooltip: "Percentage of profit or fee shared with broker",
  },
  {
    label: "MAX DRAWDOWN",
    value: `${performanceData.value.max_drawdown_percent ?? 0}%`,
    tooltip: "Maximum peak-to-trough equity decline",
  },
  {
    label: "TOTAL TRADES",
    value: performanceData.value.total_profitable_trades ?? 0,
    tooltip: "Total executed trades",
  },
]);

const initials = computed(() => {
  const name = performanceData.value?.fm_name;
  if (!name) return "";

  const parts = name.trim().split(/\s+/); // Splits by any space
  const firstInitial = parts[0]?.charAt(0) || "";
  const secondInitial = parts[1]?.charAt(0) || "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
});

const tradeBreakdown = computed(() => [
  {
    label: "WIN RATE",
    value: `${performanceData.value.win_rate_percent ?? 0}%`,
    color: "bg-primary-green",
  },
]);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-1.5 mb-1">
        <h3 class="text-primary-text font-semibold text-base">
          Performance Profile
        </h3>
        <Tooltip text="Key performance indicators and trade distribution of your strategy" position="top" wrap>
          <Info
            :size="11"
            class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
          />
        </Tooltip>
      </div>
      <p class="text-secondary-text text-sm">Your trading statistics</p>
    </div>

    <div class="bg-card-background rounded-2xl p-4 sm:p-6">
      <!-- Header with FM name and rank -->
      <div class="flex justify-between items-center gap-2 mb-6">
        <div class="flex items-center gap-2">
          <div
            class="w-12 h-12 bg-primary-border rounded-2xl flex items-center justify-center text-lg font-semibold text-primary-text"
          >
            {{ initials }}
          </div>
          <div>
            <h3 class="text-primary-text font-semibold text-base">
              {{ performanceData.fm_name ?? "Fund Manager" }}
            </h3>
            <p class="text-secondary-text text-sm">Your trading statistics</p>
          </div>
        </div>
        <Tooltip text="Your current strategy rank on the leaderboard" position="top">
          <div
            v-if="!dashboardLoading"
            class="bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-[10px] sm:text-sm font-semibold cursor-default"
          >
            Rank #{{ performanceData.ranking ?? "-" }}
          </div>
          <div
            v-else
            class="h-8 w-20 bg-primary-border rounded-full animate-pulse"
          ></div>
        </Tooltip>
      </div>

      <!-- Win Rate Progress Bar -->
      <div v-if="!dashboardLoading" class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-1.5">
            <span class="text-secondary-text text-xs font-semibold tracking-wider"
              >WIN RATE</span
            >
            <Tooltip text="Percentage of winning trades out of total trades" position="top" wrap>
              <Info
                :size="11"
                class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
              />
            </Tooltip>
          </div>
          <span
            class="font-bold text-sm"
            :class="
              (performanceData.win_rate_percent ?? 0) >= 50
                ? 'text-primary-green'
                : (performanceData.win_rate_percent ?? 0) >= 30
                ? 'text-secondary-yellow'
                : 'text-primary-red'
            "
            >{{ performanceData.win_rate_percent ?? 0 }}%</span
          >
        </div>
        <div class="w-full h-2 bg-primary-border rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-300 rounded-full"
            :class="
              (performanceData.win_rate_percent ?? 0) >= 50
                ? 'bg-primary-green'
                : (performanceData.win_rate_percent ?? 0) >= 30
                ? 'bg-secondary-yellow'
                : 'bg-primary-red'
            "
            :style="{
              width: `${Math.min(Math.max(performanceData.win_rate_percent ?? 0, 0), 100)}%`,
            }"
          ></div>
        </div>
      </div>
      <div v-else class="space-y-2 mb-6">
        <div class="h-4 bg-primary-border rounded animate-pulse"></div>
        <div class="h-2 bg-primary-border rounded animate-pulse"></div>
      </div>

      <!-- Stats Grid -->
      <div
        v-if="!dashboardLoading"
        class="grid grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="item in profileItems"
          :key="item.label"
          class="border border-primary-border p-3 rounded-xl"
        >
          <div class="flex items-center gap-1.5 mb-1 min-w-0">
            <p class="text-secondary-text text-[10px] font-semibold uppercase tracking-wider truncate">
              {{ item.label }}
            </p>
            <Tooltip v-if="item.tooltip" :text="item.tooltip" position="top" wrap>
              <Info
                :size="11"
                class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
              />
            </Tooltip>
          </div>
          <p class="text-primary-text font-bold">{{ item.value }}</p>
        </div>
      </div>
      <div v-else class="grid grid-cols-2 gap-4">
        <div v-for="i in 4" :key="i" class="space-y-2">
          <div class="h-3 bg-primary-border rounded animate-pulse"></div>
          <div class="h-5 bg-primary-border rounded animate-pulse"></div>
        </div>
      </div>

      <!-- Trade Breakdown -->

      <div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-4">
        <div
          v-if="!dashboardLoading"
          class="border mt-4 rounded-xl px-4 py-3 border-primary-border"
        >
          <div class="flex items-center gap-1.5 mb-3">
            <p
              class="text-secondary-text text-[10px] font-semibold tracking-wider"
            >
              7D TRADE BREAKDOWN
            </p>
            <Tooltip text="Win/Loss trade distribution over the last 7 days" position="top" wrap>
              <Info
                :size="11"
                class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
              />
            </Tooltip>
          </div>
          <div class="flex gap-3">
            <div class="flex items-center gap-2">
              <div class="h-3 w-3 bg-primary-green rounded-sm"></div>
              <span class="text-primary-text text-sm"
                >{{ performanceData.total_profitable_trades ?? 0 }} Win</span
              >
            </div>
            <div class="flex items-center gap-2">
              <div class="h-3 w-3 bg-primary-red rounded-sm"></div>
              <span class="text-primary-text text-sm"
                >{{ performanceData.total_loss_trades ?? 0 }} loss</span
              >
            </div>
          </div>
        </div>
        <div
          v-if="!dashboardLoading"
          class="border mt-4 rounded-xl px-4 py-3 border-primary-border"
        >
          <div class="flex items-center gap-1.5 mb-3">
            <p
              class="text-secondary-text text-[10px] font-semibold tracking-wider"
            >
              30D TRADE BREAKDOWN
            </p>
            <Tooltip text="Win/Loss trade distribution over the last 30 days" position="top" wrap>
              <Info
                :size="11"
                class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
              />
            </Tooltip>
          </div>
          <div class="flex gap-3">
            <div class="flex items-center gap-2">
              <div class="h-3 w-3 bg-primary-green rounded-sm"></div>
              <span class="text-primary-text text-sm"
                >{{ performanceData.total_profitable_trades ?? 0 }} Win</span
              >
            </div>
            <div class="flex items-center gap-2">
              <div class="h-3 w-3 bg-primary-red rounded-sm"></div>
              <span class="text-primary-text text-sm"
                >{{ performanceData.total_loss_trades ?? 0 }} loss</span
              >
            </div>
          </div>
        </div>
        <div v-else class="mt-6 pt-4 border-t border-primary-border">
          <div class="h-3 bg-primary-border rounded animate-pulse mb-3"></div>
          <div class="h-4 bg-primary-border rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
</template>
