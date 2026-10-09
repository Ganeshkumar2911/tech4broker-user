<template>
  <Modal :modelValue="props.modelValue" @close="handleClose">
    <div
      class="w-screen text-primary-text p-5 max-w-lg flex flex-col max-h-[85vh]"
    >
      <!-- Header -->
      <div
        class="flex flex-col gap-3 border-b border-primary-border pb-3 mb-4 shrink-0"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
            >
              <SlidersHorizontal class="w-4 h-4" />
            </div>
            <div>
              <h3 class="font-semibold text-base text-primary-text">
                Edit Indicator
              </h3>
              <p class="text-[11px] text-secondary-text">
                {{ props.indicator.name }}
              </p>
            </div>
          </div>
          <button
            @click="handleClose"
            class="p-1.5 rounded-lg text-secondary-text hover:text-primary-text hover:bg-background transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-4 pt-1">
          <button
            type="button"
            class="pb-2 text-xs font-medium transition-all border-b-2"
            :class="
              selectedTab === 'params'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary-text hover:text-primary-text'
            "
            @click="selectedTab = 'params'"
          >
            Parameters
          </button>
          <button
            type="button"
            class="pb-2 text-xs font-medium transition-all border-b-2"
            :class="
              selectedTab === 'style'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary-text hover:text-primary-text'
            "
            @click="selectedTab = 'style'"
          >
            Styling
          </button>
        </div>
      </div>

      <!-- Scrollable Body -->
      <div
        class="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-4 min-h-[220px]"
      >
        <template v-if="selectedTab === 'params'">
          <!-- Parameters List -->
          <div
            v-if="
              props.indicator.name === 'MultiIndicator' &&
              localParams.length > 0
            "
            class="flex w-full flex-col gap-3"
          >
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-background border border-primary-border"
            >
              <label class="font-medium text-xs text-primary-text"
                >Pivot Indicator</label
              >
              <ButtonSwitch name="pivotIndicator" v-model="localParams[0]" />
            </div>
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-background border border-primary-border"
            >
              <label class="font-medium text-xs text-primary-text"
                >Donchian Indicator</label
              >
              <ButtonSwitch name="pivotIndicator" v-model="localParams[1]" />
            </div>
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-background border border-primary-border"
            >
              <label class="font-medium text-xs text-primary-text"
                >Supertrend Indicator</label
              >
              <ButtonSwitch name="pivotIndicator" v-model="localParams[2]" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="block mb-1 font-medium text-xs text-secondary-text"
                  >Length 1</label
                >
                <input
                  v-model="localParams[3]"
                  type="number"
                  class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label
                  class="block mb-1 font-medium text-xs text-secondary-text"
                  >Length 2</label
                >
                <input
                  v-model="localParams[4]"
                  type="number"
                  class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="block mb-1 font-medium text-xs text-secondary-text"
                  >Length 3</label
                >
                <input
                  v-model="localParams[5]"
                  type="number"
                  class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label
                  class="block mb-1 font-medium text-xs text-secondary-text"
                  >Pivot Points Type</label
                >
                <select
                  v-model="localParams[6]"
                  class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary cursor-pointer"
                >
                  <option
                    value="traditional"
                    class="bg-card-background text-primary-text"
                  >
                    Traditional
                  </option>
                  <option
                    value="classic"
                    class="bg-card-background text-primary-text"
                  >
                    Classic
                  </option>
                  <option
                    value="woodie"
                    class="bg-card-background text-primary-text"
                  >
                    Woodie
                  </option>
                  <option
                    value="fibonacci"
                    class="bg-card-background text-primary-text"
                  >
                    Fibonacci
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="block mb-1 font-medium text-xs text-secondary-text"
                  >ATR Period</label
                >
                <input
                  v-model="localParams[7]"
                  type="number"
                  class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label
                  class="block mb-1 font-medium text-xs text-secondary-text"
                  >Multiplier</label
                >
                <input
                  v-model="localParams[8]"
                  type="number"
                  class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div
            v-else-if="props.indicator.name === 'Pivot Mix'"
            class="flex w-full flex-col gap-3"
          >
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-background border border-primary-border"
            >
              <label class="font-medium text-xs text-primary-text"
                >Pivot Indicator</label
              >
              <ButtonSwitch name="pivotIndicator" v-model="localParams[0]" />
            </div>
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-background border border-primary-border"
            >
              <label class="font-medium text-xs text-primary-text"
                >Donchian Indicator</label
              >
              <ButtonSwitch name="pivotIndicator" v-model="localParams[1]" />
            </div>
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-background border border-primary-border"
            >
              <label class="font-medium text-xs text-primary-text"
                >Supertrend Indicator</label
              >
              <ButtonSwitch name="pivotIndicator" v-model="localParams[2]" />
            </div>
            <div>
              <label class="block mb-1 font-medium text-xs text-secondary-text"
                >Donchian Period</label
              >
              <input
                v-model="localParams[3]"
                type="number"
                class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div
            v-else-if="props.indicator.name === 'Supertrend'"
            class="grid grid-cols-2 gap-3"
          >
            <div>
              <label class="block mb-1 font-medium text-xs text-secondary-text"
                >ATR Period</label
              >
              <input
                v-model="localParams[0]"
                type="number"
                class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label class="block mb-1 font-medium text-xs text-secondary-text"
                >Multiplier</label
              >
              <input
                v-model="localParams[1]"
                type="number"
                class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div
            v-else-if="
              props.indicator.name === 'Pivot Points (Multi-type) 5-level'
            "
            class="flex w-full flex-col gap-3"
          >
            <div>
              <label class="block mb-1 font-medium text-xs text-secondary-text"
                >Pivot Points Type</label
              >
              <select
                v-model="localParams[0]"
                class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary cursor-pointer"
              >
                <option
                  value="traditional"
                  class="bg-card-background text-primary-text"
                >
                  Traditional
                </option>
                <option
                  value="classic"
                  class="bg-card-background text-primary-text"
                >
                  Classic
                </option>
                <option
                  value="woodie"
                  class="bg-card-background text-primary-text"
                >
                  Woodie
                </option>
                <option
                  value="fibonacci"
                  class="bg-card-background text-primary-text"
                >
                  Fibonacci
                </option>
              </select>
            </div>
          </div>

          <div v-else class="flex w-full flex-col gap-2.5">
            <div
              v-for="(param, i) in localParams"
              :key="i"
              class="flex items-center gap-3"
            >
              <label class="font-medium text-xs text-primary-text flex-1">
                {{ `${props.indicator.name} ${i + 1}` }}
              </label>
              <ButtonSwitch
                v-if="typeof localParams[i] === 'boolean'"
                name="paramSwitch"
                v-model="localParams[i]"
              />
              <input
                v-else
                v-model="localParams[i]"
                :type="typeof localParams[i] === 'number' ? 'number' : 'text'"
                class="p-2 border rounded-xl border-primary-border bg-background text-primary-text text-xs w-28 outline-none focus:border-primary"
              />

              <button
                class="p-1.5 text-primary-red hover:bg-primary-red/10 rounded-lg transition-colors"
                @click="removeParam(i)"
                v-if="localParams.length > 1"
              >
                <Trash class="w-4 h-4" />
              </button>
            </div>

            <!-- Add New Param -->
            <button
              class="mt-2 text-xs font-medium text-primary hover:underline w-fit flex items-center gap-1"
              @click="addParam"
            >
              <Plus class="w-3.5 h-3.5" /> Add Parameter
            </button>
          </div>
        </template>

        <template v-else>
          <div class="flex w-full flex-col gap-3">
            <div
              v-for="(style, index) in localStyles"
              :key="style.key || index"
              class="rounded-xl border border-primary-border bg-background/50 p-3.5 space-y-3"
            >
              <div
                class="flex items-center justify-between gap-2 border-b border-primary-border/60 pb-2"
              >
                <span class="font-semibold text-xs text-primary-text">{{
                  style.label
                }}</span>
                <span class="text-[10px] text-secondary-text font-mono">{{
                  style.key
                }}</span>
              </div>

              <div class="grid grid-cols-2 items-center gap-3">
                <label class="font-medium text-xs text-secondary-text"
                  >Line Color</label
                >
                <div class="flex items-center gap-2">
                  <input
                    v-model="style.color"
                    type="color"
                    class="h-8 w-10 rounded-lg border border-primary-border cursor-pointer bg-transparent"
                  />
                  <span class="text-xs font-mono text-primary-text uppercase">{{
                    style.color
                  }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 items-center gap-3">
                <label class="font-medium text-xs text-secondary-text"
                  >Line Thickness</label
                >
                <input
                  v-model.number="style.lineWidth"
                  type="number"
                  min="1"
                  max="8"
                  class="p-2 border rounded-xl border-primary-border bg-background text-primary-text text-xs w-full outline-none focus:border-primary"
                />
              </div>

              <div class="grid grid-cols-2 items-center gap-3">
                <label class="font-medium text-xs text-secondary-text"
                  >Line Style</label
                >
                <select
                  v-model="style.lineType"
                  class="w-full p-2.5 border rounded-xl border-primary-border bg-background text-primary-text text-xs outline-none focus:border-primary cursor-pointer"
                >
                  <option
                    value="solid"
                    class="bg-card-background text-primary-text"
                  >
                    Solid
                  </option>
                  <option
                    value="dashed"
                    class="bg-card-background text-primary-text"
                  >
                    Dashed
                  </option>
                  <option
                    value="dotted"
                    class="bg-card-background text-primary-text"
                  >
                    Dotted
                  </option>
                </select>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-end gap-2 pt-3 border-t border-primary-border shrink-0 mt-3"
      >
        <button
          type="button"
          @click="handleClose"
          class="px-4 py-2 rounded-xl border border-primary-border text-xs font-medium text-primary-text hover:bg-background transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="saveIndicator"
          class="px-5 py-2 rounded-xl bg-primary text-button-text text-xs font-semibold hover:bg-primary-hover transition-all shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import ButtonSwitch from "@/components/base/Toggle.vue";
import { Trash, SlidersHorizontal, X, Plus } from "lucide-vue-next";
import Modal from "@/components/base/Modal.vue";
import { getChart, isMainIndicator } from "@/utils/chart/chart";
import SelectInput from "@/components/base/SelectInput.vue";
import { useChartStore } from "@/stores/client/chart.js";

const chartStore = useChartStore();
const localParams = ref([]);
const selectedTab = ref("params");
const localStyles = ref([]);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
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

const indicator = computed(() => {
  const chart = getChart();
  if (!chart) return props.indicator;
  try {
    const list = props.indicator.id
      ? chart.getIndicators({ id: props.indicator.id })
      : chart.getIndicators({ name: props.indicator.name });
    return list?.[0] || props.indicator;
  } catch (e) {
    return props.indicator;
  }
});

const emit = defineEmits(["close"]);

const handleClose = () => {
  emit("close");
};

const getLineFigures = () => {
  const figures = indicator.value?.figures || [];
  return figures.filter((figure) => figure.type === "line");
};

const getLineStyles = () => {
  return indicator.value?.styles?.lines || [];
};

const normalizeLineType = (style) => {
  if (!style) return "solid";
  if (
    style.style === "dashed" &&
    Array.isArray(style.dashedValue) &&
    style.dashedValue.length === 2 &&
    style.dashedValue[0] === 2
  ) {
    return "dotted";
  }
  return style.style || "solid";
};

const initLocalStyles = () => {
  const figures = getLineFigures();
  const styles = getLineStyles();
  const count = Math.max(figures.length, styles.length, 1);

  localStyles.value = Array.from({ length: count }, (_, index) => {
    const lineStyle = styles[index] || {};
    const figure = figures[index];
    return {
      key: figure?.key || `line-${index + 1}`,
      label: figure?.title || `Line ${index + 1}`,
      color: lineStyle.color || "#2962FF",
      lineWidth: lineStyle.size || 2,
      lineType: normalizeLineType(lineStyle),
    };
  });
};

const buildOverrideStyles = () => {
  return localStyles.value.map((style) => ({
    style: style.lineType === "dotted" ? "dashed" : style.lineType,
    size: Number(style.lineWidth),
    color: style.color,
    dashedValue:
      style.lineType === "dotted"
        ? [2, 4]
        : style.lineType === "dashed"
          ? [6, 4]
          : [],
  }));
};

const overrideIndicatorStyles = () => {
  const chart = getChart();
  if (!chart) return;

  const payload = {
    name: props.indicator.name,
    styles: {
      lines: buildOverrideStyles(),
    },
  };
  if (props.indicator.id) {
    payload.id = props.indicator.id;
  }
  chart.overrideIndicator(payload);
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      const ind = indicator.value;
      if (ind?.calcParams && ind.calcParams.length) {
        localParams.value = [...ind.calcParams];
      } else if (props.indicator?.calcParams && props.indicator.calcParams.length) {
        localParams.value = [...props.indicator.calcParams];
      }
      initLocalStyles();
    }
  },
  { immediate: true },
);

const saveIndicator = () => {
  const chart = getChart();
  const overrideLines = buildOverrideStyles();

  if (chart) {
    const payload = {
      name: props.indicator.name,
      calcParams: localParams.value,
      styles: {
        lines: overrideLines,
      },
    };
    if (props.indicator.id) {
      payload.id = props.indicator.id;
    }
    chart.overrideIndicator(payload);
  }

  // Update in chart store selectedIndicators to persist
  const found = chartStore.selectedIndicators.find(
    (i) => (props.indicator.id && i.id === props.indicator.id) || i.name === props.indicator.name,
  );
  if (found) {
    found.calcParams = [...localParams.value];
    found.styles = {
      lines: overrideLines,
    };
  }

  handleClose();
};

const addParam = () => {
  localParams.value.push(1);
};

const removeParam = (index) => {
  if (localParams.value.length > 1) {
    localParams.value.splice(index, 1);
  }
};
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
