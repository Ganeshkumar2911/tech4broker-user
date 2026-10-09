<!-- How to use this datatable -->

<!-- <WatchDataTable
      :show-tabs="true"
      :tabs="marketTabs"
      v-model:active-tab="marketTab"
      :rows="marketRows"
      :columns="marketColumns"
      :loading="loading"
      :page="page"
      :total-pages="10"
      @update:page="page = $event"
      sortable
      v-model:sort-by="sortBy"
      v-model:sort-dir="sortDir"
      selectable
      v-model="selectedSymbols"
      row-key="symbol"
      clickable-rows
      @row-click="handleRowClick"
      striped
      dense
      sticky-header
    > -->
<template>
  <div class="bg-card-background rounded-2xl sm:rounded-[28px] overflow-hidden">
    <div v-if="showTabs && tabs.length" class="pl-4 pr-6 sm:pr-8 pt-8 pb-2">
      <UnderLineTabs
        :model-value="activeTab"
        :tabs="tabs"
        @update:model-value="onTabChange"
      />
    </div>
    <div>
      <DataTable
        :columns="columns"
        :rows="rows"
        :loading="loading"
        :skeleton-rows="skeletonRows"
        :row-key="rowKey"
        :page="page"
        :total-pages="totalPages"
        :per-page="perPage"
        :per-page-options="perPageOptions"
        :empty-text="emptyText"
        :customizable-columns="customizableColumns"
        :column-storage-key="columnStorageKey"
        :default-hidden-columns="defaultHiddenColumns"
        :visible-column-keys="visibleColumnKeys"
        :sortable="sortable"
        :sort-by="sortBy"
        :sort-dir="sortDir"
        :server-sort="serverSort"
        :selectable="selectable"
        :model-value="modelValue"
        :clickable-rows="clickableRows"
        :row-class="rowClass"
        :striped="striped"
        :dense="dense"
        :sticky-header="stickyHeader"
        :total-items="totalItems"
        :show-summary="showSummary"
        :show-pagination-info="showPaginationInfo"
        :show-info="showInfo"
        :show-per-page="showPerPage"
        @update:page="$emit('update:page', $event)"
        @page-change="$emit('page-change', $event)"
        @per-page-change="$emit('per-page-change', $event)"
        @update:per-page="$emit('update:perPage', $event)"
        @update:sort-by="$emit('update:sortBy', $event)"
        @update:sort-dir="$emit('update:sortDir', $event)"
        @sort-change="$emit('sort-change', $event)"
        @update:model-value="$emit('update:modelValue', $event)"
        @update:visible-column-keys="$emit('update:visibleColumnKeys', $event)"
        @columns-change="$emit('columns-change', $event)"
        @update:columns-order="$emit('update:columnsOrder', $event)"
        @row-click="(row, index) => $emit('row-click', row, index)"
      >
        <!-- Market Watch Default Slots (can be overridden by parent) -->
        <template #cell-symbol="{ row, value, index }">
          <slot name="cell-symbol" :row="row" :value="value" :index="index">
            <div class="flex items-center gap-2.5 font-medium">
              <span class="text-lg leading-none">{{ row.icon || "💱" }}</span>
              {{ row.symbol }}
            </div>
          </slot>
        </template>

        <template #cell-bid="{ row, value, index }">
          <slot name="cell-bid" :row="row" :value="value" :index="index">
            <span class="font-mono font-medium text-sm">{{ value }}</span>
          </slot>
        </template>

        <template #cell-change="{ row, value, index }">
          <slot name="cell-change" :row="row" :value="value" :index="index">
            <span
              class="font-mono font-medium text-sm"
              :class="row.isUp ? 'text-primary-green' : 'text-primary-red'"
            >
              {{ row.change }}
            </span>
          </slot>
        </template>

        <!-- Sparkline trend column -->
        <template #cell-trend="{ row, value, index }">
          <slot name="cell-trend" :row="row" :value="value" :index="index">
            <div class="flex justify-center">
              <svg class="w-20 h-6 stroke-2" viewBox="0 0 80 24" fill="none">
                <path
                  :d="row.sparkline"
                  :stroke="row.isUp ? 'var(--color-primary-green, #22c55e)' : 'var(--color-primary-red, #ef4444)'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </slot>
        </template>

        <template #cell-percentage="{ row, value, index }">
          <slot name="cell-percentage" :row="row" :value="value" :index="index">
            <div class="flex justify-end">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium font-mono"
                :class="
                  row.isUp
                    ? 'bg-primary-green/10 text-primary-green border border-primary-green/20'
                    : 'bg-primary-red/10 text-primary-red border border-primary-red/20'
                "
              >
                <ArrowUp v-if="row.isUp" class="w-3 h-3" />
                <ArrowDown v-else class="w-3 h-3" />
                {{ row.percentage }}
              </span>
            </div>
          </slot>
        </template>

        <!--
          Forward any OTHER slots from parent -- this generic pass-through
          already covers DataTable's own extra slots too (header-<col.key>,
          empty, loading) as long as the parent passes them into
          MarketWatchTable under those same names; nothing extra to wire up
          here for those.
        -->
        <template
          v-for="name in Object.keys($slots).filter(
            (n) =>
              ![
                'cell-symbol',
                'cell-bid',
                'cell-change',
                'cell-trend',
                'cell-percentage',
              ].includes(n),
          )"
          #[name]="slotProps"
        >
          <slot :name="name" v-bind="slotProps || {}"></slot>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ArrowUp, ArrowDown } from "lucide-vue-next";
