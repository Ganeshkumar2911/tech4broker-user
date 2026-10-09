<script setup>
import { ref, computed, watch } from 'vue'
import {
  X,
  ShoppingBag,
  Package,
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-vue-next'
import { useLoyaltyStore } from '@/stores/client/loyalty'
import LoyaltyMedia from '@/components/client/loyalty/LoyaltyMedia.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  product: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['close', 'redeemed'])

const store = useLoyaltyStore()

// Shipping / Delivery fields
const shippingForm = ref({
  full_name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  notes: '',
})

// Active image index for carousel
const activeImageIndex = ref(0)

const images = computed(() => {
  if (props.product?.image_urls && props.product.image_urls.length > 0) {
    return props.product.image_urls
  }
  if (props.product?.image_url) {
    return [props.product.image_url]
  }
  return []
})

const pointsRequired = computed(() => {
  return Number(props.product?.points_required || props.product?.points_cost || 0)
})

const userAvailablePoints = computed(() => {
  return Number(store.summary?.available_points || 0)
})

const remainingPointsAfter = computed(() => {
  return Math.max(0, userAvailablePoints.value - pointsRequired.value).toFixed(2)
})

const hasEnoughPoints = computed(() => {
  return userAvailablePoints.value >= pointsRequired.value
})

const isOutOfStock = computed(() => {
  const stock = props.product?.stock ?? props.product?.stock_qty
  return stock !== null && stock !== undefined && stock <= 0
})

const isPointsOnHold = computed(() => {
  return Boolean(store.summary?.points_on_hold)
})

const isPhysicalOrShippingRequired = computed(() => {
  const type = props.product?.product_type || props.product?.type
  return type === 'merchandise' || props.product?.fulfillment_config?.shipping_required === true
})

// Reset modal state on open
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      activeImageIndex.value = 0
      shippingForm.value = {
        full_name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        notes: '',
      }
    }
  }
)

const nextImage = () => {
  if (images.value.length <= 1) return
  activeImageIndex.value = (activeImageIndex.value + 1) % images.value.length
}

const prevImage = () => {
  if (images.value.length <= 1) return
  activeImageIndex.value = (activeImageIndex.value - 1 + images.value.length) % images.value.length
}

const closeModal = () => {
  emit('close')
}

const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'redeem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
}

