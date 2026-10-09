<template>
  <div
    v-if="pagination && hasItemsOrPages"
    class="w-full pt-3 text-xs select-none"
  >
    <!-- 1. SMALL MOBILE VIEW (< 500px): Clean, compact 100% width touch layout -->
    <div class="min-[500px]:hidden flex flex-col gap-2.5 w-full">
      <!-- Mobile Top Row: Info summary + Rows per page -->
      <div class="flex items-center justify-between gap-2 text-xs text-secondary-text px-0.5">
        <div>
          <span v-if="showInfo" class="whitespace-nowrap">
            <template v-if="totalItems !== undefined && totalItems !== null && totalItems > 0">
              Showing <strong class="text-primary-text font-semibold">{{ showingFrom }}-{{ showingTo }}</strong> of <strong class="text-primary-text font-semibold">{{ totalItems }}</strong>
            </template>
            <template v-else-if="totalItems === 0">
              Showing <strong class="text-primary-text font-semibold">0</strong> entries
            </template>
            <template v-else>
              Page <strong class="text-primary-text font-semibold">{{ currentPage }}</strong> of <strong class="text-primary-text font-semibold">{{ totalPages }}</strong>
            </template>
          </span>
        </div>

        <!-- Rows per page -->
        <div v-if="showPerPage && perPageOptions && perPageOptions.length" class="flex items-center gap-1.5 shrink-0">
          <span class="text-2xs text-secondary-text">Per page:</span>
          <div class="w-18">
            <BaseSelect
              :model-value="currentPerPage"
              :options="formattedPerPageOptions"
              :drop-up="true"
              placement="top"
              variant="surface"
              height="28px"
              rounded="lg"
              button-class="!h-7 !py-0 !px-2 text-xs font-semibold"
              @update:model-value="handlePerPageChange"
            />
          </div>
        </div>
      </div>

      <!-- Mobile Bottom Row: Sleek Navigator (Prev + Interactive Page Jump + Next) -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between gap-1.5 p-1 rounded-xl bg-background/50 border border-primary-border"
      >
        <!-- Prev Page Button -->
        <button
          type="button"
          :disabled="isFirst"
          @click="goToPage(currentPage - 1)"
          class="h-8 px-2.5 sm:px-3 flex items-center justify-center gap-1 rounded-lg border border-primary-border bg-card-background text-secondary-text hover:text-primary-text disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
        >
          <ChevronLeft class="w-4 h-4" />
          <span>Prev</span>
        </button>

        <!-- Center: Normal View (Tap to Jump) -->
        <div v-if="!showMobileJump" class="flex items-center justify-center gap-1.5 flex-1 min-w-0">
          <button
            type="button"
            @click="openMobileJump"
            title="Tap to jump to page"
            class="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-primary-border bg-card-background hover:border-primary/60 transition cursor-pointer active:scale-95"
          >
            <span class="text-2xs text-secondary-text uppercase font-semibold">Page</span>
            <span class="text-xs font-bold font-mono text-primary px-1.5 py-0.5 rounded bg-background border border-primary-border">
              {{ currentPage }}
            </span>
            <span class="text-xs text-secondary-text font-medium">
              of <strong class="text-primary-text font-mono font-semibold">{{ totalPages }}</strong>
            </span>
          </button>
        </div>

        <!-- Center: Jump to Active Input View (Like Large Screen) -->
        <div v-else class="flex items-center justify-center gap-1.5 flex-1 min-w-0 relative">
          <span class="text-secondary-text whitespace-nowrap text-xs font-medium">Jump to:</span>
          <div class="relative flex items-center">
            <input
              ref="mobileJumpInputRef"
              v-model="jumpPageInput"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              placeholder="Page"
              class="w-12 h-7 px-1.5 text-center rounded-lg border text-xs font-bold font-mono text-primary-text bg-card-background outline-none transition focus:border-primary"
              :class="jumpError ? 'border-primary-red focus:border-primary-red' : 'border-primary-border focus:border-primary'"
              @keydown.enter="executeJump"
              @input="jumpError = ''"
            />
            <button
              type="button"
              @click="executeJump"
              class="ml-1 h-7 px-2.5 rounded-lg bg-button text-button-text font-bold text-xs transition active:scale-95 cursor-pointer shrink-0"
            >
              Go
            </button>
            <button
              type="button"
              @click="closeMobileJump"
              class="ml-1 w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border bg-card-background text-secondary-text hover:text-primary-text text-xs cursor-pointer active:scale-95 shrink-0"
              title="Cancel"
            >
              ✕
            </button>
          </div>

          <!-- Validation Tooltip/Error Popover for Mobile -->
          <Transition name="fade">
            <div
              v-if="jumpError"
              class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-primary-red text-white text-[10px] whitespace-nowrap z-30 pointer-events-none shadow-md"
            >
              {{ jumpError }}
            </div>
          </Transition>
        </div>

        <!-- Next Page Button -->
        <button
          type="button"
          :disabled="isLast"
          @click="goToPage(currentPage + 1)"
          class="h-8 px-2.5 sm:px-3 flex items-center justify-center gap-1 rounded-lg border border-primary-border bg-card-background text-secondary-text hover:text-primary-text disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
        >
          <span>Next</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 2. MEDIUM MOBILE & TABLET VIEW (500px - 1024px): 2 Rows with full desktop controls -->
    <div class="hidden min-[500px]:flex lg:hidden flex-col gap-3 w-full">
      <!-- Row 1: Showing summary & Rows per page -->
      <div class="flex items-center justify-between gap-4 text-secondary-text w-full">
        <span v-if="showInfo" class="whitespace-nowrap">
          <template v-if="totalItems !== undefined && totalItems !== null && totalItems > 0">
            Showing
            <span class="font-semibold text-primary-text">{{ showingFrom }}</span>
            to
            <span class="font-semibold text-primary-text">{{ showingTo }}</span>
            of
            <span class="font-semibold text-primary-text">{{ totalItems }}</span>
            entries
          </template>
          <template v-else-if="totalItems === 0">
            Showing
            <span class="font-semibold text-primary-text">0</span>
            to
            <span class="font-semibold text-primary-text">0</span>
            of
            <span class="font-semibold text-primary-text">0</span>
            entries
          </template>
          <template v-else>
            Showing Page
            <span class="font-semibold text-primary-text">{{ currentPage }}</span>
            of
            <span class="font-semibold text-primary-text">{{ totalPages }}</span>
          </template>
        </span>

        <div v-if="showPerPage && perPageOptions && perPageOptions.length" class="flex items-center gap-2 shrink-0">
          <span class="text-secondary-text whitespace-nowrap">Rows per page:</span>
          <div class="w-20 shrink-0">
            <BaseSelect
              :model-value="currentPerPage"
              :options="formattedPerPageOptions"
              :drop-up="true"
              placement="top"
              variant="surface"
              height="28px"
              rounded="lg"
              button-class="!h-7 !py-0 !px-2.5 text-xs font-medium"
              @update:model-value="handlePerPageChange"
            />
          </div>
        </div>
      </div>

      <!-- Row 2: Jump to page (Left) & Full Page navigation buttons (Right) -->
      <div
        v-if="totalPages > 1 || showJump"
        class="flex items-center justify-between gap-3 w-full pt-2 border-t border-primary-border/40"
      >
        <!-- Jump to Page -->
        <div v-if="showJump && totalPages > 1" class="flex items-center gap-1.5 relative shrink-0">
          <span class="text-secondary-text whitespace-nowrap">Jump to:</span>
          <div class="relative flex items-center">
            <input
              v-model="jumpPageInput"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              placeholder="Page"
              class="w-14 h-7 px-2 text-center rounded-lg border text-xs text-primary-text bg-background outline-none transition font-mono"
              :class="jumpError ? 'border-primary-red focus:border-primary-red' : 'border-primary-border focus:border-primary'"
              @keydown.enter="executeJump"
              @input="jumpError = ''"
            />
            <button
              type="button"
              @click="executeJump"
              class="ml-1 h-7 px-2.5 rounded-lg border border-primary-border bg-background hover:bg-card-background text-primary-text font-medium text-xs transition active:scale-95 cursor-pointer shrink-0"
            >
              Go
            </button>
          </div>

          <Transition name="fade">
            <div
              v-if="jumpError"
              class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-primary-red text-white text-[10px] whitespace-nowrap z-30 pointer-events-none shadow-md"
            >
              {{ jumpError }}
            </div>
          </Transition>
        </div>

        <!-- Page navigation buttons -->
        <div v-if="totalPages > 1" class="flex items-center gap-1 shrink-0">
          <!-- First Page -->
          <button
            type="button"
            :disabled="isFirst"
            @click="goToPage(1)"
            title="First Page"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
            :class="isFirst ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
          >
            <ChevronsLeft class="w-3.5 h-3.5" />
          </button>

          <!-- Previous Page -->
          <button
            type="button"
            :disabled="isFirst"
            @click="goToPage(currentPage - 1)"
            title="Previous Page"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
            :class="isFirst ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>

          <!-- Page Numbers with Ellipsis -->
          <template v-for="(p, i) in pagesList" :key="p === '...' ? `ellipsis-${i}` : p">
            <span
              v-if="p === '...'"
              class="w-7 h-7 flex items-center justify-center text-xs text-secondary-text select-none shrink-0"
            >
              ...
            </span>

            <button
              v-else
              type="button"
              @click="goToPage(p)"
              class="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold border transition cursor-pointer select-none shrink-0"
              :class="p === currentPage
                ? 'bg-button text-button-text font-bold border-transparent shadow-xs'
                : 'bg-background text-secondary-text border-primary-border hover:text-primary-text hover:border-primary'"
            >
              {{ p }}
            </button>
          </template>

          <!-- Next Page -->
          <button
            type="button"
            :disabled="isLast"
            @click="goToPage(currentPage + 1)"
            title="Next Page"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
            :class="isLast ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
          >
            <ChevronRight class="w-3.5 h-3.5" />
          </button>

          <!-- Last Page -->
          <button
            type="button"
            :disabled="isLast"
            @click="goToPage(totalPages)"
            title="Last Page"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
            :class="isLast ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
          >
            <ChevronsRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- 3. DESKTOP VIEW (>= lg / 1024px): Full rich 1-line wide bar with smooth scroll when container is tight -->
    <div class="hidden lg:block w-full overflow-x-auto no-scrollbar scrollbar-none touch-pan-x">
      <div class="flex items-center justify-between gap-4 py-1 w-full min-w-max">
        <!-- Left side: Showing summary & Rows per page -->
        <div class="flex items-center gap-4 text-secondary-text shrink-0">
          <!-- Showing summary -->
          <span v-if="showInfo" class="whitespace-nowrap">
            <template v-if="totalItems !== undefined && totalItems !== null && totalItems > 0">
              Showing
              <span class="font-semibold text-primary-text">{{ showingFrom }}</span>
              to
              <span class="font-semibold text-primary-text">{{ showingTo }}</span>
              of
              <span class="font-semibold text-primary-text">{{ totalItems }}</span>
              entries
            </template>
            <template v-else-if="totalItems === 0">
              Showing
              <span class="font-semibold text-primary-text">0</span>
              to
              <span class="font-semibold text-primary-text">0</span>
              of
              <span class="font-semibold text-primary-text">0</span>
              entries
            </template>
            <template v-else>
              Showing Page
              <span class="font-semibold text-primary-text">{{ currentPage }}</span>
              of
              <span class="font-semibold text-primary-text">{{ totalPages }}</span>
            </template>
          </span>

          <!-- Rows per page selector -->
          <div v-if="showPerPage && perPageOptions && perPageOptions.length" class="flex items-center gap-2 shrink-0">
            <span class="text-secondary-text whitespace-nowrap">Rows per page:</span>
            <div class="w-20 shrink-0">
              <BaseSelect
                :model-value="currentPerPage"
                :options="formattedPerPageOptions"
                :drop-up="true"
                placement="top"
                variant="surface"
                height="28px"
                rounded="lg"
                button-class="!h-7 !py-0 !px-2.5 text-xs font-medium"
                @update:model-value="handlePerPageChange"
              />
            </div>
          </div>
        </div>

        <!-- Right side: Jump to page & Page navigation buttons -->
        <div class="flex items-center gap-3 shrink-0">
          <!-- Jump to Page -->
          <div v-if="showJump && totalPages > 1" class="flex items-center gap-1.5 relative shrink-0">
            <span class="text-secondary-text whitespace-nowrap">Jump to:</span>
            <div class="relative flex items-center">
              <input
                v-model="jumpPageInput"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                placeholder="Page"
                class="w-14 h-7 px-2 text-center rounded-lg border text-xs text-primary-text bg-background outline-none transition font-mono"
                :class="jumpError ? 'border-primary-red focus:border-primary-red' : 'border-primary-border focus:border-primary'"
                @keydown.enter="executeJump"
                @input="jumpError = ''"
              />
              <button
                type="button"
                @click="executeJump"
                class="ml-1 h-7 px-2.5 rounded-lg border border-primary-border bg-background hover:bg-card-background text-primary-text font-medium text-xs transition active:scale-95 cursor-pointer shrink-0"
              >
                Go
              </button>
            </div>

            <!-- Validation Tooltip/Error Popover -->
            <Transition name="fade">
              <div
                v-if="jumpError"
                class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-primary-red text-white text-[10px] whitespace-nowrap z-30 pointer-events-none shadow-md"
              >
                {{ jumpError }}
              </div>
            </Transition>
          </div>

          <!-- Page navigation buttons -->
          <div v-if="totalPages > 1" class="flex items-center gap-1 shrink-0">
            <!-- First Page -->
            <button
              type="button"
              :disabled="isFirst"
              @click="goToPage(1)"
              title="First Page"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
              :class="isFirst ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
            >
              <ChevronsLeft class="w-3.5 h-3.5" />
            </button>

            <!-- Previous Page -->
            <button
              type="button"
              :disabled="isFirst"
              @click="goToPage(currentPage - 1)"
              title="Previous Page"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
              :class="isFirst ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
            >
              <ChevronLeft class="w-3.5 h-3.5" />
            </button>

            <!-- Page Numbers with Ellipsis -->
            <template v-for="(p, i) in pagesList" :key="p === '...' ? `ellipsis-${i}` : p">
              <span
                v-if="p === '...'"
                class="w-7 h-7 flex items-center justify-center text-xs text-secondary-text select-none shrink-0"
              >
                ...
              </span>

              <button
                v-else
                type="button"
                @click="goToPage(p)"
                class="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold border transition cursor-pointer select-none shrink-0"
                :class="p === currentPage
                  ? 'bg-button text-button-text font-bold border-transparent shadow-xs'
                  : 'bg-background text-secondary-text border-primary-border hover:text-primary-text hover:border-primary'"
              >
                {{ p }}
              </button>
            </template>

            <!-- Next Page -->
            <button
              type="button"
              :disabled="isLast"
              @click="goToPage(currentPage + 1)"
              title="Next Page"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
              :class="isLast ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
            >
              <ChevronRight class="w-3.5 h-3.5" />
            </button>

            <!-- Last Page -->
            <button
              type="button"
              :disabled="isLast"
              @click="goToPage(totalPages)"
              title="Last Page"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
              :class="isLast ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
            >
              <ChevronsRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-vue-next";
