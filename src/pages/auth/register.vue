<script setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  watch,
} from "vue";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  User,
  Tag,
} from "lucide-vue-next";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useRouter, useRoute } from "vue-router";
import { useThemeStore } from "@/stores/shared/theme";
import logoLight from "/logo_full-light.svg";
const bgImage = "https://media.panthercapitals.com/media/4/file_1787835189_13089f.png";

// Immediate image preload optimization
if (typeof window !== "undefined") {
  const imgPreloader = new Image();
  imgPreloader.src = bgImage;
}
import { countries } from "@/utils/Countries";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";

const router = useRouter();
const route = useRoute();
const snackbar = useSnackbarStore();

const trackingId = ref(null);
const additionalInfo = ref({});

const themeStore = useThemeStore();
const isDarkTheme = computed(() => themeStore.isDark);

const loading = ref(false);

const showPassword = ref(false);
const otpSent = ref(false);
const otpVerified = ref(false);
const otpDigits = ref(["", "", "", "", "", ""]);
const resendCountdown = ref(0);

// ─── Role Detection ───────────────────────────────────
const isFundManager = computed(() => {
  const userType = String(route.params.userType || route.query.role || "").toLowerCase();
  const path = route.path.toLowerCase();
  return (
    userType === "fm" ||
    userType === "fund-manager" ||
    path === "/fm-register" ||
    path.endsWith("/fm") ||
    path.includes("/fund-manager")
  );
});

const form = reactive({
  name: "",
  email: "",
  password: "",
  role: "client",
  referral_code: "",
  date_of_birth: "",
  phone_number: "",
  country: "",
});

const errors = reactive({
  name: "",
  email: "",
  password: "",
  role: "",
  referral_code: "",
  date_of_birth: "",
  phone_number: "",
  country: "",
});

watch(
  isFundManager,
  (val) => {
    form.role = val ? "fm" : "client";
    if (val) {
      form.referral_code = "";
      errors.referral_code = "";
    }
  },
  { immediate: true },
);

const countryOptions = computed(() =>
  countries.map((c) => ({ value: c.label, label: c.label })),
);

watch(
  () => route.query,
  (query) => {
    if (query) {
      const qTrackingId = query.tracking_id;
      if (qTrackingId) {
        trackingId.value = qTrackingId;
        if (!isFundManager.value) {
          form.role = "client";
        }
      }

      const qReferralCode = query.ref || query.referral_code;
      if (qReferralCode && !isFundManager.value) {
        form.referral_code = qReferralCode;
      }

      // Capture all other query parameters as additional_info
      const queryParams = {};
      for (const key in query) {
        if (
          key !== "tracking_id" &&
          key !== "ref" &&
          key !== "referral_code"
        ) {
          let val = query[key];
          if (
            typeof val === "string" &&
            val.startsWith('"') &&
            val.endsWith('"')
          ) {
            val = val.slice(1, -1);
          }
          queryParams[key] = val;
        }
      }
      if (Object.keys(queryParams).length > 0) {
        additionalInfo.value = queryParams;
      } else {
        additionalInfo.value = {};
      }
    }
  },
  { immediate: true, deep: true },
);

// ─── Password Strength Calculation ─────────────────────────
const passwordScore = computed(() => {
  const pwd = form.password || "";
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++;
  return score;
});

const passwordStrength = computed(() => {
  switch (passwordScore.value) {
    case 1:
      return { label: "Weak", color: "bg-red-500", textColor: "text-red-400" };
    case 2:
      return {
        label: "Fair",
        color: "bg-amber-500",
        textColor: "text-amber-400",
      };
    case 3:
      return {
        label: "Good",
        color: "bg-blue-400",
        textColor: "text-blue-300",
      };
    case 4:
      return {
        label: "Strong",
        color: "bg-emerald-400",
        textColor: "text-emerald-300",
      };
    default:
      return { label: "", color: "bg-white/20", textColor: "text-white/40" };
  }
});

// ─── Real-time 50 Chars Validation ─────────────────────────
const onFieldInput = (field) => {
  if (form[field] && form[field].length > 50) {
    const fieldNames = {
      name: "Full name",
      email: "Email address",
      password: "Password",
      referral_code: "Referral code",
      phone_number: "Phone number",
      country: "Country",
      date_of_birth: "Date of birth",
    };
    errors[field] =
      `${fieldNames[field] || "Field"} cannot exceed 50 characters.`;
  } else if (errors[field] && errors[field].includes("50 characters")) {
    errors[field] = "";
  }
};

