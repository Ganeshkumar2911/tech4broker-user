<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import { useIBDashboard } from "@/stores/ib/dashboard";
import { useIbWalletStore } from "@/stores/ib/wallet";
import { useFmWalletStore } from "@/stores/fm/yourWallet";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { buildAccountOption } from "@/utils/formatters";

const route = useRoute();
const accountsStore = useTradingAccountsStore();
const ibDashboardStore = useIBDashboard();
const ibWalletStore = useIbWalletStore();
const fmWalletStore = useFmWalletStore();
const snackbar = useSnackbarStore();
const { data } = storeToRefs(accountsStore);

// ─── Determine Role (IB vs FM vs Client) ──────────────────────────────────────
const activeRole = computed(() => {
  if (route.name === "ib-funds" || route.path.startsWith("/ib")) return "ib";
  if (route.name === "fm-funds" || route.path.startsWith("/fm")) return "fm";
  return localStorage.getItem("role") || "client";
});

const isIb = computed(() => activeRole.value === "ib");
const isFm = computed(() => activeRole.value === "fm");

// ─── IB Balance ───────────────────────────────────────────────────────────────
const effectiveIbBalance = computed(() => {
  const walletBal = ibWalletStore.summary?.wallet_balance;
  const dashboardBal =
    ibDashboardStore.dashboardData?.Account_details?.available_balance ??
    ibDashboardStore.dashboardData?.overview?.available_balance ??
    ibDashboardStore.dashboardData?.available_balance;

  const rawVal = walletBal !== undefined && walletBal !== null ? walletBal : dashboardBal;
  if (rawVal !== undefined && rawVal !== null) {
    const cleaned = String(rawVal).replace(/,/g, "");
    return Number(cleaned) || 0;
  }
  return 0;
});

