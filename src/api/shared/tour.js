import apiRequest from "@/api/request";
import urls from "@/api/urls";

/**
 * Update user tour completion status on backend (POST /set-tour)
 * Payload: { is_tour: true | false }
 * @param {boolean} isTour
 * @returns {Promise<any>}
 */
export const setUserTourApi = (isTour = true) => {
  return new Promise((resolve, reject) => {
    apiRequest(urls.KEYS.POST, urls.auth.setTour, {
      data: { is_tour: isTour },
      isTokenRequired: true,
      onSuccess: (res) => {
        console.log("[Tour API] Successfully set tour status:", res);
        resolve(res);
      },
      onFailure: (err) => {
        console.error("[Tour API] Failed to set user tour status:", err);
        reject(err);
      },
    });
  });
};

/**
 * Backward-compatible alias for setUserTourApi
 */
export const updateUserTourStatusApi = setUserTourApi;

export default {
  setUserTourApi,
  updateUserTourStatusApi,
};
