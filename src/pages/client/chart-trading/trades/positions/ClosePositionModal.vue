<template>
  <div v-if="isOpen" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
    <div class="bg-card-background border border-primary-border rounded-xl p-4 w-full max-w-md shadow-2xl flex flex-col gap-4 text-primary-text">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-primary-border pb-3">
        <div class="flex items-center gap-2">
          <XCircle class="h-4 w-4 text-[#EA4335]" />
          <h3 class="font-bold text-sm">Close Position #{{ ticket }}</h3>
        </div>
        <button @click="$emit('close')" class="text-secondary-text hover:text-primary-text cursor-pointer">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="flex flex-col gap-3">
        <!-- Open Lot Volume Banner -->
        <div class="flex justify-between items-center bg-background/50 border border-primary-border p-2.5 rounded-lg text-xs">
          <span class="text-secondary-text font-medium">Open Lot Volume:</span>
          <span class="font-bold font-mono text-primary-text">{{ totalLot }} Lots</span>
        </div>

        <!-- Choice: Full Close vs Partial Close -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-secondary-text">Close Option</label>
          <div class="grid grid-cols-2 gap-2 bg-background border border-primary-border p-1 rounded-xl">
            <button 
              type="button"
              @click="closeType = 'full'"
              class="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="closeType === 'full' ? 'bg-[#EA4335] text-white shadow' : 'text-secondary-text hover:text-primary-text'"
            >
              <span>Full Close</span>
            </button>
            <button 
              type="button"
              @click="closeType = 'partial'"
              class="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="closeType === 'partial' ? 'bg-primary text-black shadow' : 'text-secondary-text hover:text-primary-text'"
            >
              <span>Partial Close</span>
            </button>
          </div>
        </div>

        <!-- Partial Volume Input (Visible when Partial Close is selected) -->
        <div v-if="closeType === 'partial'" class="flex flex-col gap-1 mt-1">
          <label class="text-xs font-semibold text-secondary-text">Enter Volume to Close (Lots)</label>
          <input 
            v-model.number="partialVolume" 
            type="number" 
            step="0.01"
            min="0.01"
            :max="totalLot"
            placeholder="e.g. 0.01"
            class="w-full bg-background border border-primary-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary text-primary-text"
          />
          <span class="text-[10px] text-secondary-text opacity-80">
            Must be less than or equal to {{ totalLot }} Lots.
          </span>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-primary-border">
        <button 
          @click="$emit('close')" 
          class="px-3 py-1.5 rounded-lg border border-primary-border text-xs font-semibold text-secondary-text hover:text-primary-text cursor-pointer"
        >
          Cancel
        </button>

        <!-- Submit Button -->
        <button 
          @click="handleConfirm" 
          :disabled="closing || (closeType === 'partial' && (!partialVolume || partialVolume <= 0 || partialVolume > totalLot))"
          class="px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :class="closeType === 'full' ? 'bg-[#EA4335] text-white hover:bg-[#EA4335]/90' : 'bg-primary text-black hover:bg-primary/90'"
        >
          <Loader2 v-if="closing" class="h-3.5 w-3.5 animate-spin" />
          <span v-if="closeType === 'full'">Close All {{ totalLot }} Lots</span>
          <span v-else>Close {{ partialVolume || 0 }} Lots</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { XCircle, X, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  ticket: { type: [Number, String], default: '' },
  totalLot: { type: [Number, String], default: 0 },
  closing: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])

const closeType = ref('full') // 'full' or 'partial'
const partialVolume = ref(null)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    closeType.value = 'full'
    partialVolume.value = null
  }
}, { immediate: true })

const handleConfirm = () => {
  if (closeType.value === 'full') {
    emit('submit', {
      comment: 'Manually closed'
    })
  } else {
    if (!partialVolume.value || partialVolume.value <= 0) return
    emit('submit', {
      volume: Number(partialVolume.value),
      comment: 'Manual Partial Close'
    })
  }
}
</script>
