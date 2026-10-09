<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div class="flex items-center gap-3 w-full md:w-auto">
        <BaseSelect
          v-model="store.filters.sort_by"
          :options="sortOptions"
          placeholder="Sort By"
          class="flex-1 md:w-48"
          @change="onFilterChange"
        />
      </div>
    </div>

    <CopyTradingCards :show-follow="false" />
  </div>
</template>

<script setup>
import { useFmLeaderboardStore } from "@/stores/fm/leaderboard";
import CopyTradingCards from "@/components/client/copy-trading/CopyTradingCards.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";

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
</script>
