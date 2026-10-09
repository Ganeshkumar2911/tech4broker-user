<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    @click.self="emit('close')"
  >
    <div class="bg-card-background rounded-2xl sm:rounded-3xl w-full max-w-md shadow-xl overflow-hidden my-auto mx-4" @click.stop>
      <!-- Header -->
      <div class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-primary-border/60 flex items-center justify-between">
        <h2 class="text-sm font-bold text-primary-text">Update Ticket Status</h2>
        <button
          type="button"
          class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors cursor-pointer text-secondary-text hover:text-primary-text"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
        <div>
          <p class="text-xs text-secondary-text mb-2 font-medium">Current Status</p>
          <BaseBadge :value="status" />
        </div>

        <div class="space-y-1.5">
          <p class="text-xs text-secondary-text font-medium">New Status</p>
          <BaseSelect
            v-model="selected"
            :options="statusOptions"
            placeholder="Select new status"
          />
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-primary-border/60 flex items-center gap-3">
        <button
          type="button"
          class="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-secondary-text border border-primary-border hover:bg-background hover:text-primary-text transition-colors cursor-pointer"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="store.actionLoading || !selected || selected === status"
          class="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-button text-button-text hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          @click="submit"
        >
          <Loader2 v-if="store.actionLoading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ store.actionLoading ? 'Updating...' : 'Update Status' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { X, CheckCircle2, Loader2 } from "lucide-vue-next";
import { useTicketsStore } from "@/stores/tickets";
import BaseSelect from "@/components/base/BaseSelect.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  ticketId: { type: [String, Number], required: true },
  status: { type: String, default: "" },
});

const emit = defineEmits(["close"]);

const store = useTicketsStore();
const selected = ref("");

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selected.value = "";
    }
  }
);

const statusOptions = [
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
];

const submit = () => {
  if (!selected.value || selected.value === props.status) return;
  const targetId = props.ticketId || store.detail?.id || store.detail?.ticket_id;
  store.updateTicketStatus(targetId, { status: selected.value }, () => {
    emit("close");
  });
};

const formatStatusLabel = (s) => {
  if (!s) return "Pending";
  const statusStr = String(s).toLowerCase();
  if (statusStr === "in_progress") return "In Progress";
  return statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
};

const getStatusBadgeClass = (s) => {
  const statusStr = String(s || "").toLowerCase();
  switch (statusStr) {
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
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  }
};
</script>
