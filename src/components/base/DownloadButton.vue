<template>
  <button
    type="button"
    :disabled="disabled || loading"
    class="inline-flex items-center gap-2 h-10 px-5 text-xs font-semibold rounded-full bg-card-background shadow-none text-primary-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:outline-none focus:ring-0"
    :class="bordered ? 'border border-primary-border' : 'border-0'"
    @click="$emit('click', $event)"
  >
    <span>{{ label }}</span>
    <slot name="icon">
      <Download v-if="!loading" class="w-4 h-4" />
      <Loader2 v-else class="w-4 h-4 animate-spin text-secondary-text" />
    </slot>
  </button>
</template>

<script setup>
import { Download, Loader2 } from "lucide-vue-next";

defineProps({
  label: {
    type: String,
    default: "Download",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  bordered: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["click"]);
</script>
