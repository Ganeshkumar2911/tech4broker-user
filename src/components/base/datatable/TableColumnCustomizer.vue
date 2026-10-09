<template>
  <div class="inline-flex items-center" ref="triggerWrapperRef">
    <!-- Trigger button with Tooltip -->
    <Tooltip :text="tooltip" position="top" :disabled="open">
      <!-- Header Icon Variant (Compact table header icon matching user screenshot) -->
      <button
        v-if="variant === 'header'"
        type="button"
        ref="triggerRef"
        @click.stop.prevent="toggle"
        class="p-1 rounded-lg text-secondary-text hover:text-primary-text hover:bg-background active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0 select-none"
        :class="[{ 'bg-background text-primary-text': open }, triggerClass]"
        :aria-expanded="open"
        aria-label="Customize columns"
      >
        <slot name="icon">
          <!-- Table Columns Layout SVG -->
          <svg
            class="w-4 h-4 text-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <path d="M3 9h18" />
            <path d="M9 9v12" />
          </svg>
        </slot>
      </button>

      <!-- Standard Filter Button Variant -->
      <button
        v-else
        type="button"
        ref="triggerRef"
        @click.stop.prevent="toggle"
        class="w-9 h-9 rounded-full bg-card-background border border-primary-border flex items-center justify-center text-secondary-text hover:text-primary-text hover:border-primary-border transition cursor-pointer relative select-none"
        :class="[
          { 'border-primary-text text-primary-text bg-background shadow-xs': open },
          triggerClass,
        ]"
        :aria-expanded="open"
        aria-label="Customize columns"
      >
        <slot name="icon">
          <svg
            class="w-4 h-4 text-secondary-text hover:text-primary-text"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <path d="M3 9h18" />
            <path d="M9 9v12" />
          </svg>
        </slot>
        <span
          v-if="selectedKeys.length < (columns?.length || 0)"
          class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-button rounded-full ring-2 ring-card-background"
        />
      </button>
    </Tooltip>

    <!-- Customize Columns Dialog (Centered Modal on Desktop, Bottom Sheet Drawer on Mobile) -->
    <Teleport to="body">
      <!-- Backdrop Overlay -->
      <Transition name="fade">
        <div
          v-if="open"
          class="fixed inset-0 z-[99998] bg-black/30 backdrop-blur-[1.5px] transition-opacity"
          @click="close"
        />
      </Transition>

      <!-- Modal / Bottom Sheet Container -->
      <Transition :name="isMobile ? 'bottom-sheet' : 'fade'">
        <div
          v-if="open"
          class="fixed z-[99999]"
          :class="[
            isMobile
              ? 'inset-x-0 bottom-0 max-h-[90vh] flex flex-col'
              : 'inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none',
          ]"
        >
          <!-- Modal Card -->
          <div
            ref="modalCardRef"
            class="w-full bg-card-background border border-primary-border shadow-2xl flex flex-col overflow-hidden text-left"
            :class="[
              isMobile
                ? 'rounded-t-[24px] max-h-[85vh] border-t'
                : 'max-w-[460px] rounded-2xl max-h-[85vh] pointer-events-auto',
            ]"
            @click.stop
          >
            <!-- Mobile Top Grab Handle Indicator -->
            <div v-if="isMobile" class="pt-3 pb-1 shrink-0 flex justify-center">
              <div class="w-10 h-1 rounded-full bg-secondary-text/30" />
            </div>

            <!-- Header Bar -->
            <div class="px-5 py-3.5 sm:py-4 border-b border-primary-border flex items-center justify-between gap-3 bg-card-background shrink-0">
              <div class="flex items-center gap-2.5 min-w-0">
                <SlidersHorizontal class="w-5 h-5 text-primary-text shrink-0" />
                <h3 class="text-base sm:text-lg font-bold text-primary-text truncate">
                  Customize Columns
                </h3>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <span class="text-xs sm:text-sm font-medium text-secondary-text whitespace-nowrap">
                  {{ activeSelectedCount }} of {{ orderedColumns.length }} Selected
                </span>

                <div class="h-4 w-px bg-primary-border" />

                <button
                  type="button"
                  @click="close"
                  class="p-1 text-primary-red hover:bg-primary-red/10 rounded-lg transition cursor-pointer flex items-center justify-center"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="p-4 sm:p-5 flex-1 min-h-0 flex flex-col gap-3.5 overflow-hidden">
              <!-- Search Bar -->
              <div class="relative shrink-0">
                <Search class="w-4 h-4 text-secondary-text absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search"
                  class="w-full pl-9 pr-8 py-2.5 bg-background border border-primary-border rounded-xl text-xs sm:text-sm text-primary-text placeholder:text-placeholder outline-none focus:border-primary-text transition-colors"
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  @click="searchQuery = ''"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-secondary-text hover:text-primary-text rounded-md"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Draggable Columns List with Real-time Live Position Preview -->
              <div class="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 select-none no-scrollbar max-h-[50vh] sm:max-h-none">
                <div
                  v-for="col in filteredColumns"
                  :key="col.key"
                  draggable="true"
                  @dragstart="onDragStart(col.key, $event)"
                  @dragover.prevent="onDragOver(col.key, $event)"
                  @drop.prevent="onDrop"
                  @dragend="onDragEnd"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer shadow-none"
                  :class="[
                    draggedKey === col.key
                      ? 'border-2 border-dashed border-primary-text/40 bg-background/60 opacity-80 scale-[0.99]'
                      : isColumnSelected(col.key)
                        ? 'bg-background border-primary-border hover:border-primary-text/40'
                        : 'bg-background/40 border-primary-border/40 opacity-70 hover:opacity-100 hover:border-primary-border',
                  ]"
                  @click="toggleColumn(col.key)"
                >
                  <!-- 6-Dots Grip Icon -->
                  <div
                    class="shrink-0 text-secondary-text/60 hover:text-primary-text cursor-grab active:cursor-grabbing p-0.5 flex items-center justify-center transition-colors"
                    title="Drag to reorder column"
                    @click.stop
                  >
                    <GripVertical class="w-4 h-4" />
                  </div>

                  <!-- Lock Icon (if column is locked/required) OR Custom Checkbox -->
                  <div class="shrink-0 flex items-center justify-center">
                    <Lock
                      v-if="col.locked || col.required"
                      class="w-4 h-4 text-primary-text"
                      title="This column is required"
                    />
                    <div
                      v-else
                      class="w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 transition-colors border cursor-pointer shadow-none"
                      :class="[
                        isColumnSelected(col.key)
                          ? 'bg-button border-button text-button-text'
                          : 'border-primary-border bg-card-background hover:border-primary-text',
                        isColumnSelected(col.key) && localSelectedKeys.length === 1 ? 'opacity-60 cursor-not-allowed' : '',
                      ]"
                      @click.stop="toggleColumn(col.key)"
                    >
                      <Check v-if="isColumnSelected(col.key)" class="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <!-- Column Label -->
                  <span
                    class="text-xs sm:text-sm font-medium flex-1 truncate select-none"
                    :class="isColumnSelected(col.key) ? 'text-primary-text font-semibold' : 'text-secondary-text'"
                  >
                    {{ col.label || col.key }}
                  </span>
                </div>

                <div
                  v-if="filteredColumns.length === 0"
                  class="py-8 text-center text-xs text-secondary-text"
                >
                  No columns found matching "{{ searchQuery }}"
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-5 py-3.5 border-t border-primary-border bg-card-background flex items-center justify-between gap-3 shrink-0 pb-6 sm:pb-3.5">
              <div class="flex items-center gap-2.5">
                <button
                  type="button"
                  @click="handleSave"
                  class="px-5 py-2 bg-button hover:opacity-90 active:scale-95 text-button-text font-bold text-xs sm:text-sm rounded-full transition cursor-pointer shadow-none"
                >
                  Save
                </button>
                <button
                  type="button"
                  @click="close"
                  class="px-5 py-2 bg-card-background border border-primary-border hover:bg-background active:scale-95 text-primary-text font-semibold text-xs sm:text-sm rounded-full transition cursor-pointer shadow-none"
                >
                  Cancel
                </button>
              </div>

              <!-- Quick actions (hidden on mobile) -->
              <div class="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  @click="selectAll"
                  class="text-[11px] font-semibold text-primary-text hover:underline p-1 cursor-pointer"
                >
                  Select All
                </button>
                <span class="text-secondary-text/40">•</span>
                <button
                  type="button"
                  @click="resetAll"
                  class="text-[11px] font-semibold text-secondary-text hover:text-primary-text hover:underline p-1 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { SlidersHorizontal, Search, GripVertical, Lock, X, Check } from "lucide-vue-next";
