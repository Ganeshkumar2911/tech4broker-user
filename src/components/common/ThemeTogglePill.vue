<template>
  <button
    @click="$emit('toggle', $event)"
    type="button"
    class="relative inline-flex h-9 w-[68px] items-center rounded-full p-1 border border-primary-border bg-card-background/90 shadow-none transition-all duration-300 focus:outline-none cursor-pointer group shrink-0 active:scale-95"
    :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
  >
    <!-- Background Sliding Indicator Pill -->
    <div
      class="absolute top-1 bottom-1 w-7 rounded-full transition-all duration-300 ease-out shadow-none flex items-center justify-center"
      :class="
        isDark
          ? 'left-[35px] bg-gradient-to-r from-indigo-500 to-blue-600'
          : 'left-1 bg-gradient-to-r from-amber-400 to-amber-500'
      "
    />

    <!-- Sun Side -->
    <div
      class="relative z-10 flex h-7 w-7 items-center justify-center transition-colors duration-300"
      :class="isDark ? 'text-secondary-text group-hover:text-primary-text' : 'text-slate-950 font-bold'"
    >
      <Sun
        class="w-4 h-4 transition-transform duration-300"
        :class="!isDark ? 'rotate-0 scale-110 text-slate-950' : '-rotate-45 scale-90 opacity-70'"
      />
    </div>

    <!-- Moon Side -->
    <div
      class="relative z-10 flex h-7 w-7 items-center justify-center transition-colors duration-300 ml-auto"
      :class="isDark ? 'text-white font-bold' : 'text-secondary-text group-hover:text-primary-text'"
    >
      <Moon
        class="w-4 h-4 transition-transform duration-300"
        :class="isDark ? 'rotate-0 scale-110 text-white' : 'rotate-45 scale-90 opacity-70'"
      />
    </div>
  </button>
</template>

<script setup>
import { Sun, Moon } from "lucide-vue-next";

defineProps({
  isDark: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["toggle"]);
</script>
