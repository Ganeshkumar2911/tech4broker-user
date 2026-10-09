<template>
  <div class="min-h-screen min-h-[100dvh] w-full lg:h-screen lg:overflow-hidden flex bg-card-background text-primary-text">
    <!-- Left Column: Form Section -->
    <div
      class="w-full lg:w-3/4 min-h-screen min-h-[100dvh] lg:h-full flex flex-col items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8 overflow-y-auto no-scrollbar bg-card-background relative"
    >
      <!-- Unified Center Container (Switches between Enter Email and Reset Link Sent) -->
      <div class="w-full max-w-[360px] sm:max-w-[400px] flex flex-col my-auto py-2">
        <!-- Step 1: Enter Email Component -->
        <ForgotPasswordEmailStep
          v-if="!isLinkSent"
          :email="email"
          :loading="authStore.loading || isSubmitting"
          :error="error"
          @update:email="email = $event"
          @submit="handleSendResetLink"
        />

        <!-- Step 2: Reset Link Sent Component -->
        <ResetLinkSentStep
          v-else
          :email="email"
          :resend-loading="resendLoading"
          :resend-timer="resendTimer"
          @resend="handleResendEmail"
        />

        <!-- Bottom Disclaimer & Links -->
        <div class="w-full text-center mt-6 sm:mt-7 pt-1">
          <p class="text-[10px] sm:text-[10.5px] text-secondary-text leading-relaxed">
            Panther Capitals Ltd we don't offer services to residents of certain
            countries, including: Syria, North Korea, Iran, Iraq, Mauritius, USA,
            Canada, Sudan, Myanmar, Yemen, Afghanistan, Vanuatu, and those within
            the European Economic Area (EEA).
          </p>

          <div class="flex items-center justify-center gap-2 mt-2 text-[10.5px] text-secondary-text">
            <a href="#" class="hover:text-primary-text transition-colors">Terms & Condition</a>
            <span>|</span>
            <a href="#" class="hover:text-primary-text transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="#" class="hover:text-primary-text transition-colors">Risk Disclosure</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Reusable Promo & App Preview Panel (1/4 width) -->
    <div class="hidden lg:block lg:w-1/4 h-full overflow-hidden">
      <AuthSidePanel />
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/stores/shared/auth";
import AuthSidePanel from "@/components/auth/AuthSidePanel.vue";
import ForgotPasswordEmailStep from "./components/ForgotPasswordEmailStep.vue";
import ResetLinkSentStep from "./components/ResetLinkSentStep.vue";

const authStore = useAuthStore();

const email = ref("");
const isLinkSent = ref(false);
const isSubmitting = ref(false);
const resendLoading = ref(false);
const error = ref("");
const resendTimer = ref(0);
let timerInterval = null;

const handleSendResetLink = async (enteredEmail) => {
  if (isSubmitting.value || authStore.loading) return;

  email.value = enteredEmail;
  error.value = "";
  isSubmitting.value = true;

  try {
    await authStore.forgotPassword(enteredEmail);
    isLinkSent.value = true;
    startResendCountdown();
  } catch (err) {
    error.value = err?.error || err?.message || "Failed to send reset link.";
  } finally {
    isSubmitting.value = false;
  }
};

const startResendCountdown = () => {
  resendTimer.value = 30;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (resendTimer.value > 0) {
      resendTimer.value--;
    } else {
      clearInterval(timerInterval);
    }
  }, 1000);
};

const handleResendEmail = async () => {
  if (resendTimer.value > 0 || resendLoading.value || isSubmitting.value || authStore.loading) return;

  resendLoading.value = true;
  try {
    await authStore.forgotPassword(email.value);
    resendLoading.value = false;
    startResendCountdown();
  } catch (err) {
    resendLoading.value = false;
    console.error("Resend failed:", err);
  }
};

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
