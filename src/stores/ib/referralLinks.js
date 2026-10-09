import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useIbReferralLinksStore = defineStore("ibReferralLinks", () => {
  const snackbar = useSnackbarStore();

  const records = ref([]);
  const parentRecords = ref([]);
  const loading = ref(false);
  const actionLoading = ref(false);
  const error = ref(null);

  const fetchReferralLinks = (ibId) => {
    loading.value = true;
    error.value = null;

    const successHandler = (res) => {
      records.value = res?.data || [];
      loading.value = false;
    };

    const failureHandler = (err) => {
      loading.value = false;
      error.value = err;
      snackbar.show(err?.message || "Failed to fetch referral links.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.referralLinks.list, {
      isTokenRequired: true,
      look_up_key: ibId,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const createReferralLink = (ibId, payload, onSuccess) => {
    actionLoading.value = true;

    const successHandler = (res) => {
      actionLoading.value = false;
      snackbar.show(res?.message || "Referral campaign created successfully.", "success");
      fetchReferralLinks(ibId);
      if (onSuccess) onSuccess();
    };

    const failureHandler = (err) => {
      actionLoading.value = false;
      snackbar.show(err?.message || "Failed to create referral campaign.", "error");
    };

    apiRequest(urls.KEYS.POST, urls.referralLinks.create, {
      isTokenRequired: true,
      look_up_key: ibId,
      data: {
        name: payload.name,
        code: payload.code,
        description: payload.description,
        broker_group_config_ids: payload.broker_group_config_ids,
      },
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const updateReferralLink = (ibId, linkId, payload, onSuccess) => {
    actionLoading.value = true;

    const successHandler = (res) => {
      actionLoading.value = false;
      snackbar.show(res?.message || "Referral campaign updated successfully.", "success");
      fetchReferralLinks(ibId);
      if (onSuccess) onSuccess();
    };

    const failureHandler = (err) => {
      actionLoading.value = false;
      snackbar.show(err?.message || "Failed to update referral campaign.", "error");
    };

    apiRequest(urls.KEYS.PUT, urls.referralLinks.update, {
      isTokenRequired: true,
      look_up_key: linkId,
      data: {
        name: payload.name,
        description: payload.description,
        broker_group_config_ids: payload.broker_group_config_ids,
      },
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const fetchParentReferralLinks = () => {
    const successHandler = (res) => {
      parentRecords.value = res?.data || [];
    };

    apiRequest(urls.KEYS.GET, urls.referralLinks.list, {
      isTokenRequired: true,
      onSuccess: successHandler,
    });
  };

  return {
    records,
    parentRecords,
    loading,
    actionLoading,
    error,
    fetchReferralLinks,
    fetchParentReferralLinks,
    createReferralLink,
    updateReferralLink,
  };
});
