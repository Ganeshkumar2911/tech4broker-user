<template>
  <button
    @click="createOverlay"
    class="flex items-center text-slate-200 text-nowrap text-[12px] capitalize cursor-pointer space-x-1 font-normal hover:bg-white/5 p-2 transition-all duration-150 w-full text-left"
  >
    <div class="w-5 flex items-center justify-center text-secondary-text">
      <component
        v-if="optionData.icon"
        :is="Icon[optionData.icon] || optionData.icon"
        class="w-4 h-4 fill-current"
      />
    </div>
    <span>{{ (optionData.text || "").replaceAll("_", " ") }}</span>
  </button>
</template>
<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useChartStore } from "@/stores/client/chart.js";
import { getChart } from "@/utils/chart/chart";
import { Icon } from "@/components/shared/chart/icons";
const chartStore = useChartStore();
const { selectedOverlays, activeOverlay } = storeToRefs(chartStore);
const props = defineProps({
  item: Object,
});
const optionData = computed(() => {
  return props.item || {};
});
const emit = defineEmits(["close"]);
let overlay;
const createOverlay = () => {
  const chart = getChart();
  overlay = chart.createOverlay({
    name: optionData.value.key,
    lock: false,
    onDrawEnd: (data) => {
      selectedOverlays.value.push({
        name: data.overlay.name,
        id: data.overlay.id,
      });
      chartStore.saveDrawings();
    },
    onRemoved: (data) => {
      selectedOverlays.value = selectedOverlays.value.filter(
        (o) => o.id != data.overlay.id,
      );
      if (activeOverlay.value?.id == data.overlay.id) {
        activeOverlay.value = null;
      }
      chartStore.saveDrawings();
    },
    onSelected: (data) => {
      activeOverlay.value = { name: data.overlay.name, id: data.overlay.id };
    },
    onDeselected: (data) => {
      if (activeOverlay.value?.id == data.overlay.id) {
        activeOverlay.value = null;
      }
    },
    onPressedMoveEnd: (data) => {
      chartStore.saveDrawings();
    },
  });
  emit("close");
};
const handleKeyDown = (event) => {
  // Check if Delete key is pressed and there's a selected overlay
  if (event.key === "Delete" && overlay) {
    chart.removeOverlay(overlay);
    overlay = null;
  }
};
// Add event listener when component mounts
onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});
// Remove event listener when component unmounts
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});
</script>
<style lang="scss" scoped></style>
