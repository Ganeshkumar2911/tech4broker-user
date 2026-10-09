<template>
  <div class="min-h-screen min-h-[100dvh] w-full lg:h-screen lg:overflow-hidden flex bg-card-background text-primary-text">
    <!-- Left Column: Form Section -->
    <div
      class="w-full lg:w-3/4 min-h-screen min-h-[100dvh] lg:h-full flex flex-col items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8 overflow-y-auto no-scrollbar bg-card-background"
    >
      <!-- Unified Center Container -->
      <div class="w-full max-w-[360px] sm:max-w-[400px] flex flex-col my-auto py-2">
        <!-- Logo -->
        <div class="flex justify-center mb-6 sm:mb-7">
          <img
            src="/dar-light-logo.svg"
            alt="Panther Capitals"
            class="h-8 sm:h-9 object-contain"
            onerror="this.src='/favicon.svg'"
          />
        </div>

        <!-- 1. Loading State -->
        <div v-if="loading" class="text-center py-6 animate-fade-in flex flex-col items-center">
          <div
            class="w-14 h-14 rounded-2xl bg-background border border-primary-border flex items-center justify-center mb-4 text-primary-text"
          >
            <Loader2 class="w-7 h-7 animate-spin" />
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight mb-1.5">
            Logging into Dashboard…
          </h1>
          <p class="text-xs sm:text-[13px] text-secondary-text font-normal leading-relaxed max-w-xs mx-auto">
            Please wait while we verify your authentication credentials and initialize your session.
          </p>
        </div>

        <!-- 2. Error State -->
        <div v-else-if="errorMessage" class="text-center py-4 animate-fade-in flex flex-col items-center">
          <div
            class="w-14 h-14 rounded-2xl bg-red-50 border border-primary-red/20 flex items-center justify-center mb-4 text-primary-red"
          >
            <AlertCircle class="w-7 h-7" />
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight mb-1.5">
            Authentication Failed
          </h1>
          <p class="text-xs sm:text-[13px] text-secondary-text font-normal leading-relaxed mb-6 max-w-xs mx-auto">
            {{ errorMessage }}
          </p>

          <!-- Action Buttons -->
          <div class="w-full space-y-2.5">
            <button
              type="button"
              style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
              class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.99]"
              @click="showManualInput = true; errorMessage = ''"
            >
              <Key :size="16" />
              <span>Enter Secret Manually</span>
            </button>

            <button
              type="button"
              class="w-full py-2.5 px-4 rounded-lg border border-primary-border bg-card-background hover:bg-background text-primary-text font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              @click="goToLogin"
            >
              <LogIn :size="16" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>

        <!-- 3. Manual Secret Code Input Form -->
        <div v-else class="animate-fade-in">
          <div class="text-center mb-5 sm:mb-6">
            <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
              Secret Login
            </h1>
            <p class="text-xs sm:text-[13px] text-secondary-text mt-1 font-normal">
              Enter your one-time authentication secret key.
            </p>
          </div>

          <form @submit.prevent="handleManualSubmit" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-primary-text mb-1.5">
                Secret Authentication Key
              </label>
              <div class="relative">
                <input
                  v-model="manualSecret"
                  type="password"
                  placeholder="Paste your secret code or token..."
                  class="w-full px-3.5 pr-10 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors font-mono"
                  :class="{ '!border-primary-red ring-1 ring-primary-red/20': manualError }"
                  @focus="manualError = ''"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text pointer-events-none">
                  <Key :size="16" />
                </div>
              </div>
              <p v-if="manualError" class="text-[11px] text-primary-red mt-1">
                {{ manualError }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="submitting"
              style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
              class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="submitting" :size="16" class="animate-spin text-slate-950" />
              <span>{{ submitting ? "Verifying…" : "Authenticate" }}</span>
            </button>

            <p class="text-center text-xs text-secondary-text pt-2">
              Go back to
              <router-link
                to="/login"
                class="text-primary-text font-bold underline ml-1 cursor-pointer hover:text-primary transition-colors"
              >
                Standard Login
              </router-link>
            </p>
          </form>
        </div>

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
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Loader2, AlertCircle, LogIn, Key } from "lucide-vue-next";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useThemeStore } from "@/stores/shared/theme";
import { useProfileStore } from "@/stores/shared/profile";
import { getSafeRedirectPath } from "@/utils/security";
import apiRequest from "@/api/request";
import authToken from "@/common/authToken";
import urls from "@/api/urls";
import AuthSidePanel from "@/components/auth/AuthSidePanel.vue";

