<template>
  <Modal :model-value="showIndicatorModal" @close="closeModal">
    <div class="w-screen p-5 max-w-md flex flex-col max-h-[80vh]">
      <!-- Header -->
      <div
        class="flex items-center justify-between pb-3 mb-3 border-b border-primary-border"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
          >
            <Activity class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-primary-text">
              Indicators
            </h3>
            <p class="text-[11px] text-secondary-text">
              Select an indicator to add to your chart
            </p>
          </div>
        </div>
        <button
          @click="closeModal"
          class="p-1.5 rounded-lg text-secondary-text hover:text-primary-text hover:bg-background transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Search Input -->
      <div
        class="relative flex items-center gap-2 bg-background border border-primary-border rounded-xl px-3 py-2.5 mb-3 focus-within:border-primary transition-colors"
      >
        <Search class="w-4 h-4 text-secondary-text shrink-0" />
        <input
          ref="inputRef"
          v-model="search"
          type="text"
          placeholder="Search indicators..."
          class="w-full text-xs text-primary-text placeholder:text-secondary-text/60 bg-transparent outline-none"
          @keydown.esc="closeModal"
        />
        <button
          v-if="search"
          @click="search = ''"
          class="text-secondary-text hover:text-primary-text p-0.5"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Indicator List -->
      <ul
        class="flex flex-col gap-1.5 overflow-y-auto max-h-[380px] pr-1 scrollbar-thin"
      >
        <li
          v-for="indicator in filteredIndicators"
          :key="indicator.name"
          @click="addIndicator(indicator)"
          class="px-3.5 py-2.5 rounded-xl border border-primary-border bg-background/50 hover:bg-primary/5 hover:border-primary/40 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="text-xs font-medium text-primary-text group-hover:text-primary transition-colors"
            >
              {{ indicator.name }}
            </span>
            <span
              class="text-[10px] px-1.5 py-0.5 rounded font-medium"
              :class="
                isMainIndicator(indicator)
                  ? 'bg-primary-blue/10 text-primary-blue'
                  : 'bg-primary-yellow/10 text-primary-yellow'
              "
            >
              {{
                isMainIndicator(indicator)
                  ? "Main Chart"
                  : "Sub Pane"
              }}
            </span>
          </div>

          <div class="flex items-center gap-1">
            <template v-if="isIndicatorSelected(indicator.name)">
              <span
                class="text-[10px] text-primary-green font-medium flex items-center gap-1 bg-primary-green/10 px-2 py-0.5 rounded-full"
              >
                <Check class="w-3 h-3" /> Added
              </span>
            </template>
            <template v-else>
              <span
                class="text-secondary-text group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus class="w-4 h-4" />
              </span>
            </template>
          </div>
        </li>

        <li
          v-if="filteredIndicators.length === 0"
          class="flex flex-col items-center justify-center text-center py-10 text-secondary-text"
        >
          <TrendingUp class="w-8 h-8 opacity-40 mb-2" />
          <p class="text-xs font-medium">
            No indicators found matching "{{ search }}"
          </p>
        </li>
      </ul>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { registerIndicator } from "klinecharts";
import { Search, X, Activity, Check, Plus, TrendingUp } from "lucide-vue-next";
import { useChartStore } from "@/stores/client/chart.js";
import { defaultIndicators, getChart, isMainIndicator } from "@/utils/chart/chart";
import allCustomIndicators from "@/utils/chart/personal-indicators";
import Modal from "@/components/base/Modal.vue";

const chartStore = useChartStore();
const { showIndicatorModal, selectedIndicators } = storeToRefs(chartStore);

const allIndicators = [...defaultIndicators, ...allCustomIndicators];

const search = ref("");
const inputRef = ref(null);

const filteredIndicators = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return allIndicators;
  return allIndicators.filter((i) => i.name.toLowerCase().includes(q));
});

const isIndicatorSelected = (name) => {
  return selectedIndicators.value.some((i) => i.name === name);
};

const addIndicator = (indicator) => {
  const chart = getChart();
  if (!chart) return;

  const found = allIndicators.find((i) => i.name === indicator.name) || indicator;
  if (!found) return;

  // Prevent duplicate adds
  if (selectedIndicators.value.some((i) => i.name === found.name)) return;

  const isCustom = allCustomIndicators.some((i) => i.name === found.name);
  if (isCustom) {
    registerIndicator(found);
  }

  const isMain = isMainIndicator(found);
  const paneId = isMain ? "candle_pane" : `pane-${found.name}`;

  let createdId = null;
  try {
    createdId = chart.createIndicator(
      {
        name: found.name,
        paneId: paneId,
        calcParams: found.calcParams,
        createTooltipDataSource: () => ({
          name: "",
          legends: [],
        }),
      },
      true
    );
  } catch (e) {
    console.error('Error creating indicator:', e);
  }

  selectedIndicators.value.push({
    ...found,
    name: found.name,
    type: isMain ? 'main' : 'sub',
    id: createdId || found.name,
    paneId,
  });
};

function closeModal() {
  showIndicatorModal.value = false;
  search.value = "";
}

watch(showIndicatorModal, (val) => {
  if (val) nextTick(() => inputRef.value?.focus());
});
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary-border) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--color-primary-border);
  border-radius: 4px;
}
</style>
