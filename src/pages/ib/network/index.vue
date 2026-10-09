<template>
  <div class="space-y-6">
    <!-- Header with 3 Tabs (Table | Tree | Binary Tree) & Contextual Controls on the Right -->
    <div class="flex items-center justify-between gap-3 flex-nowrap overflow-x-auto no-scrollbar">
      <!-- 3 Navigation Tabs: Table | Tree | Binary Tree using BaseTabs -->
      <div class="w-auto shrink-0">
        <BaseTabs
          :tabs="networkTabs"
          v-model="activeTab"
          @update:model-value="setTab"
          class="!w-auto"
        />
      </div>

      <!-- Right Controls: Date Range / Tree Controls / Binary Controls + Refresh -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <!-- TAB 1 (Table): Date Range Picker -->
        <BaseDateRangePicker
          v-if="activeTab === 'table'"
          borderless
          rounded="full"
          button-class="!h-9 px-3.5 text-xs"
          class="w-fit"
          placement="left"
          v-model="summaryDateRange"
          @apply="onApplySummaryDateRange"
        />

        <!-- TAB 2 (Tree): Expand / Collapse -->
        <div v-else-if="activeTab === 'tree'" class="flex items-center gap-2">
          <div class="flex items-center gap-1 p-0.5 rounded-full bg-card-background h-9">
            <button
              type="button"
              class="h-8 px-3.5 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              :class="
                treeExpandMode === 'expand'
                  ? 'bg-button text-button-text font-bold shadow-xs'
                  : 'text-secondary-text hover:text-primary-text font-medium'
              "
              @click="handleTreeExpandAll"
            >
              <ChevronsDown :size="14" />
              <span>Expand All</span>
            </button>
            <button
              type="button"
              class="h-8 px-3.5 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              :class="
                treeExpandMode === 'collapse'
                  ? 'bg-button text-button-text font-bold shadow-xs'
                  : 'text-secondary-text hover:text-primary-text font-medium'
              "
              @click="handleTreeCollapseAll"
            >
              <ChevronsUp :size="14" />
              <span>Collapse All</span>
            </button>
          </div>
        </div>

        <!-- TAB 3 (Binary Tree): Orientation (BaseTabs), Search (BaseSearch), Expand/Collapse, Reset -->
        <div v-else-if="activeTab === 'binaryTree'" class="flex items-center gap-2 sm:gap-3">
          <!-- Orientation Switch using BaseTabs -->
          <div class="w-auto shrink-0">
            <BaseTabs
              :tabs="layoutTabs"
              v-model="binaryLayoutDirection"
              class="!w-auto"
            />
          </div>

          <!-- Search Box using BaseSearch -->
          <BaseSearch
            v-model="binarySearchQuery"
            placeholder="Search IB, Email, ID..."
            rounded="full"
            height="36px"
            container-class="w-36 sm:w-56"
          />

          <!-- Expand / Collapse / Reset Controls with Active / Inactive State -->
          <div class="flex items-center gap-1 p-0.5 rounded-full bg-card-background h-9">
            <Tooltip text="Expand All Branches" position="top">
              <button
                type="button"
                class="h-8 px-3 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                :class="
                  binaryExpandMode === 'expand'
                    ? 'bg-button text-button-text font-bold shadow-xs'
                    : 'text-secondary-text hover:text-primary-text font-medium'
                "
                @click="handleBinaryExpandAll"
              >
                <ChevronsDown :size="14" />
                <span class="hidden md:inline">Expand</span>
              </button>
            </Tooltip>

            <Tooltip text="Collapse to Root" position="top">
              <button
                type="button"
                class="h-8 px-3 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                :class="
                  binaryExpandMode === 'collapse'
                    ? 'bg-button text-button-text font-bold shadow-xs'
                    : 'text-secondary-text hover:text-primary-text font-medium'
                "
                @click="handleBinaryCollapseAll"
              >
                <ChevronsUp :size="14" />
                <span class="hidden md:inline">Collapse</span>
              </button>
            </Tooltip>

            <Tooltip text="Reset & Center View" position="top">
              <button
                type="button"
                class="h-8 w-8 rounded-full text-secondary-text hover:text-primary-text hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                @click="handleBinaryResetView"
              >
                <RotateCcw :size="14" />
              </button>
            </Tooltip>
          </div>
        </div>

        <!-- Page Refresh Button -->
        <Tooltip text="Refresh Network Data" position="left">
          <RefreshButton
            :loading="isRefreshing"
            :icon-size="15"
            button-class="!h-9 !w-9"
            @click="handleRefresh"
          />
        </Tooltip>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- TAB 1: TABLE VIEW                                          -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'table'" class="space-y-6">
      <!-- Top Summary Cards -->
      <div id="tour-ib-network-summary">
        <NetworkSummaryCards
          :loading="store.summaryLoading"
          :summary="store.summary"
        />
      </div>

      <div>
        <div class="flex items-center gap-1.5">
          <h2 class="text-xl font-bold text-primary-text dark:text-white">
            Level Wise Overview
          </h2>
          <Tooltip
            text="Detailed multi-tier performance and breakdown across IB levels"
            position="top"
            wrap
          >
            <Info
              :size="11"
              class="text-secondary-text/70 dark:text-slate-400 hover:text-primary-text dark:hover:text-white transition-colors cursor-pointer shrink-0"
            />
          </Tooltip>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-4 mt-3">
          <div
            id="tour-ib-network-filters"
            class="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <!-- 1. Level Select -->
            <BaseSelect
              v-model="selectedLevel"
              :options="levelOptions"
              :placeholder="levelPlaceholder"
              borderless
              rounded="full"
              class="min-w-[130px]"
              :disabled="isLevelLoading || levelOptions.length === 0"
              :is-loading="isLevelLoading"
              @update:model-value="onLevelChange"
            />

            <!-- 2. IBs Select -->
            <BaseSelect
              v-model="selectedIb"
              :options="ibOptions"
              :placeholder="ibPlaceholder"
              searchable
              borderless
              rounded="full"
              class="min-w-[160px]"
              :disabled="selectedLevel === null || selectedLevel === '' || isIbLoading || ibOptions.length === 0"
              :is-loading="isIbLoading"
              @update:model-value="onIbChange"
            />

            <!-- 3. Clients / Sub IBs Select -->
            <BaseSelect
              v-model="selectedClient"
              :options="clientOptions"
              :placeholder="clientPlaceholder"
              searchable
              borderless
              rounded="full"
              class="min-w-[160px]"
              :disabled="!selectedIb || isClientLoading || clientOptions.length === 0"
              :is-loading="isClientLoading"
              @update:model-value="onClientChange"
            />

            <!-- 4. Date Range Picker -->
            <BaseDateRangePicker
              borderless
              placement="left"
              v-model="overviewDateRange"
              @apply="onApplyOverviewDateRange"
            />

            <!-- 5. Clear Filters Button -->
            <button
              v-if="hasActiveFilters"
              type="button"
              @click="onResetFilters"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-button-text font-semibold rounded-full bg-button cursor-pointer shrink-0"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Combined Card: 3 Overview Cards + Chart -->
      <BaseCard
        id="tour-ib-network-chart"
        class="w-full"
        wrapperClass="h-auto bg-none bg-white dark:bg-card-background text-primary-text p-4 sm:p-6 space-y-6"
        :show-shine="false"
      >
        <NetworkOverviewCards
          :loading="store.overviewLoading"
          :overview="store.overview"
          :selected-metric="selectedOverviewMetric"
          @select="onSelectOverviewMetric"
        />
        <div class="mt-8">
          <NetworkChart
            :loading="store.overviewLoading"
            :series="store.chart"
            :selected-metric="selectedOverviewMetric"
          />
        </div>
      </BaseCard>

      <!-- Network Hierarchy & Datatable -->
      <div class="space-y-3">
        <h2 class="text-xl font-bold text-primary-text dark:text-white">
          Network Hierarchy & Datatable
        </h2>
        <IbTreeRow
          :nodes="
            store.networkTree
              ? [store.networkTree]
              : store.levelNodes?.ibs || []
          "
          :loading="store.overviewLoading"
          @assign-referral="openAssignReferral"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- TAB 2: TREE VIEW (Accordion Nested List as in panther-user) -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'tree'" class="space-y-4">
      <div
        v-if="treeStore.isLoading && !treeStore.treeData"
        class="space-y-3 animate-pulse"
      >
        <div
          v-for="n in 4"
          :key="n"
          class="p-4 rounded-xl bg-card-background border border-primary-border flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-slate-700/40" />
            <div class="space-y-1.5">
              <div class="h-3.5 w-32 bg-slate-700/40 rounded" />
              <div class="h-2.5 w-48 bg-slate-700/30 rounded" />
            </div>
          </div>
          <div class="h-4 w-20 bg-slate-700/40 rounded" />
        </div>
      </div>

      <IbTree
        v-else
        :items="treeDataList"
        :expanded="treeExpanded"
        @toggle="toggleTreeRow"
        @expand-all="expandAllTree"
        @collapse-all="collapseAllTree"
        @assign-referral="openAssignReferral"
      />
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- TAB 3: BINARY TREE VIEW (Interactive Vue Flow Graph)        -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div
      v-else-if="activeTab === 'binaryTree'"
      class="flex flex-col h-[calc(100vh-140px)] min-h-[600px]"
    >
      <!-- Main Graph Container directly takes full height without redundant toolbar row -->
      <div class="flex-1 min-h-0 relative">
        <IbHierarchyGraph
          ref="binaryGraphRef"
          :tree-data="treeStore.treeData || store.networkTree"
          :search-query="binarySearchQuery"
          :layout-direction="binaryLayoutDirection"
          @select-node="onSelectBinaryNode"
        />
      </div>

      <!-- Details Slide-over Drawer -->
      <IbNodeDetailDrawer
        :open="isBinaryDrawerOpen"
        :node="selectedBinaryNode"
        @close="isBinaryDrawerOpen = false"
      />
    </div>

    <!-- Referral Drawer shared across tabs -->
    <SubIbReferralLinksDrawer
      :open="subIbDrawer.open"
      :node="subIbDrawer.node"
      @close="subIbDrawer.open = false"
    />

    <div>
      <Disclaimer :data="disclaimerData" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { Info, ChevronsDown, ChevronsUp, RotateCcw } from "lucide-vue-next";
