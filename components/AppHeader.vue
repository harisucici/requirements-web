<script setup lang="ts">
const menuOpen = ref(false)
const route = useRoute()
watch(() => route.path, () => { menuOpen.value = false })
</script>

<template>
  <header class="station-header">
    <NuxtLink to="/" class="station-logo" aria-label="Request Room home">
      <span class="logo-gear" aria-hidden="true">⚙</span>
      <span>REQUEST<span class="logo-slash">/</span>ROOM<small>GOOD TOOLS. BUILT TO SURVIVE.</small></span>
    </NuxtLink>
    <nav class="station-nav" aria-label="Main">
      <NuxtLink to="/request">THE WORKSHOP</NuxtLink>
      <NuxtLink to="/#field-reports">FIELD REPORTS</NuxtLink>
      <NuxtLink to="/login">SIGN IN <span aria-hidden="true">↗</span></NuxtLink>
    </nav>
    <NuxtLink to="/request" class="btn btn-primary header-cta">NEW REQUEST <span aria-hidden="true">↗</span></NuxtLink>
    <button class="menu-toggle btn" :aria-expanded="menuOpen" aria-controls="station-mobile-menu" aria-label="Toggle navigation" @click="menuOpen = !menuOpen">{{ menuOpen ? 'CLOSE −' : 'MENU +' }}</button>
  </header>
  <nav v-if="menuOpen" id="station-mobile-menu" class="station-mobile-nav" aria-label="Mobile">
    <NuxtLink to="/request">The workshop ↗</NuxtLink>
    <NuxtLink to="/#field-reports">Field reports ↗</NuxtLink>
    <NuxtLink to="/login">Sign in ↗</NuxtLink>
  </nav>
</template>
