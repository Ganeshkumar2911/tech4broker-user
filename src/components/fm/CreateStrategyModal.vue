<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import { useFmStrategiesStore } from "@/stores/fm/strategies";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "success", "update:modelValue"]);

const isModalOpen = computed(() => props.isOpen || props.modelValue);
const strategiesStore = useFmStrategiesStore();

const initialForm = {
  label_name: "",
  performance_fee: 20,
  fm_share: 70,
  broker_share: 30,
  ib_pool_percentage: 40,
  min_capital: 500,
  settlement_type: "weekly",
  settlement_time: "00:00:00",
  visibility_type: "public",
  management_fee: 0,
  management_fee_interval: null,
  registration_fee: 0,
  broker_leverage: 500,
  broker_currency: "USD",
  message: "",
};

const form = reactive({ ...initialForm });
const errors = reactive({});

watch(
  () => isModalOpen.value,
  (open) => {
    if (open) {
      Object.assign(form, initialForm);
      Object.keys(errors).forEach((key) => delete errors[key]);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
);

function handleKeyDown(e) {
  if (e.key === "Escape" && isModalOpen.value) {
    handleClose();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  document.body.style.overflow = "";
});

const settlementOptions = [
  { label: "Weekly Settlement", value: "weekly" },
  { label: "Monthly Settlement", value: "monthly" },
  { label: "Daily Settlement", value: "daily" },
];

const visibilityOptions = [
  { label: "Public (Listed on Leaderboard)", value: "public" },
  { label: "Private (Invite Link Only)", value: "private" },
];

const leverageOptions = [
  { label: "1:100", value: 100 },
  { label: "1:200", value: 200 },
  { label: "1:400", value: 400 },
  { label: "1:500", value: 500 },
  { label: "1:1000", value: 1000 },
];

const currencyOptions = [
  { label: "USD - US Dollar", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
  { label: "GBP - British Pound", value: "GBP" },
];

function handleClose() {
  emit("update:modelValue", false);
  emit("close");
}

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key]);
  let isValid = true;

  const rawName = form.label_name?.trim() || "";

  if (!rawName) {
    errors.label_name = "Strategy name is required.";
    isValid = false;
  } else {
    const trimmedLower = rawName.toLowerCase();

    // Check duplicate against existing active strategies
    const isDuplicateActive = (strategiesStore.strategies || []).some(
      (s) => (s.label_name || "").trim().toLowerCase() === trimmedLower
    );
    if (isDuplicateActive) {
      errors.label_name = "A strategy with this name already exists and is active.";
      isValid = false;
    }

    // Check duplicate against pending requests
    const isDuplicatePending = (strategiesStore.pendingRequests || []).some(
      (r) => (r.label_name || "").trim().toLowerCase() === trimmedLower
    );
    if (isDuplicatePending) {
      errors.label_name = "A pending request with this name already exists. Please choose a different name.";
      isValid = false;
    }
  }

  if (form.performance_fee < 0 || form.performance_fee > 100) {
    errors.performance_fee = "Performance fee must be between 0% and 100%.";
    isValid = false;
  }

  if (form.fm_share < 0 || form.fm_share > 100) {
    errors.fm_share = "FM share must be between 0% and 100%.";
    isValid = false;
  }

  if (Number(form.fm_share) + Number(form.broker_share) !== 100) {
    errors.broker_share = "FM Share + Broker Share must equal 100%.";
    isValid = false;
  }

  if (form.min_capital < 0) {
    errors.min_capital = "Minimum capital cannot be negative.";
    isValid = false;
  }

  return isValid;
}

function handleFmShareChange(val) {
  const num = Number(val);
  form.fm_share = num;
  if (!isNaN(num) && num >= 0 && num <= 100) {
    form.broker_share = 100 - num;
  }
}

