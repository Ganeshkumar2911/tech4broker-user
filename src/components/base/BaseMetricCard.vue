<template>
  <div
    class="rounded-xl flex justify-between items-center p-3 sm:p-3.5 transition-colors"
    :class="[
      active
        ? 'bg-metric-card-active'
        : 'bg-background dark:bg-[#0b0f19]/90',
      wrapperClass,
    ]"
  >
    <!-- Loading Skeleton State -->
    <template v-if="loading">
      <!-- Left Skeleton -->
      <div class="min-w-0 pr-4 space-y-2 flex-1">
        <div
          class="h-3 w-12 rounded"
          :class="active ? 'bg-white/20' : 'bg-card-background dark:bg-white/10'"
        ></div>
        <div
          class="h-4 w-20 rounded"
          :class="active ? 'bg-white/20' : 'bg-card-background dark:bg-white/10'"
        ></div>
      </div>

      <!-- Inset Centered Divider -->
      <div
        class="w-[1.5px] h-10 shrink-0"
        :class="active ? 'bg-white/20' : 'bg-primary-border'"
      ></div>

      <!-- Right Skeleton -->
      <div class="min-w-0 pl-4 space-y-2 flex-1">
        <div
          class="h-3 w-12 rounded"
          :class="active ? 'bg-white/20' : 'bg-card-background dark:bg-white/10'"
        ></div>
        <div
          class="h-4 w-20 rounded"
          :class="active ? 'bg-white/20' : 'bg-card-background dark:bg-white/10'"
        ></div>
      </div>
    </template>

    <!-- Content State -->
    <template v-else>
      <div class="w-full flex items-center justify-between">
        <!-- Left (Real) Column -->
        <div class="min-w-0 pr-4">
          <!-- <slot name="left"> -->
            <div
              class="text-xs flex items-center gap-1.5 font-medium"
              :class="active ? 'text-white/80' : 'text-secondary-text'"
            >
              <span>{{ leftLabel }}</span>
              <Tooltip v-if="leftTooltip" :text="leftTooltip" position="start" wrap>
                <Info
                  :size="11"
                  class="hover:opacity-100 opacity-70 transition-opacity cursor-pointer shrink-0"
                />
              </Tooltip>
            </div>
  
            <p
              class="mt-1 font-semibold text-sm truncate"
              :class="active ? 'text-white' : 'text-primary-text'"
            >
              {{ leftValue }}
            </p>
          <!-- </slot> -->
        </div>
  
        <!-- Centered Inset Vertical Divider Line -->
        <div
          class="w-[1.5px] h-10 shrink-0"
          :class="active ? 'bg-white/20' : 'bg-primary-border'"
        ></div>
  
        <!-- Right (Copy) Column -->
        <div class="min-w-0 pl-4">
          <!-- <slot name="right"> -->
            <div
              class="text-xs flex items-center gap-1.5 font-medium"
              :class="active ? 'text-white/80' : 'text-secondary-text'"
            >
              <span>{{ rightLabel }}</span>
              <Tooltip v-if="rightTooltip" :text="rightTooltip" position="end" wrap>
                <Info
                  :size="11"
                  class="hover:opacity-100 opacity-70 transition-opacity cursor-pointer shrink-0"
                />
              </Tooltip>
            </div>
  
            <p
              class="mt-1 font-semibold text-sm truncate"
              :class="active ? 'text-white' : 'text-primary-text'"
            >
              {{ rightValue }}
            </p>
          <!-- </slot> -->
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { Info } from "lucide-vue-next";
import Tooltip from "@/components/base/Tooltip.vue";

defineProps({
  leftLabel: {
    type: String,
    default: "Real",
  },
  leftValue: {
    type: [String, Number],
    default: "0.00 USD",
  },
  leftTooltip: {
    type: String,
    default: "",
  },
  rightLabel: {
    type: String,
    default: "Copy",
  },
  rightValue: {
    type: [String, Number],
    default: "0.00 USD",
  },
  rightTooltip: {
    type: String,
    default: "",
  },
  active: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  wrapperClass: {
    type: [String, Array, Object],
    default: "",
  },
});
</script>
