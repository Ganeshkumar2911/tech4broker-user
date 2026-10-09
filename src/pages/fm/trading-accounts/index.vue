<template>
  <div class="space-y-6">
    <!-- Competitions banner -->
    <CompetitionsBanner
      :loading="bannersStore.loading"
      :items="bannersStore.banners"
    />

    <!-- Header + Filters -->
    <div class="space-y-4">
      <div>
        <h4 class="text-primary-text font-bold text-lg">Trading Accounts</h4>
      </div>

      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <!-- Left -->
        <div
          id="tour-fm-accounts-tabs"
          class="flex flex-wrap items-center gap-3"
        >
          <!-- Level 1 -->
          <AccountFilterTabs
            :model-value="store.platformFilter"
            :tabs="PLATFORM_TABS"
            @update:model-value="store.setPlatformFilter"
          />

          <!-- Level 2 -->
          <AccountFilterTabs
            v-if="store.platformFilter === 'real'"
            :model-value="store.typeFilter"
            :tabs="TYPE_TABS"
            @update:model-value="store.setTypeFilter"
          />
        </div>

        <!-- Right -->
        <div class="flex items-center gap-3 self-start md:self-auto">
          <button
            v-if="!isFm"
            type="button"
            @click="handleAddAccount"
            class="h-10 px-5 inline-flex items-center justify-center gap-2 rounded-full bg-button text-button-text text-xs font-semibold hover:brightness-110 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Plus class="w-4 h-4 text-button-text" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      <!-- Accounts Grid Section (Persistent for tour) -->
      <div id="tour-fm-accounts-grid">
        <!-- Loading state -->
        <div
          v-if="store.loading"
          class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6"
        >
          <div
            v-for="n in 3"
            :key="n"
            class="bg-card-background rounded-4xl p-5 animate-pulse"
          >
            <!-- Header: status + login + settings -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="h-6 w-14 bg-primary-border/40 rounded-md"></div>
                <div class="h-4 w-28 bg-primary-border/30 rounded"></div>
              </div>
              <div class="h-8 w-8 bg-primary-border/40 rounded-full"></div>
            </div>

            <!-- Group label / Server -->
            <div class="h-3 w-36 bg-primary-border/30 rounded my-4"></div>

            <!-- Dotted Divider -->
            <div
              class="border-b border-dotted border-primary-border/60 my-3"
            ></div>

            <!-- Currency + Visibility button -->
            <div class="flex items-center justify-between mb-3">
              <div class="h-7 w-24 bg-primary-border/40 rounded-full"></div>
              <div class="h-5 w-5 bg-primary-border/30 rounded"></div>
            </div>

            <!-- Stats (Leverage, Credits, Balance, Equity) -->
            <div class="space-y-3 mb-4">
              <div
                v-for="i in 4"
                :key="i"
                class="flex items-center justify-between"
              >
                <div class="h-3.5 w-16 bg-primary-border/30 rounded"></div>
                <div class="h-3.5 w-24 bg-primary-border/40 rounded"></div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <div class="flex-1 h-9 bg-primary-border/40 rounded-full"></div>
              <div class="flex-1 h-9 bg-primary-border/40 rounded-full"></div>
              <div
                class="h-9 w-9 bg-primary-border/40 rounded-full shrink-0"
              ></div>
              <div
                class="h-9 w-9 bg-primary-border/40 rounded-full shrink-0"
              ></div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!store.data.length"
          class="bg-card-background border border-primary-border rounded-2xl p-10 flex flex-col items-center justify-center text-center"
        >
          <p class="text-primary-text font-semibold mb-1">No accounts found</p>
          <p class="text-secondary-text text-sm mb-4">
            Try a different filter, or add your first trading account.
          </p>
          <button
            type="button"
            @click="handleAddAccount"
            class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-button text-button-text font-semibold text-xs transition-all duration-200 hover:brightness-110 cursor-pointer shadow-sm"
          >
            <Plus class="w-4 h-4 text-button-text" />
            <span>Add Account</span>
          </button>
        </div>

        <!-- Account Cards Grid -->
        <div
          v-else
          class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6"
        >
          <AccountCard
            v-for="account in store.data"
            :key="account.id"
            :account="account"
            @deposit="onDeposit"
            @withdraw="onWithdraw"
            @transfer="onTransfer"
            @transaction="onTransaction"
            @changePassword="onChangePassword"
            @editLabel="onEditLabel"
            @changeLeverage="onChangeLeverage"
          />
        </div>
      </div>

      <pagination :pagination="store.pagination" @change="store.setPage" />
    </div>

    <AccountsDisclaimer />

    <!-- dialogs  -->

    <AddEditAccount
      :open="openDialog"
      :editData="editData"
      @close="closeDialog"
    />
    <TransactionDialog
      :open="transactionDialog.open"
      :type="transactionDialog.type"
      :account="transactionDialog.account"
      @close="transactionDialog.open = false"
      @withdrawal-hold="withdrawalHoldDialogOpen = true"
    />
    <WithDrawalHoldDialog
      :open="withdrawalHoldDialogOpen"
      @close="withdrawalHoldDialogOpen = false"
    />
    <ChangePasswordDialog
      :open="changePasswordDialog.open"
      :account="changePasswordDialog.account"
      @close="closeChangePassword"
    />
    <EditLabelDialog
      :open="editLabelDialog.open"
      :account="editLabelDialog.account"
      @close="closeEditLabel"
      @success="store.fetchAccounts(true)"
    />
    <ChangeLeverageDialog
      :open="changeLeverageDialog.open"
      :account="changeLeverageDialog.account"
      @close="closeChangeLeverage"
      @success="store.fetchAccounts(true)"
    />
    <InternalTransferDialog
      :open="internalTransferDialog.open"
      :account="internalTransferDialog.account"
      @close="internalTransferDialog.open = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { Plus } from "lucide-vue-next";