import { useMyNetworkIBStore } from "@/stores/ib/network";
import { useIbTreeStore } from "@/stores/ib/tree";

// Components
import BaseTabs from "@/components/base/BaseTabs.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import BaseCard from "@/components/base/BaseCard.vue";
import Disclaimer from "@/components/common/Disclaimer.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";

import NetworkSummaryCards from "@/components/ib/network/NetworkSummaryCards.vue";
import NetworkOverviewCards from "@/components/ib/network/NetworkOverviewCards.vue";
import NetworkChart from "@/components/ib/network/NetworkChart.vue";
import IbTreeRow from "@/components/ib/network/IbTreeRow.vue";
import IbTree from "@/components/ib/network/IbTree.vue";
import SubIbReferralLinksDrawer from "@/components/ib/network/SubIbReferralLinksDrawer.vue";

// Graph Components for Binary Tree
import IbHierarchyGraph from "@/components/ib/tree/IbHierarchyGraph.vue";
import IbNodeDetailDrawer from "@/components/ib/tree/IbNodeDetailDrawer.vue";

const route = useRoute();
const router = useRouter();

const store = useMyNetworkIBStore();
const treeStore = useIbTreeStore();

// ─── Tabs Configuration using BaseTabs ────────────────────────
const networkTabs = [
  { label: "Table", value: "table" },
  { label: "Tree", value: "tree" },
  { label: "Binary Tree", value: "binaryTree" },
];

