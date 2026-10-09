<template>
  <Teleport to="body">
    <!-- Backdrop Overlay -->
    <Transition name="overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
        @click="emit('close')"
      />
    </Transition>

    <!-- Side Drawer Panel -->
    <Transition name="panel">
      <div
        v-if="open"
        class="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-card-background border-l border-primary-border flex flex-col shadow-2xl"
        @click.stop
      >
        <!-- Header -->
        <div
          class="px-6 py-5 border-b border-primary-border flex items-start justify-between shrink-0"
        >
          <div>
            <h2 class="text-sm font-semibold text-primary-text">
              Edit {{ sectionTitle }}
            </h2>
            <p class="text-[11px] text-secondary-text mt-1">
              Modify the {{ sectionTitle.toLowerCase() }} details.
            </p>
          </div>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-secondary-text hover:text-primary-text cursor-pointer"
            @click="emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto no-scrollbar px-6 py-5 space-y-4">
        <!-- Common Information Section -->
        <template v-if="section === 'common'">
          <div
            class="bg-background border border-primary-border rounded-xl p-4 space-y-4"
          >
            <div>
              <p class="text-xs text-secondary-text mb-1.5">Title</p>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. VIP Offer"
                class="w-full px-3 py-2.5 rounded-lg bg-card-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text"
              />
              <p class="text-[11px] text-secondary-text mt-1.5">
                Use a clear name that helps followers understand the offer at a glance.
              </p>
            </div>
            <div>
              <p class="text-xs text-secondary-text mb-1.5">Visibility</p>
              <AccountFilterTabs
                :model-value="form.visibility"
                :tabs="visibilityTabs"
                @update:model-value="form.visibility = $event"
              />
              <p class="text-[11px] text-secondary-text mt-1.5">
                Public offers can be discovered more easily, while private offers stay restricted.
              </p>
            </div>
            <div>
              <p class="text-xs text-secondary-text mb-1.5">Summary</p>
              <textarea
                v-model="form.summary"
                rows="2"
                placeholder="Brief description..."
                class="w-full px-3 py-2.5 rounded-lg bg-card-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text resize-none"
              />
              <p class="text-[11px] text-secondary-text mt-1.5">
                Add a short description that explains the offer in simple terms.
              </p>
            </div>
          </div>
        </template>

        <!-- Fees Section -->
        <template v-if="section === 'fees'">
          <div class="bg-background border border-primary-border rounded-xl p-4 space-y-6">
            <div class="grid grid-cols-1 gap-4">
              <div>
                <p class="text-xs text-secondary-text mb-1.5">
                  Performance Fee (%)
                </p>
                <input
                  v-model.number="form.performance_fee"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 15"
                  class="w-full px-3 py-2.5 rounded-lg bg-card-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text"
                />
                <p class="text-[11px] text-secondary-text mt-1.5">
                  The specified percent of the followers' profit is paid to the provider by the end of the selected interval.
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-1.5">
                  Management Fee (%)
                </p>
                <input
                  v-model.number="form.management_fee"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 10"
                  class="w-full px-3 py-2.5 rounded-lg bg-card-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text"
                />
                <p class="text-[11px] text-secondary-text mt-1.5">
                  This recurring fee is charged for managing the offer during the selected billing interval.
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary-text mb-1.5">
                  Registration Fee ($)
                </p>
                <input
                  v-model.number="form.registration_fee"
                  type="number"
                  min="0"
                  placeholder="e.g. 10"
                  class="w-full px-3 py-2.5 rounded-lg bg-card-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text"
                />
                <p class="text-[11px] text-secondary-text mt-1.5">
                  A one-time fee paid when a follower first joins the offer.
                </p>
              </div>
            </div>

            <!-- PF Share Mode -->
            <div v-if="profileStore.user?.fm_info?.allow_fm_pf_share_mode" class="border-t border-primary-border pt-6 space-y-4">
              <div>
                <h3 class="text-sm font-bold text-primary-text mb-1">Performance Fee Distribution</h3>
                <p class="text-xs text-secondary-text mb-3">Split & recipient routing</p>
              </div>

              <div>
                <p class="text-xs text-secondary-text mb-1.5">Distribution Mode</p>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    class="flex items-start gap-2.5 p-3.5 rounded-[10px] border border-primary-border bg-card-background text-left transition-colors duration-150 ease-in opacity-70 cursor-default"
                    :class="{ 'border-primary-text': form.pf_share_mode === 'broker' }"
                  >
                    <div class="w-4 h-4 rounded-full border-[1.5px] border-primary-border flex items-center justify-center shrink-0 mt-px transition-colors duration-150 ease-in" :class="{ 'border-primary-text': form.pf_share_mode === 'broker' }">
                      <div v-if="form.pf_share_mode === 'broker'" class="w-1.75 h-1.75 rounded-full bg-primary-text" />
                    </div>
                    <div>
                      <p class="text-xs font-medium text-primary-text">Platform Mode</p>
                      <p class="text-2xs text-secondary-text mt-0.5">Platform manages automated fee allocation</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    class="flex items-start gap-2.5 p-3.5 rounded-[10px] border border-primary-border bg-card-background text-left transition-colors duration-150 ease-in opacity-70 cursor-default"
                    :class="{ 'border-primary-text': form.pf_share_mode === 'fm' }"
                  >
                    <div class="w-4 h-4 rounded-full border-[1.5px] border-primary-border flex items-center justify-center shrink-0 mt-px transition-colors duration-150 ease-in" :class="{ 'border-primary-text': form.pf_share_mode === 'fm' }">
                      <div v-if="form.pf_share_mode === 'fm'" class="w-1.75 h-1.75 rounded-full bg-primary-text" />
                    </div>
                    <div>
                      <p class="text-xs font-medium text-primary-text">FM Mode</p>
                      <p class="text-2xs text-secondary-text mt-0.5">Custom split between specified parties</p>
                    </div>
                  </button>
                </div>
              </div>

              <template v-if="form.pf_share_mode === 'fm'">
                <div>
                  <p class="text-xs text-secondary-text mb-1.5">Platform Split of Total PF</p>
                  <div class="relative flex items-center">
                    <input
                      v-model.number="form.pf_broker_share"
                      type="number"
                      min="0" max="100"
                      placeholder="0"
                      class="w-full px-3 py-2.5 rounded-lg bg-card-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                    <span class="absolute right-3 text-xs font-medium text-secondary-text pointer-events-none">%</span>
                  </div>
                </div>

                <!-- Allocation info -->
                <div class="px-3.5 py-3 rounded-[10px] border border-primary-border bg-card-background">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] text-secondary-text">Total Allocation</span>
                    <span class="text-[11px] text-secondary-text tabular-nums">{{ totalAllocated }}% allocated</span>
                  </div>
                  <div class="w-full h-1 rounded-full bg-primary-border overflow-hidden mt-2">
                    <div
                      class="h-full rounded-full transition-all duration-300 ease-in"
                      :class="totalAllocated > 100 ? 'bg-primary-red' : 'bg-primary-text'"
                      :style="{ width: Math.min(totalAllocated, 100) + '%' }"
                    />
                  </div>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-2xs text-secondary-text">Platform: {{ Number(form.pf_broker_share) || 0 }}% · Additional Agents: {{ totalRecipientShare }}%</span>
                    <span class="text-2xs text-secondary-text">FM Wallet: {{ Math.max(0, 100 - totalAllocated) }}%</span>
                  </div>
                </div>

                <!-- Additional Agents -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <div>
                      <p class="text-xs font-medium text-primary-text">Additional Agents</p>
                      <p class="text-2xs text-secondary-text mt-0.5">Add external wallets or accounts.</p>
                    </div>
                    <button type="button" class="text-[11px] font-semibold text-primary-text bg-transparent hover:bg-background px-2 py-1 rounded cursor-pointer transition-colors" @click="addRecipient">
                      + Add Agent
                    </button>
                  </div>

                  <!-- Empty state -->
                  <div v-if="!form.pf_share_recipients?.length" class="flex flex-col items-center gap-1 p-5 rounded-[10px] border border-dashed border-primary-border mt-3">
                    <span class="material-symbols-outlined text-secondary-text/40" style="font-size:24px">group</span>
                    <p class="text-[11px] text-secondary-text/60">No agents added yet</p>
                  </div>

                  <!-- Agent rows -->
                  <div v-else class="space-y-2.5 mt-3">
                    <div
                      v-for="(rec, idx) in form.pf_share_recipients"
                      :key="idx"
                      class="p-3.5 rounded-[10px] border border-primary-border bg-card-background"
                    >
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                          <span class="w-5 h-5 rounded-md bg-background border border-primary-border flex items-center justify-center text-2xs font-bold text-secondary-text">{{ idx + 1 }}</span>
                          <span class="text-[11px] font-medium text-primary-text">Agent {{ idx + 1 }}</span>
                        </div>
                        <button
                          type="button"
                          class="text-secondary-text hover:text-primary-red cursor-pointer transition-colors"
                          @click="form.pf_share_recipients.splice(idx, 1)"
                        >
                          <X class="w-4 h-4" />
                        </button>
                      </div>

                      <div class="grid grid-cols-12 gap-2">
                        <div class="col-span-4">
                          <label class="text-2xs text-secondary-text mb-1 block">Type</label>
                          <BaseSelect
                            v-model="rec.destination_type"
                            :options="destinationTypeOptions"
                            placeholder="Type"
                          />
                        </div>
                        <div class="col-span-5">
                          <label class="text-2xs text-secondary-text mb-1 block">
                            {{ rec.destination_type === 'wallet' ? 'Wallet ID / Address' : 'Account No.' }}
                          </label>
                          <input
                            v-if="rec.destination_type === 'wallet'"
                            v-model.number="rec.wallet_id"
                            type="number"
                            placeholder="ex. or Account ID"
                            class="w-full px-2.5 py-2 rounded-lg bg-background border border-primary-border text-primary-text text-xs outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                          <input
                            v-else
                            v-model="rec.account_number"
                            type="text"
                            placeholder="Number"
                            class="w-full px-2.5 py-2 rounded-lg bg-background border border-primary-border text-primary-text text-xs outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text"
                          />
                        </div>
                        <div class="col-span-3">
                          <label class="text-2xs text-secondary-text mb-1 block">Share</label>
                          <div class="relative flex items-center">
                            <input
                              v-model.number="rec.share_percentage"
                              type="number"
                              min="0" max="100"
                              placeholder="0"
                              class="w-full px-2.5 py-2 rounded-lg bg-background border border-primary-border text-primary-text text-xs outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                            <span class="absolute right-2.5 text-[11px] font-medium text-secondary-text pointer-events-none">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- Filters Section -->
        <template v-if="section === 'filters'">
          <div
            class="bg-background border border-primary-border rounded-xl p-4 space-y-4"
          >
            <div>
              <p class="text-xs text-secondary-text mb-1.5">Minimum Balance ($)</p>
              <input
                v-model.number="form.minimum_balance"
                type="number"
                min="0"
                placeholder="e.g. 2000"
                class="w-full px-3 py-2.5 rounded-lg bg-card-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary-blue transition-colors placeholder:text-secondary-text"
              />
              <p class="text-[11px] text-secondary-text mt-1.5">
                Followers must keep at least this balance to remain eligible for the offer.
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 border-t border-primary-border flex gap-3 bg-card-background shrink-0"
      >
        <button
          class="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-secondary-text border border-primary-border hover:bg-background hover:text-primary-text transition-colors cursor-pointer"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          :disabled="loading || !isValid"
          class="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-button text-button-text hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          @click="submit"
        >
          <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ loading ? 'Saving...' : 'Save Changes' }}</span>
        </button>
      </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X, Tag, Sliders, DollarSign, Loader2 } from 'lucide-vue-next'
