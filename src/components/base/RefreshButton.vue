<template>
  <button
    type="button"
    :disabled="disabled || loading"
    :title="title"
    @click="$emit('click', $event)"
    class="flex h-10 w-10 items-center justify-center rounded-full border-0 shadow-none text-primary-text cursor-pointer disabled:opacity-50 shrink-0 outline-none focus:outline-none focus:ring-0 transition-colors"
    :class="[resolvedBgClass, buttonClass]"
  >
    <RefreshCw
      :size="iconSize"
      :class="{ 'animate-spin': loading }"
    />
  </button>
</template>

<script setup>
import { computed } from "vue";
import { RefreshCw } from "lucide-vue-next";

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Refresh List",
  },
  iconSize: {
    type: Number,
    default: 18,
  },
  buttonClass: {
    type: [String, Array, Object],
    default: "",
  },
  bgClass: {
    type: String,
    default: "",
  },
});

const resolvedBgClass = computed(() => {
  if (props.bgClass) return props.bgClass;
  return "bg-card-background";
});

defineEmits(["click"]);
</script>
