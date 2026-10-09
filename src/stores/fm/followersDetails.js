import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useFollowersDetailsStore = defineStore("followersDetails", () => {
  const snackbar = useSnackbarStore();

  const details = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchDetails = (id) => {
    loading.value = true;
    error.value = null;

    const successHandler = (res) => {
      details.value = res?.data || null;
      loading.value = false;
    };

    const failureHandler = (err) => {
      loading.value = false;
      error.value = err;
      snackbar.show(
        err?.message || "Failed to fetch follower details.",
        "error"
      );
    };

    apiRequest(urls.KEYS.GET, urls.fm.followersDetails, {
      look_up_key: id,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const reset = () => {
    details.value = null;
    loading.value = false;
    error.value = null;
  };

  return {
    details,
    loading,
    error,
    fetchDetails,
    reset,
  };
});
