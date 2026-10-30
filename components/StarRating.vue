<script setup lang="ts">
const props = defineProps<{ modelValue: number; readonly?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function select(star: number) {
  if (props.readonly) return
  emit('update:modelValue', star)
}

function onKeydown(e: KeyboardEvent) {
  if (props.readonly) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault()
    emit('update:modelValue', Math.min(5, props.modelValue + 1))
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault()
    emit('update:modelValue', Math.max(0, props.modelValue - 1))
  }
}
</script>

<template>
  <div
    class="mp-star-rating"
    role="radiogroup"
    aria-label="Rating"
    @keydown="onKeydown"
  >
    <button
      v-for="star in 5" :key="star"
      type="button"
      :aria-label="`${star} star${star > 1 ? 's' : ''}`"
      :aria-checked="star === modelValue"
      role="radio"
      :disabled="readonly"
      class="mp-star-btn"
      :class="{ 'mp-star-active': star <= modelValue }"
      @click="select(star)"
    >★</button>
  </div>
</template>

<style scoped>
.mp-star-rating {
  display: flex;
  gap: 4px;
}
.mp-star-btn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 24px;
  background: transparent;
  border: 1px solid transparent;
  color: rgba(255, 140, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}
.mp-star-btn:hover:not(:disabled) {
  color: rgba(255, 140, 0, 0.5);
  border-color: rgba(255, 140, 0, 0.3);
}
.mp-star-active {
  color: var(--rust);
  text-shadow: 0 0 10px rgba(255, 140, 0, 0.6);
  filter: drop-shadow(0 0 4px rgba(255, 140, 0, 0.4));
}
.mp-star-btn:disabled {
  cursor: default;
}
</style>
