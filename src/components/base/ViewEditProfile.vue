<script setup>
import { ref, computed, watch } from 'vue'
import { countries, findCountryValue } from '../../utils/Countries'
import { formatDate } from '../../utils/timeFormatter.js'
import {
  X,
  PencilLine,
  UserRound,
  BadgeCheck
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'update:modelValue',
  'save',
])

const profileEditMode = ref(false)

const profileForm = ref({
  name: '',
  email: '',
  phone_number: '',
  country: '',
  date_of_birth: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
})

const editableProfileFields = [
  {
    key: 'name',
    label: 'Full Name',
    type: 'text',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
  },
  {
    key: 'phone_number',
    label: 'Phone Number',
    type: 'tel',
  },
  {
    key: 'country',
    label: 'Country',
    type: 'text',
  },
  {
    key: 'date_of_birth',
    label: 'Date of Birth',
    type: 'date',
  },
  {
    key: 'address',
    label: 'Address',
    type: 'text',
    wide: true,
  },
  {
    key: 'city',
    label: 'City',
    type: 'text',
  },
  {
    key: 'state',
    label: 'State',
    type: 'text',
  },
  {
    key: 'zip_code',
    label: 'Zip Code',
    type: 'text',
  },
]

const syncProfileForm = () => {
  const user = props.user || {}

  profileForm.value = {
    name: user.name ?? '',
    email: user.email ?? '',
    phone_number: user.phone_number ?? '',
    country: findCountryValue(user.country ?? ''),
    date_of_birth: user.date_of_birth ?? '',
    address: user.address ?? '',
    city: user.city ?? '',
    state: user.state ?? '',
    zip_code: user.zip_code ?? '',
  }
}

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) {
      profileEditMode.value = false
      syncProfileForm()
    }
  },
  {
    immediate: true,
  }
)

watch(
  () => props.user,
  () => {
    syncProfileForm()
  },
  {
    deep: true,
  }
)

const profileStats = computed(() => [
  {
    label: 'Accounts',
    value: props.user?.total_accounts ?? 0,
  },
  {
    label: 'Role',
    value: props.user?.role ?? '-',
  },
  {
    label: 'Status',
    value: props.user?.is_active ? 'Active' : 'Inactive',
  },
])

const isKycVerified = computed(() => {
  const status = String(props.user?.kyc_status || '').toLowerCase().trim()
  return status === 'approved' || status === 'verified' || status === 'completed'
})

const closeSidebar = () => {
  profileEditMode.value = false
  emit('update:modelValue', false)
}

const saveProfile = async () => {
  try {
    await profileStore.updateUserProfile(profileForm.value)
    profileEditMode.value = false
    emit('save', profileForm.value)
  } catch (err) {
    console.error('Failed to update profile:', err)
  }
}
</script>
<template>
  <transition
  enter-active-class="transition duration-200 ease-out"
  enter-from-class="opacity-0"
  enter-to-class="opacity-100"
  leave-active-class="transition duration-150 ease-in"
  leave-from-class="opacity-100"
  leave-to-class="opacity-0"
>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[60]"
  >
    <!-- Blur Background -->
    <div
      class="absolute inset-0 bg-black/5 backdrop-blur-[2px]"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside
      class="absolute right-0 top-0 h-full w-full max-w-[440px] bg-card-background border-l border-primary-border shadow-2xl flex flex-col"
      @click.stop
    >

      <!-- Header -->
      <div class="px-5 py-4 border-b border-primary-border flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <UserRound class="w-4 h-4 text-primary" />
          </div>

          <h2 class="text-primary-text text-sm font-semibold">
            View / Edit Profile
          </h2>
        </div>

        <button
          @click="closeSidebar"
          class="text-secondary-text hover:text-primary-text transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-5">

        <!-- User Info -->
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-full bg-background border border-primary-border flex items-center justify-center">
            <span class="text-primary text-base font-bold">
              {{
                user?.name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                'U'
              }}
            </span>
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-2">
              <p class="text-primary-text text-sm font-semibold">
                {{ user?.name || 'User' }}
              </p>

              <BadgeCheck
                v-if="isKycVerified"
                class="w-4 h-4 text-primary-green"
              />
            </div>

            <p class="text-secondary-text text-xs">
              {{ user?.email || '-' }}
            </p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="stat in profileStats"
            :key="stat.label"
            class="bg-background rounded-lg border border-primary-border px-3 py-2"
          >
            <p class="text-secondary-text text-[10px]">
              {{ stat.label }}
            </p>

            <p class="text-primary-text text-xs font-semibold mt-1 capitalize">
              {{ stat.value }}
            </p>
          </div>
        </div>

        <div v-if="user?.updated_at" class="text-[11px] text-secondary-text flex items-center justify-between px-1">
          <span>Last Updated</span>
          <span class="font-mono font-medium text-primary-text">{{ formatDate(user.updated_at) }}</span>
        </div>

        <!-- Personal Details -->
        <div class="pt-4 border-t border-primary-border space-y-3">

          <div class="flex items-center justify-between">
            <p class="text-primary-text text-xs font-semibold">
              Personal Details
            </p>

            <button
              @click="profileEditMode = !profileEditMode"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer"
            >
              <PencilLine class="w-3.5 h-3.5" />

              <span>
                {{ profileEditMode ? 'View' : 'Edit' }}
              </span>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">

            <div
              v-for="field in editableProfileFields"
              :key="field.key"
              class="flex flex-col gap-1"
              :class="{ 'col-span-2': field.wide }"
            >
              <label class="text-secondary-text text-[10px]">
                {{ field.label }}
              </label>
                <BaseSelect
               v-if="field.key === 'country'"
               v-model="profileForm.country"
               :options="countries"
                placeholder="Select Country"
                variant="surface"
               :disabled="!profileEditMode"
             />


              <input
              v-else
                v-model="profileForm[field.key]"
                :type="field.type"
                :readonly="!profileEditMode"
                :placeholder="field.label"
                class="w-full bg-background border border-primary-border rounded-lg px-3 py-2 text-primary-text text-xs focus:outline-none transition"
                :class="profileEditMode ? 'focus:border-primary' : 'cursor-default'"
              />
            </div>

          </div>

        </div>

      </div>

      <!-- Footer -->
      <div class="px-5 py-4 border-t border-primary-border flex gap-2">

        <button
          @click="closeSidebar"
          class="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-primary-text hover:bg-primary-border transition cursor-pointer"
        >
          Close
        </button>

        <button
          @click="profileEditMode = !profileEditMode"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-black hover:bg-primary-hover transition cursor-pointer"
        >
          <PencilLine class="w-3.5 h-3.5" />

          <span>
            {{ profileEditMode ? 'Done' : 'Edit Profile' }}
          </span>
        </button>

      </div>

    </aside>
    </div>
  </transition>
</template>