<script setup>
import { ref, onMounted } from "vue";
import { useFmStrategiesStore } from "@/stores/fm/strategies";
import BaseIcon from "@/components/base/BaseIcon.vue";
import CreateStrategyModal from "./CreateStrategyModal.vue";

const props = defineProps({
  showCreateButton: {
    type: Boolean,
    default: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

const strategiesStore = useFmStrategiesStore();
const isDropdownOpen = ref(false);
const isCreateModalOpen = ref(false);

onMounted(() => {
  if (!strategiesStore.isFetched.strategies) {
    strategiesStore.fetchStrategies();
  }
});

function handleSelect(fmId) {
  strategiesStore.selectStrategy(fmId);
  isDropdownOpen.value = false;
  // Trigger window custom event for other stores if needed
  window.dispatchEvent(
    new CustomEvent("fm-strategy-changed", { detail: { fmId } })
  );
}

function openCreateModal() {
  isDropdownOpen.value = false;
  isCreateModalOpen.value = true;
}
</script>

<template>
  <div class="relative inline-flex items-center gap-2">
    <!-- Single Strategy or Multiple Strategies Selector Pill -->
    <div class="relative">
      <button
        type="button"
        @click="isDropdownOpen = !isDropdownOpen"
        :disabled="strategiesStore.isLoading"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card-background border border-primary-border text-xs font-semibold text-primary-text hover:bg-background transition-colors cursor-pointer"
        :title="strategiesStore.selectedStrategy?.label_name || 'Select Strategy'"
      >
        <div
          class="w-2 h-2 rounded-full"
          :class="
            strategiesStore.selectedStrategy?.is_active !== false
              ? 'bg-primary-green'
              : 'bg-secondary-text'
          "
        />
        <div class="flex items-center gap-1.5 min-w-0 max-w-[180px] sm:max-w-xs truncate">
          <span class="truncate">
            {{ strategiesStore.selectedStrategy?.label_name || (strategiesStore.isLoading ? "Loading..." : "No Strategy") }}
          </span>
          <span
            v-if="strategiesStore.selectedStrategy?.fm_id"
            class="text-[10px] font-mono text-secondary-text px-1.5 py-0.2 rounded bg-background border border-primary-border/60"
          >
            #{{ strategiesStore.selectedStrategy.fm_id }}
          </span>
        </div>
        <BaseIcon
          v-if="strategiesStore.strategies.length > 1"
          name="expand_more"
          :size="16"
          class="text-secondary-text transition-transform duration-200"
          :class="isDropdownOpen ? 'rotate-180' : ''"
        />
      </button>

      <!-- Dropdown Menu -->
      <div
        v-if="isDropdownOpen && strategiesStore.strategies.length > 0"
        class="absolute left-0 mt-1.5 w-64 rounded-xl bg-card-background border border-primary-border overflow-hidden z-50 p-1.5 space-y-1"
      >
        <div class="px-2.5 py-1.5 text-[10px] font-semibold text-secondary-text uppercase tracking-wider flex items-center justify-between">
          <span>Your Strategies</span>
          <span>{{ strategiesStore.strategies.length }}</span>
        </div>

        <div class="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
          <button
            v-for="strat in strategiesStore.strategies"
            :key="strat.fm_id"
            type="button"
            @click="handleSelect(strat.fm_id)"
            class="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer"
            :class="
              Number(strat.fm_id) === Number(strategiesStore.selectedStrategyId)
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-primary-text hover:bg-background'
            "
          >
            <div class="min-w-0 flex-1 pr-2">
              <p class="truncate font-medium">{{ strat.label_name || `Strategy #${strat.fm_id}` }}</p>
              <p class="text-[10px] text-secondary-text flex items-center gap-1 mt-0.5">
                <span>Fee: {{ strat.performance_fee }}%</span>
                <span v-if="strat.settlement_type">&bull; {{ strat.settlement_type }}</span>
              </p>
            </div>

            <BaseIcon
              v-if="Number(strat.fm_id) === Number(strategiesStore.selectedStrategyId)"
              name="check"
              :size="15"
              class="text-primary shrink-0"
            />
          </button>
        </div>

        <div class="pt-1 border-t border-primary-border/60">
          <button
            type="button"
            @click="openCreateModal"
            class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <BaseIcon name="add" :size="15" />
            <span>+ Create New Strategy</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Action "+ New Strategy" Button -->
    <button
      v-if="showCreateButton"
      type="button"
      @click="isCreateModalOpen = true"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-button text-button-text text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
      title="Create new fund manager strategy request"
    >
      <BaseIcon name="add" :size="15" />
      <span :class="compact ? 'hidden sm:inline' : ''">New Strategy</span>
    </button>

    <!-- Create Strategy Modal Component -->
    <CreateStrategyModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
    />
  </div>
</template>