import Tooltip from "@/components/base/Tooltip.vue";

const props = defineProps({
  // Full list of columns: [{ key: 'symbol', label: 'Item', ... }]
  columns: {
    type: Array,
    required: true,
    default: () => [],
  },
  // Active selected column keys (v-model)
  modelValue: {
    type: Array,
    default: null,
  },
  // Optional localStorage key to remember choices
  storageKey: {
    type: String,
    default: null,
  },
  // Visual variant: 'header' (compact header icon) | 'button' (standalone filter button)
  variant: {
    type: String,
    default: "header",
    validator: (v) => ["header", "button"].includes(v),
  },
  tooltip: {
    type: String,
    default: "Customize Columns",
  },
  triggerClass: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "update:columnsOrder", "change"]);

const open = ref(false);
const triggerRef = ref(null);
const triggerWrapperRef = ref(null);
const modalCardRef = ref(null);
const searchQuery = ref("");
const isMobile = ref(typeof window !== "undefined" ? window.innerWidth < 768 : false);

// Reorderable list of columns
const orderedColumns = ref([]);
// Working copy of selected keys for modal (saved only on 'Save' click)
const localSelectedKeys = ref([]);
// Active saved selected keys
const selectedKeys = ref([]);

// Drag and drop state using unique column keys
const draggedKey = ref(null);