const handleSubmit = () => {
  if (!props.product?.id || isPointsOnHold.value || !hasEnoughPoints.value || isOutOfStock.value) return

  const idempotencyKey = generateIdempotencyKey()
  const payload = {
    idempotency_key: idempotencyKey,
  }

  const enrollmentId =
    store.summary?.enrollment_id ||
    store.selectedProgram?.enrollment_id ||
    store.programs?.find((p) => p.id === props.product?.program_id)?.enrollment_id ||
    store.programs?.find((p) => p.enrolled)?.enrollment_id

  if (enrollmentId) {
    payload.enrollment_id = enrollmentId
  }

  // Include shipping snapshot if required or filled
  payload.shipping_snapshot = {
    full_name: shippingForm.value.full_name,
    phone: shippingForm.value.phone,
    email: shippingForm.value.email,
    address: shippingForm.value.address,
    city: shippingForm.value.city,
    state: shippingForm.value.state,
    postal_code: shippingForm.value.postal_code,
    country: shippingForm.value.country,
    notes: shippingForm.value.notes,
  }

  store.redeemStoreProduct(props.product.id, payload, (res) => {
    emit('redeemed', res)
    closeModal()
  })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
  >
    <div
      class="bg-card-background w-full max-w-lg rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border-0"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-primary-border/20 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ShoppingBag class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-primary-text">Redeem Store Reward</h3>
            <p class="text-xs text-secondary-text">Confirm redemption and delivery details</p>
          </div>
        </div>
        <button
          @click="closeModal"
          class="text-secondary-text hover:text-primary-text p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
        <!-- Points On Hold Alert -->
        <div
          v-if="isPointsOnHold"
          class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5"
        >
          <div class="flex items-center gap-2 font-bold text-amber-400">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>Points On Hold</span>
          </div>
          <p class="text-[11px] text-amber-200/80 leading-relaxed">
            Your loyalty points are currently on temporary hold. Store reward redemptions are paused.
          </p>
        </div>

        <!-- Product Overview Card -->
        <div class="rounded-2xl overflow-hidden bg-background">
          <!-- Image Gallery / Carousel -->
          <div class="relative w-full h-48 sm:h-56 bg-background flex items-center justify-center overflow-hidden shrink-0">
            <LoyaltyMedia
              :items="images"
              :alt="product?.name || product?.title"
              :auto-slide="true"
              :pause-on-hover="true"
              :show-controls="true"
              :show-arrows="true"
              :show-dots="true"
              media-class="w-full h-full object-cover"
            />
          </div>

          <!-- Product Details Header -->
          <div class="p-4 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <BaseBadge :value="product?.product_type || product?.type || 'Reward'" variant="neutral" size="2xs" />
              <div class="flex items-center gap-2">
                <span v-if="product?.cash_value" class="text-xs font-semibold text-secondary-text">
                  ~${{ Number(product.cash_value).toFixed(2) }} USD
                </span>
                <BaseBadge
                  :value="isOutOfStock ? 'Out of Stock' : (product?.stock ?? product?.stock_qty ? `${product.stock ?? product.stock_qty} in stock` : 'In Stock')"
                  :variant="isOutOfStock ? 'danger' : 'success'"
                  size="xs"
                />
              </div>
            </div>

            <h4 class="text-base font-bold text-primary-text">{{ product?.name || product?.title }}</h4>
            <p v-if="product?.description" class="text-xs text-secondary-text leading-relaxed">
              {{ product.description }}
            </p>
          </div>
        </div>

        <!-- Points Calculation Breakdown -->
        <div class="bg-background rounded-2xl p-4 space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-secondary-text">Available Points</span>
            <span class="font-bold text-primary-text font-mono">{{ userAvailablePoints.toFixed(2) }} pts</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-secondary-text">Points Required</span>
            <span class="font-bold text-primary font-mono">{{ pointsRequired.toFixed(2) }} pts</span>
          </div>
          <div class="flex items-center justify-between text-xs pt-2.5 border-t border-primary-border/20">
            <span class="text-secondary-text font-medium">Points After Redemption</span>
            <span
              class="font-bold font-mono"
              :class="hasEnoughPoints ? 'text-primary-text' : 'text-red-500'"
            >
              {{ hasEnoughPoints ? `${remainingPointsAfter} pts` : 'Insufficient Points' }}
            </span>
          </div>
        </div>

        <!-- Insufficient Points Alert -->
        <div
          v-if="!hasEnoughPoints && !isPointsOnHold"
          class="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 text-xs rounded-2xl"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>You need {{(pointsRequired - userAvailablePoints).toFixed(2)}} more points to redeem this reward.</span>
        </div>

        <!-- Shipping / Delivery Information Form -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-semibold text-primary-text flex items-center gap-1.5">
              <Truck class="w-3.5 h-3.5 text-primary" />
              {{ isPhysicalOrShippingRequired ? 'Shipping / Delivery Address' : 'Recipient Details (Optional)' }}
            </h5>
            <span v-if="isPhysicalOrShippingRequired" class="text-2xs text-amber-500 font-medium">
              Required for delivery
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label class="block text-secondary-text mb-1 font-medium">Full Name</label>
              <input
                v-model="shippingForm.full_name"
                type="text"
                placeholder="Recipient name"
                class="w-full px-4 py-2.5 text-xs rounded-xl bg-background text-primary-text outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-secondary-text/50"
              />
            </div>
            <div>
              <label class="block text-secondary-text mb-1 font-medium">Phone Number</label>
              <input
                v-model="shippingForm.phone"
                type="tel"
                placeholder="+1 234 567 8900"
                class="w-full px-4 py-2.5 text-xs rounded-xl bg-background text-primary-text outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-secondary-text/50"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-secondary-text mb-1 font-medium">Delivery Address</label>
              <input
                v-model="shippingForm.address"
                type="text"
                placeholder="Street address, apartment, suite"
                class="w-full px-4 py-2.5 text-xs rounded-xl bg-background text-primary-text outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-secondary-text/50"
              />
            </div>
            <div>
              <label class="block text-secondary-text mb-1 font-medium">City</label>
              <input
                v-model="shippingForm.city"
                type="text"
                placeholder="City"
                class="w-full px-4 py-2.5 text-xs rounded-xl bg-background text-primary-text outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-secondary-text/50"
              />
            </div>
            <div>
              <label class="block text-secondary-text mb-1 font-medium">Postal / Zip Code</label>
              <input
                v-model="shippingForm.postal_code"
                type="text"
                placeholder="Postal code"
                class="w-full px-4 py-2.5 text-xs rounded-xl bg-background text-primary-text outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-secondary-text/50"
              />
            </div>
            <div>
              <label class="block text-secondary-text mb-1 font-medium">Country</label>
              <input
                v-model="shippingForm.country"
                type="text"
                placeholder="Country"
                class="w-full px-4 py-2.5 text-xs rounded-xl bg-background text-primary-text outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-secondary-text/50"
              />
            </div>
            <div>
              <label class="block text-secondary-text mb-1 font-medium">Additional Notes</label>
              <input
                v-model="shippingForm.notes"
                type="text"
                placeholder="Special delivery notes or instructions"
                class="w-full px-4 py-2.5 text-xs rounded-xl bg-background text-primary-text outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-secondary-text/50"
              />
            </div>
          </div>
        </div>

        <!-- Reward Lifecycle Notice -->
        <div class="bg-background rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-secondary-text">
          <Info class="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>
            Upon submission, required points and stock will be immediately reserved (<strong class="text-amber-500 font-semibold">PENDING</strong>). Once our team processes your reward, it will be marked as <strong class="text-emerald-400 font-semibold">APPROVED & FULFILLED</strong>.
          </span>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-2 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-primary-border/20 bg-background/50 shrink-0">
        <button
          type="button"
          @click="closeModal"
          class="h-10 px-5 text-xs font-semibold text-secondary-text hover:text-primary-text rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="store.isStoreRedeemLoading || !hasEnoughPoints || isOutOfStock"
          @click="handleSubmit"
          class="inline-flex items-center gap-1.5 h-10 px-5 text-xs font-bold text-button-text bg-button hover:opacity-90 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="store.isStoreRedeemLoading" class="w-3.5 h-3.5 animate-spin" />
          <ShoppingBag v-else class="w-3.5 h-3.5" />
          <span>{{ store.isStoreRedeemLoading ? 'Processing...' : 'Confirm Redemption' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
