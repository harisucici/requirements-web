<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({ title: 'request/room — good tools, built to survive' })

// 滚动触发动画
const howItWorks = ref<HTMLElement>()
const fieldReports = ref<HTMLElement>()
const workshopCta = ref<HTMLElement>()

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
      }
    })
  }, { threshold: 0.1 })

  if (howItWorks.value) observer.observe(howItWorks.value)
  if (fieldReports.value) observer.observe(fieldReports.value)
  if (workshopCta.value) observer.observe(workshopCta.value)
})

const tools = [
  { id: '01', title: 'JSON Schema Validator', category: 'DATA & DIAGNOSTICS', icon: 'file', quote: 'The violation paths saved me hours of debugging.', stars: '★★★★★', type: 'schema', lines: ['{', '  "status": "validated",', '  "errors": 0,', '  "ready": true', '}'] },
  { id: '02', title: 'Invoice Sequence Tracker', category: 'OPERATIONS & LOGISTICS', icon: 'chart', quote: 'Perfect for quarterly VAT checks and CSV exports.', stars: '★★★★☆', type: 'chart', lines: [] },
  { id: '03', title: 'Text Counter Pro', category: 'WORDS & COMMUNICATION', icon: 'edit', quote: 'Words, characters, reading time — all in one glance.', stars: '★★★★☆', type: 'counter', lines: [] },
]
</script>

