<script setup lang="ts">
import type { User } from '~/types/api'

useHead({ title: 'Account settings - request/room' })
const api = useApi()
const toast = useToast()
const { user, fetchMe } = useUserAuth()

onMounted(async () => {
  const u = await fetchMe()
  if (!u) await navigateTo('/login')
})

const { data: account, refresh } = await useAsyncData('my-account', () => api.get<User>('/my/account'))

const email = ref('')
const name = ref('')
const newPassword = ref('')
const saving = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

watch(account, (a) => {
  if (a) {
    email.value = a.email
    name.value = a.name ?? ''
  }
}, { immediate: true })

async function saveAccount() {
  saving.value = true
  try {
    const body: Record<string, unknown> = { email: email.value }
    if (name.value) body.name = name.value
    if (newPassword.value) body.password = newPassword.value
    await api.patch('/my/account', body)
    toast.success('Account updated')
    newPassword.value = ''
    await refresh()
  } catch (e: any) {
    toast.error(e.message || 'Connection failed, please try again')
  } finally {
    saving.value = false
  }
}

async function exportData() {
  try {
    await api.post('/gdpr/export')
    toast.success('Export queued, you will receive an email')
  } catch (e: any) {
    toast.error(e.message || 'Connection failed, please try again')
  }
}

async function deleteData() {
  deleting.value = true
  try {
    await api.post('/gdpr/delete')
    toast.success('Deletion request received; executed within 30 days')
    showDeleteConfirm.value = false
    await navigateTo('/login')
  } catch (e: any) {
    toast.error(e.message || 'Connection failed, please try again')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-5 pb-20 pt-10 lg:px-8">
    <div class="section-header mechanical-enter mb-8">
      <div class="corner-bracket tl"></div>
      <div class="corner-bracket tr"></div>
      <div class="corner-bracket bl"></div>
      <div class="corner-bracket br"></div>
      <span class="screw screw-tl"></span>
      <span class="screw screw-tr"></span>
      <div>
        <div class="data-label">YOUR ACCOUNT MODULE</div>
        <h1 class="glitch-title mt-1" data-text="ACCOUNT SETTINGS">ACCOUNT SETTINGS</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <SkeletonLoader v-if="!account" type="panel" />

    <template v-else>
      <!-- Account form -->
      <section class="panel mt-8 p-7 sm:p-9">
        <h2 class="font-semibold">Profile</h2>
        <form class="mt-6 space-y-5" @submit.prevent="saveAccount">
          <div>
            <label for="acc-email" class="label">Email</label>
            <input id="acc-email" v-model="email" type="email" class="field mt-2" />
          </div>
          <div>
            <label for="acc-name" class="label">Name</label>
            <input id="acc-name" v-model="name" type="text" class="field mt-2" />
          </div>
          <div>
            <label for="acc-pw" class="label">New password <span class="font-normal text-[var(--muted)]">(leave blank to keep current)</span></label>
            <input id="acc-pw" v-model="newPassword" type="password" class="field mt-2" autocomplete="new-password" />
          </div>
          <button type="submit" :disabled="saving" class="btn btn-primary">
            <AppIcon v-if="saving" name="spinner" :size="15" class="animate-spin" />
            {{ saving ? 'Saving...' : 'Save changes' }}
          </button>
        </form>
      </section>

      <!-- GDPR -->
      <section class="panel mt-8 p-7 sm:p-9">
        <h2 class="font-semibold">Your data (GDPR)</h2>
        <p class="mt-2 text-sm text-[var(--muted)]">You have the right to export or delete your personal data.</p>
        <div class="mt-6 flex flex-wrap gap-4">
          <button class="btn btn-secondary" @click="exportData">
            <AppIcon name="download" :size="15" />
            Export my data
          </button>
          <button class="btn btn-danger" @click="showDeleteConfirm = true">
            <AppIcon name="trash" :size="15" />
            Delete my data
          </button>
        </div>
      </section>

      <!-- Logout -->
      <div class="mt-8">
        <button class="btn btn-ghost" @click="useUserAuth().logout()">
          <AppIcon name="logout" :size="15" />
          Sign out
        </button>
      </div>

      <!-- Delete confirmation -->
      <ConfirmDialog
        :open="showDeleteConfirm"
        title="Delete all your data?"
        message="This will permanently delete your account, all requests, and associated data within 30 days. This action cannot be undone."
        confirm-label="Delete my data"
        variant="danger"
        :loading="deleting"
        @confirm="deleteData"
        @cancel="showDeleteConfirm = false"
      />
    </template>
  </main>
</template>
