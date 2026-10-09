<template>
  <div class="min-h-screen bg-background">
    <div
      class="mx-auto w-full max-w-7xl px-3.5 sm:px-6 lg:px-8 xl:px-12 py-5 sm:py-8 space-y-4 sm:space-y-6"
    >
      <!-- Back to home -->
      <div class="flex items-center gap-4">
        <button
          type="button"
          @click="onBack"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-card-background text-primary-text transition-colors duration-200 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-primary-text">Profile</h2>
          <span
            v-if="isFm"
            class="hidden sm:inline-flex items-center bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full"
          >
            Fund Manager Portal
          </span>
          <span
            v-else-if="isIbPortal"
            class="hidden sm:inline-flex items-center bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold px-3 py-1 rounded-full"
          >
            IB Portal
          </span>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div
        v-if="profileStore.loading && !profileStore.user"
        class="space-y-6 animate-pulse"
      >
        <div
          class="h-16 bg-card-background border border-primary-border rounded-2xl"
        ></div>
        <div
          class="h-64 bg-card-background border border-primary-border rounded-3xl"
        ></div>
        <div
          class="h-72 bg-card-background border border-primary-border rounded-3xl"
        ></div>
      </div>

      <template v-else>
        <!-- Verification Banner -->
        <VerificationBanner :verified="isVerified" @verify="onVerify" />

        <!-- ── FM Profile Header (LinkedIn Style) ── -->
        <FmProfileHeaderCard
          v-if="isFm"
          :user="profileStore.user"
          @change-avatar="onChangeAvatar"
          @change-banner="onChangeBanner"
          @edit-details="onEditDetails"
          @edit-bio="onEditBio"
        />

        <!-- ── Client / IB Profile Header (Standard) ── -->
        <template v-else>
          <ProfileHeaderCard
            :user="profileStore.user"
            @edit="onEditName"
            @change-avatar="onChangeAvatar"
            @logout="onLogout"
          />

          <p class="text-secondary-text text-sm -mt-2">
            Please contact our
            <span class="font-bold text-primary-text">Support Service</span> to
            make changes to your personal information.
          </p>
        </template>

        <!-- Personal Details (editable) -->
        <PersonalDetailsCard
          ref="personalDetailsRef"
          :user="profileStore.user"
          :loading="savingDetails"
          :is-fm="isFm"
          @save="onSaveDetails"
        />

        <!-- Saved Bank Accounts -->
        <BankAccountsCard />

        <!-- Avatar Dialog -->
        <AvatarDialog
          :open="avatarDialogOpen"
          :user="profileStore.user"
          @close="avatarDialogOpen = false"
          @success="onAvatarSuccess"
        />

        <!-- Banner Dialog (FM Only) -->
        <BannerDialog
          v-if="isFm"
          :open="bannerDialogOpen"
          :user="profileStore.user"
          @close="bannerDialogOpen = false"
          @success="onBannerSuccess"
        />

        <!-- Change Password -->
        <div v-if="isIbPortal" class="bg-card-background rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <h4 class="text-primary-text font-bold text-base">Change Password</h4>
            <p class="text-secondary-text text-xs mt-0.5">Password can only be updated from the Client Portal.</p>
          </div>
          <Tooltip
            text="You cannot edit password from IB portal. You need to switch to client portal."
            position="left"
          >
            <button
              type="button"
              disabled
              class="bg-background text-secondary-text font-semibold text-xs px-5 py-2.5 rounded-full opacity-60 cursor-not-allowed"
            >
              Change
            </button>
          </Tooltip>
        </div>

        <template v-else>
          <SettingsRow
            title="Change Password"
            description="Update your account login password"
            action-label="Change"
            @action="passwordFormOpen = !passwordFormOpen"
          />
          <Changepasswordform
            v-if="passwordFormOpen"
            ref="passwordFormRef"
            :loading="changingPassword"
            @submit="onChangePassword"
          />
        </template>

        <!-- Two-Factor Authentication (2FA) Security Card -->
        <TwoFactorAuthCard :role="isFm ? 'fm' : isIbPortal ? 'ib' : 'client'" />

        <!-- Logout Section -->
        <div
          class="bg-card-background rounded-2xl px-5 py-4 flex items-center justify-between"
        >
          <div>
            <h4 class="text-primary-text font-bold text-base">Account Session</h4>
            <p class="text-secondary-text text-xs mt-0.5">Sign out of your active account on this device</p>
          </div>

          <button
            type="button"
            @click="onLogout"
            class="group inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-500 hover:text-white cursor-pointer"
          >
            <LogOut
              class="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Logout
          </button>
        </div>

        <AccountsDisclaimer />
      </template>
    </div>

    <!-- Profile Dialog (KYC & FM modals) -->
    <ProfileDialog
      :open="profileStore.profileDialogOpen"
      :initial-mode="profileStore.profileDialogMode"
      @close="profileStore.closeProfileDialog()"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, LogOut } from "lucide-vue-next";