import BaseSelect from "@/components/base/BaseSelect.vue";

const props = defineProps({
  pagination: {
    type: Object,
    required: true,
    default: () => ({ page: 1, per_page: 10, total_items: 0, total_pages: 1 }),
  },
  perPageOptions: {
    type: Array,
    default: () => [10, 20, 50, 100],
  },
  showInfo: {
    type: Boolean,
    default: false,
  },
  showPerPage: {
    type: Boolean,
    default: false,
  },
  showJump: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  "change",
  "page-change",
  "update:page",
  "per-page-change",
  "update:per_page",
  "update:perPage",
]);

const jumpPageInput = ref("");
const jumpError = ref("");
const showMobileJump = ref(false);
const mobileJumpInputRef = ref(null);

const formattedPerPageOptions = computed(() => {
  if (!props.perPageOptions || !Array.isArray(props.perPageOptions)) return [];
  return props.perPageOptions.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        label: String(opt.label ?? opt.value),
        value: Number(opt.value ?? opt.label),
      };
    }
    return {
      label: String(opt),
      value: Number(opt),
    };
  });
});

const currentPage = computed(() => {
  return (
    Number(
      props.pagination?.page ??
        props.pagination?.current_page ??
        props.pagination?.currentPage,
    ) || 1
  );
});

