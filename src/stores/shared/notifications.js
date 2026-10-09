import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import notificationSound from "@/assets/notification.wav";

export const useNotificationsStore = defineStore("notifications", () => {
  const myNotifications = ref([]);
  const adminNotifications = ref([]);
  const myLoading = ref(false);
  const adminLoading = ref(false);
  const createLoading = ref(false);
  const isMyFetched = ref(false);
  const isAdminFetched = ref(false);

  const myPagination = ref({
    current_page: 1,
    pages: 1,
    per_page: 10,
    total: 0,
    hasMore: false,
  });
  const loadingMore = ref(false);

  const snackbar = useSnackbarStore();

  // ─── Preload & Unlock Notification Sound ───────────────────────────
  let notificationAudio = null;
  let audioContext = null;

  if (typeof window !== "undefined") {
    try {
      notificationAudio = new Audio(notificationSound);
      notificationAudio.volume = 1.0;
    } catch (e) {}

    const unlockAudio = () => {
      if (notificationAudio) {
        notificationAudio
          .play()
          .then(() => {
            notificationAudio.pause();
            notificationAudio.currentTime = 0;
          })
          .catch(() => {});
      }
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (!audioContext) audioContext = new AudioCtx();
          if (audioContext.state === "suspended") audioContext.resume();
        }
      } catch (e) {}

      ["click", "keydown", "pointerdown", "touchstart"].forEach((evt) => {
        window.removeEventListener(evt, unlockAudio);
      });
    };

    ["click", "keydown", "pointerdown", "touchstart"].forEach((evt) => {
      window.addEventListener(evt, unlockAudio, { once: true });
    });
  }

  const playBeepFallback = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContext || new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Web Audio fallback error:", e);
    }
  };

  const playNotificationSound = () => {
    console.log("🔊 Playing notification sound...");
    try {
      if (!notificationAudio) {
        notificationAudio = new Audio(notificationSound);
        notificationAudio.volume = 1.0;
      }
      notificationAudio.currentTime = 0;
      const p = notificationAudio.play();
      if (p !== undefined) {
        p.then(() => {
          console.log("✅ Notification audio played successfully");
        }).catch((err) => {
          console.warn(
            "HTML5 audio playback blocked, using Web Audio chime:",
            err,
          );
          playBeepFallback();
        });
      }
    } catch (err) {
      console.warn("Audio exception, using Web Audio chime:", err);
      playBeepFallback();
    }
  };

  // Computed unread count for current user
  const unreadCount = computed(() => {
    return myNotifications?.value?.filter((n) => !n.is_read).length;
  });

  // ─── Fetch Logged-in User's Notifications ─────────────────────────
  const fetchMyNotifications = (force = false, page = 1) => {
    if (myLoading.value || loadingMore.value) return;
    if (isMyFetched.value && !force && page === 1) return;

    if (page === 1) {
      myLoading.value = true;
    } else {
      loadingMore.value = true;
    }

    const successHandler = (res) => {
      let list = [];
      if (Array.isArray(res)) {
        list = res;
        myPagination.value = {
          current_page: 1,
          pages: 1,
          per_page: list.length,
          total: list.length,
          hasMore: false,
        };
      } else if (res && typeof res === "object") {
        list = Array.isArray(res.data) ? res.data : [];
        const currentPage = Number(res.current_page ?? page);
        const totalPages = Number(res.pages ?? 1);
        myPagination.value = {
          current_page: currentPage,
          pages: totalPages,
          per_page: Number(res.per_page ?? 10),
          total: Number(res.total ?? list.length),
          hasMore: currentPage < totalPages,
        };
      }

      if (page === 1) {
        myNotifications.value = list;
      } else {
        const existingIds = new Set(myNotifications.value.map((n) => n.id));
        const newItems = list.filter((n) => !existingIds.has(n.id));
        myNotifications.value = [...myNotifications.value, ...newItems];
      }

      myLoading.value = false;
      loadingMore.value = false;
      isMyFetched.value = true;
    };

    const failureHandler = (err) => {
      myLoading.value = false;
      loadingMore.value = false;
    };

    apiRequest(urls.KEYS.GET, urls.notifications.myNotifications, {
      params: { page },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const loadMoreMyNotifications = () => {
    if (!myPagination.value.hasMore || loadingMore.value || myLoading.value)
      return;
    const nextPage = myPagination.value.current_page + 1;
    fetchMyNotifications(true, nextPage);
  };

  // ─── Fetch Admin Historical Notification List ──────────────────────
  const fetchAdminNotifications = (force = false) => {
    if (adminLoading.value) return;
    if (isAdminFetched.value && !force) return;

    adminLoading.value = true;

    const successHandler = (res) => {
      const list = Array.isArray(res) ? res : res?.data || [];
      adminNotifications.value = list;
      adminLoading.value = false;
      isAdminFetched.value = true;
    };

    const failureHandler = (err) => {
      adminLoading.value = false;
      snackbar.show(
        err?.message || "Failed to fetch system notifications.",
        "error",
      );
    };

    apiRequest(urls.KEYS.GET, urls.notifications.adminList, {
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Add Single Notification from WebSocket ───────────────────────
  const addNotification = (data) => {
    console.log("🔔 WebSocket received new_notification:", data);
    playNotificationSound();

    if (!data) return;
    const item = Array.isArray(data)
      ? data[0]
      : typeof data === "object"
        ? data
        : null;

    if (!item) return;

    // Avoid duplicate entries if already present
    const exists =
      item.id && myNotifications.value.some((n) => n.id === item.id);
    if (!exists) {
      myNotifications.value.unshift({
        ...item,
        is_read: item.is_read ?? false,
      });
      myPagination.value.total += 1;
    }
  };

  // ─── Mark Notification as Read ────────────────────────────────────
  const markAsRead = (notificationIds) => {
    if (!notificationIds) return;
    const ids = Array.isArray(notificationIds)
      ? notificationIds
      : [notificationIds];
    if (ids.length === 0) return;

    const targetItems = myNotifications.value.filter(
      (n) => ids.includes(n.id) && !n.is_read,
    );
    if (targetItems.length === 0) return;

    // Optimistic update
    const prevStates = targetItems.map((item) => ({
      item,
      is_read: item.is_read,
      read_at: item.read_at,
    }));

    targetItems.forEach((item) => {
      item.is_read = true;
      item.read_at = new Date().toISOString();
    });

    const successHandler = () => {
      // Successfully marked as read on server
    };

    const failureHandler = () => {
      // Revert if API fails
      prevStates.forEach(({ item, is_read, read_at }) => {
        item.is_read = is_read;
        item.read_at = read_at;
      });
    };

    apiRequest(urls.KEYS.PUT, urls.notifications.markRead, {
      data: { notification_ids: ids },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Mark All Unread Notifications as Read ─────────────────────────
  const markAllAsRead = () => {
    // const unreadItems = myNotifications.value.filter((n) => !n.is_read);
    // // unreadItems.forEach((n) => markAsRead(n.id));
    // const ids = unreadItems.map((n) => n.id);
    // markAsRead(ids);

    const unreadIds = myNotifications.value
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  // ─── Create & Dispatch Notification (Admin) ─────────────────────────
  const createNotification = (payload, onDone) => {
    createLoading.value = true;

    const successHandler = (res) => {
      createLoading.value = false;
      snackbar.show(
        res?.msg || "Notification created & dispatched successfully.",
        "success",
      );
      fetchAdminNotifications(true);
      fetchMyNotifications(true);
      if (onDone) onDone();
    };

    const failureHandler = (err) => {
      createLoading.value = false;
      snackbar.show(err?.message || "Failed to create notification.", "error");
    };

    apiRequest(urls.KEYS.POST, urls.notifications.create, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  const sendLoadingId = ref(null);

  // ─── Trigger / Activate Notification (Admin PUT /notifications/send/<id>) ──
  const sendNotification = (id, onDone) => {
    sendLoadingId.value = id;

    const successHandler = (res) => {
      sendLoadingId.value = null;
      snackbar.show(
        res?.msg || "Notification activated & sent successfully.",
        "success",
      );
      const found = adminNotifications.value.find((n) => n.id === id);
      if (found) {
        found.is_active = true;
      }
      fetchAdminNotifications(true);
      fetchMyNotifications(true);
      if (onDone) onDone();
    };

    const failureHandler = (err) => {
      sendLoadingId.value = null;
      snackbar.show(err?.message || "Failed to send notification.", "error");
    };

    apiRequest(urls.KEYS.PUT, `${urls.notifications.send}/${id}`, {
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  return {
    myNotifications,
    adminNotifications,
    myLoading,
    loadingMore,
    adminLoading,
    createLoading,
    sendLoadingId,
    unreadCount,
    myPagination,
    fetchMyNotifications,
    loadMoreMyNotifications,
    fetchAdminNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    createNotification,
    sendNotification,
    playNotificationSound,
  };
});
