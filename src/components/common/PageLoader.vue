<template>
  <Transition name="fade-loader">
    <div
      v-show="show"
      class="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background select-none transition-opacity duration-300"
    >
      <div class="relative flex flex-col items-center justify-center gap-2 px-4">
        <!-- Lottie Animation Container -->
        <div class="relative flex items-center justify-center">
          <div
            ref="container"
            class="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center pointer-events-none"
          ></div>
        </div>

        <!-- Title & Subtitle -->
        <div v-if="title || message" class="text-center space-y-1 z-10 -mt-6">
          <h3 v-if="title" class="text-sm font-bold text-primary-text tracking-wide">
            {{ title }}
          </h3>
          <p v-if="message" class="text-xs text-secondary-text font-medium">
            {{ message }}
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import lottie from "lottie-web/build/player/lottie_light.js";
import { useThemeStore } from "@/stores/shared/theme";
import yellowLoaderAnimation from "@/assets/lottie/panther_capital_loader_yellow.json";
import lightLoaderAnimation from "@/assets/lottie/panther_capital_loader_light-39_mode_yellow.json";

const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: "Loading Panther Capitals...",
  },
  message: {
    type: String,
    default: "Please wait...",
  },
});

const themeStore = useThemeStore();
const container = ref(null);
let animInstance = null;

const isDarkMode = computed(() => {
  return document.documentElement.classList.contains("dark") || themeStore.isDark;
});

function initLottie() {
  if (animInstance) {
    animInstance.destroy();
    animInstance = null;
  }
  if (container.value) {
    const animationData = isDarkMode.value
      ? yellowLoaderAnimation
      : lightLoaderAnimation;

    animInstance = lottie.loadAnimation({
      container: container.value,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData,
    });
  }
}

onMounted(() => {
  themeStore.init();
  nextTick(() => {
    initLottie();
  });
});

watch(
  () => isDarkMode.value,
  () => {
    initLottie();
  }
);

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        if (!animInstance) {
          initLottie();
        } else {
          animInstance.play();
        }
      });
    }
  }
);

onBeforeUnmount(() => {
  if (animInstance) {
    animInstance.destroy();
    animInstance = null;
  }
});
</script>

<style scoped>
.fade-loader-enter-active,
.fade-loader-leave-active {
  transition: opacity 0.35s ease;
}

.fade-loader-enter-from,
.fade-loader-leave-to {
  opacity: 0;
}
</style>
