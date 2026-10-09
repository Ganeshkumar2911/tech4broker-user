<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    @click.self="emit('close')"
  >
    <div
      class="bg-card-background rounded-2xl border border-primary-border w-full max-w-md shadow-2xl overflow-hidden"
    >
      <div
        class="px-6 py-4 border-b border-primary-border flex items-center justify-between"
      >
        <h2 class="text-sm font-bold text-primary-text">Edit Additional Agent</h2>
        <button
          class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-secondary-text hover:text-primary-text cursor-pointer"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="px-6 py-5 space-y-4">
        <div>
          <p class="text-xs text-secondary-text mb-1">Trading Account</p>
          <p class="text-sm font-bold text-primary-text">{{ formatAgentAccount(agent) }}</p>
          <p class="text-xs text-secondary-text mt-0.5">{{ agent?.broker_label || '—' }}</p>
        </div>

        <div>
          <p class="text-xs text-secondary-text mb-1.5">Share Percentage (%)</p>
          <input
            v-model.number="form.share_percentage"
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 25"
            class="w-full px-3 py-2.5 rounded-lg bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text"
          />
          <p class="text-[11px] text-secondary-text mt-1">
            Enter a percentage between 0-100% for the agent's share.
          </p>
        </div>

        <div class="flex items-center justify-between px-3.5 py-3 bg-background border border-primary-border rounded-xl">
          <div>
            <p class="text-xs font-semibold text-primary-text">Agent Status</p>
            <p class="text-[11px] text-secondary-text">Enable or disable this agent.</p>
          </div>
          <button
            type="button"
            class="relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer"
            :class="form.is_active ? 'bg-button' : 'bg-background border border-primary-border'"
            @click="form.is_active = !form.is_active"
          >
            <span
              class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform duration-200"
              :class="form.is_active ? 'translate-x-5 bg-button-text' : 'translate-x-0 bg-secondary-text'"
            />
          </button>
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
          :disabled="loading || !isValid"
          class="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-button text-button-text hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          @click="submit"
        >
          <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ loading ? 'Saving...' : 'Save Changes' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X, Users, Loader2 } from 'lucide-vue-next'
import { useFmOffersStore } from '@/stores/fm/offers'
import { useSnackbarStore } from '@/stores/shared/snackbar'

const props = defineProps({
  open: { type: Boolean, default: false },
  offerId: { type: [String, Number], required: true },
  agent: { type: Object, default: null },
})

const emit = defineEmits(['close'])
const store = useFmOffersStore()
const snackbar = useSnackbarStore()

const form = ref({
  share_percentage: null,
  is_active: true,
})

const loading = computed(() => store.updateAgentLoading)

const formatAgentAccount = (agent) => {
  return agent?.trading_account_id
    ?? agent?.account_number
    ?? agent?.trading_account?.account_number
    ?? '—'
}

const isValid = computed(() => {
  const sharePercentage = Number(form.value.share_percentage)
  return Number.isFinite(sharePercentage) && sharePercentage >= 0 && sharePercentage <= 100
})

watch(
  () => props.open,
  (val) => {
    if (!val) return
    form.value = {
      share_percentage: props.agent?.share_percentage ?? null,
      is_active: props.agent?.is_active ?? true,
    }
  }
)

watch(
  () => props.agent,
  (agent) => {
    if (!props.open || !agent) return
    form.value = {
      share_percentage: agent.share_percentage ?? null,
      is_active: agent.is_active ?? true,
    }
  },
  { deep: true }
)

const submit = () => {
  if (!isValid.value) return
  if (!props.agent?.id) return

  const payload = {
    share_percentage: Number(form.value.share_percentage),
    is_active: Boolean(form.value.is_active),
  }

  store.updateAgent(props.offerId, props.agent.id, payload, () => {
    snackbar.show('Agent updated successfully.', 'success')
    emit('close')
  })
}
</script>
