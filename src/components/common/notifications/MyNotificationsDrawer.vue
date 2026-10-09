<template>
  <Teleport to="body">
    <div>
      <Transition name="backdrop">
        <div
          v-if="open"
          class="fixed inset-0 z-[100] bg-black/50"
          @click="emit('close')"
        />
      </Transition>

      <Transition name="drawer">
        <div
          v-if="open"
          class="fixed no-scrollbar right-0 top-0 bottom-0 z-[101] w-full max-w-lg bg-card-background border-l border-primary-border flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div
            class="px-4 sm:px-5 py-4 border-b border-primary-border flex items-center justify-between shrink-0 gap-2"
          >
            <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div
                class="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"
              >
                <Bell class="w-4 h-4 text-primary shrink-0" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-semibold text-primary-text truncate">
                    Notifications
                  </h2>
                  <span
                    v-if="store.unreadCount > 0"
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-black min-w-[18px] text-center shrink-0"
                  >
                    {{ store.unreadCount }}
                  </span>
                </div>
                <p class="text-[11px] text-secondary-text mt-0.5 truncate hidden sm:block">
                  Your alerts and updates
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                title="Test notification sound"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-primary-border hover:bg-background text-secondary-text hover:text-primary-text transition-colors shrink-0"
                @click="store.playNotificationSound()"
              >
                <Volume2 class="w-3.5 h-3.5" />
              </button>
              <RefreshButton
                :loading="store.myLoading"
                :icon-size="14"
                button-class="w-8 h-8 rounded-lg shrink-0"
                @click="store.fetchMyNotifications(true, 1)"
              />
              <button
                v-if="store.unreadCount > 0"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary-border text-xs text-secondary-text hover:text-primary-text hover:bg-background transition-colors shrink-0"
                @click="store.markAllAsRead"
                title="Mark all read"
              >
                <CheckCheck class="w-3.5 h-3.5 shrink-0" />
                <span class="hidden sm:inline">Mark all read</span>
              </button>
              <button
                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background text-secondary-text hover:text-primary-text transition-colors shrink-0"
                @click="emit('close')"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div
            class="px-4 sm:px-5 py-3 border-b border-primary-border shrink-0 space-y-2.5"
          >
            <BaseSearch
              v-model="searchQuery"
              placeholder="Search notifications..."
              rounded="xl"
              variant="background"
              height="40px"
              wrapper-class="border border-primary-border"
            />
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <BaseSelect
                v-model="selectedReadStatus"
                :options="readStatusOptions"
                allow-all
                borderless
                all-label="All Status"
                variant="surface"
              />
              <BaseSelect
                v-model="selectedPriority"
                :options="priorityOptions"
                allow-all
                all-label="All Priority"
                                borderless
                variant="surface"
              />
              <BaseSelect
                v-model="selectedType"
                :options="typeOptions"
                allow-all
                all-label="All Types"
                                borderless
                variant="surface"
              />
            </div>
          </div>

          <!-- List -->
          <div
            class="flex-1 overflow-y-auto mx-2 my-4 border border-primary-border rounded-xl divide-y divide-primary-border"
          >
            <!-- Skeleton -->
            <div v-if="store.myLoading" class="p-4 space-y-3">
              <div
                v-for="n in 4"
                :key="n"
                class="h-24 bg-card-background border border-primary-border rounded-xl animate-pulse"
              />
            </div>

            <!-- Empty -->
            <div
              v-else-if="filteredMyNotifications.length === 0"
              class="flex flex-col items-center gap-3 py-20"
            >
              <div
                class="w-12 h-12 rounded-full bg-background border border-primary-border flex items-center justify-center"
              >
                <Bell class="w-5 h-5 text-secondary-text" />
              </div>
              <p class="text-sm font-medium text-primary-text">
                No notifications found
              </p>
              <p class="text-xs text-secondary-text">
                Try adjusting your filters
              </p>
            </div>

            <!-- Notifications -->
            <div v-else class="divide-y divide-primary-border">
              <div
                v-for="item in filteredMyNotifications"
                :key="item.id"
                class="relative px-5 py-4 hover:bg-background transition-colors"
                :class="{ 'bg-primary/[0.02]': !item.is_read }"
              >
                <!-- Unread bar -->
                <div
                  v-if="!item.is_read"
                  class="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
                />

                <!-- Top row: type + priority + date -->
                <div class="flex items-center justify-between gap-2 mb-2 pl-3">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase"
                      :class="typeClass(item.type)"
                    >
                      {{ item.type }}
                    </span>
                    <span
                      class="text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase"
                      :class="priorityClass(item.priority)"
                    >
                      {{ item.priority }}
                    </span>
                  </div>
                  <span class="text-[11px] text-secondary-text shrink-0">{{
                    formatDate(item.created_at)
                  }}</span>
                </div>

                <!-- Title + message -->
                <div class="pl-3 mb-3">
                  <p class="text-xs font-semibold text-primary-text mb-0.5">
                    {{ item.title }}
                  </p>
                  <p class="text-[11px] text-secondary-text leading-relaxed">
                    {{ item.message }}
                  </p>

                  <Tooltip
                    v-if="item.image_url"
                    text="Click on the image to view it in full screen"
                    position="start"
                  >
                    <div class="mt-2 inline-block">
                      <img
                        :src="item.image_url"
                        :alt="item.title"
                        @click.stop="openImageModal(item)"
                        class="h-12 w-12 rounded-lg border border-primary-border object-cover transition-opacity hover:opacity-80 cursor-pointer shadow-xs"
                      />
                    </div>
                  </Tooltip>
                </div>

                <!-- Footer -->
                <div class="pl-2 sm:pl-3 flex flex-wrap items-center justify-between gap-2">
                  <!-- Read status with tick indicator -->
                  <div class="flex items-center gap-1.5 shrink-0">
                    <template v-if="item.is_read">
                      <CheckCheck class="w-3.5 h-3.5 text-primary-green shrink-0" />
                      <span class="text-[10px] text-secondary-text"
                        >Read {{ formatDate(item.read_at) }}</span
                      >
                    </template>
                    <template v-else>
                      <Check class="w-3.5 h-3.5 text-secondary-text shrink-0" />
                      <span class="text-[10px] text-secondary-text"
                        >Unread</span
                      >
                    </template>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <a
                      v-if="item.action_url"
                      :href="item.action_url"
                      target="_blank"
                      class="flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover transition-colors font-medium"
                    >
                      Open <ExternalLink class="w-3 h-3" />
                    </a>
                    <button
                      v-if="!item.is_read"
                      class="flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-primary-border text-[11px] text-secondary-text hover:text-primary-text transition-colors"
                      @click="store.markAsRead(item.id)"
                    >
                      <CheckCheck class="w-3 h-3" /> Mark read
                    </button>
                  </div>
                </div>
              </div>

              <!-- See More Button -->
              <div
                v-if="store.myPagination?.hasMore"
                class="p-4 flex justify-center border-t border-primary-border"
              >
                <button
                  :disabled="store.loadingMore"
                  class="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-primary-border bg-background hover:bg-card-background text-primary-text transition-colors disabled:opacity-50 cursor-pointer"
                  @click="store.loadMoreMyNotifications()"
                >
                  <RotateCw
                    v-if="store.loadingMore"
                    class="w-3.5 h-3.5 animate-spin text-primary"
                  />
                  <span>{{
                    store.loadingMore ? "Loading..." : "See More"
                  }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useNotificationsStore } from "@/stores/shared/notifications";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseSearch from "@/components/base/BaseSearch.vue";
