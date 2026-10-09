<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProfileStore } from "@/stores/shared/profile";
import { useFmLeaderboardStore } from "@/stores/fm/leaderboard";
import BaseTabs from "@/components/base/BaseTabs.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import CopyTradingCards from "@/components/client/copy-trading/CopyTradingCards.vue";
import FollowedFundManagers from "./FollowedFundManagers.vue";
import FollowedFundManagersHistory from "./history.vue";

const route = useRoute();
const router = useRouter();
const profileStore = useProfileStore();
const store = useFmLeaderboardStore();

const sortOptions = [
  { label: "Total Return", value: "total_return" },
  { label: "Win Rate", value: "win_rate" },
  { label: "Date Joined", value: "created_at" },
];

const orderOptions = [
  { label: "Descending", value: "desc" },
  { label: "Ascending", value: "asc" },
];

const onFilterChange = () => {
  store.pagination.page = 1;
  store.fetchFmLeaderboard(true, 1);
};

const role = computed(() => profileStore.user?.role);
const showToggle = computed(() => role.value === "client" || !role.value);

const activeTab = ref("copy-trading");

const copyTradingTabs = [
  { label: "Leaderboard", value: "copy-trading" },
  { label: "My Copy Trading", value: "my-copy-trading" },
  { label: "Following History", value: "history" },
];

const activeTabComponents = {
  "copy-trading": CopyTradingCards,
  "my-copy-trading": FollowedFundManagers,
  "history": FollowedFundManagersHistory,
};

// Sync activeTab with route query
watch(
  () => activeTab.value,
  (newTab) => {
    if (route.query.tab !== newTab) {
      router.push({ path: "/copy-trading", query: { tab: newTab } });
    }
  }
);

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab) {
      const normalized =
        newTab === "following-history"
          ? "history"
          : newTab === "leaderboard"
            ? "copy-trading"
            : newTab;
      if (activeTabComponents[normalized]) {
        activeTab.value = normalized;
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Sticky Tab toggle for Clients using BaseTabs -->
    <div
      v-if="showToggle"
      class="sticky -top-4 lg:-top-6 -mt-4 lg:-mt-6 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-4 lg:pt-6 pb-4 z-30 bg-background border-b border-primary-border overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div id="tour-copy-tabs" class="w-full md:w-auto overflow-x-auto no-scrollbar scrollbar-none flex-1">
        <BaseTabs
          v-model="activeTab"
          :tabs="copyTradingTabs"
        />
      </div>

      <div v-if="activeTab === 'copy-trading'" class="flex items-center gap-3 w-full md:w-auto">
        <BaseSelect
          v-model="store.filters.sort_by"
          :options="sortOptions"
          placeholder="Sort By"
          rounded="full"
          class="flex-1 md:w-48 rounded-full"
          @change="onFilterChange"
        />
        <!-- <BaseSelect
          v-model="store.filters.order"
          :options="orderOptions"
          placeholder="Order"
          class="flex-1 md:w-36"
          @change="onFilterChange"
        /> -->
      </div>
    </div>

    <!-- Tab Content -->
    <div id="tour-copy-content" class="flex-1">
      <KeepAlive>
        <component :is="activeTabComponents[activeTab]" />
      </KeepAlive>
    </div>
  </div>
</template>
