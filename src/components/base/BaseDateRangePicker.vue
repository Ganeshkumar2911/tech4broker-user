<!-- 
  BaseDateRangePicker Component
  Supports both single-date and range-date picking, presets, month/year navigation,
  optional time selection, custom display/value formats, and mobile sheet view.
-->

<template>
  <div class="relative inline-block min-w-0" ref="triggerRef">
    <!-- Trigger Button -->
    <button
      type="button"
      :disabled="disabled || readonly"
      :aria-expanded="isOpen"
      @click="toggle"
      :class="[
        'inline-flex items-center justify-between gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-primary-text transition-all duration-200 ease-in-out select-none outline-none w-full min-w-0',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer',
        sizeClass,
        variantClass,
        roundedClass,
      ]"
      :style="{
        width: width
          ? typeof width === 'number'
            ? `${width}px`
            : width
          : undefined,
      }"
    >
      <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 truncate">
        <Calendar :size="iconSize" class="text-primary-text shrink-0" />
        <span
          :class="[
            'truncate',
            isPlaceholder ? 'text-placeholder font-normal' : 'text-primary-text font-medium',
          ]"
        >
          {{ displayLabel }}
        </span>
      </div>

      <div class="flex items-center gap-1.5 shrink-0 ml-1">
        <X
          v-if="clearable && hasValue && !disabled && !readonly"
          :size="14"
          class="text-secondary-text hover:text-primary-red transition-colors p-0.5 cursor-pointer rounded"
          @click.stop="clear"
        />
        <ChevronDown
          :size="14"
          class="text-secondary-text transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
        />
      </div>
    </button>

    <!-- Floating Modal Dialog (Centered on Desktop, Top on Mobile) -->
    <Teleport to="body">
      <!-- Backdrop Overlay -->
      <Transition name="fade">
        <div
          v-if="isOpen"
          class="fixed inset-0 bg-black/30 backdrop-blur-[1.5px] z-[99998] transition-opacity"
          @click="cancel"
        />
      </Transition>

      <!-- Modal Container (Top on Mobile, Centered on Desktop) -->
      <Transition :name="isMobile ? 'slide-down' : 'fade'">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-[99999] flex flex-col items-center pointer-events-none"
          :class="[
            isMobile
              ? 'justify-start pt-3 px-3'
              : 'justify-center p-4',
          ]"
        >
          <div
            ref="dropdownRef"
            role="dialog"
            class="w-full max-w-[560px] flex flex-col pointer-events-auto text-left rounded-2xl sm:rounded-[20px] overflow-hidden bg-card-background border-0 shadow-none"
            @click.stop
          >
          <!-- Mobile Header Bar -->
          <div
            v-if="isMobile"
            class="flex items-center justify-between px-4 py-2.5 border-b border-primary-border bg-background/60"
          >
            <div class="flex items-center gap-2">
              <Calendar :size="15" class="text-primary-text" />
              <span class="text-xs font-bold text-primary-text">
                {{ isRangeMode ? "Select Date Range" : "Select Date" }}
              </span>
            </div>
            <button
              type="button"
              @click="close"
              class="w-6 h-6 flex items-center justify-center rounded-md bg-background text-secondary-text hover:text-primary-text cursor-pointer border border-primary-border"
            >
              <X :size="13" />
            </button>
          </div>

          <div
            class="flex flex-col md:flex-row overflow-y-auto custom-scrollbar max-h-[calc(88vh-100px)] md:max-h-none"
          >
            <!-- Presets (Horizontal scroll chips on mobile, vertical sidebar on desktop) -->
            <div
              v-if="effectiveShowPresets"
              class="w-full md:w-44 border-b md:border-b-0 md:border-r border-primary-border flex flex-col shrink-0 bg-background/40"
            >
              <!-- Mobile horizontal chips -->
              <div
                v-if="isMobile"
                class="flex overflow-x-auto p-2 gap-1.5 custom-scrollbar shrink-0"
              >
                <button
                  v-for="preset in activePresets"
                  :key="preset.label"
                  type="button"
                  @click="applyPreset(preset)"
                  :class="[
                    'shrink-0 whitespace-nowrap px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer border',
                    activePresetLabel === preset.label
                      ? 'bg-button text-button-text border-button font-semibold'
                      : 'bg-background text-secondary-text border-primary-border hover:text-primary-text',
                  ]"
                >
                  <span>{{ preset.label }}</span>
                  <Check
                    v-if="activePresetLabel === preset.label"
                    :size="11"
                    class="text-button-text shrink-0"
                  />
                </button>
              </div>

              <!-- Desktop vertical list -->
              <div
                v-else
                class="p-2 space-y-0.5 max-h-72 md:max-h-80 overflow-y-auto custom-scrollbar"
              >
                <button
                  v-for="preset in activePresets"
                  :key="preset.label"
                  type="button"
                  @click="applyPreset(preset)"
                  :class="[
                    'w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between cursor-pointer',
                    activePresetLabel === preset.label
                      ? 'bg-button text-button-text font-semibold'
                      : 'text-primary-text hover:bg-background hover:text-primary-text',
                  ]"
                >
                  <span>{{ preset.label }}</span>
                  <Check
                    v-if="activePresetLabel === preset.label"
                    :size="13"
                    class="text-button-text shrink-0 ml-1"
                  />
                </button>
              </div>
            </div>

            <!-- Calendar Container -->
            <div
              class="p-3 md:p-4 flex flex-col gap-2.5 md:gap-3 min-w-0 md:min-w-[320px] flex-1"
            >
              <!-- Calendar Header -->
              <div class="flex items-center justify-between px-1">
                <button
                  type="button"
                  :disabled="isPrevDisabled"
                  @click="prevMonth"
                  :class="[
                    'w-7 h-7 flex items-center justify-center rounded-md transition-colors',
                    isPrevDisabled
                      ? 'opacity-30 cursor-not-allowed text-secondary-text'
                      : 'hover:bg-background text-secondary-text hover:text-primary-text cursor-pointer',
                  ]"
                >
                  <ChevronLeft :size="16" />
                </button>

                <button
                  type="button"
                  @click="togglePickerView"
                  class="text-xs sm:text-sm font-semibold text-primary-text hover:text-secondary-text transition-colors px-2 py-1 rounded-md hover:bg-background cursor-pointer flex items-center gap-1"
                >
                  <span>{{ viewTitle }}</span>
                  <ChevronDown :size="14" class="text-secondary-text" />
                </button>

                <button
                  type="button"
                  :disabled="isNextDisabled"
                  @click="nextMonth"
                  :class="[
                    'w-7 h-7 flex items-center justify-center rounded-md transition-colors',
                    isNextDisabled
                      ? 'opacity-30 cursor-not-allowed text-secondary-text'
                      : 'hover:bg-background text-secondary-text hover:text-primary-text cursor-pointer',
                  ]"
                >
                  <ChevronRight :size="16" />
                </button>
              </div>

              <!-- View: Days Grid -->
              <div
                v-if="pickerView === 'days'"
                class="space-y-1.5 sm:space-y-2"
              >
                <!-- Weekday Headers -->
                <div class="grid grid-cols-7 gap-1 text-center">
                  <span
                    v-for="day in weekDays"
                    :key="day"
                    class="text-[10px] sm:text-[11px] font-semibold text-secondary-text uppercase py-1"
                  >
                    {{ day }}
                  </span>
                </div>

                <!-- Days Grid -->
                <div
                  class="grid grid-cols-7 gap-y-1 gap-x-0 text-center justify-items-center"
                >
                  <div
                    v-for="(cell, index) in calendarCells"
                    :key="index"
                    class="relative py-0.5 w-full flex items-center justify-center"
                    @mouseenter="onCellMouseEnter(cell.date)"
                    @mouseleave="onCellMouseLeave"
                  >
                    <!-- Continuous Range Background Strip (Zero Gaps) -->
                    <div
                      v-if="shouldShowRangeBackground(cell)"
                      class="absolute inset-y-0.5 transition-colors pointer-events-none"
                      :class="getRangeBackgroundClass(cell, index)"
                    />

                    <button
                      type="button"
                      :disabled="cell.isDisabled"
                      @click="selectDate(cell.date)"
                      :class="getDayCellClass(cell)"
                    >
                      <span class="relative z-10">{{ cell.dayNumber }}</span>
                      <span
                        v-if="
                          cell.isToday &&
                          !cell.isSelectedStart &&
                          !cell.isSelectedEnd
                        "
                        class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full z-10"
                        :class="cell.isInRange ? 'bg-primary-text' : 'bg-button'"
                      ></span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- View: Months Grid -->
              <div
                v-else-if="pickerView === 'months'"
                class="grid grid-cols-3 gap-2 py-2"
              >
                <button
                  v-for="(mName, mIdx) in monthNames"
                  :key="mName"
                  type="button"
                  :disabled="isMonthDisabled(mIdx)"
                  @click="selectMonth(mIdx)"
                  :class="[
                    'py-2 px-2 text-xs font-medium rounded-lg transition-colors text-center',
                    isMonthDisabled(mIdx)
                      ? 'opacity-30 cursor-not-allowed text-secondary-text'
                      : viewMonth === mIdx
                        ? 'bg-button text-button-text font-semibold shadow-xs cursor-pointer'
                        : 'text-primary-text hover:bg-background cursor-pointer',
                  ]"
                >
                  {{ mName }}
                </button>
              </div>

              <!-- View: Years Grid -->
              <div
                v-else-if="pickerView === 'years'"
                class="grid grid-cols-3 gap-2 max-h-52 sm:max-h-56 overflow-y-auto custom-scrollbar p-1"
              >
                <button
                  v-for="yr in yearRange"
                  :key="yr"
                  type="button"
                  :disabled="isYearDisabled(yr)"
                  @click="selectYear(yr)"
                  :class="[
                    'py-2 px-2 text-xs font-medium rounded-lg transition-colors text-center',
                    isYearDisabled(yr)
                      ? 'opacity-30 cursor-not-allowed text-secondary-text'
                      : viewYear === yr
                        ? 'bg-button text-button-text font-semibold shadow-xs cursor-pointer'
                        : 'text-primary-text hover:bg-background cursor-pointer',
                  ]"
                >
                  {{ yr }}
                </button>
              </div>

              <!-- Time Picker Section -->
              <div
                v-if="isTimeEnabled && pickerView === 'days'"
                class="pt-2 sm:pt-3 border-t border-primary-border flex flex-col gap-2"
              >
                <div
                  class="flex items-center justify-between text-xs text-secondary-text"
                >
                  <span class="flex items-center gap-1.5 font-medium">
                    <Clock :size="13" />
                    <span>{{ isRangeMode ? "Time Range" : "Time" }}</span>
                  </span>
                </div>

                <!-- Single or Start Time -->
                <div class="flex items-center gap-2 text-xs">
                  <span
                    v-if="isRangeMode"
                    class="text-secondary-text text-[11px] w-9"
                    >Start:</span
                  >
                  <input
                    type="number"
                    min="0"
                    max="23"
                    v-model.number="startTime.hours"
                    class="w-11 px-1.5 py-1 rounded bg-background border border-primary-border text-center text-primary-text focus:border-button outline-none"
                  />
                  <span class="font-bold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    v-model.number="startTime.minutes"
                    class="w-11 px-1.5 py-1 rounded bg-background border border-primary-border text-center text-primary-text focus:border-button outline-none"
                  />
                </div>

                <!-- End Time (for Range Mode) -->
                <div v-if="isRangeMode" class="flex items-center gap-2 text-xs">
                  <span class="text-secondary-text text-[11px] w-9">End:</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    v-model.number="endTime.hours"
                    class="w-11 px-1.5 py-1 rounded bg-background border border-primary-border text-center text-primary-text focus:border-button outline-none"
                  />
                  <span class="font-bold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    v-model.number="endTime.minutes"
                    class="w-11 px-1.5 py-1 rounded bg-background border border-primary-border text-center text-primary-text focus:border-button outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Bar -->
          <div
            v-if="showFooter"
            class="px-3 sm:px-4 py-2.5 bg-background/80 border-t border-primary-border flex items-center justify-between text-xs"
          >
            <span
              class="text-primary-text truncate mr-2 font-medium text-[11px] sm:text-xs"
            >
              {{ draftSummaryText }}
            </span>

              <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  @click="cancel"
                  class="px-2.5 sm:px-3 py-1.5 rounded-full border border-primary-border/40 text-primary-text hover:bg-background transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  @click="apply"
                  :disabled="!isDraftValid"
                  class="px-3 sm:px-3.5 py-1.5 rounded-full bg-button text-button-text font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-none text-xs"
                >
                  Apply
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
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Clock,
  Check,
} from "lucide-vue-next";
// import moment from "moment";
import moment from "moment";

