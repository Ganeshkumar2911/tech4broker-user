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
        class="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-card-background border-l border-primary-border flex flex-col"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-primary-border flex items-start justify-between shrink-0">
          <div>
            <h2 class="text-sm font-semibold text-primary-text">
              {{ isEditing ? 'Edit Offer' : 'Create New Offer' }}
            </h2>
            <p class="text-[11px] text-secondary-text mt-1">
              Define fund parameters, fee schedules, and allocation rules.
            </p>
          </div>
          <button
            type="button"
            class="w-7 h-7 flex items-center justify-center rounded-lg text-secondary-text cursor-pointer"
            @click="emit('close')"
          >
            <span class="material-symbols-outlined" style="font-size:18px">close</span>
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto no-scrollbar px-6 py-5 space-y-6">

          <!-- ── Section 1: Basic Information ── -->
          <div class="pb-6 border-b border-primary-border last:border-b-0 last:pb-0">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <span class="w-6.5 h-6.5 rounded-lg bg-background border border-primary-border flex items-center justify-center text-2xs font-bold text-secondary-text">01</span>
                <span class="text-[11px] font-bold tracking-[0.06em] uppercase text-primary-text">Basic Information</span>
              </div>
              <span class="text-[11px] text-secondary-text italic">General settings</span>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-secondary-text mb-1.5">Offer Name <span class="text-primary-red">*</span></label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Alpha Growth Fund"
                  class="w-full px-3 py-2.5 rounded-[10px] bg-background border border-primary-border text-primary-text text-[13px] outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-secondary-text mb-1.5">Visibility</label>
                <AccountFilterTabs
                  :model-value="form.visibility"
                  :tabs="visibilityTabs"
                  @update:model-value="form.visibility = $event"
                />
                <p class="text-[11px] text-secondary-text leading-relaxed mt-2">
                  {{ form.visibility === 'public'
                    ? 'Visible on the institutional leaderboard. Approved investors can discover and join directly.'
                    : 'Accessible only via direct invite link. Not listed publicly.' }}
                </p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-medium text-secondary-text mb-0">Summary</label>
                  <span class="text-2xs text-secondary-text tabular-nums">{{ (form.summary || '').length }} / 300</span>
                </div>
                <textarea
                  v-model="form.summary"
                  rows="3"
                  maxlength="300"
                  placeholder="Briefly describe your strategy and offer highlights..."
                  class="w-full px-3 py-2.5 rounded-[10px] bg-background border border-primary-border text-primary-text text-[13px] outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder resize-none leading-[1.6]"
                />
              </div>
            </div>
          </div>

          <!-- ── Section 2: Fee Structure ── -->
          <div class="pb-6 border-b border-primary-border last:border-b-0 last:pb-0">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <span class="w-6.5 h-6.5 rounded-lg bg-background border border-primary-border flex items-center justify-center text-2xs font-bold text-secondary-text">02</span>
                <span class="text-[11px] font-bold tracking-[0.06em] uppercase text-primary-text">Fee Structure</span>
              </div>
              <span class="text-[11px] text-secondary-text italic">Rates & billing</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-secondary-text mb-1.5">Performance Fee</label>
                <div class="relative flex items-center">
                  <input
                    v-model.number="form.performance_fee"
                    type="number"
                    min="0" max="100"
                    placeholder="20"
                    class="w-full px-3 py-2.5 rounded-[10px] bg-background border border-primary-border text-primary-text text-[13px] outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <span class="absolute right-2.5 text-[11px] font-medium text-secondary-text pointer-events-none">%</span>
                </div>
                <p class="text-[11px] text-secondary-text leading-relaxed mt-1.5">Profit share paid to provider at end of billing interval.</p>
              </div>

              <div>
                <label class="block text-xs font-medium text-secondary-text mb-1.5">Management Fee</label>
                <div class="relative flex items-center">
                  <input
                    v-model.number="form.management_fee"
                    type="number"
                    min="0" max="100"
                    placeholder="10"
                    class="w-full px-3 py-2.5 rounded-[10px] bg-background border border-primary-border text-primary-text text-[13px] outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <span class="absolute right-2.5 text-[11px] font-medium text-secondary-text pointer-events-none">%</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-secondary-text mb-1.5">Billing Interval</label>
                <BaseSelect
                  v-model="form.management_fee_interval"
                  :options="intervalOptions"
                  placeholder="Select interval"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-secondary-text mb-1.5">Registration Fee</label>
                <div class="relative flex items-center">
                  <span class="absolute left-3 text-[13px] text-secondary-text pointer-events-none">$</span>
                  <input
                    v-model.number="form.registration_fee"
                    type="number"
                    min="0"
                    placeholder="10"
                    class="w-full px-3 pl-6 py-2.5 rounded-[10px] bg-background border border-primary-border text-primary-text text-[13px] outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- ── Section 3: PF Share Mode ── -->
          <div v-if="profileStore.user?.fm_info?.allow_fm_pf_share_mode" class="pb-6 border-b border-primary-border last:border-b-0 last:pb-0">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <span class="w-6.5 h-6.5 rounded-lg bg-background border border-primary-border flex items-center justify-center text-2xs font-bold text-secondary-text">03</span>
                <span class="text-[11px] font-bold tracking-[0.06em] uppercase text-primary-text">Performance Fee Distribution</span>
              </div>
              <span class="text-[11px] text-secondary-text italic">Split & recipient routing</span>
            </div>

            <div class="space-y-4">
              <!-- Mode selector -->
              <div>
                <label class="block text-xs font-medium text-secondary-text mb-1.5">Distribution Mode</label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    class="flex items-start gap-2.5 p-3.5 rounded-[10px] border border-primary-border bg-background cursor-pointer text-left transition-colors duration-150 ease-in"
                    :class="{ 'co-mode-card--active': form.pf_share_mode === 'broker' }"
                    @click="form.pf_share_mode = 'broker'"
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
                    class="flex items-start gap-2.5 p-3.5 rounded-[10px] border border-primary-border bg-background cursor-pointer text-left transition-colors duration-150 ease-in"
                    :class="{ 'co-mode-card--active': form.pf_share_mode === 'fm' }"
                    @click="form.pf_share_mode = 'fm'"
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

              <!-- FM mode config -->
              <template v-if="form.pf_share_mode === 'fm'">
                <!-- Allocation info -->
                <div class="px-3.5 py-3 rounded-[10px] border border-primary-border bg-background">
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
                    <div>
                  <label class="block text-xs font-medium text-secondary-text mb-1.5">Platform Split of Total PF</label>
                  <div class="relative flex items-center mb-2">
                    <input
                      v-model.number="form.pf_broker_share"
                      type="number"
                      min="0" max="100"
                      placeholder="0"
                      class="w-full px-3 py-2.5 rounded-[10px] bg-background border border-primary-border text-primary-text text-[13px] outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                    <span class="absolute right-2.5 text-[11px] font-medium text-secondary-text pointer-events-none">%</span>
                  </div>
                </div>
                  <div class="flex items-center justify-between mb-1">
                    <div>
                      <label class="block text-xs font-medium text-secondary-text mb-0">Additional Agents</label>
                      <p class="text-2xs text-secondary-text mt-0.5">Add external wallets or accounts to receive scheduled shares.</p>
                    </div>
                    <button type="button" class="text-[11px] font-semibold text-primary-text bg-transparent border-none cursor-pointer py-1" @click="addRecipient">
                      + Add Agent
                    </button>
                  </div>

                  <!-- Empty state -->
                  <div v-if="form.pf_share_recipients.length === 0" class="flex flex-col items-center gap-1 p-5 rounded-[10px] border border-dashed border-primary-border mt-3">
                    <span class="material-symbols-outlined text-secondary-text/40" style="font-size:24px">group</span>
                    <p class="text-[11px] text-secondary-text/60">No agents added yet</p>
                  </div>

                  <!-- Agent rows -->
                  <div v-else class="space-y-2.5 mt-3">
                    <div
                      v-for="(rec, idx) in form.pf_share_recipients"
                      :key="idx"
                      class="p-3.5 rounded-[10px] border border-primary-border bg-background"
                    >
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                          <span class="w-5 h-5 rounded-md bg-card-background border border-primary-border flex items-center justify-center text-2xs font-bold text-secondary-text">{{ idx + 1 }}</span>
                          <span class="text-[11px] font-medium text-primary-text">Agent {{ idx + 1 }}</span>
                        </div>
                        <button
                          type="button"
                          class="text-secondary-text cursor-pointer"
                          @click="form.pf_share_recipients.splice(idx, 1)"
                        >
                          <span class="material-symbols-outlined" style="font-size:16px">delete</span>
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
                            class="w-full px-2.5 py-2 rounded-[10px] bg-background border border-primary-border text-primary-text text-xs outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                          <input
                            v-else
                            v-model="rec.account_number"
                            type="text"
                            placeholder="Number"
                            class="w-full px-2.5 py-2 rounded-[10px] bg-background border border-primary-border text-primary-text text-xs outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder"
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
                              class="w-full px-2.5 py-2 rounded-[10px] bg-background border border-primary-border text-primary-text text-xs outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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

          <!-- ── Section 4: Account Requirements ── -->
          <div class="pb-6 border-b border-primary-border last:border-b-0 last:pb-0">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <span class="w-6.5 h-6.5 rounded-lg bg-background border border-primary-border flex items-center justify-center text-2xs font-bold text-secondary-text">{{ profileStore.user?.fm_info?.allow_fm_pf_share_mode ? '04' : '03' }}</span>
                <span class="text-[11px] font-bold tracking-[0.06em] uppercase text-primary-text">Account Requirements</span>
              </div>
              <span class="text-[11px] text-secondary-text italic">Eligibility threshold</span>
            </div>

            <div>
              <label class="block text-xs font-medium text-secondary-text mb-1.5">Minimum Balance</label>
              <div class="relative flex items-center">
                <span class="absolute left-3 text-[13px] text-secondary-text pointer-events-none">$</span>
                <input
                  v-model.number="form.minimum_balance"
                  type="number"
                  min="0"
                  placeholder="1000"
                  class="w-full px-3 pl-6 py-2.5 rounded-[10px] bg-background border border-primary-border text-primary-text text-[13px] outline-none transition-colors duration-150 ease-in focus:border-primary-blue placeholder:text-placeholder [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
                <span class="absolute right-2.5 text-[11px] font-medium text-secondary-text pointer-events-none">USD</span>
              </div>
              <p class="text-[11px] text-secondary-text leading-relaxed mt-1.5">Followers must maintain at least this balance to join.</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-primary-border flex items-center gap-3 shrink-0 bg-card-background">
          <button
            type="button"
            class="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-secondary-text border border-primary-border cursor-pointer transition-colors"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="loading || !isValid"
            class="px-5 py-2.5 rounded-lg text-xs font-semibold bg-button text-button-text flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            @click="submit"
          >
            <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
            <span>{{
              isEditing
                ? loading ? 'Updating...' : 'Update Offer'
                : loading ? 'Creating...' : 'Create Offer'
            }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useFmOffersStore } from '@/stores/fm/offers'
