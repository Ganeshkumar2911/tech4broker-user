<template>
  <div class="flex items-center justify-between gap-4">
    <span class="text-xs text-primary-text font-medium">{{ label }}</span>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
});
</script>
