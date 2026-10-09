<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Loader2, AlertCircle, LogIn } from "lucide-vue-next";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useThemeStore } from "@/stores/shared/theme";
import { useProfileStore } from "@/stores/shared/profile";
import { getSafeRedirectPath } from "@/utils/security";
import apiRequest from "@/api/request";
import authToken from "@/common/authToken";
import urls from "@/api/urls";
import logoLight from "/logo_full-light.svg";

const bgImage = "https://media.panthercapitals.com/media/4/file_1787835189_13089f.png";

// Immediate image preload optimization
if (typeof window !== "undefined") {
  const imgPreloader = new Image();
  imgPreloader.src = bgImage;
}

const router = useRouter();
const route = useRoute();
const snackbar = useSnackbarStore();
const themeStore = useThemeStore();
const profileStore = useProfileStore();

const loading = ref(true);
const errorMessage = ref("");

const handleSecretLogin = () => {
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

  if (!localStorage.getItem("theme")) {
    localStorage.setItem("theme", "dark");
  }
  themeStore.init();

  if (!secret) {
    loading.value = false;
    errorMessage.value = "Secret authentication code is missing from the URL.";
    snackbar.show(errorMessage.value, "error");
    return;
  }

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

  // 1) If it is already a direct 3-part JWT token
  if (secret.split(".").length === 3) {
    authToken.setToken(secret);
    const role =
      String(route.query.role || "").toLowerCase() === "fm" ? "fm" : "client";
    localStorage.setItem("role", role);
    snackbar.show("Dashboard logged in successfully", "success");

    window.location.href = getTargetUrl(role);
    return;
  }

  // 2) Secret code exchange via POST /client/login/user
  apiRequest(urls.KEYS.POST, urls.auth.loginUser, {
    data: { secret },
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
          res?.message || "Dashboard logged in successfully",
          "success"
        );

        // Full page redirect ensures fresh stores and state
        window.location.href = getTargetUrl(role);
      } else {
        loading.value = false;
        errorMessage.value =
          res?.message || "Secret login failed: access token not received.";
        snackbar.show(errorMessage.value, "error");
      }
    },
    onFailure: (err) => {
      loading.value = false;
      errorMessage.value =
        err?.message || err?.error || "Invalid or expired secret key.";
      snackbar.show(errorMessage.value, "error");
    },
  });
};

const goToLogin = () => {
  router.push("/login");
};

onMounted(() => {
  handleSecretLogin();
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
      class="relative w-full max-w-[420px] rounded-2xl border border-white/10 p-8 py-10 text-center shadow-2xl"
      style="background: #ffffff1a; backdrop-filter: blur(234px)"
    >
      <!-- Logo -->
      <div class="flex justify-center mb-6">
        <img
          :src="logoLight"
          alt="Panther Capitals"
          class="h-10 object-contain"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-6 flex flex-col items-center">
        <div
          class="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4 relative"
        >
          <Loader2 class="w-7 h-7 text-amber-400 animate-spin" />
        </div>
        <h2 class="text-lg font-semibold text-white mb-1.5">
          Logging into Dashboard…
        </h2>
        <p class="text-xs text-white/60 leading-relaxed px-4">
          Please wait while we verify your authentication credentials and initialize your session.
        </p>
      </div>

      <!-- Error State -->
      <div v-else class="py-4 flex flex-col items-center">
        <div
          class="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400"
        >
          <AlertCircle class="w-7 h-7" />
        </div>
        <h2 class="text-lg font-semibold text-white mb-1.5">
          Authentication Failed
        </h2>
        <p class="text-xs text-white/70 mb-6 leading-relaxed px-2">
          {{ errorMessage }}
        </p>
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-black transition-all hover:brightness-85 active:brightness-75 cursor-pointer"
          style="background: linear-gradient(180deg, #e0ca3c 0%, #ffe74d 100%)"
          @click="goToLogin"
        >
          <LogIn :size="15" />
          <span>Back to Login</span>
        </button>
      </div>
    </div>
  </div>
</template>