const currentPerPage = computed(() => {
  return (
    Number(
      props.pagination?.per_page ??
        props.pagination?.limit ??
        props.pagination?.pageSize ??
        props.pagination?.perPage,
    ) || 10
  );
});

const totalItems = computed(() => {
  const t =
    props.pagination?.total_items ??
    props.pagination?.totalItems ??
    props.pagination?.total ??
    props.pagination?.total_count ??
    props.pagination?.count;
  return t !== undefined && t !== null ? Number(t) : 0;
});

const totalPages = computed(() => {
  const p =
    props.pagination?.total_pages ??
    props.pagination?.totalPages ??
    props.pagination?.pages ??
    props.pagination?.last_page;

  if (p !== undefined && p !== null) {
    return Math.max(1, Number(p));
  }
  if (totalItems.value && currentPerPage.value) {
    return Math.max(1, Math.ceil(totalItems.value / currentPerPage.value));
  }
  return 1;
});

const hasItemsOrPages = computed(() => {
  if (!props.pagination) return false;
  return (
    props.pagination.total_items !== undefined ||
    props.pagination.totalItems !== undefined ||
    props.pagination.total !== undefined ||
    props.pagination.total_pages !== undefined ||
    props.pagination.totalPages !== undefined ||
    props.pagination.pages !== undefined ||
    props.pagination.page !== undefined
  );
});

