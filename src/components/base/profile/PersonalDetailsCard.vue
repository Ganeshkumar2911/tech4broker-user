<template>
  <div id="personal-details-card" class="bg-card-background rounded-3xl p-6 sm:p-7">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h4 class="text-primary-text font-bold text-lg">Personal Details</h4>
        <p class="text-secondary-text text-xs mt-0.5">
          {{ isFm ? "Manage your fund manager information, contact details, and strategy bio." : "Keep your personal information up to date." }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="editMode"
          type="button"
          @click="cancelEdit"
          class="text-secondary-text hover:text-primary-text font-semibold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
        >
          Cancel
        </button>

        <!-- IB Portal Tooltip / Disabled State -->
        <Tooltip
          v-if="isIbPortal"
          text="You cannot edit profile from IB portal. You need to switch to client portal."
          position="left"
        >
          <button
            type="button"
            disabled
            class="flex items-center gap-1.5 bg-background text-secondary-text font-semibold text-xs px-4 py-2.5 rounded-full opacity-60 cursor-not-allowed"
          >
            <Pencil class="w-3.5 h-3.5" />
            Edit
          </button>
        </Tooltip>

        <!-- Standard Edit / Save Button -->
        <button
          v-else
          type="button"
          @click="editMode ? saveDetails() : (editMode = true)"
          :disabled="loading"
          class="flex items-center gap-1.5 bg-background text-primary-text font-semibold text-xs px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <component :is="editMode ? Check : Pencil" class="w-3.5 h-3.5" />
          {{ editMode ? (loading ? 'Saving...' : 'Save') : 'Edit' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        v-for="field in currentFields"
        :key="field.key"
        :class="field.wide ? 'sm:col-span-2' : ''"
      >
        <label class="block text-primary-text text-xs font-semibold mb-1.5">
          {{ field.label }}
          <span v-if="field.readonly" class="text-[10px] text-secondary-text font-normal ml-1">(Non-editable)</span>
        </label>

        <!-- Country BaseSelect -->
        <BaseSelect
          v-if="field.key === 'country'"
          v-model="form.country"
          :options="countries"
          placeholder="Select Country"
          searchable
          :disabled="!editMode"
          height="42px"
          rounded="xl"
        />

        <!-- Bio / Description Textarea (FM Only) -->
        <div v-else-if="field.type === 'textarea'" id="bio-field-wrapper">
          <textarea
            ref="bioTextareaRef"
            id="bio-textarea"
            v-model="form.bio"
            :readonly="!editMode"
            rows="4"
            :placeholder="field.placeholder || 'Describe your trading strategy, performance history, and market philosophy...'"
            class="w-full px-4 py-3 rounded-xl border bg-background text-primary-text text-sm outline-none transition-all duration-200 resize-none leading-relaxed"
            :class="[
              editMode
                ? isBioFocused
                  ? 'border-primary ring-2 ring-primary/40 shadow-sm'
                  : 'border-primary-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                : 'border-primary-border cursor-default opacity-85 bg-background/50'
            ]"
            @focus="isBioFocused = true"
            @blur="isBioFocused = false"
          />
          <p v-if="editMode" class="text-[11px] text-secondary-text mt-1 text-right">
            {{ form.bio?.length || 0 }} characters
          </p>
        </div>

        <!-- Standard Input -->
        <BaseDateRangePicker
          v-else-if="field.key === 'date_of_birth' || field.type === 'date'"
          v-model="form[field.key]"
          mode="single"
          borderless
          :range="false"
          :disabled="!editMode || field.readonly"
          :placeholder="field.label"
          :max-date="new Date()"
          value-format="YYYY-MM-DD"
          display-format="YYYY-MM-DD"
          rounded="xl"
          bg-class="w-full px-4 py-2 rounded-xl border border-primary-border bg-background text-primary-text text-sm h-[42px]"
          class="w-full"
        />

        <input
          v-else
          v-model="form[field.key]"
          :type="field.type"
          :readonly="!editMode || field.readonly"
          :placeholder="field.label"
          class="w-full px-4 py-2.5 rounded-xl border border-primary-border bg-background text-primary-text text-sm outline-none transition-colors"
          :class="[
            editMode && !field.readonly
              ? 'focus:border-primary/60 focus:ring-1 focus:ring-primary/20'
              : 'cursor-default opacity-75 bg-background/50'
          ]"
        />
      </div>
    </div>

    <!-- Last Updated Info Footer -->
    <div v-if="props.user?.updated_at" class="mt-6 pt-4 border-t border-primary-border/60 flex items-center justify-between text-xs text-secondary-text">
      <span class="flex items-center gap-1.5">
        <Clock class="w-3.5 h-3.5 text-primary" />
        <span>Last Updated:</span>
      </span>
      <span class="font-mono font-medium text-primary-text">
        {{ formatDate(props.user.updated_at) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Pencil, Check, Clock } from 'lucide-vue-next'
import { countries, findCountryValue } from '@/utils/Countries'
import { formatDate } from '@/utils/timeFormatter.js'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseDateRangePicker from '@/components/base/BaseDateRangePicker.vue'
import Tooltip from '@/components/base/Tooltip.vue'
import { useProfileStore } from '@/stores/shared/profile'

const props = defineProps({
  user: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  isFm: { type: Boolean, default: false },
})

const emit = defineEmits(['save'])

const profileStore = useProfileStore()
const editMode = ref(false)

const isIbPortal = computed(() => {
  return profileStore.activeRole === 'ib' || localStorage.getItem('role') === 'ib'
})

const baseFields = [
  { key: 'name', label: 'Full Name', type: 'text', readonly: true },
  { key: 'email', label: 'Email', type: 'email', readonly: true },
  { key: 'phone_number', label: 'Phone Number', type: 'tel' },
  { key: 'country', label: 'Country', type: 'text' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'address', label: 'Address', type: 'text', wide: true },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'zip_code', label: 'Zip Code', type: 'text' },
]

const currentFields = computed(() => {
  if (props.isFm) {
    return [
      ...baseFields,
      {
        key: 'bio',
        label: 'Bio / Description',
        type: 'textarea',
        wide: true,
        placeholder: 'Describe your trading experience, risk strategy, and philosophy for your copiers...',
      },
    ]
  }
  return baseFields
})

const form = ref({
  name: '',
  email: '',
  phone_number: '',
  country: '',
  date_of_birth: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  bio: '',
})

const formatDateForInput = (dateStr) => {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

const syncForm = () => {
  const user = props.user || {}
  form.value = {
    name: user.name ?? '',
    email: user.email ?? '',
    phone_number: user.phone_number ?? user.phone ?? '',
    country: findCountryValue(user.country ?? ''),
    date_of_birth: formatDateForInput(user.date_of_birth ?? user.dob),
    address: user.address ?? user.adderss ?? '',
    city: user.city ?? '',
    state: user.state ?? '',
    zip_code: user.zip_code ?? user.zipcode ?? '',
    bio: user.bio ?? user.description ?? '',
  }
}

watch(() => props.user, syncForm, { immediate: true, deep: true })

const cancelEdit = () => {
  syncForm()
  editMode.value = false
}

const bioTextareaRef = ref(null)
const isBioFocused = ref(false)

const startEdit = async (targetField = null) => {
  editMode.value = true
  await nextTick()

  if (targetField === 'bio') {
    const el = document.getElementById('bio-field-wrapper') || document.getElementById('personal-details-card')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    isBioFocused.value = true

    setTimeout(() => {
      if (bioTextareaRef.value) {
        bioTextareaRef.value.focus()
        const len = bioTextareaRef.value.value ? bioTextareaRef.value.value.length : 0
        bioTextareaRef.value.setSelectionRange(len, len)
      }
    }, 120)
  } else {
    const el = document.getElementById('personal-details-card')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const saveDetails = () => {
  const payload = {
    phone_number: form.value.phone_number || '',
    country: form.value.country || '',
    date_of_birth: form.value.date_of_birth || '',
    address: form.value.address || '',
    city: form.value.city || '',
    state: form.value.state || '',
    zip_code: form.value.zip_code || '',
  }

  if (props.isFm) {
    payload.bio = form.value.bio || ''
    payload.description = form.value.bio || ''
  }

  emit('save', payload)
  editMode.value = false
}

defineExpose({ startEdit, editMode })
</script>