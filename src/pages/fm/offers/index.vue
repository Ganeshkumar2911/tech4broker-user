<template>
  <div class="space-y-6 pb-8">
    <!-- FM Profile Status Banner -->
    <FmAccountStatusCard />

    <!-- Offers Section Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 mt-6">
      <div>
        <h1
          class="text-sm font-bold text-primary-text uppercase tracking-wider"
        >
          Offers
        </h1>
        <p class="text-xs font-medium text-secondary-text mt-0.5">
          Sets of subscription conditions
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Tooltip text="Refresh Offers List" position="top">
          <button
            class="p-2 rounded-full bg-card-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
            @click="store.fetchOffers(true)"
            :disabled="store.loading"
            aria-label="Refresh List"
          >
            <RotateCw
              class="w-4 h-4"
              :class="{ 'animate-spin': store.loading }"
            />
          </button>
        </Tooltip>

        <Tooltip text="Create a new subscription offer" position="top">
          <button
            class="flex items-center gap-1.5 px-4 py-2 rounded-full bg-button text-button-text text-xs font-semibold cursor-pointer hover:brightness-110 transition-all"
            @click="openCreateDialog"
          >
            <Plus class="w-4 h-4" /> Create Offer
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- Skeleton -->
    <template v-if="store.loading">
      <div
        class="hidden md:block w-full bg-card-background rounded-2xl overflow-hidden"
      >
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-card-background/50">
              <th v-for="n in 9" :key="n" class="px-4 py-3">
                <div class="h-3 w-16 bg-background rounded animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in 5" :key="n">
              <td v-for="i in 9" :key="i" class="px-4 py-4">
                <div
                  class="h-4 bg-background rounded animate-pulse"
                  :class="i === 1 ? 'w-32' : 'w-16'"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-card-background rounded-2xl p-5 animate-pulse space-y-4"
        >
          <div class="flex items-center justify-between">
            <div class="h-4 w-32 bg-background rounded" />
            <div class="h-5 w-14 bg-background rounded-full" />
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div
              v-for="m in 4"
              :key="m"
              class="h-12 bg-background rounded-xl"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div
      v-else-if="store.offers.length === 0"
      class="flex flex-col items-center gap-4 py-20 bg-card-background rounded-2xl p-8"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-background flex items-center justify-center"
      >
        <Tag class="w-6 h-6 text-secondary-text" />
      </div>
      <div class="text-center">
        <p class="text-base font-bold text-primary-text">
          No Offers Created Yet
        </p>
        <p class="text-xs text-secondary-text mt-1">
          Create your first offer to start onboarding followers.
        </p>
      </div>
      <button
        class="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-button text-button-text text-xs font-semibold cursor-pointer"
        @click="openCreateDialog"
      >
        <Plus class="w-4 h-4" /> Create Offer
      </button>
    </div>

    <!-- Offers List -->
    <template v-else>
      <!-- Desktop Table View -->
      <div class="hidden md:block w-full bg-card-background rounded-2xl overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-background/40">
              <th
                v-for="col in [
                  'Offer Name',
                  'Visibility',
                  'Status',
                  'Subscribers',
                  'Join Links',
                  'Fees Collected',
                  'Min. Balance',
                  'Fee Config',
                  'Actions',
                ]"
                :key="col"
                class="text-left text-[11px] font-semibold text-secondary-text uppercase tracking-widest px-4 py-3.5 whitespace-nowrap"
                :class="col === 'Actions' ? 'text-right' : ''"
              >
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="offer in store.offers"
              :key="offer.id"
              class="hover:bg-background/40 transition-colors"
            >
              <td class="px-4 py-4">
                <p class="text-sm font-bold text-primary-text">
                  {{ offer.name }}
                </p>
                <p class="text-2xs text-secondary-text font-mono mt-0.5">
                  {{ offer.offer_code }}
                </p>
              </td>

              <td class="px-4 py-4">
                <span
                  class="inline-flex items-center gap-1.5 text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border"
                  :class="
                    offer.visibility === 'public'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  "
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{ offer.visibility }}
                </span>
              </td>

              <td class="px-4 py-4">
                <button
                  type="button"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  :class="
                    offer.is_active ? 'text-primary-green' : 'text-primary-red'
                  "
                  :disabled="updatingOfferId === offer.id || store.updateLoading"
                  :title="
                    offer.is_active
                      ? 'Active - Click to deactivate'
                      : 'Inactive - Click to activate'
                  "
                  @click="toggleOfferStatus(offer)"
                >
                  <Loader2
                    v-if="updatingOfferId === offer.id"
                    class="w-4 h-4 animate-spin"
                  />
                  <CheckCircle2 v-else-if="offer.is_active" class="w-4 h-4" />
                  <XCircle v-else class="w-4 h-4" />
                </button>
              </td>

              <td class="px-4 py-4 text-sm font-medium text-primary-text">
                {{ offer.subscribers_count }}
              </td>

              <td class="px-4 py-4 text-sm font-medium text-primary-text">
                {{ offer.join_link_count }}
              </td>

              <td class="px-4 py-4 text-sm font-medium text-primary-text">
                ${{ fmt(offer.total_fees_collected) }}
              </td>

              <td class="px-4 py-4 text-sm font-medium text-primary-text">
                ${{ fmt(offer.minimum_balance) }}
              </td>

              <td class="px-4 py-4">
                <div class="flex flex-col gap-1 text-2xs">
                  <div class="flex items-center gap-1.5">
                    <Tooltip text="Performance Fee (charged on profits)" position="top" wrap>
                      <Info :size="11" class="text-secondary-text shrink-0 cursor-help" />
                    </Tooltip>
                    <span class="text-secondary-text"
                      >PF:
                      <span class="text-primary-text font-semibold"
                        >{{ offer.performance_fee }}%</span
                      ></span
                    >
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Tooltip text="Management Fee (charged on equity)" position="top" wrap>
                      <Info :size="11" class="text-secondary-text shrink-0 cursor-help" />
                    </Tooltip>
                    <span class="text-secondary-text"
                      >MF:
                      <span class="text-primary-text font-semibold"
                        >{{ offer.management_fee }}%</span
                      ></span
                    >
                  </div>
                  <div
                    v-if="offer.registration_fee"
                    class="flex items-center gap-1.5"
                  >
                    <Tooltip text="One-time Registration Fee" position="top" wrap>
                      <Info :size="11" class="text-secondary-text shrink-0 cursor-help" />
                    </Tooltip>
                    <span class="text-secondary-text"
                      >RF:
                      <span class="text-primary-text font-semibold"
                        >${{ fmt(offer.registration_fee) }}</span
                      ></span
                    >
                  </div>
                  <template v-if="offer.pf_share_mode">
                    <div class="w-full h-px bg-primary-border/30 my-0.5"></div>
                    <div class="flex items-center gap-1.5">
                      <Tooltip text="PF Share Mode" position="top" wrap>
                        <Info :size="11" class="text-secondary-text shrink-0 cursor-help" />
                      </Tooltip>
                      <span class="text-secondary-text"
                        >Mode:
                        <span class="text-primary-text font-semibold capitalize"
                          >{{ offer.pf_share_mode }}</span
                        ></span
                      >
                    </div>
                    <template v-if="offer.pf_share_mode === 'fm'">
                      <div class="flex items-center gap-1.5">
                        <span class="w-2.5"></span>
                        <span class="text-secondary-text"
                          >Broker:
                          <span class="text-primary-text font-semibold"
                            >{{ offer.pf_broker_share || 0 }}%</span
                          ></span
                        >
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="w-2.5"></span>
                        <span class="text-secondary-text"
                          >Agents:
                          <span class="text-primary-text font-semibold"
                            >{{ (offer.pf_share_recipients || []).length }}</span
                          ></span
                        >
                      </div>
                    </template>
                  </template>
                </div>
              </td>

              <td class="px-4 py-4 text-right">
                <button
                  class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-button text-button-text text-xs font-semibold cursor-pointer whitespace-nowrap ml-auto"
                  @click="manageOffer(offer)"
                >
                  <Link2 class="w-3.5 h-3.5" /> Manage Links
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="offer in store.offers"
          :key="offer.id"
          class="bg-card-background rounded-2xl p-5 flex flex-col gap-4 hover:-translate-y-0.5 transition-all duration-200"
        >
          <!-- Header -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-primary-text truncate">
                {{ offer.name }}
              </p>
              <p class="text-[11px] text-secondary-text mt-0.5 font-mono">
                {{ offer.offer_code }}
              </p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span
                class="inline-flex items-center gap-1.5 text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border"
                :class="
                  offer.visibility === 'public'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                "
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ offer.visibility }}
              </span>
              <button
                type="button"
                class="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                :class="
                  offer.is_active ? 'text-primary-green' : 'text-primary-red'
                "
                :disabled="updatingOfferId === offer.id || store.updateLoading"
                :title="
                  offer.is_active
                    ? 'Active - Click to deactivate'
                    : 'Inactive - Click to activate'
                "
                @click="toggleOfferStatus(offer)"
              >
                <Loader2
                  v-if="updatingOfferId === offer.id"
                  class="w-4 h-4 animate-spin"
                />
                <CheckCircle2 v-else-if="offer.is_active" class="w-4 h-4" />
                <XCircle v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Metrics Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="bg-background rounded-xl px-3 py-2.5 text-center">
              <p class="text-2xs text-secondary-text mb-0.5">Subscribers</p>
              <p class="text-sm font-bold text-primary-text">
                {{ offer.subscribers_count }}
              </p>
            </div>
            <div class="bg-background rounded-xl px-3 py-2.5 text-center">
              <p class="text-2xs text-secondary-text mb-0.5">Join Links</p>
              <p class="text-sm font-bold text-primary-text">
                {{ offer.join_link_count }}
              </p>
            </div>
            <div class="bg-background rounded-xl px-3 py-2.5 text-center">
              <p class="text-2xs text-secondary-text mb-0.5">Total Fees</p>
              <p class="text-sm font-bold text-primary-text">
                ${{ fmt(offer.total_fees_collected) }}
              </p>
            </div>
            <div class="bg-background rounded-xl px-3 py-2.5 text-center">
              <p class="text-2xs text-secondary-text mb-0.5">Min Balance</p>
              <p class="text-sm font-bold text-primary-text">
                ${{ fmt(offer.minimum_balance) }}
              </p>
            </div>
          </div>

          <!-- Fee Info -->
          <div class="space-y-1.5 py-2 border-t border-b border-primary-border/20">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-[11px] text-secondary-text">Performance Fee</span>
                <Tooltip text="Performance Fee (charged on profits)" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="text-[11px] font-semibold text-primary-text"
                >{{ offer.performance_fee }}%</span
              >
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-[11px] text-secondary-text">Management Fee</span>
                <Tooltip text="Management Fee (charged on equity)" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="text-[11px] font-semibold text-primary-text"
                >{{ offer.management_fee }}%</span
              >
            </div>
            <div
              v-if="offer.registration_fee"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-[11px] text-secondary-text">Registration Fee</span>
                <Tooltip text="One-time Registration Fee" position="top" wrap>
                  <Info :size="11" class="text-secondary-text/70 hover:text-primary-text transition-colors cursor-pointer shrink-0" />
                </Tooltip>
              </div>
              <span class="text-[11px] font-semibold text-primary-text"
                >${{ fmt(offer.registration_fee) }}</span
              >
            </div>
            <template v-if="offer.pf_share_mode">
              <div class="w-full h-px bg-primary-border/20 my-1"></div>
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-secondary-text">PF Share Mode</span>
                <span class="text-[11px] font-semibold text-primary-text capitalize">{{ offer.pf_share_mode }}</span>
              </div>
              <template v-if="offer.pf_share_mode === 'fm'">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] text-secondary-text">Broker Share</span>
                  <span class="text-[11px] font-semibold text-primary-text">{{ offer.pf_broker_share || 0 }}%</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[11px] text-secondary-text">Additional Agents</span>
                  <span class="text-[11px] font-semibold text-primary-text">{{ (offer.pf_share_recipients || []).length }}</span>
                </div>
              </template>
            </template>
          </div>

          <!-- Actions -->
          <div>
            <button
              class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-button text-button-text text-xs font-semibold cursor-pointer"
              @click="manageOffer(offer)"
            >
              <Link2 class="w-3.5 h-3.5" /> Manage Links
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Clients & Followers Section -->
    <section class="mt-10 pt-6 border-t border-primary-border/30">
      <div class="mb-5">
        <h2
          class="text-sm font-bold text-primary-text uppercase tracking-wider"
        >
          Clients & Followers
        </h2>
        <p class="text-xs font-medium text-secondary-text mt-0.5">
          Followers assigned through your offers
        </p>
      </div>

      <!-- Followers Table Component -->
      <FollowersTableSection :show-header="false" />
    </section>

    <!-- Create / Edit Dialog -->
    <CreateOfferDialog
      :open="dialogOpen"
      :edit-offer="editingOffer"
      @close="closeDialog"
    />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Tag,
  Link2,
  Pencil,
  RotateCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-vue-next'
