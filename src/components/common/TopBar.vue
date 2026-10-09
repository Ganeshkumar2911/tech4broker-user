<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  Copy,
  Check,
  AlertCircle,
} from "lucide-vue-next";
import { useProfileStore } from "@/stores/shared/profile";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import ProfileDialog from "@/components/base/profileDialog.vue";
import TopBarNotifications from "./notifications/TopBarNotifications.vue";
import ThemeTogglePill from "./ThemeTogglePill.vue";
import StrategySelector from "@/components/fm/StrategySelector.vue";

const props = defineProps({
  topbarTheme: {
    type: String,
    default: "default", // default | dark
  },
  showLogo: {
    type: Boolean,
    default: false,
  },
});
defineEmits(["toggle-sidebar"]);

import { useThemeStore } from "@/stores/shared/theme";
import { useDepositStore } from "@/stores/client/deposit";
import { useWithdrawStore } from "@/stores/client/withdraw";

const router = useRouter();
const route = useRoute();
const profileStore = useProfileStore();
const snackbar = useSnackbarStore();
const themeStore = useThemeStore();
const depositStore = useDepositStore();
const withdrawStore = useWithdrawStore();

const isFundsPage = computed(() => {
  return (
    route.name === "funds" ||
    route.name === "ib-funds" ||
    route.name === "fm-funds" ||
    route.path === "/funds" ||
    route.path === "/ib-funds" ||
    route.path === "/fm-funds" ||
    route.path.endsWith("/funds") ||
    route.path.endsWith("/ib-funds") ||
    route.path.endsWith("/fm-funds")
  );
});

const isFundsMultiStep = computed(() => {
  if (!isFundsPage.value) return false;
  return depositStore.currentStep > 1 || withdrawStore.currentStep > 1;
});
const topbarIconClass = computed(() =>
  props.topbarTheme === "dark"
    ? "text-white/70 hover:bg-white/10 hover:text-white"
    : "text-secondary-text hover:bg-primary-border/60 hover:text-primary-text",
);
const isDark = computed(() => themeStore.isDark);
const copiedRef = ref(false);

const isChartTrading = computed(() => {
  return props.showLogo || route.path.startsWith("/chart-trading") || route.name === "chart-trading";
});

const logoSrc = computed(() => {
  return themeStore.isDark ? "/logo_full-light.svg" : "/logo_full-dark.png";
});

const shortLogoSrc = computed(() => {
  return themeStore.isDark ? "/fav-light.svg" : "/fav-dark.svg";
});

const homeRoute = computed(() => {
  const role = profileStore.activeRole || profileStore.user?.role;
  if (role === "fm") return "/fm-dashboard";
  if (role === "ib") return "/ib-dashboard";
  return "/dashboard";
});

// ✅ Role
const role = computed(() => profileStore.user?.role);

// ✅ KYC Pending Check
const isKycPending = computed(
  () => String(profileStore.user?.kyc_status || "").toLowerCase().trim() === "pending"
);

// ✅ IB Check & Referral
const isIB = computed(() => {
  return profileStore.activeRole === "ib";
});

// ✅ FM Check
const isFM = computed(() => {
  return (
    profileStore.activeRole === "fm" ||
    role.value === "fm" ||
    route.path.startsWith("/fm") ||
    route.path === "/followers" ||
    route.path === "/your-wallet"
  );
});

const referralCode = computed(() => profileStore.user?.referral_code);

