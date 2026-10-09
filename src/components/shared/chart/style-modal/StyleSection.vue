<template>
  <div
    class="border-b border-primary-border p-4"
    :class="{ 'border-b-0': last }"
  >
    <p
      class="mb-4 text-xs font-semibold uppercase tracking-widest text-secondary-text"
    >
      {{ title }}
    </p>
    <div class="space-y-4">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  last: { type: Boolean, default: false },
});
</script>
