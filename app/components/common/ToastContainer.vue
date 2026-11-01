<script setup lang="ts">
const { toasts, removeToast } = useNotification()
</script>

<template>
  <Teleport to="body">
    <div class="toast-viewport" aria-live="polite">
      <TransitionGroup name="toast-slide">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast-card', `toast-${toast.type}`]"
          role="alert"
        >
          <div class="toast-icon">
            <span v-if="toast.type === 'success'">✓</span>
            <span v-else-if="toast.type === 'error'">✕</span>
            <span v-else-if="toast.type === 'warning'">⚠</span>
            <span v-else>ℹ</span>
          </div>

          <div class="toast-content">
            <h4 v-if="toast.title" class="toast-title">{{ toast.title }}</h4>
            <p class="toast-message">{{ toast.message }}</p>
          </div>

          <button
            type="button"
            class="toast-close"
            aria-label="Tutup notifikasi"
            @click="removeToast(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-viewport {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 400px;
  width: calc(100% - var(--space-8));
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border-left: 4px solid var(--color-primary-700);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1 1 auto;
}

.toast-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2px;
}

.toast-message {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: var(--line-height-normal);
}

.toast-close {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  padding: 4px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  flex-shrink: 0;
}

.toast-close:hover {
  color: var(--color-text);
}

/* Status variants */
.toast-success {
  border-left-color: var(--color-success);
}
.toast-success .toast-icon {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.toast-error {
  border-left-color: var(--color-danger);
}
.toast-error .toast-icon {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
}

.toast-warning {
  border-left-color: var(--color-warning);
}
.toast-warning .toast-icon {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.toast-info {
  border-left-color: var(--color-info);
}
.toast-info .toast-icon {
  background-color: var(--color-info-bg);
  color: var(--color-info);
}

/* Transitions */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.25s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>

