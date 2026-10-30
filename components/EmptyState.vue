<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  icon?: string
  dark?: boolean
}>(), { icon: 'inbox', dark: false })
const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="mp-empty-state" :class="dark ? 'mp-empty-dark' : ''">
    <span class="mp-empty-icon">
      <AppIcon :name="icon" :size="24" />
    </span>
    <h3 class="mp-empty-title">{{ title }}</h3>
    <p v-if="description" class="mp-empty-desc">{{ description }}</p>
    <NuxtLink v-if="actionTo && actionLabel" :to="actionTo" class="mp-btn mp-btn-primary">{{ actionLabel }}</NuxtLink>
    <button v-else-if="actionLabel" class="mp-btn mp-btn-primary" @click="emit('action')">{{ actionLabel }}</button>
    <slot />
  </div>
</template>

<style scoped>
.mp-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  text-align: center;
}
.mp-empty-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: 1px solid rgba(255, 140, 0, 0.3);
  background: rgba(255, 140, 0, 0.1);
  color: var(--rust);
  clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.2);
}
.mp-empty-dark .mp-empty-icon {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--silver);
}
.mp-empty-title {
  margin-top: 20px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 20px;
  font-weight: 600;
  color: var(--silver);
  letter-spacing: 0.05em;
}
.mp-empty-dark .mp-empty-title {
  color: #ffffff;
}
.mp-empty-desc {
  margin-top: 8px;
  max-width: 400px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: var(--silver-dim);
}
.mp-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  padding: 10px 20px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
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
.mp-btn:hover {
  animation: mp-glitch 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.4);
}
@keyframes mp-glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(1px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
}
</style>
