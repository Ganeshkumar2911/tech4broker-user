<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Always force Light Theme across all authentication and onboarding pages
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <router-view />
</template>