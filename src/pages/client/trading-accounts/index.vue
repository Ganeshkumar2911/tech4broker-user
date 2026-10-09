<template>
  <div class="space-y-6">
    <!-- Competitions banner -->
    <CompetitionsBanner :loading="bannersStore.loading" :items="bannersStore.banners" />

    <!-- Header + Filters -->
    <div class="space-y-3 sm:space-y-4">
      <!-- Header Row: Title -->
      <div class="flex items-center justify-between gap-3">
        <h4 class="text-primary-text font-bold text-base sm:text-lg">Trading Accounts</h4>
      </div>

      <!-- Mobile Layout (< sm): Row 2 (Dropdowns) + Row 3 (Actions) -->
      <div class="sm:hidden space-y-2.5">
        <!-- Row 2: Two Balanced Dropdowns side by side -->
        <div class="grid grid-cols-2 gap-2 w-full">
          <BaseSelect
            :model-value="mobileActiveValue"
            :options="mobileFilterOptions"
            @update:model-value="handleMobileSelect"
            rounded="full"
            height="38px"
            button-class="h-[38px] px-3.5 text-xs font-semibold bg-card-background border border-primary-border/40"
          />
          <BaseSelect
            :model-value="mobileStatusValue"
            :options="mobileStatusOptions"
            @update:model-value="handleMobileStatusSelect"
            rounded="full"
            height="38px"
            button-class="h-[38px] px-3.5 text-xs font-semibold bg-card-background border border-primary-border/40"
          />
        </div>

        <!-- Row 3: Mobile Action Buttons (Refresh + Add Account) -->
        <div class="flex items-center gap-2">
          <RefreshButton
            :loading="store.loading"
            @click="store.fetchAccounts(true)"
          />
          <Tooltip
            v-if="store.isActiveFilter !== false"
            text="Open New Trading Account"
            position="bottom"
            class="flex-1"
          >
            <button
              id="tour-accounts-add-btn-mobile"
              type="button"
              @click="handleAddAccount"
              class="w-full h-[38px] px-4 inline-flex items-center justify-center gap-2 rounded-full bg-button text-button-text text-xs font-semibold hover:brightness-110 active:scale-[0.99] transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              <Plus class="w-4 h-4 text-button-text" />
              <span>Add Account</span>
            </button>
          </Tooltip>
        </div>
      </div>

      <!-- Desktop & Tablet Layout (sm and up): Single Row Container -->
      <div class="hidden sm:flex items-center justify-between gap-2.5 sm:gap-3">
        <!-- Desktop Tabs on Left -->
        <div class="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
          <!-- Primary Tabs: All Accounts | MT5 Live | MT5 Demo | Copy Trading -->
          <div
            id="tour-accounts-tabs"
            class="flex h-9 sm:h-10 items-center bg-card-background rounded-full p-1 border border-primary-border/40 shrink-0"
          >
            <button
              type="button"
              @click="selectTab('all')"
              class="h-7 sm:h-8 px-3 sm:px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap"
              :class="
                activeTab === 'all'
                  ? 'bg-button text-button-text font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              "
            >
              All Accounts
            </button>
            <button
              type="button"
              @click="selectTab('mt5_live')"
              class="h-7 sm:h-8 px-3 sm:px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap"
              :class="
                activeTab === 'mt5_live'
                  ? 'bg-button text-button-text font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              "
            >
              MT5 Live
            </button>
            <button
              type="button"
              @click="selectTab('mt5_demo')"
              class="h-7 sm:h-8 px-3 sm:px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap"
              :class="
                activeTab === 'mt5_demo'
                  ? 'bg-button text-button-text font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              "
            >
              MT5 Demo
            </button>
            <button
              type="button"
              @click="selectTab('copy_trading')"
              class="h-7 sm:h-8 px-3 sm:px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap"
              :class="
                activeTab === 'copy_trading'
                  ? 'bg-button text-button-text font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              "
            >
              Copy Trading
            </button>
          </div>

          <!-- Active | Archived Sub-Tabs -->
          <div class="flex h-9 sm:h-10 items-center bg-card-background rounded-full p-1 border border-primary-border/40 shrink-0">
            <button
              type="button"
              @click="store.setIsActiveFilter(true)"
              class="h-7 sm:h-8 px-3 sm:px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap"
              :class="
                store.isActiveFilter === true
                  ? 'bg-button text-button-text font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              "
            >
              Active
            </button>
            <button
              type="button"
              @click="store.setIsActiveFilter(false)"
              class="h-7 sm:h-8 px-3 sm:px-4 text-xs font-semibold rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap"
              :class="
                store.isActiveFilter === false
                  ? 'bg-button text-button-text font-bold'
                  : 'text-secondary-text hover:text-primary-text'
              "
            >
              Archived
            </button>
          </div>
        </div>

        <!-- Desktop Actions on Right -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            :loading="store.loading"
            @click="store.fetchAccounts(true)"
          />
          <Tooltip
            v-if="store.isActiveFilter !== false"
            text="Open New Trading Account"
            position="bottom"
          >
            <button
              id="tour-accounts-add-btn"
              type="button"
              @click="handleAddAccount"
              class="h-9 sm:h-10 px-3 sm:px-4 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-button text-button-text text-xs font-semibold hover:brightness-110 transition-all duration-200 cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Plus class="w-4 h-4 text-button-text" />
              <span>Add Account</span>
            </button>
          </Tooltip>
        </div>
      </div>

      <!-- summary  -->
      <!-- <div v-if="!store.loading" class="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          class="bg-card-background border border-primary-border rounded-xl p-4"
        >
          <p class="text-xs text-secondary-text">Total Accounts</p>

          <p class="text-xl font-bold text-primary-text mt-2">
            {{ store.summary.total_accounts }}
          </p>
        </div>

        <div
          class="bg-card-background border border-primary-border rounded-xl p-4"
        >
          <p class="text-xs text-secondary-text">Balance</p>

          <p class="text-xl font-bold text-primary-text mt-2">
            {{ formatMoney(store.summary.total_balance) }}
          </p>
        </div>

        <div
          class="bg-card-background border border-primary-border rounded-xl p-4"
        >
          <p class="text-xs text-secondary-text">Equity</p>

          <p class="text-xl font-bold text-primary-text mt-2">
            {{ formatMoney(store.summary.total_equity) }}
          </p>
        </div>

        <div
          class="bg-card-background border border-primary-border rounded-xl p-4"
        >
          <p class="text-xs text-secondary-text">Total PnL</p>

          <p class="text-xl font-bold text-primary-text">
            {{ formatMoney(store.summary.total_pnl) }}
          </p>
        </div>
      </div> -->
      <!-- Accounts Grid Section (Persistent for tour) -->
      <div id="tour-accounts-grid">
        <!-- Loading state -->
        <div
          v-if="store.loading"
          class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6"
        >
          <div
            v-for="n in 3"
            :key="n"
            :id="n === 1 ? 'tour-accounts-card-first' : undefined"
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
            <div class="border-b border-dotted border-primary-border/60 my-3"></div>

            <!-- Currency + Visibility button -->
            <div class="flex items-center justify-between mb-3">
              <div class="h-7 w-24 bg-primary-border/40 rounded-full"></div>
              <div class="h-5 w-5 bg-primary-border/30 rounded"></div>
            </div>

            <!-- Stats (Leverage, Credits, Balance, Equity) -->
            <div class="space-y-3 mb-4">
              <div v-for="i in 4" :key="i" class="flex items-center justify-between">
                <div class="h-3.5 w-16 bg-primary-border/30 rounded"></div>
                <div class="h-3.5 w-24 bg-primary-border/40 rounded"></div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <div class="flex-1 h-9 bg-primary-border/40 rounded-full"></div>
              <div class="flex-1 h-9 bg-primary-border/40 rounded-full"></div>
              <div class="h-9 w-9 bg-primary-border/40 rounded-full shrink-0"></div>
              <div class="h-9 w-9 bg-primary-border/40 rounded-full shrink-0"></div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!store.data.length"
          id="tour-accounts-card-first"
          class="bg-card-background border border-primary-border rounded-2xl p-10 flex flex-col items-center justify-center text-center"
        >
          <p class="text-primary-text font-semibold mb-1">
            {{ store.isActiveFilter === false ? 'No archived accounts found' : 'No accounts found' }}
          </p>
          <p class="text-secondary-text text-sm">
            {{ store.isActiveFilter === false ? 'You currently have no archived trading accounts.' : 'Try a different filter, or add your first trading account.' }}
          </p>
          <button
            v-if="store.isActiveFilter !== false"
            type="button"
            @click="handleAddAccount"
            class="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-button text-button-text font-semibold text-xs transition-all duration-200 hover:brightness-110 cursor-pointer shadow-sm mt-4"
          >
            <Plus class="w-4 h-4 text-button-text" />
            <span>Add Account</span>
          </button>
        </div>

        <!-- Account Cards Grid -->
        <div v-else class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          <AccountCard
            v-for="(account, index) in store.data"
            :key="account.id"
            :id="index === 0 ? 'tour-accounts-card-first' : undefined"
            :account="account"
            @deposit="onDeposit"
            @withdraw="onWithdraw"
            @transfer="onTransfer"
            @transaction="onTransaction"
            @changePassword="onChangePassword"
            @editLabel="onEditLabel"
            @changeLeverage="onChangeLeverage"
            @toggleArchive="onToggleArchive"
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
    <ConfirmationModal
      :isOpen="archiveModal.open"
      title="Archive Account"
      subtitle="Trading will be disabled on MT5"
      confirmText="Archive"
      variant="warning"
      :loading="store.loading"
      @close="closeArchiveModal"
      @confirm="confirmArchive"
    >
      <div v-if="archiveModal.account">
        <p class="text-secondary-text mb-4">Are you sure you want to archive this account? You can unarchive it later from the Archived tab.</p>
        
        <div class="bg-background rounded-xl p-3 border border-primary-border/60 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-secondary-text">Account Number</span>
            <span class="font-bold text-primary-text">{{ archiveModal.account.account_number }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-secondary-text">Platform</span>
            <span class="font-bold text-primary-text uppercase">{{ archiveModal.account.platform }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-secondary-text">Balance</span>
            <span class="font-bold text-primary-text">{{ formatMoney(archiveModal.account.balance) }} {{ archiveModal.account.currency || archiveModal.account.broker_currency }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-secondary-text">Leverage</span>
            <span class="font-bold text-primary-text">1:{{ archiveModal.account.leverage || archiveModal.account.broker_leverage }}</span>
          </div>
        </div>
      </div>
    </ConfirmationModal>
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

import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useProfileStore } from "@/stores/shared/profile";

import CompetitionsBanner from "@/components/common/CompetitionsBanner.vue";
import AccountCard from "@/components/client/accounts/AccountCard.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import Pagination from "@/components/base/Pagination.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import ConfirmationModal from "@/components/base/ConfirmationModal.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";

import { useBannersStore } from "@/stores/shared/banners";

const store = useTradingAccountsStore();
const bannersStore = useBannersStore();
const snackbar = useSnackbarStore();
const router = useRouter();
const profile = useProfileStore();

const activeTab = ref("all"); // 'all' | 'mt5_live' | 'mt5_demo' | 'copy_trading'

const selectTab = (tab) => {
  activeTab.value = tab;
  if (tab === "all") {
    store.setChipFilter("all", "all");
  } else if (tab === "mt5_live") {
    store.setChipFilter("real", "live");
  } else if (tab === "mt5_demo") {
    store.setChipFilter("real", "demo");
  } else if (tab === "copy_trading") {
    store.setChipFilter("copy_trading", "all");
  }
};

const mobileFilterOptions = [
  { label: "All Accounts", value: "all" },
  { label: "MT5 Live", value: "mt5_live" },
  { label: "MT5 Demo", value: "mt5_demo" },
  { label: "Copy Trading", value: "copy_trading" },
];

const mobileActiveValue = computed(() => activeTab.value);

const handleMobileSelect = (val) => {
  selectTab(val);
};

const mobileStatusOptions = [
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
];

const mobileStatusValue = computed(() => {
  return store.isActiveFilter ? "active" : "archived";
});

const handleMobileStatusSelect = (val) => {
  store.setIsActiveFilter(val === "active");
};

watch(
  [() => store.platformFilter, () => store.typeFilter],
  ([plat, typ]) => {
    if (plat === "all") {
      activeTab.value = "all";
    } else if (plat === "copy_trading") {
      activeTab.value = "copy_trading";
    } else if (plat === "real") {
      if (typ === "demo") {
        activeTab.value = "mt5_demo";
      } else {
        activeTab.value = "mt5_live";
      }
    }
  },
  { immediate: true }
);

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

const archiveModal = ref({
  open: false,
  account: null,
});

const kycStatus = computed(() => String(profile.user?.kyc_status || '').toLowerCase().trim());
const isKycApproved = computed(() => {
  return kycStatus.value === "approved" || kycStatus.value === "verified" || kycStatus.value === "completed";
});

onMounted(() => {
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
  if (!isKycApproved.value) {
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
    name: "funds",
    query: { tab: "deposit", accountId: account?.id },
  });
};

watchEffect(() => {
  console.log(store.platformFilter);
});

const onWithdraw = (account) => {
  router.push({
    name: "funds",
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
    name: "funds",
    query: { tab: "transfer", accountId: account?.id },
  });
};

const onTransaction = (account) => {
  localStorage.setItem("active_account", JSON.stringify(account));
  router.push({
    name: "account-transactions",
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

const onToggleArchive = (account) => {
  const isArchived = account.is_active === false;
  if (!isArchived) {
    archiveModal.value = {
      open: true,
      account,
    };
  } else {
    store.toggleArchive(account);
  }
};

const closeArchiveModal = () => {
  archiveModal.value = {
    open: false,
    account: null,
  };
};

const confirmArchive = async () => {
  if (archiveModal.value.account) {
    try {
      await store.toggleArchive(archiveModal.value.account);
    } finally {
      closeArchiveModal();
    }
  }
};
</script>
