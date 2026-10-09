import { defineStore } from "pinia";
import { ref } from "vue";

import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { computed } from "vue";

const mapDepositResponse = (payload) => {
  const real = payload?.real || {};
  const copy = payload?.copy_trading || {};

  const totalAccounts = (real.accounts || 0) + (copy.accounts || 0);
  const totalDeposit = (real.total_deposit || 0) + (copy.total_deposit || 0);
  const totalWithdrawal =
    (real.total_withdrawal || 0) + (copy.total_withdrawal || 0);

  return {
    total_accounts: totalAccounts,
    accounts_real: real.accounts || 0,
    accounts_copy: copy.accounts || 0,

    total_deposit: totalDeposit,
    deposit_real: real.total_deposit || 0,
    deposit_copy: copy.total_deposit || 0,

    total_withdrawal: totalWithdrawal,
    withdrawal_real: real.total_withdrawal || 0,
    withdrawal_copy: copy.total_withdrawal || 0,

    net_deposit: totalDeposit - totalWithdrawal,

    new_clients: payload?.summary?.new_clients ?? 0,
    opened_accounts: payload?.summary?.opened_accounts ?? 0,
    total_rebate: payload?.summary?.total_rebate ?? 0,
  };
};

// Maps deposits API's graph[] into {label, value} for the chart
const mapGraphToChart = (graph = []) => {
  return graph.map((point) => ({
    label: new Date(point.date).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    }),
    value: point.value,
  }));
};

const extractLevelsFromHierarchyNodes = (data = {}) => {
  const levelSet = new Set();
  const payload = data?.data || data || {};

  // 1. From max_level or overall_level
  const maxLvl =
    payload?.max_level ??
    payload?.overall_level ??
    payload?.graph?.max_level ??
    payload?.graph?.overall_level;
  if (typeof maxLvl === "number" && maxLvl >= 0) {
    for (let l = 0; l <= maxLvl; l++) {
      levelSet.add(l);
    }
  }

  // 2. From graph.hierarchy.nodes or nodes array
  const nodes =
    payload?.graph?.hierarchy?.nodes ||
    payload?.hierarchy?.nodes ||
    data?.graph?.hierarchy?.nodes ||
    (Array.isArray(payload) ? payload : []);

  if (Array.isArray(nodes)) {
    nodes.forEach((node) => {
      if (
        node &&
        node.level !== null &&
        node.level !== undefined &&
        !isNaN(node.level) &&
        node.level !== ""
      ) {
        levelSet.add(Number(node.level));
      }
    });
  }

  // 3. From children / sub_ibs recursive tree
  const scanTree = (item) => {
    if (!item || typeof item !== "object") return;
    if (
      item.level !== null &&
      item.level !== undefined &&
      !isNaN(item.level) &&
      item.level !== ""
    ) {
      levelSet.add(Number(item.level));
    }
    if (Array.isArray(item.sub_ibs)) {
      item.sub_ibs.forEach(scanTree);
    }
    if (Array.isArray(item.children)) {
      item.children.forEach(scanTree);
    }
  };

  scanTree(payload?.graph?.hierarchy || payload?.hierarchy || payload);

  if (levelSet.size === 0) {
    levelSet.add(0);
  }

  return Array.from(levelSet)
    .sort((a, b) => a - b)
    .map((lvl) => ({
      id: lvl,
      name: `Level ${lvl}`,
    }));
};