import { useProfileStore } from '@/stores/shared/profile'
import BaseSelect from '@/components/base/BaseSelect.vue'
import AccountFilterTabs from '@/components/client/accounts/AccountFilterTabs.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  editOffer: { type: Object, default: null },
})

const emit = defineEmits(['close'])
const store = useFmOffersStore()
const profileStore = useProfileStore()

const visibilityTabs = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
]

const intervalOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
]

const destinationTypeOptions = [
  { label: 'Wallet', value: 'wallet' },
  { label: 'Trading Account', value: 'trading_account' },
]

function getDefaultForm() {
  const fmInfo = profileStore.user?.fm_info || {}
  return {
    name: '',
    visibility: 'public',
    summary: '',
    performance_fee: fmInfo.performance_fee ?? null,
    management_fee: null,
    management_fee_interval: 'monthly',
    registration_fee: null,
    minimum_balance: fmInfo.min_capital ?? null,
    // New fields for PF share mode
    pf_share_mode: 'broker', // default broker mode
    pf_broker_share: 0,
    pf_share_recipients: [], // array of { destination_type, wallet_id?, account_number?, share_percentage }
  }
}

const form = ref(getDefaultForm())

const isEditing = computed(() => !!props.editOffer)

const loading = computed(() =>
  isEditing.value ? store.updateLoading : store.createLoading
)