// ─── Props ──────────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: {
    type: [Date, String, Number, Array, Object, null],
    default: () => [null, null],
  },
  // Mode: 'single' | 'range'
  mode: {
    type: String,
    default: "range",
    validator: (v) => ["single", "range"].includes(v),
  },
  range: {
    type: Boolean,
    default: true,
  },
  // Enable Time Picker
  enableTime: {
    type: Boolean,
    default: false,
  },
  showTime: {
    type: Boolean,
    default: false,
  },
  timeFormat: {
    type: String,
    default: "24h", // '12h' | '24h'
  },
  // Presets
  showPresets: {
    type: Boolean,
    default: null, // null = auto (true for range, false for single)
  },
  presets: {
    type: Array,
    default: null,
  },
  // Value Format ('YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', 'ISO', 'Date', 'timestamp')
  valueFormat: {
    type: String,
    default: null,
  },
  displayFormat: {
    type: String,
    default: null,
  },
  placeholder: {
    type: String,
    default: null,
  },
  label: {
    type: String,
    default: "",
  },
  prependIcon: {
    type: String,
    default: "calendar_month",
  },
  appendIcon: {
    type: String,
    default: "keyboard_arrow_down",
  },
  // Size: 'sm' | 'md' | 'lg'
  size: {
    type: String,
    default: "md",
  },
  height: {
    type: String,
    default: "",
  },
  borderless: {
    type: Boolean,
    default: false,
  },
  buttonClass: {
    type: [String, Array, Object],
    default: "",
  },
  // Variant: 'outlined' | 'filled' | 'text' | 'surface' | 'borderless' | 'default'
  variant: {
    type: String,
    default: "outlined",
  },
  bgClass: {
    type: String,
    default: "",
  },
  rounded: {
    type: String,
    default: "full",
  },
  width: {
    type: [String, Number],
    default: null,
  },
  menuWidth: {
    type: [String, Number],
    default: 560,
  },
  // Restrictions
  minDate: {
    type: [Date, String, Number],
    default: null,
  },
  maxDate: {
    type: [Date, String, Number],
    default: null,
  },
  disabledDates: {
    type: [Function, Array],
    default: null,
  },
  disableFuture: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  placement: {
    type: String,
    default: "bottom-end", // 'bottom' | 'top' | 'left' | 'right' | 'bottom-end' | 'bottom-start'
  },
  autoApply: {
    type: Boolean,
    default: false,
  },
  showFooter: {
    type: Boolean,
    default: true,
  },
  closeOnApply: {
    type: Boolean,
    default: true,
  },
  persistent: {
    type: Boolean,
    default: false,
  },
});

