<template>
  <div>
    <!-- Backdrop Overlay -->
    <Transition name="backdrop">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] bg-black/45 backdrop-blur-xs cursor-pointer"
        @click="emit('close')"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer">
      <div
        v-if="open"
        class="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-lg bg-card-background border-l border-primary-border flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-primary-border flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-primary-text">
              {{ isEdit ? 'Edit Campaign' : 'Create Referral Campaign' }}
            </h3>
            <p class="text-[11px] text-secondary-text mt-0.5">
              {{ isEdit ? 'Update details and group configurations' : 'Generate tracking affiliate links with custom group configs' }}
            </p>
          </div>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background text-secondary-text hover:text-primary-text transition cursor-pointer"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5 no-scrollbar">
          <!-- Copy Template (only on Create) -->
          <div v-if="!isEdit && parentLinkOptions.length > 0" class="space-y-1.5">
            <label class="block text-xs font-semibold text-primary-text">
              Copy configuration from my links
            </label>
            <BaseSelect
              v-model="selectedParentLinkCode"
              :options="parentLinkOptions"
              placeholder="Select one of your referral links to copy..."
              rounded="xl"
              @update:modelValue="onParentLinkSelect"
            />
            <p class="text-[10px] text-secondary-text">
              Selecting an existing campaign link will pre-fill the name, description, and group configs.
            </p>
          </div>

          <!-- Campaign Name -->
          <div>
            <label class="block text-xs font-semibold text-primary-text mb-1.5">Campaign Name</label>
            <input
              v-model="modalForm.name"
              type="text"
              placeholder="e.g. Standard Trading Campaign"
              class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary transition-colors placeholder:text-secondary-text/50"
            />
          </div>

          <!-- Referral Code -->
          <div>
            <label class="block text-xs font-semibold text-primary-text mb-1.5">Referral Code</label>
            <div class="flex items-center gap-2">
              <input
                v-model="modalForm.code"
                type="text"
                readonly
                class="flex-1 px-3.5 py-2.5 rounded-xl bg-background/50 border border-primary-border text-primary-text text-sm outline-none font-mono uppercase"
              />
              <button
                v-if="!isEdit"
                type="button"
                class="p-2.5 rounded-xl border border-primary-border bg-background hover:bg-primary-border/20 text-secondary-text hover:text-primary-text transition cursor-pointer flex items-center justify-center shrink-0"
                title="Regenerate random code"
                @click="regenerateCode"
              >
                <RefreshCw :size="16" />
              </button>
            </div>
            <p v-if="!isEdit" class="text-[10px] text-secondary-text mt-1">Unique affiliate code. Auto-generated and regeneratable.</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold text-primary-text mb-1.5">Description</label>
            <textarea
              v-model="modalForm.description"
              placeholder="Explain the focus or purpose of this campaign link..."
              rows="3"
              class="w-full px-3.5 py-2.5 rounded-xl bg-background border border-primary-border text-primary-text text-sm outline-none focus:border-primary transition-colors placeholder:text-secondary-text/50"
            />
          </div>

          <!-- Available Group Configurations -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-primary-text uppercase tracking-wider">Group Configurations</h4>
            
            <div v-if="parentAvailableGroups.length === 0" class="text-xs text-secondary-text italic py-4 text-center rounded-2xl bg-background">
              No parent configurations available. Setting up your own referral campaigns first is recommended.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(groups, categoryName) in parentAvailableGroupsByCategory"
                :key="categoryName"
                class="rounded-2xl p-4 bg-background space-y-2.5"
              >
                <h5 class="text-[10px] font-bold text-secondary-text uppercase tracking-wider">{{ categoryName }}</h5>
                <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                  <label
                    v-for="grp in groups"
                    :key="grp.id"
                    class="flex items-start gap-2.5 p-2.5 rounded-xl bg-card-background hover:bg-card-background/80 border border-primary-border/40 cursor-pointer select-none transition"
                  >
                    <input
                      type="checkbox"
                      :value="grp.id"
                      v-model="modalForm.broker_group_config_ids"
                      class="mt-0.5 rounded accent-primary cursor-pointer w-4 h-4"
                    />
                    <div class="text-[11px] leading-normal flex-1">
                      <p class="font-bold text-primary-text">{{ grp.badge || grp.label }}</p>
                      <p class="text-[9px] text-secondary-text mt-0.5">
                        Platform: {{ grp.platform }} · Currency: {{ grp.currency }}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-primary-border flex items-center justify-end gap-3 bg-card-background">
          <button
            class="px-5 py-2.5 rounded-full text-xs font-semibold text-secondary-text bg-background hover:text-primary-text transition-colors cursor-pointer"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            :disabled="store.actionLoading || !isValid"
            class="px-5 py-2.5 rounded-full text-xs font-semibold bg-button text-button-text hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            @click="submit"
          >
            <Loader2 v-if="store.actionLoading" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ store.actionLoading ? 'Saving...' : 'Save Campaign' }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X, Loader2, RefreshCw } from 'lucide-vue-next'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { useIbReferralLinksStore } from '@/stores/ib/referralLinks'

