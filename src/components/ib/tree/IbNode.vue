<script setup>
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { ChevronRight, Info } from "lucide-vue-next";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

// Helper for initials
const initials = computed(() => {
  const name = props.data.name || props.data.email || "IB";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

// Level colors
const levelTheme = computed(() => {
  const lvl = Number(props.data.level) || 0;
  const themes = [
    {
      avatar: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40",
      badge: "text-emerald-600 dark:text-emerald-400 font-semibold",
      accent: "border-emerald-500/50",
    },
    {
      avatar: "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/40",
      badge: "text-teal-600 dark:text-teal-400 font-semibold",
      accent: "border-teal-500/50",
    },
    {
      avatar: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/40",
      badge: "text-violet-600 dark:text-violet-400 font-semibold",
      accent: "border-violet-500/50",
    },
    {
      avatar: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40",
      badge: "text-amber-600 dark:text-amber-400 font-semibold",
      accent: "border-amber-500/50",
    },
    {
      avatar: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40",
      badge: "text-rose-600 dark:text-rose-400 font-semibold",
      accent: "border-rose-500/50",
    },
    {
      avatar: "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/40",
      badge: "text-sky-600 dark:text-sky-400 font-semibold",
      accent: "border-sky-500/50",
    },
  ];
  return themes[lvl % themes.length];
});

const splitPercent = computed(() => {
  const split = props.data.split_percentage ?? props.data.split ?? 0;
  return `${Number(split)}%`;
});

const onCardClick = (e) => {
  if (props.data.onSelect) {
    props.data.onSelect(props.data.raw || props.data);
  }
};

const onToggleClick = (e) => {
  e.stopPropagation();
  if (props.data.onToggle) {
    props.data.onToggle(props.data.id || props.data.ib_id);
  }
};

const isHorizontal = computed(() => props.data?.layoutDirection === "LR");
const targetPos = computed(() => (isHorizontal.value ? Position.Left : Position.Top));
const sourcePos = computed(() => (isHorizontal.value ? Position.Right : Position.Bottom));
</script>

<template>
  <div class="relative group select-none">
    <!-- Input Handle: Top Center in Vertical, Left Center in Horizontal -->
    <Handle
      type="target"
      :position="targetPos"
      class="!w-2 !h-2 !bg-slate-400 !border-2 !border-card-background opacity-0 group-hover:opacity-100 transition-opacity"
      :class="isHorizontal ? '!-left-1 !top-1/2 !-translate-y-1/2' : '!-top-1 !left-1/2 !-translate-x-1/2'"
    />

    <!-- Main Node Card -->
    <div
      class="w-[220px] sm:w-[240px] px-3.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5"
      :class="[
        data.isSearchMatch
          ? 'bg-amber-500/10 border-amber-500'
          : data.isSelected
          ? 'bg-emerald-500/10 border-emerald-500'
          : 'bg-card-background border-primary-border hover:bg-background',
      ]"
      @click="onCardClick"
    >
      <!-- Left: Avatar & Info -->
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        <!-- Initials Avatar -->
        <div
          class="w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 transition-transform group-hover:scale-105"
          :class="levelTheme.avatar"
        >
          {{ initials }}
        </div>

        <!-- Name & Subtitle (#id · L#) -->
        <div class="min-w-0 flex-1">
          <p
            class="text-xs font-semibold text-primary-text truncate group-hover:text-emerald-600 transition-colors"
            :title="data.name || data.email"
          >
            {{ data.name || data.email || 'IB Partner' }}
          </p>
          <div class="flex items-center gap-1.5 text-[10px] text-secondary-text font-mono mt-0.5">
            <span>#{{ data.ib_id || data.id }}</span>
            <span class="text-secondary-text/60">·</span>
            <span class="font-sans font-medium" :class="levelTheme.badge">
              L{{ data.level ?? 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Split % and Expand Toggle -->
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Split Percentage -->
        <span class="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          {{ splitPercent }}
        </span>

        <!-- Expand / Collapse Branch Button if node has children -->
        <button
          v-if="data.hasChildren"
          type="button"
          class="w-6 h-6 rounded-md flex items-center justify-center text-secondary-text dark:text-slate-400 hover:text-primary-text dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-all cursor-pointer"
          :class="{ 'bg-emerald-100 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400 font-bold': data.isExpanded }"
          :title="data.isExpanded ? 'Collapse branch' : `Expand ${data.childCount} sub-IBs`"
          @click="onToggleClick"
        >
          <ChevronRight
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="{ 'rotate-90 text-emerald-600 dark:text-emerald-400': data.isExpanded }"
          />
        </button>

        <!-- Node Details Drawer Trigger -->
        <button
          type="button"
          class="w-5 h-5 rounded flex items-center justify-center text-secondary-text hover:text-primary-text dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="View IB Details"
          @click.stop="onCardClick"
        >
          <Info class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Output Handle: Bottom Center in Vertical, Right Center in Horizontal -->
    <Handle
      v-if="data.hasChildren"
      type="source"
      :position="sourcePos"
      class="!w-2 !h-2 !bg-slate-400 !border-2 !border-white dark:!border-[#070d18] opacity-0 group-hover:opacity-100 transition-opacity"
      :class="isHorizontal ? '!-right-1 !top-1/2 !-translate-y-1/2' : '!-bottom-1 !left-1/2 !-translate-x-1/2'"
    />
  </div>
</template>

<style scoped>
</style>
