import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useDealsStore = defineStore("deals", () => {
  const snackbar = useSnackbarStore();

  const dealsData = ref([]);
  const activeAccountId = ref(null);

  const summary = ref({
    in_deals: 0,
    out_deals: 0,
    total_commission: 0,
    total_deals: 0,
    total_profit: 0,
    total_storage: 0,
    total_volume: 0,
  });

  const pagination = ref({
    has_next: false,
    has_prev: false,
    page: 1,
    per_page: 50,
    total_items: 0,
    total_pages: 1,
  });

  const filters = ref({
    typeFilter: 'all',     // 'all', 'BUY', 'SELL'
    entryFilter: 'all',    // 'all', 'IN', 'OUT'
    searchQuery: '',      // search query for symbol or ticket
    dateRange: [null, null]
  });

  const loading = ref(false);
  const error = ref(null);

  const formatParamDate = (d) => {
    if (!d) return undefined;
    try {
      const dt = new Date(d);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return undefined;
    }
  };

  const fetchDeals = (tradingAccountId, customFilters = {}) => {
    if (!tradingAccountId) {
      dealsData.value = [];
      return;
    }

    if (customFilters && typeof customFilters === 'object') {
      if (customFilters.type !== undefined) filters.value.typeFilter = customFilters.type;
      if (customFilters.entry !== undefined) filters.value.entryFilter = customFilters.entry;
      if (customFilters.search !== undefined) filters.value.searchQuery = customFilters.search;
      if (customFilters.dateRange !== undefined) filters.value.dateRange = customFilters.dateRange;
    }

    activeAccountId.value = tradingAccountId;
    loading.value = true;
    error.value = null;

    const params = {
      source: "manual",
      trading_account_id: tradingAccountId,
      page: pagination.value.page,
      per_page: pagination.value.per_page,
    };

    // type filter query param (BUY / SELL)
    const activeType = customFilters.type !== undefined ? customFilters.type : filters.value.typeFilter;
    if (activeType && activeType !== 'all') {
      params.type = activeType;
    }

    // entry filter query param (IN / OUT)
    const activeEntry = customFilters.entry !== undefined ? customFilters.entry : filters.value.entryFilter;
    if (activeEntry && activeEntry !== 'all') {
      params.entry = activeEntry;
    }

    // search query param (symbol or ticket)
    const activeSearch = customFilters.search !== undefined ? customFilters.search : filters.value.searchQuery;
    if (activeSearch && activeSearch.trim()) {
      params.search = activeSearch.trim();
    }

    // date range query params (from_date, to_date)
    const activeDates = customFilters.dateRange !== undefined ? customFilters.dateRange : filters.value.dateRange;
    if (activeDates?.[0]) {
      const fromFormatted = formatParamDate(activeDates[0]);
      if (fromFormatted) {
        params.from_date = fromFormatted;
        params.time_from = fromFormatted;
      }
    }
    if (activeDates?.[1]) {
      const toFormatted = formatParamDate(activeDates[1]);
      if (toFormatted) {
        params.to_date = toFormatted;
        params.time_to = toFormatted;
      }
    }

    const successHandler = (res) => {
      loading.value = false;
      const responseData = res?.data || res || {};

      if (Array.isArray(responseData.data)) {
        dealsData.value = responseData.data;
      } else if (Array.isArray(responseData)) {
        dealsData.value = responseData;
      } else {
        dealsData.value = [];
      }

      if (responseData.summary) {
        summary.value = responseData.summary;
      }

      if (responseData.pagination) {
        pagination.value = responseData.pagination;
      } else if (responseData.total_items !== undefined) {
        pagination.value.total_items = responseData.total_items;
        pagination.value.total_pages = Math.ceil(responseData.total_items / pagination.value.per_page) || 1;
      }
    };

    const failureHandler = (err) => {
      loading.value = false;
      error.value = err;
      snackbar.show(err?.message || "Failed to fetch deals.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.tradeBook?.deals || "/trade-book/deals", {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const setPage = (page) => {
    pagination.value.page = page;
    if (activeAccountId.value) {
      fetchDeals(activeAccountId.value);
    }
  };

  return {
    dealsData,
    summary,
    pagination,
    filters,
    loading,
    error,
    fetchDeals,
    setPage,
  };
});

export default useDealsStore;
