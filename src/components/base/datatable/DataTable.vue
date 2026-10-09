<!--
  DataTable
  Generic, fully data-driven table -- pass in `columns` + `rows` and it
  renders the whole thing, with everything else (sorting, selection, styling,
  pagination) opt-in via props so any page can use it however it needs to.

  Column shape:
    {
      key: 'name',            // required -- matches a row property, or use a cell-<key> slot
      label: 'Name',
      align: 'left' | 'center' | 'right',
      width: '160px',          // optional, applied via <colgroup>
      sortable: true|false,    // optional -- overrides the table-wide `sortable` prop for this column
      headerClass: '...',      // optional extra classes for the <th>
      cellClass: '...' | (row) => '...',  // optional extra classes for the <td>
    }

  Slots:
    cell-<col.key>   (row, value, index)  -- customize a column's cell
    header-<col.key> (col)                -- customize a column's header content
    empty                                 -- override the empty-state row
    loading                                -- override the loading skeleton

  Basic usage:
    <DataTable :columns="columns" :rows="rows" :loading="loading" />

  With customizable columns:
    <DataTable :columns="columns" :rows="rows" customizable-columns column-storage-key="my_table_cols" />
-->
<script setup>
import { ref, computed, watch } from "vue";
import Pagination from "@/components/base/Pagination.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import TableColumnCustomizer from "@/components/base/datatable/TableColumnCustomizer.vue";

const props = defineProps({
  // [{ key, label, align?, width?, sortable?, headerClass?, cellClass? }]
  columns: { type: Array, required: false },
  // Array of plain objects. Keys should match column keys, or use scoped slots to customize rendering.
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: "id" },

  loading: { type: Boolean, default: false },
  skeletonRows: { type: Number, default: 5 },
  emptyText: { type: String, default: "No data available." },
  emptySubtitle: { type: String, default: "" },

  // Column customization
  customizableColumns: { type: Boolean, default: false },
  columnStorageKey: { type: String, default: null },
  defaultHiddenColumns: { type: Array, default: () => [] },
  visibleColumnKeys: { type: Array, default: null },

  // Pagination (optional) -- omit both to render a plain table with no footer
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 0 },
  perPage: { type: Number, default: 10 },
  perPageOptions: { type: Array, default: () => [10, 20, 50, 100] },

  // Sorting
  sortable: { type: Boolean, default: false },
  sortBy: { type: String, default: null },
  sortDir: { type: String, default: "asc" }, // 'asc' | 'desc'
  serverSort: { type: Boolean, default: false },

  // Row selection
  selectable: { type: Boolean, default: false },
  modelValue: { type: Array, default: () => [] }, // selected row keys

  // Row click
  clickableRows: { type: Boolean, default: false },
  rowClass: { type: Function, default: null }, // (row, index) => string

  // Display
  striped: { type: Boolean, default: false },
  dense: { type: Boolean, default: false },
  stickyHeader: { type: Boolean, default: false },
  totalItems: { type: Number, default: 0 },
  showSummary: { type: Boolean, default: false },
  showPaginationInfo: { type: Boolean, default: false },
  showInfo: { type: Boolean, default: false },
  showPerPage: { type: Boolean, default: false },
});

const totalCount = computed(() => props.totalItems || props.rows.length);
const currentShowingCount = computed(() => props.rows.length);

const allAvailableColumns = computed(() => {
  if (props.columns && props.columns.length > 0) return props.columns;
  if (!props.rows || props.rows.length === 0) return [];
  return Object.keys(props.rows[0]).map((key) => ({
    key,
    label: key.replace(/_/g, " ").replace(/ \w/g, (l) => l.toUpperCase()),
    align: "left",
  }));
});

const selectedColumnKeys = ref([]);
const orderedColumnsState = ref([]);

