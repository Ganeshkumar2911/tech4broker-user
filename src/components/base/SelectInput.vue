<template>
  <div ref="wrapperRef" class="relative w-full">
    <!-- Input Field -->
    <input
      v-model="inputValue"
      @input="filterOptions"
      @focus="handleFocus"
      @keydown.enter.prevent="handleAdd"
      type="text"
      :placeholder="placeholder"
      class="w-full p-2.5 text-primary-text border border-primary-border bg-background rounded-xl focus:outline-none focus:border-primary text-xs placeholder:text-secondary-text/60"
    />

    <!-- Dropdown Suggestions -->
    <ul
      v-if="showDropdown && filteredOptions.length"
      class="absolute z-10 mt-1 w-full bg-card-background border border-primary-border rounded-xl shadow-lg max-h-48 overflow-y-auto"
    >
      <li
        v-for="option in filteredOptions"
        :key="option.value"
        @click="selectOption(option)"
        class="px-3.5 py-2 cursor-pointer hover:bg-background text-xs text-primary-text font-medium transition-colors"
      >
        {{ option.label }}
      </li>
    </ul>

    <!-- Add Button -->
    <button
      @click="handleAdd"
      :disabled="!isValidSelection"
      :class="[
        'absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-lg ',
        isValidSelection
          ? 'text-primary'
          : 'cursor-not-allowed text-secondary-text/40',
      ]"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "ADD",
  },
});

const emit = defineEmits(["add", "selection-change"]);

const inputValue = ref("");
const showDropdown = ref(false);
const filteredOptions = ref([]);

const wrapperRef = ref(null);

const isValidSelection = computed(() =>
  props.options.some(
    (option) => option.label.toLowerCase() === inputValue.value.toLowerCase(),
  ),
);

const filterOptions = () => {
  const search = inputValue.value.toLowerCase();
  showDropdown.value = true;
  filteredOptions.value = props.options.filter((option) =>
    option.label.toLowerCase().includes(search),
  );
};

const handleFocus = () => {
  showDropdown.value = true;
  // If input is empty, show all options
  if (inputValue.value === "") {
    filteredOptions.value = props.options;
  } else {
    // Otherwise filter based on current input
    filterOptions();
  }
};

const selectOption = (option) => {
  inputValue.value = option.label;
  showDropdown.value = false;
  emit("selection-change", option.value);
};

const handleAdd = () => {
  if (!isValidSelection.value) return;

  const selectedOption = props.options.find(
    (option) => option.label.toLowerCase() === inputValue.value.toLowerCase(),
  );

  emit("add", {
    value: selectedOption.value,
    option: selectedOption,
  });

  showDropdown.value = false;
};

// Click outside logic
const handleClickOutside = (event) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
