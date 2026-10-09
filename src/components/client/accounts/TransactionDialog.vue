<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { X, Loader2, ArrowDownToLine, ArrowUpFromLine, Copy, Check } from 'lucide-vue-next'
import { useTradingAccountsStore } from '@/stores/client/tradingAccounts'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import apiRequest from '@/api/request'
import urls from '@/api/urls'
import { formatPaymentAmount } from '@/utils/formatters'

const props = defineProps({
  open: { type: Boolean, default: false },
  account: { type: Object, default: null },
  type: { type: String, default: 'deposit' },
})

const emit = defineEmits(['close', 'withdrawal-hold'])

const accounts = useTradingAccountsStore()
const snackbar = useSnackbarStore()

const isDemo = computed(() => props.account?.account_type === 'demo')
const currencySymbol = computed(() => props.account?.broker_currency === 'USD' ? '$' : 'C')

const validationError = ref('')
const redirecting = ref(false)

const selectedNetwork = ref(null)
const selectedToken = ref(null)
const selectedPaymentMethodId = ref(null)
const amount = ref('')
const walletAddress = ref('')

const depositResponse = ref(null)
const qrCodeUrl = ref('')
const copied = ref(false)

// ─── OTP State
const otpSent = ref(false)
const otpVerified = ref(false)
const otpDigits = ref(['', '', '', '', '', ''])
const resendCountdown = ref(0)
const resendInterval = ref(null)
const otpLoading = ref(false)

const startResendCountdown = () => {
  resendCountdown.value = 60
  if (resendInterval.value) {
    clearInterval(resendInterval.value)
  }
  resendInterval.value = setInterval(() => {
    resendCountdown.value -= 1
    if (resendCountdown.value === 0) {
      clearInterval(resendInterval.value)
      resendInterval.value = null
    }
  }, 1000)
}

const handleOtpInput = (index, event) => {
  const value = event.target.value
  if (value && /^\d$/.test(value)) {
    otpDigits.value[index] = value
    if (index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus()
    }
  } else if (!value) {
    otpDigits.value[index] = ''
  }
}

const handleOtpKeydown = (index, event) => {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    document.getElementById(`otp-input-${index - 1}`)?.focus()
  }
}

const getOtpCode = () => otpDigits.value.join('')

const sendWithdrawOtp = async () => {
  otpLoading.value = true
  validationError.value = ''

  const finalAmount = props.account?.broker_currency === 'USC' ? Number(amount.value) / 100 : Number(amount.value)
  const payload = {
    trading_account_id: props.account?.id,
    payment_method_id: selectedPaymentMethodId.value,
    network: selectedTokenData.value?.network,
    token: selectedTokenData.value?.alias,
    currency_id: selectedTokenData.value?.value,
    amount: finalAmount,
    wallet_address: String(walletAddress.value || '').trim(),
  }

  const successHandler = (res) => {
    otpLoading.value = false
    otpSent.value = true
    snackbar.show(res?.message || 'OTP sent successfully to your email!', 'success')
    startResendCountdown()
  }

  const failureHandler = (err) => {
    otpLoading.value = false
    validationError.value = err?.error || err?.message || 'Failed to send OTP.'
    snackbar.show(err?.error || err?.message || 'Failed to send OTP.', 'error')
  }

  apiRequest(urls.KEYS.POST, urls.wallet.withdrawRequest, {
    data: payload,
    isTokenRequired: true,
    onSuccess: successHandler,
    onFailure: failureHandler,
  })
}

const verifyWithdrawOtp = async () => {
  const otpCode = getOtpCode()
  if (!otpCode || otpCode.length !== 6) {
    validationError.value = 'Please enter all 6 digits.'
    return
  }

  otpLoading.value = true
  validationError.value = ''

  const payload = {
    otp: otpCode,
  }

  const successHandler = async (res) => {
    otpLoading.value = false
    otpVerified.value = true
    await executeWithdrawal()
  }

  const failureHandler = (err) => {
    otpLoading.value = false
    validationError.value = err?.error || err?.message || 'Invalid OTP.'
    snackbar.show(err?.error || err?.message || 'Invalid OTP.', 'error')
  }

  apiRequest(urls.KEYS.PUT, urls.wallet.withdrawVerify, {
    data: payload,
    isTokenRequired: true,
    onSuccess: successHandler,
    onFailure: failureHandler,
  })
}

