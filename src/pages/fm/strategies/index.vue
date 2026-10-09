<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useFmStrategiesStore } from "@/stores/fm/strategies";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BaseTabs from "@/components/base/BaseTabs.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import CreateStrategyModal from "@/components/fm/CreateStrategyModal.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import { LayoutGrid, Table, ArrowRight } from "lucide-vue-next";

const router = useRouter();
const strategiesStore = useFmStrategiesStore();
const isCreateModalOpen = ref(false);

const viewMode = ref(localStorage.getItem("fm_strategies_view_mode") || "grid");

const viewTabs = [
  { value: "grid", icon: LayoutGrid, title: "Card View", iconSize: 15 },
  { value: "table", icon: Table, title: "Table View", iconSize: 15 },
];

function setViewMode(mode) {
  viewMode.value = mode;
  localStorage.setItem("fm_strategies_view_mode", mode);
}

onMounted(() => {
  strategiesStore.fetchStrategies(true);
});

function handleSelect(fmId) {
  strategiesStore.selectStrategy(fmId);
}

function handleNavigateToOffers(fmId) {
  if (fmId) {
    strategiesStore.selectStrategy(fmId);
  }
  router.push({ name: "fm-offers" });
}

const tableColumns = [
  { key: "strategy", label: "Strategy", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "performance_fee", label: "Perf. Fee", sortable: true },
  { key: "fm_share", label: "FM Share", sortable: true },
  { key: "broker_share", label: "Broker Share", sortable: true },
  { key: "min_capital", label: "Min Capital", sortable: true },
  { key: "settlement", label: "Settlement", sortable: true },
  { key: "visibility", label: "Visibility", sortable: true },
  { key: "actions", label: "Actions", align: "right", sortable: false },
];
</script>