const mapDetailedOverviewResponse = (payload = {}) => {
  const data = payload?.data || payload || {};
  const rawSummary = data?.summary || {};
  const summary = rawSummary?.downline || rawSummary?.individual || rawSummary;

  // Check if data has summary structure: { total_accounts: { overall, real, copy_trading }, deposit, withdrawal }
  if (summary.total_accounts || summary.deposit || summary.withdrawal) {
    const acc = summary.total_accounts || {};
    const dep = summary.deposit || {};
    const withdr = summary.withdrawal || {};

    const totalAccounts =
      acc.overall ??
      acc.total ??
      Number(acc.real || 0) + Number(acc.copy_trading || acc.copy || 0);
    const totalDeposit =
      dep.overall ??
      dep.total ??
      Number(dep.real || 0) + Number(dep.copy_trading || dep.copy || 0);
    const totalWithdrawal =
      withdr.overall ??
      withdr.total ??
      Number(withdr.real || 0) + Number(withdr.copy_trading || withdr.copy || 0);

    return {
      total_accounts: totalAccounts,
      accounts_real: acc.real ?? 0,
      accounts_copy: acc.copy_trading ?? acc.copy ?? 0,

      total_deposit: totalDeposit,
      deposit_real: dep.real ?? 0,
      deposit_copy: dep.copy_trading ?? dep.copy ?? 0,

      total_withdrawal: totalWithdrawal,
      withdrawal_real: withdr.real ?? 0,
      withdrawal_copy: withdr.copy_trading ?? withdr.copy ?? 0,

      net_deposit: totalDeposit - totalWithdrawal,

      total_clients: summary.total_clients ?? rawSummary.total_clients ?? 0,
      total_sub_ibs: summary.total_sub_ibs ?? rawSummary.total_sub_ibs ?? 0,
    };
  }

  // Fallback for flat / real vs copy object structure
  const real = data?.real || {};
  const copy = data?.copy_trading || data?.copy || {};

  const totalAccounts =
    data.total_accounts ??
    (Number(real.accounts || 0) + Number(copy.accounts || 0));
  const totalDeposit =
    data.total_deposit ??
    (Number(real.total_deposit || 0) + Number(copy.total_deposit || 0));
  const totalWithdrawal =
    data.total_withdrawal ??
    (Number(real.total_withdrawal || 0) + Number(copy.total_withdrawal || 0));

  return {
    total_accounts: totalAccounts,
    accounts_real: data.accounts_real ?? (real.accounts || 0),
    accounts_copy: data.accounts_copy ?? (copy.accounts || 0),

    total_deposit: totalDeposit,
    deposit_real: data.deposit_real ?? (real.total_deposit || 0),
    deposit_copy: data.deposit_copy ?? (copy.total_deposit || 0),

    total_withdrawal: totalWithdrawal,
    withdrawal_real: data.withdrawal_real ?? (real.total_withdrawal || 0),
    withdrawal_copy: data.withdrawal_copy ?? (copy.total_withdrawal || 0),

    net_deposit: totalDeposit - totalWithdrawal,

    new_clients: data.new_clients ?? data?.summary?.new_clients ?? 0,
    opened_accounts:
      data.opened_accounts ?? data?.summary?.opened_accounts ?? 0,
    total_rebate: data.total_rebate ?? data?.summary?.total_rebate ?? 0,
  };
};

const mapOverallDistributionResponse = (payload = {}) => {
  const data = payload?.data || payload || {};
  const summary = data?.summary || {};

  // If payload has summary / overall / real vs copy distribution:
  if (summary.total_accounts || summary.deposit || summary.withdrawal) {
    const acc = summary.total_accounts || {};
    const dep = summary.deposit || {};
    const withdr = summary.withdrawal || {};

    const totalAccounts =
      acc.overall ??
      acc.total ??
      Number(acc.real || 0) + Number(acc.copy_trading || acc.copy || 0);
    const totalDeposit =
      dep.overall ??
      dep.total ??
      Number(dep.real || 0) + Number(dep.copy_trading || dep.copy || 0);
    const totalWithdrawal =
      withdr.overall ??
      withdr.total ??
      Number(withdr.real || 0) + Number(withdr.copy_trading || withdr.copy || 0);

    return {
      total_accounts: totalAccounts,
      accounts_real: acc.real ?? 0,
      accounts_copy: acc.copy_trading ?? acc.copy ?? 0,

      total_deposit: totalDeposit,
      deposit_real: dep.real ?? 0,
      deposit_copy: dep.copy_trading ?? dep.copy ?? 0,

      total_withdrawal: totalWithdrawal,
      withdrawal_real: withdr.real ?? 0,
      withdrawal_copy: withdr.copy_trading ?? withdr.copy ?? 0,

      net_deposit: totalDeposit - totalWithdrawal,

      total_clients: summary.total_clients ?? 0,
      total_sub_ibs: summary.total_sub_ibs ?? 0,
    };
  }

  // Fallback for real vs copy objects
  const real = data?.real || {};
  const copy = data?.copy_trading || data?.copy || {};

  const totalAccounts =
    data.total_accounts ??
    (Number(real.accounts || 0) + Number(copy.accounts || 0));
  const totalDeposit =
    data.total_deposit ??
    (Number(real.total_deposit || 0) + Number(copy.total_deposit || 0));
  const totalWithdrawal =
    data.total_withdrawal ??
    (Number(real.total_withdrawal || 0) + Number(copy.total_withdrawal || 0));

  return {
    total_accounts: totalAccounts,
    accounts_real: data.accounts_real ?? (real.accounts || 0),
    accounts_copy: data.accounts_copy ?? (copy.accounts || 0),

    total_deposit: totalDeposit,
    deposit_real: data.deposit_real ?? (real.total_deposit || 0),
    deposit_copy: data.deposit_copy ?? (copy.total_deposit || 0),

    total_withdrawal: totalWithdrawal,
    withdrawal_real: data.withdrawal_real ?? (real.total_withdrawal || 0),
    withdrawal_copy: data.withdrawal_copy ?? (copy.total_withdrawal || 0),

    net_deposit: totalDeposit - totalWithdrawal,

    new_clients: data.new_clients ?? data?.summary?.new_clients ?? 0,
    opened_accounts:
      data.opened_accounts ?? data?.summary?.opened_accounts ?? 0,
    total_rebate: data.total_rebate ?? data?.summary?.total_rebate ?? 0,
  };
};

