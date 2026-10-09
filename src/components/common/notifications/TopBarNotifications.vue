<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Check,
  Sparkles,
  Inbox,
} from "lucide-vue-next";
import { useNotificationsStore } from "@/stores/shared/notifications";
import MyNotificationsDrawer from "./MyNotificationsDrawer.vue"

const notificationsStore = useNotificationsStore();

const notifPopoverOpen = ref(false);
const drawerOpen = ref(false);
const popoverRef = ref(null);

const unreadNotifications = computed(() => {
  return notificationsStore.myNotifications.filter((n) => !n.is_read);
});

onMounted(() => {
  notificationsStore.fetchMyNotifications();
  window.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
});

function handleClickOutside(event) {
  if (popoverRef.value && !popoverRef.value.contains(event.target)) {
    notifPopoverOpen.value = false;
  }
}

function toggleNotifPopover(e) {
  e.stopPropagation();
  notifPopoverOpen.value = !notifPopoverOpen.value;
}

function openDrawer() {
  notifPopoverOpen.value = false;
  drawerOpen.value = true;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Priority now drives a left accent bar + dot color instead of a busy badge
function getPriorityAccent(priority) {
  switch (priority) {
    case "HIGH":
      return {
        bar: "bg-rose-500",
        dot: "bg-rose-500",
        text: "text-rose-400",
        ring: "ring-rose-500/20",
      };
    case "MEDIUM":
      return {
        bar: "bg-amber-500",
        dot: "bg-amber-500",
        text: "text-amber-400",
        ring: "ring-amber-500/20",
      };
    case "LOW":
      return {
        bar: "bg-emerald-500",
        dot: "bg-emerald-500",
        text: "text-emerald-400",
        ring: "ring-emerald-500/20",
      };
    default:
      return {
        bar: "bg-zinc-500",
        dot: "bg-zinc-500",
        text: "text-zinc-400",
        ring: "ring-zinc-500/20",
      };
  }
}

// WhatsApp-style delivery ticks: single tick = delivered/unread, double tick = read
function markAsRead(id) {
  notificationsStore.markAsRead(id);
}
</script>

<template>
  <div class="relative" ref="popoverRef">
    <!-- Bell Trigger -->
    <button
      @click="toggleNotifPopover"
      class="group cursor-pointer relative flex h-9 w-9 items-center justify-center rounded-xl text-secondary-text transition-all duration-200 hover:bg-primary-border/60 hover:text-primary-text active:scale-95"
      title="Notifications"
    >
      <Bell
        class="h-[18px] w-[18px] transition-transform duration-300"
        :class="
          notificationsStore.unreadCount > 0 ? 'group-hover:rotate-[-8deg]' : ''
        "
      />
      <Transition name="pop">
        <span
          v-if="notificationsStore.unreadCount > 0"
          class="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover px-1 text-[10px] font-bold leading-none text-white shadow-md shadow-primary/30 ring-2 ring-card-background"
        >
          {{
            notificationsStore.unreadCount > 9
              ? "9+"
              : notificationsStore.unreadCount
          }}
        </span>
      </Transition>
    </button>

    <!-- Notification Popover -->
    <Transition name="fade-slide">
      <div
        v-if="notifPopoverOpen"
        class="fixed left-3 right-3 top-16 z-50 sm:absolute sm:right-0 sm:left-auto sm:top-12 sm:w-[24rem] w-auto max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-primary-border/80 bg-card-background/95 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-primary-border/70 bg-gradient-to-b from-background/80 to-transparent px-4 py-3.5 gap-2"
        >
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <div
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0"
            >
              <Bell class="h-3.5 w-3.5 text-primary shrink-0" />
            </div>
            <span
              class="text-[13px] font-semibold tracking-tight text-primary-text truncate"
            >
              Notifications
            </span>
            <span
              v-if="notificationsStore.unreadCount > 0"
              class="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0"
            >
              {{ notificationsStore.unreadCount }} new
            </span>
          </div>

          <button
            v-if="notificationsStore.unreadCount > 0"
            @click="notificationsStore.markAllAsRead"
            class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-secondary-text transition-colors hover:bg-primary/10 hover:text-primary shrink-0"
            title="Mark all as read"
          >
            <CheckCheck class="h-3.5 w-3.5" />
            <span>Clear all</span>
          </button>
        </div>

        <!-- List -->
        <div class="no-scrollbar max-h-[26rem] overflow-y-auto">
          <!-- Empty state -->
          <div
            v-if="unreadNotifications.length === 0"
            class="flex flex-col items-center gap-2.5 px-6 py-12 text-center"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-full bg-primary-border/40"
            >
              <Inbox class="h-5 w-5 text-secondary-text" />
            </div>
            <p class="text-[12.5px] font-medium text-primary-text">
              You're all caught up
            </p>
            <p class="text-[11px] text-secondary-text">
              New notifications will show up here
            </p>
          </div>

          <!-- Items -->
          <div
            v-for="item in unreadNotifications.slice(0, 6)"
            :key="item.id"
            class="group relative flex gap-0 border-b border-primary-border/40 transition-colors last:border-b-0 hover:bg-primary/[0.04]"
          >
            <!-- Priority accent bar -->
            <div
              :class="[
                'w-[3px] shrink-0',
                getPriorityAccent(item.priority).bar,
              ]"
            />

            <div class="flex flex-1 items-start gap-3 px-3.5 py-3">
              <!-- Status dot -->
              <span class="relative mt-1.5 flex h-2 w-2 shrink-0">
                <span
                  :class="[
                    'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                    getPriorityAccent(item.priority).dot,
                  ]"
                />
                <span
                  :class="[
                    'relative inline-flex h-2 w-2 rounded-full',
                    getPriorityAccent(item.priority).dot,
                  ]"
                />
              </span>

              <div class="min-w-0 flex-1">
                <div class="mb-0.5 flex items-start justify-between gap-2">
                  <h4
                    class="truncate text-[12.5px] font-semibold text-primary-text"
                  >
                    {{ item.title }}
                  </h4>
                  <span
                    :class="[
                      'shrink-0 rounded-md px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide',
                      getPriorityAccent(item.priority).text,
                      'bg-current/10',
                    ]"
                  >
                    {{ item.priority }}
                  </span>
                </div>

                <p
                  class="line-clamp-2 text-[11.5px] leading-relaxed text-secondary-text"
                >
                  {{ item.message }}
                </p>

                <div class="mt-2 flex items-center justify-between">
                  <div
                    class="flex items-center gap-1.5 text-[10px] text-secondary-text/80"
                  >
                    <!-- Read-receipt style ticks -->
                    <span
                      class="flex items-center"
                      :title="item.is_read ? 'Read' : 'Delivered'"
                    >
                      <Check
                        v-if="!item.is_read"
                        class="h-3 w-3 text-secondary-text/60"
                      />
                      <CheckCheck v-else class="h-3 w-3 text-primary" />
                    </span>
                    <span>{{ formatTimeAgo(item.created_at) }}</span>
                  </div>

                  <div
                    class="flex items-center gap-2.5 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <a
                      v-if="item.action_url"
                      :href="item.action_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-0.5 text-[10.5px] font-medium text-primary hover:underline"
                    >
                      <span>Open</span>
                      <ExternalLink class="h-2.5 w-2.5" />
                    </a>

                    <button
                      @click.stop="markAsRead(item.id)"
                      class="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-secondary-text hover:bg-primary/10 hover:text-primary"
                      title="Mark as read"
                    >
                      <Check class="h-3 w-3" />
                      <span>Read</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-primary-border/70 bg-background/40 p-2">
          <button
            @click="openDrawer"
            class="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <!-- <Sparkles class="h-3.5 w-3.5" /> -->
            View all notifications
          </button>
        </div>
      </div>
    </Transition>

    <!-- Side Drawer -->
    <MyNotificationsDrawer :open="drawerOpen" @close="drawerOpen = false" />
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.pop-enter-active {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-enter-from {
  transform: scale(0);
}
</style>