<template>
  <div class="space-y-6">
    <!-- Active Strategy Highlight Banner & Actions Bar -->
    <div
      v-if="strategiesStore.selectedStrategy"
      class="p-5 rounded-2xl bg-card-background relative overflow-hidden"
    >
      <div class="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
        <!-- Strategy Info Left -->
        <div class="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            class="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20"
          >
            <BaseIcon name="psychology" :size="24" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-bold text-primary-text truncate">
                {{ strategiesStore.selectedStrategy.label_name || `Strategy #${strategiesStore.selectedStrategy.fm_id}` }}
              </h3>
              <span
                class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0"
                :class="
                  strategiesStore.selectedStrategy.is_active !== false
                    ? 'bg-primary-green/10 text-primary-green border border-primary-green/20'
                    : 'bg-secondary-text/10 text-secondary-text border border-secondary-text/20'
                "
              >
                {{ strategiesStore.selectedStrategy.is_active !== false ? "Active Strategy" : "Inactive" }}
              </span>
              <span class="text-xs font-mono text-secondary-text shrink-0">
                FM ID: #{{ strategiesStore.selectedStrategy.fm_id }}
              </span>
            </div>
            <p class="text-xs text-secondary-text mt-1">
              Currently active strategy for Dashboard, Offers, Followers, and Settlements.
            </p>
          </div>
        </div>

        <!-- Consolidated Action Buttons Right (Single Row) -->
        <div class="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            @click="router.push({ name: 'followers' })"
            class="px-3 py-1.5 rounded-xl text-xs font-medium text-primary-text bg-background border border-primary-border hover:bg-card-background transition-colors cursor-pointer flex items-center gap-1.5 h-9 whitespace-nowrap"
          >
            <BaseIcon name="group" :size="15" />
            <span>Followers</span>
          </button>

          <button
            type="button"
            @click="router.push({ name: 'fm-trade-books' })"
            class="px-3 py-1.5 rounded-xl text-xs font-medium text-primary-text bg-background border border-primary-border hover:bg-card-background transition-colors cursor-pointer flex items-center gap-1.5 h-9 whitespace-nowrap"
          >
            <BaseIcon name="menu_book" :size="15" />
            <span>Trade Book</span>
          </button>

          <!-- View Mode Switcher using BaseTabs (Icon-only) -->
          <BaseTabs
            v-model="viewMode"
            :tabs="viewTabs"
            over-ride-class="border border-primary-border bg-background p-0.5"
            button-class="!h-8 !w-8 !px-0 justify-center"
            @update:modelValue="setViewMode"
          />

          <!-- Refresh Button using RefreshButton component -->
          <RefreshButton
            :loading="strategiesStore.isLoading"
            title="Refresh strategies"
            bg-class="bg-background border border-primary-border"
            button-class="!h-9 !w-9 !rounded-xl hover:bg-card-background"
            :icon-size="16"
            @click="strategiesStore.fetchStrategies(true)"
          />

          <!-- Create Strategy Request Button -->
          <button
            type="button"
            @click="isCreateModalOpen = true"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-button text-button-text text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs h-9 whitespace-nowrap"
          >
            <BaseIcon name="add" :size="16" />
            <span>New Strategy Request</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton State for Grid View -->
    <div
      v-if="strategiesStore.isLoading && viewMode === 'grid'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="p-5 rounded-2xl bg-card-background border border-primary-border space-y-3 animate-pulse"
      >
        <div class="h-5 w-1/2 bg-primary-border/60 rounded"></div>
        <div class="h-4 w-3/4 bg-primary-border/40 rounded"></div>
        <div class="grid grid-cols-2 gap-2 pt-2">
          <div class="h-10 bg-primary-border/30 rounded"></div>
          <div class="h-10 bg-primary-border/30 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="strategiesStore.strategies.length === 0 && !strategiesStore.isLoading"
      class="p-8 rounded-2xl bg-card-background border border-primary-border text-center"
    >
      <EmptyState
        title="No Strategies Found"
        subtitle="You do not have any active live trading strategies yet. Submit a strategy request to get started."
      >
        <template #actions>
          <button
            type="button"
            @click="isCreateModalOpen = true"
            class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-button text-button-text text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <BaseIcon name="add" :size="16" />
            <span>Create First Strategy Request</span>
          </button>
        </template>
      </EmptyState>
    </div>

    <!-- Card Grid View -->
    <div
      v-else-if="viewMode === 'grid'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="strat in strategiesStore.strategies"
        :key="strat.fm_id"
        class="p-5 rounded-2xl bg-card-background border transition-all flex flex-col justify-between gap-4"
        :class="
          Number(strat.fm_id) === Number(strategiesStore.selectedStrategyId)
            ? 'border-primary/80 ring-1 ring-primary/20'
            : 'border-primary-border hover:border-primary-border/80'
        "
      >
        <!-- Card Header -->
        <div>
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-primary-text truncate" :title="strat.label_name">
                {{ strat.label_name || `Strategy #${strat.fm_id}` }}
              </h3>
              <p class="text-2xs text-secondary-text font-mono mt-0.5">
                FM ID: #{{ strat.fm_id }}
                <span v-if="strat.master_account_id">&bull; Master: #{{ strat.master_account_id }}</span>
              </p>
            </div>

            <span
              class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0"
              :class="
                strat.is_active !== false
                  ? 'bg-primary-green/10 text-primary-green border border-primary-green/20'
                  : 'bg-secondary-text/10 text-secondary-text border border-secondary-text/20'
              "
            >
              {{ strat.is_active !== false ? "Active" : "Inactive" }}
            </span>
          </div>

          <!-- Parameter Metrics Grid -->
          <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div class="p-2.5 rounded-xl bg-background border border-primary-border/60">
              <p class="text-[10px] uppercase font-semibold text-secondary-text">Perf. Fee</p>
              <p class="text-sm font-bold text-primary-text mt-0.5">{{ strat.performance_fee ?? 0 }}%</p>
            </div>
            <div class="p-2.5 rounded-xl bg-background border border-primary-border/60">
              <p class="text-[10px] uppercase font-semibold text-secondary-text">FM Share</p>
              <p class="text-sm font-bold text-primary-text mt-0.5">{{ strat.fm_share ?? 0 }}%</p>
            </div>
            <div class="p-2.5 rounded-xl bg-background border border-primary-border/60">
              <p class="text-[10px] uppercase font-semibold text-secondary-text">Min Capital</p>
              <p class="text-sm font-bold text-primary-text mt-0.5 font-mono">${{ Number(strat.min_capital ?? 0).toLocaleString("en-US") }}</p>
            </div>
            <div class="p-2.5 rounded-xl bg-background border border-primary-border/60">
              <p class="text-[10px] uppercase font-semibold text-secondary-text">Settlement</p>
              <p class="text-sm font-bold text-primary-text capitalize mt-0.5">{{ strat.settlement_type || "Weekly" }}</p>
            </div>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="pt-3 border-t border-primary-border/60 flex items-center justify-between gap-2">
          <button
            v-if="Number(strat.fm_id) !== Number(strategiesStore.selectedStrategyId)"
            type="button"
            @click="handleSelect(strat.fm_id)"
            class="flex-1 h-9 px-3 text-xs font-semibold rounded-xl bg-background hover:bg-card-background border border-primary-border text-primary-text transition-colors cursor-pointer flex items-center justify-center text-center"
          >
            Select Strategy
          </button>
          <div
            v-else
            class="flex-1 h-9 px-3 text-xs font-semibold rounded-xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center gap-1.5"
          >
            <BaseIcon name="check_circle" :size="15" />
            <span>Selected</span>
          </div>

          <button
            type="button"
            @click="handleNavigateToOffers(strat.fm_id)"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-card-background border border-primary-border text-primary-text hover:text-primary transition-colors cursor-pointer shrink-0"
            title="View offers for this strategy"
          >
            <ArrowRight :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- DataTable View -->
    <div
      v-else-if="viewMode === 'table'"
      class="bg-card-background rounded-2xl border border-primary-border overflow-hidden"
    >
      <DataTable
        :columns="tableColumns"
        :rows="strategiesStore.strategies"
        :loading="strategiesStore.isLoading"
        row-key="fm_id"
        customizable-columns
        column-storage-key="fm_strategies_table_columns"
        empty-text="No strategies available"
      >
        <!-- Strategy Column -->
        <template #cell-strategy="{ row }">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20"
            >
              <BaseIcon name="psychology" :size="18" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-primary-text truncate" :title="row.label_name">
                {{ row.label_name || `Strategy #${row.fm_id}` }}
              </p>
              <p class="text-[10px] text-secondary-text font-mono mt-0.5">
                FM ID: #{{ row.fm_id }}
                <span v-if="row.master_account_id">&bull; Master: #{{ row.master_account_id }}</span>
              </p>
            </div>
          </div>
        </template>

        <!-- Status Column -->
        <template #cell-status="{ row }">
          <span
            class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1 shrink-0"
            :class="
              row.is_active !== false
                ? 'bg-primary-green/10 text-primary-green border border-primary-green/20'
                : 'bg-secondary-text/10 text-secondary-text border border-secondary-text/20'
            "
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="row.is_active !== false ? 'bg-primary-green' : 'bg-secondary-text'"
            />
            {{ row.is_active !== false ? "Active" : "Inactive" }}
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
          <div class="text-xs">
            <p class="font-medium text-primary-text capitalize">{{ row.settlement_type || "Weekly" }}</p>
            <p v-if="row.settlement_time" class="text-[10px] text-secondary-text font-mono">
              {{ row.settlement_time }}
            </p>
          </div>
        </template>

        <!-- Visibility Column -->
        <template #cell-visibility="{ row }">
          <span class="text-xs font-medium text-secondary-text capitalize">
            {{ row.visibility_type || "Public" }}
          </span>
        </template>

        <!-- Actions Column -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <button
              v-if="Number(row.fm_id) !== Number(strategiesStore.selectedStrategyId)"
              type="button"
              @click.stop="handleSelect(row.fm_id)"
              class="h-8 px-3 text-xs font-semibold rounded-xl bg-background hover:bg-card-background border border-primary-border text-primary-text transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
            >
              Select
            </button>
            <div
              v-else
              class="h-8 px-3 text-xs font-semibold rounded-xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <BaseIcon name="check_circle" :size="14" />
              <span>Selected</span>
            </div>

            <button
              type="button"
              @click.stop="handleNavigateToOffers(row.fm_id)"
              class="flex h-8 w-8 items-center justify-center rounded-xl bg-background hover:bg-card-background border border-primary-border text-primary-text hover:text-primary transition-colors cursor-pointer shrink-0"
              title="View offers for this strategy"
            >
              <ArrowRight :size="15" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create Strategy Modal -->
    <CreateStrategyModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @success="strategiesStore.fetchStrategies(true)"
    />
  </div>
</template>
