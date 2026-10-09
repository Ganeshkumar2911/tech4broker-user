<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { ChevronDown, Search, Loader2, X, Check } from "lucide-vue-next";

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: {
    type: [String, Number, Object, null],
    default: null,
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "Select...",
  },
  searchPlaceholder: {
    type: String,
    default: "Search the platform",
  },
  searchable: {
    type: Boolean,
    default: true,
  },
  allowAll: {
    type: Boolean,
    default: false,
  },
  allLabel: {
    type: String,
    default: "All",
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  rounded: {
    type: String,
    default: "xl", // lg | xl | 2xl | full | left | right | none
  },
  class: {
    type: String,
    default: "",
  },
  borderless: {
    type: Boolean,
    default: false,
  },
  height: {
    type: String,
    default: "40px",
  },
  buttonClass: {
    type: [String, Array, Object],
    default: "",
  },
  width: {
    type: String,
    default: "100%",
  },
  variant: {
    type: String,
    default: "default", // 'default' | 'surface' | 'glass' | 'auth'
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  dropUp: {
    type: Boolean,
    default: false,
  },
  showFlags: {
    type: Boolean,
    default: false,
  },
});

// ─── Emits ────────────────────────────────────────────────────────────────────
const emit = defineEmits(["update:modelValue", "search", "change", "open", "close"]);

// ─── State ────────────────────────────────────────────────────────────────────
const isOpen = ref(false);
const searchQuery = ref("");
const triggerRef = ref(null);
const dropdownRef = ref(null);
const searchRef = ref(null);
const highlightedIndex = ref(-1);
const isMobile = ref(
  typeof window !== "undefined" ? window.innerWidth < 768 : false,
);

// ─── Options Normalization ──────────────────────────────────────────────────
const normalizedOptions = computed(() => {
  return (props.options || []).map((opt) => {
    if (opt !== null && typeof opt === "object") {
      const acc = opt.raw?.account || opt.raw || opt;
      const hasExplicitAccount = !!(
        (acc.account_number && String(acc.account_number).trim()) ||
        (acc.login && String(acc.login).trim()) ||
        (acc.platform && (acc.login || acc.account_number))
      );

      const accNumber = acc.account_number || acc.login || "";

      return {
        label:
          opt.label !== undefined
            ? opt.label
            : opt.name !== undefined
              ? opt.name
              : String(accNumber || opt.value || ""),
        value: opt.value !== undefined ? opt.value : acc.id,
        disabled: !!opt.disabled,
        isAccount: hasExplicitAccount,
        account_number: accNumber || opt.label || "",
        platform: acc.platform ? String(acc.platform).toUpperCase() : "",
        balance: acc.balance ?? acc.equity,
        equity: acc.equity,
        broker_currency: acc.broker_currency || acc.currency || "",
        broker_group: acc.broker_group || acc.server || "",
        broker_label: acc.broker_label || "",
        badge: acc.badge || acc.account_category || "",
        account_type: acc.account_type || acc.trading_type || "",
        raw: opt.raw || opt,
      };
    }
    return {
      label: String(opt ?? ""),
      value: opt,
      disabled: false,
      isAccount: false,
      raw: opt,
    };
  });
});

const allOption = computed(() => ({
  label: props.allLabel,
  value: null,
  disabled: false,
  isAccount: false,
}));

const hasAccountOptions = computed(() => {
  return normalizedOptions.value.some((o) => o.isAccount);
});

const effectiveSearchPlaceholder = computed(() => {
  if (props.searchPlaceholder && props.searchPlaceholder !== "Search the platform") {
    return props.searchPlaceholder;
  }
  return hasAccountOptions.value
    ? "Search with user id, name..."
    : "Search the platform";
});

const filteredOptions = computed(() => {
  let opts = normalizedOptions.value;
  if (props.allowAll) {
    opts = [allOption.value, ...opts];
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    opts = opts.filter((o) => {
      const matchLabel = o.label && o.label.toLowerCase().includes(q);
      const matchVal = o.value !== undefined && String(o.value).toLowerCase().includes(q);
      const matchAccNum = o.account_number && String(o.account_number).toLowerCase().includes(q);
      const matchGroup = o.broker_group && String(o.broker_group).toLowerCase().includes(q);
      const matchLabelField = o.broker_label && String(o.broker_label).toLowerCase().includes(q);
      const matchBadge = o.badge && String(o.badge).toLowerCase().includes(q);
      const matchType = o.account_type && String(o.account_type).toLowerCase().includes(q);
      return (
        matchLabel ||
        matchVal ||
        matchAccNum ||
        matchGroup ||
        matchLabelField ||
        matchBadge ||
        matchType
      );
    });
  }
  return opts;
});

