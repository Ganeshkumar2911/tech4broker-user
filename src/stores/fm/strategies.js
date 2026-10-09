import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useFmStrategiesStore = defineStore("fmStrategies", () => {
  const snackbar = useSnackbarStore();

  // ─── 1. Primary State ─────────────────────────────────
  const strategies = ref([]);
  const requests = ref([]);
  const selectedStrategyId = ref(
    Number(localStorage.getItem("fm_active_strategy_id")) || null
  );

  // ─── 2. In-Flight Tracking ────────────────────────────
  const inFlight = {
    strategies: false,
    requests: false,
    createRequest: false,
  };

  // ─── 3. isFetched Tracking ────────────────────────────
  const isFetched = ref({
    strategies: false,
    requests: false,
  });

  // ─── 4. Loading & Error Flags ─────────────────────────
  const isLoading = ref(false);
  const requestsLoading = ref(false);
  const actionLoading = ref(false);
  const error = ref(null);

  // ─── 5. Computed Properties ───────────────────────────
  const selectedStrategy = computed(() => {
    if (!selectedStrategyId.value) return strategies.value[0] || null;
    return (
      strategies.value.find(
        (s) => Number(s.fm_id) === Number(selectedStrategyId.value)
      ) ||
      strategies.value[0] ||
      null
    );
  });

  const activeStrategies = computed(() =>
    strategies.value.filter((s) => s.is_active !== false)
  );

  const pendingRequests = computed(() =>
    requests.value.filter((r) => r.status === "pending")
  );

  const approvedRequests = computed(() =>
    requests.value.filter((r) => r.status === "approved")
  );

  const rejectedRequests = computed(() =>
    requests.value.filter((r) => r.status === "rejected")
  );

  const hasMultipleStrategies = computed(() => strategies.value.length > 1);

  // ─── 6. Actions ───────────────────────────────────────

  const selectStrategy = (fmId) => {
    if (!fmId) return;
    const numId = Number(fmId);
    selectedStrategyId.value = numId;
    localStorage.setItem("fm_active_strategy_id", String(numId));
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("fm-strategy-changed", { detail: { fmId: numId } })
      );
    }
  };

  let strategiesPromise = null;

  const fetchStrategies = (force = false, includeInactive = true) => {
    if (inFlight.strategies && strategiesPromise) return strategiesPromise;
    if (isFetched.value.strategies && !force) return Promise.resolve(strategies.value);

    inFlight.strategies = true;
    isLoading.value = true;
    error.value = null;

    strategiesPromise = new Promise((resolve) => {
      const successHandler = (res) => {
        const items = Array.isArray(res?.data) ? res.data : [];
        strategies.value = items;
        isFetched.value.strategies = true;

        // Auto-select strategy logic per multi-strategy specification
        if (items.length === 1) {
          selectStrategy(items[0].fm_id);
        } else if (items.length > 1) {
          const storedId = Number(localStorage.getItem("fm_active_strategy_id"));
          const exists = items.some((s) => Number(s.fm_id) === storedId);
          if (storedId && exists) {
            selectStrategy(storedId);
          } else {
            selectStrategy(items[0].fm_id);
          }
        } else {
          selectedStrategyId.value = null;
          localStorage.removeItem("fm_active_strategy_id");
        }
        resolve(items);
      };

      const failureHandler = (err) => {
        error.value = err?.message || "Failed to load fund manager strategies.";
        snackbar.show(err?.message || "Failed to load strategies.", "error");
        resolve([]);
      };

      const finallyHandler = () => {
        inFlight.strategies = false;
        isLoading.value = false;
        strategiesPromise = null;
      };

      apiRequest(urls.KEYS.GET, urls.fm.strategies, {
        params: includeInactive ? { include_inactive: true } : {},
        role: "fm",
        isTokenRequired: true,
        cancelPrevious: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });

    return strategiesPromise;
  };

  const fetchRequests = (force = false, status = "") => {
    if (inFlight.requests) return;
    if (isFetched.value.requests && !force && !status) return;

    inFlight.requests = true;
    requestsLoading.value = true;
    error.value = null;

    const successHandler = (res) => {
      requests.value = Array.isArray(res?.data) ? res.data : [];
      isFetched.value.requests = true;
    };

    const failureHandler = (err) => {
      const errMsg =
        err?.message ||
        err?.error ||
        err?.data?.message ||
        err?.data?.error ||
        "Failed to load strategy requests.";
      error.value = errMsg;
      snackbar.show(errMsg, "error");
    };

    const finallyHandler = () => {
      inFlight.requests = false;
      requestsLoading.value = false;
    };

    const params = {};
    if (status) params.status = status;

    return apiRequest(urls.KEYS.GET, urls.fm.strategyRequests, {
      params,
      role: "fm",
      isTokenRequired: true,
      cancelPrevious: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
      onFinally: finallyHandler,
    });
  };

  const createStrategyRequest = (payload, onDone) => {
    if (!payload?.label_name) {
      snackbar.show("Strategy name (label_name) is required.", "error");
      return;
    }

    inFlight.createRequest = true;
    actionLoading.value = true;

    // Apply standard defaults according to backend spec
    const cleanPayload = {
      ib_pool_percentage: 40,
      settlement_type: "weekly",
      settlement_time: "00:00:00",
      visibility_type: "public",
      ...payload,
    };

    const successHandler = (res) => {
      snackbar.show(
        res?.message || "Strategy request submitted successfully!",
        "success"
      );
      fetchRequests(true);
      fetchStrategies(true);
      onDone?.(res);
    };

    const failureHandler = (err) => {
      const errMsg =
        err?.message ||
        err?.error ||
        err?.data?.message ||
        err?.data?.error ||
        "Failed to submit strategy request.";
      snackbar.show(errMsg, "error");
    };

    const finallyHandler = () => {
      inFlight.createRequest = false;
      actionLoading.value = false;
    };

    return apiRequest(urls.KEYS.POST, urls.fm.createStrategyRequest, {
      data: cleanPayload,
      role: "fm",
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
      onFinally: finallyHandler,
    });
  };

  const reset = () => {
    strategies.value = [];
    requests.value = [];
    selectedStrategyId.value = null;
    isFetched.value.strategies = false;
    isFetched.value.requests = false;
    isLoading.value = false;
    requestsLoading.value = false;
    actionLoading.value = false;
    error.value = null;
  };

  return {
    strategies,
    requests,
    selectedStrategyId,
    selectedStrategy,
    activeStrategies,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    hasMultipleStrategies,
    isLoading,
    requestsLoading,
    actionLoading,
    error,
    isFetched,
    selectStrategy,
    fetchStrategies,
    fetchRequests,
    createStrategyRequest,
    reset,
  };
});
