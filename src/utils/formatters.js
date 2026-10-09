// Formats an API date string (e.g. "Mon, 15 Jun 2026 00:40:33 GMT") into
// separate date/time parts for compact table display.
export const formatDateTime = (value) => {
    console.log(value)
  if (!value) return { date: '—', time: '' }

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { date: '—', time: '' }

  const date = d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return { date, time }
}

export const formatNumber = (value, options = {}) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return value
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3, ...options })
}

export const formatBrokerCurrency = (currency) => {
  const normalizedCurrency = String(currency || "").toUpperCase();
  const currencySymbols = {
    USD: "$",
    USC: "¢",
    CENT: "¢",
    CAD: "C$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AED: "AED",
  };
  return currencySymbols[normalizedCurrency] || normalizedCurrency || "$";
};

export const getFormattedBalance = (a) => {
  if (!a) return "";
  const cur =
    a.account?.broker_currency ||
    a.account?.currency ||
    a.broker_currency ||
    a.currency ||
    "USD";
  const symbol = formatBrokerCurrency(cur);
  const rawBal =
    a.metrics?.balance !== undefined
      ? a.metrics.balance
      : a.balance !== undefined
      ? a.balance
      : a.account?.balance !== undefined
      ? a.account.balance
      : 0;
  const balanceNum = Number(rawBal || 0);

  let formattedNum = balanceNum.toString();
  if (balanceNum !== 0 && balanceNum % 1 !== 0) {
    formattedNum = balanceNum.toFixed(2);
  } else if (balanceNum === 0 && (cur === "USD" || cur === "EUR" || cur === "GBP")) {
    formattedNum = "0.00";
  }

  if (symbol && symbol !== cur && symbol !== "USD") {
    return `${symbol} ${formattedNum} ${cur}`;
  } else if (symbol === "$" || cur === "USD") {
    return `$ ${formattedNum} ${cur}`;
  }
  return `${formattedNum} ${cur}`;
};

export const buildAccountOption = (a) => {
  if (!a) return null;
  const acc = a.account || a;
  const accNo = acc.account_number || a.login || acc.login || a.account_number || acc.id || a.id;
  const balanceStr = getFormattedBalance(a);
  const id = acc.id !== undefined ? acc.id : a.id;

  const tradingType = String(acc.trading_type || a.trading_type || "").toLowerCase();
  const accountType = String(acc.account_type || a.account_type || "").toLowerCase();

  let typeLabel = "MT5 Account";
  if (tradingType === "copy_trading" || accountType === "copy_trading") {
    typeLabel = "CT Account";
  } else if (accountType === "demo" || tradingType === "demo") {
    typeLabel = "MT5 Demo Account";
  } else if (tradingType === "real" || accountType === "live") {
    typeLabel = "MT5 Account";
  } else if (acc.platform || a.platform) {
    typeLabel = `${acc.platform || a.platform} Account`;
  }

  const parts = [accNo];
  if (balanceStr) parts.push(balanceStr);
  if (typeLabel) parts.push(typeLabel);

  return {
    label: parts.join(" - "),
    value: id,
    raw: a,
  };
};

export const formatFollowers = (value) => {
  const num = Number(value ?? 0);
  if (isNaN(num)) return "0";
  return num >= 1000 ? (num / 1000).toFixed(1) + "k" : String(num);
};

export const convertPaymentAmount = (baseAmount, conversionRate) => {
  if (baseAmount === undefined || baseAmount === null) return 0;
  const num = Number(baseAmount);
  if (!Number.isFinite(num)) return 0;
  if (!conversionRate) return num;

  const paymentCurrency = String(conversionRate.payment_currency || "USD").toUpperCase();
  const unitsPerUsd = Number(conversionRate.units_per_usd || 0);
  const rateToUsd = Number(conversionRate.rate_to_usd || 0);

  if (paymentCurrency !== "USD") {
    if (unitsPerUsd > 0) {
      return num * unitsPerUsd;
    }
    if (rateToUsd > 0) {
      return num / rateToUsd;
    }
  }
  return num;
};

export const formatPaymentAmount = (baseAmount, conversionRate, options = {}) => {
  const converted = convertPaymentAmount(baseAmount, conversionRate);
  if (!Number.isFinite(converted)) return "0";
  if (Number.isInteger(converted)) {
    return options.useGrouping !== false
      ? converted.toLocaleString("en-US")
      : String(converted);
  }
  return converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
};