import { useFmOffersStore } from '@/stores/fm/offers'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import { useProfileStore } from '@/stores/shared/profile'
import AccountFilterTabs from '@/components/client/accounts/AccountFilterTabs.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  section: {
    type: String,
    validator: (v) => ['common', 'fees', 'filters'].includes(v),
    required: true,
  },
  offerId: { type: [String, Number], required: true },
  offer: { type: Object, required: true },
})
const emit = defineEmits(['close', 'updated'])

const store = useFmOffersStore()
const snackbar = useSnackbarStore()
const profileStore = useProfileStore()

const form = ref({})

const visibilityTabs = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
]

const destinationTypeOptions = [
  { label: 'Wallet', value: 'wallet' },
  { label: 'Trading Account', value: 'trading_account' },
]

const sectionTitle = computed(() => {
  const titles = {
    common: 'Common Information',
    fees: 'Fees',
    filters: 'Requirements',
  }
  return titles[props.section]
})

const icon = computed(() => {
  const icons = {
    common: Tag,
    fees: DollarSign,
    filters: Sliders,
  }
  return icons[props.section]
})

const loading = computed(() => store.updateLoading)

const addRecipient = () => {
  if (!form.value.pf_share_recipients) form.value.pf_share_recipients = []
  form.value.pf_share_recipients.push({ destination_type: 'wallet', wallet_id: null, account_number: '', share_percentage: 0 });
};