const executeWithdrawal = async () => {
  try {
    const finalAmount = props.account?.broker_currency === 'USC' ? Number(amount.value) / 100 : Number(amount.value)
    const payload = {
      trading_account_id: props.account?.id,
      payment_method_id: selectedPaymentMethodId.value,
      network: selectedTokenData.value?.network,
      token: selectedTokenData.value?.alias,
      currency_id: selectedTokenData.value?.value,
      type: 'withdrawal',
      amount: finalAmount,
      wallet_address: String(walletAddress.value || '').trim(),
    }

    const response = await accounts.handleTransaction(
      props.type,
      payload,
      props.account?.balance,
      isDemo.value,
      {
        onSuccess: (res) => {
          snackbar.show(res?.message || 'Withdrawal completed successfully.', 'success')
        },
        onFailure: (err) => {
          const rawErr = String(typeof err === 'object' ? JSON.stringify(err) : err)
          if (rawErr.includes('Insufficient funds') && rawErr.includes('4008')) {
            emit('close')
            emit('withdrawal-hold')
            return
          }
          let errorMsg = err?.message || err?.error || 'Something went wrong.'
          validationError.value = errorMsg
          snackbar.show(errorMsg, 'error')
        }
      }
    )

    if (!response) return
    emit('close')
  } catch {
    // Store already shows the error via snackbar
  }
}

const submitButtonText = computed(() => {
  if (accounts.actionLoading || redirecting.value || otpLoading.value) {
    return 'Processing...'
  }
  if (props.type === 'withdraw' && !isDemo.value) {
    return otpSent.value ? 'Verify & Confirm' : 'Send OTP'
  }
  return 'Confirm'
})

onBeforeUnmount(() => {
  if (resendInterval.value) {
    clearInterval(resendInterval.value)
  }
})

const copyAddress = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    snackbar.show('Address copied to clipboard!', 'success')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error(err)
    snackbar.show('Failed to copy address.', 'error')
  }
}

// ─── Hardcoded network/token map from coinsbuy API structure
const NETWORKS = [
  { label: 'Bitcoin',  value: '5002' },
  { label: 'Ethereum', value: '5003' },
  { label: 'Tron', value: '5006' },
  { label: 'BNB', value: '5008' },
  { label: 'Arbitrum', value: '5007' },
  { label: 'Ripple',   value: '5014' },
]

const TOKENS = {
  '5002': [
    {
      label: 'BTC',
      value: '5002',
      alias: 'BTC',
      network: 'Bitcoin',
      minimal_payout_amount: '0.00000546',
    },
  ],
  '5003': [
    {
      label: 'USDT',
      value: '5100',
      alias: 'USDT',
      network: 'Ethereum',
      minimal_payout_amount: '0.000000',
    },
    {
      label: 'USDC',
      value: '5101',
      alias: 'USDC',
      network: 'Ethereum',
      minimal_payout_amount: '0.000000000000000000',
    },
  ],
  '5006': [
    {
      label: 'USDT',
      value: '5100',
      alias: 'USDT',
      network: 'Tron',
      minimal_payout_amount: '0.00000546',
    },
  ],
  '5007': [
    {
      label: 'USDT',
      value: '5109',
      alias: 'USDT',
      network: 'Arbitrum',
      minimal_payout_amount: '0.000000',
    },
    {
      label: 'USDC',
      value: '5110',
      alias: 'USDC',
      network: 'Arbitrum',
      minimal_payout_amount: '0.000000000000000000',
    },
  ],
  '5008': [
    {
      label: 'USDT',
      value: '5300',
      alias: 'BUSD-T-BSC',
      network: 'BNB SMART CHAIN',
      minimal_payout_amount: '0.00000546',
    },
  ],
  '5014': [
    {
      label: 'XRP',
      value: '5014',
      alias: 'XRP',
      network: 'Ripple',
      minimal_payout_amount: '0.000000',
    },
  ],
}

const networkOptions = computed(() => NETWORKS)

const tokenOptions = computed(() => {
  if (!selectedNetwork.value) return []
  return TOKENS[selectedNetwork.value] || []
})

// The full token object for the currently selected token
const selectedTokenData = computed(() => {
  if (!selectedNetwork.value || !selectedToken.value) return null
  return TOKENS[selectedNetwork.value]?.find(t => t.value === selectedToken.value) || null
})

const paymentMethodOptions = computed(() => {
  return (accounts.paymentMethods || []).map(item => ({
    label: item.wallet_label,
    value: item.id
  }))
})

