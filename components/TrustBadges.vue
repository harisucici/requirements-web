<template>
  <div class="mp-trust-badges">
    <span class="mp-trust-badge"><AppIcon name="shield" :size="16" /> Secure payment</span>
    <span class="mp-trust-badge"><AppIcon name="refund" :size="16" /> 30-day refund</span>
    <span class="mp-trust-badge"><AppIcon name="refresh" :size="16" /> Free revisions</span>
  </div>
</template>

<style scoped>
.mp-trust-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px 0;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  color: var(--silver-dim);
}
.mp-trust-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mp-trust-badge svg {
  color: var(--rust);
  filter: drop-shadow(0 0 4px rgba(255, 140, 0, 0.4));
}
</style>
