<script setup>
import { computed, ref, watch } from 'vue'
import { X, SlidersHorizontal, Loader2 } from 'lucide-vue-next'
import { useFollowedFundManagersStore } from '@/stores/fm/followedFundManagers'
import { getAvatar } from '@/utils/avtar.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

const emit = defineEmits(['close', 'success'])

const store = useFollowedFundManagersStore()

const lotType = ref('fixed')
const lotValue = ref(0.01)

const fmName = computed(() => {
  return props.item?.fund_manager?.name || props.item?.label_name || 'Unnamed FM'
})

const fmId = computed(() => {
  return props.item?.fund_manager?.id || props.item?.fm_id || props.item?.id || '—'
})

const accountNumber = computed(() => {
  return (
    props.item?.account?.account_number ||
    props.item?.following_account_number ||
    props.item?.trading_account_id ||
    props.item?.account_id ||
    '—'
  )
})

const brokerLabel = computed(() => {
  return props.item?.account?.broker_label || props.item?.account?.server || ''
})

const currency = computed(() => {
  return (
    props.item?.fund_manager?.broker_currency ||
    props.item?.broker_currency ||
    props.item?.account?.broker_currency ||
    'USD'
  )
})

const currentLotType = computed(() => {
  return props.item?.lot_type ?? 'fixed'
})

const currentLotValue = computed(() => {
  return props.item?.lot_value != null ? props.item.lot_value : 1
})

const isValid = computed(() => {
  const val = Number(lotValue.value)
  return !isNaN(val) && val >= 0.01
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      lotType.value = props.item?.lot_type || 'fixed'
      lotValue.value =
        props.item?.lot_value != null ? Number(props.item.lot_value) : 0.01
    }
  },
  { immediate: true }
)

const handleClose = () => {
  if (store.actionLoading) return
  emit('close')
}

const submitUpdateLot = () => {
  if (!isValid.value || store.actionLoading || !props.item?.id) return

  store.updateLotValue(
    props.item.id,
    {
      lot_type: lotType.value,
      lot_value: Number(lotValue.value),
    },
    () => {
      emit('success')
      emit('close')
    }
  )
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    @click="handleClose"
  >
    <div
      class="w-full max-w-md rounded-2xl bg-card-background shadow-2xl overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-primary-border px-6 py-4">
        <div>
          <h2 class="text-sm font-semibold text-primary-text leading-tight">Edit Lot Value</h2>
          <p class="text-[11px] text-secondary-text">Adjust copy multiplier or fixed lot volume</p>
        </div>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-background text-secondary-text hover:text-primary-text cursor-pointer"
          @click="handleClose"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="space-y-4 px-6 py-5">
        <!-- FM & Account Context Card -->
        <div class="rounded-xl bg-background p-3.5 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                :src="getAvatar(fmId)"
                :alt="fmName"
                class="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="text-xs font-bold text-primary-text truncate">{{ fmName }}</p>
                <span class="px-1.5 py-0.2 rounded bg-card-background border border-primary-border text-[9px] font-bold text-secondary-text uppercase">
                  {{ currency }}
                </span>
              </div>
              <p class="text-[11px] text-secondary-text font-mono truncate">
                Account: #{{ accountNumber }} <span v-if="brokerLabel" class="font-sans">({{ brokerLabel }})</span>
              </p>
            </div>
          </div>

          <div class="border-t border-primary-border/60 pt-2.5 flex items-center justify-between text-xs">
            <span class="text-secondary-text text-[11px]">Current Setting:</span>
            <span class="font-bold text-primary-text capitalize text-[11px]">
              {{ currentLotValue }}{{ currentLotType === 'multiplier' ? 'x' : ' Lots' }} ({{ currentLotType }})
            </span>
          </div>
        </div>

        <!-- Lot Type Selection -->
        <div>
          <label class="block text-xs font-medium text-secondary-text mb-1.5">Lot Type</label>
          <div class="flex gap-2.5">
            <button
              type="button"
              @click="lotType = 'fixed'"
              :class="[
                'flex-1 px-4 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-0',
                lotType === 'fixed'
                  ? 'bg-button text-button-text'
                  : 'bg-background border border-primary-border text-secondary-text hover:text-primary-text hover:bg-background/80'
              ]"
            >
              Fixed
            </button>
            <button
              type="button"
              @click="lotType = 'multiplier'"
              :class="[
                'flex-1 px-4 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-0',
                lotType === 'multiplier'
                  ? 'bg-button text-button-text'
                  : 'bg-background border border-primary-border text-secondary-text hover:text-primary-text hover:bg-background/80'
              ]"
            >
              Multiplier
            </button>
          </div>
        </div>

        <!-- Lot Value Input -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-medium text-secondary-text">
              {{ lotType === 'multiplier' ? 'Multiplier Value' : 'Fixed Lot Value' }}
            </label>
            <span class="text-[10px] text-secondary-text">Min: 0.01</span>
          </div>
          <div class="relative">
            <input
              v-model.number="lotValue"
              type="number"
              min="0.01"
              step="0.01"
              class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-primary-border text-primary-text text-xs focus:outline-none font-mono"
              :placeholder="lotType === 'multiplier' ? 'e.g. 1.00 (multiplier)' : 'e.g. 0.01 (lots)'"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-secondary-text pointer-events-none">
              {{ lotType === 'multiplier' ? 'x' : 'Lots' }}
            </span>
          </div>
          <p class="text-[11px] text-secondary-text mt-1.5 leading-relaxed">
            <template v-if="lotType === 'fixed'">
              Trades will be copied with a fixed volume of <strong class="text-primary-text font-mono">{{ Number(lotValue || 0).toFixed(2) }} lots</strong>.
            </template>
            <template v-else>
              Trades will be proportionally scaled by <strong class="text-primary-text font-mono">{{ Number(lotValue || 0).toFixed(2) }}x</strong>.
            </template>
          </p>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex gap-3 border-t border-primary-border px-6 py-4 bg-card-background">
        <button
          type="button"
          class="flex-1 rounded-full border border-primary-border px-4 py-2.5 text-xs font-medium text-secondary-text transition-colors hover:bg-background hover:text-primary-text disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          :disabled="store.actionLoading"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="flex-1 rounded-full bg-button px-4 py-2.5 text-xs font-bold text-button-text transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          :disabled="store.actionLoading || !isValid"
          @click="submitUpdateLot"
        >
          <Loader2 v-if="store.actionLoading" class="h-3.5 w-3.5 animate-spin" />
          <span>{{ store.actionLoading ? 'Saving...' : 'Update Lot Value' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
