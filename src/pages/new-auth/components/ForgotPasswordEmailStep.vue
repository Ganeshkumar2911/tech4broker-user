<template>
  <div class="animate-fade-in">
    <!-- Logo -->
    <div class="flex justify-center mb-6 sm:mb-7">
      <img
        src="/dar-light-logo.svg"
        alt="Panther Capitals"
        class="h-8 sm:h-9 object-contain"
        onerror="this.src='/favicon.svg'"
      />
    </div>

    <!-- Heading -->
    <div class="text-center mb-6">
      <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
        Forgot Password?
      </h1>
      <p class="text-xs sm:text-sm text-secondary-text mt-1.5 font-normal leading-relaxed">
        Enter your registered email and we'll send you a link to reset your password.
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1.5">
          Email
        </label>
        <input
          v-model="localEmail"
          type="email"
          placeholder="Enter Your Email here"
          class="w-full px-3.5 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors"
          :class="{ '!border-primary-red ring-1 ring-primary-red/20': errorMsg }"
          @focus="errorMsg = ''"
        />
        <p v-if="errorMsg" class="text-[11px] text-primary-red mt-1">
          {{ errorMsg }}
        </p>
      </div>

      <!-- Send Reset Link Button -->
      <button
        type="submit"
        :disabled="loading"
        style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
        class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="loading" :size="16" class="animate-spin text-slate-950" />
        <span>{{ loading ? "Sending Link…" : "Send Reset Link" }}</span>
      </button>

      <!-- Sign Up Link -->
      <p class="text-center text-xs text-secondary-text pt-1">
        Don't have an account?
        <router-link
          to="/register"
          class="text-primary-text font-bold underline ml-1 cursor-pointer hover:text-primary transition-colors"
        >
          Sign Up
        </router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { Loader2 } from "lucide-vue-next";
import { useThemeStore } from "@/stores/shared/theme";

const props = defineProps({
  email: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["submit", "update:email"]);

const themeStore = useThemeStore();
const isDarkTheme = computed(() => themeStore.isDark);

const localEmail = ref(props.email);
const errorMsg = ref(props.error);

watch(
  () => props.email,
  (val) => {
    localEmail.value = val;
  },
);

watch(
  () => props.error,
  (val) => {
    errorMsg.value = val;
  },
);

watch(localEmail, (val) => {
  emit("update:email", val);
});

const handleSubmit = () => {
  errorMsg.value = "";
  if (!localEmail.value.trim()) {
    errorMsg.value = "Email is required.";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail.value.trim())) {
    errorMsg.value = "Enter a valid email address.";
    return;
  }
  emit("submit", localEmail.value.trim());
};
</script>