const selectedPaymentMethod = computed(() => {
  if (!selectedPaymentMethodId.value) return null
  return (accounts.paymentMethods || []).find(item => item.id === selectedPaymentMethodId.value)
})

const formattedLimitAmount = computed(() => {
  if (!selectedPaymentMethod.value) return ''
  const isDep = props.type === 'deposit'
  const rawAmt = isDep
    ? selectedPaymentMethod.value.minimum_deposit_amount
    : selectedPaymentMethod.value.maximum_withdrawal_amount
  if (!rawAmt) return ''
  const formatted = formatPaymentAmount(
    rawAmt,
    selectedPaymentMethod.value.conversion_rate
  )
  const currency =
    selectedPaymentMethod.value.conversion_rate?.payment_currency || 'USD'
  return `${formatted} ${currency}`
})

// ─── Reset on open
watch(() => props.open, (val) => {
  if (val) {
    selectedNetwork.value = null
    selectedToken.value = null
    selectedPaymentMethodId.value = null
    amount.value = ''
    walletAddress.value = ''
    validationError.value = ''
    redirecting.value = false
    depositResponse.value = null
    qrCodeUrl.value = ''
    copied.value = false
    otpSent.value = false
    otpVerified.value = false
    otpDigits.value = ['', '', '', '', '', '']
    otpLoading.value = false
    resendCountdown.value = 0
    if (resendInterval.value) {
      clearInterval(resendInterval.value)
      resendInterval.value = null
    }
    if (!isDemo.value) {
      accounts.fetchPaymentMethods(props.type === 'deposit' ? 'deposit' : 'withdrawal')
    }
  }
})

// ─── Auto-select first payment method when open and loaded
watch(
  [() => props.open, () => accounts.paymentMethods],
  ([openVal, methodsVal]) => {
    if (openVal && methodsVal && methodsVal.length > 0 && !selectedPaymentMethodId.value) {
      selectedPaymentMethodId.value = methodsVal[0].id
    }
  },
  { immediate: true }
)

// ─── Reset token when network changes
watch(selectedNetwork, () => {
  selectedToken.value = null
})

