<template>
  <div class="space-y-6">
    <!-- Title & Action Bar (Hidden) -->
    <!-- <div class="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
      <div>
        <h1 class="text-2xl font-bold text-primary-text">Tickets</h1>
        <p class="text-xs text-secondary-text mt-0.5">
          Raise and manage support tickets to connect with our team.
        </p>
      </div>
    </div> -->

    <!-- Top Stats Card (Single Card with Vertical Dividers matching UI) -->
    <div id="tour-tickets-stats" class="bg-card-background border-0 shadow-none rounded-2xl p-4 sm:p-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-0 divide-y sm:divide-y-0 lg:divide-x divide-primary-border">
        <!-- Metric 1: New Tickets -->
        <div class="flex items-center gap-3 pb-4 sm:pb-0 lg:pr-6">
          <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
            <img :src="newIcon" alt="New Tickets" class="w-full h-full object-contain dark:brightness-0 dark:invert transition-all" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-xs font-semibold text-secondary-text truncate">New Tickets</p>
              <Tooltip text="Newly created support tickets" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums">
              {{ store.counts?.new_tickets ?? 0 }}
            </h3>
          </div>
        </div>

        <!-- Metric 2: Open Tickets -->
        <div class="flex items-center gap-3 py-4 sm:py-0 lg:px-6">
          <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
            <img :src="openIcon" alt="Open Tickets" class="w-full h-full object-contain dark:brightness-0 dark:invert transition-all" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-xs font-semibold text-secondary-text truncate">Open Tickets</p>
              <Tooltip text="Currently open and awaiting resolution" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums">
              {{ store.counts?.open_tickets ?? 0 }}
            </h3>
          </div>
        </div>

        <!-- Metric 3: Solved Ticket -->
        <div class="flex items-center gap-3 py-4 sm:py-0 lg:px-6">
          <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
            <img :src="solvedIcon" alt="Solved Tickets" class="w-full h-full object-contain dark:brightness-0 dark:invert transition-all" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-xs font-semibold text-secondary-text truncate">Solved / Closed</p>
              <Tooltip text="Resolved or closed support tickets" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums">
              {{ store.counts?.closed_tickets ?? 0 }}
            </h3>
          </div>
        </div>

        <!-- Metric 4: Total Tickets -->
        <div class="flex items-center gap-3 pt-4 sm:pt-0 lg:pl-6">
          <div class="w-13.5 h-13.5 p-3 rounded-[15px] bg-background border-0 shadow-none flex items-center justify-center shrink-0">
            <img :src="totalIcon" alt="Total Tickets" class="w-full h-full object-contain dark:brightness-0 dark:invert transition-all" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-xs font-semibold text-secondary-text truncate">Total Tickets</p>
              <Tooltip text="Total tickets submitted across all time" position="top" wrap>
                <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
              </Tooltip>
            </div>
            <h3 class="text-2xl font-bold text-primary-text mt-0.5 font-mono tabular-nums">
              {{ store.counts?.total_tickets ?? 0 }}
            </h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & Search Toolbar (Outside DataTable) -->
    <div id="tour-tickets-filters" class="mt-6 flex flex-wrap items-center gap-3">
      <!-- Search with ticket ID -->
      <BaseSearch
        v-model="store.filters.search"
        placeholder="Search with ticket ID..."
        container-class="w-full sm:w-60"
        @update:modelValue="debounceSearch"
      />

      <!-- Status Select -->
      <div class="w-full sm:w-36">
        <BaseSelect
          v-model="store.filters.status"
          :options="statusOptions"
          placeholder="Status"
          borderless
          rounded="full"
          @update:modelValue="store.applyFilters()"
        />
      </div>

      <!-- Priority Select -->
      <div class="w-full sm:w-36">
        <BaseSelect
          v-model="store.filters.priority"
          :options="priorityOptions"
          placeholder="Priority"
          borderless
          rounded="full"
          @update:modelValue="store.applyFilters()"
        />
      </div>

      <!-- Date Range Picker & Refresh Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full sm:w-auto sm:flex-1">
        <div class="flex-1 sm:w-auto min-w-0 sm:min-w-50">
          <BaseDateRangePicker
            borderless
            v-model="localDateRange"
            @update:modelValue="handleDateRangeChange"
          />
        </div>

        <div class="flex items-center gap-2 shrink-0 sm:ml-auto">
          <button
            v-if="hasActiveFilters"
            @click="handleResetFilters"
            class="rounded-full px-4 py-2 text-xs font-medium text-secondary-text hover:bg-background hover:text-primary-text transition-colors cursor-pointer border border-primary-border shrink-0"
          >
            Clear
          </button>

          <button
            id="tour-tickets-create-btn"
            @click="showCreateModal = true"
            class="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full bg-button text-button-text font-semibold text-xs transition-all hover:brightness-110 cursor-pointer shrink-0"
          >
            <Plus class="w-4 h-4 text-button-text" />
            <span>Create Ticket</span>
          </button>

          <Tooltip text="Refresh Tickets" position="left">
            <RefreshButton
              :loading="store.isLoading"
              @click="handleRefresh"
            />
          </Tooltip>
        </div>
      </div>
    </div>

    <!-- Data Table Container -->
    <div id="tour-tickets-table" class="overflow-hidden rounded-[28px] bg-card-background border-0 shadow-none">
      <DataTable
        :columns="columns"
        :rows="store.data"
        :loading="store.isLoading"
        :skeleton-rows="6"
        row-key="id"
        :page="store.pagination.page"
        :total-pages="store.pagination.total_pages"
        @update:page="store.changePage"
        clickable-rows
        @row-click="handleRowClick"
      >
        <!-- Custom Ticket ID Cell -->
        <template #cell-ticket_id="{ row }">
          <span
            class="font-bold underline text-primary-text hover:opacity-80 transition-opacity"
          >
            #{{ formatTicketCode(row) }}
          </span>
        </template>

        <!-- Custom Subject Cell -->
        <template #cell-subject="{ row }">
          <span class="font-medium text-primary-text max-w-xs truncate block" :title="row.subject || row.title">
            {{ row.subject || row.title || "—" }}
          </span>
        </template>

        <!-- Custom Priority Cell -->
        <template #cell-priority="{ row }">
          <BaseBadge :value="row.priority" />
        </template>

        <!-- Custom Status Cell -->
        <template #cell-status="{ row }">
          <BaseBadge :value="row.status" />
        </template>

        <!-- Custom Date Cell -->
        <template #cell-created_at="{ row }">
          <span class="text-secondary-text text-xs">
            {{ formatDateString(row.created_at || row.date) }}
          </span>
        </template>

        <!-- Custom Actions Cell -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end">
            <Tooltip text="View Ticket Details" position="left">
              <button
                class="p-1.5 rounded-full hover:bg-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
                aria-label="View Ticket Details"
              >
                <Eye class="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </template>

        <!-- Empty State -->
        <template #empty>
          <EmptyState
            class="py-12"
            title="No Tickets Found"
            subtitle="You don't have any support tickets matching your search."
          />
        </template>
      </DataTable>
    </div>

    <!-- Create Ticket Modal -->
    <CreateTicketModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleRefresh"
    />

    <!-- Accounts Disclaimer -->
    <AccountsDisclaimer class="mt-10" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Ticket,
  Info,
} from "lucide-vue-next";
import newIcon from "@/assets/tickets/new.svg";
import openIcon from "@/assets/tickets/open.svg";
import solvedIcon from "@/assets/tickets/solved.svg";
import totalIcon from "@/assets/tickets/total.svg";
import { useTicketsStore } from "@/stores/tickets";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";
import BaseDateRangePicker from "@/components/base/BaseDateRangePicker.vue";
import DataTable from "@/components/base/datatable/DataTable.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import CreateTicketModal from "@/components/tickets/CreateTicketModal.vue";

