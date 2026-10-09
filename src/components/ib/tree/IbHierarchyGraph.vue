<script setup>
import { ref, watch, computed, nextTick, onMounted } from "vue";
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import dagre from "@dagrejs/dagre";
import { useThemeStore } from "@/stores/shared/theme";

// Styles for Vue Flow
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";

import PlatformNode from "./PlatformNode.vue";
import IbNode from "./IbNode.vue";

const props = defineProps({
  treeData: {
    type: Object,
    default: () => null,
  },
  searchQuery: {
    type: String,
    default: "",
  },
  showPlatformRoot: {
    type: Boolean,
    default: true,
  },
  layoutDirection: {
    type: String,
    default: "TB", // "TB" = Vertical (Top-to-Bottom), "LR" = Horizontal (Left-to-Right)
  },
});

const emit = defineEmits(["select-node"]);

const themeStore = useThemeStore();
const { fitView, setCenter, getNodes } = useVueFlow();

const nodes = ref([]);
const edges = ref([]);
const expandedIds = ref(new Set());
const selectedNodeId = ref(null);

const bgDotColor = computed(() => {
  return themeStore.isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(100, 116, 139, 0.35)";
});

// Watch for theme changes to re-render edges with proper contrast
watch(
  () => themeStore.isDark,
  () => {
    rebuildGraph();
  }
);

// Collect all node IDs recursively for "Expand All"
const getAllNodeIds = (node, acc = new Set()) => {
  if (!node) return acc;
  const id = node.ib_id ?? node.id;
  if (id !== undefined && id !== null) {
    acc.add(String(id));
  }
  if (Array.isArray(node.children)) {
    node.children.forEach((c) => getAllNodeIds(c, acc));
  }
  return acc;
};

// Expand all nodes
const expandAll = () => {
  if (props.treeData) {
    const all = getAllNodeIds(props.treeData);
    expandedIds.value = all;
    rebuildGraph();
    nextTick(() => fitView({ padding: 0.2, duration: 400 }));
  }
};

// Collapse all nodes except root
const collapseAll = () => {
  expandedIds.value = new Set();
  rebuildGraph();
  nextTick(() => fitView({ padding: 0.2, duration: 400 }));
};

// Toggle a single node expansion
const toggleNode = (nodeId) => {
  const strId = String(nodeId);
  const next = new Set(expandedIds.value);
  if (next.has(strId)) {
    next.delete(strId);
  } else {
    next.add(strId);
  }
  expandedIds.value = next;
  rebuildGraph();
};

// Select node for detailed analytics drawer
const handleSelectNode = (rawNode) => {
  selectedNodeId.value = rawNode.ib_id ?? rawNode.id;
  emit("select-node", rawNode);
  rebuildGraph();
};

// Check if a node matches search query
const isSearchMatch = (node) => {
  if (!props.searchQuery || !props.searchQuery.trim()) return false;
  const query = props.searchQuery.toLowerCase().trim();
  const name = String(node.name || "").toLowerCase();
  const email = String(node.email || "").toLowerCase();
  const ibId = String(node.ib_id || "").toLowerCase();
  const refCode = String(node.referral_code || "").toLowerCase();
  return (
    name.includes(query) ||
    email.includes(query) ||
    ibId.includes(query) ||
    refCode.includes(query)
  );
};

