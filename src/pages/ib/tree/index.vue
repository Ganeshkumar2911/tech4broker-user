<script setup>
import { ref, computed, onMounted } from "vue";
import { Search, RefreshCw, ChevronsDown, ChevronsUp, RotateCcw, Info, Users, Network, DollarSign } from "lucide-vue-next";
import { useIbTreeStore } from "@/stores/ib/tree";

import IbHierarchyGraph from "@/components/ib/tree/IbHierarchyGraph.vue";
import IbNodeDetailDrawer from "@/components/ib/tree/IbNodeDetailDrawer.vue";
import Tooltip from "@/components/base/Tooltip.vue";

const store = useIbTreeStore();
const searchQuery = ref("");
const graphRef = ref(null);

const selectedNode = ref(null);
const isDrawerOpen = ref(false);

const LEVEL_THEMES = [
  { label: "L0", color: "bg-emerald-500", text: "text-emerald-400" },
  { label: "L1", color: "bg-teal-500", text: "text-teal-400" },
  { label: "L2", color: "bg-violet-500", text: "text-violet-400" },
  { label: "L3", color: "bg-amber-500", text: "text-amber-400" },
  { label: "L4", color: "bg-rose-500", text: "text-rose-400" },
  { label: "L5", color: "bg-sky-500", text: "text-sky-400" },
];

const onSelectNode = (node) => {
  selectedNode.value = node;
  isDrawerOpen.value = true;
};

const handleExpandAll = () => {
  if (graphRef.value) {
    graphRef.value.expandAll();
  }
};

const handleCollapseAll = () => {
  if (graphRef.value) {
    graphRef.value.collapseAll();
  }
};

const handleResetView = () => {
  if (graphRef.value) {
    graphRef.value.resetView();
  }
};

const handleRefresh = () => {
  store.fetchIbTree(true);
};

// Summary metrics computed
const totalNetworkClients = computed(() => {
  return store.treeData?.total_overall_clients ?? store.treeData?.total_clients ?? 0;
});

const totalSubIbs = computed(() => {
  return store.treeData?.total_sub_ibs ?? (store.treeData?.children?.length || 0);
});

onMounted(() => {
  store.fetchIbTree();
});
</script>

<template>
  <div class="space-y-4 flex flex-col h-[calc(100vh-100px)]">
    <!-- Header matching Screenshot 1 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-primary-text tracking-tight">
            IB Hierarchy
          </h1>
          <BaseBadge value="Live Tree" variant="success" size="2xs" />
        </div>
        <p class="text-xs text-secondary-text mt-0.5">
          Scroll to zoom, drag to pan. Click a node to collapse/expand its branch.
        </p>
      </div>

      <!-- Quick Action Controls & Search -->
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <!-- Search Input -->
        <div class="relative w-full sm:w-60">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search IB, Email, ID..."
            class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-card-background border border-primary-border text-primary-text placeholder:text-secondary-text outline-none focus:border-primary transition-colors shadow-inner"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-secondary-text hover:text-primary-text"
            @click="searchQuery = ''"
          >
            ×
          </button>
        </div>

        <!-- Level Badges Legend -->
        <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card-background border border-primary-border text-xs text-secondary-text shadow-sm">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Levels:</span>
          <div class="flex items-center gap-1.5">
            <span
              v-for="lvl in LEVEL_THEMES"
              :key="lvl.label"
              class="inline-flex items-center gap-1 text-[10px] font-semibold"
              :class="lvl.text"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="lvl.color" />
              {{ lvl.label }}
            </span>
          </div>
        </div>

        <!-- Expand / Collapse All -->
        <div class="flex items-center gap-1 bg-card-background border border-primary-border rounded-xl p-1 shadow-sm">
          <Tooltip text="Expand All Branches" position="top">
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-xs font-medium text-secondary-text hover:text-primary-text hover:bg-primary-border/40 flex items-center gap-1 transition-colors cursor-pointer"
              @click="handleExpandAll"
            >
              <ChevronsDown class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Expand</span>
            </button>
          </Tooltip>

          <Tooltip text="Collapse to Root" position="top">
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-xs font-medium text-secondary-text hover:text-primary-text hover:bg-primary-border/40 flex items-center gap-1 transition-colors cursor-pointer"
              @click="handleCollapseAll"
            >
              <ChevronsUp class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Collapse</span>
            </button>
          </Tooltip>

          <Tooltip text="Reset & Center View" position="top">
            <button
              type="button"
              class="p-1.5 rounded-lg text-secondary-text hover:text-primary-text hover:bg-primary-border/40 transition-colors cursor-pointer"
              @click="handleResetView"
            >
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        <!-- Refresh Button -->
        <Tooltip text="Reload live tree data" position="left">
          <button
            type="button"
            :disabled="store.isLoading"
            class="p-2 rounded-xl bg-card-background border border-primary-border text-secondary-text hover:text-primary-text hover:bg-primary-border/40 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            @click="handleRefresh"
          >
            <RefreshCw
              class="w-3.5 h-3.5"
              :class="{ 'animate-spin': store.isLoading }"
            />
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- Main Canvas Viewport -->
    <div class="flex-1 min-h-0 relative">
      <!-- Loading Skeleton -->
      <div
        v-if="store.isLoading && !store.treeData"
        class="w-full h-full min-h-[550px] bg-card-background border border-primary-border rounded-2xl flex flex-col items-center justify-center gap-3 animate-pulse"
      >
        <RefreshCw class="w-8 h-8 text-emerald-400 animate-spin" />
        <p class="text-xs text-slate-400 font-medium">Generating interactive IB hierarchy...</p>
      </div>

      <!-- Interactive Vue Flow Graph -->
      <IbHierarchyGraph
        v-else
        ref="graphRef"
        :tree-data="store.treeData"
        :search-query="searchQuery"
        @select-node="onSelectNode"
      />
    </div>

    <!-- Details Slide-over Drawer -->
    <IbNodeDetailDrawer
      :open="isDrawerOpen"
      :node="selectedNode"
      @close="isDrawerOpen = false"
    />
  </div>
</template>

<style scoped>
</style>
