import { defineStore } from "pinia";
import { ref, watch } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const STORAGE_KEY = "chart_selected_account_id";

const getInitialSelectedAccount = () => {
    if (typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const num = Number(saved);
    return !isNaN(num) ? num : saved;
};

const useOrderStore = defineStore('orders', () => {
    const snackbar = useSnackbarStore();

    const selectedSymbol = ref(null);
    const selectedAccount = ref(getInitialSelectedAccount());

    watch(selectedAccount, (newVal) => {
        if (typeof localStorage !== 'undefined') {
            if (newVal !== null && newVal !== undefined) {
                localStorage.setItem(STORAGE_KEY, String(newVal));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, { immediate: true });
    const isOrderPlacementExpanded = ref(false);
    const loading = ref(false);
    const ordersLoading = ref(false);
    const error = ref(null);

    const ordersData = ref([]);
    const summary = ref({
        filled_orders: 0,
        rejected_orders: 0,
        total_orders: 0,
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
        stateFilter: 'all',  // 'all', 'PLACED', 'FILLED', 'REJECTED', 'CANCELLED'
        typeFilter: 'all',   // 'all', 'BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP'
        searchQuery: '',     // search query for symbol or ticket
        dateRange: [null, null]
    });

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

    // Fetch Orders from GET /trade-book/orders
    const fetchOrders = (tradingAccountId, customFilters = {}) => {
        if (!tradingAccountId) {
            ordersData.value = [];
            return;
        }

        if (customFilters && typeof customFilters === 'object') {
            if (customFilters.state !== undefined) filters.value.stateFilter = customFilters.state;
            if (customFilters.type !== undefined) filters.value.typeFilter = customFilters.type;
            if (customFilters.search !== undefined) filters.value.searchQuery = customFilters.search;
            if (customFilters.dateRange !== undefined) filters.value.dateRange = customFilters.dateRange;
        }

        ordersLoading.value = true;
        error.value = null;

        const params = {
            source: "manual",
            trading_account_id: tradingAccountId,
            page: pagination.value.page,
            per_page: pagination.value.per_page,
        };

        const activeState = customFilters.state !== undefined ? customFilters.state : filters.value.stateFilter;
        if (activeState && activeState !== 'all') {
            params.state = activeState;
        }

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
                params.setup_from = fromFormatted;
            }
        }
        if (activeDates?.[1]) {
            const toFormatted = formatParamDate(activeDates[1]);
            if (toFormatted) {
                params.to_date = toFormatted;
                params.setup_to = toFormatted;
            }
        }

        const successHandler = (res) => {
            ordersLoading.value = false;
            const responseData = res?.data || res || {};

            if (Array.isArray(responseData.data)) {
                ordersData.value = responseData.data;
            } else if (Array.isArray(responseData)) {
                ordersData.value = responseData;
            } else {
                ordersData.value = [];
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
            ordersLoading.value = false;
            error.value = err;
            snackbar.show(err?.message || "Failed to fetch orders.", "error");
        };

        apiRequest(urls.KEYS.GET, urls.tradeBook?.orders || "/trade-book/orders", {
            params,
            isTokenRequired: true,
            onSuccess: successHandler,
            onFailure: failureHandler,
        });
    };

    const setPage = (page) => {
        pagination.value.page = page;
        if (selectedAccount.value) {
            fetchOrders(selectedAccount.value);
        }
    };

    const pendingOrdersData = ref([]);
    const pendingOrdersLoading = ref(false);

    // Dedicated GET request for pending PLACED orders with status=PLACED query parameter
    const fetchPendingOrders = (tradingAccountId, customFilters = {}) => {
        if (!tradingAccountId) {
            pendingOrdersData.value = [];
            return;
        }

        if (customFilters && typeof customFilters === 'object') {
            if (customFilters.type !== undefined) filters.value.typeFilter = customFilters.type;
            if (customFilters.search !== undefined) filters.value.searchQuery = customFilters.search;
        }

        pendingOrdersLoading.value = true;

        const params = {
            source: "manual",
            trading_account_id: tradingAccountId,
            status: "PLACED",
            state: "PLACED",
            per_page: 100,
        };

        const activeType = customFilters.type !== undefined ? customFilters.type : filters.value.typeFilter;
        if (activeType && activeType !== 'all') {
            params.type = activeType;
        }

        const activeSearch = customFilters.search !== undefined ? customFilters.search : filters.value.searchQuery;
        if (activeSearch && activeSearch.trim()) {
            params.search = activeSearch.trim();
        }

        apiRequest(urls.KEYS.GET, urls.tradeBook?.orders || "/trade-book/orders", {
            params,
            isTokenRequired: true,
            onSuccess: (res) => {
                pendingOrdersLoading.value = false;
                const responseData = res?.data || res || {};
                if (Array.isArray(responseData.data)) {
                    pendingOrdersData.value = responseData.data;
                } else if (Array.isArray(responseData)) {
                    pendingOrdersData.value = responseData;
                } else {
                    pendingOrdersData.value = [];
                }
            },
            onFailure: (err) => {
                pendingOrdersLoading.value = false;
                console.error("Failed to fetch pending PLACED orders:", err);
                pendingOrdersData.value = [];
            }
        });
    };

    const placeOrder = (payload) => {
        loading.value = true;
        error.value = null;

        return new Promise((resolve, reject) => {
            const successHandler = (res) => {
                loading.value = false;
                snackbar.show("Order placed successfully.", "success");
                const accId = payload?.trading_account_id || selectedAccount.value;
                if (accId) {
                    fetchOrders(accId);
                    fetchPendingOrders(accId);
                }
                resolve(res);
            };

            const failureHandler = (err) => {
                loading.value = false;
                error.value = err;
                snackbar.show(err?.message || "Failed to place order.", "error");
                reject(err);
            };

            apiRequest(urls.KEYS.POST, urls.orders.place, {
                data: payload,
                isTokenRequired: true,
                onSuccess: successHandler,
                onFailure: failureHandler,
            });
        });
    };

    const modifyOrder = (orderTicket, payload) => {
        loading.value = true;
        error.value = null;

        return new Promise((resolve, reject) => {
            const successHandler = (res) => {
                loading.value = false;
                snackbar.show("Order modified successfully.", "success");
                if (selectedAccount.value) {
                    fetchOrders(selectedAccount.value);
                    fetchPendingOrders(selectedAccount.value);
                }
                resolve(res);
            };

            const failureHandler = (err) => {
                loading.value = false;
                error.value = err;
                snackbar.show(err?.message || "Failed to modify order.", "error");
                reject(err);
            };

            apiRequest(urls.KEYS.PATCH, urls.orders.modify(orderTicket), {
                data: payload,
                isTokenRequired: true,
                onSuccess: successHandler,
                onFailure: failureHandler,
            });
        });
    };

    const cancelOrder = (orderTicket) => {
        loading.value = true;
        error.value = null;

        return new Promise((resolve, reject) => {
            const successHandler = (res) => {
                loading.value = false;
                snackbar.show("Order cancelled successfully.", "success");
                if (selectedAccount.value) {
                    fetchOrders(selectedAccount.value);
                    fetchPendingOrders(selectedAccount.value);
                }
                resolve(res);
            };

            const failureHandler = (err) => {
                loading.value = false;
                error.value = err;
                snackbar.show(err?.message || "Failed to cancel order.", "error");
                reject(err);
            };

            apiRequest(urls.KEYS.DELETE, urls.orders.cancel(orderTicket), {
                isTokenRequired: true,
                onSuccess: successHandler,
                onFailure: failureHandler,
            });
        });
    };

    const isOrderModalOpen = ref(false);
    const modalDirection = ref('Buy');

    const openOrderModal = (direction = 'Buy') => {
        if (direction) modalDirection.value = direction;
        isOrderModalOpen.value = true;
    };

    const closeOrderModal = () => {
        isOrderModalOpen.value = false;
    };

    return {
        selectedAccount,
        selectedSymbol,
        isOrderPlacementExpanded,
        isOrderModalOpen,
        modalDirection,
        openOrderModal,
        closeOrderModal,
        ordersData,
        pendingOrdersData,
        summary,
        pagination,
        filters,
        loading,
        ordersLoading,
        pendingOrdersLoading,
        error,
        fetchOrders,
        fetchPendingOrders,
        setPage,
        placeOrder,
        modifyOrder,
        cancelOrder
    };
});

export default useOrderStore;