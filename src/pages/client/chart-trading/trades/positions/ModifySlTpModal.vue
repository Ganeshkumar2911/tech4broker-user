<template>
  <div v-if="isOpen" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
    <div class="bg-card-background border border-primary-border rounded-xl p-4 w-full max-w-md shadow-2xl flex flex-col gap-4 text-primary-text">
      <div class="flex items-center justify-between border-b border-primary-border pb-3">
        <div class="flex items-center gap-2">
          <Pencil class="h-4 w-4 text-primary" />
          <h3 class="font-bold text-sm">Modify SL/TP — #{{ ticket }}</h3>
        </div>
        <button @click="$emit('close')" class="text-secondary-text hover:text-primary-text cursor-pointer">
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="flex flex-col gap-3">
        <!-- Stop Loss -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-secondary-text">Stop Loss (SL)</label>
          <input 
            v-model="form.sl" 
            type="number" 
            step="any"
            placeholder="Enter Stop Loss Price"
            class="w-full bg-background border border-primary-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary text-primary-text"
          />
        </div>

        <!-- Take Profit -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-secondary-text">Take Profit (TP)</label>
          <input 
            v-model="form.tp" 
            type="number" 
            step="any"
            placeholder="Enter Take Profit Price"
            class="w-full bg-background border border-primary-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary text-primary-text"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-primary-border">
        <button 
          @click="$emit('close')" 
          class="px-3 py-1.5 rounded-lg border border-primary-border text-xs font-semibold text-secondary-text hover:text-primary-text cursor-pointer"
        >
          Cancel
        </button>
        <button 
          @click="handleSubmit" 
          :disabled="submitting"
          class="px-4 py-1.5 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary/90 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <Loader2 v-if="submitting" class="h-3.5 w-3.5 animate-spin text-black" />
          <span>Update SL/TP</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Pencil, X, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  ticket: { type: [Number, String], default: '' },
  initialSl: { type: [Number, String], default: null },
  initialTp: { type: [Number, String], default: null },
  submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  sl: null,
  tp: null
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.sl = props.initialSl ?? null
    form.tp = props.initialTp ?? null
  }
}, { immediate: true })

const handleSubmit = () => {
  emit('submit', {
    sl: form.sl !== null && form.sl !== '' ? Number(form.sl) : undefined,
    tp: form.tp !== null && form.tp !== '' ? Number(form.tp) : undefined
  })
}
</script>
