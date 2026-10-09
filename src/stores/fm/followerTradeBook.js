import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { subscribeTradeSymbols } from "@/utils/symbolUtils";

export const useFollowerTradeBookStore = defineStore(
  "followerTradeBook",
  () => {
    const snackbar = useSnackbarStore();

    // ─────────────────────────────────────
    // State
    // ─────────────────────────────────────

    const followerId = ref(null);
    const isLoading = ref(true);
    const isRefreshing = ref(false);
    const activeTab = ref("open_legs"); // 'open_legs' | 'deals' | 'positions' | 'orders'

    const filterMetadata = ref(null);
    const followerInfo = ref(null);

    const openLegs = ref([]);
    const openLegsLoading = ref(false);
    const openLegsFetched = ref(false);

    const filters = reactive({
      search: "",
      action: "",
      status: "",
      result: "",
      from_date: "",
      to_date: "",
      sort_order: "desc",
    });

    const tabState = ref({
      deals: {
        data: [],
        summary: {},
        pagination: { page: 1, per_page: 10, total_items: 0, total_pages: 1 },
        loading: false,
        isFetched: false,
      },
      positions: {
        data: [],
        summary: {},
        pagination: { page: 1, per_page: 10, total_items: 0, total_pages: 1 },
        loading: false,
        isFetched: false,
      },
      orders: {
        data: [],
        summary: {},
        pagination: { page: 1, per_page: 10, total_items: 0, total_pages: 1 },
        loading: false,
        isFetched: false,
      },
    });

    // ─────────────────────────────────────
    // Computed Getters
    // ─────────────────────────────────────

    const dealsData = computed(() => tabState.value.deals.data || []);
    const dealsSummary = computed(() => tabState.value.deals.summary || {});
    const dealsPagination = computed(() => tabState.value.deals.pagination);

    const positionsData = computed(() => tabState.value.positions.data || []);
    const positionsSummary = computed(() => tabState.value.positions.summary || {});
    const positionsPagination = computed(() => tabState.value.positions.pagination);

    const ordersData = computed(() => tabState.value.orders.data || []);
    const ordersSummary = computed(() => tabState.value.orders.summary || {});
    const ordersPagination = computed(() => tabState.value.orders.pagination);

    // ─────────────────────────────────────
    // Actions
    // ─────────────────────────────────────

    const setFollowerId = (id) => {
      if (followerId.value !== id) {
        followerId.value = id;
        resetTabState();
      }
    };

    const resetTabState = () => {
      filters.search = "";
      filters.action = "";
      filters.status = "";
      filters.result = "";
      filters.from_date = "";
      filters.to_date = "";
      filters.sort_order = "desc";
      activeTab.value = "open_legs";
      openLegs.value = [];
      openLegsFetched.value = false;
      tabState.value = {
        deals: {
          data: [],
          summary: {},
          pagination: { page: 1, per_page: 10, total_items: 0, total_pages: 1 },
          loading: false,
          isFetched: false,
        },
        positions: {
          data: [],
          summary: {},
          pagination: { page: 1, per_page: 10, total_items: 0, total_pages: 1 },
          loading: false,
          isFetched: false,
        },
        orders: {
          data: [],
          summary: {},
          pagination: { page: 1, per_page: 10, total_items: 0, total_pages: 1 },
          loading: false,
          isFetched: false,
        },
      };
    };

    const fetchFilterMetadata = async () => {
      try {
        const res = await apiRequest(urls.KEYS.GET, urls.tradeBook.filters);
        filterMetadata.value = res?.data || res;
      } catch (err) {
        console.error("Failed to fetch trade-book filters:", err);
      }
    };

    const fetchFollowerInfo = () => {
      if (!followerId.value) return;

      const successHandler = (res) => {
        const raw = res?.follower || res?.data?.follower || res?.data || res || {};
        if (res?.fund_manager && !raw.fund_manager) {
          raw.fund_manager = res.fund_manager;
        } else if (res?.data?.fund_manager && !raw.fund_manager) {
          raw.fund_manager = res.data.fund_manager;
        }
        followerInfo.value = raw;
      };

      const failureHandler = (err) => {
        console.error("Failed to fetch follower info:", err);
      };

      const endpoint = `${urls.tradeBook.followerDetails}${followerId.value}`;
      return apiRequest(urls.KEYS.GET, endpoint, {
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    };

    const fetchOpenLegs = () => {
      if (!followerId.value) return;

      openLegsLoading.value = true;

      const successHandler = (res) => {
        const legs = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        openLegs.value = legs;
        subscribeTradeSymbols(legs, { onlyOpen: false });
        openLegsFetched.value = true;
        openLegsLoading.value = false;
      };

      const failureHandler = (err) => {
        openLegsFetched.value = true;
        openLegsLoading.value = false;
        console.error("Failed to fetch open legs:", err);
      };

      apiRequest(urls.KEYS.GET, urls.tradeBook.openLegs, {
        params: { follower_id: followerId.value },
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    };

    const fetchTab = (tabName, force = false) => {
      if (!followerId.value) return;

      if (tabName === "open_legs") {
        fetchOpenLegs();
        return;
      }

      const target = tabState.value[tabName];
      if (!target) return;
      if (target.isFetched && !force) return;

      target.loading = true;

      const endpointMap = {
        deals: urls.tradeBook.deals,
        positions: urls.tradeBook.positions,
        orders: urls.tradeBook.orders,
      };

      const endpoint = endpointMap[tabName];
      if (!endpoint) return;

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([, val]) => val !== null && val !== "" && val !== undefined
        )
      );

      const successHandler = (res) => {
        const items = res?.data || [];
        target.data = items;
        target.summary = res?.summary || {};
        Object.assign(target.pagination, {
          page: res?.pagination?.page || 1,
          per_page: res?.pagination?.per_page || 10,
          total_items: res?.pagination?.total_items || items.length,
          total_pages: res?.pagination?.total_pages || 1,
        });

        // Subscribe any symbols to websocket ticker
        subscribeTradeSymbols(items, { onlyOpen: false });

        target.isFetched = true;
        target.loading = false;
      };

      const failureHandler = (err) => {
        target.loading = false;
        snackbar.show(
          err?.message || `Failed to fetch ${tabName}.`,
          "error"
        );
      };

      apiRequest(urls.KEYS.GET, endpoint, {
        params: {
          follower_id: followerId.value,
          page: target.pagination.page,
          per_page: target.pagination.per_page,
          ...cleanFilters,
        },
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    };

    const fetchAll = async (force = false) => {
      if (!followerId.value) return;

      if (!force) isLoading.value = true;
      else isRefreshing.value = true;

      await Promise.allSettled([
        fetchFilterMetadata(),
        fetchFollowerInfo(),
        fetchOpenLegs(),
      ]);

      if (activeTab.value !== "open_legs") {
        fetchTab(activeTab.value, force);
      }

      isLoading.value = false;
      isRefreshing.value = false;
    };

    const setActiveTab = (tabName) => {
      activeTab.value = tabName;
      fetchTab(tabName);
    };

    const setPage = (tabName, page) => {
      const target = tabState.value[tabName];
      if (target) {
        target.pagination.page = page;
        fetchTab(tabName, true);
      }
    };

    const setPerPage = (tabName, perPage) => {
      const target = tabState.value[tabName];
      if (target) {
        target.pagination.per_page = Number(perPage);
        target.pagination.page = 1;
        fetchTab(tabName, true);
      }
    };

    const applyFilters = () => {
      const target = tabState.value[activeTab.value];
      if (target) {
        target.pagination.page = 1;
        target.isFetched = false;
        fetchTab(activeTab.value, true);
      }
    };

    const setDateFilter = (fromDate, toDate) => {
      filters.from_date = fromDate || "";
      filters.to_date = toDate || "";
      Object.keys(tabState.value).forEach((tab) => {
        tabState.value[tab].isFetched = false;
        tabState.value[tab].pagination.page = 1;
      });
      if (activeTab.value !== "open_legs") {
        fetchTab(activeTab.value, true);
      }
    };

    const setFilter = (key, value) => {
      filters[key] = value;
      if (activeTab.value !== "open_legs") {
        applyFilters();
      }
    };

    const setSearch = (val) => {
      filters.search = val;
      if (activeTab.value !== "open_legs") {
        applyFilters();
      }
    };

    const setSortOrder = (val) => {
      filters.sort_order = val;
      if (activeTab.value !== "open_legs") {
        applyFilters();
      }
    };

    const resetFilters = () => {
      Object.keys(filters).forEach((k) => {
        if (k === "sort_order") {
          filters[k] = "desc";
        } else {
          filters[k] = "";
        }
      });
      Object.keys(tabState.value).forEach((tab) => {
        tabState.value[tab].isFetched = false;
        tabState.value[tab].pagination.page = 1;
      });
      if (activeTab.value !== "open_legs") {
        applyFilters();
      }
    };

    const closingPositionId = ref(null);

    const closePosition = (payload, onDone) => {
      const posId = payload?.position_id || payload?.real_trade_id;
      closingPositionId.value = posId;

      const successHandler = (res) => {
        closingPositionId.value = null;
        const msg = res?.data?.synced_from_mt5
          ? `Position #${res?.data?.trade_number || posId} synced from MT5.`
          : `Position #${res?.data?.trade_number || posId} closed successfully.`;
        snackbar.show(msg, "success");

        if (payload?.position_id) {
          openLegs.value = openLegs.value.filter((leg) => (leg.id || leg.position_id) !== payload.position_id);
        } else if (payload?.real_trade_id) {
          openLegs.value = openLegs.value.filter((leg) => leg.real_trade_id !== payload.real_trade_id);
        }

        fetchOpenLegs();
        fetchTab("positions", true);
        fetchTab("deals", true);

        onDone?.(res?.data || res);
      };

      const failureHandler = (err) => {
        closingPositionId.value = null;
        snackbar.show(
          err?.message || "Failed to close position on MT5. Position left open.",
          "error"
        );
      };

      apiRequest(urls.KEYS.POST, urls.fm.closePosition, {
        data: payload,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    };

    return {
      followerId,
      isLoading,
      isRefreshing,
      activeTab,
      filterMetadata,
      followerInfo,
      openLegs,
      openLegsLoading,
      openLegsFetched,
      closingPositionId,
      filters,
      tabState,

      dealsData,
      dealsSummary,
      dealsPagination,

      positionsData,
      positionsSummary,
      positionsPagination,

      ordersData,
      ordersSummary,
      ordersPagination,

      setFollowerId,
      fetchAll,
      fetchTab,
      fetchOpenLegs,
      closePosition,
      setActiveTab,
      setPage,
      setPerPage,
      setDateFilter,
      applyFilters,
      resetFilters,
      resetTabState,
      setFilter,
      setSearch,
      setSortOrder,
    };
  }
);

export default useFollowerTradeBookStore;
