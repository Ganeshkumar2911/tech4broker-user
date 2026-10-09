<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  Play,
  Volume2,
  VolumeX,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

const props = defineProps({
  src: {
    type: [String, Array],
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
  alt: {
    type: String,
    default: 'Media',
  },
  autoplay: {
    type: Boolean,
    default: true,
  },
  autoSlide: {
    type: Boolean,
    default: true,
  },
  slideInterval: {
    type: Number,
    default: 3500, // 3.5 seconds for images
  },
  pauseOnHover: {
    type: Boolean,
    default: true,
  },
  loop: {
    type: Boolean,
    default: true,
  },
  muted: {
    type: Boolean,
    default: true,
  },
  showControls: {
    type: Boolean,
    default: false,
  },
  showArrows: {
    type: Boolean,
    default: true,
  },
  showDots: {
    type: Boolean,
    default: true,
  },
  mediaClass: {
    type: String,
    default: 'w-full h-full object-cover',
  },
})

// Normalize list of media URLs from src or items
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined'
}

const normalizedList = computed(() => {
  if (Array.isArray(props.items) && props.items.length > 0) {
    return props.items.filter(isValidUrl).map((s) => s.trim())
  }
  if (Array.isArray(props.src)) {
    return props.src.filter(isValidUrl).map((s) => s.trim())
  }
  if (isValidUrl(props.src)) {
    return [props.src.trim()]
  }
  return []
})

const currentIndex = ref(0)
const isHovered = ref(false)
const timer = ref(null)
const videoEndedWhileHovered = ref(false)

const currentSrc = computed(() => {
  if (!normalizedList.value.length) return ''
  return normalizedList.value[currentIndex.value] || ''
})

const isVideo = computed(() => {
  if (!currentSrc.value || typeof currentSrc.value !== 'string') return false
  const cleanUrl = currentSrc.value.split('?')[0].toLowerCase()
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl)
})

// Video Controls State
const videoRef = ref(null)
const isPlaying = ref(props.autoplay)
const isMutedState = ref(props.muted)

const togglePlay = () => {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play()
    isPlaying.value = true
  } else {
    videoRef.value.pause()
    isPlaying.value = false
  }
}

const toggleMute = () => {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isMutedState.value = videoRef.value.muted
}

// ─── Video Lifecycle Handlers ───────────────────────────────
const onVideoEnded = () => {
  if (normalizedList.value.length <= 1) {
    if (props.loop && videoRef.value) {
      videoRef.value.currentTime = 0
      videoRef.value.play()
    }
    return
  }

  // If currently hovered, delay slide transition until hover leaves
  if (isHovered.value) {
    videoEndedWhileHovered.value = true
  } else {
    nextSlide()
  }
}

const onVideoError = () => {
  // If video fails to load, fall back to slide interval so carousel doesn't stall
  if (normalizedList.value.length > 1) {
    timer.value = setTimeout(() => {
      nextSlide()
    }, props.slideInterval)
  }
}

// ─── Carousel Controls ──────────────────────────────────────
const nextSlide = () => {
  if (normalizedList.value.length <= 1) return
  videoEndedWhileHovered.value = false
  currentIndex.value = (currentIndex.value + 1) % normalizedList.value.length
}

const prevSlide = () => {
  if (normalizedList.value.length <= 1) return
  videoEndedWhileHovered.value = false
  currentIndex.value = (currentIndex.value - 1 + normalizedList.value.length) % normalizedList.value.length
}

const goToSlide = (idx) => {
  videoEndedWhileHovered.value = false
  currentIndex.value = idx
}

// ─── Auto-sliding & Pause-on-Hover Timer ─────────────────────
const startTimer = () => {
  stopTimer()
  if (!props.autoSlide || normalizedList.value.length <= 1 || isHovered.value) {
    return
  }

  // If current slide is a VIDEO, do NOT shift until video ends!
  if (isVideo.value) {
    nextTick(() => {
      if (videoRef.value && props.autoplay) {
        videoRef.value.play().catch(() => {})
      }
    })
    return
  }

  // For photos / images, advance after slideInterval (e.g. 3.5s)
  timer.value = setTimeout(() => {
    nextSlide()
  }, props.slideInterval)
}

const stopTimer = () => {
  if (timer.value) {
    clearTimeout(timer.value)
    timer.value = null
  }
}

