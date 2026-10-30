<script setup lang="ts">
// R-1704 / NF-C3: three categories; analytics & marketing scripts must not load before consent.
const { bannerVisible, save } = useCookieConsent()
const showDetails = ref(false)
const analytics = ref(false)
const marketing = ref(false)
</script>

<template>
  <Transition name="consent-slide">
    <div
      v-if="bannerVisible"
      class="cookie-consent-banner"
      role="region"
      aria-label="Privacy controls"
    >
      <div class="consent-container">
        <!-- 顶部状态栏 -->
        <div class="consent-header">
          <div class="status-indicator">
            <i class="status-dot"></i>
            <span>PRIVACY PROTOCOL</span>
          </div>
          <span class="protocol-id">REF: CCPA-2024 / GDPR-EU</span>
        </div>

        <!-- 主内容区 -->
        <div class="consent-body">
          <div class="consent-copy">
            <p class="consent-intro">
              <strong>DATA TRANSMISSION LOG:</strong> This facility deploys cookies for three functions —
              <em>essential operations</em> (always active), <em>usage analytics</em> (tracking), and
              <em>campaign metrics</em> (marketing). No signal fires without your authorization.
              Review the full <NuxtLink to="/cookies" class="consent-link">Privacy Directive ↗</NuxtLink>.
            </p>

            <div v-if="showDetails" class="consent-options">
              <label class="option-row">
                <input type="checkbox" checked disabled class="option-toggle" />
                <div class="option-label">
                  <strong>ESSENTIAL SYSTEMS</strong>
                  <small>Required for basic operation. Cannot be disabled.</small>
                </div>
                <span class="option-status status-active">LOCKED ON</span>
              </label>

              <label class="option-row">
                <input v-model="analytics" type="checkbox" class="option-toggle" />
                <div class="option-label">
                  <strong>ANALYTICS SUITE</strong>
                  <small>Traffic patterns and usage telemetry.</small>
                </div>
                <span class="option-status" :class="{ 'status-active': analytics }">
                  {{ analytics ? 'ENGAGED' : 'STANDBY' }}
                </span>
              </label>

              <label class="option-row">
                <input v-model="marketing" type="checkbox" class="option-toggle" />
                <div class="option-label">
                  <strong>MARKETING BEACON</strong>
                  <small>Campaign tracking and conversion metrics.</small>
                </div>
                <span class="option-status" :class="{ 'status-active': marketing }">
                  {{ marketing ? 'ENGAGED' : 'STANDBY' }}
                </span>
              </label>
            </div>
          </div>

          <!-- 控制按钮组 -->
          <div class="consent-controls">
            <button class="btn-secondary" @click="showDetails = !showDetails">
              <span class="btn-icon">{{ showDetails ? '▼' : '▶' }}</span>
              {{ showDetails ? 'Collapse' : 'Configure' }}
            </button>
            <button class="btn-reject" @click="save(false, false)">
              Reject All
            </button>
            <button class="btn-primary" @click="save(showDetails ? analytics : true, showDetails ? marketing : true)">
              {{ showDetails ? 'Authorize' : 'Accept All' }}
              <span class="btn-icon">↗</span>
            </button>
          </div>
        </div>

        <!-- 底部装饰 -->
        <div class="consent-footer">
          <span class="footer-rivet">●</span>
          <span>ENCRYPTION: AES-256</span>
          <span class="footer-divider">|</span>
          <span>COMPLIANCE: ACTIVE</span>
          <span class="footer-divider">|</span>
          <span>REV. 2.4.1</span>
          <span class="footer-rivet">●</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 入场动画 */
.consent-slide-enter-active,
.consent-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}
.consent-slide-enter-from,
.consent-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.cookie-consent-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 95;
  background: linear-gradient(180deg, #2a2d22 0%, #1c1e19 100%);
  border-top: 3px solid #8b784a;
  box-shadow:
    inset 0 1px 0 rgba(216, 174, 89, 0.15),
    0 -8px 24px rgba(0, 0, 0, 0.6);
  font-family: 'Barlow', system-ui, sans-serif;
  color: #e6deca;
}

