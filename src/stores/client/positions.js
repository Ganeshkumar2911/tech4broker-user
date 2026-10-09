import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const usePositionsStore = defineStore("positions", () => {
  const snackbar = useSnackbarStore();

  const data = ref([]);
  const activeAccountId = ref(null);

  const summary = ref({
    closed_positions: 0,
    losing_positions: 0,
    open_positions: 0,
    realized_pnl: 0,
    total_positions: 0,
    total_profit: 0,
    total_volume: 0,
    win_rate: 0,
    winning_positions: 0,
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
    statusFilter: 'open',
    typeFilter: 'all',
    searchQuery: '',
    dateRange: [null, null],
  });

  const closedPagination = ref({
    has_next: false,
    has_prev: false,
    page: 1,
    per_page: 50,
    total_items: 0,
    total_pages: 1,
  });

  const loading = ref(false);
  const error = ref(null);

  const formatParamDate = (d) => {
    if (!d) return undefined;
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return typeof d === 'string' ? d : undefined;
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return undefined;
    }
  };

  const closedPositionsData = ref([]);
  const closedPositionsLoading = ref(false);

  let inFlightAccountId = null;
  let inFlightTimeout = null;

  // Fetch open positions for a given trading account ID using /trade-book/open-legs
  const fetchPositions = (tradingAccountId, customFilters = {}, force = false) => {
    if (!tradingAccountId) {
      data.value = [];
      return;
    }

    if (customFilters && typeof customFilters === 'object') {
      if (customFilters.type !== undefined) filters.value.typeFilter = customFilters.type;
      if (customFilters.search !== undefined) filters.value.searchQuery = customFilters.search;
    }

    inFlightAccountId = tradingAccountId;
    activeAccountId.value = tradingAccountId;
    loading.value = true;
    error.value = null;

    if (inFlightTimeout) clearTimeout(inFlightTimeout);
    inFlightTimeout = setTimeout(() => {
      inFlightAccountId = null;
    }, 400);

    const params = {
      source: "manual",
      trading_account_id: tradingAccountId,
    };

    // type / side filter query param
    const activeType = customFilters.type !== undefined ? customFilters.type : filters.value.typeFilter;
    if (activeType && activeType !== 'all') {
      params.type = activeType;
    }

    // search query param (symbol or ticket)
    const activeSearch = customFilters.search !== undefined ? customFilters.search : filters.value.searchQuery;
    if (activeSearch && activeSearch.trim()) {
      params.search = activeSearch.trim();
    }

    const successHandler = (res) => {
      loading.value = false;
      inFlightAccountId = null;
      const responseData = res?.data || res || {};

      if (Array.isArray(responseData.data)) {
        data.value = responseData.data;
      } else if (Array.isArray(responseData)) {
        data.value = responseData;
      } else {
        data.value = [];
      }

      if (responseData.summary) {
        summary.value = responseData.summary;
      }

      if (responseData.pagination) {
        pagination.value = responseData.pagination;
      } else if (responseData.total_items !== undefined) {
        pagination.value.total_items = responseData.total_items;
      }
    };

    const failureHandler = (err) => {
      loading.value = false;
      inFlightAccountId = null;
      error.value = err;
      snackbar.show(err?.message || "Failed to fetch open positions.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.tradeBook?.openLegs || "/trade-book/open-legs", {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  let inFlightClosedAccountId = null;
  let inFlightClosedTimeout = null;

  // Dedicated GET request for CLOSED positions
  const fetchClosedPositions = (tradingAccountId, customFilters = {}, force = false) => {
    if (!tradingAccountId) {
      closedPositionsData.value = [];
      return;
    }

    if (customFilters && typeof customFilters === 'object') {
      if (customFilters.type !== undefined) filters.value.typeFilter = customFilters.type;
      if (customFilters.search !== undefined) filters.value.searchQuery = customFilters.search;
      if (customFilters.dateRange !== undefined) filters.value.dateRange = customFilters.dateRange;
    }

    inFlightClosedAccountId = tradingAccountId;
    activeAccountId.value = tradingAccountId;
    closedPositionsLoading.value = true;

    if (inFlightClosedTimeout) clearTimeout(inFlightClosedTimeout);
    inFlightClosedTimeout = setTimeout(() => {
      inFlightClosedAccountId = null;
    }, 400);

    const params = {
      source: "manual",
      trading_account_id: tradingAccountId,
      status: "CLOSED",
      page: closedPagination.value.page,
      per_page: closedPagination.value.per_page,
    };

    const activeType = customFilters.type !== undefined ? customFilters.type : filters.value.typeFilter;
    if (activeType && activeType !== 'all') {
      params.type = activeType;
    }

    const activeSearch = customFilters.search !== undefined ? customFilters.search : filters.value.searchQuery;
    if (activeSearch && activeSearch.trim()) {
      params.search = activeSearch.trim();
    }

    const activeDates = customFilters.dateRange !== undefined ? customFilters.dateRange : filters.value.dateRange;
    if (activeDates?.[0]) {
      const fromFormatted = formatParamDate(activeDates[0]);
      if (fromFormatted) {
        params.from_date = fromFormatted;
        params.closed_from = fromFormatted;
      }
    }
    if (activeDates?.[1]) {
      const toFormatted = formatParamDate(activeDates[1]);
      if (toFormatted) {
        params.to_date = toFormatted;
        params.closed_to = toFormatted;
      }
    }

    apiRequest(urls.KEYS.GET, urls.tradeBook?.positions || "/trade-book/positions", {
      params,
      isTokenRequired: true,
      onSuccess: (res) => {
        closedPositionsLoading.value = false;
        const responseData = res?.data || res || {};
        if (Array.isArray(responseData.data)) {
          closedPositionsData.value = responseData.data;
        } else if (Array.isArray(responseData)) {
          closedPositionsData.value = responseData;
        } else {
          closedPositionsData.value = [];
        }

        if (responseData.pagination) {
          closedPagination.value = responseData.pagination;
        } else if (responseData.total_items !== undefined) {
          closedPagination.value.total_items = responseData.total_items;
          closedPagination.value.total_pages = Math.ceil(responseData.total_items / closedPagination.value.per_page) || 1;
        }
      },
      onFailure: (err) => {
        closedPositionsLoading.value = false;
        console.error("Failed to fetch closed positions:", err);
        closedPositionsData.value = [];
      }
    });
  };

  const setPage = (page) => {
    pagination.value.page = page;
    if (activeAccountId.value) {
      fetchPositions(activeAccountId.value);
    }
  };

  const setClosedPage = (page) => {
    closedPagination.value.page = page;
    if (activeAccountId.value) {
      fetchClosedPositions(activeAccountId.value);
    }
  };

  const modifySlTp = (positionTicket, payload) => {
    loading.value = true;
    error.value = null;

    // Optimistically update position in local data array
    const target = data.value.find(
      (p) => String(p.position_ticket) === String(positionTicket) || String(p.id) === String(positionTicket)
    );
    const oldSl = target ? (target.price_sl ?? target.sl) : undefined;
    const oldTp = target ? (target.price_tp ?? target.tp) : undefined;

    if (target) {
      if (payload.sl !== undefined || payload.price_sl !== undefined) {
        const val = Number(payload.sl ?? payload.price_sl);
        target.price_sl = val;
        target.sl = val;
      }
      if (payload.tp !== undefined || payload.price_tp !== undefined) {
        const val = Number(payload.tp ?? payload.price_tp);
        target.price_tp = val;
        target.tp = val;
      }
    }

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        loading.value = false;
        snackbar.show("Position SL/TP updated successfully.", "success");
        if (activeAccountId.value) {
          fetchPositions(activeAccountId.value);
        }
        resolve(res);
      };

      const failureHandler = (err) => {
        loading.value = false;
        error.value = err;
        // Rollback optimistic update on error
        if (target) {
          if (oldSl !== undefined) {
            target.price_sl = oldSl;
            target.sl = oldSl;
          }
          if (oldTp !== undefined) {
            target.price_tp = oldTp;
            target.tp = oldTp;
          }
        }
        snackbar.show(err?.message || "Failed to update SL/TP.", "error");
        reject(err);
      };

      apiRequest(urls.KEYS.PATCH, urls.positions?.modifySlTp(positionTicket) || `/trading/positions/${positionTicket}/sltp`, {
        data: payload,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  };

  const closePosition = (positionTicket, payload = {}) => {
    loading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        loading.value = false;
        const msg = payload.volume ? "Position partially closed successfully." : "Position closed successfully.";
        snackbar.show(msg, "success");
        if (activeAccountId.value) {
          fetchPositions(activeAccountId.value);
          fetchClosedPositions(activeAccountId.value);
        }
        resolve(res);
      };

      const failureHandler = (err) => {
        loading.value = false;
        error.value = err;
        snackbar.show(err?.message || "Failed to close position.", "error");
        reject(err);
      };

      const body = {
        comment: payload.comment || (payload.volume ? "Manual Partial Close" : "Manually closed"),
        ...(payload.volume ? { volume: Number(payload.volume) } : {})
      };

      apiRequest(urls.KEYS.POST, urls.positions?.close(positionTicket) || `/trading/positions/${positionTicket}/close`, {
        data: body,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  };

  return {
    data,
    closedPositionsData,
    summary,
    pagination,
    closedPagination,
    filters,
    loading,
    closedPositionsLoading,
    error,
    fetchPositions,
    fetchClosedPositions,
    setPage,
    setClosedPage,
    modifySlTp,
    modifyPosition: modifySlTp,
    closePosition,
  };
});

export default usePositionsStore;
