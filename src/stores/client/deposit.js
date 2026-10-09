import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import QRCode from "qrcode";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import { buildAccountOption, convertPaymentAmount, formatPaymentAmount } from "@/utils/formatters";

export const useDepositStore = defineStore("deposit", () => {
  const snackbar = useSnackbarStore();
  const accountsStore = useTradingAccountsStore();

  // Current Step: 1, 2, 3
  const currentStep = ref(1);

  // Step 1 State
  const selectedAccountId = ref(null);
  const selectedPaymentMethodId = ref(null);

  // Step 2 State
  const dynamicFormValues = ref({});
  const selectedCryptoMethod = ref(null); // Selected token/network in crypto flow
  const isSubmitting = ref(false);

  // Step 3 State
  const depositResponse = ref(null);
  const qrCodeUrl = ref("");

  // Paymaxis SDK State
  const isPaymaxisSdk = ref(false);
  const paymaxisPaymentId = ref(null);

  // Account search options
  const searchAccountsOptions = ref([]);
  const isAccountsSearching = ref(false);

  // Payment Methods
  const paymentMethods = computed(() => accountsStore.paymentMethods || []);
  const isPaymentMethodsLoading = computed(
    () => accountsStore.isPaymentMethodsLoading
  );

  // Account Options
  const accountOptions = computed(() => {
    const baseOptions = searchAccountsOptions.value.length > 0
      ? searchAccountsOptions.value
      : (accountsStore.data || []).map(buildAccountOption).filter(Boolean);
      
    // Inject Demo accounts from the global store because the search API omits them
    const allStoreOptions = (accountsStore.data || []).map(buildAccountOption).filter(Boolean);
    const missingDemos = allStoreOptions.filter(opt => {
      const acc = opt.raw || {};
      return acc.account_type === 'demo' && !baseOptions.some(b => String(b.value) === String(opt.value));
    });

    return [...baseOptions, ...missingDemos];
  });

  // Selected Account Object
  const selectedAccount = computed(() => {
    if (!selectedAccountId.value) return null;
    const foundOpt = accountOptions.value.find(
      (opt) => String(opt.value) === String(selectedAccountId.value)
    );
    if (foundOpt?.raw) return foundOpt.raw;
    return (
      (accountsStore.data || []).find(
        (acc) => String(acc.id) === String(selectedAccountId.value)
      ) || null
    );
  });

  // Is Selected Account a Demo Account
  const isDemo = computed(() => {
    const acc = selectedAccount.value;
    if (!acc) return false;
    return acc.account_type === "demo";
  });

  // Selected Payment Method Object
  const selectedPaymentMethod = computed(() => {
    if (isDemo.value || !selectedPaymentMethodId.value) return null;
    return (
      paymentMethods.value.find(
        (m) => String(m.id) === String(selectedPaymentMethodId.value)
      ) || null
    );
  });

  // Method Type: 'crypto' | 'bank' | 'upi' | etc.
  const isCryptoMethod = computed(() => {
    if (isDemo.value) return false;
    return selectedPaymentMethod.value?.method_type === "crypto";
  });

  // Bank Transfer method detection and details
  const isBankTransferMethod = computed(() => {
    if (isDemo.value) return false;
    return (
      selectedPaymentMethod.value?.method_type === "bank_transfer" ||
      selectedPaymentMethod.value?.gateway === "bank_transfer"
    );
  });

  const bankTransferDetails = computed(() => {
    if (!isBankTransferMethod.value) return null;
    let show = selectedPaymentMethod.value?.show_user;
    if (typeof show === "string") {
      try {
        show = JSON.parse(show);
      } catch (e) {
        show = null;
      }
    }
    return show || null;
  });

  // Conversion Info from backend
  const conversionInfo = computed(() => {
    if (isDemo.value) return null;
    return selectedPaymentMethod.value?.conversion_rate || null;
  });

  // Currency label (e.g. INR, USD)
  const paymentCurrency = computed(() => {
    if (isDemo.value) return "USD";
    return conversionInfo.value?.payment_currency || "USD";
  });

  // Dynamic Fields from selected payment method meta_data
  const dynamicFields = computed(() => {
    if (isDemo.value) {
      return [
        {
          key: "amount",
          label: "Deposit Amount",
          placeholder: "Enter amount to deposit",
          required: true,
          type: "number",
        },
      ];
    }

    let meta = selectedPaymentMethod.value?.meta_data;
    if (typeof meta === "string") {
      try {
        meta = JSON.parse(meta);
      } catch (e) {
        meta = null;
      }
    }

    return meta?.fields || [];
  });

  // Crypto Token / Network Options
  const cryptoOptions = computed(() => {
    if (!isCryptoMethod.value) return [];
    const fields = selectedPaymentMethod.value?.meta_data?.fields || [];
    const tokenField = fields.find((f) => Array.isArray(f.options_by));
    if (tokenField && tokenField.options_by?.length) {
      return tokenField.options_by;
    }
    const optField = fields.find((f) => Array.isArray(f.options));
    if (optField && optField.options?.length) {
      return optField.options;
    }
    return [];
  });

  // Calculated USD amount for display
  const convertedUsd = computed(() => {
    if (isDemo.value) return null;
    const amountVal = dynamicFormValues.value.amount;
    if (!amountVal || !conversionInfo.value) return null;
    const num = Number(amountVal);
    if (isNaN(num) || num <= 0) return null;

    if (Number(conversionInfo.value.units_per_usd) > 0) {
      return (num / Number(conversionInfo.value.units_per_usd)).toFixed(2);
    } else if (Number(conversionInfo.value.rate_to_usd) > 0) {
      return (num * Number(conversionInfo.value.rate_to_usd)).toFixed(2);
    }
    return num.toFixed(2);
  });

  // Converted Min & Max limits in paymentCurrency
  const minDepositAmount = computed(() => {
    if (!selectedPaymentMethod.value?.minimum_deposit_amount) return 0;
    return convertPaymentAmount(
      selectedPaymentMethod.value.minimum_deposit_amount,
      conversionInfo.value
    );
  });

  const maxDepositAmount = computed(() => {
    if (!selectedPaymentMethod.value?.maximum_deposit_amount) return 0;
    return convertPaymentAmount(
      selectedPaymentMethod.value.maximum_deposit_amount,
      conversionInfo.value
    );
  });

  // Actions
  function fetchAccounts(query = "") {
    isAccountsSearching.value = true;
    apiRequest(urls.KEYS.GET, urls.tradingAccounts.searchAccounts, {
      params: { q: query },
      isTokenRequired: true,
      onSuccess: (res) => {
        const raw = res?.data?.accounts || [];
        searchAccountsOptions.value = raw
          .map(buildAccountOption)
          .filter(Boolean);
        isAccountsSearching.value = false;
      },
      onFailure: () => {
        isAccountsSearching.value = false;
      },
    });
  }

  function fetchPaymentMethods() {
    accountsStore.fetchPaymentMethods("deposit");
  }

  function initDefaultFields() {
    const initVals = {};
    dynamicFields.value.forEach((field) => {
      initVals[field.key] =
        dynamicFormValues.value[field.key] ?? (field.type === "file" ? null : "");
    });
    dynamicFormValues.value = initVals;

    if (cryptoOptions.value.length > 0 && !selectedCryptoMethod.value) {
      selectedCryptoMethod.value = cryptoOptions.value[0];
    }
  }

  function resetFlow() {
    currentStep.value = 1;
    selectedAccountId.value = null;
    selectedPaymentMethodId.value = null;
    dynamicFormValues.value = {};
    selectedCryptoMethod.value = null;
    depositResponse.value = null;
    qrCodeUrl.value = "";
    isPaymaxisSdk.value = false;
    paymaxisPaymentId.value = null;
  }

  function clearDynamicForm() {
    dynamicFormValues.value = {};
    selectedCryptoMethod.value = null;
  }

  // When returning to Step 1 or changing account/payment method, clear uploaded documents & dynamic form
  watch(currentStep, (newStep) => {
    if (newStep === 1) {
      clearDynamicForm();
    }
  });

  watch([selectedAccountId, selectedPaymentMethodId], () => {
    clearDynamicForm();
  });

  // Submit Step 1
  function proceedToStep2() {
    if (!selectedAccountId.value) {
      snackbar.show("Please select a trading account.", "error");
      return false;
    }
    if (!isDemo.value && !selectedPaymentMethodId.value) {
      snackbar.show("Please select a payment method.", "error");
      return false;
    }
    initDefaultFields();
    currentStep.value = 2;
    return true;
  }

  // Submit Step 2 - Crypto Flow
  async function submitCryptoDeposit() {
    if (!selectedCryptoMethod.value) {
      snackbar.show("Please select a crypto network / token.", "error");
      return;
    }

    isSubmitting.value = true;
    const tokenIdentifier =
      selectedCryptoMethod.value.alias ||
      selectedCryptoMethod.value.coin ||
      selectedCryptoMethod.value.name;

    const payload = {
      trading_account_id: selectedAccountId.value,
      payment_method_id: selectedPaymentMethodId.value,
      network: selectedCryptoMethod.value.network,
      token: tokenIdentifier,
      success_url: `${window.location.origin}/deposit-funds?deposit_status=success`,
      cancel_url: `${window.location.origin}/deposit-funds?deposit_status=cancelled`,
      failed_url: `${window.location.origin}/deposit-funds?deposit_status=failed`,
    };

    apiRequest(urls.KEYS.POST, urls.tradingAccounts.deposit, {
      data: payload,
      isTokenRequired: true,
      onSuccess: async (res) => {
        isSubmitting.value = false;
        const resData = res?.data;
        if (!resData?.address) {
          snackbar.show("Deposit address was not returned.", "error");
          return;
        }
        depositResponse.value = {
          ...resData,
          network: selectedCryptoMethod.value.network,
          token:
            selectedCryptoMethod.value.name ||
            selectedCryptoMethod.value.alias ||
            selectedCryptoMethod.value.coin,
        };

        try {
          qrCodeUrl.value = await QRCode.toDataURL(resData.address, {
            width: 180,
            margin: 1,
          });
        } catch (e) {
          console.error("QR Code generation error:", e);
        }

        currentStep.value = 3;
      },
      onFailure: (err) => {
        isSubmitting.value = false;
        snackbar.show(
          err?.message || err?.error || "Failed to generate deposit address.",
          "error"
        );
      },
    });
  }

  // Submit Step 2 - Bank Transfer Flow
  function submitBankTransferDeposit() {
    const rawAmt =
      dynamicFormValues.value?.amount ??
      dynamicFormValues.amount;
    const amount = Number(rawAmt || 0);

    const minAmount = minDepositAmount.value;
    const maxAmount = maxDepositAmount.value;
    if (!amount || amount <= 0) {
      snackbar.show("Please enter a valid deposit amount.", "error");
      return;
    }
    if (minAmount > 0 && amount < minAmount) {
      const formattedMin = formatPaymentAmount(
        selectedPaymentMethod.value?.minimum_deposit_amount,
        conversionInfo.value
      );
      snackbar.show(
        `Minimum deposit amount is ${formattedMin} ${paymentCurrency.value}.`,
        "error"
      );
      return;
    }
    if (maxAmount > 0 && amount > maxAmount) {
      const formattedMax = formatPaymentAmount(
        selectedPaymentMethod.value?.maximum_deposit_amount,
        conversionInfo.value
      );
      snackbar.show(
        `Maximum deposit amount is ${formattedMax} ${paymentCurrency.value}.`,
        "error"
      );
      return;
    }

    // Validate Required Dynamic Fields (including files)
    for (const field of dynamicFields.value) {
      if (field.required) {
        const val = dynamicFormValues.value?.[field.key];
        const isFile = field.type === "file";
        const isValEmpty = isFile
          ? !val || (typeof val === "string" && !val.trim())
          : (val === undefined || val === null || String(val).trim() === "");
        if (isValEmpty) {
          snackbar.show(
            isFile
              ? `Please upload ${field.label || "attachment"}.`
              : `Please provide ${field.label || field.key}.`,
            "error"
          );
          return;
        }
      }
    }

    const utrVal =
      dynamicFormValues.value?.utr ??
      dynamicFormValues.utr ??
      dynamicFormValues.value?.url ??
      dynamicFormValues.url ??
      dynamicFormValues.value?.UTR ??
      dynamicFormValues.UTR ??
      dynamicFormValues.value?.reference_id ??
      dynamicFormValues.reference_id ??
      dynamicFormValues.value?.utr_number ??
      dynamicFormValues.utr_number ??
      "";
    const utr = String(utrVal || "").trim();

    const hasUtrField = dynamicFields.value.some(
      (f) =>
        f.key === "utr" ||
        f.key === "url" ||
        f.label?.toLowerCase().includes("utr") ||
        f.label?.toLowerCase().includes("reference")
    );

    if (hasUtrField && !utr) {
      snackbar.show("Please provide UTR/Reference ID.", "error");
      return;
    }

    isSubmitting.value = true;

    const payload = {
      trading_account_id: Number(selectedAccountId.value) || selectedAccountId.value,
      payment_method_id: Number(selectedPaymentMethodId.value) || selectedPaymentMethodId.value,
      amount: amount,
      ...dynamicFormValues.value,
    };

    if (utr) {
      payload.utr = utr;
      if (dynamicFields.value.some((f) => f.key === "url")) {
        payload.url = utr;
      }
    }

    // Remove empty undefined/null keys but keep Files and valid values
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined || payload[k] === null || payload[k] === "") {
        delete payload[k];
      }
    });

    apiRequest(urls.KEYS.POST, urls.wallet.createBankTransferDeposit, {
      formData: payload,
      isTokenRequired: true,
      onSuccess: (res) => {
        isSubmitting.value = false;
        snackbar.show(
          res?.message || "Bank transfer deposit request submitted successfully!",
          "success"
        );
        depositResponse.value = res?.data;
        currentStep.value = 3;
        accountsStore.fetchAccounts();
      },
      onFailure: (err) => {
        isSubmitting.value = false;
        snackbar.show(
          err?.message || err?.error || "Failed to submit bank transfer deposit.",
          "error"
        );
      },
    });
  }

  // Submit Step 2 - Dynamic Gateway (Paymaxis, Bank, UPI)
  function submitDynamicDeposit(userData = {}) {
    if (isBankTransferMethod.value) {
      return submitBankTransferDeposit();
    }

    const fields = dynamicFields.value;

    // Validate Required Fields
    for (const field of fields) {
      if (field.required) {
        const val = dynamicFormValues.value[field.key];
        const isFile = field.type === "file";
        const isValEmpty = isFile
          ? !val || (typeof val === "string" && !val.trim())
          : (val === undefined || val === null || String(val).trim() === "");
        if (isValEmpty) {
          snackbar.show(
            isFile
              ? `Please upload ${field.label || "attachment"}.`
              : `Please provide ${field.label || field.key}.`,
            "error"
          );
          return;
        }
      }
    }

    const amount = Number(dynamicFormValues.value.amount || 0);
    const minAmount = minDepositAmount.value;
    const maxAmount = maxDepositAmount.value;
    if (minAmount > 0 && amount < minAmount) {
      const formattedMin = formatPaymentAmount(
        selectedPaymentMethod.value?.minimum_deposit_amount,
        conversionInfo.value
      );
      snackbar.show(`Minimum deposit amount is ${formattedMin} ${paymentCurrency.value}.`, "error");
      return;
    }
    if (maxAmount > 0 && amount > maxAmount) {
      const formattedMax = formatPaymentAmount(
        selectedPaymentMethod.value?.maximum_deposit_amount,
        conversionInfo.value
      );
      snackbar.show(`Maximum deposit amount is ${formattedMax} ${paymentCurrency.value}.`, "error");
      return;
    }

    isSubmitting.value = true;

    const payload = {
      trading_account_id: selectedAccountId.value,
      payment_method_id: selectedPaymentMethodId.value,
      payment_method_code: selectedPaymentMethod.value?.payment_method_code || "BASIC_CARD",
      currency: paymentCurrency.value,
      amount: amount,
      return_url: `${window.location.origin}/deposit-funds?deposit_status=success`,
      first_name: userData.first_name || "Client",
      last_name: userData.last_name || "User",
      email: userData.email || "user@example.com",
      phone: userData.phone || undefined,
      ...dynamicFormValues.value,
    };

    // Remove empty undefined/null keys
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined || payload[k] === null || payload[k] === "") {
        delete payload[k];
      }
    });

    const hasFile = Object.values(payload).some(
      (v) => typeof File !== "undefined" && v instanceof File
    );

    const endpoint =
      selectedPaymentMethod.value?.gateway === "paymaxis"
        ? urls.wallet.createPaymaxisDeposit || urls.tradingAccounts.deposit
        : urls.tradingAccounts.deposit || urls.funds.deposit;

    apiRequest(urls.KEYS.POST, endpoint, {
      data: payload,
      formData: hasFile ? payload : null,
      isTokenRequired: true,
      onSuccess: (res) => {
        isSubmitting.value = false;
        const resData = res?.data;
        const redirectUrl =
          resData?.redirect_url ||
          resData?.url ||
          res?.redirect_url ||
          res?.url;
        const paymentId =
          resData?.gateway_payment_id ||
          resData?.session_id ||
          resData?.payment_id;

        if (redirectUrl) {
          snackbar.show("Redirecting to payment gateway...", "success");
          const newWindow = window.open(redirectUrl, "_blank");
          if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
            window.location.href = redirectUrl;
          }
        } else if (
          paymentId &&
          (selectedPaymentMethod.value?.payment_method_code === "BASIC_CARD" ||
            selectedPaymentMethod.value?.payment_method_code === "CARD")
        ) {
          isPaymaxisSdk.value = true;
          paymaxisPaymentId.value = String(paymentId);
        } else {
          snackbar.show(res?.message || "Deposit request submitted successfully.", "success");
          resetFlow();
        }
      },
      onFailure: (err) => {
        isSubmitting.value = false;
        snackbar.show(
          err?.message || err?.error || "Failed to initiate deposit.",
          "error"
        );
      },
    });
  }

  // Submit Step 2 - Demo Deposit
  function submitDemoDeposit() {
    const amt = Number(dynamicFormValues.value.amount || 0);
    if (!amt || amt <= 0) {
      snackbar.show("Please enter a valid deposit amount.", "error");
      return;
    }

    isSubmitting.value = true;

    const successHandler = (res) => {
      isSubmitting.value = false;
      snackbar.show(
        res?.message || "Demo funds deposited successfully!",
        "success"
      );
      accountsStore.fetchAccounts();
      resetFlow();
    };

    const failureHandler = (err) => {
      isSubmitting.value = false;
      snackbar.show(
        err?.message || err?.error || "Demo deposit failed.",
        "error"
      );
    };

    apiRequest(urls.KEYS.POST, urls.tradingAccounts.demoDeposit, {
      data: {
        trading_account_id: selectedAccountId.value,
        amount: amt,
      },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  }

  return {
    currentStep,
    selectedAccountId,
    selectedPaymentMethodId,
    dynamicFormValues,
    selectedCryptoMethod,
    isSubmitting,
    depositResponse,
    qrCodeUrl,
    isPaymaxisSdk,
    paymaxisPaymentId,
    searchAccountsOptions,
    isAccountsSearching,
    paymentMethods,
    isPaymentMethodsLoading,
    accountOptions,
    selectedAccount,
    isDemo,
    selectedPaymentMethod,
    isCryptoMethod,
    isBankTransferMethod,
    bankTransferDetails,
    conversionInfo,
    paymentCurrency,
    dynamicFields,
    cryptoOptions,
    convertedUsd,
    minDepositAmount,
    maxDepositAmount,
    fetchAccounts,
    fetchPaymentMethods,
    initDefaultFields,
    clearDynamicForm,
    resetFlow,
    proceedToStep2,
    submitCryptoDeposit,
    submitBankTransferDeposit,
    submitDynamicDeposit,
    submitDemoDeposit,
  };
});
