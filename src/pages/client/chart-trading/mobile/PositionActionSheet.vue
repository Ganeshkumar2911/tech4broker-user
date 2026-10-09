<script setup>
import { ref, computed } from 'vue'
import { X, ChevronsRight } from 'lucide-vue-next'

const props = defineProps({
  position: {
    type: Object,
    required: true
  },
  liveBid: {
    type: Number,
    default: null
  },
  liveAsk: {
    type: Number,
    default: null
  },
  isDraftSlActive: {
    type: Boolean,
    default: false
  },
  isDraftTpActive: {
    type: Boolean,
    default: false
  },
  draftSlValue: {
    type: [Number, String],
    default: null
  },
  draftTpValue: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['close', 'closePosition', 'toggleDraftSl', 'toggleDraftTp'])

// Helper getters
const side = computed(() => {
  const t = String(props.position?.type || props.position?.action || props.position?.side || 'BUY').toUpperCase()
  return t.includes('SELL') ? 'SELL' : 'BUY'
})

const slDisplayValue = computed(() => {
  if (props.draftSlValue !== null && props.draftSlValue !== undefined && Number(props.draftSlValue) > 0) {
    const num = Number(props.draftSlValue)
    return num > 100 ? num.toFixed(2) : num.toFixed(4)
  }
  const sl = props.position?.price_sl ?? props.position?.sl ?? props.position?.stop_loss
  if (sl !== undefined && sl !== null && Number(sl) > 0) {
    const num = Number(sl)
    return num > 100 ? num.toFixed(2) : num.toFixed(4)
  }
  return null
})

const tpDisplayValue = computed(() => {
  if (props.draftTpValue !== null && props.draftTpValue !== undefined && Number(props.draftTpValue) > 0) {
    const num = Number(props.draftTpValue)
    return num > 100 ? num.toFixed(2) : num.toFixed(4)
  }
  const tp = props.position?.price_tp ?? props.position?.tp ?? props.position?.take_profit
  if (tp !== undefined && tp !== null && Number(tp) > 0) {
    const num = Number(tp)
    return num > 100 ? num.toFixed(2) : num.toFixed(4)
  }
  return null
})

const hasSl = computed(() => {
  return slDisplayValue.value !== null || props.isDraftSlActive
})

const hasTp = computed(() => {
  return tpDisplayValue.value !== null || props.isDraftTpActive
})

function handleSlClick() {
  emit('toggleDraftSl')
}

function handleTpClick() {
  emit('toggleDraftTp')
}

// Swipe to Close slider logic
const sliderTrackRef = ref(null)
const sliderDragX = ref(0)
const isDraggingSlider = ref(false)
let startX = 0

function startSliderDrag(e) {
  isDraggingSlider.value = true
  startX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0

  window.addEventListener('pointermove', moveSliderDrag)
  window.addEventListener('pointerup', endSliderDrag)
  window.addEventListener('touchmove', moveSliderDrag, { passive: false })
  window.addEventListener('touchend', endSliderDrag)
}

function moveSliderDrag(e) {
  if (!isDraggingSlider.value || !sliderTrackRef.value) return
  const currentX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
  const deltaX = currentX - startX
  const trackWidth = sliderTrackRef.value.getBoundingClientRect().width
  const maxDrag = Math.max(0, trackWidth - 40)

  sliderDragX.value = Math.max(0, Math.min(deltaX, maxDrag))
}

function endSliderDrag() {
  if (!isDraggingSlider.value || !sliderTrackRef.value) return
  isDraggingSlider.value = false

  window.removeEventListener('pointermove', moveSliderDrag)
  window.removeEventListener('pointerup', endSliderDrag)
  window.removeEventListener('touchmove', moveSliderDrag)
  window.removeEventListener('touchend', endSliderDrag)

  const trackWidth = sliderTrackRef.value.getBoundingClientRect().width
  const maxDrag = Math.max(0, trackWidth - 40)

  if (maxDrag > 0 && sliderDragX.value / maxDrag >= 0.65) {
    sliderDragX.value = maxDrag
    emit('closePosition')
    setTimeout(() => {
      sliderDragX.value = 0
    }, 400)
  } else {
    sliderDragX.value = 0
  }
}
</script>

<template>
  <div class="flex items-center gap-2 py-0.5 px-0.5 select-none w-full">
    <!-- 1. Close Button (X icon inside rounded square) -->
    <button
      type="button"
      @click="emit('close')"
      class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 shadow-xs flex items-center justify-center text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all cursor-pointer shrink-0"
      title="Close bar"
    >
      <X class="w-4 h-4 stroke-[2.5]" />
    </button>

    <!-- 2. Swipe to Close Slider Bar -->
    <div
      ref="sliderTrackRef"
      class="relative flex-1 h-10 bg-[#F4F5F7] dark:bg-slate-800/90 border border-gray-200/70 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden select-none touch-none"
    >
      <!-- Track Background Label -->
      <span class="text-[10px] font-extrabold text-[#9CA3AF] dark:text-slate-400 tracking-wider uppercase pointer-events-none select-none">
        SWIPE TO CLOSE
      </span>

      <!-- Red Swipe Thumb Button -->
      <div
        @pointerdown="startSliderDrag"
        @touchstart="startSliderDrag"
        :style="{ transform: `translateX(${sliderDragX}px)` }"
        class="absolute left-0.5 top-0.5 bottom-0.5 w-9 bg-[#E5484D] rounded-lg flex items-center justify-center text-white shadow-xs cursor-grab active:cursor-grabbing transition-transform duration-75 select-none touch-none z-10"
      >
        <ChevronsRight class="w-4 h-4 stroke-[2.5]" />
      </div>
    </div>

    <!-- 3. SL Button -->
    <button
      type="button"
      @click="handleSlClick"
      class="h-10 px-2 min-w-[50px] rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 border"
      :class="
        hasSl
          ? 'bg-[#E5484D] text-white border-[#E5484D] shadow-xs'
          : 'bg-white dark:bg-slate-800 text-[#E5484D] border-[#E5484D]/40 dark:border-[#E5484D]/60 hover:bg-red-50/50 dark:hover:bg-red-950/30'
      "
      title="Toggle Stop Loss line"
    >
      <template v-if="slDisplayValue">
        <span class="text-[8.5px] font-semibold opacity-90 leading-none">SL</span>
        <span class="text-[10px] font-extrabold tracking-tight mt-0.5 leading-none">{{ slDisplayValue }}</span>
      </template>
      <template v-else>
        <span class="text-xs font-extrabold">SL</span>
      </template>
    </button>

    <!-- 4. TP Button -->
    <button
      type="button"
      @click="handleTpClick"
      class="h-10 px-2 min-w-[50px] rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 border"
      :class="
        hasTp
          ? 'bg-[#12A879] text-white border-[#12A879] shadow-xs'
          : 'bg-white dark:bg-slate-800 text-[#12A879] border-[#12A879]/40 dark:border-[#12A879]/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
      "
      title="Toggle Take Profit line"
    >
      <template v-if="tpDisplayValue">
        <span class="text-[8.5px] font-semibold opacity-90 leading-none">TP</span>
        <span class="text-[10px] font-extrabold tracking-tight mt-0.5 leading-none">{{ tpDisplayValue }}</span>
      </template>
      <template v-else>
        <span class="text-xs font-extrabold">TP</span>
      </template>
    </button>
  </div>
</template>
