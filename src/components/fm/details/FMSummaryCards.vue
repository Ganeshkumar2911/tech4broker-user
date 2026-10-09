<script setup>
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

defineProps({
  summary: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const cards = (s) => [
  {
    label: 'Open Profit',
    value: s?.total_open_profit ?? 0,
    icon: TrendingUp,
    isProfit: true,
  },
  {
    label: 'Closed Profit',
    value: s?.total_closed_profit ?? 0,
    icon: TrendingDown,
    isProfit: true,
  },
]
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

    <!-- Skeleton -->
    <template v-if="loading || !summary">
      <div
        v-for="n in 2"
        :key="n"
        class="bg-card-background border border-primary-border rounded-2xl px-4 py-3 flex flex-col gap-2"
      >
        <div class="h-3 w-20 bg-primary-border rounded animate-pulse" />
        <div class="h-5 w-16 bg-primary-border rounded animate-pulse" />
      </div>
    </template>

    <!-- Cards -->
    <template v-else>
      <div
        v-for="card in cards(summary)"
        :key="card.label"
        class="bg-card-background border border-primary-border rounded-2xl px-4 py-3 flex flex-col gap-1"
      >
        <div class="flex items-center gap-1.5">
          <component :is="card.icon" class="w-3.5 h-3.5 text-secondary-text" />
          <span class="text-secondary-text text-xs">{{ card.label }}</span>
        </div>

        <span
          class="text-sm font-semibold tabular-nums"
          :class="card.value >= 0 ? 'text-green-400' : 'text-red-400'"
        >
          {{ card.value >= 0 ? '+' : '' }}{{ Number(card.value).toFixed(2) }}
        </span>
      </div>
    </template>

  </div>
</template>