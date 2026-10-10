<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User } from "lucide-vue-next";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import apiRequest from "@/api/request";
import authToken from "@/common/authToken";
import urls from "@/api/urls";
import { useRouter, useRoute } from "vue-router";
import { useThemeStore } from "@/stores/shared/theme";
import logoLight from "/logo_full-light.svg";
import BaseIcon from "@/components/base/BaseIcon.vue";

const bgImage = "https://media.panthercapitals.com/media/4/file_1787835189_13089f.png";

// Immediate image preload optimization
if (typeof window !== "undefined") {
  const imgPreloader = new Image();
  imgPreloader.src = bgImage;
}

import { useLoaderStore } from "@/stores/shared/loader";
import { useProfileStore } from "@/stores/shared/profile";
import { getSafeRedirectPath } from "@/utils/security";

const router = useRouter();
const route = useRoute();
const snackbar = useSnackbarStore();
const loaderStore = useLoaderStore();
const profileStore = useProfileStore();

const loading = ref(false);
const showPassword = ref(false);

const themeStore = useThemeStore();
const isDarkTheme = computed(() => themeStore.isDark);

// ─── Role Detection ───────────────────────────────────
const isFundManager = computed(() => {
  const userType = String(route.params.userType || route.query.role || "").toLowerCase();
  const path = route.path.toLowerCase();
  return (
    userType === "fm" ||
    userType === "fund-manager" ||
    path === "/fm-login" ||
    path.endsWith("/fm") ||
    path.includes("/fund-manager")
  );
});

// ─── Forgot Password State ─────────────────────────────
const showForgotDialog = ref(false);
const forgotEmail = ref("");
const forgotLoading = ref(false);
const forgotError = ref("");
const forgotSuccess = ref("");

const form = reactive({
  email: "",
  password: "",
  role: "client",
});

const errors = reactive({
  email: "",
  password: "",
});

watch(
  isFundManager,
  (val) => {
    form.role = val ? "fm" : "client";
  },
  { immediate: true },
);

// ─── Validation ─────────────────────────────────────────
const validate = () => {
  let valid = true;

  if (!form.email) {
    errors.email = "Email is required.";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
    valid = false;
  }

  if (!form.password) {
    errors.password = "Password is required.";
    valid = false;
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
    valid = false;
  }

  return valid;
};

const clearError = (field) => {
  errors[field] = "";
};

// ─── API Call ─────────────────────────────────────────
const handleLogin = () => {
  if (!validate()) return;

  loading.value = true;

  const successHandler = async (res) => {
    authToken.setToken(res.access_token || res?.data?.access_token || res?.token);

    // Initial role
    localStorage.setItem("role", form.role);

    // Load dark theme by default if no theme preference is saved
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "dark");
      themeStore.init();
    }

    // Trigger standard brand page loader while profile is fetched
    loaderStore.showLoader();

    let isIbUser = false;
    if (form.role !== "fm") {
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
        console.error("Failed to fetch user profile during login:", err);
      }
    }

    loading.value = false;

    const finalRole = form.role === "fm" ? "fm" : isIbUser ? "ib" : "client";
    localStorage.setItem("role", finalRole);
    profileStore.setActiveRole(finalRole);

    // Check if there's a redirect URL (e.g., from join link)
    const rawRedirect = route.query.redirect || sessionStorage.getItem("returnUrl");
    const redirectUrl = getSafeRedirectPath(rawRedirect);
    if (redirectUrl) {
      sessionStorage.removeItem("returnUrl");
      router.push(redirectUrl);
    } else {
      router.push(
        form.role === "fm"
          ? "/fm-dashboard"
          : isIbUser
            ? "/ib-dashboard"
            : "/dashboard",
      );
    }
  };

  const failureHandler = (err) => {
    loading.value = false;
    const msg = err?.message || err?.error || (typeof err === 'string' ? err : 'Something went wrong.');
    snackbar.show(msg, "error");
  };

  apiRequest(urls.KEYS.POST, urls.auth.login, {
    data: {
      email: form.email,
      password: form.password,
      role: form.role,
    },
    isTokenRequired: false,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};

const goToRegister = () => {
  if (isFundManager.value) {
    router.push("/register/fm");
  } else {
    router.push("/register");
  }
};

const goToFmLogin = () => {
  router.push("/login/fm");
};

const goToInvestorLogin = () => {
  router.push("/login");
};

const checkTheme = () => {
  themeStore.init();
};

const validateForgot = () => {
  forgotError.value = "";
  if (!forgotEmail.value) {
    forgotError.value = "Email is required.";
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.value)) {
    forgotError.value = "Enter a valid email address.";
    return false;
  }
  return true;
};