const isFirst = computed(() => currentPage.value <= 1);
const isLast = computed(() => currentPage.value >= totalPages.value);

const showingFrom = computed(() => {
  if (totalItems.value === 0) return 0;
  return (currentPage.value - 1) * currentPerPage.value + 1;
});

const showingTo = computed(() => {
  if (totalItems.value === 0) return 0;
  return Math.min(currentPage.value * currentPerPage.value, totalItems.value);
});

const pagesList = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const result = [];
  result.push(1);

  if (current > 3) {
    result.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    result.push(i);
  }

  if (current < total - 2) {
    result.push("...");
  }

  result.push(total);
  return result;
});

function goToPage(page) {
  const target = Number(page);
  if (isNaN(target) || target < 1 || target > totalPages.value) return;
  if (target === currentPage.value) return;
  jumpError.value = "";
  emit("change", target);
  emit("page-change", target);
  emit("update:page", target);
}

function handlePerPageChange(newVal) {
  const perPage = Number(newVal);
  if (isNaN(perPage) || perPage <= 0) return;
  emit("per-page-change", { page: 1, per_page: perPage });
  emit("per-page-change", perPage);
  emit("update:per_page", perPage);
  emit("update:perPage", perPage);
  emit("change", 1);
  emit("page-change", 1);
  emit("update:page", 1);
}

function openMobileJump() {
  jumpError.value = "";
  jumpPageInput.value = "";
  showMobileJump.value = true;
  nextTick(() => {
    mobileJumpInputRef.value?.focus();
  });
}

function closeMobileJump() {
  jumpError.value = "";
  jumpPageInput.value = "";
  showMobileJump.value = false;
}

function executeJump() {
  const val = jumpPageInput.value.trim();
  if (!val) {
    jumpError.value = "Enter page number";
    return;
  }

  const pageNum = Number(val);
  if (isNaN(pageNum) || !Number.isInteger(pageNum)) {
    jumpError.value = "Invalid number";
    return;
  }

  if (pageNum < 1 || pageNum > totalPages.value) {
    jumpError.value = `Page must be between 1 and ${totalPages.value}`;
    return;
  }

  jumpError.value = "";
  jumpPageInput.value = "";
  showMobileJump.value = false;
  goToPage(pageNum);
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 4px);
}
</style>