const router = useRouter();
const route = useRoute();
const snackbar = useSnackbarStore();
const themeStore = useThemeStore();
const profileStore = useProfileStore();

const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref("");
const showManualInput = ref(false);
const manualSecret = ref("");
const manualError = ref("");

const getTargetUrl = (userRole) => {
  const safeRedirect = getSafeRedirectPath(route.query.redirect);
  if (
    safeRedirect &&
    safeRedirect !== "/" &&
    !safeRedirect.startsWith("/login") &&
    !safeRedirect.startsWith("/register") &&
    !safeRedirect.startsWith("/auto-login") &&
    !safeRedirect.startsWith("/dev-login") &&
    !safeRedirect.startsWith("/reset-password")
  ) {
    return safeRedirect;
  }
  return userRole === "fm"
    ? "/fm-dashboard"
    : userRole === "ib"
      ? "/ib-dashboard"
      : "/dashboard";
};

const executeAuthWithSecret = async (secret) => {
  const cleanSecret = String(secret || "").trim();
  if (!cleanSecret) {
    loading.value = false;
    submitting.value = false;
    showManualInput.value = true;
    return;
  }

  // 1) Direct 3-part JWT Token login
  if (cleanSecret.split(".").length === 3) {
    authToken.setToken(cleanSecret);
    const role =
      String(route.query.role || "").toLowerCase() === "fm" ? "fm" : "client";
    localStorage.setItem("role", role);
    snackbar.show("Logged in successfully", "success");
    window.location.href = getTargetUrl(role);
    return;
  }

  // 2) Secret code exchange via POST /client/login/user
  apiRequest(urls.KEYS.POST, urls.auth.loginUser, {
    data: { secret: cleanSecret },
    role: "client",
    isTokenRequired: false,
    onSuccess: async (res) => {
      const token =
        res?.access_token ||
        res?.data?.access_token ||
        res?.token ||
        res?.data?.token;

      if (token) {
        authToken.setToken(token);

        const returnedRole = String(
          res?.role || res?.data?.role || route.query.role || "client"
        ).toLowerCase();

        let isIbUser = false;
        if (returnedRole !== "fm") {
          try {
            const profileRes = await profileStore.fetchUserProfile(true);
            const profileData = profileRes?.data || profileRes;
            isIbUser = Boolean(
              profileData?.is_ib === true ||
              profileData?.is_ib === "true" ||
              profileData?.is_ib === 1 ||
              profileData?.is_ib === "1"
            );
          } catch (err) {
            console.error("Failed to fetch profile during secret login:", err);
          }
        }

        const role = returnedRole === "fm" ? "fm" : isIbUser ? "ib" : "client";

        localStorage.setItem("role", role);
        profileStore.setActiveRole(role);
        snackbar.show(
          res?.message || "Logged in successfully",
          "success"
        );

        window.location.href = getTargetUrl(role);
      } else {
        loading.value = false;
        submitting.value = false;
        errorMessage.value =
          res?.message || "Secret login failed: access token not received.";
        snackbar.show(errorMessage.value, "error");
      }
    },
    onFailure: (err) => {
      loading.value = false;
      submitting.value = false;
      errorMessage.value =
        err?.message || err?.error || "Invalid or expired secret authentication key.";
      snackbar.show(errorMessage.value, "error");
    },
  });
};

const handleInitialAuth = () => {
  // Check if target custom API URL was passed
  const customApi =
    route.query.api || route.query.base_url || route.query.backend_url;
  if (customApi) {
    const cleanApi = String(customApi)
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/(client|fm|ib|admin)$/, "");
    if (cleanApi) {
      localStorage.setItem("custom_base_url", cleanApi);
    }
  }

  const secret = String(
    route.query.secret ||
      route.query.token ||
      route.query.code ||
      route.query.key ||
      route.query.access_token ||
      route.query.auth_token ||
      route.params.secret ||
      route.params.token ||
      ""
  ).trim();

  if (!secret) {
    loading.value = false;
    showManualInput.value = true;
    return;
  }

  executeAuthWithSecret(secret);
};

const handleManualSubmit = () => {
  manualError.value = "";
  if (!manualSecret.value.trim()) {
    manualError.value = "Please enter your secret key.";
    return;
  }
  submitting.value = true;
  executeAuthWithSecret(manualSecret.value.trim());
};

const goToLogin = () => {
  router.push("/login");
};

onMounted(() => {
  handleInitialAuth();
});
</script>