const formattedIbBalance = computed(() => {
  return Number(effectiveIbBalance.value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

// ─── FM Balance ───────────────────────────────────────────────────────────────
const effectiveFmBalance = computed(() => {
  const walletBal = fmWalletStore.summary?.wallet_balance;
  if (walletBal !== undefined && walletBal !== null) {
    const cleaned = String(walletBal).replace(/,/g, "");
    return Number(cleaned) || 0;
  }
  return 0;
});

const formattedFmBalance = computed(() => {
  return Number(effectiveFmBalance.value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

const searchAccountsOptions = ref([]);
const isAccountsLoading = ref(true);
const isSubmitting = ref(false);

const fetchAccountsOptions = (query = "") => {
  isAccountsLoading.value = true;
  apiRequest(urls.KEYS.GET, urls.tradingAccounts.searchAccounts, {
    params: { q: query },
    isTokenRequired: true,
    onSuccess: (res) => {
      const rawAccounts = res?.data?.accounts || [];
      searchAccountsOptions.value = rawAccounts
        .map(buildAccountOption)
        .filter(Boolean);
      isAccountsLoading.value = false;
    },
    onFailure: () => {
      isAccountsLoading.value = false;
    },
  });
};

onMounted(() => {
  if (isIb.value) {
    ibWalletStore.fetchWalletLedger(true);
    ibDashboardStore.fetchDashboardData();
    fetchAccountsOptions("");
  } else if (isFm.value) {
    fmWalletStore.fetchWallet(true);
    accountsStore.fetchAccounts(true);
    fetchAccountsOptions("");
  } else {
    fetchAccountsOptions("");
  }
});

const isAccountsLoadingState = computed(
  () => isAccountsLoading.value,
);

const accountOptions = computed(() => {
  if (searchAccountsOptions.value.length > 0) {
    return searchAccountsOptions.value;
  }
  return data.value.map(buildAccountOption).filter(Boolean);
});

const toAccountOptions = computed(() => {
  if (!form.value.fromAccount || isIb.value) {
    return accountOptions.value;
  }
  return accountOptions.value.filter(
    (opt) => String(opt.value) !== String(form.value.fromAccount),
  );
});

// ─── Resolve Destination Account & Cent Detection ─────────────────────────────
const fmMasterAccount = computed(() => {
  if (!isFm.value) return null;
  const list = data.value || [];
  if (list.length > 0) {
    return (
      list.find(
        (a) =>
          a.is_master ||
          a.account_type?.toLowerCase().includes("master") ||
          a.type?.toLowerCase().includes("master") ||
          a.group_name?.toLowerCase().includes("master"),
      ) || list[0]
    );
  }
  if (searchAccountsOptions.value.length > 0) {
    const rawList = searchAccountsOptions.value.map((opt) => opt.raw).filter(Boolean);
    return (
      rawList.find(
        (a) =>
          a.is_master ||
          a.account_type?.toLowerCase().includes("master") ||
          a.type?.toLowerCase().includes("master") ||
          a.group_name?.toLowerCase().includes("master"),
      ) || rawList[0]
    );
  }
  return null;
});

const selectedToAccountObj = computed(() => {
  if (isFm.value) {
    return fmMasterAccount.value;
  }
  if (!form.value.toAccount) return null;
  const foundOpt = accountOptions.value.find(
    (opt) => String(opt.value) === String(form.value.toAccount),
  );
  return (
    foundOpt?.raw ||
    data.value.find((a) => String(a.id) === String(form.value.toAccount)) ||
    null
  );
});

const selectedFromAccountObj = computed(() => {
  if (isIb.value || isFm.value) return null;
  if (!form.value.fromAccount) return null;
  const foundOpt = accountOptions.value.find(
    (opt) => String(opt.value) === String(form.value.fromAccount),
  );
  return (
    foundOpt?.raw ||
    data.value.find((a) => String(a.id) === String(form.value.fromAccount)) ||
    null
  );
});

const fromAccountCurrency = computed(() => {
  if (isIb.value || isFm.value) return "USD";
  const acc = selectedFromAccountObj.value;
  if (!acc) return "USD";
  
  const cur = (
    acc.broker_currency ||
    acc.currency ||
    acc.account?.broker_currency ||
    acc.account?.currency ||
    "USD"
  ).toUpperCase();
  
  const type = (
    acc.account_type ||
    acc.type ||
    acc.account_type_name ||
    acc.group_name ||
    acc.account?.group_name ||
    ""
  ).toLowerCase();
  
  if (cur === "USC" || type.includes("cent") || acc.is_cent === true || acc.account?.is_cent === true) {
    return "USC";
  }
  return cur;
});

const isToCentAccount = computed(() => {
  const acc = selectedToAccountObj.value;
  if (!acc) return false;
  const cur = (
    acc.broker_currency ||
    acc.currency ||
    acc.account?.broker_currency ||
    acc.account?.currency ||
    ""
  ).toUpperCase();
  const type = (
    acc.account_type ||
    acc.type ||
    acc.account_type_name ||
    acc.group_name ||
    acc.account?.group_name ||
    ""
  ).toLowerCase();
  return cur === "USC" || type.includes("cent") || acc.is_cent === true || acc.account?.is_cent === true;
});

const creditedAmountInfo = computed(() => {
  const amt = Number(form.value.amount || 0);
  if (isNaN(amt) || amt <= 0) return null;

  const fromCurr = fromAccountCurrency.value;
  const isToCent = isToCentAccount.value;
  
  let creditedAmt = amt;
  let rateText = null;

  if (fromCurr === "USD" && isToCent) {
    creditedAmt = amt * 100;
    rateText = "1 USD = 100 USC (Cent Account)";
  } else if (fromCurr === "USC" && !isToCent) {
    creditedAmt = amt / 100;
    rateText = "100 USC = 1 USD (Standard Account)";
  } else if (fromCurr === "USC" && isToCent) {
    rateText = "1 USC = 1 USC";
  }

  const cur = isToCent ? "USC" : (
    selectedToAccountObj.value?.broker_currency ||
    selectedToAccountObj.value?.currency ||
    "USD"
  ).toUpperCase();

  return {
    isCent: isToCent,
    amount: creditedAmt.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    currency: cur,
    symbol: cur === "USD" ? "$" : (cur === "USC" ? "¢" : cur + " "),
    rateText: rateText,
    destinationLabel: isFm.value
      ? "Master Trading Account"
      : selectedToAccountObj.value?.account_number
      ? `Account #${selectedToAccountObj.value.account_number}`
      : "Destination Account",
  };
});

let searchTimer = null;
const onAccountSearch = (query) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchAccountsOptions(query);
  }, 350);
};

const form = ref({
  fromAccount: isIb.value ? "ib-wallet" : isFm.value ? "fm-wallet" : null,
  toAccount: isFm.value ? "master-account" : null,
  amount: "",
  description: "",
});

watch(
  () => form.value.fromAccount,
  (newFrom) => {
    if (newFrom && String(newFrom) === String(form.value.toAccount)) {
      form.value.toAccount = null;
    }
  },
);

const setDefaultAccount = () => {
  if (isIb.value) {
    form.value.fromAccount = "ib-wallet";
    return;
  }
  if (isFm.value) {
    form.value.fromAccount = "fm-wallet";
    form.value.toAccount = "master-account";
    return;
  }
  const targetId = route.query.accountId;
  if (!targetId) return;

  const found = accountOptions.value.find(
    (opt) => String(opt.value) === String(targetId),
  );
  if (found) {
    form.value.fromAccount = found.value;
  }
};

watch(
  [accountOptions, () => route.query.accountId, isIb, isFm],
  () => {
    setDefaultAccount();
  },
  { immediate: true },
);

function setMaxAmount() {
  if (isIb.value) {
    if (effectiveIbBalance.value > 0) {
      form.value.amount = effectiveIbBalance.value;
    }
    return;
  }
  if (isFm.value) {
    if (effectiveFmBalance.value > 0) {
      form.value.amount = effectiveFmBalance.value;
    }
    return;
  }
  const selectedOpt = accountOptions.value.find(
    (opt) => String(opt.value) === String(form.value.fromAccount),
  );
  const account =
    selectedOpt?.raw ||
    data.value.find((acc) => String(acc.id) === String(form.value.fromAccount));
  const bal =
    account?.metrics?.balance !== undefined
      ? account.metrics.balance
      : (account?.balance ?? "");
  form.value.amount = bal;
}

const handleSubmit = () => {
  if (!isFm.value && !form.value.toAccount) {
    snackbar.show("Please select a destination account.", "error");
    return;
  }
  if (!form.value.amount || Number(form.value.amount) <= 0) {
    snackbar.show("Please enter a valid transfer amount.", "error");
    return;
  }

  isSubmitting.value = true;

  if (isFm.value) {
    if (effectiveFmBalance.value > 0 && Number(form.value.amount) > effectiveFmBalance.value) {
      isSubmitting.value = false;
      snackbar.show("Amount exceeds your available FM commission balance.", "error");
      return;
    }

    const toAccountId =
      fmMasterAccount.value?.id ||
      fmMasterAccount.value?.account_id ||
      (form.value.toAccount && form.value.toAccount !== "master-account" ? form.value.toAccount : null);

    if (!toAccountId) {
      isSubmitting.value = false;
      snackbar.show("Could not find a valid master trading account.", "error");
      return;
    }

    const payload = {
      to_account_id: Number(toAccountId),
      amount: Number(form.value.amount),
    };

    apiRequest(urls.KEYS.POST, urls.fm.internalTransfer, {
      data: payload,
      isTokenRequired: true,
      onSuccess: (res) => {
        isSubmitting.value = false;
        snackbar.show(res?.message || "Internal transfer completed successfully!", "success");
        form.value.amount = "";
        form.value.description = "";
        fmWalletStore.fetchWallet(true);
        accountsStore.fetchAccounts(true);
      },
      onFailure: (err) => {
        isSubmitting.value = false;
        snackbar.show(err?.message || "Transfer failed.", "error");
      },
    });
    return;
  }

  if (isIb.value) {
    if (effectiveIbBalance.value > 0 && Number(form.value.amount) > effectiveIbBalance.value) {
      isSubmitting.value = false;
      snackbar.show("Amount exceeds your available IB rebate balance.", "error");
      return;
    }

    const payload = {
      trading_account_id: Number(form.value.toAccount),
      amount: Number(form.value.amount),
    };

    apiRequest(urls.KEYS.POST, urls.wallet.walletToAccountTransfer, {
      data: payload,
      isTokenRequired: true,
      onSuccess: (res) => {
        isSubmitting.value = false;
        snackbar.show(res?.message || "Transfer completed successfully!", "success");
        form.value.amount = "";
        form.value.toAccount = null;
        ibWalletStore.fetchWalletLedger(true);
        ibDashboardStore.fetchDashboardData();
      },
      onFailure: (err) => {
        isSubmitting.value = false;
        snackbar.show(err?.message || "Transfer failed.", "error");
      },
    });
  } else {
    if (!form.value.fromAccount) {
      isSubmitting.value = false;
      snackbar.show("Please select a source account.", "error");
      return;
    }

    if (String(form.value.fromAccount) === String(form.value.toAccount)) {
      isSubmitting.value = false;
      snackbar.show("Source and destination accounts cannot be the same.", "error");
      return;
    }

    let payloadAmount = Number(form.value.amount);
    if (fromAccountCurrency.value === "USC" && !isToCentAccount.value) {
      payloadAmount = payloadAmount / 100;
    }

    const payload = {
      from_account_id: form.value.fromAccount,
      to_account_id: form.value.toAccount,
      amount: payloadAmount,
    };

    apiRequest(urls.KEYS.POST, urls.tradingAccounts.internalTransfer || urls.funds.transfer, {
      data: payload,
      isTokenRequired: true,
      onSuccess: (res) => {
        isSubmitting.value = false;
        snackbar.show(res?.message || "Transfer completed successfully!", "success");
        form.value.amount = "";
        form.value.toAccount = null;
        accountsStore.fetchAccounts(true);
      },
      onFailure: (err) => {
        isSubmitting.value = false;
        snackbar.show(err?.message || "Transfer failed.", "error");
      },
    });
  }
};
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6 lg:gap-16">
    <!-- Left Form -->
    <div class="space-y-6 px-2 sm:px-4 lg:px-2">
      <!-- From Account -->
      <div>
        <p class="mid-text font-medium text-primary-text mb-2">From</p>

        <!-- IB Mode: Auto-selected IB Rebate Wallet Card -->
        <div v-if="isIb" class="rounded-2xl border border-primary-border bg-background p-4 flex items-center justify-between">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p class="text-sm font-bold text-primary-text">IB Wallet (Rebate Account)</p>
            </div>
            <p class="text-xs text-secondary-text">Source account for rebate transfers</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] uppercase font-bold text-secondary-text">Available</p>
            <p class="text-sm font-bold text-primary-text font-mono">${{ formattedIbBalance }} USD</p>
          </div>
        </div>

        <!-- FM Mode: Auto-selected FM Commission Wallet Card -->
        <div v-else-if="isFm" class="rounded-2xl border border-primary-border bg-background p-4 flex items-center justify-between">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p class="text-sm font-bold text-primary-text">FM Wallet (Commission Account)</p>
            </div>
            <p class="text-xs text-secondary-text">Source account for commission transfers</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] uppercase font-bold text-secondary-text">Available</p>
            <p class="text-sm font-bold text-primary-text font-mono">${{ formattedFmBalance }} USD</p>
          </div>
        </div>

        <!-- Client Mode: Select Source Account -->
        <BaseSelect
          v-else
          v-model="form.fromAccount"
          :options="accountOptions"
          :isLoading="isAccountsLoadingState"
          placeholder="Select account"
          height="44px"
          searchable
          @search="onAccountSearch"
        />

        <p v-if="!isIb && !isFm" class="sub-text text-secondary-text mt-2 font-bold">
          Transfer amount may adjust based on open positions.
        </p>
      </div>

      <!-- To Account -->
      <div>
        <p class="mid-text font-medium text-primary-text mb-2">To</p>

        <!-- FM Mode: Fixed Master Trading Account -->
        <div v-if="isFm" class="rounded-2xl border border-primary-border bg-background p-4 flex items-center justify-between">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-primary-blue animate-pulse"></span>
              <p class="text-sm font-bold text-primary-text">
                Master Trading Account
                <span v-if="fmMasterAccount?.account_number || fmMasterAccount?.id" class="font-mono text-xs text-secondary-text font-normal">
                  (#{{ fmMasterAccount.account_number || fmMasterAccount.id }})
                </span>
              </p>
            </div>
            <p class="text-xs text-secondary-text">
              Fixed destination account
              <span v-if="isToCentAccount" class="font-semibold text-amber-500">
                · Cent Account (USC)
              </span>
            </p>
          </div>
          <div class="text-right flex flex-col items-end gap-1">
            <span class="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">Auto-Assigned</span>
            <span v-if="isToCentAccount" class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono">
              1 USD = 100 USC
            </span>
          </div>
        </div>

        <!-- IB & Client Mode: Select Destination Account -->
        <BaseSelect
          v-else
          v-model="form.toAccount"
          :options="toAccountOptions"
          :isLoading="isAccountsLoadingState"
          placeholder="Select destination account"
          height="44px"
          searchable
          @search="onAccountSearch"
        />
      </div>

      <!-- Amount -->
      <div>
        <p class="mid-text font-medium text-primary-text mb-2">Amount ({{ fromAccountCurrency }})</p>

        <div class="flex gap-2 sm:gap-3 w-full">
          <input
            v-model="form.amount"
            type="number"
            placeholder="0.00"
            class="min-w-0 flex-1 h-11 rounded-xl border border-primary-border bg-background px-3 sm:px-4 outline-none text-primary-text text-sm font-medium focus:ring-1 focus:ring-primary"
          />

          <button
            type="button"
            @click="setMaxAmount"
            class="shrink-0 cursor-pointer h-11 px-4 sm:px-5 rounded-xl bg-background border border-primary-border text-primary-text font-semibold hover:bg-card-background transition"
          >
            MAX
          </button>
        </div>
      </div>

      <!-- Amount & Conversion / Credit Preview -->
      <div
        v-if="creditedAmountInfo && Number(form.amount) > 0"
        class="rounded-2xl border border-primary-border bg-card-background/60 p-4 space-y-3 transition-all duration-200"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="text-secondary-text">Transfer Amount:</span>
          <span class="font-bold font-mono text-primary-text">
            {{ fromAccountCurrency === 'USD' ? '$' : '' }}{{ Number(form.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ fromAccountCurrency }}
          </span>
        </div>

        <div class="flex items-center justify-between border-t border-primary-border/60 pt-2.5">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-primary-text">Amount to be Credited:</span>
            <span
              v-if="creditedAmountInfo.rateText"
              class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tracking-wide"
            >
              {{ creditedAmountInfo.rateText }}
            </span>
          </div>
          <div class="text-right">
            <span
              class="text-base font-bold font-mono"
              :class="creditedAmountInfo.isCent ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500'"
            >
              {{ creditedAmountInfo.symbol }}{{ creditedAmountInfo.amount }} {{ creditedAmountInfo.currency }}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        :disabled="
          isSubmitting ||
          !form.amount ||
          Number(form.amount) <= 0 ||
          (isFm && effectiveFmBalance > 0 && Number(form.amount) > effectiveFmBalance) ||
          (!isFm && !form.toAccount) ||
          (!isFm && !isIb && !form.fromAccount) ||
          (!isFm && !isIb && String(form.fromAccount) === String(form.toAccount)) ||
          (isIb && effectiveIbBalance > 0 && Number(form.amount) > effectiveIbBalance)
        "
        @click="handleSubmit"
        class="w-full h-11 cursor-pointer rounded-xl bg-button text-button-text hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold flex items-center justify-center gap-2"
      >
        <span v-if="isSubmitting" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
        <span>{{ isSubmitting ? 'Transferring...' : 'Submit' }}</span>
      </button>
    </div>

    <!-- Right Notes -->
    <div class="w-full flex justify-start mt-8 lg:mt-0">
      <div
        class="w-full max-w-full sm:max-w-[420px] lg:max-w-[450px] rounded-2xl p-2"
      >
        <h2 class="text-2xl font-bold text-primary-text mb-6">Please note:</h2>

        <div class="space-y-6 text-secondary-text leading-7 text-[15px]">
          <p>
            You are responsible for maintaining an account balance that will not
            trigger a margin call. If you have any current open positions,
            please ensure you maintain the required margin in your account.
            Funds transferred to accounts held in the same currency are
            processed instantly.
          </p>

          <p>
            If transferring funds between accounts held in different currencies,
            email
            <a href="mailto:info@startrader.com" class="text-primary underline">
              support@panthercapitals.com </a
            >.
          </p>

          <p>
            Funds transferred between accounts held in the same currency are
            processed instantly during weekdays. Transfer-between-account
            requests submitted on weekends will only be processed after manual
            review.
          </p>

          <p>
            Please note that funds cannot be transferred between read-only
            accounts.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
