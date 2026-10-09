<template>
  <div ref="wrapper" class="relative inline-block w-fit">
    <!-- Trigger Button -->
    <button
      @click.stop="toggleDropdown"
      type="button"
      class="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-card-background text-sm font-medium text-primary-text transition-all cursor-pointer w-fit min-w-fit justify-between"
    >
      <div
        class="flex items-center gap-2 overflow-hidden min-w-0 max-w-[240px] sm:max-w-[320px]"
      >
        <BaseIcon
          name="account_tree"
          :size="16"
          class="text-secondary-text shrink-0"
        />

        <div class="flex items-center gap-1.5 overflow-hidden">
          <span
            class="bg-[#ecd338]/15 dark:bg-[#ecd338]/25 text-[#252525] dark:text-[#ecd338] rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap truncate"
          >
            {{ triggerLabel }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0 ml-1">
        <span
          v-if="selectedCount > 0"
          class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#ecd338] text-[#252525] text-[11px] font-bold"
        >
          {{ selectedCount }}
        </span>

        <BaseIcon
          name="keyboard_arrow_down"
          :size="14"
          class="text-secondary-text transition-transform duration-200 shrink-0"
          :class="open ? 'rotate-180' : ''"
        />
      </div>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="open"
      class="absolute z-50 mt-2 w-[320px] sm:w-[380px] max-w-[92vw] rounded-2xl bg-card-background text-primary-text overflow-hidden left-0"
    >
      <!-- Dropdown Header -->
      <div
        class="flex items-center gap-2 px-4 py-3 border-b border-primary-border bg-background/30 font-semibold text-sm text-primary-text"
      >
        <BaseIcon
          name="account_tree"
          :size="18"
          class="text-secondary-text shrink-0"
        />
        <span>IB Network</span>
      </div>

      <!-- Hierarchy Levels List Container -->
      <div class="max-h-[380px] overflow-y-auto no-scrollbar p-3 space-y-2">
        <div
          v-for="lvl in levelSections"
          :key="lvl.id"
          class="space-y-1.5"
        >
          <!-- Level Header Row with RADIO Button -->
          <div
            class="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors select-none"
            :class="[
              loading && selectedLevel === lvl.level
                ? 'opacity-75 cursor-wait bg-primary-blue/5'
                : 'hover:bg-background/60 cursor-pointer',
              selectedLevel === lvl.level ? 'bg-primary-blue/5' : '',
            ]"
            @click="selectLevel(lvl.level)"
          >
            <!-- Chevron Button (ENABLED ONLY for the active selected level) -->
            <button
              type="button"
              :disabled="selectedLevel !== lvl.level || !lvl.canExpand || loading"
              @click.stop="toggleLevelExpand(lvl.level)"
              class="w-5 h-5 flex items-center justify-center transition-transform shrink-0"
              :class="[
                selectedLevel === lvl.level && lvl.canExpand
                  ? 'text-primary-text hover:bg-background/80 rounded cursor-pointer'
                  : 'text-secondary-text/30 cursor-not-allowed pointer-events-none',
                isLevelExpanded(lvl.level) ? 'rotate-90' : '',
              ]"
            >
              <BaseIcon name="chevron_right" :size="16" />
            </button>

            <!-- Radio Button (Always clickable to switch level) -->
            <input
              type="radio"
              :name="`ib_level_radio_${instanceId}`"
              :disabled="loading && selectedLevel === lvl.level"
              class="w-4 h-4 rounded-full border-primary-border accent-primary-blue cursor-pointer shrink-0 disabled:opacity-50"
              :checked="selectedLevel === lvl.level"
              @click.stop="selectLevel(lvl.level)"
              @change="selectLevel(lvl.level)"
            />

            <!-- Level Title -->
            <span
              class="font-bold text-sm text-primary-text flex-1"
              :class="selectedLevel === lvl.level ? 'text-primary-blue font-extrabold' : ''"
            >
              Level {{ lvl.level }}
            </span>

            <!-- Loading indicator when level is fetching -->
            <template v-if="loading && selectedLevel === lvl.level">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-primary-blue bg-primary-blue/10 rounded-md shrink-0"
              >
                <span
                  class="w-3 h-3 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"
                ></span>
                <span>Loading...</span>
              </span>
            </template>

            <!-- Count Badge -->
            <template v-else>
              <span
                class="px-2 py-0.5 text-xs font-bold rounded-md shrink-0 ml-1"
                :class="
                  selectedLevel === lvl.level
                    ? 'bg-primary-blue text-white'
                    : 'bg-primary-blue/10 text-primary-blue dark:bg-primary-blue/20 dark:text-primary-blue'
                "
              >
                {{ lvl.count }}
              </span>
            </template>
          </div>

          <!-- Sub-IBs Tree (Displayed ONLY for the active selected level) -->
          <div
            v-if="selectedLevel === lvl.level && isLevelExpanded(lvl.level) && lvl.sub_ibs && lvl.sub_ibs.length > 0"
            class="ml-5 pl-3.5 border-l border-primary-border/70 space-y-1.5 my-1"
          >
            <NetworkTreeNode
              v-for="sub in lvl.sub_ibs"
              :key="sub.id || sub.ib_id || sub.user_id"
              :node="sub"
              :selected-ids="selectedSubIbIds"
              @toggle="handleSubIbToggle"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="border-t border-primary-border px-4 py-2.5 flex items-center justify-between bg-background/50"
      >
        <span class="text-xs text-secondary-text font-medium">
          Level {{ selectedLevel }} ({{ selectedSubIbIds.length }} Sub-IBs)
        </span>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="clearSelection"
            class="text-xs font-semibold text-secondary-text hover:text-primary-text px-2 py-1 transition-colors cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            @click="selectAllSubIbs"
            class="text-xs font-semibold text-secondary-text hover:text-primary-text px-2 py-1 transition-colors cursor-pointer"
          >
            Select All
          </button>
          <button
            type="button"
            :disabled="loading"
            @click="apply"
            class="h-7 px-4 rounded-full text-xs font-bold bg-[#ecd338] text-[#252525] hover:brightness-95 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import NetworkTreeNode from "@/components/base/NetworkTreeNode.vue";