.consent-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 顶部状态栏 */
.consent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 10px;
  border-bottom: 1px solid rgba(139, 120, 74, 0.3);
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d8ae59;
  font-weight: 600;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #9bb777;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(155, 183, 119, 0.6);
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.protocol-id {
  color: #b3b09d;
  font-size: 9px;
}

/* 主体内容 */
.consent-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
}

@media (min-width: 768px) {
  .consent-body {
    flex-direction: row;
    align-items: flex-start;
    gap: 32px;
  }
}

.consent-copy {
  flex: 1;
}

.consent-intro {
  font-size: 13px;
  line-height: 1.7;
  color: #c0c1aa;
  margin: 0;
}

.consent-intro strong {
  color: #d8ae59;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.consent-intro em {
  color: #e6deca;
  font-style: normal;
  font-weight: 500;
}

.consent-link {
  color: #d8ae59;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.2s;
}

.consent-link:hover {
  color: #ebcc89;
}

/* 选项面板 */
.consent-options {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(28, 30, 25, 0.6);
  border: 1px solid #474a38;
  border-left: 3px solid #54563e;
  border-radius: 2px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.option-row:hover {
  border-left-color: #d8ae59;
  background: rgba(41, 43, 34, 0.8);
}

.option-toggle {
  width: 16px;
  height: 16px;
  accent-color: #d8ae59;
  cursor: pointer;
  flex-shrink: 0;
}

.option-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.option-label {
  flex: 1;
  min-width: 0;
}

.option-label strong {
  display: block;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #e6deca;
  margin-bottom: 2px;
}

.option-label small {
  display: block;
  font-size: 11px;
  color: #b3b09d;
  line-height: 1.4;
}

.option-status {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #909580;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #474a38;
  border-radius: 2px;
  white-space: nowrap;
}

.option-status.status-active {
  color: #9bb777;
  border-color: #9bb777;
  box-shadow: 0 0 8px rgba(155, 183, 119, 0.2);
}

/* 控制按钮 */
.consent-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

@media (min-width: 768px) {
  .consent-controls {
    flex-direction: column;
    align-items: stretch;
    min-width: 180px;
  }
}

.btn-secondary,
.btn-reject,
.btn-primary {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 12px 18px;
  border: 1px solid;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.btn-icon {
  font-size: 10px;
  opacity: 0.7;
}

.btn-secondary {
  background: transparent;
  border-color: #54563e;
  color: #b3b09d;
}

.btn-secondary:hover {
  border-color: #8b784a;
  color: #e6deca;
  background: rgba(139, 120, 74, 0.08);
}

.btn-reject {
  background: rgba(0, 0, 0, 0.3);
  border-color: #54563e;
  color: #b3b09d;
}

.btn-reject:hover {
  border-color: #ae843b;
  color: #d8ae59;
  background: rgba(174, 132, 59, 0.1);
}

.btn-primary {
  background: linear-gradient(115deg, #e3bc6e, #c69e50);
  border-color: #f0d38d;
  color: #202317;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 2px 0 rgba(0, 0, 0, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(115deg, #ebcc89, #d8ae59);
  color: #161b12;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 3px 0 rgba(0, 0, 0, 0.3),
    0 0 12px rgba(216, 174, 89, 0.3);
}

/* 底部装饰 */
.consent-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 10px 0 14px;
  border-top: 1px solid rgba(139, 120, 74, 0.2);
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.1em;
  color: #909580;
  text-transform: uppercase;
}

.footer-rivet {
  color: #54563e;
  font-size: 10px;
}

.footer-divider {
  color: #474a38;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .consent-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .consent-controls {
    flex-direction: column;
  }

  .btn-secondary,
  .btn-reject,
  .btn-primary {
    width: 100%;
  }

  .consent-footer {
    flex-wrap: wrap;
    gap: 8px;
  }

  .footer-divider {
    display: none;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .status-dot {
    animation: none;
  }

  .consent-slide-enter-active,
  .consent-slide-leave-active {
    transition: none;
  }
}
</style>
