import { io } from "socket.io-client";

class MatrixTicker {
  constructor({ token, reconnect = true, max_retry = 50, max_delay = 60 }) {
    const customBaseUrl = localStorage.getItem("custom_base_url");

    if (customBaseUrl && customBaseUrl.trim()) {
      let cleanUrl = customBaseUrl.trim().replace(/\/+$/, "");
      cleanUrl = cleanUrl.replace(/\/(client|fm|ib)$/, "");
      this.root = cleanUrl;
    } else {
      this.root = "https://portal.panthercapitals.com/";
    }

    this.token = token;

    this.auto_reconnect = reconnect;
    this.reconnect_max_tries = max_retry;
    this.reconnect_max_delay = max_delay;

    this.ws = null;

    this.triggers = {
      connect: [],
      disconnect: [],
      error: [],

      price_update: [],

      superadmin_test: [],
      new_client: [],
      kyc_completed: [],
      new_broker: [],
      payment_received: [],
      settlement: [],

      // newly added
      new_user_registered: [],
      new_deposit: [],
      new_withdrawal: [],
      new_notification: [],
    };

    this.current_reconnection_count = 0;
    this.last_reconnect_interval = 0;

    this.connect();
  }

  /* ---------------- Connect ---------------- */
  connect() {
    if (this.ws) return;

    const url = `${this.root}?token=${this.token}`;

    this.ws = io(url, {
      transports: ["websocket"],
      reconnection: false,
    });

    this.ws.on("connect", () => {
      console.log("Socket connected");

      this.current_reconnection_count = 0;

      this.trigger("connect");
    });

    this.ws.on("disconnect", (reason) => {
      console.log("Socket disconnected");

      this.trigger("disconnect", [reason]);

      // IMPORTANT: clear the websocket instance so reconnect() can create a new one
      const oldWs = this.ws;
      this.ws = null;
      if (oldWs) {
        oldWs.removeAllListeners();
      }

      if (this.auto_reconnect) {
        this.reconnect();
      }
    });

    this.ws.on("connect_error", (err) => {
      console.error("Socket error:", err);

      this.trigger("error", [err]);

      // IMPORTANT: clear the websocket instance so reconnect() can create a new one
      const oldWs = this.ws;
      this.ws = null;
      if (oldWs) {
        oldWs.removeAllListeners();
      }

      if (this.auto_reconnect) {
        this.reconnect();
      }
    });

    /* ---------------- PRICE UPDATE ---------------- */
    this.ws.on("price_update", (data) => {
      this.trigger("price_update", [data]);
    });

    /* ---------------- OTHER EVENTS ---------------- */
    this.ws.on("superadmin_test", (data) => {
      this.trigger("superadmin_test", [data]);
    });

    this.ws.on("kyc_completed", (data) => {
      this.trigger("kyc_completed", [data]);
    });

    this.ws.on("new_client", (data) => {
      this.trigger("new_client", [data]);
    });

    this.ws.on("kyc_uploaded", (data) => {
      this.trigger("kyc_uploaded", [data]);
    });

    this.ws.on("new_broker", (data) => {
      this.trigger("new_broker", [data]);
    });

    this.ws.on("payment_received", (data) => {
      this.trigger("payment_received", [data]);
    });

    this.ws.on("settlement", (data) => {
      this.trigger("settlement", [data]);
    });

    this.ws.on("new_user_registered", (data) => {
      this.trigger("new_user_registered", [data]);
    });

    this.ws.on("new_deposit", (data) => {
      this.trigger("new_deposit", [data]);
    });

    this.ws.on("new_withdrawal", (data) => {
      this.trigger("new_withdrawal", [data]);
    });

    this.ws.on("new_notification", (data) => {
      this.trigger("new_notification", [data]);
    });

    /* ---------------- TRADE EVENTS ---------------- */
    this.ws.on("manual_trade_opened", (data) => {
      this.trigger("manual_trade_opened", [data]);
    });

    this.ws.on("manual_trade_pending_placed", (data) => {
      this.trigger("manual_trade_pending_placed", [data]);
    });

    this.ws.on("manual_trade_pending_modified", (data) => {
      this.trigger("manual_trade_pending_modified", [data]);
    });

    this.ws.on("manual_trade_pending_canceled", (data) => {
      this.trigger("manual_trade_pending_canceled", [data]);
    });

    this.ws.on("manual_trade_sltp_modified", (data) => {
      this.trigger("manual_trade_sltp_modified", [data]);
    });

    this.ws.on("manual_trade_closed", (data) => {
      this.trigger("manual_trade_closed", [data]);
    });

    /* ---------------- CATCH-ALL EVENT FORWARDING ---------------- */
    this.ws.onAny((event, ...args) => {
      const explicitEvents = [
        "connect", "disconnect", "connect_error", "error",
        "price_update", "superadmin_test", "kyc_completed", "new_client",
        "kyc_uploaded", "new_broker", "payment_received", "settlement",
        "new_user_registered", "new_deposit", "new_withdrawal", "new_notification",
        "manual_trade_opened", "manual_trade_pending_placed", "manual_trade_pending_modified",
        "manual_trade_pending_canceled", "manual_trade_sltp_modified", "manual_trade_closed"
      ];
      if (!explicitEvents.includes(event)) {
        this.trigger(event, args);
      }
    });
  }

  /* ---------------- Disconnect ---------------- */
  disconnect() {
    if (!this.ws) return;

    this.auto_reconnect = false;

    this.ws.disconnect();

    this.ws = null;
  }

  /* ---------------- Event Binding ---------------- */
  on(event, callback) {
    if (!this.triggers[event]) {
      this.triggers[event] = [];
    }

    this.triggers[event].push(callback);
  }

  trigger(event, args = []) {
    this.triggers[event]?.forEach((cb) => cb(...args));
  }

  /* ---------------- Subscribe ---------------- */
  subscribe(symbols, id) {
    if (this.ws && symbols.length > 0) {
      this.ws.emit("subscribe_symbol", {
        symbol: symbols,
        user_id: id,
      });
    }
  }

  unsubscribe(symbols, id) {
    if (this.ws) {
      this.ws.emit("unsubscribe", {
        symbol: symbols,
        user_id: id,
      });
    }
  }

  /* ---------------- Reconnect ---------------- */
  reconnect() {
    if (this.current_reconnection_count > this.reconnect_max_tries) {
      return;
    }

    this.last_reconnect_interval = Math.min(
      2 ** this.current_reconnection_count,
      this.reconnect_max_delay,
    );

    this.current_reconnection_count++;

    setTimeout(() => {
      this.connect();
    }, this.last_reconnect_interval * 1000);
  }
}

export default MatrixTicker;
