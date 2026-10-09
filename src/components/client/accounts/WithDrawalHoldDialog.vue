<script setup>
import { AlertCircle, X } from 'lucide-vue-next'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click="emit('close')"
    >
      <div
        class="w-full max-w-sm rounded-2xl border border-primary-border bg-card-background p-6 shadow-2xl relative text-center"
        @click.stop
      >
        <!-- Close button top-right -->
        <button
          type="button"
          class="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-background"
          @click="emit('close')"
        >
          <X class="h-4 w-4 text-secondary-text" />
        </button>

        <!-- Centered Alert Icon -->
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
          <AlertCircle class="h-6 w-6 text-red-500" />
        </div>

        <!-- Title -->
        <h3 class="text-sm font-semibold text-primary-text mb-2">Withdrawal Status</h3>

        <!-- Description Message -->
        <p class="text-xs text-secondary-text leading-relaxed mb-6">
          Currently We are unable to process this withdrawal,Please try later.
        </p>

        <!-- Action Button -->
        <button
          type="button"
          class="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-black transition-colors hover:opacity-90 cursor-pointer"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </Teleport>
</template>
