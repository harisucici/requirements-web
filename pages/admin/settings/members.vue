<script setup lang="ts">
import type { TeamMember } from '~/types/api'

definePageMeta({ layout: 'admin' })

const api = useApi()
const toast = useToast()

const { data: members, pending, refresh } = await useAsyncData('admin-members', () =>
  api.get<TeamMember[]>('/admin/settings/members'),
)

const editTarget = ref<TeamMember | null>(null)
const editRole = ref('')
const editSkills = ref('')
const editThreshold = ref(0)
const editActive = ref(true)
const saveBusy = ref(false)

function openEdit(m: TeamMember) {
  editTarget.value = m
  editRole.value = m.role
  editSkills.value = m.skill_tags.join(', ')
  editThreshold.value = m.load_threshold
  editActive.value = m.is_active
}

async function saveMember() {
  if (!editTarget.value || saveBusy.value) return
  saveBusy.value = true
  try {
    await api.patch(`/admin/settings/members/${editTarget.value.id}`, {
      role: editRole.value,
      skill_tags: editSkills.value.split(',').map(s => s.trim()).filter(Boolean),
      load_threshold: editThreshold.value,
      is_active: editActive.value,
    })
    toast.success('Member updated')
    editTarget.value = null
    await refresh()
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to save')
  } finally { saveBusy.value = false }
}

function isOverloaded(m: TeamMember) {
  return m.active_task_count >= m.load_threshold
}
</script>

<template>
  <div>
    <div class="section-header mechanical-enter mb-8">
      <div class="corner-bracket tl"></div>
      <div class="corner-bracket tr"></div>
      <div class="corner-bracket bl"></div>
      <div class="corner-bracket br"></div>
      <span class="screw screw-tl"></span>
      <span class="screw screw-tr"></span>
      <div>
        <div class="data-label">CONFIGURATION MODULE</div>
        <h1 class="glitch-title mt-1" data-text="MEMBERS">MEMBERS</h1>
      </div>
      <span class="ml-auto status-indicator success"></span>
    </div>

    <div v-if="pending" class="admin-panel p-5"><SkeletonLoader type="table" :lines="4" /></div>

    <template v-else-if="members">
      <div class="admin-panel overflow-x-auto">
        <table class="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-[var(--line)]">
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Name</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Email</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Role</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Skills</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Load</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Active</th>
              <th class="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="m.id" class="border-b border-[var(--line)]/60">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="grid h-8 w-8 place-items-center rounded-full bg-[var(--green)] text-xs font-bold text-white">
                    {{ m.name.slice(0, 1) }}
                  </span>
                  <span class="font-semibold">{{ m.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-[var(--muted)]">{{ m.email }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-bold capitalize" :class="m.role === 'admin' ? 'bg-[rgba(222,104,72,.12)] text-[var(--coral)]' : 'bg-[rgba(30,107,82,.08)] text-[var(--green)]'">{{ m.role }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-for="tag in m.skill_tags" :key="tag" class="rounded bg-[rgba(30,107,82,.06)] px-1.5 py-0.5 text-xs text-[var(--green)]">{{ tag }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm font-bold" :class="isOverloaded(m) ? 'text-[var(--status-rejected)]' : 'text-[var(--green)]'">
                  {{ m.active_task_count }} / {{ m.load_threshold }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-block h-2.5 w-2.5 rounded-full" :class="m.is_active ? 'bg-[var(--green)]' : 'bg-[var(--line)]'" />
              </td>
              <td class="px-4 py-3">
                <button class="btn btn-sm btn-secondary" @click="openEdit(m)">
                  <AppIcon name="edit" :size="13" /> Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Edit modal -->
    <Modal :open="!!editTarget" title="Edit member" @close="editTarget = null">
      <div v-if="editTarget" class="space-y-4">
        <p class="text-sm font-semibold">{{ editTarget.name }} ({{ editTarget.email }})</p>
        <div>
          <label for="member-role" class="label">Role</label>
          <select id="member-role" v-model="editRole" class="field mt-1">
            <option value="reviewer">Reviewer</option>
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label for="member-skills" class="label">Skill tags (comma-separated)</label>
          <input id="member-skills" v-model="editSkills" class="field mt-1" placeholder="triage, pricing, data-viz" />
        </div>
        <div>
          <label for="member-threshold" class="label">Load threshold</label>
          <input id="member-threshold" v-model.number="editThreshold" type="number" min="1" class="field mt-1" />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="editActive" type="checkbox" class="h-4 w-4" />
          Active member
        </label>
      </div>
      <template #footer>
        <button class="btn btn-sm btn-secondary" @click="editTarget = null">Cancel</button>
        <button :disabled="saveBusy" class="btn btn-sm btn-primary" @click="saveMember">
          <AppIcon v-if="saveBusy" name="spinner" :size="14" class="animate-spin" /> Save
        </button>
      </template>
    </Modal>
  </div>
</template>
