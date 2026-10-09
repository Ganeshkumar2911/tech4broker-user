<script setup>
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
const props = defineProps({
  statusDialog: {
    type: Object,
    default: () => ({ open: false, item: null, loading: false })
  }
})

const emit = defineEmits(['update', 'close'])

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('update')
}

const isSuspending = computed(() => props.statusDialog.item?.status === 'active')

const displayInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : 'F'
}

const fmt = (v) => (v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<template>
  <div
    v-if="statusDialog.open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click="handleClose"
  >
    <div
      class="bg-card-background rounded-2xl border border-primary-border w-full max-w-md"
      @click.stop
    >
      <div class="p-5 border-b border-primary-border">
        <h3 class="text-base font-semibold text-primary-text">
          {{ isSuspending ? 'Suspend' : 'Activate' }} Copying
        </h3>
      </div>

      <div class="p-5 space-y-4">
        <!-- FM & Account Context -->
        <div class="bg-background rounded-xl p-4 flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-button flex items-center justify-center text-sm font-bold text-button-text shrink-0">
              {{ displayInitial(statusDialog.item?.fund_manager?.name) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-primary-text truncate">
                {{ statusDialog.item?.fund_manager?.name ?? 'Unnamed FM' }}
              </p>
              <p class="text-[11px] text-secondary-text truncate">
                {{ statusDialog.item?.fund_manager?.email }}
              </p>
            </div>
          </div>

          <div class="pt-3 border-t border-primary-border grid grid-cols-2 gap-4">
            <div>
              <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5">Trading Account</p>
              <p class="text-xs font-semibold text-primary-text">#{{ statusDialog.item?.account?.account_number }}</p>
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-0.5">Current Equity</p>
              <p class="text-xs font-semibold text-primary-text">${{ fmt(statusDialog.item?.equity) }}</p>
            </div>
          </div>
        </div>

        <!-- Action Message -->
        <div class="px-1">
          <p class="text-sm font-medium text-primary-text mb-1">
             {{ isSuspending ? 'Suspend' : 'Activate' }}
          </p>
          <p class="text-xs text-secondary-text leading-relaxed">
            {{ 
              isSuspending 
                ? 'New positions copying will be suspended.' 
                : 'New positions of the provider will start being copied.' 
            }}
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 p-5 border-t border-primary-border">
        <button
          class="px-4 py-2 text-sm rounded-lg bg-background text-secondary-text hover:text-primary-text border-0 shadow-none cursor-pointer"
          @click="handleClose"
        >
          Cancel
        </button>

        <button
          class="px-4 py-2 text-sm rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-0 shadow-none cursor-pointer"
          :class="[
            isSuspending 
              ? 'bg-primary-red text-white hover:bg-primary-red/90' 
              : 'bg-button text-button-text hover:opacity-90'
          ]"
          :disabled="statusDialog.loading"
          @click="handleConfirm"
        >
          <Loader2 v-if="statusDialog.loading" class="w-4 h-4 animate-spin" />
          {{ isSuspending ? 'Suspend' : 'Activate' }}
        </button>
      </div>
    </div>
  </div>
</template>
