import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { calculateFromDate, getCurrentDate } from "@/utils/chart/calculation";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useHistoricalDataStore = defineStore("historicalData", () => {
  const snackbar = useSnackbarStore();

  const historicalCandles = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const noData = ref(false);

  let pendingPromise = null;
  let lastFetchKey = "";

  const fetchHistoricalData = (instrumentToken = 'XAUUSD', interval = 'minute') => {
    if (!instrumentToken) return Promise.resolve([]);

    const intervalVal = typeof interval === 'object' 
      ? (interval.value || interval.type || 'minute') 
      : String(interval || 'minute');

    const fetchKey = `${instrumentToken}_${intervalVal}`;

    // Prevent duplicate concurrent requests for the same symbol & interval
    if (isLoading.value && pendingPromise && lastFetchKey === fetchKey) {
      return pendingPromise;
    }

    lastFetchKey = fetchKey;
    isLoading.value = true;
    error.value = null;
    noData.value = false;

    const from_date = calculateFromDate(intervalVal) || calculateFromDate('minute');
    const to_date = getCurrentDate();

    const params = {
      instrument_token: instrumentToken,
      interval: intervalVal,
      from_date,
      to_date,
    };

    pendingPromise = new Promise((resolve) => {
      const successHandler = (res) => {
        isLoading.value = false;
        const responseData = res?.data || res || [];
        const candlesArr = Array.isArray(responseData.data) 
          ? responseData.data 
          : (Array.isArray(responseData) ? responseData : []);

        if (candlesArr.length === 0) {
          noData.value = true;
          historicalCandles.value = [];
          snackbar.show(`No historical chart data available for ${instrumentToken}`, "warning");
          resolve([]);
          return;
        }

        // Transform candles for klinecharts
        const transformed = candlesArr.map(candle => {
          const rawDate = candle.date || candle.time || candle.timestamp || candle[0];
          let timestamp = typeof rawDate === 'number'
            ? (rawDate > 1e10 ? rawDate : rawDate * 1000)
            : new Date(rawDate).getTime();

          if (isNaN(timestamp)) {
            timestamp = Date.now();
          }

          return {
            timestamp,
            open: parseFloat(candle.open ?? candle[1] ?? 0),
            high: parseFloat(candle.high ?? candle[2] ?? 0),
            low: parseFloat(candle.low ?? candle[3] ?? 0),
            close: parseFloat(candle.close ?? candle[4] ?? 0),
            volume: parseFloat(candle.volume ?? candle[5] ?? 0),
          };
        });

        historicalCandles.value = transformed;
        noData.value = false;
        resolve(transformed);
      };

      const failureHandler = (err) => {
        isLoading.value = false;
        error.value = err;
        noData.value = true;
        historicalCandles.value = [];
        snackbar.show(err?.message || `Failed to load historical chart data for ${instrumentToken}`, "error");
        resolve([]);
      };

      apiRequest(urls.KEYS.GET, urls.trade?.historical || "/trade/historical", {
        params,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });

    return pendingPromise;
  };

  return {
    historicalCandles,
    isLoading,
    error,
    noData,
    fetchHistoricalData,
  };
});

export default useHistoricalDataStore;
