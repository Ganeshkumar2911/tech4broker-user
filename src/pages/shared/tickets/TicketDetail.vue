<template>
  <div class="space-y-6">
    <!-- Loading Skeleton matching exact UI layout -->
    <div v-if="store.detailLoading && !store.detail" class="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <!-- Left Card Skeleton -->
      <div class="lg:col-span-2 bg-card-background border border-primary-border rounded-3xl p-6 min-h-[425px] flex flex-col justify-between space-y-6">
        <div class="space-y-6">
          <!-- Header Area Skeleton -->
          <div class="border-b border-primary-border/60 pb-4 space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="h-6 w-32 bg-primary-border/40 rounded-lg"></div>
                <div class="h-6 w-20 bg-primary-border/40 rounded-full"></div>
              </div>
              <div class="h-9 w-32 bg-primary-border/40 rounded-xl"></div>
            </div>
            <div class="h-4 w-48 bg-primary-border/30 rounded-md"></div>
          </div>

          <!-- Messages Thread Skeleton -->
          <div class="space-y-6">
            <div v-for="i in 2" :key="i" class="flex gap-4 items-start border-b border-primary-border/40 pb-6 last:border-0">
              <div class="w-10 h-10 rounded-full bg-primary-border/50 shrink-0"></div>
              <div class="flex-1 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="h-4 w-36 bg-primary-border/40 rounded-md"></div>
                  <div class="h-3 w-20 bg-primary-border/30 rounded-md"></div>
                </div>
                <div class="h-4 w-full bg-primary-border/30 rounded-md"></div>
                <div class="h-4 w-3/4 bg-primary-border/30 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Reply Composer Skeleton -->
        <div class="pt-4 border-t border-primary-border/60 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-border/50 shrink-0"></div>
          <div class="flex-1 h-11 bg-primary-border/40 rounded-xl"></div>
        </div>
      </div>

      <!-- Right Column Sidebar Skeletons -->
      <div class="space-y-6 flex flex-col justify-between h-full">
        <!-- Ticket Details Skeleton -->
        <div class="bg-card-background border border-primary-border rounded-3xl p-6 space-y-4">
          <div class="space-y-3.5">
            <div v-for="i in 5" :key="i" class="flex justify-between items-center">
              <div class="h-3 w-20 bg-primary-border/40 rounded-md"></div>
              <div class="h-3 w-28 bg-primary-border/30 rounded-md"></div>
            </div>
          </div>
        </div>

        <!-- Media Skeleton -->
        <div class="bg-card-background border border-primary-border rounded-3xl p-6 space-y-4 flex-1 flex flex-col justify-start">
          <div class="h-4 w-36 bg-primary-border/40 rounded-md border-b border-primary-border/60 pb-3"></div>
          <div class="space-y-3">
            <div v-for="i in 4" :key="i" class="h-4 w-full bg-primary-border/30 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Layout -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <!-- Left Column: Single Main Card (2/3 width) -->
      <div class="lg:col-span-2 bg-card-background rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between min-h-[425px] space-y-6">
        <!-- Top Section: Header & Discussion Thread -->
        <div class="space-y-6">
          <!-- Header Area -->
          <div class="border-b border-primary-border/60 pb-4 space-y-3">
            <div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-xl font-bold text-primary-text">
                  {{ ticketCategoryLabel }}
                </h1>
                <BaseBadge :value="ticketData.status" />
              </div>

              <!-- Update Status Button -->
              <button
                type="button"
                @click="showStatusModal = true"
                :disabled="ticketData.status === 'closed'"
                class="px-4 py-2 text-xs font-semibold rounded-xl bg-button text-button-text hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
                <span>Update Status</span>
              </button>
            </div>

            <div>
              <p class="text-xs text-secondary-text flex items-center gap-2">
                <span class="font-medium text-secondary-text">{{ ticketData.subject || ticketData.title || "Leave Balance Wrong" }}</span>
                <span>•</span>
                <span class="font-mono font-medium">#{{ ticketCode }}</span>
              </p>
            </div>
          </div>

          <!-- Messages Thread List -->
          <div ref="chatContainerRef" class="space-y-6 max-h-[345px] overflow-y-auto px-3 sm:px-4 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div v-for="group in groupedComments" :key="group.dateLabel" class="space-y-5">
              <!-- Date Section Divider Line & Badge -->
              <div class="flex items-center justify-center my-5 relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-primary-border/40"></div>
                </div>
                <span class="relative text-[10px] font-semibold text-secondary-text bg-card-background border border-primary-border px-3.5 py-1 rounded-full uppercase tracking-wider">
                  {{ group.dateLabel }}
                </span>
              </div>

              <!-- Messages in this Date Group -->
              <div
                v-for="(msg, idx) in group.messages"
                :key="msg.id || idx"
                class="flex gap-3.5 items-start border-b border-primary-border/40 last:border-0 pb-5 last:pb-0 my-3 flex-row"
              >
                <!-- Avatar -->
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-primary-text shrink-0 overflow-hidden mt-0.5 shadow-2xs"
                  :class="msg.isMe ? 'bg-button/15 border border-button/40' : 'bg-primary-border/60 border border-primary-border'"
                >
                  <img v-if="msg.isMe && userAvatarUrl" :src="userAvatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                  <img v-else-if="!msg.isMe && (msg.user_avatar || msg.avatar)" :src="msg.user_avatar || msg.avatar" alt="Avatar" class="w-full h-full object-cover" />
                  <span v-else>{{ msg.isMe ? userInitials : getInitials(msg.user_name || msg.sender_name || msg.name || 'Support') }}</span>
                </div>

                <!-- Message Content Container -->
                <div
                  class="flex-1 space-y-1.5 flex flex-col items-start text-left"
                >
                  <!-- Top Info Bar -->
                  <div
                    class="flex items-center gap-2 flex-wrap mb-0.5 flex-row"
                  >
                    <span class="text-xs sm:text-sm font-bold text-primary-text">
                      {{ msg.isMe ? (msg.user_name || 'You') : (msg.user_name || msg.sender_name || msg.name || 'Support Member') }}
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-background border border-primary-border text-[10px] font-semibold text-secondary-text capitalize">
                      {{ msg.role || msg.user_type || (msg.isMe ? 'Client' : 'Employee') }}
                    </span>
                    <span class="text-[11px] text-secondary-text shrink-0">
                      {{ formatTimeString(msg.created_at || msg.date) }}
                    </span>
                  </div>

                  <!-- Speech Bubble Text -->
                  <div
                    v-if="msg.comment || msg.message || msg.content"
                    class="p-3.5 rounded-2xl max-w-[85%] text-xs sm:text-sm text-primary-text leading-relaxed whitespace-pre-line shadow-xs rounded-tl-none text-left"
                    :class="msg.isMe ? 'bg-button/10 border border-button/30' : 'bg-card-background border border-primary-border'"
                  >
                    {{ msg.comment || msg.message || msg.content }}
                  </div>

                  <!-- Message File / Document Attachment -->
                  <div v-if="msg.attachment_url || msg.file_url" class="pt-1.5 flex justify-start">
                    <!-- Image Attachment Preview -->
                    <div v-if="isImageFile(msg.attachment_url || msg.file_url || msg.file_name)" class="max-w-xs space-y-1">
                      <a
                        :href="msg.attachment_url || msg.file_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block overflow-hidden rounded-2xl border border-primary-border bg-card-background hover:opacity-95 transition-opacity shadow-xs"
                      >
                        <img
                          :src="msg.attachment_url || msg.file_url"
                          :alt="msg.file_name || 'Attachment Preview'"
                          class="w-full h-auto max-h-48 object-cover rounded-2xl"
                        />
                      </a>
                      <div class="flex items-center justify-between text-[11px] text-secondary-text px-1">
                        <span class="truncate max-w-[180px] font-medium">{{ msg.file_name || 'Image attachment' }}</span>
                        <a :href="msg.attachment_url || msg.file_url" target="_blank" download class="font-semibold text-primary-text hover:underline flex items-center gap-1">
                          <Download class="w-3 h-3" />
                          <span>View</span>
                        </a>
                      </div>
                    </div>

                    <!-- Document / Generic File Card -->
                    <a
                      v-else
                      :href="msg.attachment_url || msg.file_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-3 p-3 rounded-2xl border transition-all max-w-xs text-left hover:border-primary-text/40 bg-card-background border-primary-border text-primary-text"
                    >
                      <div
                        class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-background border border-primary-border text-primary-text"
                      >
                        <FileText class="w-4 h-4" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-semibold text-primary-text truncate">{{ msg.file_name || 'Attached Document' }}</p>
                        <p class="text-[10px] text-secondary-text">Click to view document</p>
                      </div>
                      <ExternalLink class="w-3.5 h-3.5 shrink-0 text-secondary-text" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Section: Reply Composer Box -->
        <div class="pt-4 border-t border-primary-border/60">
          <form @submit.prevent="handleSendReply" class="space-y-2">
            <div class="flex items-center gap-2.5 sm:gap-3">
              <!-- User Avatar -->
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-border/60 flex items-center justify-center font-bold text-xs text-primary-text shrink-0 overflow-hidden shadow-2xs">
                <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                <span v-else>{{ userInitials }}</span>
              </div>

              <!-- Input Box with Yellow Border Accent & Proper Padding -->
              <div class="flex-1 flex items-center gap-2.5 bg-background rounded-xl pl-3.5 pr-1.5 py-1.5 border border-primary-border">
                <!-- Attachment Paperclip Button -->
                <button
                  type="button"
                  @click="triggerAttachmentInput"
                  class="text-secondary-text hover:text-primary-text transition-colors p-1 cursor-pointer shrink-0"
                  title="Attach file"
                >
                  <Paperclip class="w-4 h-4 text-primary-text" />
                </button>
                <input
                  ref="attachmentInputRef"
                  type="file"
                  class="hidden"
                  @change="handleAttachmentSelected"
                />

                <!-- Text Input -->
                <input
                  v-model="replyText"
                  type="text"
                  placeholder="Write a reply..."
                  :disabled="store.actionLoading"
                  class="flex-1 bg-transparent text-xs sm:text-sm text-primary-text placeholder:text-secondary-text outline-none px-1"
                />

                <!-- Send Button -->
                <button
                  type="submit"
                  :disabled="store.actionLoading || (!replyText.trim() && !replyFile)"
                  class="w-8 h-8 rounded-lg bg-button text-button-text hover:opacity-90 disabled:opacity-90 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all shadow-xs"
                  title="Send Reply"
                >
                  <Loader2 v-if="store.actionLoading" class="w-3.5 h-3.5 animate-spin text-button-text" />
                  <SendHorizontal v-else class="w-3.5 h-3.5 text-button-text" />
                </button>
              </div>
            </div>

            <!-- Attachment Preview Chip -->
            <div v-if="replyFile" class="pl-13 flex items-center gap-2">
              <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card-background border border-primary-border text-xs text-primary-text">
                <FileText class="w-3.5 h-3.5 text-secondary-text" />
                <span class="truncate max-w-xs">{{ replyFile.name }}</span>
                <button type="button" @click="replyFile = null" class="text-secondary-text hover:text-red-500">
                  <X class="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>

      <!-- Right Column: Sidebar Info Cards (1/3 width) -->
      <div class="space-y-6 flex flex-col justify-between h-full">
        <!-- Ticket Details Card -->
        <div class="bg-card-background rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
          <div class="space-y-3.5 text-xs">
            <div class="flex items-center justify-between gap-3">
              <span class="text-secondary-text font-medium">Ticket ID</span>
              <span class="font-bold text-primary-text font-mono">#{{ ticketCode }}</span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-secondary-text font-medium">Name</span>
              <span class="font-bold text-primary-text text-right max-w-[170px] truncate" :title="ticketData.created_by_name || ticketData.user_name || ticketData.name || ticketData.user?.name">
                {{ ticketData.created_by_name || ticketData.user_name || ticketData.name || ticketData.user?.name || profileStore.user?.name || "Client" }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-secondary-text font-medium">Subject</span>
              <span class="font-bold text-primary-text text-right max-w-[170px] truncate" :title="ticketData.subject || ticketData.title">
                {{ ticketData.subject || ticketData.title || "Support Ticket" }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-secondary-text font-medium">Email</span>
              <span class="font-bold text-primary-text text-right max-w-[170px] truncate" :title="ticketData.created_by_email || ticketData.user_email || ticketData.email || ticketData.user?.email">
                {{ ticketData.created_by_email || ticketData.user_email || ticketData.email || ticketData.user?.email || profileStore.user?.email || "—" }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <span class="text-secondary-text font-medium">Created Date</span>
              <span class="font-bold text-primary-text">{{ formatDateString(ticketData.created_at || ticketData.created_date || ticketData.date) }}</span>
            </div>
          </div>
        </div>

        <!-- Media on this ticket Card -->
        <div class="bg-card-background rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 flex-1 flex flex-col justify-start">
          <h3 class="text-xs font-bold text-primary-text border-b border-primary-border/60 pb-3 flex items-center justify-between">
            <span>Media on this ticket</span>
            <span v-if="ticketAttachments.length" class="text-[11px] font-semibold text-secondary-text">({{ ticketAttachments.length }})</span>
          </h3>

          <div v-if="!ticketAttachments.length" class="py-4 text-center">
            <p class="text-xs text-secondary-text italic">No media attachments on this ticket.</p>
          </div>

          <div v-else class="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <a
              v-for="(file, idx) in ticketAttachments"
              :key="idx"
              :href="file.url || file.attachment_url || '#'"
              target="_blank"
              class="flex items-center gap-2.5 text-xs text-secondary-text hover:text-primary-text transition-colors cursor-pointer group"
            >
              <FileText class="w-4 h-4 shrink-0 text-secondary-text group-hover:text-primary-text transition-colors" />
              <span class="truncate flex-1" :title="file.name || file.filename">{{ file.name || file.filename || 'Attachment File' }}</span>
              <Download class="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Accounts Disclaimer -->
    <AccountsDisclaimer class="mt-10" />

    <!-- Ticket Status Modal -->
    <TicketStatusModal
      :open="showStatusModal"
      :ticketId="realTicketId"
      :status="ticketData.status"
      @close="showStatusModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Paperclip,
  SendHorizontal,
  FileText,
  Download,
  Loader2,
  X,
  CheckCircle2,
  ExternalLink,
} from "lucide-vue-next";
import { useTicketsStore } from "@/stores/tickets";
import { useProfileStore } from "@/stores/shared/profile";
import AccountsDisclaimer from "@/components/client/accounts/AccountsDisclaimer.vue";
import TicketStatusModal from "@/components/tickets/TicketStatusModal.vue";

const store = useTicketsStore();
const profileStore = useProfileStore();

const showStatusModal = ref(false);
const route = useRoute();
const router = useRouter();

const ticketId = computed(() => route.params.id);
const realTicketId = computed(() => store.detail?.id || store.detail?.ticket_id || route.params.id);
const replyText = ref("");
const replyFile = ref(null);
const attachmentInputRef = ref(null);
const chatContainerRef = ref(null);
const optimisticMessages = ref([]);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

const currentUserId = computed(() => {
  return (
    profileStore.user?.id ||
    profileStore.user?.user_id ||
    profileStore.user?.user?.id ||
    profileStore.user?.email
  );
});

const userAvatarUrl = computed(() => {
  return profileStore.user?.avatar || profileStore.user?.user_avatar || null;
});

const userInitials = computed(() => {
  const name = profileStore.user?.name || profileStore.user?.first_name || "Me";
  return getInitials(name);
});

const isFmMode = computed(() => route.path.startsWith("/fm"));
const isIbMode = computed(() => route.path.startsWith("/ib"));

// Route prefix to support Client (/tickets), IB (/ib-tickets), and FM (/fm-tickets)
const routePrefix = computed(() => {
  if (isFmMode.value) return "/fm-tickets";
  return isIbMode.value ? "/ib-tickets" : "/tickets";
});

const dashboardRoute = computed(() => {
  if (isFmMode.value) return "/fm-dashboard";
  return isIbMode.value ? "/ib-dashboard" : "/dashboard";
});

const ticketData = computed(() => store.detail?.data || store.detail?.ticket || store.detail || {});

const ticketCategoryLabel = computed(() => {
  const cat = ticketData.value.category || ticketData.value.department || ticketData.value.subject || "IT Support";
  if (cat === "it_support") return "IT Support";
  if (cat === "trading_account") return "Trading Account Support";
  if (cat === "financial") return "Financial Support";
  if (cat === "ib_inquiry") return "IB Commission Support";
  return String(cat).charAt(0).toUpperCase() + String(cat).slice(1);
});

const ticketCode = computed(() => {
  if (ticketData.value.ticket_code) return ticketData.value.ticket_code;
  if (ticketData.value.ticket_number) return ticketData.value.ticket_number;
  if (ticketData.value.code) return ticketData.value.code;
  if (ticketId.value) {
    return `TKT-${String(ticketId.value).padStart(4, "0")}`;
  }
  return "TKT-0001";
});

const isUserMe = (actorId, actorEmail, actorRole) => {
  if (currentUserId.value && actorId && String(actorId) === String(currentUserId.value)) {
    return true;
  }
  if (profileStore.user?.email && actorEmail && String(actorEmail).toLowerCase() === String(profileStore.user?.email).toLowerCase()) {
    return true;
  }
  if (actorRole) {
    const r = String(actorRole).toLowerCase();
    if (r === "client" || r === "user" || r === "ib" || r === "customer") {
      return true;
    }
  }
  return false;
};

const allComments = computed(() => {
  if (!store.detail) return [];

  const rawItems = [];

  // 1. Items from detail.history
  if (Array.isArray(store.detail.history) && store.detail.history.length > 0) {
    store.detail.history.forEach((h) => {
      const actorId = h.actor_user_id;
      const isMe = isUserMe(actorId, h.actor_email, h.actor_role);
      rawItems.push({
        id: h.id || `h-${Math.random()}`,
        event_type: h.event_type || "comment_added",
        user_name: isMe ? (h.actor_name || profileStore.user?.name || "You") : (h.actor_name || "Support Member"),
        role: h.actor_role || (isMe ? "Client" : "Employee"),
        actor_user_id: actorId,
        isMe,
        comment: h.comment_text || h.comment || h.message,
        file_name: h.file_name,
        file_url: h.file_url,
        created_at: h.created_at,
      });
    });
  } else {
    // 2. Items from detail.comments
    if (Array.isArray(store.detail.comments)) {
      store.detail.comments.forEach((c) => {
        const actorId = c.user_id || c.actor_user_id;
        const isMe = isUserMe(actorId, c.email || c.user_email, c.role || c.user_type);
        rawItems.push({
          id: `comment-${c.id}`,
          event_type: "comment_added",
          user_name: isMe ? (c.user_name || profileStore.user?.name || "You") : (c.user_name || c.sender_name || c.name || c.email || "Support Member"),
          role: c.role || c.user_type || (isMe ? "Client" : "Employee"),
          actor_user_id: actorId,
          isMe,
          comment: c.comment || c.comment_text || c.message || c.content,
          file_name: c.file_name || c.filename,
          file_url: c.file_url || c.attachment_url,
          created_at: c.created_at || c.date,
        });
      });
    }

    // 3. Items from detail.attachments
    if (Array.isArray(store.detail.attachments)) {
      store.detail.attachments.forEach((a) => {
        const actorId = a.user_id || a.actor_user_id;
        const isMe = isUserMe(actorId, a.email, a.role);
        rawItems.push({
          id: `att-${a.id}`,
          event_type: "attachment_uploaded",
          user_name: isMe ? (a.actor_name || profileStore.user?.name || "You") : (a.actor_name || a.name || "Support Member"),
          role: a.role || (isMe ? "Client" : "Employee"),
          actor_user_id: actorId,
          isMe,
          file_name: a.file_name || a.filename || a.name,
          file_url: a.file_url || a.attachment_url || a.url,
          created_at: a.created_at || a.date,
        });
      });
    }

    // 4. Initial description if present and no history/comments
    if (!rawItems.length && (store.detail.description || store.detail.message)) {
      rawItems.push({
        id: `desc-1`,
        event_type: "comment_added",
        user_name: store.detail.user_name || store.detail.name || profileStore.user?.name || "You",
        role: "Client",
        isMe: true,
        created_at: store.detail.created_at,
        comment: store.detail.description || store.detail.message,
      });
    }
  }

  // 5. Append optimistic messages
  if (optimisticMessages.value.length > 0) {
    optimisticMessages.value.forEach((opt) => {
      rawItems.push(opt);
    });
  }

  // Sort items chronologically
  rawItems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return rawItems;
});

const formatDateGroup = (dateStr) => {
  if (!dateStr) return "Today";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const groupedComments = computed(() => {
  if (!allComments.value || !allComments.value.length) return [];

  const grouped = [];
  let currentGroup = null;

  allComments.value.forEach((item) => {
    const groupLabel = formatDateGroup(item.created_at);
    if (!currentGroup || currentGroup.dateLabel !== groupLabel) {
      currentGroup = {
        dateLabel: groupLabel,
        messages: [],
      };
      grouped.push(currentGroup);
    }
    currentGroup.messages.push(item);
  });

  return grouped;
});

const ticketAttachments = computed(() => {
  const list = [];
  const seenUrls = new Set();

  const addFile = (name, url) => {
    if (!url && !name) return;
    const fileKey = url || name;
    if (seenUrls.has(fileKey)) return;
    seenUrls.add(fileKey);
    list.push({
      name: name || "Attachment File",
      filename: name || "Attachment File",
      url: url,
      attachment_url: url,
    });
  };

  // 1. Check ticketData.attachments
  if (Array.isArray(ticketData.value.attachments)) {
    ticketData.value.attachments.forEach((a) => {
      addFile(a.file_name || a.filename || a.name, a.file_url || a.attachment_url || a.url);
    });
  }

  // 2. Check ticketData.files
  if (Array.isArray(ticketData.value.files)) {
    ticketData.value.files.forEach((f) => {
      addFile(f.file_name || f.filename || f.name, f.file_url || f.attachment_url || f.url);
    });
  }

  // 3. Check allComments (history, comments, optimistic messages)
  if (Array.isArray(allComments.value)) {
    allComments.value.forEach((m) => {
      if (m.file_url || m.attachment_url || m.file_name) {
        addFile(m.file_name || m.filename, m.file_url || m.attachment_url);
      }
    });
  }

  return list;
});

const triggerAttachmentInput = () => {
  attachmentInputRef.value?.click();
};

const handleAttachmentSelected = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    replyFile.value = file;
  }
};

const handleSendReply = () => {
  const text = replyText.value.trim();
  const file = replyFile.value;

  if (!text && !file) return;

  // Create optimistic message bubble for instant UI feedback
  const tempId = `temp-${Date.now()}`;
  let tempFileUrl = null;
  if (file && /\.(jpeg|jpg|gif|png|webp|svg|pdf)$/i.test(file.name)) {
    tempFileUrl = URL.createObjectURL(file);
  }

  const optimisticItem = {
    id: tempId,
    event_type: file ? "attachment_uploaded" : "comment_added",
    user_name: profileStore.user?.name || profileStore.user?.first_name || "Me",
    role: profileStore.user?.role || "Client",
    actor_user_id: currentUserId.value,
    isMe: true,
    comment: text || null,
    file_name: file ? file.name : null,
    file_url: tempFileUrl,
    created_at: new Date().toISOString(),
  };

  optimisticMessages.value.push(optimisticItem);
  scrollToBottom();

  const onComplete = () => {
    replyText.value = "";
    replyFile.value = null;
    scrollToBottom();
  };

  if (file) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("attachments", file);
    fd.append("files", file);

    store.addAttachment(ticketId.value, fd, () => {
      if (text) {
        store.addComment(ticketId.value, { comment: text }, onComplete);
      } else {
        onComplete();
      }
    });
  } else if (text) {
    store.addComment(ticketId.value, { comment: text }, onComplete);
  }
};

watch(
  allComments,
  () => {
    scrollToBottom();
  },
  { deep: true }
);

const isImageFile = (urlOrName) => {
  if (!urlOrName) return false;
  return /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(urlOrName);
};

const getInitials = (name) => {
  if (!name) return "AH";
  const parts = String(name).trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatStatusLabel = (status) => {
  if (!status) return "Pending";
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
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  }
};

const formatDateString = (dateVal) => {
  if (!dateVal) return "Apr 17, 2025";
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

const formatTimeString = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return dateVal;
  }
};

onMounted(() => {
  if (!profileStore.user) {
    profileStore.fetchUserProfile();
  }
  if (ticketId.value) {
    store.fetchTicketDetail(ticketId.value);
  }
  scrollToBottom();
});
</script>
