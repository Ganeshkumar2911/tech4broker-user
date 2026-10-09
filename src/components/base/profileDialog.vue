<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { LogOut, ClipboardList, Clock, CheckCircle2, AlertCircle, X, ArrowLeft, Eye, EyeOff, PencilLine, Shield, FileText, Lightbulb, Smartphone, Lock, ArrowRight, Compass } from 'lucide-vue-next'
import { useProfileStore } from '@/stores/shared/profile'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import { useTourStore } from '@/stores/shared/tour'
import { useRouter } from 'vue-router'
import authToken from '@/common/authToken'
import snsWebSdk from '@sumsub/websdk'
import ViewEditProfile from './ViewEditProfile.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  initialMode: { type: String, default: 'profile' },
})

const emit = defineEmits(['close'])

const profileStore = useProfileStore()
const snackbar = useSnackbarStore()
const tourStore = useTourStore()
const router = useRouter()

const launchAppTour = () => {
  emit('close')
  setTimeout(() => {
    tourStore.restartTour()
  }, 350)
}

// ─── Change Password ────────────────────────────────
const showChangePassword = ref(false)
const changePasswordLoading = ref(false)
const changePasswordError = ref(null)
const changePasswordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
})
const changePasswordFieldErrors = ref({})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// ─── KYC ────────────────────────────────────────────
const showKycIntro = ref(false)
const showKyc = ref(false)
const kycLoading = ref(false)
const kycError = ref(null)

const isKycVerified = computed(() => {
  const status = String(profileStore.user?.kyc_status || '').toLowerCase().trim()
  return status === 'approved' || status === 'verified' || status === 'completed'
})

// ─── Profile Sidebar ─────────────────────────────────

const showProfileSidebar = ref(false)

const openProfileSidebar = () => {
  showProfileSidebar.value = true
}

function goToKyc() {
  showKycIntro.value = true
  showKyc.value = false
  kycError.value = null
}

function closeKycIntro() {
  showKycIntro.value = false
  if (props.initialMode === 'kyc') {
    emit('close')
  }
}

async function startKycProcess() {
  showKycIntro.value = false
  showKyc.value = true
  kycError.value = null
  kycLoading.value = true

  await nextTick() // wait for #sumsub-websdk-container to mount

  try {
    const accessToken = await profileStore.getKycToken()
    if (typeof accessToken !== 'string' || !accessToken) {
      throw new Error('KYC access token is missing or invalid')
    }

    snsWebSdk
      .init(accessToken, async () => {
        const refreshed = await profileStore.getKycToken()
        if (typeof refreshed !== 'string' || !refreshed) throw new Error('Token refresh failed')
        return refreshed
      })
      .withConf({ lang: 'en', theme: 'dark' })
      .withOptions({ addViewportTag: false, adaptIframeHeight: true })
      .on('idCheck.onStepCompleted', (payload) => console.log('Step completed', payload))
      .on('idCheck.onError', (error) => { console.error('Sumsub error', error); kycError.value = 'KYC encountered an error. Please try again.' })
      .on('idCheck.applicantStatus', (status) => {
        console.log('Applicant status', status)
        if (status?.reviewResult?.reviewAnswer === 'GREEN') {
          profileStore.fetchUserProfile(true)
          closeKyc()
        }
      })
      .build()
      .launch('#sumsub-websdk-container')
  } catch (err) {
    console.error(err)
    kycError.value = err?.message || 'Failed to initialize KYC.'
  } finally {
    kycLoading.value = false
  }
}

function backFromKyc() {
  showKyc.value = false
  showKycIntro.value = true
  kycError.value = null
}

function closeKyc() {
  showKyc.value = false
  showKycIntro.value = false
  kycError.value = null
  profileStore.fetchUserProfile(true)
  emit('close')
}

// ─── Role Detection ──────────────────────────────────
const role = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')?.role || profileStore.user?.role || null
  } catch {
    return profileStore.user?.role || null
  }
})

const isFm = computed(() => role.value === 'fm')

// ─── FM Status ───────────────────────────────────────
function hasData(value) {
  if (!value) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

const fmStatus = computed(() => {
  if (!isFm.value) return null
  const { fm_info, fm_request } = profileStore.user || {}
  if (hasData(fm_info) || fm_request?.status === 'approved') return 'approved'
  if (fm_request?.status === 'rejected') return 'rejected'
  if (fm_request) return 'pending'
  return 'incomplete'
})

// ─── FM Form ─────────────────────────────────────────
const showFmForm   = ref(false)
const fmFormLoading = ref(false)
const fmFormError   = ref(null)
const fieldErrors   = ref({})

const fmForm = ref({
  performance_fee:  '',
  management_fee:   '',
  management_fee_interval: '',
  settlement_type:  '',
  follower_account_type: 1,
  registration_fee: '',
  visibility_type:  '',
  fm_share:         '',
  broker_share:     '',
  min_capital:      '',
  environment:      '',
  account_category: '',
  group_config_id:  null,
  mt5_group:        '',
  currency:         '',
  leverage:         null,
})

const followerAccountTypeOptions = [
  { label: "Copy trading only (default)", value: 1 },
  { label: "Real account only", value: 2 },
  { label: "Both options", value: 3 },
]

const fmGroupOptions = ref([])
const fmGroupsLoading = ref(false)
const fmGroupsError = ref(null)
const managementFeeIntervalOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
]

const visibilityTypeOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
]

const settlementOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

let syncing = false

// Raw groups data stored separately for real flow
const rawGroupsData = ref({ demo: [], live: [] })

const currentFmCategories = computed(() =>
  rawGroupsData.value[fmForm.value.environment] ?? []
)

const currentFmCurrencies = computed(() => {
  if (!fmForm.value.account_category) return []
  const cat = currentFmCategories.value.find(c => c.account_category === fmForm.value.account_category)
  return cat?.currencies ?? []
})


const onEnvChange = (env) => {
  fmForm.value.environment      = env
  fmForm.value.account_category = ''
  fmForm.value.group_config_id  = null
  fmForm.value.mt5_group  = null
  fmForm.value.currency         = ''
  fmForm.value.leverage         = null
}

const onCategoryChange = (cat) => {
  fmForm.value.account_category = cat.account_category
  fmForm.value.group_config_id  = null
  fmForm.value.mt5_group  = null
  fmForm.value.currency         = ''
  fmForm.value.leverage         = null
}

const onCurrencyChange = (cur) => {
  fmForm.value.group_config_id = cur.group_config_id
  fmForm.value.mt5_group = cur.mt5_group
  fmForm.value.currency = cur.currency
  fmForm.value.leverage = cur.leverage
}

watch(() => fmForm.value.fm_share, (val) => {
  if (syncing) return
  const n = parseFloat(val)
  if (!isNaN(n) && n >= 0 && n <= 100) {
    syncing = true
    fmForm.value.broker_share = parseFloat((100 - n).toFixed(2))
    syncing = false
  }
})

watch(() => fmForm.value.broker_share, (val) => {
  if (syncing) return
  const n = parseFloat(val)
  if (!isNaN(n) && n >= 0 && n <= 100) {
    syncing = true
    fmForm.value.fm_share = parseFloat((100 - n).toFixed(2))
    syncing = false
  }
})