const instanceId = Math.random().toString(36).substring(2, 9);

const props = defineProps({
  tree: {
    type: Object,
    default: null,
  },
  maxLevel: {
    type: Number,
    default: 5,
  },
  levels: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [Object, Number, String, Array],
    default: () => ({ level: 0, ib_ids: [] }),
  },
});

const emit = defineEmits([
  "update:modelValue",
  "apply",
  "select",
  "change-level",
]);

const wrapper = ref();
const open = ref(false);

// Active single level (Radio)
const selectedLevel = ref(0);

// Selected Sub-IB IDs and User IDs within the active level (Multi-Select Checkboxes) - Start unselected
const selectedSubIbIds = ref([]);
const selectedUserIds = ref([]);

// Expanded states for levels
const expandedLevels = ref({ 0: true });

const isLevelExpanded = (lvl) => {
  return selectedLevel.value === lvl && !!expandedLevels.value[lvl];
};

const toggleLevelExpand = (lvl) => {
  if (selectedLevel.value !== lvl) return;
  expandedLevels.value[lvl] = !expandedLevels.value[lvl];
};

// Build list of level sections (0 to maxLevel)
const levelSections = computed(() => {
  const result = [];
  const max = Math.max(0, props.maxLevel ?? 5);

  for (let lvl = 0; lvl <= max; lvl++) {
    const isSelected = lvl === selectedLevel.value;
    const levelInfo = props.levels.find((l) => Number(l.id) === lvl);
    const defaultCount = levelInfo?.accounts ?? levelInfo?.count ?? 0;

    if (isSelected) {
      // Sub-IBs for active level come directly from props.tree
      const subIbs = Array.isArray(props.tree?.sub_ibs)
        ? props.tree.sub_ibs
        : Array.isArray(props.tree?.nodes)
          ? props.tree.nodes
          : Array.isArray(props.tree)
            ? props.tree
            : [];

      const activeCount =
        props.tree?.total_sub_ibs ??
        (subIbs.length > 0 ? subIbs.length : defaultCount);

      result.push({
        level: lvl,
        name: `Level ${lvl}`,
        id: `level_${lvl}`,
        sub_ibs: subIbs,
        count: activeCount,
        canExpand: subIbs.length > 0,
      });
    } else {
      // Inactive levels: no sub_ibs, cannot expand
      result.push({
        level: lvl,
        name: `Level ${lvl}`,
        id: `level_${lvl}`,
        sub_ibs: [],
        count: defaultCount,
        canExpand: false,
      });
    }
  }

  return result;
});

