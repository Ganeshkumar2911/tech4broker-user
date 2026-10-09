import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useIbClientsStore = defineStore("ibClients", () => {
  const snackbar = useSnackbarStore();

  const clients = ref([]);
  const currentClient = ref(null);
  const isLoading = ref(false);
  const detailLoading = ref(false);
  const error = ref(null);

  // Funnel State
  const funnelFilter = ref("all");
  const funnelStatus = ref("all");
  const funnelSearch = ref("");
  const funnelSubIb = ref(null);
  const isFunnelLoading = ref(false);
  const funnelError = ref(null);
  const funnelCounts = ref({
    all: 0,
    kyc_incomplete: 0,
    no_account: 0,
    no_deposit: 0,
  });
  const funnelClients = ref([]);
  const funnelPagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  });

  // Clients with Accounts State (Account Report)
  const accountsSearch = ref("");
  const accountsStatus = ref("all");
  const accountsSubIb = ref(null);
  const isAccountsLoading = ref(false);
  const accountsError = ref(null);
  const accountsClients = ref([]);
  const accountsPagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  });

  const selectedPeriod = ref("all");
  const selectedMapping = ref("all");
  const searchQuery = ref("");
  const selectedSubIb = ref(null);

  const ibOptions = ref([]);
  const searchLoading = ref(false);

  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });

  const periodOptions = [
    { label: "TODAY", value: "today" },
    { label: "YESTERDAY", value: "yesterday" },
    { label: "THIS WEEK", value: "this_week" },
    { label: "THIS MONTH", value: "this_month" },
    { label: "ALL TIME", value: "all" },
  ];

  const mappingOptions = [
    { label: "All", value: "all" },
  ];

  const hasActiveFilters = computed(() => {
    return Boolean(
      (searchQuery.value && searchQuery.value.trim()) ||
        selectedSubIb.value ||
        (selectedPeriod.value && selectedPeriod.value !== "all") ||
        (selectedMapping.value && selectedMapping.value !== "all")
    );
  });

  const fetchClients = (page = pagination.value.page) => {
    isLoading.value = true;
    error.value = null;

    const subIbId = selectedSubIb.value;

    const params = {
      page,
      limit: pagination.value.limit,
      per_page: pagination.value.limit,
      ...(selectedPeriod.value && selectedPeriod.value !== "all"
        ? { period: selectedPeriod.value }
        : {}),
      ...(selectedMapping.value && selectedMapping.value !== "all"
        ? { mapping: selectedMapping.value }
        : {}),
      ...(searchQuery.value?.trim() ? { search: searchQuery.value.trim() } : {}),
    };

    const successHandler = (res) => {
      isLoading.value = false;
      const resData = res?.data || res || {};
      const listData = Array.isArray(resData)
        ? resData
        : resData.clients || resData.data || resData.items || resData.records || [];

      clients.value = listData;

      const total =
        resData.total ??
        resData.totalCount ??
        resData.count ??
        resData.meta?.total ??
        resData.pagination?.total_items ??
        listData.length;

      const calculatedPages = Math.ceil(total / (pagination.value.limit || 10)) || 1;
      const totalPages =
        resData.total_pages ??
        resData.totalPages ??
        resData.meta?.total_pages ??
        resData.pagination?.total_pages ??
        calculatedPages;

      pagination.value = {
        ...pagination.value,
        page,
        total,
        total_pages: totalPages,
      };

      // Populate mapping options dynamically if returned in payload
      if (Array.isArray(resData.mappings) && resData.mappings.length > 0) {
        const unique = ["all", ...resData.mappings];
        mappingOptions.length = 0;
        unique.forEach((m) => {
          mappingOptions.push({
            label: m === "all" ? "All" : String(m),
            value: m,
          });
        });
      }
    };

    const failureHandler = (err) => {
      isLoading.value = false;
      error.value = err;
      snackbar.show(
        err?.message || "Failed to load client report.",
        "error"
      );
    };

    const targetUrl = subIbId ? urls.clients.ibClients(subIbId) : urls.clients.list;

    apiRequest(urls.KEYS.GET, targetUrl, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  let searchDebounce = null;

  const searchSubIbs = (query = "") => {
    clearTimeout(searchDebounce);

    searchDebounce = setTimeout(() => {
      const q = query.trim();

      if (!q) {
        ibOptions.value = [];
        searchLoading.value = false;
        return;
      }

      searchLoading.value = true;

      const successHandler = (res) => {
        searchLoading.value = false;
        const resData = res?.data || res || [];
        const list = Array.isArray(resData)
          ? resData
          : resData.data || resData.items || [];

        ibOptions.value = list.map((ib) => ({
          label:
            ib.label_name ??
            ib.name ??
            ib.ib_name ??
            ib.email ??
            `IB ${ib.id}`,
          value: ib.id,
        }));
      };

      const failureHandler = (err) => {
        searchLoading.value = false;
        ibOptions.value = [];
        snackbar.show(
          err?.message || "Failed to fetch sub IBs.",
          "error"
        );
      };

      const endpoint = typeof urls.clients.searchSubIb === "string"
        ? urls.clients.searchSubIb.replace(/\?$/, "")
        : urls.clients.searchSubIb;

      apiRequest(urls.KEYS.GET, endpoint, {
        params: { q },
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    }, 500);
  };

  const applyFilters = () => {
    pagination.value.page = 1;
    fetchClients(1);
  };

  const resetFilters = () => {
    searchQuery.value = "";
    selectedSubIb.value = null;
    selectedPeriod.value = "all";
    selectedMapping.value = "all";
    ibOptions.value = [];
    pagination.value.page = 1;
    fetchClients(1);
  };

  const changePage = (newPage) => {
    pagination.value.page = newPage;
    fetchClients(newPage);
  };

  const setPeriod = (val) => {
    selectedPeriod.value = val;
    pagination.value.page = 1;
    fetchClients(1);
  };

  const setMapping = (val) => {
    selectedMapping.value = val;
    pagination.value.page = 1;
    fetchClients(1);
  };

  const downloadReport = () => {
    if (!clients.value || clients.value.length === 0) {
      snackbar.show("No client data available to download.", "warning");
      return;
    }

    try {
      const headers = ["Name", "Email", "Deposit", "Net Deposit", "Withdrawal", "Referral Campaign", "Joined On"];
      const rows = clients.value.map((c) => {
        const ref = c.referral_link;
        const refStr = typeof ref === 'object' ? (ref.name && ref.code ? `${ref.name} (${ref.code})` : ref.name || ref.code || '—') : (ref || '—');
        const dep = c.transactions?.deposit?.overall ?? (typeof c.deposit === 'object' && c.deposit !== null ? (c.deposit.overall ?? c.deposit.total ?? c.deposit.real ?? 0) : (c.deposit || c.total_deposit || 0));
        const wth = c.transactions?.withdrawal?.overall ?? (typeof c.withdrawal === 'object' && c.withdrawal !== null ? (c.withdrawal.overall ?? c.withdrawal.total ?? c.withdrawal.real ?? 0) : (c.withdrawal || c.total_withdrawal || 0));
        const net = (c.net_deposit !== undefined && c.net_deposit !== null && typeof c.net_deposit !== 'object') ? c.net_deposit : (dep - wth);
        return [
          `"${(c.name || `${c.first_name || ''} ${c.last_name || ''}`).trim() || ''}"`,
          `"${c.email || ''}"`,
          dep,
          net,
          wth,
          `"${refStr}"`,
          `"${c.created_at || c.joined_on || ''}"`,
        ];
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `client_report_${selectedPeriod.value}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      snackbar.show("Client report downloaded successfully.", "success");
    } catch (e) {
      snackbar.show("Failed to generate download.", "error");
    }
  };

  const formatDateToYYYYMMDD = (val) => {
    if (!val) return null;
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchClientDetail = (id, dateParams = {}, isIb = false) => {
    if (!id) return;
    detailLoading.value = true;
    currentClient.value = null;

    const params = {};
    if (dateParams.from_date && dateParams.to_date) {
      params.from_date = formatDateToYYYYMMDD(dateParams.from_date);
      params.to_date = formatDateToYYYYMMDD(dateParams.to_date);
    }

    const successHandler = (res) => {
      detailLoading.value = false;
      const resData = res?.data || res || {};
      const dataObj = resData?.data || resData;
      currentClient.value = dataObj;
    };

    const failureHandler = (err) => {
      detailLoading.value = false;
      currentClient.value = null;
      error.value = err;
      if (err?.response?.status === 404) {
        snackbar.show("Client not found.", "error");
      } else {
        snackbar.show(
          err?.message || (isIb ? "Failed to load IB details." : "Failed to load client details."),
          "error"
        );
      }
    };

    const targetUrl = isIb ? urls.ib.networkDepositsIb(id) : urls.clients.detail(id);

    apiRequest(urls.KEYS.GET, targetUrl, {
      params,
      role: "ib",
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Funnel Actions ─────────────────────────────────────
  const fetchFunnelClients = (page = funnelPagination.value.page) => {
    isFunnelLoading.value = true;
    funnelError.value = null;

    const params = {
      filter: funnelFilter.value || "all",
      page: page ?? 1,
      per_page: funnelPagination.value.per_page || 10,
      limit: funnelPagination.value.per_page || 10,
    };

    if (funnelSearch.value && funnelSearch.value.trim()) {
      params.search = funnelSearch.value.trim();
    }
    if (funnelStatus.value && funnelStatus.value !== "all") {
      params.status = funnelStatus.value;
    } else {
      params.status = "all";
    }
    if (funnelSubIb.value) {
      params.sub_ib_id = String(funnelSubIb.value);
    }

    const successHandler = (res) => {
      isFunnelLoading.value = false;
      const resData = res?.data || res || {};

      // Sync counts
      const rawCounts = resData.counts || resData.filters?.counts;
      if (rawCounts) {
        funnelCounts.value = {
          all: Number(rawCounts.all) || 0,
          kyc_incomplete: Number(rawCounts.kyc_incomplete) || 0,
          no_account: Number(rawCounts.no_account) || 0,
          no_deposit: Number(rawCounts.no_deposit) || 0,
        };
      }

      // Sync data list
      const listData = Array.isArray(resData.data)
        ? resData.data
        : Array.isArray(resData)
          ? resData
          : [];
      funnelClients.value = listData;

      // Also update clients.value fallback for detail finding
      if (listData.length > 0) {
        clients.value = listData;
      }

      // Sync pagination
      const paginationData = res?.pagination || resData.pagination;
      if (paginationData) {
        funnelPagination.value = {
          page: Number(paginationData.page) || page,
          per_page: Number(paginationData.per_page) || funnelPagination.value.per_page,
          total_items: Number(paginationData.total_items) || listData.length,
          total_pages: Number(paginationData.total_pages) || 1,
        };
      } else {
        const total = listData.length;
        funnelPagination.value = {
          page,
          per_page: funnelPagination.value.per_page,
          total_items: total,
          total_pages: Math.ceil(total / (funnelPagination.value.per_page || 10)) || 1,
        };
      }
    };

    const failureHandler = (err) => {
      isFunnelLoading.value = false;
      funnelError.value = err;
      snackbar.show(
        err?.message || "Failed to load client funnel report.",
        "error",
      );
    };

    const targetUrl = urls.clients.funnel || urls.clients.list;

    apiRequest(urls.KEYS.GET, targetUrl, {
      params,
      role: "ib",
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const setFunnelFilter = (filterKey) => {
    funnelFilter.value = filterKey;
    funnelPagination.value.page = 1;
    fetchFunnelClients(1);
  };

  const setFunnelStatus = (statusVal) => {
    funnelStatus.value = statusVal;
    funnelPagination.value.page = 1;
    fetchFunnelClients(1);
  };

  const setFunnelPerPage = (perPageVal) => {
    funnelPagination.value.per_page = Number(perPageVal) || 10;
    funnelPagination.value.page = 1;
    fetchFunnelClients(1);
  };

  const changeFunnelPage = (newPage) => {
    funnelPagination.value.page = newPage;
    fetchFunnelClients(newPage);
  };

  const downloadFunnelReport = () => {
    if (!funnelClients.value || funnelClients.value.length === 0) {
      snackbar.show("No client data available to download.", "warning");
      return;
    }

    try {
      const headers = [
        "Name",
        "Email",
        "Phone",
        "KYC Status",
        "Stage",
        "Trading Accounts Count",
        "Active Followings",
        "Referral Name",
        "Referral Code",
        "IB Name",
        "IB Email",
        "Status",
        "Joined At",
      ];

      const rows = funnelClients.value.map((c) => {
        const ref = c.referral_link;
        const refName = typeof ref === "object" ? ref.name || "" : "";
        const refCode = typeof ref === "object" ? ref.code || "" : String(ref || "");
        const kyc = c.kyc_status || "—";
        const stage = c.stage || "—";
        const phone = c.phone_number || "—";
        const status = c.is_active ? "Active" : "Inactive";
        const accountsCount =
          c.trading_accounts_count ??
          (Array.isArray(c.accounts) ? c.accounts.length : 0);
        const totalDeposit = Number(c.total_deposit ?? c.deposit ?? 0);
        const walletBalance = Number(c.wallet_balance ?? 0);
        const followings = Number(c.active_followings ?? 0);

        return [
          `"${(c.name || `${c.first_name || ''} ${c.last_name || ''}`).trim() || ''}"`,
          `"${c.email || ''}"`,
          `"${phone}"`,
          `"${kyc}"`,
          `"${stage}"`,
          accountsCount,
          followings,
          `"${refName}"`,
          `"${refCode}"`,
          `"${c.ib?.name || ''}"`,
          `"${c.ib?.email || ''}"`,
          `"${status}"`,
          `"${c.created_at || c.joined_on || ''}"`,
        ];
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `client_funnel_${funnelFilter.value}_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      snackbar.show("Client funnel report downloaded successfully.", "success");
    } catch (e) {
      snackbar.show("Failed to generate download.", "error");
    }
  };

  // ─── Clients with Accounts Actions (Account Report) ─────
  const fetchClientsWithAccounts = (page = accountsPagination.value.page) => {
    isAccountsLoading.value = true;
    accountsError.value = null;

    const params = {
      page: page ?? 1,
      per_page: Math.min(accountsPagination.value.per_page || 10, 50),
      limit: Math.min(accountsPagination.value.per_page || 10, 50),
    };

    if (accountsSearch.value && accountsSearch.value.trim()) {
      params.search = accountsSearch.value.trim();
    }
    if (accountsStatus.value && accountsStatus.value !== "all") {
      params.status = accountsStatus.value;
    } else {
      params.status = "all";
    }
    if (accountsSubIb.value) {
      params.sub_ib_id = String(accountsSubIb.value);
    }

    const successHandler = (res) => {
      isAccountsLoading.value = false;
      const resData = res?.data || res || {};

      const listData = Array.isArray(resData.data)
        ? resData.data
        : Array.isArray(resData)
          ? resData
          : [];
      accountsClients.value = listData;

      // Fallback for clients.value
      if (listData.length > 0) {
        clients.value = listData;
      }

      const paginationData = res?.pagination || resData.pagination;
      if (paginationData) {
        accountsPagination.value = {
          page: Number(paginationData.page) || page,
          per_page:
            Number(paginationData.per_page) ||
            accountsPagination.value.per_page,
          total_items:
            Number(paginationData.total_items) || listData.length,
          total_pages: Number(paginationData.total_pages) || 1,
        };
      } else {
        const total = listData.length;
        accountsPagination.value = {
          page,
          per_page: accountsPagination.value.per_page,
          total_items: total,
          total_pages:
            Math.ceil(total / (accountsPagination.value.per_page || 10)) || 1,
        };
      }
    };

    const failureHandler = (err) => {
      isAccountsLoading.value = false;
      accountsError.value = err;
      snackbar.show(
        err?.message || "Failed to load clients with accounts report.",
        "error",
      );
    };

    const targetUrl = urls.clients.withAccounts || "clients/with-accounts";

    apiRequest(urls.KEYS.GET, targetUrl, {
      params,
      role: "ib",
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const setAccountsStatus = (statusVal) => {
    accountsStatus.value = statusVal;
    accountsPagination.value.page = 1;
    fetchClientsWithAccounts(1);
  };

  const setAccountsPerPage = (perPageVal) => {
    accountsPagination.value.per_page = Math.min(Number(perPageVal) || 10, 50);
    accountsPagination.value.page = 1;
    fetchClientsWithAccounts(1);
  };

  const changeAccountsPage = (newPage) => {
    accountsPagination.value.page = newPage;
    fetchClientsWithAccounts(newPage);
  };

  const downloadAccountsReport = () => {
    if (!accountsClients.value || accountsClients.value.length === 0) {
      snackbar.show("No client data available to download.", "warning");
      return;
    }

    try {
      const headers = [
        "Name",
        "Email",
        "Phone",
        "KYC Status",
        "Stage",
        "Trading Accounts Count",
        "Total Deposit",
        "Total Withdrawal",
        "Net Deposit",
        "Active Followings",
        "Referral Name",
        "Referral Code",
        "IB Name",
        "IB Email",
        "Status",
        "Joined At",
      ];

      const rows = accountsClients.value.map((c) => {
        const ref = c.referral_link;
        const refName = typeof ref === "object" ? ref.name || "" : "";
        const refCode =
          typeof ref === "object" ? ref.code || "" : String(ref || "");
        const kyc = c.kyc_status || "—";
        const stage = c.stage || "—";
        const phone = c.phone_number || "—";
        const status = c.is_active ? "Active" : "Inactive";
        const accountsCount =
          c.trading_accounts_count ??
          (Array.isArray(c.accounts) ? c.accounts.length : 0);
        const totalDeposit = Number(c.total_deposit ?? c.deposit ?? 0);
        const totalWithdrawal = Number(c.total_withdrawal ?? 0);
        const netDeposit = totalDeposit - totalWithdrawal;
        const followings = Number(c.active_followings ?? 0);

        return [
          `"${(c.name || `${c.first_name || ''} ${c.last_name || ''}`).trim() || ''}"`,
          `"${c.email || ''}"`,
          `"${phone}"`,
          `"${kyc}"`,
          `"${stage}"`,
          accountsCount,
          totalDeposit,
          totalWithdrawal,
          netDeposit,
          followings,
          `"${refName}"`,
          `"${refCode}"`,
          `"${c.ib?.name || ''}"`,
          `"${c.ib?.email || ''}"`,
          `"${status}"`,
          `"${c.created_at || c.joined_on || ''}"`,
        ];
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `clients_with_accounts_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      snackbar.show("Account report downloaded successfully.", "success");
    } catch (e) {
      snackbar.show("Failed to generate download.", "error");
    }
  };

  return {
    clients,
    currentClient,
    isLoading,
    detailLoading,
    error,
    selectedPeriod,
    selectedMapping,
    searchQuery,
    selectedSubIb,
    ibOptions,
    searchLoading,
    hasActiveFilters,
    pagination,
    periodOptions,
    mappingOptions,
    fetchClients,
    fetchClientDetail,
    searchSubIbs,
    applyFilters,
    resetFilters,
    changePage,
    setPeriod,
    setMapping,
    downloadReport,

    // Funnel exports
    funnelFilter,
    funnelStatus,
    funnelSearch,
    funnelSubIb,
    isFunnelLoading,
    funnelError,
    funnelCounts,
    funnelClients,
    funnelPagination,
    fetchFunnelClients,
    setFunnelFilter,
    setFunnelStatus,
    setFunnelPerPage,
    changeFunnelPage,
    downloadFunnelReport,

    // Clients with accounts exports (Account Report)
    accountsSearch,
    accountsStatus,
    accountsSubIb,
    isAccountsLoading,
    accountsError,
    accountsClients,
    accountsPagination,
    fetchClientsWithAccounts,
    setAccountsStatus,
    setAccountsPerPage,
    changeAccountsPage,
    downloadAccountsReport,
  };
});
