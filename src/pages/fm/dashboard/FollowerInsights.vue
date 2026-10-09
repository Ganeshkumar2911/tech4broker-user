<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { Info } from "lucide-vue-next";
import { useFMDashboardStore } from "@/stores/fm/dashboard.js";

const store = useFMDashboardStore();
const { dashboard, dashboardLoading } = storeToRefs(store);

const followerData = computed(() => dashboard.value?.follower_insights ?? {});

const insightCards = computed(() => [
  {
    id: "highest_equity",
    icon: "💰",
    label: "HIGHEST EQUITY",
    value: `$${(followerData.value.highest_equity ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    subtext: "Lowest: $929.4",
    tooltip: "Follower with the largest account equity balance",
  },
  {
    id: "highest_profit",
    icon: "📈",
    label: "HIGHEST PROFIT CLIENT",
    value: followerData.value.highest_profit_client?.client_name ?? "N/A",
    amount: `$${(followerData.value.highest_profit_client?.net_profit ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    subtext: "Net profit",
    tooltip: "Follower who earned the highest net profit copying your strategy",
  },
  {
    id: "highest_fee",
    icon: "🏦",
    label: "HIGHEST FEE CLIENT",
    value: followerData.value.highest_fee_client?.client_name ?? "N/A",
    amount: `$${(followerData.value.highest_fee_client?.total_fees ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    subtext: "Total fees",
    tooltip: "Follower who contributed the highest management and performance fees",
  },
  {
    id: "most_active",
    icon: "⚡",
    label: "MOST ACTIVE CLIENT",
    value: followerData.value.most_active_client?.client_name ?? "N/A",
    amount: `${followerData.value.most_active_client?.total_trades ?? 0} trades`,
    subtext: "Highest trade count",
    tooltip: "Follower with the highest number of executed copier trades",
  },
]);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-1.5 mb-1">
        <h3 class="text-primary-text font-semibold text-base">
          Follower Insights
        </h3>
        <Tooltip text="Key metrics and top performing follower accounts across your strategy" position="top" wrap>
          <Info
            :size="11"
            class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
          />
        </Tooltip>
      </div>
      <p class="text-secondary-text text-sm">
        Key metrics across your investor base
      </p>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <template v-if="dashboardLoading">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-background border border-primary-border rounded-xl p-4 animate-pulse"
        >
          <div class="h-4 bg-primary-border rounded mb-2"></div>
          <div class="h-6 bg-primary-border rounded mb-2"></div>
          <div class="h-3 bg-primary-border rounded"></div>
        </div>
      </template>

      <template v-else>
        <div
          v-for="card in insightCards"
          :key="card.id"
          class="bg-card-background rounded-xl p-4"
        >
          <!-- Label -->
          <div class="flex items-center gap-1.5 mb-2 min-w-0">
            <p
              class="text-secondary-text text-xs font-semibold tracking-wider truncate"
            >
              {{ card.label }}
            </p>
            <Tooltip v-if="card.tooltip" :text="card.tooltip" position="top" wrap>
              <Info
                :size="11"
                class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
              />
            </Tooltip>
          </div>

          <!-- Main Value -->
          <p class="text-primary-text font-bold text-base mb-1">
            {{ card.value }}
          </p>

          <!-- Amount (for client cards) -->
          <p
            v-if="card.amount"
            class="text-primary-green font-semibold text-sm mb-2"
          >
            {{ card.amount }}
          </p>

          <!-- Subtext -->
          <p class="text-secondary-text text-xs">
            {{ card.subtext }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