const totalRecipientShare = computed(() => {
  if (!form.value.pf_share_recipients) return 0;
  return form.value.pf_share_recipients.reduce((sum, r) => sum + (Number(r.share_percentage) || 0), 0);
});

const totalAllocated = computed(() => {
  return (Number(form.value.pf_broker_share) || 0) + totalRecipientShare.value;
});

const isValid = computed(() => {
  if (props.section === 'fees' && form.value.pf_share_mode === 'fm') {
    const brokerValid = form.value.pf_broker_share >= 0 && form.value.pf_broker_share <= 100;
    const recipientsValid = (form.value.pf_share_recipients || []).every(r => r.share_percentage > 0 && r.share_percentage <= 100);
    return brokerValid && totalAllocated.value <= 100 && recipientsValid;
  }
  return true;
})

const initializeForm = () => {
  const offer = props.offer
  if (!offer) {
    form.value = {}
    return
  }

  if (props.section === 'common') {
    form.value = {
      name: String(offer.name ?? ''),
      visibility: String(offer.visibility ?? 'public'),
      summary: String(offer.summary ?? offer.description ?? ''),
    }
  } else if (props.section === 'fees') {
    form.value = {
      performance_fee:
        offer.performance_fee != null ? Number(offer.performance_fee) : null,
      management_fee:
        offer.management_fee != null ? Number(offer.management_fee) : null,
      registration_fee:
        offer.registration_fee != null ? Number(offer.registration_fee) : null,
      pf_share_mode: offer.pf_share_mode || 'broker',
      pf_broker_share: offer.pf_broker_share ?? 0,
      pf_share_recipients: offer.pf_share_recipients ? offer.pf_share_recipients.map(r => ({ ...r })) : [],
    }
  } else if (props.section === 'filters') {
    form.value = {
      minimum_balance:
        offer.minimum_balance != null ? Number(offer.minimum_balance) : null,
    }
  }
}

