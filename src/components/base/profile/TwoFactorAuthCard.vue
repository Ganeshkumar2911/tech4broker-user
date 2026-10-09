<template>
  <div class="bg-card-background rounded-2xl p-5 sm:p-6 space-y-4">
    <!-- Header & Status Row -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck v-if="statusData.totp_enabled" class="w-5 h-5 text-primary-green" />
            <ShieldAlert v-else class="w-5 h-5 text-secondary-text" />
          </div>
          <h4 class="text-primary-text font-bold text-base sm:text-lg">
            Two-Factor Authentication (2FA)
          </h4>
          <!-- Status Badge -->
          <span
            class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors"
            :class="
              statusData.totp_enabled
                ? 'bg-primary-green/10 text-primary-green border-primary-green/20'
                : 'bg-secondary-text/10 text-secondary-text border-primary-border'
            "
          >
            {{ statusData.totp_enabled ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
        <p class="text-secondary-text text-xs sm:text-sm">
          Protect your account transactions and login with Google Authenticator (TOTP).
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- If 2FA is OFF -->
        <button
          v-if="!statusData.totp_enabled"
          type="button"
          :disabled="fetchingStatus"
          style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
          class="text-slate-950 font-bold text-xs px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer hover:brightness-95 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
          @click="openSetupModal"
        >
          <Key class="w-3.5 h-3.5" />
          <span>Enable 2FA</span>
        </button>

        <!-- If 2FA is ON -->
        <template v-else>
          <button
            type="button"
            class="bg-background hover:bg-card-background border border-primary-border text-primary-text font-semibold text-xs px-4 py-2 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            @click="openRegenerateModal"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            <span>Regenerate Codes</span>
          </button>

          <button
            type="button"
            class="bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 font-semibold text-xs px-4 py-2 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            @click="openDisableModal"
          >
            <ShieldOff class="w-3.5 h-3.5" />
            <span>Disable 2FA</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Active 2FA Details Bar -->
    <div
      v-if="statusData.totp_enabled"
      class="bg-background/80 border border-primary-border rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      <div class="flex items-center gap-2 text-secondary-text">
        <CheckCircle2 class="w-4 h-4 text-primary-green" />
        <span>Authenticator app is active for your account.</span>
      </div>

      <div class="flex items-center gap-4 text-secondary-text">
        <span v-if="statusData.backup_codes_remaining !== undefined">
          Remaining Backup Codes:
          <strong class="text-primary-text font-semibold">{{ statusData.backup_codes_remaining }}</strong>
        </span>
        <span v-if="statusData.required_actions && statusData.required_actions.length > 0">
          Required for:
          <strong class="text-primary-text font-semibold capitalize">{{ statusData.required_actions.join(', ') }}</strong>
        </span>
      </div>
    </div>

    <!-- ── 1. Enable / Setup 2FA Modal ── -->
    <Modal v-model="showSetupModal" @close="closeSetupModal">
      <div class="p-6 max-w-md w-full sm:min-w-[420px] max-h-[85vh] overflow-y-auto no-scrollbar">
        <!-- Step A: Backup Codes shown after successful activation -->
        <div v-if="newBackupCodes.length > 0" class="space-y-4 text-left animate-fade-in">
          <div class="flex items-center justify-between border-b border-primary-border pb-3">
            <h3 class="text-lg font-bold text-primary-text flex items-center gap-2">
              <ShieldCheck class="w-5 h-5 text-primary-green" />
              2FA Activated Successfully!
            </h3>
            <button
              type="button"
              @click="closeSetupModal"
              class="text-secondary-text hover:text-primary-text cursor-pointer p-1"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <p class="text-xs text-secondary-text leading-relaxed">
            Please save these one-time backup codes safely. If you lose access to your authenticator app, you can use these codes to log in.
          </p>

          <div class="grid grid-cols-2 gap-2 bg-background p-3.5 rounded-xl border border-primary-border font-mono text-xs text-primary-text text-center select-all">
            <div
              v-for="(code, idx) in newBackupCodes"
              :key="idx"
              class="p-2 bg-card-background rounded border border-primary-border tracking-wider font-semibold"
            >
              {{ code }}
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <button
              type="button"
              class="w-full py-2.5 px-4 rounded-lg border border-primary-border bg-card-background hover:bg-background text-primary-text font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              @click="copyBackupCodes(newBackupCodes)"
            >
              <Copy :size="15" />
              <span>{{ copiedBackup ? 'Copied to Clipboard!' : 'Copy All Backup Codes' }}</span>
            </button>

            <button
              type="button"
              style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
              class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-95"
              @click="closeSetupModal"
            >
              Done
            </button>
          </div>
        </div>

        <!-- Step B: QR Code & Verification Form -->
        <div v-else class="space-y-4 text-left">
          <div class="flex items-center justify-between border-b border-primary-border pb-3">
            <h3 class="text-lg font-bold text-primary-text">
              Enable Two-Factor Authentication
            </h3>
            <button
              type="button"
              @click="closeSetupModal"
              class="text-secondary-text hover:text-primary-text cursor-pointer p-1"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div v-if="setupLoading" class="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 class="w-8 h-8 animate-spin text-primary" />
            <span class="text-xs text-secondary-text">Loading QR code…</span>
          </div>

          <template v-else>
            <div class="text-xs text-secondary-text space-y-2">
              <p>1. Scan the QR code using Google Authenticator, Microsoft Authenticator, or Authy.</p>
              <p>2. Or enter the secret key manually if you cannot scan.</p>
            </div>

            <!-- QR Display -->
            <div class="flex justify-center p-3 bg-white rounded-xl border border-primary-border w-fit mx-auto shadow-xs">
              <img
                v-if="qrCodeDataUrl"
                :src="qrCodeDataUrl"
                alt="2FA QR Code"
                class="w-40 h-40 object-contain rounded"
              />
            </div>

            <!-- Secret Key with Copy -->
            <div v-if="setupSecret" class="bg-background p-2.5 rounded-lg border border-primary-border flex items-center justify-between gap-2">
              <div class="overflow-hidden">
                <span class="block text-[10px] text-secondary-text font-medium">Secret Key:</span>
                <code class="text-xs font-mono font-bold text-primary-text tracking-wider truncate block">
                  {{ setupSecret }}
                </code>
              </div>
              <button
                type="button"
                class="shrink-0 p-1.5 rounded-md hover:bg-card-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
                title="Copy Secret Key"
                @click="copySecret"
              >
                <Copy :size="16" />
              </button>
            </div>

            <!-- 6-digit confirmation code -->
            <form @submit.prevent="handleConfirmSetup" class="space-y-3 pt-2">
              <div>
                <label class="block text-xs font-semibold text-primary-text mb-1.5">
                  Enter 6-digit verification code from app:
                </label>
                <input
                  v-model="setupCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  placeholder="123456"
                  class="input-field px-4 py-2.5 text-center font-mono text-base tracking-widest"
                />
              </div>

              <p v-if="setupError" class="text-[11px] text-primary-red text-center">
                {{ setupError }}
              </p>

              <button
                type="submit"
                :disabled="confirmingSetup || setupCode.trim().length !== 6"
                style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
                class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="confirmingSetup" :size="16" class="animate-spin text-slate-950" />
                <span>{{ confirmingSetup ? 'Verifying…' : 'Activate 2FA' }}</span>
              </button>
            </form>
          </template>
        </div>
      </div>
    </Modal>

    <!-- ── 2. Disable 2FA Modal ── -->
    <Modal v-model="showDisableModal" @close="showDisableModal = false">
      <div class="p-6 max-w-md w-full sm:min-w-[400px]">
        <div class="flex items-center justify-between border-b border-primary-border pb-3 mb-4">
          <h3 class="text-lg font-bold text-primary-text flex items-center gap-2">
            <ShieldOff class="w-5 h-5 text-primary-red" />
            Disable Two-Factor Authentication
          </h3>
          <button
            type="button"
            @click="showDisableModal = false"
            class="text-secondary-text hover:text-primary-text cursor-pointer p-1"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-secondary-text mb-4">
          To disable 2FA, please enter your account password and your current authenticator code (or backup code).
        </p>

        <form @submit.prevent="handleDisable2fa" class="space-y-3.5">
          <!-- Password -->
          <div>
            <label class="block text-xs font-semibold text-primary-text mb-1">
              Current Password
            </label>
            <div class="relative">
              <input
                v-model="disableForm.password"
                :type="showDisablePassword ? 'text' : 'password'"
                placeholder="Enter your account password"
                class="input-field px-4 py-2.5 pr-10"
              />
              <button
                type="button"
                @click="showDisablePassword = !showDisablePassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text cursor-pointer"
              >
                <Eye v-if="showDisablePassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Code / Backup Code -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-primary-text">
                {{ disableUseBackup ? 'Backup Code' : 'Authenticator Code' }}
              </label>
              <button
                type="button"
                class="text-[11px] text-primary hover:underline cursor-pointer"
                @click="disableUseBackup = !disableUseBackup; disableForm.code = ''"
              >
                {{ disableUseBackup ? 'Use App Code' : 'Use Backup Code' }}
              </button>
            </div>
            <input
              v-model="disableForm.code"
              type="text"
              :placeholder="disableUseBackup ? 'e.g. A1B2-C3D4' : '6-digit code'"
              :maxlength="disableUseBackup ? 12 : 6"
              class="input-field px-4 py-2.5 font-mono text-center tracking-wider"
            />
          </div>

          <p v-if="disableError" class="text-[11px] text-primary-red text-center">
            {{ disableError }}
          </p>

          <button
            type="submit"
            :disabled="disabling || !disableForm.password || !disableForm.code"
            class="w-full py-3 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="disabling" :size="16" class="animate-spin text-white" />
            <span>{{ disabling ? 'Disabling 2FA…' : 'Disable 2FA' }}</span>
          </button>
        </form>
      </div>
    </Modal>

    <!-- ── 3. Regenerate Backup Codes Modal ── -->
    <Modal v-model="showRegenerateModal" @close="showRegenerateModal = false">
      <div class="p-6 max-w-md w-full sm:min-w-[400px]">
        <div class="flex items-center justify-between border-b border-primary-border pb-3 mb-4">
          <h3 class="text-lg font-bold text-primary-text flex items-center gap-2">
            <RefreshCw class="w-5 h-5 text-primary" />
            Regenerate Backup Codes
          </h3>
          <button
            type="button"
            @click="showRegenerateModal = false"
            class="text-secondary-text hover:text-primary-text cursor-pointer p-1"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Generated Codes Result Display -->
        <div v-if="regeneratedCodes.length > 0" class="space-y-4">
          <p class="text-xs text-secondary-text">
            New backup codes have been generated. Old backup codes will no longer work. Save these immediately.
          </p>

          <div class="grid grid-cols-2 gap-2 bg-background p-3.5 rounded-xl border border-primary-border font-mono text-xs text-primary-text text-center select-all">
            <div
              v-for="(code, idx) in regeneratedCodes"
              :key="idx"
              class="p-2 bg-card-background rounded border border-primary-border tracking-wider font-semibold"
            >
              {{ code }}
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <button
              type="button"
              class="w-full py-2.5 px-4 rounded-lg border border-primary-border bg-card-background hover:bg-background text-primary-text font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              @click="copyBackupCodes(regeneratedCodes)"
            >
              <Copy :size="15" />
              <span>{{ copiedBackup ? 'Copied to Clipboard!' : 'Copy All Backup Codes' }}</span>
            </button>

            <button
              type="button"
              style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
              class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-95"
              @click="showRegenerateModal = false"
            >
              Done
            </button>
          </div>
        </div>

        <!-- Prompt Code Form -->
        <form v-else @submit.prevent="handleRegenerateCodes" class="space-y-4">
          <p class="text-xs text-secondary-text">
            Enter your current 6-digit Authenticator app code to regenerate your backup codes.
          </p>

          <div>
            <label class="block text-xs font-semibold text-primary-text mb-1.5">
              Authenticator Code
            </label>
            <input
              v-model="regenerateCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="123456"
              class="input-field px-4 py-2.5 text-center font-mono text-base tracking-widest"
            />
          </div>

          <p v-if="regenerateError" class="text-[11px] text-primary-red text-center">
            {{ regenerateError }}
          </p>

          <button
            type="submit"
            :disabled="regenerating || regenerateCode.trim().length !== 6"
            style="background: linear-gradient(180deg, #E0CA3C 0%, #FFE74D 100%)"
            class="w-full py-3 px-4 rounded-lg text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="regenerating" :size="16" class="animate-spin text-slate-950" />
            <span>{{ regenerating ? 'Generating…' : 'Generate New Codes' }}</span>
          </button>
        </form>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Key,
  Copy,
  RefreshCw,
  Loader2,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-vue-next'
import QRCode from 'qrcode'
import { useAuthStore } from '@/stores/shared/auth'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import Modal from '@/components/base/Modal.vue'

const props = defineProps({
  role: { type: String, default: 'client' },
})

const authStore = useAuthStore()
const snackbar = useSnackbarStore()

const fetchingStatus = ref(false)
const statusData = ref({
  feature_enabled: true,
  totp_enabled: false,
  enrollment_mandatory: false,
  required_actions: [],
  issuer_name: 'Panther Capitals',
  backup_codes_remaining: 0,
})

// Setup Modal State
const showSetupModal = ref(false)
const setupLoading = ref(false)
const confirmingSetup = ref(false)
const setupSecret = ref('')
const qrCodeDataUrl = ref('')
const setupCode = ref('')
const setupError = ref('')
const newBackupCodes = ref([])
const copiedBackup = ref(false)

// Disable Modal State
const showDisableModal = ref(false)
const disabling = ref(false)
const showDisablePassword = ref(false)
const disableUseBackup = ref(false)
const disableForm = ref({ password: '', code: '' })
const disableError = ref('')

// Regenerate Modal State
const showRegenerateModal = ref(false)
const regenerating = ref(false)
const regenerateCode = ref('')
const regenerateError = ref('')
const regeneratedCodes = ref([])

onMounted(() => {
  fetchStatus()
})

const fetchStatus = async () => {
  fetchingStatus.value = true
  try {
    const res = await authStore.get2faStatus(props.role)
    const data = res?.data || res
    if (data) {
      statusData.value = {
        feature_enabled: data.feature_enabled ?? true,
        totp_enabled: Boolean(data.totp_enabled),
        enrollment_mandatory: Boolean(data.enrollment_mandatory),
        required_actions: Array.isArray(data.required_actions) ? data.required_actions : [],
        issuer_name: data.issuer_name || 'Panther Capitals',
        backup_codes_remaining: data.backup_codes_remaining || 0,
      }
    }
  } catch (err) {
    console.warn('Could not fetch 2FA status:', err)
  } finally {
    fetchingStatus.value = false
  }
}

// ── Setup 2FA Flow ─────────────────────────────────────
const openSetupModal = async () => {
  showSetupModal.value = true
  setupLoading.value = true
  setupSecret.value = ''
  qrCodeDataUrl.value = ''
  setupCode.value = ''
  setupError.value = ''
  newBackupCodes.value = []

  try {
    const res = await authStore.setup2fa(null, props.role)
    const data = res?.data || res
    setupSecret.value = data?.secret || ''
    const otpauthUri = data?.otpauth_uri || ''
    if (otpauthUri) {
      qrCodeDataUrl.value = await QRCode.toDataURL(otpauthUri, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
    }
  } catch (err) {
    setupError.value = err?.message || err?.error || 'Failed to initialize 2FA setup.'
  } finally {
    setupLoading.value = false
  }
}

const copySecret = () => {
  if (!setupSecret.value) return
  navigator.clipboard.writeText(setupSecret.value)
  snackbar.show('Secret key copied!', 'success')
}

const handleConfirmSetup = async () => {
  if (setupCode.value.trim().length !== 6) return
  confirmingSetup.value = true
  setupError.value = ''

  try {
    const res = await authStore.confirm2fa(setupCode.value.trim(), null, props.role)
    const data = res?.data || res
    statusData.value.totp_enabled = true
    if (data?.backup_codes && Array.isArray(data.backup_codes)) {
      newBackupCodes.value = data.backup_codes
      statusData.value.backup_codes_remaining = data.backup_codes.length
    } else {
      closeSetupModal()
    }
    snackbar.show('Two-Factor Authentication enabled successfully!', 'success')
    fetchStatus()
  } catch (err) {
    setupError.value = err?.message || err?.error || 'Invalid verification code.'
  } finally {
    confirmingSetup.value = false
  }
}

const closeSetupModal = () => {
  showSetupModal.value = false
  newBackupCodes.value = []
}

// ── Disable 2FA Flow ───────────────────────────────────
const openDisableModal = () => {
  disableForm.value = { password: '', code: '' }
  disableError.value = ''
  disableUseBackup.value = false
  showDisablePassword.value = false
  showDisableModal.value = true
}

const handleDisable2fa = async () => {
  if (!disableForm.value.password || !disableForm.value.code) return
  disabling.value = true
  disableError.value = ''

  const payload = {
    password: disableForm.value.password,
  }
  if (disableUseBackup.value) {
    payload.backup_code = disableForm.value.code.trim()
  } else {
    payload.totp_code = disableForm.value.code.trim()
  }

  try {
    await authStore.disable2fa(payload, props.role)
    statusData.value.totp_enabled = false
    statusData.value.backup_codes_remaining = 0
    showDisableModal.value = false
    snackbar.show('Two-Factor Authentication has been disabled.', 'success')
  } catch (err) {
    disableError.value = err?.message || err?.error || 'Failed to disable 2FA. Check password and code.'
  } finally {
    disabling.value = false
  }
}

// ── Regenerate Backup Codes Flow ───────────────────────
const openRegenerateModal = () => {
  regenerateCode.value = ''
  regenerateError.value = ''
  regeneratedCodes.value = []
  showRegenerateModal.value = true
}

const handleRegenerateCodes = async () => {
  if (regenerateCode.value.trim().length !== 6) return
  regenerating.value = true
  regenerateError.value = ''

  try {
    const res = await authStore.regenerateBackupCodes(regenerateCode.value.trim(), props.role)
    const data = res?.data || res
    if (data?.backup_codes && Array.isArray(data.backup_codes)) {
      regeneratedCodes.value = data.backup_codes
      statusData.value.backup_codes_remaining = data.backup_codes.length
    }
    snackbar.show('New backup codes generated!', 'success')
  } catch (err) {
    regenerateError.value = err?.message || err?.error || 'Invalid code. Could not regenerate backup codes.'
  } finally {
    regenerating.value = false
  }
}

const copyBackupCodes = (codes) => {
  if (!codes || codes.length === 0) return
  navigator.clipboard.writeText(codes.join('\n'))
  copiedBackup.value = true
  snackbar.show('Backup codes copied to clipboard!', 'success')
  setTimeout(() => {
    copiedBackup.value = false
  }, 3000)
}
</script>
