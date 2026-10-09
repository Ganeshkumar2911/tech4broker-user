<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Globe,
} from "lucide-vue-next";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useLoaderStore } from "@/stores/shared/loader";
import { useThemeStore } from "@/stores/shared/theme";
import { useProfileStore } from "@/stores/shared/profile";
import apiRequest from "@/api/request";
import authToken from "@/common/authToken";
import urls from "@/api/urls";
const bgImage = "https://media.panthercapitals.com/media/4/file_1787835189_13089f.png";

// Immediate image preload optimization
if (typeof window !== "undefined") {
  const imgPreloader = new Image();
  imgPreloader.src = bgImage;
}
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import { getSafeRedirectPath } from "@/utils/security";

const router = useRouter();
const route = useRoute();
const snackbar = useSnackbarStore();
const loaderStore = useLoaderStore();
const themeStore = useThemeStore();
const profileStore = useProfileStore();

const loading = ref(false);
const showPassword = ref(false);
const isDarkTheme = computed(() => themeStore.isDark);

const presetUrls = [
  { label: "Vaibhav Anand", value: "https://zpj8dpf6-2504.inc1.devtunnels.ms" },
  {
    label: "Pulkit 💦",
    value: "https://848ncvt5-2504.euw.devtunnels.ms",
  },
  {
    label: "Lokesh",
    value: "https://ls01t281-2504.inc1.devtunnels.ms",
  },
  {
    label: "Production",
    value: "https://1pz4zm0b-2504.euw.devtunnels.ms",
  },
  {
    label: "Sarkari",
    value: "https://w2llv2cm-2504.inc1.devtunnels.ms",
  },
];

const resetToDefault = () => {
  form.baseUrl = "";
  localStorage.removeItem("custom_base_url");
  clearError("baseUrl");
};

const hasRedirect = computed(() => !!route.query.redirect);

const form = reactive({
  baseUrl: localStorage.getItem("custom_base_url") || "",
  email: "",
  password: "",
  role: "client",
});

const errors = reactive({
  baseUrl: "",
  email: "",
  password: "",
});

