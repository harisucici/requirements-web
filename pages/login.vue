<script setup lang="ts">
import type { User } from '~/types/api'

useHead({ title: 'Sign in - request/room' })
const { login } = useUserAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)
const blurred = reactive({ email: false, password: false })

const valid = computed(() => email.value.includes('@') && password.value.length > 0)

async function submit() {
  if (!valid.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    await login(email.value, password.value)
    await router.push('/my/requests')
  } catch (e: any) {
    error.value = e.message || 'Invalid email or password'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-md px-5 pb-20 pt-16 lg:px-8">
    <section class="panel p-7 sm:p-10">
      <p class="eyebrow">Welcome back</p>
      <h1 class="display mt-3 text-3xl font-semibold">Sign in</h1>
      <p class="mt-3 text-sm text-[var(--silver-dim)]">Demo: user@example.com / mock1234</p>

      <form class="mt-8 space-y-6" @submit.prevent="submit">
        <div>
          <label for="email" class="label">Email</label>
          <input
            id="email" v-model="email" type="email" autocomplete="email"
            class="field mt-2" placeholder="you@example.com"
            :aria-invalid="blurred.email && !email.includes('@')"
            @blur="blurred.email = true"
          />
        </div>

        <div>
          <label for="password" class="label">Password</label>
          <input
            id="password" v-model="password" type="password" autocomplete="current-password"
            class="field mt-2" placeholder="Enter your password"
            :aria-invalid="blurred.password && !password.length"
            @blur="blurred.password = true"
          />
        </div>

        <p v-if="error" role="alert" class="error-text">{{ error }}</p>

        <button type="submit" :disabled="!valid || submitting" class="btn btn-primary w-full">
          <AppIcon v-if="submitting" name="spinner" :size="15" class="animate-spin" />
          {{ submitting ? 'Signing in...' : 'Sign in →' }}
        </button>
      </form>
    </section>
  </main>
</template>
