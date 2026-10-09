<template>
  <div class="w-full select-none text-xs sm:text-sm">
    <!-- Sub-IB Row -->
    <div
      class="relative flex items-center gap-2 py-2 pr-3 pl-2 rounded-lg transition-colors group"
      :class="[
        isDisabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-background/60 cursor-pointer',
      ]"
      @click="!isDisabled && onRowClick()"
    >
      <!-- Tree Branch Guide Line -->
      <div
        class="absolute -left-3.5 top-1/2 w-3.5 border-b border-primary-border/70 pointer-events-none"
      ></div>

      <!-- Expand/Collapse Chevron (only if node has sub_ibs or total_sub_ibs > 0) -->
      <button
        v-if="hasChildren"
        type="button"
        @click.stop="toggleExpand"
        class="w-4 h-4 flex items-center justify-center text-secondary-text hover:text-primary-text transition-transform shrink-0 cursor-pointer"
        :class="isExpanded ? 'rotate-90' : ''"
      >
        <BaseIcon name="chevron_right" :size="15" />
      </button>
      <div v-else class="w-4 h-4 shrink-0"></div>

      <!-- Checkbox — ONLY selects this node, no cascade -->
      <input
        type="checkbox"
        class="w-4 h-4 rounded border-primary-border accent-primary-blue shrink-0"
        :class="isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
        :checked="isSelected"
        :disabled="isDisabled"
        @click.stop
        @change="!isDisabled && toggleSelect()"
      />

      <!-- Sub-IB Name -->
      <span class="font-bold text-primary-text truncate flex-1">
        {{ node.name }}
      </span>

      <!-- Level Badge -->
      <span
        class="px-2 py-0.5 text-[11px] font-medium rounded-md bg-secondary-text/10 text-secondary-text shrink-0"
      >
        Level {{ node.level ?? 1 }}
      </span>
    </div>

    <!-- Recursive Nested Children -->
    <div
      v-if="isExpanded && hasChildren"
      class="relative ml-7 pl-3.5 border-l border-primary-border/70 space-y-1 mt-0.5"
    >
      <NetworkTreeNode
        v-for="child in node.sub_ibs"
        :key="child.id || child.ib_id || child.user_id"
        :node="child"
        :selected-ids="selectedIds"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import BaseIcon from "@/components/base/BaseIcon.vue";

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  selectedIds: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["toggle"]);

// Collapsed by default
const isExpanded = ref(false);

const hasChildren = computed(() => {
  return (
    (Array.isArray(props.node.sub_ibs) && props.node.sub_ibs.length > 0) ||
    Number(props.node.total_sub_ibs || 0) > 0
  );
});

const nodeId = computed(() => {
  return String(
    props.node.id ?? props.node.ib_id ?? props.node.user_id ?? props.node.name
  );
});

// Collect only direct node's own id + user_id (NO children cascade)
const getSelfIds = () => {
  const ids = [nodeId.value];
  const userIds = [];
  if (props.node.user_id !== undefined && props.node.user_id !== null) {
    userIds.push(Number(props.node.user_id));
  }
  return { ids, userIds };
};

// Collect all descendant IDs (used to check if any child is selected → disable parent)
const getAllDescendantIds = (item) => {
  const ids = [];
  const id = String(item.id ?? item.ib_id ?? item.user_id ?? item.name);
  ids.push(id);
  if (Array.isArray(item.sub_ibs)) {
    for (const child of item.sub_ibs) {
      ids.push(...getAllDescendantIds(child));
    }
  }
  return ids;
};

// Is this node itself selected?
const isSelected = computed(() => props.selectedIds.includes(nodeId.value));

// Is this node disabled because a child/descendant is selected?
const isDisabled = computed(() => {
  if (isSelected.value) return false; // if self selected, not disabled
  if (!hasChildren.value) return false; // leaf node can never be disabled by children
  // Collect all descendant IDs (excluding self)
  const descendantIds = getAllDescendantIds(props.node).filter(
    (id) => id !== nodeId.value
  );
  // Disabled if any descendant is currently selected
  return descendantIds.some((id) => props.selectedIds.includes(id));
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// Toggle: only selects/deselects THIS node (no cascade to children)
const toggleSelect = () => {
  if (isDisabled.value) return;
  const { ids, userIds } = getSelfIds();
  emit("toggle", {
    node: props.node,
    ids,
    userIds,
    selected: !isSelected.value,
  });
};

const onRowClick = () => {
  if (!isDisabled.value) toggleSelect();
};
</script>
