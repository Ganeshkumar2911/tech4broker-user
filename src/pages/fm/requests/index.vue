<script setup>
import { ref, computed, onMounted } from "vue";
import { useFmStrategiesStore } from "@/stores/fm/strategies";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BaseTabs from "@/components/base/BaseTabs.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import CreateStrategyModal from "@/components/fm/CreateStrategyModal.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import { LayoutGrid, Table } from "lucide-vue-next";

const strategiesStore = useFmStrategiesStore();
const activeStatusFilter = ref("all");
const isCreateModalOpen = ref(false);
const selectedRequest = ref(null);
const isDetailModalOpen = ref(false);

const viewMode = ref(localStorage.getItem("fm_requests_view_mode") || "grid");

const viewTabs = [
  { value: "grid", icon: LayoutGrid, title: "Card View", iconSize: 15 },
  { value: "table", icon: Table, title: "Table View", iconSize: 15 },
];

function setViewMode(mode) {
  viewMode.value = mode;
  localStorage.setItem("fm_requests_view_mode", mode);
}

onMounted(() => {
  strategiesStore.fetchRequests(true);
});

const statusTabs = computed(() => [
  { label: "All Requests", value: "all", count: strategiesStore.requests.length },
  { label: "Pending", value: "pending", count: strategiesStore.pendingRequests.length },
  { label: "Approved", value: "approved", count: strategiesStore.approvedRequests.length },
  { label: "Rejected", value: "rejected", count: strategiesStore.rejectedRequests.length },
]);

const filteredRequests = computed(() => {
  if (activeStatusFilter.value === "all") return strategiesStore.requests;
  return strategiesStore.requests.filter(
    (r) => r.status === activeStatusFilter.value
  );
});

