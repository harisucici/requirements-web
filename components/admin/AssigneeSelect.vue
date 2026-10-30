<script setup lang="ts">
defineProps<{
  members: {
    id: string
    name: string
    active_task_count: number
    load_threshold: number
    skill_tags: string[]
  }[]
  modelValue: string | null
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

function isOverloaded(m: { active_task_count: number; load_threshold: number }) {
  return m.active_task_count >= m.load_threshold
}
</script>

<template>
  <div class="mp-assignee-select">
    <label class="mp-label" for="assignee-select">Assign to</label>
    <select
      id="assignee-select"
      class="mp-select"
      :value="modelValue ?? ''"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value || null)"
    >
      <option value="">Unassigned</option>
      <option
        v-for="m in members"
        :key="m.id"
        :value="m.id"
      >
        {{ m.name }} — {{ m.active_task_count }}/{{ m.load_threshold }} tasks
        <template v-if="isOverloaded(m)"> (overloaded)</template>
      </option>
    </select>

    <!-- Detail card for selected member -->
    <template v-for="m in members" :key="m.id">
      <div v-if="modelValue === m.id" class="mp-member-card">
        <div class="mp-member-header">
          <span class="mp-member-name">{{ m.name }}</span>
          <span
            class="mp-member-load"
            :class="isOverloaded(m) ? 'mp-load-danger' : 'mp-load-safe'"
          >
            {{ m.active_task_count }} / {{ m.load_threshold }} tasks
          </span>
        </div>
        <div v-if="isOverloaded(m)" class="mp-member-warning">
          <AppIcon name="alert" :size="14" />
          <span>Member is overloaded</span>
        </div>
        <div v-if="m.skill_tags.length" class="mp-member-tags">
          <span
            v-for="tag in m.skill_tags"
            :key="tag"
            class="mp-skill-tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mp-assignee-select {
  font-family: 'Share Tech Mono', monospace;
}
.mp-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
  margin-bottom: 8px;
}
.mp-select {
  width: 100%;
  padding: 10px 14px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver);
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-select:hover, .mp-select:focus {
  border-color: var(--rust);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-member-card {
  margin-top: 12px;
  padding: 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mp-member-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--silver);
}
.mp-member-load {
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-load-safe {
  background: rgba(255, 140, 0, 0.2);
  color: var(--rust);
  border: 1px solid rgba(255, 140, 0, 0.5);
}
.mp-load-danger {
  background: rgba(220, 38, 38, 0.2);
  color: #ff6b6b;
  border: 1px solid rgba(220, 38, 38, 0.5);
}
.mp-member-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ff6b6b;
}
.mp-member-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.mp-skill-tag {
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(74, 107, 124, 0.2);
  color: var(--copper);
  border: 1px solid rgba(74, 107, 124, 0.5);
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
</style>