import { useProfileStore } from "@/stores/shared/profile";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useTourStore } from "@/stores/shared/tour";
import authToken from "@/common/authToken";

import VerificationBanner from "@/components/base/profile/VerificationBanner.vue";
import ProfileHeaderCard from "@/components/base/profile/ProfileHeaderCard.vue";
import FmProfileHeaderCard from "@/components/base/profile/FmProfileHeaderCard.vue";
import PersonalDetailsCard from "@/components/base/profile/PersonalDetailsCard.vue";
import BankAccountsCard from "@/components/base/profile/BankAccountsCard.vue";
import Changepasswordform from "@/components/base/profile/Changepasswordform.vue";
import TwoFactorAuthCard from "@/components/base/profile/TwoFactorAuthCard.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import SettingsRow from "@/components/base/profile/SettingsRow.vue";
import AvatarDialog from "@/components/base/profile/AvatarDialog.vue";
import BannerDialog from "@/components/base/profile/BannerDialog.vue";
import ProfileDialog from "@/components/base/profileDialog.vue";
import Tooltip from "@/components/base/Tooltip.vue";

const router = useRouter();
const profileStore = useProfileStore();
const snackbar = useSnackbarStore();

const avatarDialogOpen = ref(false);
const bannerDialogOpen = ref(false);
const personalDetailsRef = ref(null);

onMounted(() => {
  profileStore.fetchUserProfile();
});

onBeforeUnmount(() => {
  profileStore.closeProfileDialog();
});

const isFm = computed(() => {
  return (
    profileStore.activeRole === "fm" ||
    profileStore.user?.role === "fm" ||
    localStorage.getItem("role") === "fm"
  );
});

const isIbPortal = computed(() => {
  return (
    profileStore.activeRole === "ib" ||
    localStorage.getItem("role") === "ib"
  );
});

const isVerified = computed(() => {
  const status = String(profileStore.user?.kyc_status || "").toLowerCase().trim();
  return status === "approved" || status === "verified" || status === "completed";
});

const onBack = () => {
  const previousUrl = window.history.state?.back;
  const isAuthPage =
    typeof previousUrl === "string" &&
    (previousUrl.includes("login") ||
      previousUrl.includes("register") ||
      previousUrl.includes("auth"));

  if (previousUrl && !isAuthPage) {
    router.back();
  } else if (isFm.value) {
    router.push("/fm-dashboard");
  } else if (isIbPortal.value) {
    router.push("/ib-dashboard");
  } else {
    router.push("/dashboard");
  }
};

const onVerify = () => {
  profileStore.openProfileDialog("kyc");
};

const onEditName = () => {
  snackbar.show("Contact Support Service to update your name.", "info");
};

const onChangeAvatar = () => {
  avatarDialogOpen.value = true;
};

const onChangeBanner = () => {
  bannerDialogOpen.value = true;
};

const onAvatarSuccess = () => {
  profileStore.fetchUserProfile(true);
};

const onBannerSuccess = () => {
  profileStore.fetchUserProfile(true);
};

const onEditDetails = () => {
  personalDetailsRef.value?.startEdit();
};

const onEditBio = () => {
  personalDetailsRef.value?.startEdit('bio');
};

// ─── Personal Details ─────────────────────────────────
const savingDetails = ref(false);

const onSaveDetails = async (payload) => {
  savingDetails.value = true;
  try {
    await profileStore.updateUserProfile(payload);
  } catch (err) {
    console.error("Failed to update profile:", err);
  } finally {
    savingDetails.value = false;
  }
};

// ─── Change Password ──────────────────────────────────
const passwordFormOpen = ref(false);
const passwordFormRef = ref(null);
const changingPassword = ref(false);

const onChangePassword = async ({ current_password, new_password }) => {
  changingPassword.value = true;
  try {
    await profileStore.changePassword(current_password, new_password);
    snackbar.show("Password updated successfully.", "success");
    passwordFormRef.value?.reset();
    passwordFormOpen.value = false;
  } catch (err) {
    // profileStore already surfaces the error via the snackbar.
  } finally {
    changingPassword.value = false;
  }
};

// ─── Logout ──────────────────────────────────────────-
const onLogout = () => {
  snackbar.show("Logout.", "info");
  try {
    useTourStore().stopTour();
  } catch (e) {}
  authToken.removeToken();
  localStorage.removeItem("role");
  sessionStorage.clear();
  router.push({ name: "login" }).then(() => {
    window.location.reload();
  });
};
</script>