const getPayload = () => {
  const payload = { ...form.value }

  if (props.section === 'common') {
    return {
      name: payload.name,
      visibility: payload.visibility,
      summary: payload.summary,
    }
  } else if (props.section === 'fees') {
    const feePayload = {
      performance_fee: payload.performance_fee,
      management_fee: payload.management_fee,
      registration_fee: payload.registration_fee,
    }
    if (profileStore.user?.fm_info?.allow_fm_pf_share_mode) {
      if (payload.pf_share_mode === 'fm') {
        feePayload.pf_broker_share = payload.pf_broker_share
        feePayload.pf_share_recipients = payload.pf_share_recipients
      }
    }
    return feePayload
  } else if (props.section === 'filters') {
    return {
      minimum_balance: payload.minimum_balance,
    }
  }

  return payload
}

const submit = () => {
  const payload = getPayload()

  store.updateOffer(props.offerId, payload, () => {
    snackbar.show(`${sectionTitle.value} updated successfully.`, 'success')
    emit('close')
    emit('updated', payload)
  })
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      initializeForm()
    }
  },
  { immediate: true }
)

watch(
  () => props.offer,
  (offer) => {
    if (props.open && offer) {
      initializeForm()
    }
  },
  { deep: true }
)

watch(
  () => props.section,
  () => {
    if (props.open) {
      initializeForm()
    }
  }
)
</script>

<style scoped>
/* ── Transitions ── */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.panel-enter-active,
.panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
}
</style>
