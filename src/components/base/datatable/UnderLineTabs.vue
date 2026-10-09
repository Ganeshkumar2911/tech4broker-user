<template>
  <div
    v-if="showTabs && normalizedTabs.length"
    class="flex items-center gap-1 sm:gap-2 border-b border-primary-border/40 pb-1 sm:pb-2 overflow-x-auto no-scrollbar"
  >
    <button
      v-for="tab in normalizedTabs"
      :key="tab.value"
      type="button"
      @click="$emit('update:modelValue', tab.value)"
      class="pb-2.5 sm:pb-3 px-3 sm:px-4 text-sm sm:text-base md:text-[18px] font-bold leading-none tracking-normal transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
      :class="
        modelValue === tab.value
          ? 'text-primary-text dark:text-primary font-bold'
          : 'border-transparent text-secondary-text hover:text-primary-text'
      "
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },

  showTabs: {
    type: Boolean,
    default: true,
  },

  // Accepts either ['Forex', 'Crypto'] or [{ label, value }]
  tabs: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["update:modelValue"]);

const normalizedTabs = computed(() =>
  props.tabs.map((tab) =>
    typeof tab === "string"
      ? { label: tab, value: tab }
      : tab
  )
);
</script>