const handleForgotPassword = () => {
  if (!validateForgot()) return;
  forgotLoading.value = true;
  forgotSuccess.value = "";

  apiRequest(urls.KEYS.POST, urls.auth.forgotPassword, {
    data: { email: forgotEmail.value },
    isTokenRequired: false,
    onSuccess: (res) => {
      forgotLoading.value = false;
      forgotSuccess.value =
        res?.message ||
        "Password reset email sent successfully. Please check your inbox.";
      snackbar.show(forgotSuccess.value, "success");
    },
    onFailure: (err) => {
      forgotLoading.value = false;
      forgotError.value = err?.error || err?.message || "Something went wrong.";
      snackbar.show(forgotError.value, "error");
    },
  });
};

const handleSecretOrTokenLogin = (tokenOrSecret) => {
  // If backend API URL is passed in query (e.g. ?api=https://... or ?base_url=...)
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

  const code = String(tokenOrSecret || "").trim();
  if (!code) return;

  // 1) If it is already a valid 3-part JWT token
  if (code.split(".").length === 3) {
    authToken.setToken(code);
    localStorage.setItem("role", "client");

    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "dark");
      themeStore.init();
    }

    loaderStore.showLoader();
    const safeRedirect = getSafeRedirectPath(route.query.redirect);
    router.replace(safeRedirect || "/dashboard");
    return;
  }

  // 2) If it is a secret code, exchange via POST /client/login/user
  loading.value = true;
  loaderStore.showLoader();

  apiRequest(urls.KEYS.POST, urls.auth.loginUser, {
    data: { secret: code },
    role: "client",
    isTokenRequired: false,
    onSuccess: async (res) => {
      const accessToken =
        res?.data?.access_token ||
        res?.access_token ||
        res?.data?.token ||
        res?.token;

      if (accessToken) {
        authToken.setToken(accessToken);

        if (!localStorage.getItem("theme")) {
          localStorage.setItem("theme", "dark");
          themeStore.init();
        }

        let isIbUser = false;
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

        loading.value = false;
        const finalRole = isIbUser ? "ib" : "client";
        localStorage.setItem("role", finalRole);
        profileStore.setActiveRole(finalRole);

        snackbar.show(res?.message || "Logged in successfully", "success");

        const safeRedirect = getSafeRedirectPath(route.query.redirect);
        router.replace(
          safeRedirect || (isIbUser ? "/ib-dashboard" : "/dashboard")
        );
      } else {
        loading.value = false;
        loaderStore.hideLoader();
        snackbar.show(
          res?.message || "Failed to retrieve access token from login secret.",
          "error",
        );
      }
    },
    onFailure: (err) => {
      loading.value = false;
      loaderStore.hideLoader();
      snackbar.show(
        err?.error ||
          err?.message ||
          "Invalid or expired secret login code.",
        "error",
      );
    },
  });
};