<template>
  <div class="workshop-home">
    <section class="waste-hero" aria-labelledby="hero-title">
      <div class="hero-photo" aria-hidden="true"></div>
      <div class="hero-topline"><span><i class="signal-dot"></i> SECTOR 07 / WORKSHOP ONLINE</span><span>FREQ. 87.7 MHz &nbsp; / &nbsp; CH. 024</span></div>
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="issue-label">SMALL TOOLS. BIG DIFFERENCE.</p>
          <h1 id="hero-title">THE WORLD<br />IS A MESS.<br /><span>YOUR TOOLS<br />DON’T HAVE TO BE.</span></h1>
          <p class="hero-description">A little less friction. A little more function.<br />Tell us what you need. We’ll turn it into a focused<br class="desktop-break" /> web tool — built in 24 hours.</p>
          <div class="hero-actions"><NuxtLink to="/request" class="btn btn-primary">PUT US TO WORK <span aria-hidden="true">↗</span></NuxtLink><a href="#how-it-works" class="text-link">HOW IT WORKS <span aria-hidden="true">↓</span></a></div>
          <p class="hero-note">NO ACCOUNT NEEDED. NO LONG-WINDED BRIEFS.</p>
        </div>
        <div class="dispatch-unit">
          <div class="unit-cap"><span>R/R INDUSTRIES</span><span>MODEL Nº 024</span></div>
          <div class="gauge-row"><div class="pressure-gauge" aria-label="Delivery target 24 hours"><div class="gauge-ticks"></div><span class="gauge-label">TURNAROUND</span><strong>24<span>HRS</span></strong><div class="gauge-needle"></div><span class="gauge-bottom">BUILT FOR THE EVERYDAY</span></div><div class="unit-stamp">HAND<br />BUILT<span>✦</span><small>HUMAN<br />OPERATED</small></div></div>
          <div class="terminal-bezel">
            <div class="terminal-screen">
              <div class="terminal-top"><span>LIVE DISPATCH</span><span>● CONNECTED</span></div>
              <p class="terminal-code">&gt; OPEN WORK ORDER_</p><h2>CSV CLEANER</h2><p class="terminal-id">REF: RR-024 / EXAMPLE REQUEST</p>
              <ol class="dispatch-steps"><li><span>✓</span><div>REQUEST RECEIVED<small>Your brief is in the queue.</small></div><b>01</b></li><li><span>✓</span><div>QUOTE APPROVED<small>Fixed price. $15. No surprises.</small></div><b>02</b></li><li class="current"><span>›</span><div>ON THE WORKBENCH<small>A clean link is on its way.</small></div><b>03</b></li></ol>
              <div class="terminal-bottom">[ WORK IN PROGRESS ]<span class="terminal-cursor">▌</span></div>
            </div>
          </div>
          <div class="unit-bottom"><span><i class="signal-dot"></i> POWER / ON</span><span class="vent-slots" aria-hidden="true">▥▥▥▥▥</span><span>REV. 2.4</span></div>
        </div>
      </div>
      <div class="hero-bottomline"><span>RESOURCEFUL BY NATURE. RELIABLE BY DESIGN.</span><span>SCROLL TO EXPLORE ↓</span></div>
      <a class="photo-credit" href="https://loreph.it/portfolio-item/219/" target="_blank" rel="noopener noreferrer">Factory photography / Loreph ↗</a>
    </section>

    <div class="workshop-guarantees"><span class="guarantee-intro">BUILT ON TRUST.</span><span><AppIcon name="shield" :size="18" /> SECURE PAYMENT</span><span><AppIcon name="refund" :size="18" /> 30-DAY REFUND</span><span><AppIcon name="refresh" :size="18" /> FREE REVISIONS</span><span class="guarantee-mark" aria-hidden="true">✦</span></div>

    <section id="how-it-works" ref="howItWorks" class="process-section scroll-reveal">
      <div class="section-intro"><p class="eyebrow">01 / THE PROCESS</p><h2>LESS RED TAPE.<br />MORE GETTING IT DONE.</h2><p>From a rough idea to a working tool.<br />Three steps. No complicated machinery.</p></div>
      <div class="process-card"><span class="process-number">01</span><AppIcon name="edit" :size="26" /><h3>Send the signal.</h3><p>Describe the little thing slowing you down. A sentence is a good start.</p><span class="process-detail">YOU BRING THE PROBLEM.</span></div>
      <div class="process-card"><span class="process-number">02</span><AppIcon name="file" :size="26" /><h3>Get a clear quote.</h3><p>We review your request and send a fixed price. You decide when to go.</p><span class="process-detail">NO SURPRISES IN THE FINE PRINT.</span></div>
      <div class="process-card"><span class="process-number">03</span><AppIcon name="board" :size="26" /><h3>Put it to use.</h3><p>We build your tool in 24 hours. Follow every step and get a link when it’s ready.</p><span class="process-detail">MADE TO WORK. READY TO GO.</span></div>
    </section>

    <section id="field-reports" ref="fieldReports" class="reports-section scroll-reveal">
      <div class="reports-heading"><div><p class="eyebrow">02 / FIELD-TESTED EQUIPMENT</p><h2>FRESH OFF THE WORKBENCH.</h2></div><span class="catalog-note">SMALL BUILDS.<br />REAL-WORLD DIFFERENCE.</span></div>
      <div class="tool-grid"><article v-for="tool in tools" :key="tool.id" class="tool-card"><div class="tool-preview" :class="tool.type"><div class="preview-caption"><span>R/R — {{ tool.id }}</span><AppIcon :name="tool.icon" :size="17" /></div><pre v-if="tool.type === 'schema'">{{ tool.lines.join('\n') }}</pre><div v-else-if="tool.type === 'chart'" class="mini-chart" aria-label="Invoice bar chart illustration"><i v-for="(height, index) in [30, 48, 37, 68, 55, 81, 95, 76]" :key="index" :style="{ height: height + '%' }"></i></div><div v-else class="counter-preview"><strong>1,284<span>WORDS COUNTED</span></strong><div><span>7,602<small>CHARACTERS</small></span><span>6 MIN<small>READING TIME</small></span></div></div><span class="preview-bottom">UTILITY SERIES / {{ tool.category }}</span></div><div class="tool-card-copy"><p class="tool-category">{{ tool.category }}</p><h3>{{ tool.title }}</h3><p class="tool-quote">“{{ tool.quote }}”</p><div class="tool-rating"><span>{{ tool.stars }}</span><span>FROM THE FIELD</span></div></div></article></div>
    </section>

    <section ref="workshopCta" class="workshop-cta scroll-reveal"><div class="cta-emblem" aria-hidden="true"><span>⚙</span></div><div><p class="eyebrow">YOUR NEXT GOOD IDEA STARTS HERE.</p><h2>LET’S MAKE SOMETHING USEFUL.</h2><p>One sentence. One small tool. One less thing in your way.</p></div><NuxtLink to="/request" class="btn btn-primary">START A REQUEST <span aria-hidden="true">↗</span></NuxtLink></section>
  </div>
</template>