// Layout with Dagre
const rebuildGraph = () => {
  if (!props.treeData) {
    nodes.value = [];
    edges.value = [];
    return;
  }

  const isHorizontal = props.layoutDirection === "LR";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: isHorizontal ? "LR" : "TB",
    nodesep: isHorizontal ? 30 : 40,
    ranksep: isHorizontal ? 70 : 60,
    marginx: 50,
    marginy: 50,
  });

  const nodeWidth = 240;
  const nodeHeight = 64;
  const platformWidth = 110;
  const platformHeight = 36;

  const rawNodesMap = new Map();
  const graphNodes = [];
  const graphEdges = [];

  const edgeStroke = themeStore.isDark
    ? "rgba(100, 116, 139, 0.45)"
    : "rgba(100, 116, 139, 0.65)";
  const rootEdgeStroke = themeStore.isDark
    ? "rgba(16, 185, 129, 0.55)"
    : "#10b981";

  // 1. Add Platform Root Node if enabled
  if (props.showPlatformRoot) {
    const platformId = "platform-root";
    dagreGraph.setNode(platformId, {
      width: platformWidth,
      height: platformHeight,
    });
    rawNodesMap.set(platformId, {
      id: platformId,
      isPlatform: true,
      label: "Platform",
    });
  }

  // 2. Recursive function to traverse tree and register visible nodes & edges
  const traverse = (node, parentId = null) => {
    if (!node) return;

    const id = String(node.ib_id ?? node.id ?? "root");
    const children = Array.isArray(node.children) ? node.children : [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.value.has(id);

    dagreGraph.setNode(id, { width: nodeWidth, height: nodeHeight });
    rawNodesMap.set(id, {
      ...node,
      id,
      hasChildren,
      childCount: children.length,
      isExpanded,
      raw: node,
    });

    // Connect from parent
    if (parentId) {
      dagreGraph.setEdge(parentId, id);
      graphEdges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: "bezier",
        style: {
          stroke: edgeStroke,
          strokeWidth: 1.5,
        },
      });
    } else if (props.showPlatformRoot) {
      dagreGraph.setEdge("platform-root", id);
      graphEdges.push({
        id: `e-platform-root-${id}`,
        source: "platform-root",
        target: id,
        type: "bezier",
        style: {
          stroke: rootEdgeStroke,
          strokeWidth: 1.5,
        },
      });
    }

    // Traverse children only if this node is expanded
    if (hasChildren && isExpanded) {
      children.forEach((child) => traverse(child, id));
    }
  };

  // If root data has children (or is root itself)
  const rootNode = props.treeData;
  if (Array.isArray(rootNode)) {
    rootNode.forEach((r) => traverse(r, null));
  } else {
    traverse(rootNode, null);
  }

  // 3. Compute layout coordinates
  dagre.layout(dagreGraph);

  // 4. Generate Vue Flow nodes with computed (x, y)
  dagreGraph.nodes().forEach((nodeId) => {
    const nodeObj = dagreGraph.node(nodeId);
    const rawData = rawNodesMap.get(nodeId);
    if (!nodeObj || !rawData) return;

    const isPlatform = rawData.isPlatform === true;
    const w = isPlatform ? platformWidth : nodeWidth;
    const h = isPlatform ? platformHeight : nodeHeight;

    const matchesSearch = !isPlatform && isSearchMatch(rawData);
    const isSelected = !isPlatform && selectedNodeId.value === (rawData.ib_id ?? rawData.id);

    graphNodes.push({
      id: nodeId,
      type: isPlatform ? "platform" : "ib",
      position: {
        x: nodeObj.x - w / 2,
        y: nodeObj.y - h / 2,
      },
      sourcePosition: isHorizontal ? "right" : "bottom",
      targetPosition: isHorizontal ? "left" : "top",
      data: {
        ...rawData,
        layoutDirection: props.layoutDirection,
        isSearchMatch: matchesSearch,
        isSelected,
        onToggle: toggleNode,
        onSelect: handleSelectNode,
      },
    });
  });

  nodes.value = graphNodes;
  edges.value = graphEdges;
};

// Watch for layout direction switch (TB <-> LR)
watch(
  () => props.layoutDirection,
  () => {
    rebuildGraph();
    nextTick(() => {
      fitView({ padding: 0.25, duration: 400 });
    });
  }
);

// Auto-expand Level 0 and Level 1 by default on first load
const initExpandedState = () => {
  const initSet = new Set();
  const scan = (node, depth = 0) => {
    if (!node || depth > 1) return;
    const id = String(node.ib_id ?? node.id);
    initSet.add(id);
    if (Array.isArray(node.children)) {
      node.children.forEach((c) => scan(c, depth + 1));
    }
  };

  if (props.treeData) {
    if (Array.isArray(props.treeData)) {
      props.treeData.forEach((r) => scan(r, 0));
    } else {
      scan(props.treeData, 0);
    }
  }

  expandedIds.value = initSet;
  rebuildGraph();
  nextTick(() => {
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 400 });
    }, 100);
  });
};

