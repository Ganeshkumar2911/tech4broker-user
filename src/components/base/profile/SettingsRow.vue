<template>
  <div class="bg-card-background rounded-2xl px-5 py-4 flex items-center justify-between">
    <div>
      <h4 class="text-primary-text font-bold text-base">{{ title }}</h4>
      <p v-if="description" class="text-secondary-text text-xs mt-0.5">{{ description }}</p>
    </div>

    <button
      type="button"
      @click="$emit('action')"
      class="bg-background text-primary-text font-semibold text-xs px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: 'Change' },
})

defineEmits(['action'])
</script>