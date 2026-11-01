<script setup lang="ts">
interface Props {
  isOpen: boolean
  title?: string
  maxWidth?: string
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: '540px',
  closable: true
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

function handleBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget && props.closable) {
    emit('close')
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.isOpen && props.closable) {
    emit('close')
  }
}

watch(() => props.isOpen, (open) => {
  if (process.client) {
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }
})

onUnmounted(() => {
  if (process.client) {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        @click="handleBackdrop"
      >
        <div
          class="modal-container"
          :style="{ maxWidth: maxWidth }"
          @click.stop
        >
          <div v-if="title || closable" class="modal-header">
            <h3 v-if="title" class="modal-title">{{ title }}</h3>
            <button
              v-if="closable"
              type="button"
              class="modal-close"
              aria-label="Tutup modal"
              @click="$emit('close')"
            >
              ✕
            </button>
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(18, 48, 71, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: 1000;
}

.modal-container {
  width: 100%;
  background-color: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background-color: var(--color-surface-subtle);
  color: var(--color-text);
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1 1 auto;
}

.modal-footer {
  padding: var(--space-4) var(--space-6);
  background-color: var(--color-surface-subtle);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
}

/* Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.96) translateY(8px);
}
</style>

