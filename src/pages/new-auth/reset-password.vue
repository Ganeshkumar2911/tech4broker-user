<template>
  <div class="min-h-screen min-h-[100dvh] w-full lg:h-screen lg:overflow-hidden flex bg-card-background text-primary-text">
    <!-- Left Column: Form Section -->
    <div
      class="w-full lg:w-3/4 min-h-screen min-h-[100dvh] lg:h-full flex flex-col items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8 overflow-y-auto no-scrollbar bg-card-background"
    >
      <!-- Unified Center Container (Switches between Create Password and Success) -->
      <div class="w-full max-w-[360px] sm:max-w-[400px] flex flex-col my-auto py-2">
        <!-- Step 4: Create New Password Component -->
        <CreateNewPasswordStep
          v-if="!isSuccess"
          :loading="authStore.loading || isSubmitting"
          @submit="handleUpdatePassword"
        />

        <!-- Step 5: Password Updated Success Component -->
        <PasswordUpdatedSuccessStep
          v-else
          @login="goToLogin"
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
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useAuthStore } from "@/stores/shared/auth";
import AuthSidePanel from "@/components/auth/AuthSidePanel.vue";
import CreateNewPasswordStep from "./components/CreateNewPasswordStep.vue";
import PasswordUpdatedSuccessStep from "./components/PasswordUpdatedSuccessStep.vue";

const router = useRouter();
const route = useRoute();
const snackbar = useSnackbarStore();
const authStore = useAuthStore();

const token = computed(() => route.query.token || "");
const isSuccess = ref(false);
const isSubmitting = ref(false);

const handleUpdatePassword = async ({ newPassword, confirmPassword }) => {
  if (isSubmitting.value || authStore.loading) return;

  if (!token.value) {
    snackbar.show("Reset token is missing from the URL.", "error");
    return;
  }

  isSubmitting.value = true;
  try {
    await authStore.resetPassword({
      token: token.value,
      newPassword,
      confirmPassword,
    });
    isSuccess.value = true;
  } catch (err) {
    console.error("Password reset failed:", err);
  } finally {
    isSubmitting.value = false;
  }
};

const goToLogin = () => {
  router.push("/login");
};

onMounted(() => {
  if (!token.value) {
    snackbar.show("Reset token is missing or expired in URL.", "error");
  }
});
</script>
