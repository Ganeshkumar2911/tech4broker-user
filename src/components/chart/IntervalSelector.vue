<script setup>
import { Maximize2 } from 'lucide-vue-next';

defineProps({
  intervals: {
    type: Array,
    default: () => [
      { label: '1 m', shortLabel: '1m', value: 'minute' },
      { label: '3 m', shortLabel: '3m', value: '3minute' },
      { label: '5 m', shortLabel: '5m', value: '5minute' },
      { label: '15 m', shortLabel: '15m', value: '15minute' },
      { label: '30 m', shortLabel: '30m', value: '30minute' },
      { label: '60 m', shortLabel: '60m', value: '60minute' },
      { label: '1 D', shortLabel: '1D', value: 'day' },
    ]
  },
  selectedInterval: {
    type: Object,
    default: () => ({ label: '1 m', shortLabel: '1m', value: 'minute' })
  },
  isFullscreen: {
    type: Boolean,
    default: false
  },
  ohlcData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['select', 'toggleFullscreen']);
</script>

<template>
  <div class="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 text-xs bg-white dark:bg-[#0B0F19] select-none gap-2">
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      <button
        v-for="item in intervals"
        :key="item.value"
        type="button"
        @click="emit('select', item)"
        class="px-2.5 h-7 min-w-[32px] flex items-center justify-center rounded-md font-semibold transition-colors cursor-pointer shrink-0 text-xs"
        :class="
          selectedInterval?.value === item.value
            ? 'bg-[#11182A] text-white dark:bg-blue-600 dark:text-white'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        "
      >
        {{ item.shortLabel }}
      </button>
    </div>

    <!-- Fullscreen Mode Toggle Button (Shown in normal view) -->
    <button
      v-if="!isFullscreen"
      type="button"
      @click="emit('toggleFullscreen')"
      title="Toggle Fullscreen Chart Zoom"
      class="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-[#0F1424] dark:text-white transition-colors cursor-pointer shrink-0 ml-2"
    >
      <Maximize2 class="w-3.5 h-3.5" />
    </button>
  </div>
</template>
