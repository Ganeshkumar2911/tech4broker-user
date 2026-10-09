<template>
    <!-- Order Placement Modal (Floating Draggable Window) -->
    <div v-if="isOrderModalOpen"
        class="fixed z-[9999] bg-card-background/95 backdrop-blur-md border border-primary-border rounded-xl shadow-2xl flex flex-col select-none text-primary-text transition-all duration-75 w-[320px] sm:w-[350px]"
        :style="{ left: modalPos.x + 'px', top: modalPos.y + 'px' }">

        <!-- DRAGGABLE HEADER BAR -->
        <div @mousedown="startModalDrag"
            class="flex items-center justify-between gap-2 px-3 py-2 border-b border-primary-border bg-background/80 rounded-t-xl cursor-move shrink-0 select-none">
            <!-- Drag handle & Title -->
            <div class="flex items-center gap-1.5 min-w-0">
                <GripHorizontal class="w-4 h-4 text-secondary-text shrink-0 cursor-grab" />
                <span class="text-xs font-bold text-primary-text tracking-wide truncate max-w-[110px]"
                    :title="symbolDisplay">
                    {{ symbolDisplay }}
                </span>
            </div>

            <!-- Account Select -->
            <div class="flex-1 max-w-[150px] pointer-events-auto" @mousedown.stop>
                <BaseSelect v-model="selectedAccount" :options="accountOptions" placeholder="Select Account"
                    height="26px" rounded="lg" variant="surface" />
            </div>

            <!-- Close Button -->
            <button @click="orderStore.closeOrderModal()" title="Close Modal" @mousedown.stop
                class="p-1 bg-background border border-primary-border hover:border-primary-red hover:text-primary-red text-secondary-text rounded-lg cursor-pointer transition-colors shrink-0">
                <X class="h-3.5 w-3.5" />
            </button>
        </div>

        <!-- MODAL CONTENT BODY -->
        <div class="flex flex-col gap-2 p-2.5 overflow-y-auto max-h-[80vh] custom-scrollbar">

            <!-- Row 1: MARKET / PENDING Segmented Control -->
            <div class="p-1 bg-background border border-primary-border rounded-lg grid grid-cols-2 gap-1">
                <button @click="orderType = 'market'"
                    class="py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center"
                    :class="orderType === 'market' ? 'bg-primary-blue text-white font-bold shadow-sm' : 'text-secondary-text hover:text-primary-text'">
                    MARKET
                </button>
                <button @click="orderType = 'limit'"
                    class="py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center"
                    :class="orderType === 'limit' ? 'bg-primary-blue text-white font-bold shadow-sm' : 'text-secondary-text hover:text-primary-text'">
                    PENDING
                </button>
            </div>

            <!-- Row 2: SELL / BUY Action Tabs -->
            <div class="p-1 bg-background border border-primary-border rounded-lg grid grid-cols-2 gap-1">
                <button @click="actionDirection = 'Sell'"
                    class="py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                    :class="actionDirection === 'Sell' ? 'bg-[#EA4335] text-white shadow-sm' : 'text-[#EA4335]/80 hover:text-[#EA4335]'">
                    <span>SELL</span>
                    <span class="text-[10px] font-mono font-normal">({{ formattedBid }})</span>
                </button>
                <button @click="actionDirection = 'Buy'"
                    class="py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                    :class="actionDirection === 'Buy' ? 'bg-[#34A853] text-white shadow-sm' : 'text-[#34A853]/80 hover:text-[#34A853]'">
                    <span>BUY</span>
                    <span class="text-[10px] font-mono font-normal">({{ formattedAsk }})</span>
                </button>
            </div>

            <!-- Row 3: Pending Price Input (If orderType === 'limit') -->
            <div v-if="orderType === 'limit'" class="flex flex-col gap-1">
                <label class="text-[10px] font-semibold text-secondary-text">Entry Price</label>
                <input v-model="priceInput" type="number" step="any"
                    :placeholder="actionDirection === 'Buy' ? formattedAsk : formattedBid"
                    class="w-full bg-background border border-primary-border rounded-lg px-3 py-1.5 text-xs font-mono text-primary-text focus:outline-none focus:border-primary" />
            </div>

            <!-- Row 4: Stop Loss & Take Profit Cards -->
            <div class="grid grid-cols-2 gap-2">
                <!-- Stop Loss Card -->
                <div class="flex items-center gap-1.5 p-1.5 bg-background border border-primary-border rounded-lg"
                    :class="{ 'border-[#EA4335]/50 bg-[#EA4335]/5': slActive }">
                    <input type="checkbox" v-model="slActive"
                        class="w-3.5 h-3.5 accent-[#EA4335] cursor-pointer shrink-0" />
                    <input v-model="slInput" type="number" step="any" placeholder="Stop Loss" :disabled="!slActive"
                        class="w-full bg-transparent text-xs font-mono text-primary-text focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed" />
                </div>

                <!-- Take Profit Card -->
                <div class="flex items-center gap-1.5 p-1.5 bg-background border border-primary-border rounded-lg"
                    :class="{ 'border-[#34A853]/50 bg-[#34A853]/5': tpActive }">
                    <input type="checkbox" v-model="tpActive"
                        class="w-3.5 h-3.5 accent-[#34A853] cursor-pointer shrink-0" />
                    <input v-model="tpInput" type="number" step="any" placeholder="Take Profit" :disabled="!tpActive"
                        class="w-full bg-transparent text-xs font-mono text-primary-text focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed" />
                </div>
            </div>

            <!-- Row 6: Lots Adjuster & Big Action Execution Button -->
            <div class="flex flex-col gap-2">
                <!-- Lots Adjuster Box -->
                <div
                    class="bg-background border border-primary-border rounded-lg flex items-center justify-between px-3 py-1">
                    <button @click="decrementLots"
                        class="text-secondary-text hover:text-primary-text cursor-pointer select-none text-base font-bold active:scale-90 transition-transform">
                        &minus;
                    </button>
                    <div class="flex flex-col items-center justify-center">
                        <span class="text-xs font-bold text-primary-text leading-none font-mono">{{ lots.toFixed(2)
                            }}</span>
                        <span
                            class="text-[8px] text-secondary-text font-semibold mt-0.5 leading-none tracking-wider">LOTS</span>
                    </div>
                    <button @click="incrementLots"
                        class="text-secondary-text hover:text-primary-text cursor-pointer select-none text-base font-bold active:scale-90 transition-transform">
                        &#x2B;
                    </button>
                </div>

                <!-- Big Action Execution Button -->
                <button @click="handleTradeAction(actionDirection)" :disabled="!symbolCode || orderStore.loading"
                    class="w-full py-2.5 px-3 rounded-lg text-center cursor-pointer transition-all font-bold text-xs md:text-sm text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                    :class="actionDirection === 'Sell' ? 'bg-[#EA4335] hover:bg-[#d93025]' : 'bg-[#34A853] hover:bg-[#2d9247]'">
                    {{ orderStore.loading ? 'Processing...' : `${actionDirection.toUpperCase()} ${lots.toFixed(2)} @
                    ${actionDirection === 'Sell' ? formattedBid : formattedAsk}` }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { GripHorizontal, X, RefreshCw } from 'lucide-vue-next'
import { useTradingAccountsStore } from '../../../../stores/client/tradingAccounts';
import { storeToRefs } from 'pinia';
import useOrderStore from '../../../../stores/client/orders';
import { useTickerStore } from '../../../../stores/shared/ticker';
import { useSnackbarStore } from '../../../../stores/shared/snackbar';
import BaseSelect from '@/components/base/BaseSelect.vue';
import { formatSymbolPrice } from '@/utils/symbolUtils';

const tradingAccountStore = useTradingAccountsStore();
const orderStore = useOrderStore();
const tickerStore = useTickerStore();
const snackbar = useSnackbarStore();

const { selectedAccount, selectedSymbol, isOrderModalOpen, modalDirection } = storeToRefs(orderStore)
const { data: tradingAccounts } = storeToRefs(tradingAccountStore)

const orderType = ref('market') // 'market' or 'limit'
const actionDirection = ref('Sell') // 'Sell' or 'Buy'
const slActive = ref(false)
const tpActive = ref(false)
const lots = ref(0.01)

const priceInput = ref(null)
const slInput = ref(null)
const tpInput = ref(null)

const isMobileView = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

const checkMobileView = () => {
    isMobileView.value = window.innerWidth < 768
}

// Modal Dragging State & Mechanics
const modalPos = ref({
    x: Math.max(20, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 380),
    y: 80
})
const isDraggingModal = ref(false)

const startModalDrag = (e) => {
    if (e.target.closest('button, input, select')) return
    isDraggingModal.value = true
    const startX = e.clientX - modalPos.value.x
    const startY = e.clientY - modalPos.value.y

    const onMouseMove = (moveEvent) => {
        if (!isDraggingModal.value) return
        const maxX = window.innerWidth - 330
        const maxY = window.innerHeight - 250
        modalPos.value.x = Math.max(10, Math.min(maxX, moveEvent.clientX - startX))
        modalPos.value.y = Math.max(10, Math.min(maxY, moveEvent.clientY - startY))
    }

    const onMouseUp = () => {
        isDraggingModal.value = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
}

// Sync actionDirection with modalDirection from store
watch(modalDirection, (newDir) => {
    if (newDir) actionDirection.value = newDir
}, { immediate: true })

// Computed list of options for trading accounts select
const accountOptions = computed(() => {
    if (!tradingAccounts.value || !Array.isArray(tradingAccounts.value)) return []
    return tradingAccounts.value.map((acc) => {
        const accId = acc.id ?? acc.raw?.id
        const accNum = acc.account_number || acc.login || acc.raw?.account_number || accId
        const labelName = acc.groupLabel || acc.broker_label || acc.raw?.broker_label || acc.account_category || ''
        const displayText = labelName ? `${accNum} (${labelName})` : `#${accNum}`
        return {
            label: displayText,
            value: accId
        }
    })
})

// Auto select account from options while preserving valid persisted selection
watch(accountOptions, (newOptions) => {
    if (!newOptions || newOptions.length === 0) return

    if (selectedAccount.value !== null && selectedAccount.value !== undefined) {
        const exists = newOptions.some((opt) => String(opt.value) === String(selectedAccount.value))
        if (exists) {
            const matched = newOptions.find((opt) => String(opt.value) === String(selectedAccount.value))
            if (matched && matched.value !== selectedAccount.value) {
                selectedAccount.value = matched.value
            }
            return
        }
    }

    selectedAccount.value = newOptions[0].value
}, { immediate: true })

// Symbol Code & Display logic handling null selectedSymbol
const symbolCode = computed(() => {
    if (!selectedSymbol.value) return null
    if (typeof selectedSymbol.value === 'object') {
        return selectedSymbol.value.symbol || selectedSymbol.value.name || null
    }
    return selectedSymbol.value
})

const symbolDisplay = computed(() => {
    if (!selectedSymbol.value) return 'Select Symbol'
    if (typeof selectedSymbol.value === 'object') {
        return selectedSymbol.value.symbol || selectedSymbol.value.name || 'Select Symbol'
    }
    return selectedSymbol.value
})

// Live Ask / Bid from ticker store matching watchlist behavior
const bidPrice = computed(() => {
    if (!symbolCode.value) return null
    const tick = tickerStore.getLastPrice(symbolCode.value)
    if (tick && tick.bid !== undefined && tick.bid !== null) {
        return tick.bid
    }
    if (typeof selectedSymbol.value === 'object' && selectedSymbol.value.bid) {
        return selectedSymbol.value.bid
    }
    return null
})

const askPrice = computed(() => {
    if (!symbolCode.value) return null
    const tick = tickerStore.getLastPrice(symbolCode.value)
    if (tick && tick.ask !== undefined && tick.ask !== null) {
        return tick.ask
    }
    if (typeof selectedSymbol.value === 'object' && selectedSymbol.value.ask) {
        return selectedSymbol.value.ask
    }
    return null
})

const formattedBid = computed(() => {
    const tick = tickerStore.getLastPrice(selectedSymbol.value)
    return formatSymbolPrice(bidPrice.value, selectedSymbol.value, tick?.digits)
})

const formattedAsk = computed(() => {
    const tick = tickerStore.getLastPrice(selectedSymbol.value)
    return formatSymbolPrice(askPrice.value, selectedSymbol.value, tick?.digits)
})

// Lots Adjusters
const incrementLots = () => {
    lots.value = parseFloat((lots.value + 0.01).toFixed(2))
}

const decrementLots = () => {
    lots.value = Math.max(0.01, parseFloat((lots.value - 0.01).toFixed(2)))
}

// Margin calculations based on active lot size & symbol price
const calculatedMargin = computed(() => {
    if (lots.value === 0 || !bidPrice.value || typeof bidPrice.value !== 'number') return '0.00'

    const price = bidPrice.value
    const margin = lots.value * (price * 0.001) // leverage factor
    return margin.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
})

const calculatedPercent = computed(() => {
    if (lots.value === 0) return '0.00'
    const percent = lots.value * 0.15
    return percent.toFixed(2)
})

const handleTradeAction = async (action) => {
    if (!selectedAccount.value) {
        snackbar.show("Please select a trading account.", "error")
        return
    }
    if (!symbolCode.value) {
        snackbar.show("Please select a symbol.", "error")
        return
    }
    if (!lots.value || lots.value <= 0) {
        snackbar.show("Please enter a valid lot size.", "error")
        return
    }

    let tradeType = ''
    if (orderType.value === 'market') {
        tradeType = action === 'Buy' ? 'BUY' : 'SELL'
    } else {
        const currentPrice = action === 'Buy' ? (askPrice.value || 0) : (bidPrice.value || 0)
        const targetPrice = priceInput.value ? Number(priceInput.value) : 0

        if (action === 'Buy') {
            tradeType = (targetPrice > currentPrice) ? 'BUY_STOP' : 'BUY_LIMIT'
        } else {
            tradeType = (targetPrice < currentPrice) ? 'SELL_STOP' : 'SELL_LIMIT'
        }
    }

    const targetAccount = tradingAccounts.value?.find(
        (acc) => (acc.id ?? acc.raw?.id) == selectedAccount.value
    )
    const brokerCurrency = (
        targetAccount?.broker_currency ||
        targetAccount?.currency ||
        targetAccount?.raw?.broker_currency ||
        targetAccount?.raw?.currency ||
        ''
    ).toUpperCase()

    let finalSymbol = String(symbolCode.value)
    if (brokerCurrency === 'USC') {
        finalSymbol = finalSymbol.endsWith('.c') ? finalSymbol : `${finalSymbol}.c`
    }

    const payload = {
        trading_account_id: Number(selectedAccount.value),
        symbol: finalSymbol,
        type: tradeType,
        volume: Number(lots.value)
    }

    if (orderType.value === 'limit') {
        if (!priceInput.value || Number(priceInput.value) <= 0) {
            snackbar.show("Please enter a valid pending order price.", "error")
            return
        }
        payload.price = Number(priceInput.value)
    }

    let referencePrice = 0
    if (orderType.value === 'limit' && priceInput.value && Number(priceInput.value) > 0) {
        referencePrice = Number(priceInput.value)
    } else {
        referencePrice = action === 'Buy' ? (askPrice.value || bidPrice.value || 0) : (bidPrice.value || askPrice.value || 0)
    }

    if (slActive.value && slInput.value !== null && slInput.value !== '') {
        const slVal = Number(slInput.value)
        if (referencePrice > 0) {
            const formattedRef = referencePrice > 100 ? referencePrice.toFixed(2) : referencePrice.toFixed(4)
            const priceLabel = orderType.value === 'limit' ? 'entry' : 'current LTP'
            if (action === 'Buy' && slVal >= referencePrice) {
                snackbar.show(`Stop Loss for BUY order must be below ${priceLabel} price (${formattedRef})`, "error")
                return
            }
            if (action === 'Sell' && slVal <= referencePrice) {
                snackbar.show(`Stop Loss for SELL order must be above ${priceLabel} price (${formattedRef})`, "error")
                return
            }
        }
        payload.sl = slVal
    }

    if (tpActive.value && tpInput.value !== null && tpInput.value !== '') {
        const tpVal = Number(tpInput.value)
        if (referencePrice > 0) {
            const formattedRef = referencePrice > 100 ? referencePrice.toFixed(2) : referencePrice.toFixed(4)
            const priceLabel = orderType.value === 'limit' ? 'entry' : 'current LTP'
            if (action === 'Buy' && tpVal <= referencePrice) {
                snackbar.show(`Take Profit for BUY order must be above ${priceLabel} price (${formattedRef})`, "error")
                return
            }
            if (action === 'Sell' && tpVal >= referencePrice) {
                snackbar.show(`Take Profit for SELL order must be below ${priceLabel} price (${formattedRef})`, "error")
                return
            }
        }
        payload.tp = tpVal
    }

    payload.comment = `Manual ${tradeType}`

    try {
        await orderStore.placeOrder(payload)
    } catch (err) {
        console.error("Order placement error:", err)
    }
}

onMounted(() => {
    checkMobileView()
    window.addEventListener('resize', checkMobileView)
    tradingAccountStore.setPlatformFilter('real')
    tradingAccountStore.fetchAccounts()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
}
</style>