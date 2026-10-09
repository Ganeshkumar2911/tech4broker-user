import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useIbWalletStore = defineStore("ibWallet", () => {
  // State
  const data = ref([]);

  const summary = ref({
    wallet_balance: 0,
    total_commission: 0,
    total_deposit: 0,
    total_debit: 0,
    total_withdrawal: 0,
    total_records: 0,
  });

  const filterOptions = ref({
    types: [],
  });

  const pagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  });

  const filters = reactive({
    type: "",
    search: "",
    from_date: "",
    to_date: "",
    page: 1,
    per_page: 10,
  });

  const isLoading = ref(false);
  const isFetched = ref(false);
  const error = ref(null);

  const snackbar = useSnackbarStore();

  const buildParams = (page = filters.page || 1) => {
    const params = {
      page,
      per_page: filters.per_page || 10,
    };

    if (filters.type) {
      params.type = filters.type;
    }

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.from_date) {
      params.from_date = filters.from_date;
    }

    if (filters.to_date) {
      params.to_date = filters.to_date;
    }

    return params;
  };

  const fetchWalletLedger = (force = false, page = filters.page || 1) => {
    if (isFetched.value && !force && page === filters.page) {
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
          wallet_balance: 0,
          total_commission: 0,
          total_deposit: 0,
          total_debit: 0,
          total_withdrawal: 0,
          total_records: 0,
        };

        filterOptions.value = res?.filters || {
          types: [],
        };

        pagination.value = res?.pagination || {
          page: 1,
          per_page: 10,
          total_items: 0,
          total_pages: 1,
        };

        filters.page = page;
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

  const setFilters = (nextFilters = {}) => {
    Object.assign(filters, nextFilters);
  };

  const applyFilters = () => {
    filters.page = 1;
    isFetched.value = false;
    fetchWalletLedger(true, 1);
  };

  const resetFilters = () => {
    filters.type = "";
    filters.search = "";
    filters.from_date = "";
    filters.to_date = "";

    filters.page = 1;
    isFetched.value = false;
    fetchWalletLedger(true, 1);
  };

  const changePage = (page) => {
    filters.page = page;
    fetchWalletLedger(true, page);
  };

  const reset = () => {
    data.value = [];

    summary.value = {
      wallet_balance: 0,
      total_commission: 0,
      total_deposit: 0,
      total_debit: 0,
      total_withdrawal: 0,
      total_records: 0,
    };

    filterOptions.value = {
      types: [],
    };

    pagination.value = {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 1,
    };

    filters.type = "";
    filters.search = "";
    filters.from_date = "";
    filters.to_date = "";
    filters.page = 1;
    filters.per_page = 10;

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
    fetchWalletLedger,
    setFilters,
    applyFilters,
    resetFilters,
    changePage,
    reset,
  };
});
