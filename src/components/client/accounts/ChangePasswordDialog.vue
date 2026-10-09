<script setup>
import { computed, ref, watch } from 'vue'
import { AlertCircle, Eye, EyeOff, Loader2, X } from 'lucide-vue-next'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { useSnackbarStore } from '@/stores/shared/snackbar'

const props = defineProps({
  open: { type: Boolean, default: false },
  account: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const snackbar = useSnackbarStore()

const newPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)

const accountNumber = computed(() => props.account?.account_number ?? props.account?.raw?.account_number ?? props.account?.login ?? "—")
const accountType = computed(() => props.account?.trading_type ?? props.account?.account_type ?? props.account?.raw?.trading_type ?? "—")
const platform = computed(() => props.account?.platform ?? props.account?.raw?.platform ?? "—")

const passwordError = computed(() => {
  if (!newPassword.value) return ''
  const p = newPassword.value
  if (p.length < 8 || p.length > 16) return 'Password must be 8–16 characters'
  if (!/[a-z]/.test(p)) return 'Must include a lowercase letter'
  if (!/[A-Z]/.test(p)) return 'Must include an uppercase letter'
  if (!/[0-9]/.test(p)) return 'Must include a number'
  if (!/[!@#$%^&*]/.test(p)) return 'Must include a special character (! @ # $ % ^ & *)'
  return ''
})

const passwordStrength = computed(() => {
  const p = newPassword.value
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[!@#$%^&*]/.test(p)) score++
  return score
})

const strengthLabel = computed(() => {
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  return labels[passwordStrength.value] ?? ''
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      newPassword.value = ''
      showPassword.value = false
      loading.value = false
    }
  }
)

const closeDialog = () => {
  if (loading.value) return
  emit('close')
}

const submitChangePassword = () => {
  if (loading.value || passwordError.value || !newPassword.value || !props.account?.id) return

  loading.value = true

  const successHandler = () => {
    loading.value = false
    emit('close')
  }

  const failureHandler = (err) => {
    loading.value = false
    snackbar.show(err?.message || err?.error || 'Something went wrong.', 'error')
  }

  apiRequest(urls.KEYS.POST, urls.tradingAccounts.changePassword, {
    data: {
      trading_account_id: props.account.id,
      new_password: newPassword.value,
    },
    isTokenRequired: true,
    onSuccess: successHandler,
    onFailure: failureHandler,
  })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-primary-border bg-card-background shadow-lg"
      @click.stop
    >
      <div class="flex items-center justify-between border-b border-primary-border px-6 py-4">
        <h2 class="text-sm font-semibold text-primary-text">Change Password</h2>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-background"
          @click="closeDialog"
        >
          <X class="h-4 w-4 text-secondary-text" />
        </button>
      </div>

      <div class="space-y-3 px-6 py-5">
        <p class="text-sm text-primary-text">
          Update the password for this real trading account.
        </p>

        <div class="rounded-xl border border-primary-border bg-background p-4 space-y-2">
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="text-secondary-text">Account</span>
            <span class="font-medium text-primary-text tabular-nums">#{{ accountNumber }}</span>
          </div>
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="text-secondary-text">Trading Type</span>
            <span class="font-medium text-primary-text capitalize">{{ accountType }}</span>
          </div>
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="text-secondary-text">Platform</span>
            <span class="font-medium text-primary-text">{{ platform }}</span>
          </div>
        </div>

        <div>
          <p class="text-xs text-secondary-text mb-1.5">Password</p>
          <div class="relative">
            <input
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Create a strong password"
              class="w-full px-3 py-2.5 pr-10 rounded-lg bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary transition-colors placeholder:text-secondary-text"
              :class="{ 'border-primary-red': passwordError }"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition-colors"
              @click="showPassword = !showPassword"
            >
              <Eye v-if="!showPassword" class="w-3.5 h-3.5" />
              <EyeOff v-else class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="passwordError" class="text-[11px] text-primary-red mt-1.5">{{ passwordError }}</p>
          <p class="text-[11px] text-secondary-text mt-1.5 leading-relaxed">
            8–16 characters · letters (a-z, A-Z) · numbers (0-9) · special chars (! @ # $ % ^ & *)
          </p>

          <!-- Strength indicator -->
          <div v-if="newPassword" class="space-y-1.5">
            <div class="flex gap-1">
              <div
                v-for="n in 4"
                :key="n"
                class="flex-1 h-1 rounded-full transition-all"
                :class="n <= passwordStrength
                  ? passwordStrength <= 1 ? 'bg-primary-red'
                  : passwordStrength <= 2 ? 'bg-primary-yellow'
                  : 'bg-primary-green'
                  : 'bg-background'"
              />
            </div>
            <p class="text-[10px] text-secondary-text">{{ strengthLabel }}</p>
          </div>
        </div>
      </div>

      <div class="flex gap-3 border-t border-primary-border px-6 py-4">
        <button
          type="button"
          class="flex-1 rounded-lg border border-primary-border px-4 py-2.5 text-xs font-medium text-secondary-text transition-colors hover:bg-background hover:text-primary-text disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
          @click="closeDialog"
        >
          Cancel
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg bg-primary px-4 py-2.5 text-xs font-medium text-black transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
          :disabled="loading || !!passwordError || !newPassword"
          @click="submitChangePassword"
        >
          <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" />
          <span>{{ loading ? 'Updating...' : 'Confirm' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
