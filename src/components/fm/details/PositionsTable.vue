<script setup>
import { ServerCrash } from 'lucide-vue-next'
import Pagination from '@/components/base/Pagination.vue'

const props = defineProps({
  data:       { type: Array,   default: () => [] },
  loading:    { type: Boolean, default: false },
  type:       { type: String,  default: 'closed' }, // 'open' | 'closed'
  pagination: { type: Object,  default: () => ({ page: 1, total_pages: 1, total_items: 0 }) },
})

const emit = defineEmits(['page-change'])

const isProfit = (val) => Number(val) >= 0
</script>

<template>
  <div class="flex flex-col gap-4">

    <div class="border border-primary-border rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">

          <!-- Header -->
          <thead>
            <tr class="border-b border-primary-border bg-card-background">
              <th class="px-5 py-3 text-left text-xs text-secondary-text">Ticket</th>
              <th class="px-5 py-3 text-left text-xs text-secondary-text">Symbol</th>
              <th class="px-5 py-3 text-left text-xs text-secondary-text">Lot</th>
              <th class="px-5 py-3 text-left text-xs text-secondary-text">Profit</th>
              <th class="px-5 py-3 text-left text-xs text-secondary-text">Time</th>
            </tr>
          </thead>

          <tbody>

            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="n in 5" :key="n" class="border-b border-primary-border">
                <td v-for="c in 5" :key="c" class="px-5 py-3">
                  <div class="h-3 bg-primary-border rounded animate-pulse" />
                </td>
              </tr>
            </template>

            <!-- Empty -->
            <template v-else-if="data.length === 0">
              <tr>
                <td colspan="5" class="py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-primary-border flex items-center justify-center">
                      <ServerCrash class="w-5 h-5 text-secondary-text" />
                    </div>
                    <p class="text-sm text-primary-text">No positions found</p>
                    <p class="text-xs text-secondary-text">Try changing filters</p>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Data -->
            <template v-else>
              <tr
                v-for="row in data"
                :key="row.ticket"
                class="border-b border-primary-border last:border-0 hover:bg-background transition"
              >
                <td class="px-5 py-3 text-xs text-secondary-text">
                  #{{ row.ticket }}
                </td>

                <td class="px-5 py-3 text-primary-text font-medium">
                  {{ row.symbol }}
                </td>

                <td class="px-5 py-3 text-secondary-text">
                  {{ Number(row.lot).toFixed(2) }}
                </td>

                <td
                  class="px-5 py-3 font-medium"
                  :class="isProfit(row.profit) ? 'text-green-400' : 'text-red-400'"
                >
                  {{ isProfit(row.profit) ? '+' : '' }}{{ Number(row.profit).toFixed(2) }}
                </td>

                <td class="px-5 py-3 text-xs text-secondary-text whitespace-nowrap">
                  {{ row.close_time || row.open_time }}
                </td>
              </tr>
            </template>

          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total_items > pagination.per_page" class="p-3">
        <Pagination
          :pagination="pagination"
          @page-change="$emit('page-change', $event)"
        />
      </div>

    </div>

  </div>
</template>