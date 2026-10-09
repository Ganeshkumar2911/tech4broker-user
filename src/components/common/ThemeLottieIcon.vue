<script setup>
defineProps({
  isDark: {
    type: Boolean,
    default: false,
  },
  size: {
    type: Number,
    default: 20,
  },
});
</script>

<template>
  <div
    class="theme-lottie-icon flex items-center justify-center transition-transform duration-500 ease-out"
    :class="{ 'rotate-90': isDark }"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="overflow-visible"
    >
      <mask id="theme-moon-mask">
        <rect x="0" y="0" width="100%" height="100%" fill="white" />
        <circle
          :cx="isDark ? 13 : 26"
          :cy="isDark ? 3 : -4"
          r="8"
          fill="black"
          class="transition-all duration-500 ease-in-out"
        />
      </mask>

      <!-- Center Sun / Moon body -->
      <circle
        cx="12"
        cy="12"
        :r="isDark ? 9 : 5"
        mask="url(#theme-moon-mask)"
        class="transition-all duration-500 ease-in-out"
        :class="isDark ? 'fill-current text-slate-100' : 'fill-yellow-400 text-yellow-400'"
      />

      <!-- Sun Rays -->
      <g
        class="transition-all duration-500 ease-in-out origin-center text-yellow-400"
        :class="isDark ? 'opacity-0 scale-0' : 'opacity-100 scale-100'"
      >
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  </div>
</template>

