<template>
  <div
    @click="$emit('select', id)"
    class="flex flex-col justify-between gap-4 p-4 sm:p-5 rounded-[22px] sm:rounded-[26px] cursor-pointer transition-all duration-200 select-none min-w-0"
    :class="
      active
        ? 'bg-[#1C2334] text-white'
        : 'text-primary-text hover:bg-background/80'
    "
  >
    <div class="w-7 h-7 flex items-center justify-start">
      <img
        v-if="typeof icon === 'string'"
        :src="icon"
        :alt="label"
        class="w-6 h-6 object-contain transition-all duration-200"
        :class="active ? 'brightness-0 invert' : 'brightness-0 dark:invert'"
      />
      <component
        v-else-if="icon"
        :is="icon"
        class="w-6 h-6 transition-colors duration-200"
        :class="active ? 'text-white' : 'text-primary-text'"
      />
    </div>
    <div class="space-y-1">
      <p
        class="text-xs sm:text-sm font-medium truncate"
        :class="active ? 'text-white/80' : 'text-secondary-text'"
      >
        {{ label }}
      </p>
      <p class="text-base sm:text-lg font-bold truncate">
        {{ formattedValue }}
        <span
          v-if="unit"
          class="text-xs sm:text-sm font-medium ml-0.5"
          :class="active ? 'text-white/80' : 'text-secondary-text'"
        >
          {{ unit }}
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  id: { type: String, required: true },
  icon: { type: [Object, Function, String], required: true },
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  unit: { type: String, default: "" },
  active: { type: Boolean, default: false },
});

const formattedValue = computed(() => {
  const num = Number(props.value);
  if (!isNaN(num) && props.unit === "USD") {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return props.value;
});
</script>

