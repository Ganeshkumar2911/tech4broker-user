<template>
  <div class="bg-card-background rounded-2xl p-6">
    <h4 class="text-primary-text font-bold text-lg mb-5">Change Password</h4>

    <form @submit.prevent="onSubmit" class="max-w-md space-y-4">
      <div>
        <label class="block text-primary-text text-xs font-semibold mb-1.5">Current Password</label>
        <div class="relative">
          <input
            v-model="form.current_password"
            :type="showCurrent ? 'text' : 'password'"
            placeholder="Enter current password"
            class="input-field px-4 py-2.5 pr-10"
          />
          <button type="button" @click="showCurrent = !showCurrent" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text cursor-pointer">
            <Eye v-if="showCurrent" class="w-4 h-4" />
            <EyeOff v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <label class="block text-primary-text text-xs font-semibold mb-1.5">New Password</label>
        <div class="relative">
          <input
            v-model="form.new_password"
            :type="showNew ? 'text' : 'password'"
            placeholder="Enter new password"
            class="input-field px-4 py-2.5 pr-10"
          />
          <button type="button" @click="showNew = !showNew" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text cursor-pointer">
            <Eye v-if="showNew" class="w-4 h-4" />
            <EyeOff v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <label class="block text-primary-text text-xs font-semibold mb-1.5">Confirm Password</label>
        <div class="relative">
          <input
            v-model="form.confirm_password"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="Re-enter new password"
            class="input-field px-4 py-2.5 pr-10"
          />
          <button type="button" @click="showConfirm = !showConfirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text cursor-pointer">
            <Eye v-if="showConfirm" class="w-4 h-4" />
            <EyeOff v-else class="w-4 h-4" />
          </button>
        </div>
        <p v-if="errorMessage" class="text-red-500 text-xs mt-1.5">{{ errorMessage }}</p>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-button text-button-text font-bold text-sm py-3 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Updating...' : 'Update Password' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

defineProps({
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])

const form = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const errorMessage = ref('')

const onSubmit = () => {
  errorMessage.value = ''

  if (!form.value.current_password || !form.value.new_password || !form.value.confirm_password) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }
  if (form.value.new_password.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters.'
    return
  }
  if (form.value.new_password !== form.value.confirm_password) {
    errorMessage.value = 'New password and confirm password do not match.'
    return
  }

  emit('submit', {
    current_password: form.value.current_password,
    new_password: form.value.new_password,
  })
}

const reset = () => {
  form.value = { current_password: '', new_password: '', confirm_password: '' }
  errorMessage.value = ''
}

defineExpose({ reset })
</script>