const layoutTabs = [
  { label: "Vertical", value: "TB" },
  { label: "Horizontal", value: "LR" },
];

// ─── Active Tab State (table | tree | binaryTree) ─────────────
const activeTab = ref(
  route.query.tab === "tree" || route.query.tab === "binaryTree"
    ? route.query.tab
    : "table",
);

const setTab = (tab) => {
  activeTab.value = tab;
  router.replace({
    query: { ...route.query, tab },
  });
  if (tab === "tree" || tab === "binaryTree") {
    treeStore.fetchIbTree();
  }
};

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && ["table", "tree", "binaryTree"].includes(newTab)) {
      activeTab.value = newTab;
    }
  },
);

// ─── Drawer & Referral Link State ─────────────────────────────
const subIbDrawer = ref({ open: false, node: null });

const openAssignReferral = (node) => {
  subIbDrawer.value = {
    open: true,
    node,
  };
};

// ─── Tab 2 (Tree Accordion) State ──────────────────────────────
const treeExpanded = ref({});
const treeExpandMode = ref("collapse");

const treeDataList = computed(() => {
  const root = treeStore.treeData || store.networkTree;
  if (!root) return [];
  return Array.isArray(root) ? root : [root];
});

const toggleTreeRow = (id) => {
  treeExpanded.value = {
    ...treeExpanded.value,
    [id]: !treeExpanded.value[id],
  };
};

