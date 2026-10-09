<template>
  <div
    class="relative w-full h-full bg-auth-side-bg text-white flex flex-col justify-center items-center overflow-hidden select-none px-4 sm:px-6 lg:px-8 border-l border-white/5"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
  >
    <!-- Background Ambient Glow for Depth -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[90px] pointer-events-none"
    />

    <!-- Main Slide Content Container with Smooth Vue Transition -->
    <transition name="fade-slide" mode="out-in">
      <div
        v-if="currentSlide"
        :key="currentSlideIndex + '-' + (isFm ? 'fm' : 'client')"
        class="relative z-10 w-full max-w-[340px] xl:max-w-[380px] flex flex-col items-center text-center my-auto py-4"
      >
        <!-- 3D Center Illustration with Float Animation & Shadow -->
        <div class="relative w-full flex items-center justify-center min-h-[180px] sm:min-h-[220px] lg:min-h-[240px]">
          <img
            v-if="currentSlide?.url"
            :src="currentSlide.url"
            :alt="currentSlide?.title || 'Panther Capitals Promotion'"
            class="max-w-[220px] sm:max-w-[260px] lg:max-w-[280px] max-h-[32vh] lg:max-h-[36vh] w-auto h-auto object-contain select-none pointer-events-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)] animate-float"
            loading="eager"
            fetchpriority="high"
          />
        </div>

        <!-- Slide Title -->
        <h2 class="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight leading-snug mt-5 sm:mt-6">
          {{ currentSlide?.title }}
        </h2>

        <!-- Slide Description with Highlight Formatting -->
        <p
          class="text-xs sm:text-[13px] text-white/80 font-normal leading-relaxed mt-2 max-w-[300px] sm:max-w-[340px] mx-auto"
          v-html="formattedDescription"
        />

        <!-- Pagination Bars (Indicators) -->
        <div v-if="slides.length > 1" class="flex items-center justify-center gap-1.5 mt-5 sm:mt-6">
          <button
            v-for="(slide, idx) in slides"
            :key="slide.id || idx"
            type="button"
            class="h-1 rounded-full transition-all duration-300 cursor-pointer"
            :class="
              currentSlideIndex === idx
                ? 'w-8 bg-white'
                : 'w-5 bg-white/20 hover:bg-white/40'
            "
            :aria-label="`Go to slide ${idx + 1}`"
            @click="setSlide(idx)"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import apiRequest from "@/api/request";
import urls from "@/api/urls";

const props = defineProps({
  role: {
    type: String,
    default: null,
  },
  group: {
    type: String,
    default: null,
  },
});

const route = useRoute();

const slides = ref([]);
const currentSlideIndex = ref(0);
const loading = ref(false);
let timer = null;

// Determine if the current context is for Fund Manager (fm) or Client
const isFm = computed(() => {
  const propRole = String(props.role || "").toLowerCase();
  const propGroup = String(props.group || "").toLowerCase();
  if (
    propRole === "fm" ||
    propRole === "fundmanager" ||
    propRole === "fund-manager" ||
    propGroup === "fm"
  ) {
    return true;
  }

  const queryRole = String(route.query.role || "").toLowerCase();
  const queryGroup = String(route.query.group || "").toLowerCase();
  if (
    queryRole === "fm" ||
    queryRole === "fundmanager" ||
    queryRole === "fund-manager" ||
    queryGroup === "fm"
  ) {
    return true;
  }

  const path = String(route.path || "").toLowerCase();
  if (path.includes("/fm-") || path.includes("/fund-manager")) {
    return true;
  }

  return false;
});

const currentSlide = computed(() => {
  if (!slides.value || slides.value.length === 0) return null;
  return slides.value[currentSlideIndex.value] || slides.value[0] || null;
});

// Format description with highlighted emphasis (e.g. bold $30 Free Credit or **markdown**)
const formattedDescription = computed(() => {
  const desc = currentSlide.value?.description || "";
  if (!desc) return "";

  let escaped = desc
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold markdown syntax: **text**
  escaped = escaped.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-bold text-white">$1</strong>'
  );

  // Bold common highlight phrases like "$30 Free Credit"
  escaped = escaped.replace(
    /(\$\d+(?:\.\d+)?\s+Free\s+Credit)/gi,
    '<strong class="font-bold text-white">$1</strong>'
  );

  return escaped;
});

const startSlideTimer = () => {
  if (timer) clearInterval(timer);
  if (slides.value.length > 1) {
    timer = setInterval(() => {
      currentSlideIndex.value = (currentSlideIndex.value + 1) % slides.value.length;
    }, 5000);
  }
};

const pauseTimer = () => {
  if (timer) clearInterval(timer);
};

const resumeTimer = () => {
  startSlideTimer();
};

const setSlide = (idx) => {
  currentSlideIndex.value = idx;
  startSlideTimer();
};

// Fetch images from API: /landing-images?group=fm for FM, and /landing-images for client
const fetchLandingImages = () => {
  loading.value = true;

  const requestOptions = {
    isTokenRequired: false,
    role: isFm.value ? "fm" : "client",
  };

  // For FM send group=fm; for client, do not send group
  if (isFm.value) {
    requestOptions.params = { group: "fm" };
  }

  const onSuccess = (res) => {
    loading.value = false;
    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : Array.isArray(res)
      ? res
      : [];

    slides.value = rawList;
    currentSlideIndex.value = 0;
    startSlideTimer();
  };

  const onFailure = (err) => {
    loading.value = false;
    console.warn("Failed to fetch landing images:", err);
    slides.value = [];
    currentSlideIndex.value = 0;
    if (timer) clearInterval(timer);
  };

  apiRequest(urls.KEYS.GET, urls.auth.landingImages, {
    ...requestOptions,
    onSuccess,
    onFailure,
  });
};

// Re-fetch when role or group context changes
watch(
  () => [props.role, props.group, route.query.role, route.query.group],
  () => {
    fetchLandingImages();
  },
  { deep: true }
);

onMounted(() => {
  fetchLandingImages();
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-float {
  animation: float 4.5s ease-in-out infinite;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>