const copyReferralLink = async () => {
  if (!referralCode.value) return;
  const link = `${window.location.origin}/register?ref=${referralCode.value}`;
  try {
    await navigator.clipboard.writeText(link);
    copiedRef.value = true;
    snackbar.show("Referral link copied to clipboard!", "success");
    setTimeout(() => {
      copiedRef.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy referral link:", err);
    snackbar.show("Failed to copy referral link.", "error");
  }
};

// ✅ Avatar Letter
const avatarLetter = computed(() => {
  if (profileStore.user?.name) {
    return profileStore.user.name.charAt(0).toUpperCase();
  }
  return role.value === "client" || role.value === "ib" ? "U" : "F";
});

// ✅ Display Name
const displayName = computed(() => {
  if (profileStore.user?.name) {
    return profileStore.user.name;
  }
  return role.value === "client" || role.value === "ib"
    ? "User"
    : "Fund Manager";
});

onMounted(() => {
  themeStore.init();
});

function toggleDark(event) {
  themeStore.toggleTheme(event);
}

// 📅 Date
const today = computed(() =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
);

const showTopBarBack = computed(() => {
  return (
    Boolean(route.meta.showBackButton) ||
    route.query.is_ib === "true" ||
    route.query.is_ib === true ||
    Boolean(route.query.ib_id) ||
    Boolean(route.query.programId) ||
    isFundsMultiStep.value
  );
});

function handleBack() {
  if (isFundsMultiStep.value) {
    if (depositStore.isPaymaxisSdk) {
      depositStore.isPaymaxisSdk = false;
      depositStore.paymaxisPaymentId = null;
      return;
    }
    if (withdrawStore.showOtpModal) {
      withdrawStore.showOtpModal = false;
      return;
    }
    if (depositStore.currentStep > 1) {
      depositStore.currentStep -= 1;
      return;
    }
    if (withdrawStore.currentStep > 1) {
      withdrawStore.currentStep -= 1;
      return;
    }
    return;
  }
  if (
    route.query.is_ib === "true" ||
    route.query.is_ib === true ||
    Boolean(route.query.ib_id)
  ) {
    router.push("/my-network");
    return;
  }
  if (route.query.programId) {
    router.push({ path: route.path });
    return;
  }
  if (window.history.state && window.history.state.back) {
    router.back();
  } else if (route.meta.backPath) {
    router.push(route.meta.backPath);
  } else {
    router.back();
  }
}

const openProfileDialog = (mode = "profile") => {
  profileStore.openProfileDialog(mode);
};

const closeProfileDialog = () => {
  profileStore.closeProfileDialog();
};

const pageTitle = computed(() => {
  if (route.path.startsWith("/copy-trading") || route.name === "copy-trading") {
    const tab = route.query.tab;
    if (tab === "my-copy-trading") return "Followed Fund Managers";
    if (tab === "history" || tab === "following-history") return "Following History";
    return route.meta?.title || "Copy Trading";
  }
  return route.meta?.title || "";
});

const pageDescription = computed(() => {
  if (route.path.startsWith("/copy-trading") || route.name === "copy-trading") {
    const tab = route.query.tab;
    if (tab === "my-copy-trading") return "Manage and track all fund managers you are copying.";
    if (tab === "history" || tab === "following-history") return "Past fund manager copy-trading memberships and historical performance.";
    return route.meta?.description || "Explore leading Fund Managers and manage your active copies.";
  }
  return route.meta?.description || "";
});
</script>

<template>
  <header
    class="h-[60px] flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b transition-colors duration-300 gap-2"
    :class="
      props.topbarTheme === 'dark'
        ? 'bg-[#111827] border-white/10'
        : 'bg-card-background border-primary-border'
    "
  >
    <!-- Left -->
    <div class="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
      <!-- Panther Logo for Trading Page or when showLogo is true -->
      <router-link
        v-if="isChartTrading"
        :to="homeRoute"
        class="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-90 shrink-0 mr-1"
        title="Panther Capitals"
      >
        <img
          :src="logoSrc"
          alt="Panther Capitals Logo"
          class="h-8 max-h-8 max-w-[120px] sm:max-w-[160px] object-contain transition-all duration-300"
        />
      </router-link>

      <!-- Hamburger -->
      <button
        v-if="!route.meta.hideSidebar"
        @click="$emit('toggle-sidebar')"
        class="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-secondary-text hover:bg-primary-border shrink-0"
        :class="topbarIconClass"
      >
        <Menu class="w-4 h-4" />
      </button>

      <!-- Short Logo for Mobile View -->
      <router-link
        :to="homeRoute"
        class="md:hidden flex items-center shrink-0 cursor-pointer transition-opacity hover:opacity-90"
        title="Panther Capitals"
      >
        <img
          :src="shortLogoSrc"
          alt="Panther Capitals Logo"
          class="h-7 w-auto object-contain"
        />
      </router-link>

      <!-- Back -->
      <button
        v-if="showTopBarBack"
        @click="handleBack"
        class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-secondary-text hover:text-primary-text hover:bg-primary-border/60 transition-colors cursor-pointer shrink-0"
        :class="topbarIconClass"
        title="Back"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>

      <!-- Title & Description -->
      <div v-if="pageTitle" class="min-w-0 flex-1 overflow-hidden">
        <h1 class="text-primary-text text-base font-semibold truncate">
          {{ pageTitle }}
        </h1>
        <!-- <p v-if="pageDescription" class="text-secondary-text text-[11px] hidden sm:block truncate">
          {{ pageDescription }}
        </p> -->
      </div>
    </div>

    <!-- Right -->
    <div id="tour-topbar-actions" class="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <!-- Strategy Selector (FM only) -->
      <StrategySelector
        v-if="isFM"
        :compact="true"
        :show-create-button="false"
        class="hidden sm:inline-flex mr-1"
      />

      <!-- Referral Link (IB only) -->
      <!-- <div
        v-if="isIB && referralCode"
        class="hidden sm:flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-lg px-2.5 py-1 text-xs font-medium mr-2"
      >
        <span class="text-secondary-text font-normal text-[10px]">Ref:</span>
        <span class="font-mono font-bold">{{ referralCode }}</span>
        <button
          @click="copyReferralLink"
          class="p-0.5 hover:bg-primary/20 rounded transition-colors text-primary flex items-center justify-center cursor-pointer ml-1"
          title="Copy Referral Link"
        >
          <component :is="copiedRef ? Check : Copy" class="w-3.5 h-3.5" />
        </button>
      </div> -->

      <!-- Date -->
      <!-- <span class="hidden sm:block text-xs text-secondary-text">
        {{ today }}
      </span> -->

      <div
        id="tour-topbar-kyc"
        v-if="isKycPending"
        @click="profileStore.openProfileDialog('kyc')"
        class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-xs font-semibold cursor-pointer animate-pulse shrink-0"
        :class="topbarIconClass"
      >
        <AlertCircle class="w-3.5 h-3.5 shrink-0" />
        <span class="hidden min-[450px]:inline">Complete KYC</span>
        <!-- <span class="sm:hidden">KYC</span> -->
      </div>

      <div id="tour-notifications">
        <TopBarNotifications />
      </div>

      <!-- Theme Toggle -->
      <div id="tour-theme-toggle">
        <ThemeTogglePill :is-dark="isDark" @toggle="toggleDark" />
      </div>
      <!-- <div
        class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary-border cursor-pointer"
        @click="openProfileDialog"
      >
        <div class="w-7 h-7 rounded-full bg-card-background border border-primary-border text-primary flex items-center justify-center">
          <span class="text-xs font-bold">
            {{ avatarLetter }}
          </span>
        </div>
        <span class="hidden text-primary-text sm:block text-xs font-medium">
          {{ displayName }}
        </span>
      </div> -->
    </div>
  </header>
  <ProfileDialog
    :open="profileStore.profileDialogOpen"
    :initial-mode="profileStore.profileDialogMode"
    @close="closeProfileDialog"
  />
</template>
