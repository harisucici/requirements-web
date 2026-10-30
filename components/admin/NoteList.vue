<script setup lang="ts">
import { formatRelative } from '~/utils/format'

defineProps<{
  notes: {
    id: string
    author_name: string
    content: string
    visible_to_user: boolean
    created_at: string
  }[]
  requestId: string
}>()

const emit = defineEmits<{
  'add-note': [payload: { content: string; visible_to_user: boolean }]
}>()

const newContent = ref('')
const newVisible = ref(false)

function submit() {
  const content = newContent.value.trim()
  if (!content) return
  emit('add-note', { content, visible_to_user: newVisible.value })
  newContent.value = ''
  newVisible.value = false
}
</script>

<template>
  <div class="mp-notes">
    <!-- Existing notes -->
    <div v-if="notes.length" class="mp-notes-list">
      <div
        v-for="note in notes"
        :key="note.id"
        class="mp-note-card"
      >
        <div class="mp-note-header">
          <div class="mp-note-meta">
            <span class="mp-note-author">{{ note.author_name }}</span>
            <span
              v-if="!note.visible_to_user"
              class="mp-note-visibility mp-note-internal"
            >
              <AppIcon name="lock" :size="12" />
              Internal only
            </span>
            <span
              v-else
              class="mp-note-visibility mp-note-public"
            >
              <AppIcon name="eye" :size="12" />
              Visible to user
            </span>
          </div>
          <span class="mp-note-time">{{ formatRelative(note.created_at) }}</span>
        </div>
        <p class="mp-note-content">{{ note.content }}</p>
      </div>
    </div>
    <p v-else class="mp-notes-empty">No notes yet.</p>

    <!-- Add note form -->
    <div class="mp-note-form">
      <label class="mp-label" for="note-content">Add a note</label>
      <textarea
        id="note-content"
        class="mp-textarea"
        placeholder="Write your note..."
        v-model="newContent"
      />
      <div class="mp-form-actions">
        <label class="mp-checkbox-label">
          <input
            type="checkbox"
            class="mp-checkbox"
            v-model="newVisible"
          />
          <span>Visible to user</span>
        </label>
        <button
          class="mp-btn mp-btn-primary"
          :disabled="!newContent.trim()"
          @click="submit"
        >
          <AppIcon name="plus" :size="14" />
          Add Note
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mp-notes {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Share Tech Mono', monospace;
}
.mp-notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mp-note-card {
  padding: 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.mp-note-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mp-note-author {
  font-size: 14px;
  font-weight: 600;
  color: var(--silver);
}
.mp-note-visibility {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}
.mp-note-internal {
  color: var(--silver-dim);
}
.mp-note-public {
  color: var(--rust);
}
.mp-note-time {
  font-size: 12px;
  color: var(--silver-dim);
}
.mp-note-content {
  font-size: 14px;
  white-space: pre-wrap;
  color: var(--silver);
}
.mp-notes-empty {
  font-size: 14px;
  color: var(--silver-dim);
}
.mp-note-form {
  padding: 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mp-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-textarea {
  min-height: 100px;
  padding: 12px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver);
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(255, 140, 0, 0.3);
  resize: vertical;
  transition: all 0.3s ease;
}
.mp-textarea:focus {
  border-color: var(--rust);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mp-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  color: var(--silver);
}
.mp-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--rust);
}
.mp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  border: 1px solid rgba(255, 140, 0, 0.3);
}
.mp-btn-primary {
  background: linear-gradient(135deg, var(--rust) 0%, #cc7000 100%);
  color: var(--iron);
  border-color: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-btn:hover:not(:disabled) {
  animation: mp-glitch 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.4);
}
.mp-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
@keyframes mp-glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(1px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
}
</style>