// Watch for data changes
watch(
  () => props.treeData,
  () => {
    initExpandedState();
  },
  { immediate: true }
);

// Watch for search query changes and auto-expand path to matches
watch(
  () => props.searchQuery,
  (query) => {
    if (!query || !query.trim()) {
      rebuildGraph();
      return;
    }

    const matches = [];

    // Find paths to all matches and expand them
    const findMatchesAndParents = (node, path = []) => {
      if (!node) return;
      const id = String(node.ib_id ?? node.id);
      const currentPath = [...path, id];

      if (isSearchMatch(node)) {
        matches.push({ node, path: currentPath });
      }

      if (Array.isArray(node.children)) {
        node.children.forEach((c) => findMatchesAndParents(c, currentPath));
      }
    };

    if (props.treeData) {
      if (Array.isArray(props.treeData)) {
        props.treeData.forEach((r) => findMatchesAndParents(r, []));
      } else {
        findMatchesAndParents(props.treeData, []);
      }
    }

    if (matches.length > 0) {
      const nextExpanded = new Set(expandedIds.value);
      matches.forEach((m) => {
        m.path.forEach((pId) => nextExpanded.add(pId));
      });
      expandedIds.value = nextExpanded;
      rebuildGraph();

      // Focus on first match
      nextTick(() => {
        const firstMatchId = String(matches[0].node.ib_id ?? matches[0].node.id);
        const flowNode = nodes.value.find((n) => n.id === firstMatchId);
        if (flowNode) {
          setCenter(flowNode.position.x + 120, flowNode.position.y + 32, {
            zoom: 1.1,
            duration: 500,
          });
        }
      });
    } else {
      rebuildGraph();
    }
  }
);

defineExpose({
  expandAll,
  collapseAll,
  resetView: () => fitView({ padding: 0.25, duration: 400 }),
});
</script>

<template>
  <div class="relative w-full h-full min-h-[600px] bg-background overflow-hidden rounded-2xl border border-primary-border transition-colors">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :default-viewport="{ zoom: 0.85 }"
      :min-zoom="0.15"
      :max-zoom="2.5"
      :nodes-draggable="false"
      :nodes-connectable="false"
      :elements-selectable="true"
      fit-view-on-init
      class="w-full h-full cursor-grab active:cursor-grabbing"
    >
      <!-- Custom Nodes -->
      <template #node-platform="nodeProps">
        <PlatformNode v-bind="nodeProps" />
      </template>

      <template #node-ib="nodeProps">
        <IbNode v-bind="nodeProps" />
      </template>

      <!-- Dot matrix grid background matching theme -->
      <Background
        variant="dots"
        :gap="20"
        :size="1"
        :color="bgDotColor"
      />

      <!-- Controls in bottom-right -->
      <Controls
        :show-interactive="false"
        position="bottom-right"
        class="!bg-card-background !border !border-primary-border !rounded-xl !overflow-hidden backdrop-blur-md"
      />
    </VueFlow>
  </div>
</template>

<style>
/* Vue Flow base transparency so wrapper background shines through */
.vue-flow {
  background-color: transparent !important;
}

/* Remove default Vue Flow node outlines & shadows */
.vue-flow__node,
.vue-flow__node.selected,
.vue-flow__node:focus,
.vue-flow__node:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
}

/* Vue Flow custom theme override for controls buttons */
.vue-flow__controls button {
  background-color: transparent !important;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8) !important;
  color: #64748b !important;
  width: 32px !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
}

.dark .vue-flow__controls button {
  border-bottom: 1px solid rgba(51, 65, 85, 0.7) !important;
  color: #94a3b8 !important;
}

.vue-flow__controls button:last-child {
  border-bottom: none !important;
}

.vue-flow__controls button:hover {
  background-color: rgba(241, 245, 249, 0.9) !important;
  color: #0f172a !important;
}

.dark .vue-flow__controls button:hover {
  background-color: rgba(30, 41, 59, 0.8) !important;
  color: #38bdf8 !important;
}

.vue-flow__controls button svg {
  fill: currentColor !important;
  width: 14px !important;
  height: 14px !important;
}
</style>
