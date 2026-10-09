<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    @click.self="emit('close')"
  >
    <div class="bg-card-background rounded-2xl border border-primary-border w-full max-w-md overflow-hidden shadow-2xl">
      <div class="px-6 py-4 border-b border-primary-border flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-primary-text">Delete Additional Agent</h2>
          <p class="text-xs text-secondary-text mt-0.5">Review the agent details before removing access.</p>
        </div>
        <button
          class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-secondary-text hover:text-primary-text cursor-pointer"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="px-6 py-5 space-y-4">
        <div class="rounded-xl border border-primary-border/60 bg-background/60 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[11px] uppercase tracking-widest text-secondary-text">Trading Account</p>
              <p class="text-sm font-bold text-primary-text mt-1">{{ formatAgentAccount(agent) }}</p>
              <p class="text-xs text-secondary-text mt-1 truncate">{{ agent?.broker_label || 'No broker label' }}</p>
            </div>
            <span
              class="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
              :class="agent?.is_active
                ? 'bg-primary-green/10 text-primary-green'
                : 'bg-primary-red/10 text-primary-red'"
            >
              {{ agent?.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-4">
            <div class="rounded-lg bg-card-background border border-primary-border px-3 py-2">
              <p class="text-[10px] uppercase tracking-widest text-secondary-text">Share</p>
              <p class="text-sm font-bold text-primary-text mt-1">{{ formatShare(agent?.share_percentage) }}</p>
            </div>
            <div class="rounded-lg bg-card-background border border-primary-border px-3 py-2">
              <p class="text-[10px] uppercase tracking-widest text-secondary-text">Created</p>
              <p class="text-sm font-bold text-primary-text mt-1">{{ formatDate(agent?.created_at) }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-primary-red/20 bg-primary-red/10 px-4 py-3">
          <p class="text-xs font-semibold text-primary-text">This action cannot be undone.</p>
          <p class="text-xs text-secondary-text mt-0.5">
            The agent will lose access immediately after deletion.
          </p>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-primary-border flex gap-3 bg-card-background">
        <button
          class="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-secondary-text border border-primary-border hover:bg-background transition-colors cursor-pointer"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          :disabled="loading"
          class="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary-red hover:bg-primary-red/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          @click="emit('confirm')"
        >
          <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ loading ? 'Deleting...' : 'Delete' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Trash2, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  agent: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'confirm'])

const formatAgentAccount = (agent) => {
  return agent?.trading_account_id
    ?? agent?.account_number
    ?? agent?.trading_account?.account_number
    ?? '—'
}

const formatShare = (share) => {
  if (share === null || share === undefined || share === '') return '—'
  return `${Number(share)}%`
}

const formatDate = (val) => {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>
