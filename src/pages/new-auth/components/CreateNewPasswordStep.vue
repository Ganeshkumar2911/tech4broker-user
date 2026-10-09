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
        Create New Password
      </h1>
      <p class="text-xs sm:text-sm text-secondary-text mt-1.5 font-normal leading-relaxed">
        Your new password must be different from your previously used passwords.
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-3.5">
      <!-- New Password -->
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1.5">
          New Password
        </label>
        <div class="relative">
          <input
            v-model="newPassword"
            :type="showNewPass ? 'text' : 'password'"
            placeholder="**********"
            class="w-full px-3.5 pr-10 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors"
            :class="{ '!border-primary-red ring-1 ring-primary-red/20': errors.newPassword }"
            @focus="errors.newPassword = ''"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text cursor-pointer transition-colors p-0.5"
            @click="showNewPass = !showNewPass"
          >
            <EyeOff v-if="showNewPass" :size="16" />
            <Eye v-else :size="16" />
          </button>
        </div>
        <p v-if="errors.newPassword" class="text-[11px] text-primary-red mt-1">
          {{ errors.newPassword }}
        </p>
      </div>

      <!-- Confirm Password -->
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1.5">
          Confirm Password
        </label>
        <div class="relative">
          <input
            v-model="confirmPassword"
            :type="showConfirmPass ? 'text' : 'password'"
            placeholder="**********"
            class="w-full px-3.5 pr-10 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors"
            :class="{ '!border-primary-red ring-1 ring-primary-red/20': errors.confirmPassword }"
            @focus="errors.confirmPassword = ''"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text cursor-pointer transition-colors p-0.5"
            @click="showConfirmPass = !showConfirmPass"
          >
            <EyeOff v-if="showConfirmPass" :size="16" />
            <Eye v-else :size="16" />
          </button>
        </div>
        <p v-if="errors.confirmPassword" class="text-[11px] text-primary-red mt-1">
          {{ errors.confirmPassword }}
        </p>
      </div>

      <!-- Hint -->
      <p class="text-[11px] text-secondary-text text-center pt-1 leading-relaxed">
        Didn't receive the email? Check your spam folder or try again.
      </p>

      <!-- Update Password Button -->
      <button
        type="submit"
        :disabled="loading"
        style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
        class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="loading" :size="16" class="animate-spin text-slate-950" />
        <span>{{ loading ? "Updating…" : "Update Password" }}</span>
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
import { ref, reactive, computed } from "vue";
import { Eye, EyeOff, Loader2 } from "lucide-vue-next";
import { useThemeStore } from "@/stores/shared/theme";

defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["submit"]);

const themeStore = useThemeStore();
const isDarkTheme = computed(() => themeStore.isDark);

const newPassword = ref("");
const confirmPassword = ref("");
const showNewPass = ref(false);
const showConfirmPass = ref(false);

const errors = reactive({
  newPassword: "",
  confirmPassword: "",
});

const handleSubmit = () => {
  errors.newPassword = "";
  errors.confirmPassword = "";
  let valid = true;

  if (!newPassword.value) {
    errors.newPassword = "New password is required.";
    valid = false;
  } else if (newPassword.value.length < 6) {
    errors.newPassword = "Password must be at least 6 characters.";
    valid = false;
  }

  if (!confirmPassword.value) {
    errors.confirmPassword = "Confirm password is required.";
    valid = false;
  } else if (newPassword.value !== confirmPassword.value) {
    errors.confirmPassword = "Passwords do not match.";
    valid = false;
  }

  if (!valid) return;

  emit("submit", {
    newPassword: newPassword.value,
    confirmPassword: confirmPassword.value,
  });
};
</script>
