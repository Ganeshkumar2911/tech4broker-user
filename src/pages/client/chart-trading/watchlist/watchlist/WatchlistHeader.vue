<template>
  <div class="flex flex-col gap-2 p-2.5 border-b border-primary-border bg-background/40 select-none">
    <!-- Row 1: Watchlist Tabs & Fixed Settings Button -->
    <div class="flex items-center justify-between gap-2 overflow-hidden">
      <!-- Left: Scrollable Watchlist Tabs -->
      <div ref="tabContainerRef" @scroll="updateIndicator"
        class="relative flex items-center gap-6 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0">
        <button v-for="wl in watchlistStore.watchlists" :key="wl.id" :ref="(el) => setTabRef(el, wl.id)"
          @click="handleWatchlistChange(wl.id)"
          class="text-md lg:text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer shrink-0 py-2"
          :class="watchlistStore.activeWatchlistId === wl.id ? 'text-primary-yellow' : 'text-secondary-text hover:text-primary-text'">
          <span>{{ wl.name }}</span>
        </button>

        <!-- Dynamic Traveling Underline Indicator -->
        <span
          class="absolute bottom-1 h-[2px] bg-primary rounded-full transition-all duration-300 ease-out pointer-events-none"
          :style="{ left: indicatorStyle.left, width: indicatorStyle.width }" />
      </div>

      <!-- Right: Fixed Settings Button -->
      <div class="flex items-center gap-1 shrink-0 bg-background/80 p-0.5 rounded-lg ">
        <button @click="$emit('open-manage-watchlist')"
          class="p-1.5 hover:bg-card-background text-secondary-text hover:text-primary rounded-md transition-colors cursor-pointer"
          title="Manage Watchlists">
          <Bolt class="w-6 lg:w-4 lg:h-4 h-6" />
        </button>
      </div>
    </div>

    <!-- Row 2: Search Input with Embedded Add Symbol Button on Right -->
    <div class="relative flex items-center w-full">
      <BaseSearch :model-value="searchQuery" placeholder="Filter current symbols..." rounded="lg" variant="background"
        container-class="w-full" input-class="pr-9 text-[14px] p-20"
        @update:modelValue="$emit('update:searchQuery', $event)" @clear="$emit('update:searchQuery', '')" />

      <!-- Fixed Add Symbol Plus Button inside right side of search input -->
      <button @click="$emit('open-add-symbol')"
        class="absolute right-1.5 p-1  text-primary transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 z-10"
        title="Add Symbol to Watchlist">
        <Plus class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Bolt, Plus, Settings } from 'lucide-vue-next'
import BaseSearch from '@/components/base/BaseSearch.vue'
import { useWatchlistStore } from '@/stores/client/watchlist'

const props = defineProps({
  searchQuery: { type: String, default: '' }
})

const emit = defineEmits([
  'update:searchQuery',
  'open-add-symbol',
  'open-create-watchlist',
  'open-manage-watchlist'
])

const watchlistStore = useWatchlistStore()

const tabContainerRef = ref(null)
const tabRefs = ref({})

const setTabRef = (el, id) => {
  if (el) {
    tabRefs.value[id] = el
  }
}

const indicatorStyle = ref({
  left: '0px',
  width: '0px'
})

const updateIndicator = () => {
  const activeId = watchlistStore.activeWatchlistId
  const activeEl = tabRefs.value[activeId]
  const containerEl = tabContainerRef.value

  if (activeEl && containerEl) {
    const activeRect = activeEl.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()

    const left = activeRect.left - containerRect.left + containerEl.scrollLeft
    const width = activeRect.width

    indicatorStyle.value = {
      left: `${left}px`,
      width: `${width}px`
    }
  }
}

const handleWatchlistChange = (id) => {
  if (id && watchlistStore.activeWatchlistId !== id) {
    watchlistStore.fetchWatchlistDetail(id)
  }
}

watch(
  () => watchlistStore.activeWatchlistId,
  () => {
    nextTick(updateIndicator)
  },
  { immediate: true }
)

watch(
  () => watchlistStore.watchlists,
  () => {
    nextTick(updateIndicator)
  },
  { deep: true }
)

onMounted(() => {
  nextTick(updateIndicator)
  window.addEventListener('resize', updateIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIndicator)
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