// Helper to collect all sub-IB IDs and User IDs for active level
const getSubIbsAndUserIdsForLevel = (lvlNumber) => {
  const section = levelSections.value.find((l) => l.level === lvlNumber);
  if (!section || !Array.isArray(section.sub_ibs)) return { ids: [], userIds: [] };

  const ids = [];
  const userIds = [];
  const collect = (list) => {
    for (const item of list) {
      const id = String(item.id ?? item.ib_id ?? item.user_id ?? item.name);
      ids.push(id);
      if (item.user_id !== undefined && item.user_id !== null) {
        userIds.push(Number(item.user_id));
      }
      if (Array.isArray(item.sub_ibs)) {
        collect(item.sub_ibs);
      }
    }
  };
  collect(section.sub_ibs);
  return { ids, userIds };
};

// Select a level (Radio action - triggers immediate API call)
const selectLevel = (lvlNumber) => {
  if (props.loading && selectedLevel.value === lvlNumber) return;

  selectedLevel.value = lvlNumber;
  expandedLevels.value = { [lvlNumber]: true };
  selectedSubIbIds.value = [];
  selectedUserIds.value = [];

  emit("change-level", lvlNumber);
  emit("update:modelValue", { level: [lvlNumber], user_id: [] });
};

// Select all sub-IBs under active level
const selectAllSubIbs = () => {
  const data = getSubIbsAndUserIdsForLevel(selectedLevel.value);
  selectedSubIbIds.value = data.ids;
  selectedUserIds.value = data.userIds;
};

// Clear all selected sub-IBs
const clearSelection = () => {
  selectedSubIbIds.value = [];
  selectedUserIds.value = [];
};

// Handle sub-IB checkbox toggle (does NOT trigger API call until Apply clicked)
const handleSubIbToggle = ({ node, ids, userIds, selected }) => {
  if (selected) {
    selectedSubIbIds.value = Array.from(new Set([...selectedSubIbIds.value, ...ids]));
    if (Array.isArray(userIds) && userIds.length > 0) {
      selectedUserIds.value = Array.from(new Set([...selectedUserIds.value, ...userIds]));
    }
  } else {
    selectedSubIbIds.value = selectedSubIbIds.value.filter(
      (id) => !ids.includes(id),
    );
    if (Array.isArray(userIds) && userIds.length > 0) {
      selectedUserIds.value = selectedUserIds.value.filter(
        (uid) => !userIds.includes(uid),
      );
    }
  }
};

// Initialize selection from props / tree
const syncInitialSelection = () => {
  if (props.modelValue && typeof props.modelValue === "object") {
    if (props.modelValue.level !== undefined) {
      const lvl = Array.isArray(props.modelValue.level)
        ? props.modelValue.level[0]
        : props.modelValue.level;
      selectedLevel.value = Number(lvl ?? 0);
    }
    if (
      Array.isArray(props.modelValue.user_id) &&
      props.modelValue.user_id.length > 0
    ) {
      selectedUserIds.value = props.modelValue.user_id.map(Number);
    }
    if (
      Array.isArray(props.modelValue.ib_ids) &&
      props.modelValue.ib_ids.length > 0
    ) {
      selectedSubIbIds.value = props.modelValue.ib_ids.map(String);
      return;
    }
  } else if (
    typeof props.modelValue === "number" ||
    typeof props.modelValue === "string"
  ) {
    selectedLevel.value = Number(props.modelValue);
  }

  // Checkboxes start empty
  selectedSubIbIds.value = [];
  selectedUserIds.value = [];
};

watch(
  () => [props.tree, props.maxLevel],
  () => {
    expandedLevels.value[selectedLevel.value] = true;
    syncInitialSelection();
  },
  { immediate: true },
);

const selectedCount = computed(() => {
  return selectedSubIbIds.value.length;
});

const triggerLabel = computed(() => {
  if (selectedSubIbIds.value.length > 0) {
    return `Level ${selectedLevel.value} (${selectedSubIbIds.value.length} Selected)`;
  }
  return `Level ${selectedLevel.value}`;
});

const apply = () => {
  const resultPayload = {
    level: [selectedLevel.value],
    ib_ids: [...selectedSubIbIds.value],
  };
  if (selectedUserIds.value.length > 0) {
    resultPayload.user_id = [...selectedUserIds.value];
  }

  emit("update:modelValue", resultPayload);
  emit("apply", resultPayload);
  open.value = false;
};

const toggleDropdown = () => {
  open.value = !open.value;
};

// Use capture phase with a flag to skip the current event cycle
let skipNextClose = false;

const clickOutside = (e) => {
  if (skipNextClose) { skipNextClose = false; return; }
  if (e.target && !e.target.isConnected) return;
  if (!wrapper.value?.contains(e.target)) open.value = false;
};

onMounted(() => {
  window.addEventListener("click", clickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", clickOutside);
});
</script>
