<template>
  <div
    class="rounded-2xl p-4 sm:p-5 transition-all select-none flex flex-col justify-between"
    :class="[
      selectable ? 'cursor-pointer' : '',
      active
        ? 'bg-card-active text-button-text shadow-md'
        : variant === 'transparent'
          ? 'bg-transparent hover:bg-background/40 text-primary-text'
          : variant === 'surface'
            ? 'bg-background border border-primary-border/60 hover:bg-background/80 text-primary-text'
            : 'bg-card-background border-0 text-primary-text hover:bg-card-background/90',
      wrapperClass,
    ]"
    @click="handleClick"
  >
    <!-- Loading Skeleton State -->
    <template v-if="loading">
      <div class="animate-pulse space-y-3 w-full">
        <!-- Title Skeleton -->
        <div class="flex items-center justify-between">
          <div
            class="h-4 w-28 rounded"
            :class="
              active ? 'bg-white/20' : 'bg-background dark:bg-white/10'
            "
          ></div>
          <div
            v-if="badge"
            class="h-4 w-12 rounded-full"
            :class="
              active ? 'bg-white/20' : 'bg-background dark:bg-white/10'
            "
          ></div>
        </div>

        <!-- Value Skeleton -->
        <div
          class="h-7 w-36 rounded"
          :class="
            active ? 'bg-white/20' : 'bg-background dark:bg-white/10'
          "
        ></div>

        <!-- Breakdown Subcard Skeleton -->
        <BaseMetricCard
          v-if="isBreakdownVisible"
          :loading="true"
          :active="active"
          class="mt-4"
        />
      </div>
    </template>

    <!-- Loaded Data State -->
    <template v-else>
      <div class="space-y-1 w-full">
        <!-- Header / Title Row -->
        <slot name="header">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <slot name="title">
                <p
                  class="text-sm font-medium truncate"
                  :class="active ? 'text-white/70' : 'text-secondary-text'"
                >
                  {{ title }}
                </p>
              </slot>

              <Tooltip v-if="tooltip" :text="tooltip" position="top" wrap>
                <Info
                  :size="12"
                  class="transition-opacity cursor-pointer shrink-0"
                  :class="
                    active
                      ? 'text-white/70 hover:text-white'
                      : 'text-secondary-text/70 hover:text-primary-text'
                  "
                />
              </Tooltip>
            </div>

            <!-- Optional Badge or Action in Header -->
            <slot name="badge">
              <BaseBadge
                v-if="badge"
                :value="badge"
                :variant="active ? 'default' : badgeVariant"
                size="xs"
              />
            </slot>
          </div>
        </slot>

        <!-- Value Section -->
        <slot name="value">
          <div class="flex items-baseline gap-2 flex-wrap mt-1">
            <h2
              class="font-bold text-xl sm:text-2xl tracking-tight leading-tight"
              :class="active ? 'text-white' : 'text-primary-text'"
            >
              {{ value }}
            </h2>
            <span
              v-if="subtitle"
              class="text-xs font-medium"
              :class="active ? 'text-white/70' : 'text-secondary-text'"
            >
              {{ subtitle }}
            </span>
          </div>
        </slot>
      </div>

      <!-- Main Slot (Optional Custom Content between Value & Breakdown) -->
      <slot />

      <!-- Sub-Metrics Breakdown Card (Real / Copy or Custom) -->
      <slot name="breakdown">
        <BaseMetricCard
          v-if="isBreakdownVisible"
          class="mt-4 w-full"
          :active="active"
          :left-label="leftLabel"
          :left-value="leftValue"
          :left-tooltip="leftTooltip"
          :right-label="rightLabel"
          :right-value="rightValue"
          :right-tooltip="rightTooltip"
        />
      </slot>
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Info } from "lucide-vue-next";
import Tooltip from "@/components/base/Tooltip.vue";
import BaseBadge from "@/components/base/BaseBadge.vue";
import BaseMetricCard from "@/components/base/BaseMetricCard.vue";

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  value: {
    type: [String, Number],
    default: "",
  },
  tooltip: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
  active: {
    type: Boolean,
    default: false,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  badge: {
    type: String,
    default: "",
  },
  badgeVariant: {
    type: String,
    default: "primary",
  },
  variant: {
    type: String,
    default: "card", // 'card' | 'transparent' | 'surface'
  },
  wrapperClass: {
    type: [String, Array, Object],
    default: "",
  },
  // Sub-Metrics Breakdown Props (renders BaseMetricCard)
  showBreakdown: {
    type: Boolean,
    default: undefined,
  },
  leftLabel: {
    type: String,
    default: "Real",
  },
  leftValue: {
    type: [String, Number],
    default: "",
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
    default: "",
  },
  rightTooltip: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["click", "select"]);

const isBreakdownVisible = computed(() => {
  if (props.showBreakdown !== undefined) {
    return props.showBreakdown;
  }
  return Boolean(props.leftValue || props.rightValue);
});

const handleClick = (event) => {
  emit("click", event);
  emit("select");
};
</script>
