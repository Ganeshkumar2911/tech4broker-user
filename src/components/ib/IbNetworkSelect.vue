<template>
  <div class="relative w-full" ref="dropdownRoot">
    <button
      type="button"
      @click="dropdownOpen = !dropdownOpen"
      class="w-full flex items-center justify-between gap-2.5 bg-card-background text-primary-text font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer hover:border-primary focus:outline-none"
    >
      <div class="flex items-center gap-2 truncate min-w-0">
        <span class="truncate" :class="selectedIb ? 'text-primary-text' : 'text-secondary-text font-normal'">
          {{ selectedIbLabel }}
        </span>
        <span
          v-if="selectedIb"
          class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0"
        >
          L{{ selectedIb.level }}
        </span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          v-if="selectedIb"
          type="button"
          @click.stop="onSelect(null)"
          class="p-0.5 rounded-full hover:bg-primary-border/60 text-secondary-text hover:text-primary-text transition-colors"
          title="Clear selection"
        >
          <X class="w-3.5 h-3.5" />
        </button>
        <ChevronDown
          class="w-4 h-4 transition-transform duration-200 text-secondary-text"
          :class="dropdownOpen ? 'rotate-180 text-primary' : ''"
        />
      </div>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="dropdownOpen"
      class="absolute left-0 z-50 mt-2 w-full min-w-[280px] sm:min-w-[320px] bg-card-background border border-primary-border rounded-2xl overflow-hidden max-h-72 overflow-y-auto no-scrollbar shadow-lg"
    >
      <div class="p-2.5 border-b border-primary-border/60 sticky top-0 bg-card-background z-10">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search IB account or level..."
          class="w-full bg-background text-primary-text text-xs px-3 py-2 rounded-xl border border-primary-border/60 focus:outline-none focus:border-primary"
        />
      </div>

      <button
        type="button"
        @click="onSelect(null)"
        class="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-semibold text-left hover:bg-background transition-colors cursor-pointer border-b border-primary-border/20"
        :class="
          !modelValue
            ? 'text-primary bg-primary/5 font-bold'
            : 'text-primary-text'
        "
      >
        <div class="min-w-0 flex-1">
          <p class="font-bold truncate">All IBs</p>
        </div>
      </button>

      <button
        v-for="ib in filteredIbList"
        :key="ib.id"
        type="button"
        @click="onSelect(ib.id)"
        class="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-semibold text-left hover:bg-background transition-colors cursor-pointer border-b border-primary-border/20 last:border-b-0"
        :class="
          String(ib.id) === String(modelValue)
            ? 'text-primary bg-primary/5 font-bold'
            : 'text-primary-text'
        "
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="font-bold truncate text-primary-text">{{ ib.name }}</p>
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-blue/10 text-primary-blue shrink-0">
              Level {{ ib.level }}
            </span>
          </div>
          <p v-if="ib.email" class="text-[11px] text-secondary-text truncate mt-0.5">
            {{ ib.email }}
          </p>
        </div>

        <div class="text-right shrink-0">
          <span class="text-[10px] font-mono text-secondary-text block">ID: {{ ib.id }}</span>
          <span v-if="ib.sub_ibs_count > 0" class="text-[9px] text-secondary-text/80 block">
            {{ ib.sub_ibs_count }} Sub-IBs
          </span>
        </div>
      </button>

      <p v-if="!filteredIbList.length" class="px-4 py-4 text-xs text-secondary-text text-center">
        {{ reportsStore.ibLoading ? "Loading IB accounts..." : "No IB accounts found" }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ChevronDown, X } from "lucide-vue-next";
import { useIbReportsStore } from "@/stores/ib/reports";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null,
  },
  placeholder: {
    type: String,
    default: "Search Sub IB...",
  },
});

const emit = defineEmits(["update:modelValue"]);

const reportsStore = useIbReportsStore();

const dropdownRoot = ref(null);
const dropdownOpen = ref(false);
const searchQuery = ref("");

const filteredIbList = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return reportsStore.ibList;
  return reportsStore.ibList.filter(
    (ib) =>
      (ib.name && ib.name.toLowerCase().includes(q)) ||
      (ib.email && ib.email.toLowerCase().includes(q)) ||
      String(ib.id).includes(q) ||
      String(ib.level).includes(q)
  );
});

const selectedIb = computed(() => {
  if (!props.modelValue) return null;
  return reportsStore.ibList.find((ib) => String(ib.id) === String(props.modelValue)) || null;
});

const selectedIbLabel = computed(() => {
  if (!selectedIb.value) return props.placeholder;
  return selectedIb.value.name || `IB #${selectedIb.value.id}`;
});

const onSelect = (id) => {
  emit("update:modelValue", id);
  dropdownOpen.value = false;
  searchQuery.value = "";
};

const handleClickOutside = (e) => {
  if (dropdownRoot.value && !dropdownRoot.value.contains(e.target)) {
    dropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  // Fetch only if it hasn't been fetched yet
  if (!reportsStore.ibList || reportsStore.ibList.length === 0) {
    // We pass a flag or just call it. fetchIbList sets ibLoading.
    if (!reportsStore.ibLoading) {
      reportsStore.fetchIbList();
    }
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
