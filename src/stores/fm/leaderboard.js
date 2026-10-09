import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useFollowedFundManagersStore } from "@/stores/fm/followedFundManagers";

export const useFmLeaderboardStore = defineStore("fmLeaderboard", () => {
  const snackbar = useSnackbarStore();
  const followedFundManagers = useFollowedFundManagersStore();
  const data = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const isFetched = ref(false);
  const pagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0,
  });
  const filters = ref({
    sort_by: "total_return",
    order: "desc",
  });
  const tradingAccounts = ref([]);
  const actionLoading = ref(false);
  const unfollowPreviewLoading = ref(false);
  const unfollowPreview = ref(null);
  const fmOffers = ref([]);
  const fmOffersLoading = ref(false);
  const fmOffersMessage = ref("");
  const pendingPrivateOfferData = ref(null);

  const followerAccountMode = ref(3);
  const tradingAccountsLoading = ref(false);

  const fetchFmLeaderboard = (force = false, page = 1) => {
    if (isFetched.value && !force) return;

    isLoading.value = true;

    const successHandler = (res) => {
      const rawList = res?.data || [];
      data.value = rawList.map((item) => {
        const name = String(item?.label_name || item?.name || "").trim().toUpperCase();
        if (name.includes("ARBT_GOLDBOT") && !item?._followersAdjusted) {
          return {
            ...item,
            total_followers: Number(item?.total_followers || 0) + 5,
            _followersAdjusted: true,
          };
        }
        return item;
      });
      pagination.value = res?.pagination || pagination.value;
      isLoading.value = false;
      isFetched.value = true;
    };

    const failureHandler = (err) => {
      isLoading.value = false;
      error.value = err;
      snackbar.show(err?.message || "Something went wrong.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.fm.list, {
      params: {
        page,
        per_page: pagination.value.per_page,
        sort_by: filters.value.sort_by,
        order: filters.value.order,
      },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const fetchTradingAccounts = (fm_id, mode = null) => {
    tradingAccountsLoading.value = true;
    const params = {};
    if (fm_id) params.fm_id = fm_id;
    if (mode) params.mode = mode;

    const successHandler = (res) => {
      tradingAccounts.value = res?.data || [];
      const modeVal =
        res?.follower_account_type ??
        res?.follower_account_mode ??
        res?.data?.follower_account_type ??
        res?.data?.follower_account_mode;
      if (modeVal != null) {
        followerAccountMode.value = Number(modeVal);
      }
      tradingAccountsLoading.value = false;
    };

    const failureHandler = (err) => {
      tradingAccountsLoading.value = false;
      snackbar.show(err?.message || "Something went wrong.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.fm.tradingAccounts, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const createRealFollowerAccount = (payload, onDone) => {
    actionLoading.value = true;
    const successHandler = (res) => {
      actionLoading.value = false;
      snackbar.show("Real account created successfully.", "success");
      onDone?.(res?.data || res);
    };
    const failureHandler = (err) => {
      actionLoading.value = false;
      snackbar.show(err?.message || "Failed to create account.", "error");
    };
    apiRequest(urls.KEYS.POST, urls.fm.createAccount, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };
  const followFm = (payload, onDone) => {
    actionLoading.value = true;
    const finalPayload = { ...payload };
    if (finalPayload.lot_value !== undefined && finalPayload.lot_value !== null) {
      finalPayload.lot_value = Math.max(0.01, Number(finalPayload.lot_value) || 0.01);
    }
    const successHandler = (res) => {
      actionLoading.value = false;
      snackbar.show(res?.message || "Followed successfully.", "success");
      fetchFmLeaderboard(true);
      followedFundManagers.fetchFollowedFundManagers(true);
      onDone?.(res?.data || res);
    };
    const failureHandler = (err) => {
      actionLoading.value = false;
      snackbar.show(err?.message || "Something went wrong.", "error");
    };
    apiRequest(urls.KEYS.POST, urls.fm.follow, {
      data: finalPayload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const unfollowFm = (payload, onDone) => {
    actionLoading.value = true;
    const successHandler = (res) => {
      actionLoading.value = false;
      snackbar.show(res?.message || "Unfollowed successfully.", "success");
      // fetchFmLeaderboard(true);
      followedFundManagers.fetchFollowedFundManagers(true);
      onDone?.(res?.data || res);
    };
    const failureHandler = (err) => {
      actionLoading.value = false;
      snackbar.show(err?.message || "Something went wrong.", "error");
    };
    apiRequest(urls.KEYS.POST, urls.fm.unfollow, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const fetchUnfollowPreview = (payload) => {
    unfollowPreviewLoading.value = true;
    unfollowPreview.value = null;

    const successHandler = (res) => {
      unfollowPreviewLoading.value = false;
      unfollowPreview.value = res?.data || null;
    };

    const failureHandler = (err) => {
      unfollowPreviewLoading.value = false;
      snackbar.show(err?.message || "Something went wrong.", "error");
    };

    apiRequest(urls.KEYS.POST, urls.fm.unfollowPreview, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const fetchFmOffers = (fmId) => {
    fmOffersLoading.value = true;
    fmOffers.value = [];
    fmOffersMessage.value = "";

    const successHandler = (res) => {
      fmOffersLoading.value = false;
      fmOffers.value = res?.data || [];
      fmOffersMessage.value = res?.message || "";
    };

    const failureHandler = (err) => {
      fmOffersLoading.value = false;
      fmOffers.value = [];
      fmOffersMessage.value =
        err?.message || "No public offers found for this fund manager.";
      snackbar.show(err?.message || "Something went wrong.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.fm.offers, {
      look_up_key: fmId,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const reset = () => {
    data.value = [];
    isLoading.value = false;
    error.value = null;
    isFetched.value = false;
    fmOffers.value = [];
    fmOffersLoading.value = false;
    fmOffersMessage.value = "";
    pagination.value = {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 0,
    };
    filters.value = {
      sort_by: "total_return",
      order: "desc",
    };
  };

  const setPrivateOfferData = (data) => {
    pendingPrivateOfferData.value = data;
  };

  const clearPrivateOfferData = () => {
    pendingPrivateOfferData.value = null;
  };

  return {
    data,
    isLoading,
    error,
    isFetched,
    pagination,
    tradingAccounts,
    tradingAccountsLoading,
    followerAccountMode,
    actionLoading,
    unfollowPreviewLoading,
    unfollowPreview,
    fmOffers,
    fmOffersLoading,
    fmOffersMessage,
    pendingPrivateOfferData,
    filters,
    fetchTradingAccounts,
    createRealFollowerAccount,
    followFm,
    unfollowFm,
    fetchUnfollowPreview,
    fetchFmLeaderboard,
    fetchFmOffers,
    setPrivateOfferData,
    clearPrivateOfferData,
    reset,
  };
});