const extractMetricValue = (point, selectedMetric = "withdrawal") => {
  if (!point) return 0;
  if (typeof point === "number") return point;

  let targetObj = null;
  if (selectedMetric === "withdrawal" || selectedMetric === "withdrawals") {
    targetObj = point.withdrawal ?? point.withdrawals;
  } else if (selectedMetric === "deposit" || selectedMetric === "deposits") {
    targetObj = point.deposits ?? point.deposit;
  } else if (selectedMetric === "accounts" || selectedMetric === "account") {
    targetObj = point.accounts ?? point.account;
  } else {
    targetObj = point[selectedMetric];
  }

  if (targetObj === undefined || targetObj === null) return 0;
  if (typeof targetObj === "number") return targetObj;
  if (typeof targetObj === "object") {
    if (targetObj.overall !== undefined) return Number(targetObj.overall || 0);
    if (targetObj.total !== undefined) return Number(targetObj.total || 0);
    const real = Number(targetObj.real || 0);
    const copy = Number(targetObj.copy_trading ?? targetObj.copy ?? 0);
    return real + copy;
  }
  return Number(targetObj) || 0;
};

const normalizeSeriesToMap = (seriesRaw) => {
  if (!seriesRaw) return {};
  const map = {};
  if (Array.isArray(seriesRaw)) {
    for (const item of seriesRaw) {
      if (item?.date) {
        map[item.date] = item;
      }
    }
  } else if (typeof seriesRaw === "object") {
    for (const [dateStr, val] of Object.entries(seriesRaw)) {
      if (val && typeof val === "object") {
        map[dateStr] = val;
      }
    }
  }
  return map;
};

const extractFieldBreakdown = (point) => {
  if (!point || typeof point !== "object") {
    return {
      deposits: { real: 0, copy: 0, overall: 0 },
      withdrawal: { real: 0, copy: 0, overall: 0 },
      accounts: { real: 0, copy: 0, overall: 0 },
    };
  }

  const dep = point.deposits || point.deposit || point.total_deposit || {};
  const withdr = point.withdrawal || point.withdrawals || point.total_withdrawal || {};
  const acc =
    point.accounts ||
    point.account ||
    point.total_accounts ||
    (point.accounts_real !== undefined || point.accounts_copy !== undefined
      ? { real: point.accounts_real, copy: point.accounts_copy }
      : {});

  const getSubValues = (obj) => {
    if (typeof obj === "number") {
      return { real: obj, copy: 0, overall: obj };
    }
    const real = Number(obj?.real || 0);
    const copy = Number(obj?.copy_trading ?? obj?.copy ?? 0);
    const overall = obj?.overall !== undefined ? Number(obj.overall) : real + copy;
    return { real, copy, overall };
  };

  return {
    deposits: getSubValues(dep),
    withdrawal: getSubValues(withdr),
    accounts: getSubValues(acc),
  };
};