function collectAllNodeIds(node, res = {}) {
  if (!node) return res;
  if (node.ib_id !== undefined && node.ib_id !== null) {
    res[node.ib_id] = true;
  }
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((c) => collectAllNodeIds(c, res));
  }
  return res;
}

const handleTreeExpandAll = () => {
  treeExpandMode.value = "expand";
  const root = treeStore.treeData || store.networkTree;
  if (root) {
    treeExpanded.value = collectAllNodeIds(root);
  }
};

const handleTreeCollapseAll = () => {
  treeExpandMode.value = "collapse";
  treeExpanded.value = {};
};

const expandAllTree = handleTreeExpandAll;
const collapseAllTree = handleTreeCollapseAll;

// ─── Tab 3 (Binary Tree / Vue Flow Graph) State ────────────────
const binaryGraphRef = ref(null);
const binarySearchQuery = ref("");
const binaryLayoutDirection = ref("TB"); // Vertical (Top-to-Bottom) default
const binaryExpandMode = ref("expand"); // 'expand' | 'collapse'
const selectedBinaryNode = ref(null);
const isBinaryDrawerOpen = ref(false);

const onSelectBinaryNode = (node) => {
  selectedBinaryNode.value = node;
  isBinaryDrawerOpen.value = true;
};

const handleBinaryExpandAll = () => {
  binaryExpandMode.value = "expand";
  if (binaryGraphRef.value) {
    binaryGraphRef.value.expandAll();
  }
};

const handleBinaryCollapseAll = () => {
  binaryExpandMode.value = "collapse";
  if (binaryGraphRef.value) {
    binaryGraphRef.value.collapseAll();
  }
};

const handleBinaryResetView = () => {
  if (binaryGraphRef.value) {
    binaryGraphRef.value.resetView();
  }
};

// ─── Tab 1 (Table View) Store Data ─────────────────────────────
const {
  summaryLoading,
  overviewLoading,
  summary,
  overview,
  chart,
  maxLevel,
  levelNodes,
  summaryDateRange,
  overviewDateRange,
} = storeToRefs(store);

const selectedOverviewMetric = ref("accounts");
const selectedLevel = ref(null);
const selectedIb = ref(null);
const selectedClient = ref(null);

const isLevelLoading = ref(false);
const isIbLoading = ref(false);
const isClientLoading = ref(false);

// Local cache so dropdown options never collapse when filtering to a leaf user
const cachedLevelIbs = ref([]);
const cachedIbClients = ref([]);

// Sync cache whenever levelNodes updates with available IBs/Clients
watch(
  () => store.levelNodes,
  (newNodes) => {
    if (newNodes?.ibs && newNodes.ibs.length > 0) {
      if (!selectedIb.value) {
        cachedLevelIbs.value = newNodes.ibs;
      }
    }
    if (selectedIb.value) {
      const match =
        (cachedLevelIbs.value || []).find(
          (ib) => (ib.user_id || ib.ib_id) == selectedIb.value,
        ) ||
        (newNodes?.ibs || []).find(
          (ib) => (ib.user_id || ib.ib_id) == selectedIb.value,
        );
      if (match?.clients?.length) {
        cachedIbClients.value = match.clients;
      }
    }
  },
  { immediate: true, deep: true },
);

const levelOptions = computed(() => {
  const opts = [];
  if (store.levels && store.levels.length > 0) {
    store.levels.forEach((lvl) => {
      opts.push({
        label: lvl.name || `Level ${lvl.id}`,
        value: lvl.id,
      });
    });
  } else if (maxLevel.value !== undefined && maxLevel.value !== null) {
    for (let i = 0; i <= maxLevel.value; i++) {
      opts.push({
        label: `Level ${i}`,
        value: i,
      });
    }
  }
  return opts;
});

