<template>
  <div
    class="inline-flex items-center gap-1 p-1 rounded-full bg-card-background h-10"
    :class="bordered ? 'border border-primary-border' : ''"
  >
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      @click="$emit('update:modelValue', tab.value)"
      class="px-3.5 py-1.5 h-8 rounded-full flex items-center justify-center whitespace-nowrap text-xs font-semibold transition-all duration-200 cursor-pointer gap-1.5"
      :class="
        modelValue === tab.value
          ? 'bg-button text-button-text font-bold'
          : 'text-secondary-text hover:text-primary-text hover:bg-background'
      "
    >
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.count !== undefined && tab.count !== null"
        class="px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none"
        :class="
          modelValue === tab.value
            ? 'bg-button-text/20 text-button-text'
            : 'bg-primary-border/40 text-secondary-text'
        "
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: "all" },
  tabs: { type: Array, required: true },
  bordered: { type: Boolean, default: false },
});

defineEmits(["update:modelValue"]);
</script>
