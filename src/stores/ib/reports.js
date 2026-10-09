import { ref, computed } from "vue";
import { defineStore } from "pinia";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdrawal" },
];

export const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

// ─── Data Extraction & Parsing Helpers ─────────────────────────────────────

/**
 * Traverses hierarchy tree or list from /network API to build flat list of IB accounts.
 */
function extractIbListFromNetwork(resPayload) {
  const result = [];
  const visited = new Set();

  const traverse = (node, depth = 0) => {
    if (!node || typeof node !== "object") return;

    const id = node.id ?? node.ib_id ?? node.user_id;

    if (id != null && !visited.has(String(id))) {
      visited.add(String(id));

      let name =
        node.name ||
        node.label_name ||
        node.ib_name ||
        node.username ||
        [node.first_name, node.last_name].filter(Boolean).join(" ");

      if (!name || !name.trim()) {
        name = node.email ? node.email.split("@")[0] : `IB #${id}`;
      }

      const level = node.level != null ? Number(node.level) : depth;
      const email = node.email || node.user_email || "";
      const login = node.login || node.account || node.account_number || id;
      const subIbsCount = Array.isArray(node.sub_ibs)
        ? node.sub_ibs.length
        : Array.isArray(node.children)
          ? node.children.length
          : node.total_sub_ibs || 0;

      result.push({
        id,
        name: name.trim(),
        email,
        login,
        level,
        sub_ibs_count: subIbsCount,
        raw: node,
        transactions: node.transactions || null,
      });
    }

    const children =
      node.sub_ibs ||
      node.children ||
      node.nodes ||
      (Array.isArray(node.data) ? node.data : null);

    if (Array.isArray(children)) {
      children.forEach((child) => traverse(child, depth + 1));
    }
  };

  const rootData = resPayload?.data || resPayload || {};
  const mainList =
    rootData.data || rootData.nodes || rootData.hierarchy || rootData;

  if (Array.isArray(mainList)) {
    mainList.forEach((item) => traverse(item, 0));
  } else if (mainList && typeof mainList === "object") {
    traverse(mainList, 0);
    if (Array.isArray(mainList.nodes)) {
      mainList.nodes.forEach((item) => traverse(item, 0));
    }
    if (Array.isArray(mainList.sub_ibs)) {
      mainList.sub_ibs.forEach((item) => traverse(item, 1));
    }
    if (Array.isArray(mainList.children)) {
      mainList.children.forEach((item) => traverse(item, 1));
    }
  }

  return result;
}

/**
 * Extracts array of record items from various API response payload formats.
 */
function parseListData(payload) {
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.DataTable)) return payload.DataTable;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.deposits)) return payload.deposits;
  if (Array.isArray(payload.history)) return payload.history;

  if (payload.PartitionedPerformances?.SymbolGroup) {
    return Object.entries(payload.PartitionedPerformances.SymbolGroup).map(
      ([symbol, g]) => ({ symbol, ...g }),
    );
  }
  if (payload.SymbolGroup) {
    return Object.entries(payload.SymbolGroup).map(([symbol, g]) => ({
      symbol,
      ...g,
    }));
  }

  return [];
}

/**
 * Computes summary metrics from payload or list data.
 */
