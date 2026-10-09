<template>
  <div class="min-h-screen min-h-[100dvh] w-full lg:h-screen lg:overflow-hidden flex bg-card-background text-primary-text">
    <!-- Left Column: Form Section -->
    <div
      class="w-full lg:w-3/4 min-h-screen min-h-[100dvh] lg:h-full flex flex-col items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8 overflow-y-auto no-scrollbar bg-card-background"
    >
      <!-- Unified Center Container for Form Elements & Disclaimer -->
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

        <!-- Heading & Subheading -->
        <div class="text-center mb-5 sm:mb-6">
          <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
            Enter your email to continue
          </h1>
          <p class="text-xs sm:text-[13px] text-secondary-text mt-1 font-normal">
            Log in to Panther Capital with your account.
          </p>
        </div>

        <!-- Role Tab Switcher (Investor / Fundmanager) -->
        <div class="mb-5 sm:mb-6">
          <BaseTabs
            v-model="form.role"
            :tabs="roleTabs"
            overRideClass="w-full !flex !min-w-full !p-1 !bg-background !rounded-full"
            buttonClass="flex-1 !h-auto py-2 text-xs sm:text-sm font-semibold !rounded-full transition-all duration-150 justify-center text-center cursor-pointer"
            activeClass="bg-button text-white"
            inactiveClass="text-secondary-text hover:text-primary-text"
          />
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-3.5">
          <!-- Email Field -->
          <div>
            <label class="block text-xs font-semibold text-primary-text mb-1.5">
              Email
            </label>
            <div class="relative">
              <input
                v-model="form.email"
                type="email"
                placeholder="Enter Your Email here"
                class="w-full px-3.5 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors"
                :class="{ '!border-primary-red ring-1 ring-primary-red/20': errors.email }"
                @focus="clearError('email')"
              />
            </div>
            <p v-if="errors.email" class="text-[11px] text-primary-red mt-1">
              {{ errors.email }}
            </p>
          </div>

          <!-- Password Field -->
          <div>
            <label class="block text-xs font-semibold text-primary-text mb-1.5">
              Password
            </label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="**********"
                class="w-full px-3.5 pr-10 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors"
                :class="{ '!border-primary-red ring-1 ring-primary-red/20': errors.password }"
                @focus="clearError('password')"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text cursor-pointer transition-colors p-0.5"
                @click="showPassword = !showPassword"
                aria-label="Toggle password visibility"
              >
                <EyeOff v-if="showPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
            <p v-if="errors.password" class="text-[11px] text-primary-red mt-1">
              {{ errors.password }}
            </p>
          </div>

          <!-- Forgot Password Link -->
          <div class="flex justify-end pt-0.5">
            <router-link
              :to="form.role === 'fm' ? '/forgot-password?role=fm' : '/forgot-password'"
              class="text-xs font-bold text-primary-text hover:underline hover:text-primary transition-colors"
            >
              Forgot Password?
            </router-link>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="authStore.loading || isSubmitting"
            style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
            class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="authStore.loading || isSubmitting" :size="16" class="animate-spin text-slate-950" />
            <span>{{ (authStore.loading || isSubmitting) ? "Signing In…" : "Submit" }}</span>
          </button>

          <!-- Sign Up Switch Link -->
          <p class="text-center text-xs text-secondary-text pt-2">
            Don't have an account?
            <router-link
              :to="form.role === 'fm' ? '/register?role=fm' : '/register'"
              class="text-primary-text font-bold underline ml-1 cursor-pointer hover:text-primary-hover transition-colors"
            >
              Sign Up
            </router-link>
          </p>
        </form>

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
      <AuthSidePanel :role="form.role" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Eye, EyeOff, Loader2 } from "lucide-vue-next";
import { useAuthStore } from "@/stores/shared/auth";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import AuthSidePanel from "@/components/auth/AuthSidePanel.vue";
import BaseTabs from "@/components/base/BaseTabs.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();

const showPassword = ref(false);
const isSubmitting = ref(false);

const roleTabs = [
  { label: "Investor", value: "client" },
  { label: "Fundmanager", value: "fm" },
];

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
  () => route.query,
  (query) => {
    if (query?.role === "fm" || query?.role === "fund-manager" || route.path.includes("/fm")) {
      form.role = "fm";
    } else if (query?.role === "client" || query?.role === "investor") {
      form.role = "client";
    }
    if (query?.email) {
      form.email = query.email;
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("panther_inactivity_logout")) {
    sessionStorage.removeItem("panther_inactivity_logout");
    snackbar.show("You have been logged out due to inactivity.", "info");
  }

  const tokenOrSecret = route.query.token || route.query.secret || route.query.code || route.query.access_token;
  if (tokenOrSecret) {
    router.replace({
      path: "/login/user",
      query: route.query,
    });
  }
});

const clearError = (field) => {
  errors[field] = "";
};

const validate = () => {
  let isValid = true;
  errors.email = "";
  errors.password = "";

  if (!form.email.trim()) {
    errors.email = "Email is required.";
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
    isValid = false;
  }

  if (!form.password) {
    errors.password = "Password is required.";
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (isSubmitting.value || authStore.loading) return;
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    await authStore.login({
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      redirect: route.query.redirect,
    });
  } catch (err) {
    console.error("Login failed:", err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
