<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false
})

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      { 'btn-block': block, 'btn-loading': loading }
    ]"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner" aria-hidden="true" />
    <span :class="{ 'opacity-0': loading }" class="btn-content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  user-select: none;
  position: relative;
  text-decoration: none;
  border: 1px solid transparent;
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* Sizes */
.btn-sm {
  padding: 6px 12px;
  font-size: var(--font-size-sm);
  height: 36px;
}

.btn-md {
  padding: 10px 18px;
  font-size: var(--font-size-base);
  height: 44px;
}

.btn-lg {
  padding: 14px 24px;
  font-size: var(--font-size-md);
  height: 52px;
}

.btn-block {
  width: 100%;
}

/* Variants */
.btn-primary {
  background-color: var(--color-primary-700);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-800);
}

.btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-surface-subtle);
  border-color: var(--color-border-dark);
}

.btn-danger {
  background-color: var(--color-danger);
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #931c26;
}

.btn-success {
  background-color: var(--color-success);
  color: #ffffff;
}

.btn-success:hover:not(:disabled) {
  background-color: #11683b;
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-primary-700);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--color-primary-100);
}

/* Loading Spinner */
.spinner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.opacity-0 {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

