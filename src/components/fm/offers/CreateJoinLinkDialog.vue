<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    @click.self="emit('close')"
  >
    <div
      class="bg-card-background rounded-2xl border border-primary-border w-full max-w-md shadow-2xl overflow-hidden"
    >
      <div
        class="px-6 py-4 border-b border-primary-border flex items-center justify-between"
      >
        <h2 class="text-sm font-bold text-primary-text">
          {{ isEditing ? 'Edit Join Link' : 'Create Join Link' }}
        </h2>
        <button
          class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-secondary-text hover:text-primary-text cursor-pointer"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="px-6 py-5 space-y-4">
        <p v-if="!isEditing" class="text-[11px] text-secondary-text leading-relaxed">
          A unique referral key automatically generated and appended to the Social Trading URL. Followers who join using this URL will be associated with the corresponding offer.
        </p>

        <div>
          <p class="text-xs text-secondary-text mb-1.5">Title</p>
          <input
            v-model="form.title"
            type="text"
            placeholder="e.g. June Campaign"
            class="w-full px-3 py-2.5 rounded-lg bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text"
          />
          <p class="text-[11px] text-secondary-text mt-1">
            A short label for this join link (shown in your management list).
          </p>
        </div>

        <div>
          <p class="text-xs text-secondary-text mb-1.5">Description</p>
          <input
            v-model="form.description"
            type="text"
            placeholder="e.g. VIP Users"
            class="w-full px-3 py-2.5 rounded-lg bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text"
          />
          <p class="text-[11px] text-secondary-text mt-1">
            Optional context shown to followers when they open this join link.
          </p>
        </div>

        <!-- Active Toggle (Only for Edit) -->
        <div
          v-if="isEditing"
          class="flex items-center justify-between px-3.5 py-3 bg-background border border-primary-border rounded-xl"
        >
          <div>
            <p class="text-xs font-semibold text-primary-text">Link Status</p>
            <p class="text-[11px] text-secondary-text">Enable or disable this join link.</p>
          </div>
          <button
            type="button"
            class="relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer"
            :class="form.is_active ? 'bg-button' : 'bg-background border border-primary-border'"
            @click="form.is_active = !form.is_active"
          >
            <span
              class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform duration-200"
              :class="form.is_active ? 'translate-x-5 bg-button-text' : 'translate-x-0 bg-secondary-text'"
            />
          </button>
        </div>

        <!-- One Time Toggle -->
        <div
          class="flex items-center justify-between px-3.5 py-3 bg-background border border-primary-border rounded-xl"
        >
          <div>
            <p class="text-xs font-semibold text-primary-text">One Time Use</p>
            <p class="text-[11px] text-secondary-text">Link can only be used once.</p>
          </div>
          <button
            type="button"
            class="relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer"
            :class="form.one_time ? 'bg-button' : 'bg-background border border-primary-border'"
            @click="toggleOneTime"
          >
            <span
              class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform duration-200"
              :class="form.one_time ? 'translate-x-5 bg-button-text' : 'translate-x-0 bg-secondary-text'"
            />
          </button>
        </div>

        <div>
          <p class="text-xs text-secondary-text mb-1.5">Max Uses</p>
          <input
            v-model.number="form.max_uses"
            type="number"
            min="1"
            placeholder="e.g. 100"
            :disabled="form.one_time"
            class="w-full px-3 py-2.5 rounded-lg bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p class="text-[11px] text-secondary-text mt-1">
            {{ form.one_time ? 'Auto-set to 1 for one-time links.' : 'Leave blank for unlimited uses.' }}
          </p>
        </div>

        <div>
          <p class="text-xs text-secondary-text mb-1.5 font-medium">Expiration Date</p>
          <div class="relative flex items-center">
            <Calendar class="absolute left-3.5 w-4 h-4 text-secondary-text pointer-events-none" />
            <input
              v-model="form.expires_at"
              type="date"
              :min="minDate"
              class="w-full pl-10 pr-3 py-2.5 rounded-lg bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary transition-all placeholder:text-secondary-text cursor-pointer [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
            />
          </div>
          <p class="text-[11px] text-secondary-text mt-1">Leave empty for no expiration date.</p>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-primary-border flex gap-3 bg-card-background">
        <button
          class="flex-1 px-4 py-2.5 rounded-full text-xs font-medium text-secondary-text border border-primary-border cursor-pointer"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          :disabled="loading"
          class="flex-1 px-4 py-2.5 rounded-full text-xs font-semibold bg-button text-button-text flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          @click="submit"
        >
          <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{
            isEditing
              ? loading
                ? 'Updating...'
                : 'Update Link'
              : loading
              ? 'Generating...'
              : 'Generate Link'
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X, Link2, Loader2, Calendar } from 'lucide-vue-next'
import { useFmOffersStore } from '@/stores/fm/offers'
import { useSnackbarStore } from '@/stores/shared/snackbar'

const props = defineProps({
  open: { type: Boolean, default: false },
  offerId: { type: [String, Number], required: true },
  editLink: { type: Object, default: null },
})

const emit = defineEmits(['close'])
const store = useFmOffersStore()
const snackbar = useSnackbarStore()

const isEditing = computed(() => !!props.editLink)

const minDate = new Date().toLocaleDateString('en-CA')

const form = ref({
  title: '',
  description: '',
  max_uses: null,
  one_time: false,
  expires_at: null,
  is_active: true,
})

const loading = computed(() =>
  isEditing.value ? store.updateLinkLoading : store.createLinkLoading
)

const toggleOneTime = () => {
  form.value.one_time = !form.value.one_time
  if (form.value.one_time) {
    form.value.max_uses = 1
  }
}

watch(
  [() => props.open, () => props.editLink],
  ([isOpen]) => {
    if (!isOpen) return
    if (props.editLink) {
      form.value = {
        title: props.editLink.title || '',
        description: props.editLink.description || '',
        max_uses: props.editLink.max_uses ?? null,
        one_time: Boolean(props.editLink.one_time || props.editLink.max_uses === 1),
        expires_at: props.editLink.expires_at
          ? new Date(props.editLink.expires_at).toISOString().split('T')[0]
          : null,
        is_active: props.editLink.is_active ?? true,
      }
    } else {
      form.value = {
        title: '',
        description: '',
        max_uses: null,
        one_time: false,
        expires_at: null,
        is_active: true,
      }
    }
  },
  { immediate: true }
)

const submit = () => {
  let expiresAtFormatted = null
  if (form.value.expires_at) {
    const d = new Date(form.value.expires_at)
    if (!isNaN(d.getTime())) {
      expiresAtFormatted = d.toISOString().replace('Z', '+00:00')
    }
  }

  const payload = {
    title: form.value.title || '',
    description: form.value.description || '',
    one_time: Boolean(form.value.one_time),
    max_uses: form.value.one_time ? 1 : (form.value.max_uses ? Number(form.value.max_uses) : null),
    expires_at: expiresAtFormatted,
    is_active: Boolean(form.value.is_active),
  }

  if (isEditing.value) {
    store.updateJoinLink(props.offerId, props.editLink.id, payload, () => {
      emit('close')
    })
  } else {
    store.createJoinLink(props.offerId, payload, () => {
      emit('close')
    })
  }
}
</script>