// ─── Submit
const submit = async () => {
  validationError.value = ''

  if (isDemo.value) {
    if (!amount.value || Number(amount.value) <= 0) {
      validationError.value = 'Please enter a valid amount.'
      return
    }
    if (props.type === 'withdraw') {
      if (Number(amount.value) > (props.account?.balance || 0)) {
        validationError.value = 'Amount exceeds account balance.'
        return
      }
    }
  } else {
    // Real account validation
    if (props.type === 'deposit' && !selectedPaymentMethodId.value) {
      validationError.value = 'Please select a payment method.'
      return
    }
    if (props.type === 'withdraw') {
      if (!selectedPaymentMethodId.value) {
        validationError.value = 'Please select a payment method.'
        return
      }
      if (!selectedNetwork.value) {
        validationError.value = 'Please select a network.'
        return
      }
      if (!selectedToken.value) {
        validationError.value = 'Please select a token.'
        return
      }
      if (!amount.value || Number(amount.value) <= 0) {
        validationError.value = 'Please enter a valid amount.'
        return
      }
      if (Number(amount.value) > (props.account?.balance || 0)) {
        validationError.value = 'Amount exceeds account balance.'
        return
      }
      // const finalAmountInDollars = props.account?.broker_currency === 'USC' ? Number(amount.value) / 100 : Number(amount.value)
      // if (selectedPaymentMethod.value && selectedPaymentMethod.value.maximum_withdrawal_amount) {
      //   const maxWithdraw = Number(selectedPaymentMethod.value.maximum_withdrawal_amount)
      //   if (finalAmountInDollars > maxWithdraw) {
      //     validationError.value = `Max amount withdrawal at a time is $${selectedPaymentMethod.value.maximum_withdrawal_amount}`
      //     snackbar.show(`Max amount withdrawal at a time is $${selectedPaymentMethod.value.maximum_withdrawal_amount}`, 'error')
      //     return
      //   }
      // }
      const walletVal = Number(walletAddress.value)
      if (walletAddress.value === '' || walletAddress.value === null || isNaN(walletVal) || walletVal < 20) {
        validationError.value = 'Wallet address must be at least 20.'
        return
      }
    }
    if (!selectedNetwork.value || !selectedToken.value) {
      validationError.value = 'Please complete selection.'
      return
    }
  }

  // Check if withdrawal and not demo
  if (props.type === 'withdraw' && !isDemo.value) {
    if (!otpSent.value) {
      await sendWithdrawOtp()
    } else {
      await verifyWithdrawOtp()
    }
    return
  }

  try {
    const finalAmount = (props.type === 'withdraw' && props.account?.broker_currency === 'USC')
      ? Number(amount.value) / 100
      : Number(amount.value)

    const payload = isDemo.value
      ? {
        trading_account_id: props.account?.id,
        amount: finalAmount,
      }
      : {
        trading_account_id: props.account?.id,
        payment_method_id: selectedPaymentMethodId.value,
        network: selectedTokenData.value?.network,
        token: selectedTokenData.value?.alias,
        currency_id: selectedTokenData.value?.value,
        ...(props.type === 'withdraw' && {
          amount: finalAmount,
          wallet_address: String(walletAddress.value || '').trim(),
        }),
        ...(props.type === 'deposit' && {
          success_url: `${window.location.origin}/deposit-funds?deposit_status=success`,
          cancel_url: `${window.location.origin}/deposit-funds?deposit_status=cancelled`,
          failed_url: `${window.location.origin}/deposit-funds?deposit_status=failed`,
        }),
      }

    const response = await accounts.handleTransaction(
      props.type,
      payload,
      props.account?.balance,
      isDemo.value
    )

    if (!response) return

    if (!isDemo.value && props.type === 'deposit') {
      const data = response?.data
      if (!data?.address) {
        snackbar.show('Deposit address was not returned by the server.', 'error')
        return
      }
      try {
        const QRCode = await import('qrcode')
        qrCodeUrl.value = await QRCode.toDataURL(data.address)
        depositResponse.value = data
      } catch (qrErr) {
        console.error(qrErr)
        snackbar.show('Failed to generate QR code.', 'error')
      }
      return
    }

    emit('close')
    if (isDemo.value) {
      snackbar.show(`${props.type === 'deposit' ? 'Demo funds added' : 'Demo funds removed'} successfully!`, 'success')
    }
  } catch {
    // Store already shows the error via snackbar
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/50"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="panel">
      <div
        v-if="open"
        class="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card-background border-l border-primary-border flex flex-col shadow-2xl"
        @click.stop
      >
        <!-- QR Details View -->
        <div v-if="depositResponse" class="flex flex-col h-full">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-primary-border flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <ArrowDownToLine class="w-4 h-4 text-secondary-text" />
              <h2 class="text-sm font-semibold text-primary-text">Deposit Address</h2>
            </div>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
              @click="emit('close')"
            >
              <X class="w-4 h-4 text-secondary-text" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto no-scrollbar px-6 py-6 flex flex-col items-center text-center">
            <!-- QR Code Container -->
            <div class="p-3 bg-white rounded-xl mb-5 shadow-sm inline-block">
              <img :src="qrCodeUrl" alt="QR Code" class="w-40 h-40 object-contain" />
            </div>

            <!-- Address and Copy Section -->
            <div class="w-full mb-5">
              <p class="text-[10px] text-secondary-text uppercase tracking-wider mb-2 text-left font-medium pl-1">Deposit Address</p>
              <div class="flex items-center gap-2 bg-background border border-primary-border rounded-lg p-2 pl-3">
                <span class="text-xs text-primary-text font-mono break-all select-all flex-1 text-left">
                  {{ depositResponse.address }}
                </span>
                <button
                  class="p-1.5 rounded-md hover:bg-card-background border border-primary-border text-secondary-text hover:text-primary-text transition-colors flex-shrink-0"
                  @click="copyAddress(depositResponse.address)"
                  title="Copy to clipboard"
                >
                  <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Token Details -->
            <div class="w-full bg-background border border-primary-border rounded-xl p-4 text-left mb-4 text-xs">
              <div class="flex flex-col gap-2">
                <div class="flex justify-between">
                  <span class="text-secondary-text">Token / Asset</span>
                  <span class="font-semibold text-primary-text">{{ depositResponse.token }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-secondary-text">Network</span>
                  <span class="font-semibold text-primary-text">{{ depositResponse.network }}</span>
                </div>
                <div v-if="selectedTokenData" class="flex justify-between border-t border-primary-border pt-2 mt-1">
                  <span class="text-secondary-text">Min. Deposit</span>
                  <span class="font-semibold text-primary-text">
                    {{ selectedPaymentMethod?.minimum_deposit_amount }} {{ selectedTokenData.alias }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Warning Notice -->
            <p class="text-[10px] text-secondary-text leading-relaxed px-2">
              Send only <strong class="text-primary-text">{{ depositResponse.token }}</strong> via <strong class="text-primary-text">{{ depositResponse.network }}</strong> network to this address. Sending other assets may result in permanent loss of funds.
            </p>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-primary-border flex gap-3 shrink-0 bg-card-background">
            <button
              class="w-full px-4 py-2.5 rounded-lg text-xs font-semibold text-black bg-primary hover:bg-primary-hover transition-colors flex items-center justify-center cursor-pointer"
              @click="emit('close')"
            >
              Done
            </button>
          </div>
        </div>

        <!-- Form View -->
        <div v-else class="flex flex-col h-full">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-primary-border flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <ArrowDownToLine v-if="type === 'deposit'" class="w-4 h-4 text-secondary-text" />
              <ArrowUpFromLine v-else class="w-4 h-4 text-secondary-text" />
              <h2 class="text-sm font-semibold text-primary-text capitalize">{{ type }}</h2>
            </div>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
              @click="emit('close')"
            >
              <X class="w-4 h-4 text-secondary-text" />
            </button>
          </div>

          <!-- Scrollable Body -->
          <div class="flex-1 overflow-y-auto no-scrollbar">
            <!-- Account Details Card -->
            <div class="px-6 pt-5">
              <div class="bg-background border border-primary-border rounded-xl p-4 grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-1">Account</p>
                  <p class="text-sm font-medium text-primary-text">#{{ account?.login }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-1">Platform</p>
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary text-black">{{ account?.platform }}</span>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-1">Balance</p>
                  <p class="text-sm font-medium text-primary-text">{{ currencySymbol }}{{ account?.balance?.toFixed(2) }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-1">PnL</p>
                  <p class="text-sm font-medium" :class="account?.pnl >= 0 ? 'text-green-700' : 'text-red-700'">
                    {{ account?.pnl >= 0 ? '+' : '' }}{{ currencySymbol }}{{ account?.pnl?.toFixed(2) }}
                  </p>
                </div>
                <div class="col-span-2">
                  <p class="text-[10px] uppercase tracking-wide text-secondary-text mb-1">Status</p>
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full" :class="account?.status ? 'bg-green-500' : 'bg-gray-400'" />
                    <span class="text-xs text-secondary-text">{{ account?.status ? 'Active' : 'Inactive' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Deposit/Withdraw Inputs -->
            <div class="px-6 pt-4 pb-6">
              <!-- Payment Method Dropdown -->
              <div v-if="!isDemo" class="mb-4">
                <p class="text-xs text-secondary-text mb-1.5">Payment Method</p>
                <BaseSelect
                  v-model="selectedPaymentMethodId"
                  variant="surface"
                  :options="paymentMethodOptions"
                  placeholder="Select Payment Method"
                  :disabled="accounts.actionLoading || redirecting || (type === 'withdraw' && !isDemo && otpSent)"
                  :is-loading="accounts.isPaymentMethodsLoading"
                />
                <p v-if="selectedPaymentMethod && formattedLimitAmount" class="text-[11px] text-secondary-text mt-2">
                  {{ type === 'deposit' ? 'Min. Deposit Amount' : 'Max. Withdrawal Amount' }}:
                  <span class="text-primary-text font-medium">{{ formattedLimitAmount }}</span>
                </p>
              </div>

              <!-- Network Dropdown -->
              <div v-if="!isDemo" class="mb-4">
                <p class="text-xs text-secondary-text mb-1.5">Network</p>
                <BaseSelect
                  v-model="selectedNetwork"
                  variant="surface"
                  :options="networkOptions"
                  placeholder="Select Network"
                  :disabled="accounts.actionLoading || redirecting || (type === 'withdraw' && !isDemo && otpSent)"
                />
              </div>

              <!-- Token Dropdown -->
              <div v-if="!isDemo" class="mb-2">
                <p class="text-xs text-secondary-text mb-1.5">Token</p>
                <BaseSelect
                  v-model="selectedToken"
                  variant="surface"
                  :options="tokenOptions"
                  placeholder="Select Token"
                  :disabled="!selectedNetwork || accounts.actionLoading || redirecting || (type === 'withdraw' && !isDemo && otpSent)"
                />
              </div>

              <!-- Withdrawal Fields -->
              <div v-if="type === 'withdraw' || isDemo" class="space-y-4 mt-4">
                <div>
                  <p class="text-xs text-secondary-text mb-1.5">Amount</p>
                  <p class="text-[11px] text-secondary-text mb-1.5">
                    {{ type === 'withdraw' && props.account?.broker_currency === 'USC' ? 'Please enter amount in cents' : 'Please enter amount in dollars' }}
                  </p>
                  <input
                    v-model="amount"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Enter amount"
                    :disabled="accounts.actionLoading || redirecting || (type === 'withdraw' && !isDemo && otpSent)"
                    class="w-full px-3 py-2.5 rounded-lg border border-primary-border bg-background text-primary-text text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  />
                </div>

                <div v-if="type === 'withdraw' && !isDemo">
                  <p class="text-xs text-secondary-text mb-1.5">
                    Enter your wallet address
                  </p>
                  <input
                    v-model="walletAddress"
                    type="number"
                    min="20"
                    step="1"
                    placeholder="Wallet address"
                    :disabled="accounts.actionLoading || redirecting || (type === 'withdraw' && !isDemo && otpSent)"
                    class="w-full px-3 py-2.5 rounded-lg border border-primary-border bg-background text-primary-text text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                    :class="{
                      'border-red-500 focus:border-red-500':
                        walletAddress !== '' &&
                        walletAddress !== null &&
                        Number(walletAddress) < 20,
                    }"
                  />
                  <p
                    v-if="
                      walletAddress !== '' &&
                      walletAddress !== null &&
                      Number(walletAddress) < 20
                    "
                    class="text-xs text-red-500 font-medium mt-1"
                  >
                    Wallet address must be at least 20.
                  </p>
                  <p v-if="type != 'deposit'" class="text-[11px] text-secondary-text mt-2">
                  Min. Withdrawal Amount:
                  <span class="text-primary-text font-medium">$20</span>
                </p>
                </div>
                
              </div>

              <!-- OTP Input Section for Withdraw -->
              <div v-if="type === 'withdraw' && !isDemo && otpSent" class="mt-4 pt-4 border-t border-primary-border">
                <p class="text-xs text-secondary-text mb-3 text-center font-medium">Enter OTP</p>
                <div class="flex justify-center gap-2 mb-4">
                  <input
                    v-for="(digit, index) in otpDigits"
                    :key="index"
                    :id="`otp-input-${index}`"
                    :value="digit"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    class="w-10 h-10 text-center text-base font-semibold border border-primary-border bg-background text-primary-text rounded-lg outline-none focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-60"
                    :disabled="accounts.actionLoading || otpLoading"
                    @input="handleOtpInput(index, $event)"
                    @keydown="handleOtpKeydown(index, $event)"
                  />
                </div>
                <div class="flex justify-between items-center text-[11px] px-1">
                  <span class="text-secondary-text">Check your email for the OTP</span>
                  <button
                    type="button"
                    :disabled="resendCountdown > 0 || otpLoading || accounts.actionLoading"
                    class="font-medium text-primary hover:underline transition-colors disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
                    @click="sendWithdrawOtp"
                  >
                    {{ resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP' }}
                  </button>
                </div>
              </div>

              <p v-if="validationError" class="text-[11px] text-red-500 mt-1.5">{{ validationError }}</p>
            </div>
          </div>

          <!-- Sticky Footer -->
          <div class="px-6 py-4 border-t border-primary-border bg-card-background flex gap-3 shrink-0">
            <button
              class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-secondary-text border border-primary-border hover:bg-background hover:text-primary-text transition-colors disabled:opacity-60 cursor-pointer"
              :disabled="accounts.actionLoading || redirecting || otpLoading"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              :disabled="
                accounts.actionLoading ||
                otpLoading ||
                redirecting ||
                (!isDemo && (!selectedPaymentMethodId || !selectedNetwork || !selectedToken)) ||
                (isDemo && (!amount || Number(amount) <= 0)) ||
                (!isDemo && type === 'withdraw' && (!amount || Number(amount) <= 0 || !walletAddress || Number(walletAddress) < 20)) ||
                (type === 'withdraw' && !isDemo && otpSent && getOtpCode().length !== 6)
              "
              class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-black bg-primary hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              @click="submit"
            >
              <Loader2 v-if="accounts.actionLoading || redirecting || otpLoading" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ submitButtonText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
