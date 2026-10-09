import { defineStore } from "pinia";
import { ref, reactive, watch } from "vue";

import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const PLATFORM_TABS = [
  { value: "all", label: "All" },
  { value: "real", label: "MT5" },
  { value: "copy_trading", label: "Copy Trading" },
];

export const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "demo", label: "Demo" },
];

const STORAGE_KEY = "chart_selected_account_id";

const getInitialSelectedAccountId = () => {
  if (typeof localStorage === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  const num = Number(saved);
  return !isNaN(num) ? num : saved;
};

export const useTradingAccountsStore = defineStore("tradingAccounts", () => {
  const snackbar = useSnackbarStore();

  // -----------------------
  // State
  // -----------------------

  const selectedAccountId = ref(getInitialSelectedAccountId());

  watch(selectedAccountId, (newVal) => {
    if (typeof localStorage !== 'undefined') {
      if (newVal !== null && newVal !== undefined) {
        localStorage.setItem(STORAGE_KEY, String(newVal));
      }
    }
  });

  const data = ref([]);

  const loading = ref(false);

  const error = ref(null);

  const summary = ref({
    total_accounts: 0,
    total_balance: 0,
    total_equity: 0,
    total_pnl: 0,
  });

  const pagination = reactive({
    page: 1,
    per_page: 20,
    total_items: 0,
    total_pages: 0,
  });

  const platformFilter = ref("all");

  const typeFilter = ref("all");
  const isActiveFilter = ref(true); // default to true
  const paymentMethods = ref([]);
  const isPaymentMethodsLoading = ref(false);

  const isFetched = ref(false);
  const fetchedRole = ref(null);

  // -----------------------
  // Fetch Accounts
  // -----------------------

  const fetchAccounts = (force = false) => {
    const role = typeof localStorage !== 'undefined' ? localStorage.getItem("role") || "client" : "client";
    if (isFetched.value && fetchedRole.value === role && !force) return;

    fetchedRole.value = role;
    loading.value = true;

    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
    };

    if (platformFilter.value !== "all") {
      params.trading_type = platformFilter.value;
    }

    if (typeFilter.value !== "all") {
      params.account_type = typeFilter.value;
    }

    if (isActiveFilter.value !== null) {
      params.is_active = isActiveFilter.value;
    }

    const successHandler = (res) => {
      const response = res?.data || {};

      data.value = Array.isArray(response.accounts)
        ? response.accounts
        : [];

      if (response.pagination) {
        Object.assign(pagination, response.pagination);
      }

      if (response.summary) {
        summary.value = response.summary;
      }

      loading.value = false;
      isFetched.value = true;
    };

    const failureHandler = (err) => {
      loading.value = false;

      error.value = err;

      snackbar.show(
        err?.message || "Failed to fetch trading accounts.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.tradingAccounts.list, {
      params,

      cancelPrevious: true,

      isTokenRequired: true,

      onSuccess: successHandler,

      onFailure: failureHandler,
    });
  };

  // -----------------------
  // Filters
  // -----------------------

  const setPlatformFilter = (value) => {
    if (platformFilter.value === value) return;

    platformFilter.value = value;

    typeFilter.value = "all";

    pagination.page = 1;

    fetchAccounts(true);
  };

  const setIsActiveFilter = (value) => {
    if (isActiveFilter.value === value) return;
    isActiveFilter.value = value;
    pagination.page = 1;
    fetchAccounts(true);
  };

  const setTypeFilter = (value) => {
    if (typeFilter.value === value) return;

    typeFilter.value = value;

    pagination.page = 1;

    fetchAccounts(true);
  };

  const setChipFilter = (tradingType, accountType = "all") => {
    if (platformFilter.value === tradingType && typeFilter.value === accountType) return;

    platformFilter.value = tradingType;
    typeFilter.value = accountType;
    pagination.page = 1;

    fetchAccounts(true);
  };

  // -----------------------
  // Pagination
  // -----------------------

  const setPage = (page) => {
    pagination.page = page;

    fetchAccounts(true);
  };

  // -----------------------
  // Create Account
  // -----------------------

  const createAccount = (payload) => {
    loading.value = true;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        loading.value = false;

        snackbar.show("Trading account created successfully.", "success");

        fetchAccounts(true);

        resolve(res);
      };

      const failureHandler = (err) => {
        loading.value = false;

        error.value = err;

        snackbar.show(err?.message || "Failed to create account.", "error");

        reject(err);
      };

      apiRequest(urls.KEYS.POST, urls.tradingAccounts.create, {
        data: payload,

        isTokenRequired: true,

        onSuccess: successHandler,

        onFailure: failureHandler,
      });
    });
  };

  // -----------------------
  // Reset
  // -----------------------

  const reset = () => {
    data.value = [];

    loading.value = false;

    error.value = null;

    summary.value = {
      total_accounts: 0,
      total_balance: 0,
      total_equity: 0,
      total_pnl: 0,
    };

    Object.assign(pagination, {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 0,
    });

    platformFilter.value = "all";

    typeFilter.value = "all";

    isFetched.value = false;
  };

  const currentPaymentMethodType = ref(null);
  const currentPaymentMethodRole = ref(null);

  const fetchPaymentMethods = (type = "deposit", force = false) => {
    const role = typeof localStorage !== 'undefined' ? localStorage.getItem("role") || "client" : "client";
    if (isPaymentMethodsLoading.value && currentPaymentMethodType.value === type && currentPaymentMethodRole.value === role) return;
    if (currentPaymentMethodType.value === type && currentPaymentMethodRole.value === role && paymentMethods.value.length > 0 && !force) return;

    currentPaymentMethodType.value = type;
    currentPaymentMethodRole.value = role;
    isPaymentMethodsLoading.value = true;

    const successHandler = (res) => {
      paymentMethods.value = res?.data || [];
      isPaymentMethodsLoading.value = false;
    };

    const failureHandler = (err) => {
      isPaymentMethodsLoading.value = false;
      snackbar.show(
        err?.message || "Something went wrong while fetching payment methods.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.wallet.paymentMethods, {
      params: { type },
      cancelPrevious: true,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const updateTradingAccount = (payload) => {
    loading.value = true;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        loading.value = false;
        snackbar.show(res?.message || "Account updated successfully.", "success");
        fetchAccounts(true);
        resolve(res);
      };

      const failureHandler = (err) => {
        loading.value = false;
        error.value = err;
        snackbar.show(err?.message || "Failed to update account.", "error");
        reject(err);
      };

      apiRequest(urls.KEYS.POST, urls.tradingAccounts.update, {
        data: payload,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  };

  const toggleArchive = (account) => {
    const isArchived = account.is_active === false;
    const isActivating = isArchived;

    loading.value = true;
    const payload = {
      trading_account_id: account.id,
      disable_trade: !isActivating,
    };

    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.POST, urls.tradingAccounts.toggleTrading, {
        data: payload,
        isTokenRequired: true,
        onSuccess: (res) => {
          loading.value = false;
          snackbar.show(res?.message || `Trading ${isActivating ? 'Enabled' : 'Disabled'} for account ${account.account_number}.`, "success");
          fetchAccounts(true);
          resolve(res);
        },
        onFailure: (err) => {
          loading.value = false;
          snackbar.show(err?.message || "Failed to toggle trading status", "error");
          reject(err);
        },
      });
    });
  };

  return {
    selectedAccountId,
    data,

    loading,

    error,

    summary,

    pagination,

    platformFilter,

    typeFilter,
    
    isActiveFilter,

    fetchAccounts,

    setPlatformFilter,

    setTypeFilter,
    
    setIsActiveFilter,

    setChipFilter,

    setPage,

    createAccount,
    updateTradingAccount,
    toggleArchive,

    reset,
    fetchPaymentMethods,
    paymentMethods,
    isPaymentMethodsLoading,
  };
});