const initColumns = () => {
  let initialKeys = null;
  let savedOrderKeys = null;

  if (props.columnStorageKey) {
    try {
      const saved = localStorage.getItem(props.columnStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((key) =>
            allAvailableColumns.value.some((col) => col.key === key),
          );
          if (valid.length > 0) initialKeys = valid;
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.selectedKeys)) {
            const valid = parsed.selectedKeys.filter((key) =>
              allAvailableColumns.value.some((col) => col.key === key),
            );
            if (valid.length > 0) initialKeys = valid;
          }
          if (Array.isArray(parsed.orderedKeys)) {
            savedOrderKeys = parsed.orderedKeys;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (
    !initialKeys &&
    props.visibleColumnKeys &&
    Array.isArray(props.visibleColumnKeys) &&
    props.visibleColumnKeys.length > 0
  ) {
    initialKeys = [...props.visibleColumnKeys];
  }

  if (!initialKeys || initialKeys.length === 0) {
    initialKeys = allAvailableColumns.value
      .map((col) => col.key)
      .filter((key) => !props.defaultHiddenColumns.includes(key));
  }

  selectedColumnKeys.value = initialKeys;

  // Initialize ordered columns state
  if (savedOrderKeys && Array.isArray(savedOrderKeys) && savedOrderKeys.length > 0) {
    const colMap = new Map(allAvailableColumns.value.map((c) => [c.key, c]));
    const ordered = [];
    savedOrderKeys.forEach((k) => {
      if (colMap.has(k)) {
        ordered.push(colMap.get(k));
        colMap.delete(k);
      }
    });
    colMap.forEach((col) => ordered.push(col));
    orderedColumnsState.value = ordered;
  } else {
    orderedColumnsState.value = [...allAvailableColumns.value];
  }
};

watch(() => props.columns, initColumns, { immediate: true, deep: true });
watch(
  () => props.visibleColumnKeys,
  (val) => {
    if (val && Array.isArray(val)) {
      selectedColumnKeys.value = [...val];
    }
  },
);

const onColumnsUpdate = (keys) => {
  selectedColumnKeys.value = keys;
  emit("update:visibleColumnKeys", keys);
  const source = orderedColumnsState.value.length > 0
    ? orderedColumnsState.value
    : allAvailableColumns.value;
  const visible = source.filter((col) => keys.includes(col.key));
  emit("columns-change", visible);
};

const onColumnsOrderUpdate = (ordered) => {
  if (Array.isArray(ordered) && ordered.length > 0) {
    orderedColumnsState.value = [...ordered];
  }
  emit("update:columnsOrder", ordered);
  const visible = orderedColumnsState.value.filter((col) =>
    selectedColumnKeys.value.includes(col.key),
  );
  emit("columns-change", visible);
};

const internalColumns = computed(() => {
  const source = orderedColumnsState.value.length > 0
    ? orderedColumnsState.value
    : allAvailableColumns.value;

  if (!props.customizableColumns) {
    return source;
  }
  return source.filter((col) =>
    selectedColumnKeys.value.includes(col.key),
  );
});

const emit = defineEmits([
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

const alignClass = (align) => {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
};

const isSortable = (col) => col.sortable ?? props.sortable;

const cellPadding = computed(() => (props.dense ? "py-1.5 px-2 sm:px-3" : "py-2 sm:py-3 px-2 sm:px-3.5"));
const headerPadding = computed(() =>
  props.dense ? "py-1.5 sm:py-2 px-2 sm:px-3" : "py-2 sm:py-2.5 px-2 sm:px-3.5",
);

const resolveCellClass = (col, row) => {
  if (typeof col.cellClass === "function") return col.cellClass(row);
  return col.cellClass || "";
};

// ── Sorting ──
const localSortBy = ref(props.sortBy);
const localSortDir = ref(props.sortDir);

watch(
  () => props.sortBy,
  (val) => {
    if (val !== localSortBy.value) localSortBy.value = val;
  },
);
watch(
  () => props.sortDir,
  (val) => {
    if (val !== localSortDir.value) localSortDir.value = val;
  },
);

function handleSort(col) {
  if (!isSortable(col)) return;

  let nextDir = "asc";
  if (localSortBy.value === col.key) {
    nextDir = localSortDir.value === "asc" ? "desc" : "asc";
  }

  localSortBy.value = col.key;
  localSortDir.value = nextDir;

  emit("update:sortBy", col.key);
  emit("update:sortDir", nextDir);
  emit("sort-change", { key: col.key, dir: nextDir });
}

const sortedRows = computed(() => {
  if (props.serverSort || !localSortBy.value) return props.rows;

  const key = localSortBy.value;
  const dir = localSortDir.value === "desc" ? -1 : 1;

  return [...props.rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return -1 * dir;
    if (bv == null) return 1 * dir;
    if (typeof av === "number" && typeof bv === "number")
      return (av - bv) * dir;
    return (
      String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
    );
  });
});

// ── Selection ──
const allSelected = computed(
  () =>
    sortedRows.value.length > 0 &&
    sortedRows.value.every((row) =>
      props.modelValue.includes(row[props.rowKey]),
    ),
);
const someSelected = computed(
  () =>
    !allSelected.value &&
    sortedRows.value.some((row) =>
      props.modelValue.includes(row[props.rowKey]),
    ),
);

function isRowSelected(row) {
  return props.modelValue.includes(row[props.rowKey]);
}

function toggleRow(row) {
  const key = row[props.rowKey];
  const next = isRowSelected(row)
    ? props.modelValue.filter((k) => k !== key)
    : [...props.modelValue, key];
  emit("update:modelValue", next);
}

function toggleSelectAll() {
  if (allSelected.value) {
    emit("update:modelValue", []);
  } else {
    emit(
      "update:modelValue",
      sortedRows.value.map((row) => row[props.rowKey]),
    );
  }
}

function handleRowClick(row, index) {
  if (props.clickableRows) emit("row-click", row, index);
}
</script>

<template>
  <div
    class="w-full h-full flex flex-col min-h-0 rounded-2xl overflow-hidden bg-card-background p-1 sm:p-4"
  >
    <!-- Top Summary / Count Bar -->
    <div
      v-if="showSummary && !loading && (rows.length || totalItems)"
      class="flex items-center justify-between px-6 sm:px-8 py-3 border-b border-primary-border text-[11px] font-bold text-secondary-text uppercase tracking-wider bg-card-background"
    >
      <div>
        SHOWING
        <span class="font-bold text-primary-text">{{
          currentShowingCount
        }}</span>
        OUT OF
        <span class="font-bold text-primary-text">{{ totalCount }}</span>
      </div>
      <slot name="top-right" />
    </div>

    <div class="overflow-auto no-scrollbar w-full flex-1 min-h-0">
      <table class="w-full text-left border-collapse whitespace-nowrap">
        <colgroup>
          <!-- Compact leading column for customizer and/or row checkbox (no excessive padding) -->
          <col
            v-if="selectable || customizableColumns"
            :style="{ width: selectable && customizableColumns ? '48px' : '32px' }"
          />
          <col
            v-for="col in internalColumns"
            :key="col.key"
            :style="col.width ? { width: col.width } : {}"
          />
        </colgroup>

        <thead
          class="bg-primary-border/25 rounded-xl overflow-hidden"
          :class="stickyHeader && 'sticky top-0 z-10 bg-card-background'"
        >
          <tr
            class="font-semibold text-secondary-text tracking-wide rounded-xl"
          >
            <!-- Dedicated Leading Controls Column (Zero padding / compact customize icon & checkbox) -->
            <th
              v-if="selectable || customizableColumns"
              class="rounded-l-xl px-1 py-1 text-center align-middle"
              :class="stickyHeader && 'sticky top-0 z-10 bg-card-background'"
              :style="{ width: selectable && customizableColumns ? '48px' : '32px' }"
            >
              <div class="flex items-center justify-center gap-1">
                <TableColumnCustomizer
                  v-if="customizableColumns"
                  :columns="orderedColumnsState.length > 0 ? orderedColumnsState : allAvailableColumns"
                  :model-value="selectedColumnKeys"
                  :storage-key="columnStorageKey"
                  variant="header"
                  @update:model-value="onColumnsUpdate"
                  @update:columns-order="onColumnsOrderUpdate"
                />
                <input
                  v-if="selectable"
                  type="checkbox"
                  class="w-4 h-4 rounded border-primary-border accent-button cursor-pointer"
                  :checked="allSelected"
                  :indeterminate="someSelected"
                  @change="toggleSelectAll"
                />
              </div>
            </th>

            <!-- Data column headers -->
            <th
              v-for="(col, colIndex) in internalColumns"
              :key="col.key"
              :class="[
                headerPadding,
                colIndex === 0 && !(selectable || customizableColumns) ? 'pl-3 sm:pl-4 rounded-l-xl' : '',
                colIndex === 0 && (selectable || customizableColumns) ? 'pl-1 sm:pl-1.5' : '',
                colIndex === internalColumns.length - 1 ? 'pr-3 sm:pr-4 rounded-r-xl' : '',
                alignClass(col.align),
                col.headerClass,
                stickyHeader && 'sticky top-0 z-10 bg-card-background',
                isSortable(col) && 'cursor-pointer select-none',
              ]"
              @click="handleSort(col)"
            >
              <slot :name="`header-${col.key}`" :col="col">
                <Tooltip v-if="col.tooltip" :text="col.tooltip" position="top">
                  <span class="inline-flex items-center gap-1">
                    {{ col.label }}
                    <span
                      v-if="isSortable(col)"
                      class="material-symbols-rounded transition-transform text-xs"
                      style="font-size: 12px"
                      :class="[
                        localSortBy === col.key
                          ? 'text-primary-text'
                          : 'text-secondary-text/40',
                        localSortBy === col.key &&
                          localSortDir === 'desc' &&
                          'rotate-180',
                      ]"
                      >swap_vert</span
                    >
                  </span>
                </Tooltip>
                <span v-else class="inline-flex items-center gap-1">
                  {{ col.label }}
                  <span
                    v-if="isSortable(col)"
                    class="material-symbols-rounded transition-transform text-xs"
                    style="font-size: 12px"
                    :class="[
                      localSortBy === col.key
                        ? 'text-primary-text'
                        : 'text-secondary-text/40',
                      localSortBy === col.key &&
                        localSortDir === 'desc' &&
                        'rotate-180',
                    ]"
                    >swap_vert</span
                  >
                </span>
              </slot>
            </th>
          </tr>
        </thead>

        <tbody
          class="divide-y divide-primary-border/60 text-sm font-medium text-primary-text"
        >
          <!-- Loading skeleton rows -->
          <template v-if="loading">
            <slot name="loading">
              <tr
                v-for="n in skeletonRows"
                :key="`skeleton-${n}`"
                class="animate-pulse"
              >
                <td
                  v-if="selectable || customizableColumns"
                  class="px-1 py-1.5 text-center align-middle"
                  :style="{ width: selectable && customizableColumns ? '48px' : '32px' }"
                ></td>
                <td
                  v-for="(col, colIndex) in internalColumns"
                  :key="col.key"
                  :class="[
                    cellPadding,
                    colIndex === 0 && !(selectable || customizableColumns) ? 'pl-3 sm:pl-4' : '',
                    colIndex === 0 && (selectable || customizableColumns) ? 'pl-1 sm:pl-1.5' : '',
                    colIndex === internalColumns.length - 1 ? 'pr-3 sm:pr-4' : '',
                  ]"
                >
                  <div class="h-4 w-3/4 bg-primary-border rounded"></div>
                </td>
              </tr>
            </slot>
          </template>

          <!-- Empty state -->
          <tr v-else-if="!sortedRows.length">
            <td
              :colspan="internalColumns.length + ((selectable || customizableColumns) ? 1 : 0)"
              class="py-4 px-4 text-center whitespace-normal"
            >
              <slot name="empty">
                <EmptyState
                  class="flex-1 justify-center max-w-full py-2"
                  :title="emptyText"
                  :subtitle="emptySubtitle"
                />
              </slot>
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-else
            v-for="(row, index) in sortedRows"
            :key="row[rowKey] ?? index"
            class="transition-colors"
            :class="[
              striped && index % 2 === 1 ? 'bg-background/40' : '',
              clickableRows
                ? 'cursor-pointer hover:bg-background/60'
                : 'hover:bg-background/40',
              isRowSelected(row) && 'bg-background',
              rowClass ? rowClass(row, index) : '',
            ]"
            @click="handleRowClick(row, index)"
          >
            <!-- Dedicated Leading Controls Cell (Zero extra padding) -->
            <td
              v-if="selectable || customizableColumns"
              class="rounded-l-xl px-1 py-1.5 text-center align-middle"
              :style="{ width: selectable && customizableColumns ? '48px' : '32px' }"
              @click.stop
            >
              <input
                v-if="selectable"
                type="checkbox"
                class="w-4 h-4 rounded border-primary-border accent-button cursor-pointer"
                :checked="isRowSelected(row)"
                @change="toggleRow(row)"
              />
            </td>

            <!-- Data cells -->
            <td
              v-for="(col, colIndex) in internalColumns"
              :key="col.key"
              :class="[
                cellPadding,
                colIndex === 0 && !(selectable || customizableColumns) ? 'pl-3 sm:pl-4' : '',
                colIndex === 0 && (selectable || customizableColumns) ? 'pl-1 sm:pl-1.5' : '',
                colIndex === internalColumns.length - 1 ? 'pr-3 sm:pr-4' : '',
                alignClass(col.align),
                resolveCellClass(col, row),
              ]"
            >
              <slot
                :name="`cell-${col.key}`"
                :row="row"
                :value="row[col.key]"
                :index="index"
              >
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination footer (rendered when totalPages > 1 or totalCount > 0) -->
    <div v-if="totalPages > 1 || (totalCount > 0 && page)" class="pt-1 border-t border-primary-border">
      <Pagination
        :pagination="{ page, total_pages: totalPages, total_items: totalCount, per_page: perPage, current_count: currentShowingCount }"
        :per-page-options="perPageOptions"
        :show-info="showPaginationInfo || showInfo"
        :show-per-page="showPerPage"
        @change="$emit('update:page', $event)"
        @page-change="$emit('page-change', $event); $emit('update:page', $event)"
        @per-page-change="$emit('per-page-change', $event); $emit('update:perPage', typeof $event === 'object' ? $event.per_page : $event)"
        @update:per-page="$emit('update:perPage', $event)"
      />
    </div>
  </div>
</template>
