<template>
  <div class="rounded-3xl bg-card-background overflow-hidden">
    <!-- ── Cover / Banner ── -->
    <div class="relative w-full aspect-[3/1] md:aspect-[6/1] overflow-hidden group">
      <img
        :src="bannerUrl"
        alt="Profile Cover Banner"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />

      <div
        class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"
      />

      <!-- Change Banner Button (Top-Right of Banner) -->
      <div class="absolute top-4 right-4 z-10">
        <button
          type="button"
          @click="$emit('change-banner')"
          class="flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95"
          title="Change profile banner"
        >
          <Camera class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Change Banner</span>
        </button>
      </div>
    </div>

    <!-- ── Profile Body with Overlapping Avatar ── -->
    <div class="px-5 sm:px-8 pb-6">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-18 md:-mt-20 mb-4">
        <!-- Avatar Wrapper -->
        <div class="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
          <div
            class="w-full h-full rounded-full bg-secondary border-4 border-card-background shadow-sm flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-primary text-3xl sm:text-4xl font-bold">
              {{ initials }}
            </span>
          </div>

          <!-- Camera Badge for Avatar Upload -->
          <button
            type="button"
            @click="$emit('change-avatar')"
            class="absolute bottom-1 right-1 z-10 w-8 h-8 rounded-full bg-primary text-black  flex items-center justify-center hover:bg-primary-hover transition-transform duration-200 active:scale-90 cursor-pointer shadow-md"
            title="Change profile photo"
          >
            <Camera class="w-4 h-4" />
          </button>
        </div>

        <!-- Quick Status & Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
          <button
            type="button"
            @click="$emit('edit-details')"
            class="flex items-center gap-2 bg-background hover:bg-primary-border/50 text-primary-text font-semibold text-xs px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Pencil class="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      <!-- Identity Information -->
      <div class="space-y-1">
        <!-- Name & Badges -->
        <div class="flex flex-wrap items-center gap-2.5">
          <h3 class="text-primary-text font-bold text-lg">
            {{ user?.name || "Fund Manager" }}
          </h3>

          <!-- Role Badge -->
          <span
            class="inline-flex items-center gap-1 bg-primary/10 text-primary text-[8px] font-semibold px-2.5 py-0.5 rounded-full"
          >
            <ShieldCheck class="w-3.5 h-3.5" />
            Fund Manager
          </span>

          <!-- KYC Badge -->
          <span
            v-if="isVerified"
            class="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-semibold px-2.5 py-0.5 rounded-full"
          >
            <BadgeCheck class="w-3.5 h-3.5" />
            Verified
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold px-2.5 py-0.5 rounded-full"
          >
            <Clock class="w-3.5 h-3.5" />
            KYC Pending
          </span>
        </div>

        <!-- UID Pill -->
        <div>
          <span
            class="inline-flex items-center gap-2 bg-background text-primary-text text-xs font-semibold px-3 py-1.5 rounded-xl"
          >
            <span class="text-secondary-text font-normal">UID:</span>
            <span>{{ user?.user_id ?? "—" }}</span>

            <button
              type="button"
              @click="copyUid"
              class="text-secondary-text hover:text-primary transition-colors cursor-pointer ml-1"
              title="Copy UID"
            >
              <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
            </button>
          </span>
        </div>

        <!-- Contact Pills (Email, Phone, Country, Address) -->
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-secondary-text">
          <span class="inline-flex items-center gap-1.5">
            <Mail class="w-3.5 h-3.5 text-primary" />
            {{ user?.email || "Not linked" }}
          </span>

          <span class="inline-flex items-center gap-1.5">
            <Phone class="w-3.5 h-3.5 text-primary" />
            {{ maskedPhone }}
            <span
              class="text-[10px] font-bold px-1.5 py-0.5 rounded"
              :class="
                (user?.phone_verified || isVerified)
                  ? 'text-green-500 bg-green-500/10'
                  : 'text-amber-500 bg-amber-500/10'
              "
            >
              {{ (user?.phone_verified || isVerified) ? "Verified" : "KYC Pending" }}
            </span>
          </span>

          <span class="inline-flex items-center gap-1.5">
            <MapPin class="w-3.5 h-3.5 text-primary" />
            {{ locationString }}
          </span>

          <span v-if="user?.updated_at" class="inline-flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5 text-primary" />
            Updated: {{ formatDate(user.updated_at) }}
          </span>
        </div>
      </div>

      <!-- ── LinkedIn-Style "About / Bio" Section ── -->
      <div class="mt-4 pt-2 border-t border-primary-border">
        <div class="flex items-center justify-between mb-2.5">
          <h4 class="text-primary-text font-bold text-base flex items-center gap-2">
            <span>About / Bio</span>
          </h4>

          <button
            type="button"
            @click="$emit('edit-bio')"
            class="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Pencil class="w-3 h-3" />
            <span>{{ hasBio ? 'Edit Bio' : 'Add Bio' }}</span>
          </button>
        </div>

        <div
          v-if="hasBio"
          class="bg-background rounded-2xl p-4 text-sm text-secondary-text leading-relaxed whitespace-pre-line"
        >
          {{ bioContent }}
        </div>

        <div
          v-else
          @click="$emit('edit-bio')"
          class="bg-background rounded-2xl p-4 text-center cursor-pointer transition-colors"
        >
          <p class="text-xs text-secondary-text">
            No bio added yet. Click to write a description of your trading strategy, philosophy, and background.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  Camera,
  Pencil,
  Copy,
  Check,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  BadgeCheck,
  Clock,
} from "lucide-vue-next";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { getCountryDisplayLabel } from "@/utils/Countries";
import { formatDate } from "@/utils/timeFormatter.js";

const props = defineProps({
  user: { type: Object, default: () => ({}) },
});

defineEmits(["edit-details", "edit-bio", "change-avatar", "change-banner"]);

const snackbar = useSnackbarStore();
const copied = ref(false);

const defaultBanner =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1600&auto=format&fit=crop";

const bannerUrl = computed(() => {
  return (
    props.user?.profile_banner ||
    props.user?.banner_url ||
    props.user?.banner ||
    defaultBanner
  );
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
    "F"
  );
});

const isVerified = computed(() => {
  const status = String(props.user?.kyc_status || "").toLowerCase().trim();
  return status === "approved" || status === "verified" || status === "completed";
});

const maskedPhone = computed(() => {
  const phone = props.user?.phone_number || props.user?.phone;
  if (!phone) return "Not linked";
  return phone;
});

const locationString = computed(() => {
  const parts = [];
  if (props.user?.city) parts.push(props.user.city);
  if (props.user?.state) parts.push(props.user.state);
  if (props.user?.country) parts.push(getCountryDisplayLabel(props.user.country));
  return parts.length > 0 ? parts.join(", ") : "Location not set";
});

const bioContent = computed(() => {
  return props.user?.bio || props.user?.description || "";
});

const hasBio = computed(() => {
  return Boolean(bioContent.value && bioContent.value.trim().length > 0);
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