const selectedOption = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return props.allowAll ? allOption.value : null;
  }

  const found = normalizedOptions.value.find(
    (o) =>
      o.value === props.modelValue ||
      String(o.value) === String(props.modelValue),
  );

  return found ? (found.raw ?? found) : null;
});

const selectedLabel = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return props.allowAll ? props.allLabel : null;
  }

  const found = normalizedOptions.value.find(
    (o) =>
      o.value === props.modelValue ||
      String(o.value) === String(props.modelValue),
  );

  if (!found) return null;
  return found.label || (found.isAccount ? found.account_number : null);
});

const displayLabel = computed(() => selectedLabel.value ?? props.placeholder);

const isPlaceholder = computed(
  () =>
    (!selectedLabel.value && props.modelValue !== null) ||
    (!props.allowAll && props.modelValue === null),
);

function getAccountSubtitle(opt) {
  if (opt.badge && String(opt.badge).trim()) {
    return String(opt.badge).trim();
  }
  if (opt.account_category && String(opt.account_category).trim()) {
    return String(opt.account_category).trim();
  }
  if (opt.account_type && String(opt.account_type).trim()) {
    const t = String(opt.account_type).trim().toLowerCase();
    return t === "copy_trading"
      ? "Copy Trading"
      : t.charAt(0).toUpperCase() + t.slice(1);
  }
  return "";
}

function formatAccountBalance(val, cur) {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  const currency = cur ? String(cur).toUpperCase() : "";
  if (isNaN(num)) return `${val} ${currency}`.trim();
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  return currency ? `${formatted} ${currency}` : `${formatted}`;
}

function getOptionFlagCode(option) {
  if (!option) return "";
  if (option.flagCode) return option.flagCode;
  if (option.value && typeof option.value === "string") {
    return option.value.toLowerCase();
  }
  return "";
}

const selectedFlagCode = computed(() => {
  if (selectedOption.value) return getOptionFlagCode(selectedOption.value);
  if (props.modelValue && typeof props.modelValue === "string") return props.modelValue.toLowerCase();
  return "";
});

const roundedClass = computed(() => {
  switch (props.rounded) {
    case "left":
      return "rounded-l-xl rounded-r-none";
    case "right":
      return "rounded-r-xl rounded-l-none";
    case "none":
      return "rounded-none";
    case "lg":
      return "rounded-lg";
    case "xl":
      return "rounded-xl";
    case "2xl":
      return "rounded-2xl";
    case "full":
      return "rounded-full";
    default:
      return "rounded-full";
  }
});

const isGlass = computed(
  () => props.variant === "glass" || props.variant === "auth",
);

const triggerBgClass = computed(() => {
  if (isGlass.value) {
    return "bg-card-background/20 border-primary-border/40 text-primary-text hover:border-primary-border";
  }
  return props.variant === "surface" ? "bg-background" : "bg-card-background";
});

const dropdownBgClass = computed(() => {
  if (isGlass.value) {
    return "bg-card-background/95 backdrop-blur-sm text-primary-text";
  }
  return props.variant === "surface" ? "bg-background" : "bg-card-background";
});

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(
  () => props.disabled,
  (val) => {
    if (val) close();
  },
);

watch(filteredOptions, () => {
  highlightedIndex.value = -1;
});

watch(isOpen, (val) => {
  if (typeof document !== "undefined") {
    if (val) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
});

// ─── Methods ──────────────────────────────────────────────────────────────────
function checkMobile() {
  if (typeof window !== "undefined") {
    isMobile.value = window.innerWidth < 768;
  }
}

function toggle() {
  if (props.disabled) return;

  checkMobile();
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    emit("open");
    searchQuery.value = "";
    highlightedIndex.value = -1;
    nextTick(() => {
      setTimeout(() => searchRef.value?.focus(), 60);
    });
  } else {
    emit("close");
  }
}

function close() {
  if (!isOpen.value) return;
  isOpen.value = false;
  searchQuery.value = "";
  highlightedIndex.value = -1;
  emit("close");
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
}

function select(option) {
  if (!option || option.disabled) return;
  emit("update:modelValue", option.value);
  emit("change", option.raw ?? option);
  close();
}

function isSelected(option) {
  if (option.value === null) {
    return props.modelValue === null || props.modelValue === undefined;
  }
  return (
    props.modelValue === option.value ||
    String(props.modelValue) === String(option.value)
  );
}

