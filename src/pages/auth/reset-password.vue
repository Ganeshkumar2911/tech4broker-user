<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-vue-next";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import apiRequest from "@/api/request";
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

const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const token = computed(() => route.query.token || "");

const form = reactive({
  new_password: "",
  confirm_password: "",
});

const errors = reactive({
  new_password: "",
  confirm_password: "",
});

const validate = () => {
  let valid = true;
  errors.new_password = "";
  errors.confirm_password = "";

  if (!form.new_password) {
    errors.new_password = "New password is required.";
    valid = false;
  } else if (form.new_password.length < 6) {
    errors.new_password = "Password must be at least 6 characters.";
    valid = false;
  }

  if (!form.confirm_password) {
    errors.confirm_password = "Confirm password is required.";
    valid = false;
  } else if (form.new_password !== form.confirm_password) {
    errors.confirm_password = "Passwords do not match.";
    valid = false;
  }

  return valid;
};

const handleResetPassword = () => {
  if (!token.value) {
    snackbar.show("Reset token is missing from the URL.", "error");
    return;
  }

  if (!validate()) return;

  loading.value = true;

  const successHandler = (res) => {
    loading.value = false;
    snackbar.show(
      res?.message || "Password reset successfully! Please log in.",
      "success",
    );
    router.push("/login");
  };

  const failureHandler = (err) => {
    loading.value = false;
    snackbar.show(
      err?.error || err?.message || "Something went wrong.",
      "error",
    );
  };

  apiRequest(urls.KEYS.POST, urls.auth.resetPassword, {
    data: {
      token: token.value,
      new_password: form.new_password,
      confirm_password: form.confirm_password,
    },
    isTokenRequired: false,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};

onMounted(() => {
  if (!token.value) {
    snackbar.show("Reset token is missing or expired.", "error");
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

        <h1 class="text-2xl font-semibold text-white mb-1.5">Reset Password</h1>
        <p class="text-sm text-white/60">Enter your new password below.</p>
      </div>

      <!-- Form -->
      <div>
        <!-- New Password -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-white mb-1.5">
            New Password
          </label>
          <div class="relative">
            <input
              v-model="form.new_password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              class="w-full px-4 pr-10 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-sm outline-none focus:border-white/40 transition-colors"
              :class="{ 'border-red-400': errors.new_password }"
              @input="errors.new_password = ''"
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
          <p v-if="errors.new_password" class="text-xs mt-1.5 text-red-400">
            {{ errors.new_password }}
          </p>
        </div>

        <!-- Confirm Password -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-white mb-1.5">
            Confirm Password
          </label>
          <div class="relative">
            <input
              v-model="form.confirm_password"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              class="w-full px-4 pr-10 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-sm outline-none focus:border-white/40 transition-colors"
              :class="{ 'border-red-400': errors.confirm_password }"
              @input="errors.confirm_password = ''"
              @keyup.enter="handleResetPassword"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors cursor-pointer p-1 z-10 flex items-center justify-center"
              @click="showConfirmPassword = !showConfirmPassword"
              aria-label="Toggle confirm password visibility"
            >
              <BaseIcon
                :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                :size="20"
                class="text-white"
              />
            </button>
          </div>
          <p v-if="errors.confirm_password" class="text-xs mt-1.5 text-red-400">
            {{ errors.confirm_password }}
          </p>
        </div>

        <!-- Submit Button -->
        <button
          type="button"
          :disabled="loading || !token"
          class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black transition-all duration-200 hover:brightness-85 active:brightness-75 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style="background: linear-gradient(180deg, #e0ca3c 0%, #ffe74d 100%)"
          @click="handleResetPassword"
        >
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          <span>{{ loading ? "Resetting…" : "Reset Password" }}</span>
        </button>
      </div>

      <!-- Back to Login -->
      <p class="text-center text-sm text-white/70 mt-5">
        Remembered password?
        <router-link
          to="/login"
          class="text-white font-semibold ml-1 hover:underline"
        >
          Log In
        </router-link>
      </p>
    </div>
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
  transition: background-color 5000s ease-in-out 0s;
  caret-color: white;
}
</style>
