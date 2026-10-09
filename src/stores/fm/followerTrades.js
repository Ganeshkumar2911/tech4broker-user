import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useFollowerTradesStore = defineStore("followerTrades", () => {
  const snackbar = useSnackbarStore();

  // ─── State ─────────────────────────────────────────────
  const data = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const summary = ref({
    total_lots: 0,
    total_pnl: 0,
  });

  const pagination = reactive({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0,
  });

  const accountId = ref(null);

  const normalizeTrade = (trade = {}) => {
    const pnl = trade.pnl ?? trade.net_pnl ?? trade.gross_pnl ?? 0;
    const type = trade.type ?? trade.order_type;

    return {
      ...trade,
      type: typeof type === "string" ? type.toUpperCase() : type,
      pnl: Number(pnl) || 0,
      lot: Number(trade.lot) || 0,
      created_at: trade.created_at ?? trade.opened_at ?? trade.closed_at,
    };
  };

  const normalizeSummary = (payload = {}) => ({
    ...payload,
    total_lots: payload.total_lots ?? 0,
    total_pnl: payload.total_pnl ?? payload.net_pnl ?? payload.gross_pnl ?? 0,
  });

  // ─── Fetch Trades ──────────────────────────────────────
  const fetchTrades = (id) => {
    if (!id) return;

    accountId.value = id;
    loading.value = true;
    error.value = null;

    const successHandler = (res) => {
      const tradeData = res?.data?.data || res?.data || [];
      data.value = Array.isArray(tradeData) ? tradeData.map(normalizeTrade) : [];

      if (res?.data?.pagination) {
        Object.assign(pagination, res.data.pagination);
      } else if (res?.pagination) {
        Object.assign(pagination, res.pagination);
      }

      if (res?.data?.summary) {
        summary.value = normalizeSummary(res.data.summary);
      } else if (res?.summary) {
        summary.value = normalizeSummary(res.summary);
      }
    };

    const failureHandler = (err) => {
      error.value = err;
      snackbar.show(err?.message || "Failed to fetch follower trades.", "error");
    };

    const endpoint = `${urls.followers.trades}/${id}`;

    return apiRequest(urls.KEYS.GET, endpoint, {
      params: {
        page: pagination.page,
        per_page: pagination.per_page,
      },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
      onFinally: () => {
        loading.value = false;
      },
    });
  };

  // ─── Pagination ────────────────────────────────────────
  const setPage = (page) => {
    pagination.page = page;
    fetchTrades(accountId.value);
  };

  // ─── Reset ─────────────────────────────────────────────
  const reset = () => {
    data.value = [];
    loading.value = false;
    error.value = null;

    summary.value = {
      total_lots: 0,
      total_pnl: 0,
    };

    Object.assign(pagination, {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 0,
    });

    accountId.value = null;
  };

  return {
    data,
    loading,
    error,
    pagination,
    summary,
    fetchTrades,
    setPage,
    reset,
  };
});
