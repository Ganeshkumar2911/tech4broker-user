<template>
  <div class="flex items-center justify-between gap-4 py-1">
    <span class="text-xs text-secondary-text">{{ label }}</span>

    <div class="flex items-center gap-2.5 shrink-0">
      <span class="font-mono text-xs text-secondary-text select-all">{{ value }}</span>

      <div class="relative" @click.stop>
        <button
          type="button"
          class="h-7 w-7 rounded-md border border-primary-border shadow-sm transition-transform hover:scale-105 cursor-pointer flex items-center justify-center overflow-hidden"
          :style="{ backgroundColor: value }"
          @click="$emit('toggle')"
          title="Pick color"
        />

        <!-- Popover -->
        <div
          v-if="open"
          class="absolute right-0 top-[calc(100%+8px)] z-50 p-2.5 bg-card-background border border-primary-border rounded-xl shadow-2xl flex flex-col gap-2 min-w-[240px]"
        >
          <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-primary-border">
            <span class="text-[11px] font-medium text-secondary-text">Color Palette</span>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-secondary-text">Custom:</span>
              <input
                type="color"
                :value="normalizeHex(value)"
                @input="handleNativeColorInput"
                class="w-5 h-5 rounded cursor-pointer border border-primary-border bg-transparent p-0"
                title="Custom Color"
              />
            </div>
          </div>

          <CompactPicker
            :modelValue="value"
            @update:modelValue="handleColorChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CompactPicker } from "vue-color";

const props = defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle", "pick"]);

const normalizeHex = (val) => {
  if (!val) return "#000000";
  if (val.startsWith("#") && (val.length === 4 || val.length === 7)) {
    return val;
  }
  return "#000000";
};

const handleColorChange = (val) => {
  const hex = val?.hex || (typeof val === "string" ? val : "");
  if (hex) {
    emit("pick", hex);
  }
};

const handleNativeColorInput = (e) => {
  const hex = e.target.value;
  if (hex) {
    emit("pick", hex);
  }
};
</script>
