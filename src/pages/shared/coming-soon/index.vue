<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card-background border border-primary-border rounded-2xl shadow-sm">
    <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
      <span class="material-symbols-outlined text-primary text-3xl">construction</span>
    </div>
    <h2 class="text-primary-text text-xl font-bold mb-2">{{ title }}</h2>
    <p class="text-secondary-text text-sm max-w-md">
      This page is under construction. We are currently implementing features for this section of your brand new trading platform.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta.title || 'Coming Soon')
</script>
