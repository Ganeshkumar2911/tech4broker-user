<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
  >
    <div class="bg-card-background rounded-2xl border border-primary-border w-full max-w-md shadow-2xl" @click.stop>

      <div class="px-6 py-4 border-b border-primary-border flex items-center justify-between">
        <div class="flex items-center gap-2">
          <PlayCircle class="w-4 h-4 text-primary" />
          <h2 class="text-sm font-semibold text-primary-text">Run Settlement</h2>
        </div>
        <button class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors cursor-pointer" @click="emit('close')">
          <X class="w-4 h-4 text-secondary-text" />
        </button>
      </div>

      <div class="px-6 py-5 space-y-4">
        <div class="bg-background border border-primary-border rounded-xl p-4 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs text-secondary-text">Fund Manager</span>
            <span class="text-xs font-semibold text-primary-text">{{ settlement?.fm_name }} (ID #{{ settlement?.fm_id }})</span>
          </div>
          <div class="border-t border-primary-border" />
          <div class="flex items-center justify-between">
            <span class="text-xs text-secondary-text">Total PnL</span>
            <span
              class="text-xs font-bold font-mono"
              :class="totalPnl >= 0 ? 'text-primary-green' : 'text-primary-red'"
            >
              {{ totalPnl > 0 ? '+' : '' }}{{ formatCurrency(totalPnl) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-secondary-text">Total Fee</span>
            <span class="text-xs font-semibold font-mono text-primary-text">{{ formatCurrency(settlement?.summary?.total_fee ?? settlement?.total_fee) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-secondary-text">FM Net Share</span>
            <span class="text-xs font-semibold font-mono text-primary-text">{{ formatCurrency(settlement?.summary?.total_fm_net_after_agents) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-secondary-text">Broker Net Share</span>
            <span class="text-xs font-semibold font-mono text-primary-text">{{ formatCurrency(settlement?.summary?.total_broker_net) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-secondary-text">IB Payout</span>
            <span class="text-xs font-semibold font-mono text-primary-green">{{ formatCurrency(settlement?.summary?.total_ib_distributed) }}</span>
          </div>
          <div class="border-t border-primary-border" />
          <div class="flex items-center justify-between">
            <span class="text-xs text-secondary-text">Volume</span>
            <span class="text-xs font-medium text-primary-text">
              {{ settlement?.summary?.total_trades ?? settlement?.total_trades ?? 0 }} trades · {{ settlement?.summary?.unique_followers ?? settlement?.followers?.length ?? 0 }} followers
            </span>
          </div>
        </div>
        <p class="text-xs text-secondary-text">This action will process the settlement and distribute performance fees & commissions. This cannot be undone.</p>
      </div>

      <div class="px-6 py-4 border-t border-primary-border flex gap-3">
        <button
          class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-secondary-text border border-primary-border hover:bg-background hover:text-primary-text transition-colors cursor-pointer"
          @click="emit('close')"
        >Cancel</button>
        <button
          :disabled="runLoading"
          class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-white bg-primary hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          @click="emit('confirm')"
        >
          <Loader2 v-if="runLoading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ runLoading ? 'Running...' : 'Confirm & Run' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { X, PlayCircle, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  settlement: { type: Object, default: null },
  currency: { type: String, default: 'USD' },
  runLoading: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'confirm'])

const totalPnl = computed(() => Number(props.settlement?.summary?.total_pnl ?? props.settlement?.total_pnl ?? 0))

const getCurrencySymbol = (currency) => {
  const c = String(currency || '').trim().toUpperCase()
  if (c === 'USC' || c === 'CENT') return 'C'
  if (c === 'CAD') return 'C$'
  if (c === 'EUR') return '€'
  if (c === 'GBP') return '£'
  if (c === 'INR') return '₹'
  if (c === 'JPY') return '¥'
  if (c === 'USD') return '$'
  return c ? `${c} ` : '$'
}

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return '—'
  const num = Number(val)
  if (isNaN(num)) return '—'
  const sym = getCurrencySymbol(props.currency)
  const isNegative = num < 0
  const formatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${isNegative ? '-' : ''}${sym}${formatted}`
}
</script>