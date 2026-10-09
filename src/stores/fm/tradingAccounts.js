import { defineStore } from "pinia";
import { ref, reactive } from "vue";
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

export const useFmTradingAccountsStore = defineStore("fmTradingAccounts", () => {
  const snackbar = useSnackbarStore();

  // State
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
    per_page: 10,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

  const platformFilter = ref("all");
  const typeFilter = ref("all");

  const paymentMethods = ref([]);
  const isPaymentMethodsLoading = ref(false);
  const isFetched = ref(false);

  // Fetch FM Accounts
  const fetchAccounts = (force = false) => {
    if (isFetched.value && !force) return;

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
        err?.message || "Failed to fetch FM trading accounts.",
        "error"
      );
    };

    apiRequest(urls.KEYS.GET, urls.fm.accounts, {
      params,
      cancelPrevious: true,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const setPlatformFilter = (value) => {
    if (platformFilter.value === value) return;
    platformFilter.value = value;
    typeFilter.value = "all";
    pagination.page = 1;
    fetchAccounts(true);
  };

  const setTypeFilter = (value) => {
    if (typeFilter.value === value) return;
    typeFilter.value = value;
    pagination.page = 1;
    fetchAccounts(true);
  };

  const setPage = (page) => {
    pagination.page = page;
    fetchAccounts(true);
  };

  const createAccount = (payload) => {
    loading.value = true;
    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        loading.value = false;
        snackbar.show("FM Trading account created successfully.", "success");
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
      has_next: false,
      has_prev: false,
    });
    platformFilter.value = "all";
    typeFilter.value = "all";
    isFetched.value = false;
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

  return {
    data,
    loading,
    error,
    summary,
    pagination,
    platformFilter,
    typeFilter,
    fetchAccounts,
    setPlatformFilter,
    setTypeFilter,
    setPage,
    createAccount,
    updateTradingAccount,
    reset,
    paymentMethods,
    isPaymentMethodsLoading,
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("fm-strategy-changed", () => {
    try {
      const store = useFmTradingAccountsStore();
      store.reset();
      store.fetchAccounts(true);
    } catch (e) {}
  });
}