const props = defineProps({
  open: { type: Boolean, default: false },
  isEdit: { type: Boolean, default: false },
  editData: { type: Object, default: null },
  ibId: { type: [String, Number], required: true }
})

const emit = defineEmits(['close', 'success'])

const store = useIbReferralLinksStore()

const selectedParentLinkCode = ref('')
const modalForm = ref({
  name: '',
  code: '',
  description: '',
  broker_group_config_ids: []
})

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const regenerateCode = () => {
  modalForm.value.code = generateRandomCode()
}

const parentLinkOptions = computed(() => {
  return store.parentRecords.map(l => ({
    label: `${l.name || l.code} (${l.code})`,
    value: l.code
  }))
})

const parentAvailableGroups = computed(() => {
  const groupsMap = {}
  store.parentRecords.forEach(c => {
    if (c.groups) {
      c.groups.forEach(g => {
        groupsMap[g.id] = {
          id: g.id,
          label: g.badge || g.label,
          platform: g.platform || 'MT5',
          account_category: g.account_category || g.category || 'STANDARD',
          account_type: g.account_type || 'live',
          currency: g.currency,
          badge: g.badge || g.label
        }
      })
    }
  })
  return Object.values(groupsMap)
})

const parentAvailableGroupsByCategory = computed(() => {
  const groups = parentAvailableGroups.value
  const grouped = {}
  groups.forEach(g => {
    const key = `${g.account_category} (${(g.account_type || '').toUpperCase()})`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(g)
  })
  return grouped
})

const onParentLinkSelect = (code) => {
  const link = store.parentRecords.find(l => l.code === code)
  if (!link) return

  modalForm.value.name = link.name || ''
  modalForm.value.description = link.description || ''
  modalForm.value.code = generateRandomCode()
  modalForm.value.broker_group_config_ids = link.groups?.map(g => g.id) || []
}

const initializeBlocks = () => {
  if (!props.open) return

  if (props.isEdit && props.editData) {
    modalForm.value = {
      name: props.editData.name || '',
      code: props.editData.code || '',
      description: props.editData.description || '',
      broker_group_config_ids: props.editData.groups?.map(g => g.id) || []
    }
  } else {
    selectedParentLinkCode.value = ''
    modalForm.value = {
      name: '',
      code: generateRandomCode(),
      description: '',
      broker_group_config_ids: []
    }
  }
}

watch(() => props.open, (val) => {
  if (val) {
    store.fetchParentReferralLinks()
    initializeBlocks()
  }
})

const isValid = computed(() => {
  if (!modalForm.value.name) return false
  if (!props.isEdit && !modalForm.value.code) return false
  return true
})

const submit = () => {
  if (!isValid.value) return

  const payload = {
    name: modalForm.value.name,
    code: modalForm.value.code,
    description: modalForm.value.description,
    broker_group_config_ids: [...new Set(modalForm.value.broker_group_config_ids)]
  }

  const successCb = () => {
    emit('success')
    emit('close')
  }

  if (props.isEdit && props.editData) {
    store.updateReferralLink(props.ibId, props.editData.id, payload, successCb)
  } else {
    store.createReferralLink(props.ibId, payload, successCb)
  }
}
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease-out;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
