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

    <!-- Heading & Subheading -->
    <div class="text-center mb-5">
      <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight">
        Complete Your Profile
      </h1>
      <p class="text-xs sm:text-[13px] text-secondary-text mt-1 font-normal">
        Tell us a few basic details to finish setting up your account.
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-3.5">
      <!-- Your Name Field -->
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1">
          Your Name
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Eg. Sneha Verma"
          class="w-full px-3.5 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors"
          :class="{ '!border-primary-red ring-1 ring-primary-red/20': errors.name }"
          @focus="errors.name = ''"
        />
        <p v-if="errors.name" class="text-[11px] text-primary-red mt-0.5">
          {{ errors.name }}
        </p>
      </div>

      <!-- Date Of Birth Field -->
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1">
          Date Of Birth
        </label>
        <input
          v-model="form.date_of_birth"
          type="text"
          placeholder="DD-MM-YYYY"
          maxlength="10"
          class="w-full px-3.5 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors"
          :class="{ '!border-primary-red ring-1 ring-primary-red/20': errors.date_of_birth }"
          @input="handleDobInput"
          @focus="errors.date_of_birth = ''"
        />
        <p v-if="errors.date_of_birth" class="text-[11px] text-primary-red mt-0.5">
          {{ errors.date_of_birth }}
        </p>
      </div>

      <!-- Gender Field -->
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1">
          Gender
        </label>
        <BaseSelect
          v-model="form.gender"
          :options="genderOptions"
          placeholder="Select"
          rounded="lg"
          height="42px"
          class="w-full"
          :class="{ '!border-primary-red': errors.gender }"
          @update:modelValue="errors.gender = ''"
        />
        <p v-if="errors.gender" class="text-[11px] text-primary-red mt-0.5">
          {{ errors.gender }}
        </p>
      </div>

      <!-- Password Field -->
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1">
          Password
        </label>
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Create password"
            class="w-full px-3.5 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors pr-10"
            :class="{ '!border-primary-red ring-1 ring-primary-red/20': errors.password }"
            @focus="errors.password = ''"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition-colors p-1 cursor-pointer"
            tabindex="-1"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="16" />
            <Eye v-else :size="16" />
          </button>
        </div>
        <p v-if="errors.password" class="text-[11px] text-primary-red mt-0.5">
          {{ errors.password }}
        </p>
      </div>

      <!-- Get Started Button -->
      <button
        type="submit"
        :disabled="loading"
        style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
        class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="loading" :size="16" class="animate-spin text-slate-950" />
        <span>{{ loading ? "Creating Account…" : "Get Started" }}</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { Loader2, Eye, EyeOff } from "lucide-vue-next";
import { useThemeStore } from "@/stores/shared/theme";
import BaseSelect from "@/components/base/BaseSelect.vue";

defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["submit"]);

const themeStore = useThemeStore();
const isDarkTheme = computed(() => themeStore.isDark);
const showPassword = ref(false);

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const form = reactive({
  name: "",
  date_of_birth: "",
  gender: "",
  password: "",
});

const errors = reactive({
  name: "",
  date_of_birth: "",
  gender: "",
  password: "",
});

const handleDobInput = (e) => {
  let val = e.target.value.replace(/\D/g, "");
  if (val.length > 8) val = val.slice(0, 8);
  if (val.length >= 5) {
    form.date_of_birth = `${val.slice(0, 2)}-${val.slice(2, 4)}-${val.slice(4)}`;
  } else if (val.length >= 3) {
    form.date_of_birth = `${val.slice(0, 2)}-${val.slice(2)}`;
  } else {
    form.date_of_birth = val;
  }
};

const handleSubmit = () => {
  errors.name = "";
  errors.date_of_birth = "";
  errors.gender = "";
  errors.password = "";
  let valid = true;

  if (!form.name.trim()) {
    errors.name = "Name is required.";
    valid = false;
  }

  if (!form.date_of_birth) {
    errors.date_of_birth = "Date of birth is required.";
    valid = false;
  } else if (!/^\d{2}-\d{2}-\d{4}$/.test(form.date_of_birth)) {
    errors.date_of_birth = "Enter a valid date (DD-MM-YYYY).";
    valid = false;
  }

  if (!form.gender) {
    errors.gender = "Please select gender.";
    valid = false;
  }

  if (!form.password || form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
    valid = false;
  }

  if (!valid) return;

  emit("submit", {
    name: form.name.trim(),
    date_of_birth: form.date_of_birth,
    gender: form.gender,
    password: form.password,
  });
};
</script>