import InternalTransferDialog from "@/components/client/accounts/InternalTransferDialog.vue";
import AddEditAccount from "@/components/client/accounts/AddEditAccount.vue";
import ChangePasswordDialog from "@/components/client/accounts/ChangePasswordDialog.vue";
import EditLabelDialog from "@/components/client/accounts/EditLabelDialog.vue";
import ChangeLeverageDialog from "@/components/client/accounts/ChangeLeverageDialog.vue";
import TransactionDialog from "@/components/client/accounts/TransactionDialog.vue";
import WithDrawalHoldDialog from "@/components/client/accounts/WithDrawalHoldDialog.vue";
import banner1 from "@/assets/header.png";
import banner2 from "@/assets/header.png";
import banner3 from "@/assets/header.png";

import {
  useFmTradingAccountsStore,
  PLATFORM_TABS,
  TYPE_TABS,
} from "@/stores/fm/tradingAccounts";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useProfileStore } from "@/stores/shared/profile";

import CompetitionsBanner from "@/components/common/CompetitionsBanner.vue";
import AccountFilterTabs from "@/components/client/accounts/AccountFilterTabs.vue";
import AccountCard from "@/components/client/accounts/AccountCard.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";

import { useBannersStore } from "@/stores/shared/banners";

const store = useFmTradingAccountsStore();
const bannersStore = useBannersStore();
const snackbar = useSnackbarStore();
const router = useRouter();
const profile = useProfileStore();

onMounted(() => {
  bannersStore.fetchBanners();
});

const transactionDialog = ref({
  open: false,
  type: "deposit",
  account: null,
});
const internalTransferDialog = ref({
  open: false,
  account: null,
});
const changePasswordDialog = ref({
  open: false,
  account: null,
});
const editLabelDialog = ref({
  open: false,
  account: null,
});
const changeLeverageDialog = ref({
  open: false,
  account: null,
});
const banners = [
  {
    id: 1,
    image: banner1,
    title: "Trade Smarter",
    description: "Start your trading journey today.",
    buttonText: "Get Started",
  },
  {
    id: 2,
    image: banner2,
    title: "Win Big Rewards",
    description: "Join our latest competition.",
    buttonText: "Join Now",
  },
  {
    id: 3,
    image: banner3,
    title: "Invite Friends",
    description: "Earn referral bonuses.",
    buttonText: "Invite",
  },
];
const withdrawalHoldDialogOpen = ref(false);
const openDialog = ref(false);
const editData = ref(null);

const isKycVerified = computed(() =>
  String(profile.user?.kyc_status || "")
    .toLowerCase()
    .trim(),
);
const isFm = computed(() => profile.user?.role?.toLowerCase() === "fm");

onMounted(() => {
  if (!profile.isFetched) {
    profile.fetchUserProfile();
  }
  store.fetchAccounts();
});

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// add edit account
const handleAddAccount = () => {
  if (isFm.value) return;

  if (isKycVerified.value == "pending") {
    snackbar.show("Please verify your KYC before adding an account.", "error");
    return;
  }

  onAddAccount();
};
const onAddAccount = () => {
  editData.value = null; // Add mode
  openDialog.value = true;
};
const closeDialog = () => {
  openDialog.value = false;
  editData.value = null;
};

// deposit and withdraw logic
const onDeposit = (account) => {
  // transactionDialog.value = {
  //   open: true,
  //   type: "deposit",
  //   account,
  // };
  router.push({
    name: "fm-funds",
    query: { tab: "deposit", accountId: account?.id },
  });
};

watchEffect(() => {
  console.log(store.platformFilter);
});

const onWithdraw = (account) => {
  router.push({
    name: "fm-funds",
    query: { tab: "withdraw", accountId: account?.id },
  });
};

// internal transfer logic
const onTransfer = (account) => {
  // internalTransferDialog.value = {
  //   open: true,
  //   account,
  // };
  router.push({
    name: "fm-funds",
    query: { tab: "transfer", accountId: account?.id },
  });
};

const onTransaction = (account) => {
  localStorage.setItem("active_account", JSON.stringify(account));
  router.push({
    name: "fm-account-transactions",
    params: {
      id: account.id,
    },
  });
};

const onChangePassword = (account) => {
  changePasswordDialog.value = {
    open: true,
    account,
  };
};
const closeChangePassword = () => {
  changePasswordDialog.value = {
    open: false,
    account: null,
  };
};

const onEditLabel = (account) => {
  editLabelDialog.value = {
    open: true,
    account,
  };
};
const closeEditLabel = () => {
  editLabelDialog.value = {
    open: false,
    account: null,
  };
};

const onChangeLeverage = (account) => {
  changeLeverageDialog.value = {
    open: true,
    account,
  };
};
const closeChangeLeverage = () => {
  changeLeverageDialog.value = {
    open: false,
    account: null,
  };
};
</script>
