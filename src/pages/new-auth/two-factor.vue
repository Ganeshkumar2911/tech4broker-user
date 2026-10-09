<template>
  <div class="min-h-screen min-h-[100dvh] w-full lg:h-screen lg:overflow-hidden flex bg-card-background text-primary-text">
    <!-- Left Column: Form Section -->
    <div
      class="w-full lg:w-3/4 min-h-screen min-h-[100dvh] lg:h-full flex flex-col items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8 overflow-y-auto no-scrollbar bg-card-background relative"
    >
      <!-- Unified Center Container -->
      <div class="w-full max-w-[360px] sm:max-w-[400px] flex flex-col my-auto py-2">
        <!-- 1. Forced 2FA Setup Step -->
        <TwoFactorSetupStep
          v-if="isSetupMode"
          :temp-token="tempToken"
          :role="currentRole"
          @completed="handleSetupCompleted"
        />

        <!-- 2. Standard 2FA Verification Step -->
        <TwoFactorAuthStep
          v-else
          :loading="authStore.loading || isSubmitting"
          :resend-timer="resendTimer"
          :error="error"
          @submit="handleVerify"
          @resend="restartTimer"
        />

        <!-- Bottom Disclaimer & Links -->
        <div class="w-full text-center mt-6 sm:mt-7 pt-1">
          <!-- Disclaimer Text -->
          <p class="text-[10px] sm:text-[10.5px] text-secondary-text leading-relaxed">
            Panther Capitals Ltd we don't offer services to residents of certain
            countries, including: Syria, North Korea, Iran, Iraq, Mauritius, USA,
            Canada, Sudan, Myanmar, Yemen, Afghanistan, Vanuatu, and those within
            the European Economic Area (EEA).
          </p>

          <!-- Footer Links -->
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/shared/auth";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import AuthSidePanel from "@/components/auth/AuthSidePanel.vue";
import TwoFactorAuthStep from "./components/TwoFactorAuthStep.vue";
import TwoFactorSetupStep from "./components/TwoFactorSetupStep.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const isSubmitting = ref(false);
const error = ref("");
const resendTimer = ref(30);
let timerInterval = null;

const tempToken = computed(() => {
  return (
    authStore.twoFactorData?.tempToken ||
    sessionStorage.getItem("2fa_temp_token") ||
    route.query.temp_token ||
    route.query.token ||
    ""
  );
});

const currentRole = computed(() => {
  return (
    authStore.twoFactorData?.role ||
    sessionStorage.getItem("2fa_role") ||
    route.query.role ||
    "client"
  );
});

const isSetupMode = computed(() => {
  return (
    authStore.twoFactorData?.isSetup === true ||
    sessionStorage.getItem("2fa_is_setup") === "true" ||
    route.query.setup === "true"
  );
});

onMounted(() => {
  startTimer();

  // If no temporary token found and not authenticated, redirect to login
  if (!tempToken.value && !authStore.token) {
    snackbar.show("Session expired. Please log in again.", "info");
    router.replace({
      path: "/login",
      query: route.query,
    });
  }
});

const startTimer = () => {
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

const restartTimer = () => {
  startTimer();
};

const handleVerify = async (payload) => {
  if (isSubmitting.value || authStore.loading) return;

  error.value = "";
  isSubmitting.value = true;

  try {
    await authStore.verifyLogin2fa({
      totp_code: payload.totp_code,
      backup_code: payload.backup_code,
      dont_ask_device: payload.dont_ask_device,
      temp_token: tempToken.value,
      role: currentRole.value,
      redirect: route.query.redirect,
    });
  } catch (err) {
    error.value =
      err?.error ||
      err?.message ||
      "Invalid verification code. Please check and try again.";
  } finally {
    isSubmitting.value = false;
  }
};

const handleSetupCompleted = () => {
  const targetDashboard =
    currentRole.value === "fm"
      ? "/fm-dashboard"
      : currentRole.value === "ib"
        ? "/ib-dashboard"
        : "/dashboard";

  const redirectUrl =
    route.query.redirect ||
    sessionStorage.getItem("2fa_redirect") ||
    sessionStorage.getItem("returnUrl");

  // Clean up
  sessionStorage.removeItem("2fa_temp_token");
  sessionStorage.removeItem("2fa_role");
  sessionStorage.removeItem("2fa_email");
  sessionStorage.removeItem("2fa_redirect");
  sessionStorage.removeItem("2fa_is_setup");

  if (redirectUrl && redirectUrl.startsWith("/")) {
    router.push(redirectUrl);
  } else {
    router.push(targetDashboard);
  }
};

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
