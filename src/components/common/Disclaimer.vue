<template>
  <div
    class="w-full py-5 space-y-3 text-[11px] text-secondary-text leading-relaxed"
  >
    <div v-for="value in data" :key="value.label">
      <div class="space-y-1">
        <p
          v-if="value.heading"
          class="font-bold text-primary-text uppercase mb-1"
        >
          {{ value.heading }}
        </p>
        <p class="">
          {{ value.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // No props defined for this component
  data: {
    type: Array[Object],
    required: true,
  },
});
</script>
