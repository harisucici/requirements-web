<script setup lang="ts">
const props = defineProps<{
  open: boolean
  templates: {
    code: string
    subject: string
    body_markdown: string
    variables: string[]
  }[]
  requestId: string
  requestShortId: string
  userEmail: string
}>()

const emit = defineEmits<{
  close: []
  sent: []
}>()

const selectedTemplateCode = ref<string>('')
const body = ref('')
const subject = ref('')
const sending = ref(false)

const selectedTemplate = computed(() =>
  props.templates.find(t => t.code === selectedTemplateCode.value) ?? null,
)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    selectedTemplateCode.value = ''
    body.value = ''
    subject.value = ''
  }
})

function selectTemplate(code: string) {
  selectedTemplateCode.value = code
  const tpl = props.templates.find(t => t.code === code)
  if (tpl) {
    subject.value = tpl.subject
    body.value = tpl.body_markdown
  }
}

function insertVariable(variable: string) {
  const chip = `{${variable}}`
  body.value += chip
}

/** Check if any unresolved {variable} placeholders remain. */
const unresolvedVars = computed(() => {
  const matches = body.value.match(/\{(\w+)\}/g)
  if (!matches) return []
  return matches.filter(m => {
    const varName = m.slice(1, -1)
    return selectedTemplate.value?.variables.includes(varName) ?? false
  })
})

const canSend = computed(() => {
  return body.value.trim().length > 0 && subject.value.trim().length > 0 && unresolvedVars.value.length === 0
})

/** Simple markdown-ish preview: bold, line breaks. */
const previewHtml = computed(() => {
  return body.value
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
})

async function send() {
  if (!canSend.value) return
  sending.value = true
  try {
    const api = useApi()
    await api.post(`/admin/requests/${props.requestId}/reply`, {
      template_code: selectedTemplateCode.value || undefined,
      subject: subject.value,
      body: body.value,
    })
    emit('sent')
    emit('close')
  } catch (err) {
    const toast = useToast()
    toast.error(err instanceof Error ? err.message : 'Failed to send reply')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="open"
        class="mp-drawer-overlay"
        @click.self="emit('close')"
      >
        <div class="mp-drawer">
          <!-- Header -->
          <div class="mp-drawer-header">
            <h2 class="mp-drawer-title">Reply to {{ requestShortId }}</h2>
            <button class="mp-drawer-close" aria-label="Close drawer" @click="emit('close')">
              <AppIcon name="x" :size="20" />
            </button>
          </div>

          <div class="mp-drawer-body">
            <!-- Recipient info -->
            <div class="mp-recipient-info">
              To: <span class="mp-recipient-email">{{ userEmail }}</span>
            </div>

            <!-- Template picker -->
            <div class="mp-input-group">
              <label class="mp-label" for="tpl-select">Template</label>
              <select
                id="tpl-select"
                class="mp-select"
                :value="selectedTemplateCode"
                @change="selectTemplate(($event.target as HTMLSelectElement).value)"
              >
                <option value="">Custom (no template)</option>
                <option v-for="tpl in templates" :key="tpl.code" :value="tpl.code">
                  {{ tpl.subject }}
                </option>
              </select>
            </div>

            <!-- Variable chips -->
            <div v-if="selectedTemplate && selectedTemplate.variables.length" class="mp-variable-chips">
              <span class="mp-chips-label">Insert:</span>
              <button
                v-for="v in selectedTemplate.variables"
                :key="v"
                type="button"
                class="mp-variable-chip"
                @click="insertVariable(v)"
              >
                <AppIcon name="plus" :size="10" />
                {{ '{' + v + '}' }}
              </button>
            </div>

            <!-- Subject -->
            <div class="mp-input-group">
              <label class="mp-label" for="reply-subject">Subject</label>
              <input
                id="reply-subject"
                type="text"
                class="mp-input"
                v-model="subject"
                placeholder="Email subject..."
              />
            </div>

            <!-- Body editor -->
            <div class="mp-input-group">
              <label class="mp-label" for="reply-body">Body</label>
              <p class="mp-help">Supports markdown. Replace all {variables} before sending.</p>
              <textarea
                id="reply-body"
                class="mp-textarea"
                v-model="body"
                placeholder="Write your reply..."
              />
              <div v-if="unresolvedVars.length" class="mp-error">
                <span class="mp-error-text">
                  Unresolved variables: {{ unresolvedVars.join(', ') }}
                </span>
              </div>
            </div>

            <!-- Live preview -->
            <div v-if="body.trim()" class="mp-preview-section">
              <span class="mp-preview-label">Preview</span>
              <div class="mp-preview" v-html="previewHtml" />
            </div>
          </div>

          <!-- Footer -->
          <div class="mp-drawer-footer">
            <button class="mp-btn mp-btn-secondary" @click="emit('close')">
              Cancel
            </button>
            <button
              class="mp-btn mp-btn-primary"
              :disabled="!canSend || sending"
              @click="send"
            >
              <AppIcon :name="sending ? 'spinner' : 'send'" :size="14" />
              {{ sending ? 'Sending...' : 'Send Reply' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mp-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  justify-content: flex-end;
  background: rgba(26, 26, 26, 0.8);
}
.mp-drawer {
  width: 100%;
  max-width: 512px;
  height: 100%;
  overflow-y: auto;
  background: var(--iron);
  border-left: 1px solid rgba(255, 140, 0, 0.3);
  box-shadow: -10px 0 30px rgba(255, 140, 0, 0.2);
  display: flex;
  flex-direction: column;
}
.mp-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 140, 0, 0.3);
}
.mp-drawer-title {
  font-family: 'Share Tech Mono', monospace;
  font-size: 20px;
  font-weight: 600;
  color: var(--silver);
}
.mp-drawer-close {
  color: var(--silver-dim);
  transition: color 0.3s ease;
}
.mp-drawer-close:hover {
  color: var(--rust);
}
.mp-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.mp-recipient-info {
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver-dim);
}
.mp-recipient-email {
  font-weight: 600;
  color: var(--silver);
}
.mp-input-group {
  display: flex;
  flex-direction: column;
}
.mp-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
  margin-bottom: 8px;
}
.mp-select,
.mp-input {
  padding: 10px 14px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver);
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(255, 140, 0, 0.3);
  transition: all 0.3s ease;
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-select:focus,
.mp-input:focus {
  border-color: var(--rust);
  outline: none;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-help {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: var(--silver-dim);
  margin-bottom: 4px;
}
.mp-variable-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.mp-chips-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: var(--silver-dim);
  margin-right: 4px;
}
.mp-variable-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 140, 0, 0.1);
  color: var(--rust);
  border: 1px solid rgba(255, 140, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-variable-chip:hover {
  background: rgba(255, 140, 0, 0.2);
  border-color: var(--rust);
}
.mp-textarea {
  min-height: 200px;
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
.mp-error {
  margin-top: 4px;
}
.mp-error-text {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: #ff6b6b;
}
.mp-preview-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mp-preview-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--copper);
}
.mp-preview {
  padding: 16px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver);
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
}
.mp-drawer-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 140, 0, 0.3);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.mp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
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
.mp-btn-secondary {
  background: rgba(74, 107, 124, 0.2);
  color: var(--silver);
  border-color: rgba(74, 107, 124, 0.5);
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
