//
<script setup>
defineProps({
  // Simple string title — used only if you don't need custom header markup
  title: { type: String, default: "" },
  // Turn off default padding if a child (e.g. a table) needs to bleed to the edges
  padded: { type: Boolean, default: true },
  // Turn off the gray card chrome entirely (border/shadow/bg) — useful for nested cards
  bare: { type: Boolean, default: false },
});
</script>

<template>
  <div
    class="flex flex-col"
    :class="[
      bare ? '' : 'rounded-2xl bg-card-background text-primary-text',
      padded ? 'p-6' : '',
    ]"
  >
    <!-- Header: use the #header slot for custom content (e.g. title + dropdown),
         or just pass the `title` prop for the common case -->
    <div
      v-if="title || $slots.header"
      class="flex items-center justify-between mb-4"
    >
      <slot name="header">
        <h3 class="text-lg font-bold text-primary-text">{{ title }}</h3>
      </slot>
    </div>

    <!-- Body -->
    <div class="flex-1 min-w-0">
      <slot />
    </div>

    <!-- Footer: only renders if you pass content into it -->
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-primary-border">
      <slot name="footer" />
    </div>
  </div>
</template>
