<script setup>
import { computed } from "vue";
import { useThemeStore } from "@/stores/shared/theme";
import defaultLightImage from "@/assets/empty-state.png";
import defaultDarkImage from "@/assets/empty-state-dark.png";

const props = defineProps({
  title: {
    type: String,
    default: "Nothing here yet",
  },
  subtitle: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: null,
  },
  imageAlt: {
    type: String,
    default: "Empty state illustration",
  },
  imageClass: {
    type: String,
    default: "w-20 sm:w-24 md:w-28 lg:w-32 h-auto object-contain mb-2",
  },
});

const themeStore = useThemeStore();

const currentImage = computed(() => {
  if (props.image) return props.image;
  return themeStore.isDark ? defaultDarkImage : defaultLightImage;
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center w-full px-4 py-4 sm:py-6 text-center"
  >
    <img
      v-if="currentImage"
      :src="currentImage"
      :alt="imageAlt"
      :class="imageClass"
    />

    <div
      v-else-if="$slots.icon"
      class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-border flex items-center justify-center opacity-60 mb-3"
    >
      <slot name="icon" />
    </div>

    <h3 class="text-base sm:text-lg font-semibold text-primary-text">
      {{ title }}
    </h3>

    <p
      v-if="subtitle"
      class="mt-2 max-w-xs sm:max-w-sm text-xs sm:text-sm text-secondary-text leading-5"
    >
      {{ subtitle }}
    </p>

    <slot />
  </div>
</template>