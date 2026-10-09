<template>
  <div id="bank-accounts-card" class="bg-card-background rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-7">
    <!-- ── Header ── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h4 class="text-primary-text font-bold text-base sm:text-lg tracking-tight">Saved Bank Accounts</h4>
          <BaseBadge
            :label="`${bankAccountsStore.accountCount} / ${bankAccountsStore.maxLimit} Accounts`"
            variant="neutral"
            size="xs"
          />
        </div>
        <p class="text-secondary-text text-xs mt-1 leading-relaxed max-w-xl">
          Manage your saved bank accounts for withdrawals and bank transfers (maximum {{ bankAccountsStore.maxLimit }} accounts).
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          v-if="showBankAccountForm"
          type="button"
          @click="closeBankAccountForm"
          class="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-background text-primary-text font-semibold text-xs px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full transition-all duration-200 cursor-pointer hover:bg-card-background"
        >
          <ArrowLeft class="w-3.5 h-3.5 shrink-0" />
          <span>Back to List</span>
        </button>

        <template v-else>
          <Tooltip
            v-if="bankAccountsStore.isLimitReached"
            :text="`Maximum limit of ${bankAccountsStore.maxLimit} bank accounts reached.`"
            position="bottom"
            class="w-full sm:w-auto"
          >
            <button
              type="button"
              disabled
              class="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-background text-secondary-text font-semibold text-xs px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full opacity-60 cursor-not-allowed border border-primary-border/40"
            >
              <Plus class="w-3.5 h-3.5 shrink-0" />
              <span>Add Account</span>
            </button>
          </Tooltip>

          <button
            v-else
            type="button"
            @click="openAddBankAccount"
            class="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-background hover:bg-primary/10 text-primary-text hover:text-primary font-semibold text-xs px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full transition-all duration-200 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 shrink-0" />
            <span class="whitespace-nowrap">Add Account</span>
          </button>
        </template>
      </div>
    </div>

    <!-- ── Notice Banner ── -->
    <div
      v-if="!showBankAccountForm"
      class="flex items-start sm:items-center gap-2.5 bg-background rounded-xl sm:rounded-2xl p-3 sm:px-4 sm:py-3 text-xs text-secondary-text mb-4 sm:mb-6 leading-relaxed"
    >
      <ShieldAlert class="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
      <span>
        Editing saved accounts is locked by default. Contact our
        <span class="font-bold text-primary-text">Support Service</span> to request edits or updates.
      </span>
    </div>

    <!-- ── Add / Edit Form View ── -->
    <div v-if="showBankAccountForm" class="space-y-4 sm:space-y-5">
      <div class="pb-3 border-b border-primary-border flex items-center justify-between gap-3">
        <div>
          <h5 class="text-primary-text font-bold text-base sm:text-lg">
            {{ bankAccountFormMode === 'create' ? 'Add Bank Account' : 'Edit Bank Account' }}
          </h5>
          <p class="text-secondary-text text-xs mt-0.5">
            {{
              bankAccountFormMode === 'create'
                ? 'Enter your banking details. Name must match your KYC verification.'
                : `Updating details for account #${editingBankAccountId}`
            }}
          </p>
        </div>
      </div>

      <!-- Top Error Banner -->
      <div
        v-if="bankAccountFormError"
        class="p-3 sm:p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs leading-relaxed"
      >
        {{ bankAccountFormError }}
      </div>

      <!-- Form Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <!-- Nickname / Label -->
        <div class="sm:col-span-2">
          <label class="block text-primary-text text-xs font-semibold mb-1 sm:mb-1.5">
            Account Nickname / Label <span class="text-secondary-text font-normal">(Optional)</span>
          </label>
          <input
            v-model="bankAccountForm.label"
            type="text"
            placeholder="e.g. Primary HDFC"
            class="input-field px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
            :class="bankAccountFieldErrors.label ? 'border-primary-red!' : ''"
          />
          <p v-if="bankAccountFieldErrors.label" class="text-primary-red text-xs mt-1">
            {{ bankAccountFieldErrors.label }}
          </p>
        </div>

        <!-- Account Holder Name -->
        <div>
          <div class="flex items-center justify-between mb-1 sm:mb-1.5">
            <label class="block text-primary-text text-xs font-semibold">
              Account Holder Name <span class="text-primary-red">*</span>
            </label>
            <span v-if="profileUserName" class="text-[11px] text-secondary-text">
              Must match: <strong class="text-primary-text">{{ profileUserName }}</strong>
            </span>
          </div>
          <input
            v-model="bankAccountForm.account_name"
            type="text"
            :placeholder="profileUserName || 'Enter account holder name'"
            class="input-field px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
            :class="bankAccountFieldErrors.account_name ? 'border-primary-red!' : ''"
            @input="onAccountNameInput"
          />
          <p v-if="bankAccountFieldErrors.account_name" class="text-primary-red text-xs mt-1">
            {{ bankAccountFieldErrors.account_name }}
          </p>
        </div>

        <!-- Account Number -->
        <div>
          <label class="block text-primary-text text-xs font-semibold mb-1 sm:mb-1.5">
            Account Number <span class="text-primary-red">*</span>
          </label>
          <input
            v-model="bankAccountForm.account_number"
            type="text"
            placeholder="Enter full bank account number"
            class="input-field px-3.5 py-2 sm:px-4 sm:py-2.5 font-mono text-xs sm:text-sm"
            :class="bankAccountFieldErrors.account_number ? 'border-primary-red!' : ''"
            @input="delete bankAccountFieldErrors.account_number"
          />
          <p v-if="bankAccountFieldErrors.account_number" class="text-primary-red text-xs mt-1">
            {{ bankAccountFieldErrors.account_number }}
          </p>
        </div>

        <!-- Account Type -->
        <div>
          <label class="block text-primary-text text-xs font-semibold mb-1 sm:mb-1.5">
            Account Type <span class="text-primary-red">*</span>
          </label>
          <BaseSelect
            v-model="bankAccountForm.account_type"
            :options="accountTypeOptions"
            placeholder="Select account type"
            height="42px"
            rounded="xl"
            @update:modelValue="delete bankAccountFieldErrors.account_type"
          />
          <p v-if="bankAccountFieldErrors.account_type" class="text-primary-red text-xs mt-1">
            {{ bankAccountFieldErrors.account_type }}
          </p>
        </div>

        <!-- Bank Name -->
        <div>
          <label class="block text-primary-text text-xs font-semibold mb-1 sm:mb-1.5">
            Bank Name <span class="text-primary-red">*</span>
          </label>
          <input
            v-model="bankAccountForm.bank"
            type="text"
            placeholder="e.g. HDFC Bank"
            class="input-field px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
            :class="bankAccountFieldErrors.bank ? 'border-primary-red!' : ''"
            @input="delete bankAccountFieldErrors.bank"
          />
          <p v-if="bankAccountFieldErrors.bank" class="text-primary-red text-xs mt-1">
            {{ bankAccountFieldErrors.bank }}
          </p>
        </div>

        <!-- IFSC / Branch Code -->
        <div class="sm:col-span-2">
          <label class="block text-primary-text text-xs font-semibold mb-1 sm:mb-1.5">
            IFSC / Branch Code <span class="text-primary-red">*</span>
          </label>
          <input
            v-model="bankAccountForm.bank_branch_code"
            type="text"
            placeholder="e.g. HDFC0001234"
            class="input-field px-3.5 py-2 sm:px-4 sm:py-2.5 font-mono uppercase text-xs sm:text-sm"
            :class="bankAccountFieldErrors.bank_branch_code ? 'border-primary-red!' : ''"
            @input="bankAccountForm.bank_branch_code = bankAccountForm.bank_branch_code?.toUpperCase(); delete bankAccountFieldErrors.bank_branch_code"
          />
          <p v-if="bankAccountFieldErrors.bank_branch_code" class="text-primary-red text-xs mt-1">
            {{ bankAccountFieldErrors.bank_branch_code }}
          </p>
        </div>

        <!-- Branch Name & Bank Code -->
        <div>
          <label class="block text-primary-text text-xs font-semibold mb-1 sm:mb-1.5">
            Branch Name <span class="text-secondary-text font-normal">(Optional)</span>
          </label>
          <input
            v-model="bankAccountForm.bank_branch"
            type="text"
            placeholder="e.g. Mumbai Main"
            class="input-field px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
          />
        </div>

        <div>
          <label class="block text-primary-text text-xs font-semibold mb-1 sm:mb-1.5">
            Bank Code <span class="text-secondary-text font-normal">(Optional)</span>
          </label>
          <input
            v-model="bankAccountForm.bank_code"
            type="text"
            placeholder="e.g. HDFC"
            class="input-field px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
          />
        </div>

        <!-- Document Proof Upload -->
        <div class="sm:col-span-2">
          <label class="block text-primary-text text-xs font-semibold mb-1.5">
            Document Proof (Cancelled Cheque / Bank Statement) <span class="text-primary-red">*</span>
          </label>
          <input
            ref="documentProofFileInput"
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx"
            class="hidden"
            @change="handleDocumentProofUpload"
          />

          <div
            @click="triggerDocumentProofUpload"
            class="input-field p-3 sm:p-3.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 group hover:border-primary/60 transition-colors"
            :class="bankAccountFieldErrors.document_proof ? 'border-primary-red!' : ''"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-9 h-9 rounded-xl bg-card-background border border-primary-border/40 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform"
              >
                <FileText class="w-4 h-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p v-if="selectedDocumentProofFile" class="text-xs font-semibold text-primary-text truncate">
                  {{ selectedDocumentProofFile.name }}
                  <span class="text-2xs text-secondary-text font-normal ml-1">
                    ({{ (selectedDocumentProofFile.size / 1024).toFixed(1) }} KB)
                  </span>
                </p>
                <div
                  v-else-if="existingDocumentProofUrl && bankAccountFormMode === 'edit'"
                  class="flex items-center gap-2 flex-wrap"
                >
                  <a
                    :href="existingDocumentProofUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.stop
                    class="text-xs font-semibold text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    <Paperclip class="w-3 h-3" />
                    <span>View Uploaded Proof</span>
                    <ExternalLink class="w-2.5 h-2.5" />
                  </a>
                  <span class="text-2xs text-secondary-text">(Click to replace)</span>
                </div>
                <p v-else class="text-xs text-secondary-text">
                  Upload PNG, JPG, WEBP, PDF, DOC (max 10MB)
                </p>
              </div>
            </div>

            <div class="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
              <button
                v-if="selectedDocumentProofFile"
                type="button"
                @click.stop="removeDocumentProof"
                class="p-1 rounded-full text-secondary-text hover:text-red-500 transition cursor-pointer"
                title="Remove file"
              >
                <X class="w-4 h-4" />
              </button>
              <span
                class="bg-card-background border border-primary-border/50 text-primary-text text-xs font-semibold px-3 py-1.5 rounded-full group-hover:border-primary/50 transition"
              >
                {{ selectedDocumentProofFile || existingDocumentProofUrl ? 'Change' : 'Browse' }}
              </span>
            </div>
          </div>
          <p v-if="bankAccountFieldErrors.document_proof" class="text-primary-red text-xs mt-1">
            {{ bankAccountFieldErrors.document_proof }}
          </p>
        </div>

        <!-- Default Checkbox -->
        <div class="sm:col-span-2 flex items-center gap-2.5 pt-1">
          <input
            id="bank-is-default-checkbox"
            v-model="bankAccountForm.is_default"
            type="checkbox"
            class="w-4 h-4 accent-primary rounded cursor-pointer shrink-0"
          />
          <label
            for="bank-is-default-checkbox"
            class="text-xs text-primary-text font-medium cursor-pointer select-none leading-snug"
          >
            Set as default bank account for deposits and withdrawals
          </label>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-primary-border">
        <button
          type="button"
          @click="closeBankAccountForm"
          class="flex-1 sm:flex-none text-secondary-text hover:text-primary-text font-semibold text-xs px-4 sm:px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer hover:bg-background border border-primary-border/40 text-center"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="submitBankAccountForm"
          :disabled="bankAccountFormLoading"
          class="flex-1 sm:flex-none bg-button text-button-text font-bold text-xs px-5 sm:px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Loader2 v-if="bankAccountFormLoading" class="w-3.5 h-3.5 animate-spin" />
          <span>{{
            bankAccountFormLoading
              ? 'Saving...'
              : bankAccountFormMode === 'create'
                ? 'Save Account'
                : 'Update Account'
          }}</span>
        </button>
      </div>
    </div>

    <!-- ── Accounts List View ── -->
    <template v-else>
      <!-- Loading State -->
      <div
        v-if="bankAccountsStore.loading"
        class="flex flex-col items-center justify-center py-12 gap-3"
      >
        <Loader2 class="w-7 h-7 text-primary animate-spin" />
        <p class="text-xs text-secondary-text font-medium">Loading saved bank accounts…</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!bankAccountsStore.bankAccounts || bankAccountsStore.bankAccounts.length === 0"
        class="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-background border border-primary-border/40 text-center"
      >
        <div
          class="w-12 h-12 rounded-full bg-card-background border border-primary-border/40 flex items-center justify-center text-secondary-text mb-3"
        >
          <Landmark class="w-5 h-5" />
        </div>
        <p class="text-primary-text font-semibold text-sm">No Bank Accounts Added</p>
        <p class="text-secondary-text text-xs mt-1 max-w-sm">
          Add your first bank account to enable bank transfer deposits and fiat withdrawals.
        </p>
        <button
          type="button"
          @click="openAddBankAccount"
          class="mt-4 flex items-center gap-1.5 bg-card-background hover:bg-primary/10 text-primary-text hover:text-primary font-semibold text-xs px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add First Account</span>
        </button>
      </div>

      <!-- Accounts Cards Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div
          v-for="acc in bankAccountsStore.bankAccounts"
          :key="acc.id"
          class="bg-background rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between transition-all duration-200"
        >
          <!-- Top Row -->
          <div>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <!-- Approval Status Badge -->
                <BaseBadge
                  v-if="acc.approval_status"
                  :status="acc.approval_status"
                  size="xs"
                />

                <!-- Lock/Unlock Status Badge -->
                <BaseBadge
                  :label="acc.flag_enable_edit ? 'Unlocked' : 'Locked'"
                  :variant="acc.flag_enable_edit ? 'success' : 'neutral'"
                  size="xs"
                >
                  <template #prefix>
                    <LockOpen v-if="acc.flag_enable_edit" class="w-2.5 h-2.5 shrink-0" />
                    <Lock v-else class="w-2.5 h-2.5 shrink-0 opacity-70" />
                  </template>
                </BaseBadge>

                <!-- Default Badge -->
                <BaseBadge
                  v-if="acc.is_default"
                  label="Default"
                  variant="primary"
                  size="xs"
                >
                  <template #prefix>
                    <Star class="w-2.5 h-2.5 fill-current shrink-0" />
                  </template>
                </BaseBadge>
              </div>

              <!-- Account Type Badge -->
              <BaseBadge
                :label="acc.account_type || 'BANK'"
                :variant="getAccountTypeVariant(acc.account_type)"
                size="xs"
              >
                <template #prefix>
                  <Landmark class="w-3 h-3 shrink-0" />
                </template>
              </BaseBadge>
            </div>

            <!-- Title & Bank -->
            <div class="mt-2.5 sm:mt-3">
              <h5 class="text-sm sm:text-base font-bold text-primary-text wrap-break-word leading-snug">
                {{ acc.label || acc.bank }}
              </h5>
              <p class="text-[11px] sm:text-xs text-secondary-text wrap-break-word mt-0.5">
                {{ acc.bank }}
              </p>
            </div>

            <!-- Rejection Reason Banner if Rejected -->
            <div
              v-if="String(acc.approval_status || '').toLowerCase() === 'rejected' && acc.rejection_reason"
              class="mt-2.5 p-2.5 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 leading-relaxed flex items-start gap-2"
            >
              <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div class="min-w-0 flex-1">
                <p class="font-bold text-[11px] sm:text-xs">Rejection Reason:</p>
                <p class="text-[11px] sm:text-xs text-red-500/90 mt-0.5 wrap-break-word">
                  {{ acc.rejection_reason }}
                </p>
              </div>
            </div>

            <div class="border-b border-dotted border-primary-border/80 my-2.5 sm:my-3"></div>

            <!-- Key-Value Details -->
            <div class="space-y-2 sm:space-y-2.5 my-2.5 sm:my-3 text-xs sm:text-[13px]">
              <div class="flex items-start justify-between gap-2">
                <span class="text-secondary-text shrink-0 text-[11px] sm:text-xs">Account Holder</span>
                <span class="font-bold text-primary-text text-right wrap-break-word min-w-0 text-[11px] sm:text-xs">
                  {{ acc.account_name || '-' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-secondary-text shrink-0 text-[11px] sm:text-xs">Account Number</span>
                <span class="font-mono font-bold text-primary-text text-right break-all text-[11px] sm:text-xs">
                  {{ acc.account_number || '-' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-secondary-text shrink-0 text-[11px] sm:text-xs">IFSC / Branch Code</span>
                <span class="font-mono font-semibold text-primary-text uppercase text-right break-all text-[11px] sm:text-xs">
                  {{ acc.bank_branch_code || '-' }}
                </span>
              </div>
              <div v-if="acc.bank_branch" class="flex items-start justify-between gap-2">
                <span class="text-secondary-text shrink-0 text-[11px] sm:text-xs">Branch Name</span>
                <span class="font-medium text-primary-text text-right wrap-break-word min-w-0 text-[11px] sm:text-xs">
                  {{ acc.bank_branch }}
                </span>
              </div>
              <div v-if="acc.bank_code" class="flex items-center justify-between gap-2">
                <span class="text-secondary-text shrink-0 text-[11px] sm:text-xs">Bank Code</span>
                <span class="font-medium text-primary-text text-right break-all text-[11px] sm:text-xs">
                  {{ acc.bank_code }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card Footer & Actions -->
          <div>
            <div class="border-b border-dotted border-primary-border/80 my-2.5 sm:my-3"></div>
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <!-- Proof link -->
              <div class="shrink-0">
                <a
                  v-if="acc.document_proof_url || acc.document_proof"
                  :href="acc.document_proof_url || acc.document_proof"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-primary hover:underline"
                  title="View document proof"
                >
                  <Paperclip class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>Proof</span>
                  <ExternalLink class="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                </a>
                <span v-else class="text-[11px] sm:text-xs text-secondary-text/50">No proof</span>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
                <!-- Set Default -->
                <Tooltip
                  v-if="!acc.is_default"
                  :text="
                    acc.flag_enable_edit
                      ? 'Set as default bank account'
                      : 'Contact support to set as default'
                  "
                  position="top"
                >
                  <button
                    type="button"
                    @click="handleSetDefaultBankAccount(acc)"
                    :disabled="!acc.flag_enable_edit || settingDefaultId === acc.id"
                    class="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-card-background border border-primary-border/50 transition-all duration-200"
                    :class="
                      acc.flag_enable_edit
                        ? 'text-primary-text hover:border-primary cursor-pointer'
                        : 'text-secondary-text/40 opacity-50 cursor-not-allowed pointer-events-none'
                    "
                  >
                    <Loader2 v-if="settingDefaultId === acc.id" class="w-3 h-3 animate-spin" />
                    <Star v-else class="w-3 h-3" />
                    <span>Default</span>
                  </button>
                </Tooltip>

                <!-- Edit -->
                <Tooltip
                  :text="
                    acc.flag_enable_edit
                      ? 'Edit bank account'
                      : 'Contact support to edit this account'
                  "
                  position="top"
                >
                  <button
                    type="button"
                    @click="openEditBankAccount(acc)"
                    :disabled="!acc.flag_enable_edit"
                    class="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-card-background border border-primary-border/50 transition-all duration-200"
                    :class="
                      acc.flag_enable_edit
                        ? 'text-primary-text hover:border-primary cursor-pointer'
                        : 'text-secondary-text/40 opacity-50 cursor-not-allowed pointer-events-none'
                    "
                  >
                    <Pencil class="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </Tooltip>

                <!-- Delete -->
                <Tooltip
                  :text="
                    acc.flag_enable_edit
                      ? 'Delete bank account'
                      : 'Contact support to delete this account'
                  "
                  position="top"
                >
                  <button
                    type="button"
                    @click="requestDeleteBankAccount(acc)"
                    :disabled="!acc.flag_enable_edit"
                    class="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-card-background border border-primary-border/50 transition-all duration-200"
                    :class="
                      acc.flag_enable_edit
                        ? 'text-red-500 hover:border-red-500/50 hover:bg-red-500/10 cursor-pointer'
                        : 'text-secondary-text/40 opacity-50 cursor-not-allowed pointer-events-none'
                    "
                  >
                    <Trash2 class="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Delete Confirmation Dialog ── -->
    <Teleport to="body">
      <div
        v-if="deleteConfirmOpen"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        @click.self="cancelDeleteBankAccount"
      >
        <div
          class="bg-card-background border border-primary-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
          @click.stop
        >
          <div class="flex items-center gap-3.5">
            <div
              class="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0"
            >
              <Trash2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-primary-text font-bold text-base">Delete Bank Account</h3>
              <p class="text-secondary-text text-xs">This action cannot be undone.</p>
            </div>
          </div>

          <div
            v-if="bankAccountToDelete"
            class="bg-background border border-primary-border/40 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-1.5"
          >
            <div class="flex items-center justify-between text-xs font-semibold text-primary-text gap-2">
              <span class="truncate">{{ bankAccountToDelete.bank }}</span>
              <BaseBadge
                :label="bankAccountToDelete.account_type"
                :variant="getAccountTypeVariant(bankAccountToDelete.account_type)"
                size="xs"
              />
            </div>
            <p class="text-xs text-secondary-text font-mono break-all">
              Account: {{ bankAccountToDelete.account_number }}
            </p>
            <p class="text-xs text-secondary-text wrap-break-word">
              Holder: {{ bankAccountToDelete.account_name }}
            </p>
          </div>

          <p class="text-xs text-secondary-text leading-relaxed">
            Are you sure you want to delete
            <strong class="text-primary-text font-semibold">
              "{{ bankAccountToDelete?.label || bankAccountToDelete?.bank }}"
            </strong>?
          </p>

          <div class="flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              @click="cancelDeleteBankAccount"
              :disabled="deleteLoading"
              class="flex-1 sm:flex-none justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-primary-text text-xs font-semibold hover:bg-background border border-primary-border/40 transition disabled:opacity-50 cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="confirmDeleteBankAccount"
              :disabled="deleteLoading"
              class="flex-1 sm:flex-none justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer text-center"
            >
              <Loader2 v-if="deleteLoading" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ deleteLoading ? 'Deleting...' : 'Delete Account' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Landmark,
  ShieldAlert,
  Plus,
  Loader2,
  Pencil,
  Star,
  Trash2,
  FileText,
  Paperclip,
  ExternalLink,
  X,
  ArrowLeft,
  AlertTriangle,
  Lock,
  LockOpen,
} from 'lucide-vue-next'
import {
  useBankAccountsStore,
  MAX_PROOF_FILE_SIZE,
  ALLOWED_PROOF_EXTENSIONS,
} from '@/stores/shared/bankAccounts'
import { useSnackbarStore } from '@/stores/shared/snackbar'
import { useProfileStore } from '@/stores/shared/profile'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import Tooltip from '@/components/base/Tooltip.vue'

const bankAccountsStore = useBankAccountsStore()
const profileStore = useProfileStore()
const snackbar = useSnackbarStore()
const route = useRoute()

const profileUserName = computed(() => {
  const u = profileStore.user?.data || profileStore.user
  if (u?.name && typeof u.name === 'string') return u.name.trim()
  const parts = [u?.first_name, u?.last_name].filter(Boolean)
  if (parts.length > 0) return parts.join(' ').trim()
  return ''
})

function getAccountTypeVariant(type) {
  const t = String(type || '').toUpperCase()
  if (t === 'SAVINGS') return 'purple'
  if (t === 'CURRENT') return 'info'
  if (t === 'CHECKING') return 'primary'
  return 'purple'
}

function onAccountNameInput() {
  const val = bankAccountForm.value.account_name
  if (!val || !val.trim()) {
    delete bankAccountFieldErrors.value.account_name
    return
  }
  if (profileUserName.value) {
    const inputName = val.trim().toLowerCase()
    const requiredName = profileUserName.value.trim().toLowerCase()
    if (inputName !== requiredName) {
      bankAccountFieldErrors.value.account_name = `Account holder name must match your profile name ("${profileUserName.value}")`
    } else {
      delete bankAccountFieldErrors.value.account_name
    }
  } else {
    delete bankAccountFieldErrors.value.account_name
  }
}

// ─── Form State ──────────────────────────────────────
const showBankAccountForm = ref(false)
const bankAccountFormMode = ref('create') // 'create' | 'edit'
const editingBankAccountId = ref(null)
const bankAccountFormLoading = ref(false)
const bankAccountFormError = ref(null)
const bankAccountFieldErrors = ref({})

const bankAccountForm = ref({
  label: '',
  account_name: '',
  account_number: '',
  account_type: 'SAVINGS',
  bank: '',
  bank_branch_code: '',
  bank_branch: '',
  bank_code: '',
  is_default: false,
})

const accountTypeOptions = [
  { label: 'Savings Account', value: 'SAVINGS' },
  { label: 'Checking Account', value: 'CHECKING' },
  { label: 'Current Account', value: 'CURRENT' },
]

// ─── Document Proof Upload ───────────────────────────
const documentProofFileInput = ref(null)
const selectedDocumentProofFile = ref(null)
const existingDocumentProofUrl = ref('')
const existingDocumentProofPath = ref('')

function triggerDocumentProofUpload() {
  documentProofFileInput.value?.click()
}

function handleDocumentProofUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_PROOF_EXTENSIONS.includes(ext)) {
    bankAccountFieldErrors.value = {
      ...bankAccountFieldErrors.value,
      document_proof: `Invalid file type. Allowed: ${ALLOWED_PROOF_EXTENSIONS.join(', ')}`,
    }
    return
  }

  if (file.size > MAX_PROOF_FILE_SIZE) {
    bankAccountFieldErrors.value = {
      ...bankAccountFieldErrors.value,
      document_proof: 'File size exceeds 10MB limit.',
    }
    return
  }

  selectedDocumentProofFile.value = file
  if (bankAccountFieldErrors.value.document_proof) {
    delete bankAccountFieldErrors.value.document_proof
  }
}

function removeDocumentProof() {
  selectedDocumentProofFile.value = null
  if (documentProofFileInput.value) {
    documentProofFileInput.value.value = ''
  }
}

// ─── Form Open / Close ───────────────────────────────
function openAddBankAccount() {
  if (bankAccountsStore.isLimitReached) {
    snackbar.show(
      `Maximum limit of ${bankAccountsStore.maxLimit} bank accounts reached.`,
      'error'
    )
    return
  }
  bankAccountFormMode.value = 'create'
  editingBankAccountId.value = null
  bankAccountFormError.value = null
  bankAccountFieldErrors.value = {}
  selectedDocumentProofFile.value = null
  existingDocumentProofUrl.value = ''
  existingDocumentProofPath.value = ''
  if (documentProofFileInput.value) documentProofFileInput.value.value = ''

  bankAccountForm.value = {
    label: '',
    account_name: profileUserName.value || '',
    account_number: '',
    account_type: 'SAVINGS',
    bank: '',
    bank_branch_code: '',
    bank_branch: '',
    bank_code: '',
    is_default: (bankAccountsStore.bankAccounts?.length || 0) === 0,
  }
  showBankAccountForm.value = true
}

async function openEditBankAccount(account) {
  if (!account.flag_enable_edit) {
    snackbar.show('Contact support to update this bank account.', 'error')
    return
  }
  bankAccountFormError.value = null
  bankAccountFieldErrors.value = {}
  bankAccountFormLoading.value = true
  selectedDocumentProofFile.value = null
  if (documentProofFileInput.value) documentProofFileInput.value.value = ''

  try {
    const detail = await bankAccountsStore.getBankAccountDetail(account.id)
    const data = detail || account
    editingBankAccountId.value = account.id
    bankAccountFormMode.value = 'edit'
    existingDocumentProofPath.value = data.document_proof || ''
    existingDocumentProofUrl.value =
      data.document_proof_url || data.document_proof || ''
    bankAccountForm.value = {
      label: data.label || '',
      account_name: data.account_name || '',
      account_number: data.account_number || '',
      account_type: data.account_type || 'SAVINGS',
      bank: data.bank || '',
      bank_branch_code: data.bank_branch_code || '',
      bank_branch: data.bank_branch || '',
      bank_code: data.bank_code || '',
      is_default: Boolean(data.is_default),
    }
    showBankAccountForm.value = true
  } catch (err) {
    console.error('Failed to fetch bank account details', err)
  } finally {
    bankAccountFormLoading.value = false
  }
}

function closeBankAccountForm() {
  showBankAccountForm.value = false
  editingBankAccountId.value = null
  bankAccountFormError.value = null
  bankAccountFieldErrors.value = {}
  selectedDocumentProofFile.value = null
  existingDocumentProofPath.value = ''
  existingDocumentProofUrl.value = ''
}

// ─── Validation ──────────────────────────────────────
function validateBankAccountForm() {
  const errors = {}
  const {
    account_name,
    account_number,
    account_type,
    bank,
    bank_branch_code,
  } = bankAccountForm.value

  if (!account_name?.trim()) {
    errors.account_name = 'Account holder name is required'
  } else if (profileUserName.value) {
    const inputName = account_name.trim().toLowerCase()
    const requiredName = profileUserName.value.trim().toLowerCase()
    if (inputName !== requiredName) {
      errors.account_name = `Account holder name must match your profile name ("${profileUserName.value}")`
    }
  }

  if (!account_number?.trim()) errors.account_number = 'Account number is required'
  if (!account_type) errors.account_type = 'Account type is required'
  if (!bank?.trim()) errors.bank = 'Bank name is required'
  if (!bank_branch_code?.trim()) errors.bank_branch_code = 'IFSC / Branch code is required'

  if (bankAccountFormMode.value === 'create' && !selectedDocumentProofFile.value) {
    errors.document_proof =
      'Document proof file (cancelled cheque / bank statement) is required'
  } else if (
    bankAccountFormMode.value === 'edit' &&
    !selectedDocumentProofFile.value &&
    !existingDocumentProofUrl.value &&
    !existingDocumentProofPath.value
  ) {
    errors.document_proof = 'Document proof file is required'
  }

  bankAccountFieldErrors.value = errors
  return Object.keys(errors).length === 0
}

// ─── Submit Form ─────────────────────────────────────
async function submitBankAccountForm() {
  if (!validateBankAccountForm()) return
  bankAccountFormLoading.value = true
  bankAccountFormError.value = null

  try {
    const formData = new FormData()
    const labelVal =
      bankAccountForm.value.label?.trim() ||
      bankAccountForm.value.bank?.trim() ||
      'Primary Bank'

    formData.append('label', labelVal)
    formData.append('account_name', bankAccountForm.value.account_name.trim())
    formData.append('account_number', bankAccountForm.value.account_number.trim())
    formData.append('account_type', bankAccountForm.value.account_type)
    formData.append('bank', bankAccountForm.value.bank.trim())
    formData.append(
      'bank_branch_code',
      bankAccountForm.value.bank_branch_code.trim()
    )
    formData.append(
      'ifsc_code',
      bankAccountForm.value.bank_branch_code.trim()
    )
    formData.append('bank_branch', bankAccountForm.value.bank_branch?.trim() || '')
    formData.append('bank_code', bankAccountForm.value.bank_code?.trim() || '')
    formData.append('is_default', bankAccountForm.value.is_default ? '1' : '0')

    if (selectedDocumentProofFile.value) {
      formData.append('document_proof', selectedDocumentProofFile.value)
      formData.append('proof', selectedDocumentProofFile.value)
    } else if (existingDocumentProofPath.value || existingDocumentProofUrl.value) {
      if (existingDocumentProofPath.value) {
        formData.append('document_proof', existingDocumentProofPath.value)
        formData.append('proof', existingDocumentProofPath.value)
      }
      if (existingDocumentProofUrl.value) {
        formData.append('document_proof_url', existingDocumentProofUrl.value)
      }
    }

    if (bankAccountFormMode.value === 'create') {
      await bankAccountsStore.createBankAccount(formData)
    } else {
      await bankAccountsStore.updateBankAccount(
        editingBankAccountId.value,
        formData
      )
    }
    closeBankAccountForm()
  } catch (err) {
    const msg = bankAccountsStore.extractErrorMessage(err, 'Submission failed.')
    bankAccountFormError.value = msg
  } finally {
    bankAccountFormLoading.value = false
  }
}

// ─── Set Default ─────────────────────────────────────
const settingDefaultId = ref(null)

async function handleSetDefaultBankAccount(account) {
  if (!account.flag_enable_edit) {
    snackbar.show('Contact support to set default bank account.', 'error')
    return
  }
  settingDefaultId.value = account.id
  try {
    await bankAccountsStore.setDefaultBankAccount(account.id)
  } catch (err) {
    console.error('Set default bank account failed', err)
  } finally {
    settingDefaultId.value = null
  }
}

// ─── Delete Account Confirmation ─────────────────────
const deleteConfirmOpen = ref(false)
const bankAccountToDelete = ref(null)
const deleteLoading = ref(false)

function requestDeleteBankAccount(account) {
  if (!account.flag_enable_edit) {
    snackbar.show('Contact support to delete this bank account.', 'error')
    return
  }
  bankAccountToDelete.value = account
  deleteConfirmOpen.value = true
}

function cancelDeleteBankAccount() {
  deleteConfirmOpen.value = false
  bankAccountToDelete.value = null
  deleteLoading.value = false
}

async function confirmDeleteBankAccount() {
  if (!bankAccountToDelete.value) return
  deleteLoading.value = true
  try {
    await bankAccountsStore.deleteBankAccount(bankAccountToDelete.value.id)
    cancelDeleteBankAccount()
  } catch (err) {
    console.error('Delete bank account failed', err)
  } finally {
    deleteLoading.value = false
  }
}

// ─── Lifecycle ───────────────────────────────────────
onMounted(() => {
  bankAccountsStore.fetchBankAccounts()
  if (!profileStore.user) {
    profileStore.fetchUserProfile()
  }

  // Auto scroll if requested via route hash
  setTimeout(() => {
    if (route.hash === '#bank-accounts-card') {
      const el = document.getElementById('bank-accounts-card')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, 300)
})
</script>
