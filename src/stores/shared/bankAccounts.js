import { ref, computed } from "vue";
import { defineStore } from "pinia";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

// ─── Business Rules & Constants ────────────────────────
export const MAX_BANK_ACCOUNTS = 3;
export const MAX_PROOF_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_PROOF_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
  "doc",
  "docx",
];

export const useBankAccountsStore = defineStore("bankAccounts", () => {
  const snackbar = useSnackbarStore();

  // ─── State ───────────────────────────────────────────
  const bankAccounts = ref([]);
  const loading = ref(false);
  const isFetched = ref(false);
  const error = ref(null);
  const actionLoading = ref(false);
  const selectedAccountId = ref(null);

  // ─── Rules & Computed Getters ────────────────────────
  const accountCount = computed(() => bankAccounts.value?.length || 0);
  const isLimitReached = computed(() => accountCount.value >= MAX_BANK_ACCOUNTS);
  const canAddAccount = computed(() => accountCount.value < MAX_BANK_ACCOUNTS);
  const defaultAccount = computed(
    () =>
      bankAccounts.value.find((acc) => acc.is_default) ||
      bankAccounts.value[0] ||
      null
  );

  // ─── Error Message Extraction Rule ───────────────────
  const extractErrorMessage = (err, defaultMsg = "An error occurred.") => {
    if (!err) return defaultMsg;
    if (typeof err === "string") return err;
    if (typeof err.message === "string") return err.message;
    if (err.message && typeof err.message === "object") {
      const firstKey = Object.keys(err.message)[0];
      const firstErr = Array.isArray(err.message[firstKey])
        ? err.message[firstKey][0]
        : err.message[firstKey];
      if (typeof firstErr === "string") return `${firstKey}: ${firstErr}`;
    }
    if (err.errors && typeof err.errors === "object") {
      const firstKey = Object.keys(err.errors)[0];
      const firstErr = Array.isArray(err.errors[firstKey])
        ? err.errors[firstKey][0]
        : err.errors[firstKey];
      if (typeof firstErr === "string") return `${firstKey}: ${firstErr}`;
    }
    if (typeof err.error === "string") return err.error;
    return defaultMsg;
  };

  // ─── Fetch Bank Accounts ─────────────────────────────
  const fetchBankAccounts = (force = false, options = {}) => {
    if (isFetched.value && !force) {
      if (options.onSuccess) options.onSuccess(bankAccounts.value);
      return Promise.resolve(bankAccounts.value);
    }

    loading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        const list = res?.data || [];
        bankAccounts.value = list;
        loading.value = false;
        isFetched.value = true;

        if (options.onSuccess) {
          options.onSuccess(list);
        }
        resolve(list);
      };

      const failureHandler = (err) => {
        loading.value = false;
        error.value = err;
        const msg = err?.message || "Failed to fetch bank accounts.";

        if (options.onFailure) {
          options.onFailure(err);
        } else {
          snackbar.show(msg, "error");
        }
        reject(err);
      };

      apiRequest(urls.KEYS.GET, urls.bankAccounts.list, {
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  };

  // ─── Get Single Bank Account Detail ──────────────────
  const getBankAccountDetail = (id, options = {}) => {
    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        const data = res?.data || res;
        if (options.onSuccess) {
          options.onSuccess(data);
        }
        resolve(data);
      };

      const failureHandler = (err) => {
        const msg = err?.message || "Failed to fetch bank account details.";
        if (options.onFailure) {
          options.onFailure(err);
        } else {
          snackbar.show(msg, "error");
        }
        reject(err);
      };

      apiRequest(urls.KEYS.GET, urls.bankAccounts.detail, {
        look_up_key: id,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  };

  // ─── Create Bank Account ─────────────────────────────
  const createBankAccount = (payload, options = {}) => {
    // Business Rule Check: 3 max account limit
    if (isLimitReached.value) {
      const limitMsg = `Maximum limit of ${MAX_BANK_ACCOUNTS} active bank accounts reached.`;
      snackbar.show(limitMsg, "error");
      if (options.onFailure) options.onFailure(new Error(limitMsg));
      return Promise.reject(new Error(limitMsg));
    }

    actionLoading.value = true;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        actionLoading.value = false;
        const successMsg = res?.message || "Bank account saved successfully!";
        snackbar.show(successMsg, "success");

        fetchBankAccounts(true);

        if (options.onSuccess) {
          options.onSuccess(res);
        }
        resolve(res);
      };

      const failureHandler = (err) => {
        actionLoading.value = false;
        let msg = extractErrorMessage(err, "Failed to create bank account.");

        // Rule-specific error codes
        if (err?.code === "limit_reached") {
          msg = `Maximum limit of ${MAX_BANK_ACCOUNTS} active bank accounts reached.`;
        } else if (err?.code === "proof_required") {
          msg = "Document proof file (cancelled cheque / bank statement) is required.";
        }

        snackbar.show(msg, "error");

        if (options.onFailure) {
          options.onFailure(err);
        }
        reject(err);
      };

      apiRequest(urls.KEYS.POST, urls.bankAccounts.create, {
        data: payload,
        formData: payload instanceof FormData,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  };

  // ─── Update Bank Account ─────────────────────────────
  const updateBankAccount = (id, payload, options = {}) => {
    actionLoading.value = true;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        actionLoading.value = false;
        const successMsg = res?.message || "Bank account updated successfully!";
        snackbar.show(successMsg, "success");

        fetchBankAccounts(true);

        if (options.onSuccess) {
          options.onSuccess(res);
        }
        resolve(res);
      };

      const failureHandler = (err) => {
        actionLoading.value = false;
        let msg = extractErrorMessage(err, "Failed to update bank account.");

        // Rule-specific error codes
        if (err?.code === "edit_not_allowed" || err?.status === 403) {
          msg = "Contact support to update this bank account.";
        } else if (err?.code === "proof_required") {
          msg = "Document proof file is required on update.";
        }

        snackbar.show(msg, "error");

        if (options.onFailure) {
          options.onFailure(err);
        }
        reject(err);
      };

      apiRequest(urls.KEYS.PUT, urls.bankAccounts.update, {
        look_up_key: id,
        data: payload,
        formData: payload instanceof FormData,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  };

  // ─── Delete Bank Account ─────────────────────────────
  const deleteBankAccount = (id, options = {}) => {
    actionLoading.value = true;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        actionLoading.value = false;
        const successMsg = res?.message || "Bank account deleted successfully!";
        snackbar.show(successMsg, "success");

        fetchBankAccounts(true);

        if (options.onSuccess) {
          options.onSuccess(res);
        }
        resolve(res);
      };

      const failureHandler = (err) => {
        actionLoading.value = false;
        let msg =
          err?.code === "edit_not_allowed" || err?.status === 403
            ? "Contact support to delete this bank account."
            : err?.message || "Failed to delete bank account.";

        snackbar.show(msg, "error");

        if (options.onFailure) {
          options.onFailure(err);
        }
        reject(err);
      };

      apiRequest(urls.KEYS.DELETE, urls.bankAccounts.delete, {
        look_up_key: id,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  };

  // ─── Set Default Bank Account ────────────────────────
  const setDefaultBankAccount = (id, options = {}) => {
    actionLoading.value = true;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        actionLoading.value = false;
        const successMsg =
          res?.message || "Default bank account set successfully!";
        snackbar.show(successMsg, "success");

        fetchBankAccounts(true);

        if (options.onSuccess) {
          options.onSuccess(res);
        }
        resolve(res);
      };

      const failureHandler = (err) => {
        actionLoading.value = false;
        const msg =
          err?.code === "edit_not_allowed" || err?.status === 403
            ? "Contact support to set default bank account."
            : err?.message || "Failed to set default bank account.";

        snackbar.show(msg, "error");

        if (options.onFailure) {
          options.onFailure(err);
        }
        reject(err);
      };

      apiRequest(
        urls.KEYS.POST,
        `${urls.bankAccounts.setDefault}/${id}/set-default`,
        {
          isTokenRequired: true,
          onSuccess: successHandler,
          onFailure: failureHandler,
        }
      );
    });
  };

  // ─── Reset Store State ───────────────────────────────
  const reset = () => {
    bankAccounts.value = [];
    loading.value = false;
    isFetched.value = false;
    error.value = null;
    actionLoading.value = false;
    selectedAccountId.value = null;
  };

  return {
    // State
    bankAccounts,
    loading,
    isFetched,
    error,
    actionLoading,
    selectedAccountId,

    // Rules & Getters
    accountCount,
    isLimitReached,
    canAddAccount,
    defaultAccount,
    maxLimit: MAX_BANK_ACCOUNTS,

    // Handlers & Methods
    fetchBankAccounts,
    getBankAccountDetail,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    setDefaultBankAccount,
    extractErrorMessage,
    reset,
  };
});

export default useBankAccountsStore;
