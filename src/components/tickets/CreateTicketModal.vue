<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      @click="emit('close')"
    >
      <div
        class="bg-card-background rounded-2xl sm:rounded-3xl border border-primary-border w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-all duration-200 max-h-[90vh] my-auto"
        @click.stop
      >
        <!-- Header -->
        <div
          class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-primary-border flex items-center justify-between shrink-0"
        >
          <div>
            <h2 class="text-sm sm:text-base font-bold text-primary-text">Create Support Ticket</h2>
            <p class="text-[11px] sm:text-xs text-secondary-text">Fill in the details to submit a new ticket</p>
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors text-secondary-text hover:text-primary-text cursor-pointer"
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSubmit" class="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          <!-- Subject / Issue Category -->
          <div>
            <label class="block text-xs font-semibold text-secondary-text mb-1.5 uppercase tracking-wider">
              Subject Category
            </label>
            <BaseSelect
              v-model="form.subjectCategory"
              :options="subjectOptions"
              placeholder="Select subject category"
            />
          </div>

          <!-- Custom Subject (if Others or custom) -->
          <div v-if="form.subjectCategory === 'others' || !form.subjectCategory">
            <label class="block text-xs font-semibold text-secondary-text mb-1.5 uppercase tracking-wider">
              Subject Title
            </label>
            <input
              v-model="form.subject"
              type="text"
              placeholder="Describe your subject issue..."
              required
              :disabled="store.actionLoading"
              class="w-full px-4 py-2.5 rounded-xl bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-text transition-colors placeholder:text-secondary-text/60 disabled:opacity-50"
            />
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-xs font-semibold text-secondary-text mb-1.5 uppercase tracking-wider">
              Priority
            </label>
            <BaseSelect
              v-model="form.priority"
              :options="priorityOptions"
              placeholder="Select Priority"
            />
          </div>

          <!-- Message / Description -->
          <div>
            <label class="block text-xs font-semibold text-secondary-text mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="Explain your problem or inquiry in detail..."
              required
              :disabled="store.actionLoading"
              class="w-full px-4 py-3 rounded-xl bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-text transition-colors placeholder:text-secondary-text/60 disabled:opacity-50 resize-none"
            ></textarea>
          </div>

          <!-- File Upload Attachment -->
          <div>
            <label class="block text-xs font-semibold text-secondary-text mb-1.5 uppercase tracking-wider">
              Attachment (Optional)
            </label>
            <div
              class="border-2 border-dashed border-primary-border/80 hover:border-primary-text/40 rounded-xl p-4 text-center cursor-pointer transition-colors bg-background/50"
              @click="triggerFileInput"
            >
              <input
                ref="fileInputRef"
                type="file"
                class="hidden"
                accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                @change="handleFileChange"
              />
              <div v-if="!selectedFile" class="flex flex-col items-center justify-center gap-1">
                <UploadCloud class="w-6 h-6 text-secondary-text" />
                <p class="text-xs font-medium text-primary-text">Click to upload screenshot or file</p>
                <p class="text-[10px] text-secondary-text">PNG, JPG, PDF up to 10MB</p>
              </div>
              <div v-else class="flex items-center justify-between bg-card-background p-2.5 rounded-lg border border-primary-border">
                <div class="flex items-center gap-2 truncate">
                  <FileText class="w-4 h-4 text-primary-text shrink-0" />
                  <span class="text-xs font-medium text-primary-text truncate">{{ selectedFile.name }}</span>
                </div>
                <button
                  type="button"
                  @click.stop="selectedFile = null"
                  class="text-secondary-text hover:text-red-500 transition-colors p-1"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-primary-border/60">
            <button
              type="button"
              @click="emit('close')"
              class="px-5 py-2.5 rounded-full text-xs font-semibold text-secondary-text hover:bg-background transition-colors cursor-pointer border border-primary-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="store.actionLoading"
              class="h-10 px-6 rounded-full bg-button text-button-text text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <Loader2 v-if="store.actionLoading" class="w-4 h-4 animate-spin text-button-text" />
              <span>Submit Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive } from "vue";
import { X, Ticket, UploadCloud, FileText, Loader2 } from "lucide-vue-next";
import { useTicketsStore } from "@/stores/tickets";
import BaseSelect from "@/components/base/BaseSelect.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "created"]);
const store = useTicketsStore();

const fileInputRef = ref(null);
const selectedFile = ref(null);

const form = reactive({
  subjectCategory: "Deposit & Withdrawal",
  subject: "",
  priority: "medium",
  description: "",
});

const subjectOptions = [
  { label: "Deposit & Withdrawal", value: "Deposit & Withdrawal" },
  { label: "Trading (MT5)", value: "Trading (MT5)" },
  { label: "Copy Trading", value: "Copy Trading" },
  { label: "Promotion", value: "Promotion" },
  { label: "Introducing broker", value: "Introducing broker" },
  { label: "Others issue", value: "others" },
];

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    selectedFile.value = file;
  }
};

const handleSubmit = () => {
  const selectedSubject =
    form.subjectCategory === "others" || !form.subjectCategory
      ? form.subject
      : form.subjectCategory;

  const formData = new FormData();
  formData.append("subject", selectedSubject);
  formData.append("description", form.description);
  formData.append("priority", form.priority);

  if (selectedFile.value) {
    formData.append("attachments", selectedFile.value);
  }

  store.createTicket(formData, () => {
    form.subject = "";
    form.description = "";
    form.subjectCategory = "Deposit & Withdrawal";
    form.priority = "medium";
    selectedFile.value = null;
    emit("created");
    emit("close");
  });
};
</script>
