import { defineStore } from "pinia";
import { ref } from "vue";

import apiRequest from "@/api/request";
import urls from "@/api/urls";

import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useFmStrategiesStore } from "@/stores/fm/strategies";

export const useFMDashboardStore = defineStore("fmDashboard", () => {
  const dashboard = ref(null);
  const performanceAnalytics = ref(null);

  const dashboardLoading = ref(false);
  const analyticsLoading = ref(false);

  const dashboardFetched = ref(false);
  const analyticsFetched = ref(false);

  const error = ref(null);
  const analyticsFilters = ref({
    range: "weekly",
  });

  const snackbar = useSnackbarStore();

  let dashboardPromise = null;
  let analyticsPromise = null;

  const fetchDashboard = async (force = false, fmId = null) => {
    if (dashboardLoading.value && dashboardPromise && !force) return dashboardPromise;
    if (dashboardFetched.value && !force && !fmId) return Promise.resolve(dashboard.value);

    let activeFmId =
      fmId || Number(localStorage.getItem("fm_active_strategy_id")) || undefined;

    const strategiesStore = useFmStrategiesStore();
    if (!activeFmId || !strategiesStore.isFetched.strategies) {
      await strategiesStore.fetchStrategies();
      activeFmId =
        fmId ||
        strategiesStore.selectedStrategyId ||
        Number(localStorage.getItem("fm_active_strategy_id")) ||
        undefined;
    }

    dashboardLoading.value = true;
    error.value = null;

    const params = {};
    if (activeFmId) params.fm_id = activeFmId;

    dashboardPromise = new Promise((resolve) => {
      const successHandler = (res) => {
        dashboard.value = res?.data || null;
        dashboardFetched.value = true;
        dashboardLoading.value = false;
        dashboardPromise = null;
        resolve(dashboard.value);
      };

      const failureHandler = (err) => {
        dashboardLoading.value = false;
        dashboardPromise = null;
        error.value = err;
        snackbar.show(err?.message || "Failed to fetch FM dashboard.", "error");
        resolve(null);
      };

      apiRequest(urls.KEYS.GET, urls.dashboard.fmOverview, {
        isTokenRequired: true,
        params,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });

    return dashboardPromise;
  };

  // ─────────────────────────────────────────────
  // Performance Analytics API
  // ─────────────────────────────────────────────

  const fetchPerformanceAnalytics = async (force = false, fmId = null) => {
    if (analyticsLoading.value && analyticsPromise && !force) return analyticsPromise;
    if (analyticsFetched.value && !force && !fmId) return Promise.resolve(performanceAnalytics.value);

    let activeFmId =
      fmId || Number(localStorage.getItem("fm_active_strategy_id")) || undefined;

    const strategiesStore = useFmStrategiesStore();
    if (!activeFmId || !strategiesStore.isFetched.strategies) {
      await strategiesStore.fetchStrategies();
      activeFmId =
        fmId ||
        strategiesStore.selectedStrategyId ||
        Number(localStorage.getItem("fm_active_strategy_id")) ||
        undefined;
    }

    analyticsLoading.value = true;
    error.value = null;

    const params = {
      range: analyticsFilters.value.range,
    };
    if (activeFmId) params.fm_id = activeFmId;

    analyticsPromise = new Promise((resolve) => {
      const successHandler = (res) => {
        performanceAnalytics.value = res?.data || null;
        analyticsFetched.value = true;
        analyticsLoading.value = false;
        analyticsPromise = null;
        resolve(performanceAnalytics.value);
      };

      const failureHandler = (err) => {
        analyticsLoading.value = false;
        analyticsPromise = null;
        error.value = err;
        snackbar.show(
          err?.message || "Failed to fetch performance analytics.",
          "error",
        );
        resolve(null);
      };

      apiRequest(urls.KEYS.GET, urls.dashboard.fmPerformanceAnalytics, {
        isTokenRequired: true,
        params,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });

    return analyticsPromise;
  };

  // ─────────────────────────────────────────────
  // Analytics Range Filter
  // ─────────────────────────────────────────────

  const setAnalyticsRange = (range) => {
    analyticsFilters.value.range = range;

    analyticsFetched.value = false;

    fetchPerformanceAnalytics();
  };

  // ─────────────────────────────────────────────
  // Reset Store
  // ─────────────────────────────────────────────

  const reset = () => {
    dashboard.value = null;

    performanceAnalytics.value = null;

    dashboardLoading.value = false;

    analyticsLoading.value = false;

    dashboardFetched.value = false;

    analyticsFetched.value = false;

    error.value = null;

    analyticsFilters.value = {
      range: "weekly",
    };
  };

  return {
    dashboard,
    performanceAnalytics,

    dashboardLoading,
    analyticsLoading,

    dashboardFetched,
    analyticsFetched,

    analyticsFilters,
    error,
    
    fetchDashboard,
    fetchPerformanceAnalytics,

    setAnalyticsRange,

    reset,
  };
});

// {
//     "data": {
//         "follower_insights": {
//             "highest_equity": 929.4,
//             "highest_fee_client": {
//                 "client_name": "Ganesh Paila",
//                 "total_fees": 0.0
//             },
//             "highest_profit_client": {
//                 "client_name": "Ganesh Paila",
//                 "net_profit": 76.67
//             },
//             "lowest_equity": 929.4,
//             "most_active_client": {
//                 "client_name": "Ganesh Paila",
//                 "total_trades": 9
//             }
//         },
//         "overview": {
//             "active_followers": 1,
//             "active_trading_accounts": 1,
//             "average_client_equity": 929.4,
//             "avg_profit_per_client": 76.67,
//             "inactive_followers": 0,
//             "total_fee_earned": 0.0,
//             "total_followers": 1,
//             "total_net_profit_generated": 76.67,
//             "total_trades": 9,
//             "wallet_balance": 0.0
//         },
//         "performance_profile": {
//             "broker_share": 50.0,
//             "fm_id": 2,
//             "fm_name": "Ganesh FM",
//             "max_drawdown_percent": "22.83",
//             "performance_fee": 2.0,
//             "ranking": 2,
//             "total_loss_trades": 6,
//             "total_profit": 76.67,
//             "total_profitable_trades": 3,
//             "win_rate_percent": 33.33
//         },
//         "recent_followers": [
//             {
//                 "account_number": "CT000906",
//                 "client_name": "Ganesh Paila",
//                 "equity": 929.4,
//                 "joined_at": "Tue, 28 Jul 2026 09:53:27 GMT"
//             }
//         ],
//         "recent_wallet_transactions": [
//             {
//                 "amount": 1000.0,
//                 "created_at": "Tue, 28 Jul 2026 09:50:55 GMT",
//                 "description": "Adjustment by admin",
//                 "ledger_id": 841,
//                 "type": "deposit"
//             }
//         ],
//         "top_followers": [
//             {
//                 "client_name": "Ganesh Paila",
//                 "equity": 929.4,
//                 "gross_pnl": 76.67,
//                 "net_profit": 76.67,
//                 "status": "active",
//                 "total_fees": 0.0,
//                 "total_trades": 9
//             }
//         ],
//         "trading_accounts": [
//             {
//                 "account_id": 1031,
//                 "account_number": "671026",
//                 "account_role": "master",
//                 "balance": 0.0,
//                 "server": "PantherCapitals-Server",
//                 "status": true
//             }
//         ],
//         "wallet_summary": {
//             "pending_withdrawals": 0,
//             "total_credits": 1000.0,
//             "total_withdrawals": 0.0,
//             "wallet_balance": 0.0
//         }
//     },
//     "status": "success"
// }
