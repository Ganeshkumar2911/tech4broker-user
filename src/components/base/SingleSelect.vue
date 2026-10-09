<template>
  <div ref="dropdownRef" :id="id" class="relative w-full" tabindex="0">
    <div
      @click="toggleDropdown"
      class="w-full"
      :class="{
        'cursor-not-allowed opacity-80': disabled,
        'cursor-pointer': !disabled,
      }"
    >
      <div
        class="flex items-center border border-primary-border justify-between text-primary-text bg-background rounded-xl hover:bg-background/80 transition-colors"
        :class="{ 'p-2 text-xs': props.small, 'text-xs p-2.5': !props.small }"
      >
        <span
          v-if="!selectedOption"
          class="text-nowrap text-secondary-text/70"
          >{{ placeholder }}</span
        >
        <span v-else class="text-nowrap font-medium">{{
          getSelectedLabel
        }}</span>
        <svg
          class="w-4 h-4 ml-2 text-secondary-text transition-transform transform"
          :class="{ 'rotate-180': isOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </div>
    </div>
    <div class="hidden">
      <slot></slot>
    </div>
    <transition name="fade">
      <div
        v-if="isOpen && !disabled"
        class="absolute z-10 mt-[2px] w-full max-h-56 overflow-auto text-nowrap bg-card-background border border-primary-border rounded-xl shadow-lg no-scrollbar"
        :class="{ 'top-9': props.small, 'top-12': !props.small }"
        :style="{ zIndex: zIndexValue }"
      >
        <div
          v-if="options.length"
          v-for="option in options"
          :key="option.value"
          @click="selectOption(option)"
          class="w-full cursor-pointer hover:bg-background transition-colors py-1.5 px-2"
          :class="{
            'bg-primary/10 text-primary font-semibold':
              (option.value || '').toString() ===
              (selectedOption || '').toString(),
            'text-primary-text':
              (option.value || '').toString() !==
              (selectedOption || '').toString(),
          }"
        >
          <label
            class="flex m-0 items-center py-[2px] cursor-pointer font-normal"
            :class="{ 'text-[11px]': props.small, 'text-xs': !props.small }"
          >
            <div class="flex m-0 items-center">
              <div>{{ option.label }}</div>
            </div>
          </label>
        </div>
        <div
          v-else
          class="w-full cursor-pointer py-2 px-3 text-secondary-text text-xs"
          :style="{ zIndex: zIndexValue }"
        >
          <span>Options not available</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, watchEffect, onUnmounted, onMounted } from "vue";

const props = defineProps({
  id: {
    type: String,
    default: `SingleSelect-${Math.random().toString(16).slice(2)}`,
  },
  modelValue: {
    type: [Number, String, Object],
    default: null,
  },
  placeholder: {
    type: String,
    default: "Select",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  iconShow: {
    type: Boolean,
    default: false,
  },
  imageShow: {
    type: Boolean,
    default: false,
  },
  small: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const selectedOption = ref(props.modelValue);
const dropdownRef = ref(null);

const options = ref([]);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const findAllOptions = () => {
  let data = dropdownRef.value?.querySelectorAll("option") || [];
  const slotOptions = Array.from(data).map((option) => ({
    key: option.getAttribute("key") || "",
    value: option.value,
    label: option.textContent || "",
    icon: option.getAttribute("icon") || "",
    image: option.getAttribute("image") || "",
  }));
  options.value = slotOptions;
};

const selectOption = (option) => {
  selectedOption.value = option.value;
  emit("update:modelValue", option.value);
  isOpen.value = false;
};

const getSelectedLabel = computed(() => {
  try {
    const selected = options.value.find(
      (option) => option.value.toString() === selectedOption.value.toString(),
    );
    return selected ? selected.label : props.placeholder;
  } catch (error) {
    console.error("print error", error);
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    selectedOption.value = newValue;
  },
);

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  findAllOptions();
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

function getHighestZIndex() {
  const elements = [...document.querySelectorAll("body *")];
  const zIndexes = elements
    .map((el) => parseFloat(window.getComputedStyle(el).zIndex))
    .filter((zIndex) => !isNaN(zIndex));
  return Math.max(0, ...zIndexes);
}

// Compute the zIndex value dynamically
const zIndexValue = computed(() => getHighestZIndex() + 1);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
