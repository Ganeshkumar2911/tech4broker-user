import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useFmWalletStore = defineStore("fmWallet", () => {
  // State
  const data = ref([]);

  const summary = ref({
    total_deposit: 0,
    wallet_balance: 0,
    total_fm_fee: 0,
    total_withdrawal: 0,
    total_records: 0,
    total_trade_pnl: 0,
  });

  const filterOptions = ref({
    types: [],
  });

  const pagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0,
  });

  const filters = reactive({
    type: "",
    from_date: "",
    to_date: "",
  });

  const isLoading = ref(false);
  const error = ref(null);
  const isFetched = ref(false);

  const snackbar = useSnackbarStore();

  const buildParams = (page = pagination.value.page || 1) => {
    const params = {
      page,
      per_page: pagination.value.per_page,
    };

    if (filters.type) {
      params.type = filters.type;
    }

    if (filters.from_date) {
      params.from_date = filters.from_date;
    }

    if (filters.to_date) {
      params.to_date = filters.to_date;
    }

    return params;
  };

  const fetchWallet = (force = false, page = pagination.value.page || 1) => {
    if (isFetched.value && !force && page === pagination.value.page) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    apiRequest(urls.KEYS.GET, urls.wallet.list, {
      params: buildParams(page),
      isTokenRequired: true,

      onSuccess: (res) => {
        data.value = res?.data || [];

        summary.value = res?.summary || {
          total_deposit: 0,
          wallet_balance: 0,
          total_fm_fee: 0,
          total_withdrawal: 0,
          total_records: 0,
          total_trade_pnl: 0,
        };

        filterOptions.value = res?.filters || {
          types: [],
        };

        pagination.value = res?.pagination || {
          page: 1,
          per_page: 10,
          total_items: 0,
          total_pages: 0,
        };

        pagination.value.page = page;
        isLoading.value = false;
        isFetched.value = true;
      },

      onFailure: (err) => {
        isLoading.value = false;
        error.value = err;

        snackbar.show(
          err?.message || "Failed to fetch wallet records.",
          "error"
        );
      },
    });
  };

  // Alias for backward compatibility
  const fetchClientWallet = fetchWallet;

  const setFilters = (nextFilters = {}) => {
    Object.assign(filters, nextFilters);
  };

  const applyFilters = () => {
    pagination.value.page = 1;
    isFetched.value = false;
    fetchWallet(true, 1);
  };

  const resetFilters = () => {
    filters.type = "";
    filters.from_date = "";
    filters.to_date = "";

    pagination.value.page = 1;
    isFetched.value = false;
    fetchWallet(true, 1);
  };

  const changePage = (page) => {
    pagination.value.page = page;
    fetchWallet(true, page);
  };

  const reset = () => {
    data.value = [];

    summary.value = {
      total_deposit: 0,
      wallet_balance: 0,
      total_fm_fee: 0,
      total_withdrawal: 0,
      total_records: 0,
      total_trade_pnl: 0,
    };

    filterOptions.value = {
      types: [],
    };

    pagination.value = {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 0,
    };

    isLoading.value = false;
    error.value = null;
    isFetched.value = false;
  };

  return {
    data,
    summary,
    filterOptions,
    pagination,
    filters,
    isLoading,
    error,
    isFetched,
    fetchWallet,
    fetchClientWallet,
    setFilters,
    applyFilters,
    resetFilters,
    changePage,
    reset,
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("fm-strategy-changed", () => {
    try {
      const store = useFmWalletStore();
      store.reset();
      store.fetchWallet(true, 1);
    } catch (e) {}
  });
}

export const useClientWalletStore = useFmWalletStore;