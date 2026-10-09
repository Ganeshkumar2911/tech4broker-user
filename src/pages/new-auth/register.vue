<template>
  <div class="min-h-screen min-h-[100dvh] w-full lg:h-screen lg:overflow-hidden flex bg-card-background text-primary-text">
    <!-- Left Column: Form Section -->
    <div
      class="w-full lg:w-3/4 min-h-screen min-h-[100dvh] lg:h-full flex flex-col items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8 overflow-y-auto no-scrollbar bg-card-background"
    >
      <!-- Unified Center Container (Form + Disclaimer) -->
      <div class="w-full max-w-[360px] sm:max-w-[400px] flex flex-col my-auto py-2">
        <!-- Step 0: Choose Account Type -->
        <ChooseAccountTypeStep
          v-if="currentStep === 0"
          @select="handleSelectAccountType"
        />

        <!-- Step 1: Create Your Account -->
        <RegisterAccountStep
          v-else-if="currentStep === 1"
          :initial-data="accountData"
          :loading="authStore.loading || isSubmitting"
          @submit="handleAccountStepSubmit"
        />

        <!-- Step 2: Verify Your Email -->
        <RegisterVerifyOtpStep
          v-else-if="currentStep === 2"
          :email="accountData.email"
          :loading="authStore.loading || isSubmitting"
          :resend-loading="resendLoading"
          :resend-timer="resendTimer"
          :error="otpError"
          @submit="handleVerifyOtpSubmit"
          @resend="handleResendOtp"
          @edit-email="currentStep = 1"
        />

        <!-- Step 3: Complete Your Profile -->
        <RegisterCompleteProfileStep
          v-else-if="currentStep === 3"
          :loading="authStore.loading || isSubmitting"
          @submit="handleCompleteProfileSubmit"
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
            <a href="https://panthercapitals.com/legal/terms-and-conditions" target="_blank" class="hover:text-primary-text transition-colors">Terms & Condition</a>
            <span>|</span>
            <a href="https://panthercapitals.com/legal/privacy-policy" target="_blank" class="hover:text-primary-text transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="https://panthercapitals.com/legal/risk-disclosure" target="_blank" class="hover:text-primary-text transition-colors">Risk Disclosure</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Reusable Promo & App Preview Panel (1/4 width) -->
    <div class="hidden lg:block lg:w-1/4 h-full overflow-hidden">
      <AuthSidePanel :role="accountData.role" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/shared/auth";
import AuthSidePanel from "@/components/auth/AuthSidePanel.vue";
import ChooseAccountTypeStep from "./components/ChooseAccountTypeStep.vue";
import RegisterAccountStep from "./components/RegisterAccountStep.vue";
import RegisterVerifyOtpStep from "./components/RegisterVerifyOtpStep.vue";
import RegisterCompleteProfileStep from "./components/RegisterCompleteProfileStep.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const currentStep = ref(0);
const isSubmitting = ref(false);
const resendLoading = ref(false);
const otpError = ref("");
const resendTimer = ref(0);
let timerInterval = null;

const trackingId = ref(
  sessionStorage.getItem("tracking_id") || localStorage.getItem("tracking_id") || null
);
const additionalInfo = ref({});

const accountData = reactive({
  country: "IN",
  email: "",
  phone_number: "",
  referral_code:
    sessionStorage.getItem("referral_code") ||
    localStorage.getItem("referral_code") ||
    "",
  role: "client",
});

const verifiedOtp = ref("");

watch(
  () => route.query,
  (query) => {
    if (query) {
      if (query.tracking_id) {
        trackingId.value = query.tracking_id;
        sessionStorage.setItem("tracking_id", query.tracking_id);
      }
      const qRef = query.ref || query.referral_code;
      if (qRef) {
        accountData.referral_code = qRef;
        sessionStorage.setItem("referral_code", qRef);
      }
      if (query.role === "fm" || query.role === "fund-manager") {
        accountData.role = "fm";
        currentStep.value = 1;
      } else if (query.role === "client" || query.role === "investor") {
        accountData.role = "client";
        currentStep.value = 1;
      }

      // Capture any additional UTM / tracking parameters
      const extraParams = {};
      for (const key in query) {
        if (
          key !== "tracking_id" &&
          key !== "ref" &&
          key !== "referral_code" &&
          key !== "role"
        ) {
          let val = query[key];
          if (
            typeof val === "string" &&
            val.startsWith('"') &&
            val.endsWith('"')
          ) {
            val = val.slice(1, -1);
          }
          extraParams[key] = val;
        }
      }
      if (Object.keys(extraParams).length > 0) {
        additionalInfo.value = extraParams;
      }
    }
  },
  { immediate: true, deep: true },
);

