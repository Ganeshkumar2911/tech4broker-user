import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "../../api/request";
import urls from "../../api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useIBDashboard = defineStore("ib-dashboard", () => {
  const campaigns = ref([]);
  const selectedCode = ref("");
  const isLoadingFetchURL = ref(false);
  const loadingDashboard = ref(false);
  const dashboardData = ref(null);
  const loadingGraph = ref(false);
  const graphData = ref(null);

  const snackbar = useSnackbarStore();

  const fetchReferalUrl = async () => {
    isLoadingFetchURL.value = true;

    apiRequest(urls.KEYS.GET, urls.ib_dashboard.fetch_url.list, {
      isTokenRequired: true,
      onSuccess: (res) => {
        campaigns.value = res?.data || [];

        if (campaigns.value.length > 0) {
          selectedCode.value = campaigns.value[0].code;
        }
      },
      onFailure: (err) => {
        snackbar.show(
          err?.message || "Failed to fetch referral links.",
          "error",
        );
      },
      onFinally: () => {
        isLoadingFetchURL.value = false;
      },
    });
  };

  const fetchDashboardData = async () => {
    loadingDashboard.value = true;

    apiRequest(urls.KEYS.GET, urls.ib_dashboard.dashboard.list, {
      isTokenRequired: true,
      onSuccess: (res) => {
        dashboardData.value = res?.data || null;
      },
      onFailure: (err) => {
        snackbar.show(err?.message || "Failed to fetch dashboard data.", "error");
      },
      onFinally: () => {
        loadingDashboard.value = false;
      },
    });
  };

  const fetchGraphData = async (params = {}) => {
    loadingGraph.value = true;

    apiRequest(urls.KEYS.GET, urls.ib_dashboard.dashboard.graph, {
      isTokenRequired: true,
      params,
      onSuccess: (res) => {
        graphData.value = res?.data;
      },
      onFailure: (err) => {
        snackbar.show(err?.message || "Failed to fetch graph data.", "error");
      },
      onFinally: () => {
        loadingGraph.value = false;
      },
    });
  };

  return {
    campaigns,
    isLoadingFetchURL,
    selectedCode,
    loadingDashboard,
    dashboardData,
    loadingGraph,
    graphData,

    fetchDashboardData,
    fetchReferalUrl,
    fetchGraphData,
  };
});
