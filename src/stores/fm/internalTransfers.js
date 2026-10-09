import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useInternalTransfersStore = defineStore("internalTransfers", () => {
  const data = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const summary = ref({
    total_deposit: 0,
    total_withdrawal: 0,
  });

  const filterOptions = ref({
    types: [],
    accounts: [],
  });

  const pagination = reactive({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0,
  });

  const filters = reactive({
    type: null,
    account_id: null,
    from_date: "",
    to_date: "",
  });

  const snackbar = useSnackbarStore();

  const buildParams = (page = pagination.page || 1) => {
    const params = {
      page,
      per_page: pagination.per_page,
    };

    if (filters.type) {
      params.type = filters.type;
    }

    if (filters.account_id) {
      params.account_id = filters.account_id;
    }

    if (filters.from_date) {
      params.from_date = filters.from_date;
    }

    if (filters.to_date) {
      params.to_date = filters.to_date;
    }

    return params;
  };

  const fetchTransfers = (force = false, page = pagination.page || 1) => {
    loading.value = true;
    error.value = null;

    apiRequest(urls.KEYS.GET, urls.wallet.internalTransfers, {
      params: buildParams(page),
      isTokenRequired: true,

      onSuccess: (res) => {
        data.value = res?.data || [];

        summary.value = res?.summary || {
          total_deposit: 0,
          total_withdrawal: 0,
        };

        filterOptions.value = res?.filters || {
          types: [],
          accounts: [],
        };

        if (res?.pagination) {
          Object.assign(pagination, res.pagination);
        }

        pagination.page = page;
        loading.value = false;
      },

      onFailure: (err) => {
        loading.value = false;
        error.value = err;
        snackbar.show(
          err?.message || "Failed to fetch internal transfers.",
          "error"
        );
      },
    });
  };

  const setPage = (page) => {
    pagination.page = page;
    fetchTransfers(true, page);
  };

  const applyFilters = () => {
    pagination.page = 1;
    fetchTransfers(true, 1);
  };

  const resetFilters = () => {
    filters.type = null;
    filters.account_id = null;
    filters.from_date = "";
    filters.to_date = "";
    pagination.page = 1;
    fetchTransfers(true, 1);
  };

  return {
    data,
    loading,
    error,
    summary,
    filterOptions,
    pagination,
    filters,
    fetchTransfers,
    fetchInternalTransfers: fetchTransfers,
    setPage,
    applyFilters,
    resetFilters,
  };
});
