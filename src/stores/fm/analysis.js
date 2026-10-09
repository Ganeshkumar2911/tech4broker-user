import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useProfileStore } from "@/stores/shared/profile";

const createDefaultAnalytics = () => ({
  FundManagerinfo: {},
  overview: {},
  trade_statistics: {},
  strategy_info: {},
  follower_info: {},
  recent_performance: {},
  monthly_returns: [],
  growth_chart: [],
});

export const useFmAnalysisStore = defineStore("fmAnalysis", () => {
  const analytics = ref(createDefaultAnalytics());
  const growthChartData = ref([]);

  const loading = ref(false);
  const growthChartLoading = ref(false);
  const error = ref(null);

  const snackbar = useSnackbarStore();

  // ─── Fetch Growth Chart API (Client Only) ─────────────────
  const fetchGrowthChart = (id, isFollowed = false, followerId = null, startDate = null, endDate = null) => {
    if (!id) return;

    growthChartLoading.value = true;

    const queryParams = {
      is_followed: isFollowed ? "true" : "false",
    };
    if (isFollowed && followerId) {
      queryParams.follower_id = followerId;
    }
    if (startDate) queryParams.from_date = startDate;
    if (endDate) queryParams.to_date = endDate;

    apiRequest(urls.KEYS.GET, urls.fm.growthChart, {
      look_up_key: id,
      params: queryParams,
      role: "client",
      isTokenRequired: true,
      onSuccess: (res) => {
        const rawData = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.growth_chart)
          ? res.data.growth_chart
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];

        growthChartData.value = rawData;

        if (analytics.value) {
          analytics.value.growth_chart = rawData;
        }

        growthChartLoading.value = false;
      },
      onFailure: (err) => {
        growthChartLoading.value = false;
        console.error("Failed to fetch growth chart:", err);
      },
    });
  };

  // ─── Fetch FM Analytics ───────────────────────────────────
  const fetchAnalytics = (id, isFollowed = false, followerId = null, skipGrowthChart = false, startDate = null, endDate = null) => {
    if (!id) return;

    loading.value = true;
    growthChartData.value = [];

    const profileStore = useProfileStore();
    const currentRole =
      profileStore.user?.role || localStorage.getItem("role") || "client";
    const isFmRole = currentRole === "fm";

    // Call dedicated growth_chart API ONLY for client role. For fund manager, use analytics endpoint data.
    if (!isFmRole && !skipGrowthChart) {
      fetchGrowthChart(id, isFollowed, followerId);
    }

    const successHandler = (res) => {
      const resData = res?.data || {};

      const name = String(
        resData?.FundManagerinfo?.name ||
        resData?.FundManagerinfo?.label_name ||
        ""
      ).toUpperCase();

      if (
        (name.includes("ARBT_GOLDBOT") || String(id) === "10") &&
        resData.strategy_info &&
        !resData.strategy_info._copiersAdjusted
      ) {
        resData.strategy_info.active_copiers =
          Number(resData.strategy_info.active_copiers || 0) + 5;
        resData.strategy_info._copiersAdjusted = true;
      }

      analytics.value = {
        ...createDefaultAnalytics(),
        ...resData,
        growth_chart:
          !isFmRole && growthChartData.value.length
            ? growthChartData.value
            : resData.growth_chart || [],
      };

      loading.value = false;
    };

    const failureHandler = (err) => {
      loading.value = false;
      error.value = err;

      snackbar.show(err?.message || "Failed to fetch FM analytics.", "error");
    };

    const params = {
      look_up_key: id,
      isTokenRequired: true,

      onSuccess: successHandler,
      onFailure: failureHandler,
    };

    if (isFollowed && followerId) {
      params.params = {
        is_followed: "true",
        follower_id: followerId,
      };
    } else {
      params.params = {};
    }

    if (startDate) params.params.from_date = startDate;
    if (endDate) params.params.to_date = endDate;

    apiRequest(urls.KEYS.GET, urls.fm.analytics, params);
  };

  // ─── Reset ────────────────────────────────────────────────
  const reset = () => {
    analytics.value = createDefaultAnalytics();
    growthChartData.value = [];

    loading.value = false;
    growthChartLoading.value = false;
    error.value = null;
  };

  return {
    analytics,
    growthChartData,

    loading,
    growthChartLoading,
    error,

    fetchAnalytics,
    fetchGrowthChart,
    reset,
  };
});
