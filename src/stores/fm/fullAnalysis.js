import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { subscribeTradeSymbols } from "@/utils/symbolUtils";

export const useFmFullAnalysisStore = defineStore("fmFullAnalysis", () => {
  const trades = ref([]);
  const loading = ref(false);
  const isFetched = ref(false);

  let activeFetchKey = "";

  const fetchFmAnalysis = (
    fmId,
    fromDate,
    toDate,
    isFollowed = false,
    followerId = null,
  ) => {
    const fetchKey = `${fmId}_${fromDate}_${toDate}_${isFollowed}_${followerId}`;
    if (loading.value && activeFetchKey === fetchKey) {
      return;
    }
    activeFetchKey = fetchKey;
    loading.value = true;

    const successHandler = (res) => {
      const rawTrades = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
            ? res
            : [];

      trades.value = rawTrades.map((trade) => ({
        ...trade,
        time: trade.created_at,
        profit: trade.pnl,
        side: trade.type?.toLowerCase() || "",
        ticket: trade.trade_id,
      }));

      if (rawTrades.length > 0) {
        subscribeTradeSymbols(rawTrades, { onlyOpen: false });
      }

      isFetched.value = true;
      loading.value = false;
    };

    const failureHandler = () => {
      loading.value = false;
    };

    const params = {
      data: {
        fm_id: Number(fmId),
        from_date: fromDate,
        to_date: toDate,
      },
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
      params.params = {
        is_followed: "false",
      };
    }

    apiRequest(urls.KEYS.POST, urls.fm.fullAnalysis, params);
  };

  const reset = () => {
    trades.value = [];
    loading.value = false;
    isFetched.value = false;
  };

  return {
    trades,
    loading,
    isFetched,
    fetchFmAnalysis,
    reset,
  };
});
