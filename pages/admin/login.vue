<script setup lang="ts">
definePageMeta({ layout: false })

const { login, fetchMe } = useAdminAuth()
const toast = useToast()
const route = useRoute()

const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }
  busy.value = true
  try {
    await login(email.value, password.value)
    await fetchMe(true)
    const next = (route.query.next as string) || '/admin'
    await navigateTo(next)
  } catch (err: any) {
    const msg = err?.code === 'UNAUTHORIZED'
      ? 'Incorrect email or password. After 5 failed attempts the account locks for 15 minutes.'
      : err?.message ?? 'Connection failed, please try again'
    error.value = msg
    toast.error(msg)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-[var(--admin-bg)] px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-xl font-semibold text-white">
          <span class="grid h-10 w-10 place-items-center bg-[var(--green)] text-white">
            <AppIcon name="home" :size="18" />
          </span>
          request<span class="text-[var(--coral)]">/</span>room
        </NuxtLink>
        <p class="mt-3 text-sm text-white/50">Team workspace sign-in</p>
      </div>

      <div class="admin-panel p-8">
        <p class="eyebrow">Sign in</p>
        <h1 class="display mt-2 text-2xl font-semibold">Welcome back</h1>

        <form class="mt-6 space-y-5" @submit.prevent="submit">
          <div>
            <label for="login-email" class="label">Email</label>
            <input
              id="login-email" v-model="email" type="email" autocomplete="email"
              class="field mt-1" placeholder="you@requestroom.com"
              required
            />
          </div>
          <div>
            <label for="login-password" class="label">Password</label>
            <input
              id="login-password" v-model="password" type="password" autocomplete="current-password"
              class="field mt-1" placeholder="Enter your password"
              required
            />
          </div>

          <p v-if="error" role="alert" class="error-text">{{ error }}</p>

          <button type="submit" :disabled="busy" class="btn btn-primary w-full">
            <AppIcon v-if="busy" name="spinner" :size="16" class="animate-spin" />
            {{ busy ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <div class="mt-6 border-t border-[var(--line)] pt-5">
          <p class="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Demo accounts</p>
          <div class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="font-mono text-xs">reviewer@requestroom.com</span>
              <span class="text-[var(--muted)]">pw: mock1234</span>
            </div>
            <div class="flex justify-between">
              <span class="font-mono text-xs">developer@requestroom.com</span>
              <span class="text-[var(--muted)]">pw: mock1234</span>
            </div>
            <div class="flex justify-between">
              <span class="font-mono text-xs">admin@requestroom.com</span>
              <span class="text-[var(--muted)]">pw: mock1234</span>
            </div>
          </div>
        </div>

        <p class="mt-5 flex items-center gap-2 text-xs text-[var(--muted)]">
          <AppIcon name="lock" :size="12" />
          Protected by session cookie. Account locks after 5 failed attempts.
        </p>
      </div>
    </div>
  </div>
</template>
