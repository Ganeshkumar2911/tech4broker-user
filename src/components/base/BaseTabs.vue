<template>
  <div class="w-full max-w-full overflow-x-auto no-scrollbar scrollbar-none touch-pan-x">
    <div
      class="inline-flex items-center gap-1 p-0.5 rounded-full bg-card-background w-max min-w-max"
      :class="overRideClass"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        :title="tab.title || tab.label || ''"
        @click="$emit('update:modelValue', tab.value)"
        class="h-8 px-3.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0"
        :class="[
          buttonClass,
          modelValue === tab.value ? activeClass : inactiveClass
        ]"
      >
        <component :is="tab.icon" v-if="tab.icon" :size="tab.iconSize || 15" class="shrink-0" />
        <span v-if="tab.label">{{ tab.label }}</span>
        <span
          v-if="tab.count !== undefined && tab.count !== null"
          class="px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none shrink-0"
          :class="
            modelValue === tab.value
              ? 'bg-primary-text/20 text-current'
              : 'bg-primary-border/40 text-secondary-text'
          "
        >
          {{ tab.count }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tabs: {
    // [{ label: 'Deposit', value: 'deposit', count: 12 }, ...]
    type: Array,
    required: true,
  },
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  activeClass: {
    type: String,
    default: "bg-button text-button-text font-bold shadow-xs",
  },
  overRideClass: {
    type: String,
    default: "",
  },
  buttonClass: {
    type: String,
    default: "",
  },
  inactiveClass: {
    type: String,
    default: "text-secondary-text hover:text-primary-text",
  },
});
defineEmits(["update:modelValue"]);
</script>