// ─── Emits ──────────────────────────────────────────────────────────────────
const emit = defineEmits([
  "update:modelValue",
  "apply",
  "change",
  "clear",
  "open",
  "close",
]);

// ─── Computed Mode & Presets ────────────────────────────────────────────────
const isRangeMode = computed(() => {
  if (props.mode === "single") return false;
  if (props.range === false && props.mode !== "range") return false;
  return true;
});

const isTimeEnabled = computed(() => props.enableTime || props.showTime);

const effectiveShowPresets = computed(() => {
  if (props.showPresets !== null && props.showPresets !== undefined) {
    return props.showPresets;
  }
  return isRangeMode.value;
});

const defaultPresets = [
  {
    label: "Today",
    getValue: () => [moment().startOf("day"), moment().endOf("day")],
  },
  {
    label: "Yesterday",
    getValue: () => [
      moment().subtract(1, "day").startOf("day"),
      moment().subtract(1, "day").endOf("day"),
    ],
  },
  {
    label: "Last 7 Days",
    getValue: () => [
      moment().subtract(6, "days").startOf("day"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Last 14 Days",
    getValue: () => [
      moment().subtract(13, "days").startOf("day"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Last 30 Days",
    getValue: () => [
      moment().subtract(29, "days").startOf("day"),
      moment().endOf("day"),
    ],
  },
  {
    label: "Last 90 Days",
    getValue: () => [
      moment().subtract(89, "days").startOf("day"),
      moment().endOf("day"),
    ],
  },
  {
    label: "This Month",
    getValue: () => [moment().startOf("month"), moment().endOf("day")],
  },
  {
    label: "Last Month",
    getValue: () => [
      moment().subtract(1, "month").startOf("month"),
      moment().subtract(1, "month").endOf("month"),
    ],
  },
  {
    label: "Quarter to Date",
    getValue: () => [moment().startOf("quarter"), moment().endOf("day")],
  },
  {
    label: "Year to Date",
    getValue: () => [moment().startOf("year"), moment().endOf("day")],
  },
];

const activePresets = computed(() => {
  return props.presets || defaultPresets;
});

// ─── Reactive State ─────────────────────────────────────────────────────────
const isOpen = ref(false);
const triggerRef = ref(null);
const dropdownRef = ref(null);
const dropdownStyle = ref({});

const viewYear = ref(moment().year());
const viewMonth = ref(moment().month()); // 0-11
const pickerView = ref("days"); // 'days' | 'months' | 'years'

// Draft Selection State
const tempStart = ref(null); // moment object or null
const tempEnd = ref(null); // moment object or null
const hoverDate = ref(null); // moment object or null
const activePresetLabel = ref(null);

// Time State
const startTime = ref({ hours: 0, minutes: 0 });
const endTime = ref({ hours: 23, minutes: 59 });

// ─── Weekdays & Months Data ─────────────────────────────────────────────────
const weekDays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const viewTitle = computed(() => {
  if (pickerView.value === "years")
    return `${viewYear.value - 6} - ${viewYear.value + 5}`;
  if (pickerView.value === "months") return `${viewYear.value}`;
  return `${monthNames[viewMonth.value]} ${viewYear.value}`;
});

const yearRange = computed(() => {
  const current = viewYear.value;
  const years = [];
  for (let i = current - 12; i <= current + 12; i++) {
    years.push(i);
  }
  return years;
});

// ─── Size & Variant Styling ─────────────────────────────────────────────────
const sizeClass = computed(() => {
  if (props.buttonClass) {
    return props.buttonClass;
  }
  switch (props.size) {
    case "sm":
      return "h-8 px-3 text-xs";
    case "lg":
      return "h-11 px-5 text-base";
    case "md":
    default:
      return "h-10 px-3.5 sm:px-4 text-xs sm:text-sm";
  }
});

const iconSize = computed(() => {
  switch (props.size) {
    case "sm":
      return 14;
    case "lg":
      return 18;
    default:
      return 15;
  }
});

const variantClass = computed(() => {
  if (props.bgClass) {
    return props.bgClass;
  }
  if (props.borderless || props.variant === "borderless") {
    return "bg-card-background border-0";
  }
  switch (props.variant) {
    case "filled":
      return "bg-background border-0";
    case "surface":
      return "bg-background border border-primary-border";
    case "text":
      return "border-0 bg-transparent";
    default:
      return "bg-card-background";
  }
});

const roundedClass = computed(() => {
  if (!props.rounded) return "rounded-lg";
  if (props.rounded === "full") return "rounded-full";
  if (props.rounded === "2xl") return "rounded-2xl";
  if (props.rounded === "xl") return "rounded-xl";
  if (props.rounded === "lg") return "rounded-lg";
  if (props.rounded === "md") return "rounded-md";
  return `rounded-[${props.rounded}px]`;
});

// ─── Parsing & Formatting Helpers ───────────────────────────────────────────
function parseDate(val) {
  if (!val) return null;
  if (moment.isMoment(val)) return val.isValid() ? val.clone() : null;
  if (val instanceof Date) return moment(val);
  if (typeof val === "string" || typeof val === "number") {
    const m = moment(val);
    return m.isValid() ? m : null;
  }
  return null;
}

function parseModelValue(val) {
  if (!val) return { start: null, end: null };

  if (isRangeMode.value) {
    if (Array.isArray(val)) {
      return {
        start: parseDate(val[0]),
        end: parseDate(val[1]),
      };
    }
    if (typeof val === "object") {
      const s = val.start || val.from || val.startDate;
      const e = val.end || val.to || val.endDate;
      return {
        start: parseDate(s),
        end: parseDate(e),
      };
    }
  }

  const single = parseDate(val);
  return { start: single, end: single };
}

function formatSingleOutput(m) {
  if (!m) return null;
  if (props.valueFormat === "Date") return m.toDate();
  if (props.valueFormat === "ISO") return m.toISOString();
  if (props.valueFormat === "timestamp") return m.valueOf();
  if (props.valueFormat) {
    const fmt = isTimeEnabled.value
      ? props.valueFormat === "YYYY-MM-DD"
        ? "YYYY-MM-DD HH:mm:ss"
        : props.valueFormat
      : props.valueFormat;
    return m.format(fmt);
  }

  // If no explicit valueFormat was given:
  // If modelValue was Date objects, return Date. Otherwise formatted date string.
  if (
    props.modelValue instanceof Date ||
    (Array.isArray(props.modelValue) && props.modelValue[0] instanceof Date)
  ) {
    return m.toDate();
  }
  const defaultFmt = isTimeEnabled.value ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD";
  return m.format(defaultFmt);
}

function formatOutput(s, e) {
  if (!isRangeMode.value) {
    return formatSingleOutput(s);
  }

  const formattedStart = formatSingleOutput(s);
  const formattedEnd = formatSingleOutput(e);

  if (
    Array.isArray(props.modelValue) ||
    typeof props.modelValue !== "object" ||
    props.modelValue === null
  ) {
    return [formattedStart, formattedEnd];
  }
  return {
    start: formattedStart,
    end: formattedEnd,
  };
}

// ─── Label Computations ─────────────────────────────────────────────────────
const hasValue = computed(() => {
  const { start } = parseModelValue(props.modelValue);
  return Boolean(start);
});

const isPlaceholder = computed(() => !hasValue.value);

const defaultDisplayFmt = computed(() => {
  if (props.displayFormat) return props.displayFormat;
  return isTimeEnabled.value ? "MMM D, YYYY HH:mm" : "MMM D, YYYY";
});

const displayLabel = computed(() => {
  const { start, end } = parseModelValue(props.modelValue);
  if (!start) {
    if (props.label) return props.label;
    if (props.placeholder) return props.placeholder;
    return isRangeMode.value ? "Select date range" : "Select date";
  }

  const fmt = defaultDisplayFmt.value;
  if (!isRangeMode.value || !end) {
    return start.format(fmt);
  }

  if (start.isSame(end, "day") && !isTimeEnabled.value) {
    return start.format(fmt);
  }

  return `${start.format(fmt)} - ${end.format(fmt)}`;
});

const draftSummaryText = computed(() => {
  if (!tempStart.value) return "No date selected";
  const fmt = defaultDisplayFmt.value;
  if (!isRangeMode.value) {
    return tempStart.value.format(fmt);
  }
  if (!tempEnd.value) {
    return `${tempStart.value.format(fmt)} - Select end date`;
  }
  return `${tempStart.value.format(fmt)} - ${tempEnd.value.format(fmt)}`;
});

const isDraftValid = computed(() => {
  if (!tempStart.value) return false;
  if (isDateDisabled(tempStart.value)) return false;
  if (isRangeMode.value) {
    if (!tempEnd.value) return false;
    if (isDateDisabled(tempEnd.value)) return false;
  }
  return true;
});

const isPrevDisabled = computed(() => {
  if (props.minDate) {
    const minM = parseDate(props.minDate);
    if (!minM) return false;
    if (pickerView.value === "days") {
      const currentViewMonth = moment([viewYear.value, viewMonth.value, 1]);
      return currentViewMonth.isSameOrBefore(minM, "month");
    }
    if (pickerView.value === "months") {
      return viewYear.value <= minM.year();
    }
    if (pickerView.value === "years") {
      return viewYear.value - 6 <= minM.year();
    }
  }
  return false;
});

const isNextDisabled = computed(() => {
  if (pickerView.value === "days") {
    const currentViewMonth = moment([viewYear.value, viewMonth.value, 1]);
    if (props.disableFuture && currentViewMonth.isSameOrAfter(moment(), "month")) {
      return true;
    }
    if (props.maxDate) {
      const maxM = parseDate(props.maxDate);
      if (maxM && currentViewMonth.isSameOrAfter(maxM, "month")) return true;
    }
  }
  if (pickerView.value === "months") {
    if (props.disableFuture && viewYear.value >= moment().year()) {
      return true;
    }
    if (props.maxDate) {
      const maxM = parseDate(props.maxDate);
      if (maxM && viewYear.value >= maxM.year()) return true;
    }
  }
  if (pickerView.value === "years") {
    if (props.disableFuture && viewYear.value + 5 >= moment().year()) {
      return true;
    }
    if (props.maxDate) {
      const maxM = parseDate(props.maxDate);
      if (maxM && viewYear.value + 5 >= maxM.year()) return true;
    }
  }
  return false;
});

function isMonthDisabled(mIdx) {
  if (props.disableFuture) {
    const targetMonth = moment([viewYear.value, mIdx, 1]).startOf("month");
    if (targetMonth.isAfter(moment(), "month")) return true;
  }
  if (props.minDate) {
    const minM = parseDate(props.minDate);
    if (minM && moment([viewYear.value, mIdx, 1]).endOf("month").isBefore(minM, "day")) return true;
  }
  if (props.maxDate) {
    const maxM = parseDate(props.maxDate);
    if (maxM && moment([viewYear.value, mIdx, 1]).startOf("month").isAfter(maxM, "day")) return true;
  }
  return false;
}

function isYearDisabled(yr) {
  if (props.disableFuture) {
    if (yr > moment().year()) return true;
  }
  if (props.minDate) {
    const minM = parseDate(props.minDate);
    if (minM && yr < minM.year()) return true;
  }
  if (props.maxDate) {
    const maxM = parseDate(props.maxDate);
    if (maxM && yr > maxM.year()) return true;
  }
  return false;
}

// ─── Calendar Cells Calculation ─────────────────────────────────────────────
const calendarCells = computed(() => {
  const cells = [];
  const startOfMonth = moment([viewYear.value, viewMonth.value, 1]);
  const daysInMonth = startOfMonth.daysInMonth();
  const firstDayOfWeek = startOfMonth.day(); // 0 = Sun

  const prevMonth = startOfMonth.clone().subtract(1, "month");
  const daysInPrevMonth = prevMonth.daysInMonth();

  // Prev Month Days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonth.clone().date(daysInPrevMonth - i);
    cells.push(createCellObject(d, false));
  }

  // Current Month Days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = startOfMonth.clone().date(i);
    cells.push(createCellObject(d, true));
  }

  // Next Month Days
  const totalSlots = cells.length > 35 ? 42 : 35;
  const remaining = totalSlots - cells.length;
  const nextMonth = startOfMonth.clone().add(1, "month");
  for (let i = 1; i <= remaining; i++) {
    const d = nextMonth.clone().date(i);
    cells.push(createCellObject(d, false));
  }

  return cells;
});

function isDateDisabled(mDate) {
  if (!mDate) return false;
  if (props.disableFuture && mDate.isAfter(moment(), "day")) {
    return true;
  }
  if (props.minDate) {
    const minM = parseDate(props.minDate);
    if (minM && mDate.isBefore(minM, "day")) return true;
  }
  if (props.maxDate) {
    const maxM = parseDate(props.maxDate);
    if (maxM && mDate.isAfter(maxM, "day")) return true;
  }
  if (typeof props.disabledDates === "function") {
    if (props.disabledDates(mDate.toDate())) return true;
  }
  if (Array.isArray(props.disabledDates)) {
    return props.disabledDates.some((d) => mDate.isSame(parseDate(d), "day"));
  }
  return false;
}

function createCellObject(mDate, isCurrentMonth) {
  const isToday = mDate.isSame(moment(), "day");
  const isDisabled = isDateDisabled(mDate);

  const isSelStart = tempStart.value
    ? mDate.isSame(tempStart.value, "day")
    : false;
  const isSelEnd = tempEnd.value ? mDate.isSame(tempEnd.value, "day") : false;

  let isInRange = false;
  if (isRangeMode.value && tempStart.value && tempEnd.value) {
    isInRange = mDate.isBetween(tempStart.value, tempEnd.value, "day", "()");
  }

  let isInHoverRange = false;
  if (
    isRangeMode.value &&
    tempStart.value &&
    !tempEnd.value &&
    hoverDate.value
  ) {
    if (hoverDate.value.isAfter(tempStart.value, "day")) {
      isInHoverRange = mDate.isBetween(
        tempStart.value,
        hoverDate.value,
        "day",
        "()",
      );
    }
  }

  return {
    date: mDate,
    dayNumber: mDate.date(),
    isCurrentMonth,
    isToday,
    isDisabled,
    isSelectedStart: isSelStart,
    isSelectedEnd: isSelEnd,
    isInRange,
    isInHoverRange,
  };
}

// ─── Cell Styling & Continuous Range Handlers ────────────────────────────────
function shouldShowRangeBackground(cell) {
  if (!isRangeMode.value || cell.isDisabled) return false;

  if (cell.isInRange || cell.isInHoverRange) return true;

  const hasRangeEnd = Boolean(
    tempEnd.value || (hoverDate.value && hoverDate.value.isAfter(tempStart.value, "day")),
  );

  if (cell.isSelectedStart && hasRangeEnd && !cell.isSelectedEnd) {
    return true;
  }

  if (cell.isSelectedEnd && tempStart.value && !cell.isSelectedStart) {
    return true;
  }

  return false;
}

function getRangeBackgroundClass(cell, index) {
  const isHover = cell.isInHoverRange;
  const bg = isHover
    ? "bg-button/10 border-t border-b border-dashed border-button/30"
    : "bg-button/15";

  const isRowStart = index % 7 === 0;
  const isRowEnd = index % 7 === 6;

  // Selected Start (not End) -> extends from center (50%) to right (100%)
  if (cell.isSelectedStart && !cell.isSelectedEnd) {
    return `${bg} left-1/2 right-0 ${isRowEnd ? "rounded-r-full" : ""}`;
  }

  // Selected End (not Start) -> extends from left (0) to center (50%)
  if (cell.isSelectedEnd && !cell.isSelectedStart) {
    return `${bg} left-0 right-1/2 ${isRowStart ? "rounded-l-full" : ""}`;
  }

  // Fully In Range or Hover Range -> spans 100% width across the cell
  let classes = `${bg} inset-x-0`;
  if (isRowStart) {
    classes += " rounded-l-full";
  }
  if (isRowEnd) {
    classes += " rounded-r-full";
  }

  return classes;
}

function getDayCellClass(cell) {
  const base =
    "w-8 h-8 flex items-center justify-center text-xs transition-all duration-150 relative select-none cursor-pointer";

  if (cell.isDisabled) {
    return `${base} opacity-30 cursor-not-allowed text-secondary-text rounded-full`;
  }

  // Selected Start and/or End
  if (cell.isSelectedStart || cell.isSelectedEnd) {
    return `${base} rounded-full bg-button text-button-text font-bold shadow-md z-10`;
  }

  // In Range / In Hover Range
  if (cell.isInRange) {
    return `${base} text-primary-text font-semibold hover:bg-button/20 rounded-full`;
  }
  if (cell.isInHoverRange) {
    return `${base} text-primary-text font-medium hover:bg-button/15 rounded-full`;
  }

  // Current Month vs Out Month
  if (!cell.isCurrentMonth) {
    return `${base} text-secondary-text/30 hover:text-secondary-text hover:bg-background rounded-full`;
  }

  return `${base} text-primary-text hover:bg-background hover:rounded-full font-medium`;
}

// ─── Positioning & Mobile Logic ─────────────────────────────────────────────
const isMobile = ref(
  typeof window !== "undefined" ? window.innerWidth < 768 : false,
);

function checkMobile() {
  if (typeof window !== "undefined") {
    isMobile.value = window.innerWidth < 768;
  }
}

// ─── Watchers ────────────────────────────────────────────────────────────────
watch(isOpen, (val) => {
  if (typeof document !== "undefined") {
    if (val) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
});

// ─── Methods ────────────────────────────────────────────────────────────────
function initFromModel() {
  const { start, end } = parseModelValue(props.modelValue);
  tempStart.value = start;
  tempEnd.value = end;

  if (start) {
    viewYear.value = start.year();
    viewMonth.value = start.month();
    startTime.value = { hours: start.hours(), minutes: start.minutes() };
  } else {
    viewYear.value = moment().year();
    viewMonth.value = moment().month();
  }

  if (end) {
    endTime.value = { hours: end.hours(), minutes: end.minutes() };
  }
  activePresetLabel.value = null;
}

function toggle() {
  if (props.disabled || props.readonly) return;
  checkMobile();
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    initFromModel();
    pickerView.value = "days";
    emit("open");
  } else {
    emit("close");
  }
}

function close() {
  isOpen.value = false;
  hoverDate.value = null;
  emit("close");
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
}

function clear() {
  tempStart.value = null;
  tempEnd.value = null;
  activePresetLabel.value = null;
  const emptyVal = isRangeMode.value ? [null, null] : null;
  emit("update:modelValue", emptyVal);
  emit("apply", emptyVal);
  emit("change", emptyVal);
  emit("clear");
}

function selectDate(mDate) {
  if (isDateDisabled(mDate)) return;
  activePresetLabel.value = null;

  if (!isRangeMode.value) {
    tempStart.value = mDate.clone();
    tempEnd.value = mDate.clone();
    if (props.autoApply && !isTimeEnabled.value) {
      apply();
    }
    return;
  }

  // Range Mode
  if (!tempStart.value || (tempStart.value && tempEnd.value)) {
    tempStart.value = mDate.clone();
    tempEnd.value = null;
  } else if (tempStart.value && !tempEnd.value) {
    if (mDate.isBefore(tempStart.value, "day")) {
      tempStart.value = mDate.clone();
      tempEnd.value = null;
    } else {
      tempEnd.value = mDate.clone();
      if (props.autoApply && !isTimeEnabled.value) {
        apply();
      }
    }
  }
}

function onCellMouseEnter(mDate) {
  if (isDateDisabled(mDate)) return;
  if (isRangeMode.value && tempStart.value && !tempEnd.value) {
    hoverDate.value = mDate;
  }
}

function onCellMouseLeave() {
  hoverDate.value = null;
}

function applyPreset(preset) {
  activePresetLabel.value = preset.label;
  let s, e;
  if (typeof preset.getValue === "function") {
    [s, e] = preset.getValue();
  } else if (typeof preset.range === "function") {
    [s, e] = preset.range();
  }

  let startM = s ? parseDate(s) : null;
  let endM = e ? parseDate(e) : null;

  if (props.disableFuture) {
    const todayEnd = moment().endOf("day");
    if (startM && startM.isAfter(todayEnd)) startM = moment().startOf("day");
    if (endM && endM.isAfter(todayEnd)) endM = todayEnd;
  }

  tempStart.value = startM;
  tempEnd.value = endM;

  if (tempStart.value) {
    viewYear.value = tempStart.value.year();
    viewMonth.value = tempStart.value.month();
  }

  if (
    props.autoApply ||
    (typeof window !== "undefined" && window.innerWidth < 768)
  ) {
    apply();
  }
}

function prevMonth() {
  if (isPrevDisabled.value) return;
  if (pickerView.value === "years") {
    viewYear.value -= 12;
    return;
  }
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value--;
  } else {
    viewMonth.value--;
  }
}

function nextMonth() {
  if (isNextDisabled.value) return;
  if (pickerView.value === "years") {
    viewYear.value += 12;
    return;
  }
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value++;
  } else {
    viewMonth.value++;
  }
}