const store = useTicketsStore();
const route = useRoute();
const router = useRouter();

const showCreateModal = ref(false);
const localDateRange = ref([null, null]);

// Route prefix to support Client (/tickets), IB (/ib-tickets), and FM (/fm-tickets)
const routePrefix = computed(() => {
  if (route.path.startsWith("/fm-tickets") || route.path.startsWith("/fm")) {
    return "/fm-tickets";
  }
  return route.path.startsWith("/ib-tickets") || route.path.startsWith("/ib")
    ? "/ib-tickets"
    : "/tickets";
});

const goToDetail = (id) => {
  if (id) {
    router.push(`${routePrefix.value}/${id}`);
  }
};

const handleRowClick = (row) => {
  const ticketId = row?.id ?? row?.ticket_id;
  if (ticketId) {
    goToDetail(ticketId);
  }
};

// Filter options
const statusOptions = [
  { label: "All Status", value: "" },
  { label: "Open", value: "open" }, { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Solved", value: "solved" },
  { label: "Closed", value: "closed" },
];

const priorityOptions = [
  { label: "All Priorities", value: "" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

// Table Columns configuration
const columns = [
  {
    key: "ticket_id",
    label: "TICKET ID",
    headerClass: "pl-6 sm:pl-8",
    cellClass: "pl-6 sm:pl-8",
  },
  { key: "subject", label: "SUBJECT" },
  { key: "priority", label: "PRIORITY" },
  { key: "status", label: "STATUS" },
  { key: "created_at", label: "CREATED DATE" },
  {
    key: "actions",
    label: "",
    align: "right",
    headerClass: "pr-6 sm:pr-8",
    cellClass: "pr-6 sm:pr-8",
  },
];

// Check if active filters
const hasActiveFilters = computed(() => {
  return (
    !!store.filters.search ||
    !!store.filters.status ||
    !!store.filters.priority ||
    !!store.filters.from_date ||
    !!store.filters.to_date ||
    (Array.isArray(localDateRange.value) && (!!localDateRange.value[0] || !!localDateRange.value[1]))
  );
});

const formatDateToISO = (d) => {
  if (!d) return "";
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    return "";
  }
};

const handleDateRangeChange = (range) => {
  if (Array.isArray(range) && (range[0] || range[1])) {
    store.filters.from_date = formatDateToISO(range[0]);
    store.filters.to_date = formatDateToISO(range[1]);
  } else {
    store.filters.from_date = "";
    store.filters.to_date = "";
  }
  store.applyFilters();
};

const handleResetFilters = () => {
  localDateRange.value = [null, null];
  store.resetFilters();
};

// Debounced search
let searchTimer = null;
const debounceSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    store.applyFilters();
  }, 400);
};

