<template>
  <!-- Banner -->
  <div id="tour-fm-competitions-banner">
    <CompetitionsBanner :loading="bannersStore.loading" :items="bannersStore.banners" />
  </div>

  <!-- Top card -->
  <div
    class="mt-6 grid grid-cols-1 min-[640px]:grid-cols-2 min-[768px]:max-[968px]:grid-cols-1 gap-4"
  >
    <div
      v-if="store.dashboardLoading"
      class="bg-card-background border border-primary-border p-4 rounded-2xl space-y-2 min-h-[180px] animate-pulse"
    >
      <div class="h-16 w-full bg-primary-border/50 rounded"></div>
      <div class="h-4 w-full bg-primary-border/40 rounded"></div>
      <div class="h-4 w-full bg-primary-border/40 rounded"></div>
    </div>

    <div id="tour-fm-overview-followers" v-else class="bg-card-background p-4 rounded-2xl space-y-2">
      <div class="flex flex-col items-center bg-background p-2 rounded-lg">
        <div class="flex items-center gap-1.5">
          <h3 class="text-secondary-text text-sm">Followers</h3>
          <Tooltip text="Total followers subscribed to your fund manager strategy" position="top" wrap>
            <Info
              :size="11"
              class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
            />
          </Tooltip>
        </div>
        <p class="text-primary-text font-semibold text-lg">
          {{ store.dashboard?.overview?.total_followers ?? 0 }}
        </p>
      </div>
      <div class="space-y-2">
        <div class="flex w-full h-4 overflow-hidden rounded">
          <div
            class="bg-primary-blue transition-all duration-500"
            :style="{ width: `${activePercentage}%` }"
          ></div>

          <div
            class="bg-secondary-blue transition-all duration-500"
            :style="{ width: `${inactivePercentage}%` }"
          ></div>
        </div>
        <div class="flex justify-between items-center">
          <div>
            <div class="flex items-center gap-1">
              <div class="h-3 w-3 bg-primary-blue rounded-xs"></div>
              <p class="text-secondary-text text-sm">Active</p>
              <Tooltip text="Active followers currently copying trades" position="top" wrap>
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
                />
              </Tooltip>
            </div>
            <p class="text-primary-text font-medium text-base">
              {{ store.dashboard?.overview?.active_followers ?? 0 }}
            </p>
          </div>
          <div>
            <div class="flex items-center gap-1">
              <div class="h-3 w-3 bg-secondary-blue rounded-xs"></div>
              <p class="text-secondary-text text-sm">In Active</p>
              <Tooltip text="Inactive followers who have paused or stopped copying" position="top" wrap>
                <Info
                  :size="11"
                  class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
                />
              </Tooltip>
            </div>
            <p class="text-primary-text font-medium text-base">
              {{ store.dashboard?.overview?.inactive_followers ?? 0 }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="store.dashboardLoading"
      class="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4"
    >
      <div v-for="n in 4" :key="n">
        <div
          class="space-y-2 bg-card-background border border-primary-border px-4 py-5 rounded-2xl animate-pulse"
        >
          <div class="h-4 w-full bg-primary-border/50 rounded"></div>
          <div class="h-4 w-full bg-primary-border/40 rounded"></div>
        </div>
      </div>
    </div>
    <div id="tour-fm-overview-metrics" v-else class="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4">
      <div
        class="text-primary-text font-medium bg-card-background px-4 py-5 rounded-2xl flex flex-col justify-between"
      >
        <div class="flex items-center gap-1.5 mb-1">
          <h4 class="text-sm pl-1 truncate">Net Profit Generated</h4>
          <Tooltip text="Total net profit generated across all managed trades" position="top" wrap>
            <Info
              :size="11"
              class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
            />
          </Tooltip>
        </div>
        <p class="text-primary-green font-semibold flex items-center">
          <span class="material-symbols-outlined font-size">
            attach_money
          </span>
          <span>{{
            store.dashboard?.overview?.total_net_profit_generated ?? 0
          }}</span>
        </p>
      </div>
      <div
        class="text-primary-text font-medium bg-card-background px-4 py-5 rounded-2xl flex flex-col justify-between"
      >
        <div class="flex items-center gap-1.5 mb-1">
          <h4 class="text-sm pl-1 truncate">Total Fee Earned</h4>
          <Tooltip text="Total management and performance fees earned" position="top" wrap>
            <Info
              :size="11"
              class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
            />
          </Tooltip>
        </div>
        <p class="text-primary-green font-semibold flex items-center">
          <span class="material-symbols-outlined font-size">
            attach_money
          </span>
          <span>{{ store.dashboard?.overview?.total_fee_earned ?? 0 }}</span>
        </p>
      </div>
      <div
        class="text-primary-text font-medium bg-card-background px-4 py-5 rounded-2xl flex flex-col justify-between"
      >
        <div class="flex items-center gap-1.5 mb-1">
          <h4 class="text-sm pl-1 truncate">Wallet Balance</h4>
          <Tooltip text="Current available fund manager wallet balance" position="top" wrap>
            <Info
              :size="11"
              class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
            />
          </Tooltip>
        </div>
        <p class="text-primary-green font-semibold flex items-center">
          <span class="material-symbols-outlined font-size">
            attach_money
          </span>
          <span>{{ store.dashboard?.overview?.wallet_balance ?? 0 }}</span>
        </p>
      </div>
      <div
        class="text-primary-text font-medium bg-card-background px-4 py-5 rounded-2xl flex flex-col justify-between"
      >
        <div class="flex items-center gap-1.5 mb-1">
          <h4 class="text-sm pl-1 truncate">Avg Profit / Client</h4>
          <Tooltip text="Average profit generated per active follower" position="top" wrap>
            <Info
              :size="11"
              class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
            />
          </Tooltip>
        </div>
        <p class="text-primary-green font-semibold flex items-center">
          <span class="material-symbols-outlined font-size">
            attach_money
          </span>
          <span>{{
            store.dashboard?.overview?.avg_profit_per_client ?? 0
          }}</span>
        </p>
      </div>
    </div>
  </div>

  <!-- Fund Manager Account Status Card -->
  <div id="tour-fm-account-status">
    <FmAccountStatusCard />
  </div>

  <!-- Performance Analytics -->
  <div class="mt-6 mb-4">
    <div class="flex items-center gap-1.5">
      <h2 class="text-primary-text font-semibold text-xl">
        Performance Analytics
      </h2>
      <Tooltip text="Strategy performance metrics, equity/fee chart and follower volume over time" position="top" wrap>
        <Info
          :size="11"
          class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0"
        />
      </Tooltip>
    </div>
  </div>

  <div id="tour-fm-performance-chart" class="mt-6">
    <FmDashboardChart />
  </div>

  <!-- Performance Profile & Follower Insights -->
  <div id="tour-fm-performance-profile" class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
    <PerformanceProfile />
    <FollowerInsights />
  </div>

  <div>
    <Disclaimer :data="disclaimerData" />
  </div>
</template>

<script setup>
import MultiLevelSelect from "@/components/base/MultiLevelSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { Info } from "lucide-vue-next";
import Tooltip from "@/components/base/Tooltip.vue";
import FmAccountStatusCard from "./FmAccountStatusCard.vue";
import FmDashboardChart from "./FmDashboardChart.vue";
import PerformanceProfile from "./PerformanceProfile.vue";
import FollowerInsights from "./FollowerInsights.vue";
import { useFMDashboardStore } from "@/stores/fm/dashboard.js";
import { useBannersStore } from "@/stores/shared/banners.js";
import { useProfileStore } from "@/stores/shared/profile";
import { useFmStrategiesStore } from "@/stores/fm/strategies.js";
import Disclaimer from "@/components/common/Disclaimer.vue";
import CompetitionsBanner from "@/components/common/CompetitionsBanner.vue";

const store = useFMDashboardStore();
const bannersStore = useBannersStore();
const profileStore = useProfileStore();
const strategiesStore = useFmStrategiesStore();

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

const activePercentage = computed(() => {
  const total = store.dashboard?.overview?.total_followers || 0;
  const active = store.dashboard?.overview?.active_followers || 0;

  return total ? (active / total) * 100 : 0;
});

const inactivePercentage = computed(() => {
  const total = store.dashboard?.overview?.total_followers || 0;
  const inactive = store.dashboard?.overview?.inactive_followers || 0;

  return total ? (inactive / total) * 100 : 0;
});

function handleStrategyChange() {
  store.fetchDashboard(true);
  store.fetchPerformanceAnalytics(true);
}

watch(
  () => strategiesStore.selectedStrategyId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      handleStrategyChange();
    }
  }
);

onMounted(async () => {
  bannersStore.fetchBanners();
  profileStore.fetchUserProfile();
  window.addEventListener("fm-strategy-changed", handleStrategyChange);

  if (!strategiesStore.isFetched.strategies) {
    await strategiesStore.fetchStrategies();
  }
  store.fetchDashboard(true);
  store.fetchPerformanceAnalytics(true);
});

onBeforeUnmount(() => {
  window.removeEventListener("fm-strategy-changed", handleStrategyChange);
});

const dateRange = ref(null);
</script>

<style>
.font-size {
  font-size: 20px;
  font-weight: 900;
}
</style>