import {
  Bell,
  CheckCheck,
  Check,
  RotateCw,
  ExternalLink,
  Volume2,
  X,
} from "lucide-vue-next";
import Tooltip from "@/components/base/Tooltip.vue";
import RefreshButton from "@/components/base/RefreshButton.vue";

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(["close"]);

const store = useNotificationsStore();

const searchQuery = ref("");
const selectedReadStatus = ref(null);
const selectedPriority = ref(null);
const selectedType = ref(null);

const readStatusOptions = [
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
];

const priorityOptions = [
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
];

const typeOptions = [
  { label: "Announcement", value: "ANNOUNCEMENT" },
  { label: "System", value: "SYSTEM" },
  { label: "Promotion", value: "PROMOTION" },
  { label: "Alert", value: "ALERT" },
];

watch(
  () => props.open,
  (val) => {
    if (val) store.fetchMyNotifications(true, 1);
  },
);

const filteredMyNotifications = computed(() =>
  store.myNotifications.filter((n) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      if (
        !n.title.toLowerCase().includes(q) &&
        !n.message.toLowerCase().includes(q)
      )
        return false;
    }
    if (selectedReadStatus.value === "unread" && n.is_read) return false;
    if (selectedReadStatus.value === "read" && !n.is_read) return false;
    if (selectedPriority.value && n.priority !== selectedPriority.value)
      return false;
    if (selectedType.value && n.type !== selectedType.value) return false;
    return true;
  }),
);

const priorityClass = (p) =>
  ({
    HIGH: "bg-primary-red/10 text-primary-red border-primary-red/20",
    MEDIUM: "bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20",
    LOW: "bg-primary-green/10 text-primary-green border-primary-green/20",
  })[p] ?? "bg-background text-secondary-text border-primary-border";

const typeClass = (t) =>
  ({
    ANNOUNCEMENT: "bg-primary/10 text-primary border-primary/20",
    SYSTEM: "bg-background text-secondary-text border-primary-border",
    PROMOTION: "bg-primary-green/10 text-primary-green border-primary-green/20",
    ALERT: "bg-primary-red/10 text-primary-red border-primary-red/20",
  })[t] ?? "bg-background text-secondary-text border-primary-border";

const formatDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
