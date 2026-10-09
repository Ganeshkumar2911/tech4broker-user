<template>
  <div class="pointer-events-auto">
    <div
      class="bg-card-background/90 backdrop-blur-md border border-primary-border text-primary-text min-w-36 justify-between items-center w-fit px-2.5 py-1 text-xs rounded-lg shadow-sm flex gap-2.5 hover:border-primary/40 transition-all select-none"
    >
      <span
        class="font-medium text-xs text-primary-text truncate max-w-[120px]"
        >{{ indicator.name }}</span
      >
      <div class="flex items-center gap-0.5">
        <button
          type="button"
          @click.stop="toggleVisibility"
          title="Toggle Visibility"
          class="p-1 rounded-md text-secondary-text hover:text-primary-text hover:bg-background/80 transition-colors cursor-pointer"
        >
          <Eye v-if="visible" class="w-3.5 h-3.5" />
          <EyeClosed v-else class="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          @click.stop="showEditModal = true"
          title="Edit Settings"
          class="p-1 rounded-md text-secondary-text hover:text-primary-text hover:bg-background/80 transition-colors cursor-pointer"
        >
          <PenIcon class="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          @click.stop="showDeleteConfirm = true"
          title="Remove Indicator"
          class="p-1 rounded-md text-primary-red/80 hover:text-primary-red hover:bg-primary-red/10 transition-colors cursor-pointer"
        >
          <Trash class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Edit Modal -->
    <IndicatorEditModal
      :modelValue="showEditModal"
      :indicator="props.indicator"
      @close="showEditModal = false"
    />

    <!-- Delete Confirm Modal -->
    <Modal :modelValue="showDeleteConfirm" @close="showDeleteConfirm = false">
      <div class="p-5 max-w-sm w-screen flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-primary-red/10 text-primary-red flex items-center justify-center shrink-0"
          >
            <Trash class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-primary-text">
              Remove Indicator
            </h3>
            <p class="text-xs text-secondary-text mt-0.5">
              Are you sure you want to remove
              <span class="font-semibold text-primary-text">{{
                indicator.name
              }}</span>
              from your chart?
            </p>
          </div>
        </div>

        <div
          class="flex items-center justify-end gap-2 pt-2 border-t border-primary-border"
        >
          <button
            type="button"
            @click.stop="showDeleteConfirm = false"
            class="px-4 py-2 rounded-xl border border-primary-border text-xs font-medium text-primary-text hover:bg-background transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click.stop="confirmRemove"
            class="px-4 py-2 rounded-xl bg-primary-red text-white text-xs font-semibold hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            Remove
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { Eye, EyeClosed, PenIcon, Trash } from "lucide-vue-next";
import { useChartStore } from "@/stores/client/chart.js";
import { getChart, isMainIndicator } from "@/utils/chart/chart";
import IndicatorEditModal from "./IndicatorEditModal.vue";
import Modal from "@/components/base/Modal.vue";

const chartStore = useChartStore();
const { selectedIndicators } = storeToRefs(chartStore);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const visible = ref(true);

const props = defineProps({
  indicator: {
    type: Object,
    required: true,
  },
});

const getTargetPaneId = () => {
  const isMain = isMainIndicator(props.indicator);
  if (isMain) return "candle_pane";
  return props.indicator.paneId && props.indicator.paneId !== 'candle_pane' 
    ? props.indicator.paneId 
    : `pane-${props.indicator.name}`;
};

const toggleVisibility = () => {
  const chart = getChart();
  visible.value = !visible.value;
  if (chart) {
    if (props.indicator.id) {
      chart.overrideIndicator({ id: props.indicator.id, visible: visible.value });
    } else {
      chart.overrideIndicator({ name: props.indicator.name, visible: visible.value });
    }
  }
};

const confirmRemove = () => {
  showDeleteConfirm.value = false;
  removeIndicator();
};

const removeIndicator = () => {
  const chart = getChart();
  if (chart) {
    try {
      if (props.indicator.id) {
        chart.removeIndicator({ id: props.indicator.id });
      }
      chart.removeIndicator({ name: props.indicator.name });
    } catch (e) {
      console.warn("Could not remove indicator:", e);
    }
  }

  const index = selectedIndicators.value.findIndex(
    (i) => (props.indicator.id && i.id === props.indicator.id) || i.name === props.indicator.name,
  );
  if (index > -1) {
    selectedIndicators.value.splice(index, 1);
  }
};
</script>

<style scoped></style>
