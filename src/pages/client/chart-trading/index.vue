<template>
  <div class="h-[calc(100vh-60px)] w-full overflow-hidden">
    <!-- Mobile View -->
    <MobileTradingLayout v-if="isMobileView" class="h-full w-full" />

    <!-- Desktop Layout -->
    <div v-else class="flex h-full w-full bg-background flex-col gap-2 relative p-2" ref="containerRef">
      <!-- Top Row: Watchlist (Left) vs Chart (Right) -->
      <div class="shrink-0 w-full flex items-stretch min-h-0 relative" :style="{ height: topRowHeight + '%' }">
        <!-- Left edge restore handle when Top Left is collapsed -->
        <div v-show="topLeftWidth === 0" @click="topLeftWidth = 25; saveLayout()"
          class="absolute left-0 top-0 bottom-0 w-2 hover:bg-blue-500/20 bg-white/5 cursor-pointer z-50 flex items-center justify-center group"
          title="Restore Watchlist">
          <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </div>

        <!-- Watchlist Column -->
        <div class="h-full min-h-0 select-none shrink-0 overflow-hidden" :style="{ width: topLeftWidth + '%' }"
          v-show="topLeftWidth > 0">
          <Watchlist class="h-full w-full" />
        </div>

        <!-- Top Row Splitter -->
        <div v-show="topLeftWidth > 0 && topLeftWidth < 100"
          class="w-2 hover:bg-blue-500/20 cursor-col-resize transition-all duration-150 shrink-0 bg-transparent flex items-center justify-center relative group z-10 h-full mx-px"
          @mousedown="startHorizontalDrag($event, 'top')">
          <div class="w-[1px] h-full bg-white/10 group-hover:bg-blue-500 transition-colors"></div>
          <div
            class="absolute bg-white/20 border border-white/10 group-hover:bg-blue-500 group-hover:border-blue-500 w-1 h-8 rounded transition-all duration-150">
          </div>
        </div>

        <!-- Chart Column -->
        <div class="min-w-0 h-full flex-1 relative" v-show="topLeftWidth < 100">
          <div class="absolute inset-0 overflow-hidden">
            <Chart class="h-full w-full" />
          </div>
        </div>
      </div>

      <!-- Horizontal Splitter (Drags vertically to resize top/bottom rows) -->
      <div
        class="h-2 hover:bg-blue-500/20 cursor-row-resize transition-all duration-150 shrink-0 bg-transparent flex flex-col items-center justify-center relative group z-10 w-full my-px select-none"
        @mousedown="startVerticalDrag($event)">
        <div class="h-[1px] w-full bg-white/10 group-hover:bg-blue-500 transition-colors"></div>
        <div
          class="absolute bg-white/20 border border-white/10 group-hover:bg-blue-500 group-hover:border-blue-500 h-1 w-8 rounded transition-all duration-150">
        </div>
      </div>

      <!-- Bottom Row: Trades Panel (Full Width) -->
      <div class="flex-1 w-full min-h-0 relative">
        <div class="absolute inset-0 overflow-hidden">
          <Trades class="h-full w-full" />
        </div>
      </div>

      <!-- Desktop Floating Movable Order Placement Modal -->
      <OrderPlacement v-if="isOrderModalOpen" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import useOrderStore from '@/stores/client/orders'

import Watchlist from './watchlist/index.vue'
import OrderPlacement from './order-placement/index.vue'
import Chart from './chart/index.vue'
import Trades from './trades/index.vue'
import MobileTradingLayout from './mobile/MobileTradingLayout.vue'

const orderStore = useOrderStore()
const { isOrderModalOpen } = storeToRefs(orderStore)

const isMobileView = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

const handleResize = () => {
  if (typeof window !== 'undefined') {
    isMobileView.value = window.innerWidth < 768
  }
}

const containerRef = ref(null)

// Layout width states (percentages)
const topLeftWidth = ref(25)
const bottomLeftWidth = ref(25)
const topRowHeight = ref(70) // defaults to 70% of screen height

// Persistence functions (uses v3 keys to prevent state conflicts)
const saveLayout = () => {
  localStorage.setItem('workspace_top_left_width_v3', topLeftWidth.value)
  localStorage.setItem('workspace_bottom_left_width_v3', bottomLeftWidth.value)
  localStorage.setItem('workspace_top_row_height_v3', topRowHeight.value)
}

const loadLayout = () => {
  try {
    const savedTop = localStorage.getItem('workspace_top_left_width_v3')
    if (savedTop !== null) {
      const parsed = parseFloat(savedTop)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        topLeftWidth.value = parsed
      }
    }
    const savedBottom = localStorage.getItem('workspace_bottom_left_width_v3')
    if (savedBottom !== null) {
      const parsed = parseFloat(savedBottom)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        bottomLeftWidth.value = parsed
      }
    }
    const savedRowHeight = localStorage.getItem('workspace_top_row_height_v3')
    if (savedRowHeight !== null) {
      const parsed = parseFloat(savedRowHeight)
      if (!isNaN(parsed) && parsed >= 20 && parsed <= 85) {
        topRowHeight.value = parsed
      }
    }
  } catch (e) {
    console.error('Error loading workspace layout sizes', e)
  }
}

// Drag & Resize Mechanics (Horizontal Splitters - width resizing)
const startHorizontalDrag = (event, rowType) => {
  event.preventDefault()
  if (!containerRef.value) return

  const containerRect = containerRef.value.getBoundingClientRect()

  // Calculate minimum width percentage equivalent to ~280px
  const minWidthPx = 340
  const minPct = Math.max(12, Math.min(25, (minWidthPx / containerRect.width) * 100))
  const collapseThreshold = minPct * 0.65 // Dragging past 65% of min width directly shrinks to 0

  const onMouseMove = (e) => {
    const relativeX = e.clientX - containerRect.left
    let pct = (relativeX / containerRect.width) * 100

    // Snap directly to 0 if dragged below collapse threshold, else stop at minPct
    if (pct < collapseThreshold) {
      pct = 0
    } else if (pct < minPct) {
      pct = minPct
    } else if (pct > 96) {
      pct = 100
    }

    if (rowType === 'top') {
      topLeftWidth.value = pct
    } else if (rowType === 'bottom') {
      bottomLeftWidth.value = pct
    }
    saveLayout()
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    document.body.classList.remove('select-none')
  }

  document.body.classList.add('select-none')
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// Drag & Resize Mechanics (Horizontal Divider - vertical row height resizing)
const startVerticalDrag = (event) => {
  event.preventDefault()
  if (!containerRef.value) return

  const containerRect = containerRef.value.getBoundingClientRect()

  const onMouseMove = (e) => {
    const relativeY = e.clientY - containerRect.top
    let pct = (relativeY / containerRect.height) * 100

    // Clamp between 20% and 85% to maintain usability of both rows
    pct = Math.max(20, Math.min(85, pct))

    topRowHeight.value = pct
    saveLayout()
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    document.body.classList.remove('select-none')
  }

  document.body.classList.add('select-none')
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

onMounted(() => {
  loadLayout()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
/* Scrollbars customization inside panels */
:deep(.no-scrollbar) {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;

  /* Firefox */
  &::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari and Opera */
  }
}
</style>