function togglePickerView() {
  if (pickerView.value === "days") pickerView.value = "months";
  else if (pickerView.value === "months") pickerView.value = "years";
  else pickerView.value = "days";
}

function selectMonth(idx) {
  if (isMonthDisabled(idx)) return;
  viewMonth.value = idx;
  pickerView.value = "days";
}

function selectYear(yr) {
  if (isYearDisabled(yr)) return;
  viewYear.value = yr;
  pickerView.value = "months";
}

function cancel() {
  initFromModel();
  close();
}

function apply() {
  if (!tempStart.value) return;

  let finalStart = tempStart.value.clone();
  let finalEnd = tempEnd.value ? tempEnd.value.clone() : finalStart.clone();

  if (isTimeEnabled.value) {
    finalStart.hours(startTime.value.hours).minutes(startTime.value.minutes);
    finalEnd.hours(endTime.value.hours).minutes(endTime.value.minutes);
  }

  const formatted = formatOutput(finalStart, finalEnd);
  emit("update:modelValue", formatted);
  emit("apply", formatted);
  emit("change", formatted);

  if (props.closeOnApply) {
    close();
  }
}

function handleEscape(e) {
  if (e.key === "Escape" && isOpen.value) {
    cancel();
  }
}

function handleResize() {
  checkMobile();
}

onMounted(() => {
  checkMobile();
  document.addEventListener("keydown", handleEscape);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
  document.removeEventListener("keydown", handleEscape);
  window.removeEventListener("resize", handleResize);
});

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) {
      initFromModel();
    }
  },
  { deep: true },
);
</script>

<style scoped>
/* Fade Backdrop & Modal Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Top Slide Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-12px);
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  border-radius: 99px;
  background-color: var(--color-primary-border, rgba(0, 0, 0, 0.15));
}
</style>