const mapDetailedGraphToChart = (graphData = {}, selectedMetric = "withdrawal") => {
  const performanceChart =
    graphData?.performance_chart ||
    graphData?.performance ||
    (graphData?.downline || graphData?.individual ? graphData : {});

  const downlineRaw = performanceChart?.downline || [];
  const individualRaw = performanceChart?.individual || [];

  const downlineMap = normalizeSeriesToMap(downlineRaw);
  const individualMap = normalizeSeriesToMap(individualRaw);

  const allDates = Array.from(
    new Set([...Object.keys(downlineMap), ...Object.keys(individualMap)]),
  ).sort();

  if (allDates.length > 0) {
    return allDates.map((dateStr) => {
      const downlinePoint = downlineMap[dateStr];
      const individualPoint = individualMap[dateStr];

      const dateObj = new Date(dateStr);
      const isValidDate = !isNaN(dateObj.getTime());
      const label = isValidDate
        ? dateObj.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
        })
        : dateStr;

      return {
        date: dateStr,
        label,
        downline: extractMetricValue(downlinePoint, selectedMetric),
        individual: extractMetricValue(individualPoint, selectedMetric),
        downlineDetails: extractFieldBreakdown(downlinePoint),
        individualDetails: extractFieldBreakdown(individualPoint),
      };
    });
  }

  // Fallback if flat array
  if (Array.isArray(graphData)) {
    return graphData.map((point) => ({
      date: point.date || "",
      label: point.date
        ? new Date(point.date).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
        })
        : point.label || "",
      downline: point.downline ?? point.value ?? point.total ?? 0,
      individual: point.individual ?? 0,
      downlineDetails: extractFieldBreakdown(point),
      individualDetails: extractFieldBreakdown(point),
    }));
  }

  return [];
};

