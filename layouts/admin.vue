<script setup lang="ts">
import { ADMIN_SECTIONS, menuForRole } from '~/utils/adminMenu'

const { session, logout, loading } = useAdminAuth()

const menu = computed(() => menuForRole(session.value?.role))
const grouped = computed(() =>
  ADMIN_SECTIONS.map(section => ({
    section,
    items: menu.value.filter(item => item.section === section),
  })).filter(g => g.items.length > 0),
)
const unread = useState<number>('admin-unread-count', () => 0)

// Live cockpit clock + telemetry
const clock = ref('--:--:--')
const cpu = ref(18.3)
const mem = ref(42.8)
let tick: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  const update = () => {
    const d = new Date()
    clock.value = d.toTimeString().slice(0, 8)
    cpu.value = +(18.3 + Math.sin(Date.now() / 4000) * 4).toFixed(1)
    mem.value = +(42.8 + Math.cos(Date.now() / 5000) * 2).toFixed(1)
  }
  update()
  tick = setInterval(update, 1000)
})
onUnmounted(() => { if (tick) clearInterval(tick) })
</script>

<template>
  <div class="admin-shell relative flex min-h-screen overflow-hidden">
    <!-- Background datastream column -->
    <div class="datastream pointer-events-none absolute right-0 top-0 h-full w-48 opacity-40" aria-hidden="true" />

    <!-- Sidebar — industrial control column -->
    <aside class="admin-sidebar sticky top-0 z-20 hidden h-screen w-64 shrink-0 flex-col lg:flex">
      <!-- Header plate -->
      <div class="relative border-b border-[var(--admin-line)] px-4 py-5">
        <span class="absolute left-0 top-0 h-[2px] w-12 bg-[var(--rust)] shadow-[0_0_10px_var(--rust-glow)]" />
        <span class="absolute right-0 top-0 h-[2px] w-12 bg-[var(--rust)] shadow-[0_0_10px_var(--rust-glow)]" />
        <div class="flex items-center gap-2">
          <span class="status-led ok" aria-hidden="true" />
          <span class="mono text-[10px] tracking-[0.24em] text-[var(--copper)]">CONSOLE.ACTIVE</span>
        </div>
        <NuxtLink to="/admin" class="mt-3 flex items-center gap-2">
          <span class="mech-rivet relative grid h-9 w-9 place-items-center border border-[var(--rust)] bg-[var(--iron)] text-[var(--rust)] shadow-[0_0_10px_var(--rust-glow)]">
            <span class="font-mono text-sm font-bold">↗</span>
          </span>
          <span class="mech-title text-sm tracking-[0.22em]">
            REQ<span class="text-[var(--copper)]">//</span>ROOM
          </span>
        </NuxtLink>
        <div class="mono mt-3 flex items-center justify-between text-[10px] tracking-[0.18em] text-[var(--silver-dim)]">
          <span>OP: {{ session?.name?.slice(0,8) ?? '---' }}</span>
          <span class="status-led" />
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-2 py-4" aria-label="Admin navigation">
        <div v-for="group in grouped" :key="group.section" class="mb-5">
          <p class="px-3 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--rust)]">
            <span class="text-[var(--copper)]">§</span> {{ group.section }}
          </p>
          <ul class="space-y-0.5">
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="admin-sidebar-link"
                :active-class="item.to === '/admin' ? '' : 'router-link-active'"
                exact-active-class="router-link-active"
              >
                <AppIcon :name="item.icon" :size="15" />
                <span class="flex-1">{{ item.label }}</span>
                <span
                  v-if="item.to === '/admin/notifications' && unread > 0"
                  role="status" aria-atomic="true"
                  class="mono rounded-sm border border-[var(--blood)] bg-[var(--blood)]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#fca5a5] shadow-[0_0_8px_rgba(185,28,28,.5)]"
                >{{ unread }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Footer telemetry -->
      <div class="relative border-t border-[var(--admin-line)] px-4 py-3 font-mono text-[10px] tracking-[0.18em] text-[var(--silver-dim)]">
        <div class="flex items-center justify-between">
          <span>CPU <span class="text-[var(--rust)]">{{ cpu }}%</span></span>
          <span>MEM <span class="text-[var(--rust)]">{{ mem }}%</span></span>
        </div>
        <div class="mt-1 flex items-center justify-between">
          <span class="flex items-center gap-1.5"><span class="status-led ok" />LINK</span>
          <NuxtLink to="/" target="_blank" class="text-[var(--copper)] hover:text-[var(--rust)]">[VIEW_SITE]</NuxtLink>
        </div>
      </div>
    </aside>

    <!-- Main column -->
    <div class="relative flex min-w-0 flex-1 flex-col">
      <!-- Top control bar -->
      <header class="mech-border relative sticky top-0 z-30 flex items-center justify-between gap-4 border-y-0 bg-[var(--iron-deep)]/95 px-5 py-3 backdrop-blur">
        <span class="absolute left-0 top-0 h-[2px] w-20 bg-[var(--rust)] shadow-[0_0_10px_var(--rust-glow)]" />
        <span class="absolute right-0 top-0 h-[2px] w-20 bg-[var(--rust)] shadow-[0_0_10px_var(--rust-glow)]" />

        <div class="flex items-center gap-3 lg:hidden">
          <span class="status-led ok" />
          <span class="mech-title text-sm tracking-[0.22em]">REQ//ROOM</span>
        </div>

        <!-- Asymmetric grid readout -->
        <div class="hidden grid-cols-[2fr_1fr_1fr] gap-6 font-mono text-[11px] tracking-[0.18em] text-[var(--silver-dim)] lg:grid">
          <div class="flex items-center gap-2">
            <span class="status-led ok" />
            <span>CTRL.SURFACE: <span class="text-[var(--rust)]">TEAM_WORKSPACE</span></span>
          </div>
          <div>UTC <span class="text-[var(--rust)]">{{ clock }}</span></div>
          <div class="text-right">BUILD <span class="text-[var(--copper)]">3.14.7-STABLE</span></div>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="session">
            <span class="hidden text-right sm:block">
              <span class="block text-sm font-semibold text-white" style="font-family:'Rajdhani',sans-serif; letter-spacing:.08em;">{{ session.name }}</span>
              <span class="mono block text-[10px] uppercase tracking-[0.2em] text-[var(--copper)]">{{ session.role }}</span>
            </span>
            <span class="mech-rivet relative grid h-10 w-10 place-items-center border border-[var(--rust)] bg-[var(--iron)] text-sm font-bold text-[var(--rust)]" aria-hidden="true">
              {{ session.name?.slice(0, 1) }}
            </span>
            <button class="btn btn-sm" @click="logout()">
              <AppIcon name="logout" :size="14" /> <span class="hidden sm:inline">DISCONNECT</span>
            </button>
          </template>
          <span v-else-if="loading" class="mono text-[11px] tracking-[0.18em] text-[var(--silver-dim)]">
            <span class="status-led" /> ESTABLISHING_SESSION...
          </span>
        </div>
      </header>

      <!-- Main workspace -->
      <main class="relative flex-1 px-5 py-8 xl:px-8">
        <slot />
      </main>

      <!-- Bottom telemetry strip -->
      <footer class="mech-border relative flex items-center justify-between gap-4 border-y-0 bg-[var(--iron-deep)]/95 px-5 py-2 font-mono text-[10px] tracking-[0.2em] text-[var(--silver-dim)] backdrop-blur">
        <span class="absolute bottom-0 left-0 h-[2px] w-20 bg-[var(--rust)] shadow-[0_0_10px_var(--rust-glow)]" />
        <span class="absolute bottom-0 right-0 h-[2px] w-20 bg-[var(--rust)] shadow-[0_0_10px_var(--rust-glow)]" />
        <span class="flex items-center gap-2"><span class="status-led idle" />CTRL-SERIAL: 0x8F3A2E</span>
        <span class="hidden md:inline">NET.STABLE · PACKETS 0xLOST=0</span>
        <span>◣ WASTELAND CONTROL SYSTEM</span>
      </footer>
    </div>

    <ToastContainer />
  </div>
</template>
