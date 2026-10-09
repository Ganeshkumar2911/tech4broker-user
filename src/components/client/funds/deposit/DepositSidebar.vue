<script setup>
import { useDepositStore } from "@/stores/client/deposit";
import HelpCard from "@/components/common/HelpCard.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import { CRM_CONFIG } from "@/config/crmConfig";

const props = defineProps({
  currentStep: {
    type: Number,
    default: 1,
  },
});

const depositStore = useDepositStore();

function handleStepClick(targetStep) {
  if (targetStep < props.currentStep) {
    depositStore.currentStep = targetStep;
  }
}

const steps = [
  {
    step: 1,
    icon: "account_balance_wallet",
    title: "Select Account & Method",
    description:
      "Choose your trading account and preferred deposit payment method.",
  },
  {
    step: 2,
    icon: "payments",
    title: "Deposit Details",
    description:
      "Enter the deposit amount or select the crypto token and network.",
  },
  {
    step: 3,
    icon: "verified_user",
    title: "Payment & Confirmation",
    description:
      "Complete the transfer using the generated wallet address or payment gateway.",
  },
];
</script>

<template>
  <div class="w-full xl:max-w-[465px] lg:justify-self-end xl:sticky xl:top-6 self-start">
    <div
      class="min-h-0 xl:min-h-[580px] xl:h-[580px] rounded-2xl sm:rounded-[24px] bg-background p-5 sm:px-6 lg:px-8 sm:py-8 flex flex-col justify-between border-0 shadow-none"
    >
      <!-- Stepper Guide -->
      <div>
        <div
          v-for="(s, i) in steps"
          :key="s.step"
          class="relative flex gap-4"
          :class="[
            i < steps.length - 1 ? 'pb-8' : '',
            s.step < currentStep ? 'cursor-pointer group' : '',
          ]"
          @click="handleStepClick(s.step)"
        >
          <!-- Dotted connector line -->
          <span
            v-if="i < steps.length - 1"
            class="absolute left-5 top-10 bottom-0 w-px border-l border-dashed border-primary-border"
          />

          <!-- Step Icon Circle -->
          <span
            class="relative z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
            :class="[
              currentStep >= s.step
                ? 'bg-primary-text text-card-background'
                : 'bg-primary-border/40 text-secondary-text',
              s.step < currentStep ? 'group-hover:scale-105' : '',
            ]"
          >
            <BaseIcon :name="s.icon" :size="18" />
          </span>

          <!-- Step Content -->
          <div class="pt-1">
            <p
              class="mid-text font-semibold mb-1 transition-colors duration-200"
              :class="
                currentStep >= s.step
                  ? 'text-primary-text'
                  : 'text-secondary-text'
              "
            >
              {{ s.title }}
            </p>
            <p class="sub-text text-secondary-text leading-relaxed">
              {{ s.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Need Help Card -->
      <HelpCard
        class="mt-6"
        title="Need Help?"
        description="Facing any issues with your deposit? Contact our support executive for instant assistance."
        :actions="[
          {
            label: 'Whatsapp',
            icon: '/whatsapp.png',
            type: 'img',
            iconColor: 'text-primary-green',
            href: CRM_CONFIG.whatsappUrl,
          },
          {
            label: 'Email',
            icon: 'email',
            type: 'icon',
            iconColor: 'text-black',
            href: 'mailto:support@panthercapitals.com',
          },
        ]"
      />
    </div>
  </div>
</template>
