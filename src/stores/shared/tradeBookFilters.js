import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";

export const DEFAULT_FILTER_METADATA = {
  deals: {
    action: {
      aliases: ["type", "order_type"],
      multi: true,
      options: [
        { label: "BUY", value: "BUY" },
        { label: "SELL", value: "SELL" },
      ],
      type: "enum",
    },
    entry: {
      multi: true,
      options: [
        { label: "IN", value: "IN" },
        { label: "OUT", value: "OUT" },
        { label: "INOUT", value: "INOUT" },
        { label: "OUT_BY", value: "OUT_BY" },
      ],
      type: "enum",
    },
    from_date: {
      aliases: ["time_from"],
      type: "date",
    },
    result: {
      options: [
        { label: "profit", value: "profit" },
        { label: "loss", value: "loss" },
        { label: "breakeven", value: "breakeven" },
      ],
      type: "enum",
    },
    search: {
      type: "string",
    },
    symbol: {
      aliases: ["symbols"],
      multi: true,
      type: "string",
    },
    to_date: {
      aliases: ["time_to"],
      type: "date",
    },
  },
  orders: {
    from_date: {
      aliases: ["setup_from"],
      type: "date",
    },
    search: {
      type: "string",
    },
    state: {
      multi: true,
      options: [
        { label: "STARTED", value: "STARTED" },
        { label: "PLACED", value: "PLACED" },
        { label: "CANCELED", value: "CANCELED" },
        { label: "PARTIAL", value: "PARTIAL" },
        { label: "FILLED", value: "FILLED" },
        { label: "REJECTED", value: "REJECTED" },
        { label: "EXPIRED", value: "EXPIRED" },
      ],
      type: "enum",
    },
    symbol: {
      aliases: ["symbols"],
      multi: true,
      type: "string",
    },
    to_date: {
      aliases: ["setup_to"],
      type: "date",
    },
    type: {
      aliases: ["order_type", "action"],
      multi: true,
      options: [
        { label: "BUY", value: "BUY" },
        { label: "SELL", value: "SELL" },
      ],
      type: "enum",
    },
  },
  positions: {
    action: {
      aliases: ["type", "order_type"],
      multi: true,
      options: [
        { label: "BUY", value: "BUY" },
        { label: "SELL", value: "SELL" },
      ],
      type: "enum",
    },
    closed_from: {
      type: "date",
    },
    closed_to: {
      type: "date",
    },
    from_date: {
      aliases: ["opened_from"],
      type: "date",
    },
    result: {
      options: [
        { label: "profit", value: "profit" },
        { label: "loss", value: "loss" },
        { label: "breakeven", value: "breakeven" },
      ],
      type: "enum",
    },
    search: {
      type: "string",
    },
    status: {
      multi: true,
      options: [
        { label: "OPEN", value: "OPEN" },
        { label: "CLOSED", value: "CLOSED" },
      ],
      type: "enum",
    },
    symbol: {
      aliases: ["symbols"],
      multi: true,
      type: "string",
    },
    to_date: {
      aliases: ["opened_to"],
      type: "date",
    },
  },
};

export const useTradeBookFiltersStore = defineStore("tradeBookFilters", () => {
  const filterMetadata = ref(JSON.parse(JSON.stringify(DEFAULT_FILTER_METADATA)));
  const isLoaded = ref(false);
  const isLoading = ref(false);

  const fetchFilterMetadata = async () => {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      const res = await apiRequest(urls.KEYS.GET, urls.tradeBook.filters);
      const resData = res?.data || res;
      if (resData && typeof resData === "object") {
        filterMetadata.value = {
          ...DEFAULT_FILTER_METADATA,
          ...resData,
        };
        isLoaded.value = true;
      }
    } catch (err) {
      console.warn("Failed to fetch dynamic trade-book filters from API, using defaults:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Helper options for UI dropdowns
  const positionsActionOptions = computed(() => {
    const opts = filterMetadata.value?.positions?.action?.options || DEFAULT_FILTER_METADATA.positions.action.options;
    return [{ label: "All Types", value: "all" }, ...opts];
  });

  const positionsSideOptions = computed(() => {
    const opts = filterMetadata.value?.positions?.action?.options || DEFAULT_FILTER_METADATA.positions.action.options;
    return [{ label: "All Sides", value: "all" }, ...opts.map(o => ({ label: `${o.label} Only`, value: o.value }))];
  });

  const ordersStateOptions = computed(() => {
    const opts = filterMetadata.value?.orders?.state?.options || DEFAULT_FILTER_METADATA.orders.state.options;
    return [{ label: "All States", value: "all" }, ...opts];
  });

  const ordersTypeOptions = computed(() => {
    const opts = filterMetadata.value?.orders?.type?.options || DEFAULT_FILTER_METADATA.orders.type.options;
    return [{ label: "All Types", value: "all" }, ...opts];
  });

  const dealsActionOptions = computed(() => {
    const opts = filterMetadata.value?.deals?.action?.options || DEFAULT_FILTER_METADATA.deals.action.options;
    return [{ label: "All Types", value: "all" }, ...opts];
  });

  const dealsEntryOptions = computed(() => {
    const opts = filterMetadata.value?.deals?.entry?.options || DEFAULT_FILTER_METADATA.deals.entry.options;
    return [{ label: "All Entries", value: "all" }, ...opts];
  });

  return {
    filterMetadata,
    isLoaded,
    isLoading,
    fetchFilterMetadata,
    positionsActionOptions,
    positionsSideOptions,
    ordersStateOptions,
    ordersTypeOptions,
    dealsActionOptions,
    dealsEntryOptions,
  };
});

export default useTradeBookFiltersStore;