const mapLevelsFromSummary = (summaryData = {}) => {
  return Object.entries(summaryData)
    .map(([key, val]) => {
      const match = key.match(/level_(\d+)/);
      if (!match) return null;

      const id = Number(match[1]);

      return {
        id,
        name: `Level ${id}`,
        accounts: val.ib_count ?? 0,
        clients: val.client_count ?? 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.id - b.id);
};

const toRangeParams = (range) => {
  const [start, end] = range || [];

  const toISO = (d) => {
    if (!d) return null;
    if (typeof d === "string") return d.slice(0, 10);
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const start_date = toISO(start);
  const end_date = toISO(end);

  if (start_date && end_date) {
    return { start_date, end_date };
  }

  return {};
};

const toFromToRangeParams = (range) => {
  const [start, end] = range || [];

  const toISO = (d) => {
    if (!d) return null;
    if (typeof d === "string") return d.slice(0, 10);
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const from_date = toISO(start);
  const to_date = toISO(end);

  if (from_date && to_date) {
    return { from_date, to_date };
  }

  return {};
};

export const useMyNetworkIBStore = defineStore("ibNetwork", () => {
  const snackbar = useSnackbarStore();

  const summaryLoading = ref(false);
  const overviewLoading = ref(false);
  const loading = computed(() => summaryLoading.value || overviewLoading.value);
  const error = ref(null);

  // Filters
  const levels = ref([]);
  const selectedLevels = ref([]);
  const maxLevel = ref(5);
  const levelNodes = ref({
    clients: [],
    ibs: [],
    total_clients: 0,
    total_ibs: 0,
    total_nodes: 0,
  });
  const levelInfo = ref({
    max_level: 5,
    selected_level: null,
  });

  const summaryDateRange = ref([null, null]);
  const overviewDateRange = ref([null, null]);

  const networkTree = ref(null);

  const summary = ref({
    total_accounts: 0,
    accounts_real: 0,
    accounts_copy: 0,

    total_deposit: 0,
    deposit_real: 0,
    deposit_copy: 0,

    total_withdrawal: 0,
    withdrawal_real: 0,
    withdrawal_copy: 0,

    net_deposit: 0,
  });

  const overview = ref({
    total_accounts: 0,
    accounts_real: 0,
    accounts_copy: 0,

    total_deposit: 0,
    deposit_real: 0,
    deposit_copy: 0,

    total_withdrawal: 0,
    withdrawal_real: 0,
    withdrawal_copy: 0,

    net_deposit: 0,
  });

  const chart = ref([]);

  const fetchLevels = () => {
    overviewLoading.value = true;

    const successHandler = (res) => {
      const summaryData = res?.data?.summary || {};

      networkTree.value = res?.data?.data || res?.data || null;
      levels.value = mapLevelsFromSummary(summaryData);

      overviewLoading.value = false;
    };

    const failureHandler = (err) => {
      overviewLoading.value = false;
      error.value = err;

      snackbar.show(err?.message || "Failed to fetch network levels.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.ib.network, {
      isTokenRequired: true,

      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const fetchSummary = (range = summaryDateRange.value) => {
    summaryLoading.value = true;

    const successHandler = (res) => {
      summary.value = mapDepositResponse(res?.data);

      summaryLoading.value = false;
    };

    const failureHandler = (err) => {
      summaryLoading.value = false;
      error.value = err;

      snackbar.show(
        err?.message || "Failed to fetch network summary.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.ib.networkDeposits, {
      params: toRangeParams(range),
      isTokenRequired: true,

      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const fetchOverview = (payload = {}) => {
    const levelsToUse = payload.levels ?? selectedLevels.value;
    const rangeToUse = payload.range ?? overviewDateRange.value;

    overviewLoading.value = true;

    const successHandler = (res) => {
      overview.value = mapDepositResponse(res?.data);
      chart.value = mapGraphToChart(res?.data?.graph);

      overviewLoading.value = false;
    };

    const failureHandler = (err) => {
      overviewLoading.value = false;
      error.value = err;

      snackbar.show(
        err?.message || "Failed to fetch level wise overview.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.ib.networkDeposits, {
      params: {
        ...toRangeParams(rangeToUse),
        ...(levelsToUse.length ? { levels: levelsToUse.join(",") } : {}),
      },

      isTokenRequired: true,

      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const rawPerformance = ref({});

  const selectedNode = ref(null);

  const setChartMetric = (metricKey = "withdrawal") => {
    if (rawPerformance.value && Object.keys(rawPerformance.value).length > 0) {
      chart.value = mapDetailedGraphToChart(rawPerformance.value, metricKey);
    }
  };

  const fetchDetailedOverview = (payload = {}) => {
    const rangeToUse = payload.range ?? overviewDateRange.value;
    const metricToUse = payload.metric ?? "withdrawal";

    overviewLoading.value = true;

    const successHandler = (res) => {
      const payloadData = res?.data?.data || res?.data || {};
      const dynamicOverview = payloadData?.dynamic_level_overview || {};

      // 1. Dynamic level nodes (ibs with nested clients)
      const ibs = dynamicOverview.ibs || dynamicOverview.level_nodes?.ibs || payloadData.ibs || [];
      const clients = [];

      if (Array.isArray(ibs)) {
        ibs.forEach((ib) => {
          if (Array.isArray(ib.clients)) {
            clients.push(...ib.clients);
          }
        });
      }

      const topClients = dynamicOverview.clients || dynamicOverview.level_nodes?.clients || payloadData.clients || [];
      if (Array.isArray(topClients)) {
        topClients.forEach((tc) => {
          if (!clients.some((c) => (c.user_id && c.user_id === tc.user_id) || (c.email && c.email === tc.email))) {
            clients.push(tc);
          }
        });
      }

      if (ibs.length > 0 || clients.length > 0 || !payload.user_id) {
        levelNodes.value = {
          ibs,
          clients,
          total_clients: dynamicOverview.total_clients ?? clients.length,
          total_ibs: dynamicOverview.total_ibs ?? ibs.length,
          total_nodes: dynamicOverview.total_nodes ?? (ibs.length + clients.length),
        };
      }

      // 2. Level info
      if (dynamicOverview?.level_info) {
        levelInfo.value = dynamicOverview.level_info;
        if (dynamicOverview.level_info.max_level !== undefined) {
          maxLevel.value = dynamicOverview.level_info.max_level;
        }
      } else if (payloadData?.max_level !== undefined) {
        maxLevel.value = payloadData.max_level;
      }

      // 3. Extract dynamic levels from graph.hierarchy.nodes, max_level, and children
      const extractedLevels = extractLevelsFromHierarchyNodes(res);
      if (extractedLevels.length > 0) {
        levels.value = extractedLevels;
      } else if (maxLevel.value !== undefined) {
        const lvls = [];
        for (let i = 0; i <= maxLevel.value; i++) {
          lvls.push({ id: i, name: `Level ${i}` });
        }
        levels.value = lvls;
      }

      // 4. Save hierarchy tree
      networkTree.value =
        networkTree.value ||
        payloadData?.graph?.hierarchy ||
        payloadData?.hierarchy ||
        payloadData?.data ||
        res?.data?.graph?.hierarchy ||
        res?.data?.data ||
        null;

      if (payloadData?.selected_targets?.[0]) {
        selectedNode.value = payloadData.selected_targets[0];
      } else if (!selectedNode.value && networkTree.value) {
        selectedNode.value = networkTree.value;
      }

      // 5. Map overview values
      overview.value = mapDetailedOverviewResponse(payloadData);

      // 6. Map performance graph data
      const graphData =
        payloadData?.graph?.performance_chart ||
        payloadData?.graph?.performance ||
        payloadData?.graph ||
        payloadData?.chart ||
        res?.data?.graph?.performance_chart ||
        res?.data?.graph?.performance ||
        res?.data?.graph ||
        res?.data?.chart ||
        [];
      rawPerformance.value = graphData;
      chart.value = mapDetailedGraphToChart(graphData, metricToUse);

      overviewLoading.value = false;
    };

    const failureHandler = (err) => {
      overviewLoading.value = false;
      error.value = err;

      snackbar.show(
        err?.message || "Failed to fetch detailed network overview.",
        "error",
      );
    };

    // Query parameters: all filters (date, level, user_id, ib_id) go in query parameters
    const queryParams = {
      ...toFromToRangeParams(rangeToUse),
    };

    // If user_id is provided (IB or Client selected), send only user_id in params (omit level)
    if (payload.user_id !== undefined && payload.user_id !== null && payload.user_id !== "") {
      queryParams.user_id = Array.isArray(payload.user_id)
        ? payload.user_id.join(",")
        : payload.user_id;
    } else if (payload.client_id !== undefined && payload.client_id !== null && payload.client_id !== "") {
      queryParams.user_id = Array.isArray(payload.client_id)
        ? payload.client_id.join(",")
        : payload.client_id;
    } else if (payload.level !== undefined && payload.level !== null && payload.level !== "") {
      // Send level only when no IB/Client user_id is selected
      queryParams.level = Array.isArray(payload.level)
        ? payload.level.join(",")
        : payload.level;
    } else if (Array.isArray(payload.levels) && payload.levels.length > 0) {
      queryParams.level = payload.levels.join(",");
    }

    if (payload.ib_id !== undefined && payload.ib_id !== null && payload.ib_id !== "") {
      queryParams.ib_id = Array.isArray(payload.ib_id)
        ? payload.ib_id.join(",")
        : payload.ib_id;
    }

    apiRequest(urls.KEYS.POST, urls.ib.networkDetailedOverview, {
      params: queryParams,
      data: {},
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const fetchOverallDistribution = (range = summaryDateRange.value) => {
    summaryLoading.value = true;

    const successHandler = (res) => {
      const payloadData = res?.data?.data || res?.data || {};
      summary.value = mapOverallDistributionResponse(payloadData);
      summaryLoading.value = false;
    };

    const failureHandler = (err) => {
      summaryLoading.value = false;
      error.value = err;

      snackbar.show(
        err?.message || "Failed to fetch network overall distribution.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.ib.networkOverallDistribution, {
      params: toFromToRangeParams(range),
      isTokenRequired: true,

      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const reset = () => {
    summaryLoading.value = false;
    overviewLoading.value = false;
    error.value = null;

    levels.value = [];
    selectedLevels.value = [];

    summaryDateRange.value = [null, null];
    overviewDateRange.value = [null, null];

    networkTree.value = null;
    rawPerformance.value = {};

    summary.value = {
      total_accounts: 0,
      accounts_real: 0,
      accounts_copy: 0,
      total_deposit: 0,
      deposit_real: 0,
      deposit_copy: 0,
      total_withdrawal: 0,
      withdrawal_real: 0,
      withdrawal_copy: 0,
      net_deposit: 0,
    };

    overview.value = {
      total_accounts: 0,
      accounts_real: 0,
      accounts_copy: 0,
      total_deposit: 0,
      deposit_real: 0,
      deposit_copy: 0,
      total_withdrawal: 0,
      withdrawal_real: 0,
      withdrawal_copy: 0,
      net_deposit: 0,
    };

    chart.value = [];
  };

  return {
    loading,
    summaryLoading,
    overviewLoading,
    error,

    levels,
    selectedLevels,
    maxLevel,
    levelNodes,
    levelInfo,

    summaryDateRange,
    overviewDateRange,

    networkTree,
    selectedNode,
    rawPerformance,

    summary,
    overview,
    chart,

    fetchLevels,
    fetchSummary,
    fetchOverview,
    fetchDetailedOverview,
    fetchOverallDistribution,
    setChartMetric,

    reset,
  };
});