// ─── Validation ─────────────────────────────────────────
const validate = () => {
  let valid = true;

  if (!form.baseUrl) {
    errors.baseUrl = "Base URL is required.";
    valid = false;
  } else if (!/^https?:\/\//i.test(form.baseUrl)) {
    errors.baseUrl = "Base URL must start with http:// or https://";
    valid = false;
  }

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

  // Save base URL and set role to 'client' so login API URL is always /client/login
  localStorage.setItem("custom_base_url", form.baseUrl.trim());

  const successHandler = async (res) => {
    authToken.setToken(res.access_token || res?.data?.access_token || res?.token);
    localStorage.setItem("role", form.role);

    // Load dark theme by default if no theme preference is saved
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "dark");
      themeStore.init();
    }

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
        console.error("Failed to fetch user profile in dev-login:", err);
      }
    }

    loading.value = false;

    const finalRole = form.role === "fm" ? "fm" : isIbUser ? "ib" : "client";
    localStorage.setItem("role", finalRole);
    profileStore.setActiveRole(finalRole);

    // Check if there's a redirect URL
    const rawRedirect = route.query.redirect || sessionStorage.getItem("returnUrl");
    const redirectUrl = getSafeRedirectPath(rawRedirect);
    const targetRoute =
      redirectUrl ||
      (form.role === "fm"
        ? "/fm-dashboard"
        : isIbUser
          ? "/ib-dashboard"
          : "/dashboard");
    if (redirectUrl) {
      sessionStorage.removeItem("returnUrl");
    }

    router.push(targetRoute).catch(() => {
      window.location.href = targetRoute;
    });
  };

  const failureHandler = (err) => {
    loading.value = false;
    snackbar.show(
      err?.error || err?.message || "Something went wrong.",
      "error",
    );
  };

  apiRequest(urls.KEYS.POST, urls.auth.login, {
    data: {
      email: form.email,
      password: form.password,
      role: form.role,
    },
    role: "client",
    isTokenRequired: false,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};

const goToStandardLogin = () => {
  router.push("/login");
};

const checkTheme = () => {
  themeStore.init();
};

onMounted(() => {
  checkTheme();
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
      class="relative w-full max-w-[440px] rounded-2xl border border-white/10 p-8 py-10"
      style="background: #ffffff1a; backdrop-filter: blur(134px)"
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

        <h1
          class="text-2xl font-semibold text-white mb-1.5 flex items-center justify-center gap-2"
        >
          Developer Login
        </h1>
        <p class="text-sm text-white/60">
          Enter custom base URL and credentials to login.
        </p>
      </div>

      <!-- Form -->
      <div>
        <!-- Base URL Override -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-1.5">
            <label class="block text-sm font-medium text-white">
              Target Base URL
            </label>
            <button
              v-if="form.baseUrl"
              type="button"
              @click="resetToDefault"
              class="text-xs text-red-400 hover:text-red-300 font-medium transition cursor-pointer"
            >
              Reset to Default
            </button>
          </div>

          <!-- Preset Dropdown + Custom Input -->
          <div class="space-y-2">
            <BaseSelect
              v-model="form.baseUrl"
              :options="presetUrls"
              placeholder="Select environment preset..."
              searchable
              variant="glass"
              rounded="lg"
              @update:modelValue="clearError('baseUrl')"
            />

            <div class="relative">
              <input
                v-model="form.baseUrl"
                type="text"
                placeholder="Or enter custom URL..."
                class="w-full px-4 pr-10 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-white/40 transition-colors"
                :class="{ 'border-red-400': errors.baseUrl }"
                @focus="clearError('baseUrl')"
                @keyup.enter="handleLogin"
              />
              <div
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
              >
                <Globe :size="15" />
              </div>
            </div>
          </div>

          <p v-if="errors.baseUrl" class="text-xs mt-1.5 text-red-400">
            {{ errors.baseUrl }}
          </p>
        </div>

        <!-- Email -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-white mb-1.5">
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            placeholder="Enter"
            class="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-white/40 transition-colors"
            :class="{ 'border-red-400': errors.email }"
            @focus="clearError('email')"
          />
          <p v-if="errors.email" class="text-xs mt-1.5 text-red-400">
            {{ errors.email }}
          </p>
        </div>

        <!-- Password -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-white mb-1.5">
            Password
          </label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              class="w-full px-4 pr-10 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 text-sm outline-none focus:border-white/40 transition-colors"
              :class="{ 'border-red-400': errors.password }"
              @focus="clearError('password')"
              @keyup.enter="handleLogin"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="15" />
              <Eye v-else :size="15" />
            </button>
          </div>
          <p v-if="errors.password" class="text-xs mt-1.5 text-red-400">
            {{ errors.password }}
          </p>
        </div>

        <!-- Role Toggle -->
        <div v-if="!hasRedirect" class="mb-5">
          <label class="block text-sm font-medium text-white mb-2">
            Login as
          </label>
          <div class="flex p-1 bg-white/10 border border-white/20 rounded-xl">
            <button
              type="button"
              class="flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer"
              :class="
                form.role === 'client'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              "
              @click="form.role = 'client'"
            >
              Investor
            </button>
            <button
              type="button"
              class="flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer"
              :class="
                form.role === 'fm'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              "
              @click="form.role = 'fm'"
            >
              Fund Manager
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="button"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
          style="background: linear-gradient(180deg, #e0ca3c 0%, #ffe74d 100%)"
          @click="handleLogin"
        >
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          <span>{{ loading ? "Logging in…" : "Submit" }}</span>
        </button>
      </div>

      <!-- Back to Standard Login -->
      <p class="text-center text-sm text-white/70 mt-5">
        Go back to
        <button
          class="text-white font-semibold ml-1 hover:underline cursor-pointer"
          @click="goToStandardLogin"
        >
          Standard Login
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
    </div>
  </div>
</template>
