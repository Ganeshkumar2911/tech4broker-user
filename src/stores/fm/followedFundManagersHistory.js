import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useFollowedFundManagersHistoryStore = defineStore(
  "followedFundManagersHistory",
  () => {
    const snackbar = useSnackbarStore();

    // ─────────────────────────────────────
    // State
    // ─────────────────────────────────────

    const records = ref([]);
    const summary = ref({
      currency: "USD",
      total_gross_pnl: 0,
      total_fees: 0,
      total_net_profit: 0,
      total_trades: 0,
      total_memberships: 0,
    });

    const loading = ref(false);
    const error = ref(null);
    const isFetched = ref(false);

    // ─────────────────────────────────────
    // Filters
    // ─────────────────────────────────────

    const filters = reactive({
      search: "",
      offer_id: "",
      offer_name: "",
      trading_account_id: "",
    });

    // ─────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────

    const pagination = reactive({
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 1,
    });

    // ─────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────

    const cleanFilters = () =>
      Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) =>
            value !== null &&
            value !== "" &&
            value !== undefined
        )
      );

    // ─────────────────────────────────────
    // Fetch History
    // ─────────────────────────────────────

    const fetchHistory = (force = false) => {
      if (isFetched.value && !force) return;

      loading.value = true;
      error.value = null;

      const successHandler = (res) => {
        records.value = res?.data || [];

        if (res?.summary) {
          summary.value = {
            currency: res.summary.currency || "USD",
            total_gross_pnl: Number(res.summary.total_gross_pnl || 0),
            total_fees: Number(res.summary.total_fees || 0),
            total_net_profit: Number(res.summary.total_net_profit || 0),
            total_trades: Number(res.summary.total_trades || 0),
            total_memberships: Number(res.summary.total_memberships || 0),
          };
        }

        Object.assign(pagination, {
          page: res?.pagination?.page || 1,
          per_page: res?.pagination?.per_page || 10,
          total_items: res?.pagination?.total_items || 0,
          total_pages: res?.pagination?.total_pages || 1,
        });

        isFetched.value = true;
        loading.value = false;
      };

      const failureHandler = (err) => {
        loading.value = false;
        error.value = err;
        snackbar.show(
          err?.message || "Failed to fetch following history.",
          "error"
        );
      };

      apiRequest(urls.KEYS.GET, urls.followedFundManagers.history, {
        params: {
          page: pagination.page,
          per_page: pagination.per_page,
          ...cleanFilters(),
        },
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    };

    // ─────────────────────────────────────
    // Filter Actions
    // ─────────────────────────────────────

    const applyFilters = (newFilters) => {
      if (newFilters) {
        Object.assign(filters, newFilters);
      }

      pagination.page = 1;
      isFetched.value = false;
      fetchHistory(true);
    };

    const resetFilters = () => {
      Object.assign(filters, {
        search: "",
        offer_id: "",
        offer_name: "",
        trading_account_id: "",
      });

      applyFilters();
    };

    // ─────────────────────────────────────
    // Pagination Actions
    // ─────────────────────────────────────

    const setPage = (page) => {
      pagination.page = page;
      isFetched.value = false;
      fetchHistory(true);
    };

    const setPerPage = (perPage) => {
      pagination.per_page = Number(perPage);
      pagination.page = 1;
      isFetched.value = false;
      fetchHistory(true);
    };

    // ─────────────────────────────────────
    // Reset State
    // ─────────────────────────────────────

    const reset = () => {
      records.value = [];
      summary.value = {
        currency: "USD",
        total_gross_pnl: 0,
        total_fees: 0,
        total_net_profit: 0,
        total_trades: 0,
        total_memberships: 0,
      };
      loading.value = false;
      error.value = null;
      isFetched.value = false;

      Object.assign(filters, {
        search: "",
        offer_id: "",
        offer_name: "",
        trading_account_id: "",
      });

      Object.assign(pagination, {
        page: 1,
        per_page: 10,
        total_items: 0,
        total_pages: 1,
      });
    };

    return {
      records,
      summary,
      loading,
      error,
      isFetched,
      filters,
      pagination,

      fetchHistory,
      applyFilters,
      resetFilters,
      setPage,
      setPerPage,
      reset,
    };
  }
);

export default useFollowedFundManagersHistoryStore;
