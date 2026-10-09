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
    <div class="text-center mb-6">
      <h1 class="text-xl sm:text-2xl font-bold text-primary-text tracking-tight mb-1.5">
        Create Your Account
      </h1>
      <p class="text-xs sm:text-[13px] text-secondary-text font-normal leading-relaxed">
        Set up your account to get started.
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-3.5">
      <!-- Country of Residence -->
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1">
          Country of Residence
        </label>
        <BaseSelect
          v-model="form.country"
          :options="countries"
          placeholder="Select Country..."
          show-flags
          searchable
          rounded="lg"
          height="42px"
          class="w-full"
          :class="{ '!border-primary-red': errors.country }"
          @update:modelValue="handleCountryChange"
        />
        <p v-if="errors.country" class="text-[11px] text-primary-red mt-0.5">
          {{ errors.country }}
        </p>
      </div>

      <!-- Email Address -->
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1">
          Email Address
        </label>
        <input
          v-model="form.email"
          type="email"
          placeholder="Enter Your Email here"
          class="w-full px-3.5 py-2.5 rounded-lg border border-primary-border bg-card-background text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none focus:border-primary-text transition-colors"
          :class="{ '!border-primary-red ring-1 ring-primary-red/20': errors.email }"
          @focus="errors.email = ''"
        />
        <p v-if="errors.email" class="text-[11px] text-primary-red mt-0.5">
          {{ errors.email }}
        </p>
      </div>

      <!-- Phone Number with Auto-Selected Country Code -->
      <div>
        <label class="block text-xs font-semibold text-primary-text mb-1">
          Phone Number
        </label>
        <div
          class="flex items-center rounded-lg border border-primary-border bg-card-background overflow-hidden focus-within:border-primary-text transition-colors"
          :class="{ '!border-primary-red ring-1 ring-primary-red/20': errors.phone_number }"
        >
          <!-- Auto Country Dial Code Prefix -->
          <div
            class="px-3 py-2.5 bg-background border-r border-primary-border text-xs sm:text-sm font-semibold text-primary-text select-none shrink-0 min-w-[54px] text-center"
          >
            {{ selectedPhoneCode }}
          </div>
          <!-- Phone Number Input (Numbers only) -->
          <input
            v-model="localPhoneNumber"
            type="tel"
            inputmode="numeric"
            placeholder="909XXX98302"
            class="w-full px-3.5 py-2.5 bg-transparent text-primary-text placeholder:text-placeholder text-xs sm:text-sm outline-none border-0"
            @input="handlePhoneInput"
            @focus="errors.phone_number = ''"
          />
        </div>
        <p v-if="errors.phone_number" class="text-[11px] text-primary-red mt-0.5">
          {{ errors.phone_number }}
        </p>
      </div>

      <!-- Marketing & Consent Checkbox -->
      <div class="flex items-start gap-2.5 pt-1">
        <input
          id="marketing-consent"
          v-model="consent"
          type="checkbox"
          class="mt-0.5 rounded border-primary-border text-primary focus:ring-0 cursor-pointer shrink-0"
        />
        <label for="marketing-consent" class="text-[11px] text-secondary-text leading-snug cursor-pointer">
          I consent to receiving marketing communications and to the use of my data for marketing optimization and ad personalization purposes. My consent may be withdrawn at any time.
        </label>
      </div>
      <p v-if="errors.consent" class="text-[11px] text-primary-red">
        {{ errors.consent }}
      </p>

      <!-- Send OTP Button -->
      <button
        type="submit"
        :disabled="loading"
        style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
        class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-3 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="loading" :size="16" class="animate-spin text-slate-950" />
        <span>{{ loading ? "Sending OTP…" : "Send OTP" }}</span>
      </button>

      <!-- Sign In Switch Link -->
      <p class="text-center text-xs text-secondary-text pt-1">
        Already have an account?
        <router-link
          to="/login"
          class="text-primary-text font-bold underline ml-1 cursor-pointer hover:text-primary transition-colors"
        >
          Sign In
        </router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { Loader2 } from "lucide-vue-next";
import { countries, getCountryPhoneCode, findCountryValue } from "@/utils/Countries";
import BaseSelect from "@/components/base/BaseSelect.vue";

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["submit"]);

const form = reactive({
  country: findCountryValue(props.initialData.country) || "IN",
  email: props.initialData.email || "",
});

const consent = ref(true);

// Auto-derived dial code based on selected country
const selectedPhoneCode = computed(() => {
  return getCountryPhoneCode(form.country);
});

// Extract local phone number digits without country code prefix
const extractLocalNumber = (fullPhone, phoneCode) => {
  if (!fullPhone) return "";
  let cleaned = String(fullPhone).trim();
  if (phoneCode && cleaned.startsWith(phoneCode)) {
    cleaned = cleaned.slice(phoneCode.length).trim();
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.replace(/^\+\d{1,4}/, "").trim();
  }
  return cleaned.replace(/\D/g, "");
};

const localPhoneNumber = ref(
  extractLocalNumber(props.initialData.phone_number, selectedPhoneCode.value)
);

watch(
  () => props.initialData,
  (newData) => {
    if (newData?.country) form.country = findCountryValue(newData.country) || "IN";
    if (newData?.email) form.email = newData.email;
    if (newData?.phone_number) {
      localPhoneNumber.value = extractLocalNumber(newData.phone_number, selectedPhoneCode.value);
    }
  },
  { deep: true }
);

const errors = reactive({
  country: "",
  email: "",
  phone_number: "",
  consent: "",
});

const handleCountryChange = (val) => {
  errors.country = "";
};

const handlePhoneInput = (e) => {
  localPhoneNumber.value = e.target.value.replace(/\D/g, "");
  errors.phone_number = "";
};

const handleSubmit = () => {
  errors.country = "";
  errors.email = "";
  errors.phone_number = "";
  errors.consent = "";
  let valid = true;

  if (!form.country) {
    errors.country = "Country is required.";
    valid = false;
  }

  if (!form.email.trim()) {
    errors.email = "Email address is required.";
    valid = false;
  } else if (form.email.includes('+')) {
    errors.email = "Email addresses containing '+' are not allowed.";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
    valid = false;
  }

  const rawLocal = localPhoneNumber.value.trim().replace(/\D/g, "");
  if (!rawLocal) {
    errors.phone_number = "Phone number is required.";
    valid = false;
  } else if (rawLocal.length < 6 || rawLocal.length > 15) {
    errors.phone_number = "Enter a valid phone number (6-15 digits).";
    valid = false;
  }

  if (!consent.value) {
    errors.consent = "Please give your consent to continue.";
    valid = false;
  }

  if (!valid) return;

  // Combine country code + local number (e.g. +919876543210)
  const combinedPhone = `${selectedPhoneCode.value}${rawLocal}`;

  emit("submit", {
    country: form.country,
    email: form.email.trim(),
    phone_number: combinedPhone,
  });
};
</script>
