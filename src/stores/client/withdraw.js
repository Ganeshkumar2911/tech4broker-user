import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useTradingAccountsStore } from "@/stores/client/tradingAccounts";
import { useIBDashboard } from "@/stores/ib/dashboard";
import { useIbWalletStore } from "@/stores/ib/wallet";
import { useFmWalletStore } from "@/stores/fm/yourWallet";
import { useProfileStore } from "@/stores/shared/profile";
import { buildAccountOption, convertPaymentAmount, formatPaymentAmount } from "@/utils/formatters";

export const useWithdrawStore = defineStore("withdraw", () => {
  // Store dependencies
  const snackbar = useSnackbarStore();
  const accountsStore = useTradingAccountsStore();
  const ibDashboardStore = useIBDashboard();
  const ibWalletStore = useIbWalletStore();
  const fmWalletStore = useFmWalletStore();
  const profileStore = useProfileStore();

  // -------------------------------------------------------------
  // 1. Role & Mode Detection
  // -------------------------------------------------------------
  const isIbMode = computed(() => {
    return profileStore.activeRole === "ib";
  });

  const isFmMode = computed(() => {
    return profileStore.activeRole === "fm";
  });

  // Source Type: 'wallet' | 'account'
  // - IB: Wallet only
  // - FM: Wallet or Trading Account (controlled by UI tab/selector)
  // - Client: Trading Account only
  const sourceType = ref(
    isIbMode.value ? "wallet" : isFmMode.value ? "wallet" : "account"
  );

  watch(isIbMode, (newIb) => {
    if (newIb) {
      sourceType.value = "wallet";
    } else if (!isFmMode.value) {
      sourceType.value = "account";
    }
  });

  watch(isFmMode, (newFm) => {
    if (newFm) {
      sourceType.value = "wallet";
    } else if (!isIbMode.value) {
      sourceType.value = "account";
    }
  });

  const isWalletSource = computed(() => {
    if (isIbMode.value) return true;
    if (isFmMode.value) return sourceType.value === "wallet";
    return false;
  });

  // -------------------------------------------------------------
  // 2. Reactive State
  // -------------------------------------------------------------
  // Navigation: Step 1 (Select Account & Method) | Step 2 (Details & Execution)
  const currentStep = ref(1);

  // Step 1: Selection State
  const selectedAccountId = ref(null);
  const selectedPaymentMethodId = ref(null);

  // Step 2: Form Inputs State
  const amount = ref("");
  const walletAddress = ref("");
  const selectedCryptoMethod = ref(null);
  const dynamicFormValues = ref({});
  const isSubmitting = ref(false);

  // Bank Account State (for saved Bank Accounts)
  const userBankAccounts = ref([]);
  const selectedUserBankAccountId = ref(null);
  const isBankAccountsLoading = ref(false);

  // OTP Verification Modal State
  const showOtpModal = ref(false);
  const otpCode = ref("");
  const otpLoading = ref(false);
  const otpResendCountdown = ref(0);
  let resendTimer = null;

  // Account Search State
  const searchAccountsOptions = ref([]);
  const isAccountsSearching = ref(false);

  // Withdrawable Balance & Settlement Verification State
  const verifiedWithdrawableBalance = ref(null);
  const withdrawableDetails = ref(null);
  const isCheckingWithdrawable = ref(false);
  const isSettling = ref(false);
  const settlementRequired = ref(false);
  const settlementHint = ref(null);

  // -------------------------------------------------------------
  // 3. Computed Getters & Formatting
  // -------------------------------------------------------------
  const paymentMethods = computed(() => accountsStore.paymentMethods || []);
  const isPaymentMethodsLoading = computed(
    () => accountsStore.isPaymentMethodsLoading
  );

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

  // Detect Demo Account
  const isDemo = computed(() => {
    if (isWalletSource.value) return false;
    const acc = selectedAccount.value;
    if (!acc) return false;
    return acc.account_type === "demo";
  });

  // Detect Cent (USC) Trading Account
  const isCentAccount = computed(() => {
    if (isWalletSource.value) return false;
    const acc = selectedAccount.value;
    if (!acc) return false;
    const cur =
      acc.account?.currency || acc.account?.broker_currency || acc.currency || "";
    const accType =
      acc.account?.account_type || acc.account_type || acc.type || "";
    return (
      String(cur).toUpperCase() === "USC" ||
      String(accType).toLowerCase().includes("cent") ||
      String(acc.name || "").toLowerCase().includes("cent")
    );
  });

  // Account Currency Code (e.g., USC or USD)
  const accountCurrency = computed(() => {
    if (isWalletSource.value) return "USD";
    if (isCentAccount.value) return "USC";
    return (
      selectedAccount.value?.account?.currency ||
      selectedAccount.value?.account?.broker_currency ||
      selectedAccount.value?.currency ||
      "USD"
    );
  });

  const cleanNum = (val) => {
    if (val === undefined || val === null) return 0;
    const cleaned = String(val).replace(/,/g, "");
    const parsed = Number(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Withdrawable Available Balance
  const withdrawableBalance = computed(() => {
    if (isIbMode.value) {
      return cleanNum(ibWalletStore.summary?.wallet_balance);
    }
    if (isFmMode.value && sourceType.value === "wallet") {
      return cleanNum(fmWalletStore.summary?.wallet_balance);
    }
    // If verified by GET /client/accounts/withdrawable/<account_id>
    if (verifiedWithdrawableBalance.value !== null) {
      return cleanNum(verifiedWithdrawableBalance.value);
    }
    const acc = selectedAccount.value;
    if (!acc) return 0;
    const raw =
      acc.metrics?.balance !== undefined
        ? acc.metrics.balance
        : acc.balance !== undefined
        ? acc.balance
        : 0;
    return cleanNum(raw);
  });

  const selectedPaymentMethod = computed(() => {
    if (!selectedPaymentMethodId.value) return null;
    return (
      paymentMethods.value.find(
        (m) => String(m.id) === String(selectedPaymentMethodId.value)
      ) || null
    );
  });

  const isCryptoMethod = computed(() => {
    return (
      selectedPaymentMethod.value?.method_type === "crypto" ||
      selectedPaymentMethod.value?.gateway === "coinsbuy"
    );
  });

  const isBankTransferMethod = computed(() => {
    return selectedPaymentMethod.value?.method_type === "bank_transfer";
  });

  const conversionInfo = computed(() => {
    return selectedPaymentMethod.value?.conversion_rate || null;
  });

  const paymentCurrency = computed(() => {
    if (isCryptoMethod.value) {
      return accountCurrency.value;
    }
    return (
      conversionInfo.value?.payment_currency ||
      (isBankTransferMethod.value ? "INR" : "USD")
    );
  });

  // Crypto Token & Network Options
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

  // Dynamic Gateway Form Fields
  const dynamicFields = computed(() => {
    if (isCryptoMethod.value) return [];
    const fields = selectedPaymentMethod.value?.meta_data?.fields || [];
    return fields.filter(
      (f) => f.key !== "token" && f.key !== "network" && f.key !== "amount"
    );
  });

  // Converted USD Display (for cent accounts in crypto flow)
  const convertedUsd = computed(() => {
    if (isCryptoMethod.value) {
      if (isCentAccount.value && Number(amount.value) > 0) {
        return (Number(amount.value) / 100).toFixed(2);
      }
      return null;
    }
    return null;
  });

  // Effective Conversion Rate for Display
  const displayConversionRate = computed(() => {
    if (!conversionInfo.value) return "—";
    
    let rate = 0;
    if (Number(conversionInfo.value.units_per_usd) > 0) {
      rate = Number(conversionInfo.value.units_per_usd);
    } else if (Number(conversionInfo.value.rate_to_usd) > 0) {
      rate = 1 / Number(conversionInfo.value.rate_to_usd);
    }

    if (rate === 0) return "—";

    if (isCentAccount.value) {
      rate = rate / 100;
    }
    
    return rate;
  });

  // Converted Payment Currency Amount Display (Fiat / PayMaxis)
  const convertedPaymentAmount = computed(() => {
    if (isCryptoMethod.value) return null;
    if (!amount.value || !conversionInfo.value) return null;
    let num = Number(amount.value);
    if (isNaN(num) || num <= 0) return null;

    if (paymentCurrency.value === accountCurrency.value) return null;

    if (isCentAccount.value) {
      num = num / 100;
    }

    if (Number(conversionInfo.value.units_per_usd) > 0) {
      return (num * Number(conversionInfo.value.units_per_usd)).toFixed(2);
    } else if (Number(conversionInfo.value.rate_to_usd) > 0) {
      return (num / Number(conversionInfo.value.rate_to_usd)).toFixed(2);
    }
    return null;
  });

  // Amount in USD for Backend Payload
  const amountInUsd = computed(() => {
    const num = Number(amount.value || 0);
    if (isNaN(num) || num <= 0) return 0;

    if (isCentAccount.value) {
      return num / 100;
    }
    return num;
  });

  // Converted Min & Max limits in paymentCurrency
  const minWithdrawAmount = computed(() => {
    const raw =
      selectedPaymentMethod.value?.minimum_withdrawal_amount ||
      selectedPaymentMethod.value?.minimal_payout_amount ||
      0;
    return convertPaymentAmount(raw, conversionInfo.value);
  });

  const maxWithdrawAmount = computed(() => {
    const raw = selectedPaymentMethod.value?.maximum_withdrawal_amount || 0;
    return convertPaymentAmount(raw, conversionInfo.value);
  });

  // -------------------------------------------------------------
  // 4. Payload Builders
  // -------------------------------------------------------------
  const buildBasePayload = (usdAmount) => {
    return {
      ...(isWalletSource.value
        ? {}
        : { trading_account_id: selectedAccountId.value }),
      payment_method_id: selectedPaymentMethodId.value,
      amount: usdAmount,
    };
  };

  const buildCryptoPayload = (usdAmount, isFinalExecution = false) => {
    const tokenName =
      selectedCryptoMethod.value?.alias ||
      selectedCryptoMethod.value?.coin ||
      selectedCryptoMethod.value?.name ||
      "USDT";

    const paymentMethodCode =
      selectedPaymentMethod.value?.payment_method_code ||
      selectedCryptoMethod.value?.alias ||
      "USDT_TRC20";

    return {
      ...buildBasePayload(usdAmount),
      payment_method_code: paymentMethodCode,
      network: selectedCryptoMethod.value?.network,
      token: tokenName,
      wallet_address: walletAddress.value.trim(),
      ...(isFinalExecution ? { type: "withdrawal" } : {}),
    };
  };

  const buildBankTransferPayload = (usdAmount) => {
    const paymentMethodCode =
      selectedPaymentMethod.value?.payment_method_code || "bank_transfer";

    const bankDetails =
      userBankAccounts.value.length > 0
        ? { user_bank_account_id: selectedUserBankAccountId.value }
        : dynamicFormValues.value;

    return {
      ...buildBasePayload(usdAmount),
      payment_method_code: paymentMethodCode,
      currency: paymentCurrency.value,
      ...bankDetails,
    };
  };

  const buildPaymaxisPayload = (usdAmount, isFinalExecution = false) => {
    const paymentMethodCode =
      selectedPaymentMethod.value?.payment_method_code || "IMPS";

    return {
      ...buildBasePayload(usdAmount),
      payment_method_code: paymentMethodCode,
      currency: paymentCurrency.value,
      ...(isFinalExecution ? { type: "withdrawal" } : {}),
      ...dynamicFormValues.value,
    };
  };

  // -------------------------------------------------------------
  // 6. Post-Withdrawal Refresh Helper
  // -------------------------------------------------------------
  const refreshBalancesAfterWithdrawal = () => {
    if (isIbMode.value) {
      ibWalletStore.fetchWalletLedger(true);
    } else if (isFmMode.value && sourceType.value === "wallet") {
      fmWalletStore.fetchWallet(true);
    } else {
      accountsStore.fetchAccounts(true);
    }
  };

  // -------------------------------------------------------------
  // 7. Store Actions
  // -------------------------------------------------------------
  function fetchAccounts(query = "") {
    isAccountsSearching.value = true;

    const successHandler = (res) => {
      const raw = res?.data?.accounts || [];
      searchAccountsOptions.value = raw
        .map(buildAccountOption)
        .filter(Boolean);
      isAccountsSearching.value = false;
    };

    const failureHandler = () => {
      isAccountsSearching.value = false;
    };

    apiRequest(urls.KEYS.GET, urls.tradingAccounts.searchAccounts, {
      params: { q: query },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  }

  function fetchPaymentMethods() {
    if (isIbMode.value) {
      ibWalletStore.fetchWalletLedger();
    }
    if (isFmMode.value) {
      fmWalletStore.fetchWallet();
    }
    accountsStore.fetchPaymentMethods("withdrawal");
  }

  function fetchFmWallet(force = false) {
    return fmWalletStore.fetchWallet(force);
  }

  function fetchUserBankAccounts() {
    isBankAccountsLoading.value = true;

    const successHandler = (res) => {
      isBankAccountsLoading.value = false;
      const list = res?.data || [];
      userBankAccounts.value = list;
      if (list.length > 0) {
        const defaultAcc = list.find((a) => a.is_default) || list[0];
        selectedUserBankAccountId.value = defaultAcc?.id || null;
      } else {
        selectedUserBankAccountId.value = null;
      }
    };

    const failureHandler = (err) => {
      isBankAccountsLoading.value = false;
      userBankAccounts.value = [];
      selectedUserBankAccountId.value = null;
      snackbar.show(
        err?.message || err?.error || "Failed to fetch bank accounts.",
        "error"
      );
    };

    apiRequest(urls.KEYS.GET, urls.wallet.bankAccounts, {
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  }

  // Watch payment method selection to prefetch bank accounts if bank transfer
  watch(selectedPaymentMethodId, (newId) => {
    if (newId && isBankTransferMethod.value) {
      fetchUserBankAccounts();
    }
  });

  function initDefaultFields() {
    amount.value = "";
    walletAddress.value = "";
    otpCode.value = "";
    showOtpModal.value = false;

    const initVals = {};
    dynamicFields.value.forEach((field) => {
      initVals[field.key] = "";
    });
    dynamicFormValues.value = initVals;

    if (cryptoOptions.value.length > 0 && !selectedCryptoMethod.value) {
      selectedCryptoMethod.value = cryptoOptions.value[0];
    }
    if (userBankAccounts.value.length > 0 && !selectedUserBankAccountId.value) {
      const defaultAcc =
        userBankAccounts.value.find((a) => a.is_default) ||
        userBankAccounts.value[0];
      selectedUserBankAccountId.value = defaultAcc?.id || null;
    }
  }

  function resetFlow() {
    currentStep.value = 1;
    selectedAccountId.value = null;
    selectedPaymentMethodId.value = null;
    amount.value = "";
    walletAddress.value = "";
    selectedCryptoMethod.value = null;
    selectedUserBankAccountId.value = null;
    userBankAccounts.value = [];
    dynamicFormValues.value = {};
    showOtpModal.value = false;
    otpCode.value = "";
    stopResendTimer();

    verifiedWithdrawableBalance.value = null;
    withdrawableDetails.value = null;
    settlementRequired.value = false;
    settlementHint.value = null;
    isCheckingWithdrawable.value = false;
    isSettling.value = false;

    if (isIbMode.value || isFmMode.value) {
      sourceType.value = "wallet";
    } else {
      sourceType.value = "account";
    }
  }

  function startResendTimer() {
    stopResendTimer();
    otpResendCountdown.value = 60;
    resendTimer = setInterval(() => {
      if (otpResendCountdown.value > 0) {
        otpResendCountdown.value -= 1;
      } else {
        stopResendTimer();
      }
    }, 1000);
  }

  function stopResendTimer() {
    if (resendTimer) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }

  watch(selectedAccountId, () => {
    verifiedWithdrawableBalance.value = null;
    withdrawableDetails.value = null;
    settlementRequired.value = false;
    settlementHint.value = null;
  });

  function proceedToStep2() {
    if (!isWalletSource.value && !selectedAccountId.value) {
      snackbar.show("Please select a trading account.", "error");
      return false;
    }
    if (!isDemo.value && !selectedPaymentMethodId.value) {
      snackbar.show("Please select a withdrawal method.", "error");
      return false;
    }
    if (!isDemo.value && isBankTransferMethod.value) {
      fetchUserBankAccounts();
    }
    initDefaultFields();
    currentStep.value = 2;
    return true;
  }

  // -------------------------------------------------------------
  // 8. Withdrawal Flow Execution: Step A (Request OTP)
  // -------------------------------------------------------------
  function requestWithdrawalOtp() {
    const amtNum = Number(amount.value || 0);
    if (!amtNum || amtNum <= 0) {
      snackbar.show("Please enter a valid withdrawal amount.", "error");
      return;
    }

    const usdAmount = parseFloat(amountInUsd.value.toFixed(2));

    if (usdAmount > withdrawableBalance.value) {
      snackbar.show(
        `Amount exceeds your available balance (${withdrawableBalance.value} ${accountCurrency.value}).`,
        "error"
      );
      return;
    }

    // Validation per payment method
    if (isCryptoMethod.value) {
      if (!selectedCryptoMethod.value) {
        snackbar.show("Please select a crypto token / network.", "error");
        return;
      }
      if (!walletAddress.value || !walletAddress.value.trim()) {
        snackbar.show("Please enter your destination wallet address.", "error");
        return;
      }
    } else if (isBankTransferMethod.value) {
      if (userBankAccounts.value.length > 0) {
        if (!selectedUserBankAccountId.value) {
          snackbar.show("Please select a bank account.", "error");
          return;
        }
      } else {
        for (const field of dynamicFields.value) {
          if (field.required && field.key !== "amount") {
            const val = dynamicFormValues.value[field.key];
            if (val === undefined || val === null || String(val).trim() === "") {
              snackbar.show(`Please enter ${field.label || field.key}.`, "error");
              return;
            }
          }
        }
      }
    } else {
      for (const field of dynamicFields.value) {
        if (field.required && field.key !== "amount") {
          const val = dynamicFormValues.value[field.key];
          if (val === undefined || val === null || String(val).trim() === "") {
            snackbar.show(`Please enter ${field.label || field.key}.`, "error");
            return;
          }
        }
      }
    }

    isSubmitting.value = true;

    let payload;
    if (isCryptoMethod.value) {
      payload = buildCryptoPayload(usdAmount, false);
    } else if (isBankTransferMethod.value) {
      payload = buildBankTransferPayload(usdAmount);
    } else {
      payload = buildPaymaxisPayload(usdAmount, false);
    }

    const successHandler = (res) => {
      isSubmitting.value = false;
      showOtpModal.value = true;
      otpCode.value = "";
      startResendTimer();
      snackbar.show(
        res?.message || "OTP sent successfully to your registered email.",
        "success"
      );
    };

    const failureHandler = (err) => {
      isSubmitting.value = false;
      snackbar.show(
        err?.message || err?.error || "Failed to request withdrawal OTP.",
        "error"
      );
    };

    apiRequest(urls.KEYS.POST, urls.tradingAccounts.withdrawRequest, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  }

  // -------------------------------------------------------------
  // 9. Withdrawal Flow Execution: Step B (Verify OTP)
  // -------------------------------------------------------------
  function verifyOtpAndExecute() {
    const code = String(otpCode.value || "").trim();
    if (!code || code.length < 6) {
      snackbar.show("Please enter the 6-digit OTP code.", "error");
      return;
    }

    otpLoading.value = true;

    const successHandler = async () => {
      await executeFinalWithdrawal();
    };

    const failureHandler = (err) => {
      otpLoading.value = false;
      snackbar.show(
        err?.message || err?.error || "Invalid or expired OTP.",
        "error"
      );
    };

    apiRequest(urls.KEYS.PUT, urls.tradingAccounts.withdrawVerify, {
      data: { otp: code },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  }

  // -------------------------------------------------------------
  // 10. Withdrawal Flow Execution: Step C (Final Dispatch per method)
  // -------------------------------------------------------------
  function executeCryptoWithdrawal(usdAmount) {
    const payload = buildCryptoPayload(usdAmount, true);

    const successHandler = (res) => {
      otpLoading.value = false;
      showOtpModal.value = false;
      snackbar.show(
        res?.message || "Crypto withdrawal request submitted successfully!",
        "success"
      );
      refreshBalancesAfterWithdrawal();
      resetFlow();
    };

    const failureHandler = (err) => {
      otpLoading.value = false;
      snackbar.show(
        err?.message || err?.error || "Withdrawal execution failed.",
        "error"
      );
    };

    apiRequest(urls.KEYS.POST, urls.tradingAccounts.createCryptoWithdrawal, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  }

  function executeBankTransferWithdrawal(usdAmount) {
    const payload = buildBankTransferPayload(usdAmount);

    const successHandler = (res) => {
      otpLoading.value = false;
      showOtpModal.value = false;
      snackbar.show(
        res?.message || "Bank transfer withdrawal submitted successfully!",
        "success"
      );
      refreshBalancesAfterWithdrawal();
      resetFlow();
    };

    const failureHandler = (err) => {
      otpLoading.value = false;
      snackbar.show(
        err?.message || err?.error || "Bank transfer withdrawal failed.",
        "error"
      );
    };

    apiRequest(urls.KEYS.POST, urls.tradingAccounts.createBankTransferWithdrawal, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  }

  function executePaymaxisWithdrawal(usdAmount) {
    const payload = buildPaymaxisPayload(usdAmount, true);

    const successHandler = (res) => {
      otpLoading.value = false;
      showOtpModal.value = false;
      snackbar.show(
        res?.message || "Withdrawal request processed successfully!",
        "success"
      );
      refreshBalancesAfterWithdrawal();
      resetFlow();
    };

    const failureHandler = (err) => {
      otpLoading.value = false;
      snackbar.show(
        err?.message || err?.error || "Withdrawal execution failed.",
        "error"
      );
    };

    apiRequest(urls.KEYS.POST, urls.tradingAccounts.createPaymaxisWithdrawal, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  }

  function submitDemoWithdrawal() {
    const amt = Number(amount.value || 0);
    if (!amt || amt <= 0) {
      snackbar.show("Please enter a valid withdrawal amount.", "error");
      return;
    }

    if (amt > withdrawableBalance.value) {
      snackbar.show(
        `Amount exceeds your available balance (${withdrawableBalance.value} ${accountCurrency.value}).`,
        "error"
      );
      return;
    }

    isSubmitting.value = true;

    const successHandler = (res) => {
      isSubmitting.value = false;
      snackbar.show(
        res?.message || "Demo funds withdrawn successfully!",
        "success"
      );
      refreshBalancesAfterWithdrawal();
      resetFlow();
    };

    const failureHandler = (err) => {
      isSubmitting.value = false;
      snackbar.show(
        err?.message || err?.error || "Demo withdrawal failed.",
        "error"
      );
    };

    apiRequest(urls.KEYS.POST, urls.tradingAccounts.demoWithdraw, {
      data: {
        trading_account_id: selectedAccountId.value,
        amount: amt,
      },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  }

  // -------------------------------------------------------------
  // 11. Withdrawable Verification & Settlement
  // -------------------------------------------------------------
  function checkWithdrawable(accountId) {
    const id = accountId || selectedAccountId.value;
    if (!id) return Promise.resolve({ success: false });

    isCheckingWithdrawable.value = true;
    settlementRequired.value = false;
    settlementHint.value = null;

    return new Promise((resolve) => {
      const successHandler = (res) => {
        isCheckingWithdrawable.value = false;
        const info = res?.data || {};
        withdrawableDetails.value = info;
        const withBal =
          info.withdrawable !== undefined
            ? info.withdrawable
            : info.balance !== undefined
            ? info.balance
            : null;
        verifiedWithdrawableBalance.value = withBal;
        settlementRequired.value = false;
        resolve({ success: true, data: info });
      };

      const failureHandler = (err) => {
        isCheckingWithdrawable.value = false;
        const errData = err?.requires_settlement !== undefined ? err : (err?.response?.data || err);
        if (errData?.requires_settlement) {
          settlementRequired.value = true;
          settlementHint.value = errData?.settle_hint || null;
          resolve({
            success: false,
            requiresSettlement: true,
            message: errData?.message || "Settlement required before withdrawal. Run settlement for this account, then withdraw again.",
            hint: errData?.settle_hint || null,
          });
          return;
        }

        resolve({
          success: false,
          requiresSettlement: false,
          error: err,
        });
      };

      apiRequest(urls.KEYS.GET, urls.tradingAccounts.withdrawable, {
        look_up_key: id,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  }

  function runAccountSettlement(accountId, hint = null) {
    const targetAccountId =
      hint?.body?.trading_account_id || accountId || selectedAccountId.value;

    if (!targetAccountId) {
      return Promise.resolve({ success: false, message: "No trading account specified." });
    }

    isSettling.value = true;

    return new Promise((resolve) => {
      const successHandler = async (res) => {
        snackbar.show(
          res?.message || "Settlement executed successfully.",
          "success"
        );
        // Refresh account store so balances are fresh
        accountsStore.fetchAccounts(true);

        // Re-check withdrawable amount
        const checkRes = await checkWithdrawable(targetAccountId);
        isSettling.value = false;
        settlementRequired.value = false;
        resolve({
          success: true,
          message: res?.message,
          checkRes,
        });
      };

      const failureHandler = (err) => {
        isSettling.value = false;
        const msg = err?.message || err?.error || "Failed to execute settlement.";
        snackbar.show(msg, "error");
        resolve({
          success: false,
          error: err,
          message: msg,
        });
      };

      apiRequest(urls.KEYS.POST, urls.settlements.runSpecific, {
        data: { trading_account_id: targetAccountId },
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  }

  function executeFinalWithdrawal() {
    const usdAmount = parseFloat(amountInUsd.value.toFixed(2));

    if (isCryptoMethod.value) {
      executeCryptoWithdrawal(usdAmount);
    } else if (isBankTransferMethod.value) {
      executeBankTransferWithdrawal(usdAmount);
    } else {
      executePaymaxisWithdrawal(usdAmount);
    }
  }

  return {
    // Role & Source
    isIbMode,
    isFmMode,
    sourceType,
    isWalletSource,
    fmWalletStore,

    // Step State
    currentStep,
    selectedAccountId,
    selectedPaymentMethodId,

    // Form State
    amount,
    walletAddress,
    selectedCryptoMethod,
    dynamicFormValues,
    isSubmitting,

    // Bank Account State
    userBankAccounts,
    selectedUserBankAccountId,
    isBankAccountsLoading,

    // OTP State
    showOtpModal,
    otpCode,
    otpLoading,
    otpResendCountdown,

    // Search & Options
    searchAccountsOptions,
    isAccountsSearching,
    paymentMethods,
    isPaymentMethodsLoading,
    accountOptions,
    selectedAccount,
    isCentAccount,
    accountCurrency,
    withdrawableBalance,
    selectedPaymentMethod,
    isCryptoMethod,
    isBankTransferMethod,
    conversionInfo,
    displayConversionRate,
    paymentCurrency,
    cryptoOptions,
    dynamicFields,
    convertedUsd,
    convertedPaymentAmount,
    amountInUsd,
    minWithdrawAmount,
    maxWithdrawAmount,

    // Actions
    fetchAccounts,
    fetchPaymentMethods,
    fetchFmWallet,
    fetchUserBankAccounts,
    initDefaultFields,
    resetFlow,
    startResendTimer,
    stopResendTimer,
    proceedToStep2,
    requestWithdrawalOtp,
    verifyOtpAndExecute,
    executeFinalWithdrawal,
    executeCryptoWithdrawal,
    executeBankTransferWithdrawal,
    executePaymaxisWithdrawal,
    isDemo,
    submitDemoWithdrawal,

    // Withdrawable & Settlement
    verifiedWithdrawableBalance,
    withdrawableDetails,
    isCheckingWithdrawable,
    isSettling,
    settlementRequired,
    settlementHint,
    checkWithdrawable,
    runAccountSettlement,
  };
});
