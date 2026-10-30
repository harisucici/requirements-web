<script setup lang="ts">
const props = defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

function select(val: number) {
  emit('update:modelValue', val)
}
</script>

<template>
  <div class="mp-nps">
    <div class="mp-nps-labels">
      <span>Not likely</span>
      <span>Very likely</span>
    </div>
    <div class="mp-nps-buttons" role="radiogroup" aria-label="How likely are you to recommend us?">
      <button
        v-for="n in 11" :key="n - 1"
        type="button"
        :aria-label="`${n - 1} out of 10`"
        :aria-checked="modelValue === n - 1"
        role="radio"
        class="mp-nps-btn"
        :class="{
          'mp-nps-selected': modelValue === n - 1,
          'mp-nps-detractor': modelValue === n - 1 && n - 1 <= 6,
          'mp-nps-passive': modelValue === n - 1 && n - 1 > 6 && n - 1 <= 8,
          'mp-nps-promoter': modelValue === n - 1 && n - 1 > 8
        }"
        @click="select(n - 1)"
      >{{ n - 1 }}</button>
    </div>
  </div>
</template>

<style scoped>
.mp-nps {
  font-family: 'Share Tech Mono', monospace;
}
.mp-nps-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--silver-dim);
}
.mp-nps-buttons {
  display: flex;
  gap: 4px;
}
.mp-nps-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 14px;
  font-weight: 600;
  background: var(--iron);
  border: 1px solid rgba(255, 140, 0, 0.3);
  color: var(--silver-dim);
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.mp-nps-btn:hover {
  border-color: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}
.mp-nps-selected.mp-nps-detractor {
  background: rgba(220, 38, 38, 0.3);
  color: #ff6b6b;
  border-color: rgba(220, 38, 38, 0.6);
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
}
.mp-nps-selected.mp-nps-passive {
  background: rgba(255, 140, 0, 0.3);
  color: var(--rust);
  border-color: rgba(255, 140, 0, 0.6);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.4);
}
.mp-nps-selected.mp-nps-promoter {
  background: rgba(255, 140, 0, 0.5);
  color: var(--iron);
  border-color: var(--rust);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.5);
}
</style>
