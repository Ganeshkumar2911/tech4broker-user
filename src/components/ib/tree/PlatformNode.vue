<script setup>
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({ label: "Platform" }),
  },
});

const isHorizontal = computed(() => props.data?.layoutDirection === "LR");
const sourcePos = computed(() => (isHorizontal.value ? Position.Right : Position.Bottom));
</script>

<template>
  <div class="relative group select-none flex items-center justify-center">
    <div
      class="flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 transition-all duration-200 cursor-pointer"
    >
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">
          {{ data.label || "Platform" }}
        </span>
      </div>
    </div>

    <!-- Output Handle: Bottom Center in Vertical (TB), Right Center in Horizontal (LR) -->
    <Handle
      type="source"
      :position="sourcePos"
      class="!w-2 !h-2 !bg-emerald-500 !border-2 !border-primary-border opacity-0 group-hover:opacity-100 transition-opacity"
      :class="isHorizontal ? '!-right-1 !top-1/2 !-translate-y-1/2' : '!-bottom-1 !left-1/2 !-translate-x-1/2'"
    />
  </div>
</template>

<style scoped>
</style>