function parseSummaryData(payload, listData = [], selectedIb = null) {
  if (!payload || typeof payload !== "object") {
    return {
      total_deposit: 0,
      deposit_real: 0,
      deposit_copy: 0,
      total_withdrawal: 0,
      withdrawal_real: 0,
      withdrawal_copy: 0,
      net_deposit: 0,
      net_real: 0,
      net_copy: 0,
      total_accounts: 0,
      accounts_real: 0,
      accounts_copy: 0,
    };
  }

  const real = payload.real || {};
  const copy = payload.copy_trading || payload.copy || {};
  const self =
    selectedIb?.transactions?.self || selectedIb?.raw?.transactions?.self || null;
  const netTrans =
    selectedIb?.transactions?.network || selectedIb?.raw?.transactions?.network || null;
  const rawNode = selectedIb?.raw || {};

  const parseNum = (v) => {
    if (v == null || v === "") return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const depReal =
    parseNum(real.total_deposit) ||
    parseNum(real.deposit) ||
    parseNum(self?.deposit?.real) ||
    parseNum(netTrans?.deposit?.real) ||
    0;

  const depCopy =
    parseNum(copy.total_deposit) ||
    parseNum(copy.deposit) ||
    parseNum(self?.deposit?.copy_trading) ||
    parseNum(self?.deposit?.copy) ||
    parseNum(netTrans?.deposit?.copy_trading) ||
    parseNum(netTrans?.deposit?.copy) ||
    0;

  const totalDep =
    parseNum(payload.summary?.total_deposit) ||
    parseNum(payload.total_deposit) ||
    parseNum(self?.deposit?.overall) ||
    parseNum(netTrans?.deposit?.overall) ||
    (depReal + depCopy);

  const wdrReal =
    parseNum(real.total_withdrawal) ||
    parseNum(real.withdrawal) ||
    parseNum(self?.withdrawal?.real) ||
    parseNum(netTrans?.withdrawal?.real) ||
    0;

  const wdrCopy =
    parseNum(copy.total_withdrawal) ||
    parseNum(copy.withdrawal) ||
    parseNum(self?.withdrawal?.copy_trading) ||
    parseNum(self?.withdrawal?.copy) ||
    parseNum(netTrans?.withdrawal?.copy_trading) ||
    parseNum(netTrans?.withdrawal?.copy) ||
    0;

  const totalWth =
    parseNum(payload.summary?.total_withdrawal) ||
    parseNum(payload.total_withdrawal) ||
    parseNum(self?.withdrawal?.overall) ||
    parseNum(netTrans?.withdrawal?.overall) ||
    (wdrReal + wdrCopy);

  // Net deposit = total deposit - total withdrawal
  const netDep = totalDep - totalWth;
  const netReal = depReal - wdrReal;
  const netCopy = depCopy - wdrCopy;

  const accReal =
    parseNum(real.accounts) ||
    parseNum(rawNode.real_accounts) ||
    parseNum(rawNode.total_clients) ||
    0;

  const accCopy =
    parseNum(copy.accounts) ||
    parseNum(rawNode.copy_accounts) ||
    0;

  const totalAcc =
    parseNum(payload.summary?.total_accounts) ||
    parseNum(payload.total_accounts) ||
    parseNum(rawNode.total_overall_clients) ||
    (accReal + accCopy) ||
    listData.length;

  return {
    total_deposit: totalDep,
    deposit_real: depReal,
    deposit_copy: depCopy,
    total_withdrawal: totalWth,
    withdrawal_real: wdrReal,
    withdrawal_copy: wdrCopy,
    net_deposit: netDep,
    net_real: netReal,
    net_copy: netCopy,
    total_accounts: totalAcc,
    accounts_real: accReal,
    accounts_copy: accCopy,
  };
}

/**
 * Calculates pagination metadata from payload.
 */
function parsePaginationData(payload, listDataLength = 0, perPage = 10) {
  if (!payload || typeof payload !== "object") {
    return { total_items: listDataLength, total_pages: 1 };
  }

  const total =
    payload.total ??
    payload.total_items ??
    payload.count ??
    payload.meta?.total ??
    listDataLength;

  const totalPages =
    payload.total_pages ??
    payload.totalPages ??
    Math.max(1, Math.ceil(total / (perPage || 10)));

  return {
    total_items: Number(total) || 0,
    total_pages: Number(totalPages) || 1,
  };
}

// ─── Store Definition ─────────────────────────────────────────────────────────

export const useIbReportsStore = defineStore("ibReports", () => {
  const snackbar = useSnackbarStore();

  // ─── State ───────────────────────────────────────────
  const isClientMode = ref(false);
  const ibList = ref([]);
  const ibLoading = ref(false);
  const selectedIbId = ref(null);

  const records = ref([]);
  const recordsPayload = ref(null);
  const summary = ref({
    total_deposit: 0,
    deposit_real: 0,
    deposit_copy: 0,
    total_withdrawal: 0,
    withdrawal_real: 0,
    withdrawal_copy: 0,
    net_deposit: 0,
    total_accounts: 0,
    accounts_real: 0,
    accounts_copy: 0,
  });
  const pagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 1,
  });

  const filters = ref({
    type: "",
    dateRange: "all",
    search: "",
  });

  const loading = ref(false);
  const isFetched = ref(false);
  const error = ref(null);

  // ─── Computed Getters ───────────────────────────────
  const selectedIb = computed(() => {
    if (selectedIbId.value == null) return null;
    
    // Check if it's in ibList
    const fromList = ibList.value.find(
      (item) => String(item.id) === String(selectedIbId.value),
    );
    if (fromList) return fromList;

    // Fallback to recordsPayload node for client mode
    if (recordsPayload.value) {
      const payloadData = recordsPayload.value.data || recordsPayload.value;
      const node = Array.isArray(payloadData) ? payloadData[0] : (payloadData.nodes?.[0] || payloadData);
      
      if (node) {
        return {
          id: node.id || node.user_id || selectedIbId.value,
          name: node.name || (node.first_name ? `${node.first_name} ${node.last_name || ''}` : `Client #${selectedIbId.value}`),
          email: node.email || '',
          level: node.level || 0,
        };
      }
    }
    return null;
  });

  // ─── Actions: fetchIbList ───────────────────────────
  const fetchIbList = () => {
    ibLoading.value = true;

    const successHandler = (res) => {
      const list = extractIbListFromNetwork(res?.data || res);
      ibList.value = list;
      ibLoading.value = false;

      if (list.length > 0 && selectedIbId.value == null) {
        selectIb(list[0].id);
      }
    };

    const failureHandler = (err) => {
      const fallbackEndpoint =
        typeof urls.clients.searchSubIb === "string"
          ? urls.clients.searchSubIb.replace(/\?$/, "")
          : urls.clients.searchSubIb;

      const fallbackSuccessHandler = (res) => {
        ibLoading.value = false;
        const resData = res?.data || res || [];
        const listData = Array.isArray(resData) ? resData : resData.data || [];

        ibList.value = listData.map((ib) => ({
          id: ib.id,
          name: ib.label_name || ib.name || ib.email || `IB #${ib.id}`,
          email: ib.email || "",
          login: ib.id,
          level: ib.level || 0,
          sub_ibs_count: 0,
        }));

        if (ibList.value.length > 0 && selectedIbId.value == null) {
          selectIb(ibList.value[0].id);
        }
      };

      const fallbackFailureHandler = (fallbackErr) => {
        ibLoading.value = false;
        snackbar.show(
          fallbackErr?.message || err?.message || "Failed to load IB accounts.",
          "error",
        );
      };

      apiRequest(urls.KEYS.GET, fallbackEndpoint, {
        isTokenRequired: true,
        params: { q: "" },
        onSuccess: fallbackSuccessHandler,
        onFailure: fallbackFailureHandler,
      });
    };

    apiRequest(urls.KEYS.GET, urls.ib.network, {
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Actions: fetchIbDeposits ─────────────────────────
  const fetchIbDeposits = (
    ibId = selectedIbId.value,
    force = false,
    customParams = {},
  ) => {
    if (ibId == null) return;
    if (
      isFetched.value &&
      !force &&
      selectedIbId.value === ibId &&
      !Object.keys(customParams).length
    ) {
      return;
    }
    if (loading.value && !force) return;

    selectedIbId.value = ibId;
    loading.value = true;
    error.value = null;

    const successHandler = (res) => {
      loading.value = false;
      isFetched.value = true;

      const payload = res?.data || res || {};
      recordsPayload.value = payload;

      const listData = parseListData(payload);
      records.value = listData;

      summary.value = parseSummaryData(payload, listData, selectedIb.value);

      const paginationMeta = parsePaginationData(
        payload,
        listData.length,
        pagination.value.per_page,
      );

      pagination.value = {
        ...pagination.value,
        ...paginationMeta,
      };
    };

    const failureHandler = (err) => {
      loading.value = false;
      error.value = err;
      records.value = [];
      recordsPayload.value = null;
      snackbar.show(err?.message || "Failed to fetch IB report data.", "error");
    };

    const endpoint = isClientMode.value
      ? urls.ib.networkDepositsClient(ibId)
      : urls.ib.networkDepositsIb(ibId);

    apiRequest(urls.KEYS.GET, endpoint, {
      isTokenRequired: true,
      params: {
        page: pagination.value.page,
        limit: pagination.value.per_page,
        ...(filters.value.type ? { type: filters.value.type } : {}),
        ...(filters.value.dateRange && filters.value.dateRange !== "all"
          ? { period: filters.value.dateRange }
          : {}),
        ...(filters.value.search?.trim()
          ? { search: filters.value.search.trim() }
          : {}),
        ...customParams,
      },
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Filter & Selection Actions ────────────────────

  const selectIb = (ibId) => {
    selectedIbId.value = ibId;
    pagination.value.page = 1;
    fetchIbDeposits(ibId, true);
  };

  const setType = (type) => {
    if (filters.value.type === type) return;
    filters.value.type = type;
    pagination.value.page = 1;
    fetchIbDeposits(selectedIbId.value, true);
  };

  const setDateRange = (range) => {
    if (filters.value.dateRange === range) return;
    filters.value.dateRange = range;
    pagination.value.page = 1;
    fetchIbDeposits(selectedIbId.value, true);
  };

  const setSearch = (query) => {
    filters.value.search = query;
    pagination.value.page = 1;
    fetchIbDeposits(selectedIbId.value, true);
  };

  const setPage = (page) => {
    if (pagination.value.page === page) return;
    pagination.value.page = page;
    fetchIbDeposits(selectedIbId.value, true);
  };

  const reset = () => {
    records.value = [];
    recordsPayload.value = null;
    summary.value = {
      total_deposit: 0,
      deposit_real: 0,
      deposit_copy: 0,
      total_withdrawal: 0,
      withdrawal_real: 0,
      withdrawal_copy: 0,
      net_deposit: 0,
      total_accounts: 0,
      accounts_real: 0,
      accounts_copy: 0,
    };
    pagination.value = {
      page: 1,
      per_page: 10,
      total_items: 0,
      total_pages: 1,
    };
    filters.value = { type: "", dateRange: "all", search: "" };
    loading.value = false;
    isFetched.value = false;
    error.value = null;
    selectedIbId.value = null;
    isClientMode.value = false;
  };

  return {
    isClientMode,
    ibList,
    ibLoading,
    selectedIbId,
    selectedIb,
    records,
    recordsPayload,
    summary,
    pagination,
    filters,
    loading,
    error,
    fetchIbList,
    fetchIbDeposits,
    selectIb,
    setType,
    setDateRange,
    setSearch,
    setPage,
    reset,
  };
});
