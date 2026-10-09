<template>
  <div v-if="isOpen" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
    <div class="bg-card-background border border-primary-border rounded-xl p-4 w-full max-w-md shadow-2xl flex flex-col gap-4 text-primary-text">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-primary-border pb-3">
        <div class="flex items-center gap-2">
          <AlertTriangle class="h-4 w-4 text-[#EA4335]" />
          <h3 class="font-bold text-sm">Cancel Order #{{ ticket }}</h3>
        </div>
        <button @click="$emit('close')" class="text-secondary-text hover:text-primary-text cursor-pointer">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="flex flex-col gap-2 text-xs text-secondary-text">
        <p class="text-primary-text font-semibold">Are you sure you want to cancel pending order #{{ ticket }}?</p>
        <p class="text-[11px] opacity-80">This action cannot be undone and will remove the order from active pending orders.</p>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-primary-border">
        <button 
          @click="$emit('close')" 
          class="px-3 py-1.5 rounded-lg border border-primary-border text-xs font-semibold text-secondary-text hover:text-primary-text cursor-pointer"
        >
          No, Keep Order
        </button>
        <button 
          @click="$emit('confirm')" 
          :disabled="cancelling"
          class="px-4 py-1.5 rounded-lg bg-[#EA4335] text-white text-xs font-bold hover:bg-[#EA4335]/90 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <Loader2 v-if="cancelling" class="h-3.5 w-3.5 animate-spin" />
          <span>Yes, Cancel Order</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { AlertTriangle, X, Loader2 } from 'lucide-vue-next'

defineProps({
  isOpen: { type: Boolean, default: false },
  ticket: { type: [Number, String], default: '' },
  cancelling: { type: Boolean, default: false }
})

defineEmits(['close', 'confirm'])
</script>
