<template>
  <Tooltip text="Open New Trading Account" position="left" class="w-full h-full block">
    <button
      type="button"
      @click="$emit('click')"
      class="bg-card-background rounded-3xl border-2 border-dashed border-primary-border
             flex items-center justify-center
             h-full w-full
             hover:border-secondary-text/40 hover:shadow-md
             transition-all duration-300 group cursor-pointer"
    >
      <div
        class="w-12 h-12 rounded-full bg-button text-button-text
               group-hover:opacity-90
               flex items-center justify-center transition-all duration-300"
      >
        <Plus
          class="w-5 h-5 text-button-text transition-all duration-300"
        />
      </div>
    </button>
  </Tooltip>
</template>

<script setup>
import { Plus } from "lucide-vue-next";

defineEmits(["click"]);
</script>