// ─── Step 0: Choose Account Type Handler ──────────────────
const handleSelectAccountType = (role) => {
  accountData.role = role || "client";
  currentStep.value = 1;
};

// ─── Step 1: Start / Check Registration Handler ───────────
const handleAccountStepSubmit = async (formData) => {
  if (isSubmitting.value || authStore.loading) return;

  accountData.country = formData.country;
  accountData.email = formData.email;
  accountData.phone_number = formData.phone_number;

  otpError.value = "";

  const payload = {
    email: formData.email,
    phone: formData.phone_number,
    phone_number: formData.phone_number,
    country: formData.country,
  };

  if (accountData.referral_code) {
    payload.referral_code = accountData.referral_code;
  }

  if (trackingId.value) {
    payload.tracking_id = trackingId.value;
  }

  if (Object.keys(additionalInfo.value).length > 0) {
    payload.additional_info = additionalInfo.value;
  }

  isSubmitting.value = true;
  try {
    const res = await authStore.startRegistration(payload);
    const nextStep = res?.next_step;

    if (nextStep === "LOGIN") {
      router.push(`/login?email=${encodeURIComponent(formData.email)}`);
    } else if (nextStep === "COMPLETE_PROFILE") {
      currentStep.value = 3;
    } else {
      currentStep.value = 2;
      startResendCountdown();
    }
  } catch (err) {
    console.error("Start registration failed:", err);
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

const handleResendOtp = async () => {
  if (resendTimer.value > 0 || resendLoading.value || isSubmitting.value || authStore.loading) return;

  resendLoading.value = true;
  otpError.value = "";

  try {
    await authStore.startRegistration({
      email: accountData.email,
      phone: accountData.phone_number,
      country: accountData.country,
    });
    resendLoading.value = false;
    startResendCountdown();
  } catch (err) {
    resendLoading.value = false;
    console.error("Resend failed:", err);
  }
};

// ─── Step 2: Verify OTP Handler ────────────────────────────
const handleVerifyOtpSubmit = async (otpCode) => {
  if (isSubmitting.value || authStore.loading) return;

  otpError.value = "";
  isSubmitting.value = true;

  try {
    const res = await authStore.verifyRegistrationOtp({
      email: accountData.email,
      otp: otpCode,
    });
    verifiedOtp.value = otpCode;
    currentStep.value = 3;
  } catch (err) {
    otpError.value = err?.message || err?.error || "Invalid OTP code.";
  } finally {
    isSubmitting.value = false;
  }
};

// ─── Step 3: Complete Profile & Register ───────────────────
const handleCompleteProfileSubmit = async (profileData) => {
  if (isSubmitting.value || authStore.loading) return;

  // Convert DD-MM-YYYY to YYYY-MM-DD for backend standard
  let formattedDob = profileData.date_of_birth;
  if (/^\d{2}-\d{2}-\d{4}$/.test(formattedDob)) {
    const parts = formattedDob.split("-");
    formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  const payload = {
    name: profileData.name,
    password: profileData.password,
    date_of_birth: formattedDob,
    gender: profileData.gender,
    email: accountData.email,
    phone_number: accountData.phone_number,
    country: accountData.country,
    role: accountData.role || "client",
    otp: verifiedOtp.value,
  };

  if (accountData.referral_code) {
    payload.referral_code = accountData.referral_code;
  }
  if (trackingId.value) {
    payload.tracking_id = trackingId.value;
  }
  if (Object.keys(additionalInfo.value).length > 0) {
    payload.additional_info = additionalInfo.value;
  }

  isSubmitting.value = true;
  try {
    await authStore.completeRegistration(payload);
  } catch (err) {
    console.error("Registration completion failed:", err);
  } finally {
    isSubmitting.value = false;
  }
};

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