function handleSubmit() {
  if (!validate()) return;

  const payload = {
    label_name: form.label_name.trim(),
    performance_fee: Number(form.performance_fee) || 0,
    fm_share: Number(form.fm_share) || 0,
    broker_share: Number(form.broker_share) || 0,
    ib_pool_percentage: Number(form.ib_pool_percentage) || 0,
    min_capital: Number(form.min_capital) || 0,
    settlement_type: form.settlement_type,
    settlement_time: form.settlement_time || "00:00:00",
    visibility_type: form.visibility_type,
    management_fee: Number(form.management_fee) || 0,
    management_fee_interval: form.management_fee_interval || null,
    registration_fee: Number(form.registration_fee) || 0,
    broker_leverage: Number(form.broker_leverage) || 500,
    broker_currency: form.broker_currency || "USD",
    message: form.message?.trim() || "",
  };

  strategiesStore.createStrategyRequest(payload, (res) => {
    emit("success", res);
    handleClose();
  });
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop Overlay -->
    <transition name="drawer-fade">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs transition-opacity"
        @click="handleClose"
      />
    </transition>

    <!-- Side Panel Drawer (Slides in from Right) -->
    <transition name="drawer-slide">
      <div
        v-if="isModalOpen"
        class="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-xl sm:max-w-2xl flex-col bg-card-background border-l border-primary-border overflow-hidden font-sans"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <!-- Drawer Header -->
        <div
          class="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-primary-border bg-card-background sticky top-0 z-20 shrink-0"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20"
            >
              <BaseIcon name="add_circle" :size="20" />
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-bold text-primary-text truncate">
                Create New Strategy Request
              </h3>
              <p class="text-xs text-secondary-text truncate">
                Submit your trading strategy parameters for admin approval
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="handleClose"
            class="p-1.5 rounded-xl text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer shrink-0"
            title="Close panel"
          >
            <BaseIcon name="close" :size="20" />
          </button>
        </div>

        <!-- Drawer Body (Scrollable Form Fields) -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 no-scrollbar bg-background/50">
          <!-- 1. Strategy Name -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-primary-text flex items-center gap-1">
              Strategy Display Name <span class="text-primary-red">*</span>
            </label>
            <input
              v-model="form.label_name"
              type="text"
              placeholder="e.g. Gold Swing Alpha, EUR Scalper Pro"
              class="input-field px-3.5 py-2.5 text-sm w-full bg-card-background rounded-xl border border-primary-border outline-none focus:border-primary-text text-primary-text transition-colors font-medium"
              :class="errors.label_name ? 'border-primary-red ring-1 ring-primary-red/20' : ''"
            />
            <p v-if="errors.label_name" class="text-2xs text-primary-red mt-1 font-medium">
              {{ errors.label_name }}
            </p>
          </div>

          <!-- 2. Performance Fee & Split Breakdown -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-secondary-text">
                Performance Fee (%)
              </label>
              <div class="relative">
                <input
                  v-model="form.performance_fee"
                  type="number"
                  min="0"
                  max="100"
                  class="input-field px-3.5 py-2.5 text-sm w-full bg-card-background rounded-xl border border-primary-border outline-none focus:border-primary-text text-primary-text font-mono transition-colors"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text">%</span>
              </div>
              <p v-if="errors.performance_fee" class="text-2xs text-primary-red">
                {{ errors.performance_fee }}
              </p>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-secondary-text">
                FM Share (%)
              </label>
              <div class="relative">
                <input
                  :value="form.fm_share"
                  @input="handleFmShareChange($event.target.value)"
                  type="number"
                  min="0"
                  max="100"
                  class="input-field px-3.5 py-2.5 text-sm w-full bg-card-background rounded-xl border border-primary-border outline-none focus:border-primary-text text-primary-text font-mono transition-colors"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text">%</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-secondary-text">
                Broker Share (%)
              </label>
              <div class="relative">
                <input
                  v-model="form.broker_share"
                  type="number"
                  min="0"
                  max="100"
                  class="input-field px-3.5 py-2.5 text-sm w-full bg-card-background rounded-xl border border-primary-border outline-none focus:border-primary-text text-primary-text font-mono transition-colors"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text">%</span>
              </div>
              <p v-if="errors.broker_share" class="text-2xs text-primary-red">
                {{ errors.broker_share }}
              </p>
            </div>
          </div>

          <!-- 3. Min Capital & IB Pool -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-secondary-text">
                Min. Capital to Follow (USD)
              </label>
              <div class="relative">
                <input
                  v-model="form.min_capital"
                  type="number"
                  min="0"
                  placeholder="500"
                  class="input-field px-3.5 py-2.5 text-sm w-full bg-card-background rounded-xl border border-primary-border outline-none focus:border-primary-text text-primary-text font-mono transition-colors"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text">USD</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-secondary-text">
                IB Referral Pool (%)
              </label>
              <div class="relative">
                <input
                  v-model="form.ib_pool_percentage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="40"
                  class="input-field px-3.5 py-2.5 text-sm w-full bg-card-background rounded-xl border border-primary-border outline-none focus:border-primary-text text-primary-text font-mono transition-colors"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text">%</span>
              </div>
            </div>
          </div>

          <!-- 4. Settlement Cycle & Visibility -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-secondary-text">
                Settlement Period
              </label>
              <BaseSelect
                v-model="form.settlement_type"
                :options="settlementOptions"
                height="42px"
                rounded="xl"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-secondary-text">
                Strategy Visibility
              </label>
              <BaseSelect
                v-model="form.visibility_type"
                :options="visibilityOptions"
                height="42px"
                rounded="xl"
              />
            </div>
          </div>

          <!-- 5. Leverage & Currency -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-secondary-text">
                Target Leverage
              </label>
              <BaseSelect
                v-model="form.broker_leverage"
                :options="leverageOptions"
                height="42px"
                rounded="xl"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-secondary-text">
                Account Currency
              </label>
              <BaseSelect
                v-model="form.broker_currency"
                :options="currencyOptions"
                height="42px"
                rounded="xl"
              />
            </div>
          </div>

          <!-- 6. Optional Message to Admin -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-secondary-text">
              Notes / Strategy Description (Optional)
            </label>
            <textarea
              v-model="form.message"
              rows="3"
              placeholder="Briefly describe your trading approach or special notes for admin verification..."
              class="input-field p-3 text-sm w-full bg-card-background rounded-xl border border-primary-border outline-none focus:border-primary-text text-primary-text resize-none transition-colors"
            ></textarea>
          </div>
        </div>

        <!-- Drawer Sticky Footer -->
        <div
          class="px-5 sm:px-6 py-4 border-t border-primary-border bg-card-background flex items-center justify-end gap-3 sticky bottom-0 z-20 shrink-0"
        >
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 text-xs font-semibold rounded-xl text-primary-text bg-background hover:bg-card-background border border-primary-border transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleSubmit"
            :disabled="strategiesStore.actionLoading"
            class="px-5 py-2 text-xs font-semibold rounded-xl text-button-text bg-button hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <BaseIcon
              v-if="strategiesStore.actionLoading"
              name="sync"
              :size="16"
              class="animate-spin"
            />
            <BaseIcon v-else name="send" :size="15" />
            <span>{{ strategiesStore.actionLoading ? "Submitting..." : "Submit Strategy Request" }}</span>
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
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