// Helper to add a new empty recipient
const addRecipient = () => {
  form.value.pf_share_recipients.push({ destination_type: 'wallet', wallet_id: null, account_number: '', share_percentage: 0 });
};

// Compute total share percentage of FM pool
const totalRecipientShare = computed(() => {
  return form.value.pf_share_recipients.reduce((sum, r) => sum + (Number(r.share_percentage) || 0), 0);
});

const totalAllocated = computed(() => {
  return (Number(form.value.pf_broker_share) || 0) + totalRecipientShare.value;
});

const isValid = computed(() => {
  const base = form.value.name && form.value.visibility;
  if (!base) return false;
  if (form.value.pf_share_mode === 'fm') {
    const brokerValid = form.value.pf_broker_share >= 0 && form.value.pf_broker_share <= 100;
    const recipientsValid = form.value.pf_share_recipients.every(r => r.share_percentage > 0 && r.share_percentage <= 100);
    return brokerValid && totalAllocated.value <= 100 && recipientsValid;
  }
  return true;
})

watch(
  () => props.open,
  (val) => {
    if (!val) return
    if (props.editOffer) {
      form.value = {
        name: props.editOffer.name || '',
        visibility: props.editOffer.visibility || 'public',
        summary: props.editOffer.summary || '',
        performance_fee: props.editOffer.performance_fee ?? null,
        management_fee: props.editOffer.management_fee ?? null,
        management_fee_interval:
          props.editOffer.management_fee_interval || 'monthly',
        registration_fee: props.editOffer.registration_fee ?? null,
        minimum_balance: props.editOffer.minimum_balance ?? null,
        // PF mode fields
        pf_share_mode: props.editOffer.pf_share_mode || 'broker',
        pf_broker_share: props.editOffer.pf_broker_share ?? 0,
        pf_share_recipients: props.editOffer.pf_share_recipients ? props.editOffer.pf_share_recipients.map(r => ({ ...r })) : [],
      }
    } else {
      form.value = getDefaultForm()
    }
  }
)

const submit = () => {
  const payload = { ...form.value };
  // Remove empty recipient array if in broker mode
  if (payload.pf_share_mode !== 'fm') {
    delete payload.pf_broker_share;
    delete payload.pf_share_recipients;
  }
  if (isEditing.value) {
    store.updateOffer(props.editOffer.id, payload, () => emit('close'))
  } else {
    store.createOffer(payload, () => emit('close'))
  }
}
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