// ─── Validation
const validate = () => {
  let valid = true;

  // Full Name
  if (!form.name || !form.name.trim()) {
    errors.name = "Full name is required.";
    valid = false;
  } else if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
    valid = false;
  } else if (form.name.length > 50) {
    errors.name = "Full name cannot exceed 50 characters.";
    valid = false;
  }

  // Email
  if (!form.email || !form.email.trim()) {
    errors.email = "Email is required.";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
    valid = false;
  } else if (form.email.length > 50) {
    errors.email = "Email address cannot exceed 50 characters.";
    valid = false;
  }

  // Date of Birth
  if (!form.date_of_birth) {
    errors.date_of_birth = "Date of birth is required.";
    valid = false;
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth)) {
    errors.date_of_birth = "Enter a valid date in YYYY-MM-DD format.";
    valid = false;
  }

  // Phone Number
  if (!form.phone_number) {
    errors.phone_number = "Phone number is required.";
    valid = false;
  } else if (
    !/^\+\d{1,4}\d{6,14}$/.test(form.phone_number.replace(/[\s()-]/g, ""))
  ) {
    errors.phone_number =
      "Phone number must start with + followed by country code (e.g. +919876543210).";
    valid = false;
  } else if (form.phone_number.length > 50) {
    errors.phone_number = "Phone number cannot exceed 50 characters.";
    valid = false;
  }

  // Country
  if (!form.country) {
    errors.country = "Country is required.";
    valid = false;
  } else if (form.country.length > 50) {
    errors.country = "Country cannot exceed 50 characters.";
    valid = false;
  }

  // Password
  if (!form.password) {
    errors.password = "Password is required.";
    valid = false;
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
    valid = false;
  } else if (form.password.length > 50) {
    errors.password = "Password cannot exceed 50 characters.";
    valid = false;
  }

  // Referral Code (only relevant for client)
  if (form.role !== "fm" && form.referral_code && form.referral_code.length > 50) {
    errors.referral_code = "Referral code cannot exceed 50 characters.";
    valid = false;
  }

  return valid;
};

const clearError = (field) => {
  errors[field] = "";
};

