<script setup>
import { computed } from "vue";
import BaseIcon from "@/components/base/BaseIcon.vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  methodType: {
    type: String,
    default: "upi", // 'upi' | 'imps'
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "confirm"]);

const isImps = computed(() => {
  return String(props.methodType || "").toLowerCase() === "imps";
});

const title = computed(() => {
  return isImps.value
    ? "Complete Your IMPS Deposit"
    : "Complete Your UPI Deposit";
});

const description = computed(() => {
  return isImps.value
    ? 'Please complete your IMPS payment within the allotted time. After making the payment, you must submit the <strong class="text-black font-bold">UTR number</strong> to confirm your deposit.'
    : 'Please complete your UPI payment within the allotted time. After making the payment, you must submit the <strong class="text-black font-bold">UTR number</strong> to confirm your deposit.';
});

const paymentIcon = computed(() => {
  return isImps.value ? "account_balance" : "qr_code_2";
});

const ctaText = computed(() => {
  if (props.isSubmitting) return "Processing...";
  return isImps.value ? "Continue to IMPS Payment" : "Continue to UPI Payment";
});

const steps = computed(() => [
  {
    step: 1,
    icon: "launch",
    iconCircleClass: "bg-primary-text text-card-background",
    title: "Deposit Process Initiated",
    badge: "Redirect",
    badgeClass: "bg-primary-blue/15 text-primary-blue",
    description:
      "When you click continue, you will be redirected to the secure payment page where your deposit process will be initiated.",
  },
  {
    step: 2,
    icon: "schedule",
    iconCircleClass: "bg-primary-text text-card-background",
    title: "Payment Time Limit",
    badge: isImps.value ? "~1 Hour" : "~30 Mins",
    badgeClass: "bg-primary-blue/15 text-primary-blue",
    description: isImps.value
      ? 'You have approximately <strong class="text-primary-text font-semibold">1 hour</strong> to complete the IMPS payment.'
      : 'You have approximately <strong class="text-primary-text font-semibold">30 minutes</strong> to complete the UPI payment.',
  },
  {
    step: 3,
    icon: "verified_user",
    iconCircleClass: "bg-primary-green text-white",
    title: '<strong class="text-black font-bold">UTR Number</strong> Required',
    badge: "Mandatory",
    badgeClass: "bg-primary-green/20 text-primary-green",
    description:
      'After completing the payment, enter the <strong class="text-black font-bold">UTR number</strong> on the deposit page. This is required to process and verify your deposit.',
  },
]);

function handleClose() {
  if (props.isSubmitting) return;
  emit("close");
}

function handleConfirm() {
  if (props.isSubmitting) return;
  emit("confirm");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        @click.self="handleClose"
      >
        <div
          class="dialog-card w-full max-w-lg rounded-2xl sm:rounded-[24px] border border-primary-border bg-card-background shadow-2xl p-5 sm:p-7 relative max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <!-- Close button -->
          <button
            type="button"
            @click="handleClose"
            :disabled="isSubmitting"
            class="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full flex items-center justify-center text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer disabled:opacity-50"
            title="Close dialog"
          >
            <BaseIcon name="close" :size="18" />
          </button>

          <!-- Top Payment Icon & Header -->
          <div class="flex items-start gap-3.5 mb-5 pr-8">
            <div
              class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary-text text-card-background flex items-center justify-center shrink-0 shadow-sm"
            >
              <span class="material-symbols-outlined text-[24px] select-none leading-none">
                {{ paymentIcon }}
              </span>
            </div>

            <div>
              <h3 class="text-lg sm:text-xl font-bold text-primary-text tracking-tight">
                {{ title }}
              </h3>
              <p
                class="text-xs sm:text-sm text-secondary-text mt-1 leading-relaxed"
                v-html="description"
              ></p>
            </div>
          </div>

          <!-- Stepper Guide (Styled exactly like DepositSidebar.vue) -->
          <div
            class="rounded-2xl bg-background border border-primary-border/60 p-4 sm:p-5 mb-4"
          >
            <div
              v-for="(s, i) in steps"
              :key="s.step"
              class="relative flex gap-4"
              :class="[i < steps.length - 1 ? 'pb-6' : '']"
            >
              <!-- Dotted connector line -->
              <span
                v-if="i < steps.length - 1"
                class="absolute left-5 top-10 bottom-0 w-px border-l border-dashed border-primary-border"
              />

              <!-- Step Icon Circle -->
              <span
                class="relative z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                :class="s.iconCircleClass"
              >
                <BaseIcon :name="s.icon" :size="18" />
              </span>

              <!-- Step Content -->
              <div class="pt-1 min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <p
                    class="mid-text font-semibold text-primary-text"
                    v-html="s.title"
                  ></p>
                  <span
                    v-if="s.badge"
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    :class="s.badgeClass"
                  >
                    {{ s.badge }}
                  </span>
                </div>
                <p
                  class="sub-text text-secondary-text leading-relaxed"
                  v-html="s.description"
                ></p>
              </div>
            </div>
          </div>

          <!-- Important Note Callout -->
          <div
            class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 mb-5"
          >
            <div
              class="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 mt-0.5"
            >
              <BaseIcon name="warning" :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-amber-500 mb-0.5">
                Important Note
              </p>
              <p class="text-xs text-secondary-text leading-relaxed">
                Please make sure you complete the payment and submit the correct <strong class="text-black font-bold">UTR</strong>
                within the given time. Payments without a valid <strong class="text-black font-bold">UTR</strong> may not be
                processed automatically.
              </p>
            </div>
          </div>

          <!-- Dialog Actions (Cancel & Continue) -->
          <div
            class="pt-3 flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-3 border-t border-primary-border/50"
          >
            <button
              type="button"
              @click="handleClose"
              :disabled="isSubmitting"
              class="w-full sm:w-auto h-11 px-6 rounded-full border border-primary-border text-primary-text font-semibold hover:bg-background transition-colors cursor-pointer text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="handleConfirm"
              :disabled="isSubmitting"
              class="w-full sm:w-auto h-11 px-6 rounded-full bg-button text-button-text font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer text-sm"
            >
              <BaseIcon
                v-if="isSubmitting"
                name="sync"
                class="animate-spin"
                :size="16"
              />
              <span>{{ ctaText }}</span>
              <BaseIcon
                v-if="!isSubmitting"
                name="arrow_forward"
                :size="16"
              />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog-card {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.dialog-fade-leave-active .dialog-card {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.dialog-fade-enter-from .dialog-card {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

.dialog-fade-leave-to .dialog-card {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
</style>
