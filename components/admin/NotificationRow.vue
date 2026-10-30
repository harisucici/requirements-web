<script setup lang="ts">
import { formatRelative } from '~/utils/format'

const props = defineProps<{
  notification: {
    id: string
    channel: string
    title: string
    body: string
    status: string
    is_read: boolean
    created_at: string
    error_message: string | null
    retry_count: number
  }
}>()

const emit = defineEmits<{ resend: [] }>()

const CHANNEL_ICONS: Record<string, string> = {
  email: 'mail',
  sms: 'bell',
  in_app: 'inbox',
  push: 'bell',
}

const channelIcon = computed(() => CHANNEL_ICONS[props.notification.channel] ?? 'bell')

const STATUS_COLORS: Record<string, string> = {
  sent: '#ff8c00',
  delivered: '#ff8c00',
  failed: '#ff6b6b',
  pending: '#ffaf40',
  queued: '#a0a0a0',
}

const statusColor = computed(() => STATUS_COLORS[props.notification.status] ?? '#a0a0a0')
</script>

<template>
  <div
    class="mp-notification-row"
    :class="{ 'mp-unread': !notification.is_read }"
  >
    <!-- Channel icon -->
    <div class="mp-channel-icon">
      <AppIcon :name="channelIcon" :size="16" />
    </div>

    <!-- Content -->
    <div class="mp-notification-content">
      <div class="mp-notification-header">
        <h4 class="mp-notification-title" :class="{ 'mp-title-unread': !notification.is_read }">
          {{ notification.title }}
        </h4>
        <span v-if="!notification.is_read" class="mp-unread-dot" />
        <span class="mp-channel-tag">
          {{ notification.channel }}
        </span>
        <span class="mp-status-tag" :style="{ color: statusColor }">
          {{ notification.status }}
        </span>
      </div>
      <p class="mp-notification-body">{{ notification.body }}</p>
      <div class="mp-notification-meta">
        <span>{{ formatRelative(notification.created_at) }}</span>
        <span v-if="notification.retry_count > 0">
          Retried {{ notification.retry_count }}x
        </span>
      </div>
      <p v-if="notification.error_message" class="mp-error-text">
        {{ notification.error_message }}
      </p>
    </div>

    <!-- Actions -->
    <div class="mp-notification-actions">
      <button
        v-if="notification.status === 'failed'"
        class="mp-btn mp-btn-secondary"
        @click="emit('resend')"
      >
        <AppIcon name="refresh" :size="14" />
        Resend
      </button>
    </div>
  </div>
</template>

<style scoped>
.mp-notification-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
  font-family: 'Share Tech Mono', monospace;
}
.mp-unread {
  border-left: 3px solid var(--rust);
}
.mp-channel-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: rgba(255, 140, 0, 0.1);
  color: var(--rust);
  clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
}
.mp-notification-content {
  flex: 1;
  min-width: 0;
}
.mp-notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.mp-notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--silver);
}
.mp-title-unread {
  font-weight: 700;
}
.mp-unread-dot {
  width: 8px;
  height: 8px;
  background: var(--rust);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 140, 0, 0.6);
  animation: mp-pulse 2s ease-in-out infinite;
}
@keyframes mp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.mp-channel-tag {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 8px;
  background: rgba(74, 107, 124, 0.2);
  color: var(--copper);
  border: 1px solid rgba(74, 107, 124, 0.5);
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-status-tag {
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}
.mp-notification-body {
  margin-top: 4px;
  font-size: 14px;
  color: var(--silver-dim);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mp-notification-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--silver-dim);
}
.mp-error-text {
  margin-top: 4px;
  font-size: 12px;
  color: #ff6b6b;
}
.mp-notification-actions {
  flex-shrink: 0;
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
.mp-btn-secondary {
  background: rgba(74, 107, 124, 0.2);
  color: var(--silver);
  border-color: rgba(74, 107, 124, 0.5);
}
.mp-btn:hover {
  background: rgba(74, 107, 124, 0.4);
  border-color: var(--copper);
}
</style>
