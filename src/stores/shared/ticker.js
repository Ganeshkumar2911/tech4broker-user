import { ref, computed } from "vue";
import authToken from "@/common/authToken";
import { defineStore } from "pinia";
import MatrixTicker from "@/utils/MatrixTicker";
import { useProfileStore } from "@/stores/shared/profile";
import { useNotificationsStore } from "@/stores/shared/notifications";

import useOrderStore from "@/stores/client/orders";
import usePositionsStore from "@/stores/client/positions";
import useDealsStore from "@/stores/client/deals";

export const useTickerStore = defineStore("tickers", () => {
  const profileStore = useProfileStore();

  let ticker = null;
  let wsStatus = false;

  const lastPrices = ref({});
  const tickerList = ref([]);

  const token = computed(() => authToken.getToken().accessToken);

  const isConnected = ref(false);

  /* ---------------- Cross Tab Logout ---------------- */
  const channel = new BroadcastChannel("my-channel");

  channel.addEventListener("message", (event) => {
    if (event.data?.type === "logout") {
      stopWebSocket();
    }
  });

  /* ---------------- Add Symbols ---------------- */
  function updateTickerList(data) {
    let newSymbols = [];

    for (let i = 0; i < data.length; i++) {
      let symbol = String(data[i]).trim();
      
      // Some backends or components might mistakenly uppercase `.Dec` to `.DEC`.
      // The websocket requires the exact case `.Dec` to function properly.
      if (symbol.endsWith(".DEC")) {
        symbol = symbol.replace(/\.DEC$/, ".Dec");
      }

      if (!tickerList.value.includes(symbol)) {
        tickerList.value.push(symbol);
        newSymbols.push(symbol);
      }
    }

    if (ticker && newSymbols.length > 0) {
      subscribe(profileStore.user?.user_id, newSymbols);
    }
  }

  /* ---------------- Handle Incoming Tick ---------------- */
  const onTicks = (tick) => {
    updateLastPrice(tick);
  };

  /* ---------------- Start WS ---------------- */
  const startWebSocket = () => {
    if (wsStatus) return;

    // ----- MOCK LIVE DATA GENERATOR -----
    // Start interval to generate random market ticks for tracked symbols
    if (typeof window !== 'undefined' && !window.mockTickerInterval) {
      const basePrices = {
        "XAUUSD": 2340.50, "EURUSD": 1.0850, "GBPUSD": 1.2650, 
        "USDJPY": 150.30, "AUDUSD": 0.6550, "AUDJPY": 98.40, 
        "USDCAD": 1.3500, "EURGBP": 0.8550, "EURCHF": 0.9800, 
        "USDCHF": 0.9000,
      };
      
      window.mockTickerInterval = setInterval(() => {
        tickerList.value.forEach(symbol => {
          let base = lastPrices.value[symbol]?.bid || basePrices[symbol] || 100;
          const fluctuation = (Math.random() - 0.5) * 0.001; 
          const newBid = base * (1 + fluctuation);
          const newAsk = newBid * 1.0001;
          
          updateLastPrice({
            symbol,
            bid: newBid,
            ask: newAsk,
            open: basePrices[symbol] || 100, 
            time: Date.now()
          });
        });
      }, 1500);
    }
    // ------------------------------------

    const notificationsStore = useNotificationsStore();

    ticker = new MatrixTicker({
      token: token.value,
      reconnect: true,
    });

    ticker.on("connect", () => {
      isConnected.value = true;
      console.log("WebSocket Connected");
      if (tickerList.value.length > 0) {
        subscribe(profileStore.user?.user_id, tickerList.value);
      }

      notificationsStore.fetchMyNotifications();
    });

    ticker.on("disconnect", () => {
      isConnected.value = false;

      console.log("WebSocket Disconnected");
    });

    ticker.on("kyc_completed", (data) => {
      profileStore.fetchUserProfile();
    });

    ticker.on("error", (err) => {
      console.error("WS Error:", err);
    });

    ticker.on("new_notification", (data) => {
      if (data) {
        notificationsStore.addNotification(data);
      }
    });

    /* ---------------- MAIN PRICE EVENT ---------------- */
    ticker.on("price_update", onTicks);

    /* ---------------- TRADE EVENTS ---------------- */

    // Helper to resolve account ID from event payload or fallback store
    const resolveAccountId = (data, fallbackAccount) => {
      return data?.trading_account_id || data?.tradingAccountId || data?.account_id || data?.account || fallbackAccount;
    };

    // 1. Market Fill / Trade Opened
    ticker.on("manual_trade_opened", (data) => {
      console.log("[WS Trade Event] manual_trade_opened:", data);
      const positionsStore = usePositionsStore();
      const dealsStore = useDealsStore();
      const orderStore = useOrderStore();
      const accId = resolveAccountId(data, orderStore.selectedAccount);
      if (accId) {
        // fetch open positions (open legs request: GET /trade-book/open-legs)
        positionsStore.fetchPositions(accId, true);
        dealsStore.fetchDeals(accId);
        orderStore.fetchPendingOrders(accId);
        orderStore.fetchOrders(accId);
      }
    });

    // 2. Pending Placed
    ticker.on("manual_trade_pending_placed", (data) => {
      console.log("[WS Trade Event] manual_trade_pending_placed:", data);
      const orderStore = useOrderStore();
      const accId = resolveAccountId(data, orderStore.selectedAccount);
      if (accId) {
        orderStore.fetchPendingOrders(accId);
        orderStore.fetchOrders(accId);
      }
    });

    // 3. Pending Modified
    ticker.on("manual_trade_pending_modified", (data) => {
      console.log("[WS Trade Event] manual_trade_pending_modified:", data);
      const orderStore = useOrderStore();
      const accId = resolveAccountId(data, orderStore.selectedAccount);
      if (accId) {
        orderStore.fetchPendingOrders(accId);
        orderStore.fetchOrders(accId);
      }
    });

    // 4. Pending Canceled
    ticker.on("manual_trade_pending_canceled", (data) => {
      console.log("[WS Trade Event] manual_trade_pending_canceled:", data);
      const orderStore = useOrderStore();
      const accId = resolveAccountId(data, orderStore.selectedAccount);
      if (accId) {
        orderStore.fetchPendingOrders(accId);
        orderStore.fetchOrders(accId);
      }
    });

    // 5. Position SL/TP Modified
    ticker.on("manual_trade_sltp_modified", (data) => {
      console.log("[WS Trade Event] manual_trade_sltp_modified:", data);
      const positionsStore = usePositionsStore();
      const orderStore = useOrderStore();
      const accId = resolveAccountId(data, orderStore.selectedAccount);
      if (accId) {
        positionsStore.fetchPositions(accId, true);
      }
    });

    // 6. Position Closed (including close-all)
    ticker.on("manual_trade_closed", (data) => {
      console.log("[WS Trade Event] manual_trade_closed:", data);
      const positionsStore = usePositionsStore();
      const dealsStore = useDealsStore();
      const orderStore = useOrderStore();
      const accId = resolveAccountId(data, orderStore.selectedAccount);
      if (accId) {
        positionsStore.fetchPositions(accId, true);
        positionsStore.fetchClosedPositions(accId, true);
        dealsStore.fetchDeals(accId);
        orderStore.fetchOrders(accId);
      }
    });

    wsStatus = true;
  };

  /* ---------------- Stop WS ---------------- */
  const stopWebSocket = () => {
    if (!ticker) return;

    ticker.disconnect();

    ticker = null;

    wsStatus = false;

    isConnected.value = false;
  };

  /* ---------------- Subscribe ---------------- */
  const subscribe = (id, symbols = tickerList.value) => {
    if (ticker && symbols.length > 0) {
      ticker.subscribe(symbols, id);
    }
  };

  /* ---------------- Unsubscribe ---------------- */
  const unsubscribe = (symbols) => {
    if (ticker) {
      ticker.unsubscribe(symbols);
    }
  };

  /* ---------------- Update Latest Price ---------------- */
  function updateLastPrice(data) {
    const symbol = data.symbol;
    if (!symbol) return;

    const prev = lastPrices.value[symbol];
    const currentBid = data.bid != null ? Number(data.bid) : null;

    let initialBid = prev?.initialBid ?? data.open ?? data.prev_close ?? data.prevClose ?? currentBid;
    const prevBid = prev?.bid != null ? Number(prev.bid) : currentBid;

    lastPrices.value[symbol] = {
      symbol: data.symbol,
      bid: data.bid,
      ask: data.ask,
      last: data.last,
      time: data.time,
      contract: data.contract_size,
      digits: data.digits ?? data.precision ?? prev?.digits,
      spread: data.spread ?? prev?.spread,
      open: data.open ?? prev?.open ?? initialBid,
      prevClose: data.prev_close ?? data.prevClose ?? prev?.prevClose,
      prevBid: prevBid,
      initialBid: initialBid,
      change: data.change ?? data.price_change ?? prev?.change,
      changePercent: data.change_percent ?? data.changePercent ?? data.percent_change ?? prev?.changePercent,
      dir: data.dir ?? data.direction,
    };
  }

  /* ---------------- Get Last Price ---------------- */
  function getLastPrice(symbol) {
    if (!symbol) return null;
    if (lastPrices.value[symbol]) return lastPrices.value[symbol];
    const upperSym = String(symbol).toUpperCase();
    if (lastPrices.value[upperSym]) return lastPrices.value[upperSym];
    const cleanSym = String(symbol).replace(/[^A-Za-z0-9]/g, "");
    if (lastPrices.value[cleanSym]) return lastPrices.value[cleanSym];
    const upperClean = cleanSym.toUpperCase();
    if (lastPrices.value[upperClean]) return lastPrices.value[upperClean];
    return null;
  }

  return {
    startWebSocket,
    stopWebSocket,

    subscribe,
    unsubscribe,

    updateTickerList,

    updateLastPrice,
    getLastPrice,

    lastPrices,
    tickerList,

    isConnected,
  };
});