// ─── OTP Flow
const handleSendOtp = () => {
  if (!validate()) return;

  loading.value = true;

  const payload = {
    name: form.name,
    email: form.email,
    password: form.password,
    role: form.role,
    date_of_birth: form.date_of_birth,
    phone_number: form.phone_number,
    country: form.country,
  };

  if (form.role !== "fm" && form.referral_code.trim()) {
    payload.referral_code = form.referral_code;
  }

  if (form.role === "client" && trackingId.value) {
    payload.tracking_id = trackingId.value;
  }

  if (form.role === "client" && Object.keys(additionalInfo.value).length > 0) {
    payload.additional_info = additionalInfo.value;
  }

  const successHandler = () => {
    loading.value = false;
    otpSent.value = true;
    snackbar.show("OTP sent to your email!", "success");
    startResendCountdown();
  };

  const failureHandler = (err) => {
    loading.value = false;
    snackbar.show(err?.error || "Failed to send OTP.", "error");
  };

  apiRequest(urls.KEYS.POST, urls.auth.sendOTP, {
    data: payload,
    isTokenRequired: false,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};

const handleOtpPaste = (index, event) => {
  event.preventDefault();
  const clipboardData = event.clipboardData || window.clipboardData;
  if (!clipboardData) return;
  const pastedText = clipboardData.getData("text");
  const digits = pastedText.replace(/\D/g, "");
  if (!digits) return;

  const startIdx = digits.length === 6 ? 0 : index;
  for (
    let i = 0;
    i < digits.length && startIdx + i < otpDigits.value.length;
    i++
  ) {
    otpDigits.value[startIdx + i] = digits[i];
  }

  const targetFocus =
    startIdx + digits.length < otpDigits.value.length
      ? startIdx + digits.length
      : otpDigits.value.length - 1;
  document.getElementById(`otp-input-${targetFocus}`)?.focus();
};

const handleOtpInput = (index, event) => {
  const value = event.target.value;
  if (!value) {
    otpDigits.value[index] = "";
    return;
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) {
    otpDigits.value[index] = "";
    return;
  }

  if (digits.length === 1) {
    otpDigits.value[index] = digits;
    if (index < otpDigits.value.length - 1) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  } else {
    const startIdx = digits.length === 6 ? 0 : index;
    for (
      let i = 0;
      i < digits.length && startIdx + i < otpDigits.value.length;
      i++
    ) {
      otpDigits.value[startIdx + i] = digits[i];
    }
    const targetFocus =
      startIdx + digits.length < otpDigits.value.length
        ? startIdx + digits.length
        : otpDigits.value.length - 1;
    document.getElementById(`otp-input-${targetFocus}`)?.focus();
  }
};

const handleOtpKeydown = (index, event) => {
  if (event.key === "Backspace" && !otpDigits.value[index] && index > 0) {
    document.getElementById(`otp-input-${index - 1}`)?.focus();
  } else if (event.key === "ArrowLeft" && index > 0) {
    document.getElementById(`otp-input-${index - 1}`)?.focus();
  } else if (event.key === "ArrowRight" && index < otpDigits.value.length - 1) {
    document.getElementById(`otp-input-${index + 1}`)?.focus();
  }
};

const getOtpCode = () => otpDigits.value.join("");

const handleVerifyOtp = () => {
  const otpCode = getOtpCode();
  if (!otpCode || otpCode.length !== 6) {
    snackbar.show("Please enter all 6 digits.", "error");
    return;
  }

  loading.value = true;

  const payload = {
    email: form.email,
    otp: otpCode,
  };

  const successHandler = () => {
    loading.value = false;
    otpVerified.value = true;
    snackbar.show("OTP verified successfully!", "success");
    handleCreateAccount();
  };

  const failureHandler = (err) => {
    loading.value = false;
    snackbar.show(err?.error || "Invalid OTP.", "error");
  };

  apiRequest(urls.KEYS.PUT, urls.auth.verifyOTP, {
    data: payload,
    isTokenRequired: false,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};

const handleCreateAccount = () => {
  loading.value = true;

  const payload = {
    name: form.name,
    email: form.email,
    password: form.password,
    role: form.role,
    date_of_birth: form.date_of_birth,
    phone_number: form.phone_number,
    country: form.country,
  };

  if (form.role !== "fm" && form.referral_code.trim()) {
    payload.referral_code = form.referral_code;
  }

  if (form.role === "client" && trackingId.value) {
    payload.tracking_id = trackingId.value;
  }

  if (form.role === "client" && Object.keys(additionalInfo.value).length > 0) {
    payload.additional_info = additionalInfo.value;
  }

  const successHandler = () => {
    loading.value = false;
    snackbar.show("Account created successfully!", "success");
    if (form.role === "fm") {
      router.push("/login/fm");
    } else {
      router.push("/login");
    }
  };

  const failureHandler = (err) => {
    loading.value = false;
    snackbar.show(err?.error || "Something went wrong.", "error");
  };

  apiRequest(urls.KEYS.POST, urls.auth.register, {
    data: payload,
    isTokenRequired: false,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};

const startResendCountdown = () => {
  resendCountdown.value = 60;
  const interval = setInterval(() => {
    resendCountdown.value -= 1;
    if (resendCountdown.value === 0) {
      clearInterval(interval);
    }
  }, 1000);
};

const handleResendOtp = () => {
  loading.value = true;

  const payload = {
    email: form.email,
  };

  const successHandler = () => {
    loading.value = false;
    snackbar.show("OTP resent to your email!", "success");
    startResendCountdown();
  };

  const failureHandler = (err) => {
    loading.value = false;
    snackbar.show(err?.error || "Failed to resend OTP.", "error");
  };

  apiRequest(urls.KEYS.POST, urls.auth.resendOTP, {
    data: payload,
    isTokenRequired: false,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};

const goToLogin = () => {
  if (isFundManager.value) {
    router.push("/login/fm");
  } else {
    router.push("/login");
  }
};

const goToFmRegister = () => {
  router.push("/register/fm");
};

const goToInvestorRegister = () => {
  router.push("/register");
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
      class="relative w-full max-w-120 rounded-2xl border border-white/10 p-6 py-8 my-4 sm:p-8 sm:py-10 sm:my-8"
      style="background: #ffffff1a; backdrop-filter: blur(134px)"
    >
      <!-- Logo + Brand -->
      <div class="text-center mb-6">
        <div class="flex justify-center mb-3">
          <img
            :src="logoLight"
            alt="Panther Capitals"
            class="h-10 object-contain"
          />
        </div>
        <h1 class="text-2xl font-semibold text-white mb-1.5">
          {{ isFundManager ? "Register as Fund Manager" : "Register" }}
        </h1>
        <p class="text-sm text-white/60">
          {{
            isFundManager
              ? "Create a Fund Manager account to manage strategies and funds"
              : "Create an account to access your workspace"
          }}
        </p>
      </div>

      <!-- Form -->
      <div>
        <!-- Full Name -->
        <div class="mb-3 sm:mb-4">
          <label class="block text-sm font-medium text-white mb-1.5"
            >Full name</label
          >
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g. John Doe"
            class="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-sm outline-none focus:border-white/40 transition-colors"
            :class="{ 'border-red-400': errors.name }"
            @input="onFieldInput('name')"
            @focus="clearError('name')"
          />
          <p v-if="errors.name" class="text-xs mt-1.5 text-red-400">
            {{ errors.name }}
          </p>
        </div>

        <!-- Email -->
        <div class="mb-3 sm:mb-4">
          <label class="block text-sm font-medium text-white mb-1.5"
            >Email address</label
          >
          <input
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            class="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-sm outline-none focus:border-white/40 transition-colors"
            :class="{ 'border-red-400': errors.email }"
            @input="onFieldInput('email')"
            @focus="clearError('email')"
          />
          <p v-if="errors.email" class="text-xs mt-1.5 text-red-400">
            {{ errors.email }}
          </p>
        </div>

        <!-- Date of birth & Phone number -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 sm:mb-4">
          <!-- Date of Birth -->
          <div class="min-w-0">
            <label class="block text-sm font-medium text-white mb-1.5"
              >Date of birth</label
            >
            <BaseDateRangePicker
              v-model="form.date_of_birth"
              mode="single"
              :maxDate="new Date()"
              valueFormat="YYYY-MM-DD"
              class="w-full"
              variant="text"
              :buttonClass="`w-full min-w-0 px-3 py-2 rounded-lg border bg-white/10 text-white text-sm outline-none transition-colors h-10.5 ${errors.date_of_birth ? 'border-red-400' : 'border-white/20 focus:border-white/40'}`"
              placeholder="Select date of birth"
              @open="clearError('date_of_birth')"
            />
            <p v-if="errors.date_of_birth" class="text-xs mt-1.5 text-red-400">
              {{ errors.date_of_birth }}
            </p>
          </div>

          <!-- Phone Number -->
          <div class="min-w-0">
            <label class="block text-sm font-medium text-white mb-1.5"
              >Phone number</label
            >
            <input
              v-model="form.phone_number"
              type="tel"
              placeholder="e.g. +919876543210"
              class="w-full min-w-0 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-sm outline-none focus:border-white/40 transition-colors h-10.5"
              :class="{ 'border-red-400': errors.phone_number }"
              @input="onFieldInput('phone_number')"
              @focus="clearError('phone_number')"
            />
            <p v-if="errors.phone_number" class="text-xs mt-1.5 text-red-400">
              {{ errors.phone_number }}
            </p>
          </div>
        </div>

        <!-- Country & Password -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 sm:mb-4">
          <!-- Country -->
          <div class="flex flex-col gap-1">
            <label class="text-secondary-text text-[11px] font-medium"
              >Country</label
            >
            <BaseSelect
              v-model="form.country"
              :options="countries"
              placeholder="Select Country..."
              variant="surface"
              show-flags
              searchable
              :class="{ 'border-red-400': errors.country }"
              @update:modelValue="clearError('country')"
            />
            <p v-if="errors.country" class="text-xs mt-1.5 text-red-400">
              {{ errors.country }}
            </p>
          </div>

          <!-- Password -->
          <div class="min-w-0">
            <label class="block text-sm font-medium text-white mb-1.5"
              >Password</label
            >
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full min-w-0 px-4 pr-10 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-sm outline-none focus:border-white/40 transition-colors h-10.5"
                :class="{ 'border-red-400': errors.password }"
                @input="onFieldInput('password')"
                @focus="clearError('password')"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors cursor-pointer p-1 z-10 flex items-center justify-center"
                @click="showPassword = !showPassword"
                aria-label="Toggle password visibility"
              >
                <BaseIcon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  :size="18"
                  class="text-white"
                />
              </button>
            </div>
            <p v-if="errors.password" class="text-xs mt-1.5 text-red-400">
              {{ errors.password }}
            </p>
          </div>
        </div>

        <!-- Password Strength Progress Bar -->
        <div v-if="form.password" class="mb-4 space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-white/60">Password strength:</span>
            <span :class="['font-semibold', passwordStrength.textColor]">
              {{ passwordStrength.label }}
            </span>
          </div>
          <div class="grid grid-cols-4 gap-1.5 h-1">
            <div
              v-for="step in 4"
              :key="step"
              class="h-full rounded-full transition-all duration-300"
              :class="
                step <= passwordScore ? passwordStrength.color : 'bg-white/10'
              "
            />
          </div>
        </div>

        <!-- Referral Code (Investor only) -->
        <div v-if="!isFundManager && !trackingId" class="mb-4 hidden">
          <label class="block text-sm font-medium text-white mb-1.5">
            Referral code <span class="text-xs text-white/40 font-normal">(optional)</span>
          </label>
          <input
            v-model="form.referral_code"
            type="text"
            placeholder="Enter referral code if you have one"
            class="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/80 text-sm outline-none focus:border-white/40 transition-colors"
            :class="{ 'border-red-400': errors.referral_code }"
            @input="onFieldInput('referral_code')"
            @focus="clearError('referral_code')"
          />
          <p v-if="errors.referral_code" class="text-xs mt-1.5 text-red-400">
            {{ errors.referral_code }}
          </p>
        </div>

        <!-- OTP Input -->
        <div v-if="otpSent && !otpVerified" class="mb-5">
          <label class="block text-sm font-medium text-white mb-3"
            >Enter OTP</label
          >
          <div class="flex justify-center gap-2 mb-4">
            <input
              v-for="(digit, index) in otpDigits"
              :key="index"
              :id="`otp-input-${index}`"
              :value="digit"
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="w-11 h-11 text-center text-lg font-semibold border border-white/20 bg-white/10 text-white rounded-lg outline-none focus:border-white/50 transition-colors"
              @input="handleOtpInput(index, $event)"
              @keydown="handleOtpKeydown(index, $event)"
              @paste="handleOtpPaste(index, $event)"
            />
          </div>
          <div class="flex justify-between items-center">
            <p class="text-xs text-white/50">Check your email for the OTP</p>
            <button
              type="button"
              :disabled="resendCountdown > 0 || loading"
              class="text-xs font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
              :class="{ 'opacity-40 cursor-not-allowed': resendCountdown > 0 }"
              @click="handleResendOtp"
            >
              {{
                resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : "Resend OTP"
              }}
            </button>
          </div>
        </div>

        <!-- Send OTP Button -->
        <button
          v-if="!otpSent"
          type="button"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black transition-all duration-200 hover:brightness-85 active:brightness-75 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style="background: linear-gradient(180deg, #e0ca3c 0%, #ffe74d 100%)"
          @click="handleSendOtp"
        >
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          <span>{{ loading ? "Sending OTP…" : "Send OTP" }}</span>
        </button>

        <!-- Verify OTP Button -->
        <button
          v-if="otpSent && !otpVerified"
          type="button"
          :disabled="loading || getOtpCode().length !== 6"
          class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black transition-all duration-200 hover:brightness-85 active:brightness-75 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style="background: linear-gradient(180deg, #e0ca3c 0%, #ffe74d 100%)"
          @click="handleVerifyOtp"
        >
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          <span>{{
            loading ? "Verifying…" : "Verify OTP & Create Account"
          }}</span>
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
          @click="isFundManager ? goToInvestorRegister() : goToFmRegister()"
        >
          <span>{{ isFundManager ? "Sign up as Investor" : "Sign up as Fund Manager" }}</span>
          <ArrowRight :size="16" class="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <!-- Sign In -->
      <p class="text-center text-sm text-white/70 mt-5">
        {{ isFundManager ? "Already have a Fund Manager account?" : "Already have an account?" }}
        <button
          class="text-white font-semibold ml-1 hover:underline cursor-pointer"
          @click="goToLogin"
        >
          Sign in
        </button>
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

:deep(.relative.w-full > button) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
:deep(.relative.w-full > button span) {
  color: white !important;
}
:deep(.relative.w-full > button span.text-secondary-text) {
  color: rgba(255, 255, 255, 0.8) !important;
}
:deep(.relative.w-full > button svg) {
  color: rgba(255, 255, 255, 0.5) !important;
}
</style>