const allKeys = computed(() => (props.columns || []).map((col) => col.key));

function checkMobile() {
  if (typeof window !== "undefined") {
    isMobile.value = window.innerWidth < 768;
  }
}

const loadSavedState = () => {
  let initialKeys = props.modelValue && Array.isArray(props.modelValue) ? [...props.modelValue] : null;
  let savedOrderKeys = null;

  if (props.storageKey) {
    try {
      const saved = localStorage.getItem(props.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((key) => allKeys.value.includes(key));
          if (valid.length > 0) {
            initialKeys = valid;
          }
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.selectedKeys)) {
            const valid = parsed.selectedKeys.filter((key) => allKeys.value.includes(key));
            if (valid.length > 0) {
              initialKeys = valid;
            }
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

  if (!initialKeys || initialKeys.length === 0) {
    initialKeys = [...allKeys.value];
  }

  selectedKeys.value = [...initialKeys];
  localSelectedKeys.value = [...initialKeys];

  // Initialize ordered columns, respecting saved order if available
  if (props.columns && Array.isArray(props.columns)) {
    if (savedOrderKeys && Array.isArray(savedOrderKeys) && savedOrderKeys.length > 0) {
      const colMap = new Map(props.columns.map((c) => [c.key, c]));
      const ordered = [];
      savedOrderKeys.forEach((k) => {
        if (colMap.has(k)) {
          ordered.push(colMap.get(k));
          colMap.delete(k);
        }
      });
      // Append any new/remaining columns that weren't in savedOrderKeys
      colMap.forEach((col) => ordered.push(col));
      orderedColumns.value = ordered;
    } else {
      orderedColumns.value = [...props.columns];
    }
  }
};

watch(
  () => props.columns,
  () => {
    loadSavedState();
  },
  { immediate: true, deep: true },
);

watch(
  () => props.modelValue,
  (val) => {
    if (val && Array.isArray(val)) {
      selectedKeys.value = [...val];
      localSelectedKeys.value = [...val];
    }
  },
);

watch(open, (val) => {
  if (typeof document !== "undefined") {
    if (val && isMobile.value) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
});

const filteredColumns = computed(() => {
  if (!searchQuery.value.trim()) return orderedColumns.value;
  const q = searchQuery.value.toLowerCase().trim();
  return orderedColumns.value.filter(
    (col) =>
      (col.label && col.label.toLowerCase().includes(q)) ||
      (col.key && col.key.toLowerCase().includes(q)),
  );
});

const isColumnSelected = (key) => localSelectedKeys.value.includes(key);

const activeSelectedCount = computed(() => {
  return localSelectedKeys.value.length;
});

const toggleColumn = (key) => {
  const col = orderedColumns.value.find((c) => c.key === key);
  if (col && (col.locked || col.required)) return;

  if (localSelectedKeys.value.includes(key)) {
    if (localSelectedKeys.value.length > 1) {
      localSelectedKeys.value = localSelectedKeys.value.filter((k) => k !== key);
    }
  } else {
    // Keep in current column order
    const newSelected = [...localSelectedKeys.value, key];
    localSelectedKeys.value = orderedColumns.value
      .map((c) => c.key)
      .filter((k) => newSelected.includes(k));
  }
};

const selectAll = () => {
  localSelectedKeys.value = orderedColumns.value.map((col) => col.key);
};

const resetAll = () => {
  localSelectedKeys.value = (props.columns || []).map((col) => col.key);
  orderedColumns.value = [...(props.columns || [])];
};

// Real-time live reordering handlers
const onDragStart = (colKey, event) => {
  draggedKey.value = colKey;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", colKey);
  }
};

const onDragOver = (colKey, event) => {
  event.preventDefault();
  if (!draggedKey.value || draggedKey.value === colKey) return;

  const items = [...orderedColumns.value];
  const sourceIdx = items.findIndex((c) => c.key === draggedKey.value);
  const targetIdx = items.findIndex((c) => c.key === colKey);

  if (sourceIdx !== -1 && targetIdx !== -1 && sourceIdx !== targetIdx) {
    const [draggedItem] = items.splice(sourceIdx, 1);
    items.splice(targetIdx, 0, draggedItem);
    orderedColumns.value = items;
  }
};

const onDrop = (event) => {
  if (event) event.preventDefault();
  draggedKey.value = null;
};

const onDragEnd = () => {
  draggedKey.value = null;
};

// Open / Close / Save
function toggle() {
  open.value ? close() : show();
}

function show() {
  checkMobile();
  // Sync working state with current selected keys
  localSelectedKeys.value = [...selectedKeys.value];
  searchQuery.value = "";
  open.value = true;
  document.addEventListener("keydown", handleKeydown);
}

function close() {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener("keydown", handleKeydown);
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
}

function handleSave() {
  selectedKeys.value = [...localSelectedKeys.value];

  const orderedKeys = orderedColumns.value.map((c) => c.key);

  if (props.storageKey) {
    try {
      localStorage.setItem(
        props.storageKey,
        JSON.stringify({
          selectedKeys: selectedKeys.value,
          orderedKeys: orderedKeys,
        }),
      );
    } catch (e) {
      // ignore
    }
  }

  emit("update:modelValue", selectedKeys.value);
  emit("update:columnsOrder", orderedColumns.value);

  const visibleCols = orderedColumns.value.filter((col) =>
    selectedKeys.value.includes(col.key),
  );
  emit("change", {
    selectedKeys: selectedKeys.value,
    visibleColumns: visibleCols,
    orderedColumns: orderedColumns.value,
  });

  close();
}

function handleKeydown(e) {
  if (e.key === "Escape") close();
}

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onBeforeUnmount(() => {
  close();
  window.removeEventListener("resize", checkMobile);
});

defineExpose({ close, open, toggle });
</script>

<style scoped>
/* Fade Backdrop Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Bottom Sheet Transition */
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  transform: translateY(100%);
  opacity: 0.7;
}

.bottom-sheet-enter-to,
.bottom-sheet-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-primary-border, #e5e7eb);
  border-radius: 4px;
}
</style>