function validateForm() {
  const errors = {}
  const {
    performance_fee,
    management_fee,
    management_fee_interval,
    settlement_type,
    registration_fee,
    visibility_type,
    fm_share,
    broker_share,
    min_capital,
    mt5_group,
  } = fmForm.value

  if (!mt5_group) errors.mt5_group = 'Please select a currency'

  const pf = parseFloat(performance_fee)
  if (performance_fee === '' || isNaN(pf)) errors.performance_fee = 'Required'
  else if (pf < 0 || pf > 50)             errors.performance_fee = 'Must be 0–50'

  const mf = parseFloat(management_fee)
  if (management_fee === '' || isNaN(mf)) errors.management_fee = 'Required'
  else if (mf < 0)                        errors.management_fee = 'Must be positive'

  if (!management_fee_interval) errors.management_fee_interval = 'Required'

  if (!settlement_type) errors.settlement_type = 'Required'

  const rf = parseFloat(registration_fee)
  if (registration_fee === '' || isNaN(rf)) errors.registration_fee = 'Required'
  else if (rf < 0)                           errors.registration_fee = 'Must be positive'

  if (!visibility_type) errors.visibility_type = 'Required'

  const fs = parseFloat(fm_share)
  if (fm_share === '' || isNaN(fs))        errors.fm_share = 'Required'
  else if (fs < 0 || fs > 100)            errors.fm_share = 'Must be 0–100'

  const bs = parseFloat(broker_share)
  if (broker_share === '' || isNaN(bs))    errors.broker_share = 'Required'
  else if (bs < 0 || bs > 100)            errors.broker_share = 'Must be 0–100'

  const mc = parseFloat(min_capital)
  if (min_capital === '' || isNaN(mc))     errors.min_capital = 'Required'
  else if (mc < 0)                         errors.min_capital = 'Must be positive'

  if (!errors.fm_share && !errors.broker_share && Math.abs((fs + bs) - 100) > 0.01)
    errors.fm_share = 'FM Share + Broker Share must equal 100'

  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

async function openFmForm() {
  fmFormError.value   = null
  fmGroupsError.value = null
  fieldErrors.value   = {}
  showFmForm.value    = true
  fmForm.value.environment      = 'live'
  fmForm.value.account_category = ''
  fmForm.value.group_config_id  = null
  fmForm.value.mt5_group  = ''
  fmForm.value.currency         = ''
  fmForm.value.leverage         = null
  fmForm.value.performance_fee  = ''
  fmForm.value.management_fee   = ''
  fmForm.value.management_fee_interval = ''
  fmForm.value.settlement_type   = ''
  fmForm.value.follower_account_type = 1
  fmForm.value.registration_fee = ''
  fmForm.value.visibility_type   = ''
  fmForm.value.fm_share          = ''
  fmForm.value.broker_share      = ''
  fmForm.value.min_capital       = ''

  fmGroupsLoading.value = true
  try {
    const res = await profileStore.fetchFmGroupDetails()

    // Store raw data for real account flow
    rawGroupsData.value = res?.data ?? { demo: [], live: [] }

    // Existing copy_trading dropdown options
    const rows = res?.data?.demo || []
    fmGroupOptions.value = rows.map((row) => {
      const currency = row?.currencies?.[0]?.currency ?? row?.currency?.[0] ?? '-'
      const group    = row?.currencies?.[0]?.mt5_group ?? row?.group ?? '-'
      const leverage = row?.currencies?.[0]?.leverage  ?? row?.leverage ?? '-'
      return {
        label: `${currency} | ${group} | Leverage: ${leverage}`,
        value: row?.currencies?.[0]?.group_config_id ?? row?.group ?? null,
        meta: {
          currency: currency,
          leverage: leverage,
          mt5_group: group,
        },
      }
    }).filter(o => o.value)
  } catch (err) {
    fmGroupsError.value = err?.message || 'Failed to load broker group details.'
  } finally {
    fmGroupsLoading.value = false
  }
}

function closeFmForm() {
  showFmForm.value  = false
  fmFormError.value = null
  fieldErrors.value = {}
}

async function submitFmRegistration() {
  if (!validateForm()) return
  fmFormLoading.value = true
  fmFormError.value   = null
  try {
    const payload = {
      performance_fee: fmForm.value.performance_fee,
      management_fee: fmForm.value.management_fee,
      management_fee_interval: fmForm.value.management_fee_interval,
      settlement_type: fmForm.value.settlement_type,
      follower_account_type: Number(fmForm.value.follower_account_type || 1),
      registration_fee: fmForm.value.registration_fee,
      visibility_type: fmForm.value.visibility_type,
      fm_share:        fmForm.value.fm_share,
      broker_share:    fmForm.value.broker_share,
      min_capital:     fmForm.value.min_capital,
      // trading_type:    fmForm.value.trading_type,
    }
    payload.broker_group  = fmForm.value.mt5_group
    payload.broker_group_id      = fmForm.value.group_config_id
    payload.broker_currency         = fmForm.value.currency
    payload.broker_leverage         = fmForm.value.leverage

    await profileStore.submitFmRequest(payload)
    closeFmForm()
    profileStore.fetchUserProfile(true)
  } catch (err) {
    fmFormError.value = err?.message || 'Submission failed. Please try again.'
  } finally {
    fmFormLoading.value = false
  }
}

// ─── Change Password Handlers ───────────────────────
function validateChangePassword() {
  const errors = {}
  const { current_password, new_password, confirm_password } = changePasswordForm.value

  if (!current_password) errors.current_password = 'Current password is required'
  if (!new_password) errors.new_password = 'New password is required'
  else if (new_password.length < 6) errors.new_password = 'Password must be at least 6 characters'

  if (!confirm_password) errors.confirm_password = 'Confirm password is required'
  else if (confirm_password !== new_password) errors.confirm_password = 'Passwords do not match'

  changePasswordFieldErrors.value = errors
  return Object.keys(errors).length === 0
}

async function submitChangePassword() {
  if (!validateChangePassword()) return
  changePasswordLoading.value = true
  changePasswordError.value = null
  try {
    await profileStore.changePassword(
      changePasswordForm.value.current_password,
      changePasswordForm.value.new_password
    )
    closeChangePassword()
    snackbar.show('Password changed successfully!', 'success')
  } catch (err) {
    changePasswordError.value = err?.message || 'Failed to change password.'
  } finally {
    changePasswordLoading.value = false
  }
}

function openChangePassword() {
  showChangePassword.value = true
  changePasswordError.value = null
  changePasswordFieldErrors.value = {}
  changePasswordForm.value = {
    current_password: '',
    new_password: '',
    confirm_password: '',
  }
}

function closeChangePassword() {
  showChangePassword.value = false
  changePasswordError.value = null
  changePasswordFieldErrors.value = {}
  changePasswordForm.value = {
    current_password: '',
    new_password: '',
    confirm_password: '',
  }
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

// ─── Helpers ─────────────────────────────────────────
function logout() {
  try {
    tourStore.stopTour()
  } catch (e) {}
  authToken.removeToken()
  localStorage.removeItem("role")
  sessionStorage.clear()
  router.push({ name: "login" }).then(() => {
    window.location.reload()
  })
}

function closeDialog() {
  showFmForm.value = false
  showChangePassword.value = false
  showKyc.value = false
  emit('close')
}

const updateProfile = () => {
  profileStore.fetchUserProfile(true)
}

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const fmInfoEntries = computed(() => {
  const info = profileStore.user?.fm_info
  if (!hasData(info)) return []
  return Object.entries(info).filter(([k]) => k !== 'created_at')
})

const fmRequestEntries = computed(() => {
  const req = profileStore.user?.fm_request
  if (!req) return []
  return Object.entries(req).filter(([k]) => k !== 'created_at' && k !== 'status')
})

const approvedFmEntries = computed(() =>
  fmInfoEntries.value.length > 0 ? fmInfoEntries.value : fmRequestEntries.value
)

const shareSum = computed(() =>
  ((parseFloat(fmForm.value.fm_share) || 0) + (parseFloat(fmForm.value.broker_share) || 0)).toFixed(2)
)

watch(
  () => [props.open, props.initialMode],
  ([open, initialMode]) => {
    if (open && initialMode === 'fm' && !showFmForm.value) {
      openFmForm()
    } else if (open && initialMode === 'kyc' && !showKyc.value && !showKycIntro.value) {
      goToKyc()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-[2px] overflow-y-auto"
    @click.self="emit('close')"
  >
    <!-- ── Profile Sidebar ── -->
    <ViewEditProfile
      v-model="showProfileSidebar"
      :user="profileStore.user"
      @save="updateProfile"
    />

    <!-- ── KYC Intro Overlay (Preparation Checklist) ── -->
    <div
      v-if="showKycIntro"
      class="bg-card-background rounded-2xl sm:rounded-3xl border border-primary-border text-primary-text max-w-lg w-full shadow-2xl flex flex-col relative max-h-[92dvh] sm:max-h-[88vh] overflow-hidden"
      @click.stop
    >
      <!-- Top Close Button -->
      <button
        @click="closeKycIntro"
        class="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border border-primary-border/50 text-secondary-text hover:text-primary-text cursor-pointer transition z-10"
        aria-label="Close"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- Scrollable Content Area -->
      <div class="overflow-y-auto px-4 py-5 sm:p-7 space-y-4 sm:space-y-5 flex-1 no-scrollbar">
        <!-- Top Shield Icon -->
        <div class="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 flex items-center justify-center mb-1 sm:mb-2">
          <Shield :size="20" fill="currentColor" class="text-[#031b34] dark:text-blue-400" />
        </div>

        <!-- Title & Subtitle -->
        <div class="text-center px-1">
          <h2 class="text-base sm:text-xl md:text-2xl font-bold text-primary-text tracking-tight leading-snug">
            You’re about to start KYC verification
          </h2>
          <p class="text-[11px] sm:text-xs md:text-sm text-secondary-text mt-1">
            A few quick things to keep ready before you continue.
          </p>
        </div>

        <!-- Requirements List -->
        <div class="space-y-3 sm:space-y-3.5 text-left">
          <!-- Item 1 -->
          <div class="flex items-start gap-2.5 sm:gap-3.5">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <FileText :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-semibold text-xs sm:text-sm text-primary-text">Keep your valid ID proof ready</h4>
              <p class="text-[11px] sm:text-xs text-secondary-text mt-0.5 leading-snug">PAN card, Aadhaar, Passport or Driving License</p>
            </div>
          </div>

          <!-- Item 2 -->
          <div class="flex items-start gap-2.5 sm:gap-3.5">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-semibold text-xs sm:text-sm text-primary-text">Make sure you have good lighting</h4>
              <p class="text-[11px] sm:text-xs text-secondary-text mt-0.5 leading-snug">It helps us capture clear images for quick verification</p>
            </div>
          </div>

          <!-- Item 3 -->
          <div class="flex items-start gap-2.5 sm:gap-3.5">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-semibold text-xs sm:text-sm text-primary-text">Your details should match your ID document</h4>
              <p class="text-[11px] sm:text-xs text-secondary-text mt-0.5 leading-snug">Ensure your name, DOB and other details are accurate</p>
            </div>
          </div>

          <!-- Item 4 -->
          <div class="flex items-start gap-2.5 sm:gap-3.5">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-semibold text-xs sm:text-sm text-primary-text">Keep your mobile number / email accessible</h4>
              <p class="text-[11px] sm:text-xs text-secondary-text mt-0.5 leading-snug">You may need an OTP during verification</p>
            </div>
          </div>

          <!-- Item 5 -->
          <div class="flex items-start gap-2.5 sm:gap-3.5">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Clock :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-semibold text-xs sm:text-sm text-primary-text">The process usually takes a few minutes</h4>
              <p class="text-[11px] sm:text-xs text-secondary-text mt-0.5 leading-snug">Please don't refresh or close the window</p>
            </div>
          </div>
        </div>

        <!-- Security Callout Box -->
        <div class="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-3 flex items-center gap-2.5 text-left">
          <Lock :size="15" class="text-[#001F3F] dark:text-blue-400 shrink-0" />
          <span class="text-[11px] sm:text-xs font-medium text-[#001F3F] dark:text-blue-200 leading-snug">
            Your information is securely processed and used only for verification.
          </span>
        </div>
      </div>

      <!-- Action Buttons (Pinned Footer) -->
      <div class="px-4 py-3 sm:px-7 sm:py-4 bg-card-background border-t border-primary-border shrink-0">
        <div class="grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            @click="closeKycIntro"
            class="w-full py-2.5 rounded-lg border border-primary-border bg-background hover:bg-primary-border/40 text-primary-text font-semibold text-xs sm:text-sm cursor-pointer text-center transition shadow-none"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="startKycProcess"
            class="w-full py-2.5 rounded-lg bg-button text-button-text font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition shadow-none hover:opacity-90"
          >
            <span>Start KYC</span>
            <ArrowRight :size="15" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── KYC Overlay (WebSDK Container) ── -->
    <div
      v-else-if="showKyc"
      class="bg-card-background rounded-2xl border border-primary-border w-full max-w-2xl shadow-lg flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-primary-border flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2">
          <button
            @click="backFromKyc"
            class="w-7 h-7 flex items-center justify-center rounded-full bg-background text-secondary-text hover:text-primary-text cursor-pointer transition"
            aria-label="Back"
          >
            <ArrowLeft class="w-4 h-4" />
          </button>
          <h2 class="text-primary-text text-base sm:text-lg font-semibold">Identity Verification</h2>
        </div>
        <button
          @click="closeKyc"
          class="w-7 h-7 flex items-center justify-center rounded-full bg-background text-secondary-text hover:text-primary-text cursor-pointer transition"
          aria-label="Close"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- KYC Container -->
      <div class="flex-1 overflow-auto p-2 sm:p-4">
        <!-- Loading state -->
        <div v-if="kycLoading" class="flex flex-col items-center justify-center py-16 gap-3">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p class="text-secondary-text text-xs">Initializing verification…</p>
        </div>

        <!-- Error state -->
        <div v-else-if="kycError" class="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle class="w-10 h-10 text-primary-red" />
          <p class="text-primary-red text-sm text-center">{{ kycError }}</p>
          <button
            @click="goToKyc"
            class="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-white hover:opacity-90 transition cursor-pointer"
          >Retry</button>
        </div>

        <!-- Sumsub iframe mounts here -->
        <div
          id="sumsub-websdk-container"
          class="w-full min-h-[400px] sm:min-h-[550px] md:min-h-[650px] rounded-lg"
          :class="{ hidden: kycLoading || kycError }"
        />
      </div>
    </div>

    <!-- ── Main Dialog ── -->
    <div
      v-else
      class="bg-card-background rounded-2xl border border-primary-border max-w-md w-full shadow-lg flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden"
      @click.stop
    >

      <!-- ── FM Registration Form ── -->
      <template v-if="showFmForm">
        <div class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-primary-border flex items-center gap-2 shrink-0">
          <button @click="closeFmForm" class="text-secondary-text hover:text-primary-text transition cursor-pointer">
            <ArrowLeft class="w-4 h-4" />
          </button>
          <h2 class="text-primary-text text-base sm:text-lg font-semibold">FM Registration</h2>
        </div>

        <div class="px-4 sm:px-6 py-4 sm:py-5 space-y-4 flex-1 overflow-y-auto">
          <p v-if="fmFormError" class="text-primary-red text-xs bg-primary-red/10 rounded-lg px-3 py-2">{{ fmFormError }}</p>
          <p v-if="fmGroupsError" class="text-primary-red text-xs bg-primary-red/10 rounded-lg px-3 py-2">{{ fmGroupsError }}</p>

          <!-- Environment -->
          <div class="flex flex-col gap-1.5">
            <label class="text-secondary-text text-xs">Environment</label>
            <div class="flex items-center gap-1 bg-background border border-primary-border rounded-lg p-1 w-fit">
              <button
                v-for="env in ['live']"
                :key="env"
                class="px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
                :class="fmForm.environment === env ? 'bg-primary text-black' : 'text-secondary-text hover:text-primary-text'"
                @click="onEnvChange(env)"
              >
                {{ env }}
              </button>
            </div>
          </div>

          <!-- Category -->
          <div v-if="fmForm.environment && currentFmCategories.length" class="flex flex-col gap-1.5">
            <label class="text-secondary-text text-xs">Account Category</label>
            <div v-if="fmGroupsLoading" class="flex items-center gap-2 py-2">
              <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span class="text-xs text-secondary-text">Loading groups...</span>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="cat in currentFmCategories"
                :key="cat.account_category"
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                :class="fmForm.account_category === cat.account_category
                  ? 'border-primary bg-primary/5'
                  : 'border-primary-border hover:bg-background'"
                @click="onCategoryChange(cat)"
              >
                <div class="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span class="text-[10px] font-bold text-primary">{{ cat.label.charAt(0) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-primary-text">{{ cat.label }}</p>
                  <p class="text-[11px] text-secondary-text truncate">{{ cat.description }}</p>
                </div>
                <div
                  class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                  :class="fmForm.account_category === cat.account_category ? 'border-primary' : 'border-primary-border'"
                >
                  <div v-if="fmForm.account_category === cat.account_category" class="w-2 h-2 rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <p v-if="fieldErrors.account_category" class="text-primary-red text-[10px]">{{ fieldErrors.account_category }}</p>
          </div>

          <!-- Currency -->
          <div v-if="fmForm.account_category && currentFmCurrencies.length" class="flex flex-col gap-1.5">
            <label class="text-secondary-text text-xs">Currency</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="cur in currentFmCurrencies"
                :key="cur.mt5_group"
                class="py-2 px-3 rounded-lg text-xs font-semibold border transition-colors text-left"
                :class="fmForm.mt5_group === cur.mt5_group
                  ? 'bg-primary text-black border-primary'
                  : 'bg-background text-secondary-text border-primary-border hover:text-primary-text'"
                @click="onCurrencyChange(cur)"
              >
                {{ cur.currency }}
                <span v-if="cur.leverage" class="block text-[10px] opacity-70 font-normal">1:{{ cur.leverage }}</span>
              </button>
            </div>
            <p v-if="fieldErrors.mt5_group" class="text-primary-red text-[10px]">{{ fieldErrors.mt5_group }}</p>
          </div>

          <!-- Performance Fee -->
          <div class="flex flex-col gap-1">
            <label class="text-secondary-text text-xs">Performance Fee (%)</label>
            <input
              v-model="fmForm.performance_fee"
              type="number" min="0" max="50" step="0.01"
              placeholder="e.g. 20"
              class="bg-background border rounded-lg px-3 py-2 text-primary-text text-xs focus:outline-none transition"
              :class="fieldErrors.performance_fee ? 'border-primary-red' : 'border-primary-border focus:border-primary'"
            />
            <p v-if="fieldErrors.performance_fee" class="text-primary-red text-[10px]">{{ fieldErrors.performance_fee }}</p>
          </div>

          <!-- Settlement Type -->
          <div class="flex flex-col gap-1">
            <label class="text-secondary-text text-xs">Settlement Type <span class="text-primary-red">*</span></label>
            <BaseSelect
              v-model="fmForm.settlement_type"
              :options="settlementOptions"
              placeholder="Select type"
            />
            <p v-if="fieldErrors.settlement_type" class="text-primary-red text-[10px]">{{ fieldErrors.settlement_type }}</p>
          </div>

          <!-- Follower Account Type -->
          <div class="flex flex-col gap-1">
            <label class="text-secondary-text text-xs">Follower Account Type</label>
            <BaseSelect
              v-model="fmForm.follower_account_type"
              :options="followerAccountTypeOptions"
              placeholder="Select follower account type"
            />
          </div>

          <!-- Management Fee -->
          <div class="flex flex-col gap-1">
            <label class="text-secondary-text text-xs">Management Fee (%)</label>
            <input
              v-model="fmForm.management_fee"
              type="number" min="0" step="0.01"
              placeholder="e.g. 2"
              class="bg-background border rounded-lg px-3 py-2 text-primary-text text-xs focus:outline-none transition"
              :class="fieldErrors.management_fee ? 'border-primary-red' : 'border-primary-border focus:border-primary'"
            />
            <p v-if="fieldErrors.management_fee" class="text-primary-red text-[10px]">{{ fieldErrors.management_fee }}</p>
          </div>

          <!-- Management Fee Interval -->
          <div class="flex flex-col gap-1">
            <label class="text-secondary-text text-xs">Management Fee Interval</label>
            <BaseSelect
              v-model="fmForm.management_fee_interval"
              :options="managementFeeIntervalOptions"
              placeholder="Select interval"
            />
            <p v-if="fieldErrors.management_fee_interval" class="text-primary-red text-[10px]">{{ fieldErrors.management_fee_interval }}</p>
          </div>

          <!-- Registration Fee -->
          <div class="flex flex-col gap-1">
            <label class="text-secondary-text text-xs">Registration Fee</label>
            <input
              v-model="fmForm.registration_fee"
              type="number" min="0" step="0.01"
              placeholder="e.g. 100"
              class="bg-background border rounded-lg px-3 py-2 text-primary-text text-xs focus:outline-none transition"
              :class="fieldErrors.registration_fee ? 'border-primary-red' : 'border-primary-border focus:border-primary'"
            />
            <p v-if="fieldErrors.registration_fee" class="text-primary-red text-[10px]">{{ fieldErrors.registration_fee }}</p>
          </div>

          <!-- Visibility Type -->
          <div class="flex flex-col gap-1">
            <label class="text-secondary-text text-xs">Visibility Type</label>
            <BaseSelect
              v-model="fmForm.visibility_type"
              :options="visibilityTypeOptions"
              placeholder="Select visibility"
            />
            <p v-if="fieldErrors.visibility_type" class="text-primary-red text-[10px]">{{ fieldErrors.visibility_type }}</p>
          </div>

          <!-- Minimum Capital -->
          <div class="flex flex-col gap-1">
            <label class="text-secondary-text text-xs">Minimum Capital</label>
            <input
              v-model="fmForm.min_capital"
              type="number" min="0" step="0.01"
              placeholder="e.g. 100000"
              class="bg-background border rounded-lg px-3 py-2 text-primary-text text-xs focus:outline-none transition"
              :class="fieldErrors.min_capital ? 'border-primary-red' : 'border-primary-border focus:border-primary'"
            />
            <p v-if="fieldErrors.min_capital" class="text-primary-red text-[10px]">{{ fieldErrors.min_capital }}</p>
          </div>

          <!-- FM Share + Broker Share -->
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-secondary-text text-xs">FM Share (%)</label>
              <input
                v-model="fmForm.fm_share"
                type="number" min="0" max="100" step="0.01"
                placeholder="e.g. 50"
                class="bg-background border rounded-lg px-3 py-2 text-primary-text text-xs focus:outline-none transition"
                :class="fieldErrors.fm_share ? 'border-primary-red' : 'border-primary-border focus:border-primary'"
              />
              <p v-if="fieldErrors.fm_share" class="text-primary-red text-[10px]">{{ fieldErrors.fm_share }}</p>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-secondary-text text-xs">Broker Share (%)</label>
              <input
                v-model="fmForm.broker_share"
                type="number" min="0" max="100" step="0.01"
                placeholder="e.g. 50"
                class="bg-background border rounded-lg px-3 py-2 text-primary-text text-xs focus:outline-none transition"
                :class="fieldErrors.broker_share ? 'border-primary-red' : 'border-primary-border focus:border-primary'"
              />
              <p v-if="fieldErrors.broker_share" class="text-primary-red text-[10px]">{{ fieldErrors.broker_share }}</p>
            </div>
          </div>
          <p class="text-[10px] -mt-2" :class="Math.abs(parseFloat(shareSum) - 100) <= 0.01 ? 'text-primary-green' : 'text-secondary-text'">
            FM + Broker = {{ shareSum }} / 100
          </p>
        </div>

        <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-primary-border flex gap-2 shrink-0">
          <button @click="closeFmForm" class="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-primary-text hover:bg-primary-border transition cursor-pointer">Cancel</button>
          <button
            @click="submitFmRegistration"
            :disabled="fmFormLoading"
            class="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-black hover:bg-primary-hover disabled:opacity-50 transition cursor-pointer"
          >{{ fmFormLoading ? 'Submitting…' : 'Submit Request' }}</button>
        </div>
      </template>

      <!-- ── Main Profile View ── -->
      <template v-else>
        <div class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-primary-border flex items-center justify-between shrink-0">
          <h2 class="text-primary-text text-base sm:text-lg font-semibold">Profile</h2>
          <button @click="closeDialog" class="text-secondary-text hover:text-primary-text transition cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto no-scrollbar">

          <!-- Change Password Form -->
          <div v-if="showChangePassword" class="space-y-4">
            <p v-if="changePasswordError" class="text-primary-red text-xs bg-primary-red/10 rounded-lg px-3 py-2">{{ changePasswordError }}</p>

            <!-- Current Password -->
            <div class="flex flex-col gap-1">
              <label class="text-secondary-text text-xs">Current Password</label>
              <div class="relative">
                <input
                  v-model="changePasswordForm.current_password"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  placeholder="Enter current password"
                  class="w-full bg-background border rounded-lg px-3 py-2 pr-9 text-primary-text text-xs focus:outline-none transition"
                  :class="changePasswordFieldErrors.current_password ? 'border-primary-red' : 'border-primary-border focus:border-primary'"
                />
                <button
                  @click="showCurrentPassword = !showCurrentPassword"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition cursor-pointer"
                  type="button"
                  aria-label="Toggle password visibility"
                >
                  <Eye v-if="!showCurrentPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="changePasswordFieldErrors.current_password" class="text-primary-red text-[10px]">{{ changePasswordFieldErrors.current_password }}</p>
            </div>

            <!-- New Password -->
            <div class="flex flex-col gap-1">
              <label class="text-secondary-text text-xs">New Password</label>
              <div class="relative">
                <input
                  v-model="changePasswordForm.new_password"
                  :type="showNewPassword ? 'text' : 'password'"
                  placeholder="Enter new password (min 6 characters)"
                  class="w-full bg-background border rounded-lg px-3 py-2 pr-9 text-primary-text text-xs focus:outline-none transition"
                  :class="changePasswordFieldErrors.new_password ? 'border-primary-red' : 'border-primary-border focus:border-primary'"
                />
                <button
                  @click="showNewPassword = !showNewPassword"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition cursor-pointer"
                  type="button"
                  aria-label="Toggle password visibility"
                >
                  <Eye v-if="!showNewPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="changePasswordFieldErrors.new_password" class="text-primary-red text-[10px]">{{ changePasswordFieldErrors.new_password }}</p>
            </div>

            <!-- Confirm Password -->
            <div class="flex flex-col gap-1">
              <label class="text-secondary-text text-xs">Confirm New Password</label>
              <div class="relative">
                <input
                  v-model="changePasswordForm.confirm_password"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Confirm new password"
                  class="w-full bg-background border rounded-lg px-3 py-2 pr-9 text-primary-text text-xs focus:outline-none transition"
                  :class="changePasswordFieldErrors.confirm_password ? 'border-primary-red' : 'border-primary-border focus:border-primary'"
                />
                <button
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition cursor-pointer"
                  type="button"
                  aria-label="Toggle password visibility"
                >
                  <Eye v-if="!showConfirmPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="changePasswordFieldErrors.confirm_password" class="text-primary-red text-[10px]">{{ changePasswordFieldErrors.confirm_password }}</p>
            </div>

            <!-- Buttons -->
            <div class="flex gap-2 pt-2">
              <button @click="closeChangePassword" class="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-primary-text hover:bg-primary-border transition cursor-pointer">Cancel</button>
              <button
                @click="submitChangePassword"
                :disabled="changePasswordLoading"
                class="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-black hover:bg-primary-hover disabled:opacity-50 transition cursor-pointer"
              >{{ changePasswordLoading ? 'Changing…' : 'Change Password' }}</button>
            </div>
          </div>

          <!-- Avatar + Info -->
          <div v-if="!showChangePassword" class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-background flex items-center justify-center shrink-0 border border-primary-border">
              <span class="text-primary text-sm font-bold">
                {{ profileStore.user?.email?.charAt(0).toUpperCase() || 'U' }}
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-primary-text text-sm font-semibold truncate">{{ profileStore.user?.email || 'No email' }}</p>
              <p class="text-secondary-text text-xs">{{ profileStore.user?.name || 'User' }}</p>
            </div>
          </div>

          <!-- Account Info -->
          <div v-if="!showChangePassword" class="pt-4 border-t border-primary-border space-y-3">
            <p class="text-secondary-text text-xs">
              Created: <span class="text-primary-text">{{ profileStore.user?.created_at || '-' }}</span>
            </p>
            <p class="text-secondary-text text-xs">
              Status:
              <span :class="profileStore.user?.is_active ? 'text-primary-green' : 'text-primary-red'">
                {{ profileStore.user?.is_active ? 'Active' : 'Inactive' }}
              </span>
            </p>
            <p v-if="role" class="text-secondary-text text-xs">
              Role: <span class="text-primary-text capitalize">{{ role }}</span>
            </p>
            <div class="flex flex-col gap-2 pt-2">
              <button
                @click="openChangePassword"
                class="w-full px-4 py-2 rounded-lg bg-navbar-hover-bg border border-primary-border text-xs font-medium text-primary-text hover:bg-primary/20 transition cursor-pointer"
              >
                Change Password
              </button>

              <button
                @click="launchAppTour"
                class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/20 transition cursor-pointer"
              >
                <Compass class="w-3.5 h-3.5" />
                <span>Take App Guided Tour</span>
              </button>
            </div>
          </div>

          <!-- KYC Status -->
          <div v-if="!showChangePassword" class="pt-4 border-t border-primary-border">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div class="flex items-center gap-2">
                <CheckCircle2 v-if="isKycVerified" class="w-4 h-4 text-primary-green shrink-0" />
                <AlertCircle v-else class="w-4 h-4 text-yellow-500 shrink-0" />
                <span
                  class="text-xs font-semibold"
                  :class="isKycVerified ? 'text-primary-green' : 'text-yellow-500'"
                >
                  {{ isKycVerified ? 'KYC Verified' : 'KYC Not Completed' }}
                </span>
              </div>

              <div class="ml-auto flex items-center justify-end gap-2 flex-wrap">
                <button
                  v-if="!isKycVerified"
                  @click="goToKyc"
                  class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-primary text-white hover:opacity-90 transition cursor-pointer"
                >
                  Complete KYC
                </button>
              </div>
            </div>
          </div>

          <!-- FM Section -->
          <template v-if="isFm">
            <div class="pt-4 border-t border-primary-border">

              <!-- Approved -->
              <template v-if="fmStatus === 'approved'">
                <div class="flex items-center gap-2 mb-3">
                  <CheckCircle2 class="w-4 h-4 text-primary-green" />
                  <span class="text-primary-green text-xs font-semibold">FM Account Approved</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="[key, val] in approvedFmEntries" :key="key" class="bg-background rounded-lg px-3 py-2">
                    <p class="text-secondary-text text-[10px]">{{ formatLabel(key) }}</p>
                    <p class="text-primary-text text-xs font-medium mt-0.5">{{ val }}</p>
                  </div>
                </div>
              </template>

              <!-- Pending -->
              <template v-else-if="fmStatus === 'pending'">
                <div class="flex items-center gap-2 mb-3">
                  <Clock class="w-4 h-4 text-yellow-500" />
                  <span class="text-yellow-500 text-xs font-semibold">FM Request Pending</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="[key, val] in fmRequestEntries" :key="key" class="bg-background rounded-lg px-3 py-2">
                    <p class="text-secondary-text text-[10px]">{{ formatLabel(key) }}</p>
                    <p class="text-primary-text text-xs font-medium mt-0.5">{{ val }}</p>
                  </div>
                </div>
              </template>

              <!-- Rejected -->
              <template v-else-if="fmStatus === 'rejected'">
                <div class="flex items-center gap-2 mb-3">
                  <AlertCircle class="w-4 h-4 text-primary-red" />
                  <span class="text-primary-red text-xs font-semibold">FM Request Rejected</span>
                </div>
                <p class="text-secondary-text text-xs mb-3">
                  Your Fund Manager application was rejected. Please review your details and apply again.
                </p>
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <div v-for="[key, val] in fmRequestEntries" :key="key" class="bg-background rounded-lg px-3 py-2">
                    <p class="text-secondary-text text-[10px]">{{ formatLabel(key) }}</p>
                    <p class="text-primary-text text-xs font-medium mt-0.5">{{ val }}</p>
                  </div>
                </div>
                <button
                  @click="openFmForm"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-white hover:opacity-90 transition cursor-pointer"
                >
                  <ClipboardList class="w-3.5 h-3.5" />
                  Apply Again
                </button>
              </template>

              <!-- Incomplete -->
              <template v-else>
                <div class="flex items-center gap-2 mb-3">
                  <AlertCircle class="w-4 h-4 text-primary-red" />
                  <span class="text-primary-red text-xs font-semibold">FM Registration Incomplete</span>
                </div>
                <p class="text-secondary-text text-xs mb-3">
                  Complete your Fund Manager registration to get started.
                </p>
                <button
                  @click="openFmForm"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-white hover:opacity-90 transition cursor-pointer"
                >
                  <ClipboardList class="w-3.5 h-3.5" />
                  Complete FM Registration
                </button>
              </template>

            </div>
          </template>
        </div>

        <div v-if="!showChangePassword" class="px-4 sm:px-6 py-3 sm:py-4 border-t border-primary-border flex gap-2 shrink-0">
          <button
            @click="closeDialog"
            class="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-primary-text hover:bg-primary-border transition cursor-pointer"
          >Close</button>
          <button
            @click="logout"
            class="flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-lg text-xs font-medium text-primary-red hover:bg-primary-red/10 transition cursor-pointer"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
