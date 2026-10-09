import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/shared/snackbar";

export const useTicketsStore = defineStore("tickets", () => {
  // ─── State ─────────────────────────────────────────────
  const data = ref([]);
  const isLoading = ref(false);
  const actionLoading = ref(false);
  const error = ref(null);
  const isFetched = ref(false);

  const pagination = ref({
    page: 1,
    per_page: 10,
    total_items: 0,
    total_pages: 0,
  });

  const summary = ref({});
  const counts = ref({});

  const filters = ref({
    search: "",
    status: "",
    priority: "",
    from_date: "",
    to_date: "",
  });

  // Ticket Detail State
  const detail = ref(null);
  const detailLoading = ref(false);

  const snackbar = useSnackbarStore();

  // ─── Helpers ───────────────────────────────────────────
  const cleanFilters = (filterObj = {}) =>
    Object.fromEntries(
      Object.entries(filterObj).filter(
        ([, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined &&
          !Array.isArray(value)
      )
    );

  // ─── Fetch List ────────────────────────────────────────
  const fetchTickets = (force = false, page = 1, customFilters = null) => {
    if (isFetched.value && !force && !customFilters && page === pagination.value.page) return;

    isLoading.value = true;
    const activeFilters = customFilters || filters.value;

    const successHandler = (res) => {
      data.value = res?.data || res?.tickets || [];
      if (res?.pagination) {
        pagination.value = { ...pagination.value, ...res.pagination };
      }
      counts.value = res?.counts || {};
      summary.value = { ...(res?.summary || {}), ...(res?.counts || {}) };
      isLoading.value = false;
      isFetched.value = true;
    };

    const failureHandler = (err) => {
      isLoading.value = false;
      error.value = err;
      snackbar.show(err?.message || "Failed to load support tickets.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.tickets.list, {
      params: {
        page,
        per_page: pagination.value.per_page,
        ...cleanFilters(activeFilters),
      },
      isTokenRequired: true,
      cancelPrevious: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Create Ticket ─────────────────────────────────────
  const createTicket = (payload, onDone) => {
    actionLoading.value = true;

    const successHandler = (res) => {
      actionLoading.value = false;
      snackbar.show("Ticket created successfully.", "success");
      fetchTickets(true);
      onDone?.(res);
    };

    const failureHandler = (err) => {
      actionLoading.value = false;
      snackbar.show(err?.message || "Failed to create ticket.", "error");
    };

    const isFormData = payload instanceof FormData;

    apiRequest(urls.KEYS.POST, urls.tickets.create, {
      data: payload,
      formData: isFormData,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Fetch Ticket Detail ───────────────────────────────
  const fetchTicketDetail = (id, silent = false) => {
    if (!id) return;

    if (detail.value && String(detail.value.id) !== String(id)) {
      detail.value = null;
    }

    if (!detail.value && !silent) {
      detailLoading.value = true;
    }

    const successHandler = (res) => {
      const newData = res?.data || res?.ticket || res || null;
      if (detail.value && newData && String(detail.value.id) === String(newData.id)) {
        Object.assign(detail.value, newData);
      } else {
        detail.value = newData;
      }
      detailLoading.value = false;
    };

    const failureHandler = (err) => {
      detailLoading.value = false;
      snackbar.show(err?.message || "Failed to fetch ticket detail.", "error");
    };

    apiRequest(urls.KEYS.GET, urls.tickets.detail, {
      look_up_key: id,
      isTokenRequired: true,
      cancelPrevious: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Update Ticket Status ───────────────────────────────
  const updateTicketStatus = (id, payload, onDone) => {
    if (!id) return;

    actionLoading.value = true;

    const newStatus = typeof payload === "object" ? payload.status : payload;

    const successHandler = (res) => {
      actionLoading.value = false;
      if (detail.value && typeof detail.value === "object") {
        detail.value.status = newStatus;
        if (detail.value.ticket) detail.value.ticket.status = newStatus;
        if (detail.value.data) detail.value.data.status = newStatus;
      }
      snackbar.show("Ticket status updated.", "success");
      fetchTicketDetail(id, true);
      fetchTickets(true);
      onDone?.(res);
    };

    const failureHandler = (err) => {
      actionLoading.value = false;
      snackbar.show(err?.message || "Failed to update ticket status.", "error");
    };

    apiRequest(urls.KEYS.PATCH, urls.tickets.updateStatus, {
      look_up_key: id,
      data: typeof payload === "object" ? payload : { status: payload },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Add Comment / Reply ───────────────────────────────
  const addComment = (id, payload, onDone) => {
    if (!id) return;

    actionLoading.value = true;

    const commentText =
      typeof payload === "string"
        ? payload
        : payload?.comment || payload?.message || payload?.content || "";

    const requestBody = {
      comment: commentText,
      message: commentText,
    };

    const successHandler = (res) => {
      actionLoading.value = false;
      snackbar.show(res?.message || "Reply added successfully.", "success");
      onDone?.(res);
    };

    const failureHandler = (err) => {
      actionLoading.value = false;
      snackbar.show(err?.message || err?.error || "Failed to add reply.", "error");
    };

    apiRequest(urls.KEYS.POST, urls.tickets.comment, {
      look_up_key: id,
      data: requestBody,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Add Attachment ────────────────────────────────────
  const addAttachment = (id, formData, onDone) => {
    if (!id) return;

    actionLoading.value = true;

    const successHandler = (res) => {
      actionLoading.value = false;
      snackbar.show(res?.message || "Attachment uploaded successfully.", "success");
      onDone?.(res);
    };

    const failureHandler = (err) => {
      actionLoading.value = false;
      snackbar.show(err?.message || err?.error || "Failed to upload attachment.", "error");
    };

    apiRequest(urls.KEYS.POST, urls.tickets.attachment, {
      look_up_key: id,
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  // ─── Filter Actions ───────────────────────────────────
  const applyFilters = () => {
    fetchTickets(true, 1);
  };

  const changePage = (newPage) => {
    fetchTickets(true, newPage);
  };

  const resetFilters = () => {
    filters.value = {
      search: "",
      status: "",
      priority: "",
      from_date: "",
      to_date: "",
    };
    fetchTickets(true, 1);
  };

  // ─── Reset Store ───────────────────────────────────────
  const reset = () => {
    data.value = [];
    isLoading.value = false;
    actionLoading.value = false;
    error.value = null;
    isFetched.value = false;
    pagination.value = { page: 1, per_page: 10, total_items: 0, total_pages: 0 };
    summary.value = {};
    counts.value = {};
    filters.value = {
      search: "",
      status: "",
      priority: "",
      from_date: "",
      to_date: "",
    };
    detail.value = null;
    detailLoading.value = false;
  };

  return {
    data,
    isLoading,
    actionLoading,
    error,
    isFetched,
    pagination,
    counts,
    summary,
    filters,
    detail,
    detailLoading,

    fetchTickets,
    createTicket,
    fetchTicketDetail,
    updateTicketStatus,
    addComment,
    addAttachment,
    applyFilters,
    changePage,
    resetFilters,
    reset,
  };
});
