// @/stores/client/loyalty.js

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useLoyaltyStore = defineStore("loyalty", () => {
  const snackbar = useSnackbarStore();

  // ─── Programs State ─────────────────────────────────────
  const programs = ref([]);
  const selectedProgramId = ref(null);
  const isProgramsLoading = ref(false);
  const isProgramsFetched = ref(false);
  const isEnrolling = ref(false);
  const isDeenrolling = ref(false);

  const selectedProgram = computed(() => {
    if (!programs.value.length) return null;
    if (!selectedProgramId.value) return programs.value[0];
    return (
      programs.value.find((p) => p.id === selectedProgramId.value) ||
      programs.value[0]
    );
  });

  // ─── KPI Summary State ──────────────────────────────────
  const summary = ref({
    enrolled: false,
    program_id: null,
    program_code: "",
    enrollment_id: null,
    wallet_id: null,
    trading_account_id: null,
    trading_account_ids: [],
    available_points: "0.00",
    lifetime_earned_points: "0.00",
    pending_redemption_points: "0.00",
    current_tier: {
      code: "BRONZE",
      name: "Bronze",
      point_multiplier: "1.0000",
      color: "#CD7F32",
    },
    cash_conversion_rate: "0.010000",
    cash_withdraw_enabled: false,
    allow_wallet_transfer: false,
    allow_general_wallet_transfer: false,
    min_redemption_points: "100.00",
    next_expiry_at: null,
    next_expiry_points: "0.00",
    points_on_hold: false,
  });
  const isSummaryLoading = ref(false);
  const isSummaryFetched = ref(false);
  const lastSummaryProgramId = ref(null);

  // ─── Tiers & Benefits Ladder State ──────────────────────
  const tiersData = ref({
    program_id: null,
    program_code: "",
    enrolled: false,
    enrollment_id: null,
    current_tier_id: null,
    current_tier: null,
    tiers: [],
  });
  const tiers = computed(() => tiersData.value?.tiers || []);
  const isTiersLoading = ref(false);
  const isTiersFetched = ref(false);
  const lastTiersProgramId = ref(null);

  // ─── Points Ledger State ────────────────────────────────
  const points = ref([]);
  const pointsPagination = ref({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 1,
    total_pages: 1,
    total_items: 0,
  });
  const isPointsLoading = ref(false);
  const isPointsFetched = ref(false);
  const lastPointsQueryKey = ref("");

  // ─── Cash Redeemable State ──────────────────────────────
  const redeemable = ref({
    enrolled: false,
    program_id: null,
    program_code: "",
    available_points: "0.00",
    min_redemption_points: "100.00",
    max_redeemable_points: "0.00",
    can_redeem: false,
    cash_conversion_rate: "0.010000",
    cash_withdraw_enabled: false,
    allow_wallet_transfer: false,
    allow_general_wallet_transfer: false,
    estimated_cash_usd: "0.000000",
    trading_account_id: null,
    preview_points: "0.00",
  });
  const isRedeemableLoading = ref(false);
  const isRedeemableFetched = ref(false);

  // ─── Instant Wallet Transfer State (Points -> Trading USD) ────
  const transfers = ref([]);
  const transfersPagination = ref({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 1,
    total_pages: 1,
    total_items: 0,
  });
  const isTransfersLoading = ref(false);
  const isTransfersFetched = ref(false);
  const isTransferLoading = ref(false);

  // ─── Payment Methods (Legacy Cash Redeem Options) ────────
  const paymentMethods = ref([]);
  const isPaymentMethodsLoading = ref(false);
  const isPaymentMethodsFetched = ref(false);

  // ─── Legacy Cash Withdrawals History State ──────────────
  const withdrawals = ref([]);
  const withdrawalsPagination = ref({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 1,
    total_pages: 1,
    total_items: 0,
  });
  const isWithdrawalsLoading = ref(false);
  const isWithdrawalsFetched = ref(false);
  const isWithdrawLoading = ref(false);

  // ─── Rewards Store Products State ───────────────────────
  const storeProducts = ref([]);
  const storeProductsPagination = ref({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
    total_pages: 1,
    total_items: 0,
    current_count: 0,
  });
  const isStoreProductsLoading = ref(false);
  const isStoreProductsFetched = ref(false);
  const lastStorePage = ref(1);
  const selectedProductDetail = ref(null);
  const isStoreProductDetailLoading = ref(false);
  const isStoreRedeemLoading = ref(false);

  // ─── Store Redemptions (Physical/Digital Orders) ─────────
  const storeRedemptions = ref([]);
  const storeRedemptionsPagination = ref({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 1,
    total_pages: 1,
    total_items: 0,
  });
  const isStoreRedemptionsLoading = ref(false);
  const isStoreRedemptionsFetched = ref(false);
  const lastStoreRedemptionsPage = ref(1);

  // General isFetched flag
  const isFetched = ref(false);

  // ─── Helper for Active Program ID ───────────────────────
  const getActiveProgramId = (overrideProgramId = null) => {
    if (overrideProgramId !== null && overrideProgramId !== undefined) {
      return overrideProgramId;
    }
    return selectedProgramId.value || summary.value.program_id || null;
  };

  // ─── C0. Fetch Programs List ────────────────────────────
  const fetchPrograms = (
    autoSelect = true,
    force = false,
    onComplete = null,
  ) => {
    if (typeof autoSelect === "function") {
      onComplete = autoSelect;
      autoSelect = true;
      force = false;
    } else if (typeof force === "function") {
      onComplete = force;
      force = false;
    }

    if (isProgramsFetched.value && !force) {
      if (onComplete) onComplete(programs.value);
      return;
    }

    isProgramsLoading.value = true;

    const successHandler = (res) => {
      const items = res?.data || [];
      programs.value = items;

      if (autoSelect && items.length > 0) {
        // Prefer enrolled program or current selection, otherwise first program
        if (!selectedProgramId.value) {
          const enrolledProg = items.find((p) => p.enrolled);
          selectedProgramId.value = enrolledProg
            ? enrolledProg.id
            : items[0].id;
        }
      }

      isProgramsFetched.value = true;
      isFetched.value = true;
      isProgramsLoading.value = false;
      if (onComplete) onComplete(items);
    };

    const failureHandler = (err) => {
      isProgramsLoading.value = false;
      snackbar.show(
        err?.message || "Failed to load loyalty programs.",
        "error",
      );
      if (onComplete) onComplete([]);
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.programs, {
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C0b. Join / Enroll in Program ──────────────────────
  const enrollInProgram = (payload, onSuccessCallback) => {
    isEnrolling.value = true;

    const successHandler = (res) => {
      isEnrolling.value = false;
      snackbar.show(
        res?.message || "Enrolled in loyalty program successfully!",
        "success",
      );
      if (onSuccessCallback) onSuccessCallback(res);
      // Refresh programs & summary with force = true
      fetchPrograms(false, true, () => {
        if (payload?.program_id) {
          selectedProgramId.value = payload.program_id;
        }
        fetchAllForSelectedProgram(true);
      });
    };

    const failureHandler = (err) => {
      isEnrolling.value = false;
      snackbar.show(err?.message || "Failed to enroll in program.", "error");
    };

    apiRequest(urls.KEYS.POST, urls.loyalty.enrollments, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C0c. Leave / De-enroll Program ─────────────────────
  const leaveProgram = (
    payloadOrProgramId,
    reason = "",
    onSuccessCallback = null,
  ) => {
    isDeenrolling.value = true;
    let payload = {};
    if (typeof payloadOrProgramId === "object" && payloadOrProgramId !== null) {
      payload = { ...payloadOrProgramId };
    } else if (payloadOrProgramId) {
      payload = { program_id: payloadOrProgramId, reason };
    } else if (selectedProgramId.value) {
      payload = { program_id: selectedProgramId.value, reason };
    }

    const successHandler = (res) => {
      isDeenrolling.value = false;
      snackbar.show(
        res?.message || "Left loyalty program successfully.",
        "success",
      );
      if (onSuccessCallback) onSuccessCallback(res);
      // Refresh programs & summary with force = true
      fetchPrograms(false, true, () => {
        fetchAllForSelectedProgram(true);
      });
    };

    const failureHandler = (err) => {
      isDeenrolling.value = false;
      snackbar.show(err?.message || "Failed to leave program.", "error");
    };

    apiRequest(urls.KEYS.POST, urls.loyalty.deenroll, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C1. Fetch Summary KPI ──────────────────────────────
  const fetchSummary = (progId = null, force = false, onComplete = null) => {
    if (typeof force === "function") {
      onComplete = force;
      force = false;
    }

    const activeId = getActiveProgramId(progId);
    if (
      isSummaryFetched.value &&
      !force &&
      lastSummaryProgramId.value === activeId
    ) {
      if (onComplete) onComplete(summary.value);
      return;
    }

    isSummaryLoading.value = true;
    const params = activeId ? { program_id: activeId } : {};

    const successHandler = (res) => {
      const data = res?.data || {};
      summary.value = {
        enrolled: Boolean(data.enrolled),
        program_id: data.program_id ?? activeId,
        program_code: data.program_code || "",
        enrollment_id: data.enrollment_id ?? null,
        wallet_id: data.wallet_id ?? null,
        trading_account_id: data.trading_account_id ?? null,
        trading_account_ids:
          data.trading_account_ids ||
          (data.trading_account_id ? [data.trading_account_id] : []),
        available_points: String(data.available_points ?? "0.00"),
        lifetime_earned_points: String(data.lifetime_earned_points ?? "0.00"),
        pending_redemption_points: String(
          data.pending_redemption_points ?? "0.00",
        ),
        current_tier: data.current_tier || {
          code: "BRONZE",
          name: "Bronze",
          point_multiplier: "1.0000",
          color: "#CD7F32",
        },
        cash_conversion_rate: String(data.cash_conversion_rate ?? "0.010000"),
        cash_withdraw_enabled: Boolean(data.cash_withdraw_enabled),
        allow_wallet_transfer: Boolean(data.allow_wallet_transfer),
        allow_general_wallet_transfer: Boolean(
          data.allow_general_wallet_transfer,
        ),
        min_redemption_points: String(data.min_redemption_points ?? "100.00"),
        next_expiry_at: data.next_expiry_at ?? null,
        next_expiry_points: String(data.next_expiry_points ?? "0.00"),
        points_on_hold: Boolean(data.points_on_hold),
      };
      isSummaryFetched.value = true;
      lastSummaryProgramId.value = activeId;
      isSummaryLoading.value = false;
      if (onComplete) onComplete(summary.value);
    };

    const failureHandler = (err) => {
      isSummaryLoading.value = false;
      snackbar.show(err?.message || "Failed to load loyalty summary.", "error");
      if (onComplete) onComplete(null);
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.summary, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C0a. Fetch Program Tiers (Benefits Ladder) ────────
  const fetchTiers = (progId = null, force = false, onComplete = null) => {
    if (typeof force === "function") {
      onComplete = force;
      force = false;
    }

    const activeId = getActiveProgramId(progId);
    if (!activeId) {
      if (onComplete) onComplete([]);
      return;
    }

    if (
      isTiersFetched.value &&
      !force &&
      lastTiersProgramId.value === activeId
    ) {
      if (onComplete) onComplete(tiersData.value?.tiers || []);
      return;
    }

    isTiersLoading.value = true;

    const successHandler = (res) => {
      tiersData.value = res?.data || {
        program_id: activeId,
        program_code: "",
        enrolled: false,
        enrollment_id: null,
        current_tier_id: null,
        current_tier: null,
        tiers: [],
      };
      isTiersFetched.value = true;
      lastTiersProgramId.value = activeId;
      isTiersLoading.value = false;
      if (onComplete) onComplete(tiersData.value?.tiers || []);
    };

    const failureHandler = (err) => {
      isTiersLoading.value = false;
      snackbar.show(err?.message || "Failed to load program tiers.", "error");
      if (onComplete) onComplete([]);
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.tiers, {
      params: { program_id: activeId },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C2. Fetch Points Ledger ────────────────────────────
  const fetchPoints = (
    page = 1,
    perPage = 20,
    entryType = "ALL",
    progId = null,
    force = false,
  ) => {
    let activeId = null;
    if (progId !== null && progId !== undefined) {
      activeId =
        progId === "" || progId === "ALL" || progId === "all" ? null : progId;
    } else {
      activeId = getActiveProgramId();
    }

    const queryKey = `${page}_${perPage}_${entryType}_${activeId ?? "all"}`;

    if (
      isPointsFetched.value &&
      !force &&
      lastPointsQueryKey.value === queryKey
    ) {
      return;
    }

    isPointsLoading.value = true;

    const params = {
      page,
      per_page: perPage,
    };
    if (entryType) {
      params.entry_type = entryType;
    }
    if (activeId !== null && activeId !== undefined && activeId !== "") {
      params.program_id = activeId;
    }

    const successHandler = (res) => {
      points.value = res?.data?.items || [];
      const total = res?.data?.total || 0;
      const pages = res?.data?.pages || 1;
      pointsPagination.value = {
        page: res?.data?.page || page,
        per_page: res?.data?.per_page || perPage,
        total: total,
        pages: pages,
        total_pages: pages,
        total_items: total,
      };
      isPointsFetched.value = true;
      lastPointsQueryKey.value = queryKey;
      isPointsLoading.value = false;
    };

    const failureHandler = (err) => {
      isPointsLoading.value = false;
      snackbar.show(err?.message || "Failed to load points ledger.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.points, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C3. Fetch Redeemable Info (Live Preview) ────────────
  const fetchRedeemable = (
    previewPoints = null,
    progId = null,
    force = false,
  ) => {
    const activeId = getActiveProgramId(progId);

    if (
      isRedeemableFetched.value &&
      !force &&
      (previewPoints === null ||
        previewPoints === undefined ||
        previewPoints === "") &&
      redeemable.value?.program_id === activeId
    ) {
      return;
    }

    isRedeemableLoading.value = true;

    const params = {};
    if (activeId) {
      params.program_id = activeId;
    }
    if (
      previewPoints !== null &&
      previewPoints !== undefined &&
      previewPoints !== ""
    ) {
      params.points = previewPoints;
    }

    const successHandler = (res) => {
      const data = res?.data || {};
      redeemable.value = {
        enrolled: Boolean(data.enrolled),
        program_id: data.program_id ?? activeId,
        program_code: data.program_code || "",
        available_points: String(data.available_points ?? "0.00"),
        min_redemption_points: String(data.min_redemption_points ?? "100.00"),
        max_redeemable_points: String(data.max_redeemable_points ?? "0.00"),
        can_redeem: Boolean(data.can_redeem),
        cash_conversion_rate: String(data.cash_conversion_rate ?? "0.010000"),
        cash_withdraw_enabled: Boolean(data.cash_withdraw_enabled),
        allow_wallet_transfer: Boolean(data.allow_wallet_transfer),
        allow_general_wallet_transfer: Boolean(
          data.allow_general_wallet_transfer,
        ),
        estimated_cash_usd: String(data.estimated_cash_usd ?? "0.000000"),
        trading_account_id: data.trading_account_id ?? null,
        preview_points: previewPoints !== null ? String(previewPoints) : "0.00",
      };
      isRedeemableFetched.value = true;
      isRedeemableLoading.value = false;
    };

    const failureHandler = (err) => {
      isRedeemableLoading.value = false;
      snackbar.show(
        err?.message || "Failed to check redeemable points.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.redeemable, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C3b. Transfer Wallet Points to Trading Account (Instant) ────
  const transferWalletPoints = (payload, onSuccessCallback = null) => {
    isTransferLoading.value = true;

    const body = {
      ...payload,
    };
    if (!body.program_id) {
      const activeId = getActiveProgramId();
      if (activeId) body.program_id = activeId;
    }

    const successHandler = (res) => {
      isTransferLoading.value = false;
      snackbar.show(
        res?.message || "Points converted to trading account USD successfully!",
        "success",
      );
      if (onSuccessCallback) onSuccessCallback(res);
      // Refresh summary, transfers, and points with force = true
      fetchSummary(body.program_id || null, true);
      fetchWalletTransfers(1, 20, "", body.program_id || null, true);
      fetchPoints(
        1,
        pointsPagination.value.per_page || 20,
        "ALL",
        body.program_id || null,
        true,
      );
      fetchRedeemable(null, body.program_id || null, true);
      fetchPrograms(false, true);
    };

    const failureHandler = (err) => {
      isTransferLoading.value = false;
      snackbar.show(
        err?.message || "Failed to transfer points to trading account.",
        "error",
      );
    };

    apiRequest(urls.KEYS.POST, urls.loyalty.walletTransfer, {
      data: body,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C3c. Fetch Wallet Transfer History ──────────────────
  const fetchWalletTransfers = (
    page = 1,
    perPage = 20,
    kind = "",
    progId = null,
    force = false,
  ) => {
    if (isTransfersFetched.value && !force) return;

    isTransfersLoading.value = true;
    const activeId = getActiveProgramId(progId);

    const params = {
      page,
      per_page: perPage,
    };
    if (kind) {
      params.kind = kind;
    }
    if (activeId) {
      params.program_id = activeId;
    }

    const successHandler = (res) => {
      transfers.value = res?.data?.items || [];
      const total = res?.data?.total || 0;
      const pages = res?.data?.pages || 1;
      transfersPagination.value = {
        page: res?.data?.page || page,
        per_page: res?.data?.per_page || perPage,
        total: total,
        pages: pages,
        total_pages: pages,
        total_items: total,
      };
      isTransfersFetched.value = true;
      isTransfersLoading.value = false;
    };

    const failureHandler = (err) => {
      isTransfersLoading.value = false;
      snackbar.show(
        err?.message || "Failed to load wallet transfer history.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.walletTransfers, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C4. Fetch Payment Methods (Legacy Cash Redeem Options) ────
  const fetchPaymentMethods = (progId = null, force = false) => {
    if (isPaymentMethodsFetched.value && !force) return;

    isPaymentMethodsLoading.value = true;
    const activeId = getActiveProgramId(progId);
    const params = activeId ? { program_id: activeId } : {};

    const successHandler = (res) => {
      paymentMethods.value = res?.data || [];
      isPaymentMethodsFetched.value = true;
      isPaymentMethodsLoading.value = false;
    };

    const failureHandler = (err) => {
      isPaymentMethodsLoading.value = false;
      snackbar.show(
        err?.message || "Failed to load redemption options.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.paymentMethods, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C5. Request Instant Cash Withdrawal (Legacy) ───────
  const requestWithdraw = (payload, onSuccessCallback) => {
    isWithdrawLoading.value = true;

    const body = {
      ...payload,
    };
    if (!body.program_id) {
      const activeId = getActiveProgramId();
      if (activeId) body.program_id = activeId;
    }

    const successHandler = (res) => {
      isWithdrawLoading.value = false;
      snackbar.show(
        res?.message ||
          "Cash redeemed and credited to trading account successfully!",
        "success",
      );
      if (onSuccessCallback) onSuccessCallback(res);
      // Refresh summary, points, and withdrawals with force = true
      fetchSummary(null, true);
      fetchWithdrawals(1, 20, "", null, true);
      fetchPoints(1, pointsPagination.value.per_page || 20, "ALL", null, true);
      fetchRedeemable(null, null, true);
    };

    const failureHandler = (err) => {
      isWithdrawLoading.value = false;
      snackbar.show(
        err?.message || "Failed to submit withdrawal request.",
        "error",
      );
    };

    apiRequest(urls.KEYS.POST, urls.loyalty.withdraw, {
      data: body,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── C6. Fetch Cash Withdrawals History ─────────────────
  const fetchWithdrawals = (
    page = 1,
    perPage = 20,
    status = "",
    progId = null,
    force = false,
  ) => {
    if (isWithdrawalsFetched.value && !force) return;

    isWithdrawalsLoading.value = true;
    const activeId = getActiveProgramId(progId);

    const params = {
      page,
      per_page: perPage,
    };
    if (status) {
      params.status = status;
    }
    if (activeId) {
      params.program_id = activeId;
    }

    const successHandler = (res) => {
      withdrawals.value = res?.data?.items || [];
      const total = res?.data?.total || 0;
      const pages = res?.data?.pages || 1;
      withdrawalsPagination.value = {
        page: res?.data?.page || page,
        per_page: res?.data?.per_page || perPage,
        total: total,
        pages: pages,
        total_pages: pages,
        total_items: total,
      };
      isWithdrawalsFetched.value = true;
      isWithdrawalsLoading.value = false;
    };

    const failureHandler = (err) => {
      isWithdrawalsLoading.value = false;
      snackbar.show(
        err?.message || "Failed to load cash withdrawals.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.withdrawals, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── CS1. Fetch Store Products ──────────────────────────
  const fetchStoreProducts = (
    page = 1,
    perPage = 10,
    progId = null,
    force = false,
  ) => {
    if (
      isStoreProductsFetched.value &&
      !force &&
      lastStorePage.value === page &&
      storeProductsPagination.value.per_page === perPage
    ) {
      return;
    }

    isStoreProductsLoading.value = true;
    const activeId = getActiveProgramId(progId);

    const params = {
      page,
      per_page: perPage,
    };
    if (activeId) {
      params.program_id = activeId;
    }

    const successHandler = (res) => {
      const items = res?.data?.items || [];
      storeProducts.value = items;
      const total = res?.data?.total ?? items.length;
      const pages =
        res?.data?.pages ||
        (total ? Math.ceil(total / (res?.data?.per_page || perPage)) : 1);
      storeProductsPagination.value = {
        page: res?.data?.page || page,
        per_page: res?.data?.per_page || perPage,
        total: total,
        pages: pages,
        total_pages: pages,
        total_items: total,
        current_count: items.length,
      };
      isStoreProductsFetched.value = true;
      lastStorePage.value = page;
      isStoreProductsLoading.value = false;
    };

    const failureHandler = (err) => {
      isStoreProductsLoading.value = false;
      snackbar.show(err?.message || "Failed to load store products.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.storeProducts, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── CS2. Fetch Single Product Detail ───────────────────
  const fetchStoreProductDetail = (productId, onComplete = null) => {
    isStoreProductDetailLoading.value = true;

    const successHandler = (res) => {
      selectedProductDetail.value = res?.data || null;
      isStoreProductDetailLoading.value = false;
      if (onComplete) onComplete(res?.data);
    };

    const failureHandler = (err) => {
      isStoreProductDetailLoading.value = false;
      snackbar.show(err?.message || "Failed to load product details.", "error");
      if (onComplete) onComplete(null);
    };

    apiRequest(
      urls.KEYS.GET,
      `${urls.loyalty.storeProductDetail}${productId}`,
      {
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      },
    );
  };

  // ─── CS3. Redeem Store Product ──────────────────────────
  const redeemStoreProduct = (productId, payload, onSuccessCallback) => {
    isStoreRedeemLoading.value = true;

    const successHandler = (res) => {
      isStoreRedeemLoading.value = false;
      snackbar.show(
        res?.message ||
          "Reward requested successfully! Your request is pending review.",
        "success",
      );
      if (onSuccessCallback) onSuccessCallback(res);
      // Refresh summary, store products, and store redemptions with force = true
      fetchSummary(null, true);
      fetchStoreProducts(
        1,
        storeProductsPagination.value.per_page || 20,
        null,
        true,
      );
      fetchStoreRedemptions(
        1,
        storeRedemptionsPagination.value.per_page || 20,
        "",
        null,
        true,
      );
      fetchPoints(1, pointsPagination.value.per_page || 20, "ALL", null, true);
    };

    const failureHandler = (err) => {
      isStoreRedeemLoading.value = false;
      snackbar.show(err?.message || "Failed to redeem reward item.", "error");
    };

    apiRequest(
      urls.KEYS.POST,
      `${urls.loyalty.storeRedeem}${productId}/redeem`,
      {
        data: payload,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      },
    );
  };

  // ─── CS4. Fetch Store Redemptions (Orders) ──────────────
  const fetchStoreRedemptions = (
    page = 1,
    perPage = 20,
    status = "",
    progId = null,
    force = false,
  ) => {
    if (
      isStoreRedemptionsFetched.value &&
      !force &&
      lastStoreRedemptionsPage.value === page &&
      !status
    ) {
      return;
    }

    isStoreRedemptionsLoading.value = true;
    const activeId = getActiveProgramId(progId);

    const params = {
      page,
      per_page: perPage,
    };
    if (status) {
      params.status = status;
    }
    if (activeId) {
      params.program_id = activeId;
    }

    const successHandler = (res) => {
      storeRedemptions.value = res?.data?.items || [];
      const total = res?.data?.total || 0;
      const pages = res?.data?.pages || 1;
      storeRedemptionsPagination.value = {
        page: res?.data?.page || page,
        per_page: res?.data?.per_page || perPage,
        total: total,
        pages: pages,
        total_pages: pages,
        total_items: total,
      };
      isStoreRedemptionsFetched.value = true;
      lastStoreRedemptionsPage.value = page;
      isStoreRedemptionsLoading.value = false;
    };

    const failureHandler = (err) => {
      isStoreRedemptionsLoading.value = false;
      snackbar.show(
        err?.message || "Failed to load store redemptions.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.loyalty.storeRedemptions, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Switch Active Program & Fetch All ──────────────────
  const setSelectedProgram = (progId, force = false) => {
    const isDifferent = selectedProgramId.value !== progId;
    selectedProgramId.value = progId;
    fetchAllForSelectedProgram(force || isDifferent);
  };

  const fetchAllForSelectedProgram = (force = false) => {
    fetchSummary(null, force);
    fetchTiers(null, force);
    fetchPoints(1, pointsPagination.value.per_page || 20, "ALL", null, force);
    fetchWalletTransfers(
      1,
      transfersPagination.value.per_page || 20,
      "",
      null,
      force,
    );
  };

  const reset = () => {
    isProgramsFetched.value = false;
    isSummaryFetched.value = false;
    isTiersFetched.value = false;
    isPointsFetched.value = false;
    isStoreProductsFetched.value = false;
    isStoreRedemptionsFetched.value = false;
    isTransfersFetched.value = false;
    isWithdrawalsFetched.value = false;
    isRedeemableFetched.value = false;
    isPaymentMethodsFetched.value = false;
    isFetched.value = false;
  };

  return {
    // state
    programs,
    selectedProgramId,
    selectedProgram,
    isProgramsLoading,
    isProgramsFetched,
    isEnrolling,
    isDeenrolling,

    summary,
    isSummaryLoading,
    isSummaryFetched,

    tiersData,
    tiers,
    isTiersLoading,
    isTiersFetched,

    points,
    pointsPagination,
    isPointsLoading,
    isPointsFetched,

    redeemable,
    isRedeemableLoading,
    isRedeemableFetched,

    transfers,
    transfersPagination,
    isTransfersLoading,
    isTransfersFetched,
    isTransferLoading,

    paymentMethods,
    isPaymentMethodsLoading,
    isPaymentMethodsFetched,

    withdrawals,
    withdrawalsPagination,
    isWithdrawalsLoading,
    isWithdrawalsFetched,
    isWithdrawLoading,

    storeProducts,
    storeProductsPagination,
    selectedProductDetail,
    isStoreProductsLoading,
    isStoreProductsFetched,
    isStoreProductDetailLoading,
    isStoreRedeemLoading,

    storeRedemptions,
    storeRedemptionsPagination,
    isStoreRedemptionsLoading,
    isStoreRedemptionsFetched,

    isFetched,

    // actions
    fetchPrograms,
    enrollInProgram,
    leaveProgram,
    setSelectedProgram,
    fetchAllForSelectedProgram,
    fetchSummary,
    fetchTiers,
    fetchPoints,
    fetchRedeemable,
    transferWalletPoints,
    fetchWalletTransfers,
    fetchPaymentMethods,
    requestWithdraw,
    fetchWithdrawals,
    fetchStoreProducts,
    fetchStoreProductDetail,
    redeemStoreProduct,
    fetchStoreRedemptions,
    reset,
  };
});
