import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useCashbackStore = defineStore("cashback", () => {
  const snackbar = useSnackbarStore();

  // ─── Program State
  const program = ref(null);
  const isProgramLoading = ref(false);
  const isProgramFetched = ref(false);

  // ─── Accounts State
  const accounts = ref([]);
  const isAccountsLoading = ref(false);
  const isAccountsFetched = ref(false);

  // ─── Balance State
  const balance = ref(null);
  const isBalanceLoading = ref(false);
  const isBalanceFetched = ref(false);

  // ─── Transactions State
  const transactions = ref([]);
  const transactionsPagination = ref({
    page: 1,
    per_page: 50,
    total: 0,
    pages: 1,
  });
  const isTransactionsLoading = ref(false);
  const isTransactionsFetched = ref(false);

  // ─── Redemptions State
  const redemptions = ref([]);
  const redemptionsPagination = ref({
    page: 1,
    per_page: 50,
    total: 0,
    pages: 1,
  });
  const isRedemptionsLoading = ref(false);
  const isRedemptionsFetched = ref(false);

  // ─── Program Action State
  const isEnrolling = ref(false);
  const isChangingPlan = ref(false);
  const isUnenrolling = ref(false);
  const isRedeeming = ref(false);

  // ─── Methods ───

  const fetchProgram = (force = false, onComplete = null) => {
    if (isProgramFetched.value && !force) {
      if (onComplete) onComplete(program.value);
      return;
    }
    isProgramLoading.value = true;
    apiRequest("get", urls.cashback.program, {
      isTokenRequired: true,
      onSuccess: (res) => {
        program.value = res?.data || null;
        isProgramFetched.value = true;
        isProgramLoading.value = false;
        if (onComplete) onComplete(program.value);
      },
      onFailure: (err) => {
        isProgramLoading.value = false;
        snackbar.show(err?.message || "Failed to load cashback program.", "error");
        if (onComplete) onComplete(null);
      }
    });
  };

  const fetchAccounts = (force = false, onComplete = null) => {
    if (isAccountsFetched.value && !force) {
      if (onComplete) onComplete(accounts.value);
      return;
    }
    isAccountsLoading.value = true;
    apiRequest("get", urls.cashback.accounts, {
      isTokenRequired: true,
      onSuccess: (res) => {
        accounts.value = res?.data?.accounts || [];
        isAccountsFetched.value = true;
        isAccountsLoading.value = false;
        if (onComplete) onComplete(accounts.value);
      },
      onFailure: (err) => {
        isAccountsLoading.value = false;
        snackbar.show(err?.message || "Failed to load trading accounts for cashback.", "error");
        if (onComplete) onComplete([]);
      }
    });
  };

  const fetchBalance = (force = false, onComplete = null) => {
    if (isBalanceFetched.value && !force) {
      if (onComplete) onComplete(balance.value);
      return;
    }
    isBalanceLoading.value = true;
    apiRequest("get", urls.cashback.balance, {
      isTokenRequired: true,
      onSuccess: (res) => {
        balance.value = res?.data || null;
        isBalanceFetched.value = true;
        isBalanceLoading.value = false;
        if (onComplete) onComplete(balance.value);
      },
      onFailure: (err) => {
        isBalanceLoading.value = false;
        snackbar.show(err?.message || "Failed to load cashback balance.", "error");
        if (onComplete) onComplete(null);
      }
    });
  };

  const fetchTransactions = (page = 1, limit = 50, transactionType = "", force = false) => {
    isTransactionsLoading.value = true;
    const params = { offset: (page - 1) * limit, limit };
    if (transactionType) params.transaction_type = transactionType;

    apiRequest("get", urls.cashback.transactions, {
      params,
      isTokenRequired: true,
      onSuccess: (res) => {
        transactions.value = res?.data?.items || [];
        const total = res?.data?.total || 0;
        transactionsPagination.value = {
          page,
          per_page: limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        };
        isTransactionsFetched.value = true;
        isTransactionsLoading.value = false;
      },
      onFailure: (err) => {
        isTransactionsLoading.value = false;
        snackbar.show(err?.message || "Failed to load transactions.", "error");
      }
    });
  };

  const fetchRedemptions = (page = 1, limit = 50, force = false) => {
    isRedemptionsLoading.value = true;
    const params = { offset: (page - 1) * limit, limit };

    apiRequest("get", urls.cashback.redemptions, {
      params,
      isTokenRequired: true,
      onSuccess: (res) => {
        redemptions.value = res?.data?.items || [];
        const total = res?.data?.total || 0;
        redemptionsPagination.value = {
          page,
          per_page: limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        };
        isRedemptionsFetched.value = true;
        isRedemptionsLoading.value = false;
      },
      onFailure: (err) => {
        isRedemptionsLoading.value = false;
        snackbar.show(err?.message || "Failed to load redemptions.", "error");
      }
    });
  };

  const enroll = (tradingAccountId, planId, onSuccessCallback = null) => {
    isEnrolling.value = true;
    apiRequest("post", urls.cashback.enroll, {
      data: { trading_account_id: tradingAccountId, plan_id: planId },
      isTokenRequired: true,
      onSuccess: (res) => {
        isEnrolling.value = false;
        snackbar.show(res?.message || "Enrolled successfully!", "success");
        fetchAccounts(true);
        if (onSuccessCallback) onSuccessCallback(res);
      },
      onFailure: (err) => {
        isEnrolling.value = false;
        snackbar.show(err?.message || "Failed to enroll.", "error");
      }
    });
  };

  const changePlan = (tradingAccountId, planId, onSuccessCallback = null) => {
    isChangingPlan.value = true;
    apiRequest("post", urls.cashback.changePlan, {
      data: { trading_account_id: tradingAccountId, plan_id: planId },
      isTokenRequired: true,
      onSuccess: (res) => {
        isChangingPlan.value = false;
        snackbar.show(res?.message || "Plan change queued successfully!", "success");
        fetchAccounts(true);
        if (onSuccessCallback) onSuccessCallback(res);
      },
      onFailure: (err) => {
        isChangingPlan.value = false;
        snackbar.show(err?.message || "Failed to change plan.", "error");
      }
    });
  };

  const unenroll = (tradingAccountId, onSuccessCallback = null) => {
    isUnenrolling.value = true;
    apiRequest("post", urls.cashback.unenroll, {
      data: { trading_account_id: tradingAccountId },
      isTokenRequired: true,
      onSuccess: (res) => {
        isUnenrolling.value = false;
        snackbar.show(res?.message || "Unenrolled successfully!", "success");
        fetchAccounts(true);
        if (onSuccessCallback) onSuccessCallback(res);
      },
      onFailure: (err) => {
        isUnenrolling.value = false;
        snackbar.show(err?.message || "Failed to unenroll.", "error");
      }
    });
  };

  const redeem = (amount, tradingAccountId, onSuccessCallback = null) => {
    isRedeeming.value = true;
    apiRequest("post", urls.cashback.redeem, {
      data: { amount: String(amount), trading_account_id: tradingAccountId },
      isTokenRequired: true,
      onSuccess: (res) => {
        isRedeeming.value = false;
        snackbar.show(res?.message || "Redeemed successfully!", "success");
        fetchBalance(true);
        fetchRedemptions(1, 50, true);
        if (onSuccessCallback) onSuccessCallback(res);
      },
      onFailure: (err) => {
        isRedeeming.value = false;
        snackbar.show(err?.message || "Failed to redeem cashback.", "error");
      }
    });
  };

  return {
    program,
    isProgramLoading,
    isProgramFetched,
    fetchProgram,
    
    accounts,
    isAccountsLoading,
    isAccountsFetched,
    fetchAccounts,

    balance,
    isBalanceLoading,
    isBalanceFetched,
    fetchBalance,

    transactions,
    transactionsPagination,
    isTransactionsLoading,
    isTransactionsFetched,
    fetchTransactions,

    redemptions,
    redemptionsPagination,
    isRedemptionsLoading,
    isRedemptionsFetched,
    fetchRedemptions,

    isEnrolling,
    enroll,

    isChangingPlan,
    changePlan,

    isUnenrolling,
    unenroll,

    isRedeeming,
    redeem
  };
});