const handleRefresh = () => {
  store.fetchTickets(true);
};

const formatTicketCode = (row) => {
  if (row.ticket_code) return row.ticket_code;
  if (row.ticket_number) return row.ticket_number;
  if (row.id) {
    const numStr = String(row.id).padStart(4, "0");
    return `TIC-${numStr}`;
  }
  return "TIC-0001";
};

const formatStatusLabel = (status) => {
  if (!status) return "Open";
  const s = String(status).toLowerCase();
  if (s === "in_progress") return "In Progress";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const getStatusBadgeClass = (status) => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "pending":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "open":
      return "bg-pink-500/10 text-pink-600 border-pink-500/20";
    case "in_progress":
    case "progress":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "solved":
    case "completed":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "closed":
      return "bg-secondary-text/10 text-secondary-text border-primary-border";
    default:
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  }
};

const formatPriorityLabel = (priority) => {
  if (!priority) return "Medium";
  const p = String(priority).toLowerCase();
  return p.charAt(0).toUpperCase() + p.slice(1);
};

const getPriorityBadgeClass = (priority) => {
  const p = String(priority || "").toLowerCase();
  switch (p) {
    case "urgent":
    case "high":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "low":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "bg-secondary-text/10 text-secondary-text border-primary-border";
  }
};

const formatDateString = (dateVal) => {
  if (!dateVal) return "Apr 15, 2025";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return dateVal;
  }
};

onMounted(() => {
  store.fetchTickets();
});
</script>