function navigateOption(direction) {
  if (!filteredOptions.value.length) return;
  if (highlightedIndex.value === -1) {
    highlightedIndex.value = direction > 0 ? 0 : filteredOptions.value.length - 1;
  } else {
    highlightedIndex.value =
      (highlightedIndex.value + direction + filteredOptions.value.length) %
      filteredOptions.value.length;
  }
}

function selectHighlighted() {
  if (
    filteredOptions.value.length > 0 &&
    highlightedIndex.value >= 0 &&
    highlightedIndex.value < filteredOptions.value.length
  ) {
    select(filteredOptions.value[highlightedIndex.value]);
  } else if (filteredOptions.value.length > 0 && highlightedIndex.value === -1) {
    const selected = filteredOptions.value.find((o) => isSelected(o));
    if (selected) {
      select(selected);
    } else {
      select(filteredOptions.value[0]);
    }
  }
}

function handleKeydown(event) {
  if (event.key === "Escape") close();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    if (isOpen.value) {
      event.preventDefault();
      searchRef.value?.focus();
    }
  }
}

function handleResize() {
  checkMobile();
}

onMounted(() => {
  checkMobile();
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <div class="relative" :class="props.class">
    <!-- Trigger Button -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="props.disabled"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggle"
      :style="{ width, height }"
      :class="[
        'flex items-center justify-between px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer select-none outline-none focus:outline-none focus:ring-0 shadow-none',
        borderless
          ? 'border-0'
          : isGlass
            ? 'border border-primary-border/40'
            : 'border border-primary-border',
        triggerBgClass,
        roundedClass,
        props.disabled
          ? 'opacity-50 cursor-not-allowed pointer-events-none'
          : '',
        buttonClass,
      ]"
    >
      <slot
        name="trigger"
        :selected="selectedOption"
        :label="displayLabel"
        :is-open="isOpen"
      >
        <div class="flex items-center gap-2 truncate">
          <span
            v-if="showFlags && selectedFlagCode"
            :class="[
              'fi',
              `fi-${selectedFlagCode}`,
              'fis',
              'w-4 h-3 flex-shrink-0',
            ]"
          ></span>
          <span
            :class="[
              'truncate',
              isPlaceholder || (isLoading && !selectedLabel)
                ? 'text-placeholder font-normal'
                : 'text-primary-text font-medium',
            ]"
          >
            {{ isLoading && !selectedLabel ? "Loading..." : displayLabel }}
          </span>
        </div>
      </slot>

      <Loader2
        v-if="isLoading"
        :size="16"
        class="ml-2 flex-shrink-0 animate-spin text-secondary-text"
      />
      <ChevronDown
        v-else
        :size="16"
        class="ml-2 flex-shrink-0 transition-transform duration-200 text-secondary-text"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Floating Modal Dialog (Exact Screenshot 1 Design on All Screen Sizes) -->
    <Teleport to="body">
      <!-- Backdrop Overlay -->
      <Transition name="fade">
        <div
          v-if="isOpen"
          class="fixed inset-0 bg-black/30 backdrop-blur-[1.5px] z-[99998] transition-opacity"
          @click="close"
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
            role="listbox"
            class="w-full max-w-[420px] flex flex-col pointer-events-auto text-left gap-2"
            @click.stop
          >
            <!-- 1. Floating Pill Search Bar (Exact Screenshot 1: Clean, Border-0, Shadow-None, Rounded-Full) -->
            <div
              v-if="searchable"
              class="w-full bg-card-background rounded-full px-4 py-2.5 sm:py-3 flex items-center gap-2.5 transition-all border-0 shadow-none"
            >
              <Search
                :size="16"
                class="text-secondary-text shrink-0"
              />
              <input
                ref="searchRef"
                v-model="searchQuery"
                type="text"
                :placeholder="effectiveSearchPlaceholder"
                class="w-full bg-transparent text-xs sm:text-sm text-primary-text placeholder:text-placeholder outline-none border-0 shadow-none font-normal"
                @input="emit('search', searchQuery)"
                @keydown.down.prevent="navigateOption(1)"
                @keydown.up.prevent="navigateOption(-1)"
                @keydown.enter.prevent="selectHighlighted"
              />
              <button
                v-if="searchQuery"
                type="button"
                @click="searchQuery = ''"
                class="p-1 text-secondary-text hover:text-primary-text rounded-full shrink-0 cursor-pointer"
                title="Clear"
              >
                <X :size="14" />
              </button>
            </div>

            <!-- 2. Rounded List Card (Exact Screenshot 1) -->
            <div
              v-if="filteredOptions.length > 0 || isLoading"
              class="w-full bg-card-background rounded-2xl sm:rounded-[20px] p-1.5 sm:p-2 overflow-hidden flex flex-col border-0 shadow-none"
              :class="dropdownBgClass"
            >
              <ul
                @mouseleave="highlightedIndex = -1"
                class="w-full overflow-y-auto space-y-1 select-none no-scrollbar"
                :class="[
                  isMobile
                    ? 'max-h-[75vh]'
                    : 'max-h-[380px] sm:max-h-[420px]',
                ]"
              >
                <li
                  v-if="isLoading"
                  class="px-4 py-6 text-xs text-center italic text-secondary-text flex items-center justify-center gap-2"
                >
                  <Loader2 class="w-4 h-4 animate-spin text-secondary-text" />
                  Loading options...
                </li>

                <li
                  v-for="(option, idx) in filteredOptions"
                  :key="option.value ?? '__all__'"
                  role="option"
                  :aria-selected="isSelected(option)"
                  @click="select(option)"
                  @mouseenter="highlightedIndex = idx"
                  class="transition-all duration-150 cursor-pointer border-0 shadow-none"
                  :class="[
                    option.isAccount
                      ? 'p-2.5 sm:p-3 rounded-xl'
                      : 'px-3.5 py-2 rounded-lg',
                    option.isAccount
                      ? isSelected(option)
                        ? 'bg-background'
                        : highlightedIndex === idx
                          ? 'bg-background/80'
                          : 'bg-transparent hover:bg-background/60'
                      : isSelected(option)
                        ? 'bg-background text-primary-text font-semibold'
                        : highlightedIndex === idx
                          ? 'bg-background text-primary-text'
                          : 'text-primary-text hover:bg-background',
                    option.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
                  ]"
                >
                  <slot
                    name="option"
                    :option="option.raw ?? option"
                    :selected="isSelected(option)"
                  >
                    <!-- Rich Account Card Design (Compact text) -->
                    <div v-if="option.isAccount" class="flex items-center justify-between w-full">
                      <div class="flex flex-col min-w-0 text-left">
                        <!-- Top line: Platform & Account Number -->
                        <div class="text-xs sm:text-[13px] text-primary-text leading-snug">
                          <span v-if="option.platform" class="font-bold mr-1">{{ option.platform }}:</span>
                          <span class="font-semibold">{{ option.account_number || option.label }}</span>
                        </div>

                        <!-- Middle line: Badge • Group / Server -->
                        <div
                          v-if="getAccountSubtitle(option)"
                          class="text-[10px] sm:text-[11px] text-secondary-text truncate font-normal leading-tight mt-0.5"
                        >
                          {{ getAccountSubtitle(option) }}
                        </div>

                        <!-- Bottom line: Balance Currency -->
                        <div
                          v-if="option.balance !== undefined && option.balance !== null"
                          class="text-xs sm:text-[13px] font-bold text-primary-text leading-snug mt-0.5"
                        >
                          {{ formatAccountBalance(option.balance, option.broker_currency) }}
                        </div>
                      </div>

                      <!-- Right Circle Checkmark -->
                      <div
                        v-if="isSelected(option)"
                        class="w-5 h-5 rounded-full bg-primary-text text-card-background flex items-center justify-center shrink-0 ml-2.5"
                      >
                        <Check class="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    <!-- Standard Simple Option Design (Compact) -->
                    <div v-else class="flex items-center justify-between w-full">
                      <div class="flex items-center gap-2 truncate">
                        <span
                          v-if="showFlags && getOptionFlagCode(option)"
                          :class="[
                            'fi',
                            `fi-${getOptionFlagCode(option)}`,
                            'fis',
                            'w-3.5 h-2.5 flex-shrink-0',
                          ]"
                        />
                        <span
                          class="text-xs sm:text-sm font-medium"
                          :class="isSelected(option) ? 'text-primary-text font-semibold' : 'text-primary-text'"
                        >
                          {{ option.label }}
                        </span>
                      </div>
                      <Check
                        v-if="isSelected(option)"
                        :size="14"
                        class="shrink-0 ml-2 text-primary-text stroke-[2.5]"
                      />
                    </div>
                  </slot>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

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

ul::-webkit-scrollbar {
  width: 4px;
}
ul::-webkit-scrollbar-thumb {
  border-radius: 99px;
  background-color: var(--color-primary-border, rgba(0, 0, 0, 0.15));
}
</style>