const handleMouseEnter = () => {
  if (props.pauseOnHover) {
    isHovered.value = true
    stopTimer()
    if (videoRef.value && !videoRef.value.paused) {
      // Keep video playing or pause if needed; here we allow watching while hovered
    }
  }
}

const handleMouseLeave = () => {
  if (props.pauseOnHover) {
    isHovered.value = false
    if (videoEndedWhileHovered.value) {
      videoEndedWhileHovered.value = false
      nextSlide()
    } else {
      startTimer()
    }
  }
}

watch(
  currentIndex,
  () => {
    startTimer()
  }
)

watch(
  () => normalizedList.value.length,
  (len) => {
    if (currentIndex.value >= len) {
      currentIndex.value = 0
    }
    startTimer()
  }
)

onMounted(() => {
  startTimer()
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<template>
  <div
    class="relative w-full h-full min-h-0 overflow-hidden bg-background select-none group/carousel"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Media Content Display with smooth crossfade transition -->
    <transition name="fade">
      <div :key="currentSrc" class="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
        <!-- Video Player -->
        <template v-if="isVideo && currentSrc">
          <video
            ref="videoRef"
            :src="currentSrc"
            :autoplay="autoplay"
            :loop="normalizedList.length <= 1 && loop"
            :muted="muted"
            playsinline
            :class="[mediaClass, 'w-full h-full object-cover select-none pointer-events-auto']"
            @play="isPlaying = true"
            @pause="isPlaying = false"
            @ended="onVideoEnded"
            @error="onVideoError"
          />
          <!-- Optional Mini Video Controls Overlay -->
          <div
            v-if="showControls"
            class="absolute bottom-2 right-2 flex items-center gap-1.5 z-10"
            @click.stop
          >
            <button
              type="button"
              @click.stop="toggleMute"
              class="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-xs cursor-pointer text-xs"
              title="Toggle Audio"
            >
              <VolumeX v-if="isMutedState" class="w-3 h-3" />
              <Volume2 v-else class="w-3 h-3 text-primary" />
            </button>
            <button
              type="button"
              @click.stop="togglePlay"
              class="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-xs cursor-pointer text-xs"
              title="Play/Pause"
            >
              <Play v-if="!isPlaying" class="w-3 h-3 fill-current ml-0.5" />
              <span v-else class="text-2xs font-bold">||</span>
            </button>
          </div>
          <!-- Video Tag Indicator Badge -->
          <div class="absolute top-2.5 right-2.5 pointer-events-none z-10">
            <span class="px-2 py-0.5 text-3xs font-bold uppercase rounded-md bg-black/70 text-white backdrop-blur-xs border border-white/10 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Video
            </span>
          </div>
        </template>

        <!-- Image Viewer -->
        <template v-else-if="currentSrc">
          <img
            :src="currentSrc"
            :alt="alt"
            :class="[mediaClass, 'w-full h-full object-cover select-none']"
            loading="lazy"
          />
        </template>

        <!-- Empty Fallback -->
        <template v-else>
          <div class="w-full h-full flex flex-col items-center justify-center p-4 text-secondary-text/40 bg-card-background/40">
            <Package class="w-10 h-10 mb-1" />
            <span class="text-[11px] font-medium text-secondary-text/60">No Media</span>
          </div>
        </template>
      </div>
    </transition>

    <!-- Carousel Navigation Arrows (visible on hover if multiple items) -->
    <template v-if="showArrows && normalizedList.length > 1">
      <button
        type="button"
        @click.stop="prevSlide"
        class="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/85 transition-all opacity-0 group-hover/carousel:opacity-100 z-20 backdrop-blur-xs cursor-pointer shadow-md"
        title="Previous"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click.stop="nextSlide"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/85 transition-all opacity-0 group-hover/carousel:opacity-100 z-20 backdrop-blur-xs cursor-pointer shadow-md"
        title="Next"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </template>

    <!-- Carousel Indicator Dots -->
    <template v-if="showDots && normalizedList.length > 1">
      <div class="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        <button
          v-for="(_, idx) in normalizedList"
          :key="idx"
          type="button"
          @click.stop="goToSlide(idx)"
          class="h-1.5 rounded-full transition-all duration-200 cursor-pointer"
          :class="idx === currentIndex ? 'bg-primary w-4 shadow-xs' : 'bg-white/50 w-1.5 hover:bg-white/80'"
          :title="`Slide ${idx + 1}`"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
