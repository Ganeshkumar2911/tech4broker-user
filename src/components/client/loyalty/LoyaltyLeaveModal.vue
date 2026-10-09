<script setup>
import { ref, watch } from 'vue'
import { X, AlertTriangle, Loader2, LogOut } from 'lucide-vue-next'
import { useLoyaltyStore } from '@/stores/client/loyalty'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  program: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['close', 'left'])

const loyaltyStore = useLoyaltyStore()
const leaveReason = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      leaveReason.value = ''
    }
  }
)

const closeModal = () => {
  emit('close')
}

const handleConfirmLeave = () => {
  const progId = props.program?.id || loyaltyStore.selectedProgramId
  if (!progId) return

  loyaltyStore.leaveProgram(
    {
      program_id: progId,
      reason: leaveReason.value.trim() || 'User requested leave',
    },
    '',
    () => {
      emit('left')
      closeModal()
    }
  )
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
  >
    <div
      class="bg-card-background w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border-0"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-primary-border/20 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
            <LogOut class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-primary-text">Leave Loyalty Program</h3>
            <p class="text-xs text-secondary-text">{{ program?.name || 'Loyalty Program' }}</p>
          </div>
        </div>
        <button
          @click="closeModal"
          class="text-secondary-text hover:text-primary-text p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-4 sm:p-6 space-y-4 overflow-y-auto">
        <!-- Warning Notice -->
        <div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-1.5">
          <div class="flex items-center gap-2 font-bold">
            <AlertTriangle class="w-4 h-4 text-red-400 shrink-0" />
            <span>Are you sure you want to de-enroll?</span>
          </div>
          <p class="text-[11px] text-red-200/80 leading-relaxed">
            Leaving this program will pause automated points earning on new closed trades. Your existing points in the central wallet are safe and you can re-join anytime.
          </p>
        </div>

        <!-- Optional Reason Input -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-primary-text">
            Reason for leaving <span class="text-secondary-text font-normal">(optional)</span>
          </label>
          <textarea
            v-model="leaveReason"
            rows="2"
            placeholder="Tell us why you're leaving this program..."
            class="w-full px-4 py-3 text-xs rounded-xl bg-background text-primary-text outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-secondary-text/50 resize-none"
          />
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-2 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-primary-border/20 bg-background/50 shrink-0">
        <button
          type="button"
          @click="closeModal"
          class="h-10 px-5 text-xs font-semibold text-secondary-text hover:text-primary-text rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Stay in Program
        </button>
        <button
          type="button"
          :disabled="loyaltyStore.isDeenrolling"
          @click="handleConfirmLeave"
          class="inline-flex items-center gap-1.5 h-10 px-5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="loyaltyStore.isDeenrolling" class="w-3.5 h-3.5 animate-spin" />
          <LogOut v-else class="w-3.5 h-3.5" />
          <span>{{ loyaltyStore.isDeenrolling ? 'Leaving...' : 'Confirm Leave' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
