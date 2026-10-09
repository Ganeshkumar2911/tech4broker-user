<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
    @click.self="emit('close')"
  >
    <div class="bg-card-background rounded-2xl border border-primary-border w-full max-w-sm overflow-hidden shadow-2xl transition-all duration-200">
      <!-- Modal Header -->
      <div class="px-5 py-3.5 border-b border-primary-border flex items-center gap-3 bg-background/50">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="variantBg">
          <component :is="iconComponent" class="w-4 h-4" :class="variantText" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-extrabold text-primary-text truncate">{{ title }}</h2>
          <p v-if="subtitle" class="text-[11px] text-secondary-text mt-0.5 truncate">{{ subtitle }}</p>
        </div>
        <button @click="emit('close')" class="p-1 hover:bg-background rounded-lg text-secondary-text hover:text-primary-text transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body Message -->
      <div class="px-5 py-4 text-xs text-primary-text font-medium leading-relaxed">
        <slot>
          {{ message }}
        </slot>
      </div>

      <!-- Footer Buttons -->
      <div class="px-5 py-3 border-t border-primary-border flex gap-2.5 bg-background/30 justify-end">
        <button
          class="px-4 py-2 rounded-xl text-xs font-semibold text-secondary-text border border-primary-border hover:bg-background hover:text-primary-text transition-colors cursor-pointer"
          @click="emit('close')"
        >
          {{ cancelText }}
        </button>
        <button
          :disabled="loading"
          class="px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
          :class="confirmBtnClass"
          @click="emit('confirm')"
        >
          <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ loading ? 'Processing...' : confirmText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AlertTriangle, Trash2, Info, X, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  subtitle: { type: String, default: '' },
  message: { type: String, default: 'Are you sure you want to proceed?' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  variant: { type: String, default: 'danger' }, // 'danger' | 'warning' | 'info'
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'confirm'])

const iconComponent = computed(() => {
  if (props.variant === 'danger') return Trash2
  if (props.variant === 'warning') return AlertTriangle
  return Info
})

const variantBg = computed(() => {
  if (props.variant === 'danger') return 'bg-primary-red/10 border border-primary-red/20'
  if (props.variant === 'warning') return 'bg-amber-500/10 border border-amber-500/20'
  return 'bg-primary/10 border border-primary/20'
})

const variantText = computed(() => {
  if (props.variant === 'danger') return 'text-primary-red'
  if (props.variant === 'warning') return 'text-amber-500'
  return 'text-primary'
})

const confirmBtnClass = computed(() => {
  if (props.variant === 'danger') return 'bg-primary-red hover:bg-primary-red/90 text-white'
  if (props.variant === 'warning') return 'bg-amber-500 hover:bg-amber-600 text-black'
  return 'bg-primary hover:bg-primary/90 text-black'
})
</script>

<style scoped></style>
