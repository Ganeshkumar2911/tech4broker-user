import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { subscribeTradeSymbols } from "@/utils/symbolUtils";

export const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "OPEN", value: "OPEN" },
  { label: "CLOSED", value: "CLOSED" },
];

export const TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "BUY", value: "BUY" },
  { label: "SELL", value: "SELL" },
];

export const useFmTradeBookStore = defineStore("fmTradeBook", () => {
  const snackbar = useSnackbarStore();

  // State
  const trades = ref([]);
  const summary = ref({
    open_trades: 0,
    closed_trades: 0,
    total_trades: 0,
    total_lot: 0,
    total_pnl: 0,
  });
  const pagination = ref({
    page: 1,
    per_page: 20,
    total_items: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const filters = reactive({
    search: "",
    status: "",
    type: "",
    from_date: "",
    to_date: "",
    sort_by: "",
    sort_order: "desc",
  });
  const isLoading = ref(true);
  const isRefreshing = ref(false);

  // Actions
  const fetchMasterTrades = async (forceRefresh = false) => {
    if (forceRefresh) {
      isRefreshing.value = true;
    } else {
      isLoading.value = true;
    }

    try {
      const params = {
        page: pagination.value.page,
        per_page: pagination.value.per_page,
        sort_by: filters.sort_by || undefined,
        sort_order: filters.sort_order || "desc",
      };

      if (filters.search && filters.search.trim() !== "") {
        params.search = filters.search.trim();
      }
      if (filters.status && filters.status !== "") {
        params.status = filters.status;
      }
      if (filters.type && filters.type !== "") {
        params.type = filters.type;
      }
      if (filters.from_date && filters.from_date !== "") {
        params.from_date = filters.from_date;
      }
      if (filters.to_date && filters.to_date !== "") {
        params.to_date = filters.to_date;
      }

      const res = await apiRequest(urls.KEYS.GET, urls.fm.masterTrades, {
        isTokenRequired: true,
        params,
      });

      const wrapper =
        res?.data && Array.isArray(res.data) ? res : res?.data || res;

      trades.value = Array.isArray(wrapper?.data) ? wrapper.data : [];
      subscribeTradeSymbols(trades.value, { onlyOpen: false });
      summary.value = wrapper?.summary || {
        open_trades: 0,
        closed_trades: 0,
        total_trades: 0,
        total_lot: 0,
        total_pnl: 0,
      };
      pagination.value = wrapper?.pagination || {
        page: pagination.value.page,
        per_page: pagination.value.per_page,
        total_items: trades.value.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      };
    } catch (err) {
      console.error("Failed to fetch master trades:", err);
      snackbar.show(
        err?.message || "Failed to load master trades data.",
        "error"
      );
    } finally {
      isLoading.value = false;
      isRefreshing.value = false;
    }
  };

  let searchTimer = null;
  const setSearch = (searchStr) => {
    filters.search = searchStr;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      pagination.value.page = 1;
      fetchMasterTrades(true);
    }, 400);
  };

  const setStatusFilter = (statusVal) => {
    filters.status = statusVal;
    pagination.value.page = 1;
    fetchMasterTrades(true);
  };

  const setTypeFilter = (typeVal) => {
    filters.type = typeVal;
    pagination.value.page = 1;
    fetchMasterTrades(true);
  };

  const setDateFilter = (fromDate, toDate) => {
    filters.from_date = fromDate || "";
    filters.to_date = toDate || "";
    pagination.value.page = 1;
    fetchMasterTrades(true);
  };

  const setSort = (sortBy, sortOrder) => {
    filters.sort_by = sortBy;
    if (sortOrder) filters.sort_order = sortOrder;
    pagination.value.page = 1;
    fetchMasterTrades(true);
  };

  const setPage = (newPage) => {
    pagination.value.page = newPage;
    fetchMasterTrades(true);
  };

  const setPerPage = (newPerPage) => {
    pagination.value.per_page = Number(newPerPage);
    pagination.value.page = 1;
    fetchMasterTrades(true);
  };

  const resetFilters = () => {
    filters.search = "";
    filters.status = "";
    filters.type = "";
    filters.from_date = "";
    filters.to_date = "";
    filters.sort_by = "";
    filters.sort_order = "desc";
    pagination.value.page = 1;
    fetchMasterTrades(true);
  };

  return {
    trades,
    summary,
    pagination,
    filters,
    isLoading,
    isRefreshing,
    fetchMasterTrades,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    setDateFilter,
    setSort,
    setPage,
    setPerPage,
    resetFilters,
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("fm-strategy-changed", () => {
    try {
      const store = useFmTradeBookStore();
      store.fetchMasterTrades(true);
    } catch (e) {}
  });
}