import { useFmOffersStore } from '@/stores/fm/offers'
import { useProfileStore } from '@/stores/shared/profile'
import { useFmStrategiesStore } from '@/stores/fm/strategies'
import FmAccountStatusCard from '../dashboard/FmAccountStatusCard.vue'
import CreateOfferDialog from '@/components/fm/offers/CreateOfferDialog.vue'
import FollowersTableSection from '../followers/index.vue'
import Tooltip from '@/components/base/Tooltip.vue'

const store = useFmOffersStore()
const profileStore = useProfileStore()
const strategiesStore = useFmStrategiesStore()
const router = useRouter()

const dialogOpen = ref(false)
const editingOffer = ref(null)
const updatingOfferId = ref(null)

const openCreateDialog = () => {
  editingOffer.value = null
  dialogOpen.value = true
}

const openEditDialog = (offer) => {
  editingOffer.value = { ...offer }
  dialogOpen.value = true
}

const toggleOfferStatus = (offer) => {
  if (updatingOfferId.value) return
  const nextStatus = !offer.is_active
  updatingOfferId.value = offer.id

  store.updateOffer(
    offer.id,
    { is_active: nextStatus },
    null,
    () => {
      if (updatingOfferId.value === offer.id) updatingOfferId.value = null
    }
  )
}

const closeDialog = () => {
  dialogOpen.value = false
  editingOffer.value = null
}

const manageOffer = (offer) => {
  localStorage.setItem('active_offer', JSON.stringify(offer))
  router.push({ name: 'fm-offer-details', params: { id: offer.id } })
}

const fmt = (v) =>
  (v ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const handleStrategyChange = () => {
  store.fetchOffers(true)
}

watch(
  () => strategiesStore.selectedStrategyId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      handleStrategyChange()
    }
  }
)

onMounted(async () => {
  if (!strategiesStore.isFetched.strategies) {
    await strategiesStore.fetchStrategies()
  }
  store.fetchOffers(true)
  if (!profileStore.isFetched) profileStore.fetchUserProfile()
  window.addEventListener('fm-strategy-changed', handleStrategyChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('fm-strategy-changed', handleStrategyChange)
})
</script>
