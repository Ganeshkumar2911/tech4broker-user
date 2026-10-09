<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/60 z-[99998] backdrop-blur-xs"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="isOpen"
        class="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[99999] pointer-events-none p-0 sm:p-4 select-none"
      >
        <div
          class="w-full max-w-[440px] bg-card-background border border-primary-border rounded-t-[28px] sm:rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-primary-text pointer-events-auto"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-1">
            <h2 class="text-xl font-bold text-primary-text tracking-tight">
              {{ mode === 'edit' ? 'Edit Watchlist' : 'Create Watchlist' }}
            </h2>
            <button
              type="button"
              @click="emit('close')"
              class="w-8 h-8 rounded-full flex items-center justify-center text-secondary-text hover:text-primary-text hover:bg-primary-border/40 transition-colors cursor-pointer"
            >
              <X class="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          <!-- Form Body -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-secondary-text">
              Watchlist Name
            </label>
            <input
              ref="inputRef"
              v-model="name"
              type="text"
              placeholder="e.g. Stocks, Crypto, Metals"
              class="w-full input-field px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              @keyup.enter="handleSubmit"
            />
          </div>

          <!-- Action Button -->
          <div class="pt-2">
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!name.trim() || loading"
              class="w-full h-12 bg-button text-button-text active:scale-[0.99] disabled:opacity-50 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <span>{{ mode === 'edit' ? 'Update Watchlist' : 'Create Watchlist' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { useWatchlistStore } from '@/stores/client/watchlist'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  initialName: { type: String, default: '' },
  watchlistId: { type: [String, Number], default: null },
})

const emit = defineEmits(['close', 'success'])

const watchlistStore = useWatchlistStore()

const name = ref('')
const loading = ref(false)
const inputRef = ref(null)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      name.value = props.initialName || ''
      loading.value = false
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

const handleSubmit = async () => {
  const trimmed = name.value.trim()
  if (!trimmed || loading.value) return

  loading.value = true
  try {
    if (props.mode === 'edit' && props.watchlistId) {
      await watchlistStore.updateWatchlist(props.watchlistId, { name: trimmed })
    } else {
      await watchlistStore.createWatchlist(trimmed, false)
    }
    emit('success')
    emit('close')
  } catch (err) {
    console.error('Failed to save watchlist:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
@media (min-width: 640px) {
  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
