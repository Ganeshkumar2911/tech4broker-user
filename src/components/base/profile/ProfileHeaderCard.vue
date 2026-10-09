<template>
  <div
    class="relative bg-card-background rounded-2xl p-5"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 min-w-0 flex-1">
        <!-- Avatar -->
        <div class="relative shrink-0 w-16 h-16">
          <div
            class="w-full h-full rounded-full bg-secondary border border-primary-border flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Avatar"
              class="w-full h-full object-cover"
            />

            <span v-else class="text-primary text-xl font-bold">
              {{ initials }}
            </span>
          </div>

          <!-- Camera Button / IB Tooltip -->
          <div class="absolute -bottom-1 -right-1 z-10">
            <Tooltip
              v-if="isIbPortal"
              text="You cannot edit profile from IB portal. You need to switch to client portal."
              position="right"
            >
              <button
                type="button"
                disabled
                class="w-6 h-6 rounded-full bg-secondary border-2 border-card-background flex items-center justify-center text-white/50 opacity-60 cursor-not-allowed"
              >
                <Camera class="w-3 h-3" />
              </button>
            </Tooltip>

            <button
              v-else
              type="button"
              @click="$emit('change-avatar')"
              class="w-6 h-6 rounded-full bg-secondary border-2 border-card-background flex items-center justify-center text-white hover:bg-secondary/80 transition-colors cursor-pointer"
              title="Change photo"
            >
              <Camera class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- User Details -->
        <div class="flex-1 space-y-2 min-w-0">
          <!-- Name -->
          <div class="flex items-center gap-2">
            <h4 class="text-primary-text font-bold text-lg">
              {{ user?.name || "User" }}
            </h4>

            <!-- <button
              type="button"
              @click="$emit('edit')"
              class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
              title="Edit name"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button> -->
          </div>

          <!-- UID -->
          <div class="mt-1.5">
            <span
              class="inline-flex items-center gap-1.5 bg-background text-primary-text text-[11px] font-bold px-2.5 py-1 rounded-md"
            >
              UID: {{ user?.user_id ?? "—" }}

              <button
                type="button"
                @click="copyUid"
                class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
                title="Copy UID"
              >
                <component :is="copied ? Check : Copy" class="w-3 h-3" />
              </button>
            </span>
          </div>

          <!-- Contact Details -->
          <div
            class="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-y-1.5 mt-3 text-xs text-secondary-text"
          >
            <span class="inline-flex items-center gap-1.5">
              <Mail class="w-3.5 h-3.5" />
              {{ user?.email || "Not linked" }}
            </span>

            <span class="inline-flex items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5" />
              {{ getCountryDisplayLabel(user?.country) }}
            </span>

            <span class="inline-flex items-center gap-1.5">
              <Phone class="w-3.5 h-3.5" />
              {{ maskedPhone }}

              <span
                class="font-bold"
                :class="
                  (user?.phone_verified || String(user?.kyc_status || '').toLowerCase() === 'approved') ? 'text-green-600' : 'text-amber-500'
                "
              >
                {{ (user?.phone_verified || String(user?.kyc_status || '').toLowerCase() === 'approved') ? "Verified" : "Unverified" }}
              </span>
            </span>

            <span v-if="user?.updated_at" class="inline-flex items-center gap-1.5">
              <Clock class="w-3.5 h-3.5 text-primary" />
              Updated: {{ formatDate(user.updated_at) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Logout Button -->
      <button
        type="button"
        @click="handleLogout"
        class="shrink-0 group inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-500 transition-all duration-200 hover:bg-red-500 hover:text-white cursor-pointer"
        title="Logout"
      >
        <LogOut
          class="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        <span>Logout</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, useAttrs } from "vue";
import { useRouter } from "vue-router";
import authToken from "@/common/authToken";
import {
  Camera,
  Pencil,
  Copy,
  Check,
  Mail,
  MapPin,
  Phone,
  LogOut,
  Clock,
} from "lucide-vue-next";
import Tooltip from "@/components/base/Tooltip.vue";
import { useProfileStore } from "@/stores/shared/profile";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { getCountryDisplayLabel } from "@/utils/Countries";
import { formatDate } from "@/utils/timeFormatter.js";

const props = defineProps({
  user: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["edit", "change-avatar", "logout"]);

const router = useRouter();
const attrs = useAttrs();
const profileStore = useProfileStore();
const snackbar = useSnackbarStore();
const copied = ref(false);

const handleLogout = () => {
  emit("logout");
  if (!attrs.onLogout) {
    authToken.removeToken();
    localStorage.removeItem("role");
    sessionStorage.clear();
    snackbar.show("Logout.", "info");
    router.push({ name: "login" }).then(() => {
      window.location.reload();
    });
  }
};

const isIbPortal = computed(() => {
  return profileStore.activeRole === "ib" || localStorage.getItem("role") === "ib";
});

const avatarUrl = computed(() => {
  return (
    props.user?.avatar_url ||
    props.user?.profile_picture ||
    props.user?.profile_image ||
    null
  );
});

const initials = computed(() => {
  return (
    props.user?.name?.charAt(0)?.toUpperCase() ||
    props.user?.email?.charAt(0)?.toUpperCase() ||
    "U"
  );
});

const maskedPhone = computed(() => {
  const phone = props.user?.phone_number || props.user?.phone;
  if (!phone) return "Not linked";
  return phone;
});

const copyUid = async () => {
  if (!props.user?.user_id) return;
  try {
    await navigator.clipboard.writeText(String(props.user.user_id));
    copied.value = true;
    snackbar.show("UID copied to clipboard!", "success");
    setTimeout(() => (copied.value = false), 2000);
  } catch (err) {
    snackbar.show("Failed to copy UID.", "error");
  }
};
</script>