onMounted(() => {
  checkTheme();

  // URL Token / Secret Auto-Login Check (User/Client Only)
  const tokenOrSecret = route.query.token || route.query.secret;
  if (tokenOrSecret) {
    handleSecretOrTokenLogin(tokenOrSecret);
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
  >
    <!-- Background Image -->
    <div class="absolute inset-0 bg-black/95">
      <img
        :src="bgImage"
        alt=""
        loading="eager"
        fetchpriority="high"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-black/20" />
    </div>

    <!-- Card -->
    <div
      class="relative w-full max-w-110 rounded-2xl border border-white/10 p-8 py-10"
      style="background: #ffffff1a; backdrop-filter: blur(234px)"
    >
      <!-- Logo + Brand -->
      <div class="text-center mb-7">
        <div class="flex justify-center mb-5">
          <img
            :src="logoLight"
            alt="Panther Capitals"
            class="h-10 object-contain"
          />
        </div>

        <h1 class="text-xl font-semibold text-white mb-1.5">
          {{ isFundManager ? "Fund Manager Login" : "Enter your email to continue" }}
        </h1>
        <p class="text-sm text-white/60">
          {{
            isFundManager
              ? "Log in to Panther Capital with your Fund Manager account."
              : "Log in to Panther Capital with your account."
          }}
        </p>
      </div>

      <!-- Form -->
      <div>
        <!-- Email -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-white mb-1.5">
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            placeholder="Enter your email"
            class="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-sm outline-none focus:border-white/40 transition-colors"
            :class="{ 'border-red-400': errors.email }"
            @focus="clearError('email')"
          />
          <p v-if="errors.email" class="text-xs mt-1.5 text-red-400">
            {{ errors.email }}
          </p>
        </div>

        <!-- Password -->
        <div class="mb-2">
          <label class="block text-sm font-medium text-white mb-1.5">
            Password
          </label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              class="w-full px-4 pr-10 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-sm outline-none focus:border-white/40 transition-colors"
              :class="{ 'border-red-400': errors.password }"
              @focus="clearError('password')"
              @keyup.enter="handleLogin"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors cursor-pointer p-1 z-10 flex items-center justify-center"
              @click="showPassword = !showPassword"
              aria-label="Toggle password visibility"
            >
              <BaseIcon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                :size="20"
                class="text-white"
              />
            </button>
          </div>
          <p v-if="errors.password" class="text-xs mt-1.5 text-red-400">
            {{ errors.password }}
          </p>
        </div>

        <!-- Forgot Password -->
        <div class="flex justify-end mb-5">
          <button
            type="button"
            class="text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
            @click="
              showForgotDialog = true;
              forgotEmail = '';
              forgotError = '';
              forgotSuccess = '';
            "
          >
            Forgot Password?
          </button>
        </div>

        <!-- Submit Button -->
        <button
          type="button"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black transition-all duration-200 hover:brightness-85 active:brightness-75 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style="background: linear-gradient(180deg, #e0ca3c 0%, #ffe74d 100%)"
          @click="handleLogin"
        >
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          <span>{{ loading ? "Logging in…" : "Submit" }}</span>
        </button>

        <!-- Divider -->
        <div class="relative my-4 flex items-center justify-center">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/15" />
          </div>
          <span class="relative bg-black/40 px-3 text-xs text-white/60 rounded-full border border-white/10 backdrop-blur-md">
            or
          </span>
        </div>

        <!-- Prominent Switch Role Button -->
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer group"
          @click="isFundManager ? goToInvestorLogin() : goToFmLogin()"
        >
          <span>{{ isFundManager ? "Login as Investor" : "Login as Fund Manager" }}</span>
          <ArrowRight :size="16" class="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <!-- Sign Up -->
      <p class="text-center text-sm text-white/70 mt-5">
        {{ isFundManager ? "Don't have a Fund Manager account?" : "Don't have an account?" }}
        <button
          class="text-white font-semibold ml-1 hover:underline cursor-pointer"
          @click="goToRegister"
        >
          Sign Up
        </button>
      </p>

      <!-- Disclaimer -->
      <p
        class="text-center text-[11px] text-white/40 mt-5 leading-relaxed px-2"
      >
        Panther Capitals Ltd we don't offer services to residents of certain
        countries, including: Syria, North Korea, Iran, Iraq, Mauritius, USA,
        Canada, Sudan, Myanmar, Yemen, Afghanistan, Vanuatu, and those within
        the European Economic Area (EEA).
      </p>

      <!-- Footer Links -->
      <div class="flex items-center justify-center gap-2 mt-4">
        <button
          class="text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          Terms & Condition
        </button>
        <span class="text-white/20 text-xs">|</span>
        <button
          class="text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          Privacy Policy
        </button>
        <span class="text-white/20 text-xs">|</span>
        <button
          class="text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          Risk Disclosure
        </button>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <Teleport to="body">
      <Transition name="overlay">
        <div
          v-if="showForgotDialog"
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          @click="showForgotDialog = false"
        >
          <div
            class="relative w-full max-w-100 rounded-2xl border border-white/10 p-8 shadow-2xl animate-fade-in"
            style="background: #ffffff1a; backdrop-filter: blur(234px)"
            @click.stop
          >
            <h2 class="text-xl font-semibold text-white mb-2">
              Forgot your password?
            </h2>
            <p class="text-xs text-white/60 mb-5 leading-relaxed">
              Enter the email associated with your account and we'll send you a
              secure link to reset your password.
            </p>

            <div
              v-if="forgotSuccess"
              class="bg-green-500/10 border border-green-500/20 text-green-300 rounded-lg p-3 text-xs mb-6 text-center leading-relaxed"
            >
              {{ forgotSuccess }}
            </div>

            <template v-else>
              <div class="mb-5">
                <label class="block text-xs font-semibold text-white mb-1.5"
                  >Email Address</label
                >
                <input
                  v-model="forgotEmail"
                  type="email"
                  placeholder="Enter your email"
                  class="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-xs outline-none focus:border-white/40 transition-colors"
                  :class="{ 'border-red-400': forgotError }"
                  @input="forgotError = ''"
                  @keyup.enter="handleForgotPassword"
                />
                <p v-if="forgotError" class="text-[11px] mt-1.5 text-red-400">
                  {{ forgotError }}
                </p>
              </div>

              <button
                type="button"
                :disabled="forgotLoading"
                class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-black transition-all duration-200 hover:brightness-85 active:brightness-75 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
                style="
                  background: linear-gradient(180deg, #e0ca3c 0%, #ffe74d 100%);
                "
                @click="handleForgotPassword"
              >
                <Loader2 v-if="forgotLoading" :size="14" class="animate-spin" />
                <span>{{
                  forgotLoading ? "Sending…" : "Send Reset Link"
                }}</span>
              </button>
            </template>

            <button
              @click="showForgotDialog = false"
              class="w-full mt-4 text-center text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Force input placeholder to be white */
input::placeholder {
  color: rgba(255, 255, 255, 0.8) !important;
  opacity: 1 !important;
}

/* Prevent browser autofill from turning background white with black text */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-text-fill-color: #ffffff !important;
  -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.12) inset !important;
  box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.12) inset !important;
  transition: background-color 5000s ease-in-out 0s;
  caret-color: white;
}
</style>
