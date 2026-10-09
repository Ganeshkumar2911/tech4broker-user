import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useFollowersStore = defineStore("followers", () => {
  const data = ref([]);
  const counts = ref({
    all: null,
    active: null,
    paused: null,
  });

  const pagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0,
  });

  const search = ref("");
  const status = ref("all");
  const offerId = ref(null);
  const offers = ref([]);
  let debounceTimer = null;

  const isLoading = ref(false);
  const error = ref(null);
  const isFetched = ref(false);

  const snackbar = useSnackbarStore();

  const fetchFollowers = (force = false, page = 1, searchQuery = "") => {
    if (isFetched.value && !force) return;

    isLoading.value = true;

    const successHandler = (res) => {
      data.value = res?.data || [];
      pagination.value = res?.pagination || pagination.value;

      if (res?.counts || res?.summary?.counts) {
        const c = res.counts || res.summary.counts;
        counts.value = {
          all: c.all ?? c.total ?? null,
          active: c.active ?? null,
          paused: c.paused ?? c.inactive ?? null,
        };
      }

      // Extract offers from response filters if available
      if (res?.filters?.offers) {
        offers.value = [
          { label: "All Offers", value: null },
          ...res.filters.offers.map((offer) => ({
            label: offer.name,
            value: offer.id,
          })),
        ];
      }

      isLoading.value = false;
      isFetched.value = true;
    };

    const failureHandler = (err) => {
      isLoading.value = false;
      error.value = err;
      snackbar.show(err?.message || "Something went wrong fetching followers.", "error");
    };

    const params = {
      page,
      per_page: pagination.value.per_page,
    };

    if (status.value && status.value !== "all") {
      params.status = status.value;
    }

    if (searchQuery) {
      params.search = searchQuery;
    }

    if (offerId.value !== null) {
      params.offer_id = offerId.value;
    }

    apiRequest(urls.KEYS.GET, urls.followers.list, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const setSearch = (val) => {
    search.value = val;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      isFetched.value = false;
      fetchFollowers(true, 1, search.value);
    }, 400);
  };

  const setStatus = (val) => {
    status.value = val;
    isFetched.value = false;
    pagination.value.page = 1;
    fetchFollowers(true, 1, search.value);
  };

  const setOfferId = (val) => {
    offerId.value = val;
    isFetched.value = false;
    pagination.value.page = 1;
    fetchFollowers(true, 1, search.value);
  };

  const reset = () => {
    data.value = [];
    search.value = "";
    status.value = "all";
    offerId.value = null;
    pagination.value.page = 1;
    isFetched.value = false;
  };

  return {
    data,
    counts,
    pagination,
    search,
    status,
    offerId,
    offers,

    isLoading,
    error,
    isFetched,

    fetchFollowers,
    setSearch,
    setStatus,
    setOfferId,
    reset,
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("fm-strategy-changed", () => {
    try {
      const store = useFollowersStore();
      store.isFetched = false;
      store.fetchFollowers(true);
    } catch (e) {}
  });
}
