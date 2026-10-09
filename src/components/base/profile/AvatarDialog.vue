<script setup>
import { ref, computed, watch } from "vue";
import { X, UploadCloud, Trash2, Loader2, Eye, Camera } from "lucide-vue-next";
import { useProfileStore } from "@/stores/shared/profile";
import { useSnackbarStore } from "@/stores/shared/snackbar";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["close", "success"]);

const profileStore = useProfileStore();
const snackbar = useSnackbarStore();

const fileInputRef = ref(null);
const selectedFile = ref(null);
const previewUrl = ref(null);
const isDragging = ref(false);
const loading = ref(false);
const showFullPreview = ref(false);

const currentAvatarUrl = computed(() => {
  return (
    previewUrl.value ||
    props.user?.avatar_url ||
    props.user?.profile_picture ||
    props.user?.profile_image ||
    null
  );
});

const userInitials = computed(() => {
  return (
    props.user?.name?.charAt(0)?.toUpperCase() ||
    props.user?.email?.charAt(0)?.toUpperCase() ||
    "U"
  );
});

watch(
  () => props.open,
  (val) => {
    if (val) {
      selectedFile.value = null;
      previewUrl.value = null;
      showFullPreview.value = false;
      if (fileInputRef.value) fileInputRef.value.value = "";
    }
  }
);

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const validateAndSetFile = (file) => {
  if (!file) return;

  const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!validTypes.includes(file.type)) {
    snackbar.show("Please select a valid image (PNG, JPG, JPEG, WEBP).", "error");
    return;
  }

  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeInBytes) {
    snackbar.show("File size exceeds 10MB limit.", "error");
    return;
  }

  selectedFile.value = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const onFileChange = (e) => {
  const file = e.target.files?.[0];
  validateAndSetFile(file);
};

const onDragOver = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const onDragLeave = (e) => {
  e.preventDefault();
  isDragging.value = false;
};

const onDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  validateAndSetFile(file);
};

const removeSelectedFile = () => {
  selectedFile.value = null;
  previewUrl.value = null;
  if (fileInputRef.value) fileInputRef.value.value = "";
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const handleSave = async () => {
  if (!selectedFile.value) {
    snackbar.show("Please choose a photo to upload.", "info");
    return;
  }

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("profile_picture", selectedFile.value);

    await profileStore.updateUserProfile(formData);
    emit("success");
    emit("close");
  } catch (err) {
    console.error("Avatar upload failed:", err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-md bg-card-background rounded-3xl p-6 sm:p-7 overflow-hidden animate-scale-up"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-primary-border pb-4 mb-6">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Camera class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-base font-bold text-primary-text">Profile Picture</h3>
                <p class="text-xs text-secondary-text">Upload and preview your avatar photo</p>
              </div>
            </div>

            <button
              type="button"
              @click="emit('close')"
              class="w-8 h-8 rounded-full flex items-center justify-center text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Avatar Preview Section -->
          <div class="flex flex-col items-center gap-4 mb-6">
            <div class="relative group">
              <div
                class="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-background flex items-center justify-center overflow-hidden"
              >
                <img
                  v-if="currentAvatarUrl"
                  :src="currentAvatarUrl"
                  alt="Avatar Preview"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-4xl font-bold text-primary">
                  {{ userInitials }}
                </span>
              </div>

              <!-- View Full preview overlay if avatar exists -->
              <button
                v-if="currentAvatarUrl"
                type="button"
                @click="showFullPreview = !showFullPreview"
                class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1.5 transition-opacity cursor-pointer backdrop-blur-[2px]"
              >
                <Eye class="w-4 h-4" />
                <span>View</span>
              </button>
            </div>

            <!-- Full size popup preview if clicked -->
            <div
              v-if="showFullPreview && currentAvatarUrl"
              class="w-full p-2 bg-background rounded-xl flex flex-col items-center gap-2"
            >
              <img
                :src="currentAvatarUrl"
                alt="Full preview"
                class="max-h-48 rounded-lg object-contain"
              />
              <button
                type="button"
                class="text-xs cursor-pointer text-secondary-text hover:text-primary-text"
                @click="showFullPreview = false"
              >
                Close preview
              </button>
            </div>
          </div>

          <!-- Hidden File Input -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            class="hidden"
            @change="onFileChange"
          />

          <!-- Upload Drop Area -->
          <div
            class="border-2 border-dashed rounded-2xl p-5 text-center transition-colors cursor-pointer mb-6"
            :class="
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-primary-border hover:border-primary/50 bg-background/50 hover:bg-background'
            "
            @click="triggerFileInput"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 rounded-full bg-card-background border border-primary-border flex items-center justify-center text-secondary-text">
                <UploadCloud class="w-5 h-5 text-primary" />
              </div>

              <div>
                <p class="text-xs font-semibold text-primary-text">
                  <span class="text-primary hover:underline">Click to upload</span> or drag and drop
                </p>
                <p class="text-[11px] text-secondary-text mt-0.5">
                  PNG, JPG, JPEG, WEBP (Max 10MB)
                </p>
              </div>
            </div>
          </div>

          <!-- Selected File Details Banner -->
          <div
            v-if="selectedFile"
            class="flex items-center justify-between p-3 rounded-xl bg-background border border-primary-border mb-6"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-card-background border border-primary-border flex items-center justify-center text-primary text-xs font-bold shrink-0">
                IMG
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-primary-text truncate">
                  {{ selectedFile.name }}
                </p>
                <p class="text-[10px] text-secondary-text font-mono">
                  {{ formatFileSize(selectedFile.size) }}
                </p>
              </div>
            </div>

            <button
              type="button"
              @click.stop="removeSelectedFile"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              title="Remove selected file"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Footer Actions -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2.5 rounded-full border border-primary-border text-xs font-semibold text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              :disabled="!selectedFile || loading"
              @click="handleSave"
              class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-button-text transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style="background: linear-gradient(180deg, #e0ca3c 0%, #ffe74d 100%)"
            >
              <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ loading ? "Uploading..." : "Save Photo" }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-up {
  animation: scaleUp 0.2s ease-out;
}
</style>