function openDetail(req) {
  selectedRequest.value = req;
  isDetailModalOpen.value = true;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

const tableColumns = [
  { key: "request", label: "Strategy Request", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "performance_fee", label: "Perf. Fee", sortable: true },
  { key: "fm_share", label: "FM Share", sortable: true },
  { key: "broker_share", label: "Broker Share", sortable: true },
  { key: "min_capital", label: "Min Capital", sortable: true },
  { key: "settlement", label: "Settlement", sortable: true },
  { key: "created_at", label: "Submitted Date", sortable: true },
  { key: "actions", label: "Actions", align: "right", sortable: false },
];
</script>

<template>
  <div class="space-y-6">
    <!-- Top Action Bar: Status Tabs (Left) & Actions (Right) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <!-- Status Tabs -->
      <div class="w-full sm:w-auto">
        <BaseTabs
          v-model="activeStatusFilter"
          :tabs="statusTabs"
          over-ride-class="border border-primary-border/40 p-1 gap-1.5"
          button-class="!text-sm font-medium px-4 sm:px-5 justify-center"
        />
      </div>

      <!-- Action Buttons Right (Single Row) -->
      <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-auto flex-nowrap">
        <!-- View Mode Switcher using BaseTabs (Icon-only) -->
        <BaseTabs
          v-model="viewMode"
          :tabs="viewTabs"
          over-ride-class="border border-primary-border bg-card-background p-0.5"
          button-class="!h-8 !w-8 !px-0 justify-center"
          @update:modelValue="setViewMode"
        />

        <!-- Refresh Button -->
        <RefreshButton
          :loading="strategiesStore.requestsLoading"
          title="Refresh requests"
          bg-class="bg-card-background border border-primary-border"
          button-class="!h-9 !w-9 !rounded-xl hover:bg-background"
          :icon-size="16"
          @click="strategiesStore.fetchRequests(true)"
        />

        <!-- New Strategy Request Button -->
        <button
          type="button"
          @click="isCreateModalOpen = true"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-button text-button-text text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs h-9 whitespace-nowrap"
        >
          <BaseIcon name="add" :size="16" />
          <span>New Strategy Request</span>
        </button>
      </div>
    </div>

    <!-- Loading Skeleton for Cards View -->
    <div
      v-if="strategiesStore.requestsLoading && viewMode === 'grid'"
      class="space-y-3"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="p-5 rounded-2xl bg-card-background border border-primary-border space-y-2.5 animate-pulse"
      >
        <div class="h-4 w-1/3 bg-primary-border/60 rounded"></div>
        <div class="h-3 w-1/2 bg-primary-border/40 rounded"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredRequests.length === 0 && !strategiesStore.requestsLoading"
      class="p-8 rounded-2xl bg-card-background border border-primary-border text-center"
    >
      <EmptyState
        title="No Requests Found"
        :subtitle="
          activeStatusFilter === 'all'
            ? 'You have not submitted any strategy requests yet.'
            : `No ${activeStatusFilter} strategy requests found.`
        "
      >
        <template #actions>
          <button
            type="button"
            @click="isCreateModalOpen = true"
            class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-button text-button-text text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <BaseIcon name="add" :size="16" />
            <span>Submit New Request</span>
          </button>
        </template>
      </EmptyState>
    </div>

    <!-- Requests List Cards View -->
    <div
      v-else-if="viewMode === 'grid'"
      class="space-y-3"
    >
      <div
        v-for="req in filteredRequests"
        :key="req.request_id || req.id"
        class="p-4 sm:p-5 rounded-2xl bg-card-background border border-primary-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-primary-border/80"
      >
        <!-- Left: Request Info & Status -->
        <div class="flex items-start gap-3.5 min-w-0 flex-1">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
            :class="[
              req.status === 'approved'
                ? 'bg-primary-green/10 text-primary-green border-primary-green/20'
                : req.status === 'rejected'
                  ? 'bg-primary-red/10 text-primary-red border-primary-red/20'
                  : 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20',
            ]"
          >
            <BaseIcon
              :name="
                req.status === 'approved'
                  ? 'check_circle'
                  : req.status === 'rejected'
                    ? 'cancel'
                    : 'schedule'
              "
              :size="20"
            />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm font-bold text-primary-text truncate" :title="req.label_name">
                {{ req.label_name || `Request #${req.request_id || req.id}` }}
              </h3>

              <!-- Status Badge -->
              <span
                class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0"
                :class="[
                  req.status === 'approved'
                    ? 'bg-primary-green/10 text-primary-green border border-primary-green/20'
                    : req.status === 'rejected'
                      ? 'bg-primary-red/10 text-primary-red border-primary-red/20'
                      : 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20',
                ]"
              >
                {{ req.status || "Pending" }}
              </span>

              <span
                v-if="req.approved_fm_id"
                class="text-[10px] font-mono text-primary-green px-1.5 py-0.2 rounded bg-primary-green/10 border border-primary-green/20"
              >
                Approved FM #{{ req.approved_fm_id }}
              </span>
            </div>

            <!-- Meta parameters row -->
            <div class="flex items-center gap-3 text-xs text-secondary-text flex-wrap mt-1">
              <span>Req ID: <strong class="text-primary-text font-mono">#{{ req.request_id || req.id }}</strong></span>
              <span>&bull; Perf. Fee: <strong class="text-primary-text">{{ req.performance_fee ?? 0 }}%</strong></span>
              <span>&bull; Min Capital: <strong class="text-primary-text font-mono">${{ Number(req.min_capital ?? 0).toLocaleString("en-US") }}</strong></span>
              <span>&bull; Settlement: <strong class="text-primary-text capitalize">{{ req.settlement_type || "Weekly" }}</strong></span>
              <span v-if="req.created_at">&bull; Date: <strong class="text-primary-text">{{ formatDate(req.created_at) }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Right: Action Details Button -->
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            @click="openDetail(req)"
            class="px-3 py-1.5 rounded-xl text-xs font-medium text-primary-text bg-background border border-primary-border hover:bg-card-background transition-colors cursor-pointer flex items-center gap-1.5 h-9"
          >
            <BaseIcon name="visibility" :size="15" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Requests DataTable View -->
    <div
      v-else-if="viewMode === 'table'"
      class="bg-card-background rounded-2xl border border-primary-border overflow-hidden"
    >
      <DataTable
        :columns="tableColumns"
        :rows="filteredRequests"
        :loading="strategiesStore.requestsLoading"
        row-key="request_id"
        customizable-columns
        column-storage-key="fm_strategy_requests_table_columns"
        empty-text="No strategy requests available"
      >
        <!-- Strategy Request Column -->
        <template #cell-request="{ row }">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
              :class="[
                row.status === 'approved'
                  ? 'bg-primary-green/10 text-primary-green border-primary-green/20'
                  : row.status === 'rejected'
                    ? 'bg-primary-red/10 text-primary-red border-primary-red/20'
                    : 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20',
              ]"
            >
              <BaseIcon
                :name="
                  row.status === 'approved'
                    ? 'check_circle'
                    : row.status === 'rejected'
                      ? 'cancel'
                      : 'schedule'
                "
                :size="16"
              />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-primary-text truncate" :title="row.label_name">
                {{ row.label_name || `Request #${row.request_id || row.id}` }}
              </p>
              <p class="text-[10px] text-secondary-text font-mono mt-0.5">
                Req ID: #{{ row.request_id || row.id }}
                <span v-if="row.approved_fm_id" class="text-primary-green font-semibold">
                  &bull; FM #{{ row.approved_fm_id }}
                </span>
              </p>
            </div>
          </div>
        </template>

        <!-- Status Column -->
        <template #cell-status="{ row }">
          <span
            class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1 shrink-0"
            :class="[
              row.status === 'approved'
                ? 'bg-primary-green/10 text-primary-green border border-primary-green/20'
                : row.status === 'rejected'
                  ? 'bg-primary-red/10 text-primary-red border-primary-red/20'
                  : 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20',
            ]"
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="[
                row.status === 'approved'
                  ? 'bg-primary-green'
                  : row.status === 'rejected'
                    ? 'bg-primary-red'
                    : 'bg-primary-yellow',
              ]"
            />
            {{ row.status || "Pending" }}
          </span>
        </template>

        <!-- Performance Fee Column -->
        <template #cell-performance_fee="{ row }">
          <span class="text-xs font-bold text-primary-text">{{ row.performance_fee ?? 0 }}%</span>
        </template>

        <!-- FM Share Column -->
        <template #cell-fm_share="{ row }">
          <span class="text-xs font-bold text-primary-text">{{ row.fm_share ?? 0 }}%</span>
        </template>

        <!-- Broker Share Column -->
        <template #cell-broker_share="{ row }">
          <span class="text-xs font-medium text-secondary-text">{{ row.broker_share ?? 0 }}%</span>
        </template>

        <!-- Min Capital Column -->
        <template #cell-min_capital="{ row }">
          <span class="text-xs font-bold text-primary-text font-mono">
            ${{ Number(row.min_capital ?? 0).toLocaleString("en-US") }}
          </span>
        </template>

        <!-- Settlement Column -->
        <template #cell-settlement="{ row }">
          <span class="text-xs font-medium text-primary-text capitalize">
            {{ row.settlement_type || "Weekly" }}
          </span>
        </template>

        <!-- Submitted Date Column -->
        <template #cell-created_at="{ row }">
          <span class="text-xs text-secondary-text">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <!-- Actions Column -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end">
            <button
              type="button"
              @click.stop="openDetail(row)"
              class="px-2.5 py-1 rounded-lg text-xs font-medium text-primary-text bg-background border border-primary-border hover:bg-card-background transition-colors cursor-pointer flex items-center gap-1"
            >
              <BaseIcon name="visibility" :size="14" />
              <span>Details</span>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create Request Modal -->
    <CreateStrategyModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @success="strategiesStore.fetchRequests(true)"
    />

    <!-- Request Details Drawer (Slides in from Right) -->
    <Teleport to="body">
      <!-- Backdrop Overlay -->
      <transition name="drawer-fade">
        <div
          v-if="isDetailModalOpen && selectedRequest"
          class="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs transition-opacity"
          @click="isDetailModalOpen = false"
        />
      </transition>

      <!-- Side Panel Drawer -->
      <transition name="drawer-slide">
        <div
          v-if="isDetailModalOpen && selectedRequest"
          class="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-lg flex-col bg-card-background border-l border-primary-border overflow-hidden font-sans"
          role="dialog"
          aria-modal="true"
          @click.stop
        >
          <!-- Header -->
          <div class="px-5 sm:px-6 py-4 border-b border-primary-border bg-card-background flex items-center justify-between shrink-0 sticky top-0 z-20">
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-bold text-primary-text truncate">
                {{ selectedRequest.label_name || `Request #${selectedRequest.request_id || selectedRequest.id}` }}
              </h3>
              <p class="text-xs text-secondary-text">Strategy Request Details</p>
            </div>
            <button
              type="button"
              @click="isDetailModalOpen = false"
              class="p-1.5 rounded-xl text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer shrink-0"
            >
              <BaseIcon name="close" :size="20" />
            </button>
          </div>

          <!-- Body Parameters -->
          <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-background/50 text-xs no-scrollbar">
            <div class="grid grid-cols-2 gap-2.5">
              <div class="p-3 rounded-xl bg-card-background border border-primary-border/60">
                <p class="text-[10px] uppercase font-semibold text-secondary-text">Status</p>
                <p class="font-bold capitalize mt-0.5 text-sm">{{ selectedRequest.status || "Pending" }}</p>
              </div>
              <div class="p-3 rounded-xl bg-card-background border border-primary-border/60">
                <p class="text-[10px] uppercase font-semibold text-secondary-text">Approved FM ID</p>
                <p class="font-bold font-mono mt-0.5 text-sm">{{ selectedRequest.approved_fm_id ? `#${selectedRequest.approved_fm_id}` : "Pending" }}</p>
              </div>
              <div class="p-3 rounded-xl bg-card-background border border-primary-border/60">
                <p class="text-[10px] uppercase font-semibold text-secondary-text">Performance Fee</p>
                <p class="font-bold mt-0.5 text-sm">{{ selectedRequest.performance_fee ?? 0 }}%</p>
              </div>
              <div class="p-3 rounded-xl bg-card-background border border-primary-border/60">
                <p class="text-[10px] uppercase font-semibold text-secondary-text">FM Share</p>
                <p class="font-bold mt-0.5 text-sm">{{ selectedRequest.fm_share ?? 0 }}%</p>
              </div>
              <div class="p-3 rounded-xl bg-card-background border border-primary-border/60">
                <p class="text-[10px] uppercase font-semibold text-secondary-text">Broker Share</p>
                <p class="font-bold mt-0.5 text-sm">{{ selectedRequest.broker_share ?? 0 }}%</p>
              </div>
              <div class="p-3 rounded-xl bg-card-background border border-primary-border/60">
                <p class="text-[10px] uppercase font-semibold text-secondary-text">IB Referral Pool</p>
                <p class="font-bold mt-0.5 text-sm">{{ selectedRequest.ib_pool_percentage ?? 40 }}%</p>
              </div>
              <div class="p-3 rounded-xl bg-card-background border border-primary-border/60">
                <p class="text-[10px] uppercase font-semibold text-secondary-text">Min Capital</p>
                <p class="font-bold font-mono mt-0.5 text-sm">${{ Number(selectedRequest.min_capital ?? 0).toLocaleString("en-US") }}</p>
              </div>
              <div class="p-3 rounded-xl bg-card-background border border-primary-border/60">
                <p class="text-[10px] uppercase font-semibold text-secondary-text">Settlement Cycle</p>
                <p class="font-bold capitalize mt-0.5 text-sm">{{ selectedRequest.settlement_type || "Weekly" }}</p>
              </div>
            </div>

            <div v-if="selectedRequest.message" class="p-3.5 rounded-xl bg-card-background border border-primary-border/60 space-y-1">
              <p class="text-[10px] uppercase font-semibold text-secondary-text">Note to Admin</p>
              <p class="text-primary-text leading-relaxed">{{ selectedRequest.message }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 sm:px-6 py-4 border-t border-primary-border bg-card-background flex justify-end shrink-0 sticky bottom-0 z-20">
            <button
              type="button"
              @click="isDetailModalOpen = false"
              class="px-5 py-2 text-xs font-semibold rounded-xl bg-button text-button-text hover:opacity-90 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease-out;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-slide-leave-active {
  transition: transform 0.2s cubic-bezier(0.7, 0, 0.84, 0);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
