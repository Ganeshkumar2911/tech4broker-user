<template>
  <div
    class="relative flex items-center w-full min-w-0"
    :class="[containerClass]"
  >
    <div
      class="relative flex items-center w-full min-w-0 overflow-hidden outline-none transition-colors duration-150 shadow-none ring-0"
      :class="[
        bgClass,
        roundedClass,
        isActive
          ? 'border border-primary'
          : borderless
            ? 'border border-transparent'
            : 'border  border-transparent hover:border-primary',
        disabled ? 'opacity-50 pointer-events-none' : '',
        wrapperClass,
      ]"
      :style="{ height }"
    >
      <!-- Search Icon -->
      <Search
        :size="iconSize"
        class="absolute left-3.5 shrink-0 pointer-events-none transition-colors duration-150"
        :class="isActive ? 'text-primary-text' : 'text-secondary-text'"
      />

      <!-- Input -->
      <input
        ref="inputRef"
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.enter="$emit('search', modelValue)"
        class="w-full h-full pl-9 text-xs sm:text-sm font-medium text-primary-text placeholder:text-placeholder bg-transparent shadow-none outline-none focus:outline-none focus:ring-0 pr-8"
        :class="inputClass"
      />

      <!-- Clear Button -->
      <button
        v-if="clearable && modelValue"
        type="button"
        @click.stop.prevent="clear"
        class="absolute right-2.5 p-1 rounded-full text-secondary-text hover:text-primary-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        title="Clear search"
      >
        <X :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Search, X } from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  placeholder: {
    type: String,
    default: "Search...",
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  rounded: {
    type: String,
    default: "full", // full | xl | lg | md | none
  },
  height: {
    type: String,
    default: "40px",
  },
  variant: {
    type: String,
    default: "card", // card (bg-card-background) | background (bg-background)
  },
  borderless: {
    type: Boolean,
    default: false,
  },
  wrapperClass: {
    type: [String, Array, Object],
    default: "",
  },
  containerClass: {
    type: [String, Array, Object],
    default: "",
  },
  inputClass: {
    type: [String, Array, Object],
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  iconSize: {
    type: Number,
    default: 16,
  },
});

const emit = defineEmits(["update:modelValue", "search", "clear", "focus", "blur"]);

const inputRef = ref(null);
const isFocused = ref(false);

const hasValue = computed(() => {
  return (
    props.modelValue !== null &&
    props.modelValue !== undefined &&
    String(props.modelValue).trim().length > 0
  );
});

const isActive = computed(() => {
  return isFocused.value || hasValue.value;
});

const bgClass = computed(() => {
  return props.variant === "background"
    ? "bg-background"
    : "bg-card-background";
});

const roundedClass = computed(() => {
  switch (props.rounded) {
    case "none":
      return "rounded-none";
    case "md":
      return "rounded-md";
    case "lg":
      return "rounded-lg";
    case "xl":
      return "rounded-xl";
    case "2xl":
      return "rounded-2xl";
    case "full":
    default:
      return "rounded-full";
  }
});

function onInput(event) {
  emit("update:modelValue", event.target.value);
}

function onFocus(event) {
  isFocused.value = true;
  emit("focus", event);
}

function onBlur(event) {
  isFocused.value = false;
  emit("blur", event);
}

function clear(event) {
  event?.stopPropagation?.();
  event?.preventDefault?.();
  emit("update:modelValue", "");
  emit("clear");
  inputRef.value?.focus();
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  inputRef,
  isFocused,
  isActive,
});
</script>