import DataTable from "./DataTable.vue";
import UnderLineTabs from "./UnderLineTabs.vue";
import { useSlots } from "vue";

const $slots = useSlots();

defineProps({
  showTabs: {
    type: Boolean,
    default: true,
  },
  tabs: {
    type: Array,
    default: () => [],
  },
  activeTab: {
    type: String,
    default: "",
  },
  columns: {
    type: Array,
    required: true,
  },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  skeletonRows: { type: Number, default: 5 },
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 0 },
  perPage: { type: Number, default: 10 },
  perPageOptions: { type: Array, default: () => [10, 20, 50, 100] },
  rowKey: { type: String, default: "symbol" },
  emptyText: { type: String, default: "No market data available." },

  // ── Column customization (mirrors DataTable) ──
  customizableColumns: { type: Boolean, default: false },
  columnStorageKey: { type: String, default: null },
  defaultHiddenColumns: { type: Array, default: () => [] },
  visibleColumnKeys: { type: Array, default: null },

  // ── Sorting (mirrors DataTable) ──
  sortable: { type: Boolean, default: false },
  sortBy: { type: String, default: null },
  sortDir: { type: String, default: "asc" },
  serverSort: { type: Boolean, default: false },

  // ── Row selection (mirrors DataTable) ──
  selectable: { type: Boolean, default: false },
  modelValue: { type: Array, default: () => [] },

  // ── Row interactivity / display (mirrors DataTable) ──
  clickableRows: { type: Boolean, default: false },
  rowClass: { type: Function, default: null },
  striped: { type: Boolean, default: false },
  dense: { type: Boolean, default: false },
  stickyHeader: { type: Boolean, default: false },
  totalItems: { type: Number, default: 0 },
  showSummary: { type: Boolean, default: false },
  showPaginationInfo: { type: Boolean, default: false },
  showInfo: { type: Boolean, default: false },
  showPerPage: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:activeTab",
  "update:page",
  "page-change",
  "update:perPage",
  "update:per_page",
  "per-page-change",
  "update:sortBy",
  "update:sortDir",
  "sort-change",
  "update:modelValue",
  "row-click",
  "update:visibleColumnKeys",
  "columns-change",
  "update:columnsOrder",
]);

const onTabChange = (value) => emit("update:activeTab", value);
</script>