const ibOptions = computed(() => {
  const list =
    cachedLevelIbs.value.length > 0
      ? cachedLevelIbs.value
      : levelNodes.value?.ibs || [];
  const opts = [];
  list.forEach((ib) => {
    opts.push({
      label: `${ib.name || ib.email || "IB"}${ib.ib_id ? ` (#${ib.ib_id})` : ""}`,
      value: ib.user_id || ib.ib_id,
      raw: ib,
    });
  });
  return opts;
});

const clientOptions = computed(() => {
  let list = [];
  if (selectedIb.value) {
    if (cachedIbClients.value && cachedIbClients.value.length > 0) {
      list = cachedIbClients.value;
    } else {
      const matchingIb =
        (cachedLevelIbs.value || []).find(
          (ib) => (ib.user_id || ib.ib_id) == selectedIb.value,
        ) ||
        (levelNodes.value?.ibs || []).find(
          (ib) => (ib.user_id || ib.ib_id) == selectedIb.value,
        );
      if (
        matchingIb &&
        Array.isArray(matchingIb.clients) &&
        matchingIb.clients.length > 0
      ) {
        list = matchingIb.clients;
      } else {
        list = levelNodes.value?.clients || [];
      }
    }
  } else {
    list =
      cachedIbClients.value.length > 0
        ? cachedIbClients.value
        : levelNodes.value?.clients || [];
  }

  const opts = [];
  list.forEach((c) => {
    opts.push({
      label: `${c.name || c.email || "Sub IB"}${c.user_id ? ` (#${c.user_id})` : ""}`,
      value: c.user_id,
      raw: c,
    });
  });
  return opts;
});

const levelPlaceholder = computed(() => {
  if (isLevelLoading.value) return "Loading Levels...";
  if (levelOptions.value.length === 0) return "No Levels found";
  return "Select Level";
});

const ibPlaceholder = computed(() => {
  if (selectedLevel.value === null || selectedLevel.value === "" || selectedLevel.value === undefined) {
    return "Select IB";
  }
  if (isIbLoading.value) return "Loading IBs...";
  if (ibOptions.value.length === 0) return "No IBs found";
  return "Select IB";
});

const clientPlaceholder = computed(() => {
  if (!selectedIb.value) return "Select Sub IB";
  if (isClientLoading.value) return "Loading Sub-IBs...";
  if (clientOptions.value.length === 0) return "No Sub-IBs found";
  return "Select Sub IB";
});

const hasActiveFilters = computed(() => {
  const hasLevel = selectedLevel.value !== null && selectedLevel.value !== "" && selectedLevel.value !== undefined;
  const hasIb = selectedIb.value !== null && selectedIb.value !== "" && selectedIb.value !== undefined;
  const hasClient =
    selectedClient.value !== null && selectedClient.value !== "" && selectedClient.value !== undefined;
  const hasDate = Boolean(
    overviewDateRange.value?.[0] || overviewDateRange.value?.[1],
  );
  return hasLevel || hasIb || hasClient || hasDate;
});

const onSelectOverviewMetric = (metricKey) => {
  selectedOverviewMetric.value = metricKey;
  store.setChartMetric(metricKey);
};

const updateSummary = () => {
  store.fetchOverallDistribution(summaryDateRange.value);
};

const onApplySummaryDateRange = (range) => {
  store.fetchOverallDistribution(range);
};

const getFetchPayload = (range = overviewDateRange.value) => {
  const payload = {
    range,
    metric: selectedOverviewMetric.value,
  };

  const activeUserId = selectedClient.value || selectedIb.value;
  if (
    activeUserId !== "" &&
    activeUserId !== null &&
    activeUserId !== undefined
  ) {
    payload.user_id = [Number(activeUserId)];
  } else if (
    selectedLevel.value !== "" &&
    selectedLevel.value !== null &&
    selectedLevel.value !== undefined
  ) {
    payload.level = [Number(selectedLevel.value)];
  }

  return payload;
};

const onLevelChange = async (val) => {
  selectedLevel.value = val;
  selectedIb.value = null;
  selectedClient.value = null;
  cachedIbClients.value = [];

  const payload = {
    range: overviewDateRange.value,
    metric: selectedOverviewMetric.value,
  };
  if (val !== "" && val !== null && val !== undefined) {
    payload.level = [Number(val)];
    isLevelLoading.value = true;
    isIbLoading.value = true;
  }

  try {
    await store.fetchDetailedOverview(payload);
    if (store.levelNodes?.ibs) {
      cachedLevelIbs.value = store.levelNodes.ibs;
    }
  } finally {
    isLevelLoading.value = false;
    isIbLoading.value = false;
  }
};

const onIbChange = async (val) => {
  selectedIb.value = val;
  selectedClient.value = null;

  if (val) {
    const matchingIb =
      (cachedLevelIbs.value || []).find(
        (ib) => (ib.user_id || ib.ib_id) == val,
      ) ||
      (store.levelNodes?.ibs || []).find(
        (ib) => (ib.user_id || ib.ib_id) == val,
      );
    if (matchingIb?.clients?.length) {
      cachedIbClients.value = matchingIb.clients;
    } else {
      cachedIbClients.value = [];
    }
  } else {
    cachedIbClients.value = [];
  }

  const payload = {
    range: overviewDateRange.value,
    metric: selectedOverviewMetric.value,
  };

  if (val !== "" && val !== null && val !== undefined) {
    payload.user_id = [Number(val)];
    isIbLoading.value = true;
    isClientLoading.value = true;
  } else {
    if (
      selectedLevel.value !== "" &&
      selectedLevel.value !== null &&
      selectedLevel.value !== undefined
    ) {
      payload.level = [Number(selectedLevel.value)];
    }
    isIbLoading.value = true;
  }

  try {
    await store.fetchDetailedOverview(payload);
  } finally {
    isIbLoading.value = false;
    isClientLoading.value = false;
  }
};

const onClientChange = async (val) => {
  selectedClient.value = val;

  const payload = {
    range: overviewDateRange.value,
    metric: selectedOverviewMetric.value,
  };

  const targetId = val || selectedIb.value;
  if (targetId !== "" && targetId !== null && targetId !== undefined) {
    payload.user_id = [Number(targetId)];
  } else if (
    selectedLevel.value !== "" &&
    selectedLevel.value !== null &&
    selectedLevel.value !== undefined
  ) {
    payload.level = [Number(selectedLevel.value)];
  }

  isClientLoading.value = true;
  try {
    await store.fetchDetailedOverview(payload);
  } finally {
    isClientLoading.value = false;
  }
};

const onResetFilters = async () => {
  selectedLevel.value = null;
  selectedIb.value = null;
  selectedClient.value = null;
  overviewDateRange.value = [null, null];
  cachedLevelIbs.value = [];
  cachedIbClients.value = [];

  isLevelLoading.value = true;
  try {
    await store.fetchDetailedOverview({
      range: [null, null],
      metric: selectedOverviewMetric.value,
    });
    if (store.levelNodes?.ibs) {
      cachedLevelIbs.value = store.levelNodes.ibs;
    }
  } finally {
    isLevelLoading.value = false;
  }
};

const onApplyOverviewDateRange = (range) => {
  overviewDateRange.value = range;
  store.fetchDetailedOverview(getFetchPayload(range));
};

// ─── Page Refresh ─────────────────────────────────────────────
const manualRefreshing = ref(false);

const isRefreshing = computed(() => {
  if (manualRefreshing.value) return true;
  if (activeTab.value === "table") {
    return summaryLoading.value || overviewLoading.value;
  }
  return treeStore.isLoading;
});

const handleRefresh = () => {
  manualRefreshing.value = true;
  if (activeTab.value === "table") {
    store.fetchLevels();
    updateSummary();
    store.fetchDetailedOverview(getFetchPayload());
  } else if (activeTab.value === "tree" || activeTab.value === "binaryTree") {
    treeStore.fetchIbTree(true);
  }
  setTimeout(() => {
    manualRefreshing.value = false;
  }, 600);
};

onMounted(async () => {
  store.fetchLevels();
  if (activeTab.value === "tree" || activeTab.value === "binaryTree") {
    treeStore.fetchIbTree();
  }
  updateSummary();
  store.fetchDetailedOverview({
    range: overviewDateRange.value,
    metric: selectedOverviewMetric.value,
  });
});

const disclaimerData = [
  {
    heading: "Disclaimer",
    description:
      "The information presented on this page is intended exclusively for informational and regulatory transparency purposes. It should not be interpreted as an invitation, solicitation, or recommendation to participate in any financial service, investment, or transaction. Trading leveraged financial instruments such as Foreign Exchange (Forex) and Contracts for Difference (CFDs) carries substantial risk and can result in losses exceeding the initial capital invested. These products may not be appropriate for every investor, as leverage magnifies both profits and losses, and traders do not gain ownership of the underlying assets. Historical performance is not a reliable indicator of future outcomes..",
  },
  {
    heading: "Regional Restrictions",
    description:
      "The information presented on this page is intended exclusively for informational and regulatory transparency purposes. It should not be interpreted as an invitation, solicitation, or recommendation to participate in any financial service, investment, or transaction. Trading leveraged financial instruments such as Foreign Exchange (Forex) and Contracts for Difference (CFDs) carries substantial risk and can result in losses exceeding the initial capital invested. These products may not be appropriate for every investor, as leverage magnifies both profits and losses, and traders do not gain ownership of the underlying assets. Historical performance is not a reliable indicator of future outcomes..",
  },
];
